import "server-only"

import type { SkillDetailResponse, SkillListResponse } from "@skill-grill/shared"
import { cache } from "react"

import { getApiBaseUrl } from "@/lib/api"

const skillListPageSize = 50

const loadPublishedSkillSlugs = cache(async (apiBaseUrl: string) => {
  const slugs: string[] = []
  const seenSlugs = new Set<string>()
  let expectedTotal: number | null = null
  let expectedTotalPages: number | null = null
  let page = 1

  while (true) {
    const requestUrl = new URL("/api/skills", apiBaseUrl)
    requestUrl.searchParams.set("limit", String(skillListPageSize))
    requestUrl.searchParams.set("page", String(page))
    requestUrl.searchParams.set("sort", "newest")

    const response = await fetch(requestUrl)

    if (!response.ok) {
      throw new Error(
        `Could not load skill slugs for static publishing (HTTP ${response.status}).`
      )
    }

    const result = parseSkillListPage(await response.json(), page)

    if (expectedTotal === null) {
      expectedTotal = result.pagination.total
      expectedTotalPages = result.pagination.totalPages
    } else if (
      result.pagination.total !== expectedTotal ||
      result.pagination.totalPages !== expectedTotalPages
    ) {
      throw new Error("The skill catalog changed while static routes were being collected.")
    }

    for (const skill of result.data) {
      if (seenSlugs.has(skill.slug)) {
        throw new Error(`The skill catalog returned the duplicate slug ${skill.slug}.`)
      }

      seenSlugs.add(skill.slug)
      slugs.push(skill.slug)
    }

    if (page >= result.pagination.totalPages || result.data.length === 0) {
      break
    }

    page += 1
  }

  if (expectedTotal !== slugs.length) {
    throw new Error(
      `The skill catalog reported ${expectedTotal ?? 0} skills but returned ${slugs.length}.`
    )
  }

  return slugs
})

const loadPublishedSkillDetail = cache(
  async (apiBaseUrl: string, slug: string): Promise<SkillDetailResponse | null> => {
    const requestUrl = new URL(`/api/skills/${encodeURIComponent(slug)}`, apiBaseUrl)
    const response = await fetch(requestUrl)

    if (response.status === 404) {
      return null
    }

    if (!response.ok) {
      throw new Error(
        `Could not publish the skill page for ${slug} (HTTP ${response.status}).`
      )
    }

    return parseSkillDetailResponse(await response.json(), slug)
  }
)

export async function getPublishedSkillSlugs(options?: { required?: boolean }) {
  const apiBaseUrl = getPublishingApiBaseUrl(options?.required ?? false)

  if (!apiBaseUrl) {
    return []
  }

  const slugs = await loadPublishedSkillSlugs(apiBaseUrl)

  if (options?.required && slugs.length === 0) {
    throw new Error("Static publishing requires at least one active skill.")
  }

  return slugs
}

export async function getPublishedSkillDetail(
  slug: string,
  options?: { required?: boolean }
) {
  const apiBaseUrl = getPublishingApiBaseUrl(options?.required ?? false)

  if (!apiBaseUrl) {
    return null
  }

  return loadPublishedSkillDetail(apiBaseUrl, slug)
}

function getPublishingApiBaseUrl(required: boolean) {
  const apiBaseUrl = getApiBaseUrl()

  if (!apiBaseUrl && required) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is required to publish static skill pages."
    )
  }

  return apiBaseUrl
}

function parseSkillListPage(payload: unknown, requestedPage: number): SkillListResponse {
  if (!isRecord(payload) || !Array.isArray(payload.data) || !isRecord(payload.pagination)) {
    throw new Error(
      `Skill slug request returned a malformed response on page ${requestedPage}.`
    )
  }

  const { page, limit, total, totalPages } = payload.pagination

  if (
    page !== requestedPage ||
    limit !== skillListPageSize ||
    !isNonNegativeInteger(total) ||
    !isNonNegativeInteger(totalPages)
  ) {
    throw new Error(
      `Skill slug request returned malformed pagination on page ${requestedPage}.`
    )
  }

  const data = payload.data.map((item, index) => {
    if (!isRecord(item) || typeof item.slug !== "string" || item.slug.trim() === "") {
      throw new Error(
        `Skill slug request returned an invalid slug at item ${index} on page ${requestedPage}.`
      )
    }

    return item
  })

  return {
    data: data as SkillListResponse["data"],
    pagination: { page, limit, total, totalPages },
  }
}

function parseSkillDetailResponse(payload: unknown, requestedSlug: string) {
  if (!isRecord(payload) || !isRecord(payload.data)) {
    throw new Error(`Skill detail request returned malformed data for ${requestedSlug}.`)
  }

  const skill = payload.data
  const nullableLinks = [skill.sourceUrl, skill.installCommand, skill.docsUrl]
  const countFields = [
    skill.upvotesCount,
    skill.downvotesCount,
    skill.commentsCount,
    skill.reasonedVotesCount,
    skill.unreasonedVotesCount,
  ]

  if (
    skill.slug !== requestedSlug ||
    !isNonEmptyString(skill.id) ||
    !isNonEmptyString(skill.name) ||
    !isNonEmptyString(skill.description) ||
    nullableLinks.some((value) => value !== null && typeof value !== "string") ||
    !isNullableCompatibilityNote(skill.compatibilityNote) ||
    (skill.estimatedTokens !== null && !isPositiveInteger(skill.estimatedTokens)) ||
    !isStringArray(skill.tags) ||
    !isValidDateString(skill.createdAt) ||
    !isValidDateString(skill.updatedAt) ||
    !Array.isArray(skill.files) ||
    !skill.files.every(
      (file) =>
        isRecord(file) &&
        file.path === "SKILL.md" &&
        typeof file.contents === "string" &&
        file.contents.trim() !== ""
    ) ||
    countFields.some((value) => !isNonNegativeInteger(value)) ||
    !Number.isInteger(skill.score) ||
    !Array.isArray(skill.reasonCounts) ||
    !skill.reasonCounts.every(isVoteReasonCount)
  ) {
    throw new Error(`Skill detail request returned malformed data for ${requestedSlug}.`)
  }

  return payload as SkillDetailResponse
}

function isVoteReasonCount(value: unknown) {
  return (
    isRecord(value) &&
    isVoteReason(value.reason) &&
    (value.value === 1 || value.value === -1) &&
    isPositiveInteger(value.count)
  )
}

function isVoteReason(value: unknown) {
  return (
    typeof value === "string" &&
    [
      "works_reliably",
      "triggers_well",
      "lightweight",
      "does_not_work",
      "misses_triggers",
      "triggers_too_often",
      "too_heavy",
    ].includes(value)
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== ""
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
}

function isNullableCompatibilityNote(value: unknown): value is string | null {
  return value === null || (isNonEmptyString(value) && [...value].length <= 500)
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0
}

function isValidDateString(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value))
}
