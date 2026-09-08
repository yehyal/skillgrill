import { DownloadIcon, ExclamationTriangleIcon, StarIcon } from "@radix-ui/react-icons"
import type { SkillPopularity as SkillPopularityData } from "@skill-grill/shared"

import { formatCompactCount, formatExactCount, isCatalogStale } from "@/lib/skills"
import { cn } from "@/lib/utils"

export function SkillPopularity({
  popularity,
  className,
}: {
  popularity: SkillPopularityData
  className?: string
}) {
  if (!popularity.installs && !popularity.repositoryStars) {
    return null
  }

  return (
    <div
      className={cn("flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground", className)}
      role="group"
      aria-label="Upstream popularity"
    >
      {popularity.installs ? (
        <span
          className="inline-flex min-w-0 items-center gap-1"
          title={`${formatExactCount(popularity.installs.count)} installs`}
          aria-label={`${formatExactCount(popularity.installs.count)} installs`}
        >
          <DownloadIcon className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="font-mono tabular-nums">{formatCompactCount(popularity.installs.count)}</span>
          <span>installs</span>
        </span>
      ) : null}
      {popularity.repositoryStars ? (
        <span
          className="inline-flex min-w-0 items-center gap-1"
          title={`${formatExactCount(popularity.repositoryStars.count)} repo stars`}
          aria-label={`${formatExactCount(popularity.repositoryStars.count)} repo stars`}
        >
          <StarIcon className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="font-mono tabular-nums">{formatCompactCount(popularity.repositoryStars.count)}</span>
          <span>repo stars</span>
        </span>
      ) : null}
    </div>
  )
}

export function SkillCatalogStaleWarning({
  checkedAt,
  className,
}: {
  checkedAt: string | null
  className?: string
}) {
  if (!isCatalogStale(checkedAt)) {
    return null
  }

  return (
    <span
      className={cn("inline-flex items-center gap-1 text-xs text-warning", className)}
      title="This catalog snapshot is more than 30 days old."
    >
      <ExclamationTriangleIcon className="size-3.5" aria-hidden="true" />
      Needs recheck
    </span>
  )
}
