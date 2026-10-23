export type ChecklistPhase = {
  id: string
  title: string
  timing: string
  items: { id: string; label: string }[]
}

const RAW_PHASES: { id: string; title: string; timing: string; items: string[] }[] = [
  {
    id: "music",
    title: "Song & Music Preparation",
    timing: "4–8 weeks before release",
    items: [
      "Finalize the song arrangement and lyrics",
      "Complete vocal recording, mixing, and mastering",
      "Get final approval on the master version",
      "Export final WAV and backup files",
      "Register the song with the appropriate performing rights organization (PRO)",
      "Confirm songwriter, producer, and featured-artist credits",
      "Clear any samples, beats, or interpolations",
      "Agree on splits and document ownership",
      "Confirm explicit or clean version needs",
    ],
  },
  {
    id: "visuals",
    title: "Branding & Visuals",
    timing: "3–6 weeks before release",
    items: [
      "Choose the official single title and release date",
      "Create cover art that meets distributor requirements",
      "Create a visualizer or lyric video",
      "Plan the music video or performance video, if applicable",
      "Shoot promotional photos and behind-the-scenes content",
      "Prepare vertical video clips for TikTok, Reels, and Shorts",
      "Create announcement graphics and story templates",
      "Prepare canvas or looping visuals where supported",
    ],
  },
  {
    id: "distribution",
    title: "Distribution & Streaming Setup",
    timing: "3–5 weeks before release",
    items: [
      "Choose a digital music distributor",
      "Upload the final master and cover art",
      "Enter the release date and metadata accurately",
      "Verify artist name, featured artists, and credits",
      "Check lyrics and explicit-content labeling",
      "Confirm the release is delivered to intended platforms",
      "Verify pre-save or pre-add links if available",
      "Check artist profiles and platform access",
      "Submit an editorial playlist pitch through Spotify for Artists before release",
      "Prepare smart links for streaming platforms",
    ],
  },
  {
    id: "marketing",
    title: "Marketing & Promotion Strategy",
    timing: "2–4 weeks before release",
    items: [
      "Define the song's story, message, and target audience",
      "Choose the main hook or snippet for promotion",
      "Build a release content calendar",
      "Plan the announcement post",
      "Prepare teaser clips and captions",
      "Create a pre-save campaign",
      "Identify creators, influencers, DJs, and curators to contact",
      "Prepare a press release or short artist pitch if relevant",
      "Plan a fan-engagement campaign, challenge, or recurring content idea",
      "Set an advertising budget, if applicable",
      "Coordinate features, collaborators, and reposts",
    ],
  },
  {
    id: "fanbase",
    title: "Fanbase & Community Activation",
    timing: "1–3 weeks before release",
    items: [
      "Announce the release date across active platforms",
      "Send a personal message to core supporters",
      "Share snippets without revealing everything",
      "Use polls, questions, and previews to build interest",
      "Notify your email list, Discord, or broadcast channel",
      "Reach out to collaborators and supporters with shareable assets",
      "Prepare a direct call to action for release day",
      "Make sure your profile links and bios are up to date",
    ],
  },
  {
    id: "release",
    title: "Release Week & Release Day",
    timing: "Release week",
    items: [
      "Post the official release announcement",
      "Publish the main music video or visualizer if planned",
      "Share the streaming link everywhere",
      "Pin the key release post on relevant profiles",
      "Post short-form content using the song",
      "Go live, host a listening session, or celebrate with fans",
      "Ask supporters to share the song authentically",
      "Check that the track is live and displays correctly",
      "Monitor comments, messages, and platform issues",
      "Thank everyone supporting the release",
    ],
  },
  {
    id: "post",
    title: "Post-Release Promotion",
    timing: "Weeks 1–6 after release",
    items: [
      "Keep posting new clips instead of stopping after day one",
      "Release alternate snippets, live versions, or behind-the-scenes footage",
      "Share fan reactions and user-generated content with permission",
      "Pitch relevant independent playlists and media outlets",
      "Test different hooks, edits, and video concepts",
      "Review streaming and audience analytics",
      "Follow up with DJs, creators, and press contacts",
      "Consider a remix, acoustic version, or performance video",
      "Continue directing new listeners to the song",
      "Document lessons for the next release",
    ],
  },
  {
    id: "business",
    title: "Business, Budget & Analytics",
    timing: "Throughout the rollout",
    items: [
      "Create a rollout budget and track spending",
      "Save invoices, receipts, and marketing assets",
      "Track delivery deadlines and team responsibilities",
      "Monitor streams, saves, shares, and listener retention where available",
      "Review short-form video reach and link clicks",
      "Track playlist adds and audience growth",
      "Reconcile royalties and distributor reports when available",
      "Back up project files and maintain a release archive",
      "Complete a post-release review and set goals for the next single",
    ],
  },
]

export const CHECKLIST: ChecklistPhase[] = RAW_PHASES.map((phase) => ({
  id: phase.id,
  title: phase.title,
  timing: phase.timing,
  items: phase.items.map((label, i) => ({ id: `${phase.id}-${i + 1}`, label })),
}))

export const CHECKLIST_ITEM_IDS = new Set(
  CHECKLIST.flatMap((phase) => phase.items.map((item) => item.id)),
)

export const CHECKLIST_TOTAL = CHECKLIST_ITEM_IDS.size
