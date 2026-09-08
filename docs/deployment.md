# Deployment

Skill Grill uses a Cloudflare Pages frontend and a separately deployed Cloudflare Worker API. Pages serves the static export; the Worker continues to connect to Supabase for Postgres and authentication. Indexing is controlled explicitly through the Pages environment so a deployment can be verified before it is made discoverable.

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

The explicit Pages mode in `apps/web/next.config.ts` is enabled only by `SKILL_GRILL_STATIC_EXPORT=true`. During that build, the web app reads every active skill slug from the configured Worker API, validates the catalog response, and generates one `/skills/<slug>/index.html` document per skill. Each page contains its catalog content, canonical metadata, Open Graph metadata, and structured data. TanStack Query uses the generated detail response as immediate content and refreshes it in the browser; votes, verdict reasons, and comments continue to load from the Worker.

The build fails instead of publishing a partial catalog when the API is unavailable, reports malformed pagination or skill details, changes totals while pagination is in progress, or contains no active skills. A new Pages build is required after catalog additions, removals, slug changes, or metadata updates. Community interactions do not require a rebuild.

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
NEXT_PUBLIC_POSTHOG_ENABLED=true
NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=<public EU PostHog project token>
NODE_VERSION=24.20.0
PNPM_VERSION=10.33.2
```

For preview deployments, set the public API URL to `https://api.skillgrill.dev`, use the Pages preview URL as `NEXT_PUBLIC_SITE_URL` where practical, keep `NEXT_PUBLIC_CONTACT_EMAIL=contact@skillgrill.dev`, and keep `NEXT_PUBLIC_INDEXABLE=false`. Set `NEXT_PUBLIC_POSTHOG_ENABLED=false` and leave `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` unset so contributor and pull request builds cannot pollute production analytics. Leave both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` unset in the preview environment so contributor and pull request builds cannot initiate production authentication.

Keep `NEXT_PUBLIC_INDEXABLE=false` for the first production deployment of a new catalog. After checking the generated detail routes, metadata, sitemap, and 404 behavior on the custom domain, set it to `true` and redeploy. The indexable build advertises `/sitemap.xml` from `/robots.txt`; the prelaunch build disallows crawling and omits that sitemap directive.

Never put database credentials, service-role keys, access tokens, or Worker secrets in Pages variables.

## Anonymous product analytics

The frontend uses `posthog-js` only when the production browser hostname is `skillgrill.dev`, `NEXT_PUBLIC_POSTHOG_ENABLED=true`, and a public project token is present. Events go directly to PostHog Cloud EU at `https://eu.i.posthog.com`. The integration is cookieless, uses no person profiles or account identification, disables autocapture and other optional collection features, and allows only the documented product events. URL query strings and hashes are sanitized before capture; only `utm_source`, `utm_medium`, and `utm_campaign` may remain.

Create and configure the PostHog project manually before enabling the production flag:

- Create an EU Cloud project and enable cookieless server-hash mode.
- Confirm IP capture is disabled.
- Disable autocapture, session recordings, heatmaps, surveys, and exception collection at the project level as defense in depth.
- Create the `Skill Grill MVP` dashboard with session-based discovery, evaluation, install, contribution, search-health, catalog, and acquisition views from the event contract in the privacy policy and product documentation.
- Do not add a reverse proxy initially. Revisit a first-party Cloudflare proxy only if blocker-related undercounting becomes material.

The public project token may be exposed through Pages browser configuration. PostHog administrative or personal API keys must never enter Pages variables, source control, or the frontend bundle.

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

## Catalog Publishing

Seed or synchronize production before triggering the Pages build. The publishing build reads only active skills exposed by the Worker API. Verify these outputs before enabling indexing:

```text
apps/web/out/skills/<known-slug>/index.html
apps/web/out/sitemap.xml
apps/web/out/robots.txt
```

The known skill HTML should contain its name and description without requiring JavaScript. The sitemap should contain every active skill URL exactly once. An unknown skill path should continue to return the custom static 404 page.

## Secrets

Only browser-safe publishable Supabase values belong in the frontend environment. Database credentials and Worker-only configuration must remain in Wrangler secrets or the deployment platform's private environment configuration. Never commit `.env` files, `.dev.vars`, database URLs, service-role keys, access tokens, or production data.

The API's deployment configuration will need `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `WEB_ORIGIN`. The web app's public configuration is documented in `apps/web/.env.example`.
