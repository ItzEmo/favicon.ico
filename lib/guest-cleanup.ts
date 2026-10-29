import { del } from "@vercel/blob"
import { sql } from "@/lib/db"

// Songs in play history (status 'played') are deleted two days after they were
// played, along with any uploaded audio file. The live queue, the on-air track,
// and vault entries are untouched.
export async function purgePlayedHistory(): Promise<number> {
  const rows = (await sql`
    DELETE FROM submissions
    WHERE status = 'played'
      AND COALESCE(played_at, created_at) < now() - interval '2 days'
    RETURNING audio_pathname
  `) as { audio_pathname: string | null }[]

  const pathnames = rows.map((r) => r.audio_pathname).filter((p): p is string => Boolean(p))
  if (pathnames.length > 0) {
    try {
      await del(pathnames)
    } catch (err) {
      console.error("History cleanup blob delete error:", (err as Error).message)
    }
  }
  return rows.length
}
