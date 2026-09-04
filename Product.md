# Skill Grill — Product & MVP Specification

## 1. Product Summary

**Skill Grill** is a community review and discovery site for AI agent skills.

The MVP focuses on a small, polished, locally seeded directory where users can browse popular skills, inspect skill detail pages, vote useful/not useful, leave top-level comments, and report problematic comments.

The first version deliberately avoids live syncing from `skills.sh` or the Vercel Skills API. Instead, it uses a local seed set of placeholder/popular skills for development and product validation.

### One-line positioning

> Find AI agent skills that actually work.

### Longer positioning

> Skill Grill is a community trust layer for AI agent skills, helping developers discover useful skills through votes, comments, and practical usage feedback.

---

## 2. MVP Scope

### Selected MVP features

The MVP includes:

- Public home page
- Public skill listing
- Public skill detail page
- 20 locally seeded placeholder skills for development
- GitHub-only authentication through Supabase Auth
- Simple upvote/downvote per skill
- One vote per user per skill
- Top-level comments only
- Comment reporting
- Basic moderation-ready data model
- Public cached reads
- Private uncached user-specific state
- Cloudflare Workers + Hono backend API
- Supabase Postgres database
- Supabase Auth for GitHub OAuth
- Next.js + TypeScript + React frontend
- shadcn/ui component system

### Explicit non-goals for MVP

The MVP does **not** include:

- Direct live search against `skills.sh`
- Direct Vercel Skills API integration
- Automated skill syncing
- Automated skill audits
- Comment replies in the UI
- Comment voting
- Star ratings
- Maintainer claim flow
- Admin dashboard
- Skill benchmarking
- Realtime comments
- Email login
- Public user profile pages
- Collections
- Full-text search infrastructure beyond basic database search/filtering
- Paid features

---

## 3. Target Users

### Primary users

Developers and AI tool users who install or experiment with agent skills.

Examples:

- Codex users
- Claude Code users
- Cursor users
- OpenAI Skills users
- Agent framework users
- Solo builders looking for reusable automation skills

### User needs

Users want to know:

- What does this skill do?
- Is this skill useful?
- Has anyone tried it?
- Does it look maintained or trustworthy?
- Are there obvious issues?
- What did other users experience?

---

## 4. Core Product Principles

### 1. Public browsing first

Users should be able to browse and read without an account.

Guests can:

- View home page
- View skills
- View votes
- View comments
- View install/source links

### 2. Login only for contribution

GitHub login is required for:

- Upvoting
- Downvoting
- Commenting
- Reporting comments

### 3. Keep community data separate from upstream metadata

Skill metadata and community data should be stored separately.

Upstream/local skill metadata:

- Name
- Slug
- Description
- Source URL
- Install command
- Tags
- Agent compatibility labels

Community data:

- Votes
- Comments
- Reports
- Moderation status

### 4. Cache public reads, never cache private state

Public endpoints should be cacheable.

Private endpoints such as `/me`, vote mutation, comment creation, and reporting should never be cached.

---

## 5. Recommended Tech Stack

## Frontend

Use:

- **Next.js**
- **TypeScript**
- **React**
- **Tailwind CSS**
- **shadcn/ui**

Reasoning:

Next.js is the better fit for this MVP because the product is semi-dynamic and user-interactive. Astro is excellent for mostly static content sites, but Skill Grill needs logged-in state, optimistic voting, comments, reporting, and eventually admin/moderation flows.

The frontend should avoid heavy reliance on Node-only server features if deployed on Cloudflare. The backend API should live separately in Cloudflare Workers.

### Frontend deployment

Recommended:

- **Cloudflare Pages**

The frontend should call the Worker API through an environment variable such as:

```env
NEXT_PUBLIC_API_URL=https://api.ratemyskills.com
```

## Backend API

Use:

- **Cloudflare Workers**
- **Hono**
- **TypeScript**
- **Zod** or **Valibot** for request validation

Recommended API domain:

```txt
api.ratemyskills.com
```

## Database/Auth

Use:

- **Supabase Postgres**
- **Supabase Auth**
- **GitHub OAuth only for MVP**

## ORM / Database access

Recommended options:

### Option A — Supabase REST/RPC from Worker

Best for MVP simplicity.

Worker calls:

- Supabase REST API for reads/writes
- Supabase RPC functions for transactional actions like voting

### Option B — Drizzle ORM later

Use Drizzle later if the schema becomes more complex or if a server/runtime approach changes.

For MVP, Supabase REST/RPC is sufficient.

---

## 6. High-Level Architecture

```txt
Browser
  ↓
Cloudflare Pages
  Next.js frontend
  ↓
Cloudflare Worker API
  Hono routes
  request validation
  auth checks
  cache headers
  ↓
Supabase
  Postgres
  Auth
  GitHub OAuth
```

### MVP data source

```txt
Local seed file / SQL seed
  ↓
Supabase skills table
  ↓
Worker API
  ↓
Frontend
```

No runtime dependency on `skills.sh` or Vercel API in the MVP.

---

## 7. Core Pages

## 7.1 Home Page

Route:

```txt
/
```

Purpose:

Introduce the product and surface initial seeded skills.

Sections:

- Hero section
- Search/filter input
- Popular skills grid
- Recently added skills
- Short explanation of voting/community feedback

Suggested hero copy:

```txt
Find AI agent skills that actually work.
Community votes, comments, and practical feedback for agent skills.
```

Primary CTA:

```txt
Browse Skills
```

Secondary CTA:

```txt
Sign in with GitHub
```

---

## 7.2 Skills Listing Page

Route:

```txt
/skills
```

Features:

- List/grid of seeded skills
- Search by name/description/tag
- Sort by:
  - Popular
  - Highest score
  - Newest
- Filter by tag/agent later

Skill card fields:

- Skill name
- Short description
- Tags
- Score
- Upvote/downvote counts
- Comments count
- Source/install link if available

---

## 7.3 Skill Detail Page

Route:

```txt
/skills/[slug]
```

Features:

- Skill name
- Description
- Tags
- Source link
- Install command
- Community score
- Upvote/downvote controls
- Comments
- Add comment form for logged-in users
- Login prompt for guests
- Report comment action

Sections:

1. Header
2. Skill metadata
3. Install/source block
4. Community voting block
5. Comments block

---

## 7.4 Auth Callback Page

Route:

```txt
/auth/callback
```

Purpose:

Handle Supabase GitHub OAuth callback and redirect user back to the previous page.

---

## 8. Frontend Components

Recommended component structure:

```txt
components/
  layout/
    AppHeader.tsx
    AppFooter.tsx
    PageContainer.tsx

  skills/
    SkillCard.tsx
    SkillGrid.tsx
    SkillHeader.tsx
    SkillMeta.tsx
    SkillInstallBlock.tsx
    SkillVoteBox.tsx

  comments/
    CommentList.tsx
    CommentItem.tsx
    CommentForm.tsx
    ReportCommentDialog.tsx

  auth/
    SignInButton.tsx
    LoginRequiredDialog.tsx

  ui/
    shadcn components
```

### shadcn/ui components to use

Recommended initial components:

- Button
- Card
- Badge
- Input
- Textarea
- Dialog
- Dropdown Menu
- Avatar
- Separator
- Skeleton
- Tooltip
- Toast/Sonner

---

## 9. Data Model

## 9.1 `profiles`

Stores public user profile data copied from Supabase Auth/GitHub.

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,

  username text not null,
  display_name text,
  avatar_url text,
  github_username text,
  github_id text unique,

  role text not null default 'user'
    check (role in ('user', 'moderator', 'admin')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Notes:

- Do not expose email publicly.
- `role` allows future moderation/admin functionality.

---

## 9.2 `skills`

Stores local seed skill metadata.

```sql
create table skills (
  id text primary key,

  source text not null,
  slug text not null,
  name text not null,
  description text not null,

  source_url text,
  install_command text,
  docs_url text,

  tags text[] not null default '{}',
  supported_agents text[] not null default '{}',

  upvotes_count integer not null default 0,
  downvotes_count integer not null default 0,
  comments_count integer not null default 0,

  score integer generated always as (upvotes_count - downvotes_count) stored,

  status text not null default 'active'
    check (status in ('active', 'hidden', 'archived')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (source, slug),

  constraint skills_id_format_check
    check (id = source || '/' || slug)
);
```

Notes:

- `tags` can include values like `pdf`, `frontend`, `testing`, `research`, `docs`.
- `supported_agents` can include values like `codex`, `claude-code`, `cursor`, `generic`.

---

## 9.3 `skill_votes`

Stores one up/down vote per user per skill.

```sql
create table skill_votes (
  id uuid primary key default gen_random_uuid(),

  skill_id text not null references skills(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  value smallint not null check (value in (-1, 1)),
  reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (skill_id, user_id)
);
```

Vote behavior:

- `1` means upvote/useful.
- `-1` means downvote/not useful.
- `reason` is nullable and must match the vote polarity.
- Removing a vote deletes the row.

---

## 9.4 `comments`

Stores top-level comments now, with a future-ready `parent_id`.

```sql
create table comments (
  id uuid primary key default gen_random_uuid(),

  skill_id text not null references skills(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  parent_id uuid references comments(id) on delete cascade,

  body text not null,

  status text not null default 'visible'
    check (status in ('visible', 'hidden', 'deleted', 'pending')),

  reports_count integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
```

MVP rule:

- `parent_id` must always be `null` in the UI/API for now.
- The column exists to support one-level replies later.

Comment body limits:

- Minimum: 2 characters
- Maximum: 2,000 characters

Rendering:

- MVP can use plain text with escaped line breaks.
- If markdown is added later, raw HTML must be disabled and output sanitized.

---

## 9.5 `comment_reports`

Stores reports for comments.

```sql
create table comment_reports (
  id uuid primary key default gen_random_uuid(),

  comment_id uuid not null references comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  reason text not null check (
    reason in ('spam', 'abuse', 'unsafe', 'off_topic', 'other')
  ),
  note text,

  created_at timestamptz not null default now(),

  unique (comment_id, user_id)
);
```

Report behavior:

- One report per user per comment.
- Reporting increments `comments.reports_count`.
- No automatic hiding in MVP unless desired later.
- Admin review can be added later.

---

## 9.6 `sync_runs`

Optional for MVP, useful later.

```sql
create table sync_runs (
  id uuid primary key default gen_random_uuid(),

  sync_type text not null,
  status text not null check (status in ('running', 'success', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  stats_json jsonb,
  error text
);
```

This can be ignored until external syncing exists.

---

## 10. Voting Behavior

## 10.1 API behavior

Endpoint:

```txt
PUT /api/skills/:skillId/vote
```

Request body:

```json
{
  "value": 1
}
```

Valid values:

```txt
1     upvote
-1    downvote
null  remove vote
```

Response:

```json
{
  "skillId": "uuid",
  "myVote": 1,
  "upvotesCount": 12,
  "downvotesCount": 2,
  "score": 10
}
```

## 10.2 Vote state transitions

```txt
No vote → Upvote
  upvotes +1

No vote → Downvote
  downvotes +1

Upvote → Remove
  upvotes -1

Downvote → Remove
  downvotes -1

Upvote → Downvote
  upvotes -1
  downvotes +1

Downvote → Upvote
  downvotes -1
  upvotes +1
```

## 10.3 Responsiveness

Frontend should use optimistic updates.

Flow:

```txt
User clicks vote
  ↓
UI updates immediately
  ↓
Vote buttons enter pending state
  ↓
API request completes
  ↓
UI reconciles with server response
  ↓
On failure, rollback optimistic state and show toast
```

Recommended frontend state:

```ts
type VoteState = {
  myVote: 1 | -1 | null;
  upvotesCount: number;
  downvotesCount: number;
  score: number;
  isVoting: boolean;
};
```

## 10.4 Transactional vote handling

Recommended implementation:

- Use a Supabase RPC/Postgres function to set the user vote.
- The function should read the old vote, write the new vote, update counters, and return final counts in one transaction.

This avoids race conditions and counter drift.

## 10.5 Optional verdict reasons

Each vote may include one optional reason. General Well done and Undercooked
verdicts remain one-click actions; reasons are a lightweight follow-up and can
be changed or cleared later.

```ts
type WellDoneReason = "works_reliably" | "triggers_well" | "lightweight"
type UndercookedReason =
  | "does_not_work"
  | "misses_triggers"
  | "triggers_too_often"
  | "too_heavy"
type VoteReason = WellDoneReason | UndercookedReason
```

The labels are Delivered reliably, Triggered when needed, Kept context light,
Did not deliver, Missed when needed, Triggered too often, and Used too much
context. A reason must match its vote polarity. Existing votes remain valid
with no reason, and removing a vote removes its reason.

Reason-only changes update the current vote row without changing skill vote
counters, skill timestamps, or seven-day movement events. A vote-value change
continues to update counters and `skill_vote_events` in the same transaction.

For detail and stats responses, reason counts use current rows in
`skill_votes`, exclude unreasoned votes, and become public only at three votes.
The response returns up to two eligible reasons sorted by count descending and
reason key ascending, plus explicit `reasonedVotesCount` and
`unreasonedVotesCount` completion metrics. List responses return only the first
eligible `topReason`, aggregated in one query for the current page.

The vote request is a strict union:

```ts
type VoteRequest =
  | { value: 1; reason: WellDoneReason | null }
  | { value: -1; reason: UndercookedReason | null }
  | { value: null }
```

`GET /api/skills/:slug/me` returns `myVote` and `myReason`. Detail, stats, and
vote responses return reason aggregates and completion metrics. Private
endpoints remain uncached.

Development keeps two manually selectable presentations: vote-first reveals a
matching inline reason picker after a new verdict, while always-visible shows
both compact reason groups beneath the verdict buttons. Production defaults to
vote-first. The selector is temporary development configuration and must be
removed after a final direction is chosen; it is not an experiment or
analytics system.

---

## 11. Comments Behavior

## 11.1 Fetch comments

Endpoint:

```txt
GET /api/skills/:skillId/comments?limit=20&cursor=...
```

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "skillId": "uuid",
      "parentId": null,
      "body": "Worked well for me in a Codex workflow.",
      "status": "visible",
      "reportsCount": 0,
      "createdAt": "2026-08-31T00:00:00Z",
      "updatedAt": "2026-08-31T00:00:00Z",
      "author": {
        "id": "uuid",
        "username": "github-user",
        "avatarUrl": "https://example.com/avatar.png"
      }
    }
  ],
  "nextCursor": null
}
```

Sorting:

- MVP default: newest first.

## 11.2 Create comment

Endpoint:

```txt
POST /api/skills/:skillId/comments
```

Request body:

```json
{
  "body": "This worked for me, but the setup instructions need improvement."
}
```

Response:

```json
{
  "comment": {
    "id": "uuid",
    "skillId": "uuid",
    "parentId": null,
    "body": "This worked for me, but the setup instructions need improvement.",
    "status": "visible",
    "createdAt": "2026-08-31T00:00:00Z",
    "updatedAt": "2026-08-31T00:00:00Z",
    "author": {
      "id": "uuid",
      "username": "github-user",
      "avatarUrl": "https://example.com/avatar.png"
    }
  },
  "commentsCount": 5
}
```

## 11.3 Comment responsiveness

Frontend should use optimistic posting.

Flow:

```txt
User submits comment
  ↓
Temporary comment appears immediately
  ↓
Comment is marked "sending"
  ↓
API request completes
  ↓
Temporary comment is replaced with server comment
  ↓
On failure, comment is marked "failed" with retry/remove options
```

Temporary comment ID:

```ts
const tempId = `temp_${crypto.randomUUID()}`;
```

## 11.4 Comment editing

Not required for MVP.

## 11.5 Comment deletion

Optional for MVP.

If included:

- Users may delete their own comments.
- Deletion should be soft delete.
- `status` becomes `deleted`.
- `deleted_at` is set.

---

## 12. Comment Reporting

Endpoint:

```txt
POST /api/comments/:commentId/report
```

Request body:

```json
{
  "reason": "spam",
  "note": "Repeated promotional content."
}
```

Valid reasons:

```txt
spam
abuse
unsafe
off_topic
other
```

Response:

```json
{
  "ok": true,
  "reportsCount": 1
}
```

MVP behavior:

- Login required.
- One report per user per comment.
- Increment `comments.reports_count`.
- Do not automatically hide comments yet.
- Later, an admin/moderator dashboard can review reported comments.

---

## 13. API Endpoints

Base URL:

```txt
https://api.ratemyskills.com
```

## Public endpoints

```txt
GET /health
GET /api/skills
GET /api/skills/:slug
GET /api/skills/:slug/stats
GET /api/skills/:slug/comments
```

## Private endpoints

Require Supabase JWT in the `Authorization` header.

```txt
GET  /api/skills/:slug/me
PUT  /api/skills/:skillId/vote
POST /api/skills/:skillId/comments
POST /api/comments/:commentId/report
```

Optional later:

```txt
DELETE /api/comments/:commentId
```

## Auth header

```txt
Authorization: Bearer <supabase_access_token>
```

---

## 14. API Response Shapes

## 14.1 Skill list item

```ts
type SkillListItem = {
  id: string;
  slug: string;
  name: string;
  description: string;
  tags: string[];
  supportedAgents: string[];
  upvotesCount: number;
  downvotesCount: number;
  commentsCount: number;
  score: number;
  topReason: VoteReasonCount | null;
};
```

## 14.2 Skill detail

```ts
type SkillDetail = {
  id: string;
  slug: string;
  name: string;
  description: string;
  sourceUrl: string | null;
  installCommand: string | null;
  docsUrl: string | null;
  tags: string[];
  supportedAgents: string[];
  createdAt: string;
  updatedAt: string;
};
```

## 14.3 Skill stats

```ts
type SkillStats = {
  skillId: string;
  upvotesCount: number;
  downvotesCount: number;
  commentsCount: number;
  score: number;
  reasonCounts: VoteReasonCount[];
  reasonedVotesCount: number;
  unreasonedVotesCount: number;
};

type VoteReasonCount = {
  reason: VoteReason;
  value: 1 | -1;
  count: number;
};
```

## 14.4 Skill private user state

```ts
type SkillMeState = {
  myVote: 1 | -1 | null;
  myReason: VoteReason | null;
};
```

---

## 15. Caching Strategy

## 15.1 Cache public GET endpoints

Recommended cache headers:

```txt
Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=600
```

Endpoint-specific TTLs:

```txt
GET /api/skills
  1–5 minutes

GET /api/skills/:slug
  5–30 minutes

GET /api/skills/:slug/stats
  10–60 seconds

GET /api/skills/:slug/comments
  30–120 seconds
```

## 15.2 Never cache private endpoints

Use:

```txt
Cache-Control: private, no-store
```

For:

```txt
GET /api/skills/:slug/me
PUT /api/skills/:skillId/vote
POST /api/skills/:skillId/comments
POST /api/comments/:commentId/report
```

## 15.3 Optimistic UI handles cache staleness

After vote/comment mutations:

- User sees immediate optimistic update.
- Server returns authoritative final state.
- Public cached counters/comments may lag briefly for other users.

This is acceptable for MVP.

---

## 16. Auth & Security

## 16.1 Auth

Use Supabase Auth with GitHub OAuth.

Guest users can read.

Logged-in users can:

- Vote
- Comment
- Report comments

## 16.2 Worker-side auth verification

For private endpoints:

1. Read `Authorization` header.
2. Extract Supabase access token.
3. Verify token by calling Supabase Auth.
4. Use the authenticated user ID for writes.

## 16.3 Security rules

Must-have:

- GitHub login required for writes.
- Validate every request body with Zod/Valibot.
- Enforce one vote per user per skill.
- Enforce one report per user per comment.
- Do not expose Supabase service role key to frontend.
- Do not expose user emails publicly.
- Do not trust client-provided user IDs.
- Escape comment text.
- Disable raw HTML if markdown is introduced later.
- Add rate limits for comments/reports/votes.
- Enable Supabase RLS as defense-in-depth where practical.

## 16.4 Rate limits

Initial suggested limits:

```txt
Votes:
- 60 per minute per user

Comments:
- 5 per minute per user
- 30 per hour per user

Reports:
- 10 per hour per user
```

Implementation options:

- Start with basic Worker-side checks.
- Later add Cloudflare rate limiting, Turnstile, KV, or Durable Objects if abuse appears.

---

## 17. Seed Data Plan

MVP/local development should seed **20 placeholder skills**.

Each seed skill should include:

```ts
type SeedSkill = {
  slug: string;
  name: string;
  description: string;
  sourceUrl?: string;
  installCommand?: string;
  docsUrl?: string;
  tags: string[];
  supportedAgents: string[];
};
```

Example seed categories:

```txt
PDF
Documents
Spreadsheets
Slides
Code Review
Frontend
Next.js
Testing
Research
Data Analysis
GitHub
Vercel
Supabase
Design
Figma
Automation
Writing
Security
DevOps
Prompting
```

Example placeholder:

```ts
{
  slug: "pdf-toolkit",
  name: "PDF Toolkit",
  description: "Helps agents read, inspect, and generate PDF documents.",
  sourceUrl: "https://example.com/pdf-toolkit",
  installCommand: "skills install pdf-toolkit",
  tags: ["pdf", "documents"],
  supportedAgents: ["codex", "generic"]
}
```

The initial seed does not need to be accurate production data. It exists to build the UX and validate flows.

---

## 18. Suggested Monorepo Structure

```txt
skill-grill/
  apps/
    web/
      app/
      components/
      lib/
      package.json

    api/
      src/
        index.ts
        routes/
          skills.ts
          votes.ts
          comments.ts
        lib/
          supabase.ts
          auth.ts
          cache.ts
          validation.ts
      wrangler.jsonc
      package.json

  packages/
    shared/
      src/
        types.ts
        schemas.ts

  supabase/
    migrations/
    seed.sql

  README.md
  Product.md
  package.json
  pnpm-workspace.yaml
```

Recommended package manager:

```txt
pnpm
```

---

## 19. Implementation Milestones

## Milestone 1 — Project setup

Deliverables:

- Monorepo initialized
- Next.js app created
- Hono Worker API created
- Supabase project connected
- GitHub OAuth configured
- shadcn/ui installed
- Basic layout implemented

Acceptance criteria:

- Frontend loads.
- API `/health` returns `{ ok: true }`.
- User can sign in with GitHub.

---

## Milestone 2 — Database and seed data

Deliverables:

- Supabase migrations
- `profiles`, `skills`, `skill_votes`, `comments`, `comment_reports`
- 20 placeholder skills seeded
- Public skill list API

Acceptance criteria:

- `/api/skills` returns seeded skills.
- `/skills` displays seeded skills.
- `/skills/[slug]` displays skill detail.

---

## Milestone 3 — Voting

Deliverables:

- Vote API
- Transactional vote behavior
- Optimistic frontend voting
- Private `/me` endpoint for current user vote

Acceptance criteria:

- Guest clicking vote sees GitHub login prompt.
- Logged-in user can upvote/downvote/remove vote.
- One user cannot create duplicate votes.
- Counts update correctly.
- UI rolls back on failed vote request.

---

## Milestone 4 — Comments

Deliverables:

- Comment list API
- Create comment API
- Comment form
- Optimistic comment posting
- Public comments display

Acceptance criteria:

- Guests can read comments.
- Guests cannot post comments.
- Logged-in users can post comments.
- Empty/too-long comments are rejected.
- New comment appears immediately for the posting user.

---

## Milestone 5 — Comment reporting

Deliverables:

- Report comment endpoint
- Report dialog
- Report reason validation
- One report per user per comment

Acceptance criteria:

- Logged-in users can report comments.
- Duplicate reports are rejected or treated as no-op.
- Report count increments.
- Guest users are prompted to login.

---

## Milestone 6 — Polish and caching

Deliverables:

- Loading states
- Empty states
- Toast messages
- Error states
- Cache headers on public endpoints
- `no-store` on private endpoints
- Basic responsive design

Acceptance criteria:

- App looks polished on desktop and mobile.
- Public endpoints include cache headers.
- Private endpoints are not cached.
- Core flows feel responsive.

---

## 20. Future Roadmap

After MVP validation, consider:

### Data expansion

- Import from `skills.sh` API
- Scheduled sync jobs
- Skill metadata refresh
- Skill audit display

### Community features

- Comment replies
- Comment voting
- User profiles
- Reputation
- Collections
- “Works with agent X” reports
- Maintainer replies
- Claimed maintainer profiles

### Discovery features

- Better search
- Tags/categories pages
- Trending algorithm
- Similar skills
- Alternative skills
- “Best skills for X” editorial pages

### Moderation

- Admin dashboard
- Hide/delete comments
- User bans
- Auto-hide heavily reported comments
- Spam detection
- Cloudflare Turnstile

### Trust features

- Compatibility matrix
- Manual reviews
- Verified testing
- Benchmark reports
- Security warnings

---

## 21. Open Decisions

The following can remain undecided during initial implementation:

1. Whether to use plain text comments or limited markdown.
   - MVP recommendation: plain text first.

2. Whether frontend deploy uses OpenNext for Cloudflare or a mostly static Cloudflare Pages setup.
   - MVP recommendation: keep backend logic in Worker API and avoid complex Next server features.

3. Whether to add admin/moderator dashboard in MVP.
   - MVP recommendation: not needed initially, but keep data model ready.

4. Whether to expose public user profiles.
   - MVP recommendation: not in MVP.

5. Whether to add direct `skills.sh` integration.
   - MVP recommendation: defer until the local MVP UX is validated.

---

## 22. Definition of Done for MVP

The MVP is complete when:

- A guest can browse the homepage.
- A guest can view all seeded skills.
- A guest can open a skill detail page.
- A guest can read votes and comments.
- A guest is prompted to sign in when trying to vote/comment/report.
- A user can sign in with GitHub.
- A logged-in user can upvote/downvote/remove vote.
- A logged-in user can post a top-level comment.
- A logged-in user can report a comment.
- Public pages and public API reads are cacheable.
- Private user-specific endpoints are not cached.
- The app is polished enough to share publicly for feedback.
