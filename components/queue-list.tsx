"use client"

import { ExternalLink, Music, ListMusic, Zap, Rocket, ChevronsUp, Loader2 } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { sourceLabels, type QueueItem } from "@/components/track-types"
import { LINES, type LineId } from "@/lib/lines"
import { TrackRating, type RatingsData } from "@/components/track-rating"
import { ArtistName } from "@/components/artist-name"

// The tier a track can pay to jump to next.
const NEXT_TIER: Record<LineId, LineId | null> = {
  free: "skip",
  boost: "skip",
  skip: "skipplus",
  skipplus: null,
}

interface QueueListProps {
  tracks: QueueItem[]
  onSkip: (item: QueueItem, target: LineId) => void
  onBoost: (item: QueueItem) => void
  pendingId: string | null
  ratings: RatingsData | undefined
  onRated: () => void
}

interface Group {
  key: string
  indicator: "skipplus" | "skip" | null
  tracks: QueueItem[]
}

function groupTracks(tracks: QueueItem[]): Group[] {
  const skipplus = tracks.filter((t) => t.line === "skipplus")
  const skip = tracks.filter((t) => t.line === "skip")
  const rest = tracks.filter((t) => t.line === "boost" || t.line === "free")
  const groups: Group[] = []
  if (skipplus.length) groups.push({ key: "skipplus", indicator: "skipplus", tracks: skipplus })
  if (skip.length) groups.push({ key: "skip", indicator: "skip", tracks: skip })
  if (rest.length) groups.push({ key: "rest", indicator: null, tracks: rest })
  return groups
}

function LineIndicator({ line, count }: { line: "skipplus" | "skip"; count: number }) {
  const isPlus = line === "skipplus"
  const Icon = isPlus ? Rocket : Zap
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider",
          isPlus ? "bg-primary text-primary-foreground" : "bg-primary/20 text-primary",
        )}
      >
        <Icon className="size-3.5" aria-hidden="true" />
        {isPlus ? "Skip+ Line" : "Skip Line"}
      </span>
      <span className={cn("h-px flex-1", isPlus ? "bg-primary/60" : "bg-primary/25")} aria-hidden="true" />
      <span className="text-xs font-medium text-muted-foreground">
        {count} {count === 1 ? "track" : "tracks"}
      </span>
    </div>
  )
}

export function QueueList({ tracks, onSkip, onBoost, pendingId, ratings, onRated }: QueueListProps) {
  const groups = groupTracks(tracks)
  let position = 0

  return (
    <section aria-label="Submission queue" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <ListMusic className="size-5 text-primary" aria-hidden="true" />
          Up next
        </h2>
        <span className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          {tracks.length} {tracks.length === 1 ? "track" : "tracks"}
        </span>
      </div>

      {tracks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
            <Music className="size-6 text-muted-foreground" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-foreground">Nothing up next</p>
          <p className="max-w-xs text-sm text-muted-foreground text-pretty">
            Head to the submit page to get your track on Emo&apos;s Radio tonight.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <div
              key={group.key}
              role="group"
              aria-label={
                group.indicator === "skipplus"
                  ? "Skip+ line"
                  : group.indicator === "skip"
                    ? "Skip line"
                    : "Free line"
              }
              className="flex flex-col gap-3"
            >
              {group.indicator ? (
                <LineIndicator line={group.indicator} count={group.tracks.length} />
              ) : null}
              <ol className="flex flex-col gap-3">
                {group.tracks.map((track) => {
                  position += 1
                  return (
                    <QueueRow
                      key={track.trackId}
                      track={track}
                      position={position}
                      busy={pendingId === track.trackId}
                      onSkip={onSkip}
                      onBoost={onBoost}
                      ratings={ratings}
                      onRated={onRated}
                    />
                  )
                })}
              </ol>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function QueueRow({
  track,
  position,
  busy,
  onSkip,
  onBoost,
  ratings,
  onRated,
}: {
  track: QueueItem
  position: number
  busy: boolean
  onSkip: (item: QueueItem, target: LineId) => void
  onBoost: (item: QueueItem) => void
  ratings: RatingsData | undefined
  onRated: () => void
}) {
  const nextTier = NEXT_TIER[track.line]
  const inPaidLine = track.line === "skipplus" || track.line === "skip"
  const boostPromotes = track.line === "boost"

  return (
    <li
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-card p-3 transition-colors sm:p-4",
        track.line === "skipplus"
          ? "border-primary/60"
          : inPaidLine
            ? "border-primary/30"
            : "border-border hover:border-primary/50",
      )}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold",
            inPaidLine ? "bg-primary/15 text-primary" : "bg-secondary text-secondary-foreground",
          )}
        >
          <span className="sr-only">Position </span>
          {position}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{track.title}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            {track.boosted ? (
              <span className="inline-flex items-center gap-1 rounded bg-accent/20 px-1.5 py-0.5 font-bold uppercase tracking-wide text-accent-foreground">
                <ChevronsUp className="size-3" aria-hidden="true" />
                Boosted
              </span>
            ) : null}
            <span className="rounded bg-secondary px-1.5 py-0.5 font-medium text-secondary-foreground">
              {sourceLabels[track.source]}
            </span>
            <span className="truncate">
              by <ArtistName name={track.submittedBy} userId={track.userId} />
            </span>
          </div>
        </div>

        <a
          href={track.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${track.title} in a new tab`}
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "shrink-0 text-muted-foreground")}
        >
          <ExternalLink className="size-4" aria-hidden="true" />
        </a>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
        {nextTier ? (
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => onSkip(track, nextTier)}
            className="h-8 rounded-full text-xs font-bold uppercase tracking-wider"
            aria-label={`Pay to move ${track.title} into the ${LINES[nextTier].shortName} line`}
          >
            {busy ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : nextTier === "skipplus" ? (
              <Rocket className="size-3.5" aria-hidden="true" />
            ) : (
              <Zap className="size-3.5" aria-hidden="true" />
            )}
            {LINES[nextTier].shortName} ${LINES[nextTier].priceInCents / 100}
          </Button>
        ) : null}

        <Button
          size="sm"
          variant="ghost"
          disabled={busy}
          onClick={() => onBoost(track)}
          className="h-8 rounded-full text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          aria-label={
            boostPromotes
              ? `Boost ${track.title} again to move it into the Skip line`
              : `Pay to boost ${track.title} within its line`
          }
        >
          <ChevronsUp className="size-3.5" aria-hidden="true" />
          {boostPromotes ? "Boost again $5 — to Skip" : "Boost $5"}
        </Button>
      </div>

      <div className="border-t border-border/60 pt-3">
        <TrackRating trackId={track.trackId} title={track.title} ratings={ratings} onRated={onRated} />
      </div>
    </li>
  )
}
