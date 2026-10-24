'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronsRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { UnlockMusic, hasArtistMusic } from '@/components/unlock-music'
import { UnlockSocials } from '@/components/unlock-socials'
import { WelcomeStage } from '@/components/welcome-stage'
import { SOCIAL_LINK_KINDS, type ArtistLinks } from '@/lib/artist-links-types'

const UNLOCK_THRESHOLD = 0.85
const FADE_MS = 1100

type Phase = 'locked' | 'unlocking' | 'gone'

// Seeded so server and client render identical drops (no hydration mismatch).
function seeded(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

const RAIN_DROPS = Array.from({ length: 70 }, (_, i) => ({
  left: Math.round(seeded(i + 1) * 1000) / 10,
  length: 40 + Math.round(seeded(i + 101) * 50),
  opacity: Math.round((0.15 + seeded(i + 201) * 0.3) * 100) / 100,
  duration: Math.round((0.55 + seeded(i + 301) * 0.5) * 100) / 100,
  delay: Math.round(seeded(i + 401) * 200) / 100,
}))

export function UnlockGate({ links = {} }: { links?: ArtistLinks }) {
  const [phase, setPhase] = useState<Phase>('locked')
  const [progress, setProgress] = useState(0)
  const [dragging, setDragging] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const handleRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef<{ pointerX: number; progress: number } | null>(null)

  useEffect(() => {
    if (phase === 'gone') return
    const site = document.getElementById('top')
    const root = document.documentElement
    root.style.overflow = 'hidden'
    if (site) site.inert = true
    return () => {
      root.style.overflow = ''
      if (site) site.inert = false
    }
  }, [phase])

  const unlock = useCallback(() => {
    setProgress(1)
    setPhase('unlocking')
    const site = document.getElementById('top')
    if (site) site.inert = false
    document.documentElement.style.overflow = ''
    window.setTimeout(() => setPhase('gone'), FADE_MS)
  }, [])

  const travel = () => {
    const track = trackRef.current
    const handle = handleRef.current
    if (!track || !handle) return 1
    return Math.max(1, track.clientWidth - 2 - handle.offsetWidth - 8)
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (phase !== 'locked') return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragStartRef.current = { pointerX: e.clientX, progress }
    setDragging(true)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = dragStartRef.current
    if (!start || phase !== 'locked') return
    const next = start.progress + (e.clientX - start.pointerX) / travel()
    setProgress(Math.min(1, Math.max(0, next)))
  }

  const endDrag = () => {
    if (!dragStartRef.current) return
    dragStartRef.current = null
    setDragging(false)
    if (progress >= UNLOCK_THRESHOLD) unlock()
    else setProgress(0)
  }

  const swipeRef = useRef<{ id: number; x: number; y: number; active: boolean } | null>(null)
  const swipeProgressRef = useRef(0)

  const onGatePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (phase !== 'locked' || dragStartRef.current) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const target = e.target as HTMLElement
    // Leave links, buttons, embeds, the slider and the drag-to-rotate character alone.
    if (target.closest('a, button, iframe, input, textarea, canvas, [role="slider"], [role="tab"]')) return
    swipeRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY, active: false }
  }

  const onGatePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const swipe = swipeRef.current
    if (!swipe || swipe.id !== e.pointerId || phase !== 'locked') return
    const dx = e.clientX - swipe.x
    const dy = e.clientY - swipe.y
    if (!swipe.active) {
      if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) {
        swipeRef.current = null
        return
      }
      if (Math.abs(dx) < 12) return
      swipe.active = true
      e.currentTarget.setPointerCapture(e.pointerId)
      setDragging(true)
    }
    const distance = Math.min(320, window.innerWidth * 0.45)
    const next = Math.min(1, Math.max(0, Math.abs(dx) / distance))
    swipeProgressRef.current = next
    setProgress(next)
  }

  const endSwipe = (e: React.PointerEvent<HTMLDivElement>) => {
    const swipe = swipeRef.current
    if (!swipe || swipe.id !== e.pointerId) return
    swipeRef.current = null
    if (!swipe.active) return
    setDragging(false)
    if (swipeProgressRef.current >= UNLOCK_THRESHOLD) unlock()
    else setProgress(0)
    swipeProgressRef.current = 0
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (phase !== 'locked') return
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'End') {
      e.preventDefault()
      unlock()
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      const next = Math.min(1, progress + 0.2)
      if (next >= UNLOCK_THRESHOLD) unlock()
      else setProgress(next)
    } else if (e.key === 'ArrowLeft' || e.key === 'Home') {
      e.preventDefault()
      setProgress(e.key === 'Home' ? 0 : Math.max(0, progress - 0.2))
    }
  }

  if (phase === 'gone') return null

  const unlocking = phase === 'unlocking'
  const socials = SOCIAL_LINK_KINDS.flatMap((kind) => (links[kind] ? [{ kind, url: links[kind] as string }] : []))

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Unlock Emo's Radio"
      onPointerDown={onGatePointerDown}
      onPointerMove={onGatePointerMove}
      onPointerUp={endSwipe}
      onPointerCancel={endSwipe}
      className={cn(
        'unlock-gate fixed inset-0 z-[100] touch-pan-y overflow-hidden bg-background',
        unlocking && 'unlock-gate--leaving',
      )}
    >
      <img
        className="unlock-video absolute inset-0 h-full w-full object-cover"
        src="/images/unlock-rain-bg.webp"
        alt=""
        width={1920}
        height={1081}
        fetchPriority="high"
        decoding="async"
        aria-hidden="true"
      />
      <div aria-hidden="true" className="unlock-rain absolute inset-0">
        {RAIN_DROPS.map((drop, i) => (
          <span
            key={i}
            className="unlock-rain__drop"
            style={{
              left: `${drop.left}%`,
              height: `${drop.length}px`,
              opacity: drop.opacity,
              animationDuration: `${drop.duration}s`,
              animationDelay: `-${drop.delay}s`,
            }}
          />
        ))}
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/10 to-background/85"
      />

      <div className="unlock-content relative h-full overflow-y-auto overscroll-contain">
        <div className="mx-auto flex min-h-full w-full max-w-md flex-col items-center gap-8 px-5 pt-14 pb-10 sm:pt-20">
          <header className="flex flex-col items-center gap-3 text-center">
  <h1 className="logo-shine relative w-full max-w-sm">
  <img
  src="/images/emos-radio-logo.webp"
  alt="Emo's Radio"
  width={1117}
  height={702}
  fetchPriority="high"
  className="glass-logo h-auto w-full select-none"
  draggable={false}
  />
  </h1>
            <p className="max-w-xs text-sm leading-relaxed text-foreground/85 text-pretty [text-shadow:0_1px_8px_var(--background)]">
              Live music reviews. Submit your track, battle in the Arena, get heard.
            </p>
          </header>

          <WelcomeStage className="h-72 w-full xl:absolute xl:right-[3vw] xl:bottom-0 xl:h-[86vh] xl:w-[30vw] xl:max-w-[560px]" />

          {socials.length > 0 && <UnlockSocials socials={socials} />}

          {hasArtistMusic(links) && <UnlockMusic links={links} />}

          <div className="mt-auto flex w-full flex-col items-center gap-4 pt-4">
          <div
            ref={trackRef}
            className="relative h-16 w-full rounded-full border border-foreground/20 bg-background/40 p-1 backdrop-blur-md"
          >
            <div
              aria-hidden="true"
              className="absolute inset-y-1 left-1 rounded-full bg-primary/35"
              style={{
                width: `calc(${progress} * (100% - 4rem) + 3.5rem)`,
                transition: dragging ? 'none' : 'width 350ms cubic-bezier(.2,.8,.2,1)',
              }}
            />
            <span
              aria-hidden="true"
              className="unlock-shimmer pointer-events-none absolute inset-0 flex items-center justify-center pl-12 text-sm font-semibold uppercase tracking-[0.3em]"
              style={{ opacity: 1 - progress * 1.4 }}
            >
              Slide to unlock
            </span>
            <div
              ref={handleRef}
              role="slider"
              tabIndex={0}
              aria-label="Slide to unlock the site"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress * 100)}
              aria-valuetext={unlocking ? 'Unlocked' : 'Locked'}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onKeyDown={onKeyDown}
              className="absolute top-1 flex h-14 w-14 cursor-grab touch-none select-none items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_24px_var(--primary)] outline-none focus-visible:ring-2 focus-visible:ring-foreground active:cursor-grabbing"
              style={{
                left: `calc(0.25rem + ${progress} * (100% - 4rem))`,
                transition: dragging ? 'none' : 'left 350ms cubic-bezier(.2,.8,.2,1)',
              }}
            >
              <ChevronsRight className="h-6 w-6" aria-hidden="true" />
            </div>
          </div>
          <p className="text-xs uppercase tracking-[0.25em] text-foreground/60">
            Swipe anywhere to enter the site
          </p>
          </div>
        </div>
      </div>
    </div>
  )
}
