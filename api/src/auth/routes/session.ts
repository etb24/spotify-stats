import { Router, Request, Response } from 'express'
import axios from 'axios'
import { ensureAccessToken, SpotifyTokenError, REQUIRED_SCOPES } from '../spotifyTokens'

const router = Router()

router.get('/session', async (req: Request, res: Response) => {
  let accessToken: string

  try {
    const ensured = await ensureAccessToken(req, res)
    accessToken = ensured.accessToken
  } catch (err) {
    if (err instanceof SpotifyTokenError) {
      if (err.code === 'missing_tokens') {
        return res.json({ loggedIn: false })
      }
      if (err.code === 'missing_scope') {
        return res.json({ loggedIn: false, missingScope: true, requiredScopes: REQUIRED_SCOPES })
      }
      if (err.code === 'missing_refresh_token') {
        return res.json({ loggedIn: false, expired: true })
      }
      console.error('token_refresh_failed:', err.cause ?? err)
      return res.json({ loggedIn: false, error: 'token_refresh_failed' })
    }

    console.error('session_token_failed:', err)
    return res.json({ loggedIn: false, error: 'session_token_failed' })
  }

  try {
    const profile = await axios.get('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    const { display_name, email, id } = profile.data as {
      display_name?: string | null
      email?: string | null
      id?: string
    }

    const account = display_name?.trim() || email?.trim() || id || null

    return res.json({ loggedIn: true, account })
  } catch (err: any) {
    const status = err?.response?.status
    const details = err?.response?.data || err?.message || err
    if (status === 401 || status === 403) {
      return res.json({ loggedIn: false, expired: true })
    }
    console.error('session_profile_failed:', status, details)
    return res.json({ loggedIn: false, error: 'profile_fetch_failed' })
  }
})

export default router
