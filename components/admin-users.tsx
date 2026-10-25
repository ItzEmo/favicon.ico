"use client"

import { useMemo, useState, useTransition } from "react"
import { Ban, Search, ShieldCheck, Undo2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { banUser, unbanUser } from "@/app/actions/admin"
import type { AdminUser } from "@/lib/users"

const ADMIN_EMAIL = "momensah60@gmail.com"

type Filter = "all" | "active" | "banned"

function initials(name: string, email: string) {
  const source = name.trim() || email
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function joined(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

export function AdminUsers({ users }: { users: AdminUser[] }) {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("all")

  const bannedCount = users.filter((u) => u.banned).length
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter((u) => {
      if (filter === "active" && u.banned) return false
      if (filter === "banned" && !u.banned) return false
      if (!q) return true
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.instagram ?? "").toLowerCase().includes(q)
      )
    })
  }, [users, query, filter])

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: `All ${users.length}` },
    { id: "active", label: `Active ${users.length - bannedCount}` },
    { id: "banned", label: `Banned ${bannedCount}` },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative flex-1">
          <span className="sr-only">Search accounts</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email or Instagram"
            className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </label>
        <div role="group" aria-label="Filter accounts" className="flex gap-1.5">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors",
                filter === f.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          No accounts match.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((user) => (
            <UserRow key={user.id} user={user} />
          ))}
        </ul>
      )}
    </div>
  )
}

function UserRow({ user }: { user: AdminUser }) {
  const [confirming, setConfirming] = useState(false)
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const isAdminAccount = user.email.toLowerCase() === ADMIN_EMAIL

  function run(action: () => Promise<void>) {
    setError(null)
    startTransition(async () => {
      try {
        await action()
        setConfirming(false)
        setReason("")
      } catch (err) {
        setError((err as Error).message || "Something went wrong")
      }
    })
  }

  return (
    <li
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-card p-3",
        user.banned ? "border-destructive/50" : "border-border",
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-sm font-bold text-secondary-foreground",
            user.banned && "opacity-50 grayscale",
          )}
        >
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt={`${user.name}'s profile picture`}
              className="size-full object-cover"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          ) : (
            <span aria-hidden="true">{initials(user.name, user.email)}</span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <p className="flex items-center gap-2 truncate text-sm font-bold text-foreground">
            <span className="truncate">{user.name || "Unnamed"}</span>
            {isAdminAccount ? (
              <ShieldCheck className="size-3.5 shrink-0 text-primary" aria-label="Admin" />
            ) : null}
            {user.banned ? (
              <span className="shrink-0 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-destructive-foreground">
                Banned
              </span>
            ) : null}
          </p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          <p className="truncate text-xs text-muted-foreground">
            {user.instagram ? `@${user.instagram} · ` : ""}
            {user.submissions} {user.submissions === 1 ? "song" : "songs"} · Joined {joined(user.createdAt)}
          </p>
        </div>

        {isAdminAccount ? null : user.banned ? (
          <button
            type="button"
            onClick={() => run(() => unbanUser(user.id))}
            disabled={pending}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:border-primary disabled:opacity-50"
          >
            <Undo2 className="size-3.5" aria-hidden="true" />
            {pending ? "Unbanning" : "Unban"}
          </button>
        ) : !confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-destructive/50 px-3 py-2 text-xs font-bold uppercase tracking-wider text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
          >
            <Ban className="size-3.5" aria-hidden="true" />
            Ban
          </button>
        ) : null}
      </div>

      {user.banned && user.banReason ? (
        <p className="text-xs text-muted-foreground">
          <span className="font-bold text-foreground">Reason:</span> {user.banReason}
        </p>
      ) : null}

      {confirming && !user.banned ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            run(() => banUser(user.id, reason))
          }}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <label className="flex-1">
            <span className="sr-only">Reason for ban (optional)</span>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
              placeholder="Reason (optional)"
              autoFocus
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-destructive focus:outline-none"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="flex-1 rounded-lg bg-destructive px-4 py-2 text-xs font-bold uppercase tracking-wider text-destructive-foreground disabled:opacity-50"
            >
              {pending ? "Banning" : "Confirm ban"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-lg border border-border px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </li>
  )
}
