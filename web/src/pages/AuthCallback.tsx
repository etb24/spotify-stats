import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'

export default function AuthCallback() {
  const [params] = useSearchParams()
  const [msg, setMsg] = useState('Finishing login...')
  const code = params.get('code')
  const error = params.get('error')

  useEffect(() => {
    async function finish() {
      if (error) {
        setMsg(`Spotify error: ${error}`)
        return
      }
      if (!code) {
        setMsg('No code found in URL.')
        return
      }
      try {
        const res = await fetch('/api/auth/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // keep cookies
          body: JSON.stringify({ code })
        })
        if (!res.ok) {
          const j = await res.json().catch(() => ({}))
          setMsg(`Login failed: ${j.error ?? res.statusText}`)
          return
        }
        setMsg('Connected! You can go back home and call protected endpoints.')
      } catch (e: any) {
        setMsg(`Network error: ${e?.message ?? e}`)
      }
    }
    finish()
  }, [code, error])

  return (
    <div style={{ padding: 24 }}>
      <h1>Auth callback</h1>
      <p>{msg}</p>
      <p><Link to="/">Return home</Link></p>
    </div>
  )
}
