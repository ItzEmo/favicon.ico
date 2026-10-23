import { MessagesSquare, Users, Bell } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const PERKS = [
  {
    icon: Bell,
    title: "Live Show Pings",
    body: "Get notified the moment we go on air.",
  },
  {
    icon: Users,
    title: "Meet the Artists",
    body: "Connect with other producers and hosts.",
  },
  {
    icon: MessagesSquare,
    title: "Shape the Queue",
    body: "Vote, request, and react in real time.",
  },
]

export function CommunityCta() {
  return (
    <section
      aria-labelledby="community-heading"
      className="mx-auto w-full max-w-4xl px-4 pb-16 sm:px-6"
    >
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card/80 p-6 shadow-2xl shadow-primary/10 backdrop-blur sm:p-10">
        <div
          className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-primary/15 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative flex flex-col items-center gap-3 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-secondary-foreground">
            <span className="size-2 animate-pulse rounded-full bg-primary" />
            Join the community
          </span>
          <h2
            id="community-heading"
            className="text-2xl font-extrabold uppercase tracking-tight text-foreground text-balance sm:text-3xl"
          >
            Tune In With <span className="text-primary">The Crew</span>
          </h2>
          <p className="max-w-md text-sm text-muted-foreground text-pretty">
            Hang out in the Emo&apos;s Radio Discord while the queue plays. Submit,
            vote, and vibe with artists and listeners every night.
          </p>
        </div>

        <ul className="relative mt-8 grid gap-4 sm:grid-cols-3">
          {PERKS.map((perk) => (
            <li
              key={perk.title}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-background/40 px-4 py-5 text-center"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <perk.icon className="size-5" aria-hidden="true" />
              </span>
              <p className="text-sm font-semibold text-foreground">{perk.title}</p>
              <p className="text-sm text-muted-foreground text-pretty">{perk.body}</p>
            </li>
          ))}
        </ul>

        <div className="relative mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a
            href="https://discord.com/invite/bemo"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-12 w-full rounded-full px-8 text-sm font-bold uppercase tracking-wider shadow-lg shadow-primary/25 sm:w-auto",
            )}
          >
            <MessagesSquare className="size-4" aria-hidden="true" />
            Join the Discord
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-12 w-full rounded-full px-8 text-sm font-bold uppercase tracking-wider sm:w-auto",
            )}
          >
            Follow Updates
          </a>
        </div>
      </div>
    </section>
  )
}
