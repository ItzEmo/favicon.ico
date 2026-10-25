"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ChevronRight, Search } from "lucide-react"
import type { GuestSubmitter } from "@/lib/users"

function initials(name: string) {
  const parts = name.trim().split(/[\s_.-]+/).filter(Boolean)
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).toUpperCase()
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

export function AdminGuests({ guests }: { guests: GuestSubmitter[] }) {
  const [query, setQuery] = useState("")
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? guests.filter((g) => g.key.includes(q)) : guests
  }, [guests, query])

  return (
    <div className="flex flex-col gap-4">
      <label className="relative">
        <span className="sr-only">Search guests</span>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${guests.length} guest names`}
          className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
      </label>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          No guests match.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((g) => (
            <li key={g.key}>
              <Link
                href={`/admin/guests/${encodeURIComponent(g.key)}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/60"
              >
                <span
                  aria-hidden="true"
                  className="flex size-11 shrink-0 items-center justify-center rounded-full border border-dashed border-border text-sm font-bold text-muted-foreground"
                >
                  {initials(g.name)}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <span className="truncate">{g.name}</span>
                    <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Guest
                    </span>
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {g.submissions} {g.submissions === 1 ? "song" : "songs"} · Last {shortDate(g.lastAt)}
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
