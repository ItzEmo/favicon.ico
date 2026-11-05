"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, Copy, Dices, ExternalLink, RotateCcw, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { JackpotReel, type JackpotSpin } from "@/components/jackpot-reel"
import { resetFreeSkipWinners, spinFreeSkip } from "@/app/actions/skip-spin"
import { cn } from "@/lib/utils"

type Entrant = { key: string; name: string; title: string }
type Winner = { id: number; winner: string; title: string; createdAt: string }

export function AdminSkipSpin({
  origin,
  entrants,
  winners,
}: {
  origin: string
  entrants: Entrant[]
  winners: Winner[]
}) {
  const router = useRouter()
  const [spin, setSpin] = useState<JackpotSpin | null>(null)
  const [rolling, setRolling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [align, setAlign] = useState<"center" | "left" | "right">("center")
  const [copied, setCopied] = useState(false)

  const overlayUrl = `${origin}/overlay/spin${align === "center" ? "" : `?align=${align}`}`

  function handleSpin() {
    setError(null)
    startTransition(async () => {
      const result = await spinFreeSkip()
      if (!result.ok) {
        setError(result.error)
        return
      }
      setRolling(true)
      setSpin(result.spin)
    })
  }

  function handleReset() {
    if (!window.confirm("Clear all Free Skip winners so everyone can win again?")) return
    startTransition(async () => {
      await resetFreeSkipWinners()
      router.refresh()
    })
  }

  async function copy() {
    await navigator.clipboard.writeText(overlayUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const busy = pending || rolling

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-background/40 p-4 sm:p-6">
          {spin ? (
            <JackpotReel
              key={spin.id}
              spin={spin}
              size="md"
              onDone={() => {
                setRolling(false)
                router.refresh()
              }}
            />
          ) : (
            <div className="flex w-full max-w-md flex-col items-center gap-2 rounded-[2rem] border-4 border-dashed border-jackpot/40 px-6 py-12 text-center">
              <Dices className="size-8 text-jackpot" aria-hidden="true" />
              <p className="text-lg font-black uppercase tracking-tight text-foreground">Ready to spin</p>
              <p className="text-sm text-muted-foreground">
                One random artist from the Free line jumps to the Skip line.
              </p>
            </div>
          )}

          <Button
            type="button"
            size="lg"
            onClick={handleSpin}
            disabled={busy || entrants.length === 0}
            className="h-14 w-full max-w-md rounded-full bg-jackpot text-lg font-black uppercase tracking-wider text-jackpot-foreground hover:bg-jackpot/90"
          >
            <Dices aria-hidden="true" />
            {pending ? "Drawing..." : rolling ? "Spinning..." : "Spin the wheel"}
          </Button>
          {error && (
            <p role="alert" className="text-sm font-semibold text-destructive">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
          <h3 className="flex items-center justify-between text-sm font-bold uppercase tracking-wider text-foreground">
            In the draw
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs tabular-nums text-secondary-foreground">
              {entrants.length}
            </span>
          </h3>
          {entrants.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nobody in the Free line can win right now. Past winners are skipped automatically.
            </p>
          ) : (
            <ul className="hover-scrollbar flex max-h-72 flex-col gap-1 overflow-y-auto pr-1">
              {entrants.map((e) => (
                <li key={e.key} className="flex flex-col rounded-lg px-2 py-1.5 odd:bg-secondary/40">
                  <span className="truncate text-sm font-semibold text-foreground">{e.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{e.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-foreground">
            <Trophy className="size-4 text-jackpot" aria-hidden="true" />
            Winners
          </h3>
          <Button type="button" variant="outline" size="sm" onClick={handleReset} disabled={busy || winners.length === 0}>
            <RotateCcw aria-hidden="true" />
            Reset winners
          </Button>
        </div>
        {winners.length === 0 ? (
          <p className="text-sm text-muted-foreground">No winners yet. Each person can only win once until you reset.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card">
            {winners.map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-semibold text-foreground">{w.winner}</span>
                  <span className="truncate text-xs text-muted-foreground">{w.title}</span>
                </div>
                <time dateTime={w.createdAt} className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {new Date(w.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </time>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Jackpot overlay</h3>
          <p className="text-sm text-muted-foreground">
            Transparent browser source. It stays hidden and only pops up when you spin. Add{" "}
            <code className="font-mono text-xs text-foreground">?preview=1</code> to keep the last spin on screen while
            positioning it in OBS.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Overlay position">
          {(["left", "center", "right"] as const).map((side) => (
            <button
              key={side}
              type="button"
              onClick={() => setAlign(side)}
              aria-pressed={align === side}
              className={cn(
                "rounded-full border border-border px-3 py-1 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors",
                "aria-pressed:border-jackpot aria-pressed:text-foreground",
              )}
            >
              Bottom {side}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            readOnly
            value={overlayUrl}
            aria-label="Jackpot overlay link"
            onFocus={(e) => e.currentTarget.select()}
            className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm text-foreground"
          />
          <div className="flex gap-2">
            <Button type="button" onClick={copy}>
              {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button type="button" variant="outline" onClick={() => window.open(overlayUrl, "_blank", "noopener")}>
              <ExternalLink aria-hidden="true" />
              Open
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
