import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowUpRight, ChevronLeft } from "lucide-react"
import { isAdmin } from "@/lib/admin-auth"
import { getAccountSubmissionsForAdmin, getAdminUser } from "@/lib/users"
import { getProfileExtras, getUserStats } from "@/lib/account"
import { musicLinkLabel } from "@/lib/music-links"
import { UserRow } from "@/components/admin-users"
import { AdminSubmissionList } from "@/components/admin-submission-list"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Account · Admin",
  robots: { index: false, follow: false },
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-3">
      <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="text-xl font-extrabold text-foreground">{value}</dd>
    </div>
  )
}

export default async function AdminAccountPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) notFound()
  const { id } = await params
  const user = await getAdminUser(decodeURIComponent(id))
  if (!user) notFound()

  const [stats, extras, submissions] = await Promise.all([
    getUserStats(user.id),
    getProfileExtras(user.id),
    getAccountSubmissionsForAdmin(user.id),
  ])

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10 sm:px-6">
      <Link
        href="/admin#accounts"
        className="flex w-fit items-center gap-1 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        Back to accounts
      </Link>

      <header className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-2xl font-bold text-secondary-foreground">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={`${user.name}'s profile picture`}
                className="size-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span aria-hidden="true">{(user.name || user.email).slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="truncate text-2xl font-extrabold uppercase tracking-tight text-foreground text-balance">
              {user.name || "Unnamed"}
            </h1>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            <div className="flex flex-wrap gap-3 text-xs font-bold uppercase tracking-wider">
              {user.instagram ? (
                <a
                  href={`https://instagram.com/${user.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  @{user.instagram}
                </a>
              ) : null}
              {!user.banned ? (
                <Link href={`/artists/${encodeURIComponent(user.id)}`} className="text-muted-foreground hover:text-foreground">
                  Public profile
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        <ul>
          <UserRow user={user} linkToDetail={false} />
        </ul>
      </header>

      <dl className="grid grid-cols-3 gap-2">
        <Stat label="Songs" value={String(stats.submissions)} />
        <Stat label="Avg score" value={stats.avgScore !== null ? stats.avgScore.toFixed(1) : "—"} />
        <Stat label="Rank" value={stats.rank !== null ? `#${stats.rank}` : "—"} />
      </dl>

      {extras.musicLinks.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-foreground">Released music</h2>
          <ul className="flex flex-col gap-2">
            {extras.musicLinks.map((link) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 text-sm text-foreground hover:border-primary/60"
                >
                  <span className="truncate font-bold">{link.title}</span>
                  <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                    {musicLinkLabel(link.url)}
                    <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-foreground">
          Submissions ({submissions.length})
        </h2>
        <AdminSubmissionList submissions={submissions} />
      </section>
    </main>
  )
}
