"use client"

import { useEffect, useRef, useState } from "react"

type Pose = {
  src: string
  width: number
  line: string
  motion: string
}

const POSES = {
  wave: { src: "/mascot/wave.webp", width: 248, line: "Yo, welcome in!", motion: "mascot-wave" },
  dj: { src: "/mascot/dj.webp", width: 302, line: "What's spinning next?", motion: "mascot-dj" },
  submit: { src: "/mascot/submit.webp", width: 331, line: "Drop that heat!", motion: "mascot-submit" },
  vault: { src: "/mascot/vault.webp", width: 227, line: "Shhh... the vault.", motion: "mascot-vault" },
  tools: { src: "/mascot/tools.webp", width: 309, line: "Let's build something.", motion: "mascot-tools" },
  blog: { src: "/mascot/blog.webp", width: 207, line: "Taking notes...", motion: "mascot-blog" },
  arena: { src: "/mascot/arena.webp", width: 247, line: "Step in the ring!", motion: "mascot-arena" },
  ranks: { src: "/mascot/ranks.webp", width: 334, line: "Who's on top?", motion: "mascot-ranks" },
  feed: { src: "/mascot/feed.webp", width: 186, line: "Ayy, what's new?", motion: "mascot-feed" },
  point: { src: "/mascot/point.webp", width: 212, line: "Yeah, you!", motion: "mascot-point" },
  dance: { src: "/mascot/dance.webp", width: 381, line: "This one goes hard.", motion: "mascot-dance" },
  thumbs: { src: "/mascot/thumbs.webp", width: 240, line: "Do it, do it!", motion: "mascot-thumbs" },
} satisfies Record<string, Pose>

type PoseName = keyof typeof POSES

const ROUTE_POSES: [string, PoseName][] = [
  ["/queue", "dj"],
  ["/submit", "submit"],
  ["/vault", "vault"],
  ["/tools", "tools"],
  ["/blog", "blog"],
  ["/arena", "arena"],
  ["/ranks", "ranks"],
  ["/feed", "feed"],
  ["/account", "point"],
  ["/sign-in", "point"],
  ["/admin", "tools"],
]

const TRIGGER_SELECTOR = "[data-mascot], a[href], button, [role='button']"
const DISPLAY_HEIGHT = 220
const SHOW_DELAY = 120
const HIDE_DELAY = 700

function isPoseName(value: string | null): value is PoseName {
  return value !== null && value in POSES
}

function poseFor(el: Element): PoseName | null {
  const explicit = el.getAttribute("data-mascot")
  if (explicit === "off") return null
  if (isPoseName(explicit)) return explicit

  if (el instanceof HTMLAnchorElement) {
    const url = new URL(el.href, window.location.origin)
    if (url.origin !== window.location.origin) return "dance"
    if (url.pathname === "/") return "wave"
    const match = ROUTE_POSES.find(([prefix]) => url.pathname.startsWith(prefix))
    return match ? match[1] : "dance"
  }
  return "thumbs"
}

export function HoverMascot() {
  const [pose, setPose] = useState<PoseName | null>(null)
  const [visible, setVisible] = useState(false)
  const [playKey, setPlayKey] = useState(0)
  const activeEl = useRef<Element | null>(null)
  const showTimer = useRef<number | undefined>(undefined)
  const hideTimer = useRef<number | undefined>(undefined)
  const visibleRef = useRef(false)

  useEffect(() => {
    for (const p of Object.values(POSES)) {
      const img = new window.Image()
      img.src = p.src
    }

    function show(next: PoseName) {
      window.clearTimeout(hideTimer.current)
      window.clearTimeout(showTimer.current)
      const reveal = () => {
        setPose(next)
        setPlayKey((k) => k + 1)
        setVisible(true)
        visibleRef.current = true
      }
      if (visibleRef.current) reveal()
      else showTimer.current = window.setTimeout(reveal, SHOW_DELAY)
    }

    function scheduleHide() {
      window.clearTimeout(showTimer.current)
      window.clearTimeout(hideTimer.current)
      hideTimer.current = window.setTimeout(() => {
        setVisible(false)
        visibleRef.current = false
        activeEl.current = null
      }, HIDE_DELAY)
    }

    function onOver(e: PointerEvent) {
      if (e.pointerType !== "mouse") return
      const target = e.target instanceof Element ? e.target.closest(TRIGGER_SELECTOR) : null
      if (!target) return
      if (target === activeEl.current) {
        window.clearTimeout(hideTimer.current)
        return
      }
      const next = poseFor(target)
      if (!next) return
      activeEl.current = target
      show(next)
    }

    function onOut(e: PointerEvent) {
      if (e.pointerType !== "mouse" || !activeEl.current) return
      const to = e.relatedTarget instanceof Node ? e.relatedTarget : null
      if (to && activeEl.current.contains(to)) return
      scheduleHide()
    }

    document.addEventListener("pointerover", onOver)
    document.addEventListener("pointerout", onOut)
    return () => {
      document.removeEventListener("pointerover", onOver)
      document.removeEventListener("pointerout", onOut)
      window.clearTimeout(showTimer.current)
      window.clearTimeout(hideTimer.current)
    }
  }, [])

  if (!pose) return null
  const current = POSES[pose]
  const width = Math.round((current.width / 480) * DISPLAY_HEIGHT)

  return (
    <div
      aria-hidden="true"
      className="mascot-stage pointer-events-none fixed bottom-0 right-4 z-50 hidden flex-col items-end md:flex"
      data-visible={visible}
    >
      <div key={`bubble-${playKey}`} className="mascot-bubble mb-2 mr-10 rounded-2xl rounded-br-sm border border-primary/60 bg-card px-4 py-2 text-sm font-bold text-card-foreground shadow-lg shadow-primary/20">
        {current.line}
      </div>
      <img
        key={`pose-${playKey}`}
        src={current.src}
        alt=""
        width={width}
        height={DISPLAY_HEIGHT}
        className={`mascot-pose ${current.motion} drop-shadow-[0_12px_24px_oklch(0.62_0.21_300/0.45)]`}
        style={{ height: DISPLAY_HEIGHT, width: "auto" }}
      />
    </div>
  )
}
