import Link from "next/link"
import { ListMusic } from "lucide-react"
import { HomeHero } from "@/components/home-hero"
import { Marquee } from "@/components/marquee"
import { CommunityCta } from "@/components/community-cta"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { connection } from "next/server"
import { formatStat, getHomeStats } from "@/lib/stats"

export default async function Page() {
  await connection()
  const { tracksReviewed, arenaBattles } = await getHomeStats()

  const STATS = [
    { value: formatStat(tracksReviewed), label: "Tracks Reviewed" },
    { value: "3.1K", label: "Active Artists" },
    { value: formatStat(arenaBattles), label: "Arena Battles" },
    { value: "96", label: "Realms Created" },
  ]

  return (
    <>
      <HomeHero />

      <Marquee />

      {/* Stats */}
      <section
        aria-label="Platform stats"
        className="mx-auto grid max-w-4xl grid-cols-2 gap-4 px-4 py-12 sm:grid-cols-4 sm:px-6"
      >
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card/50 px-4 py-6 text-center"
          >
            <span className="text-2xl font-extrabold text-primary sm:text-3xl">{stat.value}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</span>
          </div>
        ))}
      </section>

      {/* Live queue link */}
      <section className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 px-4 pb-16 text-center sm:px-6">
        <h2 className="text-xl font-extrabold uppercase tracking-tight text-foreground">The queue is live</h2>
        <p className="text-sm text-muted-foreground text-pretty">
          See every track in line right now — free, skip, and skip+ submissions updating in real time.
        </p>
        <Link
          href="/queue"
          className={cn(
            buttonVariants({ size: "lg" }),
            "h-12 rounded-full px-8 text-sm font-bold uppercase tracking-wider shadow-lg shadow-primary/25",
          )}
        >
          <ListMusic className="size-4" aria-hidden="true" />
          View the Queue
        </Link>
      </section>

      <CommunityCta />
    </>
  )
}
