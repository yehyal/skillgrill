import { createDatabase, skillVotes, skills } from "@skill-grill/db"
import type {
  ApiErrorCode,
  HealthResponse,
  SkillDetailResponse,
  SkillListQuery,
  SkillListResponse,
  SkillMeResponse,
  SkillStatsResponse,
  SkillSort,
  VoteRequest,
  VoteResponse,
  VoteValue,
} from "@skill-grill/shared"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm"
import { Hono, type Context } from "hono"
import { cors } from "hono/cors"
import { z } from "zod"

type Bindings = {
  DATABASE_URL?: string
  SUPABASE_PUBLISHABLE_KEY?: string
  SUPABASE_URL?: string
  WEB_ORIGIN?: string
}

type AppEnv = {
  Bindings: Bindings
}

type ErrorStatus = 400 | 401 | 404 | 500 | 503

const DEFAULT_LIMIT = 12
const MAX_LIMIT = 50
const voteRequestSchema = z
  .object({
    value: z.union([z.literal(1), z.literal(-1), z.null()]),
  })
  .strict()

let cachedSupabase: SupabaseClient | null = null
let cachedSupabaseConfig: string | null = null

type VoteFunctionRow = {
  skill_id: string
  my_vote: number | null
  upvotes_count: number
  downvotes_count: number
  comments_count: number
  score: number
}

export const app = new Hono<AppEnv>()

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
    allowMethods: ["GET", "PUT", "OPTIONS"],
    maxAge: 600,
  })
)

app.get("/health", (context) => {
  const response: HealthResponse = { ok: true }

  return context.json(response)
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
      database.db.select({ total: count() }).from(skills).where(where),
      getSkillListRows(database.db, parsedQuery.value, where),
    ])
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
      })),
      pagination: {
        page: parsedQuery.value.page,
        limit: parsedQuery.value.limit,
        total,
        totalPages,
      },
    }

    context.header(
      "Cache-Control",
      "public, max-age=60, s-maxage=300, stale-while-revalidate=600"
    )
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

    const response: SkillDetailResponse = {
      data: {
        ...skill,
        score: skill.score ?? skill.upvotesCount - skill.downvotesCount,
        createdAt: skill.createdAt.toISOString(),
        updatedAt: skill.updatedAt.toISOString(),
      },
    }

    context.header(
      "Cache-Control",
      "public, max-age=300, s-maxage=1800, stale-while-revalidate=3600"
    )
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

    const response: SkillStatsResponse = {
      data: {
        ...skill,
        score: skill.score ?? skill.upvotesCount - skill.downvotesCount,
      },
    }

    context.header(
      "Cache-Control",
      "public, max-age=10, s-maxage=60, stale-while-revalidate=60"
    )
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

app.get("/api/skills/:slug/me", async (context) => {
  context.header("Cache-Control", "private, no-store")
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
      data: { myVote: normalizeVote(row.value) },
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
  context.header("Cache-Control", "private, no-store")
  const userId = await getAuthenticatedUserId(context)

  if (!userId) {
    return jsonError(
      context,
      "unauthorized",
      "A valid Supabase access token is required.",
      401
    )
  }

  let payload: unknown

  try {
    payload = await context.req.json()
  } catch {
    return jsonError(
      context,
      "invalid_request",
      "The request body must be valid JSON matching { value: 1 | -1 | null }.",
      400
    )
  }

  const parsed = voteRequestSchema.safeParse(payload)

  if (!parsed.success) {
    return jsonError(
      context,
      "invalid_request",
      "The request body must be exactly { value: 1 | -1 | null }.",
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
    const rows = await database.db.execute<VoteFunctionRow>(sql`
      select skill_id, my_vote, upvotes_count, downvotes_count, comments_count, score
      from public.set_skill_vote(
        ${context.req.param("slug")},
        ${userId}::uuid,
        ${request.value}::smallint
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

    const response: VoteResponse = {
      data: {
        skillId: vote.skill_id,
        myVote: normalizeVote(vote.my_vote),
        upvotesCount: vote.upvotes_count,
        downvotesCount: vote.downvotes_count,
        commentsCount: vote.comments_count,
        score: vote.score,
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

function normalizeVote(value: number | null | undefined): VoteValue {
  return value === 1 || value === -1 ? value : null
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

function parseSkillListQuery(
  query: Record<string, string | undefined>
): { ok: true; value: SkillListQuery } | { ok: false; message: string } {
  const sort = query.sort ?? "popular"

  if (!isSkillSort(sort)) {
    return {
      ok: false,
      message: "sort must be one of popular, score, or newest.",
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
  return value === "popular" || value === "score" || value === "newest"
}

function buildSkillWhere(query: SkillListQuery) {
  const conditions = [eq(skills.status, "active")]

  if (query.q) {
    const pattern = `%${escapeLikePattern(query.q)}%`
    const searchCondition = or(
      ilike(skills.name, pattern),
      ilike(skills.description, pattern),
      sql`${skills.tags}::text ILIKE ${pattern}`
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
  const orderBy =
    query.sort === "score"
      ? desc(skills.score)
      : query.sort === "newest"
        ? desc(skills.createdAt)
        : [desc(skills.upvotesCount), desc(skills.commentsCount), desc(skills.score)]

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
    })
    .from(skills)
    .where(where)
    .orderBy(...orderByClauses)
    .limit(query.limit)
    .offset((query.page - 1) * query.limit)
}

function escapeLikePattern(value: string) {
  return value.replace(/[\\%_]/g, "\\$&")
}

function jsonError(
  context: Context<AppEnv>,
  code: ApiErrorCode,
  message: string,
  status: ErrorStatus
) {
  return context.json({ error: { code, message } }, status)
}

export default app
