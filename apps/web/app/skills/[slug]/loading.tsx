import { PageContainer } from "@/components/page-container"
import { SiteShell } from "@/components/site-shell"
import { SkillDetailSkeleton } from "@/components/skills/skill-detail"

export default function Loading() {
  return (
    <SiteShell>
      <main id="main-content" className="flex-1">
        <PageContainer className="py-12 sm:py-16 lg:py-20">
          <SkillDetailSkeleton />
        </PageContainer>
      </main>
    </SiteShell>
  )
}
