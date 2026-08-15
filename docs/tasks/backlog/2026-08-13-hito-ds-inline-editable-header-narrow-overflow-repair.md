# Hito DS Inline Editable Header Narrow Overflow Repair

## Work Item ID

2026-08-13-hito-ds-inline-editable-header-narrow-overflow-repair

## Status

completed

## Type

design-system shared-primitive responsive defect repair

## Priority

high

## Owner

DESIGN SYSTEM

## Mode

Tracked

## Stage

DESIGN SYSTEM shared-primitive implementation and focused managed-runtime acceptance are complete.

## Next Recommended Role

PRODUCT

## Evidence From

- [Hito DS Mobile Reference Density And Responsive Preview Controls](./2026-08-13-hito-ds-mobile-reference-density-and-preview-controls.md)
- [Hito DS Inline Editable Header Text Anchor And Out-Of-Flow Affordance](./2026-08-13-hito-ds-inline-editable-header-text-anchor-and-affordance.md)

## Scope

Repair the shared header variant of `InlineEditableText` so its edit affordance does not create page-level horizontal overflow at 375px or 320px. Preserve the completed contract: resting text is aligned, the hover/focus affordance is visually quiet until hover or keyboard focus, and edit entry/commit/cancel behavior remains unchanged. The accepted tight-space exception is a persistent inline-end lane for the affordance; it may reserve logical end width at rest but must not move the text anchor or change geometry on reveal. This is a primitive-level correction, not a `/hitoDS` padding, clipping, or route-local workaround.

## Task

The finished mobile-density acceptance found one task-external overflow on `/hitoDS/patterns`. `InlineEditableText` renders a full-width header trigger in the affected reference, while `.hito-inline-header-input-affordance` is absolutely positioned after that trigger using `inset-inline-start: calc(100% + var(--hito-inline-header-gap))`. The non-reserved out-of-flow icon therefore extends beyond a 375px page by exactly 8px (383px) and beyond a 320px page by exactly 8px (328px).

Correct the canonical primitive and its `controls-fields.css` recipe so that the affordance remains discoverable on hover and keyboard focus without affecting text alignment, intrinsic/truncated header behavior, focus visibility, or horizontal containment. The solution must work for all header sizes and existing consumers. Do not conceal the defect by clipping the reference stage, increasing page padding, removing the icon, or changing the mobile-density task-owned layout.

## User-Facing Outcome

- `/hitoDS/patterns` has no page-level horizontal overflow at 375px or 320px.
- Header text remains aligned with surrounding text at rest.
- On hover/focus, the edit affordance is visible, reachable through the existing button, and does not shift content or exceed the owning container. Its logical inline-end lane remains reserved at rest so saturated headers remain contained.

## Confirmed Source Facts

- `src/components/ui/inline-editable-text.tsx` renders the header read trigger as `.hito-inline-header-input-trigger` and the edit affordance as `.hito-inline-header-input-affordance`.
- `src/styles/controls-fields.css:240-399` owns the shared trigger/affordance geometry. The trigger permits `max-width: 100%`; the affordance is positioned beyond its inline end.
- The completed original task intentionally made hover/focus chrome and icon out of flow to prevent text reflow. That visual decision remains valid; its full-width narrow-container edge case was not covered by prior acceptance.
- The mobile-density item proves its own App Shell, Calendar, and Workout Library stages are contained. Its 8px Patterns overflow is external to that item.

## What Not To Touch

- `/hitoDS` page or stage padding, generic overflow clipping, mobile density CSS, Product route layout, tokens, typography roles, Figma, DevTools, data, providers, or persistence.
- Default/multiline inline-editing behavior, field edit geometry, header size API, or Product copy.
- Existing successful edit lifecycle: pointer/keyboard activation, Enter/blur commit, Escape cancel, validation, disabled/read-only semantics, focus restoration, truncation, and reduced-motion behavior.
- Concurrent dirty work and the already completed original task receipt.

## Execution Preflight

- Reuse `InlineEditableText` and `controls-fields.css`. New runtime artifacts: **none**.
- Before editing, map all header-variant consumers and identify why the trigger resolves full width in the Patterns reference. Check `sm`, `md`, and `lg`, hover and keyboard focus, short and long text, actual edit state, and one Product consumer.
- State the smallest shared geometry change and any superseded declaration. Do not add a second responsive recipe or a per-reference exception.

## DESIGN SYSTEM Preflight And Stop Receipt — 2026-08-13

### Source Discriminator And Consumer Census

- The first incorrect owner remains `.hito-inline-header-input-affordance` in
  `src/styles/controls-fields.css`: it is positioned from the trigger's full inline end with
  `inset-inline-start: calc(100% + var(--hito-inline-header-gap))`, not from the rendered text end.
- The current shared contract has ten header-variant JSX call sites and eighteen rendered
  instances across the Patterns reference, Components reference, deterministic Figma export board,
  and the Product Manual Workout constructor. The Product consumer uses `sm`; the references cover
  `sm`, `md`, and `lg`. No existing header consumer supplies the optional `editLabel`, but its
  public width remains content-dependent.
- In the affected Patterns Demo, the long `lg` title saturates the full available trigger width.
  The out-of-flow icon therefore starts after that full-width edge and produces the already measured
  `383px` document at 375px and `328px` document at 320px. The mobile-density stages themselves
  remain contained.

### Reuse Budget And Demonstrated Conflict

- Existing seam to reuse: `InlineEditableText` plus its canonical `controls-fields.css` trigger and
  affordance recipe. Proposed new runtime artifacts: **none**. No reference/page padding, clipping,
  mobile-density rollback, token, helper, API, or compatibility path is admitted.
- A bounded read-only DESIGNER review confirmed that the current DOM/CSS geometry cannot satisfy all
  accepted worst-case requirements simultaneously. When text fully occupies the available inline
  size, a visible affordance must reserve width, overlap or clip content, reflow on reveal, overflow,
  or require a new measurement/anchor-position collision mechanism.
- The smallest safe existing-contract repair is a persistent inline-end lane: keep zero inline-start
  padding and the current text anchor, place the affordance inside the logical end, and give the text
  matching size-aware inline-end allowance. This guarantees containment and unchanged rest/hover/
  focus geometry, but it explicitly supersedes the predecessor's **no reserved resting width**
  decision.
- Keeping zero reserved width instead requires an explicit alternative decision: permit a contained
  overlap/hidden affordance at saturated width, or admit a new collision/measurement mechanism.
  Neither choice is authorized by the current item, so no production-source write was made.

### Validation And Lifecycle Consequence

| Check                       | Scenario / environment                                        | Result              | Evidence / consequence                                                                                                                                     |
| --------------------------- | ------------------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dirty-boundary snapshot     | Shared checkout at `74607987885ca40f33658c79fba174d173d45646` | Passed              | `inline-editable-text.tsx` is clean relative to `HEAD`; `controls-fields.css` contains predecessor-owned dirty hunks and was left byte-for-byte unchanged. |
| Source discriminator        | Ten JSX sites / eighteen rendered instances                   | Passed              | Full-width trigger plus `100% + gap` absolute placement is the sole demonstrated overflow owner; Product and all three DS sizes remain in the census.      |
| Independent geometry review | Existing DESIGNER role, read-only                             | Blocked by decision | Guaranteed visibility, zero reserve, zero reflow/overlap, and saturated-width containment cannot all coexist in the admitted legacy geometry.              |
| Source/static validation    | Prettier, ESLint, DS validator, `git diff --check`            | Not run             | No runtime/source implementation exists to validate; running the suite would not resolve the missing product geometry decision.                            |
| Build/browser replay        | Managed `qa_fixture`; desktop, 375px, 320px; Light/Dark       | Not run             | A fresh artifact would reproduce unchanged source. The narrow Patterns acceptance and mobile-density closure remain unavailable.                           |

## Product Decision — 2026-08-14

Ivan selected the persistent inline-end lane. This supersedes only the predecessor's no-reserved-resting-width clause. The lane must remain visually quiet until hover or keyboard focus; it must preserve the existing text start anchor, avoid reveal-time reflow and overlap, and use the existing shared primitive/CSS owner. No anchor-position fallback, new API, new token, helper, clipping, or route-local responsive exception is authorized.

## Lifecycle Consequence

DESIGN SYSTEM is now authorized to implement the bounded shared-primitive repair and perform the specified focused proof. The blocked mobile-density item's final Patterns overflow cell must be replayed after this repair, but its lifecycle remains separately owned. This item does not yet claim Implementation DoD, Global QA, release readiness, hosted acceptance, Figma acceptance, or deployment.

## Implementation Continuation Preflight — 2026-08-14

- **Accepted decision:** Product selected the persistent logical inline-end lane. Only the
  predecessor's no-reserved-resting-width clause is superseded; the text start anchor, reveal-time
  geometry, edit lifecycle, accessibility, truncation, and reduced-motion contracts remain.
- **Canonical seam and smallest change:** reuse the existing flex child already rendered as
  `.hito-inline-header-input-affordance`. Restore the trigger's existing size-aware gap and remove
  only the affordance's absolute beyond-inline-end positioning, inset, and transform. Its existing
  hidden `visibility`/`opacity` state then reserves the exact intrinsic lane for both the icon and
  optional `editLabel`, while reveal changes no layout geometry.
- **Consumer census:** ten header JSX call sites / eighteen rendered instances remain across the
  Patterns and Components references, deterministic export board, and Product Manual Workout
  constructor. The references cover `sm`, `md`, and `lg`; the Product consumer uses `sm`.
- **New runtime artifacts:** none. No file, token, helper, API, breakpoint, measurement, anchor
  positioning, compatibility path, route-local exception, clipping, or page/mobile-density change
  is required.
- **Dirty/release boundary:** `controls-fields.css` contains the completed predecessor's uncommitted
  contract and is the only production source to change. `inline-editable-text.tsx` is clean and
  remains byte-stable. The 2026-08-14 release candidate is terminally blocked with an empty index;
  neither its receipt nor Git lifecycle is touched.

### Browser Path Preflight

- This replay proves focused **Implementation DoD**, not Global QA or release acceptance.
- The currently running managed loopback process is healthy and compatible but its artifact is
  `stale / artifact_missing`; it is not admissible for this source change.
- No other repository/runtime writer is active and the blocked release freeze is terminal. Use the
  existing managed lifecycle once: `npm run qa:server:restart -- --provider-mode qa_fixture`, then
  require managed, healthy, compatible, loopback, fresh `qa_fixture`, `receipt_matches` admission
  before navigation.
- Replay `/hitoDS/patterns` at 1470×801, 375×812, and 320px in Light/Dark, covering page width,
  short/saturated labels, hover/focus reveal geometry, edit/Enter/blur/Escape, validation,
  disabled/read-only, truncation, and console health. Source-map the real Product Manual Workout
  consumer and render it only if the admitted fixture exposes that state without data mutation.
- Use a supported non-prompting local browser path. Abandon any permission-triggering path rather
  than surfacing an approval request or replacing the managed fixture with an ad hoc server.

## Validation Expectations

- Focused source assertions plus Prettier, ESLint, the full DS validator, and `git diff --check`.
- Fresh managed loopback `qa_fixture` build and browser proof after the current checkout is stable.
- `/hitoDS/patterns` at 1470×801, 375×812, and 320px in Light/Dark: no page-level overflow; pointer hover, Tab/focus-visible, edit, Enter, blur, Escape, validation, disabled/read-only, and truncation all remain correct.
- Re-run the blocked narrow Patterns overflow cell from the mobile-density item and record whether it can now close separately. Do not claim Global QA, release, hosted, or Figma acceptance.

## Handoff Prompt

```text
ROLE: DESIGN SYSTEM

Task: Repair the shared InlineEditableText header-affordance narrow-overflow defect documented in docs/tasks/backlog/2026-08-13-hito-ds-inline-editable-header-narrow-overflow-repair.md.

Read AGENTS.md, agents/design-system.agent.md, and skills/hito-frontend-design-system/SKILL.md. This is a tracked shared-primitive correction. First reproduce and map the exact full-width trigger case in /hitoDS/patterns; then repair the first incorrect canonical owner in InlineEditableText and/or controls-fields.css. Preserve the already accepted out-of-flow, no-reflow text contract without adding a /hitoDS clipping/padding workaround, tokens, helpers, new APIs, or compatibility paths.

Cover all header sizes and real consumers. Run proportionate static validation, then fresh managed build/browser proof at desktop, 375px, and 320px in Light/Dark once the checkout is stable. You may use named Hito QA or DESIGNER only for bounded read-only evidence; remain the sole implementation writer. Preserve unrelated dirty work and do not stage, commit, push, deploy, mutate Figma, fixtures, data, providers, or hosted state.
```

## Blockers

None for this implementation slice. Global QA, release, hosted, and Product adoption acceptance
remain separate.

## Tracked Implementation Receipt — 2026-08-14

### Task, Stage, And Root Cause

**Task:** Hito DS Inline Editable Header Narrow Overflow Repair. **Mode:** Tracked. **Stage:**
shared-primitive correction plus focused managed-runtime acceptance.

The demonstrated cause was the canonical header affordance recipe in
`src/styles/controls-fields.css`: the trigger could consume the full available inline size while the
affordance was absolutely positioned at `100% + gap`. That non-reserved placement extended the
Patterns document by exactly 8px at both narrow widths. Product accepted a persistent logical
inline-end lane, superseding only the predecessor's no-reserved-resting-width clause.

### Source Outcome And Consumer Census

- Reused the existing `InlineEditableText` flex anatomy. The trigger now keeps its existing
  size-aware gap and the affordance participates as its existing final flex child.
- Removed only the affordance's superseded absolute positioning, block inset, beyond-inline-end
  inset, and translate. Existing hidden `opacity`/`visibility` reserves the intrinsic 24px icon
  lane at rest; pointer hover and keyboard focus reveal it without changing geometry.
- `src/components/ui/inline-editable-text.tsx` remained byte-stable. Its public API, optional label
  width, editing lifecycle, validation, disabled/read-only behavior, truncation, focus restoration,
  and reduced-motion ownership are unchanged.
- The refreshed census remains ten header call sites / eighteen rendered instances across Patterns,
  Components, the deterministic export board, and Product Manual Workout. References cover
  `sm`/`md`/`lg`; `ManualWorkoutConstructorEditor` remains the real `sm` Product consumer.
- New runtime artifacts, tokens, helpers, APIs, breakpoints, compatibility paths, page/stage
  clipping, route-local CSS, fixture data, and Product edits: **none**.

### Files Changed

- `src/styles/controls-fields.css` — reserved the existing intrinsic inline-end affordance lane and
  deleted only the beyond-inline-end positioning responsibility.
- This canonical item — recorded the accepted decision, implementation, validation, and lifecycle.
- `docs/tasks/backlog/2026-08-13-hito-ds-mobile-reference-density-and-preview-controls.md` — closed
  only its previously blocked Patterns overflow replay after this shared repair passed.

### Validation Inventory

| Check                                  | Scenario / environment                                                              | Result                                 | Evidence / consequence                                                                                                                                                                                                                                                                     |
| -------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Source discriminator                   | Shared trigger/affordance CSS                                                       | Passed                                 | The `100% + gap` placement and absolute affordance geometry are absent; the existing size-aware gap and hidden/reveal states remain.                                                                                                                                                       |
| Consumer and size census               | Repository-wide header variant reachability                                         | Passed                                 | Ten call sites / eighteen instances; DS renders `sm`, `md`, and `lg`; Product Manual Workout retains `size="sm"`.                                                                                                                                                                          |
| Focused formatting and lint            | Prettier plus `inline-editable-text.tsx` ESLint                                     | Passed                                 | No formatting or lint finding.                                                                                                                                                                                                                                                             |
| Full DS validator                      | `npm run validate-hito-ds-components`                                               | Passed                                 | 327 files scanned; component/reference contracts accepted.                                                                                                                                                                                                                                 |
| Diff hygiene                           | `git diff --check`                                                                  | Passed before the final receipt        | No whitespace error.                                                                                                                                                                                                                                                                       |
| Production build and runtime admission | One managed `qa_fixture` restart after the last source write                        | Passed                                 | Client, SSR, Nitro, and postbuild completed; the loopback runtime was managed, compatible, healthy, build-present, fresh, and `receipt_matches` before navigation.                                                                                                                         |
| Primary DS browser matrix              | `/hitoDS/patterns#inline-editable-text`; 1470×801, 375×812, and 320×812; Light/Dark | Passed                                 | Document widths were exactly 1470/375/320. The saturated `lg` text truncated at 375 and 320; text start stayed aligned; the 24px lane remained contained; rest/hover/focus trigger and text geometry were identical.                                                                       |
| Editing and state behavior             | Demo and Variants                                                                   | Passed                                 | Enter and blur committed, Escape cancelled and restored focus, invalid input retained `aria-invalid` and error copy, disabled/read-only evidence remained correct, and console warn/error output was empty.                                                                                |
| Size ladder                            | Inputs Variants                                                                     | Passed                                 | One live rendered header specimen for each `sm`, `md`, and `lg`; independent QA confirmed containment at 320px.                                                                                                                                                                            |
| Real Product consumer                  | Calendar → Add workout → Start from scratch                                         | Passed in the primary admitted session | The real `Manual workout` dialog mounted the unchanged shared `sm` consumer; a saturated draft was cancelled and no Product data was saved. Independent QA's isolated browser received the onboarding gate, so its Product replay remained source-only rather than mutating fixture state. |
| Independent review                     | Existing ROLE: QA, read-only                                                        | Passed for focused Implementation DoD  | All six DS cells, physical hover/focus, lifecycle, variants, sizes, containment, and console health passed. No task-owned defect was found.                                                                                                                                                |

### Preserved Boundaries, Gaps, And Next Owner

No `/hitoDS` padding, stage geometry, generic clipping, mobile-density CSS, Product route, public API,
token, typography, Figma, DevTools, fixture, provider, persistence, hosted state, or Git lifecycle was
changed. Independent QA could not repeat the Product dialog in its isolated onboarding state without
forbidden fixture mutation; the primary admitted browser proof and unchanged source wiring cover
that consumer, while independent Product replay remains a stated evidence gap.

**Next owner:** PRODUCT for any subsequent acceptance or adoption routing. This receipt proves the
focused shared implementation and its local managed-runtime evidence only; it does not claim Global
QA, release readiness, hosted acceptance, Figma parity, deployment, or broader Product acceptance.
