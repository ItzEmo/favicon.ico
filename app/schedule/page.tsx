import type { Metadata } from "next"
import { ScheduleBoard } from "@/components/schedule/schedule-board"
import { getSchedule } from "@/lib/schedule"
import { todayIso } from "@/lib/schedule-types"

export const metadata: Metadata = {
  title: "Schedule",
  description: "When Emo's Radio goes live — gaming, booth reactions, and live music reviews every week.",
}

export const dynamic = "force-dynamic"

export default async function SchedulePage() {
  const schedule = await getSchedule()
  return <ScheduleBoard schedule={schedule} today={todayIso()} />
}
