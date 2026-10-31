"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/admin-auth"
import { normalizeTikTokHandle, saveTikTokLive, type TikTokLiveStatus, getTikTokLiveStatus } from "@/lib/tiktok-live"

export async function updateTikTokLive(rawHandle: string, live: boolean): Promise<TikTokLiveStatus> {
  await requireAdmin()
  const handle = normalizeTikTokHandle(String(rawHandle ?? ""))
  if (live && !handle) throw new Error("Add your TikTok username before going live")
  await saveTikTokLive(handle, live === true)
  revalidatePath("/admin")
  return getTikTokLiveStatus()
}
