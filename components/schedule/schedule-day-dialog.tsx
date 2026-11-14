"use client"

import { useEffect, useRef } from "react"
import { BatteryCharging, X } from "lucide-react"
import { SHOW_ICON_MAP } from "@/components/schedule/show-card"
import { parseIso, type ResolvedDay } from "@/lib/schedule-types"

export function ScheduleDayDialog({ day, today, onClose }: { day: ResolvedDay | null; today: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (day && !el.open) el.showModal()
    if (!day && el.open) el.close()
  }, [day])

  const date = day ? parseIso(day.iso) : null

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      aria-labelledby="sched-dialog-title"
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-3xl border border-border bg-card p-0 text-card-foreground shadow-2xl backdrop:bg-background/70 backdrop:backdrop-blur-sm"
    >
      {day && date ? (
        <div className="flex flex-col gap-5 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                {day.iso === today ? "Today" : date.toLocaleDateString("en-US", { weekday: "long" })}
              </span>
              <h2 id="sched-dialog-title" className="text-2xl font-black uppercase tracking-tight text-foreground">
                {date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Close"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          {day.note ? (
            <p className="rounded-xl border border-border bg-secondary px-4 py-3 text-sm leading-relaxed text-secondary-foreground">
              {day.note}
            </p>
          ) : null}

          {day.off ? (
            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border px-4 py-5">
              <BatteryCharging className="size-6 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm leading-relaxed text-muted-foreground">No live today. We&apos;re recharging.</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {day.entries.map(({ slot, show, changed }) => {
                const Icon = show ? SHOW_ICON_MAP[show.icon] : null
                return (
                  <li
                    key={slot.id}
                    data-color={show?.color}
                    className={show ? "sched-card flex items-center gap-4 rounded-2xl px-4 py-3" : "flex items-center gap-4 rounded-2xl border border-dashed border-border px-4 py-3"}
                  >
                    {Icon ? <Icon className="sched-card__icon size-8 shrink-0" strokeWidth={1.75} aria-hidden="true" /> : null}
                    <div className="flex min-w-0 flex-col gap-0.5 text-left">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {slot.label} {slot.time}
                        {changed ? " · Special" : ""}
                      </span>
                      <span className={show ? "sched-card__name text-base font-black" : "text-base font-bold text-muted-foreground"}>
                        {show ? show.name : "No show"}
                      </span>
                      {show?.tagline ? <span className="text-sm text-muted-foreground">{show.tagline}</span> : null}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      ) : null}
    </dialog>
  )
}
