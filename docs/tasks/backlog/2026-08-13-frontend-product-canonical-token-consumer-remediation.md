# Frontend Product Canonical Token Consumer Remediation

## Work Item ID

2026-08-13-frontend-product-canonical-token-consumer-remediation

## Status

completed

## Type

frontend-cleanup

## Priority

high

## Owner

frontend

## Lane

Product

## Mode

Tracked

## Stage

Frontend Product implementation and focused owner acceptance completed.

## Next Recommended Role

PRODUCT — review the completed implementation receipt and decide whether the separate independent
fixture-coverage gap warrants a dedicated QA fixture task.

## Scope

Repair only the Product-owned consumer bypasses confirmed by
[the canonical adherence audit](2026-08-13-hito-ds-canonical-token-adherence-and-exception-census.md):

1. Replace Product focus cues that bypass the existing solid `ring` role.
2. Converge the Product-only Activity History row hover on the existing neutral chrome ladder.
3. Reuse the existing Hito Button contracts in the two route fallback renderers.
4. Replace confirmed authenticated/Product ordinary text-opacity utilities with existing semantic
   foreground or supporting-text roles, selected by content purpose.

This is not a Design System primitive, token, CSS, manifest, validator, `/hitoDS`, Marketing, or
Backend task. Those audit rows remain with their demonstrated owners.

## User Problem

The design audit proved that a bounded group of live Frontend Product consumers still uses local
alpha focus, hover, button, and text recipes after the canonical Design System contracts were
established. The result is inconsistent keyboard focus and text hierarchy despite existing
theme-aware roles.

## Evidence And Demonstrated Cause

The completed audit establishes the first incorrect owner and existing replacement for every
included seam:

| Concern                   | Product-owned seam                                                                                                                                                                                                                                                                                      | Existing canonical replacement                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Focus                     | `src/components/Calendar.tsx:592-595,621,658`; `src/components/progress/ActivityHistoryPanel.tsx:146`; `src/components/workout-structure/WorkoutStructureTimeline.tsx:87-98`                                                                                                                            | `ring-ring` / `outline-ring`; keep workout semantic glow as a separate state layer                                            |
| Neutral hover             | `src/components/progress/ActivityHistoryPanel.tsx:146` foreground `3.5%` row hover                                                                                                                                                                                                                      | Existing neutral chrome ladder; expected rest-to-hover mapping is clear to subtle                                             |
| Fallback actions          | `src/router.tsx:41-48`; `src/routes/__root.tsx:20-25`                                                                                                                                                                                                                                                   | Existing Hito Button primary and outlined/secondary contracts                                                                 |
| Ordinary text attenuation | `Calendar.tsx:774`; `CompletionPanel.tsx:279,1022`; `OnboardingGate.tsx:480`; `TodayHero.tsx:154,231`; `progress/SavedPlanLibraryPanel.tsx:568`; `workout-structure/WorkoutStructureTimeline.tsx:163`; `routes/index.tsx:103`; `routes/progress.tsx:78`; `routes/workout.$date.tsx:416,422,504,795,885` | Primary action/title: `foreground`; supporting copy/metadata: `text-secondary`; tertiary only for established caption meaning |

The cause is consumer-level class composition retaining local percentages and duplicate fallback
action geometry, rather than a missing Foundation token. The exact audit rows are at
`2026-08-13-hito-ds-canonical-token-adherence-and-exception-census.md:232-237`.

## Existing Seams And Change Budget

- Reuse the existing Hito focus, neutral-chrome, Button, foreground, and text-secondary contracts.
- New runtime artifacts: none.
- Do not add helper abstractions, local tokens, aliases, Button variants, percentage roles, or a
  parallel focus framework.
- Delete each superseded Product utility/recipe in scope when its canonical replacement is applied.

## What Not To Touch

- Shared primitives, Foundation tokens, canonical Design System CSS, shared `components/ui/`,
  generated manifests, validators, and `/hitoDS` reference surfaces.
- Marketing/Admin-only text seams (`AuthEntryScreen`, `changelog`, `admin.login`); these belong to
  the separate Frontend Marketing and Design System routes identified by the audit.
- `forms-onboarding.css`, choice supporting-content token-gap work, ValueTag containment, body-map
  focus, structural alpha composition, workout identity colors, typography geometry/case/tracking,
  data/persistence/auth/AI/provider behavior, and unrelated dirty hunks.
- Calendar action routing, drag/move behavior, timeline layout, tooltip positioning, fallback copy,
  navigation/reset/invalidate behavior, and all established selected/today/status semantics.

## Required Preflight

1. Read `AGENTS.md`, `agents/frontend.agent.md`,
   `skills/hito-frontend-design-system/SKILL.md`, this item, and the cited audit rows.
2. Capture the current dirty-worktree inventory and inspect every named Product source owner before
   writing. Preserve concurrent work byte-for-byte.
3. Confirm every proposed change reuses the named canonical contract. If an in-scope text instance
   is genuinely ambiguous between primary and supporting meaning, stop that instance and return the
   Product decision instead of inventing a shade or silently changing hierarchy.

## Definition Of Done

- Calendar, Activity History, and keyboard-reachable timeline controls have an independent canonical
  solid focus cue; semantic identity glow remains separate where it already has meaning.
- Activity History has no Product-local `3.5%` neutral hover recipe when the chrome ladder serves it.
- Both fallback routes reuse the existing Hito Button behavior and remove their duplicated local
  action geometry/state recipe.
- Every named authenticated/Product text instance resolves to an existing semantic role according to
  content purpose; no new local opacity role remains in scope.
- No Product behavior, data truth, route outcome, copy, type hierarchy geometry, or workout meaning
  changes.

## Validation Expectations

Use risk-proportional proof after source is stable:

| Check                 | Required proof                                                                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source contract       | Scoped searches prove the named focus/hover/button/text bypasses are gone or an explicit Product decision records an excluded ambiguous instance. |
| Focus and interaction | Keyboard-visible Calendar, Activity History, and Workout Timeline replay preserves navigation and visible independent focus.                      |
| Theme/layout          | Affected Product surfaces at desktop and exact 375px in Dark and Light retain hierarchy, contrast, and no page overflow.                          |
| Fallback actions      | Prove both route fallback renderers preserve their reset/invalidate or navigation action behavior while using Hito Button.                        |
| Static/build          | Focused formatting and lint, relevant Product validation, `git diff --check`, and a production build appropriate to the changed browser contract. |
| Browser health        | No task-owned console errors.                                                                                                                     |

QA may be used only as a bounded, read-only independent browser review after the Frontend source is
stable. Do not delegate any Frontend Product implementation to a Frontend subagent.

## Stop Conditions

- A required replacement belongs to shared DS source/CSS/token/validator or another Frontend lane.
- A text role cannot be classified from its content purpose and parent state without a material
  Product decision.
- A source hunk overlaps active work and cannot be preserved byte-for-byte.
- Browser proof exposes a behavior change beyond this consumer-convergence scope.

## Execution Preflight — 2026-08-13

- **Accepted outcome and demonstrated cause:** the cited audit rows and current source confirm that
  the named live Product consumers retain local focus, neutral-hover, fallback-action, and text
  alpha recipes even though canonical Hito owners already exist.
- **First incorrect owner:** Frontend Product consumer class/component composition in the exact
  source seams named by this item.
- **Existing seams reused:** `ring-ring` / `outline-ring`, `chrome-subtle`, `HitoButton`,
  `foreground`, `text-secondary`, and each existing route/component renderer.
- **New runtime artifacts:** none. No helper, token, component family, CSS recipe, registry,
  compatibility path, file, dependency, or persistence shape is proposed.
- **Net reduction:** remove the Product-local signal-alpha focus utilities, foreground `3.5%`
  hover, duplicate fallback Button geometry/state strings, and the exact ordinary
  `text-foreground/*` utilities in scope. Timeline semantic glow remains independently owned by its
  existing inline visualization state.
- **Dirty-worktree boundary:** all twelve named runtime source owners had no pre-existing diff at
  preflight. Unrelated policy, release-receipt, Design System, validator, and backlog work remains
  outside this task. The repository release item is completed; no candidate freeze or build writer
  is active.
- **Text-role classification:** primary next-workout/title/icon content maps to `foreground`;
  explanatory copy, assignments, status/readback values, and receipt metadata map to
  `text-secondary`. No listed instance requires a new Product decision.
- **Focused proof:** scoped source discriminators, formatting/lint/Product checks, diff hygiene,
  uncontended production build, then desktop and exact 375 px Light/Dark interaction/console replay.

## Exact Handoff Prompt

None. The assigned Frontend Product implementation is complete.

## Product Dispatch

Dispatched directly to the existing sidebar `FRONTEND (ds)` task as `ROLE: FRONTEND`, Lane Product.
No child implementation agent is authorized.

## Tracked Completion Receipt — 2026-08-13

### Task, Stage, And Preflight

- **Task:** Frontend Product Canonical Token Consumer Remediation.
- **Stage completed:** bounded Product consumer remediation and focused owner acceptance.
- **Preflight:** all twelve runtime owners were clean at task intake; unrelated policy, release,
  Design System, validator, asset, and backlog work was excluded. No concurrent build owner or
  release freeze was active. The existing source seams and canonical Hito contracts were sufficient.
- **New runtime artifacts:** none.

### Product Outcome And Demonstrated Cause

The first incorrect owner was Product consumer composition, not Foundation token coverage. The
named consumers retained local signal-alpha focus, a foreground-alpha hover, duplicate fallback
Button geometry, and ordinary foreground-alpha text after canonical equivalents existed.

The remediation is net-negative: 32 source lines were added and 37 removed across twelve existing
Product files. Canonical `ring-ring` / `outline-ring`, `chrome-subtle`, `HitoButton`, `foreground`,
and the generated `text-text-secondary` utility now own the behavior. Browser inspection caught an
important source discriminator during implementation: `text-secondary` is not a generated utility
in this Tailwind build; the existing semantic `--color-text-secondary` contract emits
`text-text-secondary`. The final source uses that actual canonical owner without changing shared
Design System source.

### Files Changed

- `src/components/Calendar.tsx`
- `src/components/CompletionPanel.tsx`
- `src/components/OnboardingGate.tsx`
- `src/components/TodayHero.tsx`
- `src/components/progress/ActivityHistoryPanel.tsx`
- `src/components/progress/SavedPlanLibraryPanel.tsx`
- `src/components/workout-structure/WorkoutStructureTimeline.tsx`
- `src/router.tsx`
- `src/routes/__root.tsx`
- `src/routes/index.tsx`
- `src/routes/progress.tsx`
- `src/routes/workout.$date.tsx`
- this canonical task lifecycle and receipt

### Deleted And Reused Responsibility

- Removed Calendar and Activity History signal-alpha focus recipes; reused the solid `ring` role.
- Added the Timeline's canonical focus outline as an independent layer while retaining its existing
  semantic workout glow and inset visualization unchanged.
- Removed the Activity History foreground `3.5%` hover; reused `chrome-subtle`.
- Removed duplicated native fallback Button geometry/state recipes; reused primary and outlined
  `HitoButton` contracts. `router.invalidate(); reset();`, navigation, and fallback copy are
  unchanged.
- Replaced only the cited ordinary Product text alphas: primary title/icon content now uses
  `foreground`; supporting copy, assignments, status/readback values, and receipt metadata use
  `text-text-secondary`. Established tertiary captions were preserved.

### Validation Inventory

| Check                           | Scenario / environment                                              | Result                    | Evidence                                                                                                                                                                                                                           |
| ------------------------------- | ------------------------------------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source discriminator            | Twelve scoped Product files                                         | Passed                    | Zero named signal-alpha focus, `3.5%` hover, duplicate fallback geometry, or cited foreground-alpha matches.                                                                                                                       |
| Formatting and lint             | Scoped source plus canonical item                                   | Passed                    | Prettier passed; ESLint reported zero errors and one pre-existing Fast Refresh architecture warning in `src/router.tsx:5`.                                                                                                         |
| Product validators              | Product contract and runner Calendar context                        | Passed                    | Heart-rate guidance, workout comparison readback, and runner Calendar context validators passed.                                                                                                                                   |
| Diff hygiene                    | Task-owned paths                                                    | Passed                    | `git diff --check` passed.                                                                                                                                                                                                         |
| Production build                | Managed `qa_fixture` build                                          | Passed                    | Client, SSR, Nitro, and postbuild integrity completed; managed loopback was healthy, compatible, fresh, and `receipt_matches`.                                                                                                     |
| Calendar focus                  | Owner browser replay, 1440x900 and 375x812, Light/Dark              | Passed                    | Feedback and day controls exposed a solid theme-aware 2 px ring; existing actions and runner UI remained intact.                                                                                                                   |
| Activity History                | Owner browser replay, 1440x900 and 375x812, Light/Dark              | Passed                    | Neutral chrome hover and solid inset focus resolved; row activation opened the existing activity dialog.                                                                                                                           |
| Workout Timeline                | Owner browser replay, 1440x900 and 375x812, Light/Dark              | Passed                    | Solid 2 px inset outline remained visually independent from the retained semantic workout glow; keyboard activation remained live.                                                                                                 |
| Fallback actions                | Not-found runtime plus DefaultError source                          | Passed with boundary      | Not-found `Go home` rendered as a Hito primary Button and Enter navigated to `/`; DefaultError preserves the exact invalidate-then-reset handler in source. No safe deterministic runtime error injector exists in the fixture.    |
| Hierarchy, containment, console | `/`, `/progress`, workout, and not-found; desktop/mobile Light/Dark | Passed                    | Semantic primary/supporting colors resolved distinctly, document width matched client width, and browser warning/error logs were empty.                                                                                            |
| Independent QA                  | Fresh managed `qa_fixture`                                          | Partial / coverage failed | Fallback, hierarchy, containment, theme, focus-token, navigation, and console checks passed. The independent browser session had no plan/activity data, so it could not instantiate Calendar, Activity rows, or Timeline controls. |

### Omitted-Proof Consequence

The implementation owner completed the required live Calendar, Activity History, and Timeline replay
on the final runtime source. The independent QA session could not reproduce those three data-backed
controls because its deterministic fixture state exposed plan setup and an empty activity list.
Therefore this receipt does not claim independent QA acceptance for those controls. That gap is a
fixture-coverage boundary, not evidence of a Product source regression. DefaultError interaction is
also source/build-proven rather than runtime-injected; the not-found fallback was fully replayed.

### Preserved Boundaries, Next Owner, And Blockers

Shared Design System source, tokens, CSS, manifests, validators, `/hitoDS`, Product data and
persistence, auth/providers, Marketing/Admin consumers, and unrelated dirty work were preserved.
No Global QA, hosted, release, deployment, or Figma claim is made.

- **Next owner:** PRODUCT, for receipt review and optional routing of a separate deterministic
  fixture-coverage task if independent replay of the three data-backed controls is required.
- **Implementation blockers:** none.
- **Independent acceptance blocker:** the QA session lacked deterministic plan/activity/timeline
  fixture data.
