import Image from "next/image"
import Link from "next/link"
import { Zap, UserPlus, Users, BadgeCheck, Tv, ChevronDown } from "lucide-react"
import { LiveNowBadge } from "@/components/live-now-badge"
import { SessionSubmissionsCounter } from "@/components/session-submissions-counter"

// "BUILT FOR THE COMMUNITY" rendered with alternating neon tones for a flickering-sign feel.
const TITLE_WORDS: { text: string; tones: string[] }[] = [
  { text: "BUILT", tones: ["text-purple-400", "text-violet-500", "text-fuchsia-300", "text-violet-500", "text-fuchsia-500"] },
  { text: "FOR", tones: ["text-fuchsia-300", "text-purple-400", "text-violet-500"] },
  { text: "THE", tones: ["text-violet-500", "text-fuchsia-300", "text-purple-400"] },
  { text: "COMMUNITY", tones: ["text-fuchsia-500", "text-violet-500", "text-fuchsia-300", "text-purple-400", "text-violet-500", "text-fuchsia-300", "text-purple-400", "text-fuchsia-500", "text-violet-500"] },
]

const FEATURES = [
  { icon: Users, label: "Artists from every genre" },
  { icon: BadgeCheck, label: "The truth. Every time." },
  { icon: Tv, label: "Live on TikTok daily" },
]

export function HomeHero() {
  return (
    <section className="relative flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center overflow-hidden bg-background px-4 py-14 text-center">
      {/* grid + glow backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(168,85,247,0.09) 1px, transparent 1px), linear-gradient(to bottom, rgba(168,85,247,0.09) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black 40%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black 40%, transparent 100%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 h-[38rem] w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-600/20 blur-[120px]"
      />

      <div className="relative flex w-full max-w-3xl flex-col items-center gap-6">
        {/* Logo */}
        <Image
          src="/emo-neon-logo.png"
          alt="Emo's Radio"
          width={597}
          height={575}
          priority
          className="neon-shine h-auto w-[min(80vw,420px)]"
        />

        {/* Title */}
        <h1 className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-2xl font-black uppercase tracking-[0.35em] sm:text-4xl">
          {TITLE_WORDS.map((word) => (
            <span key={word.text} className="inline-flex">
              {word.text.split("").map((ch, i) => (
                <span key={i} className={word.tones[i % word.tones.length]}>
                  {ch}
                </span>
              ))}
            </span>
          ))}
        </h1>

        {/* Live badge */}
        <LiveNowBadge />

        {/* Submissions counter */}
        <SessionSubmissionsCounter />

        {/* Tagline */}
        <div className="flex flex-col gap-1.5">
          <p className="text-pretty text-lg text-neutral-300 sm:text-xl">
            Drop your track. Emo listens live — <span className="font-semibold text-fuchsia-400">no sugarcoating</span>, no industry games.
          </p>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-purple-400">Zero filter, all honesty</p>
          <p className="text-sm text-neutral-500">
            Real ears. <span className="font-semibold text-neutral-300">Real critique.</span> Real time.
          </p>
        </div>

        {/* CTAs */}
        <div className="mt-2 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <Link
            href="/submit"
            className="group relative flex items-center gap-3 rounded-2xl border border-purple-500/40 bg-gradient-to-b from-neutral-800 to-black px-7 py-3.5 text-left shadow-[0_0_35px_rgba(168,85,247,0.25)] transition hover:border-fuchsia-400/60 hover:shadow-[0_0_45px_rgba(217,70,239,0.4)]"
          >
            <Zap className="size-6 fill-fuchsia-300 text-fuchsia-300" aria-hidden="true" />
            <span className="flex flex-col leading-tight">
              <span className="text-base font-extrabold uppercase tracking-wider text-white">Enter Studio</span>
              <span className="text-[0.7rem] font-bold uppercase tracking-widest text-fuchsia-400">Submit your track</span>
            </span>
          </Link>
          <Link
            href="/sign-in"
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-neutral-200 transition hover:border-white/30 hover:bg-white/10"
          >
            <UserPlus className="size-4" aria-hidden="true" />
            Join Free
          </Link>
        </div>

        {/* Feature strip */}
        <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
          {FEATURES.map((f, i) => (
            <li key={f.label} className="flex items-center gap-3">
              {i > 0 ? <span className="hidden size-1 rounded-full bg-purple-500/60 sm:inline-block" aria-hidden="true" /> : null}
              <span className="flex items-center gap-2">
                <f.icon className="size-3.5 text-fuchsia-400" aria-hidden="true" />
                {f.label}
              </span>
            </li>
          ))}
        </ul>

        {/* Explore cue */}
        <div className="mt-6 flex flex-col items-center gap-1 text-[0.65rem] font-bold uppercase tracking-[0.4em] text-purple-400/70">
          Explore
          <ChevronDown className="size-4 animate-bounce" aria-hidden="true" />
        </div>
      </div>
    </section>
  )
}
