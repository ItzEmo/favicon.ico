import { BrandIcon, SOCIAL_LABELS } from '@/components/brand-icon'
import type { SocialLinkKind } from '@/lib/artist-links-types'

export function UnlockSocials({ socials }: { socials: { kind: SocialLinkKind; url: string }[] }) {
  return (
    <nav aria-label="Emo on social media">
      <ul className="flex items-center justify-center gap-3">
        {socials.map(({ kind, url }, i) => (
          <li key={kind}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              title={SOCIAL_LABELS[kind]}
              className={`social-icon social-pill--${kind}`}
              style={{ animationDelay: `${0.25 + i * 0.1}s` }}
            >
              <BrandIcon kind={kind} className="size-5" />
              <span className="sr-only">{SOCIAL_LABELS[kind]} (opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
