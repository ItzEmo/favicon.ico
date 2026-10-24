"use client"

import { useRef, useState, type DragEvent, type FormEvent } from "react"
import { upload } from "@vercel/blob/client"
import { UploadCloud, FileAudio, X, Plus, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Track } from "@/components/track-types"

const CONTENT_TYPE_BY_EXT = {
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".m4a": "audio/mp4",
} as const
type AcceptedExt = keyof typeof CONTENT_TYPE_BY_EXT
const ACCEPT_ATTR = "audio/*,video/mp4,.wav,.mp3,.mp4,.m4a"
const MAX_MB = 200
const MULTIPART_THRESHOLD = 10 * 1024 * 1024

function isAcceptedExt(ext: string): ext is AcceptedExt {
  return ext in CONTENT_TYPE_BY_EXT
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function extensionOf(name: string): string {
  const i = name.lastIndexOf(".")
  return i >= 0 ? name.slice(i).toLowerCase() : ""
}

interface FileUploadFormProps {
  onSubmit: (track: Track) => void
  submitLabel?: string
  pending?: boolean
}

export function FileUploadForm({
  onSubmit,
  submitLabel = "Upload Your Track",
  pending = false,
}: FileUploadFormProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [artist, setArtist] = useState("")
  const [title, setTitle] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)

  function pickFile(next: File | undefined) {
    setError(null)
    if (!next) return
    const ext = extensionOf(next.name)
    if (!isAcceptedExt(ext)) {
      setError("Unsupported format. Upload a .wav, .mp3, .mp4, or .m4a file.")
      return
    }
    if (next.size > MAX_MB * 1024 * 1024) {
      setError(`That file is too large. Max ${MAX_MB} MB.`)
      return
    }
    setFile(next)
    if (!title.trim()) setTitle(next.name.replace(/\.[^.]+$/, ""))
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    pickFile(e.dataTransfer.files?.[0])
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!file) {
      setError("Choose an audio file to upload.")
      return
    }
    if (!title.trim()) {
      setError("Enter your track title.")
      return
    }
    if (!artist.trim()) {
      setError("Enter your artist name.")
      return
    }
    setError(null)
    setUploading(true)
    try {
      const ext = extensionOf(file.name)
      const safeName = file.name.replace(/[^\w.\- ]+/g, "_")
      const { pathname } = await upload(`submissions/${safeName}`, file, {
        access: "private",
        handleUploadUrl: "/api/upload",
        contentType: isAcceptedExt(ext) ? CONTENT_TYPE_BY_EXT[ext] : undefined,
        multipart: file.size > MULTIPART_THRESHOLD,
      })

      onSubmit({
        id: crypto.randomUUID(),
        url: file.name,
        title: title.trim(),
        submittedBy: artist.trim(),
        source: "link",
        createdAt: Date.now(),
        audioPathname: pathname,
      })
      setFile(null)
      setArtist("")
      setTitle("")
      if (inputRef.current) inputRef.current.value = ""
    } catch (err) {
      console.log("[v0] file upload error:", (err as Error).message)
      setError("Could not upload your file. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const busy = pending || uploading

  return (
    <form onSubmit={handleSubmit} className="w-full" aria-label="Upload an audio file">
      <div className="flex flex-col gap-4">
        <input
          ref={inputRef}
          id="track-file"
          type="file"
          accept={ACCEPT_ATTR}
          className="sr-only"
          onChange={(e) => pickFile(e.target.files?.[0])}
        />

        {file ? (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-background/60 p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <FileAudio className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatSize(file.size)} {"\u00b7"} {extensionOf(file.name).replace(".", "").toUpperCase()}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFile(null)
                if (inputRef.current) inputRef.current.value = ""
              }}
              aria-label="Remove file"
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={cn(
              "flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
              dragging ? "border-primary bg-primary/10" : "border-input bg-background/40",
            )}
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
              <UploadCloud className="size-6" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-foreground">
                Drag &amp; drop your track here
              </p>
              <p className="text-xs text-muted-foreground">
                WAV, MP3, MP4, or M4A {"\u00b7"} up to {MAX_MB} MB
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full text-xs font-bold uppercase tracking-wider"
              onClick={() => inputRef.current?.click()}
            >
              Browse files
            </Button>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="file-title" className="text-sm font-medium text-foreground">
              Track title <span className="text-primary">*</span>
            </label>
            <input
              id="file-title"
              type="text"
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Artist — Song"
              className="h-11 w-full rounded-lg border border-input bg-background/60 px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="file-artist" className="text-sm font-medium text-foreground">
              Artist name <span className="text-primary">*</span>
            </label>
            <input
              id="file-artist"
              type="text"
              required
              maxLength={80}
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="DJ Nightfall"
              className="h-11 w-full rounded-lg border border-input bg-background/60 px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
            />
          </div>
        </div>

        {error ? (
          <p role="alert" className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          disabled={busy}
          className="h-12 w-full rounded-full text-sm font-bold uppercase tracking-wider shadow-lg shadow-primary/25"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Plus className="size-4" aria-hidden="true" />
          )}
          {uploading ? "Uploading..." : pending ? "Processing..." : submitLabel}
        </Button>
      </div>
    </form>
  )
}
