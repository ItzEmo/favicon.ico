"use client"

import { useState, useTransition } from "react"
import { Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { saveArtistLinks } from "@/app/actions/artist-links"
import type { ArtistLinkKind, ArtistLinks } from "@/lib/artist-links-types"

const FIELDS: { kind: ArtistLinkKind; label: string; placeholder: string; hint: string }[] = [
  {
    kind: "spotify",
    label: "Spotify",
    placeholder: "https://open.spotify.com/artist/…",
    hint: "Artist, album, track or playlist. Shows a Spotify player on the unlock screen.",
  },
  {
    kind: "apple_music",
    label: "Apple Music",
    placeholder: "https://music.apple.com/us/artist/…",
    hint: "Artist, album, song or playlist. Shows an Apple Music player on the unlock screen.",
  },
  {
    kind: "all_music",
    label: "All my music",
    placeholder: "https://linktr.ee/…",
    hint: "Optional. Any link page with everything (Linktree, Hypeddit, your site…).",
  },
]

export function AdminMusicLinks({ links }: { links: ArtistLinks }) {
  const [values, setValues] = useState<ArtistLinks>(links)
  const [errors, setErrors] = useState<ArtistLinks>({})
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(false)
    startTransition(async () => {
      const result = await saveArtistLinks(values)
      if (result.ok) {
        setErrors({})
        setSaved(true)
      } else {
        setErrors(result.errors)
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5">
      {FIELDS.map(({ kind, label, placeholder, hint }) => {
        const id = `music-link-${kind}`
        const error = errors[kind]
        return (
          <div key={kind} className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {label}
            </label>
            <input
              id={id}
              type="url"
              inputMode="url"
              value={values[kind] ?? ""}
              placeholder={placeholder}
              aria-invalid={error ? true : undefined}
              aria-describedby={`${id}-hint`}
              onChange={(e) => {
                setSaved(false)
                setValues((v) => ({ ...v, [kind]: e.target.value }))
              }}
              className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/40 aria-invalid:border-destructive"
            />
            <p id={`${id}-hint`} className={error ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
              {error ?? hint}
            </p>
          </div>
        )
      })}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          Save links
        </Button>
        {saved && (
          <p role="status" className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Check className="size-4 text-primary" aria-hidden="true" />
            Saved. Leave a field empty to remove it.
          </p>
        )}
      </div>
    </form>
  )
}
