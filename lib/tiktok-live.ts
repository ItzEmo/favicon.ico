import "server-only"

import { sql } from "@/lib/db"

const LIVE_ON_KEY = "tiktok_live_on"
const LIVE_HANDLE_KEY = "tiktok_live_handle"

export interface TikTokLiveStatus {
  live: boolean
  handle: string | null
  url: string | null
}

export function normalizeTikTokHandle(raw: string): string | null {
  const handle = raw.trim().replace(/^https?:\/\/(www\.)?tiktok\.com\//i, "").replace(/^@/, "").split(/[/?#]/)[0]
  if (!handle) return null
  if (!/^[A-Za-z0-9._]{2,24}$/.test(handle)) throw new Error("That doesn't look like a TikTok username")
  return handle
}

export function tiktokLiveUrl(handle: string) {
  return `https://www.tiktok.com/@${handle}/live`
}

export async function getTikTokLiveStatus(): Promise<TikTokLiveStatus> {
  const rows = (await sql`
    SELECT key, value FROM site_settings WHERE key IN (${LIVE_ON_KEY}, ${LIVE_HANDLE_KEY})
  `) as { key: string; value: string | null }[]
  const map = new Map(rows.map((r) => [r.key, r.value]))
  const handle = map.get(LIVE_HANDLE_KEY) || null
  return {
    live: map.get(LIVE_ON_KEY) === "true" && !!handle,
    handle,
    url: handle ? tiktokLiveUrl(handle) : null,
  }
}

async function setSetting(key: string, value: string | null) {
  await sql`
    INSERT INTO site_settings (key, value, updated_at) VALUES (${key}, ${value}, now())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
  `
}

export async function saveTikTokLive(handle: string | null, live: boolean) {
  await setSetting(LIVE_HANDLE_KEY, handle)
  await setSetting(LIVE_ON_KEY, live && handle ? "true" : "false")
}
