export const MAX_REFERENCE_BYTES = 50 * 1024 * 1024
export const REFERENCE_EXTENSIONS = ["mp3", "m4a", "aac", "wav", "flac", "ogg"]

export function isReferencePath(pathname: string) {
  return pathname.startsWith("mix-reference/") && !pathname.includes("..") && pathname.length < 200
}

export function referenceUrl(pathname: string) {
  return `/api/mix-master/reference?p=${encodeURIComponent(pathname)}`
}
