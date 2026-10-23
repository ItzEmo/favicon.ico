"use server"

import { revalidatePath } from "next/cache"
import { sql } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"

export type ContentActionState = { ok: boolean; error?: string; slug?: string }

function text(formData: FormData, key: string, max: number, required = true): string {
  const value = String(formData.get(key) ?? "").trim()
  if (required && !value) throw new Error(`Missing ${key}`)
  if (value.length > max) throw new Error(`${key} is too long`)
  return value
}

function votes(formData: FormData, key: string): number {
  const n = Number(formData.get(key) ?? 0)
  if (!Number.isInteger(n) || n < 0 || n > 10_000_000) throw new Error(`Invalid ${key}`)
  return n
}

function revalidateArena() {
  revalidatePath("/arena")
  revalidatePath("/admin")
}

function revalidateBlog(slug?: string) {
  revalidatePath("/blog")
  revalidatePath("/admin")
  if (slug) revalidatePath(`/blog/${slug}`)
}

function failure(err: unknown, fallback: string): ContentActionState {
  console.log("[v0] content action error:", (err as Error).message)
  const msg = (err as Error).message
  return { ok: false, error: msg === "Unauthorized" ? "You need to be signed in as admin." : fallback }
}

// ---------- Arena ----------

export async function saveBattle(
  _prev: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  try {
    await requireAdmin()
    const id = Number(formData.get("id") ?? 0)
    const round = text(formData, "round", 60)
    const aTitle = text(formData, "aTitle", 120)
    const aArtist = text(formData, "aArtist", 80)
    const bTitle = text(formData, "bTitle", 120)
    const bArtist = text(formData, "bArtist", 80)
    const aVotes = votes(formData, "aVotes")
    const bVotes = votes(formData, "bVotes")

    if (id > 0) {
      await sql`
        UPDATE arena_battles
        SET round = ${round}, a_title = ${aTitle}, a_artist = ${aArtist}, a_votes = ${aVotes},
            b_title = ${bTitle}, b_artist = ${bArtist}, b_votes = ${bVotes}
        WHERE id = ${id}
      `
    } else {
      await sql`
        INSERT INTO arena_battles (round, a_title, a_artist, a_votes, b_title, b_artist, b_votes, position)
        VALUES (${round}, ${aTitle}, ${aArtist}, ${aVotes}, ${bTitle}, ${bArtist}, ${bVotes},
          (SELECT COALESCE(MAX(position), 0) + 1 FROM arena_battles))
      `
    }
    revalidateArena()
    return { ok: true }
  } catch (err) {
    return failure(err, "Please fill in every song and artist field.")
  }
}

export async function deleteBattle(id: number): Promise<void> {
  await requireAdmin()
  await sql`DELETE FROM arena_battles WHERE id = ${id}`
  revalidateArena()
}

// Swap a matchup's position with its neighbor in the current Arena order.
export async function moveBattle(id: number, direction: "up" | "down"): Promise<void> {
  await requireAdmin()
  const rows = (await sql`
    SELECT id FROM arena_battles ORDER BY position ASC, id ASC
  `) as { id: number }[]
  const index = rows.findIndex((r) => r.id === id)
  const neighbor = direction === "up" ? index - 1 : index + 1
  if (index === -1 || neighbor < 0 || neighbor >= rows.length) return

  const order = rows.map((r) => r.id)
  ;[order[index], order[neighbor]] = [order[neighbor], order[index]]
  // Re-number every row so duplicate or missing positions can't stall a move.
  for (let i = 0; i < order.length; i++) {
    await sql`UPDATE arena_battles SET position = ${i + 1} WHERE id = ${order[i]}`
  }
  revalidateArena()
}

// Swap the two songs inside one matchup (left <-> right).
export async function swapBattleSides(id: number): Promise<void> {
  await requireAdmin()
  await sql`
    UPDATE arena_battles
    SET a_title = b_title, a_artist = b_artist, a_votes = b_votes,
        b_title = a_title, b_artist = a_artist, b_votes = a_votes
    WHERE id = ${id}
  `
  revalidateArena()
}

// ---------- Blog ----------

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
  return base || "post"
}

async function uniqueSlug(title: string, ignoreId: number): Promise<string> {
  const base = slugify(title)
  let slug = base
  for (let n = 2; ; n++) {
    const rows = (await sql`
      SELECT 1 FROM blog_posts WHERE slug = ${slug} AND id <> ${ignoreId} LIMIT 1
    `) as unknown[]
    if (rows.length === 0) return slug
    slug = `${base}-${n}`
  }
}

export async function savePost(
  _prev: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  try {
    await requireAdmin()
    const id = Number(formData.get("id") ?? 0)
    const title = text(formData, "title", 160)
    const category = text(formData, "category", 40)
    const excerpt = text(formData, "excerpt", 400, false)
    const body = text(formData, "body", 50_000, false)
    const readTime = text(formData, "readTime", 20, false) || "5 min"
    const featured = formData.get("featured") === "on"

    let slug: string
    if (id > 0) {
      const existing = (await sql`SELECT slug FROM blog_posts WHERE id = ${id}`) as { slug: string }[]
      if (!existing[0]) return { ok: false, error: "That post no longer exists." }
      slug = existing[0].slug
      if (featured) await sql`UPDATE blog_posts SET featured = false WHERE id <> ${id}`
      await sql`
        UPDATE blog_posts
        SET title = ${title}, category = ${category}, excerpt = ${excerpt}, body = ${body},
            read_time = ${readTime}, featured = ${featured}
        WHERE id = ${id}
      `
    } else {
      slug = await uniqueSlug(title, 0)
      if (featured) await sql`UPDATE blog_posts SET featured = false`
      await sql`
        INSERT INTO blog_posts (slug, category, title, excerpt, body, read_time, featured)
        VALUES (${slug}, ${category}, ${title}, ${excerpt}, ${body}, ${readTime}, ${featured})
      `
    }
    revalidateBlog(slug)
    return { ok: true, slug }
  } catch (err) {
    return failure(err, "Add a title and category, and keep fields within their limits.")
  }
}

export async function deletePost(id: number): Promise<void> {
  await requireAdmin()
  const rows = (await sql`DELETE FROM blog_posts WHERE id = ${id} RETURNING slug`) as { slug: string }[]
  revalidateBlog(rows[0]?.slug)
}
