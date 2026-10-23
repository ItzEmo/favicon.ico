"use client"

import { useCallback, useEffect, useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js"
import { X, Loader2 } from "lucide-react"
import { confirmPayment } from "@/app/actions/submissions"

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string,
)

export interface CheckoutSession {
  clientSecret: string
  sessionId: string
  title: string
}

interface CheckoutDialogProps {
  session: CheckoutSession | null
  onClose: () => void
  onSuccess: () => void
}

export function CheckoutDialog({ session, onClose, onSuccess }: CheckoutDialogProps) {
  const [confirming, setConfirming] = useState(false)

  const handleComplete = useCallback(async () => {
    if (!session) return
    setConfirming(true)
    try {
      await confirmPayment(session.sessionId)
      onSuccess()
    } finally {
      setConfirming(false)
    }
  }, [session, onSuccess])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    if (session) {
      document.addEventListener("keydown", onKey)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [session, onClose])

  if (!session) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Checkout for ${session.title}`}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/80 p-4 backdrop-blur-sm sm:items-center"
    >
      <div className="relative my-8 w-full max-w-lg rounded-3xl border border-border bg-card p-5 shadow-2xl shadow-primary/20 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              Secure Checkout
            </p>
            <h2 className="truncate text-lg font-extrabold text-foreground">
              {session.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close checkout"
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        {confirming ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Loader2 className="size-6 animate-spin text-primary" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              Confirming your payment and updating the queue...
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl">
            <EmbeddedCheckoutProvider
              stripe={stripePromise}
              options={{
                clientSecret: session.clientSecret,
                onComplete: handleComplete,
              }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        )}
      </div>
    </div>
  )
}
