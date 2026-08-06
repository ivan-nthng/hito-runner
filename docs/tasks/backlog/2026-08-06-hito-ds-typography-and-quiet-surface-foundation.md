# Hito DS Typography And Quiet Surface Foundation

## Work Item ID

2026-08-06-hito-ds-typography-and-quiet-surface-foundation

## Status

in_progress

## Type

change_request

## Priority

high

## Owner

design_system

## Scope

shared-design-system

## Parent

[Developer Velocity And Proportional Verification](2026-08-05-developer-velocity-and-proportional-verification.md)

## Task

Implement the shared Hito typography and quiet-surface foundation admitted from Local Inspector
evidence on `/workout/2026-08-06?tab=overview`, then leave Product-owned adoption as one precise
Frontend Product boundary.

## Stage

DESIGN SYSTEM implementation with integrated independent QA.

## Execution Preflight

- **Task and bounded outcome:** add canonical sans UI counterparts for applicable title roles and
  one token-derived quiet-surface recipe without changing Product state or route composition.
- **Evidence before code:** the central typography inventory exposes five Fraunces title roles,
  while the captured workout heading uses local `font-display` without role provenance. Shared
  AppShell profile chrome and route-owned workout navigation also demonstrate a repeated quiet,
  translucent surface need. `hito-list-row` already has the correct shared owner.
- **Canonical owner:** `src/lib/hito-typography-roles.ts`, canonical Hito DS CSS, the generated
  manifest, `/hitoDS`, and the Design System validator.
- **Smallest root-cause outcome:** one source-backed sans UI-title family with the existing title
  line boxes, one reusable quiet-surface class consumed by shared profile chrome, and no parallel
  component wrappers. Product-only layout and notice decisions remain explicit handoff work.
- **Required proof:** complete typography reachability, manifest parity, deterministic validator
  assertions, representative Product and `/hitoDS` browser evidence at desktop and exact 375px in
  light/dark, keyboard focus and contrast, scoped static checks, proportional build/integrity, and
  independent QA.
- **Stop condition:** stop the affected sub-slice if it requires a Product content/layout decision,
  Calendar compatibility change, persistence mutation, or editing a concurrently owned Product
  source.

## Established Boundaries

- Runtime code remains the source of typography and token truth; Figma and the generated manifest
  remain downstream representations.
- Serif remains available only for source-backed marketing, editorial, or intentionally decorative
  presentation. This slice does not migrate Product consumers.
- `hito-list-row` remains a shared DS recipe. Plan note relevance, visibility, and dismissal are
  Product state and cannot be encoded in DS CSS.
- Workout navigation's absent-side placement is Product layout composition. The shared quiet
  surface may be adopted later without moving that behavior into the Design System.
- Calendar compatibility, auth, persistence, providers, fixtures, hosted state, and concurrent
  Product work are out of scope.

## Required Test Inventory

| Check                    | Scenario / environment                                                  | Required evidence                                                              |
| ------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Root-cause discriminator | Typography roles, raw display consumers, and shared chrome reachability | Source-backed classification and zero speculative deletion                     |
| Typography contract      | UI title counterparts and retained editorial roles                      | Shared provenance, matching role-level size/line-height/responsive values      |
| Quiet surface            | Shared class and profile-trigger consumption                            | Token-derived background, no visible border/shadow, preserved focus affordance |
| Manifest parity          | Generated TypeScript/JSON and Foundations rendering                     | Generator check and DS validator                                               |
| Reference                | `/hitoDS/foundations` and representative component specimen             | Desktop and exact 375px, light/dark, no overflow                               |
| Product regression       | Representative AppShell/workout surface                                 | Typography/layout/state unchanged except admitted shared chrome                |
| Accessibility            | Keyboard focus and readable interactive chrome                          | Visible focus plus source/runtime evidence                                     |
| Static quality           | Changed sources                                                         | Targeted lint/format and scoped diff hygiene                                   |
| Build boundary           | Completed shared contract                                               | Fresh production build and build-integrity validation                          |
| Independent QA           | Full owner-level inventory                                              | Bounded read-only QA receipt and fix-forward recheck where needed              |

## Product Adoption Boundary

### Typography reachability

The source audit found four reusable Product title geometries and no Product renderer of
`hito-display-title`. The canonical additions are therefore `hito-ui-page-title`,
`hito-ui-modal-title`, `hito-ui-section-title`, and `hito-ui-panel-title`. Adding an unused
`hito-ui-display-title` would be speculative; current Product hero recipes are materially smaller
than the editorial display role.

The authenticated runner surface currently has 63 literal serif-role or `font-display` sites plus
five indirect shared-title sites. Existing role consumers are migration candidates, not evidence
that serif remains a valid Product language. Eight raw Product recipes deliberately retain custom
geometry and must change family without receiving false role provenance:

- `src/routes/workout.$date.tsx`: workout hero and rest-state heading;
- `src/components/TodayHero.tsx`: two hero states;
- `src/components/Calendar.tsx`: workout tooltip title;
- `src/components/onboarding/PlanPresetPanel.tsx`: distance presentation;
- `src/components/progress/ActivityHistoryPanel.tsx`: date-rail day;
- `src/components/progress/FactualProgressPanel.tsx`: summary value.

Source-backed serif remains valid in `src/routes/hub.tsx`, `src/routes/changelog.tsx`, and the Hito
DS/editorial reference presentation. `src/routes/login.tsx` remains a separate Marketing decision.
Admin/internal and DevTools title rendering remain outside this authenticated-runner Product
decision and must not be migrated incidentally.

### Frontend Product adoption map

| Product boundary          | Exact current owners                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Required outcome                                                                                                                                                                            | Guardrail                                                                                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route/page titles         | `src/routes/index.tsx`, `src/routes/integrations.tsx`, `src/routes/progress.tsx`, `src/routes/settings.tsx`, `src/routes/workout.$date.tsx`, `src/components/OnboardingGate.tsx`, `src/components/progress/ActivityHistoryPanel.tsx`, `src/components/progress/FactualProgressPanel.tsx`                                                                                                                                                                                                                                 | Replace authenticated Product `hito-page-title` use with `hito-ui-page-title`.                                                                                                              | Preserve heading elements, reading order, copy, responsive line box, focus targets, and loading/error semantics.                                                           |
| Dialog titles             | `src/components/PlanManagementDialog.tsx`, `src/components/UploadJsonDialog.tsx`, `src/components/plan-management/ActivePlanCreatePlanDialog.tsx`, `src/components/plan-management/ActivePlanTransitionReviewDialog.tsx`, `src/components/onboarding/SelectedTenKPlanPreviewDialog.tsx`, `src/components/progress/ActivityHistoryPanel.tsx`, `src/components/workout-completion/BodyNotesEditor.tsx`, `src/components/workout-completion/WorkoutActivityFileDialog.tsx`, `src/components/manual-workout/*` dialog owners | Replace Product `hito-modal-title` with `hito-ui-modal-title`.                                                                                                                              | Preserve Dialog/Sheet semantics, focus trap, Escape, accessible name, scroll anatomy, and lifecycle state.                                                                 |
| Section/panel titles      | `src/routes/settings.tsx`, `src/routes/integrations.tsx`, `src/components/CompletionPanel.tsx`, `src/components/settings/*`, `src/components/plan-management/PlanSummaryHeader.tsx`, `src/components/onboarding/*`, `src/components/progress/*`, `src/components/Calendar.tsx`                                                                                                                                                                                                                                           | Use the matching `hito-ui-section-title` or `hito-ui-panel-title`.                                                                                                                          | Remove local family overrides only; do not collapse section and panel hierarchy or visualization geometry.                                                                 |
| Custom Product typography | The eight raw sites listed above                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Replace `font-display` with the canonical sans primitive while preserving current custom size/line-height. Adopt a UI role only if Product deliberately accepts that role's exact geometry. | Custom geometry remains truthfully Custom in Inspector; do not forge `--hito-typography-role` from computed similarity.                                                    |
| Workout navigation chrome | `NavCard` and its conditional grid in `src/routes/workout.$date.tsx`; route-local chrome in `src/styles/calendar-state-surfaces.css`                                                                                                                                                                                                                                                                                                                                                                                     | Adopt `hito-surface-quiet`, then delete only the superseded border/background/shadow/light-theme chrome. Keep arrow, date, label, title, direction, and mobile anatomy route-owned.         | When only `next` exists, it keeps the forward/right slot on tablet/desktop; when only `prev` exists, it keeps the previous/left slot. Mobile remains one contained column. |
| Plan note                 | `showShellPlanNote` and the `hito-list-row` composition in `src/components/AppShell.tsx`                                                                                                                                                                                                                                                                                                                                                                                                                                 | Product decides when the note is relevant and the lifetime of dismissal. Keep `hito-list-row` as the rendering recipe.                                                                      | Do not hide the note globally in CSS, persist dismissal without a Product decision, or change plan/profile truth.                                                          |

### Compatibility removal condition

Design System temporarily includes `.hito-shell-profile-trigger` beside `.hito-surface-quiet` in the
shared chrome selector because Product and Admin source are outside this slice. Current compatibility
consumers are `src/components/AppShell.tsx` and `src/components/admin/AdminWorkspaceNav.tsx`; the two
Hito DS specimens already consume and identify `hito-surface-quiet` directly. Frontend removes the
compatibility selector only after both runtime triggers adopt the class and focused, disabled,
light/dark, desktop, and 375px behavior is revalidated.

## Approval Policy

Routine local inspection, implementation, fixture/browser QA, independent subagents, and validation
proceed under standing authorization. Do not stage, commit, push, deploy, mutate hosted state, or
call paid providers.
