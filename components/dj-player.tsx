"use client"

import {
  Play,
  Pause,
  SkipForward,
  CheckCircle2,
  Loader2,
  Music,
  ExternalLink,
  Radio,
  Clock,
  Rocket,
  Zap,
  ChevronsUp,
} from "lucide-react"
import Link from "next/link"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { sourceLabels, type QueueItem, type Source } from "@/components/track-types"
import { type LineId } from "@/lib/lines"
import { useDjAudio } from "@/components/dj-audio-provider"
import { VolumeKnob } from "@/components/volume-knob"

const LINE_LABEL: Record<LineId, { label: string; className: string; icon: typeof Zap | null }> = {
  skipplus: { label: "Skip+", className: "bg-primary text-primary-foreground", icon: Rocket },
  skip: { label: "Skip", className: "bg-primary/20 text-primary", icon: Zap },
  boost: { label: "Boost", className: "bg-accent/20 text-accent-foreground", icon: ChevronsUp },
  free: { label: "Free", className: "bg-secondary text-secondary-foreground", icon: null },
}

function fmt(sec: number): string {
  if (!isFinite(sec) || sec < 0) sec = 0
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

// Build an embeddable iframe URL for link submissions where supported.
function embedUrl(source: Source, url: string): string | null {
  try {
    if (source === "youtube") {
      const u = new URL(url)
      const id = u.searchParams.get("v") ?? u.pathname.split("/").pop()
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (source === "spotify") {
      const u = new URL(url)
      const parts = u.pathname.split("/").filter(Boolean)
      const type = parts[0]
      const id = parts[1]
      return type && id ? `https://open.spotify.com/embed/${type}/${id}` : null
    }
    if (source === "soundcloud") {
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23a855f7`
    }
    return null
  } catch {
    return null
  }
}

export function DjPlayer({ showUpNext = true }: { showUpNext?: boolean }) {
  const {
    track,
    tracks,
    isLoading,
    hasAudio,
    playing,
    current,
    limit,
    volume,
    busy,
    togglePlay,
    seek,
    setVolume,
    putOnAir,
    markPlayed,
  } = useDjAudio()

  const isFree = track?.line === "free"
  const embed = track && !hasAudio ? embedUrl(track.source, track.url) : null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading the session...
      </div>
    )
  }

  if (!track && tracks.length > 0) {
    const first = tracks[0]
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-primary/40 bg-card px-6 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/15">
          <Radio className="size-6 text-primary" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Nothing on air yet</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            {tracks.length} {tracks.length === 1 ? "track is" : "tracks are"} waiting. First up: {first.title}.
          </p>
        </div>
        <Button
          onClick={() => putOnAir(first.trackId)}
          disabled={busy}
          className="rounded-full text-xs font-bold uppercase tracking-wider"
        >
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
          Start the session
        </Button>
      </div>
    )
  }

  if (!track) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 px-6 py-20 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
          <Music className="size-6 text-muted-foreground" aria-hidden="true" />
        </div>
        <p className="text-sm font-medium text-foreground">Nothing in the queue</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          When artists submit tracks, they will line up here for you to play.
        </p>
      </div>
    )
  }

  const badge = LINE_LABEL[track.line]
  const BadgeIcon = badge.icon

  return (
    <div className="flex flex-col gap-6">
      {/* Now playing card */}
      <div className="rounded-2xl border border-primary/40 bg-card p-5 sm:p-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
          <Radio className="size-3.5 animate-pulse" aria-hidden="true" />
          Now on the decks
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wide",
              badge.className,
            )}
          >
            {BadgeIcon ? <BadgeIcon className="size-3" aria-hidden="true" /> : null}
            {badge.label}
          </span>
          <span className="rounded bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
            {hasAudio ? "Uploaded audio" : sourceLabels[track.source]}
          </span>
          {isFree ? (
            <span className="inline-flex items-center gap-1 rounded bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent-foreground">
              <Clock className="size-3" aria-hidden="true" />
              Pause prompt at 1:30
            </span>
          ) : null}
        </div>

        <h2 className="mt-2 text-2xl font-extrabold text-foreground text-balance">{track.title}</h2>
        <p className="text-sm text-muted-foreground">submitted by {track.submittedBy}</p>

        {/* Player body */}
        <div className="mt-5">
          {hasAudio ? (
            <>
              <div className="flex items-center gap-3">
                <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                  {fmt(current)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={limit || 0}
                  step={0.1}
                  value={Math.min(current, limit || 0)}
                  onChange={(e) => seek(Number(e.target.value))}
                  aria-label="Seek"
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
                />
                <span className="w-10 shrink-0 text-xs tabular-nums text-muted-foreground">
                  {fmt(limit)}
                </span>
              </div>

              <div className="mt-5 flex items-center justify-center gap-6">
                <span aria-hidden="true" className="size-16" />
                <Button
                  size="icon"
                  onClick={togglePlay}
                  aria-label={playing ? "Pause" : "Play"}
                  className="size-14 rounded-full"
                >
                  {playing ? <Pause className="size-6" aria-hidden="true" /> : <Play className="size-6" aria-hidden="true" />}
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={markPlayed}
                  disabled={busy}
                  aria-label="Mark played and play next"
                  className="rounded-full"
                >
                  <SkipForward className="size-4" aria-hidden="true" />
                </Button>
                <VolumeKnob value={volume} onChange={setVolume} />
              </div>
            </>
          ) : embed ? (
            <div className="overflow-hidden rounded-xl border border-border">
              <iframe
                key={track.trackId}
                src={embed}
                title={track.title}
                allow="autoplay; encrypted-media; fullscreen"
                loading="lazy"
                className={cn("w-full", track.source === "youtube" ? "aspect-video" : "h-[152px]")}
              />
            </div>
          ) : (
            <a
              href={track.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "w-full rounded-full text-xs font-bold uppercase tracking-wider",
              )}
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              Open track in new tab
            </a>
          )}
        </div>

        {/* Session controls */}
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
          <Button
            onClick={markPlayed}
            disabled={busy}
            className="rounded-full text-xs font-bold uppercase tracking-wider"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="size-4" aria-hidden="true" />
            )}
            Mark played &amp; next
          </Button>
          {!hasAudio && embed ? (
            <a
              href={track.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "rounded-full text-xs font-bold uppercase tracking-wider text-muted-foreground",
              )}
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              Open source
            </a>
          ) : null}
        </div>
      </div>

      {showUpNext ? (
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Up next</h3>
          <Link
            href="/admin"
            className="text-xs font-bold uppercase tracking-wider text-primary hover:underline"
          >
            Manage queue
          </Link>
        </div>
        <ol className="flex flex-col gap-2">
          {tracks.map((t, i) => {
            const b = LINE_LABEL[t.line]
            const BIcon = b.icon
            return (
              <li key={t.trackId}>
                <button
                  type="button"
                  onClick={() => putOnAir(t.trackId)}
                  disabled={busy}
                  aria-label={`Play ${t.title} now`}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/50 disabled:opacity-60"
                >
                  <span className="w-5 shrink-0 text-center text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">{t.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">by {t.submittedBy}</span>
                  </span>
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-xs font-bold uppercase tracking-wide",
                      b.className,
                    )}
                  >
                    {BIcon ? <BIcon className="size-3" aria-hidden="true" /> : null}
                    {b.label}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </div>
      ) : null}
    </div>
  )
}
