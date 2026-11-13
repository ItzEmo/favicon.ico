"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { ExternalLink, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { updateSchedule } from "@/app/actions/schedule"
import {
  SHOW_COLORS,
  SHOW_ICONS,
  WEEKDAY_LONG,
  WEEK_ORDER,
  parseIso,
  type DayOverride,
  type Schedule,
  type ShowType,
} from "@/lib/schedule-types"

const inputClass =
  "w-full min-w-0 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
const selectClass = cn(inputClass, "appearance-auto")
const INHERIT = "__inherit"
const OFF = "__off"

function slugId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

function Panel({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">{title}</h3>
        <p className="text-xs leading-relaxed text-muted-foreground">{note}</p>
      </div>
      {children}
    </section>
  )
}

export function AdminSchedule({ schedule }: { schedule: Schedule }) {
  const [draft, setDraft] = useState(schedule)
  const [newDate, setNewDate] = useState("")
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, startTransition] = useTransition()
  const dirty = JSON.stringify(draft) !== JSON.stringify(schedule)

  function patch(next: Partial<Schedule>) {
    setStatus(null)
    setDraft((d) => ({ ...d, ...next }))
  }

  function patchShow(id: string, next: Partial<ShowType>) {
    patch({ showTypes: draft.showTypes.map((s) => (s.id === id ? { ...s, ...next } : s)) })
  }

  function patchOverride(iso: string, next: DayOverride | null) {
    const overrides = { ...draft.overrides }
    if (next) overrides[iso] = next
    else delete overrides[iso]
    patch({ overrides })
  }

  function save() {
    startTransition(async () => {
      try {
        const saved = await updateSchedule(draft)
        setDraft(saved)
        setStatus({ ok: true, text: "Schedule saved." })
      } catch (err) {
        setStatus({ ok: false, text: (err as Error).message })
      }
    })
  }

  const overrideDates = Object.keys(draft.overrides).sort()

  return (
    <div className="flex flex-col gap-6">
      <Panel title="Header" note="Text at the top and bottom of the schedule page.">
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground">
          Title
          <input className={inputClass} value={draft.title} maxLength={60} onChange={(e) => patch({ title: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground">
          Subtitle
          <input className={inputClass} value={draft.subtitle} maxLength={100} onChange={(e) => patch({ subtitle: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground">
          Footnote
          <input className={inputClass} value={draft.footnote} maxLength={120} onChange={(e) => patch({ footnote: e.target.value })} />
        </label>
      </Panel>

      <Panel title="Shows" note="The kinds of streams you run. Each one gets its own neon color and icon.">
        <ul className="flex flex-col gap-3">
          {draft.showTypes.map((show) => (
            <li key={show.id} data-color={show.color} className="sched-editor-row flex flex-col gap-2 rounded-xl border border-border p-3">
              <div className="flex gap-2">
                <label className="sr-only" htmlFor={`show-name-${show.id}`}>
                  Show name
                </label>
                <input
                  id={`show-name-${show.id}`}
                  className={inputClass}
                  value={show.name}
                  maxLength={48}
                  placeholder="Show name"
                  onChange={(e) => patchShow(show.id, { name: e.target.value })}
                />
                <button
                  type="button"
                  aria-label={`Remove ${show.name}`}
                  onClick={() => patch({ showTypes: draft.showTypes.filter((s) => s.id !== show.id) })}
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
              <label className="sr-only" htmlFor={`show-tag-${show.id}`}>
                Tagline
              </label>
              <input
                id={`show-tag-${show.id}`}
                className={inputClass}
                value={show.tagline}
                maxLength={80}
                placeholder="Tagline"
                onChange={(e) => patchShow(show.id, { tagline: e.target.value })}
              />
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Color">
                  {SHOW_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      role="radio"
                      aria-checked={show.color === c}
                      aria-label={c}
                      data-color={c}
                      onClick={() => patchShow(show.id, { color: c })}
                      className={cn(
                        "sched-legend__swatch size-7 rounded-lg ring-offset-2 ring-offset-card transition",
                        show.color === c && "ring-2 ring-foreground",
                      )}
                    />
                  ))}
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  Icon
                  <select
                    className={cn(selectClass, "w-auto py-1.5")}
                    value={show.icon}
                    onChange={(e) => patchShow(show.id, { icon: e.target.value as ShowType["icon"] })}
                  >
                    {SHOW_ICONS.map((i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </li>
          ))}
        </ul>
        {draft.showTypes.length < 8 ? (
          <button
            type="button"
            onClick={() =>
              patch({
                showTypes: [...draft.showTypes, { id: slugId("show"), name: "New show", tagline: "", color: "violet", icon: "radio" }],
              })
            }
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add show
          </button>
        ) : null}
      </Panel>

      <Panel title="Time slots" note="The rows of the schedule, like Early AM and Evening. Up to four.">
        <ul className="flex flex-col gap-2">
          {draft.slots.map((slot) => (
            <li key={slot.id} className="flex gap-2">
              <input
                aria-label="Slot name"
                className={inputClass}
                value={slot.label}
                maxLength={24}
                placeholder="Early AM"
                onChange={(e) => patch({ slots: draft.slots.map((s) => (s.id === slot.id ? { ...s, label: e.target.value } : s)) })}
              />
              <input
                aria-label="Slot time"
                className={inputClass}
                value={slot.time}
                maxLength={24}
                placeholder="– 4:30 PM"
                onChange={(e) => patch({ slots: draft.slots.map((s) => (s.id === slot.id ? { ...s, time: e.target.value } : s)) })}
              />
              <button
                type="button"
                aria-label={`Remove ${slot.label}`}
                onClick={() => patch({ slots: draft.slots.filter((s) => s.id !== slot.id) })}
                className="flex size-9 shrink-0 items-center justify-center self-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
        {draft.slots.length < 4 ? (
          <button
            type="button"
            onClick={() => patch({ slots: [...draft.slots, { id: slugId("slot"), label: "New slot", time: "" }] })}
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add slot
          </button>
        ) : null}
      </Panel>

      <Panel title="Every week" note="Your regular lineup. It repeats on the calendar every week. Leave a whole day as Off to make it a recharge day.">
        <ul className="flex flex-col gap-3">
          {WEEK_ORDER.map((weekday) => (
            <li key={weekday} className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <span className="w-24 shrink-0 text-sm font-bold text-foreground">{WEEKDAY_LONG[weekday]}</span>
              <div className="grid flex-1 gap-2" style={{ gridTemplateColumns: `repeat(${Math.max(draft.slots.length, 1)}, minmax(0, 1fr))` }}>
                {draft.slots.map((slot) => (
                  <select
                    key={slot.id}
                    aria-label={`${WEEKDAY_LONG[weekday]} ${slot.label}`}
                    className={selectClass}
                    value={draft.weekly[weekday]?.[slot.id] ?? OFF}
                    onChange={(e) => {
                      const weekly = draft.weekly.map((d, i) =>
                        i === weekday ? { ...d, [slot.id]: e.target.value === OFF ? null : e.target.value } : d,
                      )
                      patch({ weekly })
                    }}
                  >
                    <option value={OFF}>Off</option>
                    {draft.showTypes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Specific dates" note="Change one day on the calendar: take it off, swap a show, or add a note like a special guest.">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!newDate || draft.overrides[newDate]) return
            patchOverride(newDate, { note: "" })
            setNewDate("")
          }}
        >
          <label htmlFor="sched-new-date" className="sr-only">
            Date
          </label>
          <input id="sched-new-date" type="date" className={inputClass} value={newDate} onChange={(e) => setNewDate(e.target.value)} />
          <button
            type="submit"
            disabled={!newDate || !!draft.overrides[newDate]}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-bold uppercase tracking-wider text-primary-foreground disabled:opacity-50"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add
          </button>
        </form>

        {overrideDates.length ? (
          <ul className="flex flex-col gap-3">
            {overrideDates.map((iso) => {
              const o = draft.overrides[iso]
              const weekday = parseIso(iso).getDay()
              return (
                <li key={iso} className="flex flex-col gap-3 rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-foreground">
                      {parseIso(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                        <input
                          type="checkbox"
                          className="size-4 accent-primary"
                          checked={!!o.off}
                          onChange={(e) => patchOverride(iso, { ...o, off: e.target.checked || undefined })}
                        />
                        Day off
                      </label>
                      <button
                        type="button"
                        aria-label="Remove date change"
                        onClick={() => patchOverride(iso, null)}
                        className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <input
                    aria-label="Note"
                    className={inputClass}
                    value={o.note ?? ""}
                    maxLength={120}
                    placeholder="Note (optional), e.g. Special guest!"
                    onChange={(e) => patchOverride(iso, { ...o, note: e.target.value })}
                  />
                  {!o.off ? (
                    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.max(draft.slots.length, 1)}, minmax(0, 1fr))` }}>
                      {draft.slots.map((slot) => {
                        const usual = draft.showTypes.find((s) => s.id === draft.weekly[weekday]?.[slot.id])
                        const value = o.shows && slot.id in o.shows ? (o.shows[slot.id] ?? OFF) : INHERIT
                        return (
                          <label key={slot.id} className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {slot.label}
                            <select
                              className={selectClass}
                              value={value}
                              onChange={(e) => {
                                const shows = { ...o.shows }
                                if (e.target.value === INHERIT) delete shows[slot.id]
                                else shows[slot.id] = e.target.value === OFF ? null : e.target.value
                                patchOverride(iso, { ...o, shows })
                              }}
                            >
                              <option value={INHERIT}>Usual ({usual?.name ?? "Off"})</option>
                              <option value={OFF}>Off</option>
                              {draft.showTypes.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                          </label>
                        )
                      })}
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">No date changes yet.</p>
        )}
      </Panel>

      <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 p-3 shadow-xl backdrop-blur">
        <Link
          href="/schedule"
          target="_blank"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          View schedule
          <ExternalLink className="size-3.5" aria-hidden="true" />
        </Link>
        <div className="flex items-center gap-3">
          {status ? (
            <span role="status" className={cn("text-xs font-semibold", status.ok ? "text-primary" : "text-destructive")}>
              {status.text}
            </span>
          ) : null}
          <button
            type="button"
            onClick={save}
            disabled={pending || !dirty}
            className="rounded-full bg-primary px-5 py-2 text-xs font-black uppercase tracking-wider text-primary-foreground transition-opacity disabled:opacity-50"
          >
            {pending ? "Saving..." : "Save schedule"}
          </button>
        </div>
      </div>
    </div>
  )
}
