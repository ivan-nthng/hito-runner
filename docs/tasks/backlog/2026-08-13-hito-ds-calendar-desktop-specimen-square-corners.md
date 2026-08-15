# Hito DS Calendar Desktop Specimen Square Corners

## Work Item ID

`2026-08-13-hito-ds-calendar-desktop-specimen-square-corners`

## Status

`completed`

## Type

Lite — bounded Design System reference visual repair

## Priority

P1

## Owner

DESIGN SYSTEM

## Scope

`/hitoDS/components#calendar-workout-playground`, desktop Calendar Demo and desktop Calendar
Variants only, owned by `src/components/hito-ds/calendar-workout-playground.tsx`.

## Task

Make the desktop Calendar specimen show the original square calendar-cell geometry. Remove only the
local `rounded-xl` clipping from the two desktop preview wrappers. Preserve their current border,
background, dimensions, Cell state rendering, and all mobile row rendering.

## User Report

The desktop Calendar specimen shows a rounded perimeter although the product calendar cell is
square. When `today` is selected, the rounded clipping cuts its corners and looks visibly wrong.
The mobile calendar cell is already correct and must remain unchanged.

## Evidence And Root Cause

The shared `HitoCalendarDayCell` has no rounded-cell recipe. The two desktop-only wrappers in
`CalendarDemoStage` and `CalendarVariantsStage` add:

`hito-calendar-grid-container min-w-0 overflow-hidden rounded-xl border border-hairline bg-background/25`

Their `rounded-xl` plus `overflow-hidden` clips the shared cell's `today` outline. The mobile branch
uses `HitoWorkoutDayRow` and does not enter either wrapper.

**First incorrect owner:** those two route-local desktop specimen wrapper class lists, not the shared
calendar cell, Product Calendar, or mobile row.

## Boundaries

- Change only `src/components/hito-ds/calendar-workout-playground.tsx`.
- Delete only the two `rounded-xl` utilities. Do not change the shared `HitoCalendarDayCell`,
  Calendar Product route, mobile branch, tokens, CSS, border, fill, state logic, or interaction.
- New runtime artifacts: none.

## Focused Proof

- Source discriminator: the two desktop wrapper classes no longer include `rounded-xl`; mobile
  branches are byte-stable.
- `/hitoDS/components#calendar-workout-playground`: desktop `today` Demo and Variant retain square
  edges with an uncropped outline; mobile row is unchanged.
- Focused Prettier, ESLint, and `git diff --check`.

## Promotion Condition

Promote to Tracked and return to PRODUCT only if the two local removals do not resolve the clipping,
or if the proven repair requires shared calendar, Product, mobile, CSS, token, or another owner.

## Execution Preflight — 2026-08-13

- **Outcome:** desktop Calendar Demo and Variants retain their current frame and state rendering but no longer impose rounded clipping on the square shared day cell or its `today` outline.
- **Evidence / accepted decision:** the current source still contains exactly two desktop-only `hito-calendar-grid-container` wrappers with `overflow-hidden rounded-xl`; `HitoCalendarDayCell` owns a square `today` inset outline and has no rounding contract. Both mobile branches render `HitoWorkoutDayRow` outside those wrappers.
- **Owner / boundary:** `src/components/hito-ds/calendar-workout-playground.tsx` is the first incorrect owner. Its pre-write SHA-256 is `b1ab341572f9abf77fb48c48e8200477972a018f9e72d4b9c1df7f987b686d19` and it has no pre-existing diff. Shared Calendar primitives, Product Calendar, CSS/tokens, and every mobile line remain read-only.
- **Existing seam / smallest change:** remove only `rounded-xl` from the two desktop wrapper class lists; preserve `hito-calendar-grid-container`, `min-w-0`, `overflow-hidden`, `border border-hairline`, `bg-background/25`, layout, state props, and content.
- **New runtime artifacts:** none. The obsolete responsibility removed is only the two route-local desktop corner radii; no helper, file, class, token, or compatibility path is introduced.
- **Focused proof:** exact source/diff discriminator plus focused Prettier, ESLint, and `git diff --check`; confirm both desktop wrappers have zero radius utilities and both mobile `HitoWorkoutDayRow` branches remain outside the diff.

## Browser Path Preflight — 2026-08-13

- **Validation layer:** focused Lite Implementation DoD only; not Global QA, release, or Product Calendar acceptance.
- **Path:** use only the existing managed loopback QA runtime and a supported non-prompting local browser. Because visible source changed, rebuild/restart only through the canonical managed fixture procedure; do not start an ad hoc server.
- **Focused states:** `/hitoDS/components#calendar-workout-playground` with Overlay = `today`. Verify desktop Demo and desktop Variants compute square wrapper corners and retain the complete inset `today` outline. Switch the existing View control to Mobile and confirm the branch renders `HitoWorkoutDayRow` with its existing mobile geometry and no source-owned change.
- **Preservation checks:** wrapper border/background/overflow remain, tab/state behavior remains, document horizontal overflow is zero, and no console warning/error appears.

## Lite Implementation Receipt — 2026-08-13

- **Task / mode:** Hito DS Calendar Desktop Specimen Square Corners; Lite one-source visual repair.
- **Outcome / root cause:** removed only the two route-local `rounded-xl` utilities from `CalendarDemoStage` and `CalendarVariantsStage`. The desktop wrappers remain square, so their retained `overflow-hidden` no longer rounds or clips the shared cell's inset `today` outline.
- **Files changed:** `src/components/hito-ds/calendar-workout-playground.tsx` and this canonical lifecycle/receipt. Production diff is exactly two class-list replacements; new runtime artifacts are `none`.
- **Preserved source:** both wrappers retain `hito-calendar-grid-container`, `min-w-0`, `overflow-hidden`, `border border-hairline`, `bg-background/25`, layout and all state props. Both `HitoWorkoutDayRow` mobile branches, the shared `HitoCalendarDayCell`, Product Calendar, CSS, and tokens are byte-stable.
- **Focused source proof:** desktop rounded-wrapper reachability is `0`; expected square desktop-wrapper count is `2`; mobile-row source count remains `2`. Focused Prettier, ESLint, and `git diff --check` pass.
- **Focused browser proof:** a fresh managed `qa_fixture` bundle rendered `/hitoDS/components#calendar-workout-playground`. Demo computed one square wrapper (`border-radius: 0`, retained `overflow: hidden`, 1px border/background) and one complete 1px solid `today` outline at `-1px` offset. Variants computed three square wrappers and the selected Today specimen retained the same complete outline. Mobile Variants rendered three rows and Mobile Demo rendered one row with zero desktop wrappers; the existing mobile 10px radius and 1px border remained. Document horizontal overflow and console warning/error counts were zero.
- **Promotion / remaining boundary:** no promotion condition was reached and no task-owned blocker remains. Product Calendar acceptance, Global QA, release readiness, staging, commit, push, and deployment are not claimed.
- **Role file:** `agents/design-system.agent.md`.
- **Skills used:** `skills/hito-frontend-design-system/SKILL.md` and, for focused visual proof, `skills/hito-qa-browser-regression/SKILL.md`.
- **Subagents:** none; the bounded source/browser discriminator was sufficient.

## Exact Execution Prompt

```text
ROLE: DESIGN SYSTEM

Task: Hito DS Calendar Desktop Specimen Square Corners
Mode: Lite — one source-owned visual repair.

Read AGENTS.md, agents/design-system.agent.md, skills/hito-frontend-design-system/SKILL.md, and
docs/tasks/backlog/2026-08-13-hito-ds-calendar-desktop-specimen-square-corners.md.

Root cause:
`CalendarDemoStage` and `CalendarVariantsStage` in
`src/components/hito-ds/calendar-workout-playground.tsx` each wrap the desktop
`HitoCalendarDayCell` in an `overflow-hidden rounded-xl` container. That rounded clipping cuts the
shared cell's `today` outline. The shared cell and the mobile `HitoWorkoutDayRow` are not incorrect.

Implement the smallest fix: remove `rounded-xl` from those two desktop-only wrapper class lists.
Keep their existing border, background, layout, state rendering, and all mobile code unchanged.
Do not edit shared calendar primitives, Product Calendar, CSS, tokens, or add files/helpers.

Validate the desktop today Demo and Variant have square, uncropped edges and the mobile row is
unchanged. Run focused Prettier, ESLint, and diff hygiene. Return a Lite receipt in English; do not
claim Global QA, release, or Product-calendar acceptance.
```

## Lifecycle Note

Created by PRODUCT from a screenshot and source-backed discriminator. No execution was dispatched
while the canonical DESIGN SYSTEM role was active on a different task.
