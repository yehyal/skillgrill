import type { Metadata } from "next"

import { PageContainer } from "@/components/page-container"
import { AnalyticsPreference } from "@/components/privacy/analytics-preference"
import { SiteShell } from "@/components/site-shell"
import { siteConfig } from "@/lib/site-config"

export const metadata: Metadata = {
  title: "Privacy | Skill Grill",
  description: "How Skill Grill handles identity data, anonymous product analytics, ratings, comments, reports, and browser storage.",
}

export default function PrivacyPage() {
  return (
    <SiteShell>
      <main id="main-content" tabIndex={-1} className="flex-1">
        <PageContainer className="py-8 sm:py-10 lg:py-12">
          <header className="max-w-[70ch] border-b border-border pb-8 sm:pb-10">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-primary">Trust and privacy</p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">Privacy Policy</h1>
            <p className="mt-5 text-base leading-7 text-muted-foreground">
              This practical MVP policy explains what Skill Grill stores, what is public, and how to ask us to access or delete your account data.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">{siteConfig.operator}. Last updated September 8, 2026.</p>
          </header>

          <div className="max-w-[70ch] pt-8 text-sm leading-7 text-secondary-foreground sm:pt-10">
            <div className="grid gap-10">
              <PolicySection title="The short version">
                <p>
                  Skill Grill is a public directory. You can browse without an account. GitHub sign-in through Supabase is only needed to rate skills, post comments, or report comments. We do not sell personal information or run advertising. Anonymous product analytics is optional and can be disabled below.
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
                  The app stores a Supabase authentication session in the browser when you sign in. It also stores your theme choice, your directory list/card preference, and only an analytics opt-out preference when you disable anonymous analytics. These are functional preferences, not advertising cookies. PostHog does not place analytics cookies or persist an analytics identity under this configuration. There is no generic cookie banner because analytics is cookieless and anonymous; this is a product configuration choice, not legal advice.
                </p>
              </PolicySection>

              <PolicySection title="Anonymous product analytics">
                <p>
                  When enabled, PostHog Cloud EU processes anonymous, cookieless page and product-usage events to improve discovery and understand whether skills are evaluated and installed. Collected data includes sanitized page paths, coarse referral and UTM attribution, device and browser information supplied by the SDK, public skill identifiers, interaction types, result counts, and coarse text-length or token buckets.
                </p>
                <p>
                  Skill Grill does not send PostHog account identity, raw searches, comments, reports, clipboard contents, skill-file contents, URL hashes, or unrestricted query parameters. Person profiles, session replay, autocapture, heatmaps, surveys, and exception recording are disabled in the app, and the PostHog project is configured to discard IP data. Supabase authentication and existing theme and layout storage remain functional and separate from analytics.
                </p>
                <AnalyticsPreference />
              </PolicySection>

              <PolicySection title="Hosting and processors">
                <p>
                  GitHub provides the identity provider for sign-in. Supabase provides authentication and database services. Cloudflare hosts the Worker API and may process operational request data such as timestamps, paths, IP addresses, user agents, and error or performance information through its platform logs. PostHog processes the anonymous analytics described above in its EU Cloud region. These providers process data to deliver, secure, improve, and maintain the service.
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
                    Email is currently unavailable. Visit the Contact page for the builder’s profile.
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
