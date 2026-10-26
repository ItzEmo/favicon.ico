"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { upload } from "@vercel/blob/client"
import { ImagePlus, Link2, Loader2, LockKeyhole, RotateCcw } from "lucide-react"

const MAX_BYTES = 50 * 1024 * 1024

export function UnlockBackgroundEditor({ current, fallback }: { current: string | null; fallback: string }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState(current ?? fallback)
  const [isCustom, setIsCustom] = useState(Boolean(current))
  const [link, setLink] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function send(init: RequestInit) {
    setError(null)
    setBusy(true)
    try {
      const res = await fetch("/api/admin/unlock-bg", init)
      const data = (await res.json().catch(() => ({}))) as { url?: string | null; error?: string }
      if (!res.ok) throw new Error(data.error || "Could not save")
      setPreview(data.url ?? fallback)
      setIsCustom(Boolean(data.url))
      router.refresh()
      return true
    } catch (err) {
      setError((err as Error).message)
      return false
    } finally {
      setBusy(false)
    }
  }

  const saveJson = (payload: object) =>
    send({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    if (file.size > MAX_BYTES) return setError("File must be under 50 MB")
    setError(null)
    setBusy(true)
    try {
      const safeName = file.name.replace(/[^\w.\- ]+/g, "_")
      const { pathname } = await upload(`unlock-bg/${safeName}`, file, {
        access: "private",
        handleUploadUrl: "/api/admin/unlock-bg",
        multipart: file.size > 8 * 1024 * 1024,
      })
      await saveJson({ pathname })
    } catch (err) {
      setError((err as Error).message || "Upload failed")
      setBusy(false)
    }
  }

  async function onSaveLink() {
    const value = link.trim()
    if (!value) return
    if (await saveJson({ link: value })) setLink("")
  }

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <LockKeyhole className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-bold text-foreground">Unlock screen</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Admin only. Change the photo or GIF behind the home page unlock screen.
          </p>
        </div>
      </div>

      <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-background">
        <img src={preview} alt="Current unlock screen background" className="size-full object-cover" />
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
            <Loader2 className="size-6 animate-spin text-primary" aria-hidden="true" />
            <span className="sr-only">Saving</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          className="sr-only"
          onChange={onPick}
          tabIndex={-1}
          aria-hidden="true"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <ImagePlus className="size-4" aria-hidden="true" />
          Upload photo or GIF
        </button>
        {isCustom && (
          <button
            type="button"
            onClick={() => void send({ method: "DELETE" })}
            disabled={busy}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Reset to default
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="unlock-bg-link" className="text-sm font-semibold text-foreground">
          Or paste an image / GIF link
        </label>
        <div className="flex gap-2">
          <div className="relative flex flex-1 items-center">
            <Link2 className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground" aria-hidden="true" />
            <input
              id="unlock-bg-link"
              type="url"
              inputMode="url"
              placeholder="https://media.giphy.com/…/giphy.gif"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter" || e.nativeEvent.isComposing || e.keyCode === 229) return
                e.preventDefault()
                void onSaveLink()
              }}
              className="h-10 w-full rounded-full border border-input bg-background pr-4 pl-10 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
          <button
            type="button"
            onClick={() => void onSaveLink()}
            disabled={busy || !link.trim()}
            className="h-10 rounded-full border border-border px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
          >
            Save
          </button>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">JPG, PNG, WEBP or GIF, up to 50 MB.</p>
      </div>

      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </section>
  )
}
