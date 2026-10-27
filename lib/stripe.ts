import "server-only"

import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

// Apple Pay and Google Pay are wallets on the "card" method; Checkout shows them on supported devices.
export const CHECKOUT_PAYMENT_METHODS: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] = [
  "card",
  "cashapp",
]

// Cash App Pay leaves the page to approve, so embedded Checkout needs a return URL.
export async function checkoutReturnUrl(nextPath: "/queue" | "/mix-master") {
  const { headers } = await import("next/headers")
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host")
  const proto = h.get("x-forwarded-proto") ?? "https"
  return `${proto}://${host}/api/stripe/return?next=${encodeURIComponent(nextPath)}&session_id={CHECKOUT_SESSION_ID}`
}
