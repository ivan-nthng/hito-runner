# Hito DS Reference Dead Legacy Deletion Sweep

## Work Item ID

2026-08-11-hito-ds-reference-dead-legacy-deletion-sweep

## Status

completed

## Type

cleanup

## Priority

high

## Owner

design_system

## Scope

shared-design-system-reference

## Archive Intent

retain_in_place

## Stage

Completed — proven dead declarations and unused public/import surface removed.

## Next Recommended Role

product

## Task

Perform one bounded, source-backed deletion sweep of the interactive `/hitoDS` reference after
the completed Button/Tabs simplification. Remove only reference code, aliases, helpers, branches,
or duplicated state/rendering responsibilities that are demonstrably superseded or have zero
runtime reachability. Reuse the existing `HitoDsPlayground` shell and live canonical components.

This is not permission to reduce the reference by moving live behavior into static content, to
restructure a working family for appearance, or to create a replacement framework.

## Product Decision

Ivan explicitly wants the same reuse-first simplification rule to continue: remove legacy rather
than retain it defensively. A deletion must be factual. Working code is not legacy merely because
it is old or lengthy.

## Source Facts

- The completed prior slice made `ButtonPlayground` and `TabsPlayground` family-owned owners inside
  `src/components/hito-ds/reference-components-controls.tsx`, removing Button/Tabs duplication.
- Current inspection shows `Input`, `Status`, and `Selection` still have live local state in that
  same composition owner. It does **not** yet prove that extracting any of them is a deletion:
  Input already has a unified renderer, Status has only two local controls, and Selection's state
  drives a genuine interactive specimen.
- Text hits such as `legacy`, `compatibility`, and `backend-compatible` are not deletion evidence.
  Their runtime reachability and owner must be mapped before any write.
- Complex Calendar, Workout Library, Data Table, overlay, motion, and Figma-export scenarios are
  explicitly outside this sweep unless a separate source-backed deletion case is established.

## Expected Outcome

- Every changed line removes a proven dead/superseded responsibility or makes its removal possible
  in the same slice.
- The live `/hitoDS` Demo, Variants, Overview, deep links, keyboard behavior, focus states, and
  responsive/light-dark presentation remain truthful and usable.
- No new production runtime artifact, file, registry, abstraction, prop schema, second playground,
  token, primitive, route, dependency, compatibility layer, or Product behavior is added.
- If no qualifying legacy remains in this bounded scope, leave source unchanged and record that
  factual result rather than manufacture a refactor.

## What Not To Touch

- Product routes, AppShell, onboarding, Backend/Supabase/auth/providers, Inspector, Figma, and
  hosted state.
- Canonical DS primitive APIs, CSS/tokens, validator contracts, and Figma-export consumers unless
  an exact direct deletion proof places them in scope.
- Concurrent dirty work unrelated to the exact deleted owner.

## Required Discriminator

Before a deletion, establish all of the following:

1. the current definition/export/branch and every consumer;
2. a live canonical owner that already provides the same responsibility, or zero runtime
   reachability; and
3. proof that removal does not make the interactive reference less truthful or less testable.

An inability to find a smaller ownership model is a stop condition, not a reason to add one.

## Reuse-First Change Budget

- **Existing seam:** the current `/hitoDS` reference composition and its live canonical renderers.
- **New runtime artifacts:** none.
- **Required removal:** only demonstrated dead/superseded code; no removal target is assumed in
  advance.
- **Promotion boundary:** stop and return to Product if deletion touches a canonical primitive,
  Product consumer, Figma export contract, or needs a new API/framework.

## Execution Preflight

- **Observable outcome:** one bounded map determines whether any non-complex `/hitoDS` reference
  path is demonstrably unreachable or superseded; source remains unchanged if none qualifies.
- **Existing seam:** current `HitoDsPlayground` composition, reference model, live family renderers,
  and their direct route/navigation consumers.
- **New runtime artifacts:** none.
- **Candidate change:** deletion only after exact definition, complete consumer map, and canonical
  replacement or zero-reachability evidence; no extraction is assumed.
- **Preserved boundaries:** Product, Backend, Inspector, Figma/export, canonical primitives,
  CSS/tokens, complex scenario workbenches, and unrelated dirty work remain untouched.
- **Focused proof:** DS validator, focused static/format/diff checks, and a fresh canonical build
  after the source and task receipt settle. Browser proof is conditional on a rendered path change.
- **Stop condition:** no proven deletion, a required new abstraction/API, or any cross-owner
  consumer ends the source sweep without a runtime edit.

## Validation Expectations

| Check             | Scenario / environment                                    | Required evidence                                                                     |
| ----------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Reachability map  | Every candidate before write                              | Exact definition, all consumers, and canonical replacement or zero-reachability proof |
| Deletion proof    | Changed reference source                                  | Removed responsibility has no remaining runtime path; no replacement layer added      |
| DS/static         | Existing validator, focused ESLint/Prettier, diff hygiene | Current DS contract remains valid                                                     |
| Build             | Fresh production build after source settles               | Client/SSR output remains valid                                                       |
| Live reference    | Every touched Demo/Variants/Overview entry                | Pointer, keyboard, focus, navigation and visual-state behavior remain available       |
| Responsive/themes | Desktop and exact 375px in light and dark                 | No page overflow; preview and controls remain usable                                  |
| Scope             | Shared dirty checkout                                     | Unrelated hunks preserved byte-for-byte                                               |

No Global QA, hosted/release, deployment, or Figma parity claim follows from this cleanup.

## Deletion Map And Decision

| Candidate                                | Definition and complete consumer map                                                                                                                        | Decision and discriminator                                                                                                                                                                                                                                                                      |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stale family aliases and toast ID        | Former `reference-foundations-page.tsx:191-211`; 19 non-exported aliases and `HITO_DS_TOAST_ID` each had exactly one module occurrence: its declaration     | Removed. The aliases had zero type/runtime consumers; most referenced constants absent from the module. Live Button/Input/Selection/Tabs/Status/Data Table ownership remains in controls, modal/toast ownership and the used toast ID remain in overlays, and row density remains in structure. |
| Foundations `ChoiceSelector` import      | Imported once and never referenced by JSX or code in the module                                                                                             | Removed with zero replacement.                                                                                                                                                                                                                                                                  |
| Controls `SectionIntro` import           | Imported once and never referenced by JSX or code in the module                                                                                             | Removed from the existing import with zero replacement.                                                                                                                                                                                                                                         |
| Dual-range callback bindings             | `currentMin` in the minimum callback and `currentMax` in the maximum callback were bound but never read                                                     | Removed via tuple holes; the same current endpoint still drives each ordered state update.                                                                                                                                                                                                      |
| Route re-exports                         | `HITO_DS_PAGE_ROUTES` and `HitoDsPageId` re-exported from `routes/hitoDS.tsx`; repo-wide search found no import from that route surface                     | Removed. The page component re-export remains because three child routes consume it.                                                                                                                                                                                                            |
| Model export modifiers                   | `HITO_DS_PAGE_ROUTES` and `SectionId` had no external imports                                                                                               | Made module-local. Both definitions and their existing model-local consumers remain live.                                                                                                                                                                                                       |
| `shell` compatibility entry              | Model registry entry, `reference-page` canonicalization, and the live `app-shell` anchor form one reachable redirect                                        | Retained. It truthfully preserves the accepted old `#shell` deep link.                                                                                                                                                                                                                          |
| Overview compatibility anchors           | `figma-bridge`, `shared-wrappers`, and `backlog` model entries each match a retained Overview DOM anchor                                                    | Retained. They are direct-hash owners, not dead metadata.                                                                                                                                                                                                                                       |
| `copyTextWithLegacySelection`            | Called by the live color-copy action; Clipboard API use is its catch fallback                                                                               | Retained. Removing or reordering it would change live behavior.                                                                                                                                                                                                                                 |
| Input, Status, and Selection composition | Existing state drives live family specimens; no net-negative duplicate owner was established                                                                | Retained without extraction.                                                                                                                                                                                                                                                                    |
| Semantic color `alias ?? value` fallback | Current generated aliases make the fallback unreachable, but the branch is token-display-contract adjacent and has a parallel excluded Figma representation | Held outside this sweep. Its two existing `TS2339` diagnostics remain an explicit separate owner boundary.                                                                                                                                                                                      |

## Implementation Receipt

- **Product outcome:** one factual deletion sweep completed; no replacement framework or state owner
  was introduced.
- **Task-owned source delta:** 35 source lines removed and 5 replacement lines added, net `-30`
  lines. The replacements only narrow imports/exports and remove unread tuple bindings.
- **Files changed:** `reference-foundations-page.tsx`, `reference-components-controls.tsx`,
  `reference-model.ts`, `routes/hitoDS.tsx`, and this canonical item.
- **Rendered behavior:** unchanged. No component, DOM node, state transition, handler outcome, style,
  token, route, or navigation destination was removed.
- **Preserved boundaries:** complex scenario workbenches, Product, Backend, Inspector, Figma/export,
  primitives, CSS/tokens, validators, and unrelated dirty work were not changed.
- **Independent review:** one read-only Design System reachability reviewer confirmed every deletion
  above and the retained live compatibility paths; it changed no file and used no browser or Figma.
- **Browser consequence:** not run because no rendered interactive path changed. This receipt does
  not claim visual/browser regression coverage beyond the unchanged-path source discriminator.

## Validation Receipt

| Check                         | Scenario / environment                                      | Result                        | Evidence                                                                                                                                                                                                                                                                                              |
| ----------------------------- | ----------------------------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reachability map              | Non-complex `/hitoDS` reference modules                     | Passed                        | Every removed non-exported declaration/import had zero module consumers; removed re-exports had zero repo consumers; local model consumers remain.                                                                                                                                                    |
| Net-negative deletion         | Task-owned source patch                                     | Passed                        | `35` removed, `5` replacement lines, net `-30`; no file/helper/wrapper/runtime artifact added.                                                                                                                                                                                                        |
| DS contract                   | `npm run validate-hito-ds-components`                       | Passed                        | Contract validator reported `contract ok`, `scannedFiles: 320`.                                                                                                                                                                                                                                       |
| Focused ESLint / Prettier     | Four changed source files plus this item                    | Passed after final formatting | No task-owned lint or format finding remains.                                                                                                                                                                                                                                                         |
| Focused semantic diagnostics  | Changed source with `--noUnusedLocals --noUnusedParameters` | Partial, boundary recorded    | Deleted aliases/imports/bindings no longer report diagnostics. Two existing `TS2339` diagnostics remain at the held token fallback in Foundations; full typecheck is not claimed.                                                                                                                     |
| Production build              | Shared canonical build after source settled                 | Passed                        | A concurrent managed `qa:server:restart` owner completed the production build; status was current, managed, loopback-only, healthy, fresh, and `receipt_matches`. A final `qa:server:start` is intentionally run after this receipt settles because this document participates in the Admin snapshot. |
| Browser / responsive / themes | Rendered `/hitoDS`                                          | Not required                  | No rendered path changed; browser proof would not discriminate the deleted type/import/export-only responsibility.                                                                                                                                                                                    |
| Scope / diff hygiene          | Shared dirty checkout                                       | Passed                        | Only the mapped source lines and this item are task-owned; unrelated hunks remain unstaged and unmodified.                                                                                                                                                                                            |

## Remaining Boundary

No blocker remains for this deletion sweep. The held semantic-color fallback is a separate
token-display/Figma-adjacent contract decision and was not hidden or expanded into this task.
This completion is focused Design System implementation proof only; it is not Global QA, hosted or
release readiness, deployment proof, or Figma parity.

## Exact Handoff Prompt

```text
ROLE: DESIGN SYSTEM

Mode: Tracked
Stage: Evidence-gated dead legacy deletion sweep

Read `AGENTS.md`, `agents/design-system.agent.md`, and
`skills/hito-frontend-design-system/SKILL.md` before any write. Read this canonical item in full:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-hito-ds-reference-dead-legacy-deletion-sweep.md`.

Ivan explicitly authorized this continuation. Apply the same reuse-first rule as the completed
Button/Tabs source simplification: delete demonstrated legacy; do not retain obsolete code from
fear, and do not manufacture a refactor merely to make a long file shorter.

Task:
Run one bounded source-backed sweep of `/hitoDS` reference code. For each candidate, map its exact
definition, runtime consumers, and whether a live canonical owner already provides the same
responsibility. Remove only a path with zero runtime reachability or a proven superseded duplicate.
If the map finds no qualifying path, make no source change and close with that factual conclusion.

Reuse the existing `HitoDsPlayground` shell and live canonical components. Do not add a file,
registry, framework, wrapper, prop schema, token, primitive, route, dependency, compatibility
layer, or Product behavior. Do not extract Input, Status, or Selection merely because they live in
the cross-family controls file: first prove a net-negative deletion. Do not touch complex
Calendar, Workout Library, Data Table, overlay, motion, Product, Backend, Inspector, Figma,
canonical primitives/CSS/tokens, or unrelated dirty work.

Use one bounded read-only Design System reachability review if it materially helps establish the
deletion map. Browser QA is required only if a rendered interactive path changes; use any supported
local browser path without requesting approval. Preserve existing Figma-export consumers unless an
exact direct deletion proof puts one in scope.

Definition of Done:
- each removed path has a recorded zero-reachability or supersession discriminator;
- the result is net-negative in source/responsibility and adds no replacement machinery;
- any touched `/hitoDS` interaction remains live, accessible, responsive, and theme-safe;
- the canonical item records exact removal or the factual no-op outcome in English.

Run proportional DS/static/build proof. Do not claim Global QA, hosted/release readiness, Figma
parity, or deployment. In-progress commentary may be Russian; the final formal receipt and check
table must be English. Do not stage, commit, push, deploy, access hosted state, or mutate Figma.
```
