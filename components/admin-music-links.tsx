"use client"

import { useState, useTransition } from "react"
import { Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BrandIcon, SOCIAL_LABELS } from "@/components/brand-icon"
import { saveArtistLinks } from "@/app/actions/artist-links"
import { cn } from "@/lib/utils"
import {
  SOCIAL_LINK_KINDS,
  type ArtistLinkKind,
  type ArtistLinks,
  type SocialLinkKind,
} from "@/lib/artist-links-types"

const MUSIC_FIELDS: { kind: ArtistLinkKind; label: string; placeholder: string; hint: string }[] = [
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

const SOCIAL_PLACEHOLDERS: Record<SocialLinkKind, string> = {
  instagram: "https://instagram.com/…",
  youtube: "https://youtube.com/@…",
  tiktok: "https://tiktok.com/@…",
}

const inputClass =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/40 aria-invalid:border-destructive"

export function AdminMusicLinks({ links, hidden = [] }: { links: ArtistLinks; hidden?: ArtistLinkKind[] }) {
  const [values, setValues] = useState<ArtistLinks>(links)
  const [hiddenKinds, setHiddenKinds] = useState<ArtistLinkKind[]>(hidden)
  const [errors, setErrors] = useState<ArtistLinks>({})
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  const setValue = (kind: ArtistLinkKind, value: string) => {
    setSaved(false)
    setValues((v) => ({ ...v, [kind]: value }))
  }

  const toggleShown = (kind: ArtistLinkKind) => {
    setSaved(false)
    setHiddenKinds((h) => (h.includes(kind) ? h.filter((k) => k !== kind) : [...h, kind]))
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(false)
    startTransition(async () => {
      const result = await saveArtistLinks(values, hiddenKinds)
      if (result.ok) {
        setErrors({})
        setSaved(true)
      } else {
        setErrors(result.errors)
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-5">
      <fieldset className="flex flex-col gap-5">
        <legend className="mb-3 text-sm font-extrabold uppercase tracking-tight text-foreground">Music</legend>
        {MUSIC_FIELDS.map(({ kind, label, placeholder, hint }) => {
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
                onChange={(e) => setValue(kind, e.target.value)}
                className={inputClass}
              />
              <p id={`${id}-hint`} className={error ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
                {error ?? hint}
              </p>
            </div>
          )
        })}
      </fieldset>

      <fieldset className="flex flex-col gap-4 border-t border-border pt-5">
        <legend className="sr-only">Social links</legend>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-extrabold uppercase tracking-tight text-foreground">Social links</p>
          <p className="text-xs text-muted-foreground">
            These show as buttons on the unlock screen. Turn one off to hide it without losing the link.
          </p>
        </div>
        {SOCIAL_LINK_KINDS.map((kind) => {
          const id = `music-link-${kind}`
          const label = SOCIAL_LABELS[kind]
          const error = errors[kind]
          const shown = !hiddenKinds.includes(kind)
          const hasUrl = Boolean(values[kind]?.trim())
          return (
            <div key={kind} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor={id}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  <BrandIcon kind={kind} className="size-4 text-foreground" />
                  {label}
                </label>
                <button
                  type="button"
                  role="switch"
                  aria-checked={shown}
                  aria-label={`Show ${label} on the unlock screen`}
                  onClick={() => toggleShown(kind)}
                  className="flex items-center gap-2 rounded-full text-xs font-semibold text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                >
                  {shown ? "Shown" : "Hidden"}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "relative h-6 w-11 rounded-full transition-colors",
                      shown ? "bg-primary" : "bg-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 left-0.5 size-5 rounded-full bg-background shadow transition-transform",
                        shown && "translate-x-5",
                      )}
                    />
                  </span>
                </button>
              </div>
              <input
                id={id}
                type="url"
                inputMode="url"
                value={values[kind] ?? ""}
                placeholder={SOCIAL_PLACEHOLDERS[kind]}
                aria-invalid={error ? true : undefined}
                aria-describedby={`${id}-hint`}
                onChange={(e) => setValue(kind, e.target.value)}
                className={cn(inputClass, !shown && "opacity-60")}
              />
              <p id={`${id}-hint`} className={error ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
                {error ??
                  (!hasUrl
                    ? `Add your ${label} link to show it.`
                    : shown
                      ? "Visible on the unlock screen."
                      : "Saved, but hidden from the unlock screen.")}
              </p>
            </div>
          )
        })}
      </fieldset>

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
