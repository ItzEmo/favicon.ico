import { NextResponse } from "next/server"
import { isAdmin } from "@/lib/admin-auth"
import { getPlayedHistory } from "@/lib/queue-history"

export const dynamic = "force-dynamic"

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json({ tracks: await getPlayedHistory() })
}
