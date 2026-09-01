"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeftIcon,
  ArrowTopRightIcon,
  ClipboardIcon,
  ExternalLinkIcon,
} from "@radix-ui/react-icons"
import type { SkillDetailResponse, SkillStats } from "@skill-grill/shared"

import { AppFooter } from "@/components/app-footer"
import { AppHeader } from "@/components/app-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { formatAgentLabel, formatSkillDate, formatTagLabel } from "@/lib/skills"
import { useSkillDetailQuery, useSkillStatsQuery } from "@/lib/skill-queries"
import { PageContainer } from "@/components/page-container"
import { ApiRequestError } from "@/lib/api"
import { SkillComments } from "@/components/skills/skill-comments"
import { SkillVoteBox } from "@/components/skills/skill-vote-box"

export function SkillDetail() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug
  const [copied, setCopied] = useState(false)
  const detailQuery = useSkillDetailQuery(slug)
  const statsQuery = useSkillStatsQuery(slug)
  const result = detailQuery.data
  const error = detailQuery.error
  const errorKind = error instanceof ApiRequestError && error.status === 404 ? "not-found" : "error"
  const stats = statsQuery.data?.data ?? result?.data

  async function copyInstallCommand(command: string) {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="site-shell">
      <AppHeader />
      <main id="main-content" className="flex-1">
        <PageContainer className="py-12 sm:py-16 lg:py-20">
          <Link href="/skills" className="inline-flex items-center gap-2 rounded-sm text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50">
            <ArrowLeftIcon aria-hidden="true" />
            Browse skills
          </Link>

          {error ? (
            <div className="mt-16 max-w-2xl border-t border-border py-10" role="alert">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
                {errorKind === "not-found" ? "Skill not found" : "Could not load"}
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.065em]">
                {errorKind === "not-found" ? "That skill is not public." : "The skill page is taking a breather."}
              </h1>
              <p className="mt-4 max-w-[42ch] text-sm leading-6 text-muted-foreground">{error.message}</p>
              <Button asChild variant="outline" className="mt-7">
                <Link href="/skills">Return to the directory</Link>
              </Button>
            </div>
          ) : result ? (
            <SkillDetailContent
              result={result}
              stats={stats ?? result.data}
              statsIsPending={statsQuery.isPending}
              copied={copied}
              onCopy={copyInstallCommand}
            />
          ) : (
            <SkillDetailSkeleton />
          )}
        </PageContainer>
      </main>
      <AppFooter />
    </div>
  )
}

function SkillDetailContent({
  result,
  stats,
  statsIsPending,
  copied,
  onCopy,
}: {
  result: SkillDetailResponse
  stats: SkillStats
  statsIsPending: boolean
  copied: boolean
  onCopy: (command: string) => void
}) {
  const skill = result.data

  return (
    <>
      <header className="mt-12 max-w-4xl sm:mt-16">
        <div className="flex flex-wrap gap-2">
          {skill.tags.map((tag) => (
            <Badge key={tag} variant="accent">
              {formatTagLabel(tag)}
            </Badge>
          ))}
        </div>
        <h1 className="mt-6 max-w-[14ch] text-5xl font-semibold tracking-[-0.075em] text-balance sm:text-6xl">
          {skill.name}
        </h1>
        <p className="mt-6 max-w-[58ch] text-lg leading-8 text-muted-foreground">{skill.description}</p>
        <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <span>
            Works with {skill.supportedAgents.map(formatAgentLabel).join(", ")}
          </span>
          <span aria-hidden="true">·</span>
          <span>Added {formatSkillDate(skill.createdAt)}</span>
        </div>
      </header>

      <Separator className="my-12 sm:my-16" />

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-20">
        <div className="min-w-0">
          <section aria-labelledby="install-title">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">Get started</p>
            <h2 id="install-title" className="mt-3 text-2xl font-semibold tracking-[-0.05em]">
              Install this skill
            </h2>
            {skill.installCommand ? (
              <div className="mt-5 flex items-center gap-3 rounded-md border border-border bg-card p-3">
                <code className="min-w-0 flex-1 overflow-x-auto px-1 text-sm text-foreground">
                  {skill.installCommand}
                </code>
                <Button type="button" size="sm" variant="outline" onClick={() => onCopy(skill.installCommand!)}>
                  <ClipboardIcon aria-hidden="true" />
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            ) : (
              <p className="mt-5 rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">
                No install command has been published for this skill yet.
              </p>
            )}
          </section>

          <section className="mt-12" aria-labelledby="links-title">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">References</p>
            <h2 id="links-title" className="mt-3 text-2xl font-semibold tracking-[-0.05em]">
              Source and documentation
            </h2>
            <div className="mt-5 flex flex-wrap gap-3">
              {skill.sourceUrl ? (
                <Button asChild variant="outline">
                  <a href={skill.sourceUrl} target="_blank" rel="noreferrer">
                    Source <ArrowTopRightIcon aria-hidden="true" />
                  </a>
                </Button>
              ) : null}
              {skill.docsUrl ? (
                <Button asChild variant="outline">
                  <a href={skill.docsUrl} target="_blank" rel="noreferrer">
                    Documentation <ExternalLinkIcon aria-hidden="true" />
                  </a>
                </Button>
              ) : null}
              {!skill.sourceUrl && !skill.docsUrl ? (
                <p className="text-sm text-muted-foreground">No public links have been added yet.</p>
              ) : null}
            </div>
          </section>
        </div>

        <SkillVoteBox slug={skill.slug} stats={stats} statsIsPending={statsIsPending} />
      </div>

      <SkillComments slug={skill.slug} stats={stats} />
    </>
  )
}

function SkillDetailSkeleton() {
  return (
    <div className="mt-16" role="status" aria-label="Loading skill details">
      <Skeleton className="h-5 w-28" />
      <Skeleton className="mt-7 h-14 w-2/3 max-w-md" />
      <Skeleton className="mt-6 h-6 w-full max-w-2xl" />
      <Skeleton className="mt-3 h-6 w-4/5 max-w-xl" />
      <Separator className="my-12 sm:my-16" />
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div>
          <Skeleton className="h-7 w-44" />
          <Skeleton className="mt-5 h-12 w-full max-w-xl" />
          <Skeleton className="mt-12 h-7 w-56" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
      <span className="sr-only">Loading skill details.</span>
    </div>
  )
}
