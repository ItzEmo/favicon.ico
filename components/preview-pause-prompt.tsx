"use client"

import { Clock, Pause, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PreviewPausePrompt({
  open,
  title,
  onPause,
  onKeepPlaying,
}: {
  open: boolean
  title: string
  onPause: () => void
  onKeepPlaying: () => void
}) {
  if (!open) return null

  return (
    <div
      role="alertdialog"
      aria-labelledby="preview-prompt-title"
      aria-describedby="preview-prompt-desc"
      className="notice-pop fixed right-4 top-20 z-[60] flex w-[calc(100%-2rem)] max-w-xs flex-col gap-3 rounded-2xl border border-accent/50 bg-card/95 p-4 shadow-xl backdrop-blur"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
          <Clock className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p id="preview-prompt-title" className="text-sm font-semibold text-foreground">
            Free line hit 1:30
          </p>
          <p id="preview-prompt-desc" className="truncate text-xs leading-relaxed text-muted-foreground">
            Pause &ldquo;{title}&rdquo;?
          </p>
        </div>
        <button
          type="button"
          onClick={onKeepPlaying}
          aria-label="Dismiss and keep playing"
          className="rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={onPause} className="flex-1 rounded-full text-xs font-bold uppercase tracking-wider">
          <Pause className="size-3.5" aria-hidden="true" />
          Pause
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onKeepPlaying}
          className="flex-1 rounded-full text-xs font-bold uppercase tracking-wider"
        >
          Keep playing
        </Button>
      </div>
    </div>
  )
}
