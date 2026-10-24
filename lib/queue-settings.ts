import "server-only"

import { sql } from "@/lib/db"
import type { QueueStatus } from "@/lib/queue-status"

export type { QueueStatus } from "@/lib/queue-status"

export async function getQueueStatus(): Promise<QueueStatus> {
  const rows = (await sql`
    SELECT free_open, skips_open FROM queue_settings WHERE id = 1
  `) as { free_open: boolean; skips_open: boolean }[]
  return { freeOpen: rows[0]?.free_open ?? true, skipsOpen: rows[0]?.skips_open ?? true }
}
