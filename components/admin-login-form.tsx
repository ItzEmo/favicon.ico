"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Lock, Loader2, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { adminLogin, type AdminLoginState } from "@/app/actions/admin"

const initialState: AdminLoginState = { ok: false }

export function AdminLoginForm() {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(adminLogin, initialState)

  useEffect(() => {
    if (state.ok) {
      router.push("/admin")
      router.refresh()
    }
  }, [state.ok, router])

  return (
    <div className="mx-auto w-full max-w-sm rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <ShieldCheck className="size-6" aria-hidden="true" />
        </span>
        <h1 className="text-xl font-bold text-foreground">Admin sign in</h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Host access only. Sign in to manage the queue and run the DJ player.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            placeholder="you@example.com"
            className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
          />
        </div>

        {state.error ? (
          <p role="alert" className="text-sm font-medium text-destructive">
            {state.error}
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          disabled={pending}
          className="h-11 w-full rounded-full text-sm font-bold uppercase tracking-wider"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Lock className="size-4" aria-hidden="true" />
          )}
          {pending ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </div>
  )
}
