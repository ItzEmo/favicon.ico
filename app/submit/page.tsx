import { SubmitClient } from "@/components/submit-client"
import { getQueueStatus } from "@/lib/queue-settings"

export const dynamic = "force-dynamic"

export default async function SubmitPage() {
  const status = await getQueueStatus()
  return <SubmitClient status={status} />
}
