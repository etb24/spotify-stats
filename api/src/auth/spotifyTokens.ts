import axios from 'axios';
import qs from 'qs';
import type { CookieOptions, Request, Response } from 'express';

const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
export const REQUIRED_SCOPES = ['user-top-read'] as const;
const COOKIE_NAME = 'spotify_tokens';
const DEFAULT_EXPIRY_SECONDS = 3600;
const REFRESH_BUFFER_MS = 60 * 1000;

export type SpotifyTokens = {
  access_token?: string;
  token_type?: string;
  scope?: string;
  expires_in?: number;
  refresh_token?: string;
  obtained_at?: number;
};

export type TokenErrorCode =
  | 'missing_tokens'
  | 'missing_scope'
  | 'missing_refresh_token'
  | 'refresh_failed';

export class SpotifyTokenError extends Error {
  constructor(public code: TokenErrorCode, message: string, public cause?: unknown) {
    super(message);
    this.name = 'SpotifyTokenError';
  }
}

const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  signed: true,
};

export function readTokens(req: Request): SpotifyTokens | null {
  const tokens = req.signedCookies?.[COOKIE_NAME];
  if (!tokens || typeof tokens !== 'object') {
    return null;
  }
  return tokens as SpotifyTokens;
}

export function writeTokens(res: Response, tokens: SpotifyTokens): void {
  const payload: SpotifyTokens = {
    ...tokens,
    obtained_at: typeof tokens.obtained_at === 'number' ? tokens.obtained_at : Date.now(),
  };
  const maxAgeMs = (payload.expires_in ?? DEFAULT_EXPIRY_SECONDS) * 1000;
  res.cookie(COOKIE_NAME, payload, { ...cookieOptions, maxAge: maxAgeMs });
}

export function clearTokens(res: Response): void {
  res.clearCookie(COOKIE_NAME, cookieOptions);
}

export function missingRequiredScopes(scope: string | undefined): string[] {
  const granted = new Set((scope || '').split(' ').filter(Boolean));
  return REQUIRED_SCOPES.filter((required) => !granted.has(required));
}

function accessTokenExpiresAt(tokens: SpotifyTokens): number | null {
  if (!tokens.expires_in || !tokens.obtained_at) {
    return null;
  }
  return tokens.obtained_at + tokens.expires_in * 1000;
}

function needsRefresh(tokens: SpotifyTokens, bufferMs = REFRESH_BUFFER_MS): boolean {
  const expiresAt = accessTokenExpiresAt(tokens);
  if (!expiresAt) {
    return true;
  }
  return Date.now() >= expiresAt - bufferMs;
}

export async function refreshAccessToken(tokens: SpotifyTokens): Promise<SpotifyTokens> {
  if (!tokens.refresh_token) {
    throw new SpotifyTokenError('missing_refresh_token', 'No refresh token available');
  }

  if (!process.env.SPOTIFY_CLIENT_ID) {
    throw new SpotifyTokenError('refresh_failed', 'SPOTIFY_CLIENT_ID is not configured');
  }

  try {
    const body = qs.stringify({
      grant_type: 'refresh_token',
      refresh_token: tokens.refresh_token,
      client_id: process.env.SPOTIFY_CLIENT_ID,
    });

    const res = await axios.post(TOKEN_ENDPOINT, body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const refreshed: SpotifyTokens = {
      ...tokens,
      ...res.data,
      refresh_token: res.data.refresh_token ?? tokens.refresh_token,
      obtained_at: Date.now(),
    };

    if (!refreshed.access_token) {
      throw new SpotifyTokenError('refresh_failed', 'Spotify did not return an access token');
    }

    return refreshed;
  } catch (err) {
    if (err instanceof SpotifyTokenError) {
      throw err;
    }
    throw new SpotifyTokenError('refresh_failed', 'Failed to refresh Spotify token', err);
  }
}

export async function ensureAccessToken(
  req: Request,
  res: Response
): Promise<{ accessToken: string; tokens: SpotifyTokens }> {
  const tokens = readTokens(req);
  if (!tokens || !tokens.access_token) {
    throw new SpotifyTokenError('missing_tokens', 'No Spotify tokens found on request');
  }

  const missingScopes = missingRequiredScopes(tokens.scope);
  if (missingScopes.length > 0) {
    throw new SpotifyTokenError(
      'missing_scope',
      `Missing required scopes: ${missingScopes.join(', ')}`
    );
  }

  if (needsRefresh(tokens)) {
    const refreshed = await refreshAccessToken(tokens);
    writeTokens(res, refreshed);
    return { accessToken: refreshed.access_token!, tokens: refreshed };
  }

  return { accessToken: tokens.access_token, tokens };
}
