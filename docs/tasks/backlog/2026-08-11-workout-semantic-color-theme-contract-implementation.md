# Workout Semantic Color Theme Contract Implementation

## Work Item ID

2026-08-11-workout-semantic-color-theme-contract-implementation

## Status

completed

## Type

design-system-contract

## Priority

high

## Owner

design_system

## Mode

Tracked

## Scope

Implement the accepted shared Light/Dark workout semantic-colour contract for the ten existing
workout types. The change is limited to the canonical workout-type token family, its typed access
layer, Foundations proof, and the existing validation seam.

The contract retains `base` for solid identity fills and `foreground` for on-solid content. It adds
only `content` for hue-identifying text/icons on neutral or soft colour surfaces, then resolves
every existing state slot deliberately in both themes.

## Archive Intent

retain_in_place

## Task

Remove the proven misuse where one `base` value must serve both as a solid identity fill and as
readable content over structural or soft same-hue surfaces. Make all ten current workout types
resolve their semantic slots intentionally in Light and Dark, preserving the recognisable hue
family and accessible text, boundary, and focus contrast.

This task implements shared Design System truth only. Product consumer migration from textual/icon
`base` use to `content` is deliberately a later Frontend Product slice. Solid markers, fills,
schedule bars, and charts remain on `base`.

## User Report

Inspector batch `4437c07f-7db4-41fe-8754-89d00f297aee` captured `/hitoDS/foundations` in Light.
Recovery's pale blue state labels were nearly invisible. Ivan's accepted direction is that every
workout colour has intentional Dark and Light resolutions, remains recognisable, and never makes
text unreadable after the global theme changes.

## Evidence

The completed design decision is canonical evidence:

- [Workout Semantic Color Theme Contrast Decision](./2026-08-11-workout-semantic-color-theme-contrast-decision.md)

It records the full 10-workout × 8-current-slot audit. The Recovery Light discriminator measures
`base` as content at `1.19:1` on the actual Foundations parent, with state labels at
`1.16:1` / `1.14:1` / `1.12:1`; Long run's solid pair and Progression's inverse pair also fail.

## Observed Behavior

- `src/styles/foundations.css` currently declares all workout slots in one inherited family; fixed
  alpha state recipes composite differently on the structural parents in each theme.
- `src/lib/workout-color-tokens.ts` exposes eight shared slots: `base`, `muted`, `surface`,
  `hover`, `active`, `border`, `ring`, and `foreground`.
- `SemanticRoleCard` in
  `src/components/hito-ds/reference-foundations-page.tsx` currently uses `base` as text over
  neutral and tinted state surfaces. This proves the shared contract defect rather than a
  Foundations-only presentation issue.

## Expected Behavior

1. All ten workout types expose one canonical, typed `content` slot for hue-identifying text/icons
   on neutral and soft surfaces.
2. `base` remains a solid fill and pairs only with `foreground`; normal-text pairings meet 4.5:1.
3. `muted`, `surface`, `hover`, `active`, `border`, and `ring` resolve explicitly for Light and
   Dark, with text against their intended parent meeting 4.5:1 and required boundaries/focus rings
   meeting 3:1.
4. `/hitoDS/foundations` shows real active-theme pairings through the existing global theme control;
   it does not grow a separate Light palette or a preview-only workaround.
5. No raw primitive leaks into Product routes, and no local compatibility override is introduced.

## Demonstrated Root Cause

The existing token family overloads `base`: it is both the solid identity colour and the content
colour used over neutral/soft surfaces. That cannot satisfy the required pairings for pale hues in
Light and many state/boundary combinations in either theme. Fixed inherited alpha recipes compound
the semantic error. The missing shared invariant is a semantic `content` role, not a Foundations
card exception.

## Existing Seams

- `src/styles/foundations.css` — raw hue anchors and canonical Light/Dark workout-token resolution.
- `src/lib/workout-color-tokens.ts` — typed slot access; extend it rather than adding a parallel
  colour mapping.
- `src/lib/training.ts` — domain-to-token mapping; inspect but do not give it colour values.
- `src/components/hito-ds/reference-foundations-page.tsx` — canonical active-theme decision
  specimen; use shared helpers for all visual proof.
- `scripts/validate-hito-ds-component-contracts.ts` — existing validation seam to extend only for
  this contract.

## Reuse-First Change Budget

- Reuse the ten current raw hue anchors, existing semantic foreground primitives, typed helper,
  Foundations specimen, global theme control, and existing DS validator.
- New production artifact: **one proven semantic slot** in the existing token family (`content`),
  because no current slot can mean both on-solid inverse text and hue-readable content on soft
  surfaces.
- Do not add a palette, theme tab, colour framework, registry, compatibility alias, route override,
  new helper file, fixture, or manifest export. Do not leave the failing inherited recipe active.

## What Not To Touch

- Product routes/components, except for source inspection and the required factual later migration
  map.
- Workout section-role parity, which is a follow-up slice after all ten workout types pass.
- Raw consumer primitives, Figma, generated manifest export scope, Backend, persistence,
  migrations, providers, hosted state, dependencies, or unrelated dirty work.
- Existing hue identity and non-colour cues: Rest/slate, Recovery/ice blue, Easy/maya blue,
  Steady/azure, Long run/deep indigo, Progression/orchid, Tempo/tiger flame, Intervals/coral,
  Hills/burnt orange, and Run/walk/sunflower gold must remain recognisable.

## Definition Of Done

1. Every workout type has all nine slots (`base`, `foreground`, `content`, `muted`, `surface`,
   `hover`, `active`, `border`, `ring`) explicitly and truthfully resolved in both themes.
2. The established Recovery Light failure, Long run solid pairing, and Progression inverse pairing
   are corrected through browser-computed evidence, not unmeasured values.
3. Foundations renders canonical pairings for the active global theme and reports compact
   pass/fail contrast information without another semantic collection.
4. The typed helper returns the shared `content` slot; no product route is silently migrated or
   patched locally.
5. The owner returns the precise Frontend Product migration map for later execution.

## Validation Expectations

| Check                       | Scenario / environment                                                                  | Required evidence                                                                                                    |
| --------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Token source                | 10 types × 9 slots × Light/Dark                                                         | All values resolve through the canonical family; no undefined role, raw consumer primitive, or compatibility recipe. |
| Text and state contrast     | `background`, `surface`, `surface-elevated`, `popover`, plus muted/surface/hover/active | Normal labels >= 4.5:1 in both themes; real parent and computed values recorded.                                     |
| Solid and boundary contrast | base/foreground, border, selected outline, ring                                         | Solid normal text >= 4.5:1; required boundary/focus >= 3:1; focus remains non-colour-distinguishable.                |
| Foundations                 | System/Dark/Light, desktop and exact 375px                                              | Recovery Light is readable; values/cards do not clip; no duplicate palette; no console/page errors.                  |
| Product impact              | Existing mapped consumers                                                               | Later text/icon-to-content migration map is factual; markers/fills remain base.                                      |
| Static and build            | Task-owned source                                                                       | Existing DS validator, focused format/lint, `git diff --check`, and uncontended production build.                    |
| Independent review          | Read-only Designer and QA subagents                                                     | Contrast decision and rendered browser proof independently checked.                                                  |
| Runtime                     | Fixture QA server                                                                       | Restart it before the final receipt if task proof stops it.                                                          |

## Stage

Design System contract adopted, simplified, and validated; returned to Product for later consumer
migration and independently scoped section-role parity.

## Next Recommended Role

product

## Exact Design System Handoff

```text
ROLE: DESIGN SYSTEM

Mode: Tracked implementation — shared workout colour contract only

Execute exactly:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-workout-semantic-color-theme-contract-implementation.md`

Use the completed design decision as the canonical design source:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-workout-semantic-color-theme-contrast-decision.md`

Before the first write, read `AGENTS.md`, `agents/design-system.agent.md`,
`skills/hito-frontend-design-system/SKILL.md`, the complete decision item, current dirty-tree state,
`src/styles/foundations.css`, `src/lib/workout-color-tokens.ts`, and
`src/components/hito-ds/reference-foundations-page.tsx`. Re-establish the Recovery Light
discriminator from current browser-computed values.

Implement only the canonical shared contract and Foundations proof: preserve the ten existing raw
hue anchors; add the single semantic `content` slot for hue-identifying text/icons on neutral and
soft surfaces; retain `foreground` as the on-solid-base pair; explicitly resolve every workout type
slot in Light and Dark; and replace the demonstrated fixed inherited recipes where they fail. Tune
Long run's solid pair and Progression's inverse only from measured contrast. Update the existing
typed helper, canonical Foundations specimen, and existing validation seam. Do not create a second
palette, percentage-named tokens, local raw consumer colours, compatibility aliases, a new colour
framework, or a route-only override.

Use bounded subagents proactively as required: DESIGNER for contrast/hue review, QA for independent
browser acceptance, and FRONTEND or BACKEND only for demonstrated consumer/contract discovery. You
remain the primary owner and integrate all findings. Do not interrupt an active unrelated role.

Keep Frontend Product routes read-only. Return an exact consumer migration map to Product for a
separate FRONTEND Product slice; solid markers/fills must remain `base`, while textual/icon identity
consumers will move to `content`. Treat section-role parity as a separate independently auditable
Design System slice after the ten workout types pass.

Validate all 10 roles across background/surface/elevated/popover and muted/surface/hover/active in
both themes, plus solid base/foreground and border/ring/focus pairings. Normal text must reach 4.5:1
and required UI/focus boundaries 3:1. Use browser-computed evidence and the global theme control;
do not invent a separate Light palette tab. Preserve unrelated dirty hunks byte-for-byte. Restart
fixture QA before the final receipt if your proof stops it.

Do not stage, commit, push, deploy, access hosted state, mutate Figma, or edit the generated
manifest unless the current canonical export contract independently proves that workout roles belong
there.
```

## Blockers

None inside the completed Design System slice.

## Source Attribution And Simplification Preflight — 2026-08-11

Product identified that the shared dirty checkout already contained the large workout-theme
candidate before this queued task formally began. Repository lifecycle evidence cannot identify its
original author:

- the completed contrast-decision item explicitly records discovery only and no implementation;
- this implementation item had no earlier receipt;
- no other completed or in-progress item records the workout-specific numeric recipe;
- adjacent Foundations, generator, manifest, and validator hunks are attributable to completed
  Color Information Architecture, neutral-chrome, atmosphere-retirement, token-specimen, and
  specimen-surface items, but those receipts do not claim the workout-specific `content` contract.

The workout-specific CSS/helper/specimen/validator implementation was therefore classified as an
**unowned pre-existing working-tree candidate**. This execution reviewed and adopted the passing
candidate; it does not claim its original authorship.

The pre-existing candidate duplicated every theme-invariant `muted`, `surface`, `hover`, `active`,
`border`, and `ring` declaration in both theme blocks. A source discriminator found 60 duplicate
pairs and zero value mismatches. Before the first amendment-owned write, the expected net change
was deletion of those 60 redundant declarations, retention of explicit Light/Dark
`base`/`foreground`/`content`, and a small update to the existing validator. No new runtime
artifact, helper state, manifest output, preview machinery, compatibility path, or Product change
was proposed.

## Design System Tracked Implementation Receipt — 2026-08-11

### Outcome And Canonical Contract

- The pre-existing candidate was accepted only after source, Designer, browser, build, and
  independent QA evidence matched the canonical decision.
- All ten workout types expose nine semantic slots. `base`, `foreground`, and `content` resolve
  explicitly in default/Dark and Light. The six theme-invariant state/boundary formulas resolve
  once through the active theme values: muted 8%, surface 16%, hover 24%, active 32%, border at 78%
  of `content`, and solid `content` for ring.
- The source now has 120 declarations instead of 180: ten roles × (`3 × 2` theme-specific slots +
  `6 × 1` shared slots). This task removed 60 duplicate declarations / 260 formatted CSS lines and
  added two validator lines, for an amendment-owned net source reduction of 258 lines.
- `base` remains the solid identity fill; `foreground` remains its on-solid pair; `content` is the
  readable hue identity for neutral and soft surfaces. The ten raw hue families remain intact.
- The existing Foundations specimen is the sole active-theme proof surface. No second palette,
  theme tab, compatibility recipe, local raw colour, generated-manifest export, or Product override
  exists.
- Workout section roles remain unchanged and have zero `content` declarations; parity remains an
  independently auditable follow-up.

### Attribution And Files

- Task-owned source simplification: `src/styles/foundations.css` and
  `scripts/validate-hito-ds-component-contracts.ts`.
- Reviewed and adopted without claiming task-owned authorship:
  `src/lib/workout-color-tokens.ts` and
  `src/components/hito-ds/reference-foundations-page.tsx`.
- Inspected but not changed by this task: Product consumers, `src/lib/training.ts`,
  `scripts/generate-hito-ds-manifest.mjs`, and generated manifest files.
- Lifecycle updated: this canonical item.
- Unrelated dirty hunks were preserved; no staging, commit, push, deployment, hosted/provider,
  Figma, dependency, persistence, or data mutation occurred.

### Validation Inventory

| Check                         | Scenario / environment                                            | Result                       | Evidence                                                                                                                                                                                                                               |
| ----------------------------- | ----------------------------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source attribution            | Current dirty tree plus completed/in-progress canonical receipts  | Passed with chronology limit | Adjacent Foundations/manifest work maps to existing receipts; the retained workout candidate has no unique historical owner and is reported only as reviewed/adopted.                                                                  |
| Duplicate discriminator       | Six state/boundary slots × ten roles × two candidate theme blocks | Passed                       | 60 duplicate pairs, zero mismatched values before simplification; the redundant Light copies were removed.                                                                                                                             |
| Token contract                | Canonical CSS and typed helper                                    | Passed                       | 10 roles; 3 theme-specific slots declared twice; 6 shared slots once; 120 declarations; zero missing roles and zero section `content` leaks.                                                                                           |
| Designer review               | Read-only hue/contrast/state review                               | Passed                       | Accepted the same-hue sRGB content tuning, 8/16/24/32 state ladder, 78% border, solid ring, Rest/Long Run base tuning, and Progression foreground correction.                                                                          |
| Manifest boundary             | Existing generator and generated output                           | Passed                       | `node --import tsx scripts/generate-hito-ds-manifest.mjs --check`: 43 primitives, 41 semantic colours, 18 text styles; zero workout-type export.                                                                                       |
| Focused static                | Prettier, ESLint, source discriminator, `git diff --check`        | Passed                       | Formatting and lint exited 0; focused source proof reports 120 declarations and zero section leaks; diff hygiene passed.                                                                                                               |
| Shared DS validator           | `npm run validate-hito-ds-components`                             | External failure             | Workout assertions passed. The only reported failure is the unrelated concurrent DevTools dependency `src/components/devtools/local-ui-inspector-targets.ts -> @/generated/hito-ds-manifest`; no clean global-validator claim is made. |
| Production build/runtime      | Managed `npm run local:fixture` after final source and receipt    | Passed                       | Client, SSR, Nitro, and postbuild completed; the loopback fixture is healthy, compatible, `qa_fixture`, fresh, and `receipt_matches`.                                                                                                  |
| Explicit-theme browser matrix | `/hitoDS/foundations`, Light/Dark, 1470×801 and exact 375×812     | Passed                       | Each mode rendered 10 role cards and 40 real parent samples; zero `fail`, `measuring`, page/card overflow, console error, warning, dialog, or page error.                                                                              |
| System-theme browser proof    | Same page and both exact viewports                                | Passed                       | The local System preference resolved Dark and reproduced the passing Dark matrix at both sizes.                                                                                                                                        |
| Contrast minima               | Browser-computed active-theme values                              | Passed                       | Overall solid minimum 4.74:1; Light state minimum 4.76:1; Dark state minimum 4.95:1; Light boundary minimum 3.16:1; Dark boundary minimum 3.64:1.                                                                                      |
| Recovery Light                | Four parents and all state/boundary roles                         | Passed                       | Solid 15.45; content 5.09; muted 5.02; surface 4.95; hover 4.88; active 4.81; border 3.16; ring 5.09.                                                                                                                                  |
| Narrow solid pairs            | Rest, Long Run, Progression, both themes                          | Passed                       | 4.78, 4.78, and 4.74 respectively.                                                                                                                                                                                                     |
| Independent QA recheck        | Final simplified source and fresh four-mode runtime               | Passed                       | Confirmed 120-declaration single family, unchanged ratios, zero overflow/errors, manifest/Product boundaries, and the provenance limitation. Verdict: Passed for focused local DoD.                                                    |
| Forced-colour/high-contrast   | OS/browser emulation                                              | Not run                      | No forced-colours acceptance claim. Existing labels/glyphs preserve non-colour meaning, and the canonical ring shape plus computed contrast were verified.                                                                             |
| Product consumer rendering    | Deferred Product migration                                        | Not run by design            | Existing Product consumers remain unchanged; no Product acceptance or Global QA claim follows from this slice.                                                                                                                         |

### Later Consumer Migration Map

Product should route a separate Frontend Product slice from these current owners:

1. `src/lib/training.ts`: retain the current base identity value for solid uses and expose the
   shared `content` value separately; do not silently change the meaning of the existing field used
   by dots and markers.
2. `src/components/TodayHero.tsx` and `src/routes/workout.$date.tsx`: keep adjacent dots on `base`;
   move workout labels and neutral-surface workout icons to `content`.
3. `src/components/Calendar.tsx`, `src/components/ui/hito-calendar-day.tsx`, and
   `src/components/calendar/calendar-projection.ts`: give the calendar identity a separate content
   tone; labels/glyphs use it, while projection markers and solid identity swatches remain `base`.
4. `src/components/manual-workout/manual-workout-authoring-utils.ts` and its constructor/editor
   consumers: keep indicator background/border/ring on `base`/`border`/`ring`; move the neutral
   constructor icon tone to `content`.
5. Keep selected-plan legend swatches, schedule bars, comparison/chart fills, and other solid
   identity graphics on `base`. Workout structure timeline and generated-plan bars use the separate
   section-role family and remain unchanged in this slice.

Design System follow-ups remain separate: migrate text/icon uses in
`reference-patterns-page.tsx`, calendar/workout-library playground data to `content` without
changing their solid samples, and execute section-role `content` parity independently.

### Acceptance Boundary

Implementation DoD for the shared workout-type contract is complete. Global QA Acceptance,
release readiness, hosted behavior, Figma parity, Product migration acceptance, and section-role
parity are not claimed.
