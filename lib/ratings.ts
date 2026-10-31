import "server-only"

import { sql } from "@/lib/db"

export interface RatingSummary {
  avg: number
  count: number
}

export interface RankedArtist {
  rank: number
  artist: string
  userId: string | null
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
      max(r.artist_name) as artist,
      (array_agg(r.artist_user_id order by r.created_at desc) filter (where r.artist_user_id is not null))[1] as user_id,
      avg(r.score)::float as avg,
      count(*)::int as reviews,
      (sum(r.score) * ${POINTS_PER_SCORE})::int as points
    from track_ratings r
    where r.artist_name is not null
    group by lower(trim(r.artist_name))
    order by points desc, avg desc
    limit ${limit}
  `) as { artist: string; user_id: string | null; avg: number; reviews: number; points: number }[]
  return rows.map(({ user_id, ...r }, i) => ({ rank: i + 1, userId: user_id, ...r }))
}
