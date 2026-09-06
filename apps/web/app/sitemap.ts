import type { MetadataRoute } from "next"

import { getPublishedSkillSlugs } from "@/lib/skill-publishing"
import { siteConfig } from "@/lib/site-config"

const isStaticExport = process.env.SKILL_GRILL_STATIC_EXPORT === "true"

export const dynamic = "force-static"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!siteConfig.siteUrl) {
    return []
  }

  const slugs = await getPublishedSkillSlugs({ required: isStaticExport })
  const staticPaths = ["", "/skills", "/about", "/contact", "/privacy", "/terms"]

  return [
    ...staticPaths.map((path) => ({
      url: `${siteConfig.siteUrl}${path || "/"}`,
    })),
    ...slugs.map((slug) => ({
      url: `${siteConfig.siteUrl}/skills/${encodeURIComponent(slug)}/`,
    })),
  ]
}
