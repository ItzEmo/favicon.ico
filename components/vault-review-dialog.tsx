"use client"

import { useEffect, useRef } from "react"
import { X } from "lucide-react"
import { VaultEntryForm } from "@/components/vault-entry-form"
import { addTrackToVault } from "@/app/actions/vault"

export interface VaultReviewTarget {
  trackId: string
  title: string
  submittedBy: string
}

export function VaultReviewDialog({
  target,
  onClose,
  onSaved,
}: {
  target: VaultReviewTarget | null
  onClose: () => void
  onSaved: (trackId: string) => void
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (target && !dialog.open) dialog.showModal()
    if (!target && dialog.open) dialog.close()
  }, [target])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      aria-labelledby="vault-review-title"
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl border border-border bg-card p-0 text-card-foreground backdrop:bg-background/80 backdrop:backdrop-blur-sm"
    >
      {target ? (
        <div className="flex flex-col gap-5 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">Lock it in the Vault</p>
              <h2 id="vault-review-title" className="truncate text-lg font-extrabold text-foreground">
                {target.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
          <VaultEntryForm
            key={target.trackId}
            initial={{
              title: target.title,
              artist: target.submittedBy,
              genre: "",
              score: 7.5,
              verdict: "",
              notes: "",
            }}
            submitLabel="Add to Vault"
            onCancel={onClose}
            onSubmit={async (values) => {
              const res = await addTrackToVault(target.trackId, values)
              if (res.ok) onSaved(target.trackId)
              return res
            }}
          />
        </div>
      ) : null}
    </dialog>
  )
}
