# Architecture

## Workspace

Skill Grill is a pnpm monorepo:

- `apps/web`: Next.js App Router frontend and public discovery experience.
- `apps/api`: Hono API deployed to Cloudflare Workers.
- `packages/db`: Drizzle schema, migrations, and database access helpers.
- `packages/shared`: Shared TypeScript contracts used by the frontend and API.

The root scripts coordinate development and workspace-wide linting and type checking. The frontend and API are developed as separate processes through `pnpm dev`.

## Request Flow

In local development, the browser talks to the Next.js frontend and the API separately. In the planned deployment, Cloudflare Pages serves the static frontend and the Cloudflare Worker serves the API:

```text
Browser -> Cloudflare Pages / Next.js static frontend
Browser -> Cloudflare Worker API -> Supabase Postgres
Browser -> Supabase Auth
```

The frontend owns presentation, URL filters, local view preferences, authentication state, and hydrated community interactions. Runtime votes, comments, reports, and session state are loaded from the API after hydration. They are not baked into the future static export.

## Data and Caching

Public skill lists and detail data use the API's public cache policy. Public list reads are short-lived and can be revalidated; detail reads use the corresponding public cache behavior. Authenticated reads and mutations, including `/me`, votes, comments, and reports, remain uncached and use no-store semantics.

Trending ranks skills by positive net vote movement during the rolling previous seven days. It begins accumulating when vote-event migrations are applied; historical votes are not backfilled. All Time ranks by cumulative upvotes, with comments and name as stable tie-breakers.

## Rate Limiting and Safety

The API applies per-user rate limits to authenticated mutation endpoints. The current policy limits vote mutations to 60 requests per minute and comment and report mutations to 5 requests per minute. Authentication, ownership checks, hidden-skill checks, validation, and database availability errors remain handled by the API rather than trusted to the browser.
