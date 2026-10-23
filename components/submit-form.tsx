"use client"

import { useState, type FormEvent } from "react"
import { Link2, Plus, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  detectSource,
  isValidUrl,
  type Track,
} from "@/components/track-types"

interface SubmitFormProps {
  onSubmit: (track: Track) => void
  showSubmitButton?: boolean
  submitLabel?: string
  pending?: boolean
}

export function SubmitForm({
  onSubmit,
  showSubmitButton = true,
  submitLabel = "Submit Your Track",
  pending = false,
}: SubmitFormProps) {
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = url.trim()

    if (!trimmed) {
      setError("Paste a link to your track first.")
      return
    }
    if (!isValidUrl(trimmed)) {
      setError("That doesn't look like a valid URL. Include http:// or https://")
      return
    }
    if (!title.trim()) {
      setError("Enter your track title.")
      return
    }
    if (!name.trim()) {
      setError("Enter your artist name.")
      return
    }

    onSubmit({
      id: crypto.randomUUID(),
      url: trimmed,
      title: title.trim(),
      submittedBy: name.trim(),
      source: detectSource(trimmed),
      createdAt: Date.now(),
    })

    setUrl("")
    setTitle("")
    setError(null)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full"
      aria-label="Submit a track"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="track-url" className="text-sm font-medium text-foreground">
            Track link <span className="text-primary">*</span>
          </label>
          <div className="relative">
            <Link2
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="track-url"
              type="url"
              inputMode="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                if (error) setError(null)
              }}
              placeholder="https://open.spotify.com/track/..."
              aria-invalid={error ? true : undefined}
              className="h-11 w-full rounded-lg border border-input bg-background/60 pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 aria-invalid:border-destructive"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="track-title" className="text-sm font-medium text-foreground">
              Track title <span className="text-primary">*</span>
            </label>
            <input
              id="track-title"
              type="text"
              required
              maxLength={200}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (error) setError(null)
              }}
              placeholder="Artist — Song"
              className="h-11 w-full rounded-lg border border-input bg-background/60 px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="track-name" className="text-sm font-medium text-foreground">
              Artist name <span className="text-primary">*</span>
            </label>
            <input
              id="track-name"
              type="text"
              required
              maxLength={80}
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (error) setError(null)
              }}
              placeholder="DJ Nightfall"
              className="h-11 w-full rounded-lg border border-input bg-background/60 px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
            />
          </div>
        </div>

        {error ? (
          <p
            role="alert"
            className="flex items-center gap-2 text-sm text-destructive"
          >
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        ) : null}

        {showSubmitButton ? (
          <Button
            type="submit"
            size="lg"
            disabled={pending}
            className="h-12 w-full rounded-full text-sm font-bold uppercase tracking-wider shadow-lg shadow-primary/25"
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Plus className="size-4" aria-hidden="true" />
            )}
            {pending ? "Processing..." : submitLabel}
          </Button>
        ) : null}
      </div>
    </form>
  )
}
