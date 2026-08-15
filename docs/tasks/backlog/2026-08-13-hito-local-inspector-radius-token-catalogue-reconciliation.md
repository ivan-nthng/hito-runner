# Hito Local Inspector Radius Token Catalogue Reconciliation

## Work Item ID

2026-08-13-hito-local-inspector-radius-token-catalogue-reconciliation

## Status

completed

## Type

Lite — Local Inspector canonical-token readback correction

## Priority

P0

## Owner

DESIGN SYSTEM

## Next Recommended Role

PRODUCT — route the separate Local Inspector hash-serialization defect reported in the receipt.

## Frontend Lane

DevTools

## Parent

[Hito Next Visual Patch Intake](./2026-08-13-hito-next-visual-patch-intake.md)

## Scope

Correct only Local Inspector Radius token recognition and presentation. The inspected application
element already uses canonical `--radius-xl`; no Product or Design System CSS/layout change is
admitted in this slice.

## Archive Intent

retain_in_place

## Task

Make the loopback-only Local Inspector Radius menu read the canonical Hito radius scale correctly.
For a selected element that computes to 10px through `var(--radius-xl)`, the picker must display
and select `10 · --radius-xl`, not present 10px as `Keep current` and falsely select 12px.

Reuse the authoritative Design System token source already available to the DevTools seam. Do not
maintain a divergent hard-coded numeric radius catalogue if the existing generated manifest or live
canonical token resolution can own the values. Make the smallest correction that restores truthful
token recognition, menu values, request payloads, and readback.

## User Report

At `/workout/2026-08-13?tab=overview`, the Inspector selected a Row Group whose radius computed to
10px. Its Radius picker showed `Keep current 10px` while selecting `12 · --radius-xl`. Ivan asked
why an alleged canonical 10px token was absent from the dropdown.

## Demonstrated Root Cause

The runtime foundations define a base `--radius: 8px` and:

| Token          | Canonical computed value |
| -------------- | -----------------------: |
| `--radius-sm`  |                      4px |
| `--radius-md`  |                      6px |
| `--radius-lg`  |                      8px |
| `--radius-xl`  |                     10px |
| `--radius-2xl` |                     12px |
| `--radius-3xl` |                     16px |
| `--radius-4xl` |                     20px |

`src/components/devtools/local-ui-inspector-targets.ts:63-71` instead contains a stale
`HITO_RADIUS_SCALE` that uses `+4 / +8 / +12 / +16` for XL through 4XL. The wrong local catalogue
then feeds `getRadiusTokenOptions()` and the Inspector evidence classifier. This is the first
incorrect owner. The Workout Row Group and `src/styles/foundations.css` are not defective.

## Existing Seams

- `src/components/devtools/local-ui-inspector-targets.ts`
- `src/components/devtools/local-ui-inspector-token-evidence.ts`
- existing generated Hito DS manifest/token metadata, only if it is the smallest truthful source
  for the radius list

## What Not To Touch

- `src/styles/foundations.css`, its canonical radius declarations, generated manifests, Design
  System component CSS, or application component radius values.
- Workout overview/layout, Row Group, Product/Admin behaviour, Inspector availability gate,
  persistence, prompts unrelated to radius, Figma, hosted state, or Git lifecycle.
- The active `Local Inspector Batch Review Viewport Layout` task; it has a different root cause and
  must remain a separate lifecycle item.

## Lite Preflight

- **Outcome / evidence:** source-proven scale mismatch described above.
- **Existing seam:** Local Inspector radius-options construction and token classification.
- **Smallest change:** replace the stale XL+ offset interpretation with canonical values sourced
  from existing Hito truth.
- **New runtime artifacts:** none.
- **Simplification:** delete the proven stale numeric interpretation; no second radius scale remains.
- **Focused proof:** all seven options and a live `--radius-xl` element produce matching selected
  token/readback/payload evidence.
- **Promotion:** promote to Tracked only if canonical values cannot be obtained through the existing
  source/manifest seams, if a shared Design System token change is required, or if the correction
  alters Inspector persistence/prompt contracts beyond radius evidence.

## Execution Preflight — 2026-08-13

- **Product routing decision:** Product explicitly assigned this bounded DevTools seam to the
  DESIGN SYSTEM role as a cross-lane exception; the underlying Inspector availability, persistence,
  spacing, and colour contracts remain out of scope.
- **Demonstrated cause:** the local `HITO_RADIUS_SCALE` duplicates and contradicts the generated
  `primitiveRadius` collection. The manifest already carries all seven canonical CSS variables and
  their authored formulas.
- **Existing seam and smallest change:** derive Inspector radius options from
  `HITO_DS_MANIFEST.collections.primitiveRadius`, resolving its existing `var(--radius)` formula
  against the live root base. Delete the stale local offset catalogue.
- **New runtime artifacts:** none. One local formula resolver is required because the generated
  manifest intentionally preserves CSS expressions rather than computed pixels.
- **Focused proof:** exact seven-value source discriminator, Inspector evidence classification for
  `10px -> --radius-xl`, token-selection/prompt data flow, focused static checks, and fresh browser
  proof only from a current admitted runtime.
- **Promotion check:** no shared token, persistence, or second implementation owner is required;
  this item remains Lite.

## Definition Of Done

1. The Inspector Radius menu presents `4 / 6 / 8 / 10 / 12 / 16 / 20` for
   `sm / md / lg / xl / 2xl / 3xl / 4xl`.
2. A 10px `var(--radius-xl)` element is recognised as the applied canonical token, never as
   `Keep current` or 12px.
3. Radius selection and generated Inspector prompt payloads carry the same correct token/value.
4. Spacing and colour menus, local Inspector availability, and application styling remain unchanged.

## Browser Path Preflight — 2026-08-13

- **Validation layer:** focused Lite implementation proof only; the prior QA batch is not evidence
  for this change.
- **Artifact rule:** use only a newly built, healthy managed `qa_fixture` runtime whose freshness
  matches this source. No stale bundle, ad hoc server, hosted state, or permission-prompting bridge
  is admissible.
- **Browser target:** a canonical 10px `--radius-xl` surface plus the available radius catalogue in
  Local Inspector; verify selected-token readback, keyboard selection, prompt payload, and unchanged
  spacing/colour controls without changing persisted or hosted state.
- **Failure rule:** if a fresh managed artifact cannot be admitted, record the exact browser gap and
  retain the passing source/payload proof without claiming rendered acceptance.

## Focused Validation

- Source assertion covering all seven radius tokens/values and removal of stale XL+ offsets.
- Local loopback Inspector replay against an element using `--radius-xl`, plus a representative
  element for each remaining tier where available.
- Verify selection, clear/keep-current behaviour, generated prompt readback, keyboard selection,
  and console health.
- Focused Prettier, ESLint, and `git diff --check`.

## Historical Handoff Prompt

```text
ROLE: FRONTEND

Lane: DevTools
Task: Hito Local Inspector Radius Token Catalogue Reconciliation
Mode: Lite
Canonical item: docs/tasks/backlog/2026-08-13-hito-local-inspector-radius-token-catalogue-reconciliation.md

Read AGENTS.md, agents/frontend.agent.md, and skills/hito-frontend-design-system/SKILL.md before
acting.

Fix the root cause in the loopback-only Local Inspector Radius picker. The canonical runtime scale
is SM=4, MD=6, LG=8, XL=10, 2XL=12, 3XL=16, 4XL=20, but the DevTools catalogue currently treats XL
as 12px and larger tiers as similarly shifted. A selected element using var(--radius-xl) therefore
computes to 10px yet incorrectly appears as Keep current.

Use the existing canonical Design System token source or manifest if it can truthfully own these
values. Do not maintain a conflicting hard-coded numeric scale. Make the smallest DevTools-only
change so the menu, applied-token recognition, clear/keep-current state, and generated prompt
payload all agree with the real canonical radius tokens.

Do not change foundations.css, generated manifests, component CSS, Workout UI, Product/Admin
behaviour, Inspector availability/persistence, or the active Batch Review viewport task. Add no
runtime artifact, token, compatibility path, or parallel source of truth.

Validate source coverage for all seven tokens and run a local Inspector replay against a 10px
radius-xl element plus every other available tier. Verify picker selection, keyboard path,
readback/prompt truth, no unrelated spacing/colour regression, and console health. Run focused
Prettier, ESLint, and diff hygiene. Return a concise English Lite receipt in the canonical item.

If canonical values cannot be reused without changing a shared Design System token source or an
Inspector contract beyond radius evidence, stop and return the exact boundary to PRODUCT.
```

## Blockers

None for the radius-catalogue slice. Independent QA found a separate prompt-route serialization
defect (`/hitoDS/patternsnotice-surface`, missing `#`) after the radius payload passed; that is an
exact PRODUCT / FRONTEND DevTools boundary and was not folded into this Lite repair.

## Lite Implementation Receipt — 2026-08-13

- **Task / mode:** Hito Local Inspector Radius Token Catalogue Reconciliation — Lite, executed by
  DESIGN SYSTEM under Product's explicit cross-lane exception.
- **Demonstrated cause:** the loopback Inspector's private `HITO_RADIUS_SCALE` contradicted the
  generated `primitiveRadius` collection from XL upward. The false local scale made 10px look
  custom and labelled XL as 12px.
- **Canonical repair:** `src/components/devtools/local-ui-inspector-targets.ts` now derives all
  radius choices from `HITO_DS_MANIFEST.collections.primitiveRadius` and resolves the existing
  authored formulas against the live root `--radius`. The stale numeric catalogue and its fallback
  radius were deleted. No generated manifest or Foundation token changed.
- **Files changed:** `src/components/devtools/local-ui-inspector-targets.ts` and this receipt.
- **Runtime artifacts:** none.

| Check                | Scenario / environment                               | Result                              | Evidence                                                                                                                   |
| -------------------- | ---------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Source discriminator | Generated radius formulas and Inspector owner        | Passed                              | Exact scale is 4/6/8/10/12/16/20; `HITO_RADIUS_SCALE` is absent and `primitiveRadius` is the sole catalogue input.         |
| Full DS contract     | `npm run validate-hito-ds-components`                | Passed                              | Contract completed across 327 scanned files.                                                                               |
| Manifest parity      | `node scripts/generate-hito-ds-manifest.mjs --check` | Passed                              | Generated truth remained in parity.                                                                                        |
| Focused static proof | Prettier, ESLint, `git diff --check`                 | Passed                              | No focused formatting, lint, or whitespace failure.                                                                        |
| Production build     | Managed QA build and postbuild integrity             | Passed                              | Fresh artifact admitted with `receipt_matches`; standard non-failing Vite warnings only.                                   |
| Inspector readback   | Fresh managed `qa_fixture`, real 10px surface        | Passed                              | Readback selected `10px · --radius-xl`; catalogue was exactly 4/6/8/10/12/16/20 with the seven canonical token names.      |
| Inspector payload    | Real 12px target changed to 10px                     | Passed                              | Generated local-only prompt requested `--radius-xl (10px)` for all four corners. Draft was cleared and Pencil mode exited. |
| Independent QA       | Fresh managed `qa_fixture`                           | Passed for assigned radius contract | QA repeated readback, catalogue, payload, cleanup, overflow, and console checks.                                           |
| Post-review runtime  | Managed fixture after QA                             | External contention                 | A later private Admin digest change marked the still-healthy artifact stale/broken; no radius source moved.                |

The separate missing-hash observation does not invalidate radius token/value truth. No Global QA,
release, hosted, deployment, or Product adoption claim is made.
