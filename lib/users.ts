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

export async function getAdminUser(userId: string): Promise<AdminUser | null> {
  const users = await getAllUsers()
  return users.find((u) => u.id === userId) ?? null
}

export interface GuestSubmitter {
  key: string
  name: string
  submissions: number
  firstAt: string
  lastAt: string
}

export function guestKey(name: string): string {
  return name.trim().toLowerCase()
}

// Guests have no account, so they are grouped by the name they typed in.
export async function getGuestSubmitters(): Promise<GuestSubmitter[]> {
  const rows = (await sql`
    SELECT lower(btrim(submitted_by)) AS key,
           (array_agg(submitted_by ORDER BY created_at DESC))[1] AS name,
           count(*)::int AS submissions,
           min(created_at) AS first_at,
           max(created_at) AS last_at
    FROM submissions
    WHERE user_id IS NULL AND status <> 'pending' AND btrim(coalesce(submitted_by, '')) <> ''
    GROUP BY 1
    ORDER BY max(created_at) DESC
  `) as { key: string; name: string; submissions: number; first_at: string; last_at: string }[]

  return rows.map((r) => ({
    key: r.key,
    name: r.name.trim(),
    submissions: r.submissions,
    firstAt: new Date(r.first_at).toISOString(),
    lastAt: new Date(r.last_at).toISOString(),
  }))
}

export interface AdminSubmission {
  trackId: string
  title: string
  url: string | null
  submittedBy: string
  status: string
  line: string
  boosted: boolean
  createdAt: string
  avgScore: number | null
}

type SubmissionRow = {
  track_id: string
  title: string
  url: string | null
  submitted_by: string
  status: string
  line: string
  boosted: boolean
  created_at: string
  avg_score: number | null
}

function mapSubmission(r: SubmissionRow): AdminSubmission {
  return {
    trackId: r.track_id,
    title: r.title,
    url: r.url,
    submittedBy: r.submitted_by,
    status: r.status,
    line: r.line,
    boosted: r.boosted,
    createdAt: new Date(r.created_at).toISOString(),
    avgScore: r.avg_score,
  }
}

export async function getAccountSubmissionsForAdmin(userId: string): Promise<AdminSubmission[]> {
  const rows = (await sql`
    SELECT s.track_id, s.title, s.url, s.submitted_by, s.status, s.line, s.boosted, s.created_at,
           avg(r.score)::float AS avg_score
    FROM submissions s
    LEFT JOIN track_ratings r ON r.track_id = s.track_id
    WHERE s.user_id = ${userId}
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `) as SubmissionRow[]
  return rows.map(mapSubmission)
}

export async function getGuestSubmissionsForAdmin(key: string): Promise<AdminSubmission[]> {
  const rows = (await sql`
    SELECT s.track_id, s.title, s.url, s.submitted_by, s.status, s.line, s.boosted, s.created_at,
           avg(r.score)::float AS avg_score
    FROM submissions s
    LEFT JOIN track_ratings r ON r.track_id = s.track_id
    WHERE s.user_id IS NULL AND s.status <> 'pending' AND lower(btrim(s.submitted_by)) = ${key}
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `) as SubmissionRow[]
  return rows.map(mapSubmission)
}

export async function isUserBanned(userId: string): Promise<boolean> {
  const rows = (await sql`
    SELECT banned FROM public."user" WHERE id = ${userId} LIMIT 1
  `) as { banned: boolean }[]
  return rows[0]?.banned ?? false
}
