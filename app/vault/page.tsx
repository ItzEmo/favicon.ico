import type { Metadata } from "next"
import { Archive, ExternalLink, Star } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { getVaultEntries } from "@/lib/vault"
import { formatReviewDate } from "@/lib/vault-types"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "The Vault",
  description: "Every track Emo's Radio has reviewed, scored, and archived.",
}

function scoreColor(score: number) {
  if (score >= 9) return "text-primary"
  if (score >= 7.5) return "text-accent"
  return "text-muted-foreground"
}

export default async function VaultPage() {
  const entries = await getVaultEntries()

  return (
    <>
      <PageHeader
        icon={Archive}
        eyebrow="The archive"
        title="The"
        accent="Vault"
        description="Every track we've put on air, scored, and locked in. Browse the verdicts and revisit the heaters."
      />

      <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 px-6 py-20 text-center">
            <Archive className="size-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-lg font-semibold text-foreground">The vault is empty</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              No tracks have been reviewed and archived yet. Once Emo reviews submissions live, the verdicts will show up here.
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-foreground">{entry.title}</p>
                    <p className="truncate text-sm text-muted-foreground">{entry.artist}</p>
                  </div>
                  <span
                    className={`flex shrink-0 items-center gap-1 text-xl font-extrabold ${scoreColor(entry.score)}`}
                    aria-label={`Score ${entry.score.toFixed(1)} out of 10`}
                  >
                    <Star className="size-4 fill-current" aria-hidden="true" />
                    {entry.score.toFixed(1)}
                  </span>
                </div>

                {entry.notes ? (
                  <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{entry.notes}</p>
                ) : null}

                <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                  {entry.genre ? (
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                      {entry.genre}
                    </span>
                  ) : (
                    <span />
                  )}
                  {entry.verdict ? (
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">{entry.verdict}</span>
                  ) : null}
                </div>

                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>Reviewed {formatReviewDate(entry.reviewedAt)}</span>
                  {entry.url ? (
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-foreground transition-colors hover:text-primary"
                    >
                      Listen
                      <ExternalLink className="size-3" aria-hidden="true" />
                      <span className="sr-only">to {entry.title} (opens in a new tab)</span>
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
