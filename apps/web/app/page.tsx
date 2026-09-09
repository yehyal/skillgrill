import type { SkillListQuery, SkillListResponse } from "@skill-grill/shared"

import { PageContainer } from "@/components/page-container"
import { SiteShell } from "@/components/site-shell"
import { HomeDiscovery } from "@/components/skills/home-discovery"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRightIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons"
import Link from "next/link"
import { getPublishedSkillList } from "@/lib/skill-publishing"
import { siteConfig } from "@/lib/site-config"

const isStaticExport = process.env.SKILL_GRILL_STATIC_EXPORT === "true"

export const metadata = {
  title: { absolute: "Skill Grill: Reviews and Ratings for AI Agent Skills" },
  description: "Firsthand reviews and ratings for AI agent skills that need to deliver.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website" as const,
    siteName: siteConfig.name,
    title: "Skill Grill: Reviews and Ratings for AI Agent Skills",
    description: "Firsthand reviews and ratings for AI agent skills that need to deliver.",
    url: "/",
    images: ["/assets/social-preview.png"],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Skill Grill: Reviews and Ratings for AI Agent Skills",
    description: "Firsthand reviews and ratings for AI agent skills that need to deliver.",
    images: ["/assets/social-preview.png"],
  },
}

export default async function Home() {
  const [initialLeaderboardData, initialRecentData] = await Promise.all([
    getPublishingList({ tags: [], page: 1, limit: 5, sort: "popular" }),
    getPublishingList({ tags: [], page: 1, limit: 4, sort: "newest" }),
  ])

  const websiteStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: `${siteConfig.siteUrl ?? "https://skillgrill.dev"}/`,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteStructuredData).replace(/</g, "\\u003c"),
        }}
      />
      <SiteShell>
        <main id="main-content" tabIndex={-1} className="flex-1">
        <section aria-labelledby="hero-title" className="border-b border-border bg-card">
          <PageContainer className="grid gap-5 py-8 md:gap-8 sm:py-10 md:grid-cols-[minmax(0,1fr)_16rem] md:items-end lg:py-10">
            <div className="max-w-[44rem]">
              <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-primary">
                Skills, put to the test
              </p>
              <h1
                id="hero-title"
                className="mt-3 max-w-[18ch] text-4xl font-semibold leading-[1.1] text-balance sm:text-5xl"
              >
                Find AI agent skills that actually work.
              </h1>
              <p className="mt-4 max-w-[38rem] text-base leading-7 text-muted-foreground">
                Votes, comments, and firsthand takes on whether each skill lives up to the hype.
              </p>

              <form action="/skills" className="mt-6 flex flex-col gap-2 sm:max-w-[36rem] sm:flex-row">
                <label className="min-w-0 flex-1">
                  <span className="sr-only">Search skills</span>
                  <span className="relative block">
                    <MagnifyingGlassIcon
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      name="q"
                      placeholder="Search by name, description, or tag"
                      className="pl-9"
                    />
                  </span>
                </label>
                <Button type="submit" className="sm:px-5">
                  Search
                </Button>
              </form>
            </div>

            <aside className="md:border-t md:border-border md:pt-5 md:pb-1" aria-label="About the ratings">
              <p className="hidden text-sm font-semibold md:block">A little proof before you install.</p>
              <p className="mt-2 hidden text-sm leading-6 text-muted-foreground md:block">
                Read what worked, what fell short, and why. Every verdict comes from someone who tried it.
              </p>
              <Link href="/about" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline md:mt-4">
                How ratings work <ArrowRightIcon aria-hidden="true" />
              </Link>
            </aside>
          </PageContainer>
        </section>

        <PageContainer className="py-5 sm:py-6">
          <section aria-labelledby="shortcuts-title">
            <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
              <h2 id="shortcuts-title" className="text-sm font-semibold">
                Browse by task
              </h2>
              <Button asChild variant="ghost" size="sm">
                <Link href="/skills">
                  Browse all <ArrowRightIcon aria-hidden="true" />
                </Link>
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                ["Design", "/skills?tags=design"],
                ["Prompting", "/skills?tags=prompting"],
                ["Frontend", "/skills?tags=frontend"],
                ["Writing", "/skills?tags=writing"],
              ].map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  className="inline-flex min-h-10 items-center gap-8 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium outline-none transition-colors hover:border-primary/50 hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  {label}<ArrowRightIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </section>
        </PageContainer>

        <HomeDiscovery
          initialLeaderboardData={initialLeaderboardData ?? undefined}
          initialRecentData={initialRecentData ?? undefined}
        />
        </main>
      </SiteShell>
    </>
  )
}

async function getPublishingList(query: SkillListQuery): Promise<SkillListResponse | null> {
  try {
    return await getPublishedSkillList(query, { required: isStaticExport })
  } catch (error) {
    if (isStaticExport) {
      throw error
    }

    return null
  }
}
