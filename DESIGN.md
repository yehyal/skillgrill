# Skill Grill Design System

Skill Grill is a warm, compact directory for comparing AI agent skills. The interface should feel utilitarian and information-rich, with enough terracotta warmth to remain distinct from a generic package registry.

## Direction

- Prioritize dense discovery, scannable metadata, and quick comparison over marketing drama.
- Keep color restrained: tinted neutral surfaces carry the product; terracotta marks primary actions, selected states, links, and small emphasis.
- Use skills.sh as an information hierarchy reference only. Do not copy its brand, ASCII treatment, assets, exact layout, install metrics, audits, or repository statistics.
- Proof is explicit: positive votes, negative votes, comments, and seven-day movement where available.
- Do not render a user-facing aggregate score. The database and API may retain score for compatibility and internal calculations.

## Voice

- Lead with proof: does the skill deliver, hold up, and deserve installation?
- Prefer people, ratings, votes, verdict, and firsthand takes over abstract community language.
- Reserve grill language for voting and a small number of memorable headings.
- Keep navigation, installation, errors, authentication, reporting, and moderation direct.
- Never describe comments as learning unless the content is genuinely educational.
- Keep internal API and database names such as `upvotesCount` and `downvotesCount`; only presentation terminology changes.
- Use “Well done” for positive votes and “Undercooked” for negative votes.
- Use one optional reason to explain a verdict without making voting feel like a survey.

### Terminology

| Context | Preferred copy |
| --- | --- |
| Hero eyebrow | Skills, put to the test |
| Hero support | Votes, comments, and firsthand takes on whether each skill lives up to the hype. |
| Leaderboard | The verdict / What holds up |
| Directory support | See the votes and firsthand feedback before you install. |
| Voting | The verdict / Did it deliver? / Tried it? Add your take. |
| Positive vote | Well done |
| Negative vote | Undercooked |
| Comments | What people are saying |

## Verdict Reasons

The reason labels are:

- Well done: Delivered reliably, Triggered when needed, Kept context light.
- Undercooked: Did not deliver, Missed when needed, Triggered too often, Used too much context.

The read-only aggregate section is titled **What people noticed** and shows at
most two neutral badges. A reason is hidden until at least three current votes
share it. The development-only completion line is `Reason response: N with · M
without`; production does not expose completion metrics.

Two presentational variants remain available for manual local comparison. The
temporary `DEV_VOTE_REASON_UI` constant selects them in development, while
production always uses vote-first. This is not an A/B test and has no
assignment, cookie, analytics, or experiment system. Remove the selector after
the final direction is chosen.

### Vote-first

Initially show only the Well done and Undercooked controls. After a new verdict
succeeds, reveal the matching inline group under **What stood out?** with
**Pick one, or skip it.** Existing reasoned votes show the selected label and a
**Change reason** control; unreasoned votes show **Add a reason**. Dismissal
does not send a request. Reason buttons are native single-select controls with
`aria-pressed` and keep focus stable as the inline group opens or closes.

### Always-visible

Show compact groups titled **Well done because** and **Undercooked because**
under the main verdict controls. Selecting a reason submits its verdict and
reason in one request. Groups stack on mobile and use two columns when there is
room.

Both variants use visible hover, focus, selected, disabled, pending, error, and
rollback states. Main verdict transitions retain the existing success toasts;
reason-only changes use quiet saving feedback. Opposite-side reasons switch the
verdict atomically, while selecting the current main verdict again removes the
vote and its reason.

## Color

All product colors are OKLCH and support Light, Dark, and System themes. System is the default; the header light/dark toggle persists an explicit choice through the theme provider.

Light theme:

- Background: `oklch(0.965 0.012 85)`
- Foreground: `oklch(0.22 0.015 80)`
- Card: `oklch(0.985 0.008 85)`
- Primary terracotta: `oklch(0.59 0.16 38)`
- Muted surface: `oklch(0.925 0.012 85)`
- Border: `oklch(0.86 0.018 82)`
- Success: `oklch(0.56 0.12 148)`
- Warning: `oklch(0.72 0.13 75)`
- Destructive: `oklch(0.5 0.16 28)`

Dark theme:

- Background: `oklch(0.18 0.015 80)`
- Foreground: `oklch(0.93 0.012 84)`
- Card: `oklch(0.235 0.016 80)`
- Primary terracotta: `oklch(0.68 0.15 40)`
- Muted surface: `oklch(0.26 0.016 80)`
- Border: `oklch(0.34 0.018 80)`
- Success: `oklch(0.72 0.12 148)`
- Warning: `oklch(0.8 0.12 78)`
- Destructive: `oklch(0.68 0.15 28)`

## Typography

- Use Geist Sans for product UI, headings, controls, and body copy.
- Use Geist Mono for labels, commands, identifiers, ranks, counts, URLs, and tabular data.
- Fixed scale only:
  - Page title: `2.5rem`, line-height `1`
  - Section title: `1.5rem`, line-height `1.2`
  - Row/card title: `1rem` to `1.25rem`, line-height `1.25`
  - Body: `0.875rem` to `1rem`, line-height `1.5` to `1.7`
  - Metadata: `0.75rem` to `0.8125rem`
- Letter spacing is `0` except uppercase metadata labels, which may use `0.14em`.
- Body prose should stay under `70ch`; list rows and metadata can be denser.

## Layout

- Default content frame: `72rem` maximum with `1rem / 1.5rem / 2rem` responsive side padding.
- Detail pages may use `minmax(0, 1fr) 18rem` on desktop with a metadata rail.
- Spacing rhythm: `0.5rem`, `0.75rem`, `1rem`, `1.5rem`, `2rem`, `3rem`, `4rem`.
- Avoid landing-page hero bloat. The first viewport should show search, shortcuts, and at least a hint of discovery content.
- Mobile is one column. Card grids can move to two columns at medium widths, and three columns only when the content frame prevents truncation.

## Shape And States

- Radius: `0.375rem` default, `0.25rem` compact, `0.5rem` for dialogs and repeated cards only.
- Borders are `1px`; avoid decorative side-stripe accents.
- Focus states use a visible `3px` ring with `--ring / 50%`.
- Motion is limited to color, opacity, and small transform feedback between `150ms` and `220ms`.
- Theme changes use a brief `140ms` handoff before applying the selected mode; do not add a larger transition effect.
- Respect reduced motion and avoid layout animation.

## Components

- Leaderboard rows are the default discovery presentation. They emphasize rank, name, source identifier, short description, compatibility, Well done, Undercooked, comments, and optional trend delta.
- Discovery cards are optional. They provide more description room plus tags and supported agents, while still showing explicit verdict counts.
- Metadata rails show source path or identifier, compatibility, tags, source/documentation links, and added/updated dates.
- Install blocks sit near the top of detail pages. Commands use Geist Mono, horizontal overflow, and persistent copy feedback.
- Vote controls are quiet verdict controls. Well done and Undercooked actions each include the authoritative count and selected/pending/unavailable states.
- Loading states use skeleton geometry that resembles the final list, detail header, install block, and metadata rail.
- Empty states should say what is true: no results, no comments, or no positive seven-day vote movement.
