"use server"

import { revalidatePath } from "next/cache"
import { sql } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"
import type { VaultInput } from "@/lib/vault-types"

export type VaultResult = { ok: true } | { ok: false; error: string }

function clean(input: VaultInput): VaultInput | string {
  const title = String(input.title ?? "").trim()
  const artist = String(input.artist ?? "").trim()
  const genre = String(input.genre ?? "").trim()
  const verdict = String(input.verdict ?? "").trim()
  const notes = String(input.notes ?? "").trim()
  const score = Math.round(Number(input.score) * 10) / 10

  if (!title || title.length > 200) return "Title is required (200 characters max)."
  if (!artist || artist.length > 120) return "Artist is required (120 characters max)."
  if (genre.length > 60) return "Genre is too long (60 characters max)."
  if (verdict.length > 60) return "Verdict is too long (60 characters max)."
  if (notes.length > 1000) return "Notes are too long (1000 characters max)."
  if (!Number.isFinite(score) || score < 0 || score > 10) return "Score must be between 0 and 10."
  return { title, artist, genre, score, verdict, notes }
}

function refresh() {
  revalidatePath("/vault")
  revalidatePath("/admin")
}

// Archive a reviewed queue track. Re-archiving the same track updates its entry.
export async function addTrackToVault(trackId: string, input: VaultInput): Promise<VaultResult> {
  await requireAdmin()
  const v = clean(input)
  if (typeof v === "string") return { ok: false, error: v }

  const rows = (await sql`
    SELECT url, audio_pathname FROM submissions WHERE track_id = ${trackId}
  `) as { url: string | null; audio_pathname: string | null }[]
  if (!rows[0]) return { ok: false, error: "That track is no longer in the queue." }
  const url = rows[0].audio_pathname ? null : rows[0].url

  await sql`
    INSERT INTO vault_entries (track_id, title, artist, genre, score, verdict, notes, url)
    VALUES (${trackId}, ${v.title}, ${v.artist}, ${v.genre}, ${v.score}, ${v.verdict}, ${v.notes}, ${url})
    ON CONFLICT (track_id) DO UPDATE SET
      title = EXCLUDED.title, artist = EXCLUDED.artist, genre = EXCLUDED.genre,
      score = EXCLUDED.score, verdict = EXCLUDED.verdict, notes = EXCLUDED.notes,
      reviewed_at = now()
  `
  refresh()
  return { ok: true }
}

export async function createVaultEntry(input: VaultInput): Promise<VaultResult> {
  await requireAdmin()
  const v = clean(input)
  if (typeof v === "string") return { ok: false, error: v }
  await sql`
    INSERT INTO vault_entries (title, artist, genre, score, verdict, notes)
    VALUES (${v.title}, ${v.artist}, ${v.genre}, ${v.score}, ${v.verdict}, ${v.notes})
  `
  refresh()
  return { ok: true }
}

export async function updateVaultEntry(id: number, input: VaultInput): Promise<VaultResult> {
  await requireAdmin()
  const v = clean(input)
  if (typeof v === "string") return { ok: false, error: v }
  await sql`
    UPDATE vault_entries SET
      title = ${v.title}, artist = ${v.artist}, genre = ${v.genre},
      score = ${v.score}, verdict = ${v.verdict}, notes = ${v.notes}
    WHERE id = ${id}
  `
  refresh()
  return { ok: true }
}

export async function removeVaultEntry(id: number): Promise<void> {
  await requireAdmin()
  await sql`DELETE FROM vault_entries WHERE id = ${id}`
  refresh()
}
