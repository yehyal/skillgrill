import { PageContainer } from "@/components/page-container"
import { SiteShell } from "@/components/site-shell"
import { SkillListSkeleton } from "@/components/skills/skill-list-skeleton"

export default function Loading() {
  return (
    <SiteShell>
      <main id="main-content" className="flex-1">
        <PageContainer className="py-12 sm:py-16 lg:py-20">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
            Skill directory
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.065em]">
            Find your next useful skill.
          </h1>
          <div className="mt-10 sm:mt-12">
            <SkillListSkeleton />
          </div>
        </PageContainer>
      </main>
    </SiteShell>
  )
}
