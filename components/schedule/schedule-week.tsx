"use client"

import { cn } from "@/lib/utils"
import { RechargeCard, ShowCard } from "@/components/schedule/show-card"
import { WEEKDAY_SHORT, addDays, parseIso, resolveDay, toIso, type ResolvedDay, type Schedule } from "@/lib/schedule-types"

interface ScheduleWeekProps {
  schedule: Schedule
  weekStart: Date
  today: string
  filter: string | null
  onOpen: (day: ResolvedDay) => void
}

function shortDate(iso: string) {
  return parseIso(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function ScheduleWeek({ schedule, weekStart, today, filter, onOpen }: ScheduleWeekProps) {
  const days = Array.from({ length: 7 }, (_, i) => resolveDay(schedule, toIso(addDays(weekStart, i))))
  const rows = Math.max(schedule.slots.length, 1)

  return (
    <>
      <div
        className="hidden gap-3 md:grid"
        style={{ gridTemplateColumns: `6.5rem repeat(7, minmax(0, 1fr))`, gridTemplateRows: `auto repeat(${rows}, minmax(13rem, auto))` }}
      >
        <div aria-hidden="true" />
        {days.map((day, i) => {
          const isToday = day.iso === today
          return (
            <div
              key={day.iso}
              style={{ gridColumn: i + 2, gridRow: 1 }}
              className={cn(
                "sched-dayhead flex flex-col items-center justify-center rounded-xl px-2 py-2",
                isToday && "sched-dayhead--today",
              )}
            >
              <span className="text-base font-black tracking-wide text-foreground">{WEEKDAY_SHORT[parseIso(day.iso).getDay()]}</span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {isToday ? "Today" : shortDate(day.iso)}
              </span>
            </div>
          )
        })}

        {schedule.slots.map((slot, r) => (
          <div key={slot.id} style={{ gridColumn: 1, gridRow: r + 2 }} className="flex flex-col justify-center gap-0.5">
            <span className="text-sm font-bold uppercase tracking-wide text-foreground">{slot.label}</span>
            <span className="text-sm text-muted-foreground">{slot.time}</span>
          </div>
        ))}

        {days.map((day, i) =>
          day.off ? (
            <div key={day.iso} style={{ gridColumn: i + 2, gridRow: `2 / span ${rows}` }} className="sched-reveal" data-i={i}>
              <RechargeCard
                note={day.note}
                onClick={() => onOpen(day)}
                label={`${shortDate(day.iso)}: no live, recharge day`}
              />
            </div>
          ) : (
            day.entries.map(({ slot, show, changed }, r) => (
              <div
                key={`${day.iso}-${slot.id}`}
                style={{ gridColumn: i + 2, gridRow: r + 2, animationDelay: `${(i + r) * 50}ms` }}
                className="sched-reveal"
              >
                {show ? (
                  <ShowCard
                    show={show}
                    changed={changed}
                    dimmed={!!filter && filter !== show.id}
                    onClick={() => onOpen(day)}
                    label={`${shortDate(day.iso)}, ${slot.label} ${slot.time}: ${show.name}`}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => onOpen(day)}
                    className="flex h-full w-full items-center justify-center rounded-2xl border border-dashed border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary/60"
                  >
                    No show
                  </button>
                )}
              </div>
            ))
          ),
        )}
      </div>

      <ol className="flex flex-col gap-4 md:hidden">
        {days.map((day) => {
          const isToday = day.iso === today
          return (
            <li key={day.iso} className="flex flex-col gap-2">
              <div className={cn("sched-dayhead flex items-center justify-between rounded-xl px-4 py-2", isToday && "sched-dayhead--today")}>
                <span className="text-base font-black tracking-wide text-foreground">{WEEKDAY_SHORT[parseIso(day.iso).getDay()]}</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {isToday ? "Today" : shortDate(day.iso)}
                </span>
              </div>
              {day.off ? (
                <RechargeCard compact note={day.note} onClick={() => onOpen(day)} label={`${shortDate(day.iso)}: recharge day`} />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {day.entries.map(({ slot, show, changed }) => (
                    <div key={slot.id} className="flex flex-col gap-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        {slot.label} {slot.time}
                      </span>
                      {show ? (
                        <ShowCard
                          compact
                          show={show}
                          changed={changed}
                          dimmed={!!filter && filter !== show.id}
                          onClick={() => onOpen(day)}
                          label={`${shortDate(day.iso)}, ${slot.label}: ${show.name}`}
                        />
                      ) : (
                        <span className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border py-6 text-xs text-muted-foreground">
                          No show
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </>
  )
}
