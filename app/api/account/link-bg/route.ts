import { type NextRequest, NextResponse } from "next/server"
import { del, get, put } from "@vercel/blob"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"
import { getLinkSettings } from "@/lib/account"
import { linkPath } from "@/lib/link-page"
import { revalidatePath } from "next/cache"

const MAX_BYTES = 6 * 1024 * 1024
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
}
const BG_PREFIX = "/api/account/link-bg?p="

function isBackgroundPath(pathname: string) {
  return pathname.startsWith("link-bg/") && !pathname.includes("..") && pathname.length < 200
}

// Link page backgrounds are public; each upload gets a unique pathname so it can be cached forever.
export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.searchParams.get("p") ?? ""
  if (!isBackgroundPath(pathname)) return new NextResponse("Not found", { status: 404 })

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
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image" }, { status: 400 })
  const ext = TYPES[file.type]
  if (!ext) return NextResponse.json({ error: "Use a JPG, PNG, WEBP or GIF" }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Image must be under 6 MB" }, { status: 400 })

  const current = await getLinkSettings(session.user.id)
  const blob = await put(`link-bg/${session.user.id}.${ext}`, file, {
    access: "private",
    addRandomSuffix: true,
    contentType: file.type,
  })
  const image = `${BG_PREFIX}${encodeURIComponent(blob.pathname)}`

  await sql`
    UPDATE "user" SET link_bg_image = ${image}, link_theme = 'custom', "updatedAt" = now()
    WHERE id = ${session.user.id}
  `

  const previous = current?.backgroundImage
  if (previous?.startsWith(BG_PREFIX)) {
    const oldPath = decodeURIComponent(previous.slice(BG_PREFIX.length))
    if (isBackgroundPath(oldPath)) await del(oldPath).catch(() => {})
  }
  if (current) revalidatePath(linkPath(current.handle))

  return NextResponse.json({ image })
}
