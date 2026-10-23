import type { Track } from "@/components/track-types"

export const SAMPLE_QUEUE: Track[] = []

export interface VaultEntry {
  id: string
  title: string
  artist: string
  genre: string
  score: number
  verdict: string
  reviewedOn: string
}

export const VAULT_ENTRIES: VaultEntry[] = []
