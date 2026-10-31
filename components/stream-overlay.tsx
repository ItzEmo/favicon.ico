"use client"

import useSWR from "swr"
import { sourceLabels, type QueueItem } from "@/components/track-types"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url, { cache: "no-store" }).then((r) => r.json())

type QueueData = { nowPlaying: QueueItem | null; tracks: QueueItem[] }

const LINE_TAGS: Partial<Record<QueueItem["line"], string>> = {
  skip: "Skip",
  skipplus: "Skip+",
  boost: "Boost",
}

function Vinyl() {
  return (
    <div className="overlay-vinyl relative size-24 shrink-0 rounded-full border-2 border-foreground/10 shadow-lg shadow-primary/40">
      <div className="absolute inset-[30%] flex items-center justify-center rounded-full bg-primary">
        <div className="size-2 rounded-full bg-background" />
      </div>
      <div className="absolute left-[18%] top-[14%] h-3 w-6 -rotate-45 rounded-full bg-foreground/15 blur-[2px]" />
    </div>
  )
}

function Equalizer() {
  return (
    <div className="flex h-6 items-end gap-0.5" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="overlay-eq w-1 rounded-full bg-primary"
          style={{ animationDelay: `${i * -0.18}s` }}
        />
      ))}
    </div>
  )
}

function UpNext({ track, label, tilt, delay }: { track: QueueItem; label: string; tilt: string; delay: string }) {
  const tag = LINE_TAGS[track.line]
  return (
    <div
      key={track.trackId}
      className={cn(
        "overlay-slide flex max-w-sm items-center gap-3 rounded-2xl border-2 border-foreground/15 bg-card/90 py-2 pl-2 pr-4 shadow-xl backdrop-blur-md",
        tilt,
      )}
      style={{ animationDelay: delay }}
    >
      <span className="shrink-0 rounded-xl bg-foreground px-2.5 py-1 text-xs font-black uppercase tracking-wider text-background">
        {label}
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-extrabold text-foreground">{track.title}</span>
        <span className="truncate text-xs font-semibold text-muted-foreground">{track.submittedBy}</span>
      </div>
      {tag && (
        <span className="ml-auto shrink-0 rounded-full border border-primary px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary">
          {tag}
        </span>
      )}
    </div>
  )
}

export function StreamOverlay({ align }: { align: "left" | "right" }) {
  const { data } = useSWR<QueueData>("/api/queue", fetcher, { refreshInterval: 4000 })

  if (!data) return null

  const nowPlaying = data.nowPlaying
  const upNext = data.tracks.filter((t) => t.trackId !== nowPlaying?.trackId).slice(0, 2)

  return (
    <div
      className={cn(
        "fixed bottom-8 flex w-[30rem] max-w-[calc(100vw-4rem)] flex-col gap-3",
        align === "right" ? "right-8 items-end" : "left-8 items-start",
      )}
    >
      {nowPlaying ? (
        <div
          key={nowPlaying.trackId}
          className="overlay-pop relative flex w-full items-center gap-4 rounded-3xl border-2 border-primary bg-card/90 p-3 pr-5 shadow-2xl shadow-primary/40 backdrop-blur-md"
        >
          <span className="absolute -top-3 left-6 flex -rotate-3 items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-black uppercase tracking-widest text-primary-foreground shadow-lg">
            <span className="overlay-live size-2 rounded-full bg-primary-foreground" />
            On Air
          </span>
          <Vinyl />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="line-clamp-2 text-xl font-black leading-tight text-foreground text-balance">
              {nowPlaying.title}
            </span>
            <span className="truncate text-sm font-bold text-primary">by {nowPlaying.submittedBy}</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {nowPlaying.audioPathname ? "Upload" : sourceLabels[nowPlaying.source]}
            </span>
          </div>
          <Equalizer />
        </div>
      ) : (
        <div className="overlay-pop flex -rotate-2 items-center gap-3 rounded-3xl border-2 border-primary bg-card/90 px-5 py-3 shadow-2xl shadow-primary/40 backdrop-blur-md">
          <Equalizer />
          <span className="text-lg font-black uppercase tracking-tight text-foreground">
            {"Queue's open"} <span className="text-primary">— drop your track</span>
          </span>
        </div>
      )}

      {upNext[0] && <UpNext track={upNext[0]} label="Next" tilt="rotate-1" delay="0.15s" />}
      {upNext[1] && <UpNext track={upNext[1]} label="Then" tilt="-rotate-1" delay="0.3s" />}
    </div>
  )
}
