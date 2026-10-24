"use client"

import { useOptimistic, useTransition } from "react"
import { cn } from "@/lib/utils"
import { setQueueLineOpen } from "@/app/actions/queue-settings"
import type { QueueStatus } from "@/lib/queue-status"

const ROWS = [
  { key: "free", field: "freeOpen", label: "Free Line", note: "New free submissions." },
  { key: "skips", field: "skipsOpen", label: "Skips", note: "Skip+, Skip, Boost lines, upgrades and boosts." },
] as const

export function AdminQueueSwitches({ status }: { status: QueueStatus }) {
  const [optimistic, setOptimistic] = useOptimistic(status)
  const [, startTransition] = useTransition()

  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-2">
      {ROWS.map(({ key, field, label, note }) => {
        const open = optimistic[field]
        const id = `queue-switch-${key}`
        return (
          <div
            key={key}
            className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4"
          >
            <div className="flex min-w-0 flex-col gap-0.5">
              <label htmlFor={id} className="text-sm font-bold uppercase tracking-wide text-foreground">
                {label}
              </label>
              <p className="text-xs text-muted-foreground">
                <span className={open ? "font-semibold text-primary" : "font-semibold text-destructive"}>
                  {open ? "Open" : "Closed"}
                </span>{" "}
                · {note}
              </p>
            </div>
            <button
              id={id}
              type="button"
              role="switch"
              aria-checked={open}
              onClick={() =>
                startTransition(async () => {
                  setOptimistic({ ...optimistic, [field]: !open })
                  await setQueueLineOpen(key, !open)
                })
              }
              className={cn(
                "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                open ? "border-primary bg-primary" : "border-border bg-secondary",
              )}
            >
              <span className="sr-only">{open ? `Close ${label}` : `Open ${label}`}</span>
              <span
                aria-hidden="true"
                className={cn(
                  "size-5 rounded-full bg-background shadow transition-transform",
                  open ? "translate-x-6" : "translate-x-1",
                )}
              />
            </button>
          </div>
        )
      })}
    </div>
  )
}
