"use client"

import Image from "next/image"
import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { ScheduleMascots } from "@/components/schedule/schedule-mascots"
import { ScheduleWeek } from "@/components/schedule/schedule-week"
import { ScheduleMonth } from "@/components/schedule/schedule-month"
import { ScheduleDayDialog } from "@/components/schedule/schedule-day-dialog"
import { addDays, parseIso, startOfWeek, type ResolvedDay, type Schedule } from "@/lib/schedule-types"

type View = "week" | "month"

export function ScheduleBoard({ schedule, today }: { schedule: Schedule; today: string }) {
  const todayDate = parseIso(today)
  const [view, setView] = useState<View>("week")
  const [weekStart, setWeekStart] = useState(() => startOfWeek(todayDate))
  const [month, setMonth] = useState(() => new Date(todayDate.getFullYear(), todayDate.getMonth(), 1))
  const [filter, setFilter] = useState<string | null>(null)
  const [openDay, setOpenDay] = useState<ResolvedDay | null>(null)

  const thisWeek = startOfWeek(todayDate).getTime() === weekStart.getTime()
  const thisMonth = month.getFullYear() === todayDate.getFullYear() && month.getMonth() === todayDate.getMonth()

  const rangeLabel =
    view === "week"
      ? `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${addDays(weekStart, 6).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}`
      : month.toLocaleDateString("en-US", { month: "long", year: "numeric" })

  function shift(dir: -1 | 1) {
    if (view === "week") setWeekStart((d) => addDays(d, dir * 7))
    else setMonth((m) => new Date(m.getFullYear(), m.getMonth() + dir, 1))
  }

  function jumpToday() {
    setWeekStart(startOfWeek(todayDate))
    setMonth(new Date(todayDate.getFullYear(), todayDate.getMonth(), 1))
  }

  return (
    <section className="sched-stage relative overflow-hidden" aria-labelledby="schedule-title">
      <ScheduleMascots />

      <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-4 pb-24 pt-10 sm:px-6 lg:px-10 lg:pb-64">
        <header className="flex flex-col items-center gap-3 text-center">
          <Image
            src="/emo-neon-logo.png"
            alt="Emo's Radio"
            width={320}
            height={240}
            priority
            className="neon-shine h-28 w-auto sm:h-36"
          />
          <h1
            id="schedule-title"
            className="sched-title text-balance text-4xl font-black uppercase leading-none tracking-tight text-foreground sm:text-6xl"
          >
            {schedule.title}
          </h1>
          {schedule.subtitle ? <p className="text-base text-muted-foreground text-pretty sm:text-lg">{schedule.subtitle}</p> : null}
        </header>

        <div className="flex w-full flex-col items-center justify-between gap-3 sm:flex-row">
          <div role="tablist" aria-label="Calendar view" className="flex rounded-full border border-border bg-card/70 p-1 backdrop-blur">
            {(["week", "month"] as const).map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={cn(
                  "rounded-full px-5 py-1.5 text-xs font-black uppercase tracking-wider transition-colors",
                  view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {v}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => shift(-1)}
              aria-label={view === "week" ? "Previous week" : "Previous month"}
              className="flex size-9 items-center justify-center rounded-full border border-border bg-card/70 text-foreground transition-colors hover:border-primary"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <span className="min-w-36 text-center text-sm font-bold uppercase tracking-wider text-foreground" aria-live="polite">
              {rangeLabel}
            </span>
            <button
              type="button"
              onClick={() => shift(1)}
              aria-label={view === "week" ? "Next week" : "Next month"}
              className="flex size-9 items-center justify-center rounded-full border border-border bg-card/70 text-foreground transition-colors hover:border-primary"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={jumpToday}
              disabled={view === "week" ? thisWeek : thisMonth}
              className="rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:border-primary disabled:opacity-40"
            >
              Today
            </button>
          </div>
        </div>

        <div className="w-full" key={`${view}-${view === "week" ? weekStart.getTime() : month.getTime()}`}>
          {view === "week" ? (
            <ScheduleWeek schedule={schedule} weekStart={weekStart} today={today} filter={filter} onOpen={setOpenDay} />
          ) : (
            <ScheduleMonth schedule={schedule} month={month} today={today} filter={filter} onOpen={setOpenDay} />
          )}
        </div>

        {schedule.showTypes.length ? (
          <div className="flex flex-wrap items-center justify-center gap-3" role="group" aria-label="Highlight a show">
            {schedule.showTypes.map((s) => (
              <button
                key={s.id}
                type="button"
                data-color={s.color}
                aria-pressed={filter === s.id}
                onClick={() => setFilter((f) => (f === s.id ? null : s.id))}
                className={cn(
                  "sched-legend flex items-center gap-2.5 rounded-full border px-4 py-2 text-sm font-semibold text-foreground transition-colors",
                  filter === s.id ? "border-foreground/60 bg-card" : "border-transparent hover:border-border",
                )}
              >
                <span className="sched-legend__swatch size-5 rounded-md" aria-hidden="true" />
                {s.name}
              </button>
            ))}
          </div>
        ) : null}

        {schedule.footnote ? <p className="text-center text-sm text-muted-foreground text-pretty">{schedule.footnote}</p> : null}
      </div>

      <ScheduleDayDialog day={openDay} today={today} onClose={() => setOpenDay(null)} />
    </section>
  )
}
