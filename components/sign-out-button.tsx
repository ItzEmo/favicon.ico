"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"

export function SignOutButton() {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleSignOut() {
    setPending(true)
    await authClient.signOut()
    router.push("/sign-in")
    router.refresh()
  }

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={handleSignOut}
      disabled={pending}
      className="rounded-full text-xs font-bold uppercase tracking-wider"
    >
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <LogOut className="size-4" aria-hidden="true" />}
      Sign Out
    </Button>
  )
}
