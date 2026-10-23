import "server-only"

import { sql } from "@/lib/db"

export type FeedType = "submit" | "boost" | "play" | "rating" | "battle"

export interface FeedItem {
  id: string
  type: FeedType
  actor: string
  text: string
  at: string
}

interface FeedRow {
  id: string
  type: FeedType
  actor: string | null
  title: string | null
  detail: string | null
  a_votes: number | null
  b_votes: number | null
  at: string
}

// Every event is derived from live Queue and Arena data; unpaid (pending)
// submissions never appear because they haven't entered the queue yet.
export async function getFeed(limit = 50): Promise<FeedItem[]> {
  const rows = (await sql`
    SELECT * FROM (
      SELECT 'submit-' || s.id AS id, 'submit' AS type, s.submitted_by AS actor, s.title,
             NULL AS detail, NULL::int AS a_votes, NULL::int AS b_votes,
             COALESCE(s.entered_at, s.created_at) AS at
      FROM submissions s
      WHERE s.status <> 'pending'

      UNION ALL
      SELECT 'boost-' || s.id, 'boost', s.submitted_by, s.title, NULL, NULL, NULL, s.boosted_at
      FROM submissions s
      WHERE s.boosted_at IS NOT NULL AND s.status <> 'pending'

      UNION ALL
      SELECT 'play-' || s.id, 'play', s.submitted_by, s.title, NULL, NULL, NULL, s.played_at
      FROM submissions s
      WHERE s.played_at IS NOT NULL

      UNION ALL
      SELECT 'rating-' || r.track_id || '-' || r."userId", 'rating', u.name, s.title,
             r.score::text, NULL, NULL, COALESCE(r.updated_at, r.created_at)
      FROM track_ratings r
      JOIN submissions s ON s.track_id = r.track_id
      LEFT JOIN "user" u ON u.id = r."userId"

      UNION ALL
      SELECT 'battle-' || b.id, 'battle', b.a_title || ' by ' || b.a_artist,
             b.b_title || ' by ' || b.b_artist, b.round, b.a_votes, b.b_votes, b.created_at
      FROM arena_battles b
    ) events
    WHERE at IS NOT NULL
    ORDER BY at DESC
    LIMIT ${limit}
  `) as FeedRow[]

  return rows.map(toItem)
}

function toItem(r: FeedRow): FeedItem {
  const title = r.title ?? "a track"
  const base = { id: r.id, type: r.type, at: new Date(r.at).toISOString() }

  switch (r.type) {
    case "submit":
      return { ...base, actor: r.actor ?? "Someone", text: `dropped ${title} into the queue.` }
    case "boost":
      return { ...base, actor: r.actor ?? "Someone", text: `boosted ${title} up the queue.` }
    case "play":
      return { ...base, actor: "Emo's Radio", text: `is now spinning ${title} from ${r.actor ?? "the queue"}.` }
    case "rating":
      return { ...base, actor: r.actor ?? "A listener", text: `rated ${title} a ${r.detail}/10.` }
    case "battle":
      return { ...base, actor: "The Arena", text: battleText(r) }
  }
}

function battleText(r: FeedRow): string {
  const a = r.actor ?? "Side A"
  const b = r.title ?? "Side B"
  const round = r.detail ? `${r.detail}: ` : ""
  const aVotes = r.a_votes ?? 0
  const bVotes = r.b_votes ?? 0
  const total = aVotes + bVotes
  if (total === 0) return `${round}${a} vs ${b} — voting is open.`
  if (aVotes === bVotes) return `${round}${a} and ${b} are dead even at 50%.`
  const [leader, trailer, lead] = aVotes > bVotes ? [a, b, aVotes] : [b, a, bVotes]
  const pct = Math.round((lead / total) * 100)
  return `${round}${leader} leads ${trailer}, ${pct}% to ${100 - pct}%.`
}
