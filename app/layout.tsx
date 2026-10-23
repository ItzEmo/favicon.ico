import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { SiteNav } from '@/components/site-nav'
import { SiteFooter } from '@/components/site-footer'
import { HoverMascot } from '@/components/hover-mascot'
import { isAdmin } from '@/lib/admin-auth'
import { cookies } from 'next/headers'
import { UnlockGate } from '@/components/unlock-gate'
import { UNLOCK_COOKIE } from '@/lib/unlock'
import { getArtistLinks } from '@/lib/artist-links'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: "Emo's Radio — Live Music Reviews",
    template: "%s — Emo's Radio",
  },
  description: 'Drop a link and add your track to the Emo\u2019s Radio queue.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#1a0f2e',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const admin = await isAdmin()
  const unlocked = (await cookies()).get(UNLOCK_COOKIE)?.value === '1'
  const musicLinks = unlocked ? {} : await getArtistLinks().catch(() => ({}))
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} bg-background`}
    >
      <body className="font-sans antialiased">
        <div id="top" className="flex min-h-screen flex-col bg-background">
          <SiteNav isAdmin={admin} />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
        <HoverMascot />
        {!unlocked && <UnlockGate links={musicLinks} />}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
