"use client"

import { useOptimistic, useState, useTransition } from "react"
import Link from "next/link"
import { Check, ChevronDown, Lock, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { CHECKLIST, CHECKLIST_TOTAL } from "@/lib/release-checklist"
import { resetChecklist, setChecklistItem } from "@/app/actions/release-checklist"

type Action = { type: "set"; id: string; done: boolean } | { type: "reset" }

export function ReleaseChecklist({
  initialCompleted,
  signedIn,
}: {
  initialCompleted: string[]
  signedIn: boolean
}) {
  const [completed, setCompleted] = useState(() => new Set(initialCompleted))
  const [optimistic, applyOptimistic] = useOptimistic(
    completed,
    (state: Set<string>, action: Action) => {
      if (action.type === "reset") return new Set<string>()
      const next = new Set(state)
      if (action.done) next.add(action.id)
      else next.delete(action.id)
      return next
    },
  )
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState<Set<string>>(() => new Set(CHECKLIST.map((p) => p.id)))

  const doneCount = optimistic.size
  const percent = Math.round((doneCount / CHECKLIST_TOTAL) * 100)

  function toggle(id: string) {
    if (!signedIn) return
    const done = !optimistic.has(id)
    setError(null)
    startTransition(async () => {
      applyOptimistic({ type: "set", id, done })
      try {
        await setChecklistItem(id, done)
        setCompleted((prev) => {
          const next = new Set(prev)
          if (done) next.add(id)
          else next.delete(id)
          return next
        })
      } catch {
        setError("Couldn't save that change. Please try again.")
      }
    })
  }

  function reset() {
    if (!signedIn || doneCount === 0) return
    if (!window.confirm("Clear all your checked items?")) return
    setError(null)
    startTransition(async () => {
      applyOptimistic({ type: "reset" })
      try {
        await resetChecklist()
        setCompleted(new Set())
      } catch {
        setError("Couldn't reset your checklist. Please try again.")
      }
    })
  }

  function togglePhase(id: string) {
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="sticky top-20 z-10 flex flex-col gap-3 rounded-2xl border border-border bg-card/95 p-5 backdrop-blur">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {signedIn ? "Your progress" : "Preview"}
            </p>
            <p className="text-2xl font-black text-foreground">
              {doneCount}
              <span className="text-base font-semibold text-muted-foreground">
                {" / "}
                {CHECKLIST_TOTAL} tasks
              </span>
            </p>
          </div>
          {signedIn ? (
            <button
              type="button"
              onClick={reset}
              disabled={doneCount === 0}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Reset
            </button>
          ) : (
            <Link
              href="/sign-in"
              className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Lock className="size-4" aria-hidden="true" />
              Sign in to track progress
            </Link>
          )}
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-secondary"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={CHECKLIST_TOTAL}
          aria-valuenow={doneCount}
          aria-label="Release checklist progress"
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>

      <ol className="flex flex-col gap-4">
        {CHECKLIST.map((phase, index) => {
          const phaseDone = phase.items.filter((item) => optimistic.has(item.id)).length
          const complete = phaseDone === phase.items.length
          const isOpen = open.has(phase.id)
          const panelId = `phase-${phase.id}`

          return (
            <li key={phase.id} className="overflow-hidden rounded-2xl border border-border bg-card">
              <button
                type="button"
                onClick={() => togglePhase(phase.id)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="flex w-full items-center gap-4 p-5 text-left"
              >
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-black",
                    complete ? "bg-primary text-primary-foreground" : "bg-primary/15 text-primary",
                  )}
                >
                  {complete ? <Check className="size-5" aria-hidden="true" /> : index + 1}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-base font-semibold text-foreground text-pretty">
                    {phase.title}
                  </span>
                  <span className="text-sm text-muted-foreground">{phase.timing}</span>
                </span>
                <span className="shrink-0 text-sm font-bold tabular-nums text-muted-foreground">
                  {phaseDone}/{phase.items.length}
                </span>
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-muted-foreground transition-transform",
                    isOpen && "rotate-180",
                  )}
                  aria-hidden="true"
                />
              </button>

              {isOpen && (
                <ul id={panelId} className="flex flex-col border-t border-border">
                  {phase.items.map((item) => {
                    const checked = optimistic.has(item.id)
                    return (
                      <li key={item.id} className="border-b border-border/60 last:border-b-0">
                        <label
                          className={cn(
                            "flex items-start gap-3 px-5 py-3.5 transition-colors",
                            signedIn ? "cursor-pointer hover:bg-secondary/40" : "cursor-not-allowed",
                          )}
                        >
                          <input
                            type="checkbox"
                            className="peer sr-only"
                            checked={checked}
                            disabled={!signedIn}
                            onChange={() => toggle(item.id)}
                          />
                          <span
                            aria-hidden="true"
                            className={cn(
                              "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
                              checked
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted-foreground/50",
                            )}
                          >
                            {checked && <Check className="size-3.5" strokeWidth={3} />}
                          </span>
                          <span
                            className={cn(
                              "text-sm leading-relaxed text-pretty transition-colors",
                              checked ? "text-muted-foreground line-through" : "text-foreground",
                            )}
                          >
                            {item.label}
                          </span>
                        </label>
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
