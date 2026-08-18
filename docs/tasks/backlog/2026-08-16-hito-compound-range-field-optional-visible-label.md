# Hito Compound Range Field Optional Visible Label

## Work Item ID

2026-08-16-hito-compound-range-field-optional-visible-label

## Status

completed

## Type

Bug

## Priority

high

## Owner

DESIGN SYSTEM

## Stage

Shared primitive repair completed; Product caller adoption remains a separate handoff

## Next Recommended Role

PRODUCT

## Scope

Only `HitoCompoundRangeField`, its canonical `/hitoDS` specimen/contract if required, and directly
necessary Design System proof. The page-level Heart Rate Settings usage is a later FRONTEND Product
follow-up once the shared contract is accepted.

## Archive Intent

Retain through the Product caller adoption and focused browser proof; compact to the optional visible
label and accessible grouping contract afterwards.

## Task

Let a product caller remove the redundant visible "Range" label without retaining an empty label
slot, weakening group accessibility, or deleting the shared compound-range component. The shared
labelled specimen must remain available in `/hitoDS`.

## User Report

Local Inspector capture `0f9268a1-3a48-41a6-a257-7f5be4a198d9` on route `/`, light,
1470×801, selected the visible `Range` span. Ivan requested its removal because it adds no meaning
and harms the Heart Rate Settings layout. Scope is all matching page usages, not retirement of the
shared DS component.

## Source Investigation

`src/components/settings/HeartRateProfileSection.tsx` is the only Product caller and passes
`label="Range"` into `src/components/ui/hito-compound-range-field.tsx` for every heart-rate zone.
That shared primitive makes `label` required, always renders `<span className="hito-label-md">`,
and uses it as the `role="group"` accessible name. The `/hitoDS` reference is the separate labelled
specimen caller. A page-local hide would leave an empty layout/semantics path; the first incorrect
owner is the shared primitive contract.

## Required Outcome

- A caller may omit the **visible** label and the label element/space is absent from the DOM/layout.
- The unlabelled grouping retains a truthful accessible name derived from existing lower/upper
  labels and unit, or another existing semantic input; no unlabeled `role="group"` is admitted.
- Existing labelled callers and the `/hitoDS` specimen preserve their visible label and behavior.
- No new primitive, CSS recipe, token, compatibility wrapper, or page-local workaround is added.

## What Not To Touch

Heart Rate Settings caller markup, product copy, range values/validation, keyboard behavior,
Design System visual language, route layout, local Inspector, hosted state, dependencies, Git
lifecycle, or unrelated dirty work. Return the accepted caller API and exact FRONTEND Product seam;
do not make that Product edit yourself.

## Validation Expectations

Prove labelled and unlabelled primitive output/type behavior, accessible group naming, keyboard
Arrow/Enter/Escape preservation, error/disabled states, and no label-gap layout. Verify the
existing `/hitoDS` specimen remains labelled. Run focused formatting/lint/contract checks and diff
hygiene. Browser, Product caller, hosted, Global QA, release, and deployment acceptance are out of
scope.

## Execution Preflight — 2026-08-16

- **Mode and owner:** Tracked Design System shared-primitive repair. The canonical owner is
  `src/components/ui/hito-compound-range-field.tsx`; Product caller adoption remains FRONTEND
  Product work.
- **Demonstrated red discriminator:** rendering the current primitive without `label` produces an
  empty `<span class="hito-label-md">` and leaves the group named only through
  `aria-labelledby` to that empty node. The visible and accessible failure therefore exists at the
  shared contract, not in Product layout or CSS.
- **Current reachability:** exactly two runtime source callers exist. Heart Rate Settings supplies
  `label="Range"`; the canonical `/hitoDS` control specimen separately supplies the same visible
  label. The Product and reference caller files are clean at this task boundary and will remain
  byte-stable.
- **Existing seam and smallest change:** make the existing `label` prop optional. When non-empty,
  keep the current visible label node and `aria-labelledby`; when omitted, render no label node and
  give the existing `role="group"` an `aria-label` derived from `lowerLabel`, `upperLabel`, and
  `unit`.
- **New runtime artifacts:** none. No CSS, token, component, helper file, wrapper, compatibility
  path, or page-local override is required.
- **Superseded responsibility:** remove only the primitive's assumption that every compound range
  requires a visible group label. Range value, validation, disabled state, input labels, and
  Arrow/Enter/Escape behavior remain unchanged.
- **Focused proof:** static labelled/unlabelled markup and type contract, absence of an empty label
  slot, derived group naming, retained disabled/error attributes and keyboard branches, unchanged
  labelled `/hitoDS` caller, focused lint/format/DS validation, and diff hygiene. Browser and Product
  caller acceptance remain explicitly outside this slice.
- **Stop condition:** return to PRODUCT if accessibility requires new caller copy/state, if Product
  markup must change inside this slice, or if the shared API cannot express the omission without a
  new visual recipe.

## Exact Handoff Prompt

```text
ROLE: DESIGN SYSTEM

Task: Hito Compound Range Field Optional Visible Label
Stage: Shared primitive repair — permit page-level visible-label removal without accessibility or layout drift
Mode: Tracked
Canonical item: docs/tasks/backlog/2026-08-16-hito-compound-range-field-optional-visible-label.md
Source evidence: Local Inspector item 0f9268a1-3a48-41a6-a257-7f5be4a198d9; src/components/settings/HeartRateProfileSection.tsx; src/components/ui/hito-compound-range-field.tsx

Ivan explicitly authorized an urgent fix. Read AGENTS.md, agents/design-system.agent.md, skills/hito-frontend-design-system/SKILL.md, this complete item, and the current primitive/reference callers before the first write. Re-check dirty boundaries and preserve unrelated bytes.

The first incorrect owner is the shared `HitoCompoundRangeField` contract: `label` is required, always renders a visible `hito-label-md` span, and is the only accessible group name. The Product page must remove its redundant visible "Range" label without leaving an empty layout slot or an unnamed group. Implement the smallest reusable primitive contract that permits this, while preserving the separately labelled `/hitoDS` specimen and every existing labelled caller.

Do not change Heart Rate Settings markup or copy, range validation/values, Product layout, tokens, Local Inspector, or add a new primitive, CSS recipe, wrapper, compatibility path, or page-local workaround. Maintain truthful group accessibility using existing lower/upper labels and unit when no visible group label is supplied. Return the exact accepted Frontend Product caller API; do not make its Product edit.

Prove labelled and unlabelled output/type behavior, accessible naming, Arrow/Enter/Escape behavior, error/disabled states, and no label-gap layout; keep the `/hitoDS` specimen visibly labelled. Run focused formatting/lint/contract checks and diff hygiene. Update only this canonical item with a compact English tracked receipt. Do not claim Product caller, browser, hosted, Global QA, release, or deployment acceptance.
```

## Tracked Implementation Receipt — 2026-08-16

### Task And Outcome

- **Task:** Hito Compound Range Field Optional Visible Label.
- **Mode:** Tracked shared-primitive repair.
- **Outcome:** `HitoCompoundRangeField` now accepts `label?: string`. A non-empty label preserves the
  existing visible `hito-label-md` node and `aria-labelledby`; an omitted label renders no label
  node and names the existing `role="group"` as
  `` `${lowerLabel} to ${upperLabel}, ${unit}` ``.
- **Acceptance boundary:** this is Design System Implementation DoD only. Product caller adoption,
  browser rendering, hosted behavior, Global QA, release, and deployment were not claimed.

### Root Cause And Source Hierarchy

The original shared primitive required `label`, always rendered a visible label span, and used that
span as the group's only accessible name. A direct static render without `label` demonstrated the
failure: an empty `hito-label-md` node remained and `aria-labelledby` referenced it. The first
incorrect owner was therefore the primitive contract, not Heart Rate Settings layout or CSS.

Exactly two source callers were found before implementation:

- `src/components/settings/HeartRateProfileSection.tsx` — Product caller with `label="Range"`;
- `src/components/hito-ds/reference-components-controls.tsx` — canonical visibly labelled
  `/hitoDS` specimen.

Both caller files remained byte-stable in this slice.

### Files Changed

- `src/components/ui/hito-compound-range-field.tsx` — made the existing label optional, conditionally
  omitted its DOM node, and added the derived accessible group name.
- `scripts/validate-hito-ds-component-contracts.ts` — added a focused assertion for the optional
  label, derived group name, labelled reference specimen, and retained keyboard/disabled/invalid
  branches. Existing unrelated dirty assertions were preserved.
- This canonical item — preflight, lifecycle, and receipt only.
- **New runtime artifacts:** none. No CSS, token, component, helper file, wrapper, compatibility
  path, Product override, or reference rewrite was added.

### Accepted Product Caller API

FRONTEND Product may remove only the redundant prop at the existing Heart Rate seam:

```tsx
<HitoCompoundRangeField
  lowerLabel={`${zone.label} lower bound`}
  upperLabel={`${zone.label} upper bound`}
  unit="BPM"
  {...existingRangeProps}
/>
```

Omitting `label` is the accepted contract; no empty string, hidden label, local wrapper, CSS override,
or replacement accessible-name prop is required. The primitive derives the group name from the
existing endpoint labels and unit. The `/hitoDS` specimen intentionally keeps `label="Range"`.

### Validation

| Check                      | Scenario / environment                                   | Result                                     | Evidence                                                                                                                                                                                                                     |
| -------------------------- | -------------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Red DOM discriminator      | Pre-change server render with omitted label              | Passed                                     | Demonstrated an empty visible-label node and empty referenced group name.                                                                                                                                                    |
| Labelled output            | Static React server render                               | Passed                                     | Visible `Range` node and `aria-labelledby` preserved; no competing group `aria-label`.                                                                                                                                       |
| Unlabelled output          | Static React server render                               | Passed                                     | Label node absent; group is the first child, so no empty grid slot; derived accessible name is present.                                                                                                                      |
| Error and disabled states  | Static React server render                               | Passed                                     | Two disabled inputs, two endpoint `aria-invalid` values, group invalid state, shared error description, and alert remained.                                                                                                  |
| Type contract              | Isolated TypeScript program importing the real primitive | Passed                                     | Both labelled and omitted-label JSX compile through the real component graph.                                                                                                                                                |
| Keyboard contract          | Current handler versus `HEAD` source                     | Passed                                     | ArrowUp, ArrowDown, Enter, and Escape handler region remained byte-identical.                                                                                                                                                |
| Caller stability           | Product and `/hitoDS` caller hashes                      | Passed                                     | Both matched their preflight hashes; the reference still supplies `label="Range"`.                                                                                                                                           |
| Focused formatting         | Prettier                                                 | Passed                                     | Primitive, validator, and canonical item conform.                                                                                                                                                                            |
| Focused lint               | ESLint                                                   | Passed                                     | Primitive and validator report no lint errors.                                                                                                                                                                               |
| Diff hygiene               | `git diff --check`                                       | Passed                                     | No whitespace error in the shared dirty checkout.                                                                                                                                                                            |
| Full DS validator          | `npm run validate-hito-ds-components`                    | Blocked by unrelated current documentation | The new Compound Range assertion passed; the only emitted failure is `docs/current-product.md` missing the existing `production-shipped` `/hitoDS` wording required by another owner. This slice did not edit that document. |
| Repository-wide TypeScript | `npx tsc --noEmit --pretty false`                        | Blocked by unrelated current work          | Existing errors span Admin import, Product routes, manual-workout/backend contracts, Supabase typing, and other dirty owners. The isolated primitive type graph passed.                                                      |

### Preserved Boundaries And Omitted Proof

Heart Rate Settings markup/copy, values, validation, Product layout, `/hitoDS` reference markup,
Local Inspector, CSS/tokens, hosted state, dependencies, and unrelated dirty work were not changed.
Browser and build replay were intentionally omitted by the canonical task because the Product caller
was not adopted and the focused primitive DOM/type contract is the accepted proof layer. Therefore
this receipt does not claim the Product page's rendered removal.

### Next Owner And Operating Context

- **Next owner:** PRODUCT to dispatch the one-line caller adoption to **FRONTEND, Product lane**.
- **Blockers:** none in the accepted shared primitive API. The unrelated global validator/typecheck
  failures remain with their demonstrated owners.
- **Role file:** `agents/design-system.agent.md`.
- **Project skill used:** `skills/hito-frontend-design-system/SKILL.md`.
- **Canonical task artifact:** this item.
- **Subagents:** none.
