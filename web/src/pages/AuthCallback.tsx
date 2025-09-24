import { useEffect, useRef, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import '../styles/theme.css'

type SessionResponse = {
  loggedIn?: boolean
  account?: string | null
}

export default function AuthCallback() {
  const [params] = useSearchParams()
  const [msg, setMsg] = useState('Finishing login...')
  const code = params.get('code')
  const error = params.get('error')
  const lastHandledCode = useRef<string | null>(null)
  const lastHandledError = useRef<string | null>(null)

  useEffect(() => {
    async function finish() {
      if (error) {
        if (lastHandledError.current === error) return
        lastHandledError.current = error
        setMsg(`Spotify error: ${error}`)
        return
      }
      if (!code) {
        if (lastHandledCode.current === null) {
          setMsg('No code found in URL.')
        }
        return
      }
      if (lastHandledCode.current === code) {
        return
      }
      lastHandledCode.current = code
      try {
        const res = await fetch('/api/auth/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // keep cookies
          body: JSON.stringify({ code })
        })
        if (!res.ok) {
          const j = await res.json().catch(() => ({}))
          if (j.error === 'token_exchange_failed' || j.error === 'missing_code_or_verifier') {
            const sessionRes = await fetch('/api/auth/session', { credentials: 'include' })
            if (sessionRes.ok) {
              const session = (await sessionRes.json()) as SessionResponse
              if (session?.loggedIn) {
                setMsg('Connected! You can go back home and call protected endpoints.')
                return
              }
            }
          }
          setMsg(`Login failed: ${j.error ?? res.statusText}`)
          return
        }
        setMsg('Connected! You can go back home and call protected endpoints.')
      } catch (e: any) {
        setMsg(`Network error: ${e?.message ?? e}`)
        lastHandledCode.current = null
      }
    }
    finish()
  }, [code, error])

  const helperText = msg.startsWith('Connected')
    ? 'You can close this tab or explore the app.'
    : 'If this keeps happening, try starting the login again from the homepage.'

  return (
    <div className="page-shell">
      <header className="page-header">
        <h1 className="page-heading">Spotify Auth Callback</h1>
        <p className="page-subtitle">We are talking to Spotify to finish your login.</p>
      </header>

      <p className="status-line">
        <strong>Status:</strong> {msg}
      </p>

      <div className="button-row">
        <Link className="button-link" to="/">Return Home</Link>
      </div>

      <p className="helper-text">{helperText}</p>
    </div>
  )
}
