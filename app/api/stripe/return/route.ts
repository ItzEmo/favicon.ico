import { NextResponse, type NextRequest } from "next/server"
import { revalidatePath } from "next/cache"
import { stripe } from "@/lib/stripe"
import { applyPaidSession } from "@/lib/apply-payment"

const ALLOWED_RETURN_PATHS = new Set(["/queue", "/mix-master"])

// Landing point for redirect-based payment methods (e.g. Cash App Pay).
// Re-fetches the session from Stripe so payment can't be faked from the URL;
// the webhook applies it too, idempotently.
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id") ?? ""
  const next = request.nextUrl.searchParams.get("next") ?? "/queue"
  const target = new URL(ALLOWED_RETURN_PATHS.has(next) ? next : "/queue", request.nextUrl.origin)

  if (sessionId.startsWith("cs_")) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      const ok = await applyPaidSession(session)
      target.searchParams.set("payment", ok || session.payment_status === "paid" ? "success" : "pending")
      revalidatePath(target.pathname)
    } catch {
      target.searchParams.set("payment", "pending")
    }
  }

  return NextResponse.redirect(target, 303)
}
