import type { Metadata } from "next"

import { PageContainer } from "@/components/page-container"
import { SiteShell } from "@/components/site-shell"
import { siteConfig } from "@/lib/site-config"

export const metadata: Metadata = {
  title: "Contact | Skill Grill",
  description: "Contact Skill Grill and its independent builder, @yehyal.",
}

export default function ContactPage() {
  return (
    <SiteShell>
      <main id="main-content" tabIndex={-1} className="flex-1">
        <PageContainer className="py-10 sm:py-14 lg:py-16">
          <header className="max-w-2xl border-b border-border pb-8 sm:pb-10">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-primary">
              Get in touch
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-none sm:text-5xl">Contact Skill Grill</h1>
            <p className="mt-5 text-base leading-7 text-muted-foreground">
              Questions, corrections, partnership notes, and privacy requests can be sent to the project contact below.
            </p>
          </header>

          <div className="grid max-w-4xl gap-10 pt-8 sm:pt-10 md:grid-cols-2 md:gap-14">
            <section aria-labelledby="email-title">
              <h2 id="email-title" className="text-2xl font-semibold leading-tight">Email</h2>
              {siteConfig.contactEmail ? (
                <a
                  href={`mailto:${siteConfig.contactEmail}`}
                  className="mt-4 inline-block break-all text-base text-primary underline decoration-primary/40 underline-offset-4 outline-none hover:decoration-primary focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  {siteConfig.contactEmail}
                </a>
              ) : (
                <p className="mt-4 border border-border bg-card p-4 text-sm leading-6 text-muted-foreground" role="note">
                  Contact email is not configured in this environment. Set NEXT_PUBLIC_CONTACT_EMAIL before publishing
                  a public contact address.
                </p>
              )}
            </section>

            <section aria-labelledby="builder-title">
              <h2 id="builder-title" className="text-2xl font-semibold leading-tight">Project identity</h2>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">{siteConfig.operator}.</p>
              <a
                href={siteConfig.builderUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-primary underline decoration-primary/40 underline-offset-4 outline-none hover:decoration-primary focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {siteConfig.builderHandle}
              </a>
            </section>
          </div>
        </PageContainer>
      </main>
    </SiteShell>
  )
}
