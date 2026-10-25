import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"

export const dynamic = "force-dynamic"

// Track ids the signed-in user has waiting or on air, so the queue alert can
// follow them across devices. Guests are tracked on-device instead.
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null)
  if (!session) return NextResponse.json({ trackIds: [] })

  const rows = (await sql`
    SELECT track_id FROM submissions
    WHERE user_id = ${session.user.id} AND status IN ('active', 'playing')
  `) as { track_id: string }[]

  return NextResponse.json({ trackIds: rows.map((r) => r.track_id) })
}
