"use client"

import { useCallback, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { UploadCloud, FileAudio, Loader2, Gauge, RotateCcw, X, Hand } from "lucide-react"

type Status = "idle" | "decoding" | "analyzing" | "done" | "error"

interface Result {
  bpm: number
  confidence: number
}

/**
 * Detect tempo from a decoded AudioBuffer using an onset-strength envelope
 * plus autocorrelation, with octave correction into a musical range.
 */
async function detectBpm(buffer: AudioBuffer): Promise<Result> {
  const sampleRate = buffer.sampleRate

  // 1. Low-pass filter (offline) to emphasize kick / rhythmic energy.
  const offline = new OfflineAudioContext(1, buffer.length, sampleRate)
  const source = offline.createBufferSource()
  source.buffer = buffer

  const lowpass = offline.createBiquadFilter()
  lowpass.type = "lowpass"
  lowpass.frequency.value = 160
  lowpass.Q.value = 1

  const highpass = offline.createBiquadFilter()
  highpass.type = "highpass"
  highpass.frequency.value = 20

  source.connect(highpass)
  highpass.connect(lowpass)
  lowpass.connect(offline.destination)
  source.start(0)

  const rendered = await offline.startRendering()
  const data = rendered.getChannelData(0)

  // 2. Build an onset-strength envelope (positive energy difference per hop).
  const hop = 256
  const frameCount = Math.floor(data.length / hop)
  const envelope = new Float32Array(frameCount)
  let prev = 0
  for (let i = 0; i < frameCount; i++) {
    let sum = 0
    const start = i * hop
    for (let j = 0; j < hop; j++) {
      const s = data[start + j]
      sum += s * s
    }
    const rms = Math.sqrt(sum / hop)
    const diff = rms - prev
    envelope[i] = diff > 0 ? diff : 0
    prev = rms
  }

  // Normalize envelope.
  let maxEnv = 0
  for (let i = 0; i < frameCount; i++) if (envelope[i] > maxEnv) maxEnv = envelope[i]
  if (maxEnv > 0) for (let i = 0; i < frameCount; i++) envelope[i] /= maxEnv

  // 3. Autocorrelation across the plausible tempo range.
  const envRate = sampleRate / hop // envelope samples per second
  const minBpm = 60
  const maxBpm = 200
  const minLag = Math.floor((60 / maxBpm) * envRate)
  const maxLag = Math.ceil((60 / minBpm) * envRate)

  let bestLag = minLag
  let bestScore = -1
  const scores: number[] = []
  for (let lag = minLag; lag <= maxLag; lag++) {
    let score = 0
    for (let i = 0; i + lag < frameCount; i++) {
      score += envelope[i] * envelope[i + lag]
    }
    scores.push(score)
    if (score > bestScore) {
      bestScore = score
      bestLag = lag
    }
  }

  // Parabolic interpolation around the peak for sub-lag precision.
  const idx = bestLag - minLag
  let refinedLag = bestLag
  if (idx > 0 && idx < scores.length - 1) {
    const a = scores[idx - 1]
    const b = scores[idx]
    const c = scores[idx + 1]
    const denom = a - 2 * b + c
    if (denom !== 0) {
      const offset = (0.5 * (a - c)) / denom
      refinedLag = bestLag + offset
    }
  }

  let bpm = (60 * envRate) / refinedLag

  // 4. Octave-correct into a common musical range (70–180 keeps DnB/house intact).
  while (bpm < 70) bpm *= 2
  while (bpm > 180) bpm /= 2

  // Real tempos are effectively whole numbers, and detection error is ~±0.5,
  // so round to the nearest integer rather than showing false decimal precision.
  bpm = Math.round(bpm)

  // Confidence: peak sharpness relative to mean score.
  const meanScore = scores.reduce((s, v) => s + v, 0) / scores.length
  const confidence = meanScore > 0 ? Math.min(1, (bestScore / meanScore - 1) / 4) : 0

  return { bpm, confidence }
}

export function BpmDetector() {
  const [status, setStatus] = useState<Status>("idle")
  const [fileName, setFileName] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Tap tempo state
  const tapTimes = useRef<number[]>([])
  const [tapBpm, setTapBpm] = useState<number | null>(null)

  const analyze = useCallback(async (file: File) => {
    setError(null)
    setResult(null)
    setFileName(file.name)
    setStatus("decoding")
    try {
      const arrayBuffer = await file.arrayBuffer()
      // Decode with an OfflineAudioContext so it works without an audio output
      // device (e.g. headless browsers) — an online AudioContext throws NotFoundError there.
      const decodeCtx = new OfflineAudioContext(1, 1, 44100)
      const audioBuffer = await decodeCtx.decodeAudioData(arrayBuffer)
      setStatus("analyzing")
      // Yield to paint the analyzing state before the heavy work.
      await new Promise((r) => setTimeout(r, 30))
      const res = await detectBpm(audioBuffer)
      setResult(res)
      setStatus("done")
    } catch (err) {
      console.error("[v0] BPM detect error:", err)
      setError("Couldn't read that file. Try a WAV, MP3, M4A, OGG, or FLAC.")
      setStatus("error")
    }
  }, [])

  const onFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0]
      if (!file) return
      if (!file.type.startsWith("audio/") && !/\.(wav|mp3|m4a|aac|ogg|flac)$/i.test(file.name)) {
        setError("That doesn't look like an audio file.")
        setStatus("error")
        return
      }
      void analyze(file)
    },
    [analyze],
  )

  function reset() {
    setStatus("idle")
    setFileName(null)
    setResult(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  function adjust(factor: number) {
    setResult((r) => (r ? { ...r, bpm: Math.round(r.bpm * factor * 10) / 10 } : r))
  }

  function tap() {
    const now = performance.now()
    const taps = tapTimes.current
    if (taps.length && now - taps[taps.length - 1] > 2000) taps.length = 0
    taps.push(now)
    if (taps.length >= 2) {
      const intervals: number[] = []
      for (let i = 1; i < taps.length; i++) intervals.push(taps[i] - taps[i - 1])
      const avg = intervals.reduce((s, v) => s + v, 0) / intervals.length
      setTapBpm(Math.round((60000 / avg) * 10) / 10)
    }
    if (taps.length > 8) taps.splice(0, taps.length - 8)
  }

  const busy = status === "decoding" || status === "analyzing"

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          onFiles(e.dataTransfer.files)
        }}
        className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
          dragging ? "border-primary bg-primary/10" : "border-border bg-card"
        }`}
      >
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          {busy ? <Loader2 className="size-6 animate-spin" /> : <UploadCloud className="size-6" />}
        </span>
        <div>
          <p className="text-base font-semibold text-foreground">
            {busy ? (status === "decoding" ? "Decoding audio..." : "Analyzing tempo...") : "Drop an audio file"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">WAV, MP3, M4A, OGG, or FLAC — processed right in your browser.</p>
        </div>
        <Button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="mt-1 rounded-full text-xs font-bold uppercase tracking-wider"
        >
          Choose file
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="audio/*,.wav,.mp3,.m4a,.aac,.ogg,.flac"
          className="sr-only"
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>

      {fileName ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm">
          <FileAudio className="size-4 shrink-0 text-primary" aria-hidden="true" />
          <span className="truncate text-foreground">{fileName}</span>
          <button
            type="button"
            onClick={reset}
            className="ml-auto text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Clear file"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {/* Result */}
      {result ? (
        <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-primary/30 bg-card p-8 text-center">
          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <Gauge className="size-4 text-primary" /> Detected tempo
          </span>
          <p className="neon-shine text-6xl font-black tabular-nums text-primary">
            {result.bpm}
            <span className="ml-2 text-2xl font-bold text-muted-foreground">BPM</span>
          </p>
          <div className="flex w-full max-w-xs flex-col gap-1.5">
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.round(result.confidence * 100)}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {result.confidence >= 0.6 ? "High" : result.confidence >= 0.3 ? "Moderate" : "Low"} confidence
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={() => adjust(0.5)} className="rounded-full">
              ÷2 (half-time)
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => adjust(2)} className="rounded-full">
              ×2 (double-time)
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={reset} className="rounded-full">
              <RotateCcw className="size-4" /> New file
            </Button>
          </div>
          <p className="max-w-sm text-pretty text-xs text-muted-foreground">
            Tempo detection estimates the dominant beat. If it landed an octave off, use ÷2 or ×2, or confirm the exact
            value with tap tempo below.
          </p>
        </div>
      ) : null}

      {/* Tap tempo fallback */}
      <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tap tempo</span>
        <Button
          type="button"
          onClick={tap}
          className="size-24 rounded-full text-sm font-bold uppercase tracking-wider"
        >
          <Hand className="size-5" /> Tap
        </Button>
        <p className="text-2xl font-black tabular-nums text-foreground">
          {tapBpm ? `${tapBpm} BPM` : "--"}
        </p>
        <button
          type="button"
          onClick={() => {
            tapTimes.current = []
            setTapBpm(null)
          }}
          className="text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          Reset taps
        </button>
      </div>
    </div>
  )
}
