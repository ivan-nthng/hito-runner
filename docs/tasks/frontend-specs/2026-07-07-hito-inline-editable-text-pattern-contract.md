# Hito Inline Editable Text Pattern Contract

## Status

completed

## Owner

Designer

## Last Updated

2026-07-19

## Type

frontend_spec

## Priority

high

## Next Recommended Role

frontend

## Task

Record the accepted Hito inline editable/read-only text pattern and supersede old local-inspector
backlog-persistence wording.

## Stage

FRONTEND specification closeout / source-of-truth compression.

## Source Of Truth

- Active plan: `docs/plans/active/2026-06-08-running-plan-creation-engine-rebuild.md`
- Product truth: `docs/current-product.md`
- System truth: `docs/current-system.md`
- Functional map: `docs/current-functional-map.md`
- Accepted generated-plan readback QA:
  `qa-artifacts/screenshots/2026-07-07/generated-plan-workout-document-readback-polish-qa/`
- Shared primitive: `src/components/ui/inline-editable-text.tsx`
- Shared product usage: `src/components/manual-workout/ManualWorkoutConstructorEditor.tsx`
- DS reference surface: `/hitoDS/patterns#inline-editable-text`
- Superseding local-inspector contract:
  `docs/tasks/frontend-specs/2026-07-09-local-inspector-ds-audit-tool-contract.md`

## Accepted Contract

Hito has one shared inline text interaction pattern:

- `InlineEditableText` is for true editable contexts, currently the manual workout constructor title
  and future surfaces only when their owner already supports the edit.
- `InlineReadOnlyText` is for generated, imported, provider, proof, or other backend-owned truth that
  must not imply inline mutation.
- Generated workout preview/detail/readback remains non-inline-editable. A confirmed non-rest workout
  on today or a future date still has the separate reviewed content-edit action defined in
  `docs/current-product.md`, regardless of source, logs, completion, or evidence.
- `/hitoDS/patterns#inline-editable-text` is the reference specimen for direct edit, read-only text,
  and the local-only inspector task-target example.

The root-cause boundary is unchanged: Frontend owns the shared interaction primitive and Hito DS
specimen; Backend/Admin Capture would own any future persisted work-item creation. This spec does
not authorize inline mutation of passive readback, fake persistence, schema changes, or
production-visible inspector tooling.

## Local Inspector Supersession

Older implementation notes in this file previously explored a backlog-first local-inspector panel.
Those notes are intentionally removed from active source-of-truth. The accepted current inspector
contract is now the 2026-07-09 local inspector DS audit tool spec:

- local-only `Generate Prompt`;
- clipboard/manual-copy fallback;
- explicit user-selected changes only;
- no live UI mutation;
- no backend/Admin/Supabase/Work Items persistence;
- hidden on production-like hosts.

The historical labels `Send to backlog`, `Save to backlog`, and `Quick bugs` are not current
local-inspector product truth. If a future persisted task-creation flow is selected, it must be a new
Product/Backend/Admin Capture slice, not a continuation of this spec.

## Implementation Closeout

FRONTEND implemented and QA accepted the v1 pattern on 2026-07-07:

- the route-local `editable-heading` pilot was replaced by shared Hito DS primitives;
- manual workout constructor title now uses the shared editable primitive;
- generated workout preview/detail/readback stays non-inline-editable while today/future confirmed
  rows retain a separate reviewed edit action;
- the DS reference page documents the pattern and local-only inspector example;
- no fake Admin Capture rows, backend schema, Supabase persistence, or live product mutation were
  added.

## Preserved Boundaries

- Do not turn generated workout readback text into inline controls; use the separate reviewed edit
  action defined by `docs/current-product.md`.
- Do not treat the local inspector as an issue tracker, backlog writer, or Admin Work Items client.
- Do not add product runtime persistence from this frontend pattern.
- Do not fork a second local inline editor family.
- Do not classify shared product primitives as removable devtool code.

## Exact Handoff Prompt

None. The pattern is implemented; future consumers should read this contract and
`docs/current-product.md` rather than reuse an old execution prompt.
