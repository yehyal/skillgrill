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
      <main id="main-content" tabIndex={-1} className="flex-1">
        <PageContainer className="py-8 sm:py-10 lg:py-12">
          <header className="max-w-[70ch] border-b border-border pb-8 sm:pb-10">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-primary">
              The project
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
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
                <div className="mt-4 grid gap-4 text-sm leading-7 text-secondary-foreground">
                  <p>
                    <strong className="font-semibold text-foreground">Well done</strong> is a positive vote from
                    someone who found a skill useful. <strong className="font-semibold text-foreground">Undercooked</strong>
                    is a negative vote from someone who found it incomplete, unreliable, or not useful for their task.
                  </p>
                  <p>
                    All Time reflects cumulative positive votes. Trending reflects positive net vote movement over the
                    previous seven days, so it starts empty until new ratings change the rankings.
                  </p>
                  <p>
                    After a verdict, you can optionally add one reason. Well done means <strong className="font-semibold text-foreground">Delivered reliably</strong>, <strong className="font-semibold text-foreground">Triggered when needed</strong>, or <strong className="font-semibold text-foreground">Kept context light</strong>. Undercooked means <strong className="font-semibold text-foreground">Did not deliver</strong>, <strong className="font-semibold text-foreground">Missed when needed</strong>, <strong className="font-semibold text-foreground">Triggered too often</strong>, or <strong className="font-semibold text-foreground">Used too much context</strong>.
                  </p>
                  <p>
                    Reasons are optional, and can be changed or cleared later. They help show patterns in the community without turning a vote into a survey.
                  </p>
                </div>
              </section>

              <section aria-labelledby="independence-title">
                <h2 id="independence-title" className="text-2xl font-semibold leading-tight">
                  Independent by design
                </h2>
                <p className="mt-4 max-w-[65ch] text-sm leading-7 text-secondary-foreground">
                  {siteConfig.operator}. Skill Grill is separate from the authors and publishers of the skills listed
                  here. Ratings and comments are community feedback, not endorsements from skill authors.
                </p>
              </section>

              <section aria-labelledby="audit-title">
                <h2 id="audit-title" className="text-2xl font-semibold leading-tight">
                  A review, not a security audit
                </h2>
                <p className="mt-4 max-w-[65ch] text-sm leading-7 text-secondary-foreground">
                  A rating is one person&apos;s experience with a skill. It does not verify code, guarantee safety, or
                  replace your own review of a skill&apos;s source, permissions, and behavior before installation.
                </p>
              </section>
            </div>

          </div>
        </PageContainer>
      </main>
    </SiteShell>
  )
}
