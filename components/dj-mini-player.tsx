"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Headphones,
  Loader2,
  Pause,
  Play,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useDjAudio } from "@/components/dj-audio-provider"

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00"
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

export function DjMiniPlayer() {
  const {
    track,
    tracks,
    hasAudio,
    playing,
    current,
    limit,
    volume,
    muted,
    busy,
    fullPlayerVisible,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    markPlayed,
  } = useDjAudio()
  const [collapsed, setCollapsed] = useState(false)

  if (!track || fullPlayerVisible) return null

  const effectiveVolume = muted ? 0 : volume
  const VolumeIcon = effectiveVolume === 0 ? VolumeX : effectiveVolume < 0.5 ? Volume1 : Volume2
  const progress = limit > 0 ? Math.min(100, (current / limit) * 100) : 0
  const upNext = tracks.find((t) => t.trackId !== track.trackId)

  if (collapsed) {
    return (
      <aside
        aria-label="DJ player"
        className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-full border border-primary/40 bg-card/95 p-1.5 pr-2 shadow-lg backdrop-blur"
      >
        <Button
          size="icon"
          onClick={togglePlay}
          disabled={!hasAudio}
          aria-label={playing ? "Pause" : "Play"}
          className="size-9 rounded-full"
        >
          {playing ? <Pause className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
        </Button>
        <span className="flex h-4 items-end gap-0.5" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={cn("w-1 rounded-full bg-primary", playing ? "animate-eq-bar" : "h-1")}
              style={playing ? { animationDelay: `${i * 0.15}s` } : undefined}
            />
          ))}
        </span>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setCollapsed(false)}
          aria-label="Expand player"
          className="size-8 rounded-full"
        >
          <ChevronUp className="size-4" aria-hidden="true" />
        </Button>
      </aside>
    )
  }

  return (
    <aside
      aria-label="DJ player"
      className="fixed inset-x-2 bottom-2 z-40 mx-auto flex max-w-3xl flex-col gap-2 rounded-2xl border border-primary/40 bg-card/95 p-3 shadow-lg backdrop-blur sm:inset-x-4 sm:bottom-4"
    >
      <div className="flex items-center gap-3">
        <Button
          size="icon"
          onClick={togglePlay}
          disabled={!hasAudio}
          aria-label={playing ? "Pause" : "Play"}
          className="size-11 shrink-0 rounded-full"
        >
          {playing ? <Pause className="size-5" aria-hidden="true" /> : <Play className="size-5" aria-hidden="true" />}
        </Button>

        <Link href="/admin?section=queue" className="min-w-0 flex-1">
          <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-primary">
            <Headphones className="size-3" aria-hidden="true" />
            {hasAudio ? "On the decks" : "On air (link)"}
          </span>
          <span className="block truncate text-sm font-semibold text-foreground">{track.title}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {track.submittedBy}
            {upNext ? <span className="hidden sm:inline">{` · Up next: ${upNext.title}`}</span> : null}
          </span>
        </Link>

        {!hasAudio ? (
          <a
            href={track.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open track link"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
          </a>
        ) : null}

        <div className="hidden items-center gap-2 sm:flex">
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleMute}
            aria-label={muted ? "Unmute" : "Mute"}
            className="size-9 rounded-full"
          >
            <VolumeIcon className="size-4" aria-hidden="true" />
          </Button>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(effectiveVolume * 100)}
            onChange={(e) => setVolume(Number(e.target.value) / 100)}
            aria-label="Volume"
            className="h-1.5 w-28 cursor-pointer accent-primary"
          />
          <span className="w-8 text-right font-mono text-xs tabular-nums text-muted-foreground">
            {Math.round(effectiveVolume * 100)}
          </span>
        </div>

        <Button
          size="icon"
          variant="ghost"
          onClick={markPlayed}
          disabled={busy}
          aria-label="Mark played and play next"
          className="size-9 shrink-0 rounded-full"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <SkipForward className="size-4" aria-hidden="true" />
          )}
        </Button>

        <Button
          size="icon"
          variant="ghost"
          onClick={() => setCollapsed(true)}
          aria-label="Minimize player"
          className="size-9 shrink-0 rounded-full"
        >
          <ChevronDown className="size-4" aria-hidden="true" />
        </Button>
      </div>

      {hasAudio ? (
        <div className="flex items-center gap-2">
          <span className="w-10 font-mono text-xs tabular-nums text-muted-foreground">{formatTime(current)}</span>
          <input
            type="range"
            min={0}
            max={limit > 0 ? limit : 1}
            step={0.5}
            value={Math.min(current, limit || 0)}
            onChange={(e) => seek(Number(e.target.value))}
            aria-label="Seek"
            style={{ backgroundSize: `${progress}% 100%` }}
            className="h-1.5 flex-1 cursor-pointer accent-primary"
          />
          <span className="w-10 text-right font-mono text-xs tabular-nums text-muted-foreground">
            {formatTime(limit)}
          </span>
        </div>
      ) : null}

      <div className="flex items-center gap-2 sm:hidden">
        <Button
          size="icon"
          variant="ghost"
          onClick={toggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
          className="size-8 rounded-full"
        >
          <VolumeIcon className="size-4" aria-hidden="true" />
        </Button>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(effectiveVolume * 100)}
          onChange={(e) => setVolume(Number(e.target.value) / 100)}
          aria-label="Volume"
          className="h-1.5 flex-1 cursor-pointer accent-primary"
        />
      </div>
    </aside>
  )
}
