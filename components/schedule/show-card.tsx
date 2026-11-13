import { BatteryCharging, Gamepad2, Mic, Music, Radio, Star, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ShowIcon, ShowType } from "@/lib/schedule-types"

export const SHOW_ICON_MAP: Record<ShowIcon, LucideIcon> = {
  gamepad: Gamepad2,
  music: Music,
  mic: Mic,
  radio: Radio,
  star: Star,
}

interface ShowCardProps {
  show: ShowType
  compact?: boolean
  dimmed?: boolean
  changed?: boolean
  onClick?: () => void
  label: string
}

export function ShowCard({ show, compact, dimmed, changed, onClick, label }: ShowCardProps) {
  const Icon = SHOW_ICON_MAP[show.icon]
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      data-color={show.color}
      data-dim={dimmed ? "true" : undefined}
      className={cn(
        "sched-card group relative flex h-full w-full flex-col items-center justify-between gap-2 rounded-2xl text-center focus-visible:outline-none",
        compact ? "px-3 py-3" : "px-2 py-4",
      )}
    >
      {changed ? (
        <span className="absolute -top-2 right-2 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-background">
          Special
        </span>
      ) : null}
      <Icon
        className={cn("sched-card__icon shrink-0", compact ? "size-8" : "size-12")}
        strokeWidth={1.75}
        aria-hidden="true"
      />
      <span className="sched-card__name text-sm font-black leading-tight text-balance">{show.name}</span>
      {show.tagline ? (
        <span className="text-xs leading-snug text-muted-foreground text-pretty">{show.tagline}</span>
      ) : null}
    </button>
  )
}

export function RechargeCard({ note, compact, onClick, label }: { note?: string | null; compact?: boolean; onClick?: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "sched-recharge flex h-full w-full flex-col items-center justify-center gap-2 rounded-2xl text-center focus-visible:outline-none",
        compact ? "px-3 py-3" : "px-2 py-6",
      )}
    >
      <BatteryCharging className={cn("text-muted-foreground", compact ? "size-7" : "size-10")} strokeWidth={1.5} aria-hidden="true" />
      <span className="text-sm font-black uppercase tracking-wider text-muted-foreground">Recharge</span>
      {note ? <span className="text-xs leading-snug text-muted-foreground text-pretty">{note}</span> : null}
    </button>
  )
}
