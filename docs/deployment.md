# Deployment

Skill Grill uses a prelaunch Cloudflare Pages frontend and a separately deployed Cloudflare Worker API. Pages serves the static export; the Worker continues to connect to Supabase for Postgres and authentication. The site is intentionally unindexed until the later skill-publishing release.

## Cloudflare Pages

Create one Git-integrated Pages project with these settings:

| Setting | Value |
| --- | --- |
| Project name | `skillgrill` |
| Repository | `yehyal/skillgrill` |
| Production branch | `main` |
| Root directory | Repository root |
| Framework preset | Next.js Static HTML Export |
| Build image | v3 |
| Node.js | `24.20.0` via `NODE_VERSION` |
| pnpm | `10.33.2` via `PNPM_VERSION` |
| Build command | `pnpm --filter @skill-grill/web build:pages` |
| Output directory | `apps/web/out` |
| Build caching | Enabled |
| Pull request previews | Enabled |

The Pages build must use only the web workspace:

```bash
pnpm --filter @skill-grill/web build:pages
```

The expected Pages output directory is:

```text
apps/web/out
```

The explicit Pages mode in `apps/web/next.config.ts` is enabled only by `SKILL_GRILL_STATIC_EXPORT=true`. Normal development and the general monorepo build remain in ordinary Next.js mode so dynamic skill routes continue to work. Next.js 16 requires at least one parameter for an exported dynamic route, so Pages mode generates a reserved not-found sentinel and the build script removes its output before deployment. No skill-detail HTML remains in the Pages artifact, and arbitrary skill paths return the custom 404 page.

Enable the GitHub integration for `main`, build caching, and pull request preview deployments. Do not use the Worker project or a monorepo-wide build command for this Pages project.

## Environment Variables

Set these production variables in the Pages project. They are browser-visible by design, except that Supabase values must still be limited to the publishable URL and key:

```text
NEXT_PUBLIC_API_URL=https://api.skillgrill.dev
NEXT_PUBLIC_SUPABASE_URL=<production Supabase URL>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<production publishable key>
NEXT_PUBLIC_SITE_URL=https://skillgrill.dev
NEXT_PUBLIC_CONTACT_EMAIL=contact@skillgrill.dev
NEXT_PUBLIC_INDEXABLE=false
NODE_VERSION=24.20.0
PNPM_VERSION=10.33.2
```

For preview deployments, set the public API URL to `https://api.skillgrill.dev`, use the Pages preview URL as `NEXT_PUBLIC_SITE_URL` where practical, keep `NEXT_PUBLIC_CONTACT_EMAIL=contact@skillgrill.dev`, and keep `NEXT_PUBLIC_INDEXABLE=false`. Leave both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` unset in the preview environment so contributor and pull request builds cannot initiate production authentication.

Never put database credentials, service-role keys, access tokens, or Worker secrets in Pages variables.

## Domains And Authentication

Attach `skillgrill.dev` as the Pages custom domain. Attach `www.skillgrill.dev` as well and configure a permanent redirect from `www` to the apex domain. Keep `api.skillgrill.dev` routed to the existing Worker rather than Pages.

Configure production Supabase Auth with:

- Site URL: `https://skillgrill.dev`
- Allowed redirect URL: `https://skillgrill.dev/auth/callback`
- Keep `http://localhost:3000/auth/callback` as a separate development redirect.
- Do not add wildcard Pages preview callbacks.
- Configure GitHub OAuth to use Supabase's production provider callback URL, not the frontend callback URL directly.

Verify mail delivery or forwarding for `contact@skillgrill.dev` before publishing the legal and contact pages. The frontend's contact form uses the configured address; it does not provide a mail server.

Cloudflare Pages should serve `public/_headers`, which sets content-type sniffing, framing, referrer, and permissions policies. CSP remains deferred until the final Supabase and API origins are verified against OAuth and runtime requests.

## Future Publishing Step

A future build-time publishing step will obtain active skill records before the static frontend is built. That step will replace the sentinel-only `generateStaticParams()` result with active skill paths and add per-skill metadata for `/skills/[slug]`, then produce the skill-detail HTML and SEO metadata included in that build.

Until that work exists, keep the Pages catalog empty and do not add placeholder skill pages. A new frontend build will be required whenever static skill content or SEO metadata should change. Votes, comments, and authentication remain client-loaded and do not require rebuilding the frontend.

When the catalog is ready, the publishing step will obtain active skill records, implement `generateStaticParams()` and per-skill `generateMetadata()`, add the sitemap and structured skill metadata, set `NEXT_PUBLIC_INDEXABLE=true`, and trigger a new Pages build. That release is also the point at which production skill records should be seeded.

## Secrets

Only browser-safe publishable Supabase values belong in the frontend environment. Database credentials and Worker-only configuration must remain in Wrangler secrets or the deployment platform's private environment configuration. Never commit `.env` files, `.dev.vars`, database URLs, service-role keys, access tokens, or production data.

The API's deployment configuration will need `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `WEB_ORIGIN`. The web app's public configuration is documented in `apps/web/.env.example`.
