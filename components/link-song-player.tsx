"use client"

import { useEffect, useRef, useState } from "react"
import { Music2, Pause, Play } from "lucide-react"

export function LinkSongPlayer({ src, title }: { src: string; title: string }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = 0.6

    // Browsers block sound until the visitor interacts, so retry on the first tap, click or key press.
    const startOnInteraction = () => {
      void audio.play().catch(() => {})
      removeListeners()
    }
    const events = ["pointerdown", "keydown", "touchstart"] as const
    const removeListeners = () => events.forEach((e) => window.removeEventListener(e, startOnInteraction))

    audio.play().catch(() => {
      events.forEach((e) => window.addEventListener(e, startOnInteraction, { once: true }))
    })
    return removeListeners
  }, [])

  function toggle(e: React.MouseEvent) {
    e.stopPropagation()
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) void audio.play().catch(() => {})
    else audio.pause()
  }

  return (
    <div className="absolute top-4 left-4 z-10 flex max-w-[calc(100%-6rem)] items-center gap-2 rounded-full border border-foreground/15 bg-background/50 py-1 pr-4 pl-1 backdrop-blur-md">
      <audio
        ref={audioRef}
        src={src}
        loop
        preload="auto"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={toggle}
        aria-label={playing ? `Pause ${title}` : `Play ${title}`}
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_16px_var(--primary)] transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {playing ? <Pause className="size-4" aria-hidden="true" /> : <Play className="size-4 translate-x-px" aria-hidden="true" />}
      </button>
      <span className="flex min-w-0 items-center gap-1.5">
        <Music2 className={`size-3.5 shrink-0 text-primary${playing ? " animate-pulse" : ""}`} aria-hidden="true" />
        <span className="truncate text-xs font-semibold text-foreground">{playing ? title : "Tap to play"}</span>
      </span>
    </div>
  )
}
