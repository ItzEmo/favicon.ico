import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { LogIn } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { AuthForm } from "@/components/auth-form"
import { auth, isGoogleEnabled } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Sign In",
  description: "Log in to Emo's Radio to track your submissions and paid skips.",
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; start?: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect("/account")
  const { error, start } = await searchParams
  const initialError = error ? "Google sign-in didn't go through. Try again or use your email and password." : null

  return (
    <>
      <PageHeader
        icon={LogIn}
        eyebrow="Members only"
        title="Sign"
        accent="In"
        description="Log in to track your submissions, follow the queue, and manage your paid skips."
      />
      <section className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-12 sm:px-6">
        <AuthForm mode="sign-in" googleEnabled={isGoogleEnabled} initialError={initialError}
          autoStartGoogle={start === "google" && !error}
        />
      </section>
    </>
  )
}
