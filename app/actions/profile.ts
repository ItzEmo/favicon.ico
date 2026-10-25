"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { sql } from "@/lib/db"
import { auth } from "@/lib/auth"
import { normalizeInstagram } from "@/lib/account"
import { parseMusicLinks, type MusicLink } from "@/lib/music-links"

export interface ProfileState {
  ok: boolean
  message: string
}

export async function updateProfile(
  _prev: ProfileState | null,
  formData: FormData,
): Promise<ProfileState> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return { ok: false, message: "Please sign in again" }

  const name = String(formData.get("name") ?? "").trim()
  if (!name || name.length > 80) {
    return { ok: false, message: "Artist name must be 1–80 characters" }
  }

  let instagram: string | null
  let musicLinks: MusicLink[]
  try {
    instagram = normalizeInstagram(String(formData.get("instagram") ?? ""))
    musicLinks = parseMusicLinks(
      formData.getAll("linkTitle").map(String),
      formData.getAll("linkUrl").map(String),
    )
  } catch (error) {
    return { ok: false, message: (error as Error).message }
  }

  await sql`
    UPDATE "user"
    SET name = ${name}, instagram = ${instagram},
        music_links = ${JSON.stringify(musicLinks)}::jsonb, "updatedAt" = now()
    WHERE id = ${session.user.id}
  `

  revalidatePath("/account")
  revalidatePath("/account/profile")
  revalidatePath(`/artists/${session.user.id}`)
  return { ok: true, message: "Profile saved" }
}
