import {
  ChatBubbleIcon,
  ThickArrowDownIcon,
  ThickArrowUpIcon,
} from "@radix-ui/react-icons"

import { cn } from "@/lib/utils"

type SkillVerdictCountsProps = {
  upvotesCount: number
  downvotesCount: number
  commentsCount: number
  className?: string
}

export function SkillVerdictCounts({
  upvotesCount,
  downvotesCount,
  commentsCount,
  className,
}: SkillVerdictCountsProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground", className)}>
      <span className="inline-flex items-center gap-1" title="Well done" aria-label={`Well done ${upvotesCount}`}>
        <ThickArrowUpIcon className="size-3.5" aria-hidden="true" />

        <span className="font-mono tabular-nums text-foreground">{upvotesCount}</span>
      </span>
      <span className="inline-flex items-center gap-1" title="Undercooked" aria-label={`Undercooked ${downvotesCount}`}>
        <ThickArrowDownIcon className="size-3.5" aria-hidden="true" />
        <span className="font-mono tabular-nums text-foreground">{downvotesCount}</span>
      </span>
      <span className="inline-flex items-center gap-1" title="Comments" aria-label={`Comments ${commentsCount}`}>
        <ChatBubbleIcon className="size-3.5" aria-hidden="true" />
        <span className="font-mono tabular-nums text-foreground">{commentsCount}</span>
      </span>
    </div>
  )
}
