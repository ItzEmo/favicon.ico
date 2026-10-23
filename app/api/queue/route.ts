import { NextResponse } from "next/server"
import { getNowPlaying, getQueue } from "@/app/actions/submissions"

export const dynamic = "force-dynamic"

// Polled by the live queue page (via SWR) so paid submissions appear the
// moment their payment is confirmed.
export async function GET() {
  const [nowPlaying, tracks] = await Promise.all([getNowPlaying(), getQueue()])
  return NextResponse.json({ nowPlaying, tracks })
}
