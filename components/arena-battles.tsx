"use client"

import { useState } from "react"
import { Check, Swords } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Battle } from "@/lib/content"

function pct(a: number, b: number) {
  const total = a + b || 1
  return Math.round((a / total) * 100)
}

function Side({
  title,
  artist,
  percent,
  voted,
  showResult,
  align,
  tone,
  onVote,
}: {
  title: string
  artist: string
  percent: number
  voted: boolean
  showResult: boolean
  align: "left" | "right"
  tone: "primary" | "accent"
  onVote: () => void
}) {
  return (
    <button
      type="button"
      onClick={onVote}
      aria-pressed={voted}
      className={cn(
        "rounded-2xl border p-4 transition-colors",
        align === "right" ? "text-right" : "text-left",
        voted ? "border-primary bg-primary/10" : "border-border bg-background/40 hover:border-primary/50",
      )}
    >
      <span
        className={cn(
          "flex items-center gap-1.5 text-sm font-semibold text-foreground",
          align === "right" && "justify-end",
        )}
      >
        {voted ? <Check className="size-4 text-primary" aria-hidden="true" /> : null}
        {title}
      </span>
      <span className="mt-0.5 block text-xs text-muted-foreground">{artist}</span>
      {showResult ? (
        <span
          className={cn(
            "mt-2 block text-lg font-extrabold",
            tone === "primary" ? "text-primary" : "text-accent",
          )}
        >
          {percent}%
        </span>
      ) : null}
    </button>
  )
}

export function ArenaBattles({ battles }: { battles: Battle[] }) {
  const [votes, setVotes] = useState<Record<number, "a" | "b">>({})

  if (battles.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
        <Swords className="size-8 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-medium text-foreground">No battles right now</p>
        <p className="max-w-xs text-sm text-muted-foreground">The next round is being drawn. Check back soon.</p>
      </div>
    )
  }

  return (
    <>
      {battles.map((battle) => {
        const voted = votes[battle.id]
        const aVotes = battle.aVotes + (voted === "a" ? 1 : 0)
        const bVotes = battle.bVotes + (voted === "b" ? 1 : 0)
        const aPct = pct(aVotes, bVotes)
        const bPct = 100 - aPct
        const cast = (side: "a" | "b") => setVotes((prev) => ({ ...prev, [battle.id]: side }))

        return (
          <div
            key={battle.id}
            className="rounded-3xl border border-border bg-card/80 p-5 shadow-xl shadow-primary/5 sm:p-6"
          >
            <p className="mb-4 text-center text-xs font-bold uppercase tracking-widest text-primary">
              {battle.round}
            </p>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-4">
              <Side
                title={battle.aTitle}
                artist={battle.aArtist}
                percent={aPct}
                voted={voted === "a"}
                showResult={Boolean(voted)}
                align="left"
                tone="primary"
                onVote={() => cast("a")}
              />
              <span className="flex size-10 items-center justify-center rounded-full border border-border bg-secondary text-xs font-extrabold uppercase text-secondary-foreground">
                VS
              </span>
              <Side
                title={battle.bTitle}
                artist={battle.bArtist}
                percent={bPct}
                voted={voted === "b"}
                showResult={Boolean(voted)}
                align="right"
                tone="accent"
                onVote={() => cast("b")}
              />
            </div>
            {voted ? (
              <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-secondary">
                <div className="bg-primary" style={{ width: `${aPct}%` }} />
                <div className="bg-accent" style={{ width: `${bPct}%` }} />
              </div>
            ) : (
              <p className="mt-4 text-center text-xs text-muted-foreground">Tap a track to cast your vote</p>
            )}
          </div>
        )
      })}
    </>
  )
}
