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
            <PageContainer className="py-12 sm:py-16 lg:py-20">
              <h1 className="text-4xl font-semibold tracking-[-0.065em]">Find your next useful skill.</h1>
              <div className="mt-12">
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
