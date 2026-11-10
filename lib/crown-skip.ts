import "server-only"

import { sql } from "@/lib/db"

export interface CrownSkipStatus {
  crowned: boolean
  available: boolean
  resetsAt: string | null
}

// Weeks start Monday 00:00 UTC. One row per user per week is enforced by the
// table's primary key, so two simultaneous submits can never both win.
export async function getCrownSkipStatus(userId: string | null): Promise<CrownSkipStatus> {
  if (!userId) return { crowned: false, available: false, resetsAt: null }
  const rows = (await sql`
    SELECT
      COALESCE(u.crowned, false) AS crowned,
      EXISTS (
        SELECT 1 FROM crown_skip_uses c
        WHERE c.user_id = u.id AND c.week_start = date_trunc('week', now() AT TIME ZONE 'UTC')::date
      ) AS used,
      (date_trunc('week', now() AT TIME ZONE 'UTC') + interval '7 days') AT TIME ZONE 'UTC' AS resets_at
    FROM "user" u
    WHERE u.id = ${userId}
  `) as { crowned: boolean; used: boolean; resets_at: string }[]
  const row = rows[0]
  if (!row?.crowned) return { crowned: false, available: false, resetsAt: null }
  return {
    crowned: true,
    available: !row.used,
    resetsAt: new Date(row.resets_at).toISOString(),
  }
}

// Claims this week's crown skip. Returns false if the user isn't crowned or
// already used it.
export async function claimCrownSkip(userId: string, trackId: string): Promise<boolean> {
  const rows = (await sql`
    INSERT INTO crown_skip_uses (user_id, week_start, track_id)
    SELECT u.id, date_trunc('week', now() AT TIME ZONE 'UTC')::date, ${trackId}
    FROM "user" u
    WHERE u.id = ${userId} AND u.crowned = true
    ON CONFLICT (user_id, week_start) DO NOTHING
    RETURNING user_id
  `) as { user_id: string }[]
  return rows.length > 0
}

export async function releaseCrownSkip(userId: string, trackId: string): Promise<void> {
  await sql`DELETE FROM crown_skip_uses WHERE user_id = ${userId} AND track_id = ${trackId}`
}
