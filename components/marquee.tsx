const PHRASES = [
  "ARTISTS FROM EVERY GENRE",
  "THE TRUTH. EVERY TIME.",
  "LIVE ON AIR NIGHTLY",
  "REAL EARS. REAL FEEDBACK.",
  "NO GATEKEEPING",
]

export function Marquee() {
  // Duplicate the list so the loop is seamless when translated -50%.
  const items = [...PHRASES, ...PHRASES]

  return (
    <div
      className="overflow-hidden border-y border-border/60 bg-card/40 py-3"
      role="presentation"
      aria-hidden="true"
    >
      <div className="flex w-max animate-marquee items-center">
        {items.map((phrase, i) => (
          <div key={i} className="flex items-center">
            <span className="px-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {phrase}
            </span>
            <span className="text-primary">&bull;</span>
          </div>
        ))}
      </div>
    </div>
  )
}
