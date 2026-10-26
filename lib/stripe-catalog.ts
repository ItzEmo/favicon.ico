import "server-only"

import { stripe } from "@/lib/stripe"
import { BOOST_PRICE_IN_CENTS, LINES, type LineId } from "@/lib/lines"

// Every paid thing the site sells, organized as real Stripe Products + Prices.
// Prices are found by lookup_key, so the same code works in test and live mode:
// the first checkout in a fresh Stripe account creates the catalog, and later
// checkouts reuse it. If an amount in lib/lines.ts changes, a new Price is
// created and the lookup_key moves to it automatically.
export type CatalogKey =
  | "line_skipplus"
  | "line_skip"
  | "line_boost"
  | "queue_boost"
  | "mix_master"

export const MIX_MASTER_PRICE_IN_CENTS = 3000

interface CatalogEntry {
  productName: string
  description: string
  amount: number
}

const CATALOG: Record<CatalogKey, CatalogEntry> = {
  line_skipplus: {
    productName: "Skip+ Line",
    description: LINES.skipplus.blurb,
    amount: LINES.skipplus.priceInCents,
  },
  line_skip: {
    productName: "Skip Line",
    description: LINES.skip.blurb,
    amount: LINES.skip.priceInCents,
  },
  line_boost: {
    productName: "Boost Line",
    description: LINES.boost.blurb,
    amount: LINES.boost.priceInCents,
  },
  queue_boost: {
    productName: "Queue Boost (Add-on)",
    description: "Bumps a track already in the queue to the top of its current line.",
    amount: BOOST_PRICE_IN_CENTS,
  },
  mix_master: {
    productName: "Mix & Mastering",
    description: "An exclusive Mix & Master by ItzEmo himself.",
    amount: MIX_MASTER_PRICE_IN_CENTS,
  },
}

export function catalogKeyForLine(line: Exclude<LineId, "free">): CatalogKey {
  return `line_${line}` as CatalogKey
}

export function catalogAmount(key: CatalogKey): number {
  return CATALOG[key].amount
}

const LOOKUP_PREFIX = "track_review_"
const priceCache = new Map<CatalogKey, string>()

export async function getCatalogPriceId(key: CatalogKey): Promise<string> {
  const cached = priceCache.get(key)
  if (cached) return cached

  const entry = CATALOG[key]
  const lookupKey = `${LOOKUP_PREFIX}${key}`

  const existing = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  })
  const current = existing.data[0]
  if (current && current.unit_amount === entry.amount && current.currency === "usd") {
    priceCache.set(key, current.id)
    return current.id
  }

  // Reuse the product if a previous price exists, otherwise create it.
  const productId =
    current && typeof current.product === "string"
      ? current.product
      : (
          await stripe.products.create({
            name: entry.productName,
            description: entry.description,
            metadata: { catalog_key: key, app: "track-review" },
          })
        ).id

  const price = await stripe.prices.create({
    product: productId,
    currency: "usd",
    unit_amount: entry.amount,
    lookup_key: lookupKey,
    transfer_lookup_key: true,
    metadata: { catalog_key: key },
  })

  priceCache.set(key, price.id)
  return price.id
}
