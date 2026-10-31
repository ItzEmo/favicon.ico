"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function rateTrack(trackId: string, score: number): Promise<{ ok: boolean; error?: string }> {
  if (typeof trackId !== "string" || trackId.length === 0 || trackId.length > 200) {
    return { ok: false, error: "Unknown track" }
  }
  if (!Number.isInteger(score) || score < 1 || score > 10) {
    return { ok: false, error: "Score must be 1-10" }
  }

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return { ok: false, error: "Sign in to rate" }

  const tracks = (await sql`
    select title, submitted_by, user_id, status from submissions where track_id = ${trackId} limit 1
  `) as { title: string; submitted_by: string; user_id: string | null; status: string }[]
  const track = tracks[0]
  if (!track) return { ok: false, error: "Unknown track" }

  // Artist and title are copied onto the vote so rankings survive the song
  // being cleared from play history.
  await sql`
    insert into track_ratings (track_id, "userId", score, track_title, artist_name, artist_user_id, track_status)
    values (${trackId}, ${session.user.id}, ${score}, ${track.title}, ${track.submitted_by}, ${track.user_id}, ${track.status})
    on conflict (track_id, "userId")
    do update set score = excluded.score, updated_at = now(),
                  track_title = excluded.track_title, artist_name = excluded.artist_name,
                  artist_user_id = excluded.artist_user_id, track_status = excluded.track_status
  `
  revalidatePath("/ranks")
  return { ok: true }
}
