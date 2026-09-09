import type { MetadataRoute } from "next"

import { getPublishedGuideSitemapEntries } from "@/lib/guide-publishing"
import { getPublishedSkillCatalog } from "@/lib/skill-publishing"
import { siteConfig } from "@/lib/site-config"

const isStaticExport = process.env.SKILL_GRILL_STATIC_EXPORT === "true"

export const dynamic = "force-static"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!siteConfig.siteUrl) {
    return []
  }

  const [catalog, guides] = await Promise.all([
    getPublishedSkillCatalog({ required: isStaticExport }),
    getPublishedGuideSitemapEntries({ required: isStaticExport }),
  ])
  const staticPaths = [
    "/",
    "/skills/",
    ...(guides.length > 0 ? ["/guides/"] : []),
    "/about/",
    "/contact/",
    "/privacy/",
    "/terms/",
  ]

  return [
    ...staticPaths.map((path) => ({
      url: `${siteConfig.siteUrl}${path}`,
    })),
    ...guides.map(({ slug, lastModified }) => ({
      url: `${siteConfig.siteUrl}/guides/${encodeURIComponent(slug)}/`,
      lastModified,
    })),
    ...catalog.map(({ slug, lastModified }) => ({
      url: `${siteConfig.siteUrl}/skills/${encodeURIComponent(slug)}/`,
      lastModified,
    })),
  ]
}
