import { type NextRequest, NextResponse } from "next/server"
import { get } from "@vercel/blob"
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { isAdmin } from "@/lib/admin-auth"
import { isReferencePath, MAX_REFERENCE_BYTES, REFERENCE_EXTENSIONS } from "@/lib/mix-reference"

const AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/x-m4a",
  "audio/m4a",
  "audio/aac",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/ogg",
  "audio/flac",
  "audio/x-flac",
  "application/octet-stream",
]

// Reference tracks are private; only the admin can stream them back.
export async function GET(request: NextRequest) {
  if (!(await isAdmin())) return new NextResponse("Unauthorized", { status: 401 })
  const pathname = request.nextUrl.searchParams.get("p") ?? ""
  if (!isReferencePath(pathname)) return new NextResponse("Not found", { status: 404 })

  const range = request.headers.get("range")
  const result = await get(pathname, { access: "private", ...(range ? { headers: { range } } : {}) })
  if (!result || !result.stream) return new NextResponse("Not found", { status: 404 })

  const headers = new Headers({
    "Content-Type": result.blob.contentType ?? "audio/mpeg",
    "Cache-Control": "private, no-store",
    "Accept-Ranges": "bytes",
  })
  for (const name of ["content-length", "content-range"]) {
    const value = result.headers.get(name)
    if (value) headers.set(name, value)
  }
  return new NextResponse(result.stream, { status: headers.has("content-range") ? 206 : 200, headers })
}

// Browser uploads go straight to Blob so files up to 50 MB aren't capped by the function body limit.
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as HandleUploadBody | null
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 })

  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const ext = pathname.toLowerCase().split(".").pop() ?? ""
        if (!pathname.startsWith("mix-reference/") || !REFERENCE_EXTENSIONS.includes(ext)) {
          throw new Error("Use an MP3, M4A, WAV, FLAC or OGG file")
        }
        return {
          allowedContentTypes: AUDIO_TYPES,
          maximumSizeInBytes: MAX_REFERENCE_BYTES,
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
