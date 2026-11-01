"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/admin-auth"
import { closeOpenPoll, openPollForNowPlaying, recordLiveVote } from "@/lib/live-poll"

export async function startLivePoll() {
  await requireAdmin()
  const result = await openPollForNowPlaying()
  revalidatePath("/ranks")
  return result
}

export async function endLivePoll() {
  await requireAdmin()
  await closeOpenPoll()
  revalidatePath("/ranks")
  return { ok: true }
}

// Lets the admin test the overlay without a chat bridge.
export async function castTestVote(score: number) {
  await requireAdmin()
  const result = await recordLiveVote(`tester${Math.floor(Math.random() * 10000)}`, score)
  revalidatePath("/ranks")
  return result
}
