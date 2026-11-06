"use client"

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react"
import { cn } from "@/lib/utils"

export type JackpotSpin = {
  id: number
  winner: string
  title: string
  candidates: string[]
}

type Phase = "ready" | "spinning" | "won"

const FACES = 12
const ANGLE = 360 / FACES
// Distance from the cylinder axis to each face, in rows, so 12 faces close into a ring.
const RADIUS = 0.5 / Math.tan(Math.PI / FACES)
const SYMBOLS = ["7", "BAR", "$", "WILD"]
const COINS = 18

// Deterministic per spin so the overlay and admin preview land the same way.
function buildNameFaces(spin: JackpotSpin) {
  const pool = spin.candidates.filter((c) => c !== spin.winner)
  const filler = pool.length ? pool : ["FREE SKIP", "???", "SPIN"]
  const target = (spin.id % (FACES - 1)) + 1
  const faces = Array.from({ length: FACES }, (_, i) =>
    i === target ? spin.winner : filler[(i * 5 + spin.id) % filler.length],
  )
  return { faces, target }
}

function buildSymbolFaces(seed: number) {
  const faces = Array.from({ length: FACES }, (_, i) => SYMBOLS[(i + seed) % SYMBOLS.length])
  const target = faces.indexOf("7", 3)
  return { faces, target: target === -1 ? faces.indexOf("7") : target }
}

function Cylinder({
  faces,
  target,
  phase,
  loops,
  duration,
  renderFace,
  onLanded,
  className,
}: {
  faces: string[]
  target: number
  phase: Phase
  loops: number
  duration: number
  renderFace: (face: string, isTarget: boolean) => ReactNode
  onLanded?: () => void
  className?: string
}) {
  const rotation = phase === "ready" ? 0 : loops * 360 + target * ANGLE
  return (
    <div className={cn("jp-reel relative overflow-hidden", className)}>
      <div
        className="absolute inset-x-0 top-1/2"
        style={{
          height: "var(--row)",
          marginTop: "calc(var(--row) / -2)",
          transformStyle: "preserve-3d",
          transform: `translateZ(calc(var(--row) * ${-RADIUS})) rotateX(${rotation}deg)`,
          transition: phase === "ready" ? "none" : `transform ${duration}ms cubic-bezier(0.16, 0.7, 0.2, 1.03)`,
        }}
        onTransitionEnd={(e) => {
          if (e.target === e.currentTarget && e.propertyName === "transform") onLanded?.()
        }}
      >
        {faces.map((face, i) => (
          <div
            key={i}
            className="jp-face absolute inset-0 flex items-center justify-center px-3"
            style={{ transform: `rotateX(${-i * ANGLE}deg) translateZ(calc(var(--row) * ${RADIUS}))` }}
          >
            {renderFace(face, phase === "won" && i === target)}
          </div>
        ))}
      </div>
      <div className="jp-reel-shade pointer-events-none absolute inset-0" aria-hidden="true" />
    </div>
  )
}

function SymbolFace(face: string, isTarget: boolean) {
  return (
    <span
      className={cn(
        "font-black italic leading-none",
        face === "7" ? "text-primary" : "text-background/70",
        face.length > 1 ? "text-[length:calc(var(--row)*0.3)]" : "text-[length:calc(var(--row)*0.62)]",
        isTarget && "jp-glow",
      )}
    >
      {face}
    </span>
  )
}

function Bulbs({ count }: { count: number }) {
  return (
    <div className="flex justify-between" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="jackpot-bulb size-2 rounded-full" />
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
  const names = useMemo(() => buildNameFaces(spin), [spin])
  const left = useMemo(() => buildSymbolFaces(spin.id), [spin.id])
  const right = useMemo(() => buildSymbolFaces(spin.id + 2), [spin.id])
  const [phase, setPhase] = useState<Phase>("ready")
  const lg = size === "lg"

  useEffect(() => {
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setPhase("spinning"))
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div
      data-phase={phase}
      className={cn("jp-stage relative w-full", lg ? "max-w-2xl [--row:4.75rem]" : "max-w-lg [--row:3.5rem]")}
    >
      <div className="jp-cabinet relative flex flex-col gap-4 rounded-[2.5rem] p-4 sm:p-5">
        <div className="jp-marquee flex flex-col gap-2 rounded-[1.75rem] px-4 py-3">
          <Bulbs count={lg ? 18 : 13} />
          <div className="flex flex-col items-center gap-1">
            <p
              className={cn(
                "jp-title font-black uppercase italic leading-none tracking-tight text-jackpot",
                lg ? "text-6xl" : "text-4xl",
              )}
            >
              {phase === "won" ? "Jackpot!" : "Free Skip"}
            </p>
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.35em] text-jackpot/80">
              {phase === "won" ? "Straight to the Skip line" : "Spinning the Free line"}
            </p>
          </div>
          <Bulbs count={lg ? 18 : 13} />
        </div>

        <div className="jp-window relative flex gap-2 rounded-2xl p-2" style={{ height: "calc(var(--row) * 2.6)" }}>
          <Cylinder
            faces={left.faces}
            target={left.target}
            phase={phase}
            loops={6}
            duration={3400}
            renderFace={SymbolFace}
            className="w-[calc(var(--row)*1.25)] shrink-0 rounded-l-xl"
          />
          <Cylinder
            faces={names.faces}
            target={names.target}
            phase={phase}
            loops={11}
            duration={6000}
            className="min-w-0 flex-1"
            renderFace={(face, isTarget) => (
              <span
                className={cn(
                  "truncate font-black uppercase leading-none tracking-tight text-background",
                  lg ? "text-3xl" : "text-xl",
                  isTarget && "jp-hit text-primary",
                )}
              >
                {face}
              </span>
            )}
            onLanded={() => {
              setPhase("won")
              onDone?.()
            }}
          />
          <Cylinder
            faces={right.faces}
            target={right.target}
            phase={phase}
            loops={8}
            duration={4600}
            renderFace={SymbolFace}
            className="w-[calc(var(--row)*1.25)] shrink-0 rounded-r-xl"
          />
          <div className="jp-payline pointer-events-none absolute inset-x-0 top-1/2" aria-hidden="true" />
        </div>

        <div className="jp-tray flex min-h-10 items-center justify-center rounded-2xl px-4 py-2">
          <p
            className={cn(
              "truncate text-center text-sm font-semibold text-jackpot transition-opacity duration-500",
              phase === "won" ? "opacity-100" : "opacity-0",
            )}
          >
            {spin.title}
          </p>
        </div>

        <div className="jp-lever absolute -right-7 top-1/3 h-1/3 w-6" aria-hidden="true">
          <span className="jp-lever-base absolute bottom-0 left-0 h-10 w-6 rounded-r-lg" />
          <span className="jp-lever-arm absolute bottom-6 left-2 h-full w-2 rounded-full">
            <span className="jp-lever-knob absolute -left-3 -top-5 size-8 rounded-full" />
          </span>
        </div>
      </div>

      {phase === "won" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
          {Array.from({ length: COINS }, (_, i) => {
            const angle = (i / COINS) * Math.PI * 2
            const distance = 180 + ((i * 37) % 120)
            return (
              <span
                key={i}
                className="jp-coin absolute size-7 rounded-full"
                style={
                  {
                    "--x": `${Math.cos(angle) * distance}px`,
                    "--y": `${Math.sin(angle) * distance * 0.7 - 60}px`,
                    animationDelay: `${(i % 6) * 60}ms`,
                  } as CSSProperties
                }
              />
            )
          })}
        </div>
      )}

      <div aria-live="polite" className="sr-only">
        {phase === "won" ? `${spin.winner} wins a free skip` : ""}
      </div>
    </div>
  )
}
