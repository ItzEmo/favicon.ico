// Source of truth for the submission lines and their pricing.
// Prices are always validated on the server from this file — the client
// only ever sends a line id, never an amount.

export type LineId = "free" | "boost" | "skip" | "skipplus"

export interface LineConfig {
  id: LineId
  name: string
  shortName: string
  priceInCents: number
  // Lower rank = higher priority in the queue.
  rank: number
  blurb: string
}

export const LINES: Record<LineId, LineConfig> = {
  skipplus: {
    id: "skipplus",
    name: "Skip+ Submission Line",
    shortName: "Skip+",
    priceInCents: 2000, // $20.00
    rank: 0,
    blurb: "Jump ahead of everyone — even the regular Skip line. Front of the queue.",
  },
  skip: {
    id: "skip",
    name: "Skip Submission Line",
    shortName: "Skip",
    priceInCents: 1000, // $10.00
    rank: 1,
    blurb: "Skip the entire Free line and get reviewed ahead of free submissions.",
  },
  boost: {
    id: "boost",
    name: "Boost Submission Line",
    shortName: "Boost",
    priceInCents: 500, // $5.00
    rank: 2,
    blurb: "Jump above the whole Free line — without skipping the Skip or Skip+ lines.",
  },
  free: {
    id: "free",
    name: "Free Submission Line",
    shortName: "Free",
    priceInCents: 0,
    rank: 3,
    blurb: "No cost. Gets 1:30 of play time and is reviewed after all paid lines.",
  },
}

export const LINE_ORDER: LineId[] = ["skipplus", "skip", "boost", "free"]

// The $5 add-on that bumps a track to the top of whichever line it is in.
export const BOOST_PRICE_IN_CENTS = 500 // $5.00

export function isLineId(value: unknown): value is LineId {
  return value === "free" || value === "boost" || value === "skip" || value === "skipplus"
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`
}
