import type { CSSProperties } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Modak } from "next/font/google"
import { ArrowUpRight } from "lucide-react"
import { getLinkPage } from "@/lib/account"
import { glassFont } from "@/lib/glass-font"
import { LINK_ACCENTS, LINK_BACKGROUNDS } from "@/lib/link-page"
import { musicLinkLabel } from "@/lib/music-links"
import { appleMusicEmbed, spotifyEmbed } from "@/lib/artist-links-types"
import { RainBackdrop } from "@/components/rain-backdrop"
import { ShareLinkButton } from "@/components/share-link-button"

// Closest web font to the bubble lettering in the Emo's Radio logo.
const bubbleFont = Modak({ weight: "400", subsets: ["latin"] })

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ handle: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params
  const page = await getLinkPage(handle)
  if (!page) return { title: "Link not found" }
  const description = page.link.bio || `${page.name} on Emo's Radio — music, Instagram and queue stats.`
  return {
    title: page.name,
    description,
    openGraph: { title: `${page.name} — Emo's Radio`, description, images: page.image ? [page.image] : undefined },
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

const glass =
  "rounded-2xl border border-foreground/15 bg-background/45 backdrop-blur-md transition-colors hover:border-primary/70 hover:bg-background/60"

export default async function LinkPage({ params }: Props) {
  const { handle } = await params
  const page = await getLinkPage(handle)
  if (!page) notFound()

  const { link, stats } = page
  const accent = LINK_ACCENTS[link.accent]
  const backgroundSrc =
    link.background === "custom" && link.backgroundImage
      ? link.backgroundImage
      : LINK_BACKGROUNDS[link.background === "custom" ? "rain" : link.background].src
  const statItems = [
    { label: "Submitted", value: stats.submissions.toString(), hidden: link.hideSubmissions },
    { label: "Avg Score", value: stats.avgScore != null ? stats.avgScore.toFixed(1) : "—", hidden: link.hideAvgScore },
    { label: "Rank", value: stats.rank != null ? `#${stats.rank}` : "—", hidden: link.hideRank },
  ].filter((s) => !s.hidden)
  const statCols = ["", "grid-cols-1", "grid-cols-2", "grid-cols-3"][statItems.length]

  return (
    <div
      className="fixed inset-0 z-[90] overflow-hidden bg-background"
      style={{ "--primary": accent.color, "--primary-foreground": accent.foreground } as CSSProperties}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- user uploads are served from our own route */}
      <img
        src={backgroundSrc}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        className="absolute inset-0 size-full object-cover"
      />
      {link.rain && <RainBackdrop />}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/20 to-background/90" />

      <div className="relative h-full overflow-y-auto overscroll-contain">
        <div className="mx-auto flex min-h-full w-full max-w-md flex-col items-center gap-7 px-5 pt-14 pb-10 sm:pt-20">
          <ShareLinkButton title={`${page.name} on Emo's Radio`} className="absolute top-4 right-4" />

          <header className="flex flex-col items-center gap-4 text-center">
            {link.headerStyle === "avatar" && (
              <div className="size-28 overflow-hidden rounded-full ring-2 ring-primary ring-offset-4 ring-offset-transparent shadow-[0_0_40px_var(--primary)]">
                {page.image ? (
                  // eslint-disable-next-line @next/next/no-img-element -- avatar hosts vary
                  <img src={page.image} alt="" referrerPolicy="no-referrer" className="size-full object-cover" />
                ) : (
                  <span className="flex size-full items-center justify-center bg-primary text-4xl font-extrabold text-primary-foreground">
                    {initialsOf(page.name)}
                  </span>
                )}
              </div>
            )}
            <div className="flex flex-col gap-1">
              {link.headerStyle === "name" ? (
                <h1
                  className={`${bubbleFont.className} max-w-full text-balance break-words text-7xl leading-[0.85] text-foreground/90 uppercase sm:text-8xl [-webkit-text-stroke:2px_var(--foreground)] [text-shadow:0_0_2px_var(--foreground),0_4px_24px_var(--primary),0_2px_16px_var(--background)]`}
                >
                  {page.name}
                </h1>
              ) : link.headerStyle === "glass" ? (
                <h1
                  className={`${glassFont.className} glass-text max-w-full text-balance break-words text-6xl leading-none font-bold uppercase sm:text-7xl`}
                >
                  {page.name}
                </h1>
              ) : (
                <h1 className="text-balance text-4xl font-extrabold tracking-tight text-foreground [text-shadow:0_2px_16px_var(--background)]">
                  {page.name}
                </h1>
              )}
              <p className="text-sm font-semibold text-primary [text-shadow:0_1px_8px_var(--background)]">@{link.handle}</p>
            </div>
            {link.bio && (
              <p className="max-w-xs text-pretty text-sm leading-relaxed text-foreground/85 [text-shadow:0_1px_8px_var(--background)]">
                {link.bio}
              </p>
            )}
          </header>

          {statItems.length > 0 && (
            <dl className={`grid w-full ${statCols} divide-x divide-foreground/10 py-3 ${glass} hover:border-foreground/15 hover:bg-background/45`}>
              {statItems.map((s) => (
                <div key={s.label} className="flex flex-col items-center gap-0.5">
                  <dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/60">{s.label}</dt>
                  <dd className="text-lg font-extrabold text-foreground">{s.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <nav aria-label={`${page.name}'s links`} className="flex w-full flex-col gap-3">
            {page.instagram && (
              <a
                href={`https://instagram.com/${page.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-14 items-center gap-3 rounded-full bg-primary px-5 font-bold text-primary-foreground shadow-[0_0_24px_var(--primary)] transition-opacity hover:opacity-90"
              >
                <InstagramGlyph className="size-5" />
                <span className="flex-1 truncate">@{page.instagram}</span>
                <ArrowUpRight className="size-4" aria-hidden="true" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            )}

            {link.customLinks.map((item, index) => (
              <a
                key={`${item.url}-${index}`}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex h-14 items-center gap-3 px-5 ${glass}`}
              >
                <span className="flex-1 truncate text-center font-semibold text-foreground group-hover:text-primary">
                  {item.title}
                </span>
                <ArrowUpRight className="size-4 shrink-0 text-foreground/60 group-hover:text-primary" aria-hidden="true" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            ))}

            {page.musicLinks.map((item) => {
              const embed = spotifyEmbed(item.url) ?? appleMusicEmbed(item.url)
              return (
                <div key={item.url} className={`flex flex-col gap-3 p-3 ${glass}`}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between gap-3 px-2"
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-semibold text-foreground group-hover:text-primary">{item.title}</span>
                      <span className="text-xs text-foreground/60">{musicLinkLabel(item.url)}</span>
                    </span>
                    <ArrowUpRight className="size-5 shrink-0 text-foreground/60 group-hover:text-primary" aria-hidden="true" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                  {embed && (
                    <iframe
                      src={embed.src}
                      height={embed.height}
                      title={`${item.title} player`}
                      loading="lazy"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      className="w-full rounded-xl border-0"
                    />
                  )}
                </div>
              )
            })}

            {!page.instagram && page.musicLinks.length === 0 && link.customLinks.length === 0 && (
              <p className={`px-6 py-8 text-center text-sm text-foreground/70 ${glass}`}>
                {page.name} hasn&apos;t added any links yet.
              </p>
            )}
          </nav>

          <Link
            href="/"
            className="mt-auto flex flex-col items-center gap-2 pt-6 text-xs uppercase tracking-[0.25em] text-foreground/60 transition-colors hover:text-foreground"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- static brand asset */}
            <img src="/images/emos-radio-logo.webp" alt="" width={1117} height={702} className="glass-logo h-auto w-28" />
            Get heard on Emo&apos;s Radio
          </Link>
        </div>
      </div>
    </div>
  )
}
