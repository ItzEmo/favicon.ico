import "server-only"

import { sql } from "@/lib/db"
import type { ArtistLinkKind, ArtistLinks, ArtistLinkSettings } from "@/lib/artist-links-types"

type Row = { kind: ArtistLinkKind; url: string; visible: boolean }

/** Links shown publicly on the unlock screen (hidden ones are left out). */
export async function getArtistLinks(): Promise<ArtistLinks> {
  const rows = (await sql`SELECT kind, url FROM artist_links WHERE visible`) as Row[]
  return Object.fromEntries(rows.map((r) => [r.kind, r.url]))
}

/** Every saved link plus which ones the admin has switched off. */
export async function getArtistLinkSettings(): Promise<ArtistLinkSettings> {
  const rows = (await sql`SELECT kind, url, visible FROM artist_links`) as Row[]
  return {
    links: Object.fromEntries(rows.map((r) => [r.kind, r.url])),
    hidden: rows.filter((r) => !r.visible).map((r) => r.kind),
  }
}
