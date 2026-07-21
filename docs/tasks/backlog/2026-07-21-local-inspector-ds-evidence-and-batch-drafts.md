# Local Inspector DS Evidence And Batch Draft UX

## Status

completed

## Type

frontend_spec

## Priority

high

## Next Recommended Role

product

## Task

Local-only Inspector batch drafting, truthful Hito DS evidence, and component-action UX accepted.

## Stage

closed

## Exact Handoff Prompt

None. The bounded local-devtool contract is implemented and owner-level browser acceptance passed.

## Owner

FRONTEND

## Last Updated

2026-07-21

## Root Cause And Canonical Owner

The former Inspector held one ephemeral target and could overstate token/component certainty. The
canonical local-devtool session now owns a route-scoped in-memory batch, while the prompt formatter
owns one numbered packet and a bounded source-backed Hito DS allowlist supplies positive ownership
evidence. This is not a product workflow, design-system registry, or persistence layer.

## Accepted Product Contract

- A local-only Inspector session holds up to eight independently editable items in React memory.
- One generated Product prompt contains only explicit item changes, comments, evidence, scopes, and
  component requests; copy has a manual fallback.
- Computed token proximity is observed evidence. Authored Hito token provenance and confirmed
  component ownership are stated only when source-backed evidence exists.
- Confirmed component identity appears in technical target metadata. Unresolved identity uses the
  neutral `Component not confirmed` state without implying absence from the design system.
- `Actions` is the final observed-property row. It can request `Add to design system` for an
  unresolved target or `Remove object` for any target; exactly one action request may be selected.
- `Remove object` targets only the selected instance or similar instances. It never retires a Hito
  DS component. Removing a maintained component requires a separate governance task.
- Ordinary text, property, and visual requests may target one instance, similar instances, or the
  design-system level when confirmed ownership exists.
- Desktop uses the composer panel; exact 375px uses the existing Sheet anatomy with fixed
  header/footer and one scrolling body.

## Architecture Boundary

- Local-only mount and launcher behavior remain gated to loopback/local hosts.
- Inspector items, prompts, evidence, and action requests do not use backend, Admin, Supabase,
  Work Items, localStorage, or product-data persistence. The pre-existing local enable/disable
  toggle is the only separate browser preference.
- The Inspector does not mutate selected UI or source. It generates a prompt for a later explicit
  implementation task.
- `src/components/hito-ds/reference-metadata.ts` is a small positive allowlist, not a second Hito DS
  catalog. Runtime Hito DS primitives and `/hitoDS` remain canonical.
- The retained screen-capture prompt is a separate local screenshot flow, not a competing batch
  drafting owner.

## Source Owners

- session and item state: `src/components/devtools/local-ui-inspector-session.ts` and
  `src/components/devtools/use-local-ui-inspector-session.ts`;
- prompt packet: `src/components/devtools/local-ui-inspector-batch-prompt.ts`;
- evidence: `src/components/devtools/local-ui-inspector-token-evidence.ts` and
  `src/components/hito-ds/reference-metadata.ts`;
- surfaces: `LocalUiInspector`, `LocalUiTaskDraftPanel`, `LocalUiInspectorBatchReview`,
  `LocalUiInspectorSurface`, `LocalUiInspectorConfirmDialog`, and `LocalUiComponentActions`.

The replaced single-item `LocalUiPromptActionControls.tsx` path is deleted and has no live import.

## Acceptance Evidence

- initial batch proof:
  `qa-artifacts/screenshots/2026-07-21/local-inspector-batch-drafts/proof.json`;
- final component/action and local-only proof:
  `qa-artifacts/screenshots/2026-07-21/local-inspector-component-actions-closeout/closeout-proof.json`;
- exact component/action simplification proof:
  `qa-artifacts/screenshots/2026-07-21/local-inspector-component-actions-simplification/local-inspector-component-actions-consolidated-proof.json`.

The accepted inventory covers eight-item batching, duplicate handling, prompt output, token and
ownership discriminators, focus/Escape behavior, copy fallback, local-only visibility, desktop,
exact 375px, mobile scrolling, runtime health, cleanup, targeted lint, production build, build
integrity, and scoped diff hygiene.

## Closeout

Implementation DoD: Passed.

Broader hosted/product Global QA is not required for this local-only non-mutating devtool. Its
bounded owner-level browser inventory is the final acceptance gate; runner and production behavior
remain outside this tool's contract.
