import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { UserPlus } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { AuthForm } from "@/components/auth-form"
import { auth, isGoogleEnabled } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Create Account",
  description: "Join Emo's Radio to submit tracks, follow the queue, and climb the ranks.",
}

export default async function SignUpPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect("/account")

  return (
    <>
      <PageHeader
        icon={UserPlus}
        eyebrow="Join the station"
        title="Create"
        accent="Account"
        description="Make an account to track your submissions, scores, and standing on Emo's Radio."
      />
      <section className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-12 sm:px-6">
        <AuthForm mode="sign-up" googleEnabled={isGoogleEnabled} />
      </section>
    </>
  )
}
