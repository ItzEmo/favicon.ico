"use client"

import { useState } from "react"
import { Check, Copy, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AdminOverlayLink({ origin }: { origin: string }) {
  const [align, setAlign] = useState<"left" | "right">("left")
  const [copied, setCopied] = useState(false)
  const url = `${origin}/overlay${align === "right" ? "?align=right" : ""}`

  async function copy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2" role="group" aria-label="Overlay position">
        {(["left", "right"] as const).map((side) => (
          <button
            key={side}
            type="button"
            onClick={() => setAlign(side)}
            aria-pressed={align === side}
            className="rounded-full border border-border px-3 py-1 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors aria-pressed:border-primary aria-pressed:text-foreground"
          >
            Bottom {side}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          readOnly
          value={url}
          aria-label="Overlay link"
          onFocus={(e) => e.currentTarget.select()}
          className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm text-foreground"
        />
        <div className="flex gap-2">
          <Button type="button" onClick={copy}>
            {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button type="button" variant="outline" onClick={() => window.open(url, "_blank", "noopener")}>
            <ExternalLink aria-hidden="true" />
            Open
          </Button>
        </div>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        In OBS or Streamlabs, add a Browser Source with this link at 1920 × 1080. The background is
        transparent and it updates on its own every few seconds.
      </p>
    </div>
  )
}
