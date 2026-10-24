import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextResponse } from "next/server"

const ACCEPTED_EXTS = [".wav", ".mp3", ".mp4", ".m4a"]
const MAX_BYTES = 200 * 1024 * 1024 // 200 MB

// Browsers and OSes report these formats under many different MIME types,
// so allow every variant we know of plus the generic fallback.
const ALLOWED_CONTENT_TYPES = [
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/vnd.wave",
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/x-m4a",
  "audio/m4a",
  "audio/aac",
  "video/mp4",
  "application/octet-stream",
]

// Files are uploaded straight from the browser to Blob storage. This route only
// issues a short-lived upload token, so file size is not limited by the
// serverless request body limit.
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody

  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const lower = pathname.toLowerCase()
        if (!pathname.startsWith("submissions/") || !ACCEPTED_EXTS.some((ext) => lower.endsWith(ext))) {
          throw new Error("Unsupported file type")
        }
        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_BYTES,
          addRandomSuffix: true,
        }
      },
      onUploadCompleted: async () => {},
    })
    return NextResponse.json(json)
  } catch (error) {
    console.log("[v0] upload token error:", (error as Error).message)
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}
