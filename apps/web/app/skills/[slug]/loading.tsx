import { PageContainer } from "@/components/page-container"
import { SiteShell } from "@/components/site-shell"
import { SkillDetailSkeleton } from "@/components/skills/skill-detail"

export default function Loading() {
  return (
    <SiteShell>
      <main id="main-content" className="flex-1">
        <PageContainer className="py-8 sm:py-10 lg:py-12">
          <SkillDetailSkeleton />
        </PageContainer>
      </main>
    </SiteShell>
  )
}
