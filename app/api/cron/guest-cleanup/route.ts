import { type NextRequest, NextResponse } from "next/server"
import { purgePlayedHistory } from "@/lib/guest-cleanup"

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const deleted = await purgePlayedHistory()
  return NextResponse.json({ deleted })
}
