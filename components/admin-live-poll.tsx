"use client"

import { useState, useTransition } from "react"
import useSWR from "swr"
import { Check, Copy, ExternalLink, Play, Square, Vote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { castTestVote, endLivePoll, startLivePoll } from "@/app/actions/live-poll"

type PollSummary = { id: number; trackTitle: string; avg: number; count: number } | null

const fetcher = (url: string) => fetch(url, { cache: "no-store" }).then((r) => r.json())

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="flex gap-2">
        <input
          readOnly
          value={value}
          aria-label={label}
          onFocus={(e) => e.currentTarget.select()}
          className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 font-mono text-xs text-foreground"
        />
        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label={`Copy ${label}`}
          onClick={async () => {
            await navigator.clipboard.writeText(value)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          }}
        >
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        </Button>
      </div>
    </div>
  )
}

export function AdminLivePoll({ origin, voteKey }: { origin: string; voteKey: string }) {
  const { data, mutate } = useSWR<{ poll: PollSummary }>("/api/live-poll", fetcher, { refreshInterval: 3000 })
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const poll = data?.poll ?? null

  const overlayUrl = `${origin}/overlay/poll`
  const webhookUrl = `${origin}/api/live-poll/vote?key=${voteKey}&user={username}&comment={comment}`

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (!result.ok) setError(result.error ?? "Something went wrong")
      await mutate()
    })
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {poll ? "Poll open" : "No poll running"}
          </span>
          <span className="truncate font-semibold text-foreground">
            {poll
              ? `${poll.trackTitle} · ${poll.count ? poll.avg.toFixed(1) : "–"} avg · ${poll.count} votes`
              : "Start a poll for the track on air"}
          </span>
        </div>
        <div className="flex gap-2">
          {poll && (
            <Button type="button" variant="outline" disabled={pending} onClick={() => run(endLivePoll)}>
              <Square aria-hidden="true" />
              End poll
            </Button>
          )}
          <Button type="button" disabled={pending} onClick={() => run(startLivePoll)}>
            <Play aria-hidden="true" />
            {poll ? "Restart on current track" : "Start poll"}
          </Button>
        </div>
      </div>

      {poll && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <Vote className="size-3.5" aria-hidden="true" />
            Test vote
          </span>
          {[1, 3, 5, 7, 8, 10].map((n) => (
            <Button
              key={n}
              type="button"
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() => run(() => castTestVote(n))}
            >
              {n}
            </Button>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <CopyField label="Poll overlay (Browser Source)" value={overlayUrl} />
          </div>
          <Button type="button" size="icon" variant="outline" aria-label="Open poll overlay" onClick={() => window.open(overlayUrl, "_blank", "noopener")}>
            <ExternalLink aria-hidden="true" />
          </Button>
        </div>
        <CopyField label="Chat vote webhook (keep private)" value={webhookUrl} />
        <p className="text-xs leading-relaxed text-muted-foreground">
          TikTok doesn&apos;t let websites read live chat directly, so votes come in through a chat tool like
          TikFinity or Streamer.bot. Set it to call this webhook on every chat comment, replacing{" "}
          <code className="font-mono">{"{username}"}</code> and <code className="font-mono">{"{comment}"}</code> with
          its own placeholders. Viewers type a number from 1 to 10, one vote each (a new vote replaces their old one),
          and every vote is added to the Ranks leaderboard.
        </p>
      </div>
    </div>
  )
}
