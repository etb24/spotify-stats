import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/theme.css'
import '../styles/dashboard.css'
import {
  fetchSession,
  performLogout,
  fetchTopArtists,
  fetchTopTracks,
  type SessionResponse,
  type TimeRange,
  type SpotifyArtistItem,
  type SpotifyTrackItem,
} from '../lib/api'

type ArtistRow = {
  id: string
  name: string
  image: string | null
  genres: string[]
}

type TrackRow = {
  id: string
  name: string
  image: string | null
  artists: string[]
  album: string | null
}

type DataState<T> = {
  items: T[]
  loading: boolean
  error: string | null
}

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  short_term: 'Last 4 Weeks',
  medium_term: 'Last 6 Months',
  long_term: 'Last 12 Months',
}

const createInitialState = <T,>(): DataState<T> => ({
  items: [],
  loading: true,
  error: null,
})

export default function Dashboard() {
  const navigate = useNavigate()
  const [session, setSession] = useState<SessionResponse | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [selectedRange, setSelectedRange] = useState<TimeRange>('short_term')
  const [artistsState, setArtistsState] = useState<DataState<ArtistRow>>(() => createInitialState<ArtistRow>())
  const [tracksState, setTracksState] = useState<DataState<TrackRow>>(() => createInitialState<TrackRow>())
  const [sessionError, setSessionError] = useState<string | null>(null)

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
        setSessionError('We could not confirm your session. Please try logging in again.')
      } finally {
        if (active) {
          setSessionLoading(false)
        }
      }
    }

    void ensureSession()

    return () => {
      active = false
    }
  }, [navigate])

  useEffect(() => {
    if (!session?.loggedIn) {
      return
    }

    let active = true

    const toArtistRow = (artist: SpotifyArtistItem, index: number): ArtistRow => {
      const image = artist.images?.find((img) => img?.url)?.url ?? null
      return {
        id: artist.id ?? `artist-${index}`,
        name: artist.name ?? 'Unknown artist',
        image,
        genres: artist.genres?.slice(0, 3) ?? [],
      }
    }

    const toTrackRow = (track: SpotifyTrackItem, index: number): TrackRow => {
      const image = track.album?.images?.find((img) => img?.url)?.url ?? null
      const artists = (track.artists ?? []).map((a) => a?.name).filter(Boolean) as string[]
      return {
        id: track.id ?? `track-${index}`,
        name: track.name ?? 'Unknown track',
        image,
        artists,
        album: track.album?.name ?? null,
      }
    }

    const loadTopData = async () => {
      setArtistsState({ items: [], loading: true, error: null })
      setTracksState({ items: [], loading: true, error: null })

      try {
        const [artistsRes, tracksRes] = await Promise.all([
          fetchTopArtists(selectedRange, { limit: 5 }),
          fetchTopTracks(selectedRange, { limit: 5 }),
        ])
        if (!active) return
        setArtistsState({ items: artistsRes.items.map(toArtistRow), loading: false, error: null })
        setTracksState({ items: tracksRes.items.map(toTrackRow), loading: false, error: null })
      } catch (err) {
        if (!active) return
        const message = err instanceof Error ? err.message : 'Failed to load data.'
        console.error('Failed to load top data', err)
        setArtistsState({ items: [], loading: false, error: message })
        setTracksState({ items: [], loading: false, error: message })
      }
    }

    void loadTopData()

    return () => {
      active = false
    }
  }, [session?.loggedIn, selectedRange])

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

  const rangeOptions = useMemo(() => Object.keys(TIME_RANGE_LABELS) as TimeRange[], [])

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
          {rangeOptions.map((range) => (
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
            <span className="card-caption">{TIME_RANGE_LABELS[selectedRange]}</span>
          </header>
          {artistsState.loading || sessionLoading ? (
            <div className="empty-state">Loading your artists...</div>
          ) : artistsState.error ? (
            <div className="empty-state">{artistsState.error}</div>
          ) : artistsState.items.length > 0 ? (
            <ul className="top-list">
              {artistsState.items.map((artist, index) => (
                <li className="top-item" key={artist.id}>
                  <span className="top-item-rank">{index + 1}</span>
                  <div className={artist.image ? 'top-item-avatar' : 'top-item-avatar fallback'}>
                    {artist.image ? (
                      <img src={artist.image} alt={artist.name} />
                    ) : (
                      <span aria-hidden="true">{artist.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="top-item-meta">
                    <p className="top-item-name">{artist.name}</p>
                    {artist.genres.length > 0 ? (
                      <p className="top-item-sub">{artist.genres.join(', ')}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">We do not have artist data for this range yet.</div>
          )}
        </section>

        <section className="stats-card">
          <header>
            <h2>Top Tracks</h2>
            <span className="card-caption">{TIME_RANGE_LABELS[selectedRange]}</span>
          </header>
          {tracksState.loading || sessionLoading ? (
            <div className="empty-state">Loading your tracks...</div>
          ) : tracksState.error ? (
            <div className="empty-state">{tracksState.error}</div>
          ) : tracksState.items.length > 0 ? (
            <ul className="top-list">
              {tracksState.items.map((track, index) => (
                <li className="top-item" key={track.id}>
                  <span className="top-item-rank">{index + 1}</span>
                  <div className={track.image ? 'top-item-avatar' : 'top-item-avatar fallback'}>
                    {track.image ? (
                      <img src={track.image} alt={track.name} />
                    ) : (
                      <span aria-hidden="true">{track.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="top-item-meta">
                    <p className="top-item-name">{track.name}</p>
                    <p className="top-item-sub">
                      {track.artists.join(', ')}
                      {track.album ? ` • ${track.album}` : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">We do not have track data for this range yet.</div>
          )}
        </section>
      </div>

      {sessionError ? <p className="dashboard-error">{sessionError}</p> : null}
    </div>
  )
}
