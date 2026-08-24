# Hito Local Inspector Side-Specific Border Intent Controls

## Work Item ID

cdc9114d-d4de-4dad-a6f2-9dbc3bc015eb

## Status

completed

## Type

Tracked — local Inspector side-specific Chrome intent contract

## Priority

medium

## Owner

FRONTEND

## Epic

platform-and-operations

## Frontend Lane

DevTools

## Depends On

## Scope

Let the loopback-only Local Inspector record one semantic border intent for an eligible card, on all
or selected sides. It must show computed zero-border truth without pretending that a zero border is
an observed perimeter. The Inspector records design intent; it never alters inspected DOM,
component CSS, shared Design System code, or production data.

## Archive Intent

Retain through the focused DevTools implementation and browser proof. Compact to the existing
Chrome-control seam, the side-selection model, preserved removal behavior, and validation evidence.

## Task

After DESIGN SYSTEM confirms the canonical borderless card policy and standard border role, replace
the narrow border-removal affordance with one disclosure control named **Border**, using the same
compact expanded anatomy already used for grouped Radius controls.

The collapsed control shows computed truth: `0` if all perimeter sides are absent, the shared value
when every observed side matches, or `Mixed` when they differ. Its disclosure provides:

- **All sides** as a shortcut which selects or clears Top, Right, Bottom, and Left together;
- independent **Top**, **Right**, **Bottom**, and **Left** side choices, so a divider or partial
  perimeter can be requested precisely; and
- one treatment choice: **None** or the DS-approved **Hairline**. Initially no arbitrary value,
  colour, width, style, or second border variant is admitted.

The result is one draft intent — for example `Top + Bottom → Hairline` or `All → None` — which
generates factual batch-prompt text and can be cleared or reselected. It must not be a live style
editor, a free-form CSS field, an arbitrary colour picker, a component registry change, or a
runtime mutation.

## User Report

Ivan wants to first see cards without borders. If a specific card later needs one, he wants to
select it in the Inspector and explicitly request the standard border around the entire card or on
Top, Right, Bottom, and Left independently. The same control must remove all or only selected
existing sides, so unneeded dividers can be removed without removing unrelated edges.

## Source Investigation

- `ChromeControlRows` in `src/components/devtools/LocalUiChromeControls.tsx` has only
  **Remove Border** and a **Card chrome** removal switch.
- `INLINE_CHANGE_ACTIONS` in
  `src/components/devtools/local-inline-change-target-utils.ts` contains `remove_border` and
  `remove_card_chrome`, but no add-border intent.
- `InlineChangeBorderEvidence` already carries side identity, but
  `normalizeBorderEvidence()` drops every zero-width side. A borderless card can be recognised
  through `cardChrome.isDetected`, but current UI has no truthful `0` readback or side-selection
  state for it.
- `TokenControlRows` already provides the required compact disclosure and grouped/individual-side
  pattern for Radius; reuse that interaction anatomy rather than create another expanded-control
  system.
- Existing draft state, inferred action selection, and generated prompt output already pass Chrome
  removal through `LocalUiTaskDraftPanel`, `local-ui-task-draft-view-model.ts`, and
  `local-ui-inspector-batch-prompt.ts`. The new semantic intent must reuse this narrow flow.

## Expected Behavior

- For every eligible card target, Inspector shows a Border row even when the computed border is
  fully absent; that zero state remains visibly factual.
- `All sides` and the four independent sides are keyboard-operable, have a clear selected state,
  and generate one side-specific intent with `None` or `Hairline`.
- The generated batch payload says which sides are requested and whether the semantic border is
  added or removed; it preserves scope, target evidence, and the selected role.
- Existing **Card chrome** removal remains a separate broad request. Existing border-removal drafts
  are normalised once to the new `All sides → None` intent rather than leaving two border sources
  active. All other Inspector drafts, persistence, screenshots, hit-layer selection, keyboard
  navigation, Escape focus return, and loopback-only boundaries remain unchanged.
- The Inspector never guesses a different border, exposes a custom value, or applies a visual
  change itself.

## Required Discriminator

The canonical Design System border role and eligible-card criteria must be accepted first. If the
DS stage retains multiple non-equivalent border variants or cannot identify the semantic standard,
return to PRODUCT rather than inventing an Inspector option. The expected initial standard is the
existing 1px semantic Hairline role, subject to that source-backed DS confirmation.

## What Not To Touch

Do not edit Design System recipes or tokens, Product/Card CSS, Backend, fixtures, Figma, hosted
state, dependencies, staging, commit, push, or deployment. Do not add a live CSS editor, generic
form layer, generic style-mutation API, arbitrary input, a second draft store, or a parallel
compatibility output. Preserve the existing local draft/session storage by one normalisation path
for historic generic border-removal drafts.

## Validation Expectations

Prove computed `0`, uniform, and mixed current-border readbacks; All-side and independent-side
selection; `None` and `Hairline` intent generation; clearing/reselection; conversion of an existing
generic border-removal draft; generated batch text; Card-chrome and other Inspector-draft
regression; draft persistence; target selection/pass-through; keyboard/Escape focus return;
desktop/mobile containment; and console health on a fresh loopback `qa_fixture`. Run focused
Inspector checks, Prettier, ESLint, build if required by the existing procedure, and diff hygiene.
Promote no new DS variant through this task. Independent QA is a separate decision after Frontend
Implementation DoD.

## Stage

FRONTEND DevTools Implementation DoD completed — independent QA not claimed

## Activation Condition

Met: the linked DESIGN SYSTEM card-policy receipt names `1px solid var(--color-hairline)` as the
one approved explicit Hairline role and gives the factual eligible-card rule. PRODUCT may now send
the exact handoff below to the existing FRONTEND sidebar role. No second design decision, new token,
or Product-route change is required for this activation.

## Next Recommended Role

PRODUCT — decide whether the bounded implementation evidence needs separate QA acceptance

## Blocker

None. The upstream Design System policy is completed and recorded.

## Handoff Prompt

```text
ROLE: FRONTEND

Task: Hito Local Inspector Side-Specific Border Intent Controls
Mode: Tracked
Frontend lane: DevTools
Canonical item: docs/tasks/backlog/2026-08-17-hito-local-inspector-semantic-add-border-intent.md

Read AGENTS.md, agents/frontend.agent.md, and skills/hito-frontend-design-system/SKILL.md. Read the completed linked Design System card-policy receipt first, then re-check this item, the current dirty worktree, the local Inspector owner, and its existing draft/payload seams before writing.

Outcome: replace the current generic border-removal affordance with one compact, expandable Border control for eligible card targets. In its collapsed state it must truthfully show computed `0`, one uniform observed border, or `Mixed`. Reuse the grouped Radius-control interaction anatomy: All sides is a shortcut for Top, Right, Bottom, and Left; sides may then be selected independently. The only initial treatments are the accepted semantic `None` and `Hairline`. A resulting intent is side-specific, clearable, reselectable, and produces factual batch-prompt output such as `Top + Bottom -> Hairline` or `All -> None`.

The Inspector records design intent only. It must not apply CSS, mutate inspected DOM, add a live style editor, expose arbitrary values, edit Design System or Product CSS, or create a second state/payload authority. Reuse the existing Chrome-control, target-evidence, task-draft, session-normalisation, inferred-action, and batch-prompt seams. Preserve Card-chrome removal as its separate broad request. Convert historic generic border-removal drafts once to the canonical All-sides/None intent; do not retain two active border-selection formats.

New runtime artifacts: none unless an existing narrow DevTools owner demonstrably cannot represent the control. Do not touch Design System recipes/tokens, Product routes, Backend, fixtures, persistence outside the existing local Inspector draft/session flow, Figma, hosted state, dependencies, Git lifecycle, or deployment.

Stop and return to PRODUCT if the DS receipt does not identify one standard Hairline role and eligible-card rule, if arbitrary border variants are needed, or if implementation would require a shared Design System change or Product CSS mutation.

Prove zero/uniform/mixed readbacks; All and each individual-side selection; None/Hairline intent; clearing/reselection; historic generic-remove conversion; batch text; Card-chrome and other-draft regression; session persistence; hit-layer pass-through; keyboard and Escape focus return; desktop/mobile containment; and console health from a fresh loopback qa_fixture. Run focused Inspector validation, Prettier, ESLint, production build only if the repository procedure requires it, and diff hygiene. Independent QA is a separate PRODUCT decision. Return an English tracked receipt with files changed, the one canonical border-intent representation, compatibility handling, and any unproved browser case. Do not claim Global QA, release, or deployment readiness.
```

## FRONTEND DevTools Execution Preflight — 2026-08-17

- **Task / mode / lane:** Hito Local Inspector Side-Specific Border Intent Controls / Tracked /
  FRONTEND DevTools.
- **Accepted discriminator:** the completed Design System receipt defines the sole explicit card
  perimeter as `1px solid var(--color-hairline)` and limits eligibility to exact canonical
  borderless visual-card owners. Generic rounded elements, overlays, controls, tables, calendar
  cells, row groups, and legacy Product `.hito-nav-card` are not eligible by inference.
- **Existing seams reused:** `LocalUiChromeControls`, grouped Radius disclosure anatomy,
  `local-ui-inspector-targets`, the existing `LocalUiInspectorItemDraft`, its one session
  normalisation path, inferred actions, payload normalisation, and batch-prompt formatting.
- **Smallest behavior change:** replace the active generic `Remove Border` affordance with one
  eligible-card Border disclosure that records one treatment (`None` or `Hairline`) over All or
  selected sides. Preserve observed zero/uniform/mixed evidence and keep Card chrome independent.
- **New runtime artifacts:** none. No component file, state store, persistence path, API, CSS recipe,
  token, fixture, dependency, compatibility payload, or style-mutation layer is proposed.
- **Obsolete responsibility:** retire active generic border removal and normalise any historic
  `kind: "border"` draft once to `All sides -> None`; only the canonical side-specific intent is
  emitted after normalisation.
- **Dirty boundary:** preserve the accepted computed-geometry overlay hunks already present in
  `LocalUiInspector.tsx` and `local-ui-inspector-targets.ts`, plus every unrelated Product, Design
  System, Backend, documentation, fixture, and runtime hunk byte-for-byte.
- **Focused proof:** zero/uniform/mixed readbacks; exact eligibility; All and independent sides;
  None/Hairline; clear/reselect; historic conversion; payload and batch text; Card chrome and other
  draft regressions; edit-session retention; hit-layer pass-through; keyboard/Escape; desktop and
  375x812 Light/Dark containment; console; focused formatting/lint/type/build/diff hygiene.

## FRONTEND DevTools Tracked Implementation Receipt — 2026-08-17

- **Task / stage:** Hito Local Inspector Side-Specific Border Intent Controls / FRONTEND DevTools
  implementation and focused browser proof.
- **Preflight and demonstrated cause:** the completed Design System dependency supplies one factual
  explicit-card treatment, `1px solid var(--color-hairline)`, and one bounded eligible-card census.
  The previous Inspector Chrome owner exposed only generic `Remove Border`, discarded zero-width
  sides from active intent evidence, and carried generic removal through the draft as a second
  format. The first incorrect owner was the existing Local Inspector Chrome/evidence/draft seam.
- **Product outcome:** eligible cards now expose one compact Border disclosure. Its current readback
  is computed `0`, one uniform value, or `Mixed`; All and Top/Right/Bottom/Left compose one
  side-specific `None` or `Hairline` intent. The resulting request remains a local prompt draft and
  never changes the inspected page.
- **Canonical representation and compatibility:** `borderIntentSelection` is the only active border
  request shape. Historic `chromeRemovalSelection.kind === "border"` drafts normalise once to
  `All -> None`, discard the legacy Chrome selection, and re-infer the current action. Card chrome
  remains a separate `card_chrome` request.
- **Reuse / artifacts / deletion:** reused `LocalUiChromeControls`, the grouped Radius disclosure
  anatomy, target evidence, the existing draft/session normaliser, action inference, payload, and
  batch prompt. New runtime artifacts: none. The active generic border-removal affordance and active
  generic Chrome draft format were removed; no component, CSS recipe, token, state store, fixture,
  dependency, or compatibility payload was added.
- **Files changed:**
  `src/components/devtools/LocalUiChromeControls.tsx`,
  `src/components/devtools/LocalUiInspector.tsx`,
  `src/components/devtools/LocalUiTaskDraftPanel.tsx`,
  `src/components/devtools/local-inline-change-target-utils.ts`,
  `src/components/devtools/local-ui-inspector-batch-prompt.ts`,
  `src/components/devtools/local-ui-inspector-session.ts`,
  `src/components/devtools/local-ui-inspector-targets.ts`, and
  `src/components/devtools/local-ui-task-draft-view-model.ts`. Pre-existing computed-geometry hunks
  in the two overlapping Inspector files were preserved.
- **Preserved boundaries:** no inspected DOM/style mutation, Product or Design System CSS change,
  Backend/fixture/persistence change, new runtime owner, dependency, hosted action, or Git lifecycle
  action. Loopback-only lazy mounting, hit-layer pass-through, screenshot flow, edit-session state,
  Card chrome, typography, Color, spacing/radius, Actions, and ordinary navigation remain owned by
  their existing seams.

| Check                                | Scenario / environment                                                                                      | Result                                | Evidence                                                                                                                                                                                                                                                                                   |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Current-border truth                 | Constructed zero, uniform, and mixed four-side evidence; exact eligible-card and overlay/control exclusions | Passed                                | Normalisation retains all four computed sides and derives `0 on all sides`, one uniform summary, or per-side `Mixed`; the source-backed eligible-card class census has one canonical owner.                                                                                                |
| Side/treatment interaction           | Real eligible `hito-ds-token-specimen-surface`, 1470x801 Dark                                               | Passed                                | Top + Bottom produced `Top + Bottom -> Hairline`; changing treatment produced `Top + Bottom -> None`; All selected/cleared all four sides; Left could be selected independently; pending intent could be cleared and reselected.                                                           |
| Historic conversion and action truth | Focused TSX discriminator                                                                                   | Passed                                | Historic generic removal became `All -> None`, cleared the legacy action/Chrome shape, and switching it to Hairline inferred `align_with_hito_ds`.                                                                                                                                         |
| Payload, batch, and session          | Real Inspector draft/review/edit cycle                                                                      | Passed                                | Review and generated prompt retained exact sides, current evidence, Hairline role, and no Card-chrome request; reopening the in-memory item retained the side-specific intent.                                                                                                             |
| Card-chrome and independent controls | Real eligible `hito-surface-flat` target                                                                    | Passed                                | Card chrome remained a separate switch; Border stayed available; spacing/radius, Color, typography, and Actions remained available.                                                                                                                                                        |
| No live mutation / hit layer         | Real `/hitoDS/brand` card selection                                                                         | Passed                                | Computed border remained zero and inspected elements retained no inline style while the intent changed; Pencil selection and ordinary navigation after exit both worked.                                                                                                                   |
| Keyboard and focus                   | 375x812 Dark in-app replay plus bounded Chrome native-key discriminator                                     | Passed                                | Native Enter opened Border, Enter selected Top, and Space selected Right (`Top + Right -> Hairline`). Escape closed the composer and returned focus to the existing Pencil Exit control; Enter exited Pencil, the launcher regained focus, and ordinary navigation remained operable.      |
| Responsive/theme/console             | 1470x801 Dark; exact 375x812 Light and Dark                                                                 | Passed                                | Border disclosure stayed contained, page width equalled viewport width, no page overflow occurred, and browser warn/error log was empty.                                                                                                                                                   |
| Static hygiene                       | Focused Prettier, ESLint, touched-file TypeScript filter, `git diff --check`                                | Passed                                | Formatting/lint/diff checks passed and no touched-file TypeScript diagnostic remained. Repository-wide `tsc --noEmit` still reports unrelated checkout diagnostics.                                                                                                                        |
| Design System validator              | `npm run validate-hito-ds-components`                                                                       | Blocked outside task                  | The existing documentation gate remains red: `Current product, system, and state docs must record the production-shipped /hitoDS role.` No task-owned Inspector failure was reported.                                                                                                      |
| Production build / managed runtime   | Fresh local production build and managed loopback `qa_fixture`                                              | Passed, then external freshness drift | Build passed and browser proof ran on PID 55620 while the artifact was fresh/receipt-matching. The final read-only status later reported `artifact_missing` for the unrelated private Admin repository snapshot marker; the healthy server was left running and was not rebuilt in a loop. |

- **Coverage gap and consequence:** the completed zero-border card policy leaves no naturally
  rendered eligible card with a uniform or mixed non-zero perimeter in the current reference
  corpus. Those two collapsed readback branches were proved through constructed computed evidence,
  while a real uniform Popover was correctly classified as an excluded overlay. No synthetic
  fixture or live DOM mutation was introduced merely to manufacture a browser target. Independent
  QA may choose to replay those branches if an admitted natural specimen later exists.
- **Subagent:** none; the primary FRONTEND owner performed implementation and focused proof.
- **Blockers:** none for FRONTEND Implementation DoD.
- **Next owner:** PRODUCT. Independent QA, Global QA, release, hosted, and deployment acceptance are
  not claimed.
