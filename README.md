# Skill Grill

<p align="center">
  <img src="apps/web/public/assets/skill-grill-icon.svg" alt="Skill Grill" width="112" />
</p>

<p align="center"><strong>Find AI agent skills that are worth putting to work.</strong></p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-23211f.svg" alt="MIT License" /></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/node-24-5e9f68.svg" alt="Node.js 24" /></a>
  <a href="https://pnpm.io/"><img src="https://img.shields.io/badge/pnpm-10.33.2-f69220.svg" alt="pnpm 10.33.2" /></a>
  <a href="https://github.com/yehyal/skillgrill/actions/workflows/ci.yml"><img src="https://github.com/yehyal/skillgrill/actions/workflows/ci.yml/badge.svg" alt="CI status" /></a>
</p>

Skill Grill is a pre-launch directory for discovering, trying, and judging skills made for AI agents. It keeps the catalog compact and practical: browse what a skill does, see which agents it supports, try the install command, and leave a community verdict.

## Status

Skill Grill is under active development and is not deployed yet. The repository currently includes:

- A public home page, searchable directory, and skill detail pages.
- All Time and seven-day Trending rankings, plus tag and agent filters.
- List and card discovery views with a remembered local preference.
- Skill descriptions, source and documentation links, install commands, tags, and compatibility metadata.
- Well-done and undercooked voting, optional verdict reasons, comments, reporting, and GitHub authentication.
- Optimistic community interactions, light/dark/system themes, and a Cloudflare Worker API backed by Supabase and Drizzle.

There is no live demo or catalog screenshot yet. Those will be added after deployment and real catalog data are available.

## Architecture

The pnpm workspace contains a Next.js frontend, a Hono API running on Cloudflare Workers, and a shared Drizzle database package. The browser loads the frontend, then reads public catalog data and authenticated community data from the API. Supabase provides authentication and Postgres stores the catalog, votes, comments, reports, and vote-event history.

The frontend is prepared for a future Cloudflare Pages static export. The API remains a separately deployed Worker; see the [deployment notes](docs/deployment.md).

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
