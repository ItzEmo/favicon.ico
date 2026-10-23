import type { Metadata } from "next"
import Link from "next/link"
import { Swords, Pencil } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { ArenaBattles } from "@/components/arena-battles"
import { getBattles } from "@/lib/content"
import { isAdmin } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Arena",
  description: "Two tracks enter, the crew decides. Vote head to head.",
}

export default async function ArenaPage() {
  const [battles, admin] = await Promise.all([getBattles(), isAdmin()])

  return (
    <>
      <PageHeader
        icon={Swords}
        eyebrow="Head to head"
        title="The"
        accent="Arena"
        description="Two tracks enter, the crew decides. Cast your vote and push your favorite to the next round."
      />

      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-12 sm:px-6">
        {admin ? (
          <Link
            href="/admin#arena"
            className="flex w-fit items-center gap-2 self-end rounded-full border border-primary/60 bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary transition-colors hover:bg-primary/20"
          >
            <Pencil className="size-3.5" aria-hidden="true" />
            Edit Arena
          </Link>
        ) : null}
        <ArenaBattles battles={battles} />
      </section>
    </>
  )
}
