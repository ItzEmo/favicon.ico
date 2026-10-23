import "server-only"

import { sql } from "@/lib/db"
import { CHECKLIST_ITEM_IDS } from "@/lib/release-checklist"

export async function getCompletedItemIds(userId: string): Promise<string[]> {
  const rows = (await sql`
    select item_id from release_checklist_progress where "userId" = ${userId}
  `) as { item_id: string }[]
  return rows.map((row) => row.item_id).filter((id) => CHECKLIST_ITEM_IDS.has(id))
}
