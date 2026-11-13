"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { sql } from "@/lib/db"
import { auth } from "@/lib/auth"
import { getLinkSettings } from "@/lib/account"
import { linkPath } from "@/lib/link-page"
import {
  MAX_RELEASE_TITLE,
  RELEASE_PLATFORM_KEYS,
  isReleaseEyebrow,
  parseReleaseLink,
  type ReleaseSetup,
} from "@/lib/release-setup"

export interface LinkReleaseState {
  ok: boolean
  message: string
}

export async function saveLinkRelease(_prev: LinkReleaseState | null, formData: FormData): Promise<LinkReleaseState> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return { ok: false, message: "Please sign in again" }

  const title = String(formData.get("title") ?? "").trim()
  if (!title) return { ok: false, message: "Give your release a title" }
  if (title.length > MAX_RELEASE_TITLE) return { ok: false, message: `Titles must be ${MAX_RELEASE_TITLE} characters or fewer` }

  const eyebrow = String(formData.get("eyebrow") ?? "out_now")
  if (!isReleaseEyebrow(eyebrow)) return { ok: false, message: "Pick a label for your release" }

  const links: ReleaseSetup["links"] = {}
  try {
    for (const key of RELEASE_PLATFORM_KEYS) {
      const url = parseReleaseLink(key, String(formData.get(key) ?? ""))
      if (url) links[key] = url
    }
  } catch (error) {
    return { ok: false, message: (error as Error).message }
  }

  const release: ReleaseSetup = { title, eyebrow, links }
  await sql`
    UPDATE "user" SET link_release = ${JSON.stringify(release)}::jsonb, "updatedAt" = now()
    WHERE id = ${session.user.id}
  `
  await revalidate(session.user.id)
  return { ok: true, message: "Release card saved" }
}

export async function clearLinkRelease(): Promise<LinkReleaseState> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return { ok: false, message: "Please sign in again" }
  await sql`UPDATE "user" SET link_release = NULL, "updatedAt" = now() WHERE id = ${session.user.id}`
  await revalidate(session.user.id)
  return { ok: true, message: "Release card removed" }
}

async function revalidate(userId: string) {
  const settings = await getLinkSettings(userId)
  revalidatePath("/account/profile")
  if (settings) revalidatePath(linkPath(settings.handle))
}
