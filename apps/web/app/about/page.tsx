import type { Metadata } from "next"

import { PageContainer } from "@/components/page-container"
import { SiteShell } from "@/components/site-shell"
import { siteConfig } from "@/lib/site-config"

export const metadata: Metadata = {
  title: "About | Skill Grill",
  description: "Learn how Skill Grill reviews and ranks AI agent skills.",
}

export default function AboutPage() {
  return (
    <SiteShell>
      <main id="main-content" className="flex-1">
        <PageContainer className="py-10 sm:py-14 lg:py-16">
          <header className="max-w-3xl border-b border-border pb-8 sm:pb-10">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-primary">
              The project
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-none sm:text-5xl">
              About Skill Grill
            </h1>
            <p className="mt-5 max-w-[65ch] text-base leading-7 text-muted-foreground">
              Skill Grill helps people find AI agent skills that actually work. Browse the directory,
              inspect the install details, and use ratings and firsthand comments to decide what to try next.
            </p>
          </header>

          <div className="grid max-w-5xl gap-10 pt-8 sm:pt-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16">
            <div className="grid gap-10">
              <section aria-labelledby="ratings-title">
                <h2 id="ratings-title" className="text-2xl font-semibold leading-tight">
                  What the ratings mean
                </h2>
                <div className="mt-4 grid gap-4 text-sm leading-6 text-muted-foreground">
                  <p>
                    <strong className="font-semibold text-foreground">Well done</strong> is a positive vote from
                    someone who found a skill useful. <strong className="font-semibold text-foreground">Undercooked</strong>
                    is a negative vote from someone who found it incomplete, unreliable, or not useful for their task.
                  </p>
                  <p>
                    All Time reflects cumulative positive votes. Trending reflects positive net vote movement over the
                    previous seven days, so it starts empty until new ratings change the rankings.
                  </p>
                </div>
              </section>

              <section aria-labelledby="independence-title">
                <h2 id="independence-title" className="text-2xl font-semibold leading-tight">
                  Independent by design
                </h2>
                <p className="mt-4 max-w-[65ch] text-sm leading-6 text-muted-foreground">
                  {siteConfig.operator}. Skill Grill is separate from the authors and publishers of the skills listed
                  here. Ratings and comments are community feedback, not endorsements from skill authors.
                </p>
              </section>

              <section aria-labelledby="audit-title">
                <h2 id="audit-title" className="text-2xl font-semibold leading-tight">
                  A review, not a security audit
                </h2>
                <p className="mt-4 max-w-[65ch] text-sm leading-6 text-muted-foreground">
                  A rating is one person&apos;s experience with a skill. It does not verify code, guarantee safety, or
                  replace your own review of a skill&apos;s source, permissions, and behavior before installation.
                </p>
              </section>
            </div>

            <aside className="border-y border-border py-5 text-sm" aria-labelledby="built-by-title">
              <h2 id="built-by-title" className="font-semibold text-foreground">Built by</h2>
              <a
                href={siteConfig.builderUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-primary underline decoration-primary/40 underline-offset-4 outline-none hover:decoration-primary focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {siteConfig.builderHandle}
              </a>
              <p className="mt-4 leading-6 text-muted-foreground">
                Built for people who want practical signal before they install.
              </p>
            </aside>
          </div>
        </PageContainer>
      </main>
    </SiteShell>
  )
}
