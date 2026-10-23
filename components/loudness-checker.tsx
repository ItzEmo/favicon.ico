"use client"

import { useMemo, useRef, useState } from "react"
import { AlertTriangle, Check, CheckCircle2, Ear, FileAudio, Loader2, Upload, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { analyzeFile, LUFS_RANGE, TRUE_PEAK_LIMIT, type LoudnessResult } from "@/lib/loudness"
import { scoreMaster, type CheckStatus, type MasterReport } from "@/lib/master-score"

const METER_MIN = -24
const METER_MAX = -4
const MAX_BYTES = 200 * 1024 * 1024

type Status =
  | { kind: "idle" }
  | { kind: "analyzing"; name: string }
  | { kind: "done"; name: string; result: LoudnessResult }
  | { kind: "error"; message: string }

const fmt = (n: number | null, digits = 1) => (n !== null && Number.isFinite(n) ? n.toFixed(digits) : "-∞")

function meterPosition(lufs: number) {
  const clamped = Math.min(METER_MAX, Math.max(METER_MIN, lufs))
  return ((clamped - METER_MIN) / (METER_MAX - METER_MIN)) * 100
}

const STATUS_STYLES: Record<CheckStatus, { text: string; chip: string; label: string }> = {
  pass: { text: "text-primary", chip: "bg-primary/15 text-primary", label: "Pass" },
  warn: { text: "text-accent", chip: "bg-accent/15 text-accent", label: "Review" },
  fail: { text: "text-destructive", chip: "bg-destructive/15 text-destructive", label: "Fix" },
  manual: { text: "text-muted-foreground", chip: "bg-secondary text-muted-foreground", label: "You" },
}

const scoreTone = (score: number): CheckStatus => (score >= 75 ? "pass" : score >= 60 ? "warn" : "fail")

export function LoudnessChecker() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<Status>({ kind: "idle" })
  const [dragging, setDragging] = useState(false)
  const [listened, setListened] = useState(false)

  async function handleFile(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith("audio/") && !/\.(wav|aiff?|flac|mp3|m4a|ogg)$/i.test(file.name)) {
      setStatus({ kind: "error", message: "That doesn't look like an audio file. Try a WAV, MP3, or FLAC." })
      return
    }
    if (file.size > MAX_BYTES) {
      setStatus({ kind: "error", message: "That file is over 200 MB. Try a shorter export." })
      return
    }
    setStatus({ kind: "analyzing", name: file.name })
    setListened(false)
    try {
      const result = await analyzeFile(file)
      setStatus({ kind: "done", name: file.name, result })
    } catch {
      setStatus({ kind: "error", message: "Your browser couldn't decode that file. Export a WAV and try again." })
    }
  }

  const result = status.kind === "done" ? status.result : null
  const report = useMemo(() => (result ? scoreMaster(result) : null), [result])

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="analyze-heading" className="flex flex-col gap-4">
        <h2 id="analyze-heading" className="text-lg font-bold text-foreground">
          Analyze your master
        </h2>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            handleFile(e.dataTransfer.files[0])
          }}
          disabled={status.kind === "analyzing"}
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed bg-card px-6 py-10 text-center transition-colors",
            dragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
            status.kind === "analyzing" && "cursor-wait opacity-80",
          )}
        >
          {status.kind === "analyzing" ? (
            <>
              <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
              <span className="text-sm font-semibold text-foreground">
                Analyzing <span className="text-muted-foreground">{status.name}</span>
              </span>
              <span className="text-xs text-muted-foreground">
                Measuring loudness, peaks, dynamics, tone and stereo. Long files can take a few seconds.
              </span>
            </>
          ) : (
            <>
              <span className="flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Upload className="size-5" aria-hidden="true" />
              </span>
              <span className="text-base font-semibold text-foreground">
                {result ? "Analyze another file" : "Drop your exported WAV here"}
              </span>
              <span className="text-sm text-muted-foreground text-pretty">
                or click to browse. WAV, FLAC, MP3 and AIFF. Nothing is uploaded; analysis runs in your browser.
              </span>
            </>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="audio/*,.wav,.aif,.aiff,.flac,.mp3,.m4a"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            handleFile(e.target.files?.[0])
            e.target.value = ""
          }}
        />

        {status.kind === "error" && (
          <p role="alert" className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
            {status.message}
          </p>
        )}

        {status.kind === "done" && result && report && (
          <div className="flex flex-col gap-5" aria-live="polite">
            <ScoreCard report={report} />
            <Measurements name={status.name} result={result} />
          </div>
        )}
      </section>

      <section aria-labelledby="checklist-heading" className="rounded-2xl border border-border bg-card">
        <div className="border-b border-border p-5">
          <h2 id="checklist-heading" className="text-lg font-bold text-foreground">
            Checklist
          </h2>
          <p className="text-sm text-muted-foreground text-pretty">
            {report
              ? "Graded automatically from your file. Only the final listen is up to you."
              : "Upload your master and every item is graded for you."}
          </p>
        </div>
        <ul className="flex flex-col">
          {(report?.checklist ?? PLACEHOLDER_CHECKLIST).map((item) =>
            item.status === "manual" ? (
              <li key={item.id} className="border-b border-border/60 last:border-b-0">
                <label className="flex cursor-pointer items-start gap-3 px-5 py-4 transition-colors hover:bg-secondary/40">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={listened}
                    onChange={(e) => setListened(e.target.checked)}
                  />
                  <span
                    aria-hidden="true"
                    className={cn(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
                      listened ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/50",
                    )}
                  >
                    {listened && <Check className="size-3.5" strokeWidth={3} />}
                  </span>
                  <ChecklistText label={item.label} detail={item.detail} status={listened ? "pass" : "manual"} />
                </label>
              </li>
            ) : (
              <li key={item.id} className="flex items-start gap-3 border-b border-border/60 px-5 py-4 last:border-b-0">
                <StatusIcon status={report ? item.status : "manual"} pending={!report} />
                <ChecklistText label={item.label} detail={item.detail} status={report ? item.status : "manual"} />
              </li>
            ),
          )}
        </ul>
      </section>
    </div>
  )
}

const PLACEHOLDER_CHECKLIST = [
  { id: "lufs", label: "Integrated LUFS across the full song" },
  { id: "peak", label: "Maximum true peak" },
  { id: "clip", label: "Clipping and distortion" },
  { id: "listen", label: "Harshness, pumping, and punch" },
  { id: "reference", label: "Compared with modern release benchmarks" },
  { id: "export", label: "High-quality export" },
  { id: "final", label: "Listen to the final export" },
].map((item) => ({
  ...item,
  status: (item.id === "final" ? "manual" : "pass") as CheckStatus,
  detail: item.id === "final" ? "Do one last full listen on headphones and speakers." : "Waiting for a file.",
}))

function StatusIcon({ status, pending }: { status: CheckStatus; pending?: boolean }) {
  const cls = "mt-0.5 size-5 shrink-0"
  if (pending) return <span aria-hidden="true" className="mt-0.5 size-5 shrink-0 rounded-full border-2 border-dashed border-muted-foreground/40" />
  if (status === "pass") return <CheckCircle2 className={cn(cls, "text-primary")} aria-hidden="true" />
  if (status === "warn") return <AlertTriangle className={cn(cls, "text-accent")} aria-hidden="true" />
  if (status === "fail") return <XCircle className={cn(cls, "text-destructive")} aria-hidden="true" />
  return <Ear className={cn(cls, "text-muted-foreground")} aria-hidden="true" />
}

function ChecklistText({ label, detail, status }: { label: string; detail: string; status: CheckStatus }) {
  const s = STATUS_STYLES[status]
  return (
    <span className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider", s.chip)}>
          {s.label}
        </span>
      </span>
      <span className="text-sm leading-relaxed text-muted-foreground text-pretty">{detail}</span>
    </span>
  )
}

function ScoreCard({ report }: { report: MasterReport }) {
  const tone = STATUS_STYLES[scoreTone(report.score)]
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const arc = circumference * 0.75

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:p-6">
      <div
        className="relative mx-auto flex size-44 shrink-0 items-center justify-center sm:mx-0"
        role="meter"
        aria-label="Mastering score"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={report.score}
        aria-valuetext={`${report.score} out of 100, ${report.grade}`}
      >
        <svg viewBox="0 0 120 120" className="absolute inset-0 size-full rotate-[135deg]" aria-hidden="true">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            className="stroke-secondary"
            strokeDasharray={`${arc} ${circumference}`}
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            className={cn("transition-[stroke-dasharray] duration-1000", tone.text)}
            stroke="currentColor"
            strokeDasharray={`${(arc * report.score) / 100} ${circumference}`}
          />
        </svg>
        <div className="flex flex-col items-center">
          <span className="font-mono text-5xl font-black tabular-nums text-foreground">{report.score}</span>
          <span className="text-xs font-semibold text-muted-foreground">out of 100</span>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Master quality</p>
          <p className={cn("text-2xl font-black text-balance", tone.text)}>{report.grade}</p>
          <p className="text-sm leading-relaxed text-muted-foreground text-pretty">{report.summary}</p>
        </div>
        <ul className="grid gap-2.5 sm:grid-cols-2">
          {report.categories.map((c) => {
            const pct = (c.points / c.max) * 100
            const s = STATUS_STYLES[pct >= 85 ? "pass" : pct >= 50 ? "warn" : "fail"]
            return (
              <li key={c.id} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="font-semibold text-foreground">{c.label}</span>
                  <span className="font-mono tabular-nums text-muted-foreground">
                    {Math.round(c.points)}/{c.max}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
                  <div
                    className={cn("h-full rounded-full bg-current transition-[width] duration-700", s.text)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

function Measurements({ name, result }: { name: string; result: LoudnessResult }) {
  const marker = meterPosition(result.integratedLufs)
  const bandStart = meterPosition(LUFS_RANGE.quiet)
  const bandEnd = meterPosition(LUFS_RANGE.loud)
  const minutes = Math.floor(result.durationSeconds / 60)
  const seconds = Math.round(result.durationSeconds % 60).toString().padStart(2, "0")
  const ticks = [-24, -20, -16, -14, -12, -9, -6, -4]

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <FileAudio className="size-4 text-primary" aria-hidden="true" />
        <span className="font-semibold text-foreground">{name}</span>
        <span>
          {minutes}:{seconds} · {(result.sampleRate / 1000).toFixed(1)} kHz ·{" "}
          {result.format.bitDepth ? `${result.format.bitDepth}-bit · ` : ""}
          {result.channels === 1 ? "mono" : "stereo"}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Integrated loudness</p>
            <p className="font-mono text-4xl font-black tabular-nums text-foreground">
              {fmt(result.integratedLufs)}
              <span className="ml-2 text-base font-semibold text-muted-foreground">LUFS</span>
            </p>
          </div>
          <p className="text-right text-xs text-muted-foreground">
            Target
            <br />
            <span className="font-mono text-sm font-bold text-foreground">-14 to -9</span>
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <div
            className="relative h-4 w-full rounded-full bg-secondary"
            role="meter"
            aria-label="Integrated loudness on a -24 to -4 LUFS scale"
            aria-valuemin={METER_MIN}
            aria-valuemax={METER_MAX}
            aria-valuenow={Number.isFinite(result.integratedLufs) ? Number(result.integratedLufs.toFixed(1)) : METER_MIN}
          >
            <div
              className="absolute inset-y-0 rounded-full bg-primary/35"
              style={{ left: `${bandStart}%`, width: `${bandEnd - bandStart}%` }}
            />
            <div
              className="absolute -top-1.5 h-7 w-1.5 -translate-x-1/2 rounded-full bg-foreground shadow-[0_0_0_3px_var(--background)] transition-[left] duration-700"
              style={{ left: `${marker}%` }}
            />
          </div>
          <div className="relative h-4 font-mono text-[11px] text-muted-foreground" aria-hidden="true">
            {ticks.map((t) => (
              <span key={t} className="absolute -translate-x-1/2" style={{ left: `${meterPosition(t)}%` }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="True peak" value={`${fmt(result.truePeakDbtp)} dBTP`} warn={result.truePeakDbtp > TRUE_PEAK_LIMIT} />
        <Stat label="Peak-to-loudness" value={`${fmt(result.peakToLoudness)} dB`} warn={result.peakToLoudness < 6} />
        <Stat label="Loudness range" value={`${fmt(result.loudnessRange)} LU`} />
        <Stat label="Max short-term" value={`${fmt(result.maxShortTermLufs)} LUFS`} />
        <Stat label="Clipped samples" value={result.clippedSamples.toLocaleString()} warn={result.clippedSamples > 0} />
        <Stat
          label="Stereo correlation"
          value={result.stereoCorrelation === null ? "Mono" : fmt(result.stereoCorrelation, 2)}
          warn={result.stereoCorrelation !== null && result.stereoCorrelation < 0}
        />
        <Stat label="Upper-mid share" value={`${fmt(result.harshShareDb)} dB`} warn={result.harshShareDb > -10} />
        <Stat label="Low-end share" value={`${fmt(result.lowShareDb)} dB`} />
      </dl>
    </div>
  )
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-secondary/50 p-3">
      <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
      <dd className={cn("font-mono text-base font-bold tabular-nums", warn ? "text-destructive" : "text-foreground")}>
        {value}
      </dd>
    </div>
  )
}
