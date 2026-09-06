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
most three neutral badges. At launch, a reason is visible after one current
vote; this threshold can be raised once the directory has enough responses. The development-only completion line is `Reason response: N with · M
without`; production does not expose completion metrics.

Two presentational variants remain available for manual local comparison. The
temporary `voteReasonUi` constant selects them in development, while
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

The scene: a developer compares skills in a daylit workspace, then returns in the evening. Warm paper and charcoal themes support both, with system preference as the default.

### Light theme

| Role | Value |
| --- | --- |
| background | `oklch(0.967 0.010 80)` |
| foreground | `oklch(0.25 0.012 55)` |
| card | `oklch(0.991 0.004 80)` |
| primary | `oklch(0.52 0.135 38)` |
| primary-hover | `oklch(0.46 0.12 38)` |
| primary-foreground | `oklch(0.99 0.004 80)` |
| secondary | `oklch(0.925 0.012 80)` |
| secondary-foreground | `oklch(0.35 0.014 55)` |
| muted | `oklch(0.938 0.009 80)` |
| muted-foreground | `oklch(0.49 0.015 65)` |
| accent | `oklch(0.925 0.027 48)` |
| accent-foreground | `oklch(0.43 0.10 38)` |
| border | `oklch(0.875 0.012 80)` |
| input | `oklch(0.66 0.015 75)` |
| success | `oklch(0.45 0.085 148)` |
| success-foreground | `oklch(0.99 0.004 148)` |
| warning | `oklch(0.47 0.085 68)` |
| warning-foreground | `oklch(0.99 0.004 68)` |
| destructive | `oklch(0.50 0.16 28)` |

### Dark theme

| Role | Value |
| --- | --- |
| background | `oklch(0.195 0.009 65)` |
| foreground | `oklch(0.935 0.008 80)` |
| card | `oklch(0.235 0.010 65)` |
| primary | `oklch(0.745 0.12 42)` |
| primary-hover | `oklch(0.80 0.095 42)` |
| primary-foreground | `oklch(0.22 0.018 40)` |
| secondary | `oklch(0.29 0.012 65)` |
| secondary-foreground | `oklch(0.91 0.008 80)` |
| muted | `oklch(0.26 0.010 65)` |
| muted-foreground | `oklch(0.73 0.012 75)` |
| accent | `oklch(0.315 0.035 45)` |
| accent-foreground | `oklch(0.83 0.075 42)` |
| border | `oklch(0.34 0.010 65)` |
| input | `oklch(0.55 0.012 65)` |
| success | `oklch(0.76 0.09 148)` |
| success-foreground | `oklch(0.22 0.018 148)` |
| warning | `oklch(0.79 0.095 75)` |
| warning-foreground | `oklch(0.22 0.018 68)` |
| destructive | `oklch(0.75 0.13 28)` |

Use primary for actions and active navigation. Pair filled actions with primary-foreground, never a fixed text color. Hover uses primary-hover rather than transparency. Card is the raised reading and input surface; muted groups supporting controls and metadata. Success and warning communicate positive and negative verdicts, with labels and pressed states so meaning does not depend on color. Inactive verdict buttons remain neutral.

Measured text pairs meet 4.5:1 in both themes, including muted text on muted surfaces. Input borders meet 3:1 against their card surface. Decorative dividers intentionally remain softer.

## Typography

- Use Geist Sans for product UI, headings, controls, and body copy.
- Use Geist Mono for labels, commands, identifiers, ranks, counts, URLs, and tabular data.
- Fixed scale only:
  - Page title: `1.875rem` mobile / `2.25rem` desktop, line-height `1.25`; homepage hero `2.25rem` / `3rem`
  - Section title: `1.5rem`, line-height `1.2`
  - Row/card title: `1rem` to `1.25rem`, line-height `1.25`
  - Body: `0.875rem` to `1rem`, line-height `1.5` to `1.7`
  - Metadata: `0.75rem` to `0.8125rem`
- Letter spacing is `0` except uppercase metadata labels, which may use `0.14em`.
- Body prose should stay under `70ch`; list rows and metadata can be denser.

## Layout

- Default content frame: `72rem` maximum with `1rem / 1.5rem / 2rem` responsive side padding.
- Detail pages use `minmax(0, 1fr) 19rem` on desktop with a metadata rail.
- Spacing rhythm: `0.5rem`, `0.75rem`, `1rem`, `1.5rem`, `2rem`, `3rem`, `4rem`.
- Avoid landing-page hero bloat. The first viewport should show search, shortcuts, and at least a hint of discovery content.
- Mobile is one column. Card grids can move to two columns at medium widths, and three columns only when the content frame prevents truncation.

## Shape And States

- Radius: `0.375rem` default, `0.25rem` compact, `0.5rem` for dialogs and repeated cards only.
- Borders are `1px`; avoid decorative side-stripe accents.
- Focus states combine component rings with a solid 2px outline and 3px offset.
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

## Interaction and spacing refinements

- Buttons, inputs, and selects share a 40px default height, with 36px compact buttons and at least 44px for touch button targets.
- Compact discovery rows place verdicts beneath their description to preserve reading space. Mobile rows keep rank beside the content.
- The directory groups search and filters into one toolbar, with visible labels. Pagination brings the results into view and focuses the result summary.
- Ranking links are navigation; local ranking and file-view switches are pressed button groups, with native keyboard behavior.
- Skill metadata aligns with the heading in its own muted surface on desktop, and appears before the file preview on mobile. Install commands are displayed and copied exactly as supplied, with no extra runner prefix. Install copy is a secondary action with a stable footprint and visible feedback.
- Long skill previews have a bounded, focusable scroll region so discussion remains reachable.
- Informational pages use consistent top spacing, restrained titles, and a 70ch maximum reading column.
