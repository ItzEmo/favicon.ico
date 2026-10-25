"use client"

import useSWR from "swr"
import { RadioTower } from "lucide-react"
import type { QueueStatus } from "@/lib/queue-status"

const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<QueueStatus>)

export function QueueOffBanner() {
  const { data } = useSWR("/api/queue/status", fetcher, { refreshInterval: 10000 })
  if (!data || data.freeOpen || data.skipsOpen) return null

  return (
    <div role="status" className="notice-pop border-b border-destructive/40 bg-destructive/15 text-foreground">
      <div className="mx-auto flex max-w-5xl items-center justify-center gap-2 px-4 py-2 text-center">
        <RadioTower className="size-4 shrink-0 text-destructive" aria-hidden="true" />
        <p className="text-pretty text-xs font-bold uppercase tracking-[0.18em]">
          The Queue is <span className="text-destructive">Off Live</span>
          <span className="font-medium normal-case tracking-normal text-muted-foreground">
            {" "}
            · Submissions are closed for now
          </span>
        </p>
      </div>
    </div>
  )
}
