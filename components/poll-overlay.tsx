"use client"

import useSWR from "swr"
import { cn } from "@/lib/utils"

type Poll = {
  id: number
  trackTitle: string
  artistName: string | null
  avg: number
  count: number
  histogram: number[]
  recent: { voter: string; score: number }[]
}

const fetcher = (url: string) => fetch(url, { cache: "no-store" }).then((r) => r.json())

function verdict(avg: number, count: number) {
  if (count === 0) return "Waiting for votes"
  if (avg >= 9) return "Certified heat"
  if (avg >= 7.5) return "Chat loves it"
  if (avg >= 6) return "Vibing"
  if (avg >= 4) return "Mixed feelings"
  return "Tough crowd"
}

export function PollOverlay({ align }: { align: "left" | "right" }) {
  const { data } = useSWR<{ poll: Poll | null }>("/api/live-poll", fetcher, { refreshInterval: 2000 })
  const poll = data?.poll
  if (!poll) return null

  const max = Math.max(1, ...poll.histogram)
  const fill = Math.min(100, (poll.avg / 10) * 100)

  return (
    <div
      key={poll.id}
      className={cn(
        "overlay-pop fixed top-8 flex w-[26rem] max-w-[calc(100vw-4rem)] flex-col gap-3",
        align === "right" ? "right-8 items-end" : "left-8 items-start",
      )}
    >
      <div className="flex -rotate-2 items-center gap-2 rounded-full bg-accent px-4 py-1.5 shadow-lg shadow-accent/40">
        <span className="overlay-live size-2.5 rounded-full bg-accent-foreground" aria-hidden="true" />
        <span className="text-sm font-black uppercase tracking-widest text-accent-foreground">
          Rate it in chat · 1–10
        </span>
      </div>

      <div className="flex w-full flex-col gap-4 rounded-3xl border-2 border-foreground/15 bg-card/85 p-5 shadow-2xl shadow-primary/30 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div
            className="relative flex size-24 shrink-0 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(var(--primary) ${fill}%, color-mix(in oklch, var(--foreground) 12%, transparent) 0)`,
            }}
          >
            <div className="flex size-[4.6rem] flex-col items-center justify-center rounded-full bg-card">
              <span key={poll.avg.toFixed(1)} className="overlay-pop text-3xl font-black leading-none text-foreground tabular-nums">
                {poll.count ? poll.avg.toFixed(1) : "–"}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">/ 10</span>
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-xs font-black uppercase tracking-widest text-primary">
              {verdict(poll.avg, poll.count)}
            </span>
            <span className="truncate text-xl font-black leading-tight text-foreground">{poll.trackTitle}</span>
            {poll.artistName && (
              <span className="truncate text-sm font-semibold text-muted-foreground">{poll.artistName}</span>
            )}
            <span className="text-xs font-bold text-muted-foreground tabular-nums">
              {poll.count} {poll.count === 1 ? "vote" : "votes"}
            </span>
          </div>
        </div>

        <div className="flex h-20 items-end gap-1.5" aria-hidden="true">
          {poll.histogram.map((n, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-14 w-full items-end">
                <div
                  className={cn(
                    "w-full rounded-t-md transition-all duration-500 ease-out",
                    i >= 7 ? "bg-primary" : i >= 4 ? "bg-accent" : "bg-foreground/40",
                  )}
                  style={{ height: `${n ? Math.max(10, (n / max) * 100) : 4}%` }}
                />
              </div>
              <span className="text-[11px] font-black text-muted-foreground tabular-nums">{i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {poll.recent.length > 0 && (
        <ul className={cn("flex flex-wrap gap-2", align === "right" && "justify-end")}>
          {poll.recent.map((v, i) => (
            <li
              key={`${v.voter}-${v.score}`}
              className={cn(
                "overlay-pop flex items-center gap-2 rounded-full border-2 border-foreground/15 bg-card/90 py-1 pl-3 pr-1 shadow-lg backdrop-blur-md",
                i % 2 ? "rotate-2" : "-rotate-1",
              )}
            >
              <span className="max-w-32 truncate text-xs font-bold text-foreground">@{v.voter}</span>
              <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-black text-primary-foreground tabular-nums">
                {v.score}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
