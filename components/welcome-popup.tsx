'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Music2, UserPlus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const WelcomeCharacter = dynamic(() => import('@/components/welcome-character'), { ssr: false })

export function WelcomePopup({ onClose }: { onClose: () => void }) {
  const [mascotReady, setMascotReady] = useState(false)
  const handleReady = useCallback(() => setMascotReady(true), [])
  const primaryRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    primaryRef.current?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="welcome-popup fixed inset-0 z-[110] flex items-center justify-center p-5">
      <button
        type="button"
        aria-label="Close welcome message"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-background/60 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-popup-title"
        className="welcome-popup__card relative flex w-full max-w-xs flex-col items-center gap-4 rounded-3xl border border-border bg-card px-6 pt-6 pb-20 text-center text-card-foreground shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <h2 id="welcome-popup-title" className="text-xl font-bold text-balance">
          {"Welcome to Emo's Radio"}
        </h2>

        <ul className="flex w-full flex-col gap-2 text-left text-sm leading-relaxed">
          <li>
            <Link
              ref={primaryRef}
              href="/submit"
              onClick={onClose}
              className="flex items-center gap-3 rounded-2xl bg-muted/60 px-3 py-2.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Music2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>
                <span className="font-semibold">Submit</span>
                <span className="text-muted-foreground"> to send in your music</span>
              </span>
            </Link>
          </li>
          <li>
            <Link
              href="/sign-up"
              onClick={onClose}
              className="flex items-center gap-3 rounded-2xl bg-muted/60 px-3 py-2.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <UserPlus className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>
                <span className="font-semibold">Sign up</span>
                <span className="text-muted-foreground"> for a free account</span>
              </span>
            </Link>
          </li>
        </ul>

        <div
          aria-hidden="true"
          className={cn(
            'welcome-popup__sticker absolute -bottom-12 left-1/2 h-28 w-28 overflow-hidden rounded-full border-4 border-card bg-primary/25 shadow-xl',
            mascotReady && 'welcome-popup__sticker--ready',
          )}
        >
          <div className="absolute inset-x-0 -top-2 -bottom-6">
            <WelcomeCharacter onReady={handleReady} />
          </div>
        </div>
      </div>
    </div>
  )
}
