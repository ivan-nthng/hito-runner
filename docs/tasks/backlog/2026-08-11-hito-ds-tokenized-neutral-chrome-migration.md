# Hito DS Tokenized Neutral-Chrome Migration

## Work Item ID

2026-08-11-hito-ds-tokenized-neutral-chrome-migration

## Status

completed

## Type

design-system-implementation

## Priority

urgent

## Owner

design_system

## Mode

Tracked

## Scope

Implement the complete DESIGN SYSTEM-owned portion of the accepted neutral-chrome migration plan.
This is one coordinated workstream, but its internal slices remain sequential proof/rollback units.

It includes plan slices 1–8 and 10 where the current consumer is shared Design System code:
Field/Select convergence; measured semantic foundation roles; neutral Buttons; choices; overlay
actions/menu rows; date/calendar neutral chrome; quiet tabs/rows/tags where containment is proven;
shared content hierarchy; and reachability-led obsolete-role deletion.

It excludes the plan's Slice 9 Frontend Product adoption in `forms-onboarding.css`, slider/dual-range
meaning, structural containment, workout/domain/chart palettes, Backend, persistence, Figma, and
hosted release work. Slice 9 can only be routed to FRONTEND after these DS roles have a stable,
validated contract.

## Stage

Design System implementation complete. Focused local Implementation DoD passed with the exact
browser-evidence gaps recorded below. Global QA remains a separate gate.

## Next Recommended Role

product

## Archive Intent

retain_in_place

## Task

Replace local neutral UI-chrome and text attenuation recipes with a small semantic, theme-resolved
Hito token vocabulary. Preserve genuine absolute structural surfaces and chromatic meaning.

The full decision, candidate inventory, slice order, contrast matrix, and rollback rules are
canonical in:
[Hito DS Tokenized Neutral-Chrome Migration Plan](2026-08-11-hito-ds-tokenized-neutral-chrome-migration-plan.md).

The completed research predecessor is:
[Hito UI Chrome Color-Role Rationalization Discovery](2026-08-11-hito-ui-chrome-color-role-rationalization-discovery.md).

## Accepted Product Contract

- Alpha/transparency used as neutral chrome or text/icon attenuation is owned by a semantic Hito
  token—not a local component percentage or a compounded `muted-foreground` opacity.
- Structural `background`, `surface`, `surface-elevated`, `card`, `popover`, modal/sheet, and real
  App Shell containment remain fixed theme-resolved colours when they express containment or
  elevation.
- The migration creates no palette rewrite, token framework, per-component colour API, new
  primitive, compatibility selector, or route-local palette.
- Start with the plan's 0/8/12/16 overlay hypothesis only as measurement candidates. Select final
  values from rendered dark/light parent/state evidence; token names express semantic purpose,
  never a percentage.
- Text/icons use one-step semantic primary/secondary/tertiary/disabled roles. Accent, positive,
  negative, informative, warning, workout-domain, chart, and safety meanings stay semantically
  separate and must not be reduced to neutral chrome.
- Every migration must delete or simplify the demonstrated old recipe. A larger codebase is a failed
  outcome even if visuals pass.

## Source Ownership And Ordered Work

1. `src/components/ui/select.tsx`, `src/styles/controls-fields.css`, and
   `src/styles/overlays-feedback.css`: converge `SelectTrigger` on the existing Field contract and
   delete duplicate Select rest/hover/focus/open/placeholder/disabled neutral rules.
2. `src/styles/foundations.css` and existing manifest generation seam: define only measured semantic
   chrome, edge, and text/content roles needed by the shared migration. Regenerate—not hand-edit—
   existing manifest output if required.
3. `src/styles/controls-fields.css`: migrate Field and date/calendar unselected neutral
   fill/edge/content states; retain popover containment and selected/today/range/error meaning.
4. `src/styles/controls-lists.css`: migrate neutral secondary/outlined/ghost Buttons, neutral
   unselected choice states, quiet tabs/rows/metadata where their containment discriminator proves
   they are chrome, and shared content attenuation. Retain primary/semantic buttons, selected,
   invalid, focus, workout/domain, slider, motion, and structural recipes.
5. `src/styles/overlays-feedback.css`: migrate neutral close/dismiss/menu-row/progress affordances
   and content attenuation. Retain backdrop, dialog/sheet/menu/toast containment, shadows, portal
   motion, and semantic state gradients/fills.
6. `src/styles/layout-typography.css` only where current source proves a shared tone attenuation is
   a real DS consumer of the new content hierarchy. Do not globally redefine or delete
   `muted-foreground` without complete reachability evidence.
7. `src/styles/foundations.css` plus the existing manifest seam: delete only roles proven to have
   zero runtime, generated, and approved external consumers after the migrations. No aliases or
   shims.

The plan's exact selector classifications, exclusions, parent/state matrix, and per-slice rollback
rules are binding. A candidate marked `investigate` must receive its stated DOM/rendered
discriminator before mutation. If it proves structural, semantic, domain, motion, or behaviour,
retain it rather than forcing it into the neutral system.

## Reuse-First Change Budget

- Existing owners to reuse: `foundations.css`, Field contract, Select primitive, component CSS
  families, `@theme inline` aliases, existing manifest generator, DS validator, and `/hitoDS`
  specimens.
- Proposed new runtime artifacts: **none**.
- New migration/RPC/table/provider/dependency/lockfile/framework/playground/component family:
  **none**.
- Expected deletion: Field/Select duplicate chrome plus every task-owned local neutral literal
  replaced by a canonical token; then zero-reachability obsolete foundation roles.

## Mandatory Independent Reviews

Use exactly two bounded read-only subagents inside this workstream:

1. **DESIGNER review** before finalizing foundation values: validate semantic-role assignment,
   dark/light compositing, structural-versus-chrome decisions, and typography/intent boundaries.
   It does not edit source or invent a palette.
2. **QA review** after implementation: independently run the plan's rendered parent/theme/state
   matrix, keyboard/focus/disabled checks, overflow/console checks, and a focused consumer map.
   It does not edit source.

Integrate both findings. If a reviewer finds an actual contract defect, fix it in the same Design
System scope and have QA recheck; do not defer a known failure or add compatibility code.

## Definition Of Done

1. All in-scope shared DS slices above are complete, sequentially evidenced, and net-reducing.
2. `SelectTrigger` has one Field-owned neutral state contract; its duplicate Select recipe is gone.
3. Every migrated neutral alpha/text attenuation is semantic and theme-resolved; no task-owned
   arbitrary opacity recipe or compounded-muted attenuation remains.
4. Each retained exception has source and rendered evidence that it is structural, semantic/domain,
   motion, geometry, or behaviour rather than neutral chrome.
5. The full plan matrix passes for dark/light × background/surface/elevated-card/popover-modal and
   rest/hover/pressed/selected/disabled/focus/placeholder/text/icon/status states where applicable.
6. Normal required text reaches 4.5:1, large text 3:1, required non-text indicators/focus 3:1;
   semantic state is not colour-only.
7. Existing DS primitives, Product consumers, `/hitoDS`, manifest, validator, browser interaction,
   responsiveness, and accessibility contracts remain valid.
8. No unowned Frontend Product/Backend/Figma/slider/structural change is made.

## Validation Expectations

| Check               | Required proof                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Preflight           | Current dirty-tree snapshot; exact selector/consumer map; no overlapping active owner write                                                            |
| Baseline and values | Existing specimen screenshots plus computed composited colours/contrast for every required matrix cell; compare only minimum alternatives              |
| Deletion proof      | Per-slice source search/diff shows each replaced local neutral literal gone and canonical role reused                                                  |
| DS source           | `npm run validate-hito-ds-components`, manifest generation/check when relevant, focused lint/format/diff hygiene                                       |
| Build/runtime       | One uncontended fresh production build and integrity; managed loopback runtime only after build ownership is clear                                     |
| Browser             | Desktop and exact 375px, light/dark, affected parents/states, keyboard focus/selection/disabled, overlays not clipped, no overflow/console/page errors |
| Independent review  | Designer semantic/contrast verdict and QA browser verdict both recorded and rechecked after any fix-forward                                            |
| Boundaries          | Existing Product flows and retained FIT/history/persistence untouched; no provider or hosted activity                                                  |

## What Not To Touch

- `src/styles/forms-onboarding.css` and all Product route-specific adoption; this is FRONTEND Product
  work after stable DS roles.
- Slider/dual-range rails, markers, previous values, or their motion/cursor semantics.
- Real structural containers, modal/popover/dialog/toast/App Shell containment, shadows/backdrops,
  workout/domain/chart colours, semantic intent meaning, backend truth, migrations, fixtures,
  providers, auth, Figma, dependencies, or hosted state.
- The active Backend repair and final QA receipts. Do not kill another owner's process or overwrite
  their shared build output.
- Git staging, commit, push, deployment, or Vercel/Supabase mutation.

## Completion Boundary

Return to Product only when all in-scope shared DS slices are complete and independently reviewed,
or when a demonstrated owner/product boundary makes a remaining slice impossible without an
explicit Product decision. Do not stop after the Select pilot. This task cannot claim final Global
QA, hosted parity, deployment, release readiness, or completion of the separate Frontend Product
adoption slice.

## Design System Execution Preflight — 2026-08-11

- Existing seams: `hitoFieldClasses`, Field-owned state CSS, `foundations.css` semantic export
  sections and `@theme inline` aliases, the existing shared CSS families, manifest generator, DS
  validator, and current `/hitoDS` specimens.
- Smallest ordered change: delete the duplicate Select state owner first; measure the candidate
  compositing matrix before defining semantic roles; then migrate each accepted shared family and
  remove its superseded local neutral literals as an independent rollback unit.
- Demonstrated cause: Select duplicates the Field rest/hover/focus/open/placeholder/disabled
  contract, while the remaining accepted shared slices own repeated component-local neutral
  `color-mix` or content-opacity recipes. Structural containment, semantic/domain colour, slider
  meaning, and motion/visibility opacity are distinct retained responsibilities.
- New runtime artifacts: none.
- Removed responsibility: duplicate Select chrome, replaced DS-local neutral literals, and only
  foundation roles that later reachability proves have zero runtime/generated/external consumers.
- Preserved boundary: `forms-onboarding.css`, Product routes, Backend repair, slider ranges,
  structural containers, semantic intent, workout/chart roles, Figma, dependencies, fixtures,
  hosted state, and unrelated dirty work remain outside the implementation.
- Validation inventory: per-slice red/green or source discriminator and deletion count; complete
  rendered theme/parent/state compositing and contrast matrix; Designer verdict before final token
  values; manifest/validator/static checks; uncontended production build/integrity; desktop and
  exact 375px browser/accessibility/console/overflow proof; independent QA verdict and recheck after
  any fix-forward.
- Stop boundary: return only a demonstrated Product/external compatibility contract, active
  overlapping owner, or a matrix failure that cannot be resolved in the existing DS seams without
  widening the accepted token/component contract.

## Exact Design System Handoff

```text
ROLE: DESIGN SYSTEM

Mode: Tracked
Task: Implement the complete shared Hito Design System neutral-chrome migration.

Execute exactly:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-hito-ds-tokenized-neutral-chrome-migration.md`

Read `AGENTS.md`, `agents/design-system.agent.md`,
`skills/hito-frontend-design-system/SKILL.md`, the complete canonical item, the complete migration
plan, and the predecessor discovery before the first write. This is a full shared DS workstream:
do not stop after Slice 1. Execute every in-scope DS slice sequentially, with its own evidence and
rollback unit; return only when the entire shared scope is complete or a real Product boundary is
proven.

Use the existing foundation, Field, Select, shared CSS, manifest, validator, and `/hitoDS` seams.
No new runtime artifact, token framework, component family, compatibility layer, migration, RPC,
provider, dependency, or route-local palette is allowed. The token vocabulary must be semantic;
measure the 0/8/12/16 candidates in the complete rendered matrix before choosing final values. Do
not turn structural surfaces, sliders, motion/visibility opacity, workout/chart/domain colours, or
semantic intent states into neutral chrome.

Design System owns every shared slice in the canonical item. `forms-onboarding.css` adoption is
explicitly Frontend Product work and must stay untouched. Do not alter Backend, Frontend Product
routes, Figma, migrations, fixtures, hosted state, or the active Backend repair. Never kill an
ambiguous shared runtime/build; wait for ownership and validate an uncontended result.

You must use two bounded read-only subagents: a DESIGNER to verify role assignment and dark/light
compositing before values are finalized, and an independent QA reviewer after implementation to
run the required browser/accessibility matrix. Integrate/fix-forward every confirmed DS defect in
this scope, then have QA recheck. They do not edit source.

Required proof: per-slice red/green or source discriminator, deletion/reuse count, full
dark/light × parent × state contrast matrix, DS validator/manifest/focused static checks, fresh
uncontended production build/integrity, desktop and exact 375px browser proof, keyboard/focus/
disabled/overlay/no-overflow/no-console checks, and reviewer verdicts. Preserve source truth and
report every omission.

Use Russian for visible progress commentary. Append an English Tracked implementation receipt to
the item with source hierarchy, changed/deleted paths, validation table, reviewer outcomes,
remaining Frontend-only adoption boundary, and no Global QA/release claim. Do not stage, commit,
push, deploy, call providers, or access hosted services.
```

## Design System Tracked Implementation Receipt — 2026-08-11

### Outcome And Source Hierarchy

The complete shared Design System scope is implemented. The source hierarchy is now:

1. `src/styles/foundations.css` owns the theme-resolved semantic chrome, edge, and content roles.
2. Existing `@theme inline` aliases and the generated Hito DS manifest expose those roles.
3. The existing Field contract owns Field and `SelectTrigger` neutral state chrome.
4. Existing shared CSS owners consume the same roles for neutral Buttons, choices, date/calendar,
   overlay affordances and menu rows, tabs/rows/tags, and shared content hierarchy.
5. Existing `/hitoDS` specimens and the existing DS validator remain the reference and guardrail.

No runtime artifact, component family, helper, token framework, compatibility path, dependency,
Product CSS recipe, storage, provider, or Figma mapping was added.

### Final Semantic Contract

- Chrome: clear = transparent; subtle = foreground 8%; standard = foreground 12%; strong =
  foreground 16%.
- Interactive edges: default = foreground 16%; emphasis = foreground 32%.
- Content: secondary = foreground 75%; tertiary = foreground 60%; disabled = foreground 40% and
  disabled-only.
- Semantic content: accent = signal 50% + foreground 50%; negative = destructive 80% + foreground
  20%; positive/informative/warning retain the existing success/info/warn sources.
- Required focus remains the existing solid `--color-ring`; neutral chrome is never used as the
  focus indicator.

| Theme / parent         | Subtle | Standard | Strong | Secondary text | Tertiary text | Disabled text |
| ---------------------- | -----: | -------: | -----: | -------------: | ------------: | ------------: |
| Dark background        | 1.18:1 |   1.33:1 | 1.51:1 |         9.84:1 |        6.58:1 |        3.51:1 |
| Dark surface/card      | 1.21:1 |   1.37:1 | 1.56:1 |         9.53:1 |        6.47:1 |        3.54:1 |
| Dark elevated          | 1.23:1 |   1.40:1 | 1.59:1 |         9.10:1 |        6.27:1 |        3.52:1 |
| Dark popover           | 1.23:1 |   1.39:1 | 1.58:1 |         9.26:1 |        6.35:1 |        3.53:1 |
| Light background       | 1.18:1 |   1.29:1 | 1.41:1 |         8.12:1 |        4.80:1 |        2.59:1 |
| Light surface/card     | 1.18:1 |   1.29:1 | 1.41:1 |         8.33:1 |        4.87:1 |        2.60:1 |
| Light elevated/popover | 1.18:1 |   1.29:1 | 1.41:1 |         8.45:1 |        4.91:1 |        2.61:1 |

The chrome ratios are an intentionally calm state ladder, not standalone required indicators.
Solid ring contrast is at least 6.29:1 in dark and 3.50:1 in light. Semantic-content minima are
approximately 7.98:1 accent, 5.85:1 negative, 6.73:1 positive, 6.14:1 informative, and 5.79:1
warning across the declared parents.

### Sequential Slice Receipt

| Slice                    | Canonical reuse / deletion result                                                                                                                                  | Result                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| 1 — Field/Select         | `SelectTrigger` composes `hitoFieldClasses`; duplicate Select rest/hover/focus/open/placeholder/disabled CSS and chevron `opacity-50` are gone.                    | Passed                                                                              |
| 2 — foundation and Field | Fourteen measured semantic roles are exported through the existing foundation/manifest seam; Field/Select use the shared roles and solid ring.                     | Passed                                                                              |
| 3 — neutral Buttons      | Secondary, outlined, and ghost use the shared state ladder; neutral disabled uses explicit chrome/content while primary and semantic states remain owned.          | Passed                                                                              |
| 4 — choices              | Checkbox, radio, and ChoiceToggle neutral/unselected/disabled states use shared chrome/content; selected and invalid meaning remains semantic and non-colour-only. | Passed                                                                              |
| 5 — overlays             | Dialog/sheet close, menu rows, toast dismiss, and neutral progress tracks use shared roles; portal surfaces, backdrops, shadows, and motion remain structural.     | Passed                                                                              |
| 6 — date/calendar        | Neutral date icon/navigation/day/weekday/outside/disabled states use shared roles; popover containment and today/selected/range/error meaning remain intact.       | Passed by source/static contract; rendered date-picker coverage gap recorded below. |
| 7 — tabs/rows/tags       | Item hover/current, quiet rows, and neutral metadata use shared roles; enclosed rails and row groups remain structural; semantic tags retain their hues.           | Passed                                                                              |
| 8 — content hierarchy    | Audited shared labels, body/support, captions, metadata, and semantic content use one-step roles; reveal/motion/editorial opacity remains distinct.                | Passed                                                                              |
| 10 — obsolete roles      | Foundation `secondary` and `secondary-foreground` definitions/aliases were deleted only after exact zero reachability; generated output was regenerated.           | Passed                                                                              |

### Files Changed

- `src/components/ui/select.tsx`
- `src/styles/foundations.css`
- `src/styles/controls-fields.css`
- `src/styles/controls-lists.css`
- `src/styles/overlays-feedback.css`
- `src/styles/layout-typography.css`
- `scripts/validate-hito-ds-component-contracts.ts`
- `src/generated/hito-ds-manifest.json` (generated)
- `src/generated/hito-ds-manifest.ts` (generated)
- this canonical item

No file was added or deleted. The checkout already contained unrelated dirty integration hunks,
including slider and Product work; those are not part of this receipt and were preserved.

### Deletion And Reuse Evidence

Across the audited task-owned source ranges, `color-mix(in oklch, ...)` occurrences decreased from
304 to 167, local neutral source mixes decreased from 128 to 33, and tone opacity declarations
decreased from 24 to 19. The remaining literals were reviewed as structural containment,
semantic/domain state, progress/motion/visibility, browser autofill rendering, or editorial
geometry. The shared semantic roles now have 163 non-generated uses across the affected shared CSS
owners. Exact source/generated searches return zero foundation definitions, aliases, or consumers
for retired `secondary` / `secondary-foreground`; the live Hito Button variant string
`"secondary"` is a distinct component API and remains.

### Validation Inventory

| Check                       | Scenario / environment                                                                    | Result                | Evidence                                                                                                                                                                                                                                                                                                                           |
| --------------------------- | ----------------------------------------------------------------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Preflight / boundaries      | Shared dirty main checkout                                                                | Passed                | Existing owner seams reused; no overlapping owner was killed; Product, Backend, Figma, hosted state, dependencies, `forms-onboarding.css`, and slider contracts were outside this slice.                                                                                                                                           |
| DESIGNER review             | Read-only role/value/contrast review before final values                                  | Passed                | Accepted 0/8/12/16, 16/32 edges, 75/60/40 content, contrast-resolved semantic text, structural discriminators, and required solid ring fix-forward.                                                                                                                                                                                |
| DS validator                | `npm run validate-hito-ds-components`                                                     | Passed                | `semanticColors=41`, `scannedFiles=322`; Select/Field/token/retired-role guards pass.                                                                                                                                                                                                                                              |
| Manifest parity             | `node --import tsx scripts/generate-hito-ds-manifest.mjs --check`                         | Passed                | `primitiveColors=35`, `semanticColors=41`, `textStyles=18`.                                                                                                                                                                                                                                                                        |
| Focused lint                | `npx eslint src/components/ui/select.tsx scripts/validate-hito-ds-component-contracts.ts` | Passed                | Exit 0.                                                                                                                                                                                                                                                                                                                            |
| Formatting                  | Prettier check over all task-owned source/generated files                                 | Passed                | All matched files use Prettier code style.                                                                                                                                                                                                                                                                                         |
| Diff hygiene                | `git diff --check`; exact retired-role and boundary searches                              | Passed                | No whitespace errors; zero retired foundation-role matches; no new semantic-role adoption in `forms-onboarding.css`.                                                                                                                                                                                                               |
| Build / integrity           | `npm run qa:server:start`, then `npm run qa:server:status`                                | Passed                | Fresh production client/SSR/Nitro build completed; managed loopback runtime is healthy, compatible, fresh, and `receipt_matches` at `127.0.0.1:3000`. No provider or hosted call was made.                                                                                                                                         |
| Primary browser — desktop   | `/hitoDS/components`, exact 1470×801, dark/light                                          | Passed                | Actual theme tokens and Field/Select states match the contract; menu/dialog portals remain usable; page has no horizontal overflow. One raw bounding-box read landed 0.328 CSS px beyond the mathematical bottom through subpixel rounding; no content loss was observed and independent QA found the overlay within its viewport. |
| Primary browser — mobile    | `/hitoDS/components`, exact 375×812, dark/light                                           | Passed                | `scrollWidth === clientWidth === 375`; Select, menu, and Dialog fit without content clipping; structural popover/dialog surfaces remain distinct.                                                                                                                                                                                  |
| Interaction / accessibility | Field, Select, Button, Choice, Tabs, Dropdown, Dialog, Toast                              | Passed                | Solid focus cue; Select/menu keyboard navigation; Tabs ArrowRight; choice selection; disabled explicit content; Escape and Dialog focus restoration; semantic states retain text/check/edge cues.                                                                                                                                  |
| Console / page health       | Exact desktop/mobile browser passes                                                       | Passed                | No console errors and no page-level horizontal overflow.                                                                                                                                                                                                                                                                           |
| Independent QA              | Read-only post-implementation review                                                      | Passed                | `Verdict: Passed`; exact desktop/mobile theme parity, representative states, focus, keyboard, structural parents, source ownership, zero retired-role reachability, overflow, and console health passed. No task-owned defect was confirmed.                                                                                       |
| Forced-colours              | Current local browser environment                                                         | Not run               | `forced-colors: active` and `prefers-contrast: more` were unavailable. Consequence: no OS forced-colours visual claim; native semantics and solid ring source/computed contrast were verified.                                                                                                                                     |
| Rendered date-picker cell   | Existing `/hitoDS` runtime                                                                | Not independently run | The independent browser session was no longer available for the bounded recheck, and no temporary harness was created. Consequence: rendered date-picker rest/hover/focus/disabled/outside/weekday/today cells rely on shared-token source/static/build evidence rather than a fresh dedicated browser replay.                     |
| Dirty-file chronology       | Pre-existing integration tree                                                             | Limited attribution   | Product and slider files already carried unrelated dirty hunks, so independent QA did not claim byte-level chronology for them. Focused source ownership found no migration-specific boundary violation.                                                                                                                           |

### Retained Exceptions And Boundary

Retained exceptions are the Field browser-autofill inset, reveal/loading/motion opacity, toast moving
progress fill, enclosed-tab rail, row-group and state-surface containment, popover/modal/toast
surfaces and shadows, editorial backdrops/markers, semantic intent/domain colours, and sliders.
They are not neutral chrome responsibilities.

The only remaining adoption is plan Slice 9 in `src/styles/forms-onboarding.css`, owned by FRONTEND
Product and requiring Product routing. This receipt proves focused local Design System
Implementation DoD only. It does not claim Global QA Acceptance, hosted parity, deployment, release
readiness, or completion of the separate Frontend Product slice.
