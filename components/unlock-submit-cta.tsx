'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QueueStatus } from '@/lib/queue-status'

const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<QueueStatus>)

export function UnlockSubmitCta({ onEnter }: { onEnter: () => void }) {
  const { data } = useSWR('/api/queue/status', fetcher, { refreshInterval: 10000 })
  const offAir = data ? !data.freeOpen && !data.skipsOpen : false

  return (
    <section aria-labelledby="unlock-submit-title" className="submit-cta w-full max-w-sm">
      <div className="submit-cta__frame flex flex-col gap-4 p-5">
        <p
          role="status"
          className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/70"
        >
          <span className={cn('submit-cta__onair', offAir && 'submit-cta__onair--off')} aria-hidden="true" />
          {offAir ? 'Off Air' : 'Now taking submissions'}
        </p>

        <div className="flex flex-col gap-1.5">
          <h2
            id="unlock-submit-title"
            className="submit-cta__chrome text-4xl leading-[0.95] font-black uppercase italic tracking-tight text-balance"
          >
            Got a track for the airwaves?
          </h2>
          <p className="text-sm leading-relaxed text-foreground/80">Drop it in and hear Emo review it live.</p>
        </div>

        <Link href="/submit" onClick={onEnter} className="submit-cta__button group flex items-center justify-between gap-3 rounded-2xl py-2 pr-2 pl-5 outline-none focus-visible:ring-2 focus-visible:ring-foreground">
          <span className="text-sm font-bold">
            Click <span className="submit-cta__here">HERE</span> to submit your track
          </span>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-background text-foreground transition-transform group-hover:translate-x-1">
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </span>
        </Link>

        <ul className="flex flex-wrap gap-2 font-mono text-[10px] font-bold uppercase tracking-wider">
          <li className="rounded-md border border-primary/60 bg-primary/15 px-2.5 py-1.5 text-foreground">Free to send</li>
          <li className="rounded-md border border-foreground/20 bg-background/40 px-2.5 py-1.5 text-foreground/80">
            Played live on stream
          </li>
        </ul>
      </div>
    </section>
  )
}
