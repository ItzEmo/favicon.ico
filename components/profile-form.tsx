"use client"

import { useActionState, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Camera, Loader2, Plus, Trash2 } from "lucide-react"
import { updateProfile, type ProfileState } from "@/app/actions/profile"
import { MAX_MUSIC_LINKS, type MusicLink } from "@/lib/music-links"

interface ProfileFormProps {
  name: string
  email: string
  image: string | null
  instagram: string | null
  musicLinks: MusicLink[]
}

function initialsOf(name: string) {
  const parts = name.trim().split(/[\s_.-]+/).filter(Boolean)
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).toUpperCase()
}

export function ProfileForm({ name, email, image, instagram, musicLinks }: ProfileFormProps) {
  const router = useRouter()
  const [links, setLinks] = useState(() =>
    musicLinks.map((l, i) => ({ key: `saved-${i}`, title: l.title, url: l.url })),
  )
  const fileRef = useRef<HTMLInputElement>(null)
  const [avatar, setAvatar] = useState(image)
  const [uploading, setUploading] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [state, formAction, saving] = useActionState<ProfileState | null, FormData>(
    updateProfile,
    null,
  )

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setAvatarError(null)
    setUploading(true)
    try {
      const body = new FormData()
      body.append("file", file)
      const res = await fetch("/api/account/avatar", { method: "POST", body })
      const data = (await res.json()) as { image?: string; error?: string }
      if (!res.ok || !data.image) throw new Error(data.error ?? "Upload failed")
      setAvatar(data.image)
      router.refresh()
    } catch (error) {
      setAvatarError((error as Error).message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-border bg-card/80 p-6 text-center sm:p-8">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="group relative size-24 overflow-hidden rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="Change profile picture"
        >
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element -- avatar hosts vary
            <img src={avatar} alt="" referrerPolicy="no-referrer" className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center bg-primary text-3xl font-extrabold text-primary-foreground">
              {initialsOf(name || email)}
            </span>
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            {uploading ? (
              <Loader2 className="size-6 animate-spin text-foreground" aria-hidden="true" />
            ) : (
              <Camera className="size-6 text-foreground" aria-hidden="true" />
            )}
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={onPickFile}
          tabIndex={-1}
          aria-hidden="true"
        />
        <p className="text-sm text-muted-foreground">
          {uploading ? "Uploading…" : "Tap your picture to change it · JPG, PNG, WEBP or GIF up to 4 MB"}
        </p>
        {avatarError ? (
          <p role="alert" className="text-sm font-medium text-destructive">
            {avatarError}
          </p>
        ) : null}
      </div>

      <form action={formAction} className="flex flex-col gap-5 rounded-3xl border border-border bg-card/80 p-6 sm:p-8">
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-primary">
            Artist Name
          </label>
          <input
            id="name"
            name="name"
            defaultValue={name}
            required
            maxLength={80}
            autoComplete="nickname"
            className="h-11 rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors focus:border-primary"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="instagram" className="text-xs font-bold uppercase tracking-wider text-primary">
            Instagram
          </label>
          <div className="flex h-11 items-center rounded-xl border border-border bg-background px-4 transition-colors focus-within:border-primary">
            <span className="text-sm text-muted-foreground" aria-hidden="true">
              @
            </span>
            <input
              id="instagram"
              name="instagram"
              defaultValue={instagram ?? ""}
              placeholder="yourhandle"
              maxLength={120}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              className="h-full flex-1 bg-transparent pl-1 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <p className="text-xs text-muted-foreground">Your handle or a link to your profile.</p>
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">Released Music</legend>
          <p className="-mt-1 text-xs text-muted-foreground">
            Spotify, Apple Music, YouTube, SoundCloud or any https:// link. Shown on your public profile.
          </p>
          {links.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground">
              No releases added yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {links.map((link, i) => (
                <li key={link.key} className="flex flex-col gap-2 rounded-xl border border-border bg-background/60 p-3 sm:flex-row sm:items-center">
                  <label className="sr-only" htmlFor={`link-title-${link.key}`}>
                    Release {i + 1} title
                  </label>
                  <input
                    id={`link-title-${link.key}`}
                    name="linkTitle"
                    defaultValue={link.title}
                    placeholder="Release title"
                    maxLength={80}
                    className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary sm:w-2/5"
                  />
                  <label className="sr-only" htmlFor={`link-url-${link.key}`}>
                    Release {i + 1} link
                  </label>
                  <input
                    id={`link-url-${link.key}`}
                    name="linkUrl"
                    type="url"
                    defaultValue={link.url}
                    placeholder="https://open.spotify.com/…"
                    inputMode="url"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setLinks((prev) => prev.filter((l) => l.key !== link.key))}
                    className="inline-flex h-10 items-center justify-center gap-1 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:text-destructive"
                    aria-label={`Remove release ${i + 1}`}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {links.length < MAX_MUSIC_LINKS ? (
            <button
              type="button"
              onClick={() => setLinks((prev) => [...prev, { key: crypto.randomUUID(), title: "", url: "" }])}
              className="inline-flex h-10 w-fit items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <Plus className="size-4" aria-hidden="true" />
              Add release
            </button>
          ) : null}
        </fieldset>

        <div className="flex items-center justify-between gap-4">
          <p
            role="status"
            className={state?.ok ? "text-sm font-medium text-primary" : "text-sm font-medium text-destructive"}
          >
            {state?.message}
          </p>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            Save
          </button>
        </div>
      </form>
    </div>
  )
}
