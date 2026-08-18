# Hito DS Factual Bar Chart Contract

## Work Item ID

e7dca03f-10dc-472c-9b44-d0a9052a3e01

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

[Runner Progress FIT Results And Chart Payload Readiness](./2026-08-16-hito-runner-progress-fit-results-and-chart-payload-readiness.md)

## Evidence From

[Runner Progress Charts And Records Discovery](./2026-08-16-hito-ds-runner-progress-charts-and-records-discovery.md)

## Scope

Implement the bounded shared `HitoFactualBarChart` primitive and its `/hitoDS` reference evidence.
It renders one pre-shaped Backend factual series at a time with accessible active-point disclosure and
a data-table equivalent. It is not the Progress page composition, a chart engine, a record calculator,
or a metric selector.

## Archive Intent

Retain through later Progress Product adoption and independent chart acceptance, then compact to the
primitive contract, reference proof, and consumer boundary.

## Task

Create the smallest reusable Hito DS capability required by the accepted factual Progress design. The
component consumes the completed `progress.fitProgress` Backend-shaped period and one selected series;
it may calculate presentation geometry only. It must not aggregate values, alter buckets, choose
periods/series/PBs, derive coverage, or create a product-specific fallback.

## Confirmed Evidence

- Backend exposes one advertised exact `28_days` period, ordered clipped weekly buckets, five factual
  series, coverage/state metadata, and no stale series during updating.
- The accepted Designer direction is one selectable series at a time, zero-based bars, visible `View
data`, pointer/focus/touch parity, and no dual axes or chart package.
- Hito already owns semantic chart tokens, Tooltip chrome, radio/choice controls, disclosure/table
  patterns, focus rings, Dark/Light surfaces, and reduced-motion treatment.
- Current Admin chart styling is reference anatomy only, not a shared primitive; copying it into
  Progress is prohibited.

## Required Outcome

1. A DOM/CSS `HitoFactualBarChart` with one zero-based unit axis and supplied available-zero,
   partial, unavailable, updating, and error states.
2. Pointer hover, keyboard focus, and touch/tap expose identical series/date/value/unit/completion/
   coverage/reason content. The plot has one page tab stop, Arrow/Home/End navigation, visible focus,
   Enter/Space pinning, Escape dismissal, and no hover-only truth.
3. A visible `View data` disclosure exposes a native table with every bucket, including gap state,
   coverage, and reason. It is the keyboard/screen-reader truth surface.
4. Dark/Light, 1470px/375px, zoom/reflow, non-colour state meaning, contrast, and reduced-motion
   behavior follow the accepted design contract. Future longer series use an owned plot scroller, not
   page overflow or client bucket merging.
5. A documented `/hitoDS` reference fixture proves all interaction/state variants from static
   Backend-shaped examples. No Product Progress code changes in this task.

## What Not To Touch

No `FactualProgressPanel` composition, metric-selector policy, record/PB UI, Backend payload/formula,
Calendar/workout behavior, source-plan/container authority, chart dependency, Canvas/SVG framework,
Admin route/style ownership, fixture, provider, hosted state, Figma, Git lifecycle, or generic
dashboard/chart family.

## Validation Expectations

Inspect and reuse current Hito DS token, tooltip, disclosure, table, focus, and motion seams before
adding code. Validate source and manifest/DS-contract parity plus focused formatting/lint/diff checks.
After a fresh serialized `qa_fixture` is available, prove `/hitoDS` at desktop/mobile and Dark/Light,
with pointer/keyboard/touch-equivalent, data-table parity, state visibility, overflow, console, and
reduced-motion coverage. Use the existing named QA role for one bounded read-only interaction review.
Do not claim Product adoption, Global QA, hosted, release, or deployment readiness.

## Stage

DESIGN SYSTEM implementation complete; Product adoption pending

## Next Recommended Role

PRODUCT

## Execution Preflight — 2026-08-17

- **Mode and owner:** Tracked Design System implementation in the shared primitive, canonical
  `/hitoDS` reference, navigation model, and existing DS validator seams.
- **Accepted source truth:** the completed Backend receipt exposes one exact advertised `28_days`
  period and ordered `RunnerActivityFitChartSeries` / `RunnerActivityFitChartPoint` facts. Point
  dates, labels, completion, value/display value, coverage, reasons, state, and unit remain Backend
  fields. The primitive may calculate only zero-based presentation height, guide placement, and
  roving active-point position.
- **Existing seams reused:** `--color-chart-1`, `--color-ring`, semantic text/surface tokens,
  `Tooltip`, native button semantics, existing disclosure/table classes, `HitoButton`, the shared
  workbench choice control, `HitoDsPlayground`, and the current Patterns navigation/validator.
  Admin chart classes are domain-owned reference anatomy and are deliberately not copied.
- **New runtime artifacts:** exactly two admitted files: one
  `src/components/ui/hito-factual-bar-chart.tsx` shared primitive and one
  `src/components/hito-ds/factual-bar-chart-playground.tsx` static reference fixture. No CSS file,
  token, dependency, helper layer, generic chart engine, Canvas/SVG renderer, Product recipe,
  client store, or fixture framework is added.
- **Why existing artifacts cannot own it:** no shared component currently owns factual bucket bars,
  the one-tab-stop roving interaction, active-point readback, or table parity. `Tooltip` and table
  chrome can be composed but cannot represent the chart contract by themselves; the Admin owner is
  outside shared DS scope.
- **Superseded responsibility:** none. There is no shared chart path to remove. The reference adds
  only static Backend-shaped examples and does not replace or modify the existing Product factual
  summary.
- **Dirty boundary:** `reference-patterns-page.tsx`, `reference-model.ts`, and the DS validator
  already contain accepted unrelated Design System hunks. This slice adds only a fixture import/
  mount, one navigation entry, and tightly bounded assertions; all existing bytes remain intact.
- **Proof inventory:** source/type contract, manifest parity, full DS validator, focused Prettier/
  ESLint/diff hygiene, production build, then fresh serialized `/hitoDS` Dark/Light desktop/mobile
  pointer, keyboard, touch/pin, state, table, focus, overflow, console, and reduced-motion evidence.
  One existing named QA reviewer independently replays the interaction contract after the primary
  proof.
- **Stop condition:** return to PRODUCT if implementation requires client aggregation, bucket or
  period derivation, a chart package, Product Progress composition, Backend/formula changes, a new
  token, or another runtime owner.

## Exact Handoff Prompt

```text
ROLE: DESIGN SYSTEM

Task: Hito DS Factual Bar Chart Contract
Mode: Tracked
Canonical item: docs/tasks/backlog/2026-08-17-hito-ds-factual-bar-chart-contract.md
Stage: DESIGN SYSTEM shared factual bar-chart primitive implementation
Epic: runner-evidence-and-progress

Read AGENTS.md, agents/design-system.agent.md, and skills/hito-frontend-design-system/SKILL.md.
Read the completed FIT payload receipt and completed chart/record discovery before changing source.
The Backend supplies `progress.fitProgress`: an advertised exact 28-day period plus ordered,
pre-shaped factual series and state/coverage metadata. The standalone Calendar and FIT-only evidence
rules remain mandatory.

Implement the smallest shared DOM/CSS `HitoFactualBarChart` primitive and its `/hitoDS` reference.
It accepts one selected Backend-shaped factual series at a time and may calculate presentation geometry
only. Reuse Hito semantic chart tokens, Tooltip, radio/choice, disclosure/table, focus, surface,
typography, spacing, state, and reduced-motion contracts. Do not add a package, Canvas, generic chart
engine, Progress-only CSS recipe, or dashboard/card family.

Implement the accepted interaction/state contract: zero-based single-unit bars; available zero,
partial, unavailable, updating, and error; hover/focus/tap parity; one plot tab stop with arrow,
Home/End, Enter/Space, and Escape behavior; visible `View data` native table with all point state,
coverage, and reasons; non-colour meaning; contained responsive behavior; and no essential motion.
The primitive must not aggregate, clip, label periods/buckets, choose a metric or PB winner, derive
coverage, or expose a client fallback. Product composition, metric selector, records/PB rows, and
Backend/formula work remain out of scope.

Before writing, record existing seams, every new runtime artifact or none, and any superseded
responsibility. Add only the real shared primitive/reference/validator coverage needed by this
contract. Use existing named QA for one bounded read-only interaction review after a fresh serialized
qa_fixture is available; do not contend with another runtime writer. Run risk-derived source/DS/
manifest/static and browser checks. Update this item with an English tracked receipt and return the
later FRONTEND Product composition handoff to PRODUCT. Do not claim Global QA, hosted, release, or
deployment readiness.
```

## Tracked Implementation Receipt — 2026-08-17

### Outcome and source hierarchy

- The first missing owner was a shared factual-chart contract. Existing Admin chart classes are
  domain-owned reference anatomy and were not promoted or copied. The new `HitoFactualBarChart`
  consumes the canonical Backend `RunnerActivityFitChartPeriod`, `RunnerActivityFitChartSeries`, and
  `RunnerActivityFitChartPoint` shapes and calculates only zero-based presentation height, selected
  guide position, and roving active-point position.
- The primitive renders one supplied series with available-zero, available, partial, unavailable,
  updating, and error truth. One plot tab stop owns ArrowLeft/ArrowRight, Home/End, Enter/Space pin,
  and Escape clear. Pointer, focus, and pinned readbacks reuse the same factual point content. The
  visible native table retains every supplied point, state, coverage value, and reason.
- Partial remains non-colour-readable through the visible `Partial · striped bar` key, the point's
  accessible name, Tooltip/pinned readback, and table row. Independent QA found that a redundant
  11px `Partial` label inside alternating chart stripes could not maintain contrast across both Dark
  bands. The label was deleted instead of adding local background/effect machinery; all factual
  channels remain.
- `/hitoDS/patterns#factual-bar-chart` owns the controlled Ready/Updating/Error reference. Overview's
  existing live-building-block invariant admitted one compact showcase that imports the same static
  period/series truth and deep-links to that canonical pattern; no second playground or dataset was
  created.

### Files changed

- Added `src/components/ui/hito-factual-bar-chart.tsx` — the shared DOM/CSS primitive.
- Added `src/components/hito-ds/factual-bar-chart-playground.tsx` — the sole static Backend-shaped
  reference truth and controlled playground.
- Updated `src/components/hito-ds/reference-patterns-page.tsx` and
  `src/components/hito-ds/reference-model.ts` — canonical mount and navigation.
- Updated `src/components/hito-ds/reference-overview-page.tsx` — one contained live showcase using
  the same exported reference truth.
- Updated `scripts/validate-hito-ds-component-contracts.ts` — structural coverage for Backend-shaped
  input, interaction/state/table contract, prohibited Canvas/SVG renderers, fixture states, and
  Overview reuse/deep-link.
- Updated this canonical item. No CSS file, token, dependency, generic chart engine, Canvas/SVG,
  Product route, fixture, provider, persistence, or compatibility path was added or changed.

### Fix-forward record

1. Browser proof showed native Enter/Space was not reliably pinning the active point through the
   chosen button/tooling path. Explicit key activation was added while preserving native focus.
2. Browser proof showed a focused Tooltip could remain open when a different point was hovered.
   Hover now takes factual precedence, leaving one active Tooltip/readback.
3. Independent QA identified the in-bar partial-label contrast failure. A foreground substitution
   still failed the alternating Dark pale band, so the redundant in-bar label was removed while the
   four factual non-colour channels were preserved.

### Validation

| Check                         | Scenario / environment                                            | Result                                 | Evidence                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------- | ----------------------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source contract               | Primitive, static fixture, Patterns, Overview, validator          | Passed                                 | One Backend-shaped series; presentation geometry only; all required states/keys/table; no Canvas, SVG, aggregation, metric selection, or client fallback.                                                                                                                                                                                                                                 |
| Formatting and lint           | Focused Prettier and ESLint on every task-owned source            | Passed                                 | Final source matched Prettier and focused ESLint returned zero errors.                                                                                                                                                                                                                                                                                                                    |
| Manifest parity               | `node --import tsx scripts/generate-hito-ds-manifest.mjs --check` | Passed                                 | `primitiveColors=43`, `semanticColors=41`, `textStyles=14`; no generated output changed.                                                                                                                                                                                                                                                                                                  |
| DS validator                  | `npm run validate-hito-ds-components`                             | External failure                       | New chart assertions passed. The command remains red only on the pre-existing documentation gate: `Current product, system, and state docs must record the production-shipped /hitoDS role.` This task did not alter that owner.                                                                                                                                                          |
| Diff hygiene                  | `git diff --check`                                                | Passed                                 | No whitespace errors.                                                                                                                                                                                                                                                                                                                                                                     |
| Production build/runtime      | Final `npm run local:fixture`                                     | Passed                                 | Production build and postbuild completed; managed loopback `qa_fixture` started from the rebuilt artifact as fresh `receipt_matches`.                                                                                                                                                                                                                                                     |
| Primary browser matrix        | Patterns and Overview; Dark/Light; 1470×801 and 375×812           | Passed before the final label deletion | States, one tab stop, Arrow/Home/End, pin/Escape, pointer/focus fact parity, four-row native table, Ready/Updating/Error without stale points, local table scroll, no page overflow, no motion, deep link/singleton Overview reuse, and clean console all passed.                                                                                                                         |
| Final resolved-label artifact | Fresh rebuilt Patterns reference                                  | Passed, focused                        | The striped bar has no leaf `Partial` text; the visible state key, complete accessible point name, Tooltip/pin data source, and native-table truth remain. The final removal is an absolute descendant deletion and does not change chart geometry.                                                                                                                                       |
| Independent QA                | Full matrix, then post-fix admission retries                      | Partial independent coverage           | QA passed every assigned interaction/state/containment/Overview cell and found the single contrast defect. After fix-forward, three independent retries stopped before navigation because QA's status path reported `compatible=false`/`healthy=false` despite managed, build-present, `qa_fixture`, and fresh `receipt_matches`. No independent post-fix browser claim was manufactured. |

### Coverage consequence and boundary

- The exact Dark/Light desktop/375 independent replay was not repeated after the final absolute-label
  deletion because the QA browser admission path drifted. Primary fresh-artifact evidence proves the
  failing text node is absent and the factual channels remain, but this does not become Global QA.
- The remaining full-validator documentation failure belongs to the existing product/system/state
  documentation gate and was not repaired here.
- PRODUCT is next: retain a separate FRONTEND Product item for the Progress composition that chooses
  a Backend-supplied `progress.fitProgress` series and composes the metric selector/chart/PB rows.
  This receipt does not claim Product adoption, hosted acceptance, Global QA, release, deployment, or
  Figma parity. No task-owned implementation blocker remains.
