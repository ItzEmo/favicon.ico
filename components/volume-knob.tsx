"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

const SWEEP_DEGREES = 270
const START_DEGREES = -135
const DRAG_PIXELS_FOR_FULL_RANGE = 160

type VolumeKnobProps = {
  value: number
  onChange: (value: number) => void
  size?: "sm" | "lg"
  className?: string
}

export function VolumeKnob({ value, onChange, size = "lg", className }: VolumeKnobProps) {
  const knobRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startY: number; startValue: number } | null>(null)
  const valueRef = useRef(value)
  valueRef.current = value

  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    const el = knobRef.current
    if (!el) return
    function onWheel(e: WheelEvent) {
      e.preventDefault()
      const step = e.deltaY < 0 ? 0.05 : -0.05
      onChangeRef.current(Math.min(1, Math.max(0, valueRef.current + step)))
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [])

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { startY: e.clientY, startValue: value }
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return
    const delta = (dragRef.current.startY - e.clientY) / DRAG_PIXELS_FOR_FULL_RANGE
    onChange(Math.min(1, Math.max(0, dragRef.current.startValue + delta)))
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    dragRef.current = null
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const steps: Record<string, number> = {
      ArrowUp: 0.05,
      ArrowRight: 0.05,
      ArrowDown: -0.05,
      ArrowLeft: -0.05,
      PageUp: 0.2,
      PageDown: -0.2,
    }
    if (e.key === "Home") onChange(0)
    else if (e.key === "End") onChange(1)
    else if (e.key in steps) onChange(Math.min(1, Math.max(0, value + steps[e.key])))
    else return
    e.preventDefault()
  }

  const percent = Math.round(value * 100)
  const rotation = START_DEGREES + value * SWEEP_DEGREES
  const isLarge = size === "lg"

  return (
    <div className={cn("flex flex-col items-center gap-1.5", className)}>
      <div
        ref={knobRef}
        role="slider"
        tabIndex={0}
        aria-label="Volume"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${percent}%`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        onDoubleClick={() => onChange(valueRef.current > 0 ? 0 : 0.8)}
        title="Drag up/down, scroll, or use arrow keys. Double-click to mute."
        className={cn(
          "relative flex cursor-grab touch-none select-none items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:cursor-grabbing",
          isLarge ? "size-16" : "size-10",
        )}
        style={{
          background: `conic-gradient(from ${START_DEGREES}deg, var(--primary) ${value * SWEEP_DEGREES}deg, var(--secondary) ${value * SWEEP_DEGREES}deg ${SWEEP_DEGREES}deg, transparent ${SWEEP_DEGREES}deg)`,
        }}
      >
        <div
          className={cn(
            "relative rounded-full border border-border bg-card shadow-inner",
            isLarge ? "size-12" : "size-7",
          )}
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <span
            aria-hidden="true"
            className={cn(
              "absolute left-1/2 top-1 w-0.5 -translate-x-1/2 rounded-full bg-primary",
              isLarge ? "h-3" : "h-2",
            )}
          />
        </div>
      </div>
      {isLarge ? (
        <span className="text-xs font-bold uppercase tracking-wider tabular-nums text-muted-foreground">
          Vol {percent}
        </span>
      ) : null}
    </div>
  )
}
