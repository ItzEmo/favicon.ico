import "server-only"

import { createHmac, timingSafeEqual } from "node:crypto"
import { sql } from "@/lib/db"

export interface LivePollVote {
  voter: string
  score: number
}

export interface LivePoll {
  id: number
  trackId: string
  trackTitle: string
  artistName: string | null
  status: "open" | "closed"
  avg: number
  count: number
  // Index 0 holds the number of 1s, index 9 the number of 10s.
  histogram: number[]
  recent: LivePollVote[]
}

// The vote webhook is authenticated by a key derived from ADMIN_PASSWORD, so
// nothing extra has to be stored and rotating the password rotates the key.
export function getVoteKey(): string {
  const pw = process.env.ADMIN_PASSWORD
  if (!pw) throw new Error("ADMIN_PASSWORD is not set")
  return createHmac("sha256", pw).update("live-poll-vote").digest("hex").slice(0, 32)
}

export function isValidVoteKey(key: string | null): boolean {
  if (!key) return false
  const a = Buffer.from(key)
  const b = Buffer.from(getVoteKey())
  return a.length === b.length && timingSafeEqual(a, b)
}

// Pulls a 1-10 score out of a chat message: "8", "10/10", "rate 9!", "7.5" -> 8.
export function parseScore(message: string): number | null {
  const match = message.match(/(?:^|[^\d.])(\d{1,2}(?:\.\d)?)(?:\s*\/\s*10)?(?![\d.])/)
  if (!match) return null
  const value = Math.round(Number(match[1]))
  return Number.isInteger(value) && value >= 1 && value <= 10 ? value : null
}

async function buildPoll(row: Record<string, unknown>): Promise<LivePoll> {
  const id = row.id as number
  const [statRows, recentRows] = await Promise.all([
    sql`select score, count(*)::int as n from live_poll_votes where poll_id = ${id} group by score`,
    sql`
      select voter, score from live_poll_votes where poll_id = ${id}
      order by updated_at desc limit 6
    `,
  ])
  const stats = statRows as { score: number; n: number }[]
  const recent = recentRows as LivePollVote[]
  const histogram = Array.from({ length: 10 }, () => 0)
  let total = 0
  let count = 0
  for (const s of stats) {
    histogram[s.score - 1] = s.n
    total += s.score * s.n
    count += s.n
  }
  return {
    id,
    trackId: row.track_id as string,
    trackTitle: row.track_title as string,
    artistName: (row.artist_name as string | null) ?? null,
    status: row.status as LivePoll["status"],
    avg: count ? total / count : 0,
    count,
    histogram,
    recent,
  }
}

export async function getOpenPoll(): Promise<LivePoll | null> {
  const rows = (await sql`select * from live_polls where status = 'open' limit 1`) as Record<string, unknown>[]
  return rows[0] ? buildPoll(rows[0]) : null
}

// Opens a poll for whatever is on air. Any previous open poll is closed first.
export async function openPollForNowPlaying(): Promise<{ ok: boolean; error?: string }> {
  const tracks = (await sql`
    select track_id, title, submitted_by, user_id from submissions
    where status = 'playing' order by played_at desc nulls last limit 1
  `) as { track_id: string; title: string; submitted_by: string; user_id: string | null }[]
  const track = tracks[0]
  if (!track) return { ok: false, error: "Nothing is on air. Play a track first." }

  await sql`update live_polls set status = 'closed', closed_at = now() where status = 'open'`
  await sql`
    insert into live_polls (track_id, track_title, artist_name, artist_user_id)
    values (${track.track_id}, ${track.title}, ${track.submitted_by}, ${track.user_id})
  `
  return { ok: true }
}

export async function closeOpenPoll() {
  await sql`update live_polls set status = 'closed', closed_at = now() where status = 'open'`
}

export async function recordLiveVote(voter: string, score: number): Promise<{ ok: boolean; error?: string }> {
  const name = voter.trim().slice(0, 80)
  if (!name) return { ok: false, error: "Missing voter" }
  if (!Number.isInteger(score) || score < 1 || score > 10) return { ok: false, error: "Score must be 1-10" }

  // One vote per viewer per poll; voting again just changes their score.
  const rows = (await sql`
    insert into live_poll_votes (poll_id, voter, score)
    select id, ${name.toLowerCase()}, ${score} from live_polls where status = 'open'
    on conflict (poll_id, voter) do update set score = excluded.score, updated_at = now()
    returning poll_id
  `) as { poll_id: number }[]
  return rows.length ? { ok: true } : { ok: false, error: "No poll is open" }
}
