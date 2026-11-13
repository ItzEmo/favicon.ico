export const RELEASE_EYEBROWS = {
  out_now: "Out now",
  new_single: "New single",
  latest: "Latest drop",
  coming_soon: "Coming soon",
} as const

export type ReleaseEyebrow = keyof typeof RELEASE_EYEBROWS

export const RELEASE_PLATFORMS = {
  apple: { label: "Apple Music", icon: "apple_music", hosts: /^(music|itunes)\.apple\.com$/, placeholder: "https://music.apple.com/..." },
  spotify: { label: "Spotify", icon: "spotify", hosts: /^(open\.spotify\.com|spotify\.link)$/, placeholder: "https://open.spotify.com/track/..." },
  youtube: { label: "YouTube", icon: "youtube", hosts: /^((www|m|music)\.)?youtube\.com$|^youtu\.be$/, placeholder: "https://youtu.be/..." },
} as const

export type ReleasePlatformKey = keyof typeof RELEASE_PLATFORMS
export const RELEASE_PLATFORM_KEYS = Object.keys(RELEASE_PLATFORMS) as ReleasePlatformKey[]

export const MAX_RELEASE_TITLE = 60
export const MAX_COVER_BYTES = 5 * 1024 * 1024

export interface ReleaseSetup {
  title: string
  eyebrow: ReleaseEyebrow
  links: Partial<Record<ReleasePlatformKey, string>>
}

export function isReleaseEyebrow(value: string): value is ReleaseEyebrow {
  return value in RELEASE_EYEBROWS
}

/** Validates a pasted platform link, returning null when the field was left empty. */
export function parseReleaseLink(key: ReleasePlatformKey, raw: string): string | null {
  let value = raw.trim()
  if (!value) return null
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error(`That ${RELEASE_PLATFORMS[key].label} link isn't valid`)
  }
  if (url.protocol !== "https:" || !RELEASE_PLATFORMS[key].hosts.test(url.hostname) || value.length > 500) {
    throw new Error(`Paste a ${RELEASE_PLATFORMS[key].label} link in the ${RELEASE_PLATFORMS[key].label} field`)
  }
  return url.toString()
}

export function coerceReleaseSetup(value: unknown): ReleaseSetup | null {
  if (!value || typeof value !== "object") return null
  const v = value as Record<string, unknown>
  if (typeof v.title !== "string" || !v.title.trim()) return null
  const rawLinks = (v.links && typeof v.links === "object" ? v.links : {}) as Record<string, unknown>
  const links: ReleaseSetup["links"] = {}
  for (const key of RELEASE_PLATFORM_KEYS) {
    if (typeof rawLinks[key] === "string") links[key] = rawLinks[key] as string
  }
  return {
    title: v.title.slice(0, MAX_RELEASE_TITLE),
    eyebrow: typeof v.eyebrow === "string" && isReleaseEyebrow(v.eyebrow) ? v.eyebrow : "out_now",
    links,
  }
}
