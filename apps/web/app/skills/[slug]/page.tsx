import type { SkillListResponse } from "@skill-grill/shared"
import { notFound } from "next/navigation"

import { SkillDetail } from "@/components/skills/skill-detail"
import { SiteShell } from "@/components/site-shell"
import { getApiBaseUrl } from "@/lib/api"

const isStaticExport = process.env.SKILL_GRILL_STATIC_EXPORT === "true"
const staticExportSentinelSlug = "__static-export-sentinel__"
const skillListPageSize = 50

export const dynamicParams = false

export async function generateStaticParams() {
  if (isStaticExport) {
    return [{ slug: staticExportSentinelSlug }]
  }

  const apiBaseUrl = getApiBaseUrl()

  if (!apiBaseUrl) {
    return []
  }

  const params: Array<{ slug: string }> = []
  let page = 1

  while (true) {
    const requestUrl = new URL("/api/skills", apiBaseUrl)
    requestUrl.searchParams.set("limit", String(skillListPageSize))
    requestUrl.searchParams.set("page", String(page))
    requestUrl.searchParams.set("sort", "newest")

    const response = await fetch(requestUrl)

    if (!response.ok) {
      throw new Error(
        `Could not load skill slugs for route generation (HTTP ${response.status}).`
      )
    }

    const payload = (await response.json()) as unknown
    const result = parseSkillListPage(payload, page)

    params.push(...result.data.map((skill) => ({ slug: skill.slug })))

    if (page >= result.pagination.totalPages || result.data.length === 0) {
      return params
    }

    page += 1
  }
}

function parseSkillListPage(payload: unknown, page: number): SkillListResponse {
  if (!isRecord(payload) || !Array.isArray(payload.data) || !isRecord(payload.pagination)) {
    throw new Error(`Skill slug request returned a malformed response on page ${page}.`)
  }

  const totalPages = payload.pagination.totalPages

  if (typeof totalPages !== "number" || !Number.isInteger(totalPages) || totalPages < 0) {
    throw new Error(`Skill slug request returned malformed pagination on page ${page}.`)
  }

  const data = payload.data.map((item, index) => {
    if (!isRecord(item) || typeof item.slug !== "string" || item.slug.trim() === "") {
      throw new Error(`Skill slug request returned an invalid slug at item ${index} on page ${page}.`)
    }

    return item
  })

  return {
    data: data as SkillListResponse["data"],
    pagination: payload.pagination as SkillListResponse["pagination"],
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  if (isStaticExport && slug === staticExportSentinelSlug) {
    notFound()
  }

  return (
    <SiteShell>
      <SkillDetail />
    </SiteShell>
  )
}
