export interface VaultEntry {
  id: number
  trackId: string | null
  title: string
  artist: string
  genre: string
  score: number
  verdict: string
  notes: string
  url: string | null
  reviewedAt: string
}

export interface VaultInput {
  title: string
  artist: string
  genre: string
  score: number
  verdict: string
  notes: string
}

export const VERDICT_SUGGESTIONS = ["Heater", "Certified", "Solid", "Grower", "Mid", "Needs work"]

export function formatReviewDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
}
