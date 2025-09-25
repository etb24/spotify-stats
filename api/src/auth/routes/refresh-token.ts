import { Router, Request, Response } from 'express'
import {
  readTokens,
  writeTokens,
  refreshAccessToken,
  SpotifyTokenError,
  missingRequiredScopes,
  REQUIRED_SCOPES,
} from '../spotifyTokens'

const router = Router()

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const tokens = readTokens(req)
    if (!tokens) {
      return res.status(400).json({ error: 'missing_tokens' })
    }

    const updated = await refreshAccessToken(tokens)
    const missingScopes = missingRequiredScopes(updated.scope)
    if (missingScopes.length > 0) {
      return res.status(400).json({
        error: 'missing_scope',
        required: REQUIRED_SCOPES,
        missing: missingScopes,
      })
    }

    writeTokens(res, updated)
    return res.json({ ok: true, expires_in: updated.expires_in })
  } catch (err) {
    if (err instanceof SpotifyTokenError) {
      if (err.code === 'missing_refresh_token') {
        return res.status(400).json({ error: err.code })
      }
      console.error('refresh_failed:', err.cause ?? err)
      return res.status(400).json({ error: err.code })
    }

    console.error('refresh_failed:', err)
    return res.status(400).json({ error: 'refresh_failed' })
  }
})

export default router
