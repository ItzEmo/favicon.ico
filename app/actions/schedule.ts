"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/admin-auth"
import { saveSchedule } from "@/lib/schedule"
import { sanitizeSchedule, type Schedule } from "@/lib/schedule-types"

export async function updateSchedule(input: Schedule): Promise<Schedule> {
  await requireAdmin()
  const schedule = sanitizeSchedule(input)
  await saveSchedule(schedule)
  revalidatePath("/schedule")
  revalidatePath("/admin")
  return schedule
}
