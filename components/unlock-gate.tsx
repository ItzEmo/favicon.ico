'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronsRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { UnlockMusic, hasArtistMusic } from '@/components/unlock-music'
import { BrandIcon, SOCIAL_LABELS } from '@/components/brand-icon'
import { SOCIAL_LINK_KINDS, type ArtistLinks } from '@/lib/artist-links-types'

const UNLOCK_THRESHOLD = 0.85
const FADE_MS = 1100

type Phase = 'locked' | 'unlocking' | 'gone'

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
      className={cn(
        'unlock-gate fixed inset-0 z-[100] overflow-hidden bg-background',
        unlocking && 'unlock-gate--leaving',
      )}
    >
      <video
        className="unlock-video absolute inset-0 h-full w-full object-cover"
        src="/unlock/background.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/10 to-background/85"
      />

      <div className="unlock-content relative h-full overflow-y-auto overscroll-contain">
        <div className="mx-auto flex min-h-full w-full max-w-md flex-col items-center gap-8 px-5 pt-14 pb-10 sm:pt-20">
          <header className="flex flex-col items-center gap-3 text-center">
            <div aria-hidden="true" className="pendant-sway relative -mt-6 aspect-[560/531] w-52 sm:w-60">
              <img
                src="/images/pendant-chain.webp"
                alt=""
                width={560}
                height={531}
                className="absolute inset-0 size-full"
              />
              <img
                src="/images/pendant-charm.webp"
                alt=""
                width={560}
                height={531}
                className="pendant-swing absolute inset-0 size-full"
              />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground text-balance">Emo&apos;s Radio</h1>
            <p className="max-w-xs text-sm leading-relaxed text-foreground/85 text-pretty [text-shadow:0_1px_8px_var(--background)]">
              Live music reviews. Submit your track, battle in the Arena, get heard.
            </p>
          </header>

          {socials.length > 0 && (
            <nav aria-label="Emo on social media" className="flex w-full flex-col gap-3">
              {socials.map(({ kind, url }) => (
                <a
                  key={kind}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative flex h-14 w-full items-center justify-center rounded-full border border-foreground/20 bg-background/55 px-14 text-sm font-bold text-foreground backdrop-blur-md outline-none transition-[transform,border-color,background-color] hover:-translate-y-0.5 hover:border-primary hover:bg-background/75 focus-visible:ring-2 focus-visible:ring-foreground"
                >
                  <BrandIcon kind={kind} className="absolute left-5" />
                  {SOCIAL_LABELS[kind]}
                </a>
              ))}
            </nav>
          )}

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
            Slide to enter the site
          </p>
          </div>
        </div>
      </div>
    </div>
  )
}
