"use client"

import { useState, type FormEvent } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogIn, Mail, Lock, UserRound, UserPlus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"

type Mode = "sign-in" | "sign-up"

const inputClass =
  "h-11 w-full rounded-lg border border-input bg-background/60 pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"

export function AuthForm({
  mode,
  googleEnabled,
  initialError = null,
}: {
  mode: Mode
  googleEnabled: boolean
  initialError?: string | null
}) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(initialError)
  const [pending, setPending] = useState<"email" | "google" | null>(null)

  const isSignUp = mode === "sign-up"

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setPending("email")
    const { error } = isSignUp
      ? await authClient.signUp.email({ name: name.trim(), email: email.trim(), password })
      : await authClient.signIn.email({ email: email.trim(), password })
    if (error) {
      console.error("[auth]", error)
      setError(
        isSignUp
          ? "Couldn't create that account. Try a different email or a longer password."
          : "That email and password didn't match.",
      )
      setPending(null)
      return
    }
    router.push(email.trim().toLowerCase() === "momensah60@gmail.com" ? "/admin" : "/account")
    router.refresh()
  }

  async function handleGoogle() {
    setError(null)
    setPending("google")
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/account",
      newUserCallbackURL: "/account",
      errorCallbackURL: "/sign-in?error=google",
    })
    if (error) {
      console.error("[auth]", error)
      setError("Google sign-in isn't available right now.")
      setPending(null)
    }
  }

  return (
    <div className="rounded-3xl border border-border bg-card/80 p-6 shadow-2xl shadow-primary/10 sm:p-8">
      {googleEnabled ? (
        <>
          <button
            type="button"
            onClick={handleGoogle}
            disabled={pending !== null}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-border bg-background text-sm font-bold uppercase tracking-wider text-foreground transition-colors hover:bg-secondary disabled:opacity-60"
          >
            {pending === "google" ? (
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
            ) : (
              <Image src="/google-logo.svg" alt="" width={20} height={20} className="size-5" aria-hidden="true" />
            )}
            {isSignUp ? "Sign up with Google" : "Continue with Google"}
          </button>

          <div className="my-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      ) : null}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" aria-label={isSignUp ? "Create account" : "Sign in"}>
        {isSignUp ? (
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-sm font-medium text-foreground">
              Artist name
            </label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                id="name"
                required
                maxLength={60}
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="the_basement"
                className={inputClass}
              />
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@emosradio.fm"
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              id="password"
              type="password"
              required
              minLength={8}
              maxLength={128}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
            />
          </div>
          {isSignUp ? <p className="text-xs text-muted-foreground">At least 8 characters.</p> : null}
        </div>

        {error ? (
          <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          disabled={pending !== null}
          className="h-12 w-full rounded-full text-sm font-bold uppercase tracking-wider shadow-lg shadow-primary/25"
        >
          {pending === "email" ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : isSignUp ? (
            <UserPlus className="size-4" aria-hidden="true" />
          ) : (
            <LogIn className="size-4" aria-hidden="true" />
          )}
          {isSignUp ? "Create Account" : "Sign In"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isSignUp ? "Already have an account? " : "New here? "}
        <Link href={isSignUp ? "/sign-in" : "/sign-up"} className="font-bold text-primary hover:underline">
          {isSignUp ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  )
}
