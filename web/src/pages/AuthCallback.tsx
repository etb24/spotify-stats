import { useEffect, useRef, useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import '../styles/theme.css'
import { fetchSession } from '../lib/api'

type CallbackState = 'working' | 'success' | 'error'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const code = params.get('code')
  const error = params.get('error')
  const [state, setState] = useState<CallbackState>('working')
  const [message, setMessage] = useState('Finishing your Spotify login...')
  const lastHandledCode = useRef<string | null>(null)
  const lastHandledError = useRef<string | null>(null)

  useEffect(() => {
    async function finishLogin() {
      if (error) {
        if (lastHandledError.current === error) return
        lastHandledError.current = error
        setState('error')
        setMessage(`Spotify returned an error: ${error}`)
        return
      }

      if (!code) {
        if (lastHandledCode.current === null) {
          setState('error')
          setMessage('No authorization code found in the URL.')
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
          credentials: 'include',
          body: JSON.stringify({ code }),
        })

        if (!res.ok) {
          const payload = await res.json().catch(() => ({}))
          if (payload.error === 'token_exchange_failed' || payload.error === 'missing_code_or_verifier') {
            try {
              const session = await fetchSession()
              if (session.loggedIn) {
                setState('success')
                setMessage('You are already connected. Redirecting to your dashboard...')
                navigate('/dashboard', { replace: true })
                return
              }
            } catch (sessionErr) {
              console.error('Session lookup after failure failed', sessionErr)
            }
          }
          setState('error')
          setMessage(`Login failed: ${payload.error ?? res.statusText}`)
          return
        }

        setState('success')
        setMessage('Connected! Redirecting to your dashboard...')
        navigate('/dashboard', { replace: true })
      } catch (err) {
        console.error('Callback network error', err)
        const message = err instanceof Error ? err.message : String(err)
        setState('error')
        setMessage(`Network error: ${message}`)
        lastHandledCode.current = null
      }
    }

    void finishLogin()
  }, [code, error, navigate])

  const helperText =
    state === 'success'
      ? 'Hang tight, we are sending you to your dashboard.'
      : 'If this keeps happening, try starting the login from the landing page again.'

  return (
    <div className="page-shell">
      <header className="page-header">
        <h1 className="page-heading">Spotify Auth Callback</h1>
        <p className="page-subtitle">Completing the connection to your Spotify account.</p>
      </header>

      <p className="status-line">
        <strong>Status:</strong> {message}
      </p>

      <div className="button-row">
        <Link className="button-link" to="/">
          Return Home
        </Link>
      </div>

      <p className="helper-text">{helperText}</p>
    </div>
  )
}
