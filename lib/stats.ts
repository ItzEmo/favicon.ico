import "server-only"

import { sql } from "@/lib/db"

// The reviewed-tracks total started at 28.8K when live counting began; every
// submission added after this moment counts on top of that baseline.
const TRACKS_BASELINE = 28_800
const TRACKS_COUNTING_SINCE = "2026-10-23T23:45:24Z"

export interface HomeStats {
  tracksReviewed: number
  arenaBattles: number
  activeAccounts: number
}

export async function getHomeStats(): Promise<HomeStats> {
  const [row] = (await sql`
    SELECT
      (SELECT COUNT(*)::int FROM submissions WHERE created_at > ${TRACKS_COUNTING_SINCE}) AS new_tracks,
      (SELECT COUNT(*)::int FROM arena_battles) AS arena_battles,
      (SELECT COUNT(*)::int FROM "user" WHERE NOT COALESCE(banned, false)) AS active_accounts
  `) as { new_tracks: number; arena_battles: number; active_accounts: number }[]

  return {
    tracksReviewed: TRACKS_BASELINE + (row?.new_tracks ?? 0),
    arenaBattles: row?.arena_battles ?? 0,
    activeAccounts: row?.active_accounts ?? 0,
  }
}

// Songs sent in during the current queue session, capped to today so the
// count also starts fresh each day.
export async function getSessionSubmissionCount(): Promise<number> {
  const [row] = (await sql`
    SELECT COUNT(*)::int AS count
    FROM submissions, queue_settings
    WHERE queue_settings.id = 1
      AND submissions.created_at >= GREATEST(queue_settings.session_started_at, date_trunc('day', now()))
  `) as { count: number }[]
  return row?.count ?? 0
}

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 })

export function formatStat(value: number): string {
  return compact.format(value)
}
