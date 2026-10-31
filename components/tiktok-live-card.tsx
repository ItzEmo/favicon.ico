"use client"

import useSWR from "swr"
import { ArrowUpRight } from "lucide-react"
import { BrandIcon } from "@/components/brand-icon"
import type { QueueItem } from "@/components/track-types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface LiveStatus {
  live: boolean
  handle: string | null
  url: string | null
}

const BARS = [0.55, 0.9, 0.4, 1, 0.65, 0.8, 0.35, 0.95, 0.5, 0.75, 0.45, 0.85]

export function TikTokLiveCard({ nowPlaying }: { nowPlaying: QueueItem | null }) {
  const { data } = useSWR<LiveStatus>("/api/live", fetcher, { refreshInterval: 15000 })

  if (!data?.live || !data.url) return null

  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex aspect-[9/14] w-full flex-col overflow-hidden rounded-3xl border border-primary/50 bg-card shadow-[0_0_40px_-10px] shadow-primary/60 transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <span className="sr-only">Watch the live stream on TikTok (opens in a new tab)</span>

      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,var(--color-primary)_0%,transparent_60%)] opacity-25 transition-opacity group-hover:opacity-40" />

      <div className="relative flex items-center justify-between p-4">
        <span className="inline-flex items-center gap-2 rounded-md bg-destructive px-2 py-1 text-xs font-black uppercase tracking-wider text-destructive-foreground">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive-foreground opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-destructive-foreground" />
          </span>
          Live
        </span>
        <span className="flex items-center gap-1.5 rounded-md bg-background/60 px-2 py-1 text-xs font-semibold text-foreground backdrop-blur">
          <BrandIcon kind="tiktok" className="size-3.5" />
          @{data.handle}
        </span>
      </div>

      <div aria-hidden="true" className="relative flex flex-1 items-end justify-center gap-1.5 px-6 pb-6">
        {BARS.map((h, i) => (
          <span
            key={i}
            className="live-eq-bar w-2.5 origin-bottom rounded-full bg-primary"
            style={{ height: `${h * 55}%`, animationDelay: `${i * 0.11}s` }}
          />
        ))}
      </div>

      <div className="relative flex flex-col gap-1 border-t border-primary/30 bg-background/70 p-4 backdrop-blur">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">On air right now</span>
        <p className="truncate text-sm font-semibold text-foreground">
          {nowPlaying ? nowPlaying.title : "Reviews are rolling"}
        </p>
        <span className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-colors group-hover:bg-primary/90">
          Join the Live
          <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </div>
    </a>
  )
}
