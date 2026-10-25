import type { LinkEffect } from "@/lib/link-page"
import { RainBackdrop } from "@/components/rain-backdrop"

function seeded(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

const round = (n: number, places = 2) => Math.round(n * 10 ** places) / 10 ** places

const FLAKES = Array.from({ length: 80 }, (_, i) => ({
  left: round(seeded(i + 11) * 100, 1),
  size: round(2 + seeded(i + 111) * 5, 1),
  opacity: round(0.35 + seeded(i + 211) * 0.55),
  duration: round(7 + seeded(i + 311) * 9),
  delay: round(seeded(i + 411) * 16),
  drift: Math.round(-40 + seeded(i + 511) * 80),
}))

const GUSTS = Array.from({ length: 34 }, (_, i) => ({
  top: round(seeded(i + 21) * 100, 1),
  width: Math.round(80 + seeded(i + 121) * 220),
  opacity: round(0.12 + seeded(i + 221) * 0.3),
  duration: round(1.4 + seeded(i + 321) * 2.2),
  delay: round(seeded(i + 421) * 4),
}))

function SnowBackdrop() {
  return (
    <div aria-hidden="true" className="link-snow absolute inset-0">
      {FLAKES.map((f, i) => (
        <span
          key={i}
          className="link-snow__flake"
          style={
            {
              left: `${f.left}%`,
              width: `${f.size}px`,
              height: `${f.size}px`,
              opacity: f.opacity,
              animationDuration: `${f.duration}s`,
              animationDelay: `-${f.delay}s`,
              "--drift": `${f.drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}

function WindBackdrop() {
  return (
    <div aria-hidden="true" className="link-wind absolute inset-0">
      {GUSTS.map((g, i) => (
        <span
          key={i}
          className="link-wind__gust"
          style={{
            top: `${g.top}%`,
            width: `${g.width}px`,
            opacity: g.opacity,
            animationDuration: `${g.duration}s`,
            animationDelay: `-${g.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

function StormBackdrop() {
  return (
    <>
      <RainBackdrop />
      <div aria-hidden="true" className="link-lightning absolute inset-0" />
    </>
  )
}

export function LinkEffectBackdrop({ effect }: { effect: LinkEffect }) {
  switch (effect) {
    case "rain":
      return <RainBackdrop />
    case "storm":
      return <StormBackdrop />
    case "snow":
      return <SnowBackdrop />
    case "wind":
      return <WindBackdrop />
    default:
      return null
  }
}
