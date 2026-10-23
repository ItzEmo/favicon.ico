"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { rateTrack } from "@/app/actions/ratings"

export interface RatingsData {
  signedIn: boolean
  summaries: Record<string, { avg: number; count: number }>
  mine: Record<string, number>
}

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export function TrackRating({
  trackId,
  title,
  ratings,
  onRated,
}: {
  trackId: string
  title: string
  ratings: RatingsData | undefined
  onRated: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [optimistic, setOptimistic] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const summary = ratings?.summaries[trackId]
  const mine = optimistic ?? ratings?.mine[trackId] ?? null

  function rate(score: number) {
    setError(null)
    setOptimistic(score)
    startTransition(async () => {
      const res = await rateTrack(trackId, score)
      if (!res.ok) {
        setOptimistic(null)
        setError(res.error ?? "Could not save")
      } else {
        onRated()
      }
    })
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-muted-foreground">
          <Star className="size-3.5 text-primary" aria-hidden="true" />
          {mine ? `Your rating: ${mine}` : "Rate this track"}
        </span>
        <span className="text-muted-foreground">
          {summary ? (
            <>
              <span className="font-semibold text-foreground">{summary.avg.toFixed(1)}</span> avg &middot;{" "}
              {summary.count} {summary.count === 1 ? "vote" : "votes"}
            </>
          ) : (
            "No votes yet"
          )}
        </span>
      </div>

      {ratings && !ratings.signedIn ? (
        <p className="text-xs text-muted-foreground">
          <Link href="/sign-in" className="font-semibold text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>{" "}
          to rate tracks and push artists up the Ranks.
        </p>
      ) : (
        <div role="radiogroup" aria-label={`Rate ${title} from 1 to 10`} className="flex gap-1">
          {SCORES.map((score) => {
            const selected = mine === score
            const filled = mine !== null && score <= mine
            return (
              <button
                key={score}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={`${score} out of 10`}
                disabled={pending || !ratings}
                onClick={() => rate(score)}
                className={cn(
                  "flex h-8 min-w-0 flex-1 items-center justify-center rounded-md border text-xs font-bold transition-colors disabled:opacity-60",
                  filled
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/60 hover:text-foreground",
                )}
              >
                {score}
              </button>
            )
          })}
        </div>
      )}

      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
