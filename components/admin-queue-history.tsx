"use client"

import { useState } from "react"
import useSWR, { mutate as globalMutate } from "swr"
import { useRouter } from "next/navigation"
import { ExternalLink, History, Loader2, Search, Trash2, Undo2 } from "lucide-react"
import { VaultReviewDialog, type VaultReviewTarget } from "@/components/vault-review-dialog"
import { LINE_BADGE, VaultButton } from "@/components/admin-queue"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { sourceLabels } from "@/components/track-types"
import type { HistoryItem } from "@/lib/queue-history"
import { removeTrack, requeueTrack } from "@/app/actions/admin"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
})

export function AdminQueueHistory({ archivedTrackIds = [] }: { archivedTrackIds?: string[] }) {
  const router = useRouter()
  const { data, isLoading, mutate } = useSWR<{ tracks: HistoryItem[] }>("/api/admin/history", fetcher)
  const [query, setQuery] = useState("")
  const [busyId, setBusyId] = useState<string | null>(null)
  const [reviewTarget, setReviewTarget] = useState<VaultReviewTarget | null>(null)
  const [savedIds, setSavedIds] = useState<string[]>([])
  const archived = new Set([...archivedTrackIds, ...savedIds])

  const tracks = data?.tracks ?? []
  const q = query.trim().toLowerCase()
  const visible = q
    ? tracks.filter((t) => t.title.toLowerCase().includes(q) || t.submittedBy.toLowerCase().includes(q))
    : tracks

  async function handleRequeue(track: HistoryItem) {
    setBusyId(track.trackId)
    try {
      await requeueTrack(track.trackId)
      await Promise.all([mutate(), globalMutate("/api/queue")])
    } catch (err) {
      console.log("[v0] requeue error:", (err as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleRemove(track: HistoryItem) {
    if (!window.confirm(`Delete "${track.title}" from history? This also deletes any uploaded audio.`)) return
    setBusyId(track.trackId)
    try {
      await removeTrack(track.trackId)
      await mutate()
    } catch (err) {
      console.log("[v0] history remove error:", (err as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          {tracks.length} played {tracks.length === 1 ? "track" : "tracks"}
        </span>
        <div className="relative w-full sm:w-64">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title or artist"
            aria-label="Search played tracks"
            className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Loading history...
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
            <History className="size-6 text-muted-foreground" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-foreground">{q ? "No matches" : "No played tracks yet"}</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            {q ? "Try a different search." : "Songs land here after you hit Next during a live session."}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((track) => {
            const badge = LINE_BADGE[track.line]
            const busy = busyId === track.trackId
            const inVault = archived.has(track.trackId)
            return (
              <li key={track.trackId} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:p-4">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{track.title}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <span className={cn("rounded px-1.5 py-0.5 font-bold uppercase tracking-wide", badge.className)}>
                        {badge.label}
                      </span>
                      <span className="rounded bg-secondary px-1.5 py-0.5 font-medium text-secondary-foreground">
                        {track.audioPathname ? "Uploaded audio" : sourceLabels[track.source]}
                      </span>
                      <span className="truncate">by {track.submittedBy}</span>
                      <span aria-hidden="true">·</span>
                      <time dateTime={track.playedAt}>{dateFormat.format(new Date(track.playedAt))}</time>
                    </div>
                  </div>

                  {busy ? (
                    <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden="true" />
                  ) : null}

                  <VaultButton
                    archived={inVault}
                    title={track.title}
                    onClick={() =>
                      setReviewTarget({ trackId: track.trackId, title: track.title, submittedBy: track.submittedBy })
                    }
                  />

                  <button
                    type="button"
                    onClick={() => handleRequeue(track)}
                    disabled={busy}
                    aria-label={`Put ${track.title} back in the queue`}
                    title="Back to queue"
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/15 hover:text-primary disabled:opacity-40"
                  >
                    <Undo2 className="size-4" aria-hidden="true" />
                  </button>

                  {!track.audioPathname ? (
                    <a
                      href={track.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${track.title} in a new tab`}
                      className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "shrink-0 text-muted-foreground")}
                    >
                      <ExternalLink className="size-4" aria-hidden="true" />
                    </a>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => handleRemove(track)}
                    disabled={busy}
                    aria-label={`Delete ${track.title} from history`}
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive disabled:opacity-40"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>

                {track.audioPathname ? (
                  <audio
                    controls
                    preload="none"
                    className="h-9 w-full"
                    src={`/api/host/audio?pathname=${encodeURIComponent(track.audioPathname)}`}
                  >
                    <track kind="captions" />
                  </audio>
                ) : null}
              </li>
            )
          })}
        </ul>
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
