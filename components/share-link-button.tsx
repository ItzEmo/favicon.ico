"use client"

import { useState } from "react"
import { Check, Share2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function ShareLinkButton({ title, className }: { title: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  async function share() {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
        return
      } catch (error) {
        if ((error as Error).name === "AbortError") return
      }
    }
    await navigator.clipboard.writeText(url)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label={copied ? "Link copied" : "Share this page"}
      className={cn(
        "flex size-10 items-center justify-center rounded-full border border-foreground/20 bg-background/40 text-foreground backdrop-blur-md transition-colors hover:bg-background/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        className,
      )}
    >
      {copied ? <Check className="size-4" aria-hidden="true" /> : <Share2 className="size-4" aria-hidden="true" />}
    </button>
  )
}
