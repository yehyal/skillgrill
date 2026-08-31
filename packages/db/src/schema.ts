import { relations, sql } from "drizzle-orm"
import {
  AnyPgColumn,
  check,
  index,
  integer,
  pgSchema,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"

const authSchema = pgSchema("auth")
const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
})

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    username: text("username").notNull(),
    displayName: text("display_name"),
    avatarUrl: text("avatar_url"),
    githubUsername: text("github_username"),
    githubId: text("github_id"),
    role: text("role").notNull().default("user"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    githubIdUnique: uniqueIndex("profiles_github_id_unique").on(table.githubId),
    roleCheck: check(
      "profiles_role_check",
      sql`${table.role} in ('user', 'moderator', 'admin')`
    ),
  })
)

export const skills = pgTable(
  "skills",
  {
    id: text("id").primaryKey(),
    source: text("source").notNull(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    sourceUrl: text("source_url"),
    installCommand: text("install_command"),
    docsUrl: text("docs_url"),
    tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
    supportedAgents: text("supported_agents")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    upvotesCount: integer("upvotes_count").notNull().default(0),
    downvotesCount: integer("downvotes_count").notNull().default(0),
    commentsCount: integer("comments_count").notNull().default(0),
    score: integer("score").generatedAlwaysAs(
      sql`"upvotes_count" - "downvotes_count"`
    ),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    slugUnique: uniqueIndex("skills_slug_unique").on(table.slug),
    sourceSlugUnique: unique("skills_source_slug_unique").on(
      table.source,
      table.slug
    ),
    statusCreatedAtIndex: index("skills_status_created_at_idx").on(
      table.status,
      table.createdAt
    ),
    statusScoreIndex: index("skills_status_score_idx").on(
      table.status,
      table.score
    ),
    tagsIndex: index("skills_tags_gin_idx").using("gin", table.tags),
    supportedAgentsIndex: index("skills_supported_agents_gin_idx").using(
      "gin",
      table.supportedAgents
    ),
    idFormatCheck: check(
      "skills_id_format_check",
      sql`${table.id} = ${table.source} || '/' || ${table.slug}`
    ),
    statusCheck: check(
      "skills_status_check",
      sql`${table.status} in ('active', 'hidden', 'archived')`
    ),
    voteCountCheck: check(
      "skills_vote_count_check",
      sql`${table.upvotesCount} >= 0 and ${table.downvotesCount} >= 0 and ${table.commentsCount} >= 0`
    ),
  })
)

export const skillVotes = pgTable(
  "skill_votes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    skillId: text("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    value: smallint("value").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    skillUserUnique: unique("skill_votes_skill_user_unique").on(
      table.skillId,
      table.userId
    ),
    skillIndex: index("skill_votes_skill_idx").on(table.skillId),
    userIndex: index("skill_votes_user_idx").on(table.userId),
    valueCheck: check("skill_votes_value_check", sql`${table.value} in (-1, 1)`),
  })
)

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    skillId: text("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id").references((): AnyPgColumn => comments.id, {
      onDelete: "cascade",
    }),
    body: text("body").notNull(),
    status: text("status").notNull().default("visible"),
    reportsCount: integer("reports_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "date" }),
  },
  (table) => ({
    skillCreatedAtIndex: index("comments_skill_created_at_idx").on(
      table.skillId,
      table.createdAt
    ),
    userIndex: index("comments_user_idx").on(table.userId),
    statusCheck: check(
      "comments_status_check",
      sql`${table.status} in ('visible', 'hidden', 'deleted', 'pending')`
    ),
    bodyLengthCheck: check(
      "comments_body_length_check",
      sql`char_length(${table.body}) between 2 and 2000`
    ),
    reportsCountCheck: check(
      "comments_reports_count_check",
      sql`${table.reportsCount} >= 0`
    ),
  })
)

export const commentReports = pgTable(
  "comment_reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    commentId: uuid("comment_id")
      .notNull()
      .references(() => comments.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    commentUserUnique: unique("comment_reports_comment_user_unique").on(
      table.commentId,
      table.userId
    ),
    commentIndex: index("comment_reports_comment_idx").on(table.commentId),
    reasonCheck: check(
      "comment_reports_reason_check",
      sql`${table.reason} in ('spam', 'abuse', 'unsafe', 'off_topic', 'other')`
    ),
  })
)

export const profilesRelations = relations(profiles, ({ many }) => ({
  skillVotes: many(skillVotes),
  comments: many(comments),
  commentReports: many(commentReports),
}))

export const skillsRelations = relations(skills, ({ many }) => ({
  votes: many(skillVotes),
  comments: many(comments),
}))

export const skillVotesRelations = relations(skillVotes, ({ one }) => ({
  skill: one(skills, {
    fields: [skillVotes.skillId],
    references: [skills.id],
  }),
  profile: one(profiles, {
    fields: [skillVotes.userId],
    references: [profiles.id],
  }),
}))

export const commentsRelations = relations(comments, ({ one, many }) => ({
  skill: one(skills, {
    fields: [comments.skillId],
    references: [skills.id],
  }),
  profile: one(profiles, {
    fields: [comments.userId],
    references: [profiles.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: "commentReplies",
  }),
  replies: many(comments, { relationName: "commentReplies" }),
  reports: many(commentReports),
}))

export const commentReportsRelations = relations(commentReports, ({ one }) => ({
  comment: one(comments, {
    fields: [commentReports.commentId],
    references: [comments.id],
  }),
  profile: one(profiles, {
    fields: [commentReports.userId],
    references: [profiles.id],
  }),
}))

export type Profile = typeof profiles.$inferSelect
export type NewProfile = typeof profiles.$inferInsert
export type Skill = typeof skills.$inferSelect
export type NewSkill = typeof skills.$inferInsert
export type SkillVote = typeof skillVotes.$inferSelect
export type Comment = typeof comments.$inferSelect
export type CommentReport = typeof commentReports.$inferSelect
