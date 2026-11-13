"use client"

import { useActionState, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Disc3, ImagePlus, Loader2, Trash2 } from "lucide-react"
import { clearLinkRelease, saveLinkRelease, type LinkReleaseState } from "@/app/actions/link-release"
import { ReleaseCard } from "@/components/release-card"
import {
  MAX_RELEASE_TITLE,
  RELEASE_EYEBROWS,
  RELEASE_PLATFORMS,
  RELEASE_PLATFORM_KEYS,
  type ReleaseEyebrow,
  type ReleasePlatformKey,
  type ReleaseSetup,
} from "@/lib/release-setup"
import { cn } from "@/lib/utils"

const inputClass =
  "h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"

export function LinkReleaseEditor({
  release,
  cover: initialCover,
  artistName,
}: {
  release: ReleaseSetup | null
  cover: string | null
  artistName: string
}) {
  const router = useRouter()
  const [state, formAction, saving] = useActionState<LinkReleaseState | null, FormData>(saveLinkRelease, null)
  const [removing, startRemoving] = useTransition()
  const [removeState, setRemoveState] = useState<LinkReleaseState | null>(null)
  const [title, setTitle] = useState(release?.title ?? "")
  const [eyebrow, setEyebrow] = useState<ReleaseEyebrow>(release?.eyebrow ?? "out_now")
  const [links, setLinks] = useState<Record<ReleasePlatformKey, string>>(() => ({
    apple: release?.links.apple ?? "",
    spotify: release?.links.spotify ?? "",
    youtube: release?.links.youtube ?? "",
  }))
  const [cover, setCover] = useState(initialCover)
  const [coverBusy, setCoverBusy] = useState(false)
  const [coverError, setCoverError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function coverRequest(init: RequestInit) {
    setCoverError(null)
    setCoverBusy(true)
    try {
      const res = await fetch("/api/account/link-cover", init)
      const data = (await res.json()) as { cover?: string | null; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Upload failed")
      setCover(data.cover ?? null)
      router.refresh()
    } catch (error) {
      setCoverError((error as Error).message)
    } finally {
      setCoverBusy(false)
    }
  }

  function onPickCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    const body = new FormData()
    body.append("file", file)
    void coverRequest({ method: "POST", body })
  }

  function onRemove() {
    startRemoving(async () => {
      setRemoveState(await clearLinkRelease())
      setTitle("")
      setLinks({ apple: "", spotify: "", youtube: "" })
      router.refresh()
    })
  }

  const previewPlatforms = RELEASE_PLATFORM_KEYS.filter((key) => links[key].trim()).map((key) => ({
    kind: RELEASE_PLATFORMS[key].icon,
    label: RELEASE_PLATFORMS[key].label,
    url: links[key].trim(),
  }))
  const status = removeState ?? state

  return (
    <section
      aria-labelledby="link-release-heading"
      className="flex flex-col gap-6 rounded-3xl border border-border bg-card/80 p-6 sm:p-8"
    >
      <div className="flex flex-col gap-1">
        <h2 id="link-release-heading" className="flex items-center gap-2 text-lg font-bold text-foreground">
          <Disc3 className="size-5 text-primary" aria-hidden="true" />
          Release card
        </h2>
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
          Feature your own release at the top of your shareable link. Visitors can tap the cover to hear a preview.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Preview</p>
        <div className="pointer-events-none" aria-hidden="true">
          <ReleaseCard
            headingId="release-preview-title"
            eyebrow={RELEASE_EYEBROWS[eyebrow]}
            title={title.trim() || "Your title"}
            artist={artistName}
            artworkUrl={cover}
            previewUrl={null}
            streamUrl={previewPlatforms[0]?.url ?? "#"}
            platforms={previewPlatforms}
          />
        </div>
      </div>

      <form action={formAction} className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={coverBusy}
            className="relative flex aspect-square w-28 shrink-0 flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl border-2 border-dashed border-border text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
          >
            {cover && (
              // eslint-disable-next-line @next/next/no-img-element -- user upload served from our route
              <img src={cover} alt="" className="absolute inset-0 size-full object-cover opacity-40" />
            )}
            <span className="relative flex flex-col items-center gap-1.5">
              {coverBusy ? (
                <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              ) : (
                <ImagePlus className="size-5" aria-hidden="true" />
              )}
              {cover ? "Replace cover" : "Upload cover"}
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onPickCover}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          />
          <div className="flex flex-1 flex-col gap-2 text-xs text-muted-foreground">
            <p className="leading-relaxed">
              Square JPG, PNG or WEBP up to 5 MB. Skip it and we&apos;ll pull the cover from your Apple Music, Spotify or YouTube link.
            </p>
            {cover && (
              <button
                type="button"
                onClick={() => void coverRequest({ method: "DELETE" })}
                disabled={coverBusy}
                className="inline-flex w-fit items-center gap-1.5 font-semibold text-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
                Remove uploaded cover
              </button>
            )}
            {coverError && (
              <p role="alert" className="text-sm text-destructive">
                {coverError}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div className="flex flex-col gap-2">
            <label htmlFor="release-title" className="text-sm font-semibold text-foreground">
              Title
            </label>
            <input
              id="release-title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={MAX_RELEASE_TITLE}
              placeholder="Song or project name"
              required
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="release-eyebrow" className="text-sm font-semibold text-foreground">
              Label
            </label>
            <select
              id="release-eyebrow"
              name="eyebrow"
              value={eyebrow}
              onChange={(e) => setEyebrow(e.target.value as ReleaseEyebrow)}
              className={inputClass}
            >
              {(Object.entries(RELEASE_EYEBROWS) as [ReleaseEyebrow, string][]).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-sm font-semibold text-foreground">Where to listen</legend>
          {RELEASE_PLATFORM_KEYS.map((key) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label htmlFor={`release-${key}`} className="text-xs font-semibold text-muted-foreground">
                {RELEASE_PLATFORMS[key].label}
              </label>
              <input
                id={`release-${key}`}
                name={key}
                type="url"
                inputMode="url"
                value={links[key]}
                onChange={(e) => setLinks((prev) => ({ ...prev, [key]: e.target.value }))}
                placeholder={RELEASE_PLATFORMS[key].placeholder}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className={cn(inputClass, "font-mono")}
              />
            </div>
          ))}
          <p className="text-xs leading-relaxed text-muted-foreground">
            The first link is your Stream button. An Apple Music link gives the most reliable 30-second preview; otherwise we search for one by title, then fall back to your page song.
          </p>
        </fieldset>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p
            role="status"
            className={cn("text-sm", status?.ok ? "text-primary" : "text-destructive", !status && "invisible")}
          >
            {status?.message ?? "\u00a0"}
          </p>
          <div className="flex w-full gap-2 sm:w-auto">
            {release && (
              <button
                type="button"
                onClick={onRemove}
                disabled={removing}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-border px-5 text-sm font-semibold text-foreground transition-colors hover:border-destructive hover:text-destructive disabled:opacity-60 sm:flex-none"
              >
                {removing && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                Remove
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              onClick={() => setRemoveState(null)}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60 sm:flex-none"
            >
              {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Save release card
            </button>
          </div>
        </div>
      </form>
    </section>
  )
}
