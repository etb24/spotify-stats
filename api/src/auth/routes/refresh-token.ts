import { Router, Request, Response } from 'express'
import axios from 'axios'
import qs from 'qs'

const SPOTIFY_TOKEN = 'https://accounts.spotify.com/api/token'
const router = Router()

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const tokens = req.signedCookies?.spotify_tokens
    const existingRefresh = tokens?.refresh_token
    if (!existingRefresh) {
      return res.status(400).json({ error: 'missing_refresh_token' })
    }

    const body = qs.stringify({
      grant_type: 'refresh_token',
      refresh_token: existingRefresh,
      client_id: process.env.SPOTIFY_CLIENT_ID!, // PKCE: no client_secret, no Basic auth
    })

    const r = await axios.post(SPOTIFY_TOKEN, body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })

    // Spotify may rotate the refresh token; keep old if none returned
    const updated = {
      ...tokens,
      ...r.data, // access_token, token_type, expires_in, scope, maybe refresh_token
      refresh_token: r.data.refresh_token ?? existingRefresh,
      obtained_at: Date.now(),
    }

    res.cookie('spotify_tokens', updated, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // set true in prod (HTTPS)
      signed: true,
      maxAge: (updated.expires_in ?? 3600) * 1000,
    })

    return res.json({ ok: true, expires_in: updated.expires_in })
  } catch (err: any) {
    console.error('refresh_failed:', err?.response?.status, err?.response?.data || err)
    return res.status(400).json({
      error: 'refresh_failed',
      status: err?.response?.status,
      details: err?.response?.data,
    })
  }
})

export default router