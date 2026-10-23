"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Plus, Star, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VaultEntryForm } from "@/components/vault-entry-form"
import { createVaultEntry, removeVaultEntry, updateVaultEntry } from "@/app/actions/vault"
import { formatReviewDate, type VaultEntry } from "@/lib/vault-types"

export function AdminVault({ entries }: { entries: VaultEntry[] }) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<number | "new" | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  async function handleRemove(entry: VaultEntry) {
    if (!window.confirm(`Remove "${entry.title}" from the Vault?`)) return
    setBusyId(entry.id)
    try {
      await removeVaultEntry(entry.id)
      router.refresh()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Use the <span className="font-semibold text-foreground">Vault</span> button on any queue track to archive it
        after reviewing. You can also add an entry by hand.
      </p>

      {editingId === "new" ? (
        <div className="rounded-xl border border-primary/60 bg-card p-4">
          <VaultEntryForm
            initial={{ title: "", artist: "", genre: "", score: 7.5, verdict: "", notes: "" }}
            submitLabel="Add to Vault"
            onCancel={() => setEditingId(null)}
            onSubmit={async (values) => {
              const res = await createVaultEntry(values)
              if (res.ok) {
                setEditingId(null)
                router.refresh()
              }
              return res
            }}
          />
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setEditingId("new")}
          className="self-start rounded-full text-xs font-bold uppercase tracking-wider"
        >
          <Plus className="size-4" aria-hidden="true" />
          Add entry
        </Button>
      )}

      {entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          Nothing in the Vault yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {entries.map((entry) =>
            editingId === entry.id ? (
              <li key={entry.id} className="rounded-xl border border-primary/60 bg-card p-4">
                <VaultEntryForm
                  initial={entry}
                  submitLabel="Save"
                  onCancel={() => setEditingId(null)}
                  onSubmit={async (values) => {
                    const res = await updateVaultEntry(entry.id, values)
                    if (res.ok) {
                      setEditingId(null)
                      router.refresh()
                    }
                    return res
                  }}
                />
              </li>
            ) : (
              <li key={entry.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 sm:p-4">
                <span className="flex w-14 shrink-0 items-center justify-center gap-1 font-mono text-lg font-extrabold text-primary">
                  <Star className="size-3.5 fill-current" aria-hidden="true" />
                  {entry.score.toFixed(1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{entry.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {entry.artist}
                    {entry.verdict ? ` · ${entry.verdict}` : ""} · {formatReviewDate(entry.reviewedAt)}
                  </p>
                </div>
                {busyId === entry.id ? (
                  <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden="true" />
                ) : null}
                <button
                  type="button"
                  onClick={() => setEditingId(entry.id)}
                  aria-label={`Edit ${entry.title}`}
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <Pencil className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(entry)}
                  disabled={busyId === entry.id}
                  aria-label={`Remove ${entry.title} from the Vault`}
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive disabled:opacity-40"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  )
}
