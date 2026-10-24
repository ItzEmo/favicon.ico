import { sql } from "@/lib/db"
import type { QueueItem, Source } from "@/components/track-types"

export interface HistoryItem extends QueueItem {
  playedAt: string
}

export async function getPlayedHistory(): Promise<HistoryItem[]> {
  const rows = (await sql`
    SELECT track_id, url, title, submitted_by, source, line, boosted, created_at, audio_pathname, played_at
    FROM submissions
    WHERE status = 'played'
    ORDER BY played_at DESC NULLS LAST
    LIMIT 500
  `) as Record<string, unknown>[]

  return rows.map((r) => ({
    trackId: r.track_id as string,
    url: r.url as string,
    title: r.title as string,
    submittedBy: r.submitted_by as string,
    source: r.source as Source,
    line: r.line as QueueItem["line"],
    boosted: r.boosted as boolean,
    createdAt: new Date(r.created_at as string).toISOString(),
    audioPathname: (r.audio_pathname as string | null) ?? null,
    playedAt: new Date((r.played_at ?? r.created_at) as string).toISOString(),
  }))
}
