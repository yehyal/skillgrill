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

## Local environment

Copy the web environment template and add the hosted Supabase project's public values:

```sh
cp apps/web/.env.example apps/web/.env.local
```

Set these values in `apps/web/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<supabase-publishable-key>
```

Only the public URL and publishable key belong in the web app. Do not add a Supabase secret key to this package or commit `.env.local`.

GitHub OAuth uses two different callback settings:

1. In the GitHub OAuth App, set the authorization callback URL to `https://<project-ref>.supabase.co/auth/v1/callback`. GitHub sends the provider response to Supabase here.
2. In Supabase Auth URL Configuration, add `http://localhost:3000/auth/callback` to the redirect allow list. Supabase sends the browser here after the provider response, with the current relative path in the `next` query parameter.

If the public values are missing, the app stays usable as a guest and shows an unavailable sign-in state.

## Commands

```sh
pnpm dev        # Start the web and API apps
pnpm lint       # Lint every workspace package
pnpm typecheck  # Type-check every workspace package
pnpm test       # Run package tests
pnpm build      # Build both apps
pnpm check      # Run all verification commands
```

## Local verification

With the environment configured, run `pnpm dev`, open `http://localhost:3000`, and verify the initial loading state, guest header, GitHub consent, callback return, refreshed session, avatar fallback, local sign-out, and restored guest state. Without credentials, run `pnpm check` and verify the unavailable sign-in state plus the credential-free web tests.

The API health check is available at `GET http://localhost:8787/health` and returns `{ "ok": true }`.

## Foundation boundary

Milestone 1 connects the hosted Supabase browser client, GitHub-only OAuth, reusable application chrome, and the selected shadcn/ui primitives. Required shadcn/ui files are copied from the linked component source rather than installed through the shadcn CLI. Skill data, product routes, database migrations, and Worker authorization remain out of scope for this milestone.

See [Product.md](./Product.md) for the product and MVP specification.
