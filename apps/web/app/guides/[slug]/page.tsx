import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import type { SkillDetailResponse } from "@skill-grill/shared"

import { Badge } from "@/components/ui/badge"
import { GuideMarkdown } from "@/components/guides/guide-markdown"
import { PageContainer } from "@/components/page-container"
import { SiteShell } from "@/components/site-shell"
import {
  formatGuideDate,
  getPublishedGuide,
  getPublishedGuides,
  type Guide,
} from "@/lib/guide-publishing"
import { getPublishedSkillDetail } from "@/lib/skill-publishing"
import { siteConfig } from "@/lib/site-config"

const isStaticExport = process.env.SKILL_GRILL_STATIC_EXPORT === "true"
const socialImagePath = "/assets/social-preview.png"

export const dynamicParams = false

export async function generateStaticParams() {
  const guides = await getPublishedGuides({ required: isStaticExport })
  return guides.map((guide) => ({ slug: guide.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const guide = await getPublishedGuide(slug, { required: isStaticExport })

  if (!guide) {
    return {
      title: "Guide not found",
      robots: { index: false, follow: false, noarchive: true },
    }
  }

  const title = `${guide.title} | ${siteConfig.name}`
  const canonicalPath = `/guides/${encodeURIComponent(guide.slug)}/`

  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: "article",
      siteName: siteConfig.name,
      title,
      description: guide.description,
      url: canonicalPath,
      publishedTime: `${guide.publishedAt}T00:00:00.000Z`,
      modifiedTime: `${guide.updatedAt}T00:00:00.000Z`,
      authors: [guide.author.name],
      tags: guide.tags,
      images: [socialImagePath],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: guide.description,
      images: [socialImagePath],
    },
    robots: siteConfig.indexable
      ? { index: true, follow: true }
      : { index: false, follow: false, noarchive: true },
  }
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const guide = await getPublishedGuide(slug, { required: isStaticExport })

  if (!guide) {
    notFound()
  }

  const relatedSkills = await getRelatedSkills(guide)
  const siteOrigin = siteConfig.siteUrl ?? "https://skillgrill.dev"
  const canonicalUrl = `${siteOrigin}/guides/${encodeURIComponent(guide.slug)}/`
  const publisherLogoUrl = `${siteOrigin}${siteConfig.logoPath}`
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    url: canonicalUrl,
    datePublished: guide.publishedAt,
    dateModified: guide.updatedAt,
    author: {
      "@type": "Person",
      name: guide.author.name,
      url: guide.author.url,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteOrigin,
      logo: { "@type": "ImageObject", url: publisherLogoUrl },
    },
  }
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${siteOrigin}/` },
      { "@type": "ListItem", position: 2, name: "Guides", item: `${siteOrigin}/guides/` },
      { "@type": "ListItem", position: 3, name: guide.title, item: canonicalUrl },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbData).replace(/</g, "\\u003c"),
        }}
      />
      <SiteShell>
        <main id="main-content" tabIndex={-1} className="flex-1">
          <PageContainer className="py-8 sm:py-10 lg:py-12">
            <nav aria-label="Breadcrumb">
              <ol className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                <li>
                  <Link
                    href="/"
                    className="rounded-sm outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    Home
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li>
                  <Link
                    href="/guides/"
                    className="rounded-sm outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    Guides
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li
                  className="min-w-0 truncate font-medium text-foreground"
                  aria-current="page"
                  title={guide.title}
                >
                  {guide.title}
                </li>
              </ol>
            </nav>

            <article className="mt-8">
              <header className="max-w-[70ch] border-b border-border pb-8 sm:pb-10">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">{guide.category}</Badge>
                  <span>By</span>
                  <a
                    href={guide.author.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-foreground underline decoration-border underline-offset-4 outline-none hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    {guide.author.name}
                  </a>
                  <time dateTime={guide.publishedAt}>
                    {formatGuideDate(guide.publishedAt)}
                  </time>
                  {guide.updatedAt !== guide.publishedAt ? (
                    <time dateTime={guide.updatedAt}>
                      Updated {formatGuideDate(guide.updatedAt)}
                    </time>
                  ) : null}
                </div>
                <h1 className="mt-5 max-w-[22ch] break-words text-3xl font-semibold leading-tight sm:text-5xl">
                  {guide.title}
                </h1>
                <p className="mt-5 max-w-[65ch] text-base leading-7 text-muted-foreground">
                  {guide.description}
                </p>
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {guide.tags.map((tag) => (
                    <span
                      key={tag}
                      className="font-mono text-[0.6875rem] text-muted-foreground"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </header>

              <div className="pt-8 sm:pt-10">
                <GuideMarkdown content={guide.content} slug={guide.slug} />
              </div>
            </article>

            {relatedSkills.length > 0 ? (
              <section className="mt-12 max-w-4xl border-t border-border pt-8" aria-labelledby="related-skills-title">
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-primary">
                  Keep exploring
                </p>
                <h2 id="related-skills-title" className="mt-2 text-2xl font-semibold">
                  Related skills
                </h2>
                <div className="mt-5 divide-y divide-border border-y border-border">
                  {relatedSkills.map((skill) => (
                    <article key={skill.id} className="py-5">
                      <h3 className="text-base font-semibold">
                        <Link
                          href={`/skills/${encodeURIComponent(skill.slug)}/`}
                          className="rounded-sm outline-none transition-colors hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                          {skill.name}
                        </Link>
                      </h3>
                      <p className="mt-2 max-w-[65ch] text-sm leading-6 text-muted-foreground">
                        {skill.description}
                      </p>
                      {skill.tags.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {skill.tags.map((tag) => (
                            <Badge key={tag} variant="outline">{tag}</Badge>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </PageContainer>
        </main>
      </SiteShell>
    </>
  )
}

async function getRelatedSkills(guide: Guide): Promise<SkillDetailResponse["data"][]> {
  const results = await Promise.all(
    guide.relatedSkills.map((slug) =>
      getPublishedSkillDetail(slug, { required: isStaticExport })
    )
  )
  const missing = guide.relatedSkills.filter((_, index) => !results[index])

  if (isStaticExport && missing.length > 0) {
    throw new Error(
      `Guide ${guide.slug} could not load related skills: ${missing.join(", ")}.`
    )
  }

  return results.flatMap((result) => (result ? [result.data] : []))
}
