# Service-Wide Hito DS Conformance Audit

## Status

completed

## Type

frontend_spec

## Priority

high

## Owner

DESIGNER

## Last Updated

2026-07-18

## Next Recommended Role

product

## Task

Serve as the completed service-wide Hito DS conformance evidence after all three bounded remediation
batches.

## Stage

FRONTEND reference-truth closure accepted / conformance complete.

## Exact Handoff Prompt

None. The conformance remediation sequence is complete.

## Active Plan

[Hito DS Information Architecture And Specimen Contract](../../plans/active/2026-06-15-hito-ds-information-architecture-and-specimen-contract.md)

## Executive Verdict

**Hito DS is coherent, visibly established, and accepted as service-wide conformant in the audited
scope.**

## Remediation Closeout — 2026-07-18

- Candidate 1 converged onboarding and Completion consumers on existing choice, scale, and field
  contracts and restored exact-375 content clearance.
- Candidate 2 established truthful semantic state, inline-edit wash, and soft-elevation ownership in
  dark and light themes.
- Candidate 3 replaced copied reference anatomy with real shared owners, completed the explicit
  loading/empty/success/error matrix, and reconciled the workout appendix to 32 of 32 canonical
  identities with durable parity checks.
- Product runtime behavior, public component contracts, theme behavior, tokens, calendar/manual
  geometry, workout colors, backend truth, and taxonomy semantics did not change.

The product is not suffering from a missing design language or a need for redesign. The canonical
foundations are strong: semantic dark/light color roles, Hito typography, spacing and radius scales,
the Icon registry, shared controls, dialog/sheet language, calendar-day ownership, admin table
recipes, and workout color semantics are all real and broadly adopted.

The remaining material debt is bounded:

1. several product consumers still recreate selectable controls and field anatomy locally even
   though Hito DS already owns the correct primitive;
2. a few semantic state/elevation contracts are incomplete or silently ineffective;
3. one mobile onboarding layout does not reserve enough visible content space around its fixed
   action footer;
4. `/hitoDS` contains some copied specimens and incomplete canonical coverage instead of proving
   the actual runtime owners;
5. a small set of route-local typography and fallback patterns remain outside established roles.

The right response is migration and consolidation, not a new component catalog. Most findings need
no new primitive. The only new shared React owner supported by repeated source evidence is a small
metric value/unit/label composition, and even that should wait until Architecture confirms identical
consumer anatomy.

## Root Cause And Ownership

Visible symptom:

- product surfaces can still feel or behave differently despite using the same Hito palette;
- some states look custom because their controls, tone handling, or responsive clearance are local;
- `/hitoDS` can imply broader or different ownership than the runtime component layer actually has.

Likely underlying cause:

- the DS foundations and specimen rollout progressed in accepted slices, while consumer migration
  continued independently;
- CSS class ownership is stronger than React component ownership in a few families;
- some accepted shared components were never promoted into live `/hitoDS` specimens;
- the product has no current conformance ledger separating valid domain geometry from actual visual
  drift.

Canonical owners:

- **Hito DS:** semantic tokens, shared control behavior, shared state/elevation contracts, component
  specimens, and reference truth;
- **FRONTEND:** route/product consumers that bypass an existing primitive;
- **rendering view model:** semantic state that is inferred from copy rather than passed as typed
  presentation data;
- **not a design issue:** backend schedule, result, entitlement, persistence, or plan-generation
  truth unless it produces a visible state-contract failure.

## Evidence Method

### Source inspection

The audit inspected:

- canonical docs and the active Hito DS plan;
- `src/styles.css` and all imported style owners;
- all files in `src/components/ui/` and `src/components/hito-ds/`;
- all current route files in `src/routes/`;
- shared runner shell, onboarding, calendar, workout detail, completion, plan-management, import,
  settings, progress, integrations, admin, and devtool component owners;
- the prior completed primitive-token audit and component-adoption audit, used as regression
  baselines rather than reopened work.

### Fresh visual inspection

Fresh read-only browser evidence was captured under:

`qa-artifacts/screenshots/2026-07-18/service-wide-hito-ds-conformance-audit/`

Representative desktop inspection covered:

1. `/hitoDS/foundations` in light and dark;
2. `/hitoDS/components`;
3. `/hitoDS/patterns`;
4. `/login`;
5. `/changelog`;
6. authenticated no-plan onboarding at `/`;
7. `/settings`, `/progress`, and `/integrations`;
8. `/admin/login`;
9. admin Overview, Users empty state, Test accounts, and Work items.

Representative exact `375px` inspection covered:

1. signed-out workout preview;
2. `/hitoDS/components`;
3. `/login`;
4. `/changelog`;
5. authenticated no-plan onboarding;
6. `/settings`, `/progress`, and `/integrations`;
7. admin Work items and Test accounts.

Measured pages reported `visualViewportWidth = 375` and no page-level horizontal overflow. The admin
Test accounts table correctly preserved a contained horizontal scroll region rather than widening
the document.

### Visual coverage gaps

- The available local runner fixture had no active persisted plan. Saved calendar, plan-management,
  completed workout, feedback, and body-note states were audited from source and accepted historical
  evidence rather than recreated with mutation.
- The local runtime later stopped compiling because
  `src/components/settings/ThemePreferenceSection.tsx:60` exports `THEME_OPTION_COPY` without a local
  binding. Browser evidence captured before that HMR failure remains usable; captures `30` and `31`
  are excluded. The source defect is a FRONTEND runtime issue, not a DS conformance decision.
- Admin Users had no real local rows, so the full Users table was source-audited; Test accounts
  provided the live wide-table proof.

## Audited Surface Inventory

| Product area | Representative owners | Evidence |
| --- | --- | --- |
| Auth | `AuthEntryScreen.tsx`, `login.tsx`, `admin.login.tsx` | Source + desktop/375 visual |
| Runner shell and navigation | `AppShell.tsx`, shell CSS owners | Source + onboarding/settings/progress/integrations visual |
| No-plan onboarding | `OnboardingGate.tsx`, `src/components/onboarding/*` | Source + desktop/375 visual |
| Calendar/home | `Calendar.tsx`, `TodayHero.tsx`, `hito-calendar-day.tsx` | Source + accepted calendar evidence |
| Workout detail | `workout.$date.tsx`, workout structure/readback components | Source + signed-out desktop/375 visual |
| Completion and feedback | `CompletionPanel.tsx`, `src/components/workout-completion/*` | Source + accepted historical evidence |
| Manual workout authoring | `src/components/manual-workout/*` | Source + accepted manual-editor evidence |
| Plan management and import/export | `src/components/plan-management/*`, `UploadJsonDialog.tsx` | Source |
| Settings/profile/body | `settings.tsx`, `body.tsx`, `BodyNotesEditor.tsx` | Source + settings visual |
| Progress and integrations | `progress.tsx`, `integrations.tsx` | Source + desktop/375 visual |
| Public history | `changelog.tsx`, `change-log.tsx` | Source + desktop/375 visual |
| Admin workspace | `admin.analytics.tsx`, `admin.capture.tsx`, `src/components/admin/*` | Source + desktop/375 visual |
| Hito DS reference | `hitoDS*.tsx`, `src/components/hito-ds/*` | Source + foundations/components/patterns visual |
| Local-only tools | `src/components/devtools/*` | Source only; production boundary preserved |

## Current Canonical Foundation Inventory

### Tokens

| Family | Canonical owner | Audit judgment |
| --- | --- | --- |
| Raw and semantic color | `src/styles/foundations.css:98-121`, dark/light semantic mappings | Strong. Keep one token system. |
| Workout colors | `src/styles/foundations.css:122+`, `src/lib/workout-color-tokens.ts` | Strong and accepted. Do not reopen. |
| Typography families | Poppins, Fraunces, JetBrains Mono in `foundations.css:90-92` | Strong and consistent. |
| Typography roles | `src/styles/layout-typography.css` | Strong, with two repeated role gaps below. |
| Spacing | `--space-1` through `--space-10`, exposed as `--spacing-hito-*` | Strong. Most remaining arbitrary geometry is intentional. |
| Radius | base radius plus `sm` through `4xl` | Strong. No broad radius cleanup needed. |
| Borders | semantic border, hairline, input, and ring roles | Strong. Most product surfaces consume them. |
| Icons | `Icon`, central metadata registry, `xs/sm/md/lg` sizes | Strong. No direct product `lucide-react` drift found. |
| Motion | repeated `160ms ease` recipes across CSS owners | Coherent in practice but undocumented as a token. Low priority. |
| Elevation | consumers use `shadow-soft`, but no generated utility or semantic token owns it | Real DS gap. |

### Existing shared primitives

- Hito logo and mark;
- Icon registry;
- button class family and icon buttons;
- input, textarea, native select, Radix select, date/time input, and editable value chip;
- checkbox, radio, choice toggle, choice-card, and scale-control recipes;
- tabs;
- DropdownMenu, Popover, Tooltip, Dialog, Sheet, and toast;
- status pills, metadata tags, value tags, and inline editable text;
- surfaces, state surfaces, list rows, grouped rows, metric CSS anatomy, and dividers;
- Hito calendar day cell and workout day row;
- skeletons;
- admin operational search/filter/table controls;
- Hito DS playground and reference-page anatomy.

## Findings By Severity

### H1 — Mobile onboarding action footer occludes content

| Field | Finding |
| --- | --- |
| Severity | High |
| Classification | Existing consumer/layout contract correction |
| Visible problem | At exact `375px`, the fixed create-plan footer overlays the beginning of the Running level section. The page does not overflow horizontally, but visible reading order is obscured. |
| Evidence | `15-mobile-375-onboarding.png`; `src/styles/forms-onboarding.css:120-185` |
| Root cause | The fixed footer overlaps readable content at 375px, but current `OnboardingGate` does not mount the audit's assumed `data-mode="quick"`. Those selectors are dead in the current import/DOM graph, so implementation must identify the actual computed-layout owner instead of patching the superseded diagnosis. |
| Canonical owner | FRONTEND consumer layout using existing shell/footer spacing tokens |
| Affected surfaces | Quick setup/no-plan onboarding at narrow widths |
| Disposition | Reproduce the occlusion, correct the actual shared onboarding layout owner, and delete dead `data-mode="quick"` selectors if they remain consumerless. Reuse the existing mobile nav height and safe-area variables; do not invent a second sticky-action component. |
| Validation | Exact `375px` screenshot at top and mid-scroll; Running level remains readable; footer stays reachable; no horizontal overflow; desktop layout unchanged. |

### H2 — Completion and preset selections bypass existing choice/scale/field primitives

| Field | Finding |
| --- | --- |
| Severity | High |
| Classification | Migrate consumers to existing primitives |
| Visible problem | Similar one-of-many choices use different visual and accessibility grammars. Completion outcome cards are local surfaces; interval counts and RPE are local button scales; actual metric inputs bypass field states; preset goal cards use primary/secondary CTA styling as radio options. |
| Evidence | `CompletionPanel.tsx:270-382`, `CompletionPanel.tsx:1269-1335`, `PlanPresetPanel.tsx:316-363`; canonical choice states in `controls-lists.css:866-1006` |
| Root cause | Consumer implementation preceded or did not adopt the accepted `hito-choice-toggle-card`, `hito-scale-control`, and `hito-field` contracts. |
| Canonical owner | FRONTEND consumers; Hito DS already owns the needed language |
| Affected surfaces | Log result/completion; Quick setup goal selection |
| Disposition | Migrate selection and field anatomy. Do not add `HitoOutcomeCard`, `HitoPresetCard`, or another control family unless migration proves a missing repeated behavior. |
| Validation | Keyboard and pointer selection, `role`/ARIA state, focus-visible, selected, disabled, error, dark/light, desktop and exact `375px`. Product behavior and payloads remain unchanged. |

### H3 — Semantic feedback/state surfaces are only partially owned

| Field | Finding |
| --- | --- |
| Severity | High |
| Classification | Repeated Hito DS gap |
| Visible problem | Consumers set `data-tone="success"`, `warning`, or `destructive` on `hito-surface-flat`, but the flat-surface primitive has no tone contract. Other surfaces recreate tone borders/backgrounds locally. Inline editable text hardcodes white-alpha hover/focus washes, which assumes dark surfaces. |
| Evidence | `reference-workbench.css:36-40`; `settings.tsx:206-209`; `admin.analytics.tsx:217`; `calendar-state-surfaces.css:296-325`; `inline-editable-text.tsx:19-20` |
| Root cause | Semantic state roles exist in the palette, but shared surface and interactive-wash usage is incomplete. |
| Canonical owner | Hito DS |
| Affected surfaces | Settings save/error messages, admin state panels, completion feedback, inline-editable titles in light mode |
| Disposition | Either extend one existing compact state-surface owner to the required tones or remove unsupported `data-tone` usage in favor of the already-owned state surface. Replace white-alpha interaction washes with semantic foreground/surface mixes. Do not create another card family. |
| Validation | `/hitoDS` matrix for neutral/signal/success/warning/destructive in both themes; hover/focus/disabled for inline editing; settings/admin/completion readback at desktop and `375px`. |

### H4 — Intended soft elevation is a silent no-op

| Field | Finding |
| --- | --- |
| Severity | High |
| Classification | Hito DS token/utility gap |
| Visible problem | Popovers, value-tag affordances, Hito DS light specimens, and local-only tools request `shadow-soft`, but no CSS or Tailwind theme owner defines that utility. Intended separation can disappear without an explicit failure. |
| Evidence | `popover.tsx:22`, `value-tag.tsx:60`, `light-palette-reference.tsx:77`, `LocalUiInspector.tsx:280+`; repository search returns consumers but no definition |
| Root cause | A class name was adopted before a semantic elevation token/utility became canonical. |
| Canonical owner | Hito DS foundations |
| Affected surfaces | Popover and compact elevation consumers in both themes |
| Disposition | Define one theme-safe soft elevation token/utility or remove the class and use the existing accepted elevation recipe. Do not add multiple shadow tiers without demonstrated product use. |
| Validation | Computed style proves the elevation exists; popover separation remains calm in light/dark; no dark-theme regression. |

### M1 — A parallel legacy Button visual API remains inside the calendar primitive

| Field | Finding |
| --- | --- |
| Severity | Medium |
| Classification | Existing primitive consolidation |
| Visible problem | `src/components/ui/button.tsx` still owns shadcn/CVA variants, sizes, focus, shadows, and radii that differ from the public Hito button class family. Calendar uses this parallel API and date-picker styling compensates locally. |
| Evidence | `button.tsx:7-51`; `calendar.tsx:8`, `calendar.tsx:153+`; Hito button owner in `controls-lists.css:2+` |
| Root cause | A low-level dependency retained its imported visual contract after Hito buttons became canonical. |
| Canonical owner | Hito DS shared control layer |
| Affected surfaces | Calendar/date picker and any future imports of the legacy Button |
| Disposition | Keep one Hito-backed button contract or mark the wrapper as an internal calendar compatibility seam whose output is fully Hito-owned. Do not add a third Button API. |
| Validation | Date picker month navigation, day focus, disabled dates, keyboard behavior, dark/light, desktop and narrow popover containment. |

### M2 — `/hitoDS` does not fully prove its runtime source of truth

| Field | Finding |
| --- | --- |
| Severity | Medium |
| Classification | DS reference/specimen gap |
| Visible problem | Some specimens manually recreate runtime anatomy, accepted shared primitives lack clear canonical specimens, the state matrix is incomplete, and the workout library claims every canonical identity while showing 31 of 32. |
| Evidence | `reference-components-controls.tsx:787`, `reference-components-controls.tsx:825`; real owners `avatar.tsx`, `editable-value-chip.tsx`, `native-select-field.tsx`, `metadata-tag.tsx`; `workout-library-playground.tsx:65-70`; `workout-library-playground-data.ts` count `31`; `rich-workout-model.ts` includes `selected_distance_completion_or_checkpoint` |
| Root cause | Reference content evolved through static proof blocks rather than continuously consuming the runtime owners and canonical model. |
| Canonical owner | Hito DS reference |
| Affected surfaces | `/hitoDS/components`, `/hitoDS/patterns`, workout library |
| Disposition | Demo real runtime components; reserve static replicas for forced visual states only. Add the missing shared-component specimens and complete or honestly relabel taxonomy coverage. Add a lightweight source-parity check where a claim is exhaustive. |
| Validation | Runtime component imports visible in specimens; canonical identity count equals specimen coverage or copy says curated; deep links and desktop/375 reference navigation remain stable. |

### M3 — Repeated metric and workout-title anatomy lacks one owner

| Field | Finding |
| --- | --- |
| Severity | Medium |
| Classification | Repeated DS gap |
| Visible problem | Today, workout detail, calendar support, and progress repeat the same metric value/unit/label anatomy. Today and workout detail repeat the same display-title recipe with `leading-[1.05]`. |
| Evidence | `TodayHero.tsx:77`, `TodayHero.tsx:262`; `workout.$date.tsx:186`, `workout.$date.tsx:753`; `Calendar.tsx:769`; `progress.tsx:286`; existing metric CSS owner in `shell-admin-analytics.css:322+` |
| Root cause | CSS roles exist, but repeated React composition and the workout-title scale were never named as shared ownership. |
| Canonical owner | Hito DS typography/composition |
| Affected surfaces | Home, workout detail, calendar support, progress |
| Disposition | First align the title with an existing role or add one narrow workout-title role. A small `HitoMetric` value/unit/label owner is justified only if Architecture confirms identical anatomy across the four consumers; data formatting remains local. |
| Validation | Same hierarchy and wrapping at desktop/375; no metric-size regression; no product-data formatting moves into DS. |

### M4 — The root 404 fallback bypasses Hito DS

| Field | Finding |
| --- | --- |
| Severity | Medium |
| Classification | Migrate consumer to existing primitives |
| Visible problem | The global fallback uses raw utility typography and legacy primary-button styling rather than Hito state, title, copy, and button roles. |
| Evidence | `src/routes/__root.tsx:10-25` |
| Root cause | Imported route fallback was not included in product-consumer migration. |
| Canonical owner | FRONTEND root route |
| Affected surfaces | Unknown URLs in both themes |
| Disposition | Recompose with existing state surface, typography, and button classes. No new empty-state component is required. |
| Validation | Unknown URL in light/dark at desktop/375; focus-visible and home navigation; no new route behavior. |

### M5 — Admin mobile shell identity needs one reproduction check

| Field | Finding |
| --- | --- |
| Severity | Medium pending reproduction |
| Classification | Possible consumer layout drift |
| Visible problem | In the fresh `375px` Work items capture, the top location title is visibly reduced to `Ace` even though source supplies `Admin workspace`. The rest of the page remains contained. |
| Evidence | `28-mobile-375-admin-work-items.png`; source `AdminWorkspaceNav.tsx:61-88` |
| Root cause | Likely clipping/overlap in the compact location/account row, not a missing brand primitive. |
| Canonical owner | FRONTEND admin shell consumer |
| Affected surfaces | Admin mobile topbar |
| Disposition | Reproduce before changing. If confirmed, correct the shared admin mobile topbar layout; do not create a route-specific Work items header. |
| Validation | Overview, Test accounts, and Work items at exact `375px`; full location title visible; account trigger remains reachable; section rail remains contained. |

### L1 — Motion timing is coherent but not canonicalized

| Field | Finding |
| --- | --- |
| Severity | Low |
| Classification | Documentation/token ownership gap |
| Visible problem | `160ms ease` is repeated across six CSS owner files. It looks consistent today but can drift silently. |
| Evidence | `reference-workbench.css`, `forms-onboarding.css`, `controls-lists.css`, `shell-admin-analytics.css`, `overlays-feedback.css`, `calendar-state-surfaces.css` |
| Root cause | Shared motion language exists by convention rather than token. |
| Canonical owner | Hito DS foundations |
| Disposition | Document or tokenise one fast interaction duration only when a touched shared primitive benefits. Do not open a motion-system project. |
| Validation | Reduced-motion behavior remains intact; no visible timing regression. |

### L2 — Technical prompt/code surfaces repeat a small local recipe

| Field | Finding |
| --- | --- |
| Severity | Low |
| Classification | Repeated gap, extraction conditional |
| Visible problem | Admin prompt readback and two local devtools repeat similar mono surface/wrap/scroll anatomy. |
| Evidence | `admin.capture.tsx:1205+`, `LocalUiTaskDraftPanel.tsx:357+`, `LocalScreenCaptureFlow.tsx:319+` |
| Root cause | The pattern is small and was built independently. |
| Canonical owner | Hito DS technical content only if all three consumers remain |
| Disposition | Extract one code/prompt block recipe only when one of these surfaces is next touched. Do not prioritize it over product controls. |
| Validation | Contrast, selectable text, wrap/contained scroll, light/dark, and `375px`. |

## Findings Outside DS Ownership

### Week-status tone is inferred from English copy

`AppShell.tsx` reconstructs status tone from label text rather than receiving a semantic tone from
the training presentation model. The visible pill is a valid Hito DS consumer; the first incorrect
owner is the rendering view model. Fixing the pill would patch the symptom.

Disposition:

- route separately to the rendering-view-model owner;
- keep `hito-status-pill` unchanged;
- validate every `WeekStatus` independently of copy.

### Current theme module export blocks continued visual audit

`ThemePreferenceSection.tsx:60` exports `THEME_OPTION_COPY` without importing or defining it. The
local Vite runtime failed after HMR. This is a current source/runtime defect and must be fixed before
the next broad browser or build gate, but it does not justify changing the theme tokens or appearance
design.

Disposition:

- FRONTEND module/export correction;
- no DS redesign;
- rerun the excluded light product surfaces after the source compiles.

## Component Ownership Inventory

### Existing primitives that should remain canonical

- `Icon` and workout glyphs as separate families;
- `hito-button*`, `hito-field*`, textarea/select/date input;
- `hito-checkbox`, radio, choice toggle/card, and scale control;
- tabs;
- DropdownMenu, Popover, Tooltip, Dialog, Sheet, and toast;
- surfaces, rows, status pills, metadata/value tags;
- Hito calendar day and workout row;
- admin operational table/search/filter components;
- Hito DS playground/reference-page anatomy.

### Implemented shared primitives that need clearer `/hitoDS` ownership

- `HitoNativeSelectField`;
- `EditableValueChip`;
- `HitoMetadataTag`;
- runtime Avatar anatomy;
- `AdminOperationalComponents` table toolbar/header/menu composition.

### Duplicate route-local patterns to migrate

- Completion outcome choice cards;
- Completion interval and RPE scales;
- Completion actual metric fields;
- Quick setup plan-goal cards;
- unsupported `data-tone` use on flat surfaces;
- workout title recipe;
- root 404 state;
- conditional technical code block recipe.

### Proposed additions only where reuse is proven

- one semantic soft-elevation token/utility;
- one narrow workout-title typography role if an existing role cannot match;
- one small metric value/unit/label owner after consumer anatomy is confirmed;
- no new selectable-card, scale, field, button, modal, table, or status family.

## Typography, Spacing, Radius, And Responsive Summary

### Typography

- Main editorial and body hierarchy is coherent across auth, onboarding, workout, progress, settings,
  integrations, admin, and `/hitoDS`.
- The only material product title drift is the repeated workout-title recipe and the raw 404
  fallback.
- Admin compact titles are visually coherent and should not be forced into a larger runner hero role.
- Mono text is correctly limited to metrics, dates, and technical readback.

### Spacing and density

- Route gutters, stacks, grouped rows, and low-card rhythm are broadly adopted.
- The mobile onboarding action footer is the only fresh high-severity spacing failure.
- Admin wide tables correctly preserve table semantics and contained horizontal scroll.
- Test account rows are intentionally operational/data-dense; do not convert them to mobile cards.

### Radius and borders

- Product controls and surfaces predominantly use the canonical radius scale and hairline roles.
- No broad radius cleanup is justified.
- Manual editor, calendar cells, charts, and timeline geometry use local dimensions for domain
  legibility and should remain exceptions.

### Responsive behavior

- Fresh exact `375px` evidence found no page-level horizontal overflow.
- Hito DS page navigation already escalates its page-switching menu to a full-height Sheet in source.
- The mobile onboarding footer clearance and possible admin topbar crop need targeted correction;
  they do not justify a new responsive framework.

## Explicit Do Not Change

The following custom-looking work is intentional and correctly scoped:

- auth atmospheric image composition and hero geometry;
- workout type and section colors, including structural-only Repeat ownership;
- calendar day cell and mobile workout-row geometry;
- workout structure timeline proportions and chart/SVG geometry;
- body-map geometry;
- manual workout drag/drop coordinates and editor-specific insertion geometry;
- skeleton dimensions tied to real content shapes;
- changelog editorial rails;
- `/test-calendar` static product-design sandbox ownership;
- Hito DS workbench/Figma export scaffolding;
- local-only inspector/capture positioning;
- domain mapping for status labels, entitlement tiers, integration state, and workout identity, unless
  the mapping incorrectly derives semantic state from copy.

## Prioritized Remediation Candidates

No more than three candidate batches should be opened from this audit.

### Candidate 1 — Consumer control convergence

**Recommended first batch.**

Goal:

- remove the highest-value product-level visual and interaction drift by reusing existing Hito DS
  controls;
- correct the mobile onboarding footer clearance in the same no-plan/selection validation story.

Targets:

- `PlanPresetPanel`;
- Completion outcome, interval, RPE, and actual metric controls;
- narrow onboarding footer clearance.

Owner:

- FRONTEND.

Risk:

- low to medium; interaction semantics and layout change, product payloads do not.

Validation:

- desktop and exact `375px`;
- dark and light;
- keyboard, pointer, focus-visible, selected, disabled, and error states;
- no onboarding content occlusion;
- unchanged completion/onboarding product behavior.

### Candidate 2 — Semantic state and elevation owner correction

Goal:

- make shared feedback surfaces, inline-edit interaction washes, and soft elevation truthfully
  semantic across both themes.

Targets:

- existing surface/state owners;
- inline editable text;
- `shadow-soft` consumers.

Owner:

- Hito DS / FRONTEND.

Risk:

- medium because a shared token change can affect many consumers.

Validation:

- `/hitoDS` state matrix first;
- computed elevation proof;
- settings/admin/completion/inline-edit consumers in dark/light at desktop and `375px`;
- no dark-theme regression.

### Candidate 3 — Reference truth closure

Goal:

- make `/hitoDS` prove actual runtime components and canonical model coverage.

Targets:

- real Avatar and EditableValueChip demos;
- HitoNativeSelectField and HitoMetadataTag specimens;
- complete loading/empty/error/success state matrix;
- workout taxonomy parity or honest curated wording;
- concise source hierarchy and duplicate specimen cleanup.

Owner:

- Hito DS / FRONTEND.

Risk:

- low; reference-only if runtime component behavior is unchanged.

Validation:

- source parity checks;
- deep links;
- desktop and exact `375px`;
- no reference route overflow;
- product runtime unchanged.

## Residual Findings Not Selected As Batches

- Legacy Button/calendar compatibility should receive a dedicated Architecture decision before the
  date picker is next changed.
- Workout-title and metric ownership should be consolidated only after exact consumer anatomy is
  compared.
- Root 404 migration is safe but lower leverage.
- Admin mobile title crop must be reproduced before source changes.
- Motion and technical code-block extraction should remain opportunistic.

## QA Expectations For Any Selected Batch

1. Validate the canonical shared owner before route consumers.
2. Test dark and light without changing the accepted dark palette.
3. Capture desktop and exact `375px`; report `innerWidth`, `visualViewport.width`, and document
   scroll width.
4. Check keyboard operation, focus-visible, disabled, selected, invalid, and screen-reader state for
   interactive controls.
5. Prove no page-level horizontal overflow; table-local scroll is acceptable.
6. Preserve backend-shaped values and product behavior.
7. Run source parity checks when `/hitoDS` claims exhaustive coverage.
8. Do not accept browser screenshots from a runtime that still has the theme export compile error.

## Exit Criteria

This audit is complete when:

- every material finding has a severity, owner, disposition, and validation story;
- intentional domain exceptions are protected from generic normalization;
- no more than three remediation candidates are offered;
- the active Hito DS plan links to this report;
- Architecture selects one bounded next batch instead of reopening broad DS redesign.

Strict service-wide conformance is accepted in this audit scope because:

- existing choice/scale/field consumers use the canonical contracts;
- semantic state/elevation owners are truthful in both themes;
- the mobile onboarding action no longer obscures content;
- `/hitoDS` demonstrates real shared owners and honest canonical coverage;
- current runtime/build blockers are resolved and the selected surfaces pass desktop/375 proof.

## Blockers

- None. The theme export boundary and all three bounded remediation candidates are accepted.
