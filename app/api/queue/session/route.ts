import { NextResponse } from "next/server"
import { getSessionSubmissionCount } from "@/lib/stats"

export const dynamic = "force-dynamic"

export async function GET() {
  const submissions = await getSessionSubmissionCount()
  return NextResponse.json({ submissions })
}
