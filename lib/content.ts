import "server-only"

import { sql } from "@/lib/db"

export interface Battle {
  id: number
  round: string
  aTitle: string
  aArtist: string
  aVotes: number
  bTitle: string
  bArtist: string
  bVotes: number
}

export interface BlogPost {
  id: number
  slug: string
  category: string
  title: string
  excerpt: string
  body: string
  readTime: string
  featured: boolean
  publishedAt: string
}

interface BattleRow {
  id: number
  round: string
  a_title: string
  a_artist: string
  a_votes: number
  b_title: string
  b_artist: string
  b_votes: number
}

interface PostRow {
  id: number
  slug: string
  category: string
  title: string
  excerpt: string
  body: string
  read_time: string
  featured: boolean
  published_at: string | Date
}

function toBattle(r: BattleRow): Battle {
  return {
    id: r.id,
    round: r.round,
    aTitle: r.a_title,
    aArtist: r.a_artist,
    aVotes: r.a_votes,
    bTitle: r.b_title,
    bArtist: r.b_artist,
    bVotes: r.b_votes,
  }
}

function toPost(r: PostRow): BlogPost {
  return {
    id: r.id,
    slug: r.slug,
    category: r.category,
    title: r.title,
    excerpt: r.excerpt,
    body: r.body,
    readTime: r.read_time,
    featured: r.featured,
    publishedAt: new Date(r.published_at).toISOString(),
  }
}

export async function getBattles(): Promise<Battle[]> {
  const rows = (await sql`
    SELECT id, round, a_title, a_artist, a_votes, b_title, b_artist, b_votes
    FROM arena_battles
    ORDER BY position ASC, id ASC
  `) as BattleRow[]
  return rows.map(toBattle)
}

export async function getPosts(): Promise<BlogPost[]> {
  const rows = (await sql`
    SELECT id, slug, category, title, excerpt, body, read_time, featured, published_at
    FROM blog_posts
    ORDER BY featured DESC, published_at DESC, id DESC
  `) as PostRow[]
  return rows.map(toPost)
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const rows = (await sql`
    SELECT id, slug, category, title, excerpt, body, read_time, featured, published_at
    FROM blog_posts
    WHERE slug = ${slug}
    LIMIT 1
  `) as PostRow[]
  return rows[0] ? toPost(rows[0]) : null
}

export function formatPostDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
}
