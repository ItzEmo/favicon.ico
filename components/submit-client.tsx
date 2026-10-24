"use client"

import { useState } from "react"
import Link from "next/link"
import { UploadCloud, CheckCircle2, Clock, Eye, Sparkles, Link2, FileAudio, Lock } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { SubmitForm } from "@/components/submit-form"
import { FileUploadForm } from "@/components/file-upload-form"
import { LineSelector } from "@/components/line-selector"
import { CheckoutDialog, type CheckoutSession } from "@/components/checkout-dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { type Track } from "@/components/track-types"
import { LINES, LINE_ORDER, formatPrice, type LineId } from "@/lib/lines"
import { isLineOpen, type QueueStatus } from "@/lib/queue-status"
import {
  createFreeSubmission,
  createPaidSubmission,
} from "@/app/actions/submissions"

const GUIDELINES = [
  {
    icon: Eye,
    title: "Honest Reviews",
    body: "We rate what we hear. No pay-to-win praise — just a faster spot in line.",
  },
  {
    icon: Clock,
    title: "Lines Are Ordered",
    body: "Skip+ plays ahead of everyone, then Skip, then Boost, then the Free line.",
  },
  {
    icon: Sparkles,
    title: "Link Or File",
    body: "Paste from Spotify, YouTube, SoundCloud, or upload a WAV, MP3, or M4A.",
  },
]

export function SubmitClient({ status }: { status: QueueStatus }) {
  const closedLines = LINE_ORDER.filter((id) => !isLineOpen(status, id))
  const firstOpenLine = LINE_ORDER.find((id) => isLineOpen(status, id)) ?? "free"
  const allClosed = closedLines.length === LINE_ORDER.length
  const [submitted, setSubmitted] = useState<{ track: Track; line: LineId } | null>(null)
  const [method, setMethod] = useState<"link" | "file">("link")
  const [line, setLine] = useState<LineId>(status.freeOpen ? "free" : firstOpenLine)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkout, setCheckout] = useState<CheckoutSession | null>(null)
  const [pendingTrack, setPendingTrack] = useState<Track | null>(null)

  async function handleTrackReady(track: Track) {
    setError(null)
    setPending(true)
    try {
      if (line === "free") {
        await createFreeSubmission({
          trackId: track.id,
          url: track.url,
          title: track.title,
          submittedBy: track.submittedBy,
          source: track.source,
          audioPathname: track.audioPathname ?? null,
        })
        setSubmitted({ track, line })
      } else {
        const { clientSecret, sessionId } = await createPaidSubmission(
          {
            trackId: track.id,
            url: track.url,
            title: track.title,
            submittedBy: track.submittedBy,
            source: track.source,
            audioPathname: track.audioPathname ?? null,
          },
          line,
        )
        setPendingTrack(track)
        setCheckout({
          clientSecret,
          sessionId,
          title: `${LINES[line].name} — ${formatPrice(LINES[line].priceInCents)}`,
        })
      }
    } catch (err) {
      console.log("[v0] submission error:", (err as Error).message)
      setError("Something went wrong starting your submission. Please try again.")
    } finally {
      setPending(false)
    }
  }

  function handlePaymentSuccess() {
    setCheckout(null)
    if (pendingTrack) {
      setSubmitted({ track: pendingTrack, line })
      setPendingTrack(null)
    }
  }

  const paidLabel =
    line === "free"
      ? "Submit To Free Line"
      : `Pay ${formatPrice(LINES[line].priceInCents)} — ${LINES[line].shortName} Line`

  return (
    <>
      <PageHeader
        icon={UploadCloud}
        eyebrow="Drop your track"
        title="Submit A"
        accent="Track"
        description="Pick a line, paste a link or upload a file, and your track joins the live queue. Pay to skip ahead — or stay free and ride the wait."
      />

      <section className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-3xl border border-border bg-card/80 p-6 shadow-2xl shadow-primary/10 sm:p-8">
          {submitted ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <CheckCircle2 className="size-7" aria-hidden="true" />
              </span>
              <h2 className="text-xl font-extrabold uppercase tracking-tight text-foreground">
                {submitted.line === "free" ? "You're In The Queue" : "Payment Confirmed"}
              </h2>
              <p className="max-w-sm text-sm text-muted-foreground text-pretty">
                <span className="font-semibold text-foreground">{submitted.track.title}</span>{" "}
                was added to the{" "}
                <span className="font-semibold text-primary">
                  {LINES[submitted.line].shortName} line
                </span>
                . Head to the queue to watch your spot.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <Link href="/queue">
                  <Button size="sm" className="rounded-full text-xs font-bold uppercase tracking-wider">
                    View The Queue
                  </Button>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(null)
                    setLine(status.freeOpen ? "free" : firstOpenLine)
                  }}
                  className="text-sm font-bold uppercase tracking-wider text-primary hover:underline"
                >
                  Submit another
                </button>
              </div>
            </div>
          ) : allClosed ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
                <Lock className="size-7" aria-hidden="true" />
              </span>
              <h2 className="text-xl font-extrabold uppercase tracking-tight text-foreground">
                The Queue Is Closed
              </h2>
              <p className="max-w-sm text-sm text-muted-foreground text-pretty">
                Submissions are paused right now. Check back when the next session opens.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <LineSelector value={line} onChange={setLine} closedLines={closedLines} />

              <div className="h-px w-full bg-border" />

              <div
                role="tablist"
                aria-label="Submission method"
                className="grid grid-cols-2 gap-1 rounded-full border border-border bg-background/60 p-1"
              >
                {(
                  [
                    { key: "link", label: "Paste a Link", icon: Link2 },
                    { key: "file", label: "Upload a File", icon: FileAudio },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={method === tab.key}
                    onClick={() => setMethod(tab.key)}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors",
                      method === tab.key
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <tab.icon className="size-4" aria-hidden="true" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {method === "link" ? (
                <SubmitForm onSubmit={handleTrackReady} submitLabel={paidLabel} pending={pending} />
              ) : (
                <FileUploadForm onSubmit={handleTrackReady} submitLabel={paidLabel} pending={pending} />
              )}

              {error ? (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              ) : null}
            </div>
          )}
        </div>

        <ul className="flex flex-col gap-4">
          {GUIDELINES.map((g) => (
            <li
              key={g.title}
              className="flex items-start gap-3 rounded-2xl border border-border bg-card/50 p-5"
            >
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <g.icon className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{g.title}</p>
                <p className="text-sm text-muted-foreground text-pretty">{g.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <CheckoutDialog
        session={checkout}
        onClose={() => setCheckout(null)}
        onSuccess={handlePaymentSuccess}
      />
    </>
  )
}
