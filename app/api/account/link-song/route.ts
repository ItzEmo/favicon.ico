import { type NextRequest, NextResponse } from "next/server"
import { del, get, put } from "@vercel/blob"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"
import { getLinkSettings } from "@/lib/account"
import { linkPath } from "@/lib/link-page"

const MAX_SONG_BYTES = 15 * 1024 * 1024
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

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) return NextResponse.json({ error: "Please sign in" }, { status: 401 })

  const form = await request.formData()
  const file = form.get("file")
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a song file" }, { status: 400 })
  const ext = TYPES[file.type]
  if (!ext) return NextResponse.json({ error: "Use an MP3, M4A, WAV or OGG file" }, { status: 400 })
  if (file.size > MAX_SONG_BYTES) return NextResponse.json({ error: "Song must be under 15 MB" }, { status: 400 })

  const title = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim().slice(0, 80) || "My song"
  const current = await getLinkSettings(session.user.id)
  const blob = await put(`link-song/${session.user.id}.${ext}`, file, {
    access: "private",
    addRandomSuffix: true,
    contentType: file.type,
  })
  const url = `${SONG_PREFIX}${encodeURIComponent(blob.pathname)}`

  await sql`
    UPDATE "user" SET link_song_url = ${url}, link_song_title = ${title}, "updatedAt" = now()
    WHERE id = ${session.user.id}
  `
  await deleteSong(current?.songUrl)
  if (current) revalidatePath(linkPath(current.handle))

  return NextResponse.json({ url, title })
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
