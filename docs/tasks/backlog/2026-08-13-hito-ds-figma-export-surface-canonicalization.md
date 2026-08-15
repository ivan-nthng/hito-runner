# Hito DS Figma Export Surface Canonicalization

## Work Item ID

`2026-08-13-hito-ds-figma-export-surface-canonicalization`

## Status

`completed`

## Type

Tracked — Design System reference-surface consistency

## Priority

P1

## Owner

DESIGN SYSTEM

## Evidence From

- [Hito DS Card Surface, Copy Affordance, And Figma Reconciliation Discovery](2026-08-13-hito-ds-card-surface-copy-affordance-and-figma-reconciliation-discovery.md)
- Ivan's approved visual-cleanup direction for the code-owned Figma Export page, 2026-08-13

## Route And Scope

`/hitoDS/export/figma`

Correct only the code-owned capture board:

- `src/components/hito-ds/figma-export-board.tsx`
- the already-owned `hito-ds-token-specimen-surface` contract only if preflight proves that existing
  contract needs no source change and can be directly reused.

The task is a code-side Design System cleanup. It is **not** permission to edit a Figma file, publish
a library, add a new Figma component, or claim Figma node parity.

## Product Outcome

The Figma Export page uses the same neutral, borderless Design System specimen surface as the rest of
Hito DS. It no longer wraps token, spacing, radius, typography, and icon inventory content in
decorative perimeter borders or a custom transparent background. The result remains a deterministic
capture board and retains every border that communicates real structure, state, contrast, or the
subject being exported.

## User Report

The Export page must be brought into the shared Design System visual language: reuse existing card
surfaces, remove meaningless card borders, clean background recipes, and apply the concrete
findings from the Designer's card-surface audit. A Figma export/library update will be considered
separately once an approved editable Figma target is supplied.

## Evidence And Observed Behaviour

The completed Designer audit demonstrated six decorative wrapper recipes in
`figma-export-board.tsx`:

| Current board area            | Current wrapper recipe                                    | Classification          |
| ----------------------------- | --------------------------------------------------------- | ----------------------- |
| Primitive/Semantic token grid | `rounded-2xl border border-hairline bg-background/55 p-3` | Decorative outer chrome |
| Spacing scale                 | `rounded-2xl border border-hairline bg-background/55 p-4` | Decorative outer chrome |
| Radius scale                  | `rounded-2xl border border-hairline bg-background/55 p-4` | Decorative outer chrome |
| Reusable typography styles    | `rounded-2xl border border-hairline bg-background/55 p-4` | Decorative outer chrome |
| Icon-size tile                | `rounded-2xl border border-hairline bg-background/55 p-3` | Decorative outer chrome |
| Icon-inventory tile           | `rounded-2xl border border-hairline bg-background/55 p-3` | Decorative outer chrome |

Those wrappers occur at the audit-time source locations 315, 337, 353, 380, 986, and 1004. The
line numbers are evidence only; the executor must locate the current symbols in preflight.

## Expected Behaviour

- Each of the six named outer wrappers reuses the existing `hito-ds-token-specimen-surface` class
  plus its existing layout and padding utilities.
- The page uses semantic theme-aware backgrounds only; no local `bg-background/55` substitute
  remains on those six wrappers.
- Dark and Light capture boards remain readable, deterministic, contained, and free of page-level
  horizontal overflow.
- The board stays a static export surface: it does not acquire hover copy buttons, clipboard state,
  toast state, or interactive controls.

## Demonstrated Root Cause

The capture board independently repeated a generic decorative recipe instead of consuming its
existing canonical neutral specimen surface. This is an ownership/reuse defect in
`figma-export-board.tsx`, not evidence that every Hito card, divider, or edge-token example is
incorrect.

**First incorrect owner:** the six local capture-board wrapper class lists in
`src/components/hito-ds/figma-export-board.tsx`.

## Reuse-First Contract

Reuse `.hito-ds-token-specimen-surface`, which already owns a borderless semantic background and
canonical `--radius-3xl`. Keep the current grid, gaps, padding, and content anatomy local to each
board section. No new CSS, token, component, prop, file, registry, validator, or compatibility path
is expected.

## Required Work

1. Take a fresh source/dirty snapshot and confirm the six local wrapper sites still have the
   demonstrated responsibility.
2. Replace each named decorative wrapper's `rounded-2xl border border-hairline bg-background/55`
   chrome with `hito-ds-token-specimen-surface`; retain its existing `grid`, `gap`, sizing, and
   `p-3`/`p-4` layout utilities.
3. Delete the repeated local decorative chrome rather than layering a second class or fallback over
   it.
4. Preserve all meaningful borders exactly, including:
   - `ExportSection` and page-header dividers;
   - swatch, radius-shape, glyph-well, sheet/menu, and component-state edges;
   - typography row dividers, table/list structure, focus/selection indicators, and any edge-token
     specimen;
   - deterministic export content and the generated-manifest inputs it displays.
5. Verify the export route itself, not a different `/hitoDS` reference page.

## Explicit Non-Goals And Boundaries

- Do not flatten all Design System or Product cards, alter shared component contracts, or touch
  `reference-foundations-page.tsx`, `playground.tsx`, Product routes, Admin, or DevTools.
- Do not add copy affordances to this static capture board. The separate Foundations durable-fact
  copy work, if later routed, owns that interaction.
- Do not change actual Figma documents. `DESIGN SYSTEM INTEGRATION` may only update the downstream
  Hito Running Library after PRODUCT supplies its approved URL/file key, edit permission, and
  existing node targets.
- Do not invent custom alpha, radius, colour, shadow, or card recipes to compensate for removed
  borders.

## Execution Preflight

Before the first task-owned write, record in this item:

1. the current six symbol/class sites and the local source hash/dirty boundary;
2. the existing class ownership and the smallest resulting edit;
3. proposed runtime artifacts: `none`; and
4. the exact deleted local recipes and the meaningful lines deliberately preserved.

Stop and return to PRODUCT if the board now needs a new shared surface, token, component, CSS rule,
Figma edit, Product owner, or a second source writer in this file.

## Definition Of Done

1. Exactly the six demonstrated decorative outer wrappers use the canonical borderless specimen
   surface; their repeated border/background recipes are gone.
2. Meaningful internal and component-contract borders remain intact.
3. `/hitoDS/export/figma` works in Dark and Light without page overflow or console errors at the
   required desktop and narrow viewports.
4. No new runtime artifact or parallel card/copy truth is introduced.
5. This item contains a truthful English receipt; actual Figma mutation remains explicitly
   unclaimed.

## Validation Inventory

| Check                | Required evidence                                                                                                            |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Source discriminator | Current census proves six target wrappers changed and meaningful edge sites remain.                                          |
| Static               | Focused Prettier, ESLint, Hito DS validator, manifest parity, and `git diff --check`.                                        |
| Runtime              | Fresh managed production build and `qa_fixture` admission, if uncontended.                                                   |
| Browser              | `/hitoDS/export/figma`, exact 1470×801 and 375×812, Dark and Light.                                                          |
| Visual health        | Borderless outer surfaces, retained meaningful edges, capture determinism, no page overflow, and no console warnings/errors. |
| Independent review   | The owner may ask existing `ROLE: QA` for a bounded read-only browser review after its own proof.                            |

Global QA, Figma parity, hosted verification, release readiness, and deployment are out of scope.

## Execution Preflight — 2026-08-13

- **Checkout boundary:** `main` at `74607987885ca40f33658c79fba174d173d45646`; the shared checkout is dirty with unrelated work, but `src/components/hito-ds/figma-export-board.tsx` has no pre-existing diff. Its pre-write SHA-256 is `5f8abe97e88a3f79375c8c9b261bb1b2a5f58a274417c3292a4e177621110455`.
- **Current owner census:** exactly six local decorative wrapper sites still repeat `rounded-2xl border border-hairline bg-background/55`, at the current source lines 315, 337, 353, 380, 986, and 1004. They own the token grid, spacing scale, radius scale, reusable typography styles, icon-size tiles, and icon-inventory tiles respectively.
- **Existing seam and smallest change:** reuse the existing `hito-ds-token-specimen-surface`, whose canonical CSS already owns a borderless `--radius-3xl` semantic background. Replace only the six local chrome fragments while retaining each site's existing grid, gap, sizing, and `p-3`/`p-4` utilities.
- **New runtime artifacts:** none. No CSS, token, component, prop, helper, registry, manifest field, validator, copy interaction, or compatibility path is proposed.
- **Deleted responsibility:** remove only the six duplicated decorative perimeter/radius/translucent-background recipes. Preserve `ExportSection` and page-header dividers, swatch/radius/glyph-well edges, typography row dividers, sheet/menu/component-state chrome, focus/selection evidence, generated inputs, and deterministic capture content.
- **Stop discriminator:** no second writer or shared-owner gap is present in the admitted file. Any later movement in that file, need for a new surface/token/component, or Figma/Product mutation returns the task to PRODUCT before expansion.

## Browser Path Preflight — 2026-08-13

- **Validation layer:** focused local Implementation DoD for the browser-visible `/hitoDS/export/figma` surface; not Global QA, hosted acceptance, Figma parity, or release validation.
- **Path:** use only the canonical managed loopback runtime at `http://127.0.0.1:3000/` and a supported non-prompting local browser-control surface. No production/hosted data or ad hoc app server is permitted.
- **Admission state before rebuild:** the existing managed process is healthy but the artifact is stale/broken because its private Admin snapshot digest no longer matches the shared checkout. Since the admitted board source changed, rebuild and restart through `npm run local:fixture` only; do not reuse the stale bundle.
- **Matrix:** exact 1470×801 and 375×812 in Dark and Light. Prove all six canonical surfaces, zero local decorative recipe, retained section/header/typography/swatch/radius/glyph/component edges, deterministic static content, zero page-level horizontal overflow, and zero console warnings/errors.
- **Interaction boundary:** the export board remains static. Theme switching and responsive containment are the only state transitions required; no clipboard/copy state or Figma mutation is exercised.

## Tracked Implementation Receipt — 2026-08-13

- **Task / stage:** Hito DS Figma Export Surface Canonicalization; Tracked Design System code-side visual consistency, focused implementation and independent browser review complete.
- **Preflight:** confirmed `main` at `74607987885ca40f33658c79fba174d173d45646`, a dirty shared checkout, no pre-existing diff in the admitted runtime file, pre-write SHA-256 `5f8abe97e88a3f79375c8c9b261bb1b2a5f58a274417c3292a4e177621110455`, and exactly six current local owner sites. No second writer or shared-owner gap appeared in `figma-export-board.tsx`.
- **Product outcome:** `/hitoDS/export/figma` now consumes the canonical borderless neutral specimen surface for the token grid, spacing scale, radius scale, reusable typography styles, icon-size tiles, and icon-inventory tiles. The route remains deterministic and static.
- **Demonstrated root cause:** the six board-local wrappers independently repeated `rounded-2xl border border-hairline bg-background/55` instead of reusing the existing `hito-ds-token-specimen-surface` owner. The accepted surface already provides `border: 0`, `--radius-3xl`, and the semantic Dark/Light background, so no new contract was needed.
- **Files inspected:** `src/components/hito-ds/figma-export-board.tsx`, `src/styles/reference-workbench.css`, the generated manifest seam, this canonical item, and its completed Designer discovery.
- **Files changed:** `src/components/hito-ds/figma-export-board.tsx` and this canonical lifecycle/receipt only. Production-source net change is six insertions / nine deletions. New runtime artifacts: none.
- **Deleted recipes:** all six local decorative perimeter/radius/translucent-background fragments; rejected recipe reachability is now zero. Exactly six source patterns use `hito-ds-token-specimen-surface`.
- **Preserved edges and content:** page-header bottom divider; all ten section top dividers; 84 swatch edges; seven radius-shape edges; 14 typography rows with 13 internal dividers; 62 glyph wells; menu/sheet/component-state boundaries; 28 explicit focus specimens; three selected menu states; generated token/icon endpoints; current grid/gap/padding; and all static capture content. No copy handler, clipboard state, toast, control, or Figma mutation was added.

| Check                      | Scenario / environment                                         | Result           | Evidence                                                                                                                                                                                                                                          |
| -------------------------- | -------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source discriminator       | Current task-owned diff                                        | Passed           | Old wrapper recipe count `0`; canonical surface source-pattern count `6`; meaningful edge selectors remain.                                                                                                                                       |
| Focused formatting / lint  | Task runtime source and receipt                                | Passed           | Focused Prettier and ESLint pass.                                                                                                                                                                                                                 |
| Manifest parity            | Generated Hito DS manifest `--check`                           | Passed           | `primitiveColors=43`, `semanticColors=41`, `textStyles=14`; no generated file changed.                                                                                                                                                            |
| Full DS validator          | Shared checkout                                                | External failure | The task-owned board assertions do not fail. The validator remains red only on the separate stale Brand on-light/on-dark favicon assertion; this task did not alter or mask that owner.                                                           |
| Diff hygiene               | Shared checkout                                                | Passed           | `git diff --check` passes; unrelated dirty work is preserved.                                                                                                                                                                                     |
| Production build / runtime | Canonical managed local procedure                              | Passed           | `npm run local:fixture` rebuilt successfully and admitted a healthy, compatible, fresh `qa_fixture` artifact with `receipt_matches`. No ad hoc server was used.                                                                                   |
| Owner browser matrix       | `/hitoDS/export/figma`, exact 1470×801 and 375×812, Dark/Light | Passed           | All 165 runtime instances are borderless with 16px radius and theme-semantic backgrounds; page overflow `0`; console warning/error count `0`; static copy action count `0`.                                                                       |
| Independent QA             | Same route and exact four-cell matrix                          | Passed           | Existing `ROLE: QA` independently verified source/runtime census, retained structural/state edges, deterministic endpoints, real theme-menu switching, responsive containment, and empty console. Verdict: Passed for focused Implementation DoD. |

- **Coverage gap / consequence:** the full DS validator cannot provide an all-green repository-wide gate until the separate Brand validator assertion is reconciled by its existing owner. This does not contradict the source, build, manifest, browser, or independent QA evidence for the Figma Export surface, but it prevents any release-gate claim from this receipt.
- **Preserved boundaries:** no Product, Admin, DevTools, other reference page, shared CSS/token/component, generated manifest, fixture, dependency, Figma file, hosted state, Git lifecycle, copy affordance, or unrelated dirty hunk was changed.
- **Next owner:** PRODUCT only if it chooses to route the independent Brand validator repair, later approved DESIGN SYSTEM INTEGRATION Figma reconciliation, Global QA, or release work.
- **Blockers:** none for this focused Design System Implementation DoD. The missing approved Figma file/key/nodes continues to block Figma mutation/parity only.
- **Claims not made:** Global QA Acceptance, Figma mutation or node parity, hosted acceptance, publication, release readiness, deployment, staging, commit, or push.
- **Role file:** `agents/design-system.agent.md`.
- **Skills used:** `skills/hito-frontend-design-system/SKILL.md` and `skills/hito-qa-browser-regression/SKILL.md`.
- **Subagent:** existing `ROLE: QA`, bounded read-only independent review; no source delegation and no subagent of its own.

## Exact Execution Prompt

```text
ROLE: DESIGN SYSTEM

Task: Hito DS Figma Export Surface Canonicalization
Mode: Tracked — Design System code-side visual consistency.

Read before work:
- AGENTS.md
- agents/design-system.agent.md
- skills/hito-frontend-design-system/SKILL.md
- skills/hito-qa-browser-regression/SKILL.md when browser proof begins
- docs/tasks/backlog/2026-08-13-hito-ds-figma-export-surface-canonicalization.md
- docs/tasks/backlog/2026-08-13-hito-ds-card-surface-copy-affordance-and-figma-reconciliation-discovery.md

Outcome:
Bring `/hitoDS/export/figma` into the canonical Hito DS reference-surface grammar. Replace only
the six demonstrated decorative capture-board outer wrappers with the existing
`hito-ds-token-specimen-surface` contract. The code remains the source of truth and the static
export route must retain deterministic capture content.

Root cause and seam:
- First incorrect owner: the six local wrapper class lists in
  `src/components/hito-ds/figma-export-board.tsx`, which repeat
  `rounded-2xl border border-hairline bg-background/55`.
- Existing canonical replacement: `hito-ds-token-specimen-surface`; reuse it with the wrappers'
  current grid/gap/padding layout. Do not create CSS, tokens, a card primitive, props, helpers,
  a registry, or compatibility paths.

Required work:
1. Record a fresh source/dirty snapshot and confirm the current six owner sites before editing.
2. Replace all and only those six decorative outer wrapper recipes. Delete their local perimeter
   and transparent-background responsibility rather than layering a fallback.
3. Preserve ExportSection/page-header dividers; swatch, radius-shape, glyph-well, menu/sheet and
   component-state edges; typography row dividers; focus/selection evidence; and all deterministic
   export content.
4. Do not add any copy affordance: this capture route is static. Do not edit Figma or claim node
   parity; exact approved Figma target/key/node IDs remain a later Integration gate.
5. Validate the real `/hitoDS/export/figma` route in Dark/Light at 1470×801 and 375×812, plus
   static checks and a fresh managed runtime where available.

Boundaries:
- Edit only `src/components/hito-ds/figma-export-board.tsx`, unless preflight proves an already
  imported owner must be reused without introducing a new recipe.
- Preserve Product/Admin/DevTools source, other reference pages, generated inputs, active work,
  and unrelated dirty hunks.
- Return to PRODUCT if the real fix crosses to a new shared surface/token/component, a Figma edit,
  another production owner, or a concurrent writer in the admitted file.

Subagent authority:
- Implement the Design System source work yourself; do not delegate same-role implementation.
- You may use the existing `ROLE: QA` agent only for a narrow read-only independent final browser
  review after your own proof. Its prompt must state the route, viewports/themes, retained-edge
  checks, no-write boundary, and required return evidence.

Final receipt (English): task/stage, preflight, demonstrated root cause, files changed, deleted
recipes and preserved edges, validation table, any coverage gap, next owner, and blockers. Do not
claim Global QA, Figma mutation/parity, hosted acceptance, release readiness, or deployment.
```

## Current Lifecycle Note

Created by PRODUCT as a ready P1 task. No execution role was dispatched, no Figma file was edited,
and no runtime source changed while creating this item.
