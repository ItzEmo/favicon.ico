import "server-only"

import { sql } from "@/lib/db"

export interface AccountSubmission {
  trackId: string
  title: string
  status: string
  line: string
  createdAt: string
  avgScore: number | null
}

export interface ProfileExtras {
  instagram: string | null
}

const STATUS_LABELS: Record<string, string> = {
  active: "In Queue",
  playing: "On Air",
  played: "Played",
  pending: "Awaiting Payment",
}

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status.charAt(0).toUpperCase() + status.slice(1)
}

// Every song artists have put into the queue, all time. Unpaid checkouts that
// were abandoned ('pending') never reached the queue, so they don't count.
export async function getTotalSubmissions(): Promise<number> {
  const rows = (await sql`
    SELECT count(*)::int AS total FROM submissions WHERE status <> 'pending'
  `) as { total: number }[]
  return rows[0]?.total ?? 0
}

export interface AccountStats {
  submissions: number
  avgScore: number | null
  rank: number | null
  rankedAccounts: number
}

// Rank uses the same points formula as the public leaderboard (sum of scores x 10),
// but is scored per account so two artists sharing a name never share a rank.
export async function getUserStats(userId: string): Promise<AccountStats> {
  const rows = (await sql`
    WITH account_points AS (
      SELECT s.user_id,
             sum(r.score) * 10 AS points,
             avg(r.score)::float AS avg
      FROM submissions s
      JOIN track_ratings r ON r.track_id = s.track_id
      WHERE s.user_id IS NOT NULL AND s.status <> 'pending'
      GROUP BY s.user_id
    ),
    ranked AS (
      SELECT user_id, avg,
             rank() OVER (ORDER BY points DESC, avg DESC)::int AS rank,
             count(*) OVER ()::int AS total
      FROM account_points
    )
    SELECT
      (SELECT count(*)::int FROM submissions
        WHERE user_id = ${userId} AND status <> 'pending') AS submissions,
      (SELECT avg FROM ranked WHERE user_id = ${userId}) AS avg_score,
      (SELECT rank FROM ranked WHERE user_id = ${userId}) AS rank,
      (SELECT count(*)::int FROM account_points) AS ranked_accounts
  `) as { submissions: number; avg_score: number | null; rank: number | null; ranked_accounts: number }[]

  const row = rows[0]
  return {
    submissions: row?.submissions ?? 0,
    avgScore: row?.avg_score ?? null,
    rank: row?.rank ?? null,
    rankedAccounts: row?.ranked_accounts ?? 0,
  }
}

export async function getUserSubmissions(userId: string): Promise<AccountSubmission[]> {
  const rows = (await sql`
    SELECT s.track_id, s.title, s.status, s.line, s.created_at,
           avg(r.score)::float AS avg_score
    FROM submissions s
    LEFT JOIN track_ratings r ON r.track_id = s.track_id
    WHERE s.user_id = ${userId}
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `) as {
    track_id: string
    title: string
    status: string
    line: string
    created_at: string
    avg_score: number | null
  }[]

  return rows.map((r) => ({
    trackId: r.track_id,
    title: r.title,
    status: r.status,
    line: r.line,
    createdAt: new Date(r.created_at).toISOString(),
    avgScore: r.avg_score,
  }))
}

export async function getProfileExtras(userId: string): Promise<ProfileExtras> {
  const rows = (await sql`
    SELECT instagram FROM "user" WHERE id = ${userId} LIMIT 1
  `) as { instagram: string | null }[]
  return { instagram: rows[0]?.instagram ?? null }
}

// Accepts "@handle", "handle", or any instagram.com/handle URL.
export function normalizeInstagram(raw: string): string | null {
  let value = raw.trim()
  if (!value) return null
  const urlMatch = value.match(/instagram\.com\/([^/?#]+)/i)
  if (urlMatch) value = urlMatch[1]
  value = value.replace(/^@/, "")
  if (!/^[A-Za-z0-9._]{1,30}$/.test(value)) {
    throw new Error("Enter a valid Instagram handle")
  }
  return value
}
