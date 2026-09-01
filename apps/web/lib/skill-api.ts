import type {
  CommentCreateRequest,
  CommentCreateResponse,
  SkillDetailResponse,
  SkillListQuery,
  SkillListResponse,
  CommentPageResponse,
  SkillMeResponse,
  SkillStatsResponse,
  VoteRequest,
  VoteResponse,
} from "@skill-grill/shared"

import { apiFetch } from "@/lib/api"

export function createSkillListSearchParams(query: SkillListQuery) {
  const params = new URLSearchParams()

  if (query.q) {
    params.set("q", query.q)
  }

  if (query.sort !== "popular") {
    params.set("sort", query.sort)
  }

  if (query.tags.length > 0) {
    params.set("tags", query.tags.join(","))
  }

  if (query.agents.length > 0) {
    params.set("agents", query.agents.join(","))
  }

  if (query.page > 1) {
    params.set("page", String(query.page))
  }

  params.set("limit", String(query.limit))
  return params
}

export function fetchSkillList(query: SkillListQuery, signal?: AbortSignal) {
  const searchParams = createSkillListSearchParams(query)
  return apiFetch<SkillListResponse>(`/api/skills?${searchParams.toString()}`, {
    signal,
  })
}

export function fetchSkillDetail(slug: string, signal?: AbortSignal) {
  return apiFetch<SkillDetailResponse>(`/api/skills/${encodeURIComponent(slug)}`, {
    signal,
  })
}

export function fetchSkillStats(slug: string, signal?: AbortSignal) {
  return apiFetch<SkillStatsResponse>(
    `/api/skills/${encodeURIComponent(slug)}/stats`,
    { signal }
  )
}

export function fetchSkillComments(
  slug: string,
  options: { limit: number; cursor: string | null; signal?: AbortSignal }
) {
  const params = new URLSearchParams({ limit: String(options.limit) })

  if (options.cursor) {
    params.set("cursor", options.cursor)
  }

  return apiFetch<CommentPageResponse>(
    `/api/skills/${encodeURIComponent(slug)}/comments?${params.toString()}`,
    { signal: options.signal }
  )
}

export function fetchSkillMe(slug: string, accessToken: string, signal?: AbortSignal) {
  return apiFetch<SkillMeResponse>(`/api/skills/${encodeURIComponent(slug)}/me`, {
    signal,
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function submitSkillVote(
  slug: string,
  accessToken: string,
  request: VoteRequest,
  signal?: AbortSignal
) {
  return apiFetch<VoteResponse>(`/api/skills/${encodeURIComponent(slug)}/vote`, {
    method: "PUT",
    signal,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  })
}

export function submitSkillComment(
  slug: string,
  accessToken: string,
  request: CommentCreateRequest,
  signal?: AbortSignal
) {
  return apiFetch<CommentCreateResponse>(
    `/api/skills/${encodeURIComponent(slug)}/comments`,
    {
      method: "POST",
      signal,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  )
}
