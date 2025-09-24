import { Router, Request, Response } from 'express';
import { generateCodeVerifier, codeChallengeFromVerifier } from '../pkce';

const SPOTIFY_AUTHORIZE = 'https://accounts.spotify.com/authorize';
const SCOPES = ['user-top-read', 'user-read-recently-played'].join(' ');

const router = Router();

/**
 * GET /api/auth/login
 * Returns { url } with the Spotify authorize URL (PKCE).
 * Stores the code_verifier in an httpOnly cookie for a short time.
 */
router.get('/login', (_req: Request, res: Response) => {
  const verifier = generateCodeVerifier(64);
  const challenge = codeChallengeFromVerifier(verifier);

  res.cookie('pkce_verifier', verifier, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // set true in prod behind HTTPS
    maxAge: 10 * 60 * 1000, // 10 minutes
  });

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID!, // must be set
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI!, // must exactly match dashboard
    code_challenge_method: 'S256',
    code_challenge: challenge,
    scope: SCOPES,
  });

  res.json({ url: `${SPOTIFY_AUTHORIZE}?${params.toString()}` });
});

export default router;