"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import useSWR, { type KeyedMutator } from "swr"
import type { QueueItem } from "@/components/track-types"
import { finishAndPlayNext, playTrack } from "@/app/actions/admin"
import { PreviewPausePrompt } from "@/components/preview-pause-prompt"

export const FREE_PREVIEW_SECONDS = 90

const VOLUME_STORAGE_KEY = "dj-volume"

type QueueData = { nowPlaying: QueueItem | null; tracks: QueueItem[] }

type DjAudioContextValue = {
  track: QueueItem | null
  tracks: QueueItem[]
  isLoading: boolean
  mutate: KeyedMutator<QueueData>
  hasAudio: boolean
  playing: boolean
  current: number
  duration: number
  limit: number
  previewPrompt: boolean
  volume: number
  busy: boolean
  togglePlay: () => void
  seek: (time: number) => void
  pauseFromPrompt: () => void
  dismissPreviewPrompt: () => void
  setVolume: (volume: number) => void
  muted: boolean
  toggleMute: () => void
  fullPlayerVisible: boolean
  registerFullPlayer: () => () => void
  putOnAir: (trackId: string) => Promise<void>
  markPlayed: () => Promise<void>
}

const DjAudioContext = createContext<DjAudioContextValue | null>(null)

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useDjAudio() {
  const ctx = useContext(DjAudioContext)
  if (!ctx) throw new Error("useDjAudio must be used inside DjAudioProvider")
  return ctx
}

export function useOptionalDjAudio() {
  return useContext(DjAudioContext)
}

export function DjAudioProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading, mutate } = useSWR<QueueData>("/api/queue", fetcher, { refreshInterval: 8000 })
  const tracks = useMemo(() => data?.tracks ?? [], [data])
  const track = data?.nowPlaying ?? null

  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [previewPrompt, setPreviewPrompt] = useState(false)
  const [promptHandled, setPromptHandled] = useState(false)
  const [volume, setVolumeState] = useState(0.8)
  const [busy, setBusy] = useState(false)
  const [muted, setMuted] = useState(false)
  const [fullPlayerCount, setFullPlayerCount] = useState(0)
  const resumeOnNextTrack = useRef(false)

  const trackId = track?.trackId
  const hasAudio = Boolean(track?.audioPathname)
  const isFree = track?.line === "free"
  const limit = duration

  useEffect(() => {
    const saved = Number(window.localStorage.getItem(VOLUME_STORAGE_KEY))
    if (window.localStorage.getItem(VOLUME_STORAGE_KEY) !== null && Number.isFinite(saved)) {
      setVolumeState(Math.min(1, Math.max(0, saved)))
    }
  }, [])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
      audioRef.current.muted = muted
    }
  }, [volume, muted, trackId])

  const toggleMute = useCallback(() => setMuted((m) => !m), [])

  const registerFullPlayer = useCallback(() => {
    setFullPlayerCount((c) => c + 1)
    return () => setFullPlayerCount((c) => c - 1)
  }, [])

  useEffect(() => {
    setPlaying(false)
    setCurrent(0)
    setDuration(0)
    setPreviewPrompt(false)
    setPromptHandled(false)
  }, [trackId])

  const setVolume = useCallback((next: number) => {
    const clamped = Math.min(1, Math.max(0, next))
    setVolumeState(clamped)
    if (clamped > 0) setMuted(false)
    window.localStorage.setItem(VOLUME_STORAGE_KEY, String(clamped))
  }, [])

  const togglePlay = useCallback(() => {
    const el = audioRef.current
    if (!el) return
    if (el.paused) void el.play()
    else el.pause()
  }, [])

  const seek = useCallback((time: number) => {
    const el = audioRef.current
    if (!el) return
    el.currentTime = time
    setCurrent(time)
    if (time < FREE_PREVIEW_SECONDS) {
      setPreviewPrompt(false)
      setPromptHandled(false)
    }
  }, [])

  const pauseFromPrompt = useCallback(() => {
    audioRef.current?.pause()
    setPreviewPrompt(false)
    setPromptHandled(true)
  }, [])

  const dismissPreviewPrompt = useCallback(() => {
    setPreviewPrompt(false)
    setPromptHandled(true)
  }, [])

  const putOnAir = useCallback(
    async (id: string) => {
      setBusy(true)
      resumeOnNextTrack.current = playing
      try {
        await playTrack(id)
        await mutate()
      } finally {
        setBusy(false)
      }
    },
    [mutate, playing],
  )

  const markPlayed = useCallback(async () => {
    setBusy(true)
    resumeOnNextTrack.current = playing
    try {
      await finishAndPlayNext()
      await mutate()
    } finally {
      setBusy(false)
    }
  }, [mutate, playing])

  function onTimeUpdate() {
    const el = audioRef.current
    if (!el) return
    setCurrent(el.currentTime)
    if (isFree && !promptHandled && !previewPrompt && el.currentTime >= FREE_PREVIEW_SECONDS) {
      setPreviewPrompt(true)
    }
  }

  const value: DjAudioContextValue = {
    track,
    tracks,
    isLoading,
    mutate,
    hasAudio,
    playing,
    current,
    duration,
    limit,
    previewPrompt,
    volume,
    busy,
    togglePlay,
    seek,
    pauseFromPrompt,
    dismissPreviewPrompt,
    setVolume,
    muted,
    toggleMute,
    fullPlayerVisible: fullPlayerCount > 0,
    registerFullPlayer,
    putOnAir,
    markPlayed,
  }

  return (
    <DjAudioContext.Provider value={value}>
      {children}
      <PreviewPausePrompt
        open={previewPrompt && playing}
        title={track?.title ?? ""}
        onPause={pauseFromPrompt}
        onKeepPlaying={dismissPreviewPrompt}
      />
      {hasAudio && track ? (
        <audio
          ref={audioRef}
          key={track.trackId}
          src={`/api/host/audio?pathname=${encodeURIComponent(track.audioPathname as string)}`}
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={(e) => {
            e.currentTarget.volume = volume
            e.currentTarget.muted = muted
            setDuration(e.currentTarget.duration)
            if (resumeOnNextTrack.current) {
              resumeOnNextTrack.current = false
              void e.currentTarget.play().catch(() => {})
            }
          }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          preload="metadata"
          className="hidden"
        />
      ) : null}
    </DjAudioContext.Provider>
  )
}
