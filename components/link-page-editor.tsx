"use client"

import { useActionState, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronDown, Copy, ExternalLink, Eye, EyeOff, ImagePlus, Link2, Loader2, Music2, Plus, Trash2, Upload } from "lucide-react"
import { updateLinkPage, type LinkPageState } from "@/app/actions/link-page"
import {
  LINK_ACCENTS,
  LINK_BACKGROUNDS,
  LINK_EFFECTS,
  LINK_HEADER_STYLES,
  MAX_BIO_LENGTH,
  MAX_CUSTOM_LINKS,
  MAX_LINK_TITLE_LENGTH,
  linkPath,
  type LinkAccent,
  type LinkBackground,
  type LinkEffect,
  type LinkHeaderStyle,
} from "@/lib/link-page"
import type { LinkSettings } from "@/lib/account"
import { discoFont, glassFont, travelersFont } from "@/lib/glass-font"
import { GlassFilterDefs } from "@/components/glass-filter-defs"
import { cn } from "@/lib/utils"

function SelectField({ id, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        id={id}
        {...props}
className="h-11 w-full cursor-pointer appearance-none rounded-full border border-foreground/10 bg-foreground/5 pr-11 pl-5 text-sm font-semibold text-foreground shadow-inner backdrop-blur-md transition-colors outline-none hover:bg-foreground/10 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/40 [&>option]:bg-card [&>option]:text-foreground"
  >
  {children}
  </select>
  <ChevronDown
  aria-hidden="true"
  className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  )
}

const tile =
  "relative flex aspect-[3/4] cursor-pointer items-end overflow-hidden rounded-xl border-2 border-transparent bg-muted text-left has-[:checked]:border-primary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary"

export function LinkPageEditor({ settings, origin }: { settings: LinkSettings; origin: string }) {
  const router = useRouter()
  const [state, formAction, saving] = useActionState<LinkPageState | null, FormData>(updateLinkPage, null)
  const [background, setBackground] = useState<LinkBackground>(settings.background)
  const [accent, setAccent] = useState<LinkAccent>(settings.accent)
  const [bio, setBio] = useState(settings.bio)
  const [customImage, setCustomImage] = useState(settings.backgroundImage)
  const [headerStyle, setHeaderStyle] = useState<LinkHeaderStyle>(settings.headerStyle)
  const [hideStats, setHideStats] = useState(
    settings.hideSubmissions || settings.hideAvgScore || settings.hideRank,
  )
  const [gifUrl, setGifUrl] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [links, setLinks] = useState(() => settings.customLinks.map((l, i) => ({ ...l, id: `link-${i}` })))
  const nextLinkId = useRef(settings.customLinks.length)
  const fileRef = useRef<HTMLInputElement>(null)
  const songRef = useRef<HTMLInputElement>(null)
  const [song, setSong] = useState(
    settings.songUrl ? { url: settings.songUrl, title: settings.songTitle ?? "My song" } : null,
  )
  const [songBusy, setSongBusy] = useState(false)
  const [songError, setSongError] = useState<string | null>(null)

  async function songRequest(init: RequestInit) {
    setSongError(null)
    setSongBusy(true)
    try {
      const res = await fetch("/api/account/link-song", init)
      const data = (await res.json()) as { url?: string; title?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Something went wrong")
      setSong(data.url ? { url: data.url, title: data.title ?? "My song" } : null)
      router.refresh()
    } catch (error) {
      setSongError((error as Error).message)
    } finally {
      setSongBusy(false)
    }
  }

  function onPickSong(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    const body = new FormData()
    body.append("file", file)
    void songRequest({ method: "POST", body })
  }

  const fullUrl = `${origin}${linkPath(settings.handle)}`

  async function copyLink() {
    await navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  async function uploadBackground(init: RequestInit) {
    setUploadError(null)
    setUploading(true)
    try {
      const res = await fetch("/api/account/link-bg", { method: "POST", ...init })
      const data = (await res.json()) as { image?: string; error?: string }
      if (!res.ok || !data.image) throw new Error(data.error ?? "Upload failed")
      setCustomImage(data.image)
      setBackground("custom")
      router.refresh()
    } catch (error) {
      setUploadError((error as Error).message)
    } finally {
      setUploading(false)
    }
  }

  function onPickBackground(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    const body = new FormData()
    body.append("file", file)
    void uploadBackground({ body })
  }

  function onImportGif() {
    if (!gifUrl.trim()) return
    void uploadBackground({
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: gifUrl.trim() }),
    }).then(() => setGifUrl(""))
  }

  return (
    <section
      aria-labelledby="link-page-heading"
      className="flex flex-col gap-6 rounded-3xl border border-border bg-card/80 p-6 sm:p-8"
    >
      <div className="flex flex-col gap-1">
        <h2 id="link-page-heading" className="flex items-center gap-2 text-lg font-bold text-foreground">
          <Link2 className="size-5 text-primary" aria-hidden="true" />
          Your link page
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A shareable page with your picture, Instagram and music. Put it in your bio.
        </p>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-background/60 p-3 sm:flex-row sm:items-center">
        <span className="min-w-0 flex-1 truncate px-1 font-mono text-sm text-foreground">{fullUrl}</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <a
            href={linkPath(settings.handle)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            Open
          </a>
        </div>
      </div>

      <form action={formAction} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="link-handle" className="text-sm font-semibold text-foreground">
            Link name
          </label>
          <div className="flex h-11 items-center overflow-hidden rounded-xl border border-input bg-background focus-within:ring-2 focus-within:ring-primary">
            <span className="pl-3 font-mono text-sm text-muted-foreground">/u/</span>
            <input
              id="link-handle"
              name="handle"
              defaultValue={settings.handle}
              required
              minLength={3}
              maxLength={24}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="h-full min-w-0 flex-1 bg-transparent pr-3 font-mono text-sm text-foreground outline-none"
            />
          </div>
          <p className="text-xs text-muted-foreground">Letters, numbers and dashes. Changing it breaks your old link.</p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <label htmlFor="link-bio" className="text-sm font-semibold text-foreground">
              Bio
            </label>
            <span className="text-xs text-muted-foreground">
              {bio.length}/{MAX_BIO_LENGTH}
            </span>
          </div>
          <textarea
            id="link-bio"
            name="bio"
            rows={3}
            maxLength={MAX_BIO_LENGTH}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Who you are, what you make, what's dropping next."
            className="resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm leading-relaxed text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 flex w-full items-baseline justify-between text-sm font-semibold text-foreground">
            <span>Links</span>
            <span className="text-xs font-normal text-muted-foreground">
              {links.length}/{MAX_CUSTOM_LINKS}
            </span>
          </legend>
          <p className="-mt-2 text-xs text-muted-foreground">
            Any site you want: merch, YouTube, TikTok, tickets, your website.
          </p>
          {links.map((link, index) => (
            <div key={link.id} className="flex flex-col gap-2 rounded-xl border border-border bg-background/60 p-3 sm:flex-row">
              <label className="sr-only" htmlFor={`link-title-${link.id}`}>
                Link {index + 1} title
              </label>
              <input
                id={`link-title-${link.id}`}
                name="linkTitle"
                defaultValue={link.title}
                maxLength={MAX_LINK_TITLE_LENGTH}
                placeholder="Title (e.g. Merch store)"
                className="h-10 min-w-0 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary sm:w-48"
              />
              <label className="sr-only" htmlFor={`link-url-${link.id}`}>
                Link {index + 1} URL
              </label>
              <input
                id={`link-url-${link.id}`}
                name="linkUrl"
                type="text"
                inputMode="url"
                defaultValue={link.url}
                placeholder="https://"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 font-mono text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              <button
                type="button"
                onClick={() => setLinks((prev) => prev.filter((l) => l.id !== link.id))}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-border px-3 text-sm text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
              >
                <Trash2 className="size-4" aria-hidden="true" />
                <span className="sm:sr-only">Remove link {index + 1}</span>
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setLinks((prev) => [...prev, { id: `link-${nextLinkId.current++}`, title: "", url: "" }])}
            disabled={links.length >= MAX_CUSTOM_LINKS}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border text-sm font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-50"
          >
            <Plus className="size-4" aria-hidden="true" />
            {links.length >= MAX_CUSTOM_LINKS ? `Max ${MAX_CUSTOM_LINKS} links` : "Add link"}
          </button>
        </fieldset>

        <div className="flex flex-col gap-2">
          <label htmlFor="link-header" className="text-sm font-semibold text-foreground">
            Page header
          </label>
          <SelectField
            id="link-header"
            name="headerStyle"
            value={headerStyle}
            onChange={(e) => setHeaderStyle(e.target.value as LinkHeaderStyle)}
          >
            {Object.entries(LINK_HEADER_STYLES).map(([key, style]) => (
              <option key={key} value={key} disabled={!style.licensed}>
                {style.licensed ? style.label : `${style.label} (coming soon)`}
              </option>
            ))}
          </SelectField>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-background/60 px-4 py-3">
            {headerStyle === "glass" && <GlassFilterDefs />}
            <span
              className={
                headerStyle === "glass"
                  ? `${glassFont.className} glass-text glass-text--sm text-2xl leading-tight font-normal uppercase`
                  : headerStyle === "disco"
                    ? `${discoFont.className} text-xl leading-tight text-foreground`
                    : headerStyle === "travelers"
                      ? `${travelersFont.className} text-xl leading-tight text-foreground`
                      : "text-sm font-semibold text-foreground"
              }
            >
              {LINK_HEADER_STYLES[headerStyle].label}
            </span>
            <span className="text-xs text-muted-foreground">{LINK_HEADER_STYLES[headerStyle].description}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background/60 px-4 py-3">
          <span className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">Stats</span>
            <span className="text-xs text-muted-foreground">Submissions, avg score and rank on your page.</span>
          </span>
          {hideStats && <input type="hidden" name="hideStats" value="on" />}
          <button
            type="button"
            aria-pressed={!hideStats}
            onClick={() => setHideStats((v) => !v)}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              hideStats
                ? "border-border bg-foreground/5 text-muted-foreground hover:text-foreground"
                : "border-primary bg-primary/20 text-primary",
            )}
          >
            {hideStats ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
            {hideStats ? "Stats hidden" : "Stats shown"}
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-foreground">Page song</span>
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-background/60 p-3 sm:flex-row sm:items-center">
            <span className="flex min-w-0 flex-1 items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                <Music2 className="size-5" aria-hidden="true" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold text-foreground">{song ? song.title : "No song yet"}</span>
                <span className="text-xs text-muted-foreground">
                  {song ? "Plays automatically on your page." : "Add a track that plays when people visit."}
                </span>
              </span>
            </span>
            {song && (
              // eslint-disable-next-line jsx-a11y/media-has-caption -- music preview
              <audio src={song.url} controls preload="none" className="h-9 w-full sm:w-48" />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => songRef.current?.click()}
                disabled={songBusy}
                className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {songBusy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Upload className="size-4" aria-hidden="true" />}
                {song ? "Replace" : "Upload song"}
              </button>
              {song && (
                <button
                  type="button"
                  onClick={() => void songRequest({ method: "DELETE" })}
                  disabled={songBusy}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-border px-3 text-sm text-muted-foreground transition-colors hover:border-destructive hover:text-destructive disabled:opacity-60"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  <span className="sr-only">Remove song</span>
                </button>
              )}
            </div>
          </div>
          <input ref={songRef} type="file" accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,audio/wav,audio/x-wav,audio/ogg,.mp3,.m4a,.wav,.ogg" onChange={onPickSong} className="sr-only" tabIndex={-1} aria-hidden="true" />
          <p className="text-xs text-muted-foreground">
            MP3, M4A, WAV or OGG up to 15 MB. It loops; browsers may wait for the visitor&apos;s first tap before playing sound.
          </p>
          {songError && (
            <p role="alert" className="text-sm text-destructive">
              {songError}
            </p>
          )}
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-sm font-semibold text-foreground">Background</legend>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {Object.entries(LINK_BACKGROUNDS).map(([key, bg]) => (
              <label key={key} className={tile}>
                <input
                  type="radio"
                  name="background"
                  value={key}
                  checked={background === key}
                  onChange={() => setBackground(key as LinkBackground)}
                  className="sr-only"
                />
                {/* eslint-disable-next-line @next/next/no-img-element -- static thumbnails */}
                <img src={bg.src} alt="" className="absolute inset-0 size-full object-cover" />
                <span className="relative w-full bg-background/70 px-2 py-1 text-xs font-semibold text-foreground">
                  {bg.label}
                </span>
              </label>
            ))}
            {customImage ? (
              <label className={tile}>
                <input
                  type="radio"
                  name="background"
                  value="custom"
                  checked={background === "custom"}
                  onChange={() => setBackground("custom")}
                  className="sr-only"
                />
                {/* eslint-disable-next-line @next/next/no-img-element -- user upload */}
                <img src={customImage} alt="" className="absolute inset-0 size-full object-cover" />
                <span className="relative w-full bg-background/70 px-2 py-1 text-xs font-semibold text-foreground">
                  {customImage.includes(".gif") ? "Your GIF" : "Your photo"}
                </span>
              </label>
            ) : null}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex aspect-[3/4] flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              ) : (
                <ImagePlus className="size-5" aria-hidden="true" />
              )}
              {customImage ? "Replace photo / GIF" : "Upload photo / GIF"}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={onPickBackground} className="sr-only" tabIndex={-1} aria-hidden="true" />
          <div className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor="link-gif-url" className="sr-only">
              GIF link
            </label>
            <input
              id="link-gif-url"
              type="url"
              inputMode="url"
              value={gifUrl}
              onChange={(e) => setGifUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter" || e.nativeEvent.isComposing || e.keyCode === 229) return
                e.preventDefault()
                onImportGif()
              }}
              placeholder="Paste a GIF link from Giphy or Tenor"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 font-mono text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            <button
              type="button"
              onClick={onImportGif}
              disabled={uploading || !gifUrl.trim()}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-50"
            >
              Use GIF
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Upload a JPG, PNG, WEBP or animated GIF up to 10 MB, or paste a direct GIF link (right-click the GIF, then Copy image address).
          </p>
          {uploadError && (
            <p role="alert" className="text-sm text-destructive">
              {uploadError}
            </p>
          )}
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-sm font-semibold text-foreground">Accent color</legend>
          <div className="flex flex-wrap gap-3">
            {Object.entries(LINK_ACCENTS).map(([key, a]) => (
              <label
                key={key}
                title={a.label}
                className="relative flex size-10 cursor-pointer items-center justify-center rounded-full ring-offset-2 ring-offset-card has-[:checked]:ring-2 has-[:checked]:ring-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary"
                style={{ background: a.color }}
              >
                <input
                  type="radio"
                  name="accent"
                  value={key}
                  checked={accent === key}
                  onChange={() => setAccent(key as LinkAccent)}
                  className="sr-only"
                />
                <span className="sr-only">{a.label}</span>
                {accent === key && <Check className="size-4" style={{ color: a.foreground }} aria-hidden="true" />}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-2">
          <label htmlFor="link-effect" className="text-sm font-semibold text-foreground">
            Background effect
          </label>
          <SelectField id="link-effect" name="effect" defaultValue={settings.effect}>
            {(Object.entries(LINK_EFFECTS) as [LinkEffect, { label: string }][]).map(([key, effect]) => (
              <option key={key} value={key}>
                {effect.label}
              </option>
            ))}
          </SelectField>
          <p className="text-xs text-muted-foreground">Animated weather over your background.</p>
        </div>

        <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
          <p
            role="status"
            className={cn("text-sm", state?.ok ? "text-primary" : "text-destructive", !state && "invisible")}
          >
            {state?.message ?? "\u00a0"}
          </p>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto"
          >
            {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Save link page
          </button>
        </div>
      </form>
    </section>
  )
}
