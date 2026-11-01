import { NextResponse, type NextRequest } from "next/server"
import { isValidVoteKey, parseScore, recordLiveVote } from "@/lib/live-poll"

export const dynamic = "force-dynamic"

// Webhook for TikTok chat bridges (TikFinity, Streamer.bot, Social Stream Ninja...).
// Accepts GET query params or a POST JSON/form body with:
//   key      - the vote key shown in the admin console
//   user     - the viewer's TikTok username (also: username, nickname, uniqueId, userId)
//   vote     - the score or chat message, e.g. 5, "9" or "10/10" (also: comment, message, score)
// Extra fields such as platform or pollId are ignored; votes go to the poll that is currently open.
async function handle(req: NextRequest) {
  const params = new URLSearchParams(req.nextUrl.searchParams)
  if (req.method === "POST") {
    const type = req.headers.get("content-type") ?? ""
    try {
      if (type.includes("application/json")) {
        const body = (await req.json()) as Record<string, unknown>
        for (const [k, v] of Object.entries(body)) if (v != null) params.set(k, String(v))
      } else if (type.includes("form")) {
        const form = await req.formData()
        for (const [k, v] of form.entries()) params.set(k, String(v))
      }
    } catch {
      return NextResponse.json({ ok: false, error: "Bad body" }, { status: 400 })
    }
  }

  if (!isValidVoteKey(params.get("key"))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const voter =
    params.get("user") ??
    params.get("username") ??
    params.get("uniqueId") ??
    params.get("nickname") ??
    params.get("userId") ??
    ""
  const message =
    params.get("vote") ?? params.get("comment") ?? params.get("message") ?? params.get("score") ?? ""
  const score = parseScore(message)
  if (score === null) return NextResponse.json({ ok: false, error: "No 1-10 score in message" })

  const result = await recordLiveVote(voter, score)
  return NextResponse.json(result, { status: result.ok ? 200 : 409 })
}

export const GET = handle
export const POST = handle
