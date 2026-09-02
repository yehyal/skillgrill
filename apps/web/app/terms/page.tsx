import type { Metadata } from "next"

import { PageContainer } from "@/components/page-container"
import { SiteShell } from "@/components/site-shell"
import { siteConfig } from "@/lib/site-config"

export const metadata: Metadata = {
  title: "Terms | Skill Grill",
  description: "The community rules and service terms for Skill Grill.",
}

export default function TermsPage() {
  return (
    <SiteShell>
      <main id="main-content" className="flex-1">
        <PageContainer className="py-10 sm:py-14 lg:py-16">
          <header className="max-w-3xl border-b border-border pb-8 sm:pb-10">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-primary">Community terms</p>
            <h1 className="mt-3 text-4xl font-semibold leading-none sm:text-5xl">Terms of Use</h1>
            <p className="mt-5 text-base leading-7 text-muted-foreground">
              Skill Grill is a place to compare AI agent skills through practical ratings and firsthand comments. These terms keep that exchange useful and safe.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">{siteConfig.operator}. Effective September 2, 2026.</p>
          </header>

          <div className="max-w-3xl pt-8 text-sm leading-6 text-muted-foreground sm:pt-10">
            <div className="grid gap-10">
              <TermsSection title="Use Skill Grill responsibly">
                <p>
                  You may browse the directory and use public skill information for lawful purposes. Do not use the service to impersonate someone, manipulate ratings, scrape around access controls, probe the infrastructure, or interfere with other people&apos;s use of the service.
                </p>
              </TermsSection>

              <TermsSection title="Community conduct">
                <p>
                  Do not post spam, harassment, threats, hateful content, sexual exploitation, illegal material, malware, private personal information, or instructions intended to harm people or systems. Keep ratings and comments grounded in your experience with the skill. Do not coordinate fake ratings or use reports to silence disagreement.
                </p>
              </TermsSection>

              <TermsSection title="Content you submit">
                <p>
                  You keep ownership of your ratings, comments, report notes, and other material you submit. By submitting it, you give Skill Grill a non-exclusive, worldwide, royalty-free license to host, reproduce, display, distribute, and adapt that material as needed to operate, present, secure, and moderate the service. You represent that you have the right to submit it and that it does not violate another person&apos;s rights.
                </p>
              </TermsSection>

              <TermsSection title="Moderation and account access">
                <p>
                  We may review, restrict, hide, or remove content that violates these terms or harms the service. We may limit or terminate access to an account, including for rating manipulation, abuse, security threats, or repeated violations. Reporting a comment does not automatically hide it, and we may retain limited records needed to review abuse or preserve service integrity.
                </p>
              </TermsSection>

              <TermsSection title="Third-party skills and links">
                <p>
                  Skills, source repositories, documentation, install commands, and external links are supplied by third parties or local catalog data. Skill Grill does not own, control, endorse, or guarantee them. Ratings are personal community feedback, not security audits, code reviews, safety certifications, or guarantees of performance. Review a skill&apos;s source, permissions, and behavior before installing it.
                </p>
              </TermsSection>

              <TermsSection title="Service limitations">
                <p>
                  Skill Grill is provided on an MVP basis. We do not promise that the directory, ratings, comments, links, or service will always be available, accurate, secure, or error-free. To the extent allowed by law, Skill Grill and its builder are not responsible for losses arising from reliance on third-party skills, external links, submitted content, service interruptions, or unauthorized access outside our reasonable control.
                </p>
              </TermsSection>

              <TermsSection title="Contact">
                <p>
                  Questions about these terms or a moderation action can be sent to the project contact. The public contact address must be configured before publishing the service.
                </p>
                {siteConfig.contactEmail ? (
                  <a
                    href={`mailto:${siteConfig.contactEmail}`}
                    className="inline-block break-all text-primary underline decoration-primary/40 underline-offset-4 outline-none hover:decoration-primary focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    {siteConfig.contactEmail}
                  </a>
                ) : (
                  <p className="border border-border bg-card p-4 text-xs leading-5" role="note">
                    Contact email is not configured in this local environment. Set NEXT_PUBLIC_CONTACT_EMAIL before publishing.
                  </p>
                )}
              </TermsSection>
            </div>
          </div>
        </PageContainer>
      </main>
    </SiteShell>
  )
}

function TermsSection({ title, children }: { title: string; children: React.ReactNode }) {
  const titleId = `${title.toLowerCase().replaceAll(" ", "-")}-title`

  return (
    <section aria-labelledby={titleId}>
      <h2 id={titleId} className="text-2xl font-semibold leading-tight text-foreground">{title}</h2>
      <div className="mt-4 grid gap-4">{children}</div>
    </section>
  )
}
