import type { Metadata } from "next"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { PageContainer } from "@/components/page-container"
import { SiteShell } from "@/components/site-shell"
import {
  formatGuideDate,
  getPublishedGuideSummaries,
} from "@/lib/guide-publishing"
import { siteConfig } from "@/lib/site-config"

const isStaticExport = process.env.SKILL_GRILL_STATIC_EXPORT === "true"
const guideIndexTitle = "Guides and Tests for AI Agent Skills"
const guideIndexDescription =
  "Practical field notes for discovering, evaluating, and using AI agent skills with more confidence."

export async function generateMetadata(): Promise<Metadata> {
  const guides = await getPublishedGuideSummaries()

  return {
    title: guideIndexTitle,
    description: guideIndexDescription,
    alternates: { canonical: "/guides/" },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      title: `${guideIndexTitle} | ${siteConfig.name}`,
      description: guideIndexDescription,
      url: "/guides/",
      images: ["/assets/social-preview.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${guideIndexTitle} | ${siteConfig.name}`,
      description: guideIndexDescription,
      images: ["/assets/social-preview.png"],
    },
    robots:
      siteConfig.indexable && guides.length > 0
        ? { index: true, follow: true }
        : { index: false, follow: false, noarchive: true },
  }
}

export default async function GuidesPage() {
  const guides = await getPublishedGuideSummaries({ required: isStaticExport })

  return (
    <SiteShell>
      <main id="main-content" tabIndex={-1} className="flex-1">
        <PageContainer className="py-8 sm:py-10 lg:py-12">
          <header className="max-w-[70ch] border-b border-border pb-8 sm:pb-10">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-primary">
              Guides and tests
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
              Practical notes for choosing better skills.
            </h1>
            <p className="mt-5 text-base leading-7 text-muted-foreground">
              Read focused checklists and field notes before you install, try, and
              review an AI agent skill.
            </p>
          </header>

          <section className="mt-8 max-w-4xl" aria-labelledby="published-guides-title">
            <h2 id="published-guides-title" className="sr-only">
              Published guides
            </h2>
            {guides.length > 0 ? (
              <div className="divide-y divide-border border-y border-border">
                {guides.map((guide) => (
                  <article key={guide.slug} className="py-6 sm:py-7">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline">{guide.category}</Badge>
                      <time dateTime={guide.publishedAt}>
                        {formatGuideDate(guide.publishedAt)}
                      </time>
                    </div>
                    <h3 className="mt-3 text-xl font-semibold leading-tight sm:text-2xl">
                      <Link
                        href={`/guides/${encodeURIComponent(guide.slug)}/`}
                        className="rounded-sm outline-none transition-colors hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      >
                        {guide.title}
                      </Link>
                    </h3>
                    <p className="mt-3 max-w-[65ch] text-sm leading-6 text-muted-foreground">
                      {guide.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {guide.tags.map((tag) => (
                        <span
                          key={tag}
                          className="font-mono text-[0.6875rem] text-muted-foreground"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="border-y border-border py-10" role="status">
                <p className="text-lg font-semibold">No guides published yet.</p>
                <p className="mt-2 max-w-[52ch] text-sm leading-6 text-muted-foreground">
                  Practical field notes and evaluation guides will appear here as they are ready.
                </p>
              </div>
            )}
          </section>
        </PageContainer>
      </main>
    </SiteShell>
  )
}
