"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useState, type CSSProperties } from "react"
import { Menu, X } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useSession } from "@/lib/auth-client"

export const NAV_ITEMS = [
  { label: "HOME", href: "/" },
  { label: "QUEUE", href: "/queue" },
  { label: "SUBMIT", href: "/submit" },
  { label: "VAULT", href: "/vault" },
  { label: "TOOLS", href: "/tools" },
  { label: "BLOG", href: "/blog" },
  { label: "ARENA", href: "/arena" },
  { label: "RANKS", href: "/ranks" },
  { label: "FEED", href: "/feed" },
  { label: "ACCOUNT", href: "/account" },
]

const LOGO_DEPTH_LAYERS = [-3.5, -2.5, -1.5, -0.5, 0.5, 1.5, 2.5, 3.5]

export function SiteNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { data: session } = useSession()

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary to-transparent" />
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6"
      >
        <Link href="/" className="logo-3d-stage flex shrink-0 items-center" aria-label="Emo's Radio home">
          <span className="logo-3d">
            <Image
              src="/emo-neon-logo.png"
              alt=""
              aria-hidden
              width={597}
              height={575}
              className="logo-3d-layer logo-3d-back"
            />
            {LOGO_DEPTH_LAYERS.map((z, i) => (
              <Image
                key={z}
                src="/emo-neon-logo.png"
                alt=""
                aria-hidden
                width={597}
                height={575}
                className={cn("logo-3d-layer", i === 2 && "text-sm")}
                style={{ "--z": z } as CSSProperties}
              />
            ))}
            <Image
              src="/emo-neon-logo.png"
              alt="Emo's Radio"
              width={597}
              height={575}
              priority
              className="neon-shine logo-3d-face h-10 w-auto"
            />
          </span>
        </Link>

        <ul className="hidden items-center gap-5 lg:flex">
          {NAV_ITEMS.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className={cn(
                  "text-xs font-bold uppercase tracking-wider transition-colors hover:text-foreground",
                  isActive(item.href) ? "text-primary" : "text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex shrink-0 items-center gap-2">
          {isAdmin ? (
            <Link
              href="/admin"
              className={cn(
                "hidden text-xs font-bold uppercase tracking-wider transition-colors sm:inline-block",
                isActive("/admin") ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              Admin
            </Link>
          ) : null}
          <Link
            href={session?.user ? "/account" : "/sign-in"}
            className={cn(
              buttonVariants({ size: "sm", variant: "outline" }),
              "rounded-full text-xs font-bold uppercase tracking-wider",
            )}
          >
            {session?.user ? "My Account" : "Sign In"}
          </Link>
          <Button
            size="icon"
            variant="ghost"
            className="lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </nav>

      {open ? (
        <div className="border-t border-border/60 lg:hidden">
          <ul className="mx-auto flex max-w-7xl flex-col px-4 py-2 sm:px-6">
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block py-2.5 text-sm font-bold uppercase tracking-wider transition-colors hover:text-foreground",
                    isActive(item.href) ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {isAdmin ? (
              <li>
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block py-2.5 text-sm font-bold uppercase tracking-wider transition-colors hover:text-foreground",
                    isActive("/admin") ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  ADMIN
                </Link>
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </header>
  )
}
