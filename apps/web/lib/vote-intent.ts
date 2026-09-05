import type { VoteReason } from "@skill-grill/shared"

import { isReasonForVote } from "@/lib/vote-reasons"

const STORAGE_KEY = "skill-grill:pending-vote"
const STORAGE_VERSION = 1
const MAX_AGE_MS = 30 * 60 * 1000

export type PendingVoteIntent = {
  version: 1
  slug: string
  value: 1 | -1
  reason: VoteReason | null
  createdAt: number
}

export function savePendingVoteIntent(
  slug: string,
  value: 1 | -1,
  reason: VoteReason | null
) {
  if (typeof window === "undefined") {
    return
  }

  const intent: PendingVoteIntent = {
    version: STORAGE_VERSION,
    slug,
    value,
    reason,
    createdAt: Date.now(),
  }

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(intent))
  } catch {
    // Session storage can be unavailable in privacy-restricted browsers.
  }
}

export function readPendingVoteIntent(slug: string): PendingVoteIntent | null {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return null
    }

    const parsed: unknown = JSON.parse(raw)

    if (!isValidPendingVoteIntent(parsed, slug)) {
      window.sessionStorage.removeItem(STORAGE_KEY)
      return null
    }

    return parsed
  } catch {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore storage cleanup failures.
    }

    return null
  }
}

export function clearPendingVoteIntent() {
  if (typeof window === "undefined") {
    return
  }

  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore storage cleanup failures.
  }
}

function isValidPendingVoteIntent(
  value: unknown,
  slug: string
): value is PendingVoteIntent {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const intent = value as Partial<PendingVoteIntent>
  const now = Date.now()

  return (
    intent.version === STORAGE_VERSION &&
    intent.slug === slug &&
    (intent.value === 1 || intent.value === -1) &&
    (intent.reason === null ||
      (typeof intent.reason === "string" &&
        isReasonForVote(intent.reason, intent.value))) &&
    typeof intent.createdAt === "number" &&
    Number.isFinite(intent.createdAt) &&
    intent.createdAt <= now &&
    now - intent.createdAt <= MAX_AGE_MS
  )
}
