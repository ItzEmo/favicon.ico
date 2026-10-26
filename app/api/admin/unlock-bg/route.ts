import { type NextRequest, NextResponse } from "next/server"
import { del, get, head } from "@vercel/blob"
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { revalidatePath } from "next/cache"
import { isAdmin } from "@/lib/admin-auth"
import { UNLOCK_BG_PREFIX, getUnlockBackground, setUnlockBackground } from "@/lib/site-settings"

const MAX_BYTES = 50 * 1024 * 1024
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]
const EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif", "avif"]
const FOLDER = "unlock-bg/"

function isBgPath(pathname: string) {
  return pathname.startsWith(FOLDER) && !pathname.includes("..") && pathname.length < 200
}

async function deleteStored(url: string | null) {
  if (!url?.startsWith(UNLOCK_BG_PREFIX)) return
  const path = decodeURIComponent(url.slice(UNLOCK_BG_PREFIX.length))
  if (isBgPath(path)) await del(path).catch(() => {})
}

async function save(url: string | null) {
  const previous = await getUnlockBackground()
  await setUnlockBackground(url)
  if (previous !== url) await deleteStored(previous)
  revalidatePath("/", "layout")
  return NextResponse.json({ url })
}

// The unlock screen is public, so stored backgrounds are served to everyone.
export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.searchParams.get("p") ?? ""
  if (!isBgPath(pathname)) return new NextResponse("Not found", { status: 404 })
  const result = await get(pathname, { access: "private" })
  if (!result?.stream) return new NextResponse("Not found", { status: 404 })
  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType ?? "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = (await request.json().catch(() => null)) as
    | HandleUploadBody
    | { pathname?: string; link?: string }
    | null
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 })

  if ("type" in body && typeof body.type === "string" && body.type.startsWith("blob.")) {
    try {
      const json = await handleUpload({
        body: body as HandleUploadBody,
        request,
        onBeforeGenerateToken: async (pathname) => {
          const ext = pathname.toLowerCase().split(".").pop() ?? ""
          if (!isBgPath(pathname) || !EXTENSIONS.includes(ext)) throw new Error("Use a JPG, PNG, WEBP or GIF file")
          return { allowedContentTypes: IMAGE_TYPES, maximumSizeInBytes: MAX_BYTES, addRandomSuffix: true }
        },
        onUploadCompleted: async () => {},
      })
      return NextResponse.json(json)
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 400 })
    }
  }

  const { pathname, link } = body as { pathname?: string; link?: string }

  if (typeof pathname === "string") {
    if (!isBgPath(pathname)) return NextResponse.json({ error: "Upload not found" }, { status: 400 })
    const info = await head(pathname).catch(() => null)
    if (!info) return NextResponse.json({ error: "Upload not found" }, { status: 400 })
    if (info.size > MAX_BYTES) {
      await del(pathname).catch(() => {})
      return NextResponse.json({ error: "File must be under 50 MB" }, { status: 400 })
    }
    return save(`${UNLOCK_BG_PREFIX}${encodeURIComponent(pathname)}`)
  }

  if (typeof link === "string") {
    let url: URL | null = null
    try {
      url = link.length < 2000 ? new URL(link.trim()) : null
    } catch {}
    if (!url || url.protocol !== "https:") {
      return NextResponse.json({ error: "Paste a valid https:// link to an image or GIF" }, { status: 400 })
    }
    return save(url.toString())
  }

  return NextResponse.json({ error: "Choose a file or paste a link" }, { status: 400 })
}

export async function DELETE() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return save(null)
}
