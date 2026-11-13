import "server-only"

export type LatestRelease = {
  title: string
  artist: string
  artworkUrl: string
  url: string
  previewUrl: string | null
  isNew: boolean
}

export type ArtistSong = {
  id: string
  title: string
  collection: string
  artist: string
  artworkUrl: string
  previewUrl: string | null
  url: string
  releaseDate: string
}

type ItunesTrack = {
  wrapperType: string
  trackId?: number
  trackName?: string
  trackNumber?: number
  collectionId?: number
  collectionName?: string
  artistName?: string
  artworkUrl100?: string
  previewUrl?: string
  trackViewUrl?: string
  releaseDate?: string
}

const NEW_WINDOW_MS = 30 * 24 * 60 * 60 * 1000

function appleArtistId(url: string | undefined) {
  if (!url) return null
  return url.match(/\/artist\/[^/]+\/(\d+)/)?.[1] ?? null
}

function cleanUrl(raw: string) {
  const url = new URL(raw)
  url.searchParams.delete("uo")
  return url.toString()
}

const stripKind = (name: string) => name.replace(/\s+-\s+(Single|EP)$/i, "")

/** Every song on the artist's Apple Music page (newest first), via the public iTunes lookup API. */
export async function getArtistSongs(appleMusicUrl: string | undefined): Promise<ArtistSong[]> {
  const id = appleArtistId(appleMusicUrl)
  if (!id) return []

  const res = await fetch(`https://itunes.apple.com/lookup?id=${id}&entity=song&limit=200`, {
    next: { revalidate: 3600 },
  })
  if (!res.ok) return []

  const { results } = (await res.json()) as { results: ItunesTrack[] }
  const seen = new Set<string>()
  return results
    .filter((t) => t.wrapperType === "track" && t.trackId && t.trackName && t.artworkUrl100 && t.releaseDate)
    .sort((a, b) => Date.parse(b.releaseDate!) - Date.parse(a.releaseDate!) || (a.trackNumber ?? 0) - (b.trackNumber ?? 0))
    .map((t) => ({
      id: String(t.trackId),
      title: t.trackName!,
      collection: stripKind(t.collectionName ?? t.trackName!),
      artist: t.artistName ?? "ItzEmo",
      artworkUrl: t.artworkUrl100!.replace(/\/\d+x\d+bb\./, "/600x600bb."),
      previewUrl: t.previewUrl ?? null,
      url: cleanUrl(t.trackViewUrl ?? appleMusicUrl!),
      releaseDate: t.releaseDate!,
    }))
    .filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true)))
}

/** The admin-picked song, or the newest release when none is picked. */
export async function getFeaturedRelease(
  appleMusicUrl: string | undefined,
  featuredTrackId: string | null,
): Promise<LatestRelease | null> {
  const songs = await getArtistSongs(appleMusicUrl)
  if (songs.length === 0) return null

  const picked = featuredTrackId ? songs.find((s) => s.id === featuredTrackId) : undefined
  const song = picked ?? songs.find((s) => s.previewUrl) ?? songs[0]

  return {
    title: picked ? song.title : song.collection,
    artist: song.artist,
    artworkUrl: song.artworkUrl,
    url: song.url,
    previewUrl: song.previewUrl,
    isNew: Date.now() - Date.parse(song.releaseDate) < NEW_WINDOW_MS,
  }
}
