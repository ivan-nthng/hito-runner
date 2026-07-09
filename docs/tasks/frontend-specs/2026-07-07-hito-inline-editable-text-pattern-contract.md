# Hito Inline Editable Text Pattern Contract

## Status

completed

## Owner

Designer

## Last Updated

2026-07-09

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
  must not imply runner mutation.
- Generated workout preview/detail/readback remains read-only.
- `/hitoDS/patterns#inline-editable-text` is the reference specimen for direct edit, read-only text,
  and the local-only inspector task-target example.

The root-cause boundary is unchanged: Frontend owns the shared interaction primitive and Hito DS
specimen; Backend/Admin Capture would own any future persisted work-item creation. This spec does
not authorize generated workout editing, fake persistence, schema changes, or production-visible
inspector tooling.

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
- generated workout preview/detail/readback stays read-only;
- the DS reference page documents the pattern and local-only inspector example;
- no fake Admin Capture rows, backend schema, Supabase persistence, or live product mutation were
  added.

## Preserved Boundaries

- Do not add edit affordances to generated workout readback unless backend capability metadata later
  accepts that product behavior.
- Do not treat the local inspector as an issue tracker, backlog writer, or Admin Work Items client.
- Do not add product runtime persistence from this frontend pattern.
- Do not fork a second local inline editor family.
- Do not classify shared product primitives as removable devtool code.

## Exact Handoff Prompt

```text
ROLE: FRONTEND

Task:
Use the accepted shared Hito inline editable/read-only text primitive for any future inline text UI,
and keep local inspector task targeting local-only unless Product/Backend explicitly selects a
persisted Admin Capture slice.

Stage:
FRONTEND implementation guardrail / Hito DS inline text pattern reuse.

Context:
The inline editable text pattern is implemented and QA accepted. `InlineEditableText` is for true
editable contexts such as the manual workout constructor title. `InlineReadOnlyText` is for
generated/read-only truth. The local inspector is now a local-only DS audit and prompt-generation
tool, not a backlog persistence tool.

Rules:
- Reuse `src/components/ui/inline-editable-text.tsx` before adding route-local inline text editors.
- Keep generated workout preview/detail/readback read-only unless backend capability metadata
  explicitly accepts content editing.
- Do not add backend/Admin/Supabase/Work Items persistence from the local inspector.
- Do not resurrect `Send to backlog`, `Save to backlog`, or `Quick bugs` as current inspector UI.
- Document any new reusable pattern on `/hitoDS` in the same slice.

Validation:
- Run targeted lint/build checks for touched UI files.
- Use browser QA when a runner-facing or `/hitoDS` visible surface changes.
- Run scoped `git diff --check`.

Stop conditions:
- Stop if a requested change needs persisted Admin Capture task creation, generated workout editing,
  backend schema changes, or production-visible inspector tooling.
```
