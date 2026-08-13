# Hito DS Mark Playground And Size-Aware Radius

## Work Item ID

2026-08-12-hito-ds-mark-playground-and-size-aware-radius

## Status

completed

## Type

design-system-library

## Priority

high

## Owner

design-system

## Mode

Tracked

## Scope

Refine the accepted Hito Mark primitive and its `/hitoDS/foundations#marks` reference. Replace the
static all-sizes matrix with one interactive, tall Mark playground and make the tile frame radius
scale through the existing Hito radius primitives. The canonical Mark library, supplied SVG geometry,
semantic colour contract, Product consumers, Figma, and unrelated dirty work remain out of scope.

## Archive Intent

retain_in_place

## User Outcome

One chosen Mark must be inspectable at any supported size inside a calm, sufficiently tall rectangular
stage, with its controls at the right on desktop and naturally below on narrow screens. The lower
gallery remains the complete visual catalogue. Tile corners must become progressively rounder as a
Mark grows, while circles remain circles.

## Source Investigation

- `src/components/ui/hito-mark.tsx` is the only Mark runtime owner. It currently renders every tile
  with `rounded-2xl`, so all five physical sizes resolve to the same 12px radius.
- The existing Foundation scale already provides the complete required progression: `--radius-lg`
  is 8px; `--radius-xl` 10px; `--radius-2xl` 12px; `--radius-3xl` 16px; and `--radius-4xl` 20px.
  No approximately-36px primitive exists, and adding an arbitrary literal is not authorized.
- `reference-foundations-page.tsx` currently renders a static `Five sizes · two shapes` matrix above
  the Mark gallery. The same reference already owns selected shape/size state and the all-Mark
  gallery/provenance.
- `src/components/hito-ds/playground.tsx` and its existing `hito-ds-playground-stage` /
  `hito-ds-playground-controls` composition are the canonical reusable two-column stage/control
  seam. Its demo stage is already tall enough for a 256px Mark with responsive containment.
- Mark metadata currently resolves one canonical `base` frame plus its paired glyph. Any expanded
  background chooser must be derived in the same Mark owner from existing semantic slots and their
  proven foreground pair; the Foundations page must not invent a second colour map.

## Confirmed Root Cause

The uniform radius is caused by one unconditional tile class at the canonical Mark primitive. The
crowded all-sizes presentation is caused by a route-local size-matrix renderer despite an existing
canonical playground composition. Both fixes belong to DESIGN SYSTEM; neither needs new CSS or a
Product route workaround.

## Required Changes

### 1. Dynamic tile radius

Use the existing Hito radius primitives, data-owned at the Mark owner, with exactly this mapping:

| Mark size | Physical size | Tile radius primitive | Resolved radius |
| --- | ---: | --- | ---: |
| `xs` | 32px | `--radius-lg` | 8px |
| `sm` | 40px | `--radius-xl` | 10px |
| `md` | 64px | `--radius-2xl` | 12px |
| `lg` | 128px | `--radius-3xl` | 16px |
| `hero` | 256px | `--radius-4xl` | 20px |

- The mapping applies only to `shape="tile"`; `shape="circle"` remains fully round at every size.
- Reuse the existing Tailwind/DS radius utilities or semantic token classes. Do not introduce a new
  radius token, arbitrary `px` class, inline radius style, CSS recipe, or per-consumer override.
- Keep the existing frame/glyph sizing and optical-fit data intact.

### 2. Interactive Marks playground

- Replace, do not duplicate, the static `Five sizes · two shapes` matrix in
  `reference-foundations-page.tsx` with the existing `HitoDsPlayground` composition.
- Its demo stage contains exactly one selected `HitoMark`, centred and fully visible at `hero` size.
  Reuse the canonical stage: no gradient, perimeter border, bespoke stage CSS, raw height, or
  overflow clipping.
- Place the existing-style controls in the playground’s right control column on desktop and below
  the stage on narrow viewports:
  - **Mark** — one existing Select/Dropdown control listing all 15 canonical Mark names;
  - **Shape** — `tile` / `circle` using the existing choice control;
  - **Size** — `xs` through `hero` using the existing choice control;
  - **Background** — one existing Select/Dropdown showing only the selected Mark’s approved,
    theme-aware semantic frame options, each with a live swatch and readable label.
- Background defaults to the Mark’s canonical frame. A background option is available only when its
  glyph pairing is defined at the canonical Mark owner and contrast-safe in both themes. Workout
  options may use existing family slots only; surface marks may use only their existing semantic
  frame presets. Do not offer raw primitives, cross-family colour reassignment, arbitrary alpha,
  a picker, or a Foundations-only colour registry.
- If an expanded frame choice requires Mark metadata or a component prop, make that canonical in
  `hito-mark.tsx`; do not create reference-only state mappings or direct background styles.
- Keep the lower full gallery, optical-fit facts, and Frame/Glyph/Content provenance. It is the
  catalogue; the playground is the focused inspection surface.

## What Not To Touch

- Do not change the 15 supplied paths/viewBoxes, their names, the five Mark sizes, theme tokens,
  workout colour values, Icon, WorkoutGlyph, Product consumers, `/hub`, Figma, generated manifests,
  validators, Backend, persistence, or hosted state.
- Do not add a new CSS file, custom CSS selector, raw hex/opacity/radius value, alternative Mark
  implementation, framework, gallery, token registry, compatibility path, or Product adoption.
- Do not alter the shared `HitoDsPlayground` contract unless source proof demonstrates the existing
  one cannot express this reference without a reusable DS improvement; return to PRODUCT first if
  that occurs.

## Definition Of Done

1. Tile radii resolve to 8/10/12/16/20px across `xs` → `hero`, from the existing primitive scale;
   circles remain round.
2. Exactly one selected Mark appears in the reusable, tall playground stage; `hero` is contained
   without clipping at desktop and exact 375×812.
3. Mark, Shape, Size, and approved Background controls update the same selected specimen with no
   separate reference-only colour truth.
4. The old size/shape matrix is removed, not retained beneath or beside the playground.
5. The lower 15-Mark catalogue, semantic provenance, accessibility behavior, and Dark/Light
   resolution remain intact.
6. No new CSS, raw literals, token, Product mutation, or unrelated hunk is added.

## Validation Expectations

| Check | Scenario / environment | Required evidence |
| --- | --- | --- |
| Radius discriminator | Five sizes × tile/circle | Computed 8/10/12/16/20px tile corners; circle stays fully round |
| Playground controls | All 15 names; shape, size, approved background choices | One specimen changes; dropdown/choice keyboard semantics and focus work |
| Theme/contrast | 1470×801 and exact 375×812, Dark/Light | Approved frame/glyph pair remains legible; hero contained; zero page overflow |
| Catalogue regression | Lower Mark gallery | All 15 Mark entries and provenance remain rendered |
| Safety | Shared checkout | Existing DS validator, focused lint/format, `git diff --check`, uncontended build; no unrelated hunk overwritten |

Global QA, Figma parity, Product adoption, deployment, and release readiness remain separate.

## Stage

Design System implementation completed; focused browser QA passed.

## Next Recommended Role

PRODUCT

## Exact Design System Handoff

```text
ROLE: DESIGN SYSTEM

Mode: Tracked

Implement the canonical task:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-12-hito-ds-mark-playground-and-size-aware-radius.md`

Read `AGENTS.md`, `agents/design-system.agent.md`, and
`skills/hito-frontend-design-system/SKILL.md` before the first write. Read the complete task,
`src/components/ui/hito-mark.tsx`, `src/components/hito-ds/reference-foundations-page.tsx`, and
the existing `HitoDsPlayground` / reference-workbench composition before choosing the smallest edit.
Inspect the dirty diff and preserve unrelated hunks byte-for-byte.

The demonstrated causes are canonical: one unconditional `rounded-2xl` makes all Mark tiles 12px,
and a local all-sizes matrix bypasses the existing HitoDsPlayground stage/control composition. Apply
the exact existing-token radius map in the item and replace the matrix with one selected-Mark
playground; do not add CSS, a token, a raw value, a parallel colour map, or a Product workaround.

The playground's Background selector may expose only canonical, theme-aware Mark frame choices with
their defined contrast-safe glyph pairing. Keep the choice and metadata at the Mark owner if it must
be extended; do not make Foundations own an Inspector-like colour registry or raw picker. Keep the
lower gallery as the full catalogue.

You implement all DESIGN SYSTEM source yourself. Do not delegate DESIGN SYSTEM or FRONTEND source
implementation. If independent evidence is material, use only an existing named `ROLE: QA` or
`ROLE: DESIGNER` for a bounded read-only review after your source is stable.

Validate the exact five radii, circle behavior, all controls, all 15 catalogue entries, Dark/Light,
desktop and exact 375×812 containment, keyboard/focus, overflow and console health. Run existing DS
validator, focused formatting/lint, `git diff --check`, and only an uncontended build. Append an
English Tracked implementation receipt to the canonical item. Do not claim Global QA, release,
Figma parity, or Product adoption.
```

## Blockers

None. Stop and return to PRODUCT only if an approved background choice lacks a canonical
contrast-safe glyph pairing or the existing playground contract cannot represent the required
reference without a broader shared change.

## Tracked Implementation Receipt — 2026-08-12

### Preflight and outcome

- Reused the canonical `HitoMark` metadata owner and the existing `HitoDsPlayground`, Select and
  choice-control composition. New runtime artifacts: none.
- Replaced the superseded all-sizes/two-shapes renderer with one controlled Mark specimen; retained
  the lower 15-Mark catalogue and its Frame/Glyph/Content provenance.
- Moved the approved background choice into Mark-owned metadata. Workout Marks expose their
  canonical solid and surface pairs; Hito surface Marks expose only their existing contrast-safe
  solid pair. Foundations owns no parallel colour map.
- Applied the exact existing-token tile-radius map: `xs` 8px / `--radius-lg`, `sm` 10px /
  `--radius-xl`, `md` 12px / `--radius-2xl`, `lg` 16px / `--radius-3xl`, and `hero` 20px /
  `--radius-4xl`. Circle remains `rounded-full`.

### Source

- Changed `src/components/ui/hito-mark.tsx` for the size-owned radius map and canonical background
  pair metadata/prop resolution.
- Changed only the existing Mark reference seam in
  `src/components/hito-ds/reference-foundations-page.tsx` for the single playground and its four
  controls. No CSS, token, manifest, shared playground, Product, path/viewBox, optical-fit or
  unrelated source was changed by this slice.

### Validation inventory

| Check | Scenario / environment | Result | Evidence |
| --- | --- | --- | --- |
| Radius and shape discriminator | Tile and circle across `xs` / `sm` / `md` / `lg` / `hero` | Passed | Independent rendered review measured tile radii 8/10/12/16/20px and full circles with canonical token provenance. |
| Playground controls | All 15 Marks; Shape, Size and approved Background controls | Passed | One stage specimen updates through the real Select/radio controls; Race surface resolves to its surface/content token pair. |
| Desktop browser matrix | 1470×801, Dark and Light | Passed | Hero remained contained, all 15 gallery entries rendered, keyboard/focus passed, zero horizontal overflow and zero console warnings/errors. |
| Narrow browser matrix | Exact 375×812, Dark and Light | Passed | The 256px hero remained contained in the 327×320 stage; controls remained reachable below it; no overflow. |
| Catalogue regression | Lower gallery | Passed | All 15 entries and Frame/Glyph/Content provenance remained present. |
| Focused formatting | `npx prettier --check` on both changed source files | Passed | All matched files use Prettier code style. |
| Focused lint | `npx eslint` on both changed source files | Passed | Exit 0. |
| Diff hygiene | `git diff --check` | Passed | Exit 0. |
| Production build and managed runtime | Fresh `npm run build` through `npm run qa:server:start` | Passed | Client, SSR, Nitro and postbuild completed; canonical fixture QA server restarted healthy with a fresh receipt. |
| Existing DS validator | `npm run validate-hito-ds-components` | Known pre-existing/out-of-scope red | It still requires the deliberately removed static Mark matrix and also reports the pre-existing Foundations surface-classification drift (11 accepted / 6 distinct). The task explicitly prohibited validator edits; no compatibility marker was retained to falsify the new contract. |

### Independent review and boundaries

- Bounded read-only `ROLE: QA` review: **Passed** for the focused Implementation DoD browser slice;
  no browser coverage gaps remained after the healthy managed runtime was restored.
- Global QA Acceptance, release readiness, Figma parity, deployment and Product adoption were not
  claimed. The stale validator assertion remains visible for a separately authorised validator
  correction; it does not leave an old runtime/reference path active.

### Next owner

PRODUCT for lifecycle routing. No implementation blocker remains in the Mark playground slice.
