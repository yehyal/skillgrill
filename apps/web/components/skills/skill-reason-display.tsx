import type { SkillStats, VoteReasonCount } from "@skill-grill/shared"

import { VOTE_REASON_LABELS } from "@/lib/vote-reasons"
import { cn } from "@/lib/utils"

export function SkillReasonSummary({ stats }: { stats: SkillStats }) {
  const hasPublicReasons = stats.reasonCounts.length > 0
  const showDevelopmentMetrics = process.env.NODE_ENV === "development"

  if (!hasPublicReasons && !showDevelopmentMetrics) {
    return null
  }

  return (
    <section
      className="mt-4 border-t border-border pt-3"
      aria-label={hasPublicReasons ? undefined : "Reason response"}
      aria-labelledby={hasPublicReasons ? "reason-summary-title" : undefined}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        {hasPublicReasons ? (
          <h3 id="reason-summary-title" className="text-xs font-medium text-foreground">
            What people noticed
          </h3>
        ) : null}
        {showDevelopmentMetrics ? (
          <p className="font-mono text-[0.6875rem] text-muted-foreground">
            Reason response: {stats.reasonedVotesCount} with · {stats.unreasonedVotesCount} without
          </p>
        ) : null}
      </div>
      {hasPublicReasons ? (
        <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Top vote reasons">
          {stats.reasonCounts.slice(0, 2).map((reason) => (
            <span
              key={reason.reason}
              className="inline-flex max-w-full items-center gap-1.5 rounded-sm border border-border bg-muted/50 px-2 py-1 text-xs text-muted-foreground"
            >
              <span className="min-w-0 truncate">{VOTE_REASON_LABELS[reason.reason]}</span>
              <span className="font-mono tabular-nums text-foreground">{reason.count}</span>
            </span>
          ))}
        </div>
      ) : null}
    </section>
  )
}

export function SkillTopReasonLabel({
  reason,
  className,
}: {
  reason: VoteReasonCount | null
  className?: string
}) {
  if (!reason) {
    return null
  }

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-sm bg-muted/60 px-1.5 py-0.5 text-[0.6875rem] text-muted-foreground",
        className
      )}
      title={`${VOTE_REASON_LABELS[reason.reason]} (${reason.count})`}
    >
      <span className="truncate">{VOTE_REASON_LABELS[reason.reason]}</span>
      <span className="font-mono tabular-nums text-foreground">{reason.count}</span>
    </span>
  )
}
