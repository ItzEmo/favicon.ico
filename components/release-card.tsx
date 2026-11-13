import { Play } from 'lucide-react'
import { BrandIcon, type BrandIconName } from '@/components/brand-icons'
import { ReleaseCoverPlayer } from '@/components/release-cover-player'

export type ReleasePlatform = { kind: BrandIconName; label: string; url: string }

export function ReleaseCard({
  headingId,
  eyebrow,
  title: fullTitle,
  artist,
  artworkUrl,
  previewUrl,
  streamUrl,
  platforms,
}: {
  headingId: string
  eyebrow: string
  title: string
  artist: string
  artworkUrl: string | null
  previewUrl: string | null
  streamUrl: string | undefined
  platforms: ReleasePlatform[]
}) {
  const featMatch = fullTitle.match(/^(.*?)\s*[([]\s*(feat\.?|ft\.?|with)\s+([^)\]]+)[)\]]\s*$/i)
  const title = featMatch ? featMatch[1] : fullTitle
  const featuring = featMatch?.[3]
  const titleSize = title.length > 12 ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'

  return (
    <section aria-labelledby={headingId} className="release-card w-full">
      <div className="release-card__frame flex items-center gap-4 p-4">
        <div className="w-32 shrink-0 sm:w-40">
          <ReleaseCoverPlayer title={title} artworkUrl={artworkUrl} previewUrl={previewUrl} />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <p className="flex items-center gap-3 font-mono text-[11px] font-bold uppercase tracking-[0.35em] text-foreground">
              <span className="submit-cta__onair" aria-hidden="true" />
              {eyebrow}
              <span className="h-px flex-1 bg-foreground/40" aria-hidden="true" />
            </p>
            <h2
              id={headingId}
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
              className="release-card__stream group flex items-center rounded-full py-2 pr-4 pl-4 outline-none focus-visible:ring-2 focus-visible:ring-foreground"
            >
              <Play className="size-4 fill-current transition-transform group-hover:scale-110" aria-hidden="true" />
              <span className="mx-3 h-5 w-px bg-foreground/30" aria-hidden="true" />
              <span className="flex-1 truncate text-center text-xs font-bold uppercase tracking-[0.2em]">
                {title.length > 8 ? 'Stream now' : `Stream ${title}`}
              </span>
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          )}

          {platforms.length > 0 && (
            <ul className="flex items-center gap-1" aria-label="Listen on">
              {platforms.map((p) => (
                <li key={p.kind} className="flex items-center gap-1 after:h-6 after:w-px after:bg-foreground/20 after:content-['']">
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex size-9 items-center justify-center rounded-full text-foreground/85 outline-none transition-colors hover:text-accent focus-visible:ring-2 focus-visible:ring-foreground"
                  >
                    <BrandIcon name={p.kind} className="size-5" />
                    <span className="sr-only">{p.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
