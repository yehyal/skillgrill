# Skill Grill

<p align="center">
  <img src="apps/web/public/assets/skill-grill-icon-repo.svg" alt="Skill Grill" width="112" />
</p>

<p align="center"><strong>Find AI agent skills that are worth putting to work.</strong></p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-23211f.svg" alt="MIT License" /></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/node-24-5e9f68.svg" alt="Node.js 24" /></a>
  <a href="https://pnpm.io/"><img src="https://img.shields.io/badge/pnpm-10.33.2-f69220.svg" alt="pnpm 10.33.2" /></a>
  <a href="https://github.com/yehyal/skillgrill/actions/workflows/ci.yml"><img src="https://github.com/yehyal/skillgrill/actions/workflows/ci.yml/badge.svg" alt="CI status" /></a>
</p>

Skill Grill is a directory for discovering, trying, and judging skills made for AI agents. It keeps the catalog compact and practical: browse what a skill does, read author-provided requirements where available, try the install command, and leave a community verdict.

## Status

Skill Grill is live at [skillgrill.dev](https://skillgrill.dev) and remains under active development. The repository currently includes:

- A public home page, searchable directory, and skill detail pages.
- All Time and seven-day Trending rankings, plus task-oriented tag discovery.
- List and card discovery views with a remembered local preference.
- Skill descriptions, source and documentation links, install commands, tags, and author-provided requirements notes where available.
- Well-done and undercooked voting, optional verdict reasons, comments, reporting, and GitHub authentication.
- Optimistic community interactions, light/dark/system themes, and a Cloudflare Worker API backed by Supabase and Drizzle.

The launch catalog is sourced from a separately maintained, validated import snapshot. Production imports are intentionally kept outside this public repository.

## Architecture

The pnpm workspace contains a Next.js frontend, a Hono API running on Cloudflare Workers, and a shared Drizzle database package. The browser loads the frontend, then reads public catalog data and authenticated community data from the API. Supabase provides authentication and Postgres stores the catalog, votes, comments, reports, and vote-event history.

The frontend is published as a Cloudflare Pages static export with generated skill-detail pages. The API remains a separately deployed Worker; see the [deployment notes](docs/deployment.md).

## Start Here

See [development.md](docs/development.md) for prerequisites, environment setup, commands, and local verification.

More context:

- [Architecture](docs/architecture.md)
- [Deployment](docs/deployment.md)
- [Product brief](Product.md)
- [Design source of truth](DESIGN.md)
- [Contribution guide](CONTRIBUTING.md)
- [Security policy](SECURITY.md)

## Repository

The [social preview artwork](docs/assets/skill-grill-social-preview.png) is kept in the repository for manual upload in GitHub settings. It is not used as an application asset.

## License

The source code is available under the [MIT License](LICENSE), copyright (c) 2026 Skill Grill. The Skill Grill name, logo, and derived brand assets are excluded from that license and may not be reused to brand another product or imply endorsement; see [TRADEMARKS.md](TRADEMARKS.md). Truthful references, links, and attribution to Skill Grill remain allowed.
