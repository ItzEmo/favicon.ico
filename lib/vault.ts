import "server-only"

import { sql } from "@/lib/db"
import type { VaultEntry } from "@/lib/vault-types"

interface VaultRow {
  id: number
  track_id: string | null
  title: string
  artist: string
  genre: string
  score: string | number
  verdict: string
  notes: string
  url: string | null
  reviewed_at: string | Date
}

export async function getVaultEntries(): Promise<VaultEntry[]> {
  const rows = (await sql`
    SELECT id, track_id, title, artist, genre, score, verdict, notes, url, reviewed_at
    FROM vault_entries
    ORDER BY reviewed_at DESC, id DESC
  `) as VaultRow[]
  return rows.map((r) => ({
    id: r.id,
    trackId: r.track_id,
    title: r.title,
    artist: r.artist,
    genre: r.genre,
    score: Number(r.score),
    verdict: r.verdict,
    notes: r.notes,
    url: r.url,
    reviewedAt: new Date(r.reviewed_at).toISOString(),
  }))
}
