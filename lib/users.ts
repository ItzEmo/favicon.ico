import "server-only"

import { sql } from "@/lib/db"

export interface AdminUser {
  id: string
  name: string
  email: string
  image: string | null
  instagram: string | null
  createdAt: string
  banned: boolean
  banReason: string | null
  bannedAt: string | null
  submissions: number
}

export async function getAllUsers(): Promise<AdminUser[]> {
  const rows = (await sql`
    SELECT u.id, u.name, u.email, u.image, u.instagram, u."createdAt" AS created_at,
           u.banned, u.ban_reason, u.banned_at,
           count(s.id) FILTER (WHERE s.status <> 'pending')::int AS submissions
    FROM public."user" u
    LEFT JOIN submissions s ON s.user_id = u.id
    GROUP BY u.id
    ORDER BY u."createdAt" DESC
  `) as {
    id: string
    name: string
    email: string
    image: string | null
    instagram: string | null
    created_at: string
    banned: boolean
    ban_reason: string | null
    banned_at: string | null
    submissions: number
  }[]

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    image: r.image,
    instagram: r.instagram,
    createdAt: new Date(r.created_at).toISOString(),
    banned: r.banned,
    banReason: r.ban_reason,
    bannedAt: r.banned_at ? new Date(r.banned_at).toISOString() : null,
    submissions: r.submissions,
  }))
}

export async function isUserBanned(userId: string): Promise<boolean> {
  const rows = (await sql`
    SELECT banned FROM public."user" WHERE id = ${userId} LIMIT 1
  `) as { banned: boolean }[]
  return rows[0]?.banned ?? false
}
