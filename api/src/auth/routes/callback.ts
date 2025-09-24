import { Router, Request, Response } from 'express';
import axios from 'axios';
import qs from 'qs';

const SPOTIFY_TOKEN = 'https://accounts.spotify.com/api/token';

const router = Router();

/**
 * POST /api/auth/callback
 * Body: { code: string }
 * Uses the pkce_verifier cookie to exchange code to tokens.
 * Sets a signed, httpOnly cookie 'spotify_tokens'.
 */
router.post('/callback', async (req: Request, res: Response) => {
  try {
    const { code } = req.body as { code?: string };
    const verifier = req.cookies?.['pkce_verifier'];
    if (!code || !verifier) {
      return res.status(400).json({ error: 'missing_code_or_verifier' });
    }

    const body = qs.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
      client_id: process.env.SPOTIFY_CLIENT_ID!,
      code_verifier: verifier,
    });

    const tokenRes = await axios.post(SPOTIFY_TOKEN, body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    // store token payload in a signed, httpOnly cookie
    const tokens = {
      ...tokenRes.data,
      obtained_at: Date.now(),
    }; // { access_token, token_type, expires_in, refresh_token?, scope, obtained_at }
    res.cookie('spotify_tokens', tokens, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // set true in prod behind HTTPS
      signed: true,
      maxAge: (tokens.expires_in ?? 3600) * 1000,
    });

    // Clean up the short-lived verifier
    res.clearCookie('pkce_verifier');

    res.json({ ok: true });
  } catch (err: any) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    console.error('Token exchange error:', status, data || err);
    res.status(400).json({ error: 'token_exchange_failed', status, details: data });
  }
});

export default router;