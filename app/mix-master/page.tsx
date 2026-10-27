import type { Metadata } from "next"
import { headers } from "next/headers"
import { SlidersHorizontal, Check } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { MixMasterForm } from "@/components/mix-master-form"
import { PaymentReturnNotice } from "@/components/payment-return-notice"
import { auth } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Mix & Mastering",
  description: "An exclusive Mix & Master by ItzEmo himself — $30 USD.",
}

const INCLUDED = [
  "Full mix and master handled personally by ItzEmo",
  "Balanced for streaming loudness targets",
  "Delivered to your inbox as a high-quality WAV",
]

export default async function MixMasterPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  return (
    <>
      <PageHeader
        icon={SlidersHorizontal}
        eyebrow="Exclusive service"
        title="Mix &"
        accent="Mastering"
        description="An exclusive Mix & Master by ItzEmo himself."
      />
      <PaymentReturnNotice />

      <section className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-5">
        <div className="flex flex-col gap-5 lg:col-span-2">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-extrabold text-foreground">$30</span>
            <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">USD / song</span>
          </div>
          <ul className="flex flex-col gap-3">
            {INCLUDED.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-foreground">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Check className="size-3.5" aria-hidden="true" />
                </span>
                {item}
              </li>
            ))}
          </ul>
          <p className="w-fit rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-extrabold uppercase tracking-wider text-primary">
            3 Day Turnaround
          </p>
        </div>

        <div className="lg:col-span-3">
          <MixMasterForm
            defaultName={session?.user.name ?? ""}
            defaultEmail={session?.user.email ?? ""}
          />
        </div>
      </section>
    </>
  )
}
