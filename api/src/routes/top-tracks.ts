import { Router, Request, Response } from 'express';
import axios from 'axios';
import { ensureAccessToken, SpotifyTokenError, REQUIRED_SCOPES } from '../auth/spotifyTokens';

type TimeRange = 'short_term' | 'medium_term' | 'long_term';

const VALID_RANGES: TimeRange[] = ['short_term', 'medium_term', 'long_term'];
const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 50;
const DEFAULT_OFFSET = 0;

const router = Router();

function parseTimeRange(range: unknown): TimeRange {
  if (typeof range === 'string' && VALID_RANGES.includes(range as TimeRange)) {
    return range as TimeRange;
  }
  return 'short_term';
}

function parseNumber(value: unknown, fallback: number, { min, max }: { min: number; max: number }): number {
  const num = typeof value === 'string' ? Number.parseInt(value, 10) : Number.NaN;
  if (Number.isNaN(num)) {
    return fallback;
  }
  return Math.min(Math.max(num, min), max);
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const { accessToken } = await ensureAccessToken(req, res);

    const timeRange = parseTimeRange(req.query.range);
    const limit = parseNumber(req.query.limit, DEFAULT_LIMIT, { min: 1, max: MAX_LIMIT });
    const offset = parseNumber(req.query.offset, DEFAULT_OFFSET, { min: 0, max: 49 });

    const spotifyRes = await axios.get('https://api.spotify.com/v1/me/top/tracks', {
      params: { time_range: timeRange, limit, offset },
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    res.json({
      range: timeRange,
      limit,
      offset,
      total: spotifyRes.data?.total ?? null,
      items: spotifyRes.data?.items ?? [],
    });
  } catch (err: any) {
    if (err instanceof SpotifyTokenError) {
      if (err.code === 'missing_tokens') {
        return res.status(401).json({ error: 'not_authenticated' });
      }
      if (err.code === 'missing_scope') {
        return res.status(403).json({ error: 'missing_scope', requiredScopes: REQUIRED_SCOPES });
      }
      if (err.code === 'missing_refresh_token') {
        return res.status(401).json({ error: 'session_expired' });
      }
      console.error('track_tokens_failed:', err.cause ?? err);
      return res.status(401).json({ error: 'token_refresh_failed' });
    }

    if (axios.isAxiosError(err)) {
      const status = err.response?.status ?? 500;
      const data = err.response?.data;
      console.error('spotify_top_tracks_failed:', status, data || err.message || err);
      if (status === 401 || status === 403) {
        return res.status(401).json({ error: 'spotify_unauthorized' });
      }
      return res.status(502).json({ error: 'spotify_request_failed', details: data });
    }

    console.error('top_tracks_unknown_error:', err);
    return res.status(500).json({ error: 'unknown_error' });
  }
});

export default router;
