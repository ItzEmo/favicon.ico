function seeded(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

const DROPS = Array.from({ length: 70 }, (_, i) => ({
  left: Math.round(seeded(i + 1) * 1000) / 10,
  length: 40 + Math.round(seeded(i + 101) * 50),
  opacity: Math.round((0.15 + seeded(i + 201) * 0.3) * 100) / 100,
  duration: Math.round((0.55 + seeded(i + 301) * 0.5) * 100) / 100,
  delay: Math.round(seeded(i + 401) * 200) / 100,
}))

export function RainBackdrop() {
  return (
    <div aria-hidden="true" className="unlock-rain absolute inset-0">
      {DROPS.map((drop, i) => (
        <span
          key={i}
          className="unlock-rain__drop"
          style={{
            left: `${drop.left}%`,
            height: `${drop.length}px`,
            opacity: drop.opacity,
            animationDuration: `${drop.duration}s`,
            animationDelay: `-${drop.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
