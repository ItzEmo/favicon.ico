import "server-only"

import type { BrandIconName } from "@/components/brand-icons"
import { musicLinkLabel, musicLinkSource, type MusicLink } from "@/lib/music-links"

export type ResolvedMusicLink = {
  url: string
  title: string
  artist: string
  artworkUrl: string | null
  previewUrl: string | null
  isNew: boolean
  platform: { kind: BrandIconName; label: string } | null
}

type ItunesItem = {
  wrapperType?: string
  trackName?: string
  collectionName?: string
  artistName?: string
  artworkUrl100?: string
  previewUrl?: string
  releaseDate?: string
}

type Metadata = { title?: string; artist?: string; artworkUrl?: string; previewUrl?: string; releaseDate?: string }

const NEW_WINDOW_MS = 30 * 24 * 60 * 60 * 1000
const CACHE = { next: { revalidate: 3600 } } as const

const bigArtwork = (url?: string) => url?.replace(/\/\d+x\d+bb\./, "/600x600bb.")
const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[([].*?[)\]]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { ...CACHE, signal: AbortSignal.timeout(4000) })
    return res.ok ? ((await res.json()) as T) : null
  } catch {
    return null
  }
}

async function appleMetadata(rawUrl: string): Promise<Metadata | null> {
  const url = new URL(rawUrl)
  const trackId = url.searchParams.get("i") ?? url.pathname.match(/\/song\/(?:[^/]+\/)?(\d+)/)?.[1]
  const albumId = url.pathname.match(/\/album\/(?:[^/]+\/)?(\d+)/)?.[1]
  const id = trackId ?? albumId
  if (!id) return null

  const data = await getJson<{ results: ItunesItem[] }>(`https://itunes.apple.com/lookup?id=${id}&entity=song&limit=1`)
  const [first, ...rest] = data?.results ?? []
  if (!first) return null
  const withPreview = [first, ...rest].find((r) => r.previewUrl)
  return {
    title: trackId ? first.trackName : (first.collectionName ?? first.trackName)?.replace(/\s+-\s+(Single|EP)$/i, ""),
    artist: first.artistName,
    artworkUrl: bigArtwork(first.artworkUrl100),
    previewUrl: withPreview?.previewUrl,
    releaseDate: first.releaseDate,
  }
}

async function oembedMetadata(endpoint: string, rawUrl: string): Promise<Metadata | null> {
  const data = await getJson<{ title?: string; author_name?: string; thumbnail_url?: string }>(
    `${endpoint}?url=${encodeURIComponent(rawUrl)}&format=json`,
  )
  if (!data) return null
  return { title: data.title, artist: data.author_name, artworkUrl: data.thumbnail_url }
}

/** Finds a 30s iTunes preview for a song only identified by name (Spotify/YouTube links). */
async function findItunesPreview(title: string, artist: string): Promise<ItunesItem | null> {
  const wanted = normalize(title)
  if (!wanted) return null
  const data = await getJson<{ results: ItunesItem[] }>(
    `https://itunes.apple.com/search?entity=song&limit=10&term=${encodeURIComponent(`${title} ${artist}`)}`,
  )
  const artistKey = normalize(artist)
  return (
    data?.results.find((r) => {
      if (!r.previewUrl || !r.trackName) return false
      const name = normalize(r.trackName)
      const by = normalize(r.artistName ?? "")
      const titleMatches = name === wanted || wanted.includes(name)
      const artistMatches = !artistKey || by.includes(artistKey) || artistKey.includes(by) || wanted.includes(by)
      return titleMatches && artistMatches
    }) ?? null
  )
}

const PLATFORM: Partial<Record<ReturnType<typeof musicLinkSource>, BrandIconName>> = {
  spotify: "spotify",
  apple: "apple_music",
  youtube: "youtube",
}

export async function resolveMusicLink(link: MusicLink, ownerName: string): Promise<ResolvedMusicLink> {
  const source = musicLinkSource(link.url)
  let meta: Metadata | null = null
  try {
    if (source === "apple") meta = await appleMetadata(link.url)
    else if (source === "spotify") meta = await oembedMetadata("https://open.spotify.com/oembed", link.url)
    else if (source === "youtube") meta = await oembedMetadata("https://www.youtube.com/oembed", link.url)
    else if (source === "soundcloud") meta = await oembedMetadata("https://soundcloud.com/oembed", link.url)
  } catch {
    meta = null
  }

  const userTitled = link.title && link.title !== musicLinkLabel(link.url)
  const title = (userTitled ? link.title : meta?.title) || link.title
  // Spotify's oEmbed has no artist; YouTube's author is the channel, which is usually the artist.
  const artist = (source === "spotify" ? undefined : meta?.artist?.replace(/\s+-\s+Topic$/, "")) || ownerName

  if (!meta?.previewUrl && source !== "apple") {
    const match = await findItunesPreview(meta?.title ?? title, artist)
    if (match) {
      meta = {
        ...meta,
        previewUrl: match.previewUrl,
        artworkUrl: meta?.artworkUrl ?? bigArtwork(match.artworkUrl100),
        releaseDate: match.releaseDate,
      }
    }
  }

  const kind = PLATFORM[source]
  return {
    url: link.url,
    title,
    artist,
    artworkUrl: meta?.artworkUrl ?? null,
    previewUrl: meta?.previewUrl ?? null,
    isNew: meta?.releaseDate ? Date.now() - Date.parse(meta.releaseDate) < NEW_WINDOW_MS : false,
    platform: kind ? { kind, label: musicLinkLabel(link.url) } : null,
  }
}
