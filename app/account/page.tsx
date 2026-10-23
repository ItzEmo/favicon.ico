import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import {
  UserRound,
  Star,
  UploadCloud,
  Trophy,
  Settings,
  Bell,
  Shield,
  ChevronRight,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { SignOutButton } from "@/components/sign-out-button"
import { auth } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Account",
  description: "Your Emo's Radio artist profile, submissions, and settings.",
}

const STATS = [
  { icon: UploadCloud, label: "Submissions", value: "14" },
  { icon: Star, label: "Avg Score", value: "8.3" },
  { icon: Trophy, label: "Season Rank", value: "#5" },
]

const SUBMISSIONS = [
  { title: "Dial Tone Romance", status: "Reviewed", score: "8.3" },
  { title: "Paper Hearts (Demo)", status: "In Queue", score: "—" },
  { title: "Static Bloom", status: "Reviewed", score: "7.9" },
]

const SETTINGS = [
  { icon: Bell, label: "Notifications", hint: "On air pings, replies" },
  { icon: Shield, label: "Privacy", hint: "Profile visibility" },
  { icon: Settings, label: "Preferences", hint: "Theme, audio defaults" },
]

function initialsOf(name: string) {
  const parts = name.trim().split(/[\s_.-]+/).filter(Boolean)
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).toUpperCase()
}

export default async function AccountPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  const { user } = session
  const displayName = user.name || user.email.split("@")[0]
  const joined = new Date(user.createdAt).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  })

  return (
    <>
      <PageHeader
        icon={UserRound}
        eyebrow="Your profile"
        title="Your"
        accent="Account"
        description="Track your submissions, scores, and standing — and tune how Emo's Radio talks to you."
      />

      <section className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card/80 p-6 text-center shadow-xl shadow-primary/5 sm:p-8">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- Google avatar hosts vary
            <img
              src={user.image}
              alt=""
              referrerPolicy="no-referrer"
              className="size-20 rounded-full object-cover"
            />
          ) : (
            <span className="flex size-20 items-center justify-center rounded-full bg-primary text-2xl font-extrabold text-primary-foreground">
              {initialsOf(displayName)}
            </span>
          )}
          <div>
            <h2 className="text-xl font-extrabold uppercase tracking-tight text-foreground">
              {displayName}
            </h2>
            <p className="text-sm text-muted-foreground">
              {user.email} &middot; Joined {joined}
            </p>
          </div>
          <SignOutButton />
        </div>

        <ul className="mt-6 grid grid-cols-3 gap-4">
          {STATS.map((stat) => (
            <li
              key={stat.label}
              className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card/50 px-3 py-5 text-center"
            >
              <stat.icon className="size-5 text-primary" aria-hidden="true" />
              <span className="text-2xl font-extrabold text-foreground">
                {stat.value}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-primary">
              Your Submissions
            </h3>
            <ul className="flex flex-col gap-3">
              {SUBMISSIONS.map((sub) => (
                <li
                  key={sub.title}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {sub.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{sub.status}</p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-primary">
                    {sub.score !== "—" ? (
                      <Star className="size-3.5 fill-current" aria-hidden="true" />
                    ) : null}
                    {sub.score}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-primary">
              Settings
            </h3>
            <ul className="flex flex-col gap-3">
              {SETTINGS.map((s) => (
                <li key={s.label}>
                  <a
                    href="#top"
                    className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <s.icon className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{s.label}</p>
                      <p className="text-xs text-muted-foreground">{s.hint}</p>
                    </div>
                    <ChevronRight
                      className="size-4 text-muted-foreground transition-colors group-hover:text-primary"
                      aria-hidden="true"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  )
}
