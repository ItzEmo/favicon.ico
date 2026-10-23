export type LoudnessResult = {
  integratedLufs: number
  maxShortTermLufs: number
  truePeakDbtp: number
  samplePeakDbfs: number
  clippedSamples: number
  durationSeconds: number
  sampleRate: number
  channels: number
  peakToLoudness: number
  loudnessRange: number
  stereoCorrelation: number | null
  sideToMidDb: number | null
  lowShareDb: number
  harshShareDb: number
  dcOffset: number
  format: FileFormat
}

export type FileFormat = {
  container: string
  lossless: boolean
  bitDepth: number | null
}

export const LUFS_RANGE = { loud: -9, quiet: -14 } as const
export const TRUE_PEAK_LIMIT = -1
export const TRUE_PEAK_SAFE = -2

type Biquad = { b0: number; b1: number; b2: number; a1: number; a2: number }

// ITU-R BS.1770-4 K-weighting, derived for any sample rate (libebur128 formulation).
function kWeightingFilters(sampleRate: number): [Biquad, Biquad] {
  const shelfGain = 3.999843853973347
  const shelfFreq = 1681.974450955533
  const shelfQ = 0.7071752369554196
  let k = Math.tan((Math.PI * shelfFreq) / sampleRate)
  const vh = Math.pow(10, shelfGain / 20)
  const vb = Math.pow(vh, 0.4996667741545416)
  let a0 = 1 + k / shelfQ + k * k
  const shelf: Biquad = {
    b0: (vh + (vb * k) / shelfQ + k * k) / a0,
    b1: (2 * (k * k - vh)) / a0,
    b2: (vh - (vb * k) / shelfQ + k * k) / a0,
    a1: (2 * (k * k - 1)) / a0,
    a2: (1 - k / shelfQ + k * k) / a0,
  }

  const hpFreq = 38.13547087602444
  const hpQ = 0.5003270373238773
  k = Math.tan((Math.PI * hpFreq) / sampleRate)
  a0 = 1 + k / hpQ + k * k
  const highPass: Biquad = {
    b0: 1,
    b1: -2,
    b2: 1,
    a1: (2 * (k * k - 1)) / a0,
    a2: (1 - k / hpQ + k * k) / a0,
  }
  return [shelf, highPass]
}

// RBJ cookbook filters, used for the tonal-balance estimate.
function rbj(kind: "lowpass" | "bandpass", freq: number, q: number, sampleRate: number): Biquad {
  const w0 = (2 * Math.PI * freq) / sampleRate
  const cos = Math.cos(w0)
  const alpha = Math.sin(w0) / (2 * q)
  const a0 = 1 + alpha
  const [b0, b1, b2] =
    kind === "lowpass" ? [(1 - cos) / 2, 1 - cos, (1 - cos) / 2] : [alpha, 0, -alpha]
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: (-2 * cos) / a0, a2: (1 - alpha) / a0 }
}

const sumSquares = (data: Float32Array) => {
  let s = 0
  for (let i = 0; i < data.length; i++) s += data[i] * data[i]
  return s
}

function applyBiquad(input: Float32Array, f: Biquad): Float32Array {
  const out = new Float32Array(input.length)
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0
  for (let i = 0; i < input.length; i++) {
    const x = input[i]
    const y = f.b0 * x + f.b1 * x1 + f.b2 * x2 - f.a1 * y1 - f.a2 * y2
    out[i] = y
    x2 = x1; x1 = x
    y2 = y1; y1 = y
  }
  return out
}

const toLufs = (meanSquare: number) => -0.691 + 10 * Math.log10(meanSquare)
const toDb = (amplitude: number) => (amplitude > 0 ? 20 * Math.log10(amplitude) : -Infinity)

// 4x oversampling (BS.1770 Annex 2): Hann-windowed sinc interpolation at offsets 1/4, 2/4, 3/4
// using samples i-5 .. i+6 around each gap.
const OVERSAMPLE = 4
const TAPS_PER_PHASE = 12
const FIRST_TAP = -5
const PHASES: Float32Array[] = Array.from({ length: OVERSAMPLE }, (_, p) => {
  const frac = p / OVERSAMPLE
  const taps = new Float32Array(TAPS_PER_PHASE)
  for (let t = 0; t < TAPS_PER_PHASE; t++) {
    const d = FIRST_TAP + t - frac
    const sinc = d === 0 ? 1 : Math.sin(Math.PI * d) / (Math.PI * d)
    taps[t] = sinc * (0.5 + 0.5 * Math.cos((Math.PI * d) / 6.5))
  }
  const sum = taps.reduce((a, b) => a + b, 0)
  for (let t = 0; t < TAPS_PER_PHASE; t++) taps[t] /= sum
  return taps
})

function channelPeaks(data: Float32Array) {
  let samplePeak = 0
  let clipped = 0
  for (let i = 0; i < data.length; i++) {
    const v = Math.abs(data[i])
    if (v > samplePeak) samplePeak = v
    if (v >= 0.9999 && i > 0 && Math.abs(data[i - 1]) >= 0.9999) clipped++
  }

  // Inter-sample overs only occur near loud samples, so skip quiet regions.
  let truePeak = samplePeak
  const threshold = samplePeak * 0.25
  const lastTap = FIRST_TAP + TAPS_PER_PHASE - 1
  for (let i = -FIRST_TAP; i < data.length - lastTap; i++) {
    if (Math.abs(data[i]) < threshold && Math.abs(data[i + 1]) < threshold) continue
    for (let p = 1; p < OVERSAMPLE; p++) {
      const taps = PHASES[p]
      let acc = 0
      for (let t = 0; t < TAPS_PER_PHASE; t++) acc += taps[t] * data[i + FIRST_TAP + t]
      const v = Math.abs(acc)
      if (v > truePeak) truePeak = v
    }
  }
  return { samplePeak, truePeak, clipped }
}

const yieldToBrowser = () => new Promise((r) => setTimeout(r, 0))

const UNKNOWN_FORMAT: FileFormat = { container: "audio", lossless: false, bitDepth: null }

export async function analyzeBuffer(
  buffer: AudioBuffer,
  format: FileFormat = UNKNOWN_FORMAT,
): Promise<LoudnessResult> {
  const { sampleRate, numberOfChannels, length } = buffer
  const channels = Math.min(numberOfChannels, 2)
  const [shelf, highPass] = kWeightingFilters(sampleRate)
  const lowBand = rbj("lowpass", 120, 0.707, sampleRate)
  const harshBand = rbj("bandpass", 3500, 0.6, sampleRate)
  let totalEnergy = 0
  let lowEnergy = 0
  let harshEnergy = 0
  let dcSum = 0

  const segment = Math.round(sampleRate * 0.1)
  const segments = Math.floor(length / segment)
  const segmentEnergy = new Float64Array(segments)

  let samplePeak = 0
  let truePeak = 0
  let clippedSamples = 0

  for (let c = 0; c < channels; c++) {
    const raw = buffer.getChannelData(c)
    const weighted = applyBiquad(applyBiquad(raw, shelf), highPass)
    for (let s = 0; s < segments; s++) {
      let sum = 0
      const start = s * segment
      for (let i = start; i < start + segment; i++) sum += weighted[i] * weighted[i]
      segmentEnergy[s] += sum
    }
    await yieldToBrowser()
    const peaks = channelPeaks(raw)
    samplePeak = Math.max(samplePeak, peaks.samplePeak)
    truePeak = Math.max(truePeak, peaks.truePeak)
    clippedSamples += peaks.clipped
    await yieldToBrowser()

    totalEnergy += sumSquares(raw)
    lowEnergy += sumSquares(applyBiquad(raw, lowBand))
    harshEnergy += sumSquares(applyBiquad(raw, harshBand))
    for (let i = 0; i < raw.length; i++) dcSum += raw[i]
    await yieldToBrowser()
  }

  let stereoCorrelation: number | null = null
  let sideToMidDb: number | null = null
  if (numberOfChannels >= 2) {
    const left = buffer.getChannelData(0)
    const right = buffer.getChannelData(1)
    let lr = 0, ll = 0, rr = 0, side = 0, mid = 0
    for (let i = 0; i < length; i++) {
      const l = left[i]
      const r = right[i]
      lr += l * r
      ll += l * l
      rr += r * r
      side += (l - r) * (l - r)
      mid += (l + r) * (l + r)
    }
    stereoCorrelation = ll > 0 && rr > 0 ? lr / Math.sqrt(ll * rr) : 1
    sideToMidDb = mid > 0 ? 10 * Math.log10(Math.max(side, 1e-12) / mid) : null
  }

  // Mono content is played on both speakers, so it's counted twice per BS.1770 convention.
  const channelGain = numberOfChannels === 1 ? 2 : 1

  const blockLoudness = (segsPerBlock: number) => {
    const blocks: number[] = []
    for (let s = 0; s + segsPerBlock <= segments; s++) {
      let e = 0
      for (let j = 0; j < segsPerBlock; j++) e += segmentEnergy[s + j]
      blocks.push((e * channelGain) / (segsPerBlock * segment))
    }
    return blocks
  }

  const momentary = blockLoudness(4)
  const aboveAbsolute = momentary.filter((z) => toLufs(z) > -70)
  let integratedLufs = -Infinity
  if (aboveAbsolute.length) {
    const relativeGate = toLufs(aboveAbsolute.reduce((a, b) => a + b, 0) / aboveAbsolute.length) - 10
    const gated = aboveAbsolute.filter((z) => toLufs(z) > relativeGate)
    integratedLufs = toLufs(gated.reduce((a, b) => a + b, 0) / gated.length)
  }

  const shortTerm = blockLoudness(30)
  const maxShortTermLufs = shortTerm.length
    ? toLufs(shortTerm.reduce((a, b) => (b > a ? b : a), 0))
    : integratedLufs

  const truePeakDbtp = toDb(truePeak)
  const share = (part: number) => (totalEnergy > 0 ? 10 * Math.log10(Math.max(part, 1e-12) / totalEnergy) : -Infinity)

  return {
    integratedLufs,
    maxShortTermLufs,
    truePeakDbtp,
    samplePeakDbfs: toDb(samplePeak),
    clippedSamples,
    durationSeconds: length / sampleRate,
    sampleRate,
    channels: numberOfChannels,
    peakToLoudness: truePeakDbtp - integratedLufs,
    loudnessRange: loudnessRange(shortTerm),
    stereoCorrelation,
    sideToMidDb,
    lowShareDb: share(lowEnergy),
    harshShareDb: share(harshEnergy),
    dcOffset: Math.abs(dcSum / Math.max(1, length * channels)),
    format,
  }
}

// EBU Tech 3342: spread between the 10th and 95th percentile of gated short-term loudness.
function loudnessRange(shortTerm: number[]): number {
  const absGated = shortTerm.filter((z) => toLufs(z) > -70)
  if (absGated.length < 2) return 0
  const relGate = toLufs(absGated.reduce((a, b) => a + b, 0) / absGated.length) - 20
  const values = absGated.map(toLufs).filter((l) => l > relGate).sort((a, b) => a - b)
  if (values.length < 2) return 0
  const pick = (p: number) => values[Math.min(values.length - 1, Math.round(p * (values.length - 1)))]
  return pick(0.95) - pick(0.1)
}

// decodeAudioData resamples to the context rate, so decode WAVs at their native rate.
function wavHeader(bytes: ArrayBuffer): { sampleRate: number; bitDepth: number } | null {
  const view = new DataView(bytes)
  if (bytes.byteLength < 44) return null
  const tag = (o: number) => String.fromCharCode(...new Uint8Array(bytes, o, 4))
  if (tag(0) !== "RIFF" || tag(8) !== "WAVE") return null
  let offset = 12
  while (offset + 8 <= bytes.byteLength) {
    const size = view.getUint32(offset + 4, true)
    if (tag(offset) === "fmt ") {
      return { sampleRate: view.getUint32(offset + 12, true), bitDepth: view.getUint16(offset + 22, true) }
    }
    offset += 8 + size + (size % 2)
  }
  return null
}

const LOSSLESS_EXTENSIONS = new Set(["wav", "aif", "aiff", "flac"])

export async function analyzeFile(file: File): Promise<LoudnessResult> {
  const bytes = await file.arrayBuffer()
  const wav = wavHeader(bytes)
  const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
  const format: FileFormat = wav
    ? { container: "wav", lossless: true, bitDepth: wav.bitDepth }
    : { container: ext || "audio", lossless: LOSSLESS_EXTENSIONS.has(ext), bitDepth: null }
  const native = wav?.sampleRate
  const rate = native && native >= 8000 && native <= 384000 ? native : 48000
  const ctx = new OfflineAudioContext(2, 1, rate)
  const buffer = await ctx.decodeAudioData(bytes)
  return analyzeBuffer(buffer, format)
}
