import { Router, Request, Response } from 'express'
import axios from 'axios'

const router = Router()

router.get('/session', async (req: Request, res: Response) => {
  const tokens = req.signedCookies?.spotify_tokens as
    | {
        access_token?: string
        expires_in?: number
        obtained_at?: number
        refresh_token?: string
      }
    | undefined

  if (!tokens?.access_token) {
    return res.json({ loggedIn: false })
  }

  const expiresIn = typeof tokens.expires_in === 'number' ? tokens.expires_in : undefined
  const obtainedAt = typeof tokens.obtained_at === 'number' ? tokens.obtained_at : undefined
  const expiresAt = expiresIn && obtainedAt ? obtainedAt + expiresIn * 1000 : undefined

  if (expiresAt && Date.now() >= expiresAt) {
    return res.json({ loggedIn: false, expired: true })
  }

  try {
    const profile = await axios.get('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
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
