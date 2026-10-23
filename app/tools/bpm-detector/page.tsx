import type { Metadata } from "next"
import { Gauge } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { BpmDetector } from "@/components/bpm-detector"

export const metadata: Metadata = {
  title: "BPM Detector",
  description: "Upload an audio file and detect its tempo instantly, right in your browser.",
}

export default function BpmDetectorPage() {
  return (
    <>
      <PageHeader
        icon={Gauge}
        eyebrow="Audio tool"
        title="BPM"
        accent="Detector"
        description="Upload a track and get its tempo in seconds. Everything runs locally in your browser — your audio never leaves your device."
      />

      <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
        <BpmDetector />
      </section>
    </>
  )
}
