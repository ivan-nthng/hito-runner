# Foundations Reference Specimen Surface Unification

## Work Item ID

2026-08-11-hito-ds-foundations-reference-specimen-surface-unification

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

Unify the outer chrome of all **neutral Foundations reference specimen cards** under the one
existing borderless, 16px `hito-ds-token-specimen-surface` contract. This includes the named Brand,
Work type, semantic-role, repeat-structure, and semantic/primitive colour specimen families after
source classification proves they are outer reference surfaces.

Keep any background that is itself the subject of a Foundation demonstration: real light/dark/
favicon brand backgrounds, swatches, alpha overlays, Context layers, state/atmosphere examples,
and inner role/state chips. Those are visual evidence, not generic card chrome.

## Archive Intent

retain_in_place

## Task

Replace the remaining accidental use of the overloaded Product/Auth/Admin `hito-surface-flat`
container class in matching neutral Foundations specimen cards with the already accepted scoped
reference surface. Make the outer collection consistently borderless with 16px corners and
theme-appropriate existing semantic background.

At the same time, make intentionally light and dark Brand samples use truthful on-light/on-dark
typography for every visible label and logo, independently of the global System/Dark/Light theme.

## User Report

Ivan should not have to nominate each Foundation card family individually. The Brand cards, Work
type cards, semantic-role cards, and colour cards must read as one Foundations reference family:
same outer radius, no accidental perimeter border, and the same neutral surface treatment wherever
the background is not part of the design proof.

Inspector batch `42c0e651-3d52-498a-b411-8e2481e69f6c` captured the first Work/role card:

- route: `/hitoDS/foundations`, Dark, `1470×801`;
- target: `article.hito-surface-flat`, `349.33×284.3px`, padding/gap `16px`, radius `10px`, and
  `1px solid oklch(1 0 0 / 0.06)` perimeter border;
- request: match the already corrected colour and Brand card family; readable inverse typography
  must remain on deliberate light/dark samples.

The earlier Brand batch `0bcb7480-92aa-4e50-b8ee-125b9e8e45cb` is included here rather than as a
second implementation: it identified the same root cause at the Brand collection.

## Demonstrated Root Cause

`hito-surface-flat` is a generic global quiet-container owner in
`src/styles/reference-workbench.css:36-40`. It provides the observed hairline, `--radius-xl`, and
translucent background across Product, Auth, Admin, and unrelated DS examples. The completed colour
specimen task created a correct Foundations-only `hito-ds-token-specimen-surface`, but the other
neutral Foundations specimen families never adopted it. Applying ad-hoc fixes to each report would
repeat the same mistake; editing `hito-surface-flat` globally would leak a reference-only decision
into Product/Auth/Admin.

The Brand `Light background` label has an independent verified contrast defect:
`LogoSpecimen` uses `hito-label`, which owns a theme foreground and therefore overrides the dark
parent text colour needed over the intentionally light sample.

## Existing Source Classification

### Execution Preflight And Source Classification — 2026-08-11

- Existing seam: reuse the already accepted `.hito-ds-token-specimen-surface` declaration in
  `src/styles/reference-workbench.css`; the smallest behavior change is replacing only the outer
  `hito-surface-flat` responsibility in `LogoSpecimen`, `SemanticRoleCard`, and
  `RepeatSetStructureCard`.
- Red discriminator: the Foundations page currently contains two accepted token-surface consumers
  and nine `hito-surface-flat` consumers. Source inspection classifies exactly three of those nine
  as the same neutral outer specimen responsibility: Brand, the shared Work type / section-role
  card, and repeat structure. Semantic and primitive color cards are the accepted baseline.
- Preserved demonstrations: the alpha/atmosphere specimen; all three Context modules; both Icons
  examples; literal Brand sample fills; semantic/primitive swatches; role/state cells; repeat
  children; and every Product/Auth/Admin consumer retain their existing owners and presentation.
- Brand contrast: `Light background` explicitly uses the existing dark Stone foreground, while
  `Dark background` and `Favicon surface` explicitly use the existing light Sand foreground for
  both the currentColor mark and their visible labels, independent of the global theme.
- New runtime artifacts: none. No selector, component, token, wrapper, literal radius, or color is
  added. The obsolete responsibility removed is the three classified outer cards' dependence on
  the overloaded global `hito-surface-flat` chrome.
- Focused proof: source consumer map; shared DS validator; focused format/lint and diff hygiene; an
  uncontended production build; then `/hitoDS/foundations` at desktop and exact `375x812` in Dark
  and Light, followed by a bounded independent read-only QA review.
- Promotion/stop boundary: no promotion is required. A need to alter global `hito-surface-flat`, a
  Product/Auth/Admin consumer, a real visual sample, or a new token/component would stop at Product.

### Must adopt the existing reference surface at the outer card only

- `LogoSpecimen` — `src/components/hito-ds/reference-foundations-page.tsx:867-888` (all Brand
  specimens; explicit sample fills remain).
- `WorkoutTypeCard` — the Work type reference-card outer owner around lines `967-1034`.
- `SemanticRoleCard` and `RepeatSetStructureCard` — semantic-role outer owners around
  lines `1036-1115`.
- `SemanticColorCard` and `PrimitiveColorCard` — already use the correct contract; retain them as
  the proven baseline, do not create a second selector.
- Any additional outer Foundation card discovered by a zero-guess source audit only when its
  background is neutral chrome and it has the same static specimen responsibility.

### Must remain visually distinct

- `Light background`, `Dark background`, and `Favicon surface`: their fills are the literal Brand
  environment being demonstrated.
- Semantic and primitive swatches; Work type / role state cells; repeat children: colour/background
  is their evidence.
- Context layer modules (`data-hito-ds-foundations-context-module`): their nested backgrounds show
  real layer relationships.
- `hito-auth-alpha-surface`, `hito-launch-surface`, `hito-surface-wash`,
  `hito-editorial-signal-wash`, and `hito-surface-quiet`: each demonstrates a different
  atmosphere/state/chrome contract.
- Product/Auth/Admin consumers of `hito-surface-flat`, plus Icons/other DS examples until the
  source audit positively proves the same reference-card responsibility.

## Accepted Product Direction

1. A neutral Foundation specimen card is not a Product card. Its outer chrome uses the existing
   `hito-ds-token-specimen-surface`: no rest border, `--radius-3xl` = 16px, and existing
   Dark/Light semantic background behavior.
2. Every intentional background sample retains its fill. Its visible typography/mark uses an
   explicit on-light/on-dark semantic or existing primitive that matches that demonstrated sample,
   not incidental global theme foreground.
3. Inner state swatches, role cells, and layer samples retain their own real colour/border rules;
   only the outer neutral specimen card becomes uniform.
4. Do not create `brand-card`, `workout-role-card`, or another reference-surface family. Reuse the
   existing accepted selector across the classified outer cards.

## Reuse-First Change Budget

- Reuse `hito-ds-token-specimen-surface`, `LogoSpecimen`, the existing Work/role card components,
  semantic/primitive card baseline, Hito typography, and foundation semantic/primitive values.
- New production artifacts: **none**. No class, component, token, style family, literal radius, or
  colour is authorized.
- Remove the classified outer card dependence on `hito-surface-flat`; preserve it only where the
  source audit proves a different semantic responsibility.

## What Not To Touch

- Do not modify `hito-surface-flat`, Product/Auth/Admin consumers, global colour values/mappings,
  typography role definitions, logo SVG internals, manifest generation, Figma, Backend,
  persistence, or unrelated dirty work.
- Do not flatten a real colour/layer/atmosphere sample into neutral chrome.
- Do not reopen completed token-specimen work except to reuse its existing selector.
- Do not change padding, gaps, card content, state data, sample order, copy, DOM order, or grid
  behavior unless source proof shows it is required for legibility at the accepted outer contract.

## Definition Of Done

1. All classified neutral Foundations outer specimen cards use the same existing borderless 16px
   reference-surface source.
2. Brand, Work type, semantic-role, repeat-structure, semantic and primitive colour specimens read
   as one outer card family while their inner visual evidence remains accurate.
3. Deliberate light/dark Brand samples are readable in global Dark and Light.
4. Global `hito-surface-flat` and its Product/Auth/Admin consumers are byte-identical.
5. No new style/primitive/component/token responsibility is added.

## Validation Expectations

| Check                 | Scenario / environment                                            | Required evidence                                                                                            |
| --------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Source classification | Reference page and CSS consumer map                               | Every adoption is an outer neutral reference surface; every excluded demonstration retains its reason.       |
| Geometry/chrome       | `/hitoDS/foundations`                                             | Classified cards: no rest perimeter border, all four corners 16px, and existing semantic Dark/Light surface. |
| Brand contrast        | Deliberate Light/Dark/Favicon samples                             | Every label and mark stays readable in global Dark and Light.                                                |
| Visual truth          | Work type, semantic roles, colours, Context/atmosphere exclusions | Inner swatches/layers/states remain visibly distinct and unmodified.                                         |
| Browser               | Desktop and exact `375×812`, Dark and Light                       | Containment, copy/focus where applicable, no console/page errors.                                            |
| Static                | Task-owned source                                                 | DS validator, focused format/lint, `git diff --check`; production build if uncontended.                      |
| Runtime               | Fixture QA server                                                 | Restart it before final receipt if task proof stops it.                                                      |

## Stage

Completed — focused Design System Implementation DoD.

## Next Recommended Role

product

## Exact Design System Handoff

```text
ROLE: DESIGN SYSTEM

Mode: Tracked
Task: Unify all neutral Foundations outer specimen cards on the existing borderless 16px
`hito-ds-token-specimen-surface` contract. Preserve every intentional visual sample and repair
explicit on-light/on-dark Brand contrast.

Execute exactly:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-hito-ds-foundations-reference-specimen-surface-unification.md`

Read before the first write:
- `AGENTS.md`
- `agents/design-system.agent.md`
- `skills/hito-frontend-design-system/SKILL.md`
- `skills/hito-qa-browser-regression/SKILL.md`
- the complete canonical item
- `src/components/hito-ds/reference-foundations-page.tsx`
- `src/styles/reference-workbench.css`
- `src/styles/foundations.css`
- `scripts/validate-hito-ds-component-contracts.ts`

First produce the source classification in the item: adopt only neutral outer reference cards;
preserve actual colour/layer/atmosphere samples and every Product/Auth/Admin consumer. The
demonstrated root cause is that these cards still inherit global `hito-surface-flat` while the
correct scoped reference surface already exists. Reuse that selector; do not add a new class,
component, token, literal, or global surface change.

Use one bounded read-only QA/browser reviewer after your own source and visual proof. Do not
delegate implementation. Verify Dark/Light desktop and exact 375px, all named card families,
Brand contrast, exclusions, focus/copy where applicable, overflow, console health, DS validator,
focused hygiene, and an uncontended build. Restart fixture QA before the final English receipt if
your proof stops it.

Do not stage, commit, push, deploy, access hosted state, alter Figma, call providers, delete data,
or modify Product/Auth/Admin. Record the final formal receipt in English in this canonical item.
```

## Blockers

None.

## Design System Implementation Receipt — 2026-08-11

### Source Hierarchy And Outcome

- Canonical shared owner: the existing `.hito-ds-token-specimen-surface` declaration in
  `src/styles/reference-workbench.css` remains the single borderless 16px semantic reference
  surface. This task reused it without changing the selector or adding another surface family.
- Adopted outer owners: `LogoSpecimen`, `SemanticRoleCard`, and `RepeatSetStructureCard` now use the
  accepted surface. The current `SemanticRoleCard` owns both the 10 workout-type and 7
  section-role specimens; the task's earlier `WorkoutTypeCard` name was stale source terminology,
  not a second component.
- Retained baseline: `SemanticColorCard` and `PrimitiveColorSwatchButton` continue to use the same
  surface. The source discriminator moved from 2 accepted / 9 overloaded flat-surface references
  to 5 accepted / 6 deliberately preserved flat-surface references.
- Preserved visual truth: Brand sample fills and Favicon gradient, 43 primitive swatches, semantic
  previews, role/state cells, repeat children, three Context modules, atmosphere/state examples,
  and Icons examples retained their existing responsibilities.
- Brand contrast: `LogoSpecimen` now expresses `on-light` and `on-dark` at its existing local tone
  seam. Both the visible label and the currentColor logo/mark resolve to Stone 950 on the literal
  light sample and Sand 100 on the dark/Favicon samples, independent of the global theme.
- Global boundary: `.hito-surface-flat`, its declaration, and every Product/Auth/Admin consumer
  were not edited. No new runtime artifact, token, selector, component, wrapper, dependency, or
  compatibility path was added; no source was deleted.

### Files

- Changed: `src/components/hito-ds/reference-foundations-page.tsx`.
- Changed: `scripts/validate-hito-ds-component-contracts.ts` with the focused 5-adopted / 6-kept
  classification and Brand-tone drift guard.
- Updated: this canonical work item.
- Inspected and reused without a task-owned edit: `src/styles/reference-workbench.css` and
  `src/styles/foundations.css`.

### Validation

| Check                        | Scenario / environment                                                | Result                                     | Evidence                                                                                                                                                                                                                                                                               |
| ---------------------------- | --------------------------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source classification        | Current Foundations TSX and shared CSS                                | Passed                                     | Exactly 5 source owners use the accepted selector and 6 excluded `hito-surface-flat` examples remain; the global flat selector still owns its 1px hairline, `--radius-xl`, and translucent background.                                                                                 |
| Focused contract proof       | Node source discriminator                                             | Passed                                     | Accepted `5`, preserved `6`, scoped surface `border: 0`, `--radius-3xl`, semantic background, one on-light and two on-dark Brand assignments.                                                                                                                                          |
| Formatting                   | Prettier, three task-owned files                                      | Passed                                     | All matched files use Prettier style.                                                                                                                                                                                                                                                  |
| Focused lint                 | ESLint, changed TSX and validator                                     | Passed                                     | Exit 0.                                                                                                                                                                                                                                                                                |
| Diff hygiene                 | `git diff --check`                                                    | Passed                                     | No whitespace errors.                                                                                                                                                                                                                                                                  |
| Shared DS validator          | Current shared dirty integration                                      | External failure                           | Task-owned surface/tone assertions passed; the only reported error is the concurrent DevTools dependency `src/components/devtools/local-ui-inspector-targets.ts -> @/generated/hito-ds-manifest`. No clean global validator acceptance is claimed for that unrelated integration hunk. |
| Production build and runtime | Uncontended managed `qa:server:restart`                               | Passed                                     | Client, SSR, Nitro, and postbuild completed; managed loopback runtime returned healthy, compatible, build present, and fresh before the final receipt.                                                                                                                                 |
| Primary browser matrix       | `/hitoDS/foundations`, `1470x801` and exact `375x812`, Dark and Light | Passed                                     | 8 Brand, 18 role/repeat, 41 semantic, and 43 primitive specimens retained zero perimeter border and 16px corners; no horizontal overflow or console errors.                                                                                                                            |
| Brand contrast               | Literal Light, Dark, and Favicon samples in all four modes            | Passed                                     | Label and logo/mark computed tones stayed Stone 950 or Sand 100 as assigned; independent QA measured 17.63:1 and retained the Favicon gradient.                                                                                                                                        |
| Visual exclusions            | Primitives, Context, atmosphere, role/repeat evidence                 | Passed                                     | 43 primitive composites remained; all 3 Context modules remained outside the neutral selector; alpha/atmosphere and inner role/repeat evidence remained distinct.                                                                                                                      |
| Interaction/accessibility    | Semantic background token                                             | Passed                                     | Pointer activation produced copied-token feedback; keyboard activation retained `:focus-visible` with the existing signal/offset ring.                                                                                                                                                 |
| DESIGNER review              | Bounded read-only source/visual review                                | Passed                                     | Confirmed exact adopters/exclusions, local on-light/on-dark ownership, and responsive hierarchy; no additional implementation was requested.                                                                                                                                           |
| Independent QA review        | Same focused four-mode inventory                                      | Passed after completing the bounded replay | No task-owned defect or coverage gap remained; no source or lifecycle changes were made by QA.                                                                                                                                                                                         |

### Boundaries And Acceptance

- Implementation DoD for this Design System slice is complete.
- Global QA Acceptance, release readiness, hosted/provider behavior, Product routes, Figma, and
  Product/Auth/Admin visual acceptance were not claimed or exercised.
- Next owner: Product for normal backlog sequencing. No blocker remains inside this item.
