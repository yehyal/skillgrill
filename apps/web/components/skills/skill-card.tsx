import Link from "next/link"
import { ArrowRightIcon, ArrowUpIcon } from "@radix-ui/react-icons"
import type { SkillListItem } from "@skill-grill/shared"

import { SkillVerdictCounts } from "@/components/skills/skill-verdict-counts"
import { SkillTopReasonLabel } from "@/components/skills/skill-reason-display"
import { Badge } from "@/components/ui/badge"
import { formatAgentLabel, formatTagLabel } from "@/lib/skills"

export function SkillCard({ skill, index }: { skill: SkillListItem; index: number }) {
  return (
    <article className="group flex min-h-[18rem] min-w-0 flex-col rounded-md border border-border bg-card p-4 transition-colors hover:border-primary/40 sm:p-5">
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span className="font-mono tabular-nums">{String(index + 1).padStart(2, "0")}</span>
        {skill.trendDelta !== undefined ? (
          <span className="inline-flex items-center gap-1 font-mono tabular-nums text-primary" title="Net vote movement in the last 7 days">
            <ArrowUpIcon className="size-3.5" aria-hidden="true" />+{skill.trendDelta} / 7d
          </span>
        ) : null}
      </div>

      <Link
        href={`/skills/${encodeURIComponent(skill.slug)}`}
        className="mt-4 flex min-w-0 items-start justify-between gap-4 rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <h2 className="min-w-0 break-words text-xl font-semibold leading-6 transition-colors group-hover:text-primary">
          {skill.name}
        </h2>
        <ArrowRightIcon className="mt-1 size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" aria-hidden="true" />
      </Link>

      <p className="mt-2 truncate font-mono text-[0.6875rem] text-muted-foreground" title={skill.id}>
        {skill.id}
      </p>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
        {skill.description}
      </p>
      <SkillTopReasonLabel reason={skill.topReason} className="mt-3 w-fit" />

      <div className="mt-auto space-y-4 pt-6">
        <div className="flex flex-wrap gap-1.5">
          {skill.tags.length > 0 ? skill.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {formatTagLabel(tag)}
            </Badge>
          )) : <span className="text-xs text-muted-foreground">No tags listed</span>}
        </div>

        <div className="flex min-w-0 items-end justify-between gap-4 border-t border-border pt-3">
          <p className="min-w-0 truncate text-xs text-muted-foreground" title={skill.supportedAgents.map(formatAgentLabel).join(", ")}>
            {skill.supportedAgents.map(formatAgentLabel).join(" · ") || "Agent compatibility not listed"}
          </p>
          <SkillVerdictCounts
            className="shrink-0"
            upvotesCount={skill.upvotesCount}
            downvotesCount={skill.downvotesCount}
            commentsCount={skill.commentsCount}
          />
        </div>
      </div>
    </article>
  )
}
