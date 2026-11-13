import { type NextRequest, NextResponse } from "next/server"
import { del, get, put } from "@vercel/blob"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"
import { getLinkSettings } from "@/lib/account"
import { linkPath } from "@/lib/link-page"
import { MAX_COVER_BYTES } from "@/lib/release-setup"

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }
const COVER_PREFIX = "/api/account/link-cover?p="

function isCoverPath(pathname: string) {
  return pathname.startsWith("link-cover/") && !pathname.includes("..") && pathname.length < 200
}

async function deleteCover(url: string | null | undefined) {
  if (!url?.startsWith(COVER_PREFIX)) return
  const pathname = decodeURIComponent(url.slice(COVER_PREFIX.length))
  if (isCoverPath(pathname)) await del(pathname).catch(() => {})
}

// Cover art is public on the link page; unique pathnames make it safe to cache forever.
export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.searchParams.get("p") ?? ""
  if (!isCoverPath(pathname)) return new NextResponse("Not found", { status: 404 })
  const result = await get(pathname, { access: "private" })
  if (!result || result.statusCode !== 200) return new NextResponse("Not found", { status: 404 })
  return new NextResponse(result.stream, {
    headers: { "Content-Type": result.blob.contentType, "Cache-Control": "public, max-age=31536000, immutable" },
  })
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) return NextResponse.json({ error: "Please sign in" }, { status: 401 })

  const file = (await request.formData()).get("file")
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image" }, { status: 400 })
  const ext = TYPES[file.type]
  if (!ext) return NextResponse.json({ error: "Use a JPG, PNG or WEBP" }, { status: 400 })
  if (file.size > MAX_COVER_BYTES) return NextResponse.json({ error: "Cover must be under 5 MB" }, { status: 400 })

  const current = await getLinkSettings(session.user.id)
  const blob = await put(`link-cover/${session.user.id}.${ext}`, file, {
    access: "private",
    addRandomSuffix: true,
    contentType: file.type,
  })
  const cover = `${COVER_PREFIX}${encodeURIComponent(blob.pathname)}`
  await sql`UPDATE "user" SET link_release_cover = ${cover}, "updatedAt" = now() WHERE id = ${session.user.id}`

  await deleteCover(current?.releaseCover)
  if (current) revalidatePath(linkPath(current.handle))
  return NextResponse.json({ cover })
}

export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) return NextResponse.json({ error: "Please sign in" }, { status: 401 })
  const current = await getLinkSettings(session.user.id)
  await sql`UPDATE "user" SET link_release_cover = NULL, "updatedAt" = now() WHERE id = ${session.user.id}`
  await deleteCover(current?.releaseCover)
  if (current) revalidatePath(linkPath(current.handle))
  return NextResponse.json({ cover: null })
}
