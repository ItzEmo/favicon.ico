// Guests can submit without an account, so the ids of tracks submitted from
// this device are remembered locally to power "your song is coming up" alerts.
const KEY = "emo-my-tracks"
const MAX = 20
export const MY_TRACKS_EVENT = "emo-my-tracks-change"

export function getDeviceTrackIds(): string[] {
  if (typeof window === "undefined") return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? "[]")
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : []
  } catch {
    return []
  }
}

export function rememberTrack(...ids: (string | null | undefined)[]) {
  const next = [...new Set([...ids.filter(Boolean), ...getDeviceTrackIds()])].slice(0, MAX) as string[]
  window.localStorage.setItem(KEY, JSON.stringify(next))
  window.dispatchEvent(new Event(MY_TRACKS_EVENT))
}
