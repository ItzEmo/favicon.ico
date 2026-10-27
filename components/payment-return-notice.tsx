"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircle2, Clock } from "lucide-react"

function Notice() {
  const status = useSearchParams().get("payment")
  if (status !== "success" && status !== "pending") return null
  const success = status === "success"

  return (
    <div
      role="status"
      className="mx-auto flex w-full max-w-6xl items-center gap-3 rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-foreground"
    >
      {success ? (
        <CheckCircle2 className="size-5 shrink-0 text-primary" aria-hidden="true" />
      ) : (
        <Clock className="size-5 shrink-0 text-primary" aria-hidden="true" />
      )}
      <p className="leading-relaxed">
        {success
          ? "Payment received. Thanks!"
          : "Your payment is processing. It'll be applied as soon as it's confirmed."}
      </p>
    </div>
  )
}

export function PaymentReturnNotice() {
  return (
    <Suspense fallback={null}>
      <div className="px-4 pt-6 sm:px-6 empty:hidden">
        <Notice />
      </div>
    </Suspense>
  )
}
