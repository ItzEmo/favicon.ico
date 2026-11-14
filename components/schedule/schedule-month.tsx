"use client"

import { cn } from "@/lib/utils"
import { SHOW_ICON_MAP } from "@/components/schedule/show-card"
import { WEEKDAY_SHORT, WEEK_ORDER, addDays, resolveDay, startOfWeek, toIso, type ResolvedDay, type Schedule } from "@/lib/schedule-types"

interface ScheduleMonthProps {
  schedule: Schedule
  month: Date
  today: string
  filter: string | null
  onOpen: (day: ResolvedDay) => void
}

export function ScheduleMonth({ schedule, month, today, filter, onOpen }: ScheduleMonthProps) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0)
  const gridStart = startOfWeek(first)
  const weeks = Math.ceil(((last.getTime() - gridStart.getTime()) / 86_400_000 + 1) / 7)
  const cells = Array.from({ length: weeks * 7 }, (_, i) => addDays(gridStart, i))

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {WEEK_ORDER.map((d) => (
          <div key={d} className="sched-dayhead rounded-lg py-1.5 text-center text-[11px] font-black tracking-wider text-foreground sm:text-sm">
            {WEEKDAY_SHORT[d]}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {cells.map((date, i) => {
          const iso = toIso(date)
          const day = resolveDay(schedule, iso)
          const inMonth = date.getMonth() === month.getMonth()
          const isToday = iso === today
          const isPast = iso < today
          const shows = day.entries.filter((e) => e.show)
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onOpen(day)}
              style={{ animationDelay: `${i * 12}ms` }}
              aria-label={`${date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}: ${
                day.off ? "recharge day" : shows.map((e) => e.show!.name).join(", ")
              }`}
              className={cn(
                "sched-cell sched-reveal flex min-h-16 flex-col gap-1 rounded-xl p-1.5 text-left sm:min-h-28 sm:p-2",
                !inMonth && "opacity-35",
                isPast && inMonth && "opacity-60",
                isToday && "sched-cell--today",
              )}
            >
              <span className="flex items-center justify-between gap-1">
                <span className={cn("text-xs font-black sm:text-sm", isToday ? "text-primary" : "text-foreground")}>{date.getDate()}</span>
                {day.note ? <span className="size-1.5 rounded-full bg-foreground" aria-hidden="true" /> : null}
              </span>
              {day.off ? (
                <span className="mt-auto hidden text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:block">Recharge</span>
              ) : (
                <span className="flex flex-col gap-1">
                  {shows.map(({ slot, show }) => {
                    const Icon = SHOW_ICON_MAP[show!.icon]
                    return (
                      <span
                        key={slot.id}
                        data-color={show!.color}
                        data-dim={filter && filter !== show!.id ? "true" : undefined}
                        className="sched-chip flex items-center gap-1 rounded-md px-1 py-0.5 sm:px-1.5"
                      >
                        <Icon className="sched-card__icon size-3 shrink-0" aria-hidden="true" />
                        <span className="sched-card__name hidden truncate text-[10px] font-bold sm:inline">{show!.name}</span>
                      </span>
                    )
                  })}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
