import { del } from "@vercel/blob"
import { sql } from "@/lib/db"

// Guest (signed-out) submissions with an uploaded audio file are purged two
// days after submission. Link submissions, member submissions, the on-air
// track, and vault entries are untouched.
export async function purgeExpiredGuestUploads(): Promise<number> {
  const rows = (await sql`
    DELETE FROM submissions
    WHERE user_id IS NULL
      AND audio_pathname IS NOT NULL
      AND status <> 'playing'
      AND created_at < now() - interval '2 days'
    RETURNING audio_pathname
  `) as { audio_pathname: string }[]

  const pathnames = rows.map((r) => r.audio_pathname)
  if (pathnames.length > 0) {
    try {
      await del(pathnames)
    } catch (err) {
      console.log("[v0] guest cleanup blob delete error:", (err as Error).message)
    }
  }
  return rows.length
}
