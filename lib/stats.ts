import "server-only"

import { sql } from "@/lib/db"

// The reviewed-tracks total started at 28.8K when live counting began; every
// submission added after this moment counts on top of that baseline.
const TRACKS_BASELINE = 28_800
const TRACKS_COUNTING_SINCE = "2026-10-23T23:45:24Z"

export interface HomeStats {
  tracksReviewed: number
  arenaBattles: number
}

export async function getHomeStats(): Promise<HomeStats> {
  const [row] = (await sql`
    SELECT
      (SELECT COUNT(*)::int FROM submissions WHERE created_at > ${TRACKS_COUNTING_SINCE}) AS new_tracks,
      (SELECT COUNT(*)::int FROM arena_battles) AS arena_battles
  `) as { new_tracks: number; arena_battles: number }[]

  return {
    tracksReviewed: TRACKS_BASELINE + (row?.new_tracks ?? 0),
    arenaBattles: row?.arena_battles ?? 0,
  }
}

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 })

export function formatStat(value: number): string {
  return compact.format(value)
}
