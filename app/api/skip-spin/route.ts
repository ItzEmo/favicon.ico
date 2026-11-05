import { NextResponse } from "next/server"
import { getLatestSpin } from "@/lib/skip-spin"

export const dynamic = "force-dynamic"

// Polled by the jackpot overlay; it only plays spins that just happened.
export async function GET() {
  const spin = await getLatestSpin()
  return NextResponse.json({ spin, now: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } })
}
