import "server-only"

import type Stripe from "stripe"
import { sql } from "@/lib/db"
import { isLineId } from "@/lib/lines"
import { catalogAmount, catalogKeyForLine } from "@/lib/stripe-catalog"

const BOOST_CENTS = 500

function expectedAmount(action: string, line: string | undefined): number | null {
  if (action === "boost") return catalogAmount("queue_boost")
  if ((action === "submit" || action === "skip") && line && isLineId(line) && line !== "free") {
    return catalogAmount(catalogKeyForLine(line))
  }
  return null
}

// Applies a confirmed, paid Checkout Session to the queue. Called by both the
// embedded-checkout completion handler and the Stripe webhook; the
// processed_payments ledger guarantees each session is applied exactly once,
// in the same statement as the queue update.
//
// Queue order: line (Skip+ > Skip > Boost > Free), then total boost paid,
// then who boosted first, then who entered the line first.
export async function applyPaidSession(session: Stripe.Checkout.Session): Promise<boolean> {
  if (session.payment_status !== "paid") return false

  const metadata = session.metadata ?? {}
  const trackId = metadata.trackId
  const action = metadata.action
  const line = metadata.line
  if (!trackId || !action) return false

  const expected = expectedAmount(action, line)
  if (expected === null || session.amount_total !== expected || session.currency !== "usd") {
    console.log("[v0] Rejected session with unexpected amount:", session.id)
    return false
  }

  if (action === "submit" && line && isLineId(line)) {
    // A Boost-line submission enters the top of the Free line, behind any
    // earlier boosts.
    const boostCents = line === "boost" ? BOOST_CENTS : 0
    await sql`
      WITH claim AS (
        INSERT INTO processed_payments (session_id, track_id, action)
        VALUES (${session.id}, ${trackId}, 'submit')
        ON CONFLICT (session_id) DO NOTHING
        RETURNING 1
      )
      UPDATE submissions
      SET status = 'active',
          paid_at = now(),
          entered_at = now(),
          boost_cents = ${boostCents},
          boosted = ${boostCents > 0},
          boosted_at = CASE WHEN ${boostCents} > 0 THEN now() ELSE NULL END
      WHERE track_id = ${trackId} AND status = 'pending' AND line = ${line}
        AND EXISTS (SELECT 1 FROM claim)
    `

    // Skip+ bonus song: queued right behind the first track. The claim above
    // already recorded this session, so key idempotency on the first track
    // having just gone live with this payment.
    const bonusTrackId = metadata.bonusTrackId
    if (line === "skipplus" && bonusTrackId && bonusTrackId !== trackId) {
      await sql`
        UPDATE submissions
        SET status = 'active',
            paid_at = now(),
            entered_at = now() + interval '1 millisecond',
            boost_cents = 0,
            boosted = FALSE,
            boosted_at = NULL
        WHERE track_id = ${bonusTrackId} AND status = 'pending' AND line = 'skipplus'
          AND EXISTS (
            SELECT 1 FROM processed_payments
            WHERE session_id = ${session.id} AND track_id = ${trackId}
          )
      `
    }
    return true
  }

  if (action === "skip" && line && isLineId(line)) {
    // Upgrading lines starts the track at the back of its new line.
    await sql`
      WITH claim AS (
        INSERT INTO processed_payments (session_id, track_id, action)
        VALUES (${session.id}, ${trackId}, 'skip')
        ON CONFLICT (session_id) DO NOTHING
        RETURNING 1
      )
      UPDATE submissions
      SET line = ${line},
          paid_at = now(),
          entered_at = now(),
          boost_cents = 0,
          boosted = FALSE,
          boosted_at = NULL
      WHERE track_id = ${trackId} AND status = 'active'
        AND EXISTS (SELECT 1 FROM claim)
    `
    return true
  }

  if (action === "boost") {
    // Free track: first boost lifts it to the top of the Free line.
    // Already-boosted Free track: a second boost moves it into the Skip line.
    // Skip / Skip+ track: boosts stack; more paid ranks higher in that line.
    await sql`
      WITH claim AS (
        INSERT INTO processed_payments (session_id, track_id, action)
        VALUES (${session.id}, ${trackId}, 'boost')
        ON CONFLICT (session_id) DO NOTHING
        RETURNING 1
      )
      UPDATE submissions
      SET line = CASE line WHEN 'free' THEN 'boost' WHEN 'boost' THEN 'skip' ELSE line END,
          entered_at = CASE WHEN line = 'boost' THEN now() ELSE entered_at END,
          boost_cents = CASE WHEN line = 'boost' THEN 0 ELSE boost_cents + ${BOOST_CENTS} END,
          boosted = CASE WHEN line = 'boost' THEN FALSE ELSE TRUE END,
          boosted_at = CASE
            WHEN line = 'boost' THEN NULL
            ELSE COALESCE(boosted_at, now())
          END
      WHERE track_id = ${trackId} AND status = 'active'
        AND EXISTS (SELECT 1 FROM claim)
    `
    return true
  }

  return false
}
