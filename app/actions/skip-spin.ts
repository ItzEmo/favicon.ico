"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/admin-auth"
import { resetWinners, spinForFreeSkip } from "@/lib/skip-spin"

export async function spinFreeSkip() {
  await requireAdmin()
  const spin = await spinForFreeSkip()
  if (!spin) return { ok: false as const, error: "No one in the Free line is eligible to win." }
  revalidatePath("/queue")
  revalidatePath("/admin")
  return { ok: true as const, spin }
}

export async function resetFreeSkipWinners() {
  await requireAdmin()
  await resetWinners()
  revalidatePath("/admin")
  return { ok: true }
}
