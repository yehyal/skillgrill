import "server-only"

import type {
  SkillDetailResponse,
  SkillListItem,
  SkillListQuery,
  SkillListResponse,
} from "@skill-grill/shared"
import { cache } from "react"

import { getApiBaseUrl } from "@/lib/api"

const skillListPageSize = 50

export type PublishedSkillCatalogEntry = {
  slug: string
  lastModified: string
}

const loadPublishedSkillCatalog = cache(async (apiBaseUrl: string) => {
  const skills: PublishedSkillCatalogEntry[] = []
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

    const result = parseSkillListPage(await response.json(), {
      page,
      limit: skillListPageSize,
      sort: "newest",
    })

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
      skills.push({
        slug: skill.slug,
        lastModified: skill.freshness.catalogUpdatedAt,
      })
    }

    if (page >= result.pagination.totalPages || result.data.length === 0) {
      break
    }

    page += 1
  }

  if (expectedTotal !== skills.length) {
    throw new Error(
      `The skill catalog reported ${expectedTotal ?? 0} skills but returned ${skills.length}.`
    )
  }

  return skills
})

const loadPublishedSkillList = cache(
  async (apiBaseUrl: string, query: SkillListQuery) => {
    const requestUrl = new URL("/api/skills", apiBaseUrl)
    requestUrl.searchParams.set("limit", String(query.limit))
    requestUrl.searchParams.set("page", String(query.page))
    requestUrl.searchParams.set("sort", query.sort)

    if (query.q) {
      requestUrl.searchParams.set("q", query.q)
    }

    if (query.tags.length > 0) {
      requestUrl.searchParams.set("tags", query.tags.join(","))
    }

    const response = await fetch(requestUrl)

    if (!response.ok) {
      throw new Error(
        `Could not load the published skill list (HTTP ${response.status}).`
      )
    }

    return parseSkillListPage(await response.json(), query)
  }
)

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
  const skills = await getPublishedSkillCatalog(options)
  return skills.map((skill) => skill.slug)
}

export async function getPublishedSkillCatalog(options?: { required?: boolean }) {
  const apiBaseUrl = getPublishingApiBaseUrl(options?.required ?? false)

  if (!apiBaseUrl) {
    return []
  }

  const skills = await loadPublishedSkillCatalog(apiBaseUrl)

  if (options?.required && skills.length === 0) {
    throw new Error("Static publishing requires at least one active skill.")
  }

  return skills
}

export async function getPublishedSkillList(
  query: SkillListQuery,
  options?: { required?: boolean }
) {
  const required = options?.required ?? false
  const apiBaseUrl = getPublishingApiBaseUrl(required)

  if (!apiBaseUrl) {
    return null
  }

  const result = await loadPublishedSkillList(apiBaseUrl, query)

  if (required && result.data.length === 0) {
    throw new Error(
      `Static publishing requires a non-empty ${query.sort} skill list.`
    )
  }

  return result
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

function parseSkillListPage(
  payload: unknown,
  expectedQuery: Pick<SkillListQuery, "page" | "limit" | "sort">
): SkillListResponse {
  if (!isRecord(payload) || !Array.isArray(payload.data) || !isRecord(payload.pagination)) {
    throw new Error(
      `Published skill request returned malformed data on page ${expectedQuery.page}.`
    )
  }

  const { page, limit, total, totalPages } = payload.pagination
  const expectedItemCount = isNonNegativeInteger(total)
    ? Math.max(
        0,
        Math.min(expectedQuery.limit, total - (expectedQuery.page - 1) * expectedQuery.limit)
      )
    : null

  if (
    page !== expectedQuery.page ||
    limit !== expectedQuery.limit ||
    !isNonNegativeInteger(total) ||
    !isNonNegativeInteger(totalPages) ||
    totalPages !== (total === 0 ? 0 : Math.ceil(total / expectedQuery.limit)) ||
    payload.data.length !== expectedItemCount
  ) {
    throw new Error(
      `Published skill request returned malformed pagination on page ${expectedQuery.page}.`
    )
  }

  const data = payload.data.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(
        `Published skill request returned an invalid item at index ${index} on page ${expectedQuery.page}.`
      )
    }

    if (!isSkillListItem(item, expectedQuery.sort)) {
      throw new Error(
        `Published skill request returned an invalid item at index ${index} on page ${expectedQuery.page}.`
      )
    }

    return item
  })

  return {
    data: data as SkillListResponse["data"],
    pagination: {
      page: page as number,
      limit: limit as number,
      total: total as number,
      totalPages: totalPages as number,
    },
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
    !isSkillFreshness(skill.freshness) ||
    !isSkillPopularity(skill.popularity) ||
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

function isSkillListItem(
  value: Record<string, unknown>,
  sort: SkillListQuery["sort"]
): value is Record<string, unknown> & SkillListItem {
  const hasValidTrend =
    value.trendDelta === undefined || isNonNegativeInteger(value.trendDelta)

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.slug) &&
    isNonEmptyString(value.name) &&
    isNonEmptyString(value.description) &&
    isStringArray(value.tags) &&
    isNonNegativeInteger(value.upvotesCount) &&
    isNonNegativeInteger(value.downvotesCount) &&
    isNonNegativeInteger(value.commentsCount) &&
    Number.isInteger(value.score) &&
    isNullableVoteReasonCount(value.topReason) &&
    isSkillFreshness(value.freshness) &&
    isSkillPopularity(value.popularity) &&
    hasValidTrend &&
    (sort !== "trending" || isPositiveInteger(value.trendDelta))
  )
}

function isNullableVoteReasonCount(value: unknown) {
  return value === null || isVoteReasonCount(value)
}

function isSkillFreshness(value: unknown) {
  return (
    isRecord(value) &&
    isValidDateString(value.catalogUpdatedAt) &&
    (value.catalogCheckedAt === null || isValidDateString(value.catalogCheckedAt))
  )
}

function isSkillPopularity(value: unknown) {
  return (
    isRecord(value) &&
    isNullablePopularityMetric(value.installs, false) &&
    isNullablePopularityMetric(value.repositoryStars, true)
  )
}

function isNullablePopularityMetric(value: unknown, repository: boolean) {
  if (value === null) {
    return true
  }

  if (!isRecord(value) || !isNonNegativeInteger(value.count) || !isValidDateString(value.checkedAt)) {
    return false
  }

  return !repository || isHttpsRepositoryUrl(value.repositoryUrl)
}

function isHttpsRepositoryUrl(value: unknown) {
  if (typeof value !== "string") {
    return false
  }

  try {
    const url = new URL(value)
    return (
      url.protocol === "https:" &&
      url.hostname === "github.com" &&
      url.pathname.split("/").filter(Boolean).length === 2 &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash
    )
  } catch {
    return false
  }
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
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})$/.test(value) &&
    !Number.isNaN(Date.parse(value))
  )
}
