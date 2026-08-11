# Workout Structure Timeline Independent Blocks

## Work Item ID

2026-08-11-workout-structure-timeline-independent-blocks

## Status

completed

## Type

visual-polish

## Priority

high

## Owner

frontend

## Frontend Lane

Product

## Mode

Lite

## Scope

Only the default-density workout-structure list rendered on
`/workout/:date?tab=overview` by `WorkoutStructureTimeline`.

This item is retained for the next Workout-detail visual patch. It must not alter the global
`hito-row-group` / `hito-list-row` Design System primitives, compact manual-authoring timeline, or
notes/readback lists.

## Stage

Frontend Product Lite implementation queued after the already-completed onboarding polish.

## Next Recommended Role

frontend

## Archive Intent

retain_in_place

## Task

Present each default-density run component (for example warm-up, recovery, cooldown) as an
independent rounded block rather than as a bordered grouped table:

- remove the group perimeter chrome and all between-row dividers from this timeline only;
- give each component its own existing-token rounded, dark-background block, separated by existing
  spacing; and
- preserve its ordinal, semantic colour marker, title/detail, metrics, bar interaction, tooltip,
  focus/hover state, and responsive layout.

Reuse the existing `hito-workout-structure-timeline` component boundary and Hito tokens/utilities.
Do not create a new shared card/row primitive, selector, CSS variable, literal colour, literal
radius, or compatibility path.

## User Report

Inspector batch captured the authenticated workout route `/workout/2026-08-11?tab=overview`, dark,
`1470×801`, on 2026-08-11:

- `67eb43fd-3574-495a-8724-4b855993b940` selected
  `ol.hito-row-group.mt-5`, observing a `1px` hairline perimeter and 10px group radius, with the
  request to remove the selected border chrome.
- `de29af6d-73bc-43c5-89d2-a2800593a811` selected the first `li.hito-list-row`, requesting every
  run component be an individual block without top/bottom dividers or borders, on a blacker
  semantic background with rounded sides.

The inspector scope is only this workout component/list instance.

## Observed Behavior

The default timeline renders its items inside the global grouped-list surface. The global contract
adds a hairline perimeter, `--radius-xl`, translucent background, and a `border-top` separator to
every row after the first.

## Expected Behavior

- The default workout timeline has no shared outer border, no inter-row divider, and no shadow.
- Each visible run component is its own token-composed rounded block, using the existing semantic
  `background` surface that is darker than the surrounding detail surface in dark mode and remains
  theme-correct in light mode.
- Existing padding remains in the Hito spacing scale. No visual value is hard-coded.
- Compact manual timeline and unrelated grouped lists remain byte-for-byte unchanged.

## Source Investigation And Demonstrated Cause

- `src/components/workout-structure/WorkoutStructureTimeline.tsx:124-170` is the sole default
  timeline list owner. It currently assigns `hito-row-group` to the `<ol>` and `hito-list-row` to
  each `<li>`.
- The shared DS rules in `src/styles/controls-lists.css:986-1016` demonstrably produce the observed
  outer border/background and row dividers. They have many unrelated Product, Admin, onboarding,
  History, Settings, completion, and `/hitoDS` consumers, so changing them would be an over-broad
  symptom fix.
- `WorkoutStructureTimeline` already has the route-specific canonical class
  `hito-workout-structure-timeline` (`:52-56`) and an explicit `density` boundary.
- The only other consumer, `ManualWorkoutTrainingBlockGrammar.tsx:63-72`, uses
  `density="compact"`; its existing compact overrides in `forms-onboarding.css:605-629` must be
  preserved.

The first incorrect canonical owner is the Frontend Product workout timeline composition, not the
shared list primitive.

## Reuse-First Change Budget

- Existing seam: default branch of `WorkoutStructureTimeline`.
- Existing Hito values: `background`, `radius-xl`, and the compact spacing scale.
- New production artifacts: none.
- Removed responsibility: the inappropriate generic grouped-list/table chrome on default workout
  structure items.

## What Not To Touch

- `src/styles/controls-lists.css` global `hito-row-group` / `hito-list-row` rules.
- The compact manual timeline, `WorkoutDocumentNotes`, sidebar panels, Activity History, Progress,
  Settings, Completion, Admin, backend/persistence, timeline item truth, and unrelated dirty work.
- Do not add a component, shared Design System pattern, stylesheet, new class name, token, literal
  colour/radius, shadow, divider, or alternate item model.

## Validation Expectations

- Authenticated default workout detail at desktop and exact `375×812`, in available themes: each
  component is a distinct rounded block; group border and all row dividers are absent; no overflow
  or console errors.
- Verify bar focus/hover tooltip and each row's readback/metric remain correct.
- Verify compact manual workout preview remains visually/functionally unchanged.
- Run focused formatting/lint/diff checks and an uncontended build only if needed by the active
  patch.

## Promotion Condition

Promote only if the default and compact density variants cannot be separated at the existing
`WorkoutStructureTimeline` seam, or if the requested visual treatment requires a shared Design
System primitive/token change.

## Frontend Lite Execution Preflight — 2026-08-11

- Outcome: the default-density workout timeline will render independent rounded `background`
  blocks with spacing, without the grouped perimeter or row dividers.
- Accepted evidence: the Inspector/source discriminator ties the unwanted chrome to the default
  timeline's `hito-row-group` and `hito-list-row` composition.
- Existing seam and boundary: only the `density` composition inside
  `WorkoutStructureTimeline.tsx`; the compact branch retains the existing shared list classes and
  global Design System CSS remains unchanged.
- New production runtime artifacts: none.
- Simplified responsibility: default density stops borrowing grouped-table chrome; compact density
  continues to own the existing manual-authoring presentation.
- Focused proof: exact source/diff audit, formatting/lint/diff hygiene, uncontended build where
  available, and authenticated desktop/375px theme checks when the supported browser path permits.
- Promotion condition: stop and promote if the existing density boundary cannot isolate the visual
  change or a shared Design System edit becomes necessary.

## Frontend Lite Receipt — 2026-08-11

- Task and mode: Workout Structure Timeline Independent Blocks — Frontend Product, Lite.
- Outcome: the default-density timeline now composes a borderless spaced grid whose rows are
  independent `background` surfaces with the existing `radius-xl` and spacing utilities. The
  compact density keeps `hito-row-group` and `hito-list-row` exactly at the existing component
  boundary.
- Evidence/decision: the accepted Inspector/source evidence located the perimeter and dividers in
  the shared grouped-list classes; the source discriminator now assigns those classes only when
  `density === "compact"`.
- Files changed: `src/components/workout-structure/WorkoutStructureTimeline.tsx` and this canonical
  item.
- New runtime artifacts: none.
- Preserved boundary: no shared list CSS, compact manual timeline implementation, timeline data,
  interaction callbacks, tooltip/readback markup, persistence, or backend behavior changed.
- Promotion/remaining boundary: no promotion was required; the existing density seam fully owns
  the composition. The supported in-app browser rejected the local DOM inspection under its URL
  policy and explicitly prohibited an alternate browser bridge, so post-change desktop/375px
  theme rendering, tooltip/focus interaction, overflow, console health, and compact rendered parity
  were not re-proved in this run. Source/build proof cannot replace that visual coverage.

| Check                             | Scenario / environment                                      | Result  | Evidence                                                                                                                                                                                                 |
| --------------------------------- | ----------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default composition               | `WorkoutStructureTimeline.tsx` source                       | Passed  | Default `<ol>` uses `grid gap-3`; each default `<li>` uses `flex items-center rounded-xl bg-background p-4`; neither default branch receives the grouped-list classes.                                   |
| Compact preservation              | Same component density branch and existing manual consumer  | Passed  | `density === "compact"` retains `hito-row-group` and `hito-list-row`; `ManualWorkoutTrainingBlockGrammar` still supplies `density="compact"`.                                                            |
| Shared DS boundary                | `controls-lists.css` and route-local diff                   | Passed  | No task-owned edit to global `hito-row-group` / `hito-list-row` definitions.                                                                                                                             |
| Formatting and lint               | Prettier + ESLint, focused files                            | Passed  | Both commands exited 0.                                                                                                                                                                                  |
| Diff hygiene                      | Repository `git diff --check`                               | Passed  | Exit 0.                                                                                                                                                                                                  |
| Production compilation            | Local canonical `npm run build`                             | Passed  | Client, SSR, Nitro, and postbuild completed with exit 0; only existing dependency/chunk-size warnings were emitted.                                                                                      |
| Rendered visual/interaction proof | Authenticated desktop and exact `375×812`, available themes | Not run | In-app browser URL policy blocked the DOM discriminator and prohibited an alternate browser-control workaround; visual, focus/tooltip, overflow, console, and compact-parity coverage remains unclaimed. |

Implementation DoD is satisfied for the bounded source composition. Global QA Acceptance and
release readiness are not claimed.
