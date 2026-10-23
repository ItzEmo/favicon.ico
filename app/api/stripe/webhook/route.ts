import { NextResponse } from "next/server"
import type Stripe from "stripe"
import { stripe } from "@/lib/stripe"
import { applyPaidSession } from "@/lib/apply-payment"

// Stripe webhook: the authoritative signal that a payment went through.
// With STRIPE_WEBHOOK_SECRET set, the signature is verified. Without it, the
// payload is never trusted — the session is re-fetched from Stripe by ID, so a
// forged "paid" event cannot put a track in a paid line.
export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature")
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event: Stripe.Event
  try {
    if (webhookSecret) {
      if (!signature) throw new Error("Missing stripe-signature header")
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } else {
      event = JSON.parse(body) as Stripe.Event
    }
  } catch (err) {
    console.log("[v0] Stripe webhook verification failed:", (err as Error).message)
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const claimed = event.data.object as Stripe.Checkout.Session
    let session: Stripe.Checkout.Session
    try {
      session = webhookSecret ? claimed : await stripe.checkout.sessions.retrieve(claimed.id)
    } catch {
      return NextResponse.json({ error: "Unknown session" }, { status: 400 })
    }
    await applyPaidSession(session)
  }

  return NextResponse.json({ received: true })
}
