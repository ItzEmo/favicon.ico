import Link from "next/link"
import Image from "next/image"

const COLUMNS = [
  {
    title: "PLATFORM",
    links: [
      { label: "Submit Track", href: "/submit" },
      { label: "Live Queue", href: "/queue" },
      { label: "The Vault", href: "/vault" },
      { label: "Arena", href: "/arena" },
      { label: "Tools", href: "/tools" },
      { label: "Account", href: "/account" },
    ],
  },
  {
    title: "RESOURCES",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Review Feed", href: "/feed" },
      { label: "Leaderboard", href: "/ranks" },
      { label: "Membership", href: "/account" },
    ],
  },
  {
    title: "CONNECT",
    links: [
      { label: "TikTok", href: "https://www.tiktok.com/@_itzemo1" },
      { label: "Instagram", href: "https://instagram.com" },
      { label: "YouTube", href: "https://youtube.com" },
      { label: "Twitch", href: "https://twitch.tv" },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-card/30">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="flex flex-col gap-4">
          <Link href="/" className="flex w-fit items-center" aria-label="Emo's Radio home">
            <Image
              src="/emo-neon-logo.png"
              alt="Emo's Radio"
              width={597}
              height={575}
              className="neon-glow h-16 w-auto text-xs"
            />
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground text-pretty">
            Live music reviews and a queue built from the ground up &mdash; by people
            who actually love the music.
          </p>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
            <span className="size-2 animate-pulse rounded-full bg-primary" />
            RUNNING NIGHTLY
          </span>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title} className="flex flex-col gap-3">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              {col.title}
            </p>
            <ul className="flex flex-col gap-2">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border/60 py-5">
        <p className="text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Emo&apos;s Radio. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
