import Link from "next/link"
import {
  ArrowRightIcon,
  ChatBubbleIcon,
  MinusIcon,
  PlusIcon,
} from "@radix-ui/react-icons"
import type { SkillListItem } from "@skill-grill/shared"

import { Badge } from "@/components/ui/badge"
import { formatAgentLabel, formatTagLabel } from "@/lib/skills"

export function SkillCard({ skill, index }: { skill: SkillListItem; index: number }) {
  return (
    <article className="group flex min-h-64 flex-col border-t border-border py-6">
      <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
        <span className="font-mono tabular-nums">{String(index + 1).padStart(2, "0")}</span>
        <span className="truncate">{skill.supportedAgents.map(formatAgentLabel).join(" · ")}</span>
      </div>

      <Link
        href={`/skills/${encodeURIComponent(skill.slug)}`}
        className="mt-5 flex items-start justify-between gap-4 rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <h2 className="max-w-[18ch] text-xl font-semibold tracking-[-0.04em] text-balance transition-colors group-hover:text-primary">
          {skill.name}
        </h2>
        <ArrowRightIcon className="mt-1 size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
      </Link>

      <p className="mt-3 max-w-[42ch] text-sm leading-6 text-muted-foreground">
        {skill.description}
      </p>

      <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-6">
        <div className="flex flex-wrap gap-1.5">
          {skill.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline">
              {formatTagLabel(tag)}
            </Badge>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground" aria-label="Community counts">
          <span className="inline-flex items-center gap-1" title="Score">
            <PlusIcon className="size-3.5" aria-hidden="true" />
            <span className="font-medium tabular-nums text-foreground">{skill.score}</span>
            <MinusIcon className="size-3.5" aria-hidden="true" />
          </span>
          <span className="inline-flex items-center gap-1">
            <ChatBubbleIcon className="size-3.5" aria-hidden="true" />
            <span className="tabular-nums">{skill.commentsCount}</span>
          </span>
        </div>
      </div>
    </article>
  )
}
