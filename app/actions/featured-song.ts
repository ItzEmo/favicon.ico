"use server"

import { revalidatePath } from "next/cache"
import { isAdmin } from "@/lib/admin-auth"
import { setFeaturedTrackId } from "@/lib/site-settings"

export async function saveFeaturedSong(trackId: string | null) {
  if (!(await isAdmin())) return { error: "Not authorized" }
  if (trackId !== null && !/^\d{1,15}$/.test(trackId)) return { error: "Invalid song" }
  await setFeaturedTrackId(trackId)
  revalidatePath("/", "layout")
  return { ok: true as const }
}
