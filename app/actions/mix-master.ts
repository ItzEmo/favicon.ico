"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { del, head } from "@vercel/blob"
import { isReferencePath, MAX_REFERENCE_BYTES } from "@/lib/mix-reference"
import { sql } from "@/lib/db"
import { auth } from "@/lib/auth"
import { stripe } from "@/lib/stripe"
import { requireAdmin } from "@/lib/admin-auth"
import { getCatalogPriceId, MIX_MASTER_PRICE_IN_CENTS } from "@/lib/stripe-catalog"

export interface MixOrderInput {
  name: string
  email: string
  trackUrl: string
  notes: string
  referencePath?: string
  referenceUrl?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function sanitize(input: MixOrderInput): MixOrderInput {
  const name = String(input.name ?? "").trim()
  const email = String(input.email ?? "").trim().toLowerCase()
  const trackUrl = String(input.trackUrl ?? "").trim()
  const notes = String(input.notes ?? "").trim()

  if (!name || name.length > 80) throw new Error("Enter your artist name.")
  if (!EMAIL_RE.test(email) || email.length > 200) throw new Error("Enter a valid email.")
  let parsed: URL
  try {
    parsed = new URL(trackUrl)
  } catch {
    throw new Error("Enter a valid link to your stems or rough mix.")
  }
  if (!/^https?:$/.test(parsed.protocol) || trackUrl.length > 500) {
    throw new Error("Enter a valid link to your stems or rough mix.")
  }
  if (notes.length > 1000) throw new Error("Notes must be under 1000 characters.")
  const referencePath = String(input.referencePath ?? "").trim()
  if (referencePath && !isReferencePath(referencePath)) throw new Error("Reference upload not found.")
  const referenceUrl = String(input.referenceUrl ?? "").trim()
  if (referenceUrl) {
    let ref: URL
    try {
      ref = new URL(referenceUrl)
    } catch {
      throw new Error("Enter a valid link to your reference song.")
    }
    if (!/^https?:$/.test(ref.protocol) || referenceUrl.length > 500) {
      throw new Error("Enter a valid link to your reference song.")
    }
  }
  return { name, email, trackUrl, notes, referencePath, referenceUrl }
}

async function verifyReference(pathname: string) {
  if (!pathname) return null
  const info = await head(pathname).catch(() => null)
  if (!info) throw new Error("Reference upload not found. Try uploading it again.")
  if (info.size > MAX_REFERENCE_BYTES) {
    await del(pathname).catch(() => {})
    throw new Error("Reference track must be under 50 MB.")
  }
  return pathname
}

export async function createMixMasterCheckout(raw: MixOrderInput) {
  const input = sanitize(raw)
  const session = await auth.api.getSession({ headers: await headers() })
  const orderId = crypto.randomUUID()
  const referencePath = await verifyReference(input.referencePath ?? "")

  await sql`
    INSERT INTO mix_master_orders (id, user_id, name, email, track_url, notes, amount_cents, reference_path, reference_url)
    VALUES (${orderId}, ${session?.user.id ?? null}, ${input.name}, ${input.email},
            ${input.trackUrl}, ${input.notes}, ${MIX_MASTER_PRICE_IN_CENTS}, ${referencePath},
            ${input.referenceUrl || null})
  `

  const price = await getCatalogPriceId("mix_master")
  const metadata = { action: "mix_master", orderId, name: input.name.slice(0, 80) }
  const checkout = await stripe.checkout.sessions.create(
    {
      ui_mode: "embedded_page",
      redirect_on_completion: "never",
      mode: "payment",
      line_items: [{ price, quantity: 1 }],
      customer_email: input.email,
      client_reference_id: orderId,
      metadata,
      payment_intent_data: {
        description: `Mix & Mastering for ${input.name}`,
        metadata,
      },
    },
    { idempotencyKey: `mix_master_${orderId}` },
  )

  if (!checkout.client_secret) throw new Error("Failed to create checkout session")

  const keyName = "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
  const publishableKey = process.env[keyName]
  if (!publishableKey) throw new Error("Stripe publishable key is not configured")

  return { clientSecret: checkout.client_secret, sessionId: checkout.id, publishableKey }
}

export async function setMixOrderDelivered(orderId: string, delivered: boolean) {
  await requireAdmin()
  await sql`
    UPDATE mix_master_orders
    SET status = ${delivered ? "delivered" : "paid"}
    WHERE id = ${orderId} AND status IN ('paid', 'delivered')
  `
  revalidatePath("/admin")
}
