"use client"

import { useState } from "react"
import useSWR from "swr"
import { ListMusic, Play, Radio, Loader2 } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { QueueList } from "@/components/queue-list"
import { CheckoutDialog, type CheckoutSession } from "@/components/checkout-dialog"
import { PaymentReturnNotice } from "@/components/payment-return-notice"
import { TikTokLiveCard } from "@/components/tiktok-live-card"
import { TrackRating, type RatingsData } from "@/components/track-rating"
import { ArtistName } from "@/components/artist-name"
import { sourceLabels, type QueueItem } from "@/components/track-types"
import { LINES, formatPrice, type LineId } from "@/lib/lines"
import {
  createSkipCheckout,
  createBoostCheckout,
} from "@/app/actions/submissions"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function QueuePage() {
  const { data, isLoading, mutate } = useSWR<{ nowPlaying: QueueItem | null; tracks: QueueItem[] }>(
    "/api/queue",
    fetcher,
    { refreshInterval: 5000 },
  )

  const { data: liveStatus } = useSWR<{ live: boolean }>("/api/live", fetcher, { refreshInterval: 15000 })
  const isLive = liveStatus?.live ?? false

  const nowPlaying = data?.nowPlaying ?? null
  const upNext = data?.tracks ?? []

  const ratingIds = [nowPlaying?.trackId, ...upNext.map((t) => t.trackId)].filter(Boolean).join(",")
  const { data: ratings, mutate: mutateRatings } = useSWR<RatingsData>(
    data ? `/api/ratings?ids=${encodeURIComponent(ratingIds)}` : null,
    fetcher,
    { refreshInterval: 10000, keepPreviousData: true },
  )

  const [checkout, setCheckout] = useState<CheckoutSession | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)

  async function handleSkip(item: QueueItem, target: LineId) {
    setPendingId(item.trackId)
    try {
      const { clientSecret, sessionId, publishableKey } = await createSkipCheckout(item.trackId, target)
      setCheckout({
        clientSecret,
        sessionId,
        publishableKey,
        title: `Skip to ${LINES[target].shortName} — ${formatPrice(LINES[target].priceInCents)}`,
      })
    } catch (err) {
      console.log("[v0] skip checkout error:", (err as Error).message)
    } finally {
      setPendingId(null)
    }
  }

  async function handleBoost(item: QueueItem) {
    setPendingId(item.trackId)
    try {
      const { clientSecret, sessionId, publishableKey } = await createBoostCheckout(item.trackId)
      setCheckout({
        clientSecret,
        sessionId,
        publishableKey,
        title: `Boost "${item.title}" — $5`,
      })
    } catch (err) {
      console.log("[v0] boost checkout error:", (err as Error).message)
    } finally {
      setPendingId(null)
    }
  }

  function handlePaymentSuccess() {
    setCheckout(null)
    mutate()
  }

  return (
    <>
      <PageHeader
        icon={ListMusic}
        eyebrow={isLive ? "Live on air" : "Off air"}
        title="The"
        accent="Queue"
        description="Every track lined up for tonight's session. Right after Now Playing comes the Skip+ line, then Skip, then the Free line. A Boost lifts a track to the top of its line — and boosting a boosted Free track moves it into Skip."
      />
      <PaymentReturnNotice />

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row-reverse lg:items-start">
      <aside className="w-full max-w-xs self-center empty:hidden lg:sticky lg:top-24 lg:w-72 lg:shrink-0 lg:self-start">
        <TikTokLiveCard nowPlaying={nowPlaying} />
      </aside>
      <section className="mx-auto w-full max-w-2xl min-w-0 flex-1">
        <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-primary/40 bg-primary/10 p-4 sm:p-5">
        <div className="flex items-center gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Play className="size-6" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
              <Radio className="size-3.5" aria-hidden="true" />
              Now Playing
            </span>
            {isLoading ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Loading the queue...
              </p>
            ) : nowPlaying ? (
              <>
                <p className="truncate text-base font-semibold text-foreground">
                  {nowPlaying.title}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  submitted by <ArtistName name={nowPlaying.submittedBy} userId={nowPlaying.userId} /> &middot; {sourceLabels[nowPlaying.source]}
                </p>
              </>
            ) : (
              <p className="truncate text-base font-semibold text-foreground">
                Nothing playing yet
              </p>
            )}
          </div>
        </div>
        {nowPlaying ? (
          <div className="border-t border-primary/30 pt-4">
            <TrackRating
              key={nowPlaying.trackId}
              trackId={nowPlaying.trackId}
              title={nowPlaying.title}
              ratings={ratings}
              onRated={() => mutateRatings()}
            />
          </div>
        ) : null}
        </div>

        <QueueList
          tracks={upNext}
          onSkip={handleSkip}
          onBoost={handleBoost}
          pendingId={pendingId}
          ratings={ratings}
          onRated={() => mutateRatings()}
        />
      </section>
      </div>

      <CheckoutDialog
        session={checkout}
        onClose={() => setCheckout(null)}
        onSuccess={handlePaymentSuccess}
      />
    </>
  )
}
