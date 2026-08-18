# Hito DS Factual Activity Point Sequence Contract

## Work Item ID

a6b5fb1a-296c-4aa7-87ae-a95e949b4068

## Status

completed

## Type

Tracked — Design System implementation

## Priority

high

## Owner

DESIGN SYSTEM

## Epic

runner-evidence-and-progress

## Parent

[Runner Core Roadmap](../../plans/active/2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap.md)

## Depends On

[Runner Progress Complete FIT Activity Sequence Readiness](./2026-08-17-hito-runner-progress-complete-fit-activity-sequence-readiness.md)

[Hito DS Factual Line Chart Usage Discovery](./2026-08-17-hito-ds-factual-line-chart-usage-discovery.md)

## Evidence From

[Hito Running Coach Activity-Sequence Progress Metrics Review](./2026-08-17-hito-running-coach-activity-sequence-progress-metrics-review.md)

## Scope

Implement one bounded shared Design System primitive and `/hitoDS` reference for a chronological,
factual FIT **activity point sequence**. It renders every Backend-supplied activity as an individual
real-date mark, with no connector. It is not a line chart, chart engine, Progress page composition,
metric calculator, or client period selector.

## Archive Intent

Retain through Frontend Progress adoption and independently accepted interaction evidence, then
compact to the point-sequence contract, non-line decision, and consumer boundary.

## Task

Create the smallest shared Hito capability that can render the completed Backend sequence for one
selected factual metric at a time. The primitive consumes the pre-shaped server contract and may
calculate presentation geometry only. It must never aggregate, sample, alter sequence membership,
derive periods, smooth values, infer context, calculate a whole-period pace, or make a performance
claim.

## Accepted Product Direction

- The first activity-sequence visual is **points without a connector**. Mixed recovery, interval,
  long, hill, and race runs do not form a comparable continuous trend.
- The Backend owns exact runner-local `This week`, `Last 7 days`, `Last 1 month`, `Last 6 months`,
  and custom-range dates; the primitive displays supplied facts and does not calculate range
  boundaries. `This week` future time is explicit and not missing data.
- Every eligible accepted FIT activity is a member. There is no latest-N cap or silent drop. The
  primitive shows an all-membership summary only when the Backend marks the sequence complete and
  eligible/returned counts match.
- Distance or timer duration is the initial selected metric. Pace is factual/descriptive only and
  permanently carries `Different workouts are not directly comparable.` No average pace, direction,
  trend, improvement, readiness, or fitness language is admitted.
- Existing weekly totals remain in `HitoFactualBarChart`; PB slots remain separate factual readbacks.

## Demonstrated Source Boundary

`HitoFactualBarChart` already owns Backend-shaped factual rendering, one-tab-stop active-point
interaction, Tooltip/readback, table disclosure, state surfaces, semantic tokens, controlled
`/hitoDS` fixture, Patterns navigation, Overview reference, and structural validator coverage. It
must be reused conceptually, but not extended with a mode flag: bucket bars and chronological point
sequences encode different relationships. The new Backend contract extends `progress.fitProgress`
with a complete per-activity sequence and retains the existing weekly bucket payload.

## Required Outcome

1. Add one shared DOM/CSS `HitoFactualActivityPointSequence` primitive in the existing UI ownership
   area. It accepts one selected Backend-shaped period/sequence/metric and calculates only mark,
   axis, focus, and contained-scroll presentation geometry. It never accepts raw client activity
   data or a generic chart configuration.
2. Use true historical local date/time positions rather than equal index spacing. Render every
   supplied activity member; an unavailable selected metric remains a chronological `N/A` member
   outside the numeric scale. There is no connector, curve, regression, smoothing, interpolation,
   dual axis, or value-quality colour.
3. Reuse the factual-bar interaction truth: one plot tab stop; ArrowLeft/Right and Home/End through
   all members; Enter/Space pinning; Escape dismissal; pointer/focus/tap parity; canonical focus;
   and no hover-only fact. Touch targets are at least 44 by 44 CSS pixels without preventing page
   scroll or browser zoom.
4. Persistently show supplied title, exact period dates, FIT evidence/coverage, and the pace caveat
   when pace is selected. Expose a visible native `View data` table containing every member in the
   same order and all supplied factual/availability/context/reason data.
5. Cover complete, empty, metric-unavailable member, updating without stale points, incomplete/
   unavailable, error/retry, `This week` future interval, Dark/Light, 375px, keyboard, touch,
   non-colour, browser zoom, contained horizontal density, and reduced-motion contracts.
6. Add one static Backend-shaped `/hitoDS` reference/playground, the needed navigation/reference
   registration, and minimal structural validator coverage. It must not create an invented source,
   fixture framework, product-specific CSS recipe, chart package, Canvas/SVG renderer, token, or
   generic chart framework.

## What Not To Touch

No Backend formulas/payload, Progress route or Product composition, Bar Chart primitive, PB UI,
Calendar/source-plan behavior, client state or client aggregation, Admin chart anatomy, Figma,
provider/hosted state, dependencies, Git lifecycle, or Global QA. Return to PRODUCT if a Backend
change, new token, chart dependency, line/connector, client-derived period/metric, data cap, or
another implementation owner becomes necessary.

## Validation Expectations

Perform a tracked preflight before the first write. Reuse existing semantic chart, Tooltip,
disclosure/table, workbench, state-surface, focus, surface, typography, spacing, motion, Patterns,
Overview, and validator seams before adding source. Run focused static/manifest/DS checks and a
production build. When a fresh serialized `qa_fixture` is available, prove Dark/Light desktop/mobile
interaction, exact supplied period readback, all-member table parity, state truth, containment,
console health, and reduced motion. Use the existing named QA role only for a bounded read-only
independent interaction replay. Product adoption, Global QA, hosted, release, and deployment remain
separate.

## Stage

DESIGN SYSTEM shared factual activity point-sequence primitive and reference implementation

## Tracked Execution Preflight — 2026-08-17

- **Outcome:** add one shared factual activity point-sequence that renders every supplied FIT
  activity at its historical date/time for one selected metric, with no connector, and document the
  same controlled contract in Patterns and Overview.
- **Accepted evidence:** the completed Backend receipt owns exact periods, membership, ordering,
  observations, coverage, future interval, and sequence states; the accepted Designer/Running Coach
  decisions require individual points without interpolation or performance language.
- **Existing seams to reuse:** `HitoFactualBarChart` interaction/readback patterns, canonical
  Tooltip and State Surface primitives, native disclosure/table anatomy, semantic chart/focus tokens,
  `HitoDsPlayground`, workbench controls, Patterns navigation, Overview showcase composition, and the
  existing Design System validator.
- **Smallest behavior change:** add a point-sequence owner beside (not inside) the bucket-bar owner,
  mount one controlled Backend-shaped reference in Patterns, reuse those exact static reference facts
  in one contained Overview entry, and add structural validator coverage.
- **New runtime artifacts:** exactly
  `src/components/ui/hito-factual-activity-point-sequence.tsx` and
  `src/components/hito-ds/factual-activity-point-sequence-playground.tsx`. The existing bar primitive
  cannot truthfully own real-time x-positioned activity members without a prohibited mode flag because
  bucket bars and chronological points encode different relationships. No CSS file, token, helper,
  dependency, fixture framework, client store, Backend artifact, or Product consumer is proposed.
- **Superseded responsibility:** none exists; the repository has no shared chronological factual
  activity-sequence renderer. The weekly bar chart and PB readbacks remain separate and unchanged.
- **Dirty boundary:** task-relevant reference/model/validator files already contain accepted unrelated
  work. Edits will stay narrow at imports, one navigation entry, one Patterns mount, one Overview card,
  and one validator block; all other dirty bytes remain untouched.
- **Risk-derived proof:** exact source discriminators, focused Prettier/ESLint, full DS validator,
  manifest check, diff hygiene, production build, and a fresh serialized `qa_fixture` replay in
  Dark/Light at desktop and 375 px for keyboard/pointer/tap parity, state truth, complete native-table
  membership, future interval, containment, zoom/reduced-motion, and console health. A named QA
  reviewer will independently replay only this interaction slice after primary proof.
- **Stop condition:** return to PRODUCT if implementation requires a Backend/Product change, shared
  token or CSS recipe, chart package, Canvas/SVG, generic chart configuration, client-derived period,
  aggregation/sampling/cap, connector, or a second implementation owner.

## Next Recommended Role

PRODUCT

## Tracked Implementation Receipt — 2026-08-17

### Outcome and root cause

The shared factual activity point-sequence contract is implemented and documented. The repository
had no canonical owner for rendering a complete Backend-shaped chronological FIT activity sequence;
the existing `HitoFactualBarChart` truthfully owns period buckets and was not extended with a mode
flag. The new primitive receives the Product-safe Backend model for one selected metric, calculates
presentation geometry only, and preserves every supplied member, date/time, observation, coverage,
context, evidence, and reason without a connector, aggregation, sampling, cap, smoothing, or
performance interpretation.

Exactly two runtime artifacts were added because this responsibility could not be carried by the
bucket-bar primitive without conflating two different relationships:

- `src/components/ui/hito-factual-activity-point-sequence.tsx` — the shared DOM/CSS primitive,
  roving interaction, factual readback, state handling, and native all-member table;
- `src/components/hito-ds/factual-activity-point-sequence-playground.tsx` — one controlled static
  Backend-shaped reference truth for metrics and admitted states.

No CSS file, token, helper, dependency, generic chart configuration, client store, fixture
framework, Backend artifact, Product consumer, SVG/Canvas renderer, or compatibility path was added.
Weekly totals remain on `HitoFactualBarChart`; PBs remain separate.

### Files changed

- `src/components/ui/hito-factual-activity-point-sequence.tsx`
- `src/components/hito-ds/factual-activity-point-sequence-playground.tsx`
- `src/components/hito-ds/reference-patterns-page.tsx`
- `src/components/hito-ds/reference-overview-page.tsx`
- `src/components/hito-ds/reference-model.ts`
- `scripts/validate-hito-ds-component-contracts.ts`
- this canonical item

The existing Patterns, Overview, navigation-model, and validator seams received only their bounded
registration/assertion changes. Overview imports the exact ready fixture/default metric from the
playground, so it adds one live linked showcase without a second playground or data owner. Existing
unrelated dirty hunks were preserved.

### Contract evidence

- All five admitted activities render at historical date/time positions; the two August 14 members
  retain chronological left-to-right order and an unavailable selected metric remains an `N/A`
  member.
- Each point has a 44 by 44 CSS-pixel hit target. Available, partial, and unavailable states retain
  solid, outlined, and textual `N/A` meaning rather than relying on colour.
- One plot tab stop owns ArrowLeft/Right, Home/End, Enter/Space pinning, Escape dismissal, and
  focus-visible. Pointer hover/click and keyboard expose the same fact readback.
- The native `View data` table contains every member and all five observation values, states,
  coverage, reasons, context, and evidence. Pace retains `Different workouts are not directly
comparable.`
- Empty, updating without stale points, incomplete, error/retry, and explicit future-week/not-missing
  states are represented without client fallback truth.

### Validation

| Check                       | Scenario / environment                                      | Result                  | Evidence                                                                                                                                                                                                                                                                     |
| --------------------------- | ----------------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source discriminator        | Primitive, reference fixture, Patterns, Overview, validator | Passed                  | Product-safe Backend model is consumed directly; every point is mapped; no SVG, Canvas, connector, slice/cap, aggregation, sampling, or second Overview data owner exists.                                                                                                   |
| Focused formatting and lint | Task-owned TS/TSX/Markdown seams                            | Passed                  | Targeted Prettier and ESLint completed without task-owned findings.                                                                                                                                                                                                          |
| Type contract               | Task-owned new primitive/reference files                    | Passed                  | Focused TypeScript output contained no task-owned error. Repository-wide `tsc --noEmit` remains red on unrelated pre-existing dirty-checkout errors, so no whole-repository typecheck claim is made.                                                                         |
| Manifest parity             | Existing generated Hito DS manifest check                   | Passed                  | Primitive, semantic, and text-style generated truth remained in parity; this task changed no manifest input/output.                                                                                                                                                          |
| Design System validator     | Full existing validator plus new structural assertions      | Partial — external gate | All new point-sequence assertions passed. The full validator then stopped at the unrelated existing current-product/system/state documentation requirement for the production-shipped `/hitoDS` role; this task did not weaken or repair that owner.                         |
| Diff hygiene                | `git diff --check`                                          | Passed                  | No whitespace errors in the shared dirty checkout.                                                                                                                                                                                                                           |
| Production build            | Fresh managed `qa_fixture` artifact                         | Passed                  | Production build completed and the final source was admitted as managed, compatible, healthy, loopback, build-present, `qa_fixture`, fresh `receipt_matches`.                                                                                                                |
| Primary browser proof       | Patterns and Overview; Dark/Light at 1470×801 and 375×812   | Passed                  | Five exact members, dates/times, same-day order, all states, native table parity, keyboard/pointer pinning, 44px targets, local table containment, no page overflow, zero essential motion, singleton Overview reuse/deep link, and empty warn/error console were confirmed. |
| Independent QA              | Same fresh four-cell pattern and Overview matrix            | Passed                  | QA independently confirmed interaction/fact parity, state truth, five-row/all-observation table, local scroll, no page overflow, no essential motion, deep link, and empty console with no task-owned defect.                                                                |

### Coverage gaps and boundaries

The supported local browser-control surface exposed exact viewport, pointer, keyboard, focus,
containment, and console controls, but no distinct physical touch-event or browser-zoom emulation.
Native pointer click/tap-equivalent pinning, 44px targets, 375px containment, and zero essential motion
were proven; a separate physical touch-event and zoom replay are not claimed. This is the exact
remaining focused browser coverage gap, not Product adoption or Global QA.

The next action belongs to PRODUCT: dispatch a separate FRONTEND Product adoption item that composes
this primitive in Runner Progress with the existing Backend period/metric selection and
`progress.fitActivitySequence` payload. This receipt does not claim Product adoption, hosted state,
Global QA, release, deployment, or Figma acceptance.

## Exact Handoff Prompt

```text
ROLE: DESIGN SYSTEM

Task: Hito DS Factual Activity Point Sequence Contract
Mode: Tracked Design System implementation
Canonical item:
docs/tasks/backlog/2026-08-17-hito-ds-factual-activity-point-sequence-contract.md
Stage: DESIGN SYSTEM shared factual activity point-sequence primitive and reference implementation
Epic: runner-evidence-and-progress

Read AGENTS.md, agents/design-system.agent.md, and skills/hito-frontend-design-system/SKILL.md.
Read the canonical item, completed Backend complete FIT activity-sequence receipt, completed factual
bar-chart contract, completed Designer line-chart discovery, and Running Coach review. Record the
tracked execution preflight before any task-owned write.

Implement one bounded shared DOM/CSS factual activity point-sequence primitive and its canonical
`/hitoDS` reference. The Backend now owns exact quick/custom periods, all eligible accepted FIT
activity members, chronological identity/order, per-activity factual observations, coverage/context,
and state. Consume that contract for one selected metric at a time; calculate presentation geometry
only. Render real-date points without a connector, smoothing, client aggregation, data cap, sampling,
or performance interpretation. Keep existing weekly totals on HitoFactualBarChart and PBs separate.

Reuse Hito factual-bar interaction, Tooltip/readback, native disclosure/table, focus, semantic chart
tokens, state surfaces, choice controls, Patterns, Overview, and validator seams where they already
own behavior. Do not extend HitoFactualBarChart with a mode flag. Do not add a chart package, Canvas,
SVG renderer, generic chart framework, new token, product CSS recipe, client state, Backend work, or
Progress route consumer. If the required contract needs any of those, stop and return the boundary to
PRODUCT.

Prove pointer/focus/tap parity; one plot tab stop with Arrow/Home/End, Enter/Space, Escape; every
member and its reason in the visible native table; exact dates and FIT coverage; pace caveat; empty,
unavailable, updating-without-stale, incomplete, error, and future-week states; Dark/Light,
desktop/375px, contained density/scroll, zoom, non-colour, and reduced-motion behavior. Use existing
named QA only for one bounded read-only independent interaction replay after primary proof. Update
only this canonical item with the English preflight and receipt, then return the Frontend Product
adoption handoff to PRODUCT. Do not claim Product adoption, Global QA, hosted, release, or deployment
acceptance.
```
