"use server"

import { revalidatePath } from "next/cache"
import { sql } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"

export async function setQueueLineOpen(which: "free" | "skips", open: boolean): Promise<void> {
  await requireAdmin()
  if (which !== "free" && which !== "skips") throw new Error("Invalid line")
  const value = open === true
  if (which === "free") {
    await sql`UPDATE queue_settings SET free_open = ${value}, updated_at = now() WHERE id = 1`
  } else {
    await sql`UPDATE queue_settings SET skips_open = ${value}, updated_at = now() WHERE id = 1`
  }
  revalidatePath("/admin")
  revalidatePath("/submit")
}
