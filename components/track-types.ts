export type Source = "spotify" | "youtube" | "soundcloud" | "apple" | "bandcamp" | "link"

export interface Track {
  id: string
  url: string
  title: string
  submittedBy: string
  source: Source
  createdAt: number
  // Set for uploaded files: the private Blob pathname of the stored audio.
  audioPathname?: string
}

// A row from the live queue (persisted in the database).
export interface QueueItem {
  trackId: string
  url: string
  title: string
  submittedBy: string
  source: Source
  line: "free" | "boost" | "skip" | "skipplus"
  boosted: boolean
  createdAt: string
  // Present when the submission was an uploaded audio file (host can play it directly).
  audioPathname?: string | null
}

export function detectSource(url: string): Source {
  const u = url.toLowerCase()
  if (u.includes("spotify")) return "spotify"
  if (u.includes("youtube") || u.includes("youtu.be")) return "youtube"
  if (u.includes("soundcloud")) return "soundcloud"
  if (u.includes("music.apple") || u.includes("itunes.apple")) return "apple"
  if (u.includes("bandcamp")) return "bandcamp"
  return "link"
}

export const sourceLabels: Record<Source, string> = {
  spotify: "Spotify",
  youtube: "YouTube",
  soundcloud: "SoundCloud",
  apple: "Apple Music",
  bandcamp: "Bandcamp",
  link: "Link",
}

export function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value.trim())
    return u.protocol === "http:" || u.protocol === "https:"
  } catch {
    return false
  }
}

// Build a readable title from the URL when the user doesn't provide one.
export function titleFromUrl(url: string): string {
  try {
    const u = new URL(url.trim())
    const host = u.hostname.replace(/^www\./, "")
    const lastSegment = u.pathname.split("/").filter(Boolean).pop() ?? ""
    const cleaned = decodeURIComponent(lastSegment)
      .replace(/[-_]+/g, " ")
      .replace(/\.[a-z0-9]+$/i, "")
      .trim()
    return cleaned ? cleaned.replace(/\b\w/g, (c) => c.toUpperCase()) : host
  } catch {
    return "Untitled track"
  }
}
