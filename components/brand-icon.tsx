import { cn } from '@/lib/utils'
import type { SocialLinkKind } from '@/lib/artist-links-types'

export const SOCIAL_LABELS: Record<SocialLinkKind, string> = {
  instagram: 'Instagram',
  youtube: 'YouTube',
  tiktok: 'TikTok',
}

/** Single-colour brand mark that follows the current text colour. */
export function BrandIcon({ kind, className }: { kind: SocialLinkKind; className?: string }) {
  const mask = `url(/brands/${kind}.svg) center / contain no-repeat`
  return (
    <span
      aria-hidden="true"
      className={cn('inline-block size-5 shrink-0 bg-current', className)}
      style={{ mask, WebkitMask: mask }}
    />
  )
}
