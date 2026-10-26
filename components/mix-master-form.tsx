"use client"

import { useState } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"
import { CheckoutDialog, type CheckoutSession } from "@/components/checkout-dialog"
import { createMixMasterCheckout } from "@/app/actions/mix-master"

const inputClass =
  "h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"

export function MixMasterForm({ defaultName, defaultEmail }: { defaultName: string; defaultEmail: string }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkout, setCheckout] = useState<CheckoutSession | null>(null)
  const [paid, setPaid] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    setError(null)
    setPending(true)
    try {
      const session = await createMixMasterCheckout({
        name: String(data.get("name") ?? ""),
        email: String(data.get("email") ?? ""),
        trackUrl: String(data.get("trackUrl") ?? ""),
        notes: String(data.get("notes") ?? ""),
      })
      setCheckout({ ...session, title: "Mix & Mastering — $30" })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setPending(false)
    }
  }

  if (paid) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-primary/40 bg-card p-8 text-center">
        <CheckCircle2 className="size-10 text-primary" aria-hidden="true" />
        <h2 className="text-xl font-extrabold text-foreground">{"You're booked in"}</h2>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          {"Payment received. ItzEmo will reach out by email with your finished mix & master."}
        </p>
      </div>
    )
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-foreground">
            Artist name
            <input name="name" required maxLength={80} defaultValue={defaultName} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-foreground">
            Email
            <input name="email" type="email" required maxLength={200} defaultValue={defaultEmail} className={inputClass} />
          </label>
        </div>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-foreground">
          Link to stems or rough mix
          <input
            name="trackUrl"
            type="url"
            required
            maxLength={500}
            placeholder="Google Drive, Dropbox, WeTransfer..."
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-foreground">
          Notes for Emo <span className="font-normal text-muted-foreground">(optional)</span>
          <textarea
            name="notes"
            maxLength={1000}
            rows={4}
            placeholder="Reference tracks, vibe, anything to know..."
            className="w-full rounded-xl border border-input bg-background p-3 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
          />
        </label>

        {error && (
          <p role="alert" className="text-sm font-semibold text-destructive">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-extrabold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          Book for $30
        </button>
      </form>

      <CheckoutDialog
        session={checkout}
        onClose={() => setCheckout(null)}
        onSuccess={() => {
          setCheckout(null)
          setPaid(true)
        }}
      />
    </>
  )
}
