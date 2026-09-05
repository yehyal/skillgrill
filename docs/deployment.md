# Deployment

Skill Grill is pre-launch. No deployment is configured or triggered by this repository yet.

## Planned Boundary

Cloudflare Pages will host the static frontend. The existing Cloudflare Worker will host the API and will continue to connect to Supabase for Postgres and authentication. The Pages build should use only the web workspace:

```bash
pnpm --filter @skill-grill/web build:pages
```

The expected Pages output directory is:

```text
apps/web/out
```

The explicit Pages mode in `apps/web/next.config.ts` is enabled only by `SKILL_GRILL_STATIC_EXPORT=true`. Normal development and the general monorepo build remain in ordinary Next.js mode so dynamic skill routes continue to work.

## Future Publishing Step

A future build-time publishing step will obtain active skill records before the static frontend is built. That step will add `generateStaticParams()` and per-skill metadata for `/skills/[slug]`, then produce the skill-detail HTML and SEO metadata included in that build.

Until that work exists, do not run the Pages export command. A new frontend build will be required whenever static skill content or SEO metadata should change. Votes, comments, and authentication remain client-loaded and do not require rebuilding the frontend.

## Secrets

Only browser-safe publishable Supabase values belong in the frontend environment. Database credentials and Worker-only configuration must remain in Wrangler secrets or the deployment platform's private environment configuration. Never commit `.env` files, `.dev.vars`, database URLs, service-role keys, access tokens, or production data.

The API's deployment configuration will need `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `WEB_ORIGIN`. The web app's public configuration is documented in `apps/web/.env.example`.
