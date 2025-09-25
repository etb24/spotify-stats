# Spotify Stats Dashboard

Full-stack project for exploring your Spotify listening trends. The Express API in `api/` manages Spotify OAuth (PKCE), token refresh, and top-track/artist lookups, while the Vite + React frontend in `web/` presents a landing page, auth callback, and dashboard that currently lists your top five artists and tracks for Spotify's short-, medium-, and long-term ranges.

## Features
- **PKCE-based auth flow** – secure login, refresh handling, and session cookies.
- **Top items endpoints** – `/api/top/artists` and `/api/top/tracks` proxy Spotify with built-in validation.
- **Responsive UI shell** – polished landing page, dashboard time-range controls, and data placeholders primed for richer insights.
- **TypeScript everywhere** – typed server and client code with shared linting defaults.

## Project Structure
```
api/   # Express server, auth helpers, REST routes
web/   # Vite/React SPA, pages, shared API client, styles

## Roadmap Ideas
- Persist cached Spotify responses per user to speed up range switches.
- Expand dashboard visuals (historical charts, filters, sharing).
- Add recently played insights and listening time metrics.
- Support adjustable result counts and export/share options.
