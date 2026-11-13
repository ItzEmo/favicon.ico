import "server-only"

import { sql } from "@/lib/db"
import { DEFAULT_SCHEDULE, sanitizeSchedule, type Schedule } from "@/lib/schedule-types"

const SCHEDULE_KEY = "live_schedule"

export async function getSchedule(): Promise<Schedule> {
  const rows = (await sql`SELECT value FROM site_settings WHERE key = ${SCHEDULE_KEY}`) as { value: string | null }[]
  const value = rows[0]?.value
  if (!value) return DEFAULT_SCHEDULE
  try {
    return sanitizeSchedule(JSON.parse(value))
  } catch {
    return DEFAULT_SCHEDULE
  }
}

export async function saveSchedule(schedule: Schedule) {
  const value = JSON.stringify(schedule)
  await sql`
    INSERT INTO site_settings (key, value, updated_at) VALUES (${SCHEDULE_KEY}, ${value}, now())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
  `
}
