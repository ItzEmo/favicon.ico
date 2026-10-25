"use client"

import useSWR from "swr"
import type { QueueItem } from "@/components/track-types"
import type { QueueStatus } from "@/lib/queue-status"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function LiveNowBadge() {
  const { data } = useSWR<{ nowPlaying: QueueItem | null }>("/api/queue", fetcher, {
    refreshInterval: 5000,
  })
  const { data: status } = useSWR<QueueStatus>("/api/queue/status", fetcher, {
    refreshInterval: 10000,
  })
  const track = data?.nowPlaying ?? null
  const offAir = status ? !status.freeOpen && !status.skipsOpen : false

  if (offAir) {
    return (
      <span
        aria-live="polite"
        className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-neutral-400"
      >
        <span className="inline-flex size-2 shrink-0 rounded-full bg-neutral-500" aria-hidden="true" />
        Off air
      </span>
    )
  }

  return (
    <span
      aria-live="polite"
      className="inline-flex max-w-full items-center gap-2 rounded-full border border-fuchsia-500/40 bg-fuchsia-950/60 px-4 py-2 text-xs font-bold uppercase tracking-wider text-fuchsia-100 shadow-[0_0_25px_rgba(217,70,239,0.3)]"
    >
      <span className="relative flex size-2 shrink-0">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-fuchsia-500 opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-fuchsia-500" />
      </span>
      <span className="truncate">
        Live now
        {track ? ` · ${track.title} by ${track.submittedBy}` : null}
      </span>
    </span>
  )
}
