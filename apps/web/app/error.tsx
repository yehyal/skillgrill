"use client"

import Link from "next/link"

import { SiteShell } from "@/components/site-shell"
import { PageContainer } from "@/components/page-container"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <SiteShell>
      <main id="main-content" tabIndex={-1} className="flex flex-1 items-center">
        <PageContainer className="w-full py-16 sm:py-24">
          <div className="max-w-2xl border-t border-destructive/40 pt-8" role="alert">
            <Badge variant="accent">Something went wrong</Badge>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.06em] sm:text-4xl">
              This page needs another try.
            </h1>
            <p className="mt-3 max-w-[46ch] text-sm leading-6 text-muted-foreground">
              The page could not finish loading. Retry here, or return to the skill directory.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button type="button" onClick={reset}>
                Try again
              </Button>
              <Button asChild type="button" variant="outline">
                <Link href="/skills">Browse skills</Link>
              </Button>
            </div>
          </div>
        </PageContainer>
      </main>
    </SiteShell>
  )
}
