import { PollOverlay } from "@/components/poll-overlay"

export const metadata = {
  title: "Poll Overlay",
  robots: { index: false, follow: false },
}

export default async function PollOverlayPage({
  searchParams,
}: {
  searchParams: Promise<{ align?: string }>
}) {
  const { align } = await searchParams
  return <PollOverlay align={align === "left" ? "left" : "right"} />
}
