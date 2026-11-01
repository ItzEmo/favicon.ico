import type { Metadata } from "next"
import Link from "next/link"
import { Trophy, Crown, Star } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { ArtistName } from "@/components/artist-name"
import { getLeaderboard, POINTS_PER_SCORE } from "@/lib/ratings"

export const metadata: Metadata = {
  title: "Ranks",
  description: "The Emo's Radio leaderboard — top artists ranked by listener votes on the queue.",
}

export const dynamic = "force-dynamic"

export default async function RanksPage() {
  const leaderboard = await getLeaderboard()
  const podium = [leaderboard[1], leaderboard[0], leaderboard[2]]
  const heights = ["h-24", "h-32", "h-20"]

  return (
    <>
      <PageHeader
        icon={Trophy}
        eyebrow="Voted by listeners"
        title="The"
        accent="Ranks"
        description={`Every vote on the queue and in the TikTok live chat counts. Each rating is worth its score × ${POINTS_PER_SCORE} points — so artists climb by scoring high and showing up.`}
      />

      <section className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        {leaderboard.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
              <Star className="size-6 text-muted-foreground" aria-hidden="true" />
            </div>
            <p className="text-sm font-medium text-foreground">No votes yet</p>
            <p className="max-w-xs text-sm text-muted-foreground text-pretty">
              Rate tracks on the queue and the leaderboard fills in live.
            </p>
            <Link href="/queue" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
              Go to the queue
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-10 grid grid-cols-3 items-end gap-3 sm:gap-4">
              {podium.map((p, i) =>
                p ? (
                  <div key={p.artist} className="flex flex-col items-center gap-2">
                    {p.rank === 1 ? <Crown className="size-6 text-primary" aria-hidden="true" /> : null}
                    <ArtistName
                      name={p.artist}
                      userId={p.userId}
                      className="text-center text-sm font-semibold text-foreground"
                    />
                    <span className="text-xs text-muted-foreground">{p.avg.toFixed(1)} avg</span>
                    <div
                      className={`flex ${heights[i]} w-full items-start justify-center rounded-t-xl border border-border bg-card pt-2 text-lg font-extrabold ${
                        p.rank === 1 ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      #{p.rank}
                    </div>
                  </div>
                ) : (
                  <div key={`empty-${i}`} aria-hidden="true" />
                ),
              )}
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card/40">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border/60 bg-secondary/40 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Artist</th>
                    <th className="px-4 py-3 text-right">Avg</th>
                    <th className="hidden px-4 py-3 text-right sm:table-cell">Votes</th>
                    <th className="px-4 py-3 text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {leaderboard.map((row) => (
                    <tr key={row.artist} className="transition-colors hover:bg-secondary/30">
                      <td className="px-4 py-3 font-bold text-primary">{row.rank}</td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        <ArtistName name={row.artist} userId={row.userId} />
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground">{row.avg.toFixed(1)}</td>
                      <td className="hidden px-4 py-3 text-right text-muted-foreground sm:table-cell">
                        {row.reviews}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-foreground">
                        {row.points.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </>
  )
}
