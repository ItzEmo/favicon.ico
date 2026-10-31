import "server-only"

import { sql } from "@/lib/db"

const LIVE_ON_KEY = "tiktok_live_on"
const LIVE_HANDLE_KEY = "tiktok_live_handle"

export interface TikTokLiveStatus {
  live: boolean
  handle: string | null
  url: string | null
  avatar: string | null
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

// TikTok has no public avatar API, so read it from the profile page. The CDN
// URLs are signed and expire after a few days, hence the 6-hour revalidation.
export async function getTikTokAvatar(handle: string): Promise<string | null> {
  try {
    const res = await fetch(`https://www.tiktok.com/@${encodeURIComponent(handle)}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      next: { revalidate: 21600 },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const html = await res.text()
    const match =
      html.match(/"avatarLarger":"([^"]+)"/) ??
      html.match(/"avatarMedium":"([^"]+)"/) ??
      html.match(/"avatarThumb":"([^"]+)"/)
    if (!match) return null
    const url = JSON.parse(`"${match[1]}"`) as string
    return /^https:\/\/[^/]+\.tiktokcdn(-[a-z]+)?\.com\//.test(url) ? url : null
  } catch {
    return null
  }
}

export async function getTikTokLiveStatus(): Promise<TikTokLiveStatus> {
  const rows = (await sql`
    SELECT key, value FROM site_settings WHERE key IN (${LIVE_ON_KEY}, ${LIVE_HANDLE_KEY})
  `) as { key: string; value: string | null }[]
  const map = new Map(rows.map((r) => [r.key, r.value]))
  const handle = map.get(LIVE_HANDLE_KEY) || null
  const live = map.get(LIVE_ON_KEY) === "true" && !!handle
  return {
    live,
    handle,
    url: handle ? tiktokLiveUrl(handle) : null,
    avatar: live && handle ? await getTikTokAvatar(handle) : null,
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
