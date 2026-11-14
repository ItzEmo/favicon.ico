export const SHOW_COLORS = ["cyan", "pink", "violet", "amber"] as const
export type ShowColor = (typeof SHOW_COLORS)[number]

export const SHOW_ICONS = ["gamepad", "music", "mic", "radio", "star"] as const
export type ShowIcon = (typeof SHOW_ICONS)[number]

export interface ShowType {
  id: string
  name: string
  tagline: string
  color: ShowColor
  icon: ShowIcon
}

export interface ScheduleSlot {
  id: string
  label: string
  time: string
}

/** slot id -> show id, or null for no show in that slot. */
export type SlotShows = Record<string, string | null>

export interface DayOverride {
  off?: boolean
  note?: string
  /** Only the slots listed here replace the weekly template; missing slots keep the usual show. */
  shows?: SlotShows
}

export interface Schedule {
  title: string
  subtitle: string
  footnote: string
  showTypes: ShowType[]
  slots: ScheduleSlot[]
  /** Index 0 = Sunday ... 6 = Saturday. */
  weekly: SlotShows[]
  /** Keyed by YYYY-MM-DD. */
  overrides: Record<string, DayOverride>
}

export const WEEKDAY_SHORT = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
export const WEEKDAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
/** Monday-first display order. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]

const gaming = "gaming"
const music = "music"

export const DEFAULT_SCHEDULE: Schedule = {
  title: "Weekly Live Schedule",
  subtitle: "Monday – Saturday · Sundays we recharge",
  footnote: "All times EST · Same energy, opposite side of the day",
  showTypes: [
    { id: gaming, name: "Gaming + In the Booooooth", tagline: "Reactions to what y'all send!", color: "cyan", icon: "gamepad" },
    { id: music, name: "Live Music Reviews", tagline: "Rate. React. Repeat.", color: "pink", icon: "music" },
  ],
  slots: [
    { id: "am", label: "Early AM", time: "– 4:30 PM" },
    { id: "pm", label: "Evening", time: "~8:30 PM +" },
  ],
  weekly: [
    { am: null, pm: null },
    { am: gaming, pm: music },
    { am: music, pm: gaming },
    { am: gaming, pm: music },
    { am: music, pm: gaming },
    { am: gaming, pm: music },
    { am: music, pm: gaming },
  ],
  overrides: {},
}

export interface ResolvedEntry {
  slot: ScheduleSlot
  show: ShowType | null
  changed: boolean
}

export interface ResolvedDay {
  iso: string
  off: boolean
  note: string | null
  overridden: boolean
  entries: ResolvedEntry[]
}

export function resolveDay(schedule: Schedule, iso: string): ResolvedDay {
  const weekday = parseIso(iso).getDay()
  const base = schedule.weekly[weekday] ?? {}
  const override = schedule.overrides[iso]
  const byId = new Map(schedule.showTypes.map((s) => [s.id, s]))

  const entries = schedule.slots.map((slot) => {
    const changed = !!override?.shows && slot.id in override.shows
    const showId = changed ? override!.shows![slot.id] : base[slot.id]
    return { slot, show: (showId && byId.get(showId)) || null, changed }
  })

  const off = override?.off === true || entries.every((e) => !e.show)
  return {
    iso,
    off,
    note: override?.note || null,
    overridden: !!override,
    entries: override?.off ? entries.map((e) => ({ ...e, show: null })) : entries,
  }
}

export function toIso(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${m}-${day}`
}

export function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
}

export function startOfWeek(d: Date): Date {
  return addDays(d, -((d.getDay() + 6) % 7))
}

export function todayIso(timeZone = "America/New_York"): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())
}

const ID_RE = /^[a-z0-9-]{1,40}$/
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/

function text(v: unknown, max: number, fallback = ""): string {
  return typeof v === "string" ? v.trim().slice(0, max) : fallback
}

function record(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
}

/** Validates untrusted input into a well-formed schedule. */
export function sanitizeSchedule(raw: unknown): Schedule {
  const src = record(raw)

  const showTypes: ShowType[] = []
  for (const item of Array.isArray(src.showTypes) ? src.showTypes.slice(0, 8) : []) {
    const s = record(item)
    const id = text(s.id, 40)
    if (!ID_RE.test(id) || showTypes.some((t) => t.id === id)) continue
    showTypes.push({
      id,
      name: text(s.name, 48) || "Untitled show",
      tagline: text(s.tagline, 80),
      color: SHOW_COLORS.includes(s.color as ShowColor) ? (s.color as ShowColor) : "violet",
      icon: SHOW_ICONS.includes(s.icon as ShowIcon) ? (s.icon as ShowIcon) : "radio",
    })
  }

  const slots: ScheduleSlot[] = []
  for (const item of Array.isArray(src.slots) ? src.slots.slice(0, 4) : []) {
    const s = record(item)
    const id = text(s.id, 40)
    if (!ID_RE.test(id) || slots.some((t) => t.id === id)) continue
    slots.push({ id, label: text(s.label, 24) || "Slot", time: text(s.time, 24) })
  }

  const showIds = new Set(showTypes.map((s) => s.id))
  const validShow = (v: unknown) => (typeof v === "string" && showIds.has(v) ? v : null)

  const weeklySrc = Array.isArray(src.weekly) ? src.weekly : []
  const weekly = Array.from({ length: 7 }, (_, i) => {
    const day = record(weeklySrc[i])
    return Object.fromEntries(slots.map((slot) => [slot.id, validShow(day[slot.id])]))
  })

  const overrides: Record<string, DayOverride> = {}
  for (const [iso, value] of Object.entries(record(src.overrides)).slice(0, 400)) {
    if (!ISO_RE.test(iso) || Number.isNaN(parseIso(iso).getTime())) continue
    const o = record(value)
    const showsSrc = record(o.shows)
    const shows: SlotShows = {}
    for (const slot of slots) {
      if (!(slot.id in showsSrc)) continue
      const v = showsSrc[slot.id]
      if (v === null) shows[slot.id] = null
      else if (validShow(v)) shows[slot.id] = v as string
    }
    const entry: DayOverride = {}
    if (o.off === true) entry.off = true
    const note = text(o.note, 120)
    if (note) entry.note = note
    if (Object.keys(shows).length) entry.shows = shows
    if (Object.keys(entry).length) overrides[iso] = entry
  }

  return {
    title: text(src.title, 60) || DEFAULT_SCHEDULE.title,
    subtitle: text(src.subtitle, 100),
    footnote: text(src.footnote, 120),
    showTypes,
    slots,
    weekly,
    overrides,
  }
}
