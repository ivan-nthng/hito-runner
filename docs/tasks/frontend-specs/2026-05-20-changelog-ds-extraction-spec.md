# Changelog DS Extraction Spec

## Status

backlog

## Type

frontend_spec

## Priority

medium

## Next Recommended Role

FRONTEND

## Task

Audit the `/changelog` page, identify which parts already use Hito DS, identify custom patterns worth preserving, and extract the reusable changelog patterns into the canonical design system without changing product behavior.

## Stage

FRONTEND implementation spec

## Exact Handoff Prompt

```text
ROLE: FRONTEND

TASK:
Audit the `/changelog` page, identify which parts already use Hito DS, identify custom patterns worth preserving, and extract the reusable changelog patterns into the canonical design system without changing product behavior.

STAGE:
FRONTEND implementation spec

CONTEXT:
- Source path: docs/tasks/frontend-specs/2026-05-20-changelog-ds-extraction-spec.md
- Markdown metadata is canonical for this repo-derived admin Backlog item.
- Supabase mirrors this item for discovery and prompt copy only.

CONSTRAINTS:
- Edit this markdown file, not the admin Backlog mirror, when task truth changes.
- Preserve Hito canonical architecture and current role boundaries.
- Do not broaden scope beyond this work item.

OUTPUT:
Use the project role output format.
```

## Owner

Design System Agent

## Last Updated

2026-05-20

## Why This Exists

The changelog page contains a few strong patterns that are visually successful and likely reusable:

- the year / month / day date treatment
- the calm timeline list structure
- the warm yellow text tag with the tinted backdrop

But those patterns are not consistently represented in Hito DS yet.

Some changelog pieces already reuse DS.
Some are still route-local.
One visible class is referenced in the route but is not defined in the canonical CSS contract.

This spec defines what Frontend should extract and what should remain local.

## Current Audit Summary

Not everything on `/changelog` uses Hito DS today.

### Already Using Hito DS

These are already canonical or mostly canonical:

- page background and foreground
- `hito-micro-label` back link
- `hito-page-title`
- `hito-body`
- `hito-body-small`
- `hito-tabs`
- `hito-tab`
- `hito-panel-title`

Primary references:

- [src/routes/changelog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/changelog.tsx:52)

### Still Custom Or Route-Local

These are still local and should be classified explicitly:

- year label styling
- month label styling
- day number styling
- timeline grid layout
- highlight and milestone cards
- the small glowing dot markers
- the warm yellow text tag with tinted backdrop
- inline code chip styling inside changelog copy
- empty state card

Primary references:

- [src/routes/changelog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/changelog.tsx:177)
- [src/routes/changelog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/changelog.tsx:285)
- [src/routes/changelog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/changelog.tsx:331)
- [src/routes/changelog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/changelog.tsx:381)

### Important Bug / Drift

The route uses `hito-status`, but the canonical stylesheet currently defines `hito-status-pill`, not `hito-status`.

That means the yellow badge treatment is not a real canonical DS primitive yet.

Reference:

- [src/routes/changelog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/changelog.tsx:350)
- [src/styles.css](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/styles.css:2171)

## Classification

### Canonical

- page title and top summary copy
- tabs
- shared body and panel-title typography

### Candidate For DS Extraction

- editorial timeline date treatment
- highlight tag with tinted backdrop
- changelog entry card family
- inline changelog code chip

### Keep Local For Now

- exact timeline grid composition as a route-level layout
- markdown-derived highlight grouping logic in `src/lib/changelog-utils.ts`

### Visualization / Data Exception

Date parsing, grouping, and highlight derivation logic are reusable product utilities, but they are not DS primitives.
They should stay in `src/lib/changelog-utils.ts`.

References:

- [src/lib/changelog-utils.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/changelog-utils.ts:64)
- [src/lib/changelog-utils.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/changelog-utils.ts:105)
- [src/lib/changelog-utils.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/changelog-utils.ts:181)

## Extraction Decisions

## 1. Date Treatment Must Become A DS Pattern

### Why

The date treatment is one of the strongest parts of the page.
It already has three distinct roles:

- year
- month
- day

It is likely reusable for:

- changelog
- future history views
- release notes
- archive lists
- plan-history or audit-history views if those ever become visible

### What To Extract

Create a small timeline-date family in `src/styles.css`.

Recommended minimal classes:

- `hito-timeline-year`
- `hito-timeline-month`
- `hito-timeline-day`

Optional only if needed:

- `hito-timeline-date-column`

### What This Family Should Own

- serif family usage
- clamp sizing for the large date text
- tight leading
- negative tracking
- muted-vs-foreground contrast differences between year and month/day

### What This Family Should Not Own

- grid column widths
- sticky container layout
- timeline route composition

Those should stay route-level until another surface proves the same structure is repeated.

## 2. Yellow Highlight Tag Must Become A Real DS Primitive

### Why

The yellow text with the warm tinted backdrop is visually strong and clearly useful beyond changelog.
It works as a compact pre-title classifier.

It is not the same thing as `hito-status-pill`.

`hito-status-pill` is a semantic state chip.
This changelog tag is a heading-adjacent classification tag.

### Required DS Decision

Do not force this into `hito-status-pill`.
Create a separate primitive.

Recommended name:

- `hito-highlight-tag`

If Frontend finds a better semantic name, it must still preserve this role distinction:

- not a pill
- not a button
- not a micro-label
- not a generic badge framework

### Required Variants

Keep this small.

Recommended variants:

- `default`
- `signal`
- `muted`

For changelog highlights:

- highlighted entries use `signal`
- fallback entries use `muted`

### Expected Reuse

This primitive may be reused for:

- changelog classification
- heading prefaces
- section pre-title tags
- compact release-note labels

It should not become a full taxonomy system.

## 3. Changelog Entry Card Family Should Become A DS Composition Primitive

### Why

The list item structure is working well and appears repeatedly on the page.
There are at least two real variants:

- standard technical entry
- highlight entry

### What To Extract

Create a small composition family rather than a generic card framework.

Recommended minimal classes:

- `hito-timeline-entry`
- `hito-timeline-entry[data-tone="signal"]`
- `hito-timeline-entry[data-tone="neutral"]`
- `hito-timeline-entry-dot`
- `hito-timeline-entry-body`

This is intentionally narrow.
Do not build a new “content card system”.

### What Must Stay Narrow

- keep the glow subtle
- keep the radius and padding aligned with current Hito surface rules
- keep this family focused on editorial timeline rows, not all cards everywhere

## 4. Inline Code Chip Should Become Canonical

### Why

The code chip currently uses route-local styling.
It is small but clearly reusable across:

- changelog
- docs-like utility surfaces
- inline technical labels

### What To Extract

Create a single shared inline-code treatment.

Recommended name:

- `hito-inline-code`

### Guardrail

Do not broaden this into markdown rendering infrastructure.
Only canonicalize the visible inline code chip treatment.

## 5. Empty State Can Reuse Existing DS Surface

### Decision

Do not invent a changelog-specific empty-state component.

Instead:

- migrate `EmptyChangelogState` to a canonical surface plus canonical text roles
- only extract new surface helpers if the current DS surface family cannot represent it cleanly

## Exact Findings By Element

## Header

### State

Mostly canonical

### Uses DS

- `hito-micro-label`
- `hito-page-title`
- `hito-body`
- `hito-body-small`

### Keep

Keep this mostly as-is.

## Tabs

### State

Canonical

### Uses DS

- `hito-tabs`
- `hito-tab`

### Keep

No new DS work needed here.

## Year / Month / Day Labels

### State

Custom

### Why

They use route-local `font-serif`, local clamp size, local tracking, and local contrast.

References:

- [src/routes/changelog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/changelog.tsx:183)
- [src/routes/changelog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/changelog.tsx:210)
- [src/routes/changelog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/changelog.tsx:229)

### Action

Extract to DS.

## Technical Entry Cards

### State

Custom

### Why

They use route-local background, radius, padding, and dot styling.

References:

- [src/routes/changelog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/changelog.tsx:285)

### Action

Extract the repeated entry-card family into DS.

## Highlight Cards

### State

Custom and high-value

### Why

They use route-local warm-tinted surfaces, glow, dot, and the highlighted text tag.

References:

- [src/routes/changelog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/changelog.tsx:331)

### Action

Extract:

- highlight tag
- reusable editorial timeline card tone

Keep route-level layout local.

## Yellow Highlight Tag

### State

Not canonical

### Why

It uses `hito-status`, but that class does not exist in the DS contract.

### Action

Replace it with a real DS primitive.

## Inline Code

### State

Custom

### Why

It uses route-local inline styling.

### Action

Extract to DS.

## Data / Logic Layer

### State

Reusable utility logic, not design-system work

### Why

`parseChangelog`, month/year grouping, date formatting, and highlight derivation are good reusable logic seams.

### Action

Keep them where they are.
Do not move them into DS.

## Implementation Order

1. Add the new DS primitives to `src/styles.css`.
2. Document them in `/hitoDS`.
3. Migrate `src/routes/changelog.tsx` to those primitives.
4. Remove local route styling only after the DS primitives are in place.
5. Verify no visual regression on `/changelog`.

## Files In Scope

- `src/styles.css`
- `src/routes/hitoDS.tsx`
- `src/routes/changelog.tsx`

Do not change:

- `src/lib/changelog-utils.ts`
- parsing behavior
- grouping behavior
- highlight classification behavior

## Required `/hitoDS` Additions

Add a new small section under composition or create a new section if that is clearer.

It must show:

- timeline date roles
- highlight tag variants
- timeline entry variants
- inline code chip

It must explicitly explain:

- `hito-status-pill` is for semantic state
- `hito-highlight-tag` is for title-adjacent classification

## Validation

### Static

- `npm run build`
- `git diff --check`

### Browser

Use Safari first.

Check:

- `/changelog`
- highlights tab
- technical log tab
- long month/year lists
- fallback highlight row
- inline code rendering

Verify:

- the date column still feels editorial and calm
- the yellow tag remains visually strong
- the list remains readable
- tab switching still works
- no spacing collapse
- no heading hierarchy regression

## Frontend Handoff Prompt

```md
You are FRONTEND.

Task:
Extract the reusable changelog patterns into Hito DS and migrate `/changelog` to them.

Stage:
FRONTEND implementation

Context:
The changelog page already reuses some Hito DS primitives for title, body, tabs, and panel titles, but the timeline dates, highlight tag, entry cards, and inline code treatment are still route-local. The warm yellow highlight tag currently uses `hito-status`, which is not a canonical DS class.

Goal:
Preserve the current changelog look that works well, but move the reusable parts into `src/styles.css` and `/hitoDS` so they become real Hito DS primitives.

Scope:
- `src/styles.css`
- `src/routes/hitoDS.tsx`
- `src/routes/changelog.tsx`

Requirements:
- preserve product behavior and copy
- keep changelog logic in `src/lib/changelog-utils.ts`
- extract timeline date roles into DS
- create a real DS primitive for the warm highlighted text tag
- extract the repeated timeline entry card family narrowly
- extract the inline code chip treatment
- do not introduce a badge framework or content-card framework
- keep route-level timeline layout local unless a second surface proves reuse

Validation:
- run focused static checks
- inspect `/hitoDS`
- inspect `/changelog` in Safari

Output format:
1. Task
2. Stage
3. Root cause
4. Files changed
5. What changed
6. Validation results
7. Blockers
```

## QA Handoff Prompt

```md
You are QA.

Task:
Validate the changelog DS extraction slice.

Stage:
QA validation

Context:
Frontend extracted reusable changelog patterns into Hito DS and migrated `/changelog` away from route-local styling where appropriate.

Scope:
- `/changelog`
- `/hitoDS` entries for the new changelog-derived primitives

Requirements:
- use Safari
- verify the date treatment still feels editorial and premium
- verify the yellow highlight tag still reads clearly and does not look like a generic pill
- verify the list remains readable and calm
- verify highlights and technical log still feel related but distinct
- report any remaining route-local drift that should have become canonical

Output format:
1. Task
2. Stage
3. Findings
4. System alignment
5. Regression risk
6. Required follow-up
7. Blockers
```
