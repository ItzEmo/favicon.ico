import { headers } from "next/headers"
import { SubmitClient } from "@/components/submit-client"
import { getQueueStatus } from "@/lib/queue-settings"
import { auth } from "@/lib/auth"
import { getCrownSkipStatus } from "@/lib/crown-skip"

export const dynamic = "force-dynamic"

export default async function SubmitPage() {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null)
  const [status, crownSkip] = await Promise.all([
    getQueueStatus(),
    getCrownSkipStatus(session?.user.id ?? null).catch(() => ({
      crowned: false,
      available: false,
      resetsAt: null,
    })),
  ])
  return <SubmitClient status={status} crownSkip={crownSkip} />
}
