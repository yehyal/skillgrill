import type { MetadataRoute } from "next"

import { siteConfig } from "@/lib/site-config"

export const dynamic = "force-static"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      ...(siteConfig.indexable ? { allow: "/" } : { disallow: "/" }),
    },
    ...(siteConfig.siteUrl ? { host: siteConfig.siteUrl } : {}),
    ...(siteConfig.siteUrl && siteConfig.indexable
      ? { sitemap: `${siteConfig.siteUrl}/sitemap.xml` }
      : {}),
  }
}
