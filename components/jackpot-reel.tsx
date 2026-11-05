"use client"

import { useEffect, useMemo, useState } from "react"
import { cn } from "@/lib/utils"

export type JackpotSpin = {
  id: number
  winner: string
  title: string
  candidates: string[]
}

const LOOPS = 34

// Deterministic per spin so the overlay and admin preview land the same way.
function buildStrip(spin: JackpotSpin): string[] {
  const pool = spin.candidates.length > 1 ? spin.candidates.filter((c) => c !== spin.winner) : []
  const filler = pool.length ? pool : ["FREE SKIP", "???", "SPIN"]
  const strip = Array.from({ length: LOOPS }, (_, i) => filler[(i * 7 + spin.id) % filler.length])
  return [...strip, spin.winner, filler[(spin.id + 3) % filler.length]]
}

function Bulbs({ count }: { count: number }) {
  return (
    <div className="flex justify-between px-3" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="jackpot-bulb size-2.5 rounded-full" />
      ))}
    </div>
  )
}

export function JackpotReel({
  spin,
  size = "lg",
  onDone,
}: {
  spin: JackpotSpin
  size?: "md" | "lg"
  onDone?: () => void
}) {
  const strip = useMemo(() => buildStrip(spin), [spin])
  const winnerIndex = strip.length - 2
  const [phase, setPhase] = useState<"ready" | "spinning" | "won">("ready")

  useEffect(() => {
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setPhase("spinning"))
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  const offset = phase === "ready" ? 0 : winnerIndex - 1
  const lg = size === "lg"

  return (
    <div
      data-phase={phase}
      className={cn(
        "flex w-full flex-col gap-3 rounded-[2rem] border-4 border-jackpot bg-card/90 py-3 shadow-2xl shadow-jackpot/30 backdrop-blur-md",
        lg ? "max-w-xl" : "max-w-md",
      )}
    >
      <Bulbs count={lg ? 16 : 12} />

      <div className="flex flex-col items-center gap-1 px-5">
        <p
          className={cn(
            "jackpot-glow font-black uppercase italic leading-none tracking-tight text-jackpot",
            lg ? "text-5xl" : "text-3xl",
          )}
        >
          {phase === "won" ? "Jackpot!" : "Free Skip"}
        </p>
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">
          {phase === "won" ? "Straight to the Skip line" : "Spinning the Free line"}
        </p>
      </div>

      <div className="px-5">
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl border-2 border-jackpot/60 bg-background",
            lg ? "[--row:4.5rem]" : "[--row:3.5rem]",
          )}
          style={{ height: "calc(var(--row) * 3)" }}
          aria-live="polite"
        >
          <ul
            className={cn("flex flex-col", phase !== "ready" && "jackpot-reel")}
            style={{ transform: `translateY(calc(var(--row) * -${offset}))` }}
            onTransitionEnd={() => {
              setPhase("won")
              onDone?.()
            }}
            aria-hidden={phase !== "won"}
          >
            {strip.map((name, i) => (
              <li
                key={i}
                className={cn(
                  "flex shrink-0 items-center justify-center truncate px-4 font-black uppercase tracking-tight",
                  lg ? "text-3xl" : "text-2xl",
                  phase === "won" && i === winnerIndex ? "jackpot-win text-jackpot" : "text-foreground/80",
                )}
                style={{ height: "var(--row)" }}
              >
                {name}
              </li>
            ))}
          </ul>
          <div
            className="pointer-events-none absolute inset-x-0 border-y-2 border-jackpot"
            style={{ top: "var(--row)", height: "var(--row)" }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,var(--background)_0%,transparent_30%,transparent_70%,var(--background)_100%)]"
            aria-hidden="true"
          />
          {phase === "won" && <span className="sr-only">{`${spin.winner} wins a free skip`}</span>}
        </div>
      </div>

      <p
        className={cn(
          "min-h-5 truncate px-5 text-center text-sm font-semibold text-muted-foreground transition-opacity",
          phase === "won" ? "opacity-100" : "opacity-0",
        )}
      >
        {spin.title}
      </p>

      <Bulbs count={lg ? 16 : 12} />
    </div>
  )
}
