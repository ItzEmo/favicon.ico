"use client"

import { useActionState, useEffect, useState, useTransition } from "react"
import { ChevronUp, ChevronDown, Trash2, Pencil, Plus, ArrowLeftRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Battle } from "@/lib/content"
import {
  saveBattle,
  deleteBattle,
  moveBattle,
  swapBattleSides,
  type ContentActionState,
} from "@/app/actions/content"

export const fieldClass =
  "w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"

function BattleForm({ battle, onDone }: { battle?: Battle; onDone: () => void }) {
  const [state, action, pending] = useActionState<ContentActionState, FormData>(saveBattle, { ok: false })

  useEffect(() => {
    if (state.ok) onDone()
  }, [state, onDone])

  return (
    <form action={action} className="flex flex-col gap-3 rounded-xl border border-primary/50 bg-card p-4">
      <input type="hidden" name="id" value={battle?.id ?? 0} />
      <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Round
        <input name="round" required maxLength={60} defaultValue={battle?.round ?? "Round of 16"} className={fieldClass} />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        {(["a", "b"] as const).map((side) => (
          <fieldset key={side} className="flex flex-col gap-2 rounded-lg border border-border p-3">
            <legend className="px-1 text-xs font-bold uppercase tracking-wider text-primary">
              {side === "a" ? "Left song" : "Right song"}
            </legend>
            <input
              name={`${side}Title`}
              required
              maxLength={120}
              placeholder="Song title"
              aria-label={`${side === "a" ? "Left" : "Right"} song title`}
              defaultValue={side === "a" ? battle?.aTitle : battle?.bTitle}
              className={fieldClass}
            />
            <input
              name={`${side}Artist`}
              required
              maxLength={80}
              placeholder="Artist"
              aria-label={`${side === "a" ? "Left" : "Right"} artist`}
              defaultValue={side === "a" ? battle?.aArtist : battle?.bArtist}
              className={fieldClass}
            />
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              Votes
              <input
                name={`${side}Votes`}
                type="number"
                min={0}
                step={1}
                defaultValue={(side === "a" ? battle?.aVotes : battle?.bVotes) ?? 0}
                className={cn(fieldClass, "w-28")}
              />
            </label>
          </fieldset>
        ))}
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onDone} className="rounded-full">
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={pending} className="rounded-full font-bold uppercase tracking-wider">
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          {battle ? "Save changes" : "Add battle"}
        </Button>
      </div>
    </form>
  )
}

const iconBtn =
  "flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30"

export function AdminArena({ battles }: { battles: Battle[] }) {
  const [editingId, setEditingId] = useState<number | "new" | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [, startTransition] = useTransition()

  function run(id: number, fn: () => Promise<void>) {
    setBusyId(id)
    startTransition(async () => {
      try {
        await fn()
      } catch (err) {
        console.log("[v0] arena admin error:", (err as Error).message)
      } finally {
        setBusyId(null)
      }
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {battles.length === 0 && editingId !== "new" ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No battles yet. Add the first matchup.
        </p>
      ) : null}

      <ol className="flex flex-col gap-3">
        {battles.map((battle, index) =>
          editingId === battle.id ? (
            <li key={battle.id}>
              <BattleForm battle={battle} onDone={() => setEditingId(null)} />
            </li>
          ) : (
            <li key={battle.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 sm:p-4">
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => run(battle.id, () => moveBattle(battle.id, "up"))}
                  disabled={busyId !== null || index === 0}
                  aria-label={`Move ${battle.aTitle} vs ${battle.bTitle} up`}
                  className="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30"
                >
                  <ChevronUp className="size-4" aria-hidden="true" />
                </button>
                <span className="text-xs font-semibold text-primary">{index + 1}</span>
                <button
                  type="button"
                  onClick={() => run(battle.id, () => moveBattle(battle.id, "down"))}
                  disabled={busyId !== null || index === battles.length - 1}
                  aria-label={`Move ${battle.aTitle} vs ${battle.bTitle} down`}
                  className="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30"
                >
                  <ChevronDown className="size-4" aria-hidden="true" />
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-primary">{battle.round}</p>
                <p className="truncate text-sm font-medium text-foreground">
                  {battle.aTitle} <span className="text-muted-foreground">vs</span> {battle.bTitle}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {battle.aArtist} ({battle.aVotes}) · {battle.bArtist} ({battle.bVotes})
                </p>
              </div>

              {busyId === battle.id ? (
                <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden="true" />
              ) : null}

              <button
                type="button"
                onClick={() => run(battle.id, () => swapBattleSides(battle.id))}
                disabled={busyId !== null}
                aria-label={`Swap sides for ${battle.aTitle} vs ${battle.bTitle}`}
                title="Swap left and right songs"
                className={iconBtn}
              >
                <ArrowLeftRight className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setEditingId(battle.id)}
                disabled={busyId !== null}
                aria-label={`Edit ${battle.aTitle} vs ${battle.bTitle}`}
                className={iconBtn}
              >
                <Pencil className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Remove "${battle.aTitle} vs ${battle.bTitle}" from the Arena?`)) {
                    run(battle.id, () => deleteBattle(battle.id))
                  }
                }}
                disabled={busyId !== null}
                aria-label={`Remove ${battle.aTitle} vs ${battle.bTitle}`}
                className={cn(iconBtn, "hover:bg-destructive/15 hover:text-destructive")}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </li>
          ),
        )}
      </ol>

      {editingId === "new" ? (
        <BattleForm onDone={() => setEditingId(null)} />
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => setEditingId("new")}
          className="w-fit rounded-full text-xs font-bold uppercase tracking-wider"
        >
          <Plus className="size-4" aria-hidden="true" />
          Add battle
        </Button>
      )}
    </div>
  )
}
