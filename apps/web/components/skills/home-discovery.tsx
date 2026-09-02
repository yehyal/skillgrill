"use client"

import { useState } from "react"
import type { SkillListQuery } from "@skill-grill/shared"

import { PageContainer } from "@/components/page-container"
import { SkillListRow } from "@/components/skills/skill-list-row"
import { SkillListSkeleton } from "@/components/skills/skill-list-skeleton"
import { Button } from "@/components/ui/button"
import { useSkillListQuery } from "@/lib/skill-queries"

const previewBase: Pick<SkillListQuery, "tags" | "agents" | "page"> = {
  tags: [],
  agents: [],
  page: 1,
}

export function HomeDiscovery() {
  const [ranking, setRanking] = useState<"popular" | "trending">("popular")
  const leaderboardQuery = useSkillListQuery({
    ...previewBase,
    sort: ranking,
    limit: 5,
  })
  const recentQuery = useSkillListQuery({
    ...previewBase,
    sort: "newest",
    limit: 4,
  })
  const leaderboardError = getErrorMessage(leaderboardQuery.error)
  const recentError = getErrorMessage(recentQuery.error)

  return (
    <>
      <PageContainer className="grid gap-10 border-t border-border py-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.62fr)] lg:gap-12">
        <section aria-labelledby="leaderboard-title" className="min-w-0">
          <div className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-primary">The verdict</p>
              <h2 id="leaderboard-title" className="mt-2 text-xl font-semibold">What holds up</h2>
            </div>
            <div className="flex gap-4" role="tablist" aria-label="Leaderboard ranking">
              {([
                ["popular", "All Time"],
                ["trending", "Trending 7d"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={ranking === value}
                  className={`border-b-2 pb-2 text-xs font-medium outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 ${ranking === value ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"}`}
                  onClick={() => setRanking(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div aria-busy={leaderboardQuery.isFetching}>
            {leaderboardError ? (
              <DiscoveryError message={leaderboardError} onRetry={() => void leaderboardQuery.refetch()} />
            ) : leaderboardQuery.data ? (
              leaderboardQuery.data.data.length > 0 ? (
                <div className="border-t border-border">
                  {leaderboardQuery.data.data.map((skill, index) => (
                    <SkillListRow key={skill.id} skill={skill} rank={index + 1} compact />
                  ))}
                </div>
              ) : ranking === "trending" ? (
                <div className="border-t border-border py-8" role="status">
                  <h3 className="text-base font-semibold">Trending is quiet for now.</h3>
                  <p className="mt-2 max-w-[42ch] text-sm leading-6 text-muted-foreground">
                    It starts filling up after ratings change. Check All Time for the full directory meanwhile.
                  </p>
                </div>
              ) : (
                <div className="border-t border-border py-8" role="status">
                  <h3 className="text-base font-semibold">No skills published yet.</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">Browse the directory when the first skills arrive.</p>
                </div>
              )
            ) : (
              <SkillListSkeleton count={5} />
            )}
          </div>
        </section>

        <section aria-labelledby="recent-title" className="min-w-0">
          <div className="border-b border-border pb-3">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-primary">New in the directory</p>
            <h2 id="recent-title" className="mt-2 text-xl font-semibold">Recently added</h2>
          </div>

          <div aria-busy={recentQuery.isFetching}>
            {recentError ? (
              <DiscoveryError message={recentError} onRetry={() => void recentQuery.refetch()} />
            ) : recentQuery.data ? (
              recentQuery.data.data.length > 0 ? (
                <div className="border-t border-border">
                  {recentQuery.data.data.map((skill, index) => (
                    <SkillListRow key={skill.id} skill={skill} rank={index + 1} compact />
                  ))}
                </div>
              ) : (
                <div className="border-t border-border py-8" role="status">
                  <h3 className="text-base font-semibold">No recent additions yet.</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">The newest skills will appear here.</p>
                </div>
              )
            ) : (
              <SkillListSkeleton count={4} />
            )}
          </div>
        </section>
      </PageContainer>

      <section aria-labelledby="contribute-title" className="border-t border-border">
        <PageContainer className="py-8 sm:py-10">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-12">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-primary">Browse, try, contribute</p>
              <h2 id="contribute-title" className="mt-2 text-xl font-semibold">Browse. Try. Contribute.</h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              <div className="border-t border-border pt-3">
                <h3 className="text-sm font-semibold">Find the right fit.</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Search by the task or agent you have in front of you.</p>
              </div>
              <div className="border-t border-border pt-3">
                <h3 className="text-sm font-semibold">Put it to work.</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Open the install command, source, and docs before you commit.</p>
              </div>
              <div className="border-t border-border pt-3">
                <h3 className="text-sm font-semibold">Give your verdict.</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Rate it and leave context so the next person can choose well.</p>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>
    </>
  )
}

function DiscoveryError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="border-t border-destructive/40 py-8" role="alert">
      <h3 className="text-base font-semibold">Discovery is temporarily unavailable.</h3>
      <p className="mt-2 max-w-[42ch] text-sm leading-6 text-muted-foreground">{message}</p>
      <Button type="button" variant="outline" size="sm" className="mt-4" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : null
}
