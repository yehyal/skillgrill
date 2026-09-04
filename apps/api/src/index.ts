import {
  comments,
  createDatabase,
  profiles,
  skillVoteEvents,
  skillVotes,
  skills,
} from "@skill-grill/db"
import type {
  ApiErrorCode,
  CommentCreateRequest,
  CommentCreateResponse,
  CommentItem,
  CommentReportResponse,
  CommentPageResponse,
  HealthResponse,
  SkillDetailResponse,
  SkillListQuery,
  SkillListResponse,
  SkillMeResponse,
  SkillStatsResponse,
  SkillSort,
  VoteReason,
  VoteReasonCount,
  VoteRequest,
  VoteResponse,
  VoteValue,
} from "@skill-grill/shared"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  or,
  sql,
} from "drizzle-orm"
import { Hono, type Context } from "hono"
import { cors } from "hono/cors"
import { z } from "zod"

type Bindings = {
  COMMENT_RATE_LIMITER?: RateLimiter
  DATABASE_URL?: string
  REPORT_RATE_LIMITER?: RateLimiter
  SUPABASE_PUBLISHABLE_KEY?: string
  SUPABASE_URL?: string
  VOTE_RATE_LIMITER?: RateLimiter
  WEB_ORIGIN?: string
}

type AppEnv = {
  Bindings: Bindings
  Variables: {
    requestId: string
  }
}

type RateLimiter = {
  limit(options: { key: string }): Promise<{ success: boolean }>
}

type ErrorStatus = 400 | 401 | 403 | 404 | 429 | 500 | 503

const DEFAULT_LIMIT = 12
const MAX_LIMIT = 50
const DEFAULT_COMMENT_LIMIT = 20
const MAX_COMMENT_LIMIT = 50
const CACHE_CONTROL = {
  noStore: "no-store",
  private: "private, no-store",
  skillList: "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
  skillDetail: "public, max-age=300, s-maxage=1800, stale-while-revalidate=3600",
  stats: "public, max-age=10, s-maxage=60, stale-while-revalidate=60",
  comments: "public, max-age=30, s-maxage=60, stale-while-revalidate=60",
} as const
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), geolocation=(), microphone=(), payment=()",
} as const
const RATE_LIMIT_RETRY_AFTER_SECONDS = 60
const voteRequestSchema = z.union([
  z
    .object({
      value: z.literal(1),
      reason: z.enum(["works_reliably", "triggers_well", "lightweight"]).nullable(),
    })
    .strict(),
  z
    .object({
      value: z.literal(-1),
      reason: z.enum([
        "does_not_work",
        "misses_triggers",
        "triggers_too_often",
        "too_heavy",
      ]).nullable(),
    })
    .strict(),
  z.object({ value: z.null() }).strict(),
])
const commentRequestSchema = z
  .object({
    id: z.string().uuid(),
    body: z.string().trim().min(2).max(2000),
  })
  .strict()
const reportRequestSchema = z
  .object({
    reason: z.enum(["spam", "abuse", "unsafe", "off_topic", "other"]),
    note: z.string().trim().max(500).optional().transform((note) => note || null),
  })
  .strict()

let cachedSupabase: SupabaseClient | null = null
let cachedSupabaseConfig: string | null = null

type VoteFunctionRow = {
  skill_id: string
  my_vote: number | null
  my_reason: string | null
  upvotes_count: number
  downvotes_count: number
  comments_count: number
  score: number
}

type CommentCursor = {
  createdAt: string
  id: string
}

type CommentFunctionRow = {
  comment_id: string
  skill_id: string
  user_id: string
  body: string
  created_at: Date
  comments_count: number
  author_username: string
  author_display_name: string | null
  author_avatar_url: string | null
}

type CommentListRow = {
  id: string
  skillId: string
  body: string
  createdAt: Date
  cursorCreatedAt: string
  authorId: string
  authorUsername: string
  authorDisplayName: string | null
  authorAvatarUrl: string | null
}

type ReportFunctionRow = {
  reports_count: number
}

export const app = new Hono<AppEnv>()

app.use("*", async (context, next) => {
  const requestId = crypto.randomUUID()
  context.set("requestId", requestId)
  context.header("X-Request-Id", requestId)

  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    context.header(name, value)
  }

  const hasAuthorizationHeader = Boolean(context.req.header("Authorization"))

  if (hasAuthorizationHeader) {
    context.header("Cache-Control", CACHE_CONTROL.private)
  }

  try {
    await next()
  } finally {
    if (hasAuthorizationHeader) {
      context.header("Cache-Control", CACHE_CONTROL.private)
    } else if (!context.res.headers.has("Cache-Control")) {
      context.header("Cache-Control", CACHE_CONTROL.noStore)
    }
  }
})

app.use(
  "*",
  cors({
    origin: (origin, context) => {
      const configuredOrigin = context.env.WEB_ORIGIN ?? "http://localhost:3000"

      if (!origin || origin === configuredOrigin) {
        return configuredOrigin
      }

      return ""
    },
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "OPTIONS"],
    maxAge: 600,
  })
)

app.onError((_error, context) => {
  logApiFailure(context, "internal_error", 500)

  return jsonError(
    context,
    "internal_error",
    "Something went wrong while handling that request.",
    500,
    { log: false }
  )
})

app.get("/health", (context) => {
  context.header("Cache-Control", CACHE_CONTROL.noStore)
  const response: HealthResponse = { ok: true }

  return context.json(response)
})

app.post("/api/comments/:commentId/report", async (context) => {
  context.header("Cache-Control", CACHE_CONTROL.private)
  const userId = await getAuthenticatedUserId(context)

  if (!userId) {
    return jsonError(
      context,
      "unauthorized",
      "A valid Supabase access token is required.",
      401
    )
  }

  const rateLimitResponse = await enforceRateLimit(
    context,
    userId,
    context.env.REPORT_RATE_LIMITER,
    "reports"
  )

  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const commentId = z.string().uuid().safeParse(context.req.param("commentId"))

  if (!commentId.success) {
    return jsonError(context, "invalid_request", "commentId must be a valid UUID.", 400)
  }

  let payload: unknown

  try {
    payload = await context.req.json()
  } catch {
    return jsonError(
      context,
      "invalid_request",
      "The request body must be valid JSON matching { reason, note? }.",
      400
    )
  }

  const parsed = reportRequestSchema.safeParse(payload)

  if (!parsed.success) {
    return jsonError(
      context,
      "invalid_request",
      "Reason must be spam, abuse, unsafe, off_topic, or other, with an optional note up to 500 characters.",
      400
    )
  }

  const database = getDatabase(context.env.DATABASE_URL)

  if (!database) {
    return jsonError(
      context,
      "database_unavailable",
      "Reporting is temporarily unavailable because the database is not configured.",
      503
    )
  }

  try {
    const rows = await database.db.execute<ReportFunctionRow>(sql`
      select reports_count
      from public.report_comment(
        ${commentId.data}::uuid,
        ${userId}::uuid,
        ${parsed.data.reason},
        ${parsed.data.note}
      )
    `)
    const result = rows[0]

    if (!result) {
      return jsonError(
        context,
        "comment_not_found",
        "That comment is no longer available for reporting.",
        404
      )
    }

    const response: CommentReportResponse = {
      ok: true,
      reportsCount: result.reports_count,
    }

    return context.json(response)
  } catch (error) {
    const message = getDatabaseErrorMessage(error)

    if (message === "report_self_forbidden") {
      return jsonError(
        context,
        "forbidden",
        "You cannot report your own comment.",
        403
      )
    }

    if (message === "report_reason_invalid" || message === "report_note_invalid") {
      return jsonError(
        context,
        "invalid_request",
        "The report details are invalid.",
        400
      )
    }

    return jsonError(
      context,
      "database_unavailable",
      "Reporting is temporarily unavailable. Please try again shortly.",
      503
    )
  } finally {
    await closeDatabase(database)
  }
})

app.get("/api/skills", async (context) => {
  const parsedQuery = parseSkillListQuery(context.req.query())

  if (!parsedQuery.ok) {
    return jsonError(context, "invalid_query", parsedQuery.message, 400)
  }

  const database = getDatabase(context.env.DATABASE_URL)

  if (!database) {
    return jsonError(
      context,
      "database_unavailable",
      "Skill discovery is temporarily unavailable because the database is not configured.",
      503
    )
  }

  try {
    const where = buildSkillWhere(parsedQuery.value)
    const [totalResult, rows] = await Promise.all([
      getSkillListTotal(database.db, parsedQuery.value, where),
      getSkillListRows(database.db, parsedQuery.value, where),
    ])
    const topReasons = await getTopReasonsForSkills(
      database.db,
      rows.map((row) => row.id)
    )
    const total = Number(totalResult[0]?.total ?? 0)
    const totalPages = total === 0 ? 0 : Math.ceil(total / parsedQuery.value.limit)

    const response: SkillListResponse = {
      data: rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        description: row.description,
        tags: row.tags,
        supportedAgents: row.supportedAgents,
        upvotesCount: row.upvotesCount,
        downvotesCount: row.downvotesCount,
        commentsCount: row.commentsCount,
        score: row.score ?? row.upvotesCount - row.downvotesCount,
        topReason: topReasons.get(row.id) ?? null,
        ...(parsedQuery.value.sort === "trending" && row.trendDelta !== null
          ? { trendDelta: row.trendDelta }
          : {}),
      })),
      pagination: {
        page: parsedQuery.value.page,
        limit: parsedQuery.value.limit,
        total,
        totalPages,
      },
    }

    context.header("Cache-Control", CACHE_CONTROL.skillList)
    return context.json(response)
  } catch {
    return jsonError(
      context,
      "database_unavailable",
      "Skill discovery is temporarily unavailable. Please try again shortly.",
      503
    )
  } finally {
    await closeDatabase(database)
  }
})

app.get("/api/skills/:slug", async (context) => {
  const database = getDatabase(context.env.DATABASE_URL)

  if (!database) {
    return jsonError(
      context,
      "database_unavailable",
      "Skill details are temporarily unavailable because the database is not configured.",
      503
    )
  }

  try {
    const row = await database.db
      .select({
        id: skills.id,
        slug: skills.slug,
        name: skills.name,
        description: skills.description,
        sourceUrl: skills.sourceUrl,
        installCommand: skills.installCommand,
        docsUrl: skills.docsUrl,
        tags: skills.tags,
        supportedAgents: skills.supportedAgents,
        createdAt: skills.createdAt,
        updatedAt: skills.updatedAt,
        skillId: skills.id,
        upvotesCount: skills.upvotesCount,
        downvotesCount: skills.downvotesCount,
        commentsCount: skills.commentsCount,
        score: skills.score,
      })
      .from(skills)
      .where(and(eq(skills.slug, context.req.param("slug")), eq(skills.status, "active")))
      .limit(1)

    const skill = row[0]

    if (!skill) {
      return jsonError(
        context,
        "skill_not_found",
        "That skill does not exist or is no longer public.",
        404
      )
    }

    const reasonStats = await getSkillReasonStats(database.db, skill.id)

    const response: SkillDetailResponse = {
      data: {
        ...skill,
        score: skill.score ?? skill.upvotesCount - skill.downvotesCount,
        ...reasonStats,
        createdAt: skill.createdAt.toISOString(),
        updatedAt: skill.updatedAt.toISOString(),
      },
    }

    context.header("Cache-Control", CACHE_CONTROL.skillDetail)
    return context.json(response)
  } catch {
    return jsonError(
      context,
      "database_unavailable",
      "Skill details are temporarily unavailable. Please try again shortly.",
      503
    )
  } finally {
    await closeDatabase(database)
  }
})

app.get("/api/skills/:slug/stats", async (context) => {
  const database = getDatabase(context.env.DATABASE_URL)

  if (!database) {
    return jsonError(
      context,
      "database_unavailable",
      "Skill statistics are temporarily unavailable because the database is not configured.",
      503
    )
  }

  try {
    const rows = await database.db
      .select({
        skillId: skills.id,
        upvotesCount: skills.upvotesCount,
        downvotesCount: skills.downvotesCount,
        commentsCount: skills.commentsCount,
        score: skills.score,
      })
      .from(skills)
      .where(and(eq(skills.slug, context.req.param("slug")), eq(skills.status, "active")))
      .limit(1)

    const skill = rows[0]

    if (!skill) {
      return jsonError(
        context,
        "skill_not_found",
        "That skill does not exist or is no longer public.",
        404
      )
    }

    const reasonStats = await getSkillReasonStats(database.db, skill.skillId)

    const response: SkillStatsResponse = {
      data: {
        ...skill,
        score: skill.score ?? skill.upvotesCount - skill.downvotesCount,
        ...reasonStats,
      },
    }

    context.header("Cache-Control", CACHE_CONTROL.stats)
    return context.json(response)
  } catch {
    return jsonError(
      context,
      "database_unavailable",
      "Skill statistics are temporarily unavailable. Please try again shortly.",
      503
    )
  } finally {
    await closeDatabase(database)
  }
})

app.get("/api/skills/:slug/comments", async (context) => {
  const parsedQuery = parseCommentQuery(context.req.query())

  if (!parsedQuery.ok) {
    return jsonError(context, "invalid_query", parsedQuery.message, 400)
  }

  const database = getDatabase(context.env.DATABASE_URL)

  if (!database) {
    return jsonError(
      context,
      "database_unavailable",
      "Comments are temporarily unavailable because the database is not configured.",
      503
    )
  }

  try {
    const skillRows = await database.db
      .select({ id: skills.id })
      .from(skills)
      .where(and(eq(skills.slug, context.req.param("slug")), eq(skills.status, "active")))
      .limit(1)
    const skill = skillRows[0]

    if (!skill) {
      return jsonError(
        context,
        "skill_not_found",
        "That skill does not exist or is no longer public.",
        404
      )
    }

    const conditions = [
      eq(comments.skillId, skill.id),
      eq(comments.status, "visible"),
      isNull(comments.parentId),
    ]

    if (parsedQuery.value.cursor) {
      const cursor = parsedQuery.value.cursor
      const cursorCondition = or(
        sql`${comments.createdAt} < ${cursor.createdAt}::timestamptz`,
        and(
          sql`${comments.createdAt} = ${cursor.createdAt}::timestamptz`,
          sql`${comments.id} < ${cursor.id}::uuid`
        )
      )

      if (cursorCondition) {
        conditions.push(cursorCondition)
      }
    }

    const rows = await database.db
      .select({
        id: comments.id,
        skillId: comments.skillId,
        body: comments.body,
        createdAt: comments.createdAt,
        cursorCreatedAt: sql<string>`to_char(${comments.createdAt} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`,
        authorId: profiles.id,
        authorUsername: profiles.username,
        authorDisplayName: profiles.displayName,
        authorAvatarUrl: profiles.avatarUrl,
      })
      .from(comments)
      .innerJoin(profiles, eq(profiles.id, comments.userId))
      .where(and(...conditions))
      .orderBy(desc(comments.createdAt), desc(comments.id))
      .limit(parsedQuery.value.limit + 1)

    const hasNextPage = rows.length > parsedQuery.value.limit
    const pageRows = rows.slice(0, parsedQuery.value.limit)
    const lastRow = pageRows.at(-1)
    const response: CommentPageResponse = {
      data: pageRows.map(toCommentItem),
      nextCursor:
        hasNextPage && lastRow
          ? encodeCommentCursor({
            createdAt: lastRow.cursorCreatedAt,
            id: lastRow.id,
          })
          : null,
    }

    context.header("Cache-Control", CACHE_CONTROL.comments)
    return context.json(response)
  } catch {
    return jsonError(
      context,
      "database_unavailable",
      "Comments are temporarily unavailable. Please try again shortly.",
      503
    )
  } finally {
    await closeDatabase(database)
  }
})

app.post("/api/skills/:slug/comments", async (context) => {
  context.header("Cache-Control", CACHE_CONTROL.private)
  const userId = await getAuthenticatedUserId(context)

  if (!userId) {
    return jsonError(
      context,
      "unauthorized",
      "A valid Supabase access token is required.",
      401
    )
  }

  const rateLimitResponse = await enforceRateLimit(
    context,
    userId,
    context.env.COMMENT_RATE_LIMITER,
    "comments"
  )

  if (rateLimitResponse) {
    return rateLimitResponse
  }

  let payload: unknown

  try {
    payload = await context.req.json()
  } catch {
    return jsonError(
      context,
      "invalid_request",
      "The request body must be valid JSON matching { id: string, body: string }.",
      400
    )
  }

  const parsed = commentRequestSchema.safeParse(payload)

  if (!parsed.success) {
    return jsonError(
      context,
      "invalid_request",
      "Comment id must be a UUID and the body must be between 2 and 2,000 characters after trimming.",
      400
    )
  }

  const database = getDatabase(context.env.DATABASE_URL)

  if (!database) {
    return jsonError(
      context,
      "database_unavailable",
      "Comments are temporarily unavailable because the database is not configured.",
      503
    )
  }

  try {
    const request: CommentCreateRequest = parsed.data
    const rows = await database.db.execute<CommentFunctionRow>(sql`
      select
        comment_id,
        skill_id,
        user_id,
        body,
        created_at,
        comments_count,
        author_username,
        author_display_name,
        author_avatar_url
      from public.create_skill_comment(
        ${request.id}::uuid,
        ${context.req.param("slug")},
        ${userId}::uuid,
        ${request.body}
      )
    `
    )
    const comment = rows[0]

    if (!comment) {
      return jsonError(
        context,
        "skill_not_found",
        "That skill does not exist or is no longer public.",
        404
      )
    }

    const response: CommentCreateResponse = {
      data: {
        comment: {
          id: comment.comment_id,
          skillId: comment.skill_id,
          body: comment.body,
          createdAt: toIsoTimestamp(comment.created_at),
          author: {
            id: comment.user_id,
            username: comment.author_username,
            displayName: comment.author_display_name,
            avatarUrl: comment.author_avatar_url,
          },
        },
        commentsCount: comment.comments_count,
      },
    }

    return context.json(response)
  } catch (error) {
    if (isCommentValidationError(error)) {
      return jsonError(
        context,
        "invalid_request",
        getCommentValidationMessage(error),
        400
      )
    }

    return jsonError(
      context,
      "database_unavailable",
      "Comments are temporarily unavailable. Please try again shortly.",
      503
    )
  } finally {
    await closeDatabase(database)
  }
})

app.get("/api/skills/:slug/me", async (context) => {
  context.header("Cache-Control", CACHE_CONTROL.private)
  const userId = await getAuthenticatedUserId(context)

  if (!userId) {
    return jsonError(
      context,
      "unauthorized",
      "A valid Supabase access token is required.",
      401
    )
  }

  const database = getDatabase(context.env.DATABASE_URL)

  if (!database) {
    return jsonError(
      context,
      "database_unavailable",
      "Your vote state is temporarily unavailable because the database is not configured.",
      503
    )
  }

  try {
    const rows = await database.db
      .select({
        skillId: skills.id,
        value: skillVotes.value,
        reason: skillVotes.reason,
      })
      .from(skills)
      .leftJoin(
        skillVotes,
        and(eq(skillVotes.skillId, skills.id), eq(skillVotes.userId, userId))
      )
      .where(and(eq(skills.slug, context.req.param("slug")), eq(skills.status, "active")))
      .limit(1)

    const row = rows[0]

    if (!row) {
      return jsonError(
        context,
        "skill_not_found",
        "That skill does not exist or is no longer public.",
        404
      )
    }

    const response: SkillMeResponse = {
      data: {
        myVote: normalizeVote(row.value),
        myReason: normalizeVoteReason(row.reason),
      },
    }

    return context.json(response)
  } catch {
    return jsonError(
      context,
      "database_unavailable",
      "Your vote state is temporarily unavailable. Please try again shortly.",
      503
    )
  } finally {
    await closeDatabase(database)
  }
})

app.put("/api/skills/:slug/vote", async (context) => {
  context.header("Cache-Control", CACHE_CONTROL.private)
  const userId = await getAuthenticatedUserId(context)

  if (!userId) {
    return jsonError(
      context,
      "unauthorized",
      "A valid Supabase access token is required.",
      401
    )
  }

  const rateLimitResponse = await enforceRateLimit(
    context,
    userId,
    context.env.VOTE_RATE_LIMITER,
    "votes"
  )

  if (rateLimitResponse) {
    return rateLimitResponse
  }

  let payload: unknown

  try {
    payload = await context.req.json()
  } catch {
    return jsonError(
      context,
      "invalid_request",
      "The request body must be valid JSON containing a verdict and optional compatible reason.",
      400
    )
  }

  const parsed = voteRequestSchema.safeParse(payload)

  if (!parsed.success) {
    return jsonError(
      context,
      "invalid_request",
      "The request body must contain a verdict and a compatible reason, or { value: null }.",
      400
    )
  }

  const database = getDatabase(context.env.DATABASE_URL)

  if (!database) {
    return jsonError(
      context,
      "database_unavailable",
      "Voting is temporarily unavailable because the database is not configured.",
      503
    )
  }

  try {
    const request: VoteRequest = parsed.data
    const reason = request.value === null ? null : request.reason
    const rows = await database.db.execute<VoteFunctionRow>(sql`
      select skill_id, my_vote, my_reason, upvotes_count, downvotes_count, comments_count, score
      from public.set_skill_vote(
        ${context.req.param("slug")},
        ${userId}::uuid,
        ${request.value}::smallint,
        ${reason}::text
      )
    `)
    const vote = rows[0]

    if (!vote) {
      return jsonError(
        context,
        "skill_not_found",
        "That skill does not exist or is no longer public.",
        404
      )
    }

    const reasonStats = await getSkillReasonStats(database.db, vote.skill_id)

    const response: VoteResponse = {
      data: {
        skillId: vote.skill_id,
        myVote: normalizeVote(vote.my_vote),
        myReason: normalizeVoteReason(vote.my_reason),
        upvotesCount: vote.upvotes_count,
        downvotesCount: vote.downvotes_count,
        commentsCount: vote.comments_count,
        score: vote.score,
        ...reasonStats,
      },
    }

    return context.json(response)
  } catch {
    return jsonError(
      context,
      "database_unavailable",
      "Voting is temporarily unavailable. Please try again shortly.",
      503
    )
  } finally {
    await closeDatabase(database)
  }
})

function getSupabaseClient(bindings: Bindings) {
  const url = bindings.SUPABASE_URL
  const key = bindings.SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    return null
  }

  const config = `${url}:${key}`

  if (!cachedSupabase || cachedSupabaseConfig !== config) {
    cachedSupabase = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    })
    cachedSupabaseConfig = config
  }

  return cachedSupabase
}

async function getAuthenticatedUserId(context: Context<AppEnv>) {
  const token = context.req.header("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]

  if (!token) {
    return null
  }

  const client = getSupabaseClient(context.env)

  if (!client) {
    return null
  }

  try {
    const { data, error } = await client.auth.getClaims(token)
    const subject = data?.claims?.sub

    if (error || typeof subject !== "string" || subject.length === 0) {
      return null
    }

    return subject
  } catch {
    return null
  }
}

async function enforceRateLimit(
  context: Context<AppEnv>,
  userId: string,
  limiter: RateLimiter | undefined,
  resource: "votes" | "comments" | "reports"
) {
  if (!limiter) {
    return null
  }

  try {
    const outcome = await limiter.limit({ key: userId })

    if (outcome.success) {
      return null
    }

    context.header("Retry-After", String(RATE_LIMIT_RETRY_AFTER_SECONDS))

    return jsonError(
      context,
      "rate_limited",
      `Too many ${resource} in a short period. Please try again in a minute.`,
      429,
      { cacheControl: CACHE_CONTROL.private }
    )
  } catch {
    logOperationalFailure(context, "rate_limit_binding_unavailable", resource)

    // Local Hono requests do not have Wrangler bindings. A binding outage
    // should not turn a valid, authenticated mutation into a false failure.
    return null
  }
}

function normalizeVote(value: number | null | undefined): VoteValue {
  return value === 1 || value === -1 ? value : null
}

function normalizeVoteReason(value: unknown): VoteReason | null {
  if (
    value === "works_reliably" ||
    value === "triggers_well" ||
    value === "lightweight" ||
    value === "does_not_work" ||
    value === "misses_triggers" ||
    value === "triggers_too_often" ||
    value === "too_heavy"
  ) {
    return value
  }

  return null
}

type Database = ReturnType<typeof createDatabase>["db"]

type ReasonCountRow = {
  skillId: string
  reason: string | null
  value: number
  count: number
}

function getReasonCountRows(database: Database, skillIds: string[]) {
  if (skillIds.length === 0) {
    return Promise.resolve([] as ReasonCountRow[])
  }

  const reasonCount = sql<number>`count(*)::integer`.as("reason_count")

  return database
    .select({
      skillId: skillVotes.skillId,
      reason: skillVotes.reason,
      value: skillVotes.value,
      count: reasonCount,
    })
    .from(skillVotes)
    .where(and(inArray(skillVotes.skillId, skillIds), isNotNull(skillVotes.reason)))
    .groupBy(skillVotes.skillId, skillVotes.reason, skillVotes.value)
    .having(sql`count(*) >= 3`)
    .orderBy(asc(skillVotes.skillId), desc(reasonCount), asc(skillVotes.reason))
}

async function getSkillReasonStats(database: Database, skillId: string) {
  const [reasonRows, completionRows] = await Promise.all([
    getReasonCountRows(database, [skillId]),
    database
      .select({
        reasonedVotesCount: sql<number>`count(*) filter (where ${skillVotes.reason} is not null)::integer`,
        unreasonedVotesCount: sql<number>`count(*) filter (where ${skillVotes.reason} is null)::integer`,
      })
      .from(skillVotes)
      .where(eq(skillVotes.skillId, skillId)),
  ])

  return {
    reasonCounts: reasonRows
      .map(toVoteReasonCount)
      .filter((reason): reason is VoteReasonCount => reason !== null)
      .slice(0, 2),
    reasonedVotesCount: Number(completionRows[0]?.reasonedVotesCount ?? 0),
    unreasonedVotesCount: Number(completionRows[0]?.unreasonedVotesCount ?? 0),
  }
}

async function getTopReasonsForSkills(database: Database, skillIds: string[]) {
  const rows = await getReasonCountRows(database, skillIds)
  const topReasons = new Map<string, VoteReasonCount>()

  for (const row of rows) {
    const reason = toVoteReasonCount(row)

    if (reason && !topReasons.has(row.skillId)) {
      topReasons.set(row.skillId, reason)
    }
  }

  return topReasons
}

function toVoteReasonCount(row: ReasonCountRow): VoteReasonCount | null {
  const reason = normalizeVoteReason(row.reason)

  if ((row.value !== 1 && row.value !== -1) || !reason) {
    return null
  }

  return {
    reason,
    value: row.value,
    count: Number(row.count),
  }
}

function getDatabase(databaseUrl: string | undefined) {
  if (!databaseUrl) {
    return null
  }

  try {
    // Keep Postgres.js connections request-scoped in Workers. Reusing a client
    // across requests can carry request-bound socket promises into the next request.
    return createDatabase(databaseUrl)
  } catch {
    return null
  }
}

async function closeDatabase(database: ReturnType<typeof createDatabase>) {
  try {
    await database.client.end({ timeout: 2 })
  } catch {
    // The request has already completed; a failed cleanup must not mask it.
  }
}

function parseCommentQuery(
  query: Record<string, string | undefined>
): { ok: true; value: { limit: number; cursor: CommentCursor | null } } | { ok: false; message: string } {
  const limit = parsePositiveInteger(query.limit, DEFAULT_COMMENT_LIMIT)

  if (limit === null) {
    return { ok: false, message: "limit must be a positive integer." }
  }

  if (limit > MAX_COMMENT_LIMIT) {
    return {
      ok: false,
      message: `limit cannot be greater than ${MAX_COMMENT_LIMIT}.`,
    }
  }

  if (!query.cursor) {
    return { ok: true, value: { limit, cursor: null } }
  }

  const cursor = decodeCommentCursor(query.cursor)

  if (!cursor) {
    return { ok: false, message: "cursor must be a valid comment cursor." }
  }

  return { ok: true, value: { limit, cursor } }
}

function encodeCommentCursor(cursor: CommentCursor) {
  return btoa(JSON.stringify(cursor))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "")
}

function decodeCommentCursor(value: string): CommentCursor | null {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
    const padding = "=".repeat((4 - (normalized.length % 4)) % 4)
    const parsed = JSON.parse(atob(normalized + padding)) as {
      createdAt?: unknown
      id?: unknown
    }

    if (
      typeof parsed.createdAt !== "string" ||
      !Number.isFinite(Date.parse(parsed.createdAt)) ||
      typeof parsed.id !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(parsed.id)
    ) {
      return null
    }

    return { createdAt: parsed.createdAt, id: parsed.id }
  } catch {
    return null
  }
}

function toCommentItem(row: CommentListRow): CommentItem {
  return {
    id: row.id,
    skillId: row.skillId,
    body: row.body,
    createdAt: toIsoTimestamp(row.createdAt),
    author: {
      id: row.authorId,
      username: row.authorUsername,
      displayName: row.authorDisplayName,
      avatarUrl: row.authorAvatarUrl,
    },
  }
}

function toIsoTimestamp(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function isCommentValidationError(error: unknown) {
  const message = getDatabaseErrorMessage(error)

  return [
    "comment_profile_missing",
    "comment_id_conflict",
    "comment_body_invalid",
  ].includes(message)
}

function getCommentValidationMessage(error: unknown) {
  switch (getDatabaseErrorMessage(error)) {
    case "comment_profile_missing":
      return "Your profile is not ready yet. Sign in again before posting a comment."
    case "comment_id_conflict":
      return "That comment id is already associated with different data."
    default:
      return "Comment body must be between 2 and 2,000 characters after trimming."
  }
}

function getDatabaseErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = error.message
    return typeof message === "string" ? message : ""
  }

  return ""
}

function parseSkillListQuery(
  query: Record<string, string | undefined>
): { ok: true; value: SkillListQuery } | { ok: false; message: string } {
  const sort = query.sort ?? "popular"

  if (!isSkillSort(sort)) {
    return {
      ok: false,
      message: "sort must be one of popular, score, newest, or trending.",
    }
  }

  const page = parsePositiveInteger(query.page, 1)
  const limit = parsePositiveInteger(query.limit, DEFAULT_LIMIT)

  if (page === null || limit === null) {
    return {
      ok: false,
      message: "page and limit must be positive integers.",
    }
  }

  if (limit > MAX_LIMIT) {
    return {
      ok: false,
      message: `limit cannot be greater than ${MAX_LIMIT}.`,
    }
  }

  return {
    ok: true,
    value: {
      q: query.q?.trim() || undefined,
      sort,
      tags: parseFilterValues(query.tags),
      agents: parseFilterValues(query.agents),
      page,
      limit,
    },
  }
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  if (value === undefined || value === "") {
    return fallback
  }

  if (!/^\d+$/.test(value)) {
    return null
  }

  const parsed = Number(value)
  return parsed > 0 ? parsed : null
}

function parseFilterValues(value: string | undefined) {
  return (
    value
      ?.split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean) ?? []
  )
}

function isSkillSort(value: string): value is SkillSort {
  return (
    value === "popular" ||
    value === "score" ||
    value === "newest" ||
    value === "trending"
  )
}

function buildSkillWhere(query: SkillListQuery) {
  const conditions = [eq(skills.status, "active")]

  if (query.q) {
    const pattern = `%${escapeLikePattern(query.q)}%`
    const searchCondition = or(
      ilike(skills.name, pattern),
      ilike(skills.description, pattern),
      sql`${skills.tags}::text ILIKE ${pattern}`,
      sql`${skills.supportedAgents}::text ILIKE ${pattern}`
    )

    if (searchCondition) {
      conditions.push(searchCondition)
    }
  }

  if (query.tags.length > 0) {
    conditions.push(
      sql`${skills.tags} && ARRAY[${sql.join(
        query.tags.map((tag) => sql`${tag}`),
        sql`, `
      )}]::text[]`
    )
  }

  if (query.agents.length > 0) {
    conditions.push(
      sql`${skills.supportedAgents} && ARRAY[${sql.join(
        query.agents.map((agent) => sql`${agent}`),
        sql`, `
      )}]::text[]`
    )
  }

  return and(...conditions)
}

function getSkillListRows(
  database: ReturnType<typeof createDatabase>["db"],
  query: SkillListQuery,
  where: ReturnType<typeof buildSkillWhere>
) {
  if (query.sort === "trending") {
    const trendTotals = getTrendTotals(database)

    return database
      .select({
        id: skills.id,
        slug: skills.slug,
        name: skills.name,
        description: skills.description,
        tags: skills.tags,
        supportedAgents: skills.supportedAgents,
        upvotesCount: skills.upvotesCount,
        downvotesCount: skills.downvotesCount,
        commentsCount: skills.commentsCount,
        score: skills.score,
        trendDelta: trendTotals.trendDelta,
      })
      .from(skills)
      .innerJoin(trendTotals, eq(skills.id, trendTotals.skillId))
      .where(and(where, sql`${trendTotals.trendDelta} > 0`))
      .orderBy(
        desc(trendTotals.trendDelta),
        desc(skills.upvotesCount),
        desc(skills.commentsCount),
        asc(skills.name)
      )
      .limit(query.limit)
      .offset((query.page - 1) * query.limit)
  }

  const orderBy =
    query.sort === "score"
      ? desc(skills.score)
      : query.sort === "newest"
        ? desc(skills.createdAt)
        : [desc(skills.upvotesCount), desc(skills.commentsCount), asc(skills.name)]

  const orderByClauses = Array.isArray(orderBy) ? orderBy : [orderBy]

  return database
    .select({
      id: skills.id,
      slug: skills.slug,
      name: skills.name,
      description: skills.description,
      tags: skills.tags,
      supportedAgents: skills.supportedAgents,
      upvotesCount: skills.upvotesCount,
      downvotesCount: skills.downvotesCount,
      commentsCount: skills.commentsCount,
      score: skills.score,
      trendDelta: sql<number | null>`null`.as("trend_delta"),
    })
    .from(skills)
    .where(where)
    .orderBy(...orderByClauses)
    .limit(query.limit)
    .offset((query.page - 1) * query.limit)
}

function getSkillListTotal(
  database: ReturnType<typeof createDatabase>["db"],
  query: SkillListQuery,
  where: ReturnType<typeof buildSkillWhere>
) {
  if (query.sort !== "trending") {
    return database.select({ total: count() }).from(skills).where(where)
  }

  const trendTotals = getTrendTotals(database)

  return database
    .select({ total: count() })
    .from(skills)
    .innerJoin(trendTotals, eq(skills.id, trendTotals.skillId))
    .where(and(where, sql`${trendTotals.trendDelta} > 0`))
}

function getTrendTotals(database: ReturnType<typeof createDatabase>["db"]) {
  return database
    .select({
      skillId: skillVoteEvents.skillId,
      trendDelta: sql<number>`coalesce(sum(${skillVoteEvents.netVoteDelta}), 0)::integer`.as(
        "trend_delta"
      ),
    })
    .from(skillVoteEvents)
    .where(sql`${skillVoteEvents.createdAt} >= now() - interval '7 days'`)
    .groupBy(skillVoteEvents.skillId)
    .as("skill_trend_totals")
}

function escapeLikePattern(value: string) {
  return value.replace(/[\\%_]/g, "\\$&")
}

function jsonError(
  context: Context<AppEnv>,
  code: ApiErrorCode,
  message: string,
  status: ErrorStatus,
  options: { cacheControl?: string; log?: boolean } = {}
) {
  context.header("Cache-Control", options.cacheControl ?? CACHE_CONTROL.noStore)

  if (options.log !== false) {
    logApiFailure(context, code, status)
  }

  return context.json({ error: { code, message } }, status)
}

function logApiFailure(
  context: Context<AppEnv>,
  code: ApiErrorCode,
  status: ErrorStatus
) {
  console.warn(
    JSON.stringify({
      event: "api_failure",
      requestId: context.get("requestId") ?? "unknown",
      method: context.req.method,
      path: context.req.path,
      status,
      code,
    })
  )
}

function logOperationalFailure(
  context: Context<AppEnv>,
  event: "rate_limit_binding_unavailable",
  resource: "votes" | "comments" | "reports"
) {
  console.error(
    JSON.stringify({
      event,
      requestId: context.get("requestId") ?? "unknown",
      method: context.req.method,
      path: context.req.path,
      resource,
    })
  )
}

export default app
