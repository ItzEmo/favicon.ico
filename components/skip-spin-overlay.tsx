"use client"

import useSWR from "swr"
import { JackpotReel, type JackpotSpin } from "@/components/jackpot-reel"
import { cn } from "@/lib/utils"

type SpinResponse = { spin: (JackpotSpin & { createdAt: string }) | null; now: string }

const fetcher = (url: string) => fetch(url, { cache: "no-store" }).then((r) => r.json())

// Long enough for the reel to land (~6s) and the winner to sit on screen.
const SHOW_FOR_MS = 20_000

export function SkipSpinOverlay({ position, preview }: { position: "center" | "left" | "right"; preview: boolean }) {
  const { data } = useSWR<SpinResponse>("/api/skip-spin", fetcher, { refreshInterval: 1500 })
  const spin = data?.spin
  if (!spin) return null

  const age = new Date(data.now).getTime() - new Date(spin.createdAt).getTime()
  if (!preview && age > SHOW_FOR_MS) return null

  return (
    <div
      className={cn(
        "fixed inset-x-8 bottom-10 flex",
        position === "center" && "justify-center",
        position === "left" && "justify-start",
        position === "right" && "justify-end",
      )}
    >
      <div key={spin.id} className="overlay-pop flex w-full justify-center sm:w-auto sm:min-w-[32rem]">
        <JackpotReel spin={spin} />
      </div>
    </div>
  )
}
