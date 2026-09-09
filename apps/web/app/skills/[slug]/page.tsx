import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { SkillDetail } from "@/components/skills/skill-detail"
import { SiteShell } from "@/components/site-shell"
import {
  getPublishedSkillDetail,
  getPublishedSkillSlugs,
} from "@/lib/skill-publishing"
import { siteConfig } from "@/lib/site-config"

const isStaticExport = process.env.SKILL_GRILL_STATIC_EXPORT === "true"

export const dynamicParams = false

export async function generateStaticParams() {
  const slugs = await getPublishedSkillSlugs({ required: isStaticExport })
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const result = await getPublishedSkillDetail(slug, { required: isStaticExport })

  if (!result) {
    return {
      title: "Skill not found",
      robots: { index: false, follow: false },
    }
  }

  const skill = result.data
  const title = skill.name
  const socialTitle = `${skill.name} | ${siteConfig.name}`
  const description = toMetadataDescription(skill.description)
  const canonicalPath = `/skills/${encodeURIComponent(skill.slug)}/`

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      title: socialTitle,
      description,
      url: canonicalPath,
      images: ["/assets/social-preview.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: ["/assets/social-preview.png"],
    },
    robots: siteConfig.indexable
      ? { index: true, follow: true }
      : { index: false, follow: false, noarchive: true },
  }
}

export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const result = await getPublishedSkillDetail(slug, { required: isStaticExport })

  if (!result) {
    notFound()
  }

  const skill = result.data
  const canonicalUrl = siteConfig.siteUrl
    ? `${siteConfig.siteUrl}/skills/${encodeURIComponent(skill.slug)}/`
    : undefined
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: skill.name,
    description: skill.description,
    ...(canonicalUrl ? { url: canonicalUrl } : {}),
    ...(skill.sourceUrl ? { codeRepository: skill.sourceUrl } : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <SiteShell>
        <SkillDetail slug={slug} initialData={result} />
      </SiteShell>
    </>
  )
}

function toMetadataDescription(description: string) {
  if (description.length <= 160) {
    return description
  }

  const shortened = description.slice(0, 157).replace(/\s+\S*$/, "").trimEnd()
  return `${shortened || description.slice(0, 157)}...`
}
