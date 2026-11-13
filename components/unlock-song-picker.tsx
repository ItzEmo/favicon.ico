"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, Disc3, Loader2, Pause, Play } from "lucide-react"
import type { ArtistSong } from "@/lib/latest-release"
import { saveFeaturedSong } from "@/app/actions/featured-song"

export function UnlockSongPicker({ songs, current }: { songs: ArtistSong[]; current: string | null }) {
  const router = useRouter()
  const audioRef = useRef<HTMLAudioElement>(null)
  const [selected, setSelected] = useState(current)
  const [playing, setPlaying] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function choose(id: string | null) {
    const previous = selected
    setSelected(id)
    setError(null)
    startTransition(async () => {
      const res = await saveFeaturedSong(id)
      if ("error" in res) {
        setSelected(previous)
        setError(res.error ?? "Could not save")
      } else router.refresh()
    })
  }

  function togglePreview(song: ArtistSong) {
    const audio = audioRef.current
    if (!audio || !song.previewUrl) return
    if (playing === song.id) {
      audio.pause()
      return setPlaying(null)
    }
    audio.src = song.previewUrl
    audio.play().then(() => setPlaying(song.id)).catch(() => setPlaying(null))
  }

  return (
    <section aria-labelledby="unlock-song-heading" className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="unlock-song-heading" className="flex items-center gap-2 font-bold uppercase tracking-wide text-card-foreground">
            <Disc3 className="size-5 text-primary" aria-hidden="true" />
            Unlock screen song
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Pick the track featured on the unlock screen. Visitors can tap the cover to hear a 30-second preview.
          </p>
        </div>
        {pending && <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" aria-label="Saving" />}
      </div>

      {songs.length === 0 ? (
        <p className="text-sm text-muted-foreground">Add your Apple Music artist link to load your songs.</p>
      ) : (
        <ul className="flex max-h-80 flex-col gap-1 overflow-y-auto pr-1" role="radiogroup" aria-label="Featured song">
          <li>
            <button
              type="button"
              role="radio"
              aria-checked={selected === null}
              onClick={() => choose(null)}
              className="flex w-full items-center gap-3 rounded-lg p-2 text-left text-sm outline-none transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring aria-checked:bg-secondary"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/15 text-xs font-black text-primary">
                NEW
              </span>
              <span className="flex-1 font-semibold text-card-foreground">Latest release (automatic)</span>
              {selected === null && <Check className="size-4 text-primary" aria-hidden="true" />}
            </button>
          </li>
          {songs.map((song) => (
            <li key={song.id} className="flex items-center gap-1">
              <button
                type="button"
                role="radio"
                aria-checked={selected === song.id}
                onClick={() => choose(song.id)}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-2 text-left text-sm outline-none transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring aria-checked:bg-secondary"
              >
                <img src={song.artworkUrl} alt="" width={40} height={40} loading="lazy" className="size-10 shrink-0 rounded-md object-cover" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-semibold text-card-foreground">{song.title}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {song.collection} · {new Date(song.releaseDate).getFullYear()}
                  </span>
                </span>
                {selected === song.id && <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />}
              </button>
              {song.previewUrl && (
                <button
                  type="button"
                  onClick={() => togglePreview(song)}
                  className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {playing === song.id ? <Pause className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
                  <span className="sr-only">{playing === song.id ? "Pause" : "Preview"} {song.title}</span>
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <audio ref={audioRef} onEnded={() => setPlaying(null)} preload="none" />
    </section>
  )
}
