import type {
  VoteReason,
  VoteValue,
  WellDoneReason,
  UndercookedReason,
} from "@skill-grill/shared"

export const WELL_DONE_REASONS: WellDoneReason[] = [
  "works_reliably",
  "triggers_well",
  "lightweight",
]

export const UNDERCOOKED_REASONS: UndercookedReason[] = [
  "does_not_work",
  "misses_triggers",
  "triggers_too_often",
  "too_heavy",
]

export const VOTE_REASON_LABELS: Record<VoteReason, string> = {
  works_reliably: "Delivered reliably",
  triggers_well: "Triggered when needed",
  lightweight: "Kept context light",
  does_not_work: "Did not deliver",
  misses_triggers: "Missed when needed",
  triggers_too_often: "Triggered too often",
  too_heavy: "Used too much context",
}

export type VoteReasonUiVariant = "vote-first" | "always-visible"

export const DEV_VOTE_REASON_UI: VoteReasonUiVariant = "vote-first"

export const voteReasonUi: VoteReasonUiVariant =
  process.env.NODE_ENV === "development" ? DEV_VOTE_REASON_UI : "vote-first"

export function getReasonValue(reason: VoteReason): 1 | -1 {
  return UNDERCOOKED_REASONS.includes(reason as UndercookedReason) ? -1 : 1
}

export function isReasonForVote(
  reason: VoteReason | null,
  value: Exclude<VoteValue, null>
): boolean {
  return reason !== null && getReasonValue(reason) === value
}

export function isVoteReason(value: unknown): value is VoteReason {
  return (
    typeof value === "string" &&
    (WELL_DONE_REASONS.includes(value as WellDoneReason) ||
      UNDERCOOKED_REASONS.includes(value as UndercookedReason))
  )
}
