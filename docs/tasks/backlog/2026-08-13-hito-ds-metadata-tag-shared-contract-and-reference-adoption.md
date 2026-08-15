# Hito DS Metadata Tag Shared Contract And Reference Adoption

## Work Item ID

`2026-08-13-hito-ds-metadata-tag-shared-contract-and-reference-adoption`

## Status

`completed`

## Type

Tracked — shared Design System primitive and reference implementation

## Priority

P1

## Owner

FRONTEND (ds)

## Depends On

[Hito DS Metadata Tag Light And Accent Contract Discovery](2026-08-13-hito-ds-metadata-tag-light-and-accent-contract-discovery.md)

## Scope

Implement the accepted additive `HitoMetadataTag` visual contract and migrate only Design
System-owned references. Preserve every existing semantic `tone` caller and its public API; no
Product/Admin or DevTools migration is needed for this slice. The current correction is limited to
the shared playground's implicit Accent selection: all status labels must default to Light unless a
specific reference explicitly opts into Accent.

## Stage

Completed — the additive Metadata Tag and static export-board specimens are adopted as implemented;
the consolidated Design System batch and its independent QA retry accepted the final default-Light
contract.

## Next Recommended Role

PRODUCT — use the terminal ownership chain for later release mapping; any actual Figma-library
mutation remains a separate DESIGN SYSTEM INTEGRATION boundary.

## Product Outcome

One existing `HitoMetadataTag` gains two explicit, borderless visual appearances:

- `light`: quiet neutral or semantic metadata;
- `accent`: deliberately scarce Signal, Positive, or Informative treatment only.

Visual intensity stays separate from semantic meaning. Existing callers keep supplying their
current semantic `tone` values exactly as they do today; the new visual selection is additive.
No new caller may supply a raw colour, custom property, raw hex, or alpha formula.

## Accepted Contract

The earlier closed replacement of `tone?: string` is **superseded by Product decision**. Keep the
existing public `tone` API and every current semantic value unchanged. Add a non-breaking optional
visual variant:

```ts
type HitoMetadataTagProps = ExistingHitoMetadataTagProps & {
  variant?: "light" | "accent";
};
```

- Omitted `variant` remains compatible with the existing caller contract and renders the new quiet
  `light` treatment.
- `light` retains the semantic meaning already expressed by `tone`, with no perimeter border.
- `accent` may render only the Designer-approved existing pairings: Signal plus existing Positive
  and Informative tone mappings. Unsupported accent-tone combinations, including Warning and
  Negative, fall back to their readable `light` treatment; no bright unsafe pair is introduced.
- Signal remains organizational/expressive metadata, never a success, warning, error, selection,
  or colour-only status cue.

## Demonstrated Root Cause

The existing shared primitive and its canonical CSS combine status tone with a base perimeter
border, tone-specific borders, and local alpha recipes. It has no explicit visual treatment for a
quiet light tag versus a deliberately expressive accent tag. The required correction is additive
presentation ownership at that canonical seam, not a type rewrite of semantic callers.

**First incorrect owner:** `src/components/ui/metadata-tag.tsx` and its canonical visual owner
`src/styles/controls-lists.css`, with Design System reference consumers in `/hitoDS`.

## Admitted Source Seams

- `src/components/ui/metadata-tag.tsx`
- `src/styles/controls-lists.css`
- `src/components/hito-ds/reference-components-controls.tsx`
- `src/components/hito-ds/playground.tsx`
- `src/components/hito-ds/reference-overview-page.tsx`
- `src/components/hito-ds/figma-export-board.tsx` only after preflight confirms its current dirty
  surface work is stable and there is no competing writer
- an existing directly relevant Design System validator only if it already owns the contract being
  changed

## Required Work

1. Capture current source/consumer/dirty state and prove the listed sources are the actual shared
   primitive and DS-owned consumer seams. Preserve all unrelated changes byte-for-byte.
2. Preserve `tone?: string` and every existing semantic caller. Add only an optional `variant`
   selection to the existing primitive; do not create a second tag/badge family.
3. Make `light` and approved `accent` renderings borderless. Reuse only the Designer-approved
   existing semantic background, foreground, typography, spacing, radius, motion, and ring
   contracts from the discovery.
4. Delete the base and tone-specific perimeter borders plus superseded local-alpha recipes.
   Retain current semantic tone mapping; do not delete or migrate cross-owner `tone` call sites.
5. Preserve valid host semantics:
   - read-only tags remain noninteractive;
   - tooltip tags retain their accessible description without duplicating the accessible name;
   - operational tags are valid only through an existing native actionable `asChild` host;
   - no fake interactive `<span>` remains in the DS reference/export surfaces;
   - focus uses the existing visible ring, never a restored perimeter border.
6. Update `/hitoDS/components#status` to show the compact approved matrix: Light neutral/positive/
   informative/warning/negative; Accent positive/informative/Signal; a real operational menu host;
   and one concise note that bright Warning/Negative are not admitted.
7. Update only DS-owned examples in the admitted files. Do not alter Product/Admin or DevTools
   call sites, behaviour, data, view-models, or local Inspector lifecycle.
8. Do not add a compatibility union, deprecation layer, migration debt, or compile prerequisite.

## Preserved Boundaries

- No Product/Admin/DevTools implementation, migration, public type change, or behaviour change.
- No Figma document mutation, library publication, generated manifest change unless an existing
  generator is proven to own this component contract, new tokens, colour pairs, CSS file, generic
  tag framework, second primitive, dependency, provider, persistence, or compatibility component.
- No bright Warning or Negative Accent, arbitrary organizational palette, workout colour adoption,
  Status Pill change, or generic chip/value-tag redesign.

## Execution Preflight

Before the first task-owned source write, add to this item:

1. the current consumer census and exact DS-owned versus cross-owner calls;
2. the admitted source hashes and active-writer status, especially for `figma-export-board.tsx`;
3. existing seam/reuse proof, proposed runtime artifacts (`none` expected), and exact legacy
   branches/selectors/call sites slated for deletion; and
4. the exact current semantic-tone preservation rule and approved accent fallback rule.

Return to PRODUCT before proceeding if new Foundation colour pairs, a Product/Admin or DevTools edit,
Figma mutation, a new primitive/token/registry, a second writer in an admitted file, or a design
decision beyond the accepted contract is required.

## Validation Inventory

| Check              | Required evidence                                                                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| API                | Existing `tone` callers compile unchanged; only the `light` or `accent` visual variant is added. Unsupported accent-tone combinations safely render as light without creating a new public path. |
| Source             | Shared border recipes and superseded local-alpha chrome are deleted; current semantic tone mappings and all cross-owner calls remain intact.                                                     |
| Visual             | Dark/Light on Canvas, Surface/Card, Elevated, and Popover: all approved pairs are borderless, readable, and stable.                                                                              |
| Contrast           | Browser-computed enabled text contrast is at least 4.5:1; canonical ring is at least 3:1 and unclipped.                                                                                          |
| Interaction        | Native operational menu host supports pointer, Enter/Space, Escape/focus return, disabled state, tooltip description, and reduced motion.                                                        |
| Responsive         | 375×812 and desktop tag groups wrap, long labels remain readable, and 28px operational target remains usable.                                                                                    |
| Static/runtime     | Focused Prettier, ESLint, directly relevant DS validation, TypeScript/build proportional to changed shared source, `git diff --check`, and fresh managed runtime where uncontended.              |
| Independent review | Existing `ROLE: QA` may perform a bounded read-only final browser review after Design System's own proof.                                                                                        |

Global QA, Figma parity, hosted acceptance, release readiness, and deployment are outside this
implementation slice.

## Definition Of Done

1. The shared primitive and DS-owned references follow the accepted borderless Light/Accent contract
   without breaking an existing semantic caller.
2. The Status reference demonstrates valid combinations and explicitly excludes unsafe accents.
3. DS-owned borders, superseded local-alpha chrome, fake interactive tags, and superseded typography
   are deleted without deleting semantic tone support.
4. The preserved semantic API and approved unsafe-accent fallback are recorded truthfully.
5. Focused validation is complete and the lifecycle receipt distinguishes its Implementation DoD from
   later Product/Admin/DevTools adoption.

## Exact Execution Prompt

```text
ROLE: DESIGN SYSTEM

Task: Hito DS Metadata Tag Shared Contract And Reference Adoption
Mode: Tracked — shared primitive and /hitoDS implementation.

Read before the first write:
- AGENTS.md
- agents/design-system.agent.md
- skills/hito-frontend-design-system/SKILL.md
- skills/hito-qa-browser-regression/SKILL.md when browser proof begins
- docs/tasks/backlog/2026-08-13-hito-ds-metadata-tag-shared-contract-and-reference-adoption.md
- docs/tasks/backlog/2026-08-13-hito-ds-metadata-tag-light-and-accent-contract-discovery.md

Implement the accepted shared HitoMetadataTag contract and Design System-owned consumers only.

Outcome:
- Keep the existing HitoMetadataTag primitive.
- Preserve the public `tone?: string` API and all existing semantic call sites exactly as they are.
- Add only `variant?: "light" | "accent"`; this is an additive visual choice, not a semantic API
  migration.
- Make both Light and Accent borderless. Light preserves the current tone meaning. Accent is
  admitted only for the existing safe Signal, Positive, and Informative mappings; Warning and
  Negative Accent must fall back to Light.
- Reuse exact existing semantic tokens, `hito-label-sm`, spacing, radius, motion, and focus ring.
  Do not introduce custom colour, alpha, token, primitive, registry, CSS file, dependency, or
  compatibility component or migration layer.

Root cause:
The shared primitive and `controls-lists.css` use perimeter borders and local-alpha chrome but have
no explicit visual treatment for quiet Light versus expressive Accent metadata. Correct that owner;
do not rewrite existing semantic callers.

Required work:
1. Capture fresh consumer/hashes/active-writer evidence. If `figma-export-board.tsx` has unowned or
   concurrent changes, preserve it and return that boundary instead of absorbing it.
2. Update only the shared primitive, canonical recipe, and the admitted Design System references.
3. Delete DS-owned perimeter borders and only the local-alpha chrome superseded by the new
   presentations. Preserve current semantic tone mappings and cross-owner call sites.
4. Add no deprecated union, compatibility overload, consumer migration, or Admin prerequisite.
5. Keep operational tags native through `asChild`; remove fake interactive spans. Preserve tooltip
   description, ring focus, disabled state, reduced motion, and long-label wrapping.
6. Update `/hitoDS/components#status` with the concise accepted matrix, not a colour gallery.

Boundaries:
- Do not edit Product/Admin consumers, `AdminMetadataMenu`, Product data/view-models, or DevTools.
  They are intentionally preserved, not deferred prerequisites for this slice.
- Do not mutate Figma, add new Foundation pairs, use bright Warning/Negative Accent, change Status
  Pill, redesign other tag/chip primitives, or touch unrelated dirty hunks.
- Return to PRODUCT before any such boundary, a new shared artifact, an unsafe contrast result, or
  a second writer in an admitted source.

Validation:
Prove the API contract, deletion census, browser-computed contrast, keyboard/pointer menu and
tooltip states, Dark/Light desktop and 375×812 wrapping, and proportional static/build/runtime
checks. You may ask existing ROLE: QA for one bounded read-only final browser review after your own
proof; do not delegate same-role implementation.

Final receipt in English: task/stage, preflight, root cause, changed/deleted seams, preserved
semantic API, validation table, coverage gap, next owner, and blockers. Do not claim Global QA,
Figma parity, hosted acceptance, release readiness, or deployment.
```

## Execution Preflight Receipt — 2026-08-13

### Source and consumer census

- Canonical owners remain `src/components/ui/metadata-tag.tsx` and the existing
  `.hito-metadata-tag` recipe in `src/styles/controls-lists.css`.
- Design System owns 10 direct `HitoMetadataTag` specimens across
  `figma-export-board.tsx`, `playground.tsx`, `reference-components-controls.tsx`, and
  `reference-overview-page.tsx`. The shared `HitoDsPlayground` `statusTone` handoff also has 19
  reachable DS calls across 11 `/hitoDS` source files: 18 Signal labels and one neutral label.
- Cross-owner reachability is 17 direct calls: one Admin wrapper call in
  `AdminOperationalComponents.tsx`, 12 Admin route calls in `admin.capture.tsx`, three DevTools
  calls in `LocalUiInspectorBatchReview.tsx`, and one Product call in
  `SavedPlanLibraryPanel.tsx`.
- Every direct cross-owner call already uses an admitted legacy literal or an inferred union of
  admitted literals. The sole open downstream handoff is `AdminMetadataMenu`, whose public
  `tone?: string` prop forwards that value to `HitoMetadataTag`.

### Reuse, dirty state, and change budget

- Reused seams: the existing primitive, its existing canonical CSS recipe, the existing Status
  reference, the existing `HitoDsPlayground`, and the existing Overview/export specimens.
- Proposed new runtime artifacts: **none**. No new primitive, token, CSS file, helper, registry,
  wrapper, or compatibility component is required.
- Historic preflight assumption: the earlier contract intended to delete the primitive's open
  `tone?: string` path and migrate every consumer. Product has superseded that assumption below.
  The resumed slice preserves semantic `tone`, deletes only perimeter borders and superseded
  presentation chrome, and adds the optional visual variant.
- The primitive and canonical CSS were clean at preflight. The four admitted DS reference files
  were already dirty from accepted earlier work and were not modified by this task. Recorded SHA-256
  values were:
  - `metadata-tag.tsx`: `e85d7e14fc79a2417e9ed06c25fb9f4cbd801e1643bb9761524d2e383feba9fa`
  - `controls-lists.css`: `2ecf2c4bd17b8b7657d6fbc4b6ba38a72f0d47c1b68f9f1dd95988560b238dbb`
  - `reference-components-controls.tsx`: `944042bd0fb16bf4f4e3fe8c574843c030f9d0c8c9774292a854f23f832ace48`
  - `playground.tsx`: `49d787da7665a737238b6fb79e076e2d00704dc7fba6a6f76447c8399d30175c`
  - `reference-overview-page.tsx`: `2d3e5da05788c8ff8b37602a16910ec00490bb34941e6868f69932a54f3b8cd6`
  - `figma-export-board.tsx`: `236d4170b8ed5db40d7e31502ad00c4d032a308730cdffc786379522cc6619da`

### Historic stop condition — resolved by Product decision

The earlier, now-superseded closed-union contract could not replace `tone?: string` without making
the unchanged Admin owner fail TypeScript at `AdminMetadataMenu`:

```tsx
// src/components/admin/AdminOperationalComponents.tsx
tone?: string;
<HitoMetadataTag asChild interactive tone={tone}>
```

Changing that public Admin wrapper type remains outside this Design System slice. Product has
confirmed that no public semantic API change is required: the shared primitive retains `tone?:
string`, and only an optional visual `variant` is added. The Admin boundary is therefore no longer
a blocker or a prerequisite. No task-owned production source was changed during the stopped
attempt.

No Product/Admin prerequisite remains. DESIGN SYSTEM resumes from a fresh preflight under the
revised non-breaking contract.

## Resumed Execution Preflight — 2026-08-13

- **Canonical owner and smallest change:** reuse `HitoMetadataTag` and its existing
  `.hito-metadata-tag` recipe. Add only `variant?: "light" | "accent"`, emit the resolved visual
  variant as component metadata, and replace perimeter/local-alpha presentation with the approved
  token pairs. Omitted `variant` resolves to `light`.
- **Semantic preservation:** retain `tone?: string` and every current Product, Admin, DevTools, and
  Design System semantic tone value. `success`, `signal`, and `rollout` are the only existing
  semantic values admitted to Accent, resolving respectively to the existing Positive, Signal, and
  Informative pairs. Every other or unknown tone with `variant="accent"` remains on the readable
  Light recipe; Warning and Negative Accent are not introduced.
- **Current reachability:** 27 direct calls remain across eight files: 10 DS reference calls and 17
  cross-owner calls. `HitoDsPlayground` remains one DS fan-out seam for 19 status labels (18 Signal,
  one neutral). Cross-owner source and the public semantic API remain untouched.
- **Dirty/active-writer discriminator:** the primitive and canonical CSS are clean. The four admitted
  reference files remain dirty from accepted prior work but retain the recorded hashes below; no
  active subagent is writing them. `figma-export-board.tsx` remains at
  `236d4170b8ed5db40d7e31502ad00c4d032a308730cdffc786379522cc6619da`, so its accepted six-wrapper
  surface diff is stable and will be preserved byte-for-byte outside the Metadata Tag specimen.
- **Proposed runtime artifacts:** **none**. No token, colour, helper, CSS file, primitive, registry,
  compatibility branch, dependency, fixture, or generated output is proposed.
- **Superseded responsibility to delete:** the base perimeter border; tone-specific border and
  local percentage-alpha backgrounds; the Light-only Signal override; duplicated local typography;
  and the static export specimen's non-operable `interactive` span. Semantic tone selectors remain
  only where they assign approved foreground/pair meaning.
- **Focused proof:** API/type/build continuity; source deletion census; DS validator and focused
  format/lint/diff checks; then Dark/Light desktop and exact 375×812 browser proof for the Status
  reference, approved/fallback pairs, tooltip, native operational menu, wrapping, focus, and console
  health. Browser skill instructions will be loaded before runtime proof.

## Historic Blocked Receipt — 2026-08-13

- **Task / stage:** Hito DS Metadata Tag Shared Contract And Reference Adoption — Tracked shared
  primitive implementation preflight.
- **Demonstrated root cause:** the shared primitive and CSS still own an open string presentation
  path plus perimeter/local-alpha recipes; the exact external compile discriminator is the Admin
  wrapper's second open `tone?: string` API.
- **Files changed:** this canonical item only. No primitive, CSS, reference, Product, Admin,
  DevTools, generated, Figma, or runtime source was modified.
- **Evidence obtained:** complete direct-consumer census, complete DS playground fan-out census,
  canonical CSS selector inspection, cross-owner type inspection, admitted-file dirty snapshot,
  and admitted-file content hashes.
- **Checks:** the canonical item passed focused Prettier and trailing-whitespace inspection.
  Production-source formatting/lint, DS validation, build, managed runtime, browser matrix, and
  independent QA were not run because execution stopped before the first production-source write.
  Consequently no Implementation DoD or visual/API acceptance is claimed.
- **Original next owner:** PRODUCT, to route a type-narrowing prerequisite under the former
  closed-union decision.
- **Original blocker:** exact cross-owner Admin compile boundary above. This is superseded by the
  revised Product decision; it is retained only as evidence for why no source changed.

## Product Decision — 2026-08-13

Ivan clarified the goal: existing semantic tags must remain untouched, while the Design System adds
two visually distinct, borderless presentations — quiet `light` and expressive `accent`. This is a
non-breaking visual extension, not a `tone` API cleanup. The prior block is resolved; the item is
ready for DESIGN SYSTEM implementation without any Frontend Product/Admin prerequisite.

## Browser Path Preflight — 2026-08-13

- **Validation layer:** focused local Implementation DoD for the shared Metadata Tag and its
  `/hitoDS/components#status` reference; not Global QA Acceptance.
- **Runtime path:** use only the repository-managed loopback `qa_fixture` lifecycle against the
  fresh production build. The build stopped the prior stale server as designed, so one canonical
  managed restart is required; no duplicate or ad hoc server is admitted.
- **Browser path:** use a supported non-prompting local browser/control surface. Abandon any path
  that raises a platform permission dialog and continue with another supported local path without
  asking Ivan.
- **Focused matrix:** exact 1470×801 and 375×812 in Dark and Light on
  `/hitoDS/components#status`; inspect the five Light and three admitted Accent examples, Warning /
  Negative Accent fallback, tooltip description, native Review state menu pointer/keyboard/Escape
  and focus return, disabled host, wrapping/overflow, computed borders/colours/ring, and console
  health. Canvas, Surface/Card, Elevated, and Popover composition will be sampled from the rendered
  reference/menu layers without fabricated DOM.

## Lifecycle Note

Created and dispatched by PRODUCT after the completed Designer decision. The first 2026-08-13
execution preflight demonstrated an Admin boundary created by a now-superseded closed-union
assumption and stopped before production-source implementation. The Product Decision above resumes
the item as a non-breaking Design System visual-contract slice.

## Product Correction — 2026-08-13

### User Report

After the completed contract rollout, Accent appears across the Design System wherever a status
label is present. Ivan confirmed the intended rule: `light` is the default everywhere. Accent is
scarce and must be requested explicitly, case by case; Ivan will identify future Accent usages.

### Observed And Expected Behaviour

- **Observed:** every `HitoDsPlayground` status with `statusTone="signal"` receives
  `variant="accent"` implicitly, so the reused playground promotes many ordinary labels to Accent.
- **Expected:** all shared playground status labels render `variant="light"`, regardless of their
  semantic tone. Existing explicit `variant="accent"` calls remain the only current Accent usages.

### Source Investigation And Demonstrated Cause

The source discriminator is
`src/components/hito-ds/playground.tsx:128`:

```tsx
<HitoMetadataTag variant={statusTone === "signal" ? "accent" : "light"} tone={statusTone}>
```

The `statusTone="signal"` handoff is reused across 18 current `/hitoDS` references. This single
conditional is the first incorrect canonical owner of the unintended broad Accent presentation.
Explicit Accent examples are limited to the Status reference, Overview, and static Figma export
specimens; they are not evidence for a global default and must remain unchanged.

### Correction Boundary

- **Mode:** Lite correction inside this retained Tracked item; one known Design System owner, one
  existing seam, and focused source/browser proof.
- **Admitted source:** `src/components/hito-ds/playground.tsx` only, plus this lifecycle record.
- **Smallest change:** remove the signal-to-Accent inference so the shared status renderer uses
  Light by default.
- **New runtime artifacts:** none.
- **Do not touch:** the `HitoMetadataTag` API/CSS, explicit Accent reference calls, Product, Admin,
  DevTools, Figma files, tokens, validators, generated manifests, or unrelated dirty hunks.
- **Promotion:** promote to Tracked only if fresh source inspection finds a second implicit Accent
  owner or focused proof exposes a broader visual/API regression.

### Focused Proof

1. Source census proves the shared playground has no conditional or implicit `variant="accent"`
   path and explicit Accent calls remain explicit.
2. Relevant `statusTone="signal"` playground specimens render Light in Dark and Light themes.
3. Existing explicitly Accent Status-reference examples remain Accent; no Product/Admin/DevTools
   source changes occur.
4. Run focused Prettier, ESLint for the admitted file, and `git diff --check`. Browser proof is
   required only if an uncontended fresh managed artifact is already available; otherwise record
   the omission without claiming visual acceptance.

### Exact Follow-up Prompt

```text
ROLE: DESIGN SYSTEM

Task: Metadata Tag — Explicit Accent Only
Mode: Lite correction in the existing canonical task
`docs/tasks/backlog/2026-08-13-hito-ds-metadata-tag-shared-contract-and-reference-adoption.md`.

Read AGENTS.md, agents/design-system.agent.md, and
skills/hito-frontend-design-system/SKILL.md before editing.

Outcome: Light is the default for every shared HitoDsPlayground status label. Accent must appear
only where a specific caller explicitly passes `variant="accent"`.

Demonstrated cause: `src/components/hito-ds/playground.tsx` infers Accent whenever
`statusTone === "signal"`, promoting 18 ordinary reused status labels.

Change only that existing shared-playground renderer and this task receipt. Preserve all explicit
Accent examples, the Metadata Tag API/CSS, Product/Admin/DevTools/Figma sources, tokens, validators,
and unrelated dirty work. Add no artifact, abstraction, compatibility path, or migration.

Prove that no implicit Accent inference remains, explicit Accent examples remain explicit, and the
admitted source passes focused formatting/lint/diff hygiene. If an uncontended current managed
artifact is available, verify a representative signal-label playground in Dark and Light; otherwise
record that browser coverage gap. Return to PRODUCT if another implicit owner or a broader contract
change is required.
```

## Tracked Implementation Receipt — 2026-08-13

### Task / stage

Hito DS Metadata Tag Shared Contract And Reference Adoption — shared primitive implementation and
focused local acceptance.

### Product outcome and demonstrated root cause

The existing `HitoMetadataTag` now has one additive visual choice,
`variant?: "light" | "accent"`, while its public `tone?: string` contract and every current caller
remain unchanged. The first incorrect owner was the shared primitive/CSS seam: it combined semantic
tone with a base perimeter border, tone-specific borders, and local percentage-alpha fills, so it
could not distinguish quiet metadata from deliberately expressive metadata.

The canonical repair keeps Light as the default, borderless treatment. Accent is admitted only for
the existing semantic mappings `success` (Positive), `rollout` (Informative), and `signal`
(organizational Signal). `warning`, `error`, `destructive`, arbitrary, or missing tones have no
Accent selector and therefore safely retain Light. This is one component and one semantic `tone`
truth, not a compatibility layer or second tag family.

### Files changed

- `src/components/ui/metadata-tag.tsx` — added the optional visual variant, retained `tone?: string`,
  reused `hito-label-sm`, kept native `asChild` behavior, and corrected tooltip semantics so visible
  text remains the accessible name while tooltip content is the description.
- `src/styles/controls-lists.css` — made the shared recipe borderless; reused existing chrome,
  semantic text/pair, spacing, radius, motion, disabled, and ring contracts; removed the base/tone
  borders, percentage-alpha tone fills, Light-only Signal override, and duplicated typography.
- `src/components/hito-ds/playground.tsx` — made existing Signal status labels opt into Accent at the
  single fan-out seam; neutral labels stay Light.
- `src/components/hito-ds/reference-components-controls.tsx` — replaced the Status metadata area
  with the accepted compact Light/Accent/behavior matrix, including the real native Review-state
  menu, tooltip, disabled host, long-label wrapping, and the unsupported-accent note.
- `src/components/hito-ds/reference-overview-page.tsx` — opted the existing Reviewed success example
  into Accent without changing its semantic tone.
- `src/components/hito-ds/figma-export-board.tsx` — updated only the static Metadata Tag specimens
  and removed their fake interactive span; the concurrently accepted six-wrapper surface diff was
  preserved outside that block.
- This canonical item — lifecycle, preflight, browser path, and receipt.

No Product, Admin, DevTools, `AdminMetadataMenu`, token, generated manifest, Figma, dependency, or
hosted source was changed. New runtime artifacts: **none**.

### Validation inventory

| Check                       | Scenario / environment                                                          | Result                                   | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| API / source contract       | Primitive, CSS, and repository reachability                                     | Passed                                   | `tone?: string` remains; only optional `variant` was added. Accent selectors exist only for `success`, `rollout`, and `signal`; no warning/negative Accent reference exists. Existing direct cross-owner callers were not edited.                                                                                                                                                                                                                                                    |
| Deletion / reuse            | Canonical metadata recipe                                                       | Passed                                   | Base and tone perimeter borders, local percentage-alpha tone fills, Light-only Signal override, duplicated local typography, and the static fake interactive span were removed. Existing tokens and native hosts were reused.                                                                                                                                                                                                                                                        |
| Formatting                  | Focused Prettier check                                                          | Passed                                   | All changed TSX, primitive, export/reference, and receipt files match Prettier.                                                                                                                                                                                                                                                                                                                                                                                                      |
| Lint                        | Focused ESLint                                                                  | Passed                                   | All changed TypeScript/TSX source passed without findings.                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Manifest parity             | `node scripts/generate-hito-ds-manifest.mjs --check`                            | Passed                                   | `primitiveColors=43`, `semanticColors=41`, `textStyles=14`; no generated output changed.                                                                                                                                                                                                                                                                                                                                                                                             |
| Design System validator     | `npm run validate-hito-ds-components`                                           | External failure                         | The only failure is the existing Brand background/favicon tone invariant. It does not reference Metadata Tag source or this contract; this slice did not repair that separate owner.                                                                                                                                                                                                                                                                                                 |
| TypeScript                  | `npx tsc --noEmit`                                                              | External baseline failure                | The repository-wide command remains red on the existing multi-owner dirty baseline. No task-owned Metadata Tag error was present; the fresh production build below compiled the changed shared source.                                                                                                                                                                                                                                                                               |
| Production build / runtime  | Managed `qa_fixture` restart after final runtime source                         | Passed, then external receipt-time drift | Fresh production build completed and the managed runtime was healthy, compatible, loopback-only, and `artifactFreshness: fresh` with `freshnessReason: receipt_matches` for Design System and independent QA browser proof. After the receipt-only Markdown write, status recomputation reported `artifact_missing` for the separate private Admin repository snapshot digest. No task runtime source changed after proof; this slice did not restart or repair that external owner. |
| Browser matrix              | `/hitoDS/components#status`, 1470×801 and 375×812, Dark/Light                   | Passed                                   | All 13 rendered tags had `0px` borders; exact 375px layout had zero horizontal overflow; the long label wrapped to 327×35.5px; console warnings/errors were zero.                                                                                                                                                                                                                                                                                                                    |
| Contrast / compositing      | Active semantic Canvas, Surface/Card, Elevated, and Popover parents, Dark/Light | Passed                                   | Browser-composited enabled minima were Light 4.90–5.30:1 by parent and Dark 4.79–5.58:1 by parent. Individual reference treatments measured Light 4.91–7.40:1 and Dark 5.15–9.42:1. Ring contrast measured 3.50:1 Light and 6.68–6.71:1 Dark.                                                                                                                                                                                                                                        |
| Interaction / accessibility | Native Review menu, tooltip, disabled host, reduced motion                      | Passed                                   | Pointer and Enter/Space opened the menu; Escape closed and returned focus; selection updated the real controlled value; tooltip used `aria-describedby`, retained the visible name, dismissed on Escape, and kept focus; operational target was 28px; reduced-motion media reduced transition duration to `1e-05s`.                                                                                                                                                                  |
| Diff hygiene                | `git diff --check`                                                              | Passed                                   | No whitespace errors.                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Independent QA              | Existing named QA role, read-only, same fresh runtime                           | Passed                                   | QA independently replayed the four-cell matrix, source fallback, pointer/keyboard menu, tooltip, disabled host, wrapping, contrast, overflow, and console health. Verdict: Passed; no focused coverage gap.                                                                                                                                                                                                                                                                          |

### Preserved boundaries, omissions, and next owner

Implementation DoD for this shared Design System slice is complete. The full DS validator and
standalone TypeScript command remain red only on pre-existing unrelated repository owners described
above. The post-proof managed-status drift is likewise confined to the unrelated private Admin
snapshot gate; both browser reviewers had already completed against the fresh matching artifact,
and only this Markdown receipt changed afterward. This receipt therefore does not elevate any of
those wider checks to whole-repository green status. Product, Admin, and DevTools callers continue
to compile through the unchanged default-Light `tone` API and require no migration. Any later
decision to opt those consumers into Accent returns to PRODUCT for owner-specific routing.

No Global QA, release readiness, deployment, hosted acceptance, Product adoption, Figma mutation,
or Figma parity is claimed.

### Product Routing Correction — 2026-08-13

The completed shared-component receipt above is historical evidence. The remaining known correction
in `src/components/hito-ds/playground.tsx` is assigned to **FRONTEND (ds)**: status labels must use
the borderless Light presentation unless the individual reference explicitly opts into Accent.
DESIGN SYSTEM is a fallback only when FRONTEND (ds) is unavailable; no Product/Admin migration or
API change is admitted.

### Execution context

- Role file: `agents/design-system.agent.md`.
- Skills used: `skills/hito-frontend-design-system/SKILL.md` and
  `skills/hito-qa-browser-regression/SKILL.md`.
- Subagent used: existing named `ROLE: QA`, bounded read-only final review only; no Design System
  implementation was delegated.

## Terminal Lifecycle Reconciliation Receipt — 2026-08-14

- **Historical fact preserved:** the first implementation receipt completed the additive
  `variant?: "light" | "accent"` primitive/CSS/reference work, including the static Metadata Tag
  specimens in `figma-export-board.tsx`, but the item remained blocked after the later implicit
  Signal-to-Accent playground defect was routed through `FRONTEND (ds)`. The historical owner,
  receipts, validation results, and routing text above are unchanged.
- **Current completion evidence:** the
  [consolidated Reference Contract And Table Density batch](./2026-08-13-hito-ds-reference-contract-and-table-density-batch.md)
  removed the implicit Accent handoff while preserving explicit approved Accent specimens. Its
  [independent QA retry](./2026-08-13-hito-ds-reference-contract-and-table-density-independent-qa.md)
  passed the fresh Light/Dark desktop/mobile Metadata Tag contract with Light as default and only
  explicit approved Accent examples.
- **Static export ownership:** current source still contains the exact four noninteractive export
  specimens: Light neutral, Accent success, Light warning, and Accent signal. Their parent file's
  six surface-wrapper changes remain separately owned by the completed
  [Figma Export Surface Canonicalization](./2026-08-13-hito-ds-figma-export-surface-canonicalization.md).
  The inspected board SHA-256 was stable at
  `2c03b47d30060beed8acbf86b2978030acc6f9bda04f97ddb1cdd329d116b263`.
- **Adopted bytes and boundaries:** this lifecycle closure adopts the exact existing source bytes;
  it changes no primitive, CSS, reference, export board, runtime, build output, Figma file, hosted
  state, or Git state. It does not claim Figma mutation/parity, Global QA, release readiness, or
  deployment.
- **Current blockers:** none for the completed code-side Metadata Tag contract. PRODUCT owns later
  release admission; DESIGN SYSTEM INTEGRATION requires a separately approved editable Figma
  target before any downstream library mutation.
