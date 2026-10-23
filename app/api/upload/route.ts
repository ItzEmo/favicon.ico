import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

const ACCEPTED = [".wav", ".mp3", ".m4a", ".ogg", ".flac"]
const MAX_BYTES = 50 * 1024 * 1024 // 50 MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const lower = file.name.toLowerCase()
    if (!ACCEPTED.some((ext) => lower.endsWith(ext))) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large" }, { status: 400 })
    }

    // Store privately — submitted audio should not be publicly downloadable.
    // A random suffix avoids collisions between identically named uploads.
    const blob = await put(`submissions/${file.name}`, file, {
      access: "private",
      addRandomSuffix: true,
    })

    // Never return the private blob.url to the client; the pathname is used
    // later to stream the file through the host-only delivery route.
    return NextResponse.json({ pathname: blob.pathname })
  } catch (error) {
    console.log("[v0] upload error:", (error as Error).message)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
