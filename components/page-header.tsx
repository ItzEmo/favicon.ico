import type { LucideIcon } from "lucide-react"

interface PageHeaderProps {
  eyebrow: string
  title: string
  accent: string
  description: string
  icon: LucideIcon
}

export function PageHeader({
  eyebrow,
  title,
  accent,
  description,
  icon: Icon,
}: PageHeaderProps) {
  return (
    <section className="relative overflow-hidden border-b border-border/60 px-4 py-12 sm:py-16">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-56 max-w-3xl rounded-full bg-primary/15 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-bold uppercase tracking-wider text-secondary-foreground">
          <span className="size-2 animate-pulse rounded-full bg-primary" />
          {eyebrow}
        </span>
        <h1 className="text-3xl font-extrabold uppercase tracking-tight text-foreground text-balance sm:text-5xl">
          {title} <span className="text-primary">{accent}</span>
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground text-pretty sm:text-base">
          {description}
        </p>
      </div>
    </section>
  )
}
