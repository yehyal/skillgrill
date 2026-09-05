import type { VoteReason, VoteValue } from "@skill-grill/shared"
import { ChevronDownIcon } from "@radix-ui/react-icons"

import { Button } from "@/components/ui/button"
import {
  UNDERCOOKED_REASONS,
  VOTE_REASON_LABELS,
  WELL_DONE_REASONS,
  getReasonValue,
  isReasonForVote,
} from "@/lib/vote-reasons"
import { cn } from "@/lib/utils"

type ReasonPickerBaseProps = {
  currentVote: VoteValue
  currentReason: VoteReason | null
  pending: boolean
  onReasonSelect: (reason: VoteReason) => void
}

export function VoteFirstReasonPicker({
  promptValue,
  currentVote,
  currentReason,
  pending,
  onReasonSelect,
  onDismiss,
  onChange,
}: ReasonPickerBaseProps & {
  promptValue: 1 | -1 | null
  onDismiss: () => void
  onChange: () => void
}) {
  if (currentVote === null) {
    return null
  }

  const isOpen = promptValue !== null
  const reasonValue = promptValue ?? currentVote
  const reasons = reasonValue === 1 ? WELL_DONE_REASONS : UNDERCOOKED_REASONS

  return (
    <div className="mt-3 w-full">
      <Button
        type="button"
        size="sm"
        variant="outline"
        aria-expanded={isOpen}
        aria-controls="vote-reason-panel"
        disabled={pending}
        onClick={isOpen ? onDismiss : onChange}
        className="w-full justify-between bg-muted/25 px-3 text-xs font-normal"
      >
        <span className="min-w-0 truncate text-left">
          {isOpen
            ? "What stood out?"
            : currentReason
              ? `Reason: ${VOTE_REASON_LABELS[currentReason]}`
              : "Add a reason"}
        </span>
        <ChevronDownIcon
          aria-hidden="true"
          className={`size-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </Button>

      {isOpen ? (
        <div
          id="vote-reason-panel"
          className="border-x border-b border-border bg-muted/15 p-3"
          role="region"
          aria-label={`${reasonValue === 1 ? "Well done" : "Undercooked"} reason choices`}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="text-xs text-muted-foreground">Pick one, or leave your verdict without a reason.</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label={`${reasonValue === 1 ? "Well done" : "Undercooked"} reason`}>
            {reasons.map((reason) => (
              <ReasonButton
                key={reason}
                reason={reason}
                selected={currentVote === reasonValue && currentReason === reason}
                pending={pending}
                onClick={() => onReasonSelect(reason)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function AlwaysVisibleReasonPicker({
  currentVote,
  currentReason,
  pending,
  onReasonSelect,
}: ReasonPickerBaseProps) {
  return (
    <div className="mt-4 grid gap-4 border-t border-border pt-3 sm:grid-cols-2 sm:gap-3">
      <ReasonGroup
        className="sm:pr-3"
        label="Well done because"
        reasons={WELL_DONE_REASONS}
        currentVote={currentVote}
        currentReason={currentReason}
        pending={pending}
        onReasonSelect={onReasonSelect}
      />
      <ReasonGroup
        className="sm:border-l sm:border-border sm:pl-3"
        label="Undercooked because"
        reasons={UNDERCOOKED_REASONS}
        currentVote={currentVote}
        currentReason={currentReason}
        pending={pending}
        onReasonSelect={onReasonSelect}
      />
    </div>
  )
}

function ReasonGroup({
  className,
  label,
  reasons,
  currentVote,
  currentReason,
  pending,
  onReasonSelect,
}: {
  className?: string
  label: string
  reasons: readonly VoteReason[]
  currentVote: VoteValue
  currentReason: VoteReason | null
  pending: boolean
  onReasonSelect: (reason: VoteReason) => void
}) {
  return (
    <div className={cn("min-w-0", className)} role="group" aria-label={label}>
      <p className="flex min-h-5 items-center text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-2 grid gap-1.5">
        {reasons.map((reason) => (
          <ReasonButton
            key={reason}
            reason={reason}
            selected={isReasonForVote(currentReason, getReasonValue(reason)) && currentReason === reason && currentVote === getReasonValue(reason)}
            pending={pending}
            className="w-full"
            onClick={() => onReasonSelect(reason)}
          />
        ))}
      </div>
    </div>
  )
}

function ReasonButton({
  reason,
  selected,
  pending,
  className,
  onClick,
}: {
  reason: VoteReason
  selected: boolean
  pending: boolean
  className?: string
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      aria-pressed={selected}
      disabled={pending}
      onClick={onClick}
      className={cn(
        "h-8 max-w-full justify-start px-2.5 text-xs font-normal",
        className,
        selected && "border-primary bg-primary/10 text-foreground"
      )}
    >
      <span className="truncate">{VOTE_REASON_LABELS[reason]}</span>
    </Button>
  )
}
