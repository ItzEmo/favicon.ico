import "server-only"

export type LatestRelease = {
  title: string
  artist: string
  artworkUrl: string
  url: string
  isNew: boolean
}

type ItunesCollection = {
  wrapperType: string
  collectionName?: string
  artistName?: string
  artworkUrl100?: string
  collectionViewUrl?: string
  releaseDate?: string
}

const NEW_WINDOW_MS = 30 * 24 * 60 * 60 * 1000

function appleArtistId(url: string | undefined) {
  if (!url) return null
  const match = url.match(/\/artist\/[^/]+\/(\d+)/)
  return match?.[1] ?? null
}

/** Newest release on the artist's Apple Music page, via the public iTunes lookup API. */
export async function getLatestRelease(appleMusicUrl: string | undefined): Promise<LatestRelease | null> {
  const id = appleArtistId(appleMusicUrl)
  if (!id) return null

  const res = await fetch(`https://itunes.apple.com/lookup?id=${id}&entity=album&sort=recent&limit=10`, {
    next: { revalidate: 3600 },
  })
  if (!res.ok) return null

  const { results } = (await res.json()) as { results: ItunesCollection[] }
  const latest = results
    .filter((r) => r.wrapperType === "collection" && r.collectionName && r.artworkUrl100 && r.releaseDate)
    .sort((a, b) => Date.parse(b.releaseDate!) - Date.parse(a.releaseDate!))[0]
  if (!latest) return null

  const url = new URL(latest.collectionViewUrl ?? appleMusicUrl!)
  url.searchParams.delete("uo")

  return {
    title: latest.collectionName!.replace(/\s+-\s+(Single|EP)$/i, ""),
    artist: latest.artistName ?? "ItzEmo",
    artworkUrl: latest.artworkUrl100!.replace(/\/\d+x\d+bb\./, "/600x600bb."),
    url: url.toString(),
    isNew: Date.now() - Date.parse(latest.releaseDate!) < NEW_WINDOW_MS,
  }
}
