import "server-only"

import { sql } from "@/lib/db"

export interface MixOrder {
  id: string
  name: string
  email: string
  trackUrl: string
  notes: string
  status: "paid" | "delivered"
  paidAt: string
}

export async function getPaidMixOrders(): Promise<MixOrder[]> {
  const rows = await sql`
    SELECT id, name, email, track_url, notes, status, paid_at
    FROM mix_master_orders
    WHERE status IN ('paid', 'delivered')
    ORDER BY (status = 'delivered'), paid_at DESC
    LIMIT 200
  `
  return rows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    email: r.email as string,
    trackUrl: r.track_url as string,
    notes: r.notes as string,
    status: r.status as MixOrder["status"],
    paidAt: new Date(r.paid_at as string).toISOString(),
  }))
}
