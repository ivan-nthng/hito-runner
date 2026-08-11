# Authenticated Product UI Title Adoption

- **Work Item ID:** `authenticated-product-ui-title-adoption`
- **Status:** `completed`
- **Type:** `frontend-product-migration`
- **Priority:** `high`
- **Owner:** `frontend`
- **Scope:** `authenticated runner Product title consumers only`
- **Archive Intent:** `retain_in_place`
- **Stage:** `Frontend Product implementation completed with focused browser evidence`
- **Next Recommended Role:** `product`
- **Parent:** [Cross-Stack Deletion And Reuse Audit](2026-08-08-cross-stack-deletion-and-reuse-audit.md)

## Task

Replace serif title usage inside the authenticated Hito service with the already-existing Poppins UI
title counterparts, preserving each title's current size, responsive sizing, weight, line-height,
letter-spacing, semantics, and layout. Fraunces remains available for public marketing and editorial
surfaces; this is not a global font replacement.

## Product Decision

- The authenticated service should use the quiet, consistent UI title hierarchy: Poppins headers at
  the same geometry as their existing serif counterparts.
- Fraunces is retained for deliberately editorial/public presentation, including marketing and
  source-backed editorial surfaces. It is not removed from the Design System, token foundation, or
  repository.
- This is an adoption migration only. The four canonical UI roles already exist:
  `hito-ui-page-title`, `hito-ui-modal-title`, `hito-ui-section-title`, and
  `hito-ui-panel-title`.

## User Report

The authenticated service feels visually too mixed because legacy Fraunces headings remain beside
the newer Poppins UI hierarchy. The user explicitly wants the UI duplicates at exactly the same
sizes and line-heights, while retaining Fraunces for marketing/editorial use.

## Evidence

- [`src/lib/hito-typography-roles.ts`](../../../src/lib/hito-typography-roles.ts) defines the four
  Poppins UI title roles with geometry matching their Fraunces migration counterparts.
- [`src/styles/layout-typography.css`](../../../src/styles/layout-typography.css) implements both
  title families. The UI variants retain the matching size, weight, tracking, and line-height.
- Current authenticated Product consumers still use legacy `hito-page-title`, `hito-modal-title`,
  `hito-section-title`, `hito-panel-title`, or direct `font-display` styling across Calendar,
  Today, onboarding, manual workout dialogs, Progress, Settings, Integrations, and Workout.
- The previous shared-foundation item explicitly reserved this Product adoption boundary:
  [Hito DS Typography And Quiet Surface Foundation](2026-08-06-hito-ds-typography-and-quiet-surface-foundation.md#product-adoption-boundary).

## Observed Behavior

Authenticated Product headings resolve to a mixture of Fraunces display styling and Poppins UI
styling even where their title geometry is identical.

## Expected Behavior

1. Authenticated runner Product page, modal, section, and panel titles use their matching existing
   `hito-ui-*` Poppins title role.
2. Authenticated Product headings that intentionally use custom geometry retain that exact geometry
   and switch only their font family to the existing UI sans contract; they do not receive false
   typography provenance.
3. Heading elements, accessible names, reading order, responsive wrapping, focus behavior, route
   state, and all Product behavior remain unchanged.
4. Fraunces remains unchanged in public/marketing/editorial routes, Hito DS reference material,
   DevTools, and admin surfaces.

## Source Investigation

The demonstrated first incorrect owner is the authenticated Frontend Product consumers, not the
shared Design System. The reusable Poppins role family, its canonical CSS, manifest, and reference
already exist. Changing `--font-display`, deleting serif roles, or adding another title family
would wrongly affect editorial surfaces and duplicate existing work.

The existing seam is the title class at each authenticated Product consumer. Before writing, the
owner must refresh the current consumer map because recent Product work has removed several older
screens. The route/consumer boundary, not a route-local CSS override, owns the migration.

## Reuse-First Budget

- Reuse the existing four `hito-ui-*` typography roles and the existing UI sans utility/contract
  for custom-geometry headings.
- Expected new production runtime artifacts: **none**.
- Do not add a font, token, typography role, CSS recipe, component, wrapper, manifest entry,
  persistence state, browser state, or compatibility alias.
- Remove only superseded authenticated Product references to legacy serif title roles or direct
  `font-display` family styling. Retain the underlying editorial roles because they remain live
  outside this scope.

## What Not To Touch

- `--font-display`, `--font-sans`, serif/editorial role definitions, canonical typography CSS,
  generated manifest, `/hitoDS`, or Design System primitives.
- Public/marketing/editorial routes, including Hub, Changelog, and Login; Admin; DevTools; Figma.
- Calendar truth, saved plans, manual-workout persistence, completion/FIT behavior, Settings data,
  authentication, providers, backend code, migrations, dependencies, or lockfiles.
- Unrelated dirty work, hosted systems, staging, commits, pushes, deployment, or release actions.

## Validation Expectations

- Prove the current authenticated consumer map before and after the migration, distinguishing it
  from excluded public, admin, DevTools, and DS consumers.
- Prove each migrated semantic title resolves to the existing Poppins UI role while its declared
  geometry remains unchanged; prove custom headings changed family only.
- Use a local authenticated browser path to inspect representative Calendar, Workout, Progress,
  Settings, onboarding, and a modal surface at desktop and exact 375px in light and dark themes.
  Check readable wrapping, no page-level horizontal overflow, heading semantics, and modal focus.
- Run focused static checks and a production build. State omissions honestly. This is Frontend
  Implementation DoD only; Global QA Acceptance is not claimed.

## Stop Conditions

Stop and return to Product if a current authenticated consumer has no exact existing UI counterpart,
requires a change to the accepted title hierarchy or geometry, crosses into shared canonical
typography ownership, or touches a concurrent protected FIT/completion change. Do not create a new
role or use a local CSS workaround to bypass that decision.

## Frontend Blocked Preflight — 2026-08-10

- **Mode and lane:** Tracked, Frontend Product.
- **Source-backed outcome:** The refreshed authenticated Product map contains 63 current
  legacy/custom title references across 25 files: 55 exact legacy-role peers and eight
  custom-geometry `font-display` sites. The existing `hito-ui-*` roles preserve the corresponding
  title geometry, and the existing `font-sans` utility is the correct family-only adoption seam for
  the eight custom sites.
- **Reuse-first budget:** The intended implementation would change only consumer class references.
  New production runtime artifacts: none. Shared typography source, CSS, tokens, registry,
  manifest, validators, and editorial roles remain unchanged.
- **Excluded-source discriminator:** 50 current Fraunces references belong to the explicitly
  excluded public/editorial, Admin, DevTools, and Hito DS surfaces and remain live.
- **Demonstrated stop boundary:** Five required Product references remain in
  `src/components/CompletionPanel.tsx` and
  `src/components/workout-completion/BodyNotesEditor.tsx`. Both files already contain unrelated
  uncommitted completion-state work for slider previous values and body-note severity restoration.
  Editing their title classes would overlap the assignment's protected concurrent FIT/completion
  boundary.
- **Decision:** No Product source was edited. A partial 58-site migration was deliberately not
  started because it would leave the authenticated title contract knowingly incomplete and add a
  second unfinished state around protected files.

| Check                                                     | Scenario / environment                                                                | Result  | Evidence                                                                                                                           |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Current Product consumer map                              | Literal legacy title roles and `font-display` under current Product routes/components | Passed  | 63 references in 25 files: 55 exact role peers and eight custom-family sites.                                                      |
| Existing role geometry                                    | `src/lib/hito-typography-roles.ts` and `src/styles/layout-typography.css`             | Passed  | Page, modal, section, and panel UI roles already match their legacy peer geometry and differ by the accepted sans family contract. |
| Excluded containment                                      | Public/editorial routes, Admin, DevTools, and Hito DS                                 | Passed  | 50 live excluded Fraunces references were classified separately; none was edited.                                                  |
| Protected-overlap discriminator                           | Current Git diff for `CompletionPanel.tsx` and `BodyNotesEditor.tsx`                  | Blocked | Five required title references share files with unfinished completion-state edits.                                                 |
| Browser matrix, static migration checks, production build | Required after Product source migration                                               | Not run | No implementation occurred; running migration acceptance would provide no coverage of the unresolved consumer contract.            |

**Implementation DoD: Not started. Global QA Acceptance: unclaimed.** Product must coordinate the
protected completion owner or confirm that work is closed before Frontend resumes the full atomic
consumer migration. No subagent was used.

## Product Coordination Receipt — 2026-08-10

- The previously overlapping slider previous-value and Body Notes baseline work is now complete in
  [Hito DS Slider Baseline And Size Contract](2026-08-10-hito-ds-slider-baseline-size-contract.md).
  Its final focused QA receipt records `Implementation DoD: Passed`; its owner is no longer active.
- The preserved working-tree hunks in `CompletionPanel.tsx` and `BodyNotesEditor.tsx` remain
  accepted concurrent work, not an active ownership collision. Frontend may resume the title
  migration, preserving those hunks byte-for-byte and limiting edits in those files to the separate
  legacy title class locations.
- The complete consumer migration remains atomic: do not complete only the non-overlapping 58
  sites. The original source, scope, exclusions, reuse budget, and validation expectations remain
  unchanged.

## Frontend Implementation Receipt — 2026-08-10

- **Mode and lane:** Tracked, Frontend Product.
- **Preflight:** Refreshed 63 authenticated Product references across 25 files: 55 exact
  `hito-*` to `hito-ui-*` role peers and eight custom `font-display` to `font-sans` family-only
  changes. New production runtime artifacts: none. The existing consumer class seam owned the
  entire migration.
- **Product outcome:** Authenticated Calendar, Today, onboarding, manual-workout dialogs, Progress,
  Settings, Integrations, Workout, and completion headings now use the existing Poppins UI title
  contract while preserving their elements, accessible names, weight, size, responsive values,
  line-height, tracking, and layout classes.
- **First incorrect owner:** Authenticated Frontend Product consumers still referenced the retained
  editorial Fraunces roles after the exact UI peers were implemented in the shared typography
  foundation. Shared typography source was already correct and was not edited.
- **Changed consumers:** `src/routes/{index,integrations,progress,settings,workout.$date}.tsx`;
  `src/components/{Calendar,CompletionPanel,OnboardingGate,TodayHero}.tsx`; the five current
  `src/components/manual-workout/` title owners; four current `src/components/onboarding/` title
  owners; three current `src/components/progress/` title owners; three current
  `src/components/settings/` title owners; and
  `src/components/workout-completion/BodyNotesEditor.tsx`.
- **Preserved boundaries:** The pre-existing slider previous-value and Body Notes baseline hunks are
  byte-identical outside the five authorized class-token changes. Public/editorial routes, Login,
  Hub, Changelog, Admin, DevTools, Hito DS, shared CSS, typography registry, tokens, manifest,
  Figma, state, auth, persistence, providers, FIT/history truth, and saved-plan behavior were not
  changed.

| Check                              | Scenario / environment                                                | Result | Evidence                                                                                                                                                                                                                                                                       |
| ---------------------------------- | --------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Atomic consumer map                | Current authenticated Product source                                  | Passed | 63 adopted references across 25 files: page 12, modal 14, section 24, panel 5, custom sans 8; zero legacy Product references remain.                                                                                                                                           |
| Role and custom geometry           | Existing role CSS plus exact mechanical transformation                | Passed | All four UI/legacy pairs match size, weight, tracking, line-height, and layout declarations; custom sites changed only family. Shared typography source is unchanged.                                                                                                          |
| Excluded containment               | Public/editorial, Login, Hub, Changelog, Admin, DevTools, and Hito DS | Passed | The pre/post set of 50 live excluded Fraunces references is identical.                                                                                                                                                                                                         |
| Concurrent completion preservation | `CompletionPanel.tsx` and `BodyNotesEditor.tsx`                       | Passed | Reversing the four section/panel and one modal title token produces byte-identical pre-migration snapshots; accepted slider/body-note hunks are untouched.                                                                                                                     |
| Focused static quality             | All 25 changed Product consumers                                      | Passed | Targeted ESLint, Prettier, scoped `git diff --check`, exact legacy search, and shared-source diff checks passed.                                                                                                                                                               |
| Production build and integrity     | Current source, local production artifact                             | Passed | `npm run build` exited 0; build integrity reported 209 MJS files and 3,051 relative MJS imports. The managed `qa_fixture` runtime rebuilt the current source, then reported fresh/healthy/loopback. Existing chunk-size and dependency-directive warnings remained non-gating. |
| Desktop browser                    | Authenticated 1280x800, dark and light                                | Passed | Calendar/Today, Workout, Progress, Settings, and Body Notes modal rendered Poppins with expected role/custom geometry, preserved heading levels and names, no horizontal overflow, and focus inside the open modal.                                                            |
| Mobile browser                     | Authenticated exact 375x812, dark and light                           | Passed | Calendar/Today, Workout, Progress, Settings, onboarding, and modal titles retained responsive geometry and wrapping with `scrollWidth=375`; no page-level horizontal overflow.                                                                                                 |
| Browser health and cleanup         | In-app browser plus canonical design-profile fixture                  | Passed | Browser console errors were empty; viewport override was reset and tabs finalized. Fixture reset reached zero owned rows and zero retained storage objects; the managed server was stopped.                                                                                    |

Browser evidence is stored under
`qa-artifacts/screenshots/2026-08-10/authenticated-product-ui-title-adoption/`, including Calendar
desktop dark/light, Workout and Body Notes modal desktop/mobile, Progress 375px light, Calendar
375px dark/light, and onboarding 375px dark.

Safari and a broad cross-browser/release matrix were not run because this adoption changes only
existing consumer class names and introduces no engine-specific behavior. That omission leaves
cross-browser release acceptance and Global QA Acceptance unclaimed.

**Frontend Implementation DoD: Passed. Global QA Acceptance: unclaimed. Next owner: Product.** No
blockers remain and no subagent was used.

## Exact Handoff Prompt

```text
ROLE: FRONTEND

Lane: Product
Mode: Tracked

Read AGENTS.md, agents/frontend.agent.md, skills/hito-frontend-design-system/SKILL.md, and this
canonical item before writing:
docs/tasks/backlog/2026-08-10-authenticated-product-ui-title-adoption.md

Task: Migrate authenticated runner Product headings from legacy Fraunces title usage to the already
implemented Poppins UI title counterparts. Preserve the exact title geometry and every Product
behavior. This is a consumer-adoption task, not a new typography-system implementation.

Product decision:
- In the authenticated service, use the existing `hito-ui-page-title`, `hito-ui-modal-title`,
  `hito-ui-section-title`, and `hito-ui-panel-title` wherever their legacy peer is currently used.
- For an authenticated Product heading with intentionally custom geometry, preserve its size,
  responsive values, weight, line-height, tracking, element, and layout; change only its family to
  the existing UI sans contract without assigning false typography provenance.
- Fraunces remains intentionally available for public marketing/editorial presentation. Do not
  change public/marketing/editorial routes, Hub, Changelog, Login, Admin, DevTools, `/hitoDS`, the
  typography registry, shared CSS, tokens, manifest, or Figma.

Evidence and current seams:
- `src/lib/hito-typography-roles.ts` and `src/styles/layout-typography.css` already define the
  exact Poppins roles with matching title geometry.
- Current Product consumers include Calendar, Today, onboarding, manual-workout dialogs, Progress,
  Settings, Integrations, and Workout. Refresh this consumer map before editing because recent
  Product cleanup removed some historical consumers.
- The source-backed decision and migration boundary are recorded in
  `docs/tasks/backlog/2026-08-06-hito-ds-typography-and-quiet-surface-foundation.md` and this item.

Reuse-first boundary:
- Reuse only the existing UI title roles and existing sans utility for custom headings.
- Expected new production artifacts: none. Do not add a font, token, title role, CSS recipe,
  component, wrapper, manifest entry, state, API, persistence, compatibility alias, or validator
  framework.
- Delete only superseded authenticated Product legacy references. Keep live editorial typography
  implementation intact.

Definition of Done:
1. Authenticated Product page, modal, section, and panel headings resolve through the matching
   existing Poppins UI title role; custom Product headings retain their exact geometry but use the
   existing UI sans family.
2. No heading semantics, accessible names, focus behavior, responsive wrapping, Calendar/workout
   behavior, auth, persistence, FIT/history, or saved-plan behavior changes.
3. The excluded Fraunces/editorial surfaces are unchanged.
4. A fresh consumer map, focused source/style proof, representative authenticated browser proof at
   desktop and exact 375px in light/dark, focused static checks, and a production build support the
   result. Report Implementation DoD separately from Global QA Acceptance, which remains unclaimed.

Stop at the Product boundary if a consumer lacks an exact existing UI peer, requires a geometry or
hierarchy decision, reaches shared typography source, or overlaps protected concurrent FIT/completion
work. Use an optional bounded read-only reviewer only if it materially reduces risk; do not create
subagent ceremony. Keep in-progress commentary visible to Ivan in Russian. Write the canonical item
update, final formal receipt, and validation table in English. Do not stage, commit, push, deploy,
touch hosted data, or call paid providers.
```
