import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/theme.css'
import '../styles/landing.css'
import { fetchSession, requestLoginUrl } from '../lib/api'

export default function Home() {
  const navigate = useNavigate()
  const [statusMessage, setStatusMessage] = useState('Checking your session...')
  const [isChecking, setIsChecking] = useState(true)
  const [loginPending, setLoginPending] = useState(false)

  useEffect(() => {
    let active = true

    const checkSession = async () => {
      try {
        const session = await fetchSession()
        if (!active) return
        if (session.loggedIn) {
          navigate('/dashboard', { replace: true })
          return
        }
        if (session.expired) {
          setStatusMessage('Your Spotify session expired. Log back in to refresh it.')
        } else if (session.missingScope) {
          setStatusMessage('We need additional permissions. Log in again to continue.')
        } else {
          setStatusMessage('Connect your Spotify account to explore your stats.')
        }
      } catch (err) {
        if (!active) return
        console.error('Failed to load session', err)
        setStatusMessage('Could not verify session. Try logging in again.')
      } finally {
        if (active) {
          setIsChecking(false)
        }
      }
    }

    void checkSession()

    return () => {
      active = false
    }
  }, [navigate])

  const handleLogin = async () => {
    try {
      setLoginPending(true)
      setStatusMessage('Redirecting you to Spotify...')
      const url = await requestLoginUrl()
      window.location.href = url
    } catch (err) {
      console.error('Failed to start login', err)
      setStatusMessage('Something went wrong starting the login. Please try again.')
    } finally {
      setLoginPending(false)
    }
  }

  const loginDisabled = loginPending || isChecking

  const placeholderImage = 'https://via.placeholder.com/96/1db954/ffffff?text=%F0%9F%8E%B6'

  const previewArtists = [
    { name: 'Artist Name', sub: 'Genres will appear here' },
    { name: 'Artist Name', sub: 'Genres will appear here' },
    { name: 'Artist Name', sub: 'Genres will appear here' },
  ]

  const previewTracks = [
    { title: 'Track Name', sub: 'Artist • Album will display here' },
    { title: 'Track Name', sub: 'Artist • Album will display here' },
    { title: 'Track Name', sub: 'Artist • Album will display here' },
  ]

  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="brand-mark">
          <span className="brand-icon" aria-hidden="true">SS</span>
          <span className="brand-name">Spotify Stats</span>
        </div>
        <button className="nav-login" onClick={handleLogin} disabled={loginDisabled}>
          {loginPending ? 'Opening Spotify…' : 'Log in with Spotify'}
        </button>
      </nav>

      <main className="landing-main">
        <section className="landing-hero">
          <h1>Your listening history, organized.</h1>
          <p className="hero-lede">
            Track the artists and songs you repeat most over the past 4 weeks, 6 months, or the last year.
            Sign in with Spotify and we&apos;ll build your personalized dashboard.
          </p>
          <div className="landing-actions">
            <button onClick={handleLogin} disabled={loginDisabled}>
              {loginPending ? 'Opening Spotify…' : 'Get started'}
            </button>
            <p className="landing-status">{statusMessage}</p>
          </div>
          <ul className="landing-feature-list">
            <li>See top artists and tracks across multiple time ranges.</li>
            <li>Spot trends in what you&apos;ve been looping lately.</li>
            <li>Prepare to share your highlights with friends (coming soon).</li>
          </ul>
        </section>

        <aside className="landing-preview" aria-hidden="true">
          <div className="preview-card">
            <h2>Top Artists</h2>
            <div className="preview-pills">
              <span className="preview-pill">last 4 weeks </span>
              <span className="preview-pill">last 6 months</span>
              <span className="preview-pill">last 12 months</span>
            </div>
            <ul className="preview-list">
              {previewArtists.map(({ name, sub }, index) => (
                <li key={`${name}-${index}`}>
                  <span className="preview-rank">{index + 1}</span>
                  <div className="preview-art" aria-hidden="true">
                    <img src={placeholderImage} alt="" />
                  </div>
                  <div className="preview-meta">
                    <span className="preview-text">{name}</span>
                    <span className="preview-sub">{sub}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="preview-card">
            <h2>Top Tracks</h2>
            <ul className="preview-list">
              {previewTracks.map(({ title, sub }, index) => (
                <li key={`${title}-${index}`}>
                  <span className="preview-rank">{index + 1}</span>
                  <div className="preview-art" aria-hidden="true">
                    <img src={placeholderImage} alt="" />
                  </div>
                  <div className="preview-meta">
                    <span className="preview-text">{title}</span>
                    <span className="preview-sub">{sub}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </main>

      <footer className="landing-footer">
        <span>Built with the Spotify Web API. No surprises—just your listening habits.</span>
      </footer>
    </div>
  )
}
