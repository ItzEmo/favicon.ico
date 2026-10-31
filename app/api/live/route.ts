import { NextResponse } from "next/server"
import { getTikTokLiveStatus } from "@/lib/tiktok-live"

export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json(await getTikTokLiveStatus())
}
