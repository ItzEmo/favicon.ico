import { NextResponse, type NextRequest } from "next/server"

// Flags overlay requests so the root layout can skip the site chrome
// (nav, footer, mascot, unlock gate) and render a transparent page for OBS.
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers)
  headers.set("x-overlay", "1")
  return NextResponse.next({ request: { headers } })
}

export const config = {
  matcher: ["/overlay/:path*"],
}
