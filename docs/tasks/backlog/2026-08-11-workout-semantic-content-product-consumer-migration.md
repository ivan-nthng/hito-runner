# Workout Semantic Content Product Consumer Migration

## Work Item ID

2026-08-11-workout-semantic-content-product-consumer-migration

## Status

completed

## Type

frontend-product-contract

## Priority

high

## Owner

frontend

## Lane

Product

## Mode

Tracked

## Scope

Adopt the completed shared workout-type semantic `content` tone in existing Product consumers where
a workout type is rendered as text or an icon on a neutral or soft surface. Preserve `base` for
solid identity markers, dots, swatches, bars, and chart fills, plus `foreground` for content on a
solid `base` fill.

This is consumer adoption only. It must not change Design System token values, shared token/helper
contracts, persistence, calendar truth, workout content, or the section-role family.

## Archive Intent

retain_in_place

## Task

Replace the demonstrated Product misuse of workout `base` as neutral-surface text/icon content with
the already implemented shared `content` slot. Do so only where the existing source map proves the
rendered element is text/icon identity; retain solid identity visuals on `base`.

## User Outcome

Workout colour identity remains recognisable in Light and Dark while labels and icons stay readable.
Calendar dots, bars, legend swatches, charts, and other solid graphics retain their existing
identity fill semantics.

## Design Decision And Evidence

- [Workout Semantic Color Theme Contrast Decision](./2026-08-11-workout-semantic-color-theme-contrast-decision.md)
- [Workout Semantic Color Theme Contract Implementation](./2026-08-11-workout-semantic-color-theme-contract-implementation.md)

The shared token contract passed browser-computed contrast in Light/Dark/System. It exposes
`base`, `foreground`, and `content` distinctly for every workout type. The latter is mandatory for
hue-identifying text/icons on neutral/soft surfaces; `base` is a solid fill, not universal content.

## Existing Consumer Map

### Inspect and adopt `content` where the element is text or a neutral-surface icon

1. `src/lib/training.ts`
   - Preserve the existing base identity field for solid consumers.
   - Expose the already shared `content` value separately; do not silently redefine the existing
     base field used by markers.
2. `src/components/TodayHero.tsx` and `src/routes/workout.$date.tsx`
   - Keep adjacent dots on `base`.
   - Use `content` for workout labels and neutral-surface workout icons.
3. `src/components/Calendar.tsx`, `src/components/ui/hito-calendar-day.tsx`, and
   `src/components/calendar/calendar-projection.ts`
   - Give calendar identity a distinct content tone for labels/glyphs.
   - Keep projection markers and solid identity swatches on `base`.
4. `src/components/manual-workout/manual-workout-authoring-utils.ts` and the existing
   constructor/editor consumers
   - Keep indicator background/border/ring on `base`/`border`/`ring`.
   - Move the neutral constructor icon tone to `content`.

### Retain `base`; do not broaden this slice

- Selected-plan legend swatches, schedule bars, comparison/chart fills, and other solid identity
  graphics.
- Workout structure timeline and generated-plan bars; they use the separate section-role family.
- DS patterns/playgrounds and section-role parity; these are separate Design System follow-ups.

## Demonstrated Cause

Before the shared contract existed, Product consumers could only read the overloaded base identity
value. The Design System now separates semantic intent. Leaving Product textual/icon consumers on
`base` would preserve the prior contrast defect on neutral and soft theme surfaces.

## Reuse-First Change Budget

- Reuse the completed `content` slot, the existing workout token helper and domain mapping, current
  route components, icons, and calendar contracts.
- New runtime artifact: **none**. No new Product token, route-local colour recipe, CSS class,
  component, storage, or compatibility mapping is authorized.
- Replace only demonstrated base-as-content uses. Delete any route-local textual base override if
  one is found and its shared `content` replacement is live.

## What Not To Touch

- `src/styles/foundations.css`, `src/lib/workout-color-tokens.ts`, shared DS CSS, generated
  manifest, validators, or `/hitoDS`: the shared contract is accepted and read-only context.
- Calendar persistence, RLS/auth, plan lifecycle, workout payloads, backend actions, provider
  behavior, Figma, dependencies, hosted state, and unrelated dirty hunks.
- Solid base fills, section roles, typography geometry, layout, interaction, and factual content.

## Definition Of Done

1. Every classified Product text/icon consumer resolves workout identity through the shared
   `content` value, never through raw primitives or a route-local recipe.
2. Every classified solid visual remains on `base`; border/ring semantics remain unchanged.
3. Light/Dark representative Calendar, workout detail, Today, and manual-authoring views remain
   readable, contained, and interactionally unchanged.
4. No shared token contract or Product persistence behavior changes.
5. The migration map is closed with a source-backed retained/excluded consumer inventory.

## Validation Expectations

| Check          | Scenario / environment                                                           | Required evidence                                                                                     |
| -------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Consumer map   | Named source owners plus exact searches                                          | Every changed use is text/icon; retained base use is a solid visual.                                  |
| Visual/browser | Today, Calendar, workout detail, manual authoring; desktop and 375px, Light/Dark | Readable colour identity, no overflow, console/page errors, or changed workflow behavior.             |
| Interaction    | Calendar navigation/selection and workout route                                  | Existing markers, keyboard, and target actions remain functional.                                     |
| Static         | Task-owned source                                                                | Prettier, focused ESLint, `git diff --check`; Product contract validator if it covers a changed seam. |
| Build          | Uncontended current checkout                                                     | Production build/integrity if source changes extend beyond a local rendering class.                   |
| Boundaries     | Shared token and persistence owners                                              | No DS token mutation, raw local colour, or backend/persistence changes.                               |
| Runtime        | Fixture QA server                                                                | Restart it before the final receipt if task proof stops it.                                           |

## Stage

Frontend Product implementation and focused validation completed on 2026-08-11.

## Next Recommended Role

product

## Exact Frontend Handoff

```text
ROLE: FRONTEND

Frontend Lane: Product
Mode: Tracked

Execute exactly:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-workout-semantic-content-product-consumer-migration.md`

Use the completed shared Design System contract as read-only canonical context:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-workout-semantic-color-theme-contract-implementation.md`

Read `AGENTS.md`, `agents/frontend.agent.md`,
`skills/hito-frontend-design-system/SKILL.md`,
`skills/hito-qa-browser-regression/SKILL.md`, the complete task, and every named consumer owner
before the first write. Map every current Product use of workout identity before changing it.

Move only workout labels and neutral-surface icons from the existing shared base identity value to
the already available shared `content` value. Keep dots, markers, swatches, bars, charts, solid
identity fills, borders, and rings on their current shared slots. Do not alter the shared Design
System token/helper contract, add a local colour recipe/token/class, reinterpret `base`, or touch
persistence/Backend/Figma/section-role consumers.

Use bounded read-only QA/design review as needed. Verify the classified Today, Calendar, workout
detail, and manual-authoring states at desktop and exact 375px in Light/Dark, plus preserved
interaction, overflow, console health, focused static checks, and an uncontended build when
required. Restart fixture QA before the final English receipt if your proof stops it.

Do not stage, commit, push, deploy, access hosted state, call providers, or delete material data.
```

## Blockers

None. Do not start section-role parity or DS playground adoption in this Product slice.

## Frontend Product Execution Preflight — 2026-08-11

### Existing Seams And Smallest Change

- `workoutTypeMeta` retains `color` as the shared `base` identity value and exposes the accepted
  shared `content` value separately. No existing base field is reinterpreted.
- Today and workout detail keep their adjacent dot backgrounds on `meta.color`; only their workout
  label text and the neutral manual-preview glyph adopt `meta.content`.
- Calendar projection keeps `HitoCalendarWorkoutIdentity.color` on `base` and adds the separate
  optional `contentColor` consumed by `WorkoutLabel`. This preserves existing DS/demo data until
  its separately owned follow-up while Product projection supplies the accepted content tone.
- Calendar tooltip label text adopts `meta.content`; calendar markers, feedback dots, result
  markers, rings, and borders are unchanged.
- Manual authoring keeps template indicator background/border/ring on `base`/`border`/`ring`.
  `templateIconTone` adopts shared `content`, and the saved-template constructor deletes its local
  generic-colour icon recipe in favour of the existing template semantic path.

### Reuse-First Change Budget

- Existing canonical owner: `workoutTypeColorVar` and the completed `content` slot; read-only.
- Existing Product owners: the named metadata, Calendar identity, route, and manual-authoring
  consumers.
- New production runtime artifacts: none.
- Removed responsibility: the saved-template constructor no longer maintains a route-local
  `calendarIconToneColor` mapping from generic semantic colours.
- Shared token/helper/CSS changes: none; the pre-existing dirty shared contract files remain
  byte-for-byte outside this task.

### Observable Proof And Stop Boundary

- Source proof classifies every changed use as text or a neutral-surface glyph and retains every
  mapped solid dot/indicator/marker plus border/ring on its prior slot.
- Focused proof covers formatting, ESLint, exact retained/excluded searches, applicable Product/DS
  validators, diff hygiene, an uncontended build, and fixture browser checks for Today, Calendar,
  workout detail, and manual authoring at desktop and exact 375px in Light/Dark.
- Stop if a required consumer cannot distinguish base/content through the existing Product shape,
  or if the change would require shared DS, persistence, Backend, Figma, or section-role work.

## Frontend Product Tracked Implementation Receipt — 2026-08-11

### Product Outcome And Consumer Inventory

- `workoutTypeMeta` now exposes the accepted shared `content` slot while retaining `color` as the
  unchanged shared `base` identity value.
- Today and workout detail render their workout labels through `content`; their adjacent identity
  dots remain on `base`. The workout-detail manual-preview glyph also uses `content`.
- Calendar projection carries `contentColor` separately from its existing base `color` identity.
  Calendar day and tooltip labels use `content`; existing feedback/result markers and other solid
  identity graphics are unchanged.
- Manual authoring renders neutral-surface constructor glyphs through `content`. Template indicator
  backgrounds, borders, and rings remain on `base`, `border`, and `ring` respectively.
- The obsolete saved-template route-local generic-colour icon mapping and the now-unused base-tone
  helper were removed. No token, CSS recipe, component, persistence path, or runtime artifact was
  added.
- Retained exclusions: selected-plan legend swatches, schedule/timeline bars, comparison/chart
  fills, section-role graphics, and DS playground/example consumers remain outside this Product
  slice and on their existing semantic owners.

### Root Cause And Canonical Owner

The accepted shared Design System contract separated workout identity (`base`) from neutral-surface
content (`content`), while Product labels and glyphs still consumed the earlier overloaded base
value. The first incorrect owner was the classified Frontend Product consumer mapping. The fix uses
the existing shared helper without changing or reinterpreting the Design System contract.

### Files Changed

- `src/lib/training.ts`
- `src/components/TodayHero.tsx`
- `src/routes/workout.$date.tsx`
- `src/components/Calendar.tsx`
- `src/components/ui/hito-calendar-day.tsx`
- `src/components/calendar/calendar-projection.ts`
- `src/components/manual-workout/manual-workout-authoring-utils.ts`
- `src/components/manual-workout/ManualWorkoutAuthoringControls.tsx`
- this canonical lifecycle item

### Validation Inventory

| Check                   | Scenario / environment                                                           | Result                        | Evidence                                                                                                                                                                                                                                                            |
| ----------------------- | -------------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consumer classification | Named Product owners plus focused retained/excluded searches                     | Passed                        | Labels and neutral glyphs resolve through `content`; mapped dots and template indicators retain `base`, `border`, and `ring`; removed helpers have zero remaining references.                                                                                       |
| Runtime semantic values | Direct TypeScript module discriminator                                           | Passed                        | Tempo/easy metadata expose distinct `base` and `content`; Calendar identity carries unchanged `color=base` plus `contentColor=content`.                                                                                                                             |
| Today and Calendar      | Managed `qa_fixture`, 1280x720 and exact 375x812, Light/Dark                     | Passed                        | Computed label styles resolve `--hito-workout-type-*-content`; adjacent Today dot stays `--hito-workout-type-tempo-base`; both viewports have `scrollWidth === clientWidth`.                                                                                        |
| Workout detail          | `/workout/2026-08-11?tab=overview`, 1280x720 and exact 375x812, Light/Dark       | Passed                        | Header label resolves `content`, identity dot resolves `base`, both layouts remain contained, and ordinary Calendar-to-workout navigation succeeds.                                                                                                                 |
| Manual authoring        | Empty Aug 12 -> Choose template -> Tempo, 1280x720 and exact 375x812, Light/Dark | Passed                        | Constructor neutral-surface glyph resolves `--hito-workout-type-tempo-content`; template swatches remain base/border/ring; dialog and page stay contained.                                                                                                          |
| Interaction and state   | Calendar view controls, workout navigation, manual dialog focus/close            | Passed                        | Month/Week selection remains functional, native navigation succeeds, dialog focus advances within the existing trap, close returns to Calendar, and Aug 12 remains an empty Add-workout target with no new workout link.                                            |
| Browser console         | Full focused browser run                                                         | Passed                        | No console errors or warnings.                                                                                                                                                                                                                                      |
| Formatting and lint     | Task-owned source                                                                | Passed                        | Prettier and focused ESLint complete without findings.                                                                                                                                                                                                              |
| Product contracts       | `npm run validate-product-contracts`                                             | Passed                        | Heart-rate guidance and workout comparison readback contract checks passed.                                                                                                                                                                                         |
| Design System validator | `npm run validate-hito-ds-components`                                            | External pre-existing failure | The unchanged Local Inspector dependency on `@/generated/hito-ds-manifest` remains the sole reported failure, matching the accepted shared-contract receipt; no changed workout semantic assertion failed. Full DS validator green status is therefore not claimed. |
| Diff hygiene            | Current dirty checkout                                                           | Passed                        | `git diff --check` passes; task diff is limited to the eight classified Product source files and this lifecycle record.                                                                                                                                             |
| Production build        | Uncontended current checkout                                                     | Passed                        | Vite client/SSR and Nitro production build completed successfully; only existing dependency/chunk warnings were emitted.                                                                                                                                            |

### Preserved Boundaries, Coverage, And Next Owner

- Shared Design System tokens/helpers/CSS, section-role consumers, Product persistence, Backend,
  auth, providers, Figma, and unrelated dirty work were not changed.
- A direct Calendar-toggle keyboard activation could not be observed through the selected browser
  controller; the controls remain native, focusable buttons with unchanged handlers, pointer
  selection was replayed, and the manual-dialog keyboard focus path was replayed. This limits only
  a redundant physical keyboard replay of an unchanged control, not the colour migration proof.
- Implementation DoD is complete. Global QA Acceptance and release readiness are not claimed.
- Next owner: Product. No blocker remains in this Frontend slice.
