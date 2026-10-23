import type { Metadata } from "next"
import { Info, Waves } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { LoudnessChecker } from "@/components/loudness-checker"

export const metadata: Metadata = {
  title: "Loudness Check",
  description:
    "Measure integrated LUFS and true peak for your single, then run the artist loudness release checklist.",
}

const TARGETS = [
  {
    label: "LUFS-I target",
    value: "-9 to -14 LUFS",
    body: "Approximately, for many modern releases, depending on style.",
  },
  {
    label: "True peak",
    value: "≤ -1.0 dBTP",
    body: "Consider -2.0 dBTP for louder masters to reduce encoding risks.",
  },
]

const FL_STUDIO_STEPS = [
  "Place a loudness meter at the end of the master chain.",
  "Play the entire song from start to finish.",
  "Record integrated LUFS and maximum true peak.",
  "Export the final WAV and analyze it again.",
  "Make sure the song sounds clean and balanced.",
]

export default function LoudnessCheckPage() {
  return (
    <>
      <PageHeader
        icon={Waves}
        eyebrow="Mastering"
        title="Loudness"
        accent="Checker"
        description="Artist single loudness release checker. Drop in your master and get a quality score, with every checklist item graded automatically."
      />

      <section className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6">
        <ul className="grid gap-4 sm:grid-cols-2">
          {TARGETS.map((t) => (
            <li key={t.label} className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.label}</p>
              <p className="font-mono text-2xl font-black text-primary">{t.value}</p>
              <p className="text-sm leading-relaxed text-muted-foreground text-pretty">{t.body}</p>
            </li>
          ))}
        </ul>

        <LoudnessChecker />

        <section aria-labelledby="fl-heading" className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 id="fl-heading" className="text-lg font-bold text-foreground">
            FL Studio workflow
          </h2>
          <ol className="flex flex-col gap-3">
            {FL_STUDIO_STEPS.map((step, i) => (
              <li key={step} className="flex items-start gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 font-mono text-sm font-bold text-primary">
                  {i + 1}
                </span>
                <span className="pt-0.5 text-sm leading-relaxed text-foreground">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <aside className="flex gap-3 rounded-2xl border border-border bg-secondary/40 p-5">
          <Info className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
            <span className="font-semibold text-foreground">Note:</span> LUFS targets are guidelines, not mandatory
            streaming requirements. The best master preserves the song&apos;s intended dynamics and sounds clean.
          </p>
        </aside>
      </section>
    </>
  )
}
