import { detectSource, sourceLabels, type Source } from "@/components/track-types"

export interface MusicLink {
  title: string
  url: string
}

export const MAX_MUSIC_LINKS = 8

export function musicLinkSource(url: string): Source {
  return detectSource(url)
}

export function musicLinkLabel(url: string): string {
  return sourceLabels[detectSource(url)]
}

/** Cleans the submitted rows, dropping fully empty ones. Throws a readable error on bad input. */
export function parseMusicLinks(titles: string[], urls: string[]): MusicLink[] {
  const links: MusicLink[] = []
  const count = Math.max(titles.length, urls.length)
  for (let i = 0; i < count; i++) {
    const title = String(titles[i] ?? "").trim()
    const raw = String(urls[i] ?? "").trim()
    if (!title && !raw) continue
    if (!raw) throw new Error(`Add a link for "${title}"`)
    if (raw.length > 500) throw new Error("One of your links is too long")
    let url: URL
    try {
      url = new URL(raw)
    } catch {
      throw new Error(`"${raw}" isn't a valid link`)
    }
    if (url.protocol !== "https:") throw new Error("Links must start with https://")
    if (title.length > 80) throw new Error("Titles must be 80 characters or fewer")
    links.push({ title: title || musicLinkLabel(url.toString()), url: url.toString() })
  }
  if (links.length > MAX_MUSIC_LINKS) throw new Error(`You can add up to ${MAX_MUSIC_LINKS} releases`)
  return links
}

export function coerceMusicLinks(value: unknown): MusicLink[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((l): l is MusicLink => !!l && typeof l.title === "string" && typeof l.url === "string")
    .slice(0, MAX_MUSIC_LINKS)
}
