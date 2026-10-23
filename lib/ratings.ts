import "server-only"

import { sql } from "@/lib/db"

export interface RatingSummary {
  avg: number
  count: number
}

export interface RankedArtist {
  rank: number
  artist: string
  avg: number
  reviews: number
  points: number
}

// Points reward both quality and volume: each rating is worth its score x 10.
export const POINTS_PER_SCORE = 10

export async function getRatingSummaries(trackIds: string[]): Promise<Record<string, RatingSummary>> {
  if (trackIds.length === 0) return {}
  const rows = (await sql`
    select track_id, avg(score)::float as avg, count(*)::int as count
    from track_ratings
    where track_id = any(${trackIds})
    group by track_id
  `) as { track_id: string; avg: number; count: number }[]
  return Object.fromEntries(rows.map((r) => [r.track_id, { avg: r.avg, count: r.count }]))
}

export async function getUserRatings(userId: string, trackIds: string[]): Promise<Record<string, number>> {
  if (trackIds.length === 0) return {}
  const rows = (await sql`
    select track_id, score
    from track_ratings
    where "userId" = ${userId} and track_id = any(${trackIds})
  `) as { track_id: string; score: number }[]
  return Object.fromEntries(rows.map((r) => [r.track_id, r.score]))
}

export async function getLeaderboard(limit = 50): Promise<RankedArtist[]> {
  const rows = (await sql`
    select
      max(s.submitted_by) as artist,
      avg(r.score)::float as avg,
      count(*)::int as reviews,
      (sum(r.score) * ${POINTS_PER_SCORE})::int as points
    from track_ratings r
    join submissions s on s.track_id = r.track_id
    group by lower(trim(s.submitted_by))
    order by points desc, avg desc
    limit ${limit}
  `) as { artist: string; avg: number; reviews: number; points: number }[]
  return rows.map((r, i) => ({ rank: i + 1, ...r }))
}
