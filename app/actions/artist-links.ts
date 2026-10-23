"use server"

import { revalidatePath } from "next/cache"
import { sql } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"
import { ARTIST_LINK_KINDS, validateArtistLink, type ArtistLinks } from "@/lib/artist-links-types"

export type SaveLinksResult = { ok: true } | { ok: false; errors: ArtistLinks }

export async function saveArtistLinks(input: ArtistLinks): Promise<SaveLinksResult> {
  await requireAdmin()

  const cleaned: ArtistLinks = {}
  const errors: ArtistLinks = {}
  for (const kind of ARTIST_LINK_KINDS) {
    const result = validateArtistLink(kind, input?.[kind] ?? "")
    if ("error" in result) errors[kind] = result.error
    else cleaned[kind] = result.url
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors }

  for (const kind of ARTIST_LINK_KINDS) {
    const url = cleaned[kind]
    if (url) {
      await sql`
        INSERT INTO artist_links (kind, url) VALUES (${kind}, ${url})
        ON CONFLICT (kind) DO UPDATE SET url = EXCLUDED.url, updated_at = now()
      `
    } else {
      await sql`DELETE FROM artist_links WHERE kind = ${kind}`
    }
  }

  revalidatePath("/", "layout")
  revalidatePath("/admin")
  return { ok: true }
}
