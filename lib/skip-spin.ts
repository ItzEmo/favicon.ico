import "server-only"

import { randomInt } from "node:crypto"
import { sql } from "@/lib/db"

export interface SkipSpinEntrant {
  key: string
  trackId: string
  title: string
  name: string
}

export interface SkipSpin {
  id: number
  trackId: string
  title: string
  winner: string
  candidates: string[]
  createdAt: string
}

const REEL_SIZE = 24
// Serializes spins so two clicks can never crown two winners at once.
const SPIN_LOCK = 734_221

// A person is their account when signed in, otherwise their display name, so
// one artist with several Free tracks still only gets one slot (and one win).
export async function getEligibleEntrants(): Promise<SkipSpinEntrant[]> {
  const rows = (await sql`
    SELECT DISTINCT ON (k.key) k.key, s.track_id, s.title, s.submitted_by
    FROM submissions s
    CROSS JOIN LATERAL (
      SELECT CASE WHEN s.user_id IS NOT NULL THEN 'user:' || s.user_id
                  ELSE 'name:' || lower(trim(s.submitted_by)) END AS key
    ) k
    WHERE s.status = 'active' AND s.line = 'free'
      AND NOT EXISTS (
        SELECT 1 FROM skip_spins w WHERE w.winner_key = k.key AND NOT w.cleared
      )
    ORDER BY k.key, s.entered_at ASC NULLS LAST, s.id ASC
  `) as { key: string; track_id: string; title: string; submitted_by: string }[]
  return rows.map((r) => ({ key: r.key, trackId: r.track_id, title: r.title, name: r.submitted_by }))
}

function toSpin(row: Record<string, unknown>): SkipSpin {
  return {
    id: row.id as number,
    trackId: row.track_id as string,
    title: row.title as string,
    winner: row.submitted_by as string,
    candidates: (row.candidates as string[]) ?? [],
    createdAt: new Date(row.created_at as string).toISOString(),
  }
}

export async function getLatestSpin(): Promise<SkipSpin | null> {
  const rows = (await sql`SELECT * FROM skip_spins ORDER BY id DESC LIMIT 1`) as Record<string, unknown>[]
  return rows[0] ? toSpin(rows[0]) : null
}

export async function getWinners(): Promise<SkipSpin[]> {
  const rows = (await sql`
    SELECT * FROM skip_spins WHERE NOT cleared ORDER BY id DESC LIMIT 50
  `) as Record<string, unknown>[]
  return rows.map(toSpin)
}

function shuffle<T>(items: T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

// Picks one random Free-line artist who hasn't won yet, moves their track to
// the Skip line, and records the win. Returns null when nobody is eligible.
export async function spinForFreeSkip(): Promise<SkipSpin | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const entrants = await getEligibleEntrants()
    if (entrants.length === 0) return null

    const winner = entrants[randomInt(entrants.length)]
    const others = shuffle(entrants.filter((e) => e.key !== winner.key)).map((e) => e.name)
    const candidates = [...new Set([winner.name, ...others])].slice(0, REEL_SIZE)

    const [, result] = await sql.transaction([
      sql`SELECT pg_advisory_xact_lock(${SPIN_LOCK})`,
      sql`
        WITH moved AS (
          UPDATE submissions
          SET line = 'skip', entered_at = now(), boost_cents = 0, boosted = FALSE, boosted_at = NULL
          WHERE track_id = ${winner.trackId} AND status = 'active' AND line = 'free'
            AND NOT EXISTS (
              SELECT 1 FROM skip_spins WHERE winner_key = ${winner.key} AND NOT cleared
            )
          RETURNING track_id, title, submitted_by, user_id
        )
        INSERT INTO skip_spins (winner_key, track_id, title, submitted_by, user_id, candidates)
        SELECT ${winner.key}, track_id, title, submitted_by, user_id, ${JSON.stringify(candidates)}::jsonb
        FROM moved
        RETURNING *
      `,
    ])
    const row = (result as Record<string, unknown>[])[0]
    if (row) return toSpin(row)
    // The pick changed under us (played, upgraded, or already won) — draw again.
  }
  return null
}

export async function resetWinners(): Promise<void> {
  await sql`UPDATE skip_spins SET cleared = TRUE WHERE NOT cleared`
}
