"use client"

import { useActionState, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Copy, ExternalLink, ImagePlus, Link2, Loader2, Plus, Trash2 } from "lucide-react"
import { updateLinkPage, type LinkPageState } from "@/app/actions/link-page"
import {
  LINK_ACCENTS,
  LINK_BACKGROUNDS,
  LINK_HEADER_STYLES,
  MAX_BIO_LENGTH,
  MAX_CUSTOM_LINKS,
  MAX_LINK_TITLE_LENGTH,
  linkPath,
  type LinkAccent,
  type LinkBackground,
} from "@/lib/link-page"
import type { LinkSettings } from "@/lib/account"
import { glassFont } from "@/lib/glass-font"
import { cn } from "@/lib/utils"

function RoundCheckbox({ type = "checkbox", ...props }: React.ComponentProps<"input">) {
  return (
    <span className="relative inline-flex size-5 shrink-0">
      <input
        type={type}
        {...props}
        className="peer size-5 cursor-pointer appearance-none rounded-full border border-foreground/25 bg-foreground/5 transition-colors checked:border-primary checked:bg-primary/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      />
      <Check
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 m-auto size-3 text-primary opacity-0 transition-opacity peer-checked:opacity-100"
        strokeWidth={3}
      />
    </span>
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
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [links, setLinks] = useState(() => settings.customLinks.map((l, i) => ({ ...l, id: `link-${i}` })))
  const nextLinkId = useRef(settings.customLinks.length)
  const fileRef = useRef<HTMLInputElement>(null)

  const fullUrl = `${origin}${linkPath(settings.handle)}`

  async function copyLink() {
    await navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  async function onPickBackground(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setUploadError(null)
    setUploading(true)
    try {
      const body = new FormData()
      body.append("file", file)
      const res = await fetch("/api/account/link-bg", { method: "POST", body })
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

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-sm font-semibold text-foreground">Page header</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(LINK_HEADER_STYLES).map(([key, style]) => (
              <label
                key={key}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-background/60 px-4 py-3 has-[:checked]:border-primary"
              >
                <span className="flex flex-col">
                  <span
                    className={
                      key === "glass"
                        ? `${glassFont.className} glass-text text-lg leading-tight font-normal uppercase`
                        : "text-sm font-semibold text-foreground"
                    }
                  >
                    {style.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{style.description}</span>
                </span>
                <RoundCheckbox type="radio" name="headerStyle" value={key} defaultChecked={settings.headerStyle === key} />
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-sm font-semibold text-foreground">Stats shown on your page</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              { name: "hideSubmissions", label: "Hide submissions", checked: settings.hideSubmissions },
              { name: "hideAvgScore", label: "Hide avg score", checked: settings.hideAvgScore },
              { name: "hideRank", label: "Hide rank", checked: settings.hideRank },
            ].map((opt) => (
              <label
                key={opt.name}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/60 px-4 py-3 text-sm font-semibold text-foreground"
              >
                {opt.label}
                <RoundCheckbox name={opt.name} defaultChecked={opt.checked} />
              </label>
            ))}
          </div>
        </fieldset>

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
                  Your photo
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
              {customImage ? "Replace photo" : "Upload photo"}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={onPickBackground} className="sr-only" tabIndex={-1} aria-hidden="true" />
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

        <label className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background/60 px-4 py-3">
          <span className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">Rain effect</span>
            <span className="text-xs text-muted-foreground">Falling rain over your background, like the unlock screen.</span>
          </span>
          <RoundCheckbox name="rain" defaultChecked={settings.rain} />
        </label>

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
