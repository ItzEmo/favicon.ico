import type { Metadata } from "next"
import Link from "next/link"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { ChevronLeft, UserRoundPen } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { ProfileForm } from "@/components/profile-form"
import { auth } from "@/lib/auth"
import { getProfileExtras } from "@/lib/account"

export const metadata: Metadata = {
  title: "Edit Profile",
  description: "Update your Emo's Radio profile picture, artist name, and Instagram.",
}

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  const { user } = session
  const { instagram, musicLinks } = await getProfileExtras(user.id)

  return (
    <>
      <PageHeader
        icon={UserRoundPen}
        eyebrow="Your profile"
        title="Edit"
        accent="Profile"
        description="Change your picture, the artist name shown on the queue, your Instagram, and your released music."
      />
      <section className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-12 sm:px-6">
        <Link
          href="/account"
          className="inline-flex w-fit items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Back to account
        </Link>
        <ProfileForm
          name={user.name || ""}
          email={user.email}
          image={user.image ?? null}
          instagram={instagram}
          musicLinks={musicLinks}
        />
        <Link
          href={`/artists/${user.id}`}
          className="inline-flex w-fit items-center gap-1 self-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          View your public profile
        </Link>
      </section>
    </>
  )
}
