import { Router, Request, Response } from 'express'

const router = Router()

router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('spotify_tokens', {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    signed: true,
  })
  res.json({ ok: true })
})

export default router
