"use client"

import Image from "next/image"
import { useState } from "react"
import { cn } from "@/lib/utils"

const MASCOTS = [
  { src: "/mascot/point.webp", width: 212, line: "Yeah you! Pull up live.", spot: "sched-mascot--tl", flip: false, mobile: true },
  { src: "/mascot/wave.webp", width: 248, line: "Yo, welcome to the schedule!", spot: "sched-mascot--tr", flip: true, mobile: true },
  { src: "/mascot/thumbs.webp", width: 240, line: "Locked in every week.", spot: "sched-mascot--r", flip: true, mobile: false },
  { src: "/mascot/blog.webp", width: 207, line: "Hmm... gaming or music tonight?", spot: "sched-mascot--bl", flip: false, mobile: false },
  { src: "/mascot/dance.webp", width: 381, line: "LET'S GOOO!", spot: "sched-mascot--b", flip: false, mobile: false },
  { src: "/mascot/vault.webp", width: 227, line: "Shhh... Sundays we recharge.", spot: "sched-mascot--br", flip: true, mobile: false },
]

export function ScheduleMascots() {
  const [active, setActive] = useState<number | null>(null)

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {MASCOTS.map((m, i) => (
        <button
          key={m.src}
          type="button"
          tabIndex={-1}
          onClick={() => setActive((v) => (v === i ? null : i))}
          onMouseEnter={() => setActive(i)}
          onMouseLeave={() => setActive((v) => (v === i ? null : v))}
          className={cn("sched-mascot pointer-events-auto", m.spot, !m.mobile && "hidden lg:block")}
          data-active={active === i ? "true" : undefined}
        >
          <span className="sched-mascot__bubble">{m.line}</span>
          <Image
            src={m.src}
            alt=""
            width={m.width}
            height={480}
            className={cn("sched-mascot__img h-full w-auto", m.flip && "-scale-x-100")}
          />
        </button>
      ))}
    </div>
  )
}
