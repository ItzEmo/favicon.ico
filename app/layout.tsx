import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { Geist, Geist_Mono } from 'next/font/google'
import { SiteNav } from '@/components/site-nav'
import { SiteFooter } from '@/components/site-footer'
import { HoverMascot } from '@/components/hover-mascot'
import { isAdmin } from '@/lib/admin-auth'
import { UnlockGate } from '@/components/unlock-gate'
import { DjAudioProvider } from '@/components/dj-audio-provider'
import { DjMiniPlayer } from '@/components/dj-mini-player'
import { QueueAlert } from '@/components/queue-alert'
import { QueueOffBanner } from '@/components/queue-off-banner'
import { getArtistLinks } from '@/lib/artist-links'
import { DEFAULT_UNLOCK_BG, getUnlockBackground } from '@/lib/site-settings'
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
        url: '/icon.png',
        type: 'image/png',
        sizes: '512x512',
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
  if ((await headers()).get('x-overlay') === '1') {
    return (
      <html
        lang="en"
        className={`dark ${geistSans.variable} ${geistMono.variable} bg-transparent`}
      >
        <body className="overflow-hidden bg-transparent font-sans antialiased">{children}</body>
      </html>
    )
  }

  const admin = await isAdmin()
  const [musicLinks, unlockBg] = await Promise.all([
    getArtistLinks().catch(() => ({})),
    getUnlockBackground().catch(() => null),
  ])
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} bg-background`}
    >
      <body className="font-sans antialiased">
        {admin ? (
          <DjAudioProvider>
            <div id="top" className="flex min-h-screen flex-col bg-background">
              <SiteNav isAdmin={admin} />
              <QueueOffBanner />
              <main className="flex-1">{children}</main>
              <SiteFooter />
            </div>
            <DjMiniPlayer />
          </DjAudioProvider>
        ) : (
          <div id="top" className="flex min-h-screen flex-col bg-background">
            <SiteNav isAdmin={admin} />
            <QueueOffBanner />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        )}
        <HoverMascot />
        <QueueAlert />
        <UnlockGate links={musicLinks} backgroundUrl={unlockBg ?? DEFAULT_UNLOCK_BG} />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
