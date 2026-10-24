export type SocialLinkKind = "instagram" | "youtube" | "tiktok"

export type ArtistLinkKind = "spotify" | "apple_music" | "all_music" | SocialLinkKind

export type ArtistLinks = Partial<Record<ArtistLinkKind, string>>

export type ArtistLinkSettings = { links: ArtistLinks; hidden: ArtistLinkKind[] }

export const SOCIAL_LINK_KINDS: SocialLinkKind[] = ["instagram", "youtube", "tiktok"]

export const ARTIST_LINK_KINDS: ArtistLinkKind[] = ["spotify", "apple_music", "all_music", ...SOCIAL_LINK_KINDS]

const SOCIAL_HOSTS: Record<SocialLinkKind, { hosts: string[]; label: string }> = {
  instagram: { hosts: ["instagram.com"], label: "an instagram.com" },
  youtube: { hosts: ["youtube.com", "youtu.be"], label: "a youtube.com" },
  tiktok: { hosts: ["tiktok.com"], label: "a tiktok.com" },
}

function matchesHost(hostname: string, hosts: string[]) {
  return hosts.some((h) => hostname === h || hostname.endsWith(`.${h}`))
}

export type Embed = { src: string; height: number }

const SPOTIFY_TYPES = new Set(["artist", "album", "track", "playlist", "episode", "show"])

function parseHttps(raw: string): URL | null {
  try {
    const url = new URL(raw.trim())
    return url.protocol === "https:" ? url : null
  } catch {
    return null
  }
}

export function spotifyEmbed(raw: string): Embed | null {
  const url = parseHttps(raw)
  if (!url || url.hostname !== "open.spotify.com") return null
  const parts = url.pathname.split("/").filter((p) => p && !p.startsWith("intl-") && p !== "embed")
  const [type, id] = parts
  if (!type || !SPOTIFY_TYPES.has(type) || !id || !/^[A-Za-z0-9]{10,40}$/.test(id)) return null
  return { src: `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`, height: 152 }
}

export function appleMusicEmbed(raw: string): Embed | null {
  const url = parseHttps(raw)
  if (!url || (url.hostname !== "music.apple.com" && url.hostname !== "embed.music.apple.com")) return null
  if (url.pathname.split("/").filter(Boolean).length < 3) return null
  const song = url.searchParams.get("i")
  const query = song && /^\d+$/.test(song) ? `?i=${song}` : ""
  return { src: `https://embed.music.apple.com${url.pathname}${query}`, height: 175 }
}

/** Returns the cleaned URL, `""` to clear the link, or an error message. */
export function validateArtistLink(kind: ArtistLinkKind, raw: string): { url: string } | { error: string } {
  const value = String(raw ?? "").trim()
  if (!value) return { url: "" }
  if (value.length > 500) return { error: "That link is too long." }
  if (kind === "spotify") {
    return spotifyEmbed(value)
      ? { url: value }
      : { error: "Use an open.spotify.com link to an artist, album, track or playlist." }
  }
  if (kind === "apple_music") {
    return appleMusicEmbed(value)
      ? { url: value }
      : { error: "Use a music.apple.com link to an artist, album, song or playlist." }
  }
  const url = parseHttps(value)
  if (kind === "instagram" || kind === "youtube" || kind === "tiktok") {
    const rule = SOCIAL_HOSTS[kind]
    return url && matchesHost(url.hostname, rule.hosts)
      ? { url: value }
      : { error: `Use ${rule.label} link to your profile.` }
  }
  return url ? { url: value } : { error: "Use a full https:// link." }
}
