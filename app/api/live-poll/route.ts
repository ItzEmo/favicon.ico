import { NextResponse } from "next/server"
import { getOpenPoll } from "@/lib/live-poll"

export const dynamic = "force-dynamic"

// Polled by the poll overlay and the admin console.
export async function GET() {
  return NextResponse.json({ poll: await getOpenPoll() })
}
