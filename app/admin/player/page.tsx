import { notFound } from "next/navigation"
import { Headphones } from "lucide-react"
import { isAdmin } from "@/lib/admin-auth"
import { PageHeader } from "@/components/page-header"
import { DjPlayer } from "@/components/dj-player"

export const metadata = {
  title: "DJ Player",
  robots: { index: false, follow: false },
}

export default async function AdminPlayerPage() {
  if (!(await isAdmin())) notFound()

  return (
    <>
      <PageHeader
        icon={Headphones}
        eyebrow="Host only"
        title="DJ"
        accent="Player"
        description="Play through tonight's queue in order. Uploaded tracks play right here; free-line submissions get a 1:30 preview. Mark each one played to advance."
      />
      <section className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
        <DjPlayer />
      </section>
    </>
  )
}
