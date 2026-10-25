import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowUpRight, ChevronLeft, Disc3 } from "lucide-react"
import { getPublicProfile } from "@/lib/account"
import { musicLinkLabel } from "@/lib/music-links"
import { appleMusicEmbed, spotifyEmbed } from "@/lib/artist-links-types"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const profile = await getPublicProfile(id)
  if (!profile) return { title: "Artist not found" }
  return {
    title: profile.name,
    description: `${profile.name} on Emo's Radio — released music, Instagram and queue stats.`,
  }
}

function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  )
}

function initialsOf(name: string) {
  const parts = name.trim().split(/[\s_.-]+/).filter(Boolean)
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).toUpperCase()
}

export default async function ArtistProfilePage({ params }: Props) {
  const { id } = await params
  const profile = await getPublicProfile(id)
  if (!profile) notFound()

  const { stats } = profile
  const statItems = [
    { label: "Submitted", value: stats.submissions.toString() },
    { label: "Avg Score", value: stats.avgScore != null ? stats.avgScore.toFixed(1) : "—" },
    { label: "Rank", value: stats.rank != null ? `#${stats.rank}` : "Unranked" },
  ]
  const joined = new Date(profile.joinedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href="/queue"
        className="inline-flex w-fit items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        Back to the queue
      </Link>

      <header className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card/80 p-6 text-center sm:p-10">
        <div className="size-28 overflow-hidden rounded-full ring-2 ring-primary ring-offset-4 ring-offset-card">
          {profile.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- avatar hosts vary
            <img src={profile.image} alt="" referrerPolicy="no-referrer" className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center bg-primary text-4xl font-extrabold text-primary-foreground">
              {initialsOf(profile.name)}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-balance text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {profile.name}
          </h1>
          <p className="text-sm text-muted-foreground">On Emo&apos;s Radio since {joined}</p>
        </div>
        {profile.instagram ? (
          <a
            href={`https://instagram.com/${profile.instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <InstagramGlyph className="size-4" />@{profile.instagram}
          </a>
        ) : (
          <p className="text-sm text-muted-foreground">No Instagram linked</p>
        )}

        <dl className="mt-2 grid w-full grid-cols-3 gap-2 border-t border-border pt-5">
          {statItems.map((s) => (
            <div key={s.label} className="flex flex-col gap-1">
              <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{s.label}</dt>
              <dd className="text-xl font-extrabold text-foreground">{s.value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <section aria-labelledby="releases-heading" className="flex flex-col gap-4">
        <h2 id="releases-heading" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
          <Disc3 className="size-4" aria-hidden="true" />
          Released Music
        </h2>
        {profile.musicLinks.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-10 text-center text-sm text-muted-foreground">
            {profile.name} hasn&apos;t added any releases yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {profile.musicLinks.map((link) => {
              const embed = spotifyEmbed(link.url) ?? appleMusicEmbed(link.url)
              return (
                <li key={link.url} className="flex flex-col gap-3 rounded-2xl border border-border bg-card/80 p-4">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between gap-3"
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-semibold text-foreground group-hover:text-primary">{link.title}</span>
                      <span className="text-xs text-muted-foreground">{musicLinkLabel(link.url)}</span>
                    </span>
                    <ArrowUpRight
                      className="size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
                      aria-hidden="true"
                    />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                  {embed ? (
                    <iframe
                      src={embed.src}
                      height={embed.height}
                      title={`${link.title} player`}
                      loading="lazy"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      className="w-full rounded-xl border-0"
                    />
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </main>
  )
}
