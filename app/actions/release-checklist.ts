"use server"

import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"
import { CHECKLIST_ITEM_IDS } from "@/lib/release-checklist"

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")
  return session.user.id
}

export async function setChecklistItem(itemId: string, done: boolean) {
  if (typeof itemId !== "string" || !CHECKLIST_ITEM_IDS.has(itemId)) {
    throw new Error("Unknown checklist item")
  }
  const userId = await getUserId()

  if (done) {
    await sql`
      insert into release_checklist_progress ("userId", item_id)
      values (${userId}, ${itemId})
      on conflict ("userId", item_id) do nothing
    `
  } else {
    await sql`
      delete from release_checklist_progress
      where "userId" = ${userId} and item_id = ${itemId}
    `
  }
}

export async function resetChecklist() {
  const userId = await getUserId()
  await sql`delete from release_checklist_progress where "userId" = ${userId}`
}
