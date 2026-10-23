import type { Metadata } from "next"
import {
  Rss,
  Star,
  UploadCloud,
  Swords,
  MessageCircle,
  Trophy,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { PageHeader } from "@/components/page-header"

export const metadata: Metadata = {
  title: "Feed",
  description: "Live activity from across Emo's Radio — reviews, submissions, and battles.",
}

type FeedType = "review" | "submit" | "battle" | "comment" | "rank"

interface FeedItem {
  id: string
  type: FeedType
  actor: string
  text: string
  time: string
}

const ICONS: Record<FeedType, LucideIcon> = {
  review: Star,
  submit: UploadCloud,
  battle: Swords,
  comment: MessageCircle,
  rank: Trophy,
}

const FEED: FeedItem[] = [
  {
    id: "f1",
    type: "review",
    actor: "Emo",
    text: "scored Saltwater Veins by Nova Decay a 9.6 — Certified Heater.",
    time: "2m",
  },
  {
    id: "f2",
    type: "submit",
    actor: "kyo.wav",
    text: "submitted Neon Bruise to the live queue.",
    time: "6m",
  },
  {
    id: "f3",
    type: "battle",
    actor: "The Arena",
    text: "Glass Cathedral advanced past Saltwater Veins, 52% to 48%.",
    time: "14m",
  },
  {
    id: "f4",
    type: "rank",
    actor: "Nova Decay",
    text: "climbed to #1 on the season leaderboard.",
    time: "31m",
  },
  {
    id: "f5",
    type: "comment",
    actor: "velvetghost",
    text: "left a comment on Concrete Lullaby: \u201cthat bridge is unreal\u201d.",
    time: "48m",
  },
  {
    id: "f6",
    type: "review",
    actor: "Emo",
    text: "scored Hollow Bones by Greyscale a 7.8 — Solid.",
    time: "1h",
  },
  {
    id: "f7",
    type: "submit",
    actor: "saintmaybe",
    text: "submitted Rust & Reverb to the live queue.",
    time: "2h",
  },
]

export default function FeedPage() {
  return (
    <>
      <PageHeader
        icon={Rss}
        eyebrow="Live activity"
        title="The"
        accent="Feed"
        description="Everything happening across the platform in real time — reviews, drops, battles, and call-outs."
      />

      <section className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
        <ol className="flex flex-col gap-3">
          {FEED.map((item) => {
            const Icon = ICONS[item.type]
            return (
              <li
                key={item.id}
                className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/50"
              >
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground text-pretty">
                    <span className="font-semibold">{item.actor}</span>{" "}
                    <span className="text-muted-foreground">{item.text}</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.time} ago</p>
                </div>
              </li>
            )
          })}
        </ol>
      </section>
    </>
  )
}
