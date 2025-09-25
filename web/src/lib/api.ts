export type SessionResponse = {
  loggedIn?: boolean
  account?: string | null
  expired?: boolean
  missingScope?: boolean
  requiredScopes?: readonly string[]
  error?: string
}

export type TimeRange = 'short_term' | 'medium_term' | 'long_term'

export type TopResponse<T> = {
  range: TimeRange
  limit: number
  offset: number
  total: number | null
  items: T[]
}

export type SpotifyImage = {
  url?: string
  width?: number
  height?: number
}

export type SpotifyArtistItem = {
  id?: string
  name?: string
  genres?: string[]
  images?: SpotifyImage[]
  followers?: { total?: number }
  popularity?: number
}

export type SpotifyTrackItem = {
  id?: string
  name?: string
  preview_url?: string | null
  uri?: string
  artists?: { id?: string; name?: string }[]
  album?: { id?: string; name?: string; images?: SpotifyImage[] }
}

export async function fetchSession(): Promise<SessionResponse> {
  const res = await fetch('/api/auth/session', { credentials: 'include' })
  if (!res.ok) {
    throw new Error(`Session check failed with status ${res.status}`)
  }
  return (await res.json()) as SessionResponse
}

export async function requestLoginUrl(): Promise<string> {
  const res = await fetch('/api/auth/login', { credentials: 'include' })
  if (!res.ok) {
    throw new Error('Could not start Spotify login flow')
  }
  const payload = (await res.json()) as { url?: string }
  if (!payload.url) {
    throw new Error('Login endpoint did not return a URL')
  }
  return payload.url
}

export async function performLogout(): Promise<void> {
  const res = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) {
    throw new Error('Logout failed')
  }
}

function buildTopParams(range: TimeRange, limit?: number, offset?: number): string {
  const safeLimit = Math.max(1, Math.min(limit ?? 5, 50))
  const safeOffset = Math.max(0, offset ?? 0)
  const params = new URLSearchParams({ range, limit: String(safeLimit) })
  if (safeOffset > 0) {
    params.set('offset', String(safeOffset))
  }
  return params.toString()
}

async function extractError(res: Response): Promise<never> {
  let message = `Request failed with status ${res.status}`
  try {
    const payload = await res.json()
    if (typeof payload?.error === 'string') {
      message = payload.error
    } else if (typeof payload?.details === 'string') {
      message = payload.details
    }
  } catch {
    // ignore JSON parse errors
  }
  throw new Error(message)
}

export async function fetchTopArtists(
  range: TimeRange,
  options?: { limit?: number; offset?: number }
): Promise<TopResponse<SpotifyArtistItem>> {
  const query = buildTopParams(range, options?.limit, options?.offset)
  const res = await fetch(`/api/top/artists?${query}`, { credentials: 'include' })
  if (!res.ok) {
    await extractError(res)
  }
  return (await res.json()) as TopResponse<SpotifyArtistItem>
}

export async function fetchTopTracks(
  range: TimeRange,
  options?: { limit?: number; offset?: number }
): Promise<TopResponse<SpotifyTrackItem>> {
  const query = buildTopParams(range, options?.limit, options?.offset)
  const res = await fetch(`/api/top/tracks?${query}`, { credentials: 'include' })
  if (!res.ok) {
    await extractError(res)
  }
  return (await res.json()) as TopResponse<SpotifyTrackItem>
}
