import Link from "next/link"

import { SiteShell } from "@/components/site-shell"
import { PageContainer } from "@/components/page-container"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <SiteShell>
      <main id="main-content" className="flex flex-1 items-center">
        <PageContainer className="w-full py-16 sm:py-24">
          <div className="max-w-2xl border-t border-border pt-8">
            <Badge variant="accent">Not found</Badge>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.06em] sm:text-4xl">
              That page is not in the directory.
            </h1>
            <p className="mt-3 max-w-[46ch] text-sm leading-6 text-muted-foreground">
              The link may be outdated, or this skill may no longer be public.
            </p>
            <Button asChild type="button" variant="outline" className="mt-7">
              <Link href="/skills">Return to the directory</Link>
            </Button>
          </div>
        </PageContainer>
      </main>
    </SiteShell>
  )
}
