export type HealthResponse = {
  ok: true
}

export type SkillStatus = "active" | "hidden" | "archived"

export type SkillSort = "popular" | "score" | "newest"

export type SkillListQuery = {
  q?: string
  sort: SkillSort
  tags: string[]
  agents: string[]
  page: number
  limit: number
}

export type SkillListItem = {
  id: string
  slug: string
  name: string
  description: string
  tags: string[]
  supportedAgents: string[]
  upvotesCount: number
  downvotesCount: number
  commentsCount: number
  score: number
}

export type SkillDetail = {
  id: string
  slug: string
  name: string
  description: string
  sourceUrl: string | null
  installCommand: string | null
  docsUrl: string | null
  tags: string[]
  supportedAgents: string[]
  createdAt: string
  updatedAt: string
}

export type SkillStats = {
  skillId: string
  upvotesCount: number
  downvotesCount: number
  commentsCount: number
  score: number
}

export type PaginationMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type SkillListResponse = {
  data: SkillListItem[]
  pagination: PaginationMeta
}

export type SkillDetailResponse = {
  data: SkillDetail & SkillStats
}

export type ApiErrorCode =
  | "database_unavailable"
  | "invalid_query"
  | "skill_not_found"
  | "internal_error"

export type ApiError = {
  code: ApiErrorCode
  message: string
  details?: Record<string, string>
}

export type ApiErrorResponse = {
  error: ApiError
}
