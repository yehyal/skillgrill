import { Suspense } from "react"

import { SkillListSkeleton } from "@/components/skills/skill-list-skeleton"
import { SkillsBrowser } from "@/components/skills/skills-browser"
import { PageContainer } from "@/components/page-container"
import { SiteShell } from "@/components/site-shell"

export default function SkillsPage() {
  return (
    <SiteShell>
      <Suspense
        fallback={
          <main id="main-content" className="flex-1">
            <PageContainer className="py-8 sm:py-10 lg:py-12">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-primary">
                Skill directory
              </p>
              <h1 className="mt-3 text-3xl font-semibold leading-none sm:text-4xl">
                Find a skill for the next task.
              </h1>
              <div className="mt-8">
                <SkillListSkeleton />
              </div>
            </PageContainer>
          </main>
        }
      >
        <SkillsBrowser />
      </Suspense>
    </SiteShell>
  )
}
