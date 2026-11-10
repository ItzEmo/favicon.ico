import { CrownBadge } from "@/components/artist-name"
import { cn } from "@/lib/utils"

interface CrownSkipBannerProps {
  available: boolean
  skipsOpen: boolean
  resetsAt: string | null
  selected: boolean
  onUse: () => void
}

function formatReset(iso: string | null) {
  if (!iso) return "next week"
  return new Date(iso).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })
}

export function CrownSkipBanner({ available, skipsOpen, resetsAt, selected, onUse }: CrownSkipBannerProps) {
  const ready = available && skipsOpen
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between",
        ready ? "border-amber-400/60 bg-amber-400/10" : "border-border bg-background/60",
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-400/15">
          <CrownBadge className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold uppercase tracking-wider text-foreground">Crown Perk</p>
          <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
            {!available
              ? `You used this week's free Skip. Your next one unlocks ${formatReset(resetsAt)}.`
              : !skipsOpen
                ? "You have 1 free Skip this week. The Skip line is closed right now."
                : "You have 1 free Skip this week. Submit in the Skip line at no cost."}
          </p>
        </div>
      </div>
      {ready ? (
        <button
          type="button"
          onClick={onUse}
          aria-pressed={selected}
          className={cn(
            "shrink-0 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors",
            selected
              ? "bg-amber-400 text-background"
              : "border border-amber-400/60 text-foreground hover:bg-amber-400/15",
          )}
        >
          {selected ? "Free Skip Selected" : "Use Free Skip"}
        </button>
      ) : null}
    </div>
  )
}
