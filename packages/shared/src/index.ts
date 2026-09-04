export type HealthResponse = {
  ok: true
}

export type SkillStatus = "active" | "hidden" | "archived"

export type SkillSort = "popular" | "score" | "newest" | "trending"

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
  trendDelta?: number
  topReason: VoteReasonCount | null
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
  reasonCounts: VoteReasonCount[]
  reasonedVotesCount: number
  unreasonedVotesCount: number
}

export type VoteValue = 1 | -1 | null

export type WellDoneReason = "works_reliably" | "triggers_well" | "lightweight"

export type UndercookedReason =
  | "does_not_work"
  | "misses_triggers"
  | "triggers_too_often"
  | "too_heavy"

export type VoteReason = WellDoneReason | UndercookedReason

export type VoteReasonCount = {
  reason: VoteReason
  value: 1 | -1
  count: number
}

export type SkillMeState = {
  myVote: VoteValue
  myReason: VoteReason | null
}

export type VoteRequest =
  | { value: 1; reason: WellDoneReason | null }
  | { value: -1; reason: UndercookedReason | null }
  | { value: null }

export type SkillStatsResponse = {
  data: SkillStats
}

export type SkillMeResponse = {
  data: SkillMeState
}

export type VoteResponse = {
  data: SkillStats & SkillMeState
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

export type CommentAuthor = {
  id: string
  username: string
  displayName: string | null
  avatarUrl: string | null
}

export type CommentItem = {
  id: string
  skillId: string
  body: string
  createdAt: string
  author: CommentAuthor
}

export type CommentPageResponse = {
  data: CommentItem[]
  nextCursor: string | null
}

export type CommentCreateRequest = {
  id: string
  body: string
}

export type CommentCreateResponse = {
  data: {
    comment: CommentItem
    commentsCount: number
  }
}

export type ReportReason = "spam" | "abuse" | "unsafe" | "off_topic" | "other"

export type CommentReportRequest = {
  reason: ReportReason
  note?: string
}

export type CommentReportResponse = {
  ok: true
  reportsCount: number
}

export type ApiErrorCode =
  | "database_unavailable"
  | "comment_not_found"
  | "forbidden"
  | "invalid_query"
  | "invalid_request"
  | "rate_limited"
  | "skill_not_found"
  | "unauthorized"
  | "internal_error"

export type ApiError = {
  code: ApiErrorCode
  message: string
  details?: Record<string, string>
}

export type ApiErrorResponse = {
  error: ApiError
}
