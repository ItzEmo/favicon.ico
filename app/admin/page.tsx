import Link from "next/link"
import { notFound } from "next/navigation"
import { headers } from "next/headers"
import { ShieldCheck, ListMusic, Swords, Newspaper, Archive, Disc3, History, Users, UserRound, SlidersHorizontal, MonitorPlay } from "lucide-react"
import { AdminOverlayLink } from "@/components/admin-overlay-link"
import { AdminTikTokLive } from "@/components/admin-tiktok-live"
import { getTikTokLiveStatus } from "@/lib/tiktok-live"
import { AdminMixOrders } from "@/components/admin-mix-orders"
import { getPaidMixOrders } from "@/lib/mix-master"
import { AdminUsers } from "@/components/admin-users"
import { AdminGuests } from "@/components/admin-guests"
import { getAllUsers, getGuestSubmitters } from "@/lib/users"
import { DjPlayer } from "@/components/dj-player"
import { AdminQueueHistory } from "@/components/admin-queue-history"
import { getArtistLinkSettings } from "@/lib/artist-links"
import { AdminMusicLinks } from "@/components/admin-music-links"
import { isAdmin } from "@/lib/admin-auth"
import { getBattles, getPosts } from "@/lib/content"
import { getVaultEntries } from "@/lib/vault"
import { AdminVault } from "@/components/admin-vault"
import { PageHeader } from "@/components/page-header"
import { AdminQueue } from "@/components/admin-queue"
import { AdminQueueSwitches } from "@/components/admin-queue-switches"
import { AdminClearQueue } from "@/components/admin-clear-queue"
import { getQueueStatus } from "@/lib/queue-settings"
import { AdminArena } from "@/components/admin-arena"
import { AdminBlog } from "@/components/admin-blog"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
}

const SECTIONS = [
  { id: "queue", label: "Queue", icon: ListMusic },
  { id: "overlay", label: "Overlay", icon: MonitorPlay },
  { id: "history", label: "History", icon: History },
  { id: "vault", label: "Vault", icon: Archive },
  { id: "mix-orders", label: "Mix Orders", icon: SlidersHorizontal },
  { id: "accounts", label: "Accounts", icon: Users },
  { id: "guests", label: "Guests", icon: UserRound },
  { id: "arena", label: "Arena", icon: Swords },
  { id: "blog", label: "Blog", icon: Newspaper },
  { id: "my-music", label: "My Music", icon: Disc3 },
] as const

type SectionId = (typeof SECTIONS)[number]["id"]

function isSectionId(value: string | undefined): value is SectionId {
  return SECTIONS.some((s) => s.id === value)
}

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

async function archivedTrackIds() {
  const entries = await getVaultEntries()
  return entries.flatMap((e) => (e.trackId ? [e.trackId] : []))
}

async function SectionContent({ section }: { section: SectionId }) {
  switch (section) {
    case "queue": {
      const [tiktokLive, queueStatus, archived] = await Promise.all([
        getTikTokLiveStatus(),
        getQueueStatus(),
        archivedTrackIds(),
      ])
      return (
        <>
          <SectionHeading
            icon={ListMusic}
            title="Queue & DJ Player"
            note="Play what's on air, reorder tracks, and run the session. Music keeps playing while you move around the site."
          />
          <div className="mb-8">
            <DjPlayer showUpNext={false} />
          </div>
          <AdminTikTokLive status={tiktokLive} />
          <AdminQueueSwitches status={queueStatus} />
          <AdminClearQueue />
          <AdminQueue archivedTrackIds={archived} />
        </>
      )
    }
    case "overlay": {
      const h = await headers()
      const host = h.get("x-forwarded-host") ?? h.get("host") ?? ""
      const origin = `${h.get("x-forwarded-proto") ?? "https"}://${host}`
      return (
        <>
          <SectionHeading
            icon={MonitorPlay}
            title="Stream Overlay"
            note="Shows the song on air plus the next two up. Drop it on top of your stream."
          />
          <AdminOverlayLink origin={origin} />
        </>
      )
    }
    case "history":
      return (
        <>
          <SectionHeading
            icon={History}
            title="History"
            note="Every song played from the queue. Add them to the Vault after the live, re-listen, or send them back to the queue."
          />
          <AdminQueueHistory archivedTrackIds={await archivedTrackIds()} />
        </>
      )
    case "vault":
      return (
        <>
          <SectionHeading
            icon={Archive}
            title="Vault"
            note="Every song you've reviewed and locked in. Edit scores and verdicts or take entries down."
          />
          <AdminVault entries={await getVaultEntries()} />
        </>
      )
    case "mix-orders":
      return (
        <>
          <SectionHeading
            icon={SlidersHorizontal}
            title="Mix & Mastering Orders"
            note="Paid $30 orders. Open the files, then mark each one delivered when you send it back."
          />
          <AdminMixOrders orders={await getPaidMixOrders()} />
        </>
      )
    case "accounts":
      return (
        <>
          <SectionHeading
            icon={Users}
            title="Accounts"
            note="Everyone who has signed up. Banning signs them out right away and stops them from signing back in."
          />
          <AdminUsers users={await getAllUsers()} />
        </>
      )
    case "guests":
      return (
        <>
          <SectionHeading
            icon={UserRound}
            title="Guests"
            note="People who submitted without an account, grouped by the name they used. Tap one to see their songs."
          />
          <AdminGuests guests={await getGuestSubmitters()} />
        </>
      )
    case "arena":
      return (
        <>
          <SectionHeading
            icon={Swords}
            title="Arena"
            note="Move matchups up or down, swap sides, edit songs and votes, or remove them."
          />
          <AdminArena battles={await getBattles()} />
        </>
      )
    case "blog":
      return (
        <>
          <SectionHeading icon={Newspaper} title="Blog" note="Publish new posts, edit existing ones, or delete them." />
          <AdminBlog posts={await getPosts()} />
        </>
      )
    case "my-music": {
      const musicLinks = await getArtistLinkSettings()
      return (
        <>
          <SectionHeading
            icon={Disc3}
            title="My Music"
            note="Your music players and social links on the unlock screen. Switch a social off to hide it."
          />
          <AdminMusicLinks links={musicLinks.links} hidden={musicLinks.hidden} />
        </>
      )
    }
  }
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ section?: string }> }) {
  if (!(await isAdmin())) notFound()
  const { section: requested } = await searchParams
  const section: SectionId = isSectionId(requested) ? requested : "queue"

  return (
    <>
      <PageHeader
        icon={ShieldCheck}
        eyebrow="Host controls"
        title="Admin"
        accent="Console"
        description="Run the queue, archive reviews to the Vault, set up Arena matchups, and publish to the Blog."
      />

      <nav aria-label="Admin sections" className="sticky top-16 z-20 border-b border-border/60 bg-background/90 backdrop-blur">
        <ul className="hover-scrollbar mx-auto flex w-full max-w-2xl snap-x gap-2 overflow-x-auto overscroll-x-contain px-4 py-3 [mask-image:linear-gradient(to_right,transparent,black_1.5rem,black_calc(100%-1.5rem),transparent)] sm:px-6">
          {SECTIONS.map(({ id, label, icon: Icon }) => {
            const active = id === section
            return (
              <li key={id} className="shrink-0 snap-start">
                <Link
                  href={`/admin?section=${id}`}
                  scroll={false}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-primary/60 hover:text-foreground",
                  )}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
        <section id={section} aria-label={SECTIONS.find((s) => s.id === section)?.label}>
          <SectionContent section={section} />
        </section>
      </div>
    </>
  )
}
