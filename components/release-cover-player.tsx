"use client"

import { useEffect, useRef, useState } from "react"
import { Pause, Play } from "lucide-react"

export function ReleaseCoverPlayer({
  title,
  artworkUrl,
  previewUrl,
}: {
  title: string
  artworkUrl: string | null
  previewUrl: string | null
}) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => () => audioRef.current?.pause(), [])

  function toggle() {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) audio.play().catch(() => setPlaying(false))
    else audio.pause()
  }

  const cover = artworkUrl ? (
    <img src={artworkUrl} alt={previewUrl ? "" : `${title} cover art`} width={600} height={600} loading="lazy" className="h-full w-full object-cover" />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-background/60 font-black uppercase italic text-foreground/70">
      Emo&apos;s Radio
    </div>
  )

  return (
    <div className="release-card__stage relative flex items-center text-[20px]" data-playing={playing || undefined}>
      <div className="release-card__vinyl" aria-hidden="true">
        <span className="release-card__label" style={artworkUrl ? { backgroundImage: `url(${artworkUrl})` } : undefined} />
      </div>

      {previewUrl ? (
        <button
          type="button"
          onClick={toggle}
          aria-pressed={playing}
          className="release-card__cover group relative aspect-square w-[62%] overflow-hidden rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-foreground"
        >
          {cover}
          <span className="release-card__play absolute inset-0 flex items-center justify-center">
            <span className="flex size-12 items-center justify-center rounded-full border border-foreground/60 bg-background/70 text-foreground backdrop-blur-sm transition-transform group-hover:scale-110">
              {playing ? <Pause className="size-5 fill-current" aria-hidden="true" /> : <Play className="size-5 translate-x-0.5 fill-current" aria-hidden="true" />}
            </span>
          </span>
          <span className="absolute inset-x-0 bottom-0 h-1 bg-background/50" aria-hidden="true">
            <span className="block h-full bg-accent transition-[width] duration-200" style={{ width: `${progress * 100}%` }} />
          </span>
          <span className="sr-only">{playing ? `Pause ${title} preview` : `Play ${title} preview`}</span>
          <audio
            ref={audioRef}
            src={previewUrl}
            preload="none"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => {
              setPlaying(false)
              setProgress(0)
            }}
            onTimeUpdate={(e) => {
              const a = e.currentTarget
              setProgress(a.duration ? a.currentTime / a.duration : 0)
            }}
          />
        </button>
      ) : (
        <div className="release-card__cover relative aspect-square w-[62%] overflow-hidden rounded-lg">{cover}</div>
      )}
    </div>
  )
}
