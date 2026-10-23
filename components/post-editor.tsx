"use client"

import { useActionState, useEffect, useRef } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { BlogPost } from "@/lib/content"
import { savePost, type ContentActionState } from "@/app/actions/content"

const fieldClass =
  "w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
const labelClass = "flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground"

export function PostEditor({
  post,
  onDone,
  className,
}: {
  post?: BlogPost
  onDone?: () => void
  className?: string
}) {
  const [state, action, pending] = useActionState<ContentActionState, FormData>(savePost, { ok: false })
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (!state.ok) return
    if (!post) formRef.current?.reset()
    onDone?.()
  }, [state, post, onDone])

  return (
    <form
      ref={formRef}
      action={action}
      className={cn("flex flex-col gap-3 rounded-2xl border border-primary/50 bg-card p-4 sm:p-5", className)}
    >
      <input type="hidden" name="id" value={post?.id ?? 0} />
      <label className={labelClass}>
        Title
        <input name="title" required maxLength={160} defaultValue={post?.title} placeholder="Headline" className={fieldClass} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={labelClass}>
          Category
          <input
            name="category"
            required
            maxLength={40}
            defaultValue={post?.category}
            placeholder="Craft, Interview, Guide..."
            className={fieldClass}
          />
        </label>
        <label className={labelClass}>
          Read time
          <input name="readTime" maxLength={20} defaultValue={post?.readTime ?? "5 min"} className={fieldClass} />
        </label>
      </div>
      <label className={labelClass}>
        Excerpt
        <textarea
          name="excerpt"
          maxLength={400}
          rows={2}
          defaultValue={post?.excerpt}
          placeholder="One or two sentences shown on the Blog page"
          className={cn(fieldClass, "resize-y leading-relaxed")}
        />
      </label>
      <label className={labelClass}>
        Post
        <textarea
          name="body"
          maxLength={50000}
          rows={10}
          defaultValue={post?.body}
          placeholder="Write the full post. Leave a blank line between paragraphs."
          className={cn(fieldClass, "resize-y normal-case leading-relaxed tracking-normal")}
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" name="featured" defaultChecked={post?.featured} className="size-4 accent-primary" />
        Feature this post at the top of the Blog
      </label>

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        {onDone ? (
          <Button type="button" variant="outline" size="sm" onClick={onDone} className="rounded-full">
            Cancel
          </Button>
        ) : null}
        <Button type="submit" size="sm" disabled={pending} className="rounded-full font-bold uppercase tracking-wider">
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          {post ? "Save changes" : "Publish post"}
        </Button>
      </div>
    </form>
  )
}
