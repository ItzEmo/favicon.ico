"use client"

import { useId, useState } from "react"
import { Loader2, Archive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VERDICT_SUGGESTIONS, type VaultInput } from "@/lib/vault-types"

const fieldClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"

export function VaultEntryForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: VaultInput
  submitLabel: string
  onSubmit: (values: VaultInput) => Promise<{ ok: boolean; error?: string }>
  onCancel?: () => void
}) {
  const uid = useId()
  const [values, setValues] = useState<VaultInput>(initial)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  function set<K extends keyof VaultInput>(key: K, value: VaultInput[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    try {
      const res = await onSubmit(values)
      if (!res.ok) setError(res.error ?? "Something went wrong.")
    } catch (err) {
      setError((err as Error).message || "Something went wrong.")
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Title
          <input
            required
            maxLength={200}
            value={values.title}
            onChange={(e) => set("title", e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Artist
          <input
            required
            maxLength={120}
            value={values.artist}
            onChange={(e) => set("artist", e.target.value)}
            className={fieldClass}
          />
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor={`${uid}-score`}
            className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
          >
            Score
          </label>
          <span className="font-mono text-2xl font-extrabold text-primary" aria-hidden="true">
            {values.score.toFixed(1)}
          </span>
        </div>
        <input
          id={`${uid}-score`}
          type="range"
          min={0}
          max={10}
          step={0.1}
          value={values.score}
          onChange={(e) => set("score", Number(e.target.value))}
          aria-valuetext={`${values.score.toFixed(1)} out of 10`}
          className="w-full accent-primary"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Verdict
          <input
            maxLength={60}
            list={`${uid}-verdicts`}
            value={values.verdict}
            onChange={(e) => set("verdict", e.target.value)}
            placeholder="Heater"
            className={fieldClass}
          />
          <datalist id={`${uid}-verdicts`}>
            {VERDICT_SUGGESTIONS.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Genre
          <input
            maxLength={60}
            value={values.genre}
            onChange={(e) => set("genre", e.target.value)}
            placeholder="Emo rap"
            className={fieldClass}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Review notes
        <textarea
          maxLength={1000}
          rows={3}
          value={values.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="What stood out on air?"
          className={`${fieldClass} resize-y normal-case tracking-normal`}
        />
      </label>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" size="sm" disabled={pending} className="rounded-full font-bold uppercase tracking-wider">
          {pending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Archive className="size-4" aria-hidden="true" />
          )}
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
