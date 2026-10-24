"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Headphones, Pause, Play, SkipForward, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VolumeKnob } from "@/components/volume-knob"
import { useDjAudio } from "@/components/dj-audio-provider"

const FULL_PLAYER_PATHS = new Set(["/admin", "/admin/player"])

export function DjMiniPlayer() {
  const pathname = usePathname()
  const { track, hasAudio, playing, current, limit, volume, busy, togglePlay, setVolume, markPlayed } =
    useDjAudio()

  if (!track || !hasAudio || FULL_PLAYER_PATHS.has(pathname)) return null

  const progress = limit > 0 ? Math.min(100, (current / limit) * 100) : 0

  return (
    <aside
      aria-label="DJ player"
      className="fixed bottom-4 left-4 z-40 flex w-[calc(100%-2rem)] max-w-sm items-center gap-3 overflow-hidden rounded-2xl border border-primary/40 bg-card/95 p-3 shadow-lg backdrop-blur"
    >
      <Button
        size="icon"
        onClick={togglePlay}
        aria-label={playing ? "Pause" : "Play"}
        className="size-10 shrink-0 rounded-full"
      >
        {playing ? <Pause className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
      </Button>

      <Link href="/admin#player" className="min-w-0 flex-1">
        <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-primary">
          <Headphones className="size-3" aria-hidden="true" />
          On the decks
        </span>
        <span className="block truncate text-sm font-medium text-foreground">{track.title}</span>
        <span className="block truncate text-xs text-muted-foreground">{track.submittedBy}</span>
      </Link>

      <Button
        size="icon"
        variant="ghost"
        onClick={markPlayed}
        disabled={busy}
        aria-label="Mark played and play next"
        className="shrink-0 rounded-full"
      >
        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <SkipForward className="size-4" aria-hidden="true" />}
      </Button>

      <VolumeKnob value={volume} onChange={setVolume} size="sm" className="shrink-0" />

      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-secondary">
        <span className="block h-full bg-primary" style={{ width: `${progress}%` }} />
      </span>
    </aside>
  )
}
