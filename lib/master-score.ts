import { LUFS_RANGE, TRUE_PEAK_LIMIT, TRUE_PEAK_SAFE, type LoudnessResult } from "@/lib/loudness"

export type CheckStatus = "pass" | "warn" | "fail" | "manual"

export type Category = {
  id: "loudness" | "peak" | "clipping" | "dynamics" | "tone" | "stereo"
  label: string
  points: number
  max: number
}

export type ChecklistGrade = {
  id: string
  label: string
  status: CheckStatus
  detail: string
}

export type MasterReport = {
  score: number
  grade: string
  summary: string
  categories: Category[]
  checklist: ChecklistGrade[]
}

const clamp = (n: number, max: number) => Math.max(0, Math.min(max, n))
const f1 = (n: number) => (Number.isFinite(n) ? n.toFixed(1) : "-∞")

const statusFor = (points: number, max: number): CheckStatus =>
  points >= max * 0.85 ? "pass" : points >= max * 0.5 ? "warn" : "fail"

function loudnessPoints(lufs: number) {
  if (!Number.isFinite(lufs)) return 0
  if (lufs > LUFS_RANGE.loud) return clamp(20 - 4 * (lufs - LUFS_RANGE.loud), 20)
  if (lufs < LUFS_RANGE.quiet) return clamp(20 - 2.5 * (LUFS_RANGE.quiet - lufs), 20)
  return 20
}

function peakPoints(tp: number, lufs: number) {
  if (tp > 0) return clamp(8 - 8 * tp, 20)
  if (tp > TRUE_PEAK_LIMIT) return clamp(20 - 12 * (tp - TRUE_PEAK_LIMIT), 20)
  if (tp > TRUE_PEAK_SAFE && lufs > -11) return 17
  return 20
}

function clippingPoints(r: LoudnessResult) {
  const perMinute = r.clippedSamples / Math.max(r.durationSeconds / 60, 1 / 60)
  let pts = perMinute === 0 ? 15 : perMinute <= 5 ? 11 : perMinute <= 50 ? 6 : 0
  if (r.dcOffset > 0.005) pts -= 3
  return clamp(pts, 15)
}

function plrPoints(plr: number) {
  if (!Number.isFinite(plr)) return 0
  if (plr >= 8 && plr <= 16) return 14
  if (plr < 8) return clamp((14 * (plr - 4)) / 4, 14)
  return clamp(14 - (plr - 16) * 2, 14)
}

function lraPoints(lra: number) {
  if (lra >= 3 && lra <= 12) return 6
  if (lra < 3) return clamp((6 * lra) / 3, 6)
  return clamp(6 - (lra - 12), 6)
}

function harshPoints(harsh: number) {
  if (harsh <= -14) return 8
  if (harsh <= -10) return clamp(8 - (harsh + 14) * 1.5, 8)
  return clamp(2 - (harsh + 10), 8)
}

function lowPoints(low: number) {
  if (low <= -1.5 && low >= -12) return 7
  if (low > -1.5) return clamp(7 - (low + 1.5) * 4, 7)
  return clamp(7 - (-12 - low), 7)
}

function stereoPoints(r: LoudnessResult) {
  if (r.stereoCorrelation === null) return 10
  if (r.stereoCorrelation >= 0.3) return 10
  if (r.stereoCorrelation >= 0) return 6
  return 0
}

function gradeFor(score: number) {
  if (score >= 90) return { grade: "Release ready", summary: "This master is in great shape across every measurement." }
  if (score >= 75) return { grade: "Strong master", summary: "Solid overall, with a couple of things worth a second look." }
  if (score >= 60) return { grade: "Needs touch-ups", summary: "A few measurements are outside the usual range. Fix the flagged items below." }
  return { grade: "Needs work", summary: "Several measurements point to problems. Revisit the master before releasing." }
}

export function scoreMaster(r: LoudnessResult): MasterReport {
  const loud = loudnessPoints(r.integratedLufs)
  const peak = peakPoints(r.truePeakDbtp, r.integratedLufs)
  const clip = clippingPoints(r)
  const plr = plrPoints(r.peakToLoudness)
  const lra = lraPoints(r.loudnessRange)
  const harsh = harshPoints(r.harshShareDb)
  const low = lowPoints(r.lowShareDb)
  const stereo = stereoPoints(r)

  const categories: Category[] = [
    { id: "loudness", label: "Loudness", points: loud, max: 20 },
    { id: "peak", label: "True peak", points: peak, max: 20 },
    { id: "clipping", label: "Clipping", points: clip, max: 15 },
    { id: "dynamics", label: "Dynamics & punch", points: plr + lra, max: 20 },
    { id: "tone", label: "Tonal balance", points: harsh + low, max: 15 },
    { id: "stereo", label: "Stereo & mono", points: stereo, max: 10 },
  ]
  const score = Math.round(categories.reduce((s, c) => s + c.points, 0))

  const lufsDetail = !Number.isFinite(r.integratedLufs)
    ? "No signal detected. The file appears to be silent."
    : r.integratedLufs > LUFS_RANGE.loud
      ? `${f1(r.integratedLufs)} LUFS is louder than the -14 to -9 window. Very loud masters tend to lose punch.`
      : r.integratedLufs < LUFS_RANGE.quiet
        ? `${f1(r.integratedLufs)} LUFS is on the quiet side. Fine for dynamic styles; streaming won't penalize it.`
        : `${f1(r.integratedLufs)} LUFS sits inside the -14 to -9 window.`

  const peakDetail =
    r.truePeakDbtp > TRUE_PEAK_LIMIT
      ? `${f1(r.truePeakDbtp)} dBTP is above -1.0. Lower the limiter ceiling to avoid encoding distortion.`
      : r.truePeakDbtp > TRUE_PEAK_SAFE && r.integratedLufs > -11
        ? `${f1(r.truePeakDbtp)} dBTP passes, but a -2.0 ceiling is safer for a master this loud.`
        : `${f1(r.truePeakDbtp)} dBTP leaves safe headroom.`

  const clipParts = [
    r.clippedSamples === 0
      ? "No full-scale runs found."
      : `${r.clippedSamples.toLocaleString()} consecutive full-scale samples found. Check for clipping.`,
  ]
  if (r.dcOffset > 0.005) clipParts.push("There's a DC offset; add a high-pass or DC filter.")

  const toneIssues: string[] = []
  if (r.harshShareDb > -10) toneIssues.push("the 2-6 kHz range is very forward, which can sound harsh")
  else if (r.harshShareDb > -14) toneIssues.push("upper mids are a little forward")
  if (r.lowShareDb > -1.5) toneIssues.push("the low end dominates the mix")
  if (r.lowShareDb < -12) toneIssues.push("the low end is thin")
  const dynIssues: string[] = []
  if (r.peakToLoudness < 8) dynIssues.push(`peak-to-loudness is ${f1(r.peakToLoudness)} dB, so transients are squashed and it may pump`)
  if (r.peakToLoudness > 16) dynIssues.push(`peak-to-loudness is ${f1(r.peakToLoudness)} dB, so peaks are untamed`)
  if (r.loudnessRange < 3) dynIssues.push(`loudness range is only ${f1(r.loudnessRange)} LU, so sections all sound the same level`)
  const listenIssues = [...toneIssues, ...dynIssues]
  const listenPoints = plr + lra + harsh + low

  const benchmarksHit = [
    loud >= 17,
    peak >= 17,
    r.peakToLoudness >= 8 && r.peakToLoudness <= 16,
    r.harshShareDb <= -14 && r.lowShareDb <= -1.5 && r.lowShareDb >= -12,
    r.stereoCorrelation === null || r.stereoCorrelation >= 0.3,
  ].filter(Boolean).length

  const fmt = r.format
  const exportStatus: CheckStatus = !fmt.lossless
    ? "fail"
    : fmt.bitDepth !== null && fmt.bitDepth < 24
      ? "warn"
      : "pass"
  const exportDetail = !fmt.lossless
    ? `This is a ${fmt.container.toUpperCase()} file, which is lossy. Export a 24-bit WAV for release and analyze that.`
    : fmt.bitDepth !== null && fmt.bitDepth < 24
      ? `${fmt.bitDepth}-bit ${fmt.container.toUpperCase()}. Distributors accept it, but 24-bit keeps more detail.`
      : `${fmt.bitDepth ? `${fmt.bitDepth}-bit ` : ""}${fmt.container.toUpperCase()} at ${(r.sampleRate / 1000).toFixed(1)} kHz. Measurements above are from this export.`

  const checklist: ChecklistGrade[] = [
    { id: "lufs", label: "Integrated LUFS across the full song", status: statusFor(loud, 20), detail: lufsDetail },
    { id: "peak", label: "Maximum true peak", status: statusFor(peak, 20), detail: peakDetail },
    { id: "clip", label: "Clipping and distortion", status: statusFor(clip, 15), detail: clipParts.join(" ") },
    {
      id: "listen",
      label: "Harshness, pumping, and punch",
      status: statusFor(listenPoints, 35),
      detail: listenIssues.length
        ? `Heard in the data: ${listenIssues.join("; ")}.`
        : `Balanced tone, ${f1(r.peakToLoudness)} dB peak-to-loudness and ${f1(r.loudnessRange)} LU loudness range. Punch looks intact.`,
    },
    {
      id: "reference",
      label: "Compared with modern release benchmarks",
      status: benchmarksHit >= 5 ? "pass" : benchmarksHit >= 3 ? "warn" : "fail",
      detail: `Matches ${benchmarksHit} of 5 benchmarks typical of modern releases (loudness, peak, dynamics, tone, stereo).`,
    },
    { id: "export", label: "High-quality export", status: exportStatus, detail: exportDetail },
    {
      id: "final",
      label: "Listen to the final export",
      status: "manual",
      detail: "Numbers can't hear your song. Do one last full listen on headphones and speakers.",
    },
  ]

  return { score, ...gradeFor(score), categories, checklist }
}
