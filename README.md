# Skill Grill

Find AI agent skills that actually work.

This repository is the pnpm monorepo for the Skill Grill web application, API, and shared contracts.

## Prerequisites

- Node.js 24 LTS
- pnpm 10.33.2 (pinned through Corepack)

```sh
corepack enable
pnpm install
```

## Workspace

| Package | Purpose |
| --- | --- |
| `@skill-grill/web` | Next.js application at `http://localhost:3000` |
| `@skill-grill/api` | Hono Worker API at `http://localhost:8787` |
| `@skill-grill/shared` | Shared TypeScript contracts |
| `@skill-grill/db` | Drizzle schema, migrations, and seed command |

## Local environment

Copy the web environment template and add the hosted Supabase project's public values:

```sh
cp apps/web/.env.example apps/web/.env.local
```

Set these values in `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8787
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<supabase-publishable-key>
```

Only the public URL and publishable key belong in the web app. Do not add a Supabase secret key to this package or commit `.env.local`.

GitHub OAuth uses two different callback settings:

1. In the GitHub OAuth App, set the authorization callback URL to `https://<project-ref>.supabase.co/auth/v1/callback`. GitHub sends the provider response to Supabase here.
2. In Supabase Auth URL Configuration, add `http://localhost:3000/auth/callback` to the redirect allow list. Supabase sends the browser here after the provider response, with the current relative path in the `next` query parameter.

If the public values are missing, the app stays usable as a guest and shows an unavailable sign-in state.

The Worker reads `DATABASE_URL`, `SUPABASE_URL`, and `SUPABASE_PUBLISHABLE_KEY` server-side only. Use the Supabase transaction pooler URL and keep prepared statements disabled, as configured by the Drizzle connection helper. Set the Worker origin in `apps/api/wrangler.jsonc` or override it with `WEB_ORIGIN`.

For local Worker development, copy the environment template and fill in the hosted Supabase values:

```sh
cp apps/api/.dev.vars.example apps/api/.dev.vars
```

Keep `apps/api/.dev.vars` uncommitted. The web app still needs the public Supabase URL and publishable key in `apps/web/.env.local` so it can start the GitHub OAuth flow; the Worker copy is used only to verify bearer tokens and reach the database.

For a deployed Worker, configure the values as Wrangler secrets:

```sh
wrangler secret put DATABASE_URL
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_PUBLISHABLE_KEY
```

## Commands

```sh
pnpm dev        # Start the web and API apps
pnpm lint       # Lint every workspace package
pnpm typecheck  # Type-check every workspace package
pnpm db:generate # Generate Drizzle SQL migrations
pnpm db:migrate  # Apply migrations to DATABASE_URL
pnpm db:seed     # Seed or update the 20 local skills
pnpm db:studio   # Open Drizzle Studio
pnpm test       # Run package tests
pnpm build      # Build both apps
pnpm --filter @skill-grill/web build:pages  # Future Cloudflare Pages static export
pnpm check      # Run all verification commands
```

## Future Cloudflare Pages publishing

The future frontend publishing boundary is Cloudflare Pages for the static web export, with the existing Cloudflare Worker continuing to host the API. The Pages build should eventually run only in the web workspace:

```sh
pnpm --filter @skill-grill/web build:pages
```

That command enables the guarded static-export mode and writes the Pages artifact to `apps/web/out`. It is intentionally separate from the root `pnpm build` command and is not part of the current development workflow.

The later publishing step will obtain active skill records at build time, add `generateStaticParams()` for `/skills/[slug]`, and generate per-skill metadata. A new Pages build will be required whenever static skill content or SEO metadata changes. Votes, comments, authentication, and other user-specific state remain client-loaded from the separate API Worker after hydration, so those changes do not require rebuilding the frontend.

The current web app has no Next.js route handlers, Server Actions, request-time cookies or headers, rewrites, or middleware requirements. This keeps the future Pages export boundary explicit without adding `generateStaticParams()`, fetching catalog data, generating HTML, creating `out`, or introducing a frontend Worker.

## API cache policy

Public reads are explicitly cacheable at the browser and edge. Authenticated requests, health checks, errors, unmatched routes, and responses without an endpoint policy are never stored.

| Endpoint | Cache-Control |
| --- | --- |
| `GET /api/skills` | `public, max-age=60, s-maxage=300, stale-while-revalidate=600` |
| `GET /api/skills/:slug` | `public, max-age=300, s-maxage=1800, stale-while-revalidate=3600` |
| `GET /api/skills/:slug/stats` | `public, max-age=10, s-maxage=60, stale-while-revalidate=60` |
| `GET /api/skills/:slug/comments` | `public, max-age=30, s-maxage=60, stale-while-revalidate=60` |
| Authenticated reads and mutations | `private, no-store` |
| Health, errors, and unmatched routes | `no-store` |

## API safety and operations

The Worker uses native Cloudflare Rate Limiting bindings for authenticated mutations. Each binding is keyed by the verified Supabase user ID and has its own one-minute window:

| Mutation | Limit |
| --- | --- |
| Votes | 60 requests per minute |
| Comments | 5 requests per minute |
| Reports | 5 requests per minute |

Rate-limited responses return `429`, `Retry-After: 60`, `Cache-Control: private, no-store`, and the structured `rate_limited` error code. API responses include an `X-Request-Id` header for support and log correlation. Failure logs contain the request ID, method, path, status, and safe error code only; authorization headers, tokens, comment bodies, and report notes are never logged.

Workers Logs are enabled in `apps/api/wrangler.jsonc` with 10% head sampling for this beta. The API also sends baseline content-type, referrer, frame, and permissions policy headers. No paid monitoring vendor or CSP enforcement is included in this milestone.

## Local verification

With the environment configured, run `pnpm dev`, open `http://localhost:3000`, and verify the initial loading state, guest header, GitHub consent, callback return, refreshed session, avatar fallback, local sign-out, and restored guest state. Without credentials, run `pnpm check` and verify the unavailable sign-in state plus the credential-free web tests.

The API health check is available at `GET http://localhost:8787/health` and returns `{ "ok": true }` even when database configuration is absent. Skill routes return a structured `503 database_unavailable` response until `DATABASE_URL` is configured and reachable.

## Implementation boundary

Milestones 2 through 6 established the Drizzle database package, unapplied migrations, the idempotent 20-skill seed, public Worker discovery routes, client-loaded directory and detail surfaces, authenticated transactional voting, comments, reporting, and public-read caching. Milestone 7 adds the compact directory design system, All Time and Trending discovery, list/card presentation, and the recomposed detail page. Required shadcn/ui files are copied from the linked component source rather than installed through the shadcn CLI.

Trending is intentionally a fresh signal. After the event migration is applied, a skill appears in Trending only when the sum of its `net_vote_delta` values from the rolling previous seven days is positive. Results rank by that seven-day net gain, then all-time upvotes, comments, and name. Historical votes are not backfilled, so the list is honestly empty until vote changes accumulate. The migration remains unapplied by default; use `pnpm db:migrate` only when you are ready to update the database.

See [Product.md](./Product.md) for the product and MVP specification.
