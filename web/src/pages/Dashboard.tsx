import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/theme.css'
import '../styles/dashboard.css'
import { fetchSession, performLogout, type SessionResponse } from '../lib/api'

type TimeRange = 'short_term' | 'medium_term' | 'long_term'

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  short_term: 'Last 4 Weeks',
  medium_term: 'Last 6 Months',
  long_term: 'Last 12 Months',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [session, setSession] = useState<SessionResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedRange, setSelectedRange] = useState<TimeRange>('short_term')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const ensureSession = async () => {
      try {
        const res = await fetchSession()
        if (!active) return
        if (!res.loggedIn) {
          navigate('/', { replace: true })
          return
        }
        setSession(res)
      } catch (err) {
        if (!active) return
        console.error('Dashboard session check failed', err)
        setError('We could not confirm your session. Please try logging in again.')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void ensureSession()

    return () => {
      active = false
    }
  }, [navigate])

  const handleLogout = async () => {
    try {
      await performLogout()
    } catch (err) {
      console.error('Failed to logout', err)
    } finally {
      navigate('/', { replace: true })
    }
  }

  const handleRangeChange = (range: TimeRange) => {
    setSelectedRange(range)
  }

  const accountLabel = session?.account || 'Spotify listener'

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-kicker">Dashboard</p>
          <h1>Welcome back, {accountLabel}</h1>
          <p className="dashboard-subtitle">
            Choose a time range to explore your top artists and tracks. Fresh insights are coming soon.
          </p>
        </div>
        <button className="logout-button" onClick={handleLogout}>
          Log out
        </button>
      </header>

      <section className="dashboard-controls">
        <h2>Time range</h2>
        <div className="range-buttons">
          {(Object.keys(TIME_RANGE_LABELS) as TimeRange[]).map((range) => (
            <button
              key={range}
              type="button"
              className={range === selectedRange ? 'range-button active' : 'range-button'}
              onClick={() => handleRangeChange(range)}
            >
              {TIME_RANGE_LABELS[range]}
            </button>
          ))}
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="stats-card">
          <header>
            <h2>Top Artists</h2>
            <span className="card-caption">Data for {TIME_RANGE_LABELS[selectedRange]} will appear here.</span>
          </header>
          <div className="empty-state">
            {loading ? 'Loading your artists...' : 'We will list your go-to artists once the data pipeline is wired.'}
          </div>
        </section>

        <section className="stats-card">
          <header>
            <h2>Top Tracks</h2>
            <span className="card-caption">Data for {TIME_RANGE_LABELS[selectedRange]} will appear here.</span>
          </header>
          <div className="empty-state">
            {loading ? 'Loading your tracks...' : 'Hook up the Spotify endpoints to see your most-played songs.'}
          </div>
        </section>
      </div>

      {error ? <p className="dashboard-error">{error}</p> : null}
    </div>
  )
}
