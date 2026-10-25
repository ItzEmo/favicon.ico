"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { sql } from "@/lib/db"
import { auth } from "@/lib/auth"
import { getLinkSettings } from "@/lib/account"
import {
  MAX_BIO_LENGTH,
  isLinkAccent,
  isLinkEffect,
  isAvailableHeaderStyle,
  isPresetBackground,
  linkPath,
  normalizeHandle,
  parseCustomLinks,
  type CustomLink,
} from "@/lib/link-page"

export interface LinkPageState {
  ok: boolean
  message: string
}

export async function updateLinkPage(
  _prev: LinkPageState | null,
  formData: FormData,
): Promise<LinkPageState> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return { ok: false, message: "Please sign in again" }

  const current = await getLinkSettings(session.user.id)
  if (!current) return { ok: false, message: "Account not found" }

  let handle: string
  try {
    handle = normalizeHandle(String(formData.get("handle") ?? ""))
  } catch (error) {
    return { ok: false, message: (error as Error).message }
  }

  const bio = String(formData.get("bio") ?? "").trim()
  if (bio.length > MAX_BIO_LENGTH) {
    return { ok: false, message: `Bio must be ${MAX_BIO_LENGTH} characters or less` }
  }

  const background = String(formData.get("background") ?? "rain")
  if (!isPresetBackground(background) && !(background === "custom" && current.backgroundImage)) {
    return { ok: false, message: "Pick a background" }
  }

  const accent = String(formData.get("accent") ?? "violet")
  if (!isLinkAccent(accent)) return { ok: false, message: "Pick an accent color" }

  const effect = String(formData.get("effect") ?? "rain")
  if (!isLinkEffect(effect)) return { ok: false, message: "Pick a background effect" }
  const hideStats = formData.get("hideStats") === "on"
  const headerStyle = String(formData.get("headerStyle") ?? "avatar")
  if (!isAvailableHeaderStyle(headerStyle)) return { ok: false, message: "Pick an available header style" }

  let customLinks: CustomLink[]
  try {
    customLinks = parseCustomLinks(
      formData.getAll("linkTitle").map(String),
      formData.getAll("linkUrl").map(String),
    )
  } catch (error) {
    return { ok: false, message: (error as Error).message }
  }

  try {
    await sql`
      UPDATE "user"
      SET handle = ${handle}, link_bio = ${bio || null}, link_theme = ${background},
          link_accent = ${accent}, link_effect = ${effect}, link_rain = ${effect === "rain"},
          link_custom_links = ${JSON.stringify(customLinks)}::jsonb,
          link_hide_submissions = ${hideStats}, link_hide_avg = ${hideStats},
          link_hide_rank = ${hideStats}, link_header = ${headerStyle}, "updatedAt" = now()
      WHERE id = ${session.user.id}
    `
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return { ok: false, message: `"${handle}" is already taken` }
    }
    throw error
  }

  revalidatePath("/account/profile")
  revalidatePath(linkPath(current.handle))
  revalidatePath(linkPath(handle))
  return { ok: true, message: "Link page saved" }
}
