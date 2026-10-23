import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Pencil } from "lucide-react"
import { getPostBySlug, formatPostDate } from "@/lib/content"
import { isAdmin } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return { title: "Post not found" }
  return { title: post.title, description: post.excerpt || undefined }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [post, admin] = await Promise.all([getPostBySlug(slug), isAdmin()])
  if (!post) notFound()

  const paragraphs = post.body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

  return (
    <article className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-12 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/blog"
          className="flex w-fit items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          All posts
        </Link>
        {admin ? (
          <Link
            href="/admin#blog"
            className="flex items-center gap-2 rounded-full border border-primary/60 bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary transition-colors hover:bg-primary/20"
          >
            <Pencil className="size-3.5" aria-hidden="true" />
            Edit
          </Link>
        ) : null}
      </div>

      <header className="flex flex-col gap-4">
        <span className="w-fit rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-foreground">
          {post.category}
        </span>
        <h1 className="text-3xl font-extrabold uppercase tracking-tight text-foreground text-balance sm:text-4xl">
          {post.title}
        </h1>
        <p className="text-xs text-muted-foreground">
          {formatPostDate(post.publishedAt)} &middot; {post.readTime} read
        </p>
        {post.excerpt ? (
          <p className="text-lg leading-relaxed text-muted-foreground text-pretty">{post.excerpt}</p>
        ) : null}
      </header>

      <div className="flex flex-col gap-5 border-t border-border pt-6">
        {paragraphs.length > 0 ? (
          paragraphs.map((p, i) => (
            <p key={i} className="whitespace-pre-line text-base leading-relaxed text-foreground/90 text-pretty">
              {p}
            </p>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">The full post is coming soon.</p>
        )}
      </div>
    </article>
  )
}
