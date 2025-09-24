import { useEffect, useState } from 'react'
import '../styles/theme.css'

type SessionResponse = {
  loggedIn?: boolean
  account?: string | null
  expired?: boolean
  error?: string
}

export default function Home() {
  const [status, setStatus] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const [accountName, setAccountName] = useState<string | null>(null)

  const loadSession = async (opts?: { silent?: boolean }) => {
    try {
      const res = await fetch('/api/auth/session', { credentials: 'include' })
      if (!res.ok) {
        throw new Error(await res.text())
      }
      const data = (await res.json()) as SessionResponse
      const loggedIn = Boolean(data?.loggedIn)
      setIsLoggedIn(loggedIn)
      setAccountName(loggedIn ? data?.account ?? null : null)
      if (loggedIn && data?.account) {
        setStatus(`Connected to ${data.account}.`)
      } else if (!loggedIn && data?.expired) {
        setStatus('Your Spotify session expired. Please log in again.')
      } else if (!loggedIn && !opts?.silent) {
        setStatus('Ready when you are.')
      }
    } catch (err) {
      console.error('Session check failed', err)
      setStatus('Could not determine login state.')
    }
  }

  async function connectSpotify() {
    setStatus('Opening Spotify login...')
    const res = await fetch('/api/auth/login', { credentials: 'include' })
    const { url } = await res.json()
    window.location.href = url // redirect user to Spotify auth page
  }

  async function logoutSpotify() {
    setStatus('Logging out of Spotify...')
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) {
        throw new Error(await res.text())
      }
      setIsLoggedIn(false)
      setAccountName(null)
      setStatus('Logged out of Spotify.')
      void loadSession({ silent: true })
    } catch (err) {
      console.error('Logout failed', err)
      setStatus('Logout failed. Please try again.')
    }
  }

  async function healthCheck() {
    const r = await fetch('/api/health')
    const j = await r.json()
    setStatus(`Health: ${j.status} (uptime ${j.uptimeSeconds}s)`)
  }

  useEffect(() => {
    void loadSession()
  }, [])

  const helper = isLoggedIn ? (
    <>Connected to <strong>{accountName ?? 'Spotify'}</strong>.</>
  ) : (
    <>After approving in Spotify, you will be sent back to <code>/auth/callback</code>.</>
  )

  const displayStatus = status || (isLoggedIn ? 'Connected and ready.' : 'Ready when you are.')

  return (
    <div className="page-shell">
      <header className="page-header">
        <h1 className="page-heading">Spotify Stats MVP</h1>
        <p className="page-subtitle">Authenticate with Spotify and keep an eye on your service health.</p>
      </header>

      <p className="status-line">
        <strong>Status:</strong> {displayStatus}
      </p>

      <div className="button-row">
        {isLoggedIn === true ? (
          <button onClick={logoutSpotify}>Logout</button>
        ) : (
          <button onClick={connectSpotify}>Login to Spotify</button>
        )}
        <button className="secondary" onClick={healthCheck}>Health Check</button>
      </div>

      <p className="helper-text">{helper}</p>
    </div>
  )
}
