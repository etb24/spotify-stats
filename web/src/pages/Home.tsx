import { useState } from 'react'

export default function Home() {
  const [status, setStatus] = useState('')

  async function connectSpotify() {
    setStatus('Opening Spotify login...')
    const res = await fetch('/api/auth/login')
    const { url } = await res.json()
    window.location.href = url // redirect user to Spotify auth page
  }

  async function healthCheck() {
    const r = await fetch('/api/health')
    const j = await r.json()
    setStatus(`Health: ${j.status} (uptime ${j.uptimeSeconds}s)`)
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Spotify Stats MVP</h1>
      <p>{status}</p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={connectSpotify}>Login to Spotify</button>
        <button onClick={healthCheck}>Health</button>
      </div>
      <p style={{ marginTop: 12 }}>
        After approving in Spotify, you’ll be sent back to <code>/auth/callback</code>.
      </p>
    </div>
  )
}
