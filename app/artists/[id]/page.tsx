import { notFound, permanentRedirect } from "next/navigation"
import { getHandleForUser } from "@/lib/account"
import { linkPath } from "@/lib/link-page"

export const dynamic = "force-dynamic"

export default async function ArtistProfileRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const handle = await getHandleForUser(id)
  if (!handle) notFound()
  permanentRedirect(linkPath(handle))
}
