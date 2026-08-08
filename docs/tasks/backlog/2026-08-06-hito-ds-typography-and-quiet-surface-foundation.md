# Hito DS Typography And Quiet Surface Foundation

## Work Item ID

2026-08-06-hito-ds-typography-and-quiet-surface-foundation

## Status

completed

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

DESIGN SYSTEM source-control reconciliation completed; Frontend Product adoption ready.

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

## Candidate Reconciliation Receipt

### Accepted candidate and provenance

- Candidate baseline: `origin/main@e7a152868e313ec7f1a564d271c722183f997f7c`.
- Validation ran from the detached isolated worktree at
  `/Users/ivan/.codex/worktrees/ds-typography-quiet-e7a/hito-running`; the shared
  `codex/design-system-integration@bf8bdee878898cc8e7e430be9c275121f7bfea81` checkout was not used
  as source or validation truth.
- `e7a1528` is a mixed commit containing unrelated Product, DevTools, and documentation work. It is
  accepted as the candidate baseline, not represented as an exact standalone Design System
  release. This receipt covers only the admitted Design System files below.
- Source-control reconciliation started from the existing clean
  `main@c8ac0003e0b358ef3a4351606e588977c2d4084d`, where the validated four-role implementation was
  already present. The reconciliation release changes only this canonical work item.
- The integration branch was not merged or pushed. Its unsupported `hito-ui-display-title` addition
  and its regressed work-item copy were explicitly rejected from this release.

### Admitted Design System manifest

- `scripts/validate-hito-ds-component-contracts.ts`
- `src/components/hito-ds/reference-components-structure.tsx`
- `src/components/hito-ds/reference-foundations-page.tsx`
- `src/components/hito-ds/reference-metadata.ts`
- `src/generated/hito-ds-manifest.json`
- `src/generated/hito-ds-manifest.ts`
- `src/lib/hito-typography-roles.ts`
- `src/styles/layout-typography.css`
- `src/styles/reference-workbench.css`
- `src/styles/shell-admin-analytics.css`
- `docs/tasks/backlog/2026-08-06-hito-ds-typography-and-quiet-surface-foundation.md`

The baseline-to-candidate discriminator selects this same set through the new UI-title,
quiet-surface, and shell-profile contract markers. No Product route or Product-state file belongs to
the admitted implementation manifest. The later source-control reconciliation admits only the work
item itself.

### Demonstrated outcome

- One central typography inventory now owns four source-backed sans UI title roles: page, modal,
  section, and panel. No speculative `ui-display-title` was admitted because Product has no matching
  display-role renderer.
- Every UI title preserves its editorial counterpart's size, weight, tracking, line-height,
  wrapping, and responsive line box while intentionally changing only the font family to the
  canonical sans primitive.
- Five serif roles remain explicitly editorial or migration compatibility. The generated manifest,
  `/hitoDS`, and Local Inspector consume the same central registry; no second typography truth was
  created.
- `hito-surface-quiet` owns the semantic translucent background, transparent geometry-preserving
  border, canonical radius, enabled-only hover, and solid focus ring. The shared profile-trigger
  compatibility selector reuses that recipe without manufacturing a new component wrapper.
- `hito-list-row` remains available and unchanged. Workout navigation layout and Plan note
  relevance/dismissal remain Product-owned as documented above.

### Integrated validation

| Check                    | Scenario / environment                                                               | Result | Evidence                                                                                                                                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Candidate identity       | Isolated detached worktree                                                           | Passed | `HEAD=e7a152868e313ec7f1a564d271c722183f997f7c`; shared `bf8bdee` was excluded.                                                                                                                                     |
| Root-cause discriminator | Registry, CSS owners, reachability, candidate diff                                   | Passed | Four UI roles, five editorial roles, no `ui-display-title`, one registry, and no Product-state file in the admitted manifest.                                                                                       |
| DS contract validator    | Candidate source                                                                     | Passed | `textStyles:18`, `uiTitleRoles:4`, `productDependencies:0`, `scannedFiles:329`.                                                                                                                                     |
| Manifest parity          | Generated TypeScript and JSON                                                        | Passed | `38` primitive colors, `29` semantic colors, and `18` Text Styles.                                                                                                                                                  |
| Typography line boxes    | Source plus `/hitoDS/foundations` computed styles                                    | Passed | Desktop UI roles resolve to `72/72`, `32/35.2`, `24/27.6`, and `22/25.96px`; exact 375px resolves to `48/48`, `28/30.8`, `24/27.6`, and `20/23.6px`, all with truthful Poppins provenance.                          |
| Quiet surface            | Foundations and interactive shell specimen                                           | Passed | Dark/light alpha surface, transparent border, `10px` radius, no resting shadow, enabled-only hover, and solid `2px` ring.                                                                                           |
| Focus accessibility      | Independent keyboard replay, light/dark                                              | Passed | Native Tab reaches the quiet trigger with `:focus-visible=true`; source contrast is `7.05:1` dark and `3.50:1` light against the canvas.                                                                            |
| Responsive reference     | `/hitoDS/foundations` and `/hitoDS/components`, `1470x801` and `375x812`, light/dark | Passed | No page-level horizontal overflow; the quiet trigger remains contained in every matrix.                                                                                                                             |
| Product containment      | `/workout/2026-08-06?tab=overview`, desktop and exact 375px, light/dark              | Passed | No overflow or Product mutation; heading remains custom Fraunces with no false provenance, NavCard remains route-owned, Plan note remains a `hito-list-row`, and profile chrome resolves through the shared recipe. |
| Browser health           | Reference and representative Product routes                                          | Passed | Independent console and page-error inventories are empty.                                                                                                                                                           |
| Static quality           | Admitted TypeScript/TSX, CSS, generated files, and this item                         | Passed | Targeted ESLint, Prettier check, and scoped `git diff --check` pass.                                                                                                                                                |
| Production build         | Fresh candidate build                                                                | Passed | Build completed; build integrity reports `207` MJS files and `3252` relative imports. Existing chunk-size and dependency directive warnings are unchanged and non-gating for this contract.                         |
| Independent QA           | Source, validators, browser delta, and cleanup                                       | Passed | Independent Implementation DoD verification passed after completing the initial browser-evidence gap; no same-owner finding remains.                                                                                |
| Main reconciliation      | `main@c8ac0003`, documentation-only delta                                            | Passed | Current validator reports `textStyles:18`, `uiTitleRoles:4`, `productDependencies:0`, and `scannedFiles:331`; only this work item is admitted to the reconciliation release.                                        |

### Runtime and evidence notes

- Candidate browser QA used an isolated runtime on `127.0.0.1:3100`. The first candidate build
  preflight briefly stopped the compatible shared server on port `3000`; the parent owner restored
  that server immediately from its existing fresh artifact without rebuilding or changing source.
  During final cleanup, concurrent Integration work had independently returned the shared runtime
  to `stopped` with its artifact absent. No rebuild or restart was attempted because that checkout
  and runtime belong to the active Integration owner.
- Independent QA did not write screenshot files. Its acceptance uses DOM, computed-style, keyboard,
  overflow, console, and page-error evidence; owner screenshots were visually inspected separately.
- Safari was not run because this slice introduced no engine-specific primitive or behavior. That
  omission leaves cross-browser release acceptance to Global QA and does not weaken the shared
  source/Chromium contract proven here.
- Product typography migration, absent-side workout navigation composition, Plan note lifecycle,
  Calendar compatibility, hosted mutation, provider calls, and deployment were intentionally not
  run because they are outside this Design System slice.

## Closure

- **Shared foundation implementation acceptance:** Passed on the verified candidate evidence above.
- **Documentation/source-control reconciliation DoD:** Passed for the exact main-only work-item
  release; the four-role implementation contract remains unchanged.
- **Global QA Acceptance:** Pending.
- **Next owner:** `FRONTEND Product` for the exact adoption map above. That owner must preserve
  product behavior and complete its own desktop, exact 375px, light/dark, focus, overflow, and
  independent QA matrix before claiming rollout completion.
- **Source-control limitation:** no exact standalone DS implementation release exists for this slice
  because the accepted candidate is a mixed commit. The closure receipt is released separately as
  an exact documentation-only main commit.

## Approval Policy

Routine local inspection and documentation validation proceed under standing authorization. Direct
staging, commit, and push are authorized only for this exact canonical work item. Do not merge the
integration branch, create a branch or pull request, deploy, mutate hosted state, or call paid
providers.
