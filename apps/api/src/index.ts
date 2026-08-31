import { createDatabase, skills } from "@skill-grill/db"
import type {
  ApiErrorCode,
  HealthResponse,
  SkillDetailResponse,
  SkillListQuery,
  SkillListResponse,
  SkillSort,
} from "@skill-grill/shared"
import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm"
import { Hono, type Context } from "hono"
import { cors } from "hono/cors"

type Bindings = {
  DATABASE_URL?: string
  WEB_ORIGIN?: string
}

type AppEnv = {
  Bindings: Bindings
}

type ErrorStatus = 400 | 404 | 500 | 503

const DEFAULT_LIMIT = 12
const MAX_LIMIT = 50

let cachedDatabase: ReturnType<typeof createDatabase> | null = null
let cachedDatabaseUrl: string | null = null

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
    allowMethods: ["GET", "OPTIONS"],
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
  }
})

function getDatabase(databaseUrl: string | undefined) {
  if (!databaseUrl) {
    return null
  }

  try {
    if (!cachedDatabase || cachedDatabaseUrl !== databaseUrl) {
      cachedDatabase = createDatabase(databaseUrl)
      cachedDatabaseUrl = databaseUrl
    }

    return cachedDatabase
  } catch {
    return null
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
