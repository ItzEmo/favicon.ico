import { StreamOverlay } from "@/components/stream-overlay"

export const metadata = {
  title: "Stream Overlay",
  robots: { index: false, follow: false },
}

export default async function OverlayPage({
  searchParams,
}: {
  searchParams: Promise<{ align?: string }>
}) {
  const { align } = await searchParams
  return <StreamOverlay align={align === "right" ? "right" : "left"} />
}
