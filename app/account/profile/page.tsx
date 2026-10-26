import type { Metadata } from "next"
import Link from "next/link"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { ChevronLeft, UserRoundPen } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { ProfileForm } from "@/components/profile-form"
import { auth } from "@/lib/auth"
import { getLinkSettings, getProfileExtras } from "@/lib/account"
import { LinkPageEditor } from "@/components/link-page-editor"
import { UnlockBackgroundEditor } from "@/components/unlock-background-editor"
import { isAdmin } from "@/lib/admin-auth"
import { DEFAULT_UNLOCK_BG, getUnlockBackground } from "@/lib/site-settings"

export const metadata: Metadata = {
  title: "Edit Profile",
  description: "Update your Emo's Radio profile picture, artist name, and Instagram.",
}

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  const { user } = session
  const [{ instagram, musicLinks }, linkSettings, requestHeaders, admin] = await Promise.all([
    getProfileExtras(user.id),
    getLinkSettings(user.id),
    headers(),
    isAdmin(),
  ])
  const unlockBg = admin ? await getUnlockBackground().catch(() => null) : null
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000"
  const proto = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")
  const origin = `${proto}://${host}`

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
        {admin && <UnlockBackgroundEditor current={unlockBg} fallback={DEFAULT_UNLOCK_BG} />}
        {linkSettings && <LinkPageEditor settings={linkSettings} origin={origin} userId={user.id} />}
      </section>
    </>
  )
}
