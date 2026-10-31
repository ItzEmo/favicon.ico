"use client"

import { useState } from "react"
import Link from "next/link"
import { PenLine, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PostEditor } from "@/components/post-editor"

export function BlogComposer() {
  const [open, setOpen] = useState(false)

  return (
    <div className="mb-8 flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link
          href="/admin?section=blog"
          className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
        >
          <Settings2 className="size-3.5" aria-hidden="true" />
          Manage posts
        </Link>
        {!open ? (
          <Button
            type="button"
            size="sm"
            onClick={() => setOpen(true)}
            className="rounded-full text-xs font-bold uppercase tracking-wider"
          >
            <PenLine className="size-4" aria-hidden="true" />
            Write a post
          </Button>
        ) : null}
      </div>
      {open ? <PostEditor onDone={() => setOpen(false)} /> : null}
    </div>
  )
}
