import { type NextRequest, NextResponse } from "next/server"
import { del, get, put } from "@vercel/blob"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"

const MAX_BYTES = 4 * 1024 * 1024
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
}
const AVATAR_PREFIX = "/api/account/avatar?p="

function isAvatarPath(pathname: string) {
  return pathname.startsWith("avatars/") && !pathname.includes("..") && pathname.length < 200
}

// Profile pictures are public, so anyone can load them; the stored pathname
// is unique per upload, which lets browsers cache it indefinitely.
export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.searchParams.get("p") ?? ""
  if (!isAvatarPath(pathname)) return new NextResponse("Not found", { status: 404 })

  const result = await get(pathname, { access: "private" })
  if (!result || result.statusCode !== 200) return new NextResponse("Not found", { status: 404 })

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) return NextResponse.json({ error: "Please sign in" }, { status: 401 })

  const form = await request.formData()
  const file = form.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose an image" }, { status: 400 })
  }
  const ext = TYPES[file.type]
  if (!ext) {
    return NextResponse.json({ error: "Use a JPG, PNG, WEBP or GIF" }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be under 4 MB" }, { status: 400 })
  }

  const blob = await put(`avatars/${session.user.id}.${ext}`, file, {
    access: "private",
    addRandomSuffix: true,
    contentType: file.type,
  })
  const image = `${AVATAR_PREFIX}${encodeURIComponent(blob.pathname)}`

  const previous = session.user.image
  await sql`UPDATE "user" SET image = ${image}, "updatedAt" = now() WHERE id = ${session.user.id}`

  if (previous?.startsWith(AVATAR_PREFIX)) {
    const oldPath = decodeURIComponent(previous.slice(AVATAR_PREFIX.length))
    if (isAvatarPath(oldPath)) await del(oldPath).catch(() => {})
  }

  return NextResponse.json({ image })
}
