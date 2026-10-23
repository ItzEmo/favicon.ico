import type { Metadata } from "next"
import Link from "next/link"
import { Newspaper, ArrowRight } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { BlogComposer } from "@/components/blog-composer"
import { getPosts, formatPostDate } from "@/lib/content"
import { isAdmin } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Blog",
  description: "Notes on the scene, the craft, and what we're hearing on air.",
}

export default async function BlogPage() {
  const [posts, admin] = await Promise.all([getPosts(), isAdmin()])
  const featured = posts.find((p) => p.featured) ?? posts[0]
  const rest = posts.filter((p) => p.id !== featured?.id)

  return (
    <>
      <PageHeader
        icon={Newspaper}
        eyebrow="From the booth"
        title="The"
        accent="Blog"
        description="Notes on the scene, the craft, and the tracks that keep us up past sign-off."
      />

      <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
        {admin ? <BlogComposer /> : null}

        {!featured ? (
          <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No posts yet.
          </p>
        ) : (
          <>
            <Link
              href={`/blog/${featured.slug}`}
              className="group mb-8 flex flex-col gap-4 rounded-3xl border border-border bg-card/80 p-6 shadow-xl shadow-primary/5 transition-colors hover:border-primary/50 sm:p-8"
            >
              <span className="w-fit rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-foreground">
                {featured.category}
              </span>
              <h2 className="text-2xl font-extrabold uppercase tracking-tight text-foreground text-balance sm:text-3xl">
                {featured.title}
              </h2>
              {featured.excerpt ? (
                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty">{featured.excerpt}</p>
              ) : null}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{formatPostDate(featured.publishedAt)}</span>
                <span className="size-1 rounded-full bg-muted-foreground" />
                <span>{featured.readTime} read</span>
                <ArrowRight
                  className="ml-auto size-4 text-primary transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </div>
            </Link>

            {rest.length > 0 ? (
              <ul className="divide-y divide-border/60 rounded-2xl border border-border bg-card/40">
                {rest.map((post) => (
                  <li key={post.id}>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="group flex items-center gap-4 p-5 transition-colors hover:bg-secondary/40"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary">{post.category}</span>
                        <p className="mt-1 truncate text-base font-semibold text-foreground">{post.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatPostDate(post.publishedAt)} &middot; {post.readTime}
                        </p>
                      </div>
                      <ArrowRight
                        className="size-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        )}
      </section>
    </>
  )
}
