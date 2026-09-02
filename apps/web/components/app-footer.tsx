import { PageContainer } from "@/components/page-container"

export function AppFooter() {
  return (
    <footer className="border-t border-border py-5 text-sm text-muted-foreground">
      <PageContainer className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="font-medium text-foreground">Skill Grill</span>
        <span>Firsthand reviews for AI agent skills that need to deliver.</span>
      </PageContainer>
    </footer>
  )
}
