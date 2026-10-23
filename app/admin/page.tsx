import { notFound } from "next/navigation"
import { ShieldCheck, ListMusic, Swords, Newspaper, Archive, Disc3 } from "lucide-react"
import { getArtistLinks } from "@/lib/artist-links"
import { AdminMusicLinks } from "@/components/admin-music-links"
import { isAdmin } from "@/lib/admin-auth"
import { getBattles, getPosts } from "@/lib/content"
import { getVaultEntries } from "@/lib/vault"
import { AdminVault } from "@/components/admin-vault"
import { PageHeader } from "@/components/page-header"
import { AdminQueue } from "@/components/admin-queue"
import { AdminArena } from "@/components/admin-arena"
import { AdminBlog } from "@/components/admin-blog"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
}

const SECTIONS = [
  { id: "queue", label: "Queue", icon: ListMusic },
  { id: "vault", label: "Vault", icon: Archive },
  { id: "arena", label: "Arena", icon: Swords },
  { id: "blog", label: "Blog", icon: Newspaper },
  { id: "my-music", label: "My Music", icon: Disc3 },
] as const

function SectionHeading({ icon: Icon, title, note }: { icon: typeof Swords; title: string; note: string }) {
  return (
    <div className="mb-4 flex flex-col gap-1">
      <h2 className="flex items-center gap-2 text-lg font-extrabold uppercase tracking-tight text-foreground">
        <Icon className="size-5 text-primary" aria-hidden="true" />
        {title}
      </h2>
      <p className="text-sm text-muted-foreground">{note}</p>
    </div>
  )
}

export default async function AdminPage() {
  if (!(await isAdmin())) notFound()
  const [battles, posts, vaultEntries, musicLinks] = await Promise.all([
    getBattles(),
    getPosts(),
    getVaultEntries(),
    getArtistLinks(),
  ])
  const archivedTrackIds = vaultEntries.flatMap((e) => (e.trackId ? [e.trackId] : []))

  return (
    <>
      <PageHeader
        icon={ShieldCheck}
        eyebrow="Host controls"
        title="Admin"
        accent="Console"
        description="Run the queue, archive reviews to the Vault, set up Arena matchups, and publish to the Blog."
      />

      <nav
        aria-label="Admin sections"
        className="border-b border-border/60"
      >
        <ul className="mx-auto flex w-full max-w-2xl gap-2 overflow-x-auto px-4 py-3 sm:px-6">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className="flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
              >
                <Icon className="size-3.5" aria-hidden="true" />
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-14 px-4 py-10 sm:px-6">
        <section id="queue" className="scroll-mt-36">
          <SectionHeading icon={ListMusic} title="Queue" note="Reorder tracks, remove anything, and run the session." />
          <AdminQueue archivedTrackIds={archivedTrackIds} />
        </section>

        <section id="vault" className="scroll-mt-36">
          <SectionHeading
            icon={Archive}
            title="Vault"
            note="Every song you've reviewed and locked in. Edit scores and verdicts or take entries down."
          />
          <AdminVault entries={vaultEntries} />
        </section>

        <section id="arena" className="scroll-mt-36">
          <SectionHeading
            icon={Swords}
            title="Arena"
            note="Move matchups up or down, swap sides, edit songs and votes, or remove them."
          />
          <AdminArena battles={battles} />
        </section>

        <section id="blog" className="scroll-mt-36">
          <SectionHeading icon={Newspaper} title="Blog" note="Publish new posts, edit existing ones, or delete them." />
          <AdminBlog posts={posts} />
        </section>

        <section id="my-music" className="scroll-mt-36">
          <SectionHeading
            icon={Disc3}
            title="My Music"
            note="Your Spotify and Apple Music links. Their players show on the unlock screen."
          />
          <AdminMusicLinks links={musicLinks} />
        </section>
      </div>
    </>
  )
}
