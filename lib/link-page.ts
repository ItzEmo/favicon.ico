export const LINK_BACKGROUNDS = {
  rain: { label: "Rain", src: "/images/unlock-rain-bg.webp" },
  city: { label: "Neon City", src: "/images/link-bg-city.webp" },
  stage: { label: "Stage", src: "/images/link-bg-stage.webp" },
  studio: { label: "Studio", src: "/images/link-bg-studio.webp" },
} as const

export type PresetBackground = keyof typeof LINK_BACKGROUNDS
export type LinkBackground = PresetBackground | "custom"

export const LINK_ACCENTS = {
  violet: { label: "Violet", color: "oklch(0.62 0.21 300)", foreground: "oklch(0.98 0.01 310)" },
  pink: { label: "Pink", color: "oklch(0.7 0.2 350)", foreground: "oklch(0.18 0.04 350)" },
  cyan: { label: "Cyan", color: "oklch(0.78 0.13 210)", foreground: "oklch(0.18 0.04 230)" },
  amber: { label: "Amber", color: "oklch(0.82 0.15 75)", foreground: "oklch(0.2 0.04 60)" },
  lime: { label: "Lime", color: "oklch(0.85 0.18 135)", foreground: "oklch(0.2 0.05 140)" },
  red: { label: "Red", color: "oklch(0.63 0.23 27)", foreground: "oklch(0.98 0.01 27)" },
  orange: { label: "Orange", color: "oklch(0.74 0.18 50)", foreground: "oklch(0.2 0.05 50)" },
  yellow: { label: "Yellow", color: "oklch(0.92 0.17 100)", foreground: "oklch(0.22 0.05 100)" },
  emerald: { label: "Emerald", color: "oklch(0.72 0.16 160)", foreground: "oklch(0.18 0.04 160)" },
  teal: { label: "Teal", color: "oklch(0.7 0.12 190)", foreground: "oklch(0.16 0.03 190)" },
  blue: { label: "Blue", color: "oklch(0.62 0.19 255)", foreground: "oklch(0.98 0.01 255)" },
  indigo: { label: "Indigo", color: "oklch(0.55 0.2 275)", foreground: "oklch(0.98 0.01 275)" },
  rose: { label: "Rose", color: "oklch(0.8 0.1 10)", foreground: "oklch(0.2 0.04 10)" },
  silver: { label: "Silver", color: "oklch(0.88 0.01 260)", foreground: "oklch(0.18 0.01 260)" },
  gold: { label: "Gold", color: "oklch(0.75 0.12 85)", foreground: "oklch(0.18 0.03 85)" },
} as const

export type LinkAccent = keyof typeof LINK_ACCENTS

export const LINK_EFFECTS = {
  none: { label: "No effect" },
  rain: { label: "Rain" },
  storm: { label: "Lightning & Thunder" },
  snow: { label: "Snow" },
  wind: { label: "Windy" },
} as const

export type LinkEffect = keyof typeof LINK_EFFECTS

export function isLinkEffect(value: string): value is LinkEffect {
  return value in LINK_EFFECTS
}

export const MAX_BG_BYTES = 10 * 1024 * 1024

// Hosts we're willing to fetch GIFs from server-side, to avoid fetching arbitrary URLs.
const GIF_HOSTS = [/^(media\d*|i)\.giphy\.com$/, /^(media\d*|c)\.tenor\.com$/]

export function parseGifUrl(raw: string): URL {
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    throw new Error("That isn't a valid link")
  }
  if (url.protocol !== "https:" || !GIF_HOSTS.some((h) => h.test(url.hostname))) {
    throw new Error("Paste a direct GIF link from Giphy or Tenor (media.giphy.com / media.tenor.com)")
  }
  return url
}

export const MAX_BIO_LENGTH = 160
export const MAX_CUSTOM_LINKS = 7
export const MAX_LINK_TITLE_LENGTH = 60

export interface CustomLink {
  title: string
  url: string
}

/** Cleans submitted rows, dropping fully empty ones. Throws a readable error on bad input. */
export function parseCustomLinks(titles: string[], urls: string[]): CustomLink[] {
  const links: CustomLink[] = []
  const count = Math.max(titles.length, urls.length)
  for (let i = 0; i < count; i++) {
    const title = String(titles[i] ?? "").trim()
    let raw = String(urls[i] ?? "").trim()
    if (!title && !raw) continue
    if (!raw) throw new Error(`Add a URL for "${title}"`)
    if (raw.length > 500) throw new Error("One of your links is too long")
    if (!/^[a-z][a-z0-9+.-]*:/i.test(raw)) raw = `https://${raw}`
    let url: URL
    try {
      url = new URL(raw)
    } catch {
      throw new Error(`"${raw}" isn't a valid link`)
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Links must be web addresses")
    if (title.length > MAX_LINK_TITLE_LENGTH) {
      throw new Error(`Link titles must be ${MAX_LINK_TITLE_LENGTH} characters or fewer`)
    }
    links.push({ title: title || url.hostname.replace(/^www\./, ""), url: url.toString() })
  }
  if (links.length > MAX_CUSTOM_LINKS) throw new Error(`You can add up to ${MAX_CUSTOM_LINKS} links`)
  return links
}

export function coerceCustomLinks(value: unknown): CustomLink[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((l): l is CustomLink => !!l && typeof l.title === "string" && typeof l.url === "string")
    .slice(0, MAX_CUSTOM_LINKS)
}

export function isPresetBackground(value: string): value is PresetBackground {
  return value in LINK_BACKGROUNDS
}

export function isLinkAccent(value: string): value is LinkAccent {
  return value in LINK_ACCENTS
}

export const LINK_HEADER_STYLES = {
  avatar: { label: "Profile picture", description: "Your photo bubble with your name below.", licensed: true },
  name: { label: "Artist name", description: "Just your name, in the Emo's Radio bubble font.", licensed: true },
  glass: { label: "Glass name", description: "Just your name, in clear liquid-glass lettering.", licensed: true },
  // Personal-use-only fonts: flip `licensed` to true once a commercial license is on file.
  disco: { label: "70s Disco", description: "Just your name, in a retro disco script.", licensed: false },
  travelers: { label: "Air Travelers", description: "Just your name, in a bold vintage script.", licensed: false },
} as const

export type LinkHeaderStyle = keyof typeof LINK_HEADER_STYLES

export function isLinkHeaderStyle(value: string): value is LinkHeaderStyle {
  return value in LINK_HEADER_STYLES
}

export function isAvailableHeaderStyle(value: string): value is LinkHeaderStyle {
  return isLinkHeaderStyle(value) && LINK_HEADER_STYLES[value].licensed
}

// 3-24 chars, lowercase letters, numbers and single dashes, no leading/trailing dash.
const HANDLE_PATTERN = /^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){2,23}$/

export function normalizeHandle(raw: string): string {
  const handle = raw.trim().toLowerCase().replace(/^@/, "").replace(/\s+/g, "-")
  if (!HANDLE_PATTERN.test(handle)) {
    throw new Error("Link name must be 3–24 characters: letters, numbers and dashes")
  }
  return handle
}

export function linkPath(handle: string) {
  return `/u/${handle}`
}
