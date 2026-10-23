'use client'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { appleMusicEmbed, spotifyEmbed, type ArtistLinks } from '@/lib/artist-links-types'

type Service = 'spotify' | 'apple_music'

export function hasArtistMusic(links: ArtistLinks) {
  return Boolean(links.spotify || links.apple_music || links.all_music)
}

export function UnlockMusic({ links }: { links: ArtistLinks }) {
  const players = [
    { id: 'spotify' as Service, label: 'Spotify', url: links.spotify, embed: links.spotify ? spotifyEmbed(links.spotify) : null },
    {
      id: 'apple_music' as Service,
      label: 'Apple Music',
      url: links.apple_music,
      embed: links.apple_music ? appleMusicEmbed(links.apple_music) : null,
    },
  ].filter((p) => p.url && p.embed)

  const [active, setActive] = useState<Service | undefined>(players[0]?.id)
  const current = players.find((p) => p.id === active) ?? players[0]

  return (
    <section
      aria-label="Music by Emo"
      className="flex w-full max-w-sm flex-col gap-3 rounded-2xl border border-foreground/15 bg-background/45 p-3 backdrop-blur-md"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/60">Music by Emo</p>
        {players.length > 1 && (
          <div role="tablist" aria-label="Choose a service" className="flex rounded-full bg-foreground/10 p-0.5">
            {players.map((p) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={current?.id === p.id}
                onClick={() => setActive(p.id)}
                className={cn(
                  'rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider outline-none transition-colors focus-visible:ring-2 focus-visible:ring-foreground',
                  current?.id === p.id ? 'bg-primary text-primary-foreground' : 'text-foreground/70 hover:text-foreground',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {current?.embed && (
        <iframe
          key={current.id}
          title={`Emo on ${current.label}`}
          src={current.embed.src}
          height={current.embed.height}
          loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          sandbox={
            current.id === 'apple_music'
              ? 'allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation'
              : undefined
          }
          className="w-full overflow-hidden rounded-xl border-0"
          style={{ height: current.embed.height }}
        />
      )}

      <div className="flex flex-wrap gap-2">
        {players.map((p) => (
          <a
            key={p.id}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full border border-foreground/20 px-3 py-1.5 text-xs font-semibold text-foreground/80 outline-none transition-colors hover:border-primary hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground"
          >
            {p.label}
            <ExternalLink className="size-3" aria-hidden="true" />
          </a>
        ))}
        {links.all_music && (
          <a
            href={links.all_music}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground"
          >
            All my music
            <ExternalLink className="size-3" aria-hidden="true" />
          </a>
        )}
      </div>
    </section>
  )
}
