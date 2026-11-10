import Link from "next/link"
import { Crown } from "lucide-react"
import { cn } from "@/lib/utils"

interface ArtistNameProps {
  name: string
  userId?: string | null
  crowned?: boolean
  className?: string
}

export function CrownBadge({ className }: { className?: string }) {
  return (
    <Crown
      className={cn("inline size-3.5 shrink-0 fill-amber-400 text-amber-500 align-[-0.15em]", className)}
      aria-label="Crowned artist"
      role="img"
    />
  )
}

/** The artist's name, linked to their public profile when the submission belongs to an account. */
export function ArtistName({ name, userId, crowned, className }: ArtistNameProps) {
  const label = (
    <>
      {crowned ? <CrownBadge className="mr-1" /> : null}
      {name}
    </>
  )
  if (!userId) return <span className={className}>{label}</span>
  return (
    <Link
      href={`/artists/${userId}`}
      className={cn(
        "underline decoration-transparent underline-offset-4 transition-colors hover:text-primary hover:decoration-current focus-visible:text-primary focus-visible:decoration-current focus-visible:outline-none",
        className,
      )}
    >
      {label}
    </Link>
  )
}
