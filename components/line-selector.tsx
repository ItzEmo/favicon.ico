"use client"

import { Check, Zap, Rocket, Radio, ChevronsUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { LINE_ORDER, LINES, formatPrice, type LineId } from "@/lib/lines"

const LINE_ICONS: Record<LineId, typeof Radio> = {
  skipplus: Rocket,
  skip: Zap,
  boost: ChevronsUp,
  free: Radio,
}

interface LineSelectorProps {
  value: LineId
  onChange: (line: LineId) => void
  closedLines?: LineId[]
}

export function LineSelector({ value, onChange, closedLines = [] }: LineSelectorProps) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-sm font-medium text-foreground">
        Choose your line
      </legend>
      <div className="flex flex-col gap-3">
        {LINE_ORDER.map((id) => {
          const line = LINES[id]
          const Icon = LINE_ICONS[id]
          const closed = closedLines.includes(id)
          const selected = value === id && !closed
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={closed}
              onClick={() => onChange(id)}
              className={cn(
                "flex items-start gap-4 rounded-2xl border p-4 text-left transition-colors",
                closed
                  ? "cursor-not-allowed border-border bg-background/40 opacity-50"
                  : selected
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background/60 hover:border-primary/50",
              )}
            >
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl",
                  selected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm font-bold uppercase tracking-wide text-foreground">
                    {line.shortName} Line
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-bold",
                      id === "free"
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-primary/20 text-primary",
                    )}
                  >
                    {id === "free" ? "Free" : formatPrice(line.priceInCents)}
                  </span>
                  {closed ? (
                    <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-bold uppercase text-destructive">
                      Closed
                    </span>
                  ) : null}
                </span>
                <span className="mt-1 block text-sm text-muted-foreground text-pretty">
                  {line.blurb}
                </span>
              </span>

              <span
                className={cn(
                  "mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border",
                  selected ? "border-primary bg-primary text-primary-foreground" : "border-border",
                )}
                aria-hidden="true"
              >
                {selected ? <Check className="size-3.5" /> : null}
              </span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
