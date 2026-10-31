"use client"

import { useState, useTransition } from "react"
import { useSWRConfig } from "swr"
import { cn } from "@/lib/utils"
import { updateTikTokLive } from "@/app/actions/tiktok-live"
import type { TikTokLiveStatus } from "@/lib/tiktok-live"

export function AdminTikTokLive({ status }: { status: TikTokLiveStatus }) {
  const [current, setCurrent] = useState(status)
  const [handle, setHandle] = useState(status.handle ?? "")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const { mutate } = useSWRConfig()

  function save(live: boolean) {
    setError(null)
    startTransition(async () => {
      try {
        const next = await updateTikTokLive(handle, live)
        setCurrent(next)
        setHandle(next.handle ?? "")
        await mutate("/api/live")
      } catch (err) {
        setError((err as Error).message)
      }
    })
  }

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span id="tiktok-live-label" className="text-sm font-bold uppercase tracking-wide text-foreground">
            TikTok Live
          </span>
          <p className="text-xs text-muted-foreground">
            <span className={current.live ? "font-semibold text-primary" : "font-semibold text-muted-foreground"}>
              {current.live ? "Live" : "Offline"}
            </span>{" "}
            · Shows a clickable live card next to the queue.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={current.live}
          aria-labelledby="tiktok-live-label"
          disabled={pending}
          onClick={() => save(!current.live)}
          className={cn(
            "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-60",
            current.live ? "border-primary bg-primary" : "border-border bg-secondary",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "size-5 rounded-full bg-background shadow transition-transform",
              current.live ? "translate-x-6" : "translate-x-1",
            )}
          />
        </button>
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          save(current.live)
        }}
      >
        <label htmlFor="tiktok-handle" className="sr-only">
          TikTok username
        </label>
        <div className="flex min-w-0 flex-1 items-center rounded-xl border border-border bg-background px-3 focus-within:ring-2 focus-within:ring-primary/50">
          <span className="text-sm text-muted-foreground" aria-hidden="true">
            @
          </span>
          <input
            id="tiktok-handle"
            value={handle.replace(/^@/, "")}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="yourusername"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-foreground outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl border border-border bg-secondary px-4 text-sm font-semibold text-foreground hover:bg-secondary/80 disabled:opacity-60"
        >
          Save
        </button>
      </form>
      {error ? (
        <p role="alert" className="text-xs font-semibold text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
