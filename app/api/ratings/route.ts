import { NextResponse, type NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { getRatingSummaries, getUserRatings } from "@/lib/ratings"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const ids = (req.nextUrl.searchParams.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 200)

  const session = await auth.api.getSession({ headers: req.headers })
  const [summaries, mine] = await Promise.all([
    getRatingSummaries(ids),
    session?.user ? getUserRatings(session.user.id, ids) : Promise.resolve({}),
  ])

  return NextResponse.json({ signedIn: !!session?.user, summaries, mine })
}
