"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { sql } from "@/lib/db"
import { auth } from "@/lib/auth"
import { stripe } from "@/lib/stripe"
import { applyPaidSession } from "@/lib/apply-payment"
import { getQueueStatus, type QueueStatus } from "@/lib/queue-settings"
import { LINES, type LineId, isLineId } from "@/lib/lines"
import { type CatalogKey, catalogKeyForLine, getCatalogPriceId } from "@/lib/stripe-catalog"
import type { QueueItem, Source } from "@/components/track-types"

interface NewSubmissionInput {
  trackId: string
  url: string
  title: string
  submittedBy: string
  source: Source
  audioPathname?: string | null
}

interface CheckoutResult {
  clientSecret: string
  sessionId: string
  publishableKey: string
}

const SOURCES: Source[] = ["spotify", "soundcloud", "youtube", "apple", "bandcamp", "link"]
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Server-side validation: never trust what the browser sends.
function sanitizeSubmission(input: NewSubmissionInput): NewSubmissionInput {
  const trackId = String(input.trackId ?? "")
  if (!UUID_RE.test(trackId)) throw new Error("Invalid track id")

  const url = String(input.url ?? "").trim()
  const title = String(input.title ?? "").trim()
  const submittedBy = String(input.submittedBy ?? "").trim()
  if (!url || url.length > 500) throw new Error("Invalid track link")
  if (!title || title.length > 200) throw new Error("Track title is required")
  if (!submittedBy || submittedBy.length > 80) throw new Error("Artist name is required")

  const source = SOURCES.includes(input.source) ? input.source : "link"
  const audioPathname = input.audioPathname ? String(input.audioPathname) : null
  if (audioPathname && (!audioPathname.startsWith("submissions/") || audioPathname.length > 300)) {
    throw new Error("Invalid audio file")
  }

  return { trackId, url, title, submittedBy, source, audioPathname }
}

// Submitting doesn't require an account, but signed-in artists get their
// songs linked so they show up on their Account page.
async function getSessionUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null)
  return session?.user.id ?? null
}

const LINE_PRIORITY: Record<LineId, number> = { skipplus: 0, skip: 1, boost: 2, free: 3 }

async function getActiveTrackLine(trackId: string): Promise<LineId | null> {
  const rows = (await sql`
    SELECT line FROM submissions WHERE track_id = ${trackId} AND status = 'active' LIMIT 1
  `) as { line: string }[]
  const line = rows[0]?.line
  return line && isLineId(line) ? line : null
}

// The live queue: Skip+ > Skip > Boost (top of Free) > Free. Within a line,
// more boost paid ranks higher; ties go to whoever boosted first, then to
// whoever entered the line first. A later boost never passes an earlier one.
export async function getQueue(): Promise<QueueItem[]> {
  const rows = (await sql`
    SELECT track_id, url, title, submitted_by, source, line, boosted, created_at, audio_pathname
    FROM submissions
    WHERE status = 'active'
    ORDER BY
      CASE line WHEN 'skipplus' THEN 0 WHEN 'skip' THEN 1 WHEN 'boost' THEN 2 ELSE 3 END ASC,
      boost_cents DESC,
      boosted_at ASC NULLS LAST,
      entered_at ASC NULLS LAST,
      created_at ASC
  `) as Record<string, unknown>[]

  return rows.map(toQueueItem)
}

// The track the DJ has put on air. It's held outside the queue (status
// 'playing'), so no Skip+/Skip purchase can ever displace it — paid lines
// always line up underneath Now Playing.
export async function getNowPlaying(): Promise<QueueItem | null> {
  const rows = (await sql`
    SELECT track_id, url, title, submitted_by, source, line, boosted, created_at, audio_pathname
    FROM submissions
    WHERE status = 'playing'
    ORDER BY played_at DESC NULLS LAST
    LIMIT 1
  `) as Record<string, unknown>[]
  return rows[0] ? toQueueItem(rows[0]) : null
}

function toQueueItem(r: Record<string, unknown>): QueueItem {
  return {
    trackId: r.track_id as string,
    url: r.url as string,
    title: r.title as string,
    submittedBy: r.submitted_by as string,
    source: r.source as Source,
    line: r.line as QueueItem["line"],
    boosted: r.boosted as boolean,
    createdAt: new Date(r.created_at as string).toISOString(),
    audioPathname: (r.audio_pathname as string | null) ?? null,
  }
}

export async function getPublicQueueStatus(): Promise<QueueStatus> {
  return getQueueStatus()
}

// Free line: no payment, goes live immediately.
export async function createFreeSubmission(raw: NewSubmissionInput): Promise<void> {
  if (!(await getQueueStatus()).freeOpen) throw new Error("The Free line is closed")
  const input = sanitizeSubmission(raw)
  const userId = await getSessionUserId()
  await sql`
    INSERT INTO submissions (track_id, url, title, submitted_by, source, line, status, audio_pathname, entered_at, user_id)
    VALUES (${input.trackId}, ${input.url}, ${input.title}, ${input.submittedBy}, ${input.source}, 'free', 'active', ${input.audioPathname ?? null}, now(), ${userId})
    ON CONFLICT (track_id) DO NOTHING
  `
  revalidatePath("/queue")
}

// Paid line (skip / skip+): store the track as pending, then open Checkout.
// The track only becomes visible in the queue after payment is confirmed.
// A Skip+ purchase may include one optional bonus track, which joins the
// Skip+ line right behind the first track when payment is confirmed.
export async function createPaidSubmission(
  raw: NewSubmissionInput,
  line: LineId,
  rawBonus?: NewSubmissionInput | null,
): Promise<CheckoutResult> {
  if (!isLineId(line) || line === "free") {
    throw new Error("Invalid paid line")
  }
  if (rawBonus && line !== "skipplus") throw new Error("Only Skip+ includes a second song")
  const input = sanitizeSubmission(raw)
  const bonus = rawBonus ? sanitizeSubmission(rawBonus) : null
  if (bonus && bonus.trackId === input.trackId) throw new Error("Invalid second song")
  const userId = await getSessionUserId()

  const inserted = (await sql`
    INSERT INTO submissions (track_id, url, title, submitted_by, source, line, status, audio_pathname, user_id)
    VALUES (${input.trackId}, ${input.url}, ${input.title}, ${input.submittedBy}, ${input.source}, ${line}, 'pending', ${input.audioPathname ?? null}, ${userId})
    ON CONFLICT (track_id) DO NOTHING
    RETURNING track_id
  `) as { track_id: string }[]
  if (inserted.length === 0) throw new Error("This submission already exists")

  if (bonus) {
    const bonusInserted = (await sql`
      INSERT INTO submissions (track_id, url, title, submitted_by, source, line, status, audio_pathname, user_id)
      VALUES (${bonus.trackId}, ${bonus.url}, ${bonus.title}, ${bonus.submittedBy}, ${bonus.source}, ${line}, 'pending', ${bonus.audioPathname ?? null}, ${userId})
      ON CONFLICT (track_id) DO NOTHING
      RETURNING track_id
    `) as { track_id: string }[]
    if (bonusInserted.length === 0) throw new Error("This submission already exists")
  }

  const label = bonus
    ? `"${input.title}" + "${bonus.title}" by ${input.submittedBy}`
    : `"${input.title}" by ${input.submittedBy}`

  return createCheckout({
    catalogKey: catalogKeyForLine(line),
    description: `${LINES[line].shortName} line — ${label}`,
    trackId: input.trackId,
    metadata: {
      trackId: input.trackId,
      ...(bonus ? { bonusTrackId: bonus.trackId } : {}),
      action: "submit",
      line,
      title: input.title.slice(0, 200),
      artist: input.submittedBy,
    },
  })
}

async function getTrackLabel(trackId: string): Promise<{ title: string; artist: string }> {
  const rows = (await sql`
    SELECT title, submitted_by FROM submissions WHERE track_id = ${trackId} LIMIT 1
  `) as { title: string; submitted_by: string }[]
  return { title: rows[0]?.title ?? "Unknown", artist: rows[0]?.submitted_by ?? "Unknown" }
}

// Skip button in the queue: pay to move an existing track up into a paid line.
export async function createSkipCheckout(
  trackId: string,
  line: LineId,
): Promise<CheckoutResult> {
  if (!isLineId(line) || line === "free") {
    throw new Error("Invalid skip line")
  }
  const current = await getActiveTrackLine(trackId)
  if (!current) throw new Error("Track is not in the queue")
  if (LINE_PRIORITY[line] >= LINE_PRIORITY[current]) {
    throw new Error("Track is already in this line or higher")
  }
  const { title, artist } = await getTrackLabel(trackId)
  return createCheckout({
    catalogKey: catalogKeyForLine(line),
    description: `Upgrade to ${LINES[line].shortName} line — "${title}" by ${artist}`,
    trackId,
    metadata: { trackId, action: "skip", line, title: title.slice(0, 200), artist },
  })
}

// $5 boost: lifts a track within its line. A second boost on a Free-line
// boost moves the track into the Skip line.
export async function createBoostCheckout(trackId: string): Promise<CheckoutResult> {
  const current = await getActiveTrackLine(trackId)
  if (!current) throw new Error("Track is not in the queue")
  const { title, artist } = await getTrackLabel(trackId)
  const label = current === "boost" ? "Second boost (to Skip line)" : "Queue boost"
  return createCheckout({
    catalogKey: "queue_boost",
    description: `${label} — "${title}" by ${artist}`,
    trackId,
    metadata: { trackId, action: "boost", title: title.slice(0, 200), artist },
  })
}

async function createCheckout(opts: {
  catalogKey: CatalogKey
  description: string
  trackId: string
  metadata: Record<string, string>
}): Promise<CheckoutResult> {
  if (!(await getQueueStatus()).skipsOpen) throw new Error("Skips are closed")
  const price = await getCatalogPriceId(opts.catalogKey)
  const session = await stripe.checkout.sessions.create({
    ui_mode: "embedded_page",
    redirect_on_completion: "never",
    mode: "payment",
    line_items: [{ price, quantity: 1 }],
    client_reference_id: opts.trackId,
    metadata: opts.metadata,
    payment_intent_data: {
      description: opts.description.slice(0, 500),
      metadata: opts.metadata,
    },
  })

  if (!session.client_secret) {
    throw new Error("Failed to create checkout session")
  }

  // Dynamic lookup so the bundler can't freeze a stale NEXT_PUBLIC_ value at build time.
  const keyName = "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
  const publishableKey = process.env[keyName]
  if (!publishableKey) {
    throw new Error("Stripe publishable key is not configured")
  }

  return { clientSecret: session.client_secret, sessionId: session.id, publishableKey }
}

// Server-side confirmation. Called when embedded Checkout completes and also
// (idempotently) by the Stripe webhook. It re-fetches the session from Stripe
// so a paid status can never be faked from the client.
export async function confirmPayment(sessionId: string): Promise<{ ok: boolean }> {
  if (typeof sessionId !== "string" || !sessionId.startsWith("cs_")) return { ok: false }
  const session = await stripe.checkout.sessions.retrieve(sessionId)
  const ok = await applyPaidSession(session)
  revalidatePath("/queue")
  return { ok }
}
