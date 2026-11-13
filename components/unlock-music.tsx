import type { BrandIconName } from '@/components/brand-icons'
import { ReleaseCard } from '@/components/release-card'
import type { ArtistLinks } from '@/lib/artist-links-types'
import type { LatestRelease } from '@/lib/latest-release'

export function hasArtistMusic(links: ArtistLinks) {
  return Boolean(links.spotify || links.apple_music || links.all_music)
}

const PLATFORMS: { kind: BrandIconName; label: string }[] = [
  { kind: 'spotify', label: 'Spotify' },
  { kind: 'apple_music', label: 'Apple Music' },
  { kind: 'youtube', label: 'YouTube' },
]

export function UnlockMusic({ links, release }: { links: ArtistLinks; release: LatestRelease | null }) {
  return (
    <ReleaseCard
      headingId="release-title"
      eyebrow={release?.isNew ? 'Out now' : 'Latest drop'}
      title={release?.title ?? 'ItzEmo'}
      artist={release?.artist ?? 'ItzEmo'}
      artworkUrl={release?.artworkUrl ?? null}
      previewUrl={release?.previewUrl ?? null}
      streamUrl={links.all_music ?? links.spotify ?? release?.url ?? links.apple_music}
      platforms={PLATFORMS.flatMap((p) => (links[p.kind] ? [{ ...p, url: links[p.kind]! }] : []))}
    />
  )
}
