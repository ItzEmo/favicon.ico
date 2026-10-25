"use client"

import useSWR from "swr"
import { Flame } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<{ submissions: number }>)

export function SessionSubmissionsCounter() {
  const { data } = useSWR("/api/queue/session", fetcher, { refreshInterval: 10000 })
  const count = data?.submissions

  return (
    <span
      aria-live="polite"
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-neutral-300"
    >
      <Flame className="size-3.5 text-fuchsia-400" aria-hidden="true" />
      {count === undefined
        ? "Counting today's submissions…"
        : `${count} ${count === 1 ? "song" : "songs"} sent in today`}
    </span>
  )
}
