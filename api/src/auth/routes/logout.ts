import { Router, Request, Response } from 'express'
import { clearTokens } from '../spotifyTokens'

const router = Router()

router.post('/logout', (_req: Request, res: Response) => {
  clearTokens(res)
  res.json({ ok: true })
})

export default router
