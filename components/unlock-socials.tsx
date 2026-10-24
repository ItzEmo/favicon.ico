import { ArrowUpRight } from 'lucide-react'
import { BrandIcon, SOCIAL_LABELS } from '@/components/brand-icon'
import type { SocialLinkKind } from '@/lib/artist-links-types'

const TAGLINES: Record<SocialLinkKind, string> = {
  tiktok: 'Catch the live reviews',
  instagram: 'Behind the booth',
  youtube: 'Full sessions & replays',
}

function handleFromUrl(url: string) {
  try {
    const first = new URL(url).pathname.split('/').filter(Boolean)[0]
    if (!first) return null
    return first.startsWith('@') ? first : `@${first}`
  } catch {
    return null
  }
}

export function UnlockSocials({ socials }: { socials: { kind: SocialLinkKind; url: string }[] }) {
  return (
    <nav aria-label="Emo on social media" className="flex w-full flex-col gap-3">
      {socials.map(({ kind, url }, i) => {
        const handle = handleFromUrl(url)
        return (
          <a
            key={kind}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`social-pill social-pill--${kind}`}
            style={{ animationDelay: `${0.25 + i * 0.12}s` }}
          >
            <span className="social-pill__badge">
              <BrandIcon kind={kind} className="size-5" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col text-left">
              <span className="social-pill__label">
                {SOCIAL_LABELS[kind]}
                {handle && <span className="social-pill__handle">{handle}</span>}
              </span>
              <span className="truncate text-xs text-foreground/65">{TAGLINES[kind]}</span>
            </span>
            <span className="social-pill__cta">
              Follow
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </span>
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        )
      })}
    </nav>
  )
}
