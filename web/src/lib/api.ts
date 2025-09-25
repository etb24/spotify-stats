export type SessionResponse = {
  loggedIn?: boolean
  account?: string | null
  expired?: boolean
  missingScope?: boolean
  requiredScopes?: readonly string[]
  error?: string
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
