# Development

## Prerequisites

- Node.js 24 (`>=24 <25`)
- pnpm 10.33.2
- A Supabase project for browser authentication
- A Postgres connection string for the Worker API

The repository declares the Node and pnpm versions in the root `package.json`. With nvm, use `nvm use 24` before installing dependencies.

## Setup

Install workspace dependencies from the repository root:

```bash
pnpm install
```

Copy the environment templates into local environment files and fill in the values for your own development services:

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.dev.vars.example apps/api/.dev.vars
```

The web app needs its public API URL, Supabase browser configuration, site URL, contact email, and indexability setting. The API needs its database URL, Supabase verification settings, and allowed web origin. Keep local environment files and Wrangler variables out of commits.

## Commands

Run the frontend and API together:

```bash
pnpm dev
```

The local services are available at:

- Web app: `http://localhost:3000`
- Worker API: `http://localhost:8787`

Confirm the API process is ready with `GET http://localhost:8787/health`. It returns a `200` response with `{ "ok": true }` even when database configuration is absent. Skill routes return a structured `503 database_unavailable` response until `DATABASE_URL` is configured and reachable.

Run the workspace checks used by CI:

```bash
pnpm lint
pnpm typecheck
```

The root scripts also expose focused database and package commands. Database generation and migration commands are for local development only and must not be pointed at a shared or production database without review.

The future Pages export command is intentionally separate from normal development:

```bash
pnpm --filter @skill-grill/web build:pages
```

Do not use that command as a substitute for local development. It is documented for the future publishing boundary and currently remains blocked by the dynamic skill route until static parameters are supplied.

## Local Verification

Before opening a pull request, run:

```bash
pnpm lint
pnpm typecheck
git diff --check
```

When checking UI work manually, review desktop, tablet, and mobile widths, both light and dark themes, keyboard focus, reduced motion, long identifiers and commands, empty states, and recoverable API errors. Do not include generated build output, `.next`, `out`, Wrangler state, secrets, or production data in a change.
