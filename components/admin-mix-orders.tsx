"use client"

import { useTransition } from "react"
import { ExternalLink } from "lucide-react"
import type { MixOrder } from "@/lib/mix-master"
import { setMixOrderDelivered } from "@/app/actions/mix-master"

export function AdminMixOrders({ orders }: { orders: MixOrder[] }) {
  const [pending, startTransition] = useTransition()

  if (orders.length === 0) {
    return <p className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">No paid orders yet.</p>
  }

  return (
    <ul className="flex flex-col gap-3">
      {orders.map((order) => {
        const delivered = order.status === "delivered"
        return (
          <li
            key={order.id}
            className={`flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 ${delivered ? "opacity-60" : ""}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold text-foreground">{order.name}</p>
                <a href={`mailto:${order.email}`} className="text-sm text-primary hover:underline">
                  {order.email}
                </a>
              </div>
              <time dateTime={order.paidAt} className="text-xs text-muted-foreground">
                {new Date(order.paidAt).toLocaleString()}
              </time>
            </div>
            <a
              href={order.trackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-fit items-center gap-1.5 break-all text-sm font-semibold text-foreground hover:text-primary"
            >
              <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
                Open files
              </a>
              {order.referenceSongUrl && (
                <a
                  href={order.referenceSongUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-fit items-center gap-1.5 break-all text-sm font-semibold text-foreground hover:text-primary"
                >
                  <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
                  Reference song
                </a>
              )}

            {order.referenceUrl && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reference track</span>
                <audio controls preload="none" src={order.referenceUrl} className="w-full max-w-md">
                  <a href={order.referenceUrl}>Download reference</a>
                </audio>
              </div>
            )}
            {order.notes && <p className="text-sm leading-relaxed text-muted-foreground">{order.notes}</p>}
            <button
              type="button"
              disabled={pending}
              onClick={() => startTransition(() => setMixOrderDelivered(order.id, !delivered))}
              className="w-fit rounded-full border border-border px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground disabled:opacity-60"
            >
              {delivered ? "Mark not delivered" : "Mark delivered"}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
