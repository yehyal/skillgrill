import type { NextConfig } from "next"

const isCloudflarePagesBuild = process.env.SKILL_GRILL_STATIC_EXPORT === "true"

const nextConfig: NextConfig = {
  agentRules: false,
  ...(isCloudflarePagesBuild
    ? {
        output: "export" as const,
        trailingSlash: true,
        images: {
          unoptimized: true,
        },
      }
    : {}),
}

export default nextConfig
