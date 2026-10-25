import Link from "next/link"
import { cn } from "@/lib/utils"

interface ArtistNameProps {
  name: string
  userId?: string | null
  className?: string
}

/** The artist's name, linked to their public profile when the submission belongs to an account. */
export function ArtistName({ name, userId, className }: ArtistNameProps) {
  if (!userId) return <span className={className}>{name}</span>
  return (
    <Link
      href={`/artists/${userId}`}
      className={cn(
        "underline decoration-transparent underline-offset-4 transition-colors hover:text-primary hover:decoration-current focus-visible:text-primary focus-visible:decoration-current focus-visible:outline-none",
        className,
      )}
    >
      {name}
    </Link>
  )
}
