# Hito DS Canonical Token Adherence And Exception Census

## Work Item ID

2026-08-13-hito-ds-canonical-token-adherence-and-exception-census

## Status

completed

## Type

design-system-research

## Priority

high

## Owner

designer

## Mode

Tracked

## Stage

DESIGNER read-only audit and decision inventory completed; returned to PRODUCT for bounded repair
routing.

## Next Recommended Role

PRODUCT — route only the bounded owner slices listed in the audit. DESIGN SYSTEM is the first
recommended implementation owner after the active Foundations cleanup has returned and its reference
validator expectations are reconciled.

## Scope

Produce one evidence-backed inventory of visual-token adherence across current Hito runtime source: canonical primitives and semantic roles, shared Design System components/CSS, `/hitoDS` reference composition, and Product/Marketing/Admin consumers that introduce visual styling.

The audit covers colors/surfaces/alpha, radius, spacing/padding/gap, borders/edges, typography geometry where it embeds visual values, and state variants only to determine ownership. It identifies real departures from the established Hito Design System and valid exceptions; it does not implement a migration or imply that every numeric literal must become a global token.

## Archive Intent

retain_in_place

## User Problem

Ivan repeatedly observes values such as a 10px radius and custom background/alpha values such as 42% in the Design System. He needs a trustworthy, comprehensive answer to three questions before further cleanup:

1. Which rendered visual values already resolve through canonical Hito tokens?
2. Which live values bypass a canonical token or duplicate an existing DS role?
3. Which non-token values are intentional component/domain/instance facts and must remain local?

The result must be a practical repair inventory, not a vague claim that there are too many CSS files or arbitrary values.

## Context And Prior Decisions

- [Tokenized Neutral-Chrome Migration](2026-08-11-hito-ds-tokenized-neutral-chrome-migration.md) established that neutral alpha/chrome roles are semantic and theme-resolved, while structural surfaces and chromatic intent remain distinct.
- [CSS Ownership And Recipe Consolidation](2026-08-12-hito-ds-css-ownership-and-recipe-consolidation.md) established that one CSS entrypoint with bounded ownership is intentional; multiple CSS files are not by themselves a defect.
- [UI Simplification Source-Of-Truth Audit](2026-08-12-hito-ui-simplification-source-of-truth-audit.md) found no duplicate recipe authority at its snapshot, but did not produce a complete current literal-to-token exception census.
- Active visual work may change `/hitoDS` while this audit runs. Capture the source snapshot before conclusions; do not overwrite, accept, or audit an active task-owned diff as a stable finished contract.

## Canonical Owners To Inspect First

- `src/styles/foundations.css` — primitive colors, semantic theme mappings, alpha roles, spacing, radius, typography, motion, and shared edge authority.
- `src/styles.css` — intentional import-order owner.
- Canonical component CSS owners: `src/styles/controls-fields.css`, `src/styles/controls-lists.css`, `src/styles/overlays-feedback.css`, and the existing component source that supplies state/instance data.
- Domain/reference composition owners: `src/styles/reference-workbench.css`, `src/styles/layout-typography.css`, `src/styles/forms-onboarding.css`, `src/styles/shell-admin-analytics.css`, and `src/styles/calendar-state-surfaces.css`.
- `src/components/ui/`, `src/components/hito-ds/`, routes, and Product component source only where a visual value is declared in TSX/class composition or inline style.
- Existing manifest generator and DS validator only as evidence of declared canonical roles; neither is a reason to add audit machinery.

## Audit Method

1. Record the current dirty-worktree inventory and a bounded runtime-source snapshot before classifying findings. Preserve every unrelated hunk.
2. Enumerate canonical primitive and semantic values first: spacing, radius, colors, alpha/overlay roles, borders, typography roles, and approved theme mappings.
3. Census live styling declarations in the named CSS and TSX owners. Include literal dimensions, direct color formats, `color-mix()`/alpha recipes, arbitrary utility values, custom properties, and inline `style` values only when they determine a visual outcome.
4. For every candidate, trace its first visual owner and live consumer. Do not call a value non-canonical only because it is written in a CSS file other than `foundations.css`.
5. Where a candidate appears suspect, compare it with the active-theme computed result or an existing token/recipe. Use browser inspection only when source cannot tell whether it is instance data, an alias, or a visible duplicate.
6. Classify every reviewed candidate exactly once:
   - `canonical token consumption`;
   - `intentional component anatomy`;
   - `intentional domain composition`;
   - `instance or calculated renderer data`;
   - `confirmed noncanonical duplicate`;
   - `confirmed token gap`;
   - `possible discrepancy — needs rendered discriminator`; or
   - `dead or unreachable candidate`.
7. Do not turn a static literal search into a defect list. Values governing charts, gradients/art direction, third-party/SVG source artwork, image dimensions, animation math, calculated positions, data visualization, and browser-required geometry may be valid local facts. State why where retained.

## Required Research Artifact

Update this canonical item with an English audit report containing:

- a short canonical value map: available spacing/radius/color/alpha/edge families and their owners;
- an exhaustive table of actionable findings, ordered by first incorrect owner and severity, with: category, exact file/line/seam, declared value, computed or consumer evidence, existing canonical replacement if one exists, why it is a real discrepancy rather than a valid exception, smallest net-reducing repair, preserved boundary, and next canonical implementation owner;
- a compact, separately labelled list of retained intentional exceptions with their rationale;
- a distinct list of uncertain cases and the exact browser/source discriminator needed — no recommendation to change them yet;
- a migration order that groups only disjoint same-owner repairs, names dependencies on active work, and explicitly calls out deletions/reductions expected from each later slice;
- an estimate of repair scope expressed as candidate groups and owners, not fabricated line counts; and
- a clear conclusion: whether Hito currently has systemic token-bypass defects, a bounded set of local deviations, or primarily intentional exceptions.

The final inventory is the sole requested “big research file.” Do not create a second tracker, CSV, generated report, compatibility registry, token proposal file, or styling framework.

## What Not To Touch

- Runtime source, styles, tokens, manifests, validators, generated files, Product/DevTools behavior, tests, fixtures, persistence, auth, providers, Figma, Git lifecycle, hosted state, or deployment.
- Existing canonical receipts except this task's own lifecycle and audit report.
- Active task-owned work, especially the Foundations visual-cleanup batch; record a coverage boundary rather than changing or accepting concurrent edits.
- Do not propose a mega stylesheet, a new token system, Tailwind/CSS-in-JS migration, raw-literal ban, or a token for every literal.

## Validation Expectations

- Source inventory is reproducible and distinguishes definitions from consumers.
- Every actionable claim has an exact owner/seam and live reachability or a recorded discriminator.
- At least one dark and light computed-style check is used for each proposed alpha/color repair class where source alone cannot prove theme resolution.
- Existing DS validator/manifest facts may be read, but no implementation validation, build, fixture, provider, Git, or release work is required.
- `git diff --check` passes for this task-owned documentation change.

## Exact Handoff Prompt

```text
ROLE: DESIGNER

Task:
Run the tracked, read-only audit in:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-13-hito-ds-canonical-token-adherence-and-exception-census.md`

Read before any audit conclusion:
- `AGENTS.md`
- `agents/designer.agent.md`
- `skills/hito-frontend-design-system/SKILL.md`
- `skills/hito-architecture-audit/SKILL.md`
- the entire canonical item and the three prior-decision items linked from it.

Stage:
DESIGNER read-only audit and decision inventory.

Outcome:
Produce one factual, comprehensive inventory of whether current Hito UI color/surface/alpha, radius, spacing/padding/gap, edges, and styling geometry resolve through the canonical Design System or are justified local facts. Name only source-backed deviations. The inventory must let PRODUCT route later net-reducing repairs by owner without a rewrite.

Required method:
- Capture the current source/dirty snapshot first and preserve concurrent work byte-for-byte.
- Start from the Foundation token vocabulary, then trace live consumers and local declarations in the named CSS/TSX owners.
- Classify each candidate exactly once using the taxonomy in the item. A numeric literal, local CSS file, `color-mix`, or alpha value is not a defect by itself.
- For an alleged duplicate or token bypass, provide its first incorrect canonical owner, exact source seam, consumer/reachability evidence, canonical replacement if one exists, smallest net-reducing repair, preserved boundary, and later owner.
- Use a browser/computed-value discriminator only where it materially distinguishes theme resolution or instance data from a genuine visual recipe.

Boundaries:
- Read-only except this canonical item’s English lifecycle and audit report.
- Do not implement or modify runtime source, CSS, tokens, manifests, validators, Product/DevTools, Figma, fixtures, Git, hosted state, or deployment.
- Do not create a new report system, generated inventory, registry, token framework, mega stylesheet, or a literal-ban proposal.
- Do not interrupt or absorb active Foundations cleanup work. Record concurrent coverage as a boundary if needed.
- Do not use a same-discipline implementation subagent. Request a bounded read-only QA browser fact only if a precise visual discriminator cannot be safely obtained yourself; name the question, needed route/theme/state, and return condition.

Return only when this canonical item contains the English research report, actionable and retained-exception lists, the repair order, coverage gaps, and next recommended owner(s). Do not claim implementation, Global QA, release readiness, Figma, hosted, or deployment proof.
```

## Blockers

None for the read-only audit. Any active source movement is a coverage boundary, not permission to mutate, merge, or defer the inventory indefinitely.

## Product Dispatch

Dispatched to the existing `DESIGNER` sidebar role. No child implementation or review agent is authorized by this handoff unless the Designer identifies a narrowly necessary, named-role read-only discriminator under `AGENTS.md`.

## Designer Audit Report — 2026-08-13

### Decision

Hito does **not** have a systemic Foundation-token failure or evidence that the number of imported
CSS owner files is itself causing visual drift. The current Foundation layer is coherent, theme
resolved, manifest-backed, and already used broadly. The census does identify a bounded set of live
local deviations:

1. keyboard focus cues that attenuate `signal` locally instead of using the established solid
   `ring` role;
2. a small number of exact local copies of existing chrome, edge, text, and radius values;
3. ordinary interactive hover/focus recipes that remain local after the neutral-chrome migration;
4. foreground/current-colour text attenuation in CSS and TSX that bypasses the established text-tone
   contract; and
5. two route-fallback action recipes that bypass the shared Button contract.

Most other literals are component anatomy, structural containment, semantic/domain composition, or
calculated renderer data. In particular, `42%` is not one global level and is not a defect category.
The instances using that number have different owners and meanings.

### Snapshot And Preservation Boundary

- Audit checkout: `/Users/ivan/Developer/hito-running`, branch `main`, `HEAD`
  `74607987885ca40f33658c79fba174d173d45646`.
- Initial dirty inventory contained modified `AGENTS.md`, the completed release-retry receipt,
  `skills/hito-prompt-handoff/SKILL.md`, `src/components/hito-ds/playground.tsx`, and
  `src/components/hito-ds/reference-foundations-page.tsx`, plus the six untracked backlog items
  reported by `git status --short` at preflight.
- The active item
  `2026-08-13-hito-ds-foundations-compact-specimens-and-demo-signal-cleanup.md` owns the two dirty
  `/hitoDS` source files. Its `reference-foundations-page.tsx` diff moved from 258/143 to 260/143
  added/deleted lines while this audit was running. Those worktree hunks were therefore excluded from
  stable-contract conclusions and preserved byte-for-byte.
- Two consecutive hashes over current `src/**/*.{css,ts,tsx}` excluding only those two active files
  matched at `526ba86cc86bc94546c0575edd5c0cacac6ef26875071b5500e44ef0e8be506c`.
- No runtime source, CSS, token, component, manifest, validator, fixture, or Figma file was changed
  by this audit. No staging, commit, branch, remote, hosted, provider, or deployment state changed.

### Canonical Value Map

| Family                      | Current canonical owner and value map                                                                                                                                                                                                           | Current evidence                                                                                                                                                                                                                                                                                                           |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Radius                      | `src/styles/foundations.css:11-20,114-115`; base `8px`, then SM `4px`, MD `6px`, LG `8px`, XL `10px`, 2XL `12px`, 3XL `16px`, 4XL `20px`.                                                                                                       | The reported 10 px radius is `--radius-xl`; no direct `border-radius: 10px` exists in audited runtime CSS/TSX. The CSS census found 75 direct radius-token declarations and 14 component variables that resolve to that scale.                                                                                             |
| Spacing                     | `src/styles/foundations.css:387-397`; 4, 8, 12, 16, 20, 24, 32, and 40 px, exported through `--spacing-hito-*` at lines 94-101.                                                                                                                 | The CSS census found 346 gap/padding/margin declarations: 54 direct `--space-*` paths, 26 component-variable paths, 48 whole-value on-scale literals, and the remainder reset/alignment, environment/calc, responsive layout, or micro-anatomy facts. A raw on-scale value is not automatically competing token authority. |
| Structural colour           | `background`, `surface`, `surface-elevated`, `card`, and `popover` in Dark at `foundations.css:401-408` and Light at `891-898`.                                                                                                                 | These roles intentionally remain absolute/theme-resolved where they express containment or elevation. Current non-Foundation consumers include 64 `--color-background`, 38 `--color-surface`, 20 `--color-surface-elevated`, and four `--color-popover` variable references.                                               |
| Neutral chrome              | `clear`, `subtle`, `standard`, and `strong` at 0/8/12/16% foreground in Dark `428-431` and Light `918-921`.                                                                                                                                     | Current non-Foundation source contains 6/25/14/9 respective variable references. Exact local formula copies listed below are deviations; other alpha compositions require meaning, not percentage comparison.                                                                                                              |
| Edges and focus             | `chrome-edge-default` 16%, `chrome-edge-emphasis` 32%, plus structural `hairline`/`border`; required focus is solid `--color-ring`.                                                                                                             | Current non-Foundation source contains eight default-edge, nine emphasis-edge, 62 hairline, and 22 border variable references. The predecessor contrast decision measured the solid ring at at least 6.29:1 in Dark and 3.50:1 in Light on declared parents.                                                               |
| Text tone                   | secondary 75%, tertiary 60%, disabled 40%, accent 50/50 signal/foreground, and positive/negative/informative/warning semantic roles at `foundations.css:434-441,924-931`.                                                                       | Current non-Foundation source contains 25 secondary, 11 tertiary, 10 disabled, 9 accent, 12 positive, 15 negative, and one each informative/warning variable references.                                                                                                                                                   |
| Intent and workout identity | Intent roles plus workout type/section base, content, surface, hover, active, border, ring, and foreground families in `foundations.css:178-386,466-885,934-1037`; TS authority in `src/lib/workout-color-tokens.ts` and `src/lib/training.ts`. | Hex bases are Foundation primitives, not consumer literals. Live Calendar, timeline, manual-workout, and readback inline styles receive semantic token strings or calculated identity metadata.                                                                                                                            |
| Typography geometry         | `src/lib/hito-typography-roles.ts` plus `src/styles/layout-typography.css:31-166`; 14 reusable roles and four component-bound roles.                                                                                                            | Manifest parity reports exactly 14 Text Styles. The completed typography decision explicitly permits local uppercase/tracking for a proved calendar/menu/eyebrow component; it does not permit local colour attenuation to masquerade as a text-tone token.                                                                |
| Global cross-owner geometry | Only `--hito-form-section-avatar-width`, `--hito-mobile-bottom-nav-height`, and `--hito-shell-sidebar-width` remain outside Foundation `:root`.                                                                                                 | This matches the completed CSS-ownership decision. Repeated `--hito-dual-range-accent`, `--hito-inline-header-min-width`, and `--hito-typography-role` declarations remain component input/provenance contracts, not duplicate globals.                                                                                    |

### Actionable Findings

Each row below is classified once. Exact local copies and contract bypasses are called
`confirmed noncanonical duplicate`; this classification does not claim a duplicate stylesheet
owner. `confirmed token gap` is used only where the existing foreground-derived text tokens cannot
represent the proved parent-relative role.

| Severity / category                                                          | First incorrect canonical owner                    | Exact source seam and declared value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Consumer / reachability evidence                                                                                                                                                                                                                                                                                                                                                             | Existing replacement                                                                                                                                     | Why this is a discrepancy                                                                                                                                                                                                                                                                 | Smallest net-reducing repair                                                                                                                                                                                                                                                                                                                                     | Preserved boundary                                                                                                                                                         | Later owner                                                                                                                                           |
| ---------------------------------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| High — `confirmed noncanonical duplicate` (focus role, CSS)                  | Shared Design System component/state CSS           | `foundations.css:1251-1257` launcher focus `signal 46%`; `reference-workbench.css:109-112,344-346,554-556` specimen/quick/sidebar link focus `signal 18/20%`; `calendar-state-surfaces.css:179-182,250-253,321-323,359-362` mobile row/feedback/nav-card focus `signal 16/18%`; `shell-admin-analytics.css:49-51,105-107,620-622,660-665` shell row/search/table-header focus `signal 18/22/36%`; `forms-onboarding.css:154-156,1338-1340` selected-plan day/disclosure focus `signal 18/48%`.                                                                                                                                                                                                                                                      | Live consumers include `routes/hub.tsx:100`, `components/hito-ds/reference.tsx:47`, `components/hito-ds/reference-navigation.tsx:149,172`, `components/AppShell.tsx:115,313,324`, `components/Calendar.tsx:833`, `components/ui/hito-calendar-day.tsx:228,582`, `routes/workout.$date.tsx:922`, `components/admin/AdminOperationalComponents.tsx:91,272`, and repeated disclosure summaries. | Solid `--color-ring`, retaining a separate semantic border/background when state meaning requires it.                                                    | Each rule removes the native outline and makes an attenuated local signal mix the sole keyboard cue, contradicting the accepted solid-ring focus contract. Source and the prior two-theme contrast matrix are sufficient; no computed browser discriminator is needed to prove ownership. | Replace the cue with the existing ring role; delete now-redundant focus-only alpha mix declarations and collapse theme-only focus overrides where the structural shadow can inherit from the base state. Do not alter hover, selected, today, semantic border, or elevation recipes.                                                                             | Keep structural shadow/elevation, calendar today/selected meaning, semantic status colours, DOM behavior, and component dimensions.                                        | DESIGN SYSTEM. Split `forms-onboarding.css:154-156` to FRONTEND Product only if the selected-plan domain owner must change more than the focus token. |
| High — `confirmed noncanonical duplicate` (focus role, shared/reference TSX) | Shared component and `/hitoDS` class composition   | `components/ui/inline-editable-text.tsx:19-20` `ring-signal/30`; `components/ui/hito-calendar-day.tsx:124-127` focus outlines `signal/40`; `components/hito-ds/dropdown-family-playground.tsx:211` `ring-signal/20`; `components/hito-ds/workout-library-playground.tsx:262,303` `outline-signal/50`.                                                                                                                                                                                                                                                                                                                                                                                                                                               | `InlineEditableText` is used by Manual Workout and multiple DS reference/export surfaces; `HitoCalendarDayCell` is used by Product Calendar and DS playgrounds; both playground candidates are reachable from `/hitoDS`.                                                                                                                                                                     | Tailwind `ring-ring`/`outline-ring` or the existing canonical CSS focus class using `--color-ring`.                                                      | These are actual focus-visible cues, not semantic selected/today visualization. They attenuate `signal` after the Foundation contract chose a distinct solid `ring`.                                                                                                                      | Replace only focus utilities with the ring role and delete duplicated local alpha utilities. Reuse existing Hito classes where they already own the cue; do not create a focus helper framework.                                                                                                                                                                 | Preserve selected/today/demo state colours, renderer weights, keyboard handlers, and the active Foundations cleanup files.                                                 | DESIGN SYSTEM.                                                                                                                                        |
| High — `confirmed noncanonical duplicate` (focus role, Product TSX)          | Frontend Product consumer class composition        | `components/Calendar.tsx:592-595,621,658` `ring-signal/20` or `/25`; `components/progress/ActivityHistoryPanel.tsx:146` `ring-signal`; `components/workout-structure/WorkoutStructureTimeline.tsx:87-98` removes outline and substitutes hover/focus-driven semantic glow without a ring.                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Calendar is rendered by `routes/index.tsx:55`; Activity History is a live Progress panel; the timeline is used by `WorkoutDocumentReadback.tsx:44` and Manual Workout grammar `:64`.                                                                                                                                                                                                         | Solid `ring-ring`/`outline-ring`; keep semantic timeline glow as a separate state layer.                                                                 | The first two bypass the ring token; the timeline has no independent focus cue after explicitly removing the outline. All are keyboard-reachable.                                                                                                                                         | Replace Calendar/Activity focus utilities and add the existing ring token to the timeline button while deleting focus-only signal attenuation.                                                                                                                                                                                                                   | Preserve Calendar action routing, drag/move behavior, row disclosure, timeline flex/colour calculations, tooltip positioning, and workout semantics.                       | FRONTEND / Product.                                                                                                                                   |
| Medium — `confirmed noncanonical duplicate` (exact semantic formulas)        | Shared Design System CSS declarations              | `shell-admin-analytics.css:55,305,326` exact foreground 8% backgrounds; `:928` exact signal/foreground 50/50 text; `calendar-state-surfaces.css:48` exact foreground 12% inset edge and `:316` exact foreground 16% hover edge.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Shell nav/menu classes are live in `AppShell.tsx` and `AdminWorkspaceNav.tsx`; signal status pills have many Product/Admin/DS consumers; calendar move source is set by `Calendar.tsx:564`; nav cards are live at `routes/workout.$date.tsx:922`.                                                                                                                                            | `--color-chrome-subtle`, `--color-text-accent`, `--color-chrome-standard` or purpose-correct `--color-chrome-edge-default`.                              | The declarations are byte-for-byte semantic formula copies under both themes; unlike visually similar recipes, equality is provable without rendering.                                                                                                                                    | Substitute the semantic role and remove formula text. If the inset is an edge, choose the edge-named alias even though its current numeric result equals strong chrome.                                                                                                                                                                                          | Keep active/selected/status meaning, dimensions, shadows, and structural backgrounds.                                                                                      | DESIGN SYSTEM.                                                                                                                                        |
| Medium — `confirmed noncanonical duplicate` (ordinary interactive chrome)    | Shared component CSS/TSX                           | `components/ui/inline-editable-text.tsx:19-20` hover foreground 6% and focus foreground 8%; `calendar-state-surfaces.css:56-64` ghost-action hover/focus foreground 7%; `shell-admin-analytics.css:44-46,651-656` shell/header hover foreground 6/7%; `components/progress/ActivityHistoryPanel.tsx:146` row hover foreground 3.5%.                                                                                                                                                                                                                                                                                                                                                                                                                 | Every selector/class is attached to a live button, link, editable trigger, or disclosure row; none is a structural parent surface.                                                                                                                                                                                                                                                           | Existing clear/subtle/standard/strong and edge roles; the smallest likely rest-to-hover mapping is clear to subtle.                                      | These recipes are ordinary neutral interaction, the exact reduction target of the accepted neutral-chrome contract. Their local percentages add levels without a distinct semantic role.                                                                                                  | Converge each state on the existing chrome ladder, delete the local percentages, and keep one owner per component. Stop rather than add 3.5/6/7% tokens.                                                                                                                                                                                                         | Do not change sidebar structural colour, Calendar selected/today semantics, table meaning, or active Foundations work.                                                     | DESIGN SYSTEM for shared component/CSS seams; FRONTEND / Product for Activity History only.                                                           |
| Medium — `confirmed noncanonical duplicate` (ordinary text attenuation)      | Shared CSS and consumer class composition          | CSS: `reference-workbench.css:92` foreground 78%; `forms-onboarding.css:80` foreground 66%; `calendar-state-surfaces.css:424,428` foreground 88/92%; `shell-admin-analytics.css:276,287,295,319` foreground 86%. Shared UI: `components/ui/hito-calendar-day.tsx:267,441,597`, `components/ui/hito-slider.tsx:79`. Product: `Calendar.tsx:774`, `CompletionPanel.tsx:279,1022`, `OnboardingGate.tsx:480`, `TodayHero.tsx:154,231`, `progress/SavedPlanLibraryPanel.tsx:568`, `workout-structure/WorkoutStructureTimeline.tsx:163`, `routes/index.tsx:103`, `routes/progress.tsx:78`, and `routes/workout.$date.tsx:416,422,504,795,885`. Marketing/Admin: `AuthEntryScreen.tsx:74`, `routes/changelog.tsx:97,344,354`, `routes/admin.login.tsx:50`. | All are live labels, titles, icons, legends, or supporting body copy. The scan found 23 `text-foreground/*` occurrences after excluding DevTools and the active Foundations file, plus the listed CSS formulas.                                                                                                                                                                              | Primary interactive/title content: `foreground`. Supporting copy/metadata: `text-secondary`; tertiary only when the established caption meaning is true. | Fixed direction requires ordinary text attenuation to resolve through semantic Hito tones. These consumers instead create 66/78/80/82/84/85/86/88/90/92% levels. The markup and accepted typography roles prove the hierarchy purpose; exact shade similarity is not the basis.           | In owner-bounded slices, map primary labels/titles to foreground and supporting copy/metadata to secondary, deleting the opacity utilities/formulas. Stop on a genuinely ambiguous primary-versus-secondary role; do not create a token for each percentage.                                                                                                     | Preserve typography family/size/case, copy, DOM semantics, editorial Fraunces ownership, icon identity, and local uppercase/tracking accepted by the typography programme. | DESIGN SYSTEM for shared CSS/UI; FRONTEND / Product for authenticated/Admin consumers; FRONTEND / Marketing for Auth/Changelog.                       |
| Medium — `confirmed token gap` (parent-relative supporting text)             | Hito Choice component content contract             | `components/onboarding/onboarding-choice-controls.tsx:64`, `TrainingPreferenceFields.tsx:231`, `components/hito-ds/specimen-previews.tsx:514`, and `reference-components-controls.tsx:1396,1402` use `text-current/70` or `/75` for a Choice description.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | All five are children of `HitoChoiceToggle`; selected/semantic states intentionally change the inherited current colour, which a foreground-derived global text token cannot reproduce.                                                                                                                                                                                                      | None currently preserves parent-relative chromatic identity by semantic purpose.                                                                         | Repeated live consumers prove one component slot; replacing it blindly with foreground-derived `text-secondary` would lose selected-state colour relationship, while retaining local percentages violates the accepted attenuation direction.                                             | First measure the description on unselected/selected/disabled states in both themes. If the relationship is required, add one purpose-named Choice supporting-content contract in the existing `HitoChoiceToggle`/`controls-lists.css` seam, migrate all five consumers, and delete all five literals. If not required, reuse `text-secondary` and add no token. | No generic currentColor alpha scale, no Cartesian text-tone family, and no change to selection semantics.                                                                  | DESIGN SYSTEM, after PRODUCT confirms whether selected descriptions must inherit the chromatic parent.                                                |
| Medium — `confirmed noncanonical duplicate` (fallback actions)               | Frontend route fallback renderers                  | `src/router.tsx:41-48` and `src/routes/__root.tsx:20-25` hand-author primary/outlined action geometry and `hover:bg-primary/90`; the primary recipe is duplicated exactly in both files.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | TanStack default error and root not-found components are registered runtime fallbacks, so the candidates are reachable even though they are exceptional routes.                                                                                                                                                                                                                              | Existing Hito Button primary and outlined/secondary contracts.                                                                                           | These are ordinary actions with a shared canonical component recipe, and their local forms omit the established Hito focus/state contract.                                                                                                                                                | Reuse the existing Button/class contract in both fallbacks; delete both primary recipe strings and the local secondary recipe. Do not add an error-page Button variant.                                                                                                                                                                                          | Preserve reset/invalidate behavior, navigation target, error copy, and fallback reachability.                                                                              | FRONTEND / Product.                                                                                                                                   |
| Low — `confirmed noncanonical duplicate` (radius plus redundant override)    | Checkbox component anatomy in `controls-lists.css` | `controls-lists.css:714-716` and `:729-731` both declare `border-radius: 0.25rem`; the latter repeats the base value for the small size.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `.hito-checkbox` and `.hito-checkbox-sm` are canonical live choice controls with DS specimens and Product consumers.                                                                                                                                                                                                                                                                         | `--radius-sm` is exactly 4 px.                                                                                                                           | Equality to the Foundation scale is exact, and the size override duplicates its base rule. The separate medium 5 px radius is size-aware anatomy and is not included.                                                                                                                     | Set the base to `var(--radius-sm)` and delete the redundant `.hito-checkbox-sm` radius block.                                                                                                                                                                                                                                                                    | Keep radio pill geometry, checkbox dimensions, medium 5 px anatomy, state chrome, and hit targets.                                                                         | DESIGN SYSTEM.                                                                                                                                        |

### Retained Intentional Exceptions

| Classification                         | Retained family                                                                                                                                                                                                                                                                                                                                                             | Rationale                                                                                                                                                                                                                                                                            |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `canonical token consumption`          | Foundation aliases, 14 typography roles, workout semantic families, Field/Select, Buttons, choices, overlay controls, date picker, rows/tags, and semantic text classes already using the tokens mapped above.                                                                                                                                                              | These values resolve through the current canonical owner and generated manifest; no second authority was found.                                                                                                                                                                      |
| `intentional component anatomy`        | Radius `999px`/`50%` for pills/circles; `0`/`inherit` for joined/reset shapes; checkbox MD 5 px and legend swatch 3 px; 1 px borders; control heights, icon sizes, hit targets, focus thickness/offset; responsive clamp/env/calc; dense calendar 10 px labels; chart/timeline 9-10 px labels.                                                                              | These values express shape, browser geometry, or size-aware component fit. A token for each would not reduce an owner or prevent demonstrated drift.                                                                                                                                 |
| `intentional component anatomy`        | Existing raw spacing that is either exactly on the compact scale or is a bounded layout/anatomy value.                                                                                                                                                                                                                                                                      | A raw 16 or 20 px declaration does not create a competing global spacing source. No divergent shared contract or deletion was proved. Prefer the scale when later touching a shared recipe, but do not run a standalone literal rewrite.                                             |
| `intentional domain composition`       | `.hito-row-group` background at `controls-lists.css:993-998`; reference-only `.hito-surface-quiet` at `reference-workbench.css:8-27`; Manual Workout Dark/Light surface ladder at `forms-onboarding.css:332-485`; App Shell translucent sidebar/header; auth/launcher gradients; overlay backdrops/shadows; status/intent surfaces; Calendar today/selected/range surfaces. | These express real containment, parent blending, editorial art direction, domain state, or elevation. The predecessor decisions explicitly retained row groups, state surfaces, editor composition, backdrops, and semantic intent. Their percentages are not neutral-chrome levels. |
| `intentional domain composition`       | The visible `42%` families: row-group/background containment, Manual Workout parent blends, slider marker contrast, signal/gradient stop art direction, black backdrop shadow, and a 42% renderer width.                                                                                                                                                                    | Same number, different semantics. No pair is eligible for consolidation on visual similarity alone.                                                                                                                                                                                  |
| `intentional domain composition`       | Success/warn/destructive/info/status mixes and workout type/section colours.                                                                                                                                                                                                                                                                                                | Semantic/intent and workout identity remain deliberately distinct from neutral chrome. Similar 9/10/22/24% values across components do not prove one shared recipe.                                                                                                                  |
| `instance or calculated renderer data` | Slider/dual-range positions, progress widths, tooltip coordinates, comparison/chart heights, timeline flex weights, SVG positions/radii, workout identity inline colours, and Manual Workout marker colours.                                                                                                                                                                | Runtime data or visualization geometry supplies the value; moving it to Foundation would destroy instance truth.                                                                                                                                                                     |
| `intentional component anatomy`        | Local uppercase plus `0.18em` tracking on proved calendar, menu, section-eyebrow, and shell labels.                                                                                                                                                                                                                                                                         | The completed typography programme explicitly retained local case/tracking where the component requires it while keeping reusable Label SM neutral. This is not a revived `micro-label` role.                                                                                        |
| `intentional component anatomy`        | `HitoValueTag` semantic surfaces and compact Select composition, skeleton motion surface, third-party calendar internal classes under the Hito wrapper, and DevTools inspector/capture overlays.                                                                                                                                                                            | These are semantic tag anatomy, loading/visibility, upstream implementation detail with Hito overrides, or local instrumentation visualization. They are not ordinary product neutral-chrome owners.                                                                                 |
| `dead or unreachable candidate`        | None confirmed among the reviewed suspect families.                                                                                                                                                                                                                                                                                                                         | Every actionable selector/class above has a current consumer. Reference-only is still reachable through `/hitoDS` and is not equivalent to dead code.                                                                                                                                |

### Uncertain Cases — No Change Recommendation Yet

1. **SVG body-map keyboard focus:** `BodyNotesEditor.tsx:411-435` makes an SVG `<g>` keyboard
   reachable and changes the child circle from radius 6 to 10 when selected, but source cannot prove
   whether the browser paints a usable focus indicator on the group. Discriminator: keyboard-tab to
   every body point on the completed-workout surface in Dark and Light and inspect the group/circle
   computed outline/paint. If no independent cue exists, FRONTEND Product adds the canonical ring
   without changing selection geometry.
2. **ValueTag compact Select containment:** `components/ui/value-tag.tsx:13-16,84-92` uses
   parent-aware semantic tag surfaces and a neutral `surface/45`/`surface/55` compact trigger rather
   than the ordinary Field surface. Discriminator: compare neutral rest/hover/open/focus on
   background, surface, and elevated parents in both themes. Keep it if the tag is visibly one
   semantic value component; converge only if it reads as an ordinary SelectTrigger duplicate.
3. **Very light structural alphas in Product composition:** representative seams include
   `AppShell.tsx:97,160,236`, `TodayHero.tsx:150-151`, `CompletionPanel.tsx:1021,1251`, and
   `WorkoutAiInsightReadback.tsx:55,74`. Source identifies containment/blur/nesting, but it cannot
   prove whether every boundary remains perceptible on all parent surfaces. Discriminator: Dark/Light
   computed background and adjacent-edge comparison on each actual parent. No token replacement is
   proposed without that evidence.
4. **Primary versus secondary mapping for 86-92% text:** the local attenuation is confirmed as
   noncanonical, but some menu/card/auth labels sit near the primary/secondary boundary. The repair
   owner must use content purpose first, then compare both themes: primary action/title uses
   `foreground`; supporting copy uses `text-secondary`. Stop and return a genuine Product choice if
   neither existing role preserves the accepted hierarchy; do not mint an 86/90/92 token.

No browser/computed-value replay was run for these four cases because the assignment permits an
exact unresolved discriminator and forbids an unmeasured recommendation. The confirmed findings do
not need computed colour to prove ownership: they are exact formula equality, exact token-contract
bypasses, or live semantic-role class composition.

### Repair Order And Scope Estimate

1. **Concurrent-work gate — PRODUCT:** wait for the active Foundations cleanup owner to return.
   Re-run the DS validator and freeze the final two-file reference diff. Do not absorb or reinterpret
   that task in this programme.
2. **DESIGN SYSTEM Slice A — focus contract:** shared CSS focus seams first, then shared UI and
   `/hitoDS` TSX focus utilities. Expected reduction: delete local `signal` alpha focus recipes and
   any focus-only Light override made redundant by the solid ring. Stop if a semantic selected/today
   layer would be removed rather than composed separately.
3. **DESIGN SYSTEM Slice B — exact reuse:** replace the four exact chrome/edge/text formula families,
   converge the four proved ordinary neutral interaction families, and reduce the checkbox radius
   rule. Expected reduction: zero exact local semantic copies in the named seams and deletion of the
   small-size checkbox override. No new token.
4. **DESIGN SYSTEM Slice C — shared text:** migrate shared CSS/UI ordinary attenuation to existing
   primary/secondary roles. Resolve the one Choice supporting-content gap only after the required
   selected/disabled parent matrix. Expected reduction: remove the five `text-current/*` literals
   and the shared `text-foreground/*`/formula recipes; add at most one purpose-owned Choice contract
   only if existing roles cannot preserve state meaning.
5. **FRONTEND Product Slice A:** fix Product focus utilities/timeline cue and reuse Button in the two
   fallback renderers. Expected reduction: delete all named Product focus alpha utilities and three
   hand-authored fallback action recipes; no behavior or route change.
6. **FRONTEND Product Slice B:** migrate authenticated/Admin ordinary text attenuation by primary or
   supporting purpose. Keep typography geometry and accepted local uppercase/tracking unchanged.
   Expected reduction: delete the named opacity utilities/formulas without adding percentages.
7. **FRONTEND Marketing Slice:** migrate Auth/Changelog attenuation after Product mapping is stable.
   Expected reduction: delete the four named Marketing `text-foreground/*` utilities; retain Display
   typography and editorial timeline anatomy.
8. **Independent QA only after routed implementation:** focused Dark/Light parent/state/focus matrix,
   keyboard cue, responsive containment, and console health. Global QA and release remain separate
   Product decisions.

Scope is therefore **three candidate groups for DESIGN SYSTEM, two for FRONTEND Product, one for
FRONTEND Marketing, plus one Product coordination gate and later independent QA**. It is not a colour
system rewrite, spacing migration, CSS merger, or literal-ban programme.

### Validation Inventory

| Check                              | Scenario / environment                                                    | Result                       | Evidence / consequence                                                                                                                                                                                                                               |
| ---------------------------------- | ------------------------------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Instruction and decision preflight | Current checkout                                                          | Passed                       | Read `AGENTS.md`, `agents/designer.agent.md`, both assigned project skills, this item, all three linked predecessor decisions, and the completed typography contract needed to classify local case/tracking.                                         |
| Dirty/source snapshot              | Shared `main` checkout                                                    | Passed with active boundary  | Exact status captured; two consecutive audited-source hashes matched. The active Foundations reference diff moved and was excluded rather than frozen or accepted.                                                                                   |
| Foundation/token census            | `foundations.css`, typography/workout registries, all imported CSS owners | Passed                       | Radius, spacing, structural, chrome, edge, text, intent, workout, typography, and global custom-property owners mapped before consumer classification.                                                                                               |
| Manifest parity                    | `node --import tsx scripts/generate-hito-ds-manifest.mjs --check`         | Passed                       | `primitiveColors=43`, `semanticColors=41`, `textStyles=14`. No generated file changed.                                                                                                                                                               |
| Existing DS validator              | `npm run validate-hito-ds-components`                                     | Concurrent-task coverage gap | Failed only the Foundations Mark inventory and reference-surface classification expectations. Both concern the actively changing `reference-foundations-page.tsx` owner. This audit does not attribute them to token adherence or repair them.       |
| Literal/formula census             | All named CSS plus TS/TSX visual declarations                             | Passed                       | 130 radius declarations classified; 346 spacing declarations classified by owner/purpose; all `color-mix`, direct colour formats, arbitrary colour alpha utilities, inline styles, and custom-property candidates were reviewed as grouped families. |
| Reachability                       | Exact actionable selectors/classes                                        | Passed                       | Every actionable family has a named live Product/Admin/DS route or component consumer. No suspect was labelled dead merely because it is reference-only.                                                                                             |
| Computed browser discriminator     | Confirmed actionables                                                     | Not required                 | Exact formula equality, canonical focus contract, and semantic class purpose prove the findings from source. Four genuinely unresolved visual cases retain exact later discriminators and no change recommendation.                                  |
| Runtime/build/hosted/Figma/release | Outside read-only audit                                                   | Not run                      | No implementation, browser acceptance, build, Global QA, hosted parity, Figma parity, release readiness, deployment, or production claim is made.                                                                                                    |

### Final Planning Receipt

- **Task and mode:** Hito DS canonical token adherence and exception census; Tracked, read-only
  Designer audit.
- **Outcome:** a comprehensive current-source classification and bounded repair order now separates
  canonical consumption, valid local facts, exact token bypasses, one measured token-gap question,
  and four unresolved discriminators.
- **Root conclusion:** Hito has a bounded set of local deviations, not systemic token-bypass or CSS
  architecture failure. The highest-priority issue is focus-token adherence; the most visible
  cleanup is text attenuation and a handful of exact neutral-role copies. `10px` and `42%` are not
  valid defect heuristics.
- **Files inspected:** the complete instructed policy/role/skill/task/decision context; all imported
  CSS owners; Foundation, typography, workout, generator, validator, shared UI, `/hitoDS`, Product,
  Marketing, Admin, and route consumers needed for each claim.
- **Files changed:** this canonical item only.
- **Preserved boundaries:** all runtime source, active Foundations cleanup, Product/DevTools behavior,
  CSS/tokens/manifests/validators, fixtures/data, Figma, Git lifecycle, hosted state, providers, and
  deployment remained unchanged.
- **Next owner:** PRODUCT for routing. Recommended first implementation owner: DESIGN SYSTEM, only
  after the active Foundations cleanup returns and the concurrent validator gap is reconciled.
- **Blockers:** none for completion of this audit. The active reference diff is a dependency for
  implementation scheduling, not permission to interrupt it.
- **Role file:** `agents/designer.agent.md`.
- **Skills used:** `skills/hito-frontend-design-system/SKILL.md` and
  `skills/hito-architecture-audit/SKILL.md`.
- **Subagents:** none; no independent browser fact was necessary to classify the confirmed source
  findings.
