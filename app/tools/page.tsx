import type { Metadata } from "next"
import {
  Wrench,
  Gauge,
  Waves,
  FileText,
  Music2,
  Mic2,
  Calculator,
  ArrowUpRight,
  SlidersHorizontal,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"

export const metadata: Metadata = {
  title: "Tools",
  description: "Free utilities for producers and artists prepping their next submission.",
}

const TOOLS = [
  {
    icon: SlidersHorizontal,
    name: "Mix & Mastering",
    body: "An exclusive Mix & Master by ItzEmo himself — $30.",
    tag: "Service",
    href: "/mix-master",
  },
  {
    icon: Gauge,
    name: "BPM Detector",
    body: "Upload an audio file and get the tempo, instantly.",
    tag: "Audio",
    href: "/tools/bpm-detector",
  },
  {
    icon: Waves,
    name: "Loudness Check",
    body: "Make sure your master hits streaming LUFS targets.",
    tag: "Mastering",
    href: "/tools/loudness-check",
  },
  {
    icon: Music2,
    name: "Key Finder",
    body: "Detect the key and scale of any track.",
    tag: "Audio",
  },
  {
    icon: FileText,
    name: "Release Checklist",
    body: "Everything to do before you drop a single.",
    tag: "Guide",
    href: "/tools/release-checklist",
  },
  {
    icon: Mic2,
    name: "Vocal Tuner Guide",
    body: "Dial in natural-sounding pitch correction.",
    tag: "Guide",
  },
  {
    icon: Calculator,
    name: "Royalty Estimator",
    body: "Project streaming payouts across platforms.",
    tag: "Business",
  },
]

export default function ToolsPage() {
  return (
    <>
      <PageHeader
        icon={Wrench}
        eyebrow="Free utilities"
        title="Producer"
        accent="Tools"
        description="A growing kit of free utilities to sharpen your sound before it hits the queue."
      />

      <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => (
            <li key={tool.name}>
              <a
                href={tool.href ?? "#top"}
                className="group flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <tool.icon className="size-5" aria-hidden="true" />
                  </span>
                  <ArrowUpRight
                    className="size-4 text-muted-foreground transition-colors group-hover:text-primary"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {tool.name}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground text-pretty">
                    {tool.body}
                  </p>
                </div>
                <span className="mt-auto w-fit rounded-full bg-secondary px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-secondary-foreground">
                  {tool.tag}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
