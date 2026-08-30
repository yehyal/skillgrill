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

## Commands

```sh
pnpm dev        # Start the web and API apps
pnpm lint       # Lint every workspace package
pnpm typecheck  # Type-check every workspace package
pnpm test       # Run package tests
pnpm build      # Build both apps
pnpm check      # Run all verification commands
```

The API health check is available at `GET http://localhost:8787/health` and returns `{ "ok": true }`.

## Foundation boundary

This commit contains runnable application shells only. Supabase, GitHub OAuth, the product layout, feature UI, deployment adapters, and shadcn/ui components begin in Milestone 1. Required shadcn/ui files will be copied from the linked component source as they are needed rather than installed through the shadcn CLI.

See [Product.md](./Product.md) for the product and MVP specification.
