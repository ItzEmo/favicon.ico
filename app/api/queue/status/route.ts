import { NextResponse } from "next/server"
import { getQueueStatus } from "@/lib/queue-settings"

export const dynamic = "force-dynamic"

export async function GET() {
  const status = await getQueueStatus()
  return NextResponse.json(status)
}
