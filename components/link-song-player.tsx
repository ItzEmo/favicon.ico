"use client"

import { useEffect, useRef, useState } from "react"
import { Music2, Pause, Play, Volume1, Volume2, VolumeX } from "lucide-react"

const DEFAULT_VOLUME = 0.6

export function LinkSongPlayer({ src, title }: { src: string; title: string }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(DEFAULT_VOLUME)
  const [blockedUnmute, setBlockedUnmute] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = DEFAULT_VOLUME

    const events = ["pointerdown", "keydown", "touchstart"] as const
    const removeListeners = () => events.forEach((e) => window.removeEventListener(e, unmuteOnInteraction))
    // Browsers only allow sound after the visitor interacts, so the song starts muted and unmutes on the first tap.
    const unmuteOnInteraction = () => {
      removeListeners()
      setBlockedUnmute(false)
      if (audio.muted) {
        audio.muted = false
        setMuted(false)
      }
      if (audio.paused) void audio.play().catch(() => {})
    }

    audio.play().catch(() => {
      audio.muted = true
      setMuted(true)
      setBlockedUnmute(true)
      void audio.play().catch(() => {})
      events.forEach((e) => window.addEventListener(e, unmuteOnInteraction, { once: true }))
    })
    return removeListeners
  }, [])

  function stop(e: React.SyntheticEvent) {
    e.stopPropagation()
    setBlockedUnmute(false)
  }

  function togglePlay(e: React.MouseEvent) {
    stop(e)
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) void audio.play().catch(() => {})
    else audio.pause()
  }

  function toggleMute(e: React.MouseEvent) {
    stop(e)
    const audio = audioRef.current
    if (!audio) return
    const next = !audio.muted
    audio.muted = next
    setMuted(next)
    if (!next && audio.volume === 0) {
      audio.volume = DEFAULT_VOLUME
      setVolume(DEFAULT_VOLUME)
    }
  }

  function changeVolume(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current
    if (!audio) return
    const next = Number(e.target.value)
    audio.volume = next
    audio.muted = next === 0
    setVolume(next)
    setMuted(next === 0)
  }

  const silent = muted || volume === 0
  const VolumeIcon = silent ? VolumeX : volume < 0.5 ? Volume1 : Volume2
  const label = !playing ? "Paused" : blockedUnmute ? "Tap anywhere for sound" : title

  return (
    <div
      onPointerDown={stop}
      className="absolute top-4 left-4 z-10 flex max-w-[calc(100%-6rem)] items-center gap-2 rounded-full border border-foreground/15 bg-background/50 py-1 pr-3 pl-1 backdrop-blur-md"
    >
      <audio
        ref={audioRef}
        src={src}
        loop
        autoPlay
        preload="auto"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <button
        type="button"
        onClick={togglePlay}
        aria-label={playing ? `Pause ${title}` : `Play ${title}`}
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_16px_var(--primary)] transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {playing ? <Pause className="size-4" aria-hidden="true" /> : <Play className="size-4 translate-x-px" aria-hidden="true" />}
      </button>
      <span className="flex min-w-0 items-center gap-1.5">
        <Music2 className={`size-3.5 shrink-0 text-primary${playing && !silent ? " animate-pulse" : ""}`} aria-hidden="true" />
        <span className="max-w-32 truncate text-xs font-semibold text-foreground sm:max-w-48">{label}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1.5 border-l border-foreground/15 pl-2">
        <button
          type="button"
          onClick={toggleMute}
          aria-label={silent ? "Unmute song" : "Mute song"}
          aria-pressed={silent}
          className="flex size-7 items-center justify-center rounded-full text-foreground transition-colors hover:bg-foreground/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <VolumeIcon className="size-4" aria-hidden="true" />
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={silent ? 0 : volume}
          onChange={changeVolume}
          aria-label="Song volume"
          className="hidden w-20 cursor-pointer accent-primary sm:block"
        />
      </span>
    </div>
  )
}
