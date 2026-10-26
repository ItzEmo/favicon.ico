"use client"

import { useRef, useState } from "react"
import { upload } from "@vercel/blob/client"
import { CheckCircle2, Loader2, Music, Upload, X } from "lucide-react"
import { MAX_REFERENCE_BYTES } from "@/lib/mix-reference"
import { CheckoutDialog, type CheckoutSession } from "@/components/checkout-dialog"
import { createMixMasterCheckout } from "@/app/actions/mix-master"

const inputClass =
  "h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"

export function MixMasterForm({ defaultName, defaultEmail }: { defaultName: string; defaultEmail: string }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkout, setCheckout] = useState<CheckoutSession | null>(null)
  const [paid, setPaid] = useState(false)
  const [reference, setReference] = useState<File | null>(null)
  const [uploadedPath, setUploadedPath] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function onPickReference(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setUploadedPath(null)
    if (file && file.size > MAX_REFERENCE_BYTES) {
      setError("Reference track must be under 50 MB.")
      setReference(null)
      e.target.value = ""
      return
    }
    setError(null)
    setReference(file)
  }

  function clearReference() {
    setReference(null)
    setUploadedPath(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    if (reference && reference.size > MAX_REFERENCE_BYTES) {
      setError("Reference track must be under 50 MB.")
      return
    }
    setError(null)
    setPending(true)
    try {
      let referencePath = uploadedPath
      if (reference && !referencePath) {
        const safeName = reference.name.replace(/[^\w.\- ]+/g, "_")
        const blob = await upload(`mix-reference/${safeName}`, reference, {
          access: "private",
          handleUploadUrl: "/api/mix-master/reference",
          multipart: reference.size > 8 * 1024 * 1024,
        })
        referencePath = blob.pathname
        setUploadedPath(referencePath)
      }
      const session = await createMixMasterCheckout({
        name: String(data.get("name") ?? ""),
        email: String(data.get("email") ?? ""),
        trackUrl: String(data.get("trackUrl") ?? ""),
        notes: String(data.get("notes") ?? ""),
        referencePath: referencePath ?? undefined,
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
        <div className="flex flex-col gap-1.5">
          <span id="reference-label" className="text-sm font-semibold text-foreground">
            Reference track <span className="font-normal text-muted-foreground">(optional, up to 50 MB)</span>
          </span>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Your original first mix, or a mainstream song you want it to sound like.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="audio/*,.mp3,.m4a,.wav,.flac,.ogg,.aac"
            onChange={onPickReference}
            aria-labelledby="reference-label"
            className="sr-only"
            id="reference-file"
          />
          {reference ? (
            <div className="flex items-center gap-3 rounded-xl border border-input bg-background px-3 py-2.5">
              <Music className="size-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-sm text-foreground">{reference.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {(reference.size / (1024 * 1024)).toFixed(1)} MB
              </span>
              <button
                type="button"
                onClick={clearReference}
                disabled={pending}
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-4" aria-hidden="true" />
                <span className="sr-only">Remove reference track</span>
              </button>
            </div>
          ) : (
            <label
              htmlFor="reference-file"
              className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-input bg-background px-3 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
            >
              <Upload className="size-4" aria-hidden="true" />
              Upload reference file
            </label>
          )}
        </div>
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
          {pending && reference && !uploadedPath ? "Uploading reference..." : "Book for $30"}
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
