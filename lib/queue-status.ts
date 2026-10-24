import type { LineId } from "@/lib/lines"

export interface QueueStatus {
  freeOpen: boolean
  skipsOpen: boolean
}

export function isLineOpen(status: QueueStatus, line: LineId): boolean {
  return line === "free" ? status.freeOpen : status.skipsOpen
}
