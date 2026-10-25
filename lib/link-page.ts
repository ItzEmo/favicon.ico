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
} as const

export type LinkAccent = keyof typeof LINK_ACCENTS

export const MAX_BIO_LENGTH = 160

export function isPresetBackground(value: string): value is PresetBackground {
  return value in LINK_BACKGROUNDS
}

export function isLinkAccent(value: string): value is LinkAccent {
  return value in LINK_ACCENTS
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
