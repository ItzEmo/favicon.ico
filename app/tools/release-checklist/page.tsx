import type { Metadata } from "next"
import { headers } from "next/headers"
import { FileText } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { ReleaseChecklist } from "@/components/release-checklist"
import { auth } from "@/lib/auth"
import { getCompletedItemIds } from "@/lib/release-checklist-progress"

export const metadata: Metadata = {
  title: "Release Checklist",
  description: "Everything to do before, during, and after you drop a single — with saved progress.",
}

export default async function ReleaseChecklistPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const completed = session?.user ? await getCompletedItemIds(session.user.id) : []

  return (
    <>
      <PageHeader
        icon={FileText}
        eyebrow="Guide"
        title="Release"
        accent="Checklist"
        description="Every step from final master to post-release review. Check items off as you go — your progress is saved to your account."
      />

      <section className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <ReleaseChecklist initialCompleted={completed} signedIn={Boolean(session?.user)} />
      </section>
    </>
  )
}
