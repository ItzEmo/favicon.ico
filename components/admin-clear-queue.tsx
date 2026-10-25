"use client"

import { useEffect, useState, useTransition } from "react"
import { Trash2 } from "lucide-react"
import { useSWRConfig } from "swr"
import { cn } from "@/lib/utils"
import { clearQueue } from "@/app/actions/admin"

export function AdminClearQueue() {
  const [armed, setArmed] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const { mutate } = useSWRConfig()

  useEffect(() => {
    if (!armed) return
    const timer = setTimeout(() => setArmed(false), 4000)
    return () => clearTimeout(timer)
  }, [armed])

  function handleClick() {
    if (!armed) {
      setArmed(true)
      setMessage(null)
      return
    }
    setArmed(false)
    startTransition(async () => {
      try {
        const removed = await clearQueue()
        setMessage(removed === 0 ? "Queue was already empty." : `Cleared ${removed} track${removed === 1 ? "" : "s"}.`)
        await mutate("/api/queue")
      } catch {
        setMessage("Couldn't clear the queue. Try again.")
      }
    })
  }

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-sm font-bold uppercase tracking-wide text-foreground">Clear Queue</p>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {message ?? "Removes every waiting track. The song on air and History stay."}
        </p>
      </div>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={cn(
          "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/50 disabled:opacity-60",
          armed
            ? "border-destructive bg-destructive text-destructive-foreground"
            : "border-destructive/50 text-destructive hover:bg-destructive/10",
        )}
      >
        <Trash2 className="size-3.5" aria-hidden="true" />
        {pending ? "Clearing…" : armed ? "Tap again to confirm" : "Clear queue"}
      </button>
    </div>
  )
}
