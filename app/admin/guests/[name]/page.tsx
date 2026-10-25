import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { isAdmin } from "@/lib/admin-auth"
import { getGuestSubmissionsForAdmin, guestKey } from "@/lib/users"
import { AdminSubmissionList } from "@/components/admin-submission-list"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Guest · Admin",
  robots: { index: false, follow: false },
}

export default async function AdminGuestPage({ params }: { params: Promise<{ name: string }> }) {
  if (!(await isAdmin())) notFound()
  const { name } = await params
  const key = guestKey(decodeURIComponent(name))
  const submissions = await getGuestSubmissionsForAdmin(key)
  if (submissions.length === 0) notFound()

  const displayName = submissions[0].submittedBy.trim()
  const spellings = Array.from(new Set(submissions.map((s) => s.submittedBy.trim())))
  const first = submissions[submissions.length - 1].createdAt

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10 sm:px-6">
      <Link
        href="/admin#guests"
        className="flex w-fit items-center gap-1 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        Back to guests
      </Link>

      <header className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="flex size-20 shrink-0 items-center justify-center rounded-full border border-dashed border-border text-2xl font-bold text-muted-foreground"
        >
          {displayName.slice(0, 2).toUpperCase()}
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="flex items-center gap-2 text-2xl font-extrabold uppercase tracking-tight text-foreground">
            <span className="truncate">{displayName}</span>
            <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Guest
            </span>
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            No account. {submissions.length} {submissions.length === 1 ? "song" : "songs"} since{" "}
            {new Date(first).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}.
          </p>
          {spellings.length > 1 ? (
            <p className="text-xs text-muted-foreground">Also submitted as: {spellings.slice(1).join(", ")}</p>
          ) : null}
        </div>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-foreground">Submissions</h2>
        <AdminSubmissionList submissions={submissions} />
      </section>
    </main>
  )
}
