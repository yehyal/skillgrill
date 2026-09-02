"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowTopRightIcon,
  CheckIcon,
  ChevronRightIcon,
  ClipboardIcon,
  ExternalLinkIcon,
} from "@radix-ui/react-icons"
import type { SkillDetailResponse, SkillStats } from "@skill-grill/shared"

import { ApiRequestError } from "@/lib/api"
import { formatAgentLabel, formatSkillDate, formatTagLabel } from "@/lib/skills"
import { useSkillDetailQuery, useSkillStatsQuery } from "@/lib/skill-queries"
import { PageContainer } from "@/components/page-container"
import { SkillComments } from "@/components/skills/skill-comments"
import { SkillVoteBox } from "@/components/skills/skill-vote-box"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

export function SkillDetail() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug
  const [copied, setCopied] = useState(false)
  const copiedResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const detailQuery = useSkillDetailQuery(slug)
  const statsQuery = useSkillStatsQuery(slug)
  const result = detailQuery.data
  const error = detailQuery.error
  const errorKind = error instanceof ApiRequestError && error.status === 404 ? "not-found" : "error"
  const stats = statsQuery.data?.data ?? result?.data

  useEffect(() => {
    return () => {
      if (copiedResetTimer.current) {
        clearTimeout(copiedResetTimer.current)
      }
    }
  }, [])

  async function copyInstallCommand(command: string) {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      if (copiedResetTimer.current) {
        clearTimeout(copiedResetTimer.current)
      }
      copiedResetTimer.current = setTimeout(() => {
        setCopied(false)
        copiedResetTimer.current = null
      }, 1600)
      toast.success("Install command copied")
    } catch {
      setCopied(false)
      toast.error("Could not copy install command", {
        description: "Your browser did not grant clipboard access.",
      })
    }
  }

  return (
    <main id="main-content" tabIndex={-1} className="flex-1">
      <PageContainer className="py-8 sm:py-10 lg:py-12">
        {error ? (
          <>
            <Breadcrumb />
            <div className="mt-8 max-w-2xl border-t border-border py-10" role="alert">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-primary">
                {errorKind === "not-found" ? "Skill not found" : "Could not load"}
              </p>
              <h1 className="mt-3 text-3xl font-semibold leading-none sm:text-4xl">
                {errorKind === "not-found" ? "That skill is not public." : "The skill page is taking a breather."}
              </h1>
              <p className="mt-4 max-w-[46ch] text-sm leading-6 text-muted-foreground">{error.message}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {errorKind === "error" ? (
                  <Button type="button" onClick={() => void detailQuery.refetch()}>
                    Try again
                  </Button>
                ) : null}
                <Button asChild variant="outline">
                  <Link href="/skills">Return to the directory</Link>
                </Button>
              </div>
            </div>
          </>
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
      <Breadcrumb skillName={skill.name} />

      <div className="mt-7 grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-14">
        <div className="min-w-0">
          <header>
            <h1 className="max-w-[18ch] break-words text-4xl font-semibold leading-none sm:text-5xl">
              {skill.name}
            </h1>
            <p className="mt-5 max-w-[66ch] text-base leading-7 text-muted-foreground">
              {skill.description}
            </p>
          </header>

          <div className="mt-6">
            <SkillVoteBox slug={skill.slug} stats={stats} statsIsPending={statsIsPending} />
          </div>

          <InstallBlock
            command={skill.installCommand}
            copied={copied}
            onCopy={onCopy}
          />

          <SkillComments slug={skill.slug} stats={stats} />
        </div>

        <aside className="min-w-0 lg:pt-1 mt-28"  >
          <SkillMetadata skill={skill} />
        </aside>
      </div>
    </>
  )
}

function Breadcrumb({ skillName }: { skillName?: string }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
        <li>
          <Link
            href="/skills"
            className="rounded-sm outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            Skill directory
          </Link>
        </li>
        {skillName ? (
          <>
            <li aria-hidden="true">
              <ChevronRightIcon className="size-3.5" />
            </li>
            <li className="min-w-0 truncate font-medium text-foreground" aria-current="page" title={skillName}>
              {skillName}
            </li>
          </>
        ) : null}
      </ol>
    </nav>
  )
}

function InstallBlock({
  command,
  copied,
  onCopy,
}: {
  command: string | null
  copied: boolean
  onCopy: (command: string) => void
}) {
  return (
    <section className="mt-8" aria-labelledby="install-title">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-primary">Get started</p>
          <h2 id="install-title" className="mt-2 text-xl font-semibold">Install this skill</h2>
        </div>
        {copied ? (
          <p className="text-xs text-success" role="status" aria-live="polite">Copied</p>
        ) : null}
      </div>

      {command ? (
        <div className="mt-4 border border-primary/35 bg-card p-3 sm:p-2">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
            <span className="text-gray-500">$</span>
            <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap py-1 font-mono text-sm text-foreground">
              npx {command}
            </code>
            <Button
              type="button"
              size="sm"
              aria-label={copied ? "Install command copied" : "Copy install command"}
              title={copied ? "Install command copied" : "Copy install command"}
              className="w-full shrink-0 sm:w-auto"
              onClick={() => onCopy(`npx ${command}`)}
            >
              {copied ? <CheckIcon aria-hidden="true" /> : <ClipboardIcon aria-hidden="true" />}
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-4 border border-border bg-card p-4 text-sm text-muted-foreground">
          No install command has been published for this skill yet.
        </p>
      )}
    </section>
  )
}

function SkillMetadata({
  skill,
}: {
  skill: SkillDetailResponse["data"]
}) {
  return (
    <section className="border-y border-border py-5" aria-labelledby="metadata-title">
      <h2 id="metadata-title" className="text-sm font-semibold">Skill details</h2>
      <dl className="mt-5 grid gap-5 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Identifier</dt>
          <dd className="mt-1 break-all font-mono text-xs text-foreground">{skill.id}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Compatibility</dt>
          <dd className="mt-1 break-words text-foreground">
            {skill.supportedAgents.map(formatAgentLabel).join(" · ") || "Not listed"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Tags</dt>
          <dd className="mt-2 flex flex-wrap gap-1.5">
            {skill.tags.length > 0 ? skill.tags.map((tag) => (
              <Badge key={tag} variant="outline">{formatTagLabel(tag)}</Badge>
            )) : <span className="text-foreground">Not listed</span>}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Added</dt>
          <dd className="mt-1 text-foreground">
            <time dateTime={skill.createdAt}>{formatSkillDate(skill.createdAt)}</time>
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Updated</dt>
          <dd className="mt-1 text-foreground">
            <time dateTime={skill.updatedAt}>{formatSkillDate(skill.updatedAt)}</time>
          </dd>
        </div>
      </dl>

      <div className="mt-6 border-t border-border pt-5">
        <h3 className="text-xs text-muted-foreground">Links</h3>
        <div className="mt-2 grid gap-2">
          {skill.sourceUrl ? (
            <a
              href={skill.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-w-0 items-center gap-2 break-words text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <ArrowTopRightIcon className="size-3.5 shrink-0" aria-hidden="true" />
              Source
            </a>
          ) : null}
          {skill.docsUrl ? (
            <a
              href={skill.docsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-w-0 items-center gap-2 break-words text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <ExternalLinkIcon className="size-3.5 shrink-0" aria-hidden="true" />
              Documentation
            </a>
          ) : null}
          {!skill.sourceUrl && !skill.docsUrl ? (
            <p className="text-sm text-foreground">No public links yet.</p>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export function SkillDetailSkeleton() {
  return (
    <div role="status" aria-label="Loading skill details">
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-3" />
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-14">
        <div>
          <Skeleton className="h-12 w-2/3 max-w-lg" />
          <Skeleton className="mt-5 h-5 w-full max-w-2xl" />
          <Skeleton className="mt-2 h-5 w-4/5 max-w-xl" />
          <Skeleton className="mt-6 h-32 w-full max-w-xl" />
          <Skeleton className="mt-8 h-24 w-full max-w-2xl" />
          <div className="mt-12 border-t border-border pt-8">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="mt-6 h-24 w-full max-w-2xl" />
          </div>
        </div>
        <div>
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
      <span className="sr-only">Loading skill details.</span>
    </div>
  )
}
