"use server"

import { revalidatePath } from "next/cache"
import { del } from "@vercel/blob"
import { sql } from "@/lib/db"
import { requireAdmin, signInAdmin, signOutAdmin } from "@/lib/admin-auth"

export type AdminLoginState = { ok: boolean; error?: string }

export async function adminLogin(
  _prev: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const email = String(formData.get("email") ?? "")
  const password = String(formData.get("password") ?? "")
  const ok = await signInAdmin(email, password)
  if (!ok) return { ok: false, error: "Incorrect email or password." }
  return { ok: true }
}

export async function adminLogout(): Promise<void> {
  await signOutAdmin()
  revalidatePath("/admin")
}

// Permanently remove a track from the queue (and delete its stored audio).
export async function removeTrack(trackId: string): Promise<void> {
  await requireAdmin()
  const rows = (await sql`
    SELECT audio_pathname FROM submissions WHERE track_id = ${trackId}
  `) as { audio_pathname: string | null }[]
  const pathname = rows[0]?.audio_pathname
  if (pathname) {
    try {
      await del(pathname)
    } catch (err) {
      console.log("[v0] blob delete error:", (err as Error).message)
    }
  }
  await sql`DELETE FROM submissions WHERE track_id = ${trackId}`
  revalidatePath("/admin")
  revalidatePath("/queue")
}

// Put a queued track on air. Whatever was playing goes back into the queue
// at its original position (its line/boost/entry keys are untouched).
export async function playTrack(trackId: string): Promise<void> {
  await requireAdmin()
  await sql`UPDATE submissions SET status = 'active' WHERE status = 'playing' AND track_id <> ${trackId}`
  await sql`
    UPDATE submissions SET status = 'playing', played_at = now()
    WHERE track_id = ${trackId} AND status IN ('active', 'playing')
  `
  revalidatePath("/admin")
  revalidatePath("/queue")
}

// Finish the on-air track and put the top of the queue on air.
export async function finishAndPlayNext(): Promise<void> {
  await requireAdmin()
  const playing = (await sql`
    SELECT track_id FROM submissions WHERE status = 'playing'
  `) as { track_id: string }[]
  for (const row of playing) await removeTrack(row.track_id)

  await sql`
    UPDATE submissions SET status = 'playing', played_at = now()
    WHERE track_id = (
      SELECT track_id FROM submissions
      WHERE status = 'active'
      ORDER BY
        CASE line WHEN 'skipplus' THEN 0 WHEN 'skip' THEN 1 WHEN 'boost' THEN 2 ELSE 3 END ASC,
        boost_cents DESC,
        boosted_at ASC NULLS LAST,
        entered_at ASC NULLS LAST,
        created_at ASC
      LIMIT 1
    )
  `
  revalidatePath("/admin")
  revalidatePath("/queue")
}

interface PositionRow {
  track_id: string
  line: string
  boost_cents: number
  boosted: boolean
  boosted_at: string | null
  entered_at: string | null
}

// Move a track up or down by swapping its queue position (line, boost total,
// boost time, entry time) with its neighbor in the live ordering.
export async function moveTrack(trackId: string, direction: "up" | "down"): Promise<void> {
  await requireAdmin()
  const rows = (await sql`
    SELECT track_id, line, boost_cents, boosted, boosted_at, entered_at
    FROM submissions
    WHERE status = 'active'
    ORDER BY
      CASE line WHEN 'skipplus' THEN 0 WHEN 'skip' THEN 1 WHEN 'boost' THEN 2 ELSE 3 END ASC,
      boost_cents DESC,
      boosted_at ASC NULLS LAST,
      entered_at ASC NULLS LAST,
      created_at ASC
  `) as PositionRow[]

  const index = rows.findIndex((r) => r.track_id === trackId)
  if (index === -1) return
  const neighborIndex = direction === "up" ? index - 1 : index + 1
  if (neighborIndex < 0 || neighborIndex >= rows.length) return

  const a = rows[index]
  const b = rows[neighborIndex]
  // If both share identical ordering keys a plain swap changes nothing, so
  // nudge the moved track's entry time by 1ms in the requested direction.
  const sameKeys =
    a.line === b.line &&
    a.boost_cents === b.boost_cents &&
    String(a.boosted_at) === String(b.boosted_at) &&
    String(a.entered_at) === String(b.entered_at)
  const nudgeMs = sameKeys ? (direction === "up" ? -1 : 1) : 0

  await sql`
    UPDATE submissions
    SET line = ${b.line}, boost_cents = ${b.boost_cents}, boosted = ${b.boosted},
        boosted_at = ${b.boosted_at},
        entered_at = COALESCE(${b.entered_at}::timestamptz, now()) + make_interval(secs => ${nudgeMs} / 1000.0)
    WHERE track_id = ${a.track_id}
  `
  await sql`
    UPDATE submissions
    SET line = ${a.line}, boost_cents = ${a.boost_cents}, boosted = ${a.boosted},
        boosted_at = ${a.boosted_at}, entered_at = ${a.entered_at}
    WHERE track_id = ${b.track_id}
  `
  revalidatePath("/admin")
  revalidatePath("/queue")
}
