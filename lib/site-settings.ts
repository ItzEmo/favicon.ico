import "server-only"

import { sql } from "@/lib/db"

export const DEFAULT_UNLOCK_BG = "/images/unlock-rain-bg.webp"
export const UNLOCK_BG_KEY = "unlock_bg"
export const UNLOCK_BG_PREFIX = "/api/admin/unlock-bg?p="

export async function getUnlockBackground(): Promise<string | null> {
  const rows = (await sql`SELECT value FROM site_settings WHERE key = ${UNLOCK_BG_KEY}`) as { value: string | null }[]
  return rows[0]?.value || null
}

export async function setUnlockBackground(url: string | null) {
  await sql`
    INSERT INTO site_settings (key, value, updated_at) VALUES (${UNLOCK_BG_KEY}, ${url}, now())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
  `
}
