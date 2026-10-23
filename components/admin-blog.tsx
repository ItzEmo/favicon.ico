"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Pencil, Trash2, Plus, Star, ExternalLink, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { BlogPost } from "@/lib/content"
import { deletePost } from "@/app/actions/content"
import { PostEditor } from "@/components/post-editor"

const iconBtn =
  "flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30"

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
}

export function AdminBlog({ posts }: { posts: BlogPost[] }) {
  const [editingId, setEditingId] = useState<number | "new" | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [, startTransition] = useTransition()

  function remove(post: BlogPost) {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return
    setBusyId(post.id)
    startTransition(async () => {
      try {
        await deletePost(post.id)
      } catch (err) {
        console.log("[v0] blog delete error:", (err as Error).message)
      } finally {
        setBusyId(null)
      }
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {editingId === "new" ? (
        <PostEditor onDone={() => setEditingId(null)} />
      ) : (
        <Button
          type="button"
          onClick={() => setEditingId("new")}
          className="w-fit rounded-full text-xs font-bold uppercase tracking-wider"
        >
          <Plus className="size-4" aria-hidden="true" />
          New post
        </Button>
      )}

      <ul className="flex flex-col gap-3">
        {posts.map((post) =>
          editingId === post.id ? (
            <li key={post.id}>
              <PostEditor post={post} onDone={() => setEditingId(null)} />
            </li>
          ) : (
            <li
              key={post.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border bg-card p-3 sm:p-4",
                post.featured ? "border-primary/60" : "border-border",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                  {post.featured ? <Star className="size-3 fill-current" aria-label="Featured" /> : null}
                  {post.category}
                </p>
                <p className="truncate text-sm font-medium text-foreground">{post.title}</p>
                <p className="text-xs text-muted-foreground">
                  {shortDate(post.publishedAt)} · {post.readTime}
                </p>
              </div>
              {busyId === post.id ? (
                <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden="true" />
              ) : null}
              <Link href={`/blog/${post.slug}`} aria-label={`View ${post.title}`} className={iconBtn}>
                <ExternalLink className="size-4" aria-hidden="true" />
              </Link>
              <button
                type="button"
                onClick={() => setEditingId(post.id)}
                disabled={busyId !== null}
                aria-label={`Edit ${post.title}`}
                className={iconBtn}
              >
                <Pencil className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => remove(post)}
                disabled={busyId !== null}
                aria-label={`Delete ${post.title}`}
                className={cn(iconBtn, "hover:bg-destructive/15 hover:text-destructive")}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </li>
          ),
        )}
      </ul>
    </div>
  )
}
