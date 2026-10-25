import { ArrowUpRight, Zap } from "lucide-react"
import { statusLabel } from "@/lib/account"
import type { AdminSubmission } from "@/lib/users"

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function AdminSubmissionList({ submissions }: { submissions: AdminSubmission[] }) {
  if (submissions.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        No songs submitted yet.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {submissions.map((s) => (
        <li
          key={s.trackId}
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="flex items-center gap-2 text-sm font-bold text-foreground">
              <span className="truncate">{s.title || "Untitled"}</span>
              {s.boosted ? <Zap className="size-3.5 shrink-0 text-primary" aria-label="Boosted" /> : null}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {statusLabel(s.status)} · {s.line} line · {formatDate(s.createdAt)}
              {s.avgScore !== null ? ` · Avg ${s.avgScore.toFixed(1)}` : ""}
            </p>
            <p className="truncate text-xs text-muted-foreground">Submitted as {s.submittedBy}</p>
          </div>
          {s.url && /^https?:\/\//.test(s.url) ? (
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex shrink-0 items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:border-primary"
            >
              Open
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
              <span className="sr-only">{s.title} link</span>
            </a>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
