# Contributing

Issues, corrections, documentation improvements, and focused fixes are welcome. Please discuss significant features or architectural changes in an issue before implementing them so the scope and direction can be agreed first.

## Before You Start

Read the [development guide](docs/development.md), then create a branch from `main` with a short purpose prefix such as `feature/`, `fix/`, or `docs/` and a kebab-case description. Keep each pull request and its commits focused. Avoid unrelated refactors or formatting churn.

For database work, explain the data and migration impact before implementation. Generate Drizzle migrations through the repository tooling, review the generated SQL and any custom SQL carefully, and never apply a migration to a shared or production database as part of a pull request.

## Pull Requests

Include:

- The issue or decision that gives the change context.
- A concise summary of behavior and files changed.
- Screenshots or a short recording for UI changes, including relevant responsive states.
- Any API, database, security, caching, or environment-variable impact.
- Confirmation that `pnpm lint` and `pnpm typecheck` pass.

Do not include secrets, production data, generated build output, unrelated refactors, or third-party assets without a compatible license. Keep user-facing changes accessible and document meaningful behavior changes in the appropriate project documentation.

## Community Expectations

Be respectful, specific, and open to good-faith disagreement. Focus feedback on the work, protect private information, and leave room for contributors with different levels of context. A formal Code of Conduct is deferred until a private conduct-reporting contact is available.
