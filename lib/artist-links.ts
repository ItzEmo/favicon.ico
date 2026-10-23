import "server-only"

import { sql } from "@/lib/db"
import type { ArtistLinkKind, ArtistLinks } from "@/lib/artist-links-types"

export async function getArtistLinks(): Promise<ArtistLinks> {
  const rows = (await sql`SELECT kind, url FROM artist_links`) as { kind: ArtistLinkKind; url: string }[]
  return Object.fromEntries(rows.map((r) => [r.kind, r.url]))
}
