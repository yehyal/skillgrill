import type { Metadata } from "next"

import { PageContainer } from "@/components/page-container"
import { SiteShell } from "@/components/site-shell"
import { siteConfig } from "@/lib/site-config"

export const metadata: Metadata = {
  title: "Privacy | Skill Grill",
  description: "How Skill Grill handles identity data, ratings, comments, reports, and browser storage.",
}

export default function PrivacyPage() {
  return (
    <SiteShell>
      <main id="main-content" className="flex-1">
        <PageContainer className="py-10 sm:py-14 lg:py-16">
          <header className="max-w-3xl border-b border-border pb-8 sm:pb-10">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-primary">Trust and privacy</p>
            <h1 className="mt-3 text-4xl font-semibold leading-none sm:text-5xl">Privacy Policy</h1>
            <p className="mt-5 text-base leading-7 text-muted-foreground">
              This practical MVP policy explains what Skill Grill stores, what is public, and how to ask us to access or delete your account data.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">{siteConfig.operator}. Last updated September 2, 2026.</p>
          </header>

          <div className="max-w-3xl pt-8 text-sm leading-6 text-muted-foreground sm:pt-10">
            <div className="grid gap-10">
              <PolicySection title="The short version">
                <p>
                  Skill Grill is a public directory. You can browse without an account. GitHub sign-in through Supabase is only needed to rate skills, post comments, or report comments. We do not sell personal information, run advertising, or add analytics in this MVP.
                </p>
              </PolicySection>

              <PolicySection title="What we collect">
                <ul className="grid list-disc gap-2 pl-5">
                  <li>From GitHub and Supabase: your account identifier, GitHub username, display name, avatar, and the authentication details needed to keep your session working. Your email is not shown publicly.</li>
                  <li>From your activity: ratings, the skill each rating belongs to, comments, reports, report reasons, and optional report notes.</li>
                  <li>Public profile fields attached to comments: username, display name when available, and avatar. Public skill pages show comments and aggregate rating counts, not a private vote history.</li>
                </ul>
              </PolicySection>

              <PolicySection title="Browser storage">
                <p>
                  The app stores a Supabase authentication session in the browser when you sign in. It also stores your theme choice and your directory list/card preference. These are functional preferences, not advertising cookies. There is no generic cookie banner because this MVP does not use non-essential tracking. We will reassess that decision if analytics, advertising, or similar tracking is introduced.
                </p>
              </PolicySection>

              <PolicySection title="Hosting and processors">
                <p>
                  GitHub provides the identity provider for sign-in. Supabase provides authentication and database services. Cloudflare hosts the Worker API and may process operational request data such as timestamps, paths, IP addresses, user agents, and error or performance information through its platform logs. These providers process data to deliver, secure, and maintain the service.
                </p>
              </PolicySection>

              <PolicySection title="Retention and deletion">
                <p>
                  We keep account data while your account is active. Ratings, comments, and reports may be retained after an account request when needed to preserve community integrity, investigate abuse, or meet a legal obligation. Cloudflare operational log retention follows the configured Cloudflare service settings. There is no account-settings UI or deletion API yet: email the project contact with your GitHub username and request, and we will handle an access or deletion request manually.
                </p>
              </PolicySection>

              <PolicySection title="Questions and requests">
                <p>
                  For an access, correction, or deletion request, contact Skill Grill using the address configured for this deployment. Keep sensitive information out of an initial message unless it is necessary to identify your account.
                </p>
                {siteConfig.contactEmail ? (
                  <a
                    href={`mailto:${siteConfig.contactEmail}`}
                    className="mt-3 inline-block break-all text-primary underline decoration-primary/40 underline-offset-4 outline-none hover:decoration-primary focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    {siteConfig.contactEmail}
                  </a>
                ) : (
                  <p className="mt-3 border border-border bg-card p-4 text-xs leading-5" role="note">
                    The public contact address is not configured in this local environment. Set NEXT_PUBLIC_CONTACT_EMAIL before publishing.
                  </p>
                )}
              </PolicySection>
            </div>
          </div>
        </PageContainer>
      </main>
    </SiteShell>
  )
}

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  const titleId = `${title.toLowerCase().replaceAll(" ", "-")}-title`

  return (
    <section aria-labelledby={titleId}>
      <h2 id={titleId} className="text-2xl font-semibold leading-tight text-foreground">
        {title}
      </h2>
      <div className="mt-4 grid gap-4">{children}</div>
    </section>
  )
}
