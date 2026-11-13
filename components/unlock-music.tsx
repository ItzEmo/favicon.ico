import { Play } from 'lucide-react'
import { BrandIcon, type BrandIconName } from '@/components/brand-icons'
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
  const fullTitle = release?.title ?? 'ItzEmo'
  const featMatch = fullTitle.match(/^(.*?)\s*[([]\s*(feat\.?|ft\.?|with)\s+([^)\]]+)[)\]]\s*$/i)
  const title = featMatch ? featMatch[1] : fullTitle
  const featuring = featMatch?.[3]
  const artist = release?.artist ?? 'ItzEmo'
  const titleSize = title.length > 12 ? 'text-4xl' : 'text-5xl'
  const streamUrl = links.all_music ?? links.spotify ?? release?.url ?? links.apple_music
  const platforms = PLATFORMS.filter((p) => links[p.kind])

  return (
    <section aria-labelledby="release-title" className="release-card w-full max-w-sm">
      <div className="release-card__frame flex flex-col gap-5 p-5">
        <div className="release-card__stage relative flex items-center">
          <div className="release-card__vinyl" aria-hidden="true">
            <span className="release-card__label" style={release ? { backgroundImage: `url(${release.artworkUrl})` } : undefined} />
          </div>
          <div className="release-card__cover relative aspect-square w-[62%] overflow-hidden rounded-lg">
            {release ? (
              <img
                src={release.artworkUrl}
                alt={`${title} cover art`}
                width={600}
                height={600}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-background/60 font-black uppercase italic text-foreground/70">
                Emo&apos;s Radio
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-3 font-mono text-[11px] font-bold uppercase tracking-[0.35em] text-foreground">
            <span className="submit-cta__onair" aria-hidden="true" />
            {release?.isNew ? 'Out now' : 'Latest drop'}
            <span className="h-px flex-1 bg-foreground/40" aria-hidden="true" />
          </p>
          <h2
            id="release-title"
            className={`submit-cta__chrome ${titleSize} leading-[0.9] font-black uppercase italic tracking-tight text-balance break-words`}
          >
            {title}
          </h2>
          <p className="text-sm font-semibold uppercase tracking-[0.45em] text-foreground/80">
            {artist}
            {featuring && <span className="block pt-1 text-xs tracking-[0.3em] text-foreground/60">feat. {featuring}</span>}
          </p>
        </div>

        {streamUrl && (
          <a
            href={streamUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="release-card__stream group flex items-center rounded-full py-3 pr-6 pl-5 outline-none focus-visible:ring-2 focus-visible:ring-foreground"
          >
            <Play className="size-5 fill-current transition-transform group-hover:scale-110" aria-hidden="true" />
            <span className="mx-4 h-6 w-px bg-foreground/30" aria-hidden="true" />
            <span className="flex-1 truncate text-center text-sm font-bold uppercase tracking-[0.25em]">
              {title.length > 12 ? 'Stream now' : `Stream ${title}`}
            </span>
          </a>
        )}

        {platforms.length > 0 && (
          <ul className="flex items-center gap-1" aria-label="Listen on">
            {platforms.map((p) => (
              <li key={p.kind} className="flex items-center gap-1 after:h-6 after:w-px after:bg-foreground/20 after:content-['']">
                <a
                  href={links[p.kind]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex size-11 items-center justify-center rounded-full text-foreground/85 outline-none transition-colors hover:text-accent focus-visible:ring-2 focus-visible:ring-foreground"
                >
                  <BrandIcon name={p.kind} className="size-6" />
                  <span className="sr-only">{p.label}</span>
                </a>
              </li>
            ))}
            <li className="ml-2 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-foreground/70">
              All platforms
            </li>
          </ul>
        )}
      </div>
    </section>
  )
}
