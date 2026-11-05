import { SkipSpinOverlay } from "@/components/skip-spin-overlay"

export const metadata = {
  title: "Free Skip Overlay",
  robots: { index: false, follow: false },
}

export default async function SkipSpinOverlayPage({
  searchParams,
}: {
  searchParams: Promise<{ align?: string; preview?: string }>
}) {
  const { align, preview } = await searchParams
  const position = align === "left" || align === "right" ? align : "center"
  return <SkipSpinOverlay position={position} preview={preview === "1"} />
}
