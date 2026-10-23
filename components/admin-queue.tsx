"use client"

import { useState } from "react"
import useSWR from "swr"
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  ExternalLink,
  Music,
  Loader2,
  Rocket,
  Zap,
  ChevronsUp,
  PlayCircle,
  LogOut,
  Play,
  SkipForward,
  Radio,
  Archive,
  Check,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { VaultReviewDialog, type VaultReviewTarget } from "@/components/vault-review-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { sourceLabels, type QueueItem } from "@/components/track-types"
import { type LineId } from "@/lib/lines"
import {
  removeTrack,
  moveTrack,
  adminLogout,
  playTrack,
  finishAndPlayNext,
} from "@/app/actions/admin"

const LINE_BADGE: Record<LineId, { label: string; className: string; icon: typeof Zap | null }> = {
  skipplus: { label: "Skip+", className: "bg-primary text-primary-foreground", icon: Rocket },
  skip: { label: "Skip", className: "bg-primary/20 text-primary", icon: Zap },
  boost: { label: "Boost", className: "bg-accent/20 text-accent-foreground", icon: ChevronsUp },
  free: { label: "Free", className: "bg-secondary text-secondary-foreground", icon: null },
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function VaultButton({
  archived,
  title,
  onClick,
}: {
  archived: boolean
  title: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={archived ? `${title} is in the Vault. Edit review` : `Review ${title} and add to the Vault`}
      title={archived ? "In the Vault — click to update review" : "Add to Vault"}
      className={cn(
        "flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold uppercase tracking-wider transition-colors",
        archived
          ? "bg-primary/15 text-primary hover:bg-primary/25"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
      )}
    >
      {archived ? <Check className="size-4" aria-hidden="true" /> : <Archive className="size-4" aria-hidden="true" />}
      <span className="hidden sm:inline">Vault</span>
    </button>
  )
}

export function AdminQueue({ archivedTrackIds = [] }: { archivedTrackIds?: string[] }) {
  const router = useRouter()
  const [reviewTarget, setReviewTarget] = useState<VaultReviewTarget | null>(null)
  const [savedIds, setSavedIds] = useState<string[]>([])
  const archived = new Set([...archivedTrackIds, ...savedIds])

  function openReview(track: QueueItem) {
    setReviewTarget({ trackId: track.trackId, title: track.title, submittedBy: track.submittedBy })
  }

  const { data, isLoading, mutate } = useSWR<{ nowPlaying: QueueItem | null; tracks: QueueItem[] }>(
    "/api/queue",
    fetcher,
    { refreshInterval: 5000 },
  )
  const tracks = data?.tracks ?? []
  const nowPlaying = data?.nowPlaying ?? null
  const [busyId, setBusyId] = useState<string | null>(null)

  async function handlePlay(trackId: string) {
    setBusyId(trackId)
    try {
      await playTrack(trackId)
      await mutate()
    } catch (err) {
      console.log("[v0] play error:", (err as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleNext() {
    setBusyId("__next__")
    try {
      await finishAndPlayNext()
      await mutate()
    } catch (err) {
      console.log("[v0] next error:", (err as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleMove(trackId: string, direction: "up" | "down") {
    setBusyId(trackId)
    try {
      await moveTrack(trackId, direction)
      await mutate()
    } catch (err) {
      console.log("[v0] move error:", (err as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleRemove(trackId: string, title: string) {
    if (!window.confirm(`Remove "${title}" from the queue? This cannot be undone.`)) return
    setBusyId(trackId)
    try {
      await removeTrack(trackId)
      await mutate()
    } catch (err) {
      console.log("[v0] remove error:", (err as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            {tracks.length} {tracks.length === 1 ? "track" : "tracks"} live
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/player"
            className={cn(
              buttonVariants({ size: "sm" }),
              "rounded-full text-xs font-bold uppercase tracking-wider",
            )}
          >
            <PlayCircle className="size-4" aria-hidden="true" />
            Open DJ Player
          </Link>
          <form action={adminLogout}>
            <Button
              type="submit"
              size="sm"
              variant="outline"
              className="rounded-full text-xs font-bold uppercase tracking-wider"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </Button>
          </form>
        </div>
      </div>

      {!isLoading ? (
        <section
          aria-label="On air"
          className="flex items-center gap-3 rounded-xl border border-primary bg-primary/10 p-3 sm:p-4"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Radio className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">On air</p>
            {nowPlaying ? (
              <>
                <p className="truncate text-sm font-medium text-foreground">{nowPlaying.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {LINE_BADGE[nowPlaying.line].label} · by {nowPlaying.submittedBy}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Nothing is playing yet.</p>
            )}
          </div>
          {busyId === "__next__" ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden="true" />
          ) : null}
          <Button
            type="button"
            size="sm"
            onClick={handleNext}
            disabled={busyId !== null || (!nowPlaying && tracks.length === 0)}
            className="shrink-0 rounded-full text-xs font-bold uppercase tracking-wider"
          >
            {nowPlaying ? (
              <>
                <SkipForward className="size-4" aria-hidden="true" />
                Next
              </>
            ) : (
              <>
                <Play className="size-4" aria-hidden="true" />
                Start
              </>
            )}
          </Button>
          {nowPlaying ? (
            <VaultButton
              archived={archived.has(nowPlaying.trackId)}
              title={nowPlaying.title}
              onClick={() => openReview(nowPlaying)}
            />
          ) : null}
          {nowPlaying ? (
            <button
              type="button"
              onClick={() => handleRemove(nowPlaying.trackId, nowPlaying.title)}
              disabled={busyId !== null}
              aria-label={`Remove ${nowPlaying.title}`}
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive disabled:opacity-40"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          ) : null}
        </section>
      ) : null}

      {!isLoading && tracks.length > 0 ? (
        <h2 className="-mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Up next</h2>
      ) : null}

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Loading the queue...
        </div>
      ) : tracks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
            <Music className="size-6 text-muted-foreground" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-foreground">The queue is empty</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Submitted tracks will appear here for you to manage.
          </p>
        </div>
      ) : (
        <ol className="flex flex-col gap-3">
          {tracks.map((track, index) => {
            const badge = LINE_BADGE[track.line]
            const BadgeIcon = badge.icon
            const busy = busyId === track.trackId
            return (
              <li
                key={track.trackId}
                className={cn(
                  "flex items-center gap-3 rounded-xl border bg-card p-3 sm:p-4",
                  track.line === "skipplus" ? "border-primary/60" : "border-border",
                )}
              >
                <div className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMove(track.trackId, "up")}
                    disabled={busy || index === 0}
                    aria-label={`Move ${track.title} up`}
                    className="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronUp className="size-4" aria-hidden="true" />
                  </button>
                  <span className="text-xs font-semibold text-primary">{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleMove(track.trackId, "down")}
                    disabled={busy || index === tracks.length - 1}
                    aria-label={`Move ${track.title} down`}
                    className="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronDown className="size-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{track.title}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-bold uppercase tracking-wide",
                        badge.className,
                      )}
                    >
                      {BadgeIcon ? <BadgeIcon className="size-3" aria-hidden="true" /> : null}
                      {badge.label}
                    </span>
                    {track.boosted ? (
                      <span className="inline-flex items-center gap-1 rounded bg-accent/20 px-1.5 py-0.5 font-bold uppercase tracking-wide text-accent-foreground">
                        <ChevronsUp className="size-3" aria-hidden="true" />
                        Boosted
                      </span>
                    ) : null}
                    {track.audioPathname ? (
                      <span className="rounded bg-primary/15 px-1.5 py-0.5 font-medium text-primary">
                        Uploaded audio
                      </span>
                    ) : (
                      <span className="rounded bg-secondary px-1.5 py-0.5 font-medium text-secondary-foreground">
                        {sourceLabels[track.source]}
                      </span>
                    )}
                    <span className="truncate">by {track.submittedBy}</span>
                  </div>
                </div>

                {busy ? (
                  <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden="true" />
                ) : null}

                <button
                  type="button"
                  onClick={() => handlePlay(track.trackId)}
                  disabled={busy}
                  aria-label={`Play ${track.title} now`}
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/15 hover:text-primary disabled:opacity-40"
                >
                  <Play className="size-4" aria-hidden="true" />
                </button>

                <VaultButton
                  archived={archived.has(track.trackId)}
                  title={track.title}
                  onClick={() => openReview(track)}
                />

                {!track.audioPathname ? (
                  <a
                    href={track.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${track.title} in a new tab`}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon" }),
                      "shrink-0 text-muted-foreground",
                    )}
                  >
                    <ExternalLink className="size-4" aria-hidden="true" />
                  </a>
                ) : null}

                <button
                  type="button"
                  onClick={() => handleRemove(track.trackId, track.title)}
                  disabled={busy}
                  aria-label={`Remove ${track.title} from the queue`}
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive disabled:opacity-40"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </li>
            )
          })}
        </ol>
      )}

      <VaultReviewDialog
        target={reviewTarget}
        onClose={() => setReviewTarget(null)}
        onSaved={(trackId) => {
          setSavedIds((ids) => (ids.includes(trackId) ? ids : [...ids, trackId]))
          setReviewTarget(null)
          router.refresh()
        }}
      />
    </div>
  )
}
