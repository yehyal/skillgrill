import type { MetadataRoute } from "next"

import { siteConfig } from "@/lib/site-config"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      ...(siteConfig.indexable ? { allow: "/" } : { disallow: "/" }),
    },
    ...(siteConfig.siteUrl ? { host: siteConfig.siteUrl } : {}),
  }
}
