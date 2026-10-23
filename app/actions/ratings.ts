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

  const exists = (await sql`select 1 from submissions where track_id = ${trackId} limit 1`) as unknown[]
  if (exists.length === 0) return { ok: false, error: "Unknown track" }

  await sql`
    insert into track_ratings (track_id, "userId", score)
    values (${trackId}, ${session.user.id}, ${score})
    on conflict (track_id, "userId")
    do update set score = excluded.score, updated_at = now()
  `
  revalidatePath("/ranks")
  return { ok: true }
}
