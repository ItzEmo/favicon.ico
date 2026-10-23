import type { Metadata } from "next"
import { Rss, Star, UploadCloud, Swords, Zap, Radio } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { getFeed, type FeedType } from "@/lib/feed"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Feed",
  description: "Live activity from the Emo's Radio queue and Arena — drops, boosts, ratings, and battles.",
}

const ICONS: Record<FeedType, LucideIcon> = {
  submit: UploadCloud,
  boost: Zap,
  play: Radio,
  rating: Star,
  battle: Swords,
}

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto", style: "short" })

function timeAgo(iso: string): string {
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000)
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ]
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit)
  }
  return "just now"
}

export default async function FeedPage() {
  const feed = await getFeed()

  return (
    <>
      <PageHeader
        icon={Rss}
        eyebrow="Live activity"
        title="The"
        accent="Feed"
        description="Everything happening in the Queue and the Arena — drops, boosts, ratings, and battles."
      />

      <section className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
        {feed.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            {"Nothing yet. Activity shows up here as soon as tracks hit the queue or the Arena opens a matchup."}
          </p>
        ) : (
          <ol className="flex flex-col gap-3">
            {feed.map((item) => {
              const Icon = ICONS[item.type]
              return (
                <li
                  key={item.id}
                  className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/50"
                >
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground text-pretty">
                      <span className="font-semibold">{item.actor}</span>{" "}
                      <span className="text-muted-foreground">{item.text}</span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      <time dateTime={item.at}>{timeAgo(item.at)}</time>
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </section>
    </>
  )
}
