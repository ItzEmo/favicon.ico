"use server"

import { revalidatePath } from "next/cache"
import { sql } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"

export async function setQueueLineOpen(which: "free" | "skips", open: boolean): Promise<void> {
  await requireAdmin()
  if (which !== "free" && which !== "skips") throw new Error("Invalid line")
  const value = open === true
  // Opening a line while both were closed starts a new queue session, which
  // resets the homepage "songs sent in" counter.
  if (which === "free") {
    await sql`
      UPDATE queue_settings SET
        free_open = ${value},
        session_started_at = CASE WHEN ${value} AND NOT free_open AND NOT skips_open THEN now() ELSE session_started_at END,
        updated_at = now()
      WHERE id = 1
    `
  } else {
    await sql`
      UPDATE queue_settings SET
        skips_open = ${value},
        session_started_at = CASE WHEN ${value} AND NOT free_open AND NOT skips_open THEN now() ELSE session_started_at END,
        updated_at = now()
      WHERE id = 1
    `
  }
  revalidatePath("/")
  revalidatePath("/admin")
  revalidatePath("/submit")
}
