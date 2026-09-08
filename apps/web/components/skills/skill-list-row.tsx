import Link from "next/link"
import { ArrowRightIcon, ArrowUpIcon } from "@radix-ui/react-icons"
import type { SkillListItem } from "@skill-grill/shared"

import { SkillVerdictCounts } from "@/components/skills/skill-verdict-counts"
import { SkillTopReasonLabel } from "@/components/skills/skill-reason-display"
import { cn } from "@/lib/utils"

type SkillListRowProps = {
  skill: SkillListItem
  rank: number
  compact?: boolean
}

export function SkillListRow({ skill, rank, compact = false }: SkillListRowProps) {
  const Heading = compact ? "h3" : "h2"

  return (
    <article className={cn(
      "grid min-w-0 grid-cols-[1.5rem_minmax(0,1fr)] gap-x-3 gap-y-3 border-b border-border py-5 transition-colors hover:bg-muted/50 sm:gap-x-4",
      !compact && "sm:grid-cols-[2rem_minmax(0,1fr)_auto]"
    )}>
      <span className="font-mono text-xs tabular-nums text-muted-foreground" aria-label={`Rank ${rank}`}>
        {String(rank).padStart(2, "0")}
      </span>

      <div className="min-w-0">
        <div className="flex min-w-0 items-start gap-3">
          <Link
            href={`/skills/${encodeURIComponent(skill.slug)}`}
            className="min-w-0 rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <Heading className="break-words text-base font-semibold leading-6 transition-colors hover:text-primary sm:text-[1.05rem]">
              {skill.name}
            </Heading>
          </Link>
          {skill.trendDelta !== undefined ? (
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-sm bg-accent px-1.5 py-0.5 font-mono text-[0.6875rem] tabular-nums text-accent-foreground"
              title="Net vote movement in the last 7 days"
            >
              <ArrowUpIcon className="size-3" aria-hidden="true" />+{skill.trendDelta}
            </span>
          ) : null}
        </div>

        <p className="mt-1 truncate font-mono text-[0.6875rem] text-muted-foreground" title={skill.id}>
          {skill.id}
        </p>
        <p className={compact ? "mt-2 line-clamp-2 text-sm leading-5 text-muted-foreground" : "mt-2 line-clamp-2 text-sm leading-5 text-muted-foreground"}>
          {skill.description}
        </p>
        {!compact ? <SkillTopReasonLabel reason={skill.topReason} className="mt-2" /> : null}
      </div>

      <div className={cn("col-start-2 flex items-center justify-between gap-4", !compact && "sm:col-start-3 sm:min-w-[10.5rem] sm:flex-col sm:items-end sm:gap-3")}>
        <SkillVerdictCounts
          upvotesCount={skill.upvotesCount}
          downvotesCount={skill.downvotesCount}
          commentsCount={skill.commentsCount}
        />
        {!compact ? (
          <Link
            href={`/skills/${encodeURIComponent(skill.slug)}`}
            className="inline-flex items-center gap-1 rounded-sm text-xs font-medium text-primary outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            View skill <ArrowRightIcon className="size-3.5" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </article>
  )
}
