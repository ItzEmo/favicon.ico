import { type NextRequest, NextResponse } from "next/server"
import { del, get, head } from "@vercel/blob"
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"
import { getLinkSettings } from "@/lib/account"
import { linkPath } from "@/lib/link-page"

const MAX_SONG_BYTES = 50 * 1024 * 1024
const TYPES: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/aac": "aac",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/ogg": "ogg",
}
const EXTENSIONS = ["mp3", "m4a", "aac", "wav", "ogg"]
const SONG_PREFIX = "/api/account/link-song?p="

function isSongPath(pathname: string) {
  return pathname.startsWith("link-song/") && !pathname.includes("..") && pathname.length < 200
}

async function deleteSong(url: string | null | undefined) {
  if (!url?.startsWith(SONG_PREFIX)) return
  const path = decodeURIComponent(url.slice(SONG_PREFIX.length))
  if (isSongPath(path)) await del(path).catch(() => {})
}

// Songs play publicly on link pages; Range support lets browsers seek and loop.
export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.searchParams.get("p") ?? ""
  if (!isSongPath(pathname)) return new NextResponse("Not found", { status: 404 })

  const range = request.headers.get("range")
  const result = await get(pathname, { access: "private", ...(range ? { headers: { range } } : {}) })
  if (!result || !result.stream) return new NextResponse("Not found", { status: 404 })

  const headers = new Headers({
    "Content-Type": result.blob.contentType ?? "audio/mpeg",
    "Cache-Control": "public, max-age=31536000, immutable",
    "Accept-Ranges": "bytes",
  })
  for (const name of ["content-length", "content-range"]) {
    const value = result.headers.get(name)
    if (value) headers.set(name, value)
  }
  const status = headers.has("content-range") ? 206 : 200
  return new NextResponse(result.stream, { status, headers })
}

function titleFrom(name: string) {
  return (
    decodeURIComponent(name)
      .replace(/\.[^.]+$/, "")
      .replace(/[_-]+/g, " ")
      .trim()
      .slice(0, 80) || "My song"
  )
}

// Share links from Dropbox and Google Drive point at a preview page, not the audio file itself.
function toDirectAudioUrl(raw: string): URL | null {
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    return null
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null
  if (url.hostname.endsWith("dropbox.com")) {
    url.searchParams.delete("dl")
    url.searchParams.set("raw", "1")
  }
  const driveId = url.hostname === "drive.google.com" ? url.pathname.match(/\/file\/d\/([\w-]+)/)?.[1] : null
  if (driveId) return new URL(`https://drive.google.com/uc?export=download&id=${driveId}`)
  return url
}

async function saveSong(userId: string, url: string, title: string) {
  const current = await getLinkSettings(userId)
  await sql`
    UPDATE "user" SET link_song_url = ${url}, link_song_title = ${title}, "updatedAt" = now()
    WHERE id = ${userId}
  `
  if (current?.songUrl !== url) await deleteSong(current?.songUrl)
  if (current) revalidatePath(linkPath(current.handle))
  return NextResponse.json({ url, title })
}

// Files upload straight from the browser to Blob, so the 50 MB limit is not capped by the function body size.
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) return NextResponse.json({ error: "Please sign in" }, { status: 401 })
  const userId = session.user.id
  const ownPrefix = `link-song/${userId}/`

  const body = (await request.json().catch(() => null)) as
    | (HandleUploadBody & { pathname?: never; link?: never })
    | { pathname?: string; link?: string; title?: string }
    | null
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 })

  if ("type" in body && typeof body.type === "string" && body.type.startsWith("blob.")) {
    try {
      const json = await handleUpload({
        body: body as HandleUploadBody,
        request,
        onBeforeGenerateToken: async (pathname) => {
          const ext = pathname.toLowerCase().split(".").pop() ?? ""
          if (!pathname.startsWith(ownPrefix) || !EXTENSIONS.includes(ext)) throw new Error("Use an MP3, M4A, WAV or OGG file")
          return {
            allowedContentTypes: [...Object.keys(TYPES), "audio/wave", "audio/m4a", "application/octet-stream"],
            maximumSizeInBytes: MAX_SONG_BYTES,
            addRandomSuffix: true,
          }
        },
        onUploadCompleted: async () => {},
      })
      return NextResponse.json(json)
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 400 })
    }
  }

  const { pathname, link, title } = body as { pathname?: string; link?: string; title?: string }

  if (typeof pathname === "string") {
    if (!pathname.startsWith(ownPrefix) || !isSongPath(pathname)) {
      return NextResponse.json({ error: "Upload not found" }, { status: 400 })
    }
    const info = await head(pathname).catch(() => null)
    if (!info) return NextResponse.json({ error: "Upload not found" }, { status: 400 })
    if (info.size > MAX_SONG_BYTES) {
      await del(pathname).catch(() => {})
      return NextResponse.json({ error: "Song must be under 50 MB" }, { status: 400 })
    }
    const name = typeof title === "string" && title.trim() ? title : pathname.split("/").pop() ?? ""
    return saveSong(userId, `${SONG_PREFIX}${encodeURIComponent(pathname)}`, titleFrom(name))
  }

  if (typeof link === "string") {
    const url = link.length < 2000 ? toDirectAudioUrl(link) : null
    if (!url) return NextResponse.json({ error: "Paste a valid https:// link to an audio file" }, { status: 400 })
    const name = typeof title === "string" && title.trim() ? title : url.pathname.split("/").pop() || url.hostname
    return saveSong(userId, url.toString(), titleFrom(name))
  }

  return NextResponse.json({ error: "Choose a song file or paste a link" }, { status: 400 })
}

export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) return NextResponse.json({ error: "Please sign in" }, { status: 401 })

  const current = await getLinkSettings(session.user.id)
  await sql`
    UPDATE "user" SET link_song_url = NULL, link_song_title = NULL, "updatedAt" = now()
    WHERE id = ${session.user.id}
  `
  await deleteSong(current?.songUrl)
  if (current) revalidatePath(linkPath(current.handle))

  return NextResponse.json({ ok: true })
}
