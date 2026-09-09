import type { SkillListResponse } from "@skill-grill/shared"

import { SkillsBrowser } from "@/components/skills/skills-browser"
import { SiteShell } from "@/components/site-shell"
import { getPublishedSkillList } from "@/lib/skill-publishing"
import { siteConfig } from "@/lib/site-config"

const isStaticExport = process.env.SKILL_GRILL_STATIC_EXPORT === "true"

export const metadata = {
  title: "Browse AI Agent Skills, Reviews and Ratings",
  description: "Browse AI agent skills, compare verdicts and firsthand feedback, and check upstream reach before you install.",
  alternates: { canonical: "/skills/" },
  openGraph: {
    type: "website" as const,
    siteName: siteConfig.name,
    title: "Browse AI Agent Skills, Reviews and Ratings | Skill Grill",
    description: "Browse AI agent skills, compare verdicts and firsthand feedback, and check upstream reach before you install.",
    url: "/skills/",
    images: ["/assets/social-preview.png"],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Browse AI Agent Skills, Reviews and Ratings | Skill Grill",
    description: "Browse AI agent skills, compare verdicts and firsthand feedback, and check upstream reach before you install.",
    images: ["/assets/social-preview.png"],
  },
}

export default async function SkillsPage() {
  const initialData = await getDirectoryPublishingData()

  return (
    <SiteShell>
      <SkillsBrowser initialData={initialData ?? undefined} />
    </SiteShell>
  )
}

async function getDirectoryPublishingData(): Promise<SkillListResponse | null> {
  try {
    return await getPublishedSkillList(
      { tags: [], page: 1, limit: 12, sort: "popular" },
      { required: isStaticExport }
    )
  } catch (error) {
    if (isStaticExport) {
      throw error
    }

    return null
  }
}
