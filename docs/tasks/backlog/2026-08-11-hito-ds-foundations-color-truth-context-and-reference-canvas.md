# Hito DS Foundations Color Truth, Context, And Reference Canvas

## Work Item ID

2026-08-11-hito-ds-foundations-color-truth-context-and-reference-canvas

## Status

completed

## Type

design-system-reference

## Priority

high

## Owner

design_system

## Mode

Tracked

## Scope

Complete one coherent Foundations/reference-library slice:

1. expose truthful color provenance, alpha and active-theme resolution for existing Semantic and
   Primitive specimens;
2. make the existing Context tab spacious and useful as a real-token composition reference; and
3. finish the already accepted Dark/Light workbench canvas, sidebar and showcase-card elevation
   relationship after the `hito-canvas-atmosphere` retirement.

This groups the remaining scope of the two closed source items below. It does not redesign the
palette, alter token values, introduce color controls, or change Product color consumption.

## Archive Intent

retain_in_place

## Superseded Source Items And Evidence

- [Foundations Color Provenance And Context Readability](/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-hito-ds-foundations-color-provenance-and-context-readability.md)
  supplies the captured Semantic, Primitive and Context defects plus the already accepted truth
  requirements.
- [Retire Hito Canvas Atmosphere](/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-retire-hito-canvas-atmosphere.md)
  proves the rejected gradient is already removed and supplies the accepted two-theme elevation
  ladder. Do not repeat its completed deletion stages.
- Current Inspector evidence: `/hitoDS`, Light, `1470×801`, selected
  `article.hito-ds-showcase-card`, computed fill `#FDFBF7`; the right canvas and card currently
  collapse into the same visible layer in Light.

## Product Outcome

Foundations becomes a truthful reference rather than a gallery of ambiguous swatches:

- every displayed color makes clear whether it is a primitive, alias, alpha primitive, or composite
  formula, and shows its active-theme resolved result without inventing provenance;
- Context shows real layers and real Hito text/chrome/action/intent roles with room to read them;
- the global System/Dark/Light control remains the only theme switch; and
- the Hito DS workbench has a deliberate three-layer hierarchy in both themes, with no decorative
  atmosphere gradient and no newly invented colors, opacity recipes or surface components.

## Demonstrated Causes

### Foundations color truth and Context

- `src/components/hito-ds/reference-foundations-page.tsx:81-85` currently reduces each semantic
  manifest record to a name, `var(--token)` and optional pairing. `PrimitiveColorCard` likewise
  loses rendered HEX/alpha evidence.
- `scripts/generate-hito-ds-manifest.mjs` is the canonical generator. Its schema-v2 semantic
  records already provide `label`, `channels`, Dark/Light `value` and `alias`, but the Foundations
  rendering path does not expose source/formula/opacity truth.
- The existing Context tab at `reference-foundations-page.tsx:528-607` displays nested layers and
  sample controls, but does not connect them to source values and is too compressed to inspect.

### Reference canvas hierarchy

- The rejected `hito-canvas-atmosphere` and `canvas-grain` have already been removed; zero-reach
  source proof is recorded in the superseded retirement item.
- `src/components/hito-ds/reference-page.tsx:61` puts the reference shell on `bg-surface`.
- `src/styles/reference-workbench.css:432-441` makes showcase cards `background` by default but
  changes them to `surface` in Light. The current Light shell and cards therefore both resolve to
  `surface` / linen-50, so the card disappears into the canvas.

The first incorrect owners are the existing Foundations manifest-to-view presentation seam and the
existing reference-page/reference-workbench composition seam—not Product routes or an Inspector
override.

## Required Work

### A. Color provenance in Semantic and Primitive tabs

For every currently displayed Semantic and Primitive color specimen, expose the following factual
information through the existing manifest-to-Foundations path:

1. human-readable role and canonical `var(--token)` code;
2. actual authored source: direct primitive alias or the complete authored formula;
3. alpha contribution when it exists, including alpha primitives and formula percentages; and
4. the active-theme resolved HEX value, preserving alpha when the actual resolved color is
   translucent.

Rules:

- Direct alias: identify the primitive and declared alpha, for example
  `--sand-alpha-08 · 8%`.
- Composite: show every source/percentage exactly. Never mislabel a `color-mix()` as one primitive.
- If a composite is only truthful against a parent surface, name that backing role and show the
  resulting value for that actual specimen. If a context-independent HEX cannot be factual, retain
  the authored formula and backing role instead of fabricating a hex.
- Keep existing token-copy semantics: token code remains the canonical copy target. Do not turn the
  copy action into a different source API or add competing page-local registries.

### B. Context tab

Retain the existing `Context` tab. Recompose it as a generous, inspectable composition specimen;
it is not a new editor, palette picker, alternate theme matrix or component showcase.

- **Layers:** canvas → surface → elevated/card → popover, with visible role, token code, source
  truth and active result.
- **Typography:** existing Hito UI hierarchy on a relevant actual surface, including primary,
  secondary, tertiary, disabled and inverse/on-accent only where those roles actually exist.
- **Chrome / actions / intent:** reuse existing Hito Field, Choice, Button and Status primitives on
  their appropriate semantic layers. Each shown color uses the same provenance presentation as the
  Foundation cards.
- Desktop keyboard focus and hover may reveal expanded detail with existing Hito focus/tooltip
  patterns. At exact `375px`, the essential role/token/source/value facts must be inline or
  touch-accessible through an existing disclosure; required information must never be hover-only.

### C. Workbench reference-canvas elevation

Use existing semantic roles only. The exact accepted layers are:

| Theme | Sidebar | Right-hand reference canvas | Showcase-card stage |
| --- | --- | --- | --- |
| Dark | `sidebar` / stone-950 | `surface` / stone-850 | `background` / stone-900 |
| Light | `sidebar` / linen-75 | `background` / linen-100 | `surface` / linen-50 |

- Preserve the existing borderless outer ShowcaseCard, its internal header divider, radius,
  padding, preview-stage behavior, deep links and specimens.
- Do not reintroduce `hito-canvas-atmosphere`, `canvas-grain`, gradients, image fills, shadows,
  literals, global tokens, an opacity recipe, new surface component or card variant.
- The sidebar stays an intermediate layer in Light and the darkest anchor in Dark. Its current
  `70%` treatment may remain only if the rendered intermediate layer is visibly distinct under the
  semantic ladder above.

## Existing Seams

- `src/styles/foundations.css` — canonical primitive and Dark/Light semantic values; no values are
  changed by this task.
- `scripts/generate-hito-ds-manifest.mjs` — sole generator-owned route for any derived
  provenance metadata.
- `src/generated/hito-ds-manifest.ts` and `.json` — generated output only; regenerate through the
  existing script, never edit by hand.
- `src/components/hito-ds/reference-foundations-page.tsx` — existing Semantic, Primitives and
  Context tabs, cards, swatches and copy behavior.
- `src/components/hito-ds/reference-page.tsx` and `src/styles/reference-workbench.css` — existing
  Hito DS page/card/sidebar composition seam.
- `scripts/validate-hito-ds-component-contracts.ts` — existing manifest/reference contract proof.

## Concurrency Gate

`FRONTEND DS` completed
[`Foundations Workout Specimen Edge Clarity`](/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-hito-ds-foundations-workout-specimen-edge-clarity.md),
including the `semanticRoleSlotStyle` region of `reference-foundations-page.tsx`.

This task began with read-only source mapping and the required design review. It did not overwrite,
format across, or undo that completed task's hunks. Before the first write to
`reference-foundations-page.tsx`, it obtained the final receipt, re-read the current file, and preserved
the accepted rule: decorative state borders disappear, while semantic `border` and `ring` remain
demonstrable only in their intended cells.

## Reuse-First Change Budget

- Reuse the generator, manifest, Foundations cards/tabs, copy affordance, global theme control,
  existing Hito tooltip/focus/disclosure primitives, and reference page/CSS composition.
- New runtime artifacts: none by default. A small pure generator-owned resolution/provenance seam
  is allowed only if both cards and Context need it and it derives solely from canonical CSS.
- Remove the existing information loss in Foundation cards and the unlabelled, cramped Context
  layer presentation. Do not leave a parallel static palette or hard-coded page registry active.

## What Not To Touch

- Primitive values, semantic Dark/Light mappings, alpha-ladder values, workout color contracts,
  Product CSS/routes/components, Backend, persistence, Figma, hosted state, dependencies and
  unrelated dirty work.
- `hito-surface-flat` globally, completed Foundations reference-surface geometry, or the active
  FRONTEND DS edge-clarity task's CSS/semantics.
- Any color editor, picker, new palette, theme switch, literal color, bespoke opacity value,
  generic wrapper, compatibility layer, client-side source registry, or Product primitive consumer.

## Definition Of Done

1. Every displayed Semantic/Primitive color traces truthfully from canonical CSS through the
   generated manifest to role, authored source/formula, alpha fact and active result.
2. Context makes actual layer, type, chrome, action and intent relationships readable without a
   hover-only dependency.
3. The reference-library Dark/Light sidebar → canvas → card ladder computes to the accepted roles;
   no atmosphere gradient/image remains.
4. The active Frontend DS border-clarity result is preserved: only semantic border/ring examples
   carry their meaningful edge treatment.
5. No token value, Product behavior or parallel color model is added.

## Validation Expectations

| Check | Scenario / environment | Required evidence |
| --- | --- | --- |
| Provenance discriminator | Direct alias, alpha primitive, single-source mix and multi-source mix | Generator/manifest/view preserve actual sources without a fictional primitive attribution. |
| Active resolution | Dark and Light semantic cards and Context backing layers | HEX/alpha result is factual for the actual active parent surface. |
| Reference hierarchy | `/hitoDS` Overview | At `1470×801` and `375×812`, Dark/Light computes sidebar/canvas/card to the accepted ladder; no card perimeter border or background image. |
| Foundations | Semantic, Primitive and Context tabs | Role, code, source/alpha/result readable; copy stays canonical; Context has real spacing and layers. |
| Accessibility | Keyboard and narrow/touch equivalent | Focus reveals desktop detail; mobile exposes the same essential facts without hover; tabs and deep links still work. |
| Regression | Existing showcase and Foundations state specimens | Compact and intrinsic specimens retain usable width; semantic border/ring cells remain meaningful; no overflow or console error. |
| Contracts and hygiene | Current shared checkout | Manifest parity, DS validator, focused Prettier/ESLint, `git diff --check`. |
| Build | Uncontended checkout | Fresh production build, or a precise concurrency boundary. |

Global QA, Figma parity, hosted state, deployment and release readiness are outside this item.

## Stage

Completed — Design System Implementation DoD and focused independent QA passed.

## Next Recommended Role

product

## Exact Design System Handoff

```text
ROLE: DESIGN SYSTEM

Mode: Tracked
Task: Complete the unified Foundations color truth, Context readability, and reference-canvas
elevation task exactly as written:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-hito-ds-foundations-color-truth-context-and-reference-canvas.md`

Read before the first write:
- `AGENTS.md`
- `agents/design-system.agent.md`
- `skills/hito-frontend-design-system/SKILL.md`
- `skills/hito-qa-browser-regression/SKILL.md`
- the complete canonical item and its two superseded evidence items
- `src/styles/foundations.css`
- `scripts/generate-hito-ds-manifest.mjs`
- `src/generated/hito-ds-manifest.ts` and `.json`
- `src/components/hito-ds/reference-foundations-page.tsx`
- `src/components/hito-ds/reference-page.tsx`
- `src/styles/reference-workbench.css`
- `scripts/validate-hito-ds-component-contracts.ts`.

Ownership and concurrency:
- You own this unified DESIGN SYSTEM task.
- `FRONTEND DS` is actively completing the separate `Foundations Workout Specimen Edge Clarity`
  task in `reference-foundations-page.tsx`. Start with read-only mapping/review. Do not overwrite,
  reformat across, or undo its hunks. Before your first write to that file, obtain its final receipt,
  re-read the current source, and preserve its semantic-border/ring result.

Outcome:
- Semantic and Primitive Foundation specimens show canonical token, authored alias/formula, alpha
  fact and active-theme result truthfully.
- Context becomes a spacious real-token composition specimen for layers, text, neutral chrome,
  actions and status, with equivalent desktop keyboard/hover and narrow touch access to the facts.
- `/hitoDS` preserves the accepted semantic ladder:
  Dark sidebar/surface/background and Light sidebar/background/surface for sidebar/canvas/card.

Use the existing generator/manifest, Foundation tabs/cards/copy, global theme control, Hito
tooltip/focus/disclosure primitives, and reference-page/reference-workbench composition seams.
Do not invent literals, tokens, alpha recipes, a page-local source registry, palette/editor,
component family or Product consumer. Do not change token values, Product source, Backend,
persistence, Figma, hosted state or unrelated dirty work. The atmosphere deletion is complete;
do not repeat it or reintroduce a gradient/image.

Before source edits, obtain one bounded read-only DESIGNER review using the existing DESIGNER role
for hierarchy, light/dark ladder and 375px information access. After your focused proof, obtain one
bounded read-only QA review using the existing QA role. They review only; you retain implementation
ownership. Do not create custom roles or delegate implementation.

Validate the item’s provenance cases, `/hitoDS` Overview and Foundations at 1470×801 and exact
375×812 in Dark/Light, keyboard/touch-equivalent disclosure, tabs/deep links, overflow, console,
manifest parity, DS validator, focused format/lint/diff, and an uncontended production build (or
record the exact contention). If your work stops the fixture QA server, restore it before the
English receipt. Do not stage, commit, push, deploy, mutate hosted state, call providers or alter
Figma.

Use Russian for visible in-progress commentary. Return only when the full Definition of Done is
met or a factual stop condition remains. Update this canonical item truthfully.
```

## Tracked Implementation Receipt — 2026-08-11

### Stage And Preflight

- Stage: Design System implementation and focused local acceptance.
- Canonical seams reused: the existing CSS export sections, manifest generator/generated outputs,
  Foundations Semantic/Primitive/Context tabs, reference-workbench composition, and DS validator.
- Smallest intended change: retain authored color provenance through the existing generator-to-view
  path, expose factual active results in the existing specimens, recompose the existing Context tab,
  and replace the translucent workbench-sidebar recipe with the exact semantic ladder.
- New runtime artifacts: none. No token values, component families, registries, wrappers,
  dependencies, Product consumers, or compatibility paths were added.
- Removed/simplified responsibility: Foundations no longer discards manifest mode/source truth;
  Context no longer uses the compressed unlabeled layer presentation; the sidebar no longer owns a
  separate 70% opacity recipe.
- The completed Frontend DS workout edge-clarity receipt was obtained before the first shared-page
  write and the accepted renderer was preserved byte-for-byte in behavior.

### Product Outcome And Source Hierarchy

- The generator now derives one structured provenance record for every 43 primitive records and
  both modes of all 41 semantic records: kind, exact authored source, referenced variables and
  percentages, alias chain, and factual alpha where transparency participates.
- Generated TypeScript and JSON remain structurally identical. Foundations consumes those records
  directly; it does not maintain a second source catalogue.
- Semantic and Primitive specimens now keep their human label and canonical `var(--token)` copy
  target while showing authored alias/formula, alpha, raw active-theme HEX/HEX-alpha, and the
  composited result against the specimen's named backing role when required.
- Context now presents full-width Layers followed by balanced Typography and Chrome/actions/intent
  peers. All 19 Context color facts are inline at desktop and exact 375px. `card` is truthfully
  documented as a same-level alias of `surface`, not as `surface-elevated`.
- Workbench composition now resolves exactly to Dark sidebar/surface/background and Light
  sidebar/background/surface for sidebar/canvas/showcase card, with no gradient, image, shadow, or
  replacement opacity recipe.

### Files Changed

- `scripts/generate-hito-ds-manifest.mjs`
- `src/generated/hito-ds-manifest.ts`
- `src/generated/hito-ds-manifest.json`
- `src/components/hito-ds/reference-foundations-page.tsx`
- `src/styles/reference-workbench.css`
- `scripts/validate-hito-ds-component-contracts.ts`
- this canonical item

No production file was added or deleted. `src/styles/foundations.css`, Product source, Backend,
Figma, hosted state, and unrelated dirty work were not changed by this task.

### Validation Inventory

| Check | Scenario / environment | Result | Evidence |
| --- | --- | --- | --- |
| Provenance discriminator | Generated direct alias, alpha primitive, single-source transparent mix, multi-source mix | Passed | `border`, `sand-alpha-08`, `chrome-subtle`, and `text-accent` retain distinct structured kinds, exact sources/references, and factual alpha. |
| Generated parity | `node scripts/generate-hito-ds-manifest.mjs --check` | Passed | 43 primitive colors, 41 semantic colors, 18 text styles; generated TS/JSON parity retained. |
| DS contract | `npm run validate-hito-ds-components` | Passed | Manifest coverage/provenance, reference hierarchy, workbench ladder, and workout edge discriminators passed across 321 source files. |
| Focused format/lint/hygiene | Prettier check, targeted ESLint, `git diff --check` | Passed | All task-owned executable/style files passed with no diff whitespace errors. |
| Production build and runtime | Repository-managed `npm run qa:server:restart` | Passed for task proof; later external freshness drift recorded | Fresh client/SSR/Nitro build completed and the managed loopback runtime was healthy, compatible, fresh, and `receipt_matches` throughout browser proof. Final status remained healthy/compatible but became stale after unrelated private Admin snapshot-marker drift. |
| Reference hierarchy | `/hitoDS`, 1470×801 and 375×812, Dark/Light | Passed | Dark computed sidebar `0.14`, canvas `0.19`, card `0.16`; Light `0.982`, `0.972`, `0.988`; 14 cards remained borderless with their 1px internal divider, no background image, and zero page overflow. |
| Foundations truth | Semantic, Primitive, Context, same four-mode matrix | Passed | 41 semantic, 43 primitive, and 19 Context facts resolved without `measuring…`; authored formulas wrap, alpha uses 8-digit HEX, and backing composites are named. |
| Accessibility/navigation | Keyboard focus, tab arrows, deep link, mobile inline access | Passed | ArrowRight changed Semantic to Primitives, token cards and Field retained visible semantic focus, `/hitoDS/components#buttons` resolved its anchor, and all required 375px facts remained inline with zero overflow. |
| Copy contract | Semantic token activation | Passed with bounded tooling gap | Activation produced `Copied color token — border: var(--border)`; the selected in-app browser did not expose clipboard bytes for independent readback. |
| Workout renderer regression | Live workout role specimen | Passed | Only `border` had a 1px edge; only `ring` had the 2px ring shadow; content/muted/surface/hover/active remained edge-free. |
| Browser health | Full focused interaction sequence | Passed | No console warnings/errors, dialogs, page overflow, or panel overflow. |

The first direct `npm run build` attempt overlapped another repository-managed build and lost an
intermediate Nitro asset (`ENOENT`). No ambiguous process was stopped. After that shared build
finished, the canonical managed restart produced the fresh passing build and healthy runtime above.
Full `tsc --noEmit` remains red on broad unrelated shared-checkout errors; a filtered read showed no
task-owned generator/validator/Foundations errors, and the fresh production build compiled the
task-owned runtime successfully.

### Reviewer Outcomes And Boundaries

- DESIGNER read-only review: passed. It established the manifest-derived information order,
  same-level `card` alias treatment, exact two-theme ladder, full-width/peer Context hierarchy, and
  inline 375px access. Those constraints were integrated before implementation.
- Independent QA read-only review: **Verdict: Passed** for focused Implementation DoD. The only
  coverage gap is direct clipboard-byte observation in the selected browser surface; DOM/source
  targeting and the rendered copy receipt remain confirmed.
- The managed QA server remains healthy/compatible after proof. Its final artifact status became
  stale because the shared checkout no longer matches the private Admin snapshot marker used by the
  successful build; this unrelated post-proof integrity drift was not repaired here. No fixture
  server was displaced by this work.
- Global QA Acceptance, Figma parity, hosted/production state, deployment, release readiness, and
  Product adoption are not claimed.

### Next Owner And Blockers

- Next owner: PRODUCT for ordinary prioritization of any downstream work; no implementation handoff
  is required for this completed Design System slice.
- Blockers: none for this item.

## Blockers

None. The former Frontend DS sequencing gate is complete and its accepted workout edge renderer is
preserved by this implementation.
