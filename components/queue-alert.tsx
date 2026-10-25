"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { Bell, BellRing, Radio, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { QueueItem } from "@/components/track-types"
import { MY_TRACKS_EVENT, getDeviceTrackIds } from "@/lib/my-tracks"

type QueueData = { nowPlaying: QueueItem | null; tracks: QueueItem[] }
type Level = 0 | 1 | 2 | 3 | 4

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// How many spots away counts as "coming up". Closer spots escalate the alert.
const WATCH_RANGE = 6

function levelFor(position: number | "live"): Level {
  if (position === "live") return 4
  if (position === 1) return 3
  if (position <= 3) return 2
  if (position <= WATCH_RANGE) return 1
  return 0
}

const COPY: Record<Exclude<Level, 0>, { eyebrow: string; headline: (title: string, ahead: number) => string }> = {
  1: { eyebrow: "Coming up", headline: (t, ahead) => `"${t}" is ${ahead} songs away` },
  2: { eyebrow: "Getting close", headline: (t, ahead) => `Only ${ahead} ${ahead === 1 ? "song" : "songs"} before "${t}"` },
  3: { eyebrow: "You're next", headline: (t) => `"${t}" plays right after this song` },
  4: { eyebrow: "You're live", headline: (t) => `"${t}" is on air right now` },
}

const VIBRATION: Record<Exclude<Level, 0>, number[]> = {
  1: [80],
  2: [120, 80, 120],
  3: [200, 100, 200, 100, 200],
  4: [400, 120, 400],
}

export function QueueAlert() {
  const { data } = useSWR<QueueData>("/api/queue", fetcher, { refreshInterval: 6000 })
  const { data: mine } = useSWR<{ trackIds: string[] }>("/api/queue/mine", fetcher, { refreshInterval: 30000 })

  const [deviceIds, setDeviceIds] = useState<string[]>([])
  useEffect(() => {
    const sync = () => setDeviceIds(getDeviceTrackIds())
    sync()
    window.addEventListener(MY_TRACKS_EVENT, sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(MY_TRACKS_EVENT, sync)
      window.removeEventListener("storage", sync)
    }
  }, [])

  const myIds = useMemo(() => new Set([...deviceIds, ...(mine?.trackIds ?? [])]), [deviceIds, mine])

  const alert = useMemo(() => {
    if (!data || myIds.size === 0) return null
    if (data.nowPlaying && myIds.has(data.nowPlaying.trackId)) {
      return { track: data.nowPlaying, position: "live" as const, level: 4 as Level }
    }
    const index = data.tracks.findIndex((t) => myIds.has(t.trackId))
    if (index === -1) return null
    const position = index + 1
    return { track: data.tracks[index], position, level: levelFor(position) }
  }, [data, myIds])

  const [dismissed, setDismissed] = useState<Record<string, Level>>({})
  const notified = useRef<Record<string, Level>>({})
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported")

  useEffect(() => {
    if ("Notification" in window) setPermission(Notification.permission)
  }, [])

  useEffect(() => {
    if (!alert || alert.level === 0) return
    const { track, level } = alert
    const last = notified.current[track.trackId] ?? 0
    if (level <= last) return
    notified.current[track.trackId] = level

    navigator.vibrate?.(VIBRATION[level])
    if (permission === "granted" && document.visibilityState === "hidden") {
      const ahead = typeof alert.position === "number" ? alert.position - 1 : 0
      new Notification(COPY[level].eyebrow, {
        body: COPY[level].headline(track.title, ahead).replaceAll('"', ""),
        icon: "/icon.png",
        tag: `queue-${track.trackId}`,
      })
    }
  }, [alert, permission])

  if (!alert || alert.level === 0) return null
  const { track, level, position } = alert
  if ((dismissed[track.trackId] ?? 0) >= level) return null

  const ahead = typeof position === "number" ? position - 1 : 0
  const copy = COPY[level]
  const filled = position === "live" ? WATCH_RANGE : WATCH_RANGE - position + 1

  async function enableAlerts() {
    if (!("Notification" in window)) return
    setPermission(await Notification.requestPermission())
  }

  return (
    <aside
      key={`${track.trackId}-${level}`}
      role="status"
      aria-live={level >= 3 ? "assertive" : "polite"}
      className={cn(
        "notice-pop fixed inset-x-4 top-20 z-50 mx-auto flex max-w-md flex-col gap-3 rounded-2xl border p-4 shadow-xl backdrop-blur",
        level === 4 && "border-primary bg-primary text-primary-foreground",
        level === 3 && "queue-alert-urgent border-primary bg-card/95 text-foreground",
        level === 2 && "border-accent/60 bg-card/95 text-foreground",
        level === 1 && "border-border bg-card/95 text-foreground",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full",
            level === 4 ? "bg-primary-foreground/20" : level >= 2 ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground",
          )}
        >
          {level === 4 ? (
            <Radio className="size-4 animate-pulse" aria-hidden="true" />
          ) : level >= 2 ? (
            <BellRing className="queue-bell size-4" aria-hidden="true" />
          ) : (
            <Bell className="size-4" aria-hidden="true" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-xs font-bold uppercase tracking-wider",
              level === 4 ? "text-primary-foreground/80" : level >= 2 ? "text-primary" : "text-muted-foreground",
            )}
          >
            {copy.eyebrow}
          </p>
          <p className="text-pretty text-sm font-semibold leading-relaxed">{copy.headline(track.title, ahead)}</p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed((d) => ({ ...d, [track.trackId]: level }))}
          aria-label="Dismiss alert"
          className="rounded-full p-1 opacity-70 transition-opacity hover:opacity-100"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <ol className="flex flex-1 gap-1" aria-label={position === "live" ? "On air" : `Spot ${position} in line`}>
          {Array.from({ length: WATCH_RANGE }, (_, i) => (
            <li
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors duration-500",
                i < filled
                  ? level === 4
                    ? "bg-primary-foreground"
                    : level >= 2
                      ? "bg-primary"
                      : "bg-muted-foreground"
                  : level === 4
                    ? "bg-primary-foreground/25"
                    : "bg-secondary",
              )}
            />
          ))}
        </ol>
        {permission === "default" && level < 4 ? (
          <button
            type="button"
            onClick={enableAlerts}
            className="shrink-0 text-xs font-bold uppercase tracking-wider text-primary hover:underline"
          >
            Turn on alerts
          </button>
        ) : (
          <Link
            href="/queue"
            className={cn(
              "shrink-0 text-xs font-bold uppercase tracking-wider hover:underline",
              level === 4 ? "text-primary-foreground" : "text-primary",
            )}
          >
            {level === 4 ? "Listen" : "View queue"}
          </Link>
        )}
      </div>
    </aside>
  )
}
