# Hito Unified Editable Workout Frontend Editor Adoption

## Work Item ID

2026-08-15-hito-unified-editable-workout-frontend-editor-adoption

## Status

completed

## Type

Tracked — Frontend Product adoption of the unified persisted workout edit contract

## Priority

high

## Owner

FRONTEND

## Epic

runner-core-readiness

## Stage

Frontend Product implementation and focused independent QA

## Next Recommended Role

PRODUCT, after Frontend Implementation DoD and bounded QA replay

## Parent

[Hito Unified Editable Workout Document Contract Discovery](./2026-08-15-hito-unified-editable-workout-document-contract-discovery.md)

## Depends On

[Hito Unified Editable Workout Backend Contract And Atomic Protection](./2026-08-15-hito-unified-editable-workout-backend-contract-and-atomic-protection.md)

## Scope

Adopt the completed Backend origin-neutral WorkoutDocument edit contract in the existing authenticated
Workout editor. Render one visible edit/review/confirm path for valid manual, AI-authored, and imported
planned workouts while retaining truthful protected states.

## Accepted Product Decision

Manual and AI-authored training are one planned-workout entity. The UI may consume Backend capabilities
and provenance but must not use origin as an editing policy.

## Evidence

The completed Backend slice intentionally removed the lossy draftInput and draftReview response fields.
The current ManualWorkoutPersistedEditControls.tsx is the first incompatible consumer and blocks the
repository-wide type/build gate until it adopts document, editProjection, and candidateDocument.

## Existing Seams To Reuse

- src/components/manual-workout/ManualWorkoutPersistedEditControls.tsx
- src/components/manual-workout/ManualWorkoutConstructorEditor.tsx
- src/routes/workout.$date.tsx as a capability consumer
- Existing authenticated reconstruct/review/confirm actions and Hito Design System controls

## Required Outcome

- Reconstruct with plannedWorkoutId, workoutDate, and optional provenancePlanId; edit the returned
  document/editProjection, not a manual draft or locally authoritative persisted row.
- Review the complete editProjection; render candidateDocument and explicit server review truth.
- Confirm exactly the reviewed projection with the supplied token/checksum; refresh from persisted
  response after success and resolve blocked/stale failures truthfully.
- Preserve valid read-only passthrough document truth. Do not drop unsupported fields, targets,
  provenance, extras, repeat children, or schedule identity as a side effect of the editor.
- Keep existing Hito Design System controls and interaction patterns; do not create a new primitive,
  stylesheet recipe, local persistence model, origin-specific path, or compatibility payload.

## Boundaries And Non-Goals

- Backend owns persistence, capability calculation, validation, provenance, review integrity, and
  transactional evidence guards; do not recreate or bypass them in the client.
- Manual creation, copy, move, delete, Rest lifecycle, FIT ingestion, sidebar data, design-system
  source, hosted state, providers, and the separate stored-Rest Move → Undo defect are out of scope.
- Do not make the UI fast by caching or duplicating Backend document truth. Reuse current components,
  route state, and action flow; keep rendering and submission work proportional to the active editor.

## Definition Of Done

- The old draftInput/draftReview consumer path is gone and focused TypeScript/build errors from this
  consumer are resolved.
- Valid manual, AI, and imported current/future unlogged non-Rest workouts open the same editor,
  review, confirm, and persisted reload path.
- A title-only edit demonstrably preserves rich repeated sections, target provenance/extras, labels,
  guidance, IDs, identity, date, and neighbouring workouts.
- Logged, evidence-backed, skipped, past, Rest, malformed, and stale-review cases expose truthful
  blocked/error behavior and never show a client origin-only restriction or mutate state.
- Cancel, validation failure, review failure, and confirm failure leave the visible persisted state
  unchanged; keyboard/focus, desktop/375px containment, and console health remain sound.

## QA Requirement

Use the existing named QA role twice if it can be scheduled without conflicting with shared runtime:
one bounded read-only review of the proposed browser matrix before acceptance, and one independent
read-only replay after Frontend implementation. QA must cover manual/AI/imported positives; rich
repeat/target preservation; protected/past/Rest/malformed negatives; stale review; cancel/failure;
reload/readback; desktop and 375px; Light/Dark; keyboard/focus; overflow; and console health. It must
not edit production source or substitute a stale/ad hoc runtime for an admitted fixture.

## Validation Expectations

Run focused source/type checks, Product validation, Prettier, ESLint, diff hygiene, production build,
and a fresh managed loopback browser matrix appropriate to the changed UI. Record omissions honestly.
Do not claim Global QA, hosted parity, release, or deployment readiness.

## Frontend Execution Preflight — 2026-08-15

- **Mode / owner:** Tracked / FRONTEND, Product lane. The linked architecture decision and completed
  Backend contract are accepted inputs; Backend source, persistence, migration, fixture, and Design
  System ownership remain read-only.
- **Current discriminator:** a fresh repository TypeScript diagnostic reports the expected
  `ManualWorkoutPersistedEditControls.tsx` failures on removed `draftInput` and `draftReview`
  fields. The current Backend result types expose only `document`, `editProjection`,
  `candidateDocument`, and the review token/checksum. No other reachable Frontend persisted-edit
  consumer owns that obsolete response shape.
- **Existing seams reused:** `ManualWorkoutPersistedEditControls.tsx` remains the one dialog/action
  owner; `ManualWorkoutConstructorEditor.tsx` remains the visible title, notes, structure, target,
  review, and focus composition; `workout.$date.tsx` remains a Backend-capability consumer. Existing
  Hito Dialog, Button, inline text, textarea, status, timeline, and readback contracts remain in use.
- **Smallest behavior change:** keep one in-memory `WorkoutDocumentEditProjection` draft, edit only
  fields supported by the existing visible controls, render the complete canonical document
  structure/targets as read-only passthrough, submit the full projection for review, then confirm
  that exact reviewed projection with its token/checksum and refresh persisted route truth.
- **Reuse-first budget:** new production runtime artifacts: **none**. No component family, helper
  module, stylesheet, token, cache, persisted document, compatibility payload, origin branch,
  validator framework, fixture path, or dependency is proposed.
- **Simplification:** delete the obsolete manual-draft state/reconstruction, template inference,
  `draftReview` readback, and manual target-truth ownership from persisted editing. Manual creation,
  copy/move/delete, Rest/FIT behavior, and the constructor's existing manual-authoring path remain
  unchanged.
- **Dirty/runtime boundary:** the index is empty. Existing Backend unified-document hunks, Workout
  sidebar/Calendar work, history/DS work, and all untracked records are foreign and preserved. The
  managed loopback server is healthy but its artifact is currently stale/broken (`artifact_missing`),
  so it is not admitted for browser evidence and will be rebuilt only after source validation and
  shared writers are quiet.
- **Focused proof:** removed-field reachability; manual/AI/imported one-path rendering; rich
  repeat/target/provenance/extra preservation through title-only review/confirm/reload; protected,
  malformed, stale, cancel, and failure behavior; desktop/exact 375px Light/Dark keyboard,
  containment, overflow, and console health; focused formatting/lint/type/Product checks, diff
  hygiene, and production build.
- **Stop boundary:** return to PRODUCT if the accepted Backend projection cannot preserve a required
  field, if structure editing requires a new product contract rather than read-only passthrough, or
  if a Backend, persistence, fixture, shared Design System, or new persisted-shape change is needed.

## Browser Path Preflight — 2026-08-15

- **Validation layer:** focused Frontend Implementation DoD plus the required independent bounded QA
  replay; this is not Global QA, hosted, release, or deployment acceptance.
- **Admitted runtime:** the managed `qa_fixture` at `http://127.0.0.1:3000` is healthy and was rebuilt
  from the current checkout after the task-owned source passed focused static checks. Its fixture
  receipt currently reports `fresh` / `receipt_matches`.
- **State boundary:** use existing disposable local Product identities and ordinary authenticated UI
  actions only. Do not edit fixture source, hand-shape database rows, access hosted data, or claim a
  state that the admitted fixture cannot render.
- **Matrix:** one rich editable positive plus one protected state at 1470x801 and exact 375x812 in
  Light and Dark; manual, AI-authored, and imported provenance when the existing lifecycle exposes
  them; review/confirm/reload, cancel, stale/failure, keyboard/focus, containment, overflow, console,
  and request/document evidence proportional to fields not fully rendered in the timeline.
- **Open admission discriminators:** confirm a current/future imported-origin row through the existing
  saved-plan lifecycle and record which protected/malformed states are actually present. Any absent
  canonical fixture remains an explicit coverage gap and is not replaced with a client workaround.

## Frontend Tracked Implementation Receipt — 2026-08-15

### Stage And Preflight

- **Stage:** Frontend Product implementation and bounded independent QA replay.
- **Product outcome:** the authenticated persisted-workout editor now consumes the Backend-owned,
  origin-neutral `WorkoutDocument` contract. Manual and AI-authored eligible workouts use the same
  reconstruct → review → confirm path; any eligible imported workout reaches that same path because
  the consumer contains no origin branch.
- **Demonstrated cause:** `ManualWorkoutPersistedEditControls.tsx` still read the removed lossy
  `draftInput` / `draftReview` fields and rebuilt a manual-authoring payload. The completed Backend
  contract exposes `document`, full `editProjection`, `candidateDocument`, and review integrity
  fields instead. The obsolete consumer caused the task-owned TypeScript failures and could not
  preserve arbitrary valid document truth.
- **Reuse / artifacts:** the existing persisted-edit dialog, constructor presentation, authenticated
  actions, route capability readback, and Hito controls remain the owners. New production runtime
  artifacts: **none**. No client persistence, cache, origin policy, compatibility payload, helper
  file, stylesheet, token, primitive, fixture, or dependency was added.

### Implementation

- `src/components/manual-workout/ManualWorkoutPersistedEditControls.tsx` now reconstructs and keeps
  one in-memory full `editProjection`, renders the authoritative document, reviews the full
  projection, and confirms that exact reviewed projection with its token/checksum. Only the existing
  title and notes controls write; structure, repeats, targets, provenance, and extras remain factual
  read-only passthrough content. Backend blocked/stale messages are displayed verbatim.
- `src/components/manual-workout/ManualWorkoutConstructorEditor.tsx` accepts the canonical
  `WorkoutDocumentContent` readback while preserving all existing manual-creation defaults. The
  persisted editor can suppress manual-only target guidance and explain its read-only structure
  without adding a second component or changing shared Design System behavior.
- `src/routes/workout.$date.tsx` passes the factual provenance plan identifier and keeps the existing
  capability gate. A focused browser replay found that the controlled dialog had no trigger to
  receive focus after Escape; the existing route-local action button now owns that return target.
  The file's pre-existing Workout sidebar-summary hunks were preserved and are not part of this
  receipt.
- The obsolete manual draft reconstruction, template inference, local target-truth ownership, and
  `draftReview` warning path were deleted from persisted editing. Manual creation and every excluded
  Product/Backend/Design System contract remain unchanged.

### Validation

| Check                                | Scenario / environment                                            | Result                           | Evidence                                                                                                                                                                                                                                  |
| ------------------------------------ | ----------------------------------------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Removed consumer fields              | Focused source reachability                                       | Passed                           | Zero `draftInput`, `draftReview`, or old `activePlanId` references in the persisted editor/route; the source now sends full `editProjection`, `candidateDocument`, token, checksum, and `provenancePlanId`.                               |
| Focused types                        | Current dirty checkout                                            | Passed for task-owned components | Full checkout `tsc --noEmit` still reports foreign dirty-work diagnostics, but filtering returned no diagnostic for either task-owned manual-workout component. Production compilation passed.                                            |
| Product contracts                    | `validate-manual-workout-authoring`, `validate-product-contracts` | Passed                           | Manual authoring invariants, heart-rate guidance proof, and workout comparison readback all passed without a persistence proof request.                                                                                                   |
| Formatting / lint / diff             | Prettier, focused ESLint, `git diff --check`                      | Passed                           | All three touched source files are formatted; focused ESLint and checkout diff hygiene passed.                                                                                                                                            |
| Production build / fixture admission | Managed `qa_fixture`, loopback `127.0.0.1:3000`                   | Passed                           | Production client/SSR/Nitro build passed. Managed server PID 76794 is healthy, compatible, loopback-bound, `fresh`, and `receipt_matches`, and remains running. Standard dependency directive and large-chunk warnings were non-blocking. |
| Manual positive / cancel             | `qa-baseline`, `/workout/2026-08-17`                              | Passed                           | One editor opened; a title change cancelled and stayed unchanged after reopen/reload. Review/confirm/reload changed the same route truth and the acceptance title was restored afterward.                                                 |
| AI rich-document positive            | `fit-product-acceptance`, `/workout/2026-08-18`                   | Passed                           | Title-only review/confirm/reload preserved five ordered work/recovery pairs, warm-up/cooldown, distance/duration, pace targets, and AI provenance. The original title was restored afterward.                                             |
| Stale integrity                      | Two concurrent reviewed candidates on the AI row                  | Passed                           | The first confirm persisted once; the second was rejected with `This workout edit review no longer matches authoritative workout truth.` No stale second mutation occurred; the original title was restored.                              |
| Protected states                     | FIT/completed 2026-08-10; skipped 2026-08-11; Rest 2026-08-12     | Passed                           | `Edit this training` remained disabled in each factual protected state. Accepted Backend capability/source evidence supplies the protected reason; no origin-only policy was introduced.                                                  |
| Responsive / themes                  | 1470x801 and exact 375x812, Light/Dark                            | Passed                           | Editor and protected states remained contained; the mobile dialog measured 375px within a 375px client, page scroll width equalled client width, and no page-level horizontal overflow appeared.                                          |
| Keyboard / focus / console           | Dialog and route actions                                          | Passed                           | Forward/reverse focus stayed trapped, Escape closed the dialog and returned focus to `Open workout actions`, and browser warning/error logs were empty.                                                                                   |
| Independent QA                       | Existing named QA role, fresh managed fixture                     | Passed                           | QA independently replayed manual, AI rich preservation, real stale rejection, protected states, responsive themes, focus, overflow, and console health. Verdict: Frontend Implementation DoD passed; Global QA remains unclaimed.         |

### Coverage Gaps And Consequences

- The only local `training_plan_v2_import` record is archived and has zero materialized
  `planned_workouts`. An imported-origin browser positive therefore cannot be rendered without
  starting/replacing a plan or hand-shaping fixture state, both outside this task's boundary. Source
  reachability and the accepted Backend origin-neutral proof cover the consumer contract, but a
  materialized imported browser replay remains unavailable until PRODUCT admits a canonical fixture
  lifecycle for it.
- No malformed-document browser fixture exists. Fail-closed malformed handling remains covered by
  the completed Backend contract, not by this Product browser replay.
- Arbitrary extras and stable internal section IDs are not fully exposed in the rendered timeline.
  Their lossless preservation remains Backend/source proof; the browser proved the visible repeat,
  target, provenance, label, guidance, date, and route truth.
- Full checkout TypeScript cleanliness is not claimed because unrelated dirty paths still fail the
  repository-wide diagnostic. Task-owned removed-field failures are resolved, focused lint/type
  filtering is clean, and the production build is green.

### Boundaries, Next Owner, And Acceptance

- Preserved: Backend actions/persistence/migration/provenance, manual creation, Calendar copy/move/
  delete, Rest/FIT/history lifecycle, fixtures, shared Design System, hosted state, and unrelated
  dirty work.
- **Next owner:** PRODUCT for any separate canonical imported/malformed fixture admission or broader
  independent acceptance. No Frontend source defect remains in this slice.
- **Blockers:** none for Frontend Implementation DoD. The imported and malformed browser gaps above
  are explicit cross-owner acceptance-fixture gaps.
- Global QA, hosted parity, release readiness, deployment, and Figma acceptance are not claimed.

## Exact Handoff Prompt

```text
ROLE: FRONTEND

Task: Hito Unified Editable Workout Frontend Editor Adoption
Stage: Product UI adoption and focused independent QA
Mode: Tracked
Frontend lane: Product
Canonical item: docs/tasks/backlog/2026-08-15-hito-unified-editable-workout-frontend-editor-adoption.md
Parent decision: docs/tasks/backlog/2026-08-15-hito-unified-editable-workout-document-contract-discovery.md
Backend contract: docs/tasks/backlog/2026-08-15-hito-unified-editable-workout-backend-contract-and-atomic-protection.md

Ivan explicitly authorized this task. Read AGENTS.md, agents/frontend.agent.md,
skills/hito-frontend-design-system/SKILL.md, skills/hito-qa-browser-regression/SKILL.md, the complete
canonical item, and both linked records before the first write. Re-check current dirty state, the
completed Backend response types, and managed fixture admission; preserve all unrelated dirty hunks
byte-for-byte.

Outcome: adopt the completed origin-neutral Backend WorkoutDocument editing contract in the existing
authenticated Product editor. Manual, AI-authored, and imported valid workouts must use one visible
edit/review/confirm path. The UI is a consumer of Backend capability and provenance, never an
origin-policy owner.

Reuse ManualWorkoutPersistedEditControls.tsx, ManualWorkoutConstructorEditor.tsx, the existing
authenticated actions, route capability readback, and Hito Design System controls. Replace the removed
lossy draftInput/draftReview use with:
1. reconstruct plannedWorkoutId, workoutDate, optional provenancePlanId -> document_ready carrying
   document and editProjection;
2. review identifiers plus the full editProjection -> review_ready carrying candidateDocument and
   the token/checksum;
3. confirm the same reviewed editProjection, token, and checksum -> persisted response and refresh.

Render read-only passthrough truth without dropping valid fields. Surface exact Backend blocked/stale
reasons. Preserve explicit review confirmation, cancel, failure behavior, keyboard/focus, and state
refresh. Do not add a client persisted document, a manual/AI/import origin branch, a compatibility
payload, duplicate validation, cache, new design-system primitive, stylesheet recipe, or artificial
performance layer. Keep work proportional and reuse existing components/seams.

Do not modify Backend persistence/actions/migrations/provenance, manual creation, copy/move/delete,
Rest/FIT lifecycle, sidebar, Design System source, fixtures, hosted state, or the separately queued
stored-Rest Move -> Undo defect. Stop and return to PRODUCT if a Backend contract gap, a Design System
change, a new persisted shape, or an unapproved product decision becomes necessary.

Use the existing named QA role for bounded read-only support: first, review the detailed acceptance
matrix before final browser proof; after implementation, independently replay it against a fresh
managed loopback fixture. QA does not edit source. Integrate its findings before closing this Frontend
slice; do not delegate Frontend implementation.

Required proof: source/type resolution of the removed fields; manual/AI/imported positive flows;
title-only rich-document preservation; ordered repeats, targets/provenance/extras; same-row reload;
logged/evidence/skipped/past/Rest/malformed/stale negatives; cancel/failure invariants; desktop and
375px in Light/Dark; keyboard/focus; overflow/console; focused Product checks, Prettier, ESLint,
diff hygiene, and a production build. Record a compact English Tracked receipt in the same item.
Do not claim Global QA, hosted, release, or deployment readiness.
```
