# Running Plan Creation Engine Rebuild

## Status

in_progress

## Type

plan

## Priority

high

## Next Recommended Role

backend

## Task

Align active-plan workout content-editability readback before the next design batch.

## Stage

BACKEND implementation / active-plan content-edit capability correction.

## Exact Handoff Prompt

```text
ROLE: BACKEND

Task:
Align active-plan workout content-editability readback before the next design batch.

Stage:
BACKEND implementation / active-plan content-edit capability correction.

Plan:
/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-08-running-plan-creation-engine-rebuild.md

Context:
Generated-plan creation, generated workout-document readback, and the shared Hito inline editable
text pattern are accepted at the design/frontend implementation boundary. Frontend replaced the
route-local editable-heading pilot with shared `InlineEditableText` and `InlineReadOnlyText`,
documented the local inspector task-target behavior on `/hitoDS/patterns#inline-editable-text`, and
kept generated workout readback itself read-only.

Architecture closeout found a separate active-plan editability leak before the next design polish
batch: workout detail can advertise `Edit training` from broad active-plan editability metadata even
though the persisted edit action accepts only manual user-built active plans. Backend still blocks
unsupported non-manual edits, so this is not fake persistence, but the read model can teach the
frontend the wrong capability.

Root cause:
Visible symptom: future generated/imported/refresh workout rows may expose `Edit training` before
the backend edit action rejects them.
Underlying cause: active-plan editability/readback treats `edit_workout` too much like Add/Clear/Move
row-state capability instead of manual content-edit capability.
Canonical owner: backend active-plan editability/source-capability read model first; frontend should
only render backend-shaped capability truth.

Scope:
1. Read AGENTS.md, agents/backend.agent.md, skills/hito-backend-supabase-contract/SKILL.md, this plan,
   docs/current-product.md, docs/current-system.md, docs/current-functional-map.md, and the inline
   editable text spec:
   /Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/frontend-specs/2026-07-07-hito-inline-editable-text-pattern-contract.md
2. Inspect these source seams:
   src/lib/active-plan-workout-editing/policy.ts,
   src/lib/active-plan-workout-editing/source-capabilities.ts,
   src/lib/training-api.ts,
   src/lib/manual-workout-authoring/edit-workout.ts,
   src/routes/workout.$date.tsx.
3. Align the backend editability/readback contract so `edit_workout` / content edit is allowed only
   for backend-supported persisted manual edit contexts. Preserve Add/Clear/Move direct row-state
   capabilities for accepted non-manual rows.
4. Ensure row-level `sourceEditing.canEditContent` and `editContentReason` are false/explicit for
   generated, imported, refresh, unsupported, unsafe-reconstruction, logged, evidence-backed, rest,
   and protected rows.
5. Ensure plan-level `workoutEditing.editWorkout` does not imply generated/imported/refresh content
   editing if the persisted edit action will reject those sources.
6. If the frontend must additionally consume an existing row-level capability such as
   `sourceEditing.canEditContent` to hide `Edit training`, stop after the backend/readback fix and
   return one exact FRONTEND follow-up prompt. Do not silently broaden this backend slice into a
   frontend implementation.

Validation:
- Run targeted lint/type checks for touched backend files.
- Run `npm run validate-manual-workout-authoring`.
- Run the active-plan editability/source-capability validator if one exists; if not, add/adjust the
  smallest existing backend proof that covers manual edit allowed and generated/imported content edit
  blocked.
- Run `npm run build` if runtime exports/types changed.
- Run `git diff --check`.
- Do not run browser QA unless backend changes expose a frontend route behavior that needs proof.

Stop conditions:
- Stop if the fix would weaken Add/Clear/Move, drag/drop, protected history, logged/evidence-backed
  row protection, or manual persisted edit review/confirm.
- Stop if generated/imported/refresh content editing is actually intended; that requires Product and
  Running Coach/Backend acceptance before UI exposure.
- Stop if this requires Supabase schema/data mutation, live OpenAI/provider calls, or broad active-plan
  lifecycle redesign.
```

## Current Source Of Truth

Generated plan creation now follows one backend-owned path for visible Quick setup goals. Preset
distances are convenience inputs, not separate product engines. The normal product path is:

`runner setup -> planGoalIntent -> OpenAI/local-fixture-authored dated draft -> backend validation
and normalization -> reviewed canonical draft -> explicit confirm -> persisted plan_cycles and
planned_workouts`.

Backend owns goal normalization, safety/feasibility warnings, AI prompt/response contracts,
normalization, review tokens, confirm exactness, persistence, import/export compatibility, and metric
truth. Frontend collects input and renders backend-shaped preview/readback; it must not invent pace,
HR, feasibility, or plan-generation truth locally.

Accepted runner-facing workout language:

- Workout types: Rest, Recovery, Easy, Steady, Long Run, Progression, Tempo, Intervals, Hills,
  Run/Walk.
- Block roles: Warm-up, Run, Walk, Work, Recover, Finish, Cooldown, and structural-only Repeat set.
- Repeat set repeats ordered `children[]`; children own duration/distance, optional user-entered or
  generated-supported targets, colors/readback, and comparison semantics.

## Accepted Generated-Plan Chain

| Gate | Accepted current truth |
| --- | --- |
| `planGoalIntent` | Preset and custom goals can include distance, optional finish time, optional outcome pace, and optional target date/race day. |
| Derived pace readback | Backend may show runner-entered outcome pace and distinct finish-time-derived pace as goal/review truth only. |
| Child-first block reducer | `planned-workout-block-contract.ts` is the shared reducer for language, readback, export/import, rich checks, and provider comparison input. |
| Legacy repeat purge | `repeat_unit` / `recovery_unit` and persisted sibling `work` / `recovery` compatibility are removed from live persisted/export/readback truth after Product-authorized data discard. |
| Quick setup all-goal create | 10K and Half no-benchmark create; Marathon is no longer a vague Marathon Base fallback; Custom requires distance and blocks/reroutes before invalid create. |
| Generated-plan richness | Backend, Running Coach, and source/CLI QA accepted richer generated blocks over `planGoalIntent` plus child-first repeats. |
| Browser/readback acceptance | 10K, 21.1K, 42.195K, and Custom 15K preview/create/saved-calendar/workout-detail are QA-accepted after the pre-customer legacy purge and early-phase dosing hardening. |
| Post-create use | Quick setup-created generated plan can open saved calendar, show child-first workout detail, log first generated non-rest workout, and read back completion. |
| Early-phase dosing and endpoint dynamics | W1-W4 conservative adaptation, exact selected-distance endpoint dynamics, child-first repeats, impossible/aggressive typed outcomes, and no-fake pace/HR truth are accepted. |

## Pre-Customer Legacy Purge

Backend removed obsolete generated-plan compatibility now that Hito has no customer-generated
production content to preserve for those paths. Deleted or collapsed current runtime/proof owners:

- deterministic generated-plan product builders;
- backend `Marathon Base` / `base_endpoint_marker` generated-plan identity/readback residue;
- backend Plan Preset discovery/action modules;
- old Plan Preset validator/proof helpers and scenario generators;
- obsolete `plan_preset_v1` / deterministic builder editability fixtures;
- finalized-runtime support for deleted Plan Preset CSVs.

Accepted current truth:

- goal cards are UI shortcuts to `planGoalIntent.distanceMeters`;
- confirm persists the reviewed AI/local-fixture-authored canonical draft and does not call AI again;
- import/export/provider contracts stay only where the app currently uses them;
- browser/readback QA accepted the current 10K, 21.1K, 42.195K, and Custom 15K happy paths after the
  purge and early-phase dosing hardening.

## Generated-Plan Product-Readiness Closeout

QA accepted the generated-plan early-phase dosing and readback gate on 2026-07-06:

- 10K, 21.1K, 42.195K, and Custom 15K visible goal paths preview/create saved calendars and open
  generated workout detail.
- W1-W4 conservative/no-benchmark adaptation stays base-first and avoids early over-specificity.
- Selected-distance endpoint exactness, coach-authored endpoint dynamics, child-first repeats,
  structural-only repeat parents, impossible/aggressive typed outcomes, and review/confirm exactness
  remain enforced.
- No fake executable pace, fake personal HR, parent repeat targets, `repeat_unit` / `recovery_unit`,
  or deterministic-builder product truth appeared.
- Manual authoring smoke and disposable cleanup-to-zero passed.

Accepted artifact folder:

`/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/qa-artifacts/screenshots/2026-07-06/generated-plan-early-phase-dosing-qa/`

Post-acceptance source-size cleanup reduced `scripts/validate-ai-generated-running-plan-creation.ts`
from `2651` to `1370` lines by extracting shared proof helpers into tracked
`scripts/ai-generated-running-plan-proof-helpers.ts`; `scriptActiveDecomposition1500` is now `0`
and untracked maintained source is `0`.

## Generated-Plan Workout-Document Readback Closeout

FRONTEND and QA accepted the first real-user generated-plan UX polish on 2026-07-07:

- generated preview/detail now use compact workout-document readback with structure strip, semantic
  stripes, child rows, and quiet notes/cues;
- proof/debug copy such as endpoint proof, backend fallback/default wording, source-kind labels, and
  no-fake proof labels no longer dominates runner-facing readback;
- generated rows remain read-only and backend generated-plan truth is unchanged;
- manual editable heading was validated only in editable manual constructor context;
- Today generated-row lifecycle CTA still shows `Mark as done` and opens completion;
- desktop and exact 375px overflow, console/pageerror/bad HTTP, impossible-state zero-persistence,
  and disposable cleanup proof passed.

Accepted artifact folder:

`/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/qa-artifacts/screenshots/2026-07-07/generated-plan-workout-document-readback-polish-qa/`

## Inline Editable Text Pattern Checkpoint

FRONTEND implemented and QA accepted the Hito inline editable text pattern on 2026-07-07:

- `src/components/ui/inline-editable-text.tsx` now owns `InlineEditableText` and
  `InlineReadOnlyText`;
- the manual workout constructor title uses the shared editable primitive instead of a local
  editable-heading pilot;
- `/hitoDS/patterns#inline-editable-text` documents direct edit, read-only generated truth, and a
  non-mutating local inspector task-target example;
- local inspector task targeting is local-only in v1 and does not create Admin Capture rows, backend
  schema, or fake persisted tasks;
- generated preview/detail/readback surfaces remain read-only.

Architecture closeout found a separate active-plan capability leak: workout detail currently gates
`Edit training` from broad active-plan editability metadata, while the persisted edit action supports
manual user-built active plans only. The next gate is therefore backend editability/readback
correction before selecting another design polish batch.

## OpenAI-Authored Dated Acceptance

QA accepted the final browser/readback gate on 2026-06-30:

- 10K no benchmark preview/create/saved calendar/workout detail passed with `84` planned workouts.
- Marathon with target date `2026-11-01` and finish time `4:30:00` passed with `126` planned
  workouts.
- Custom 15K with target date `2026-09-13` and finish time `1:25:00` passed with `77` planned
  workouts.
- Custom persisted as `distance_build`, not `half_marathon`.
- Marathon persisted as `marathon` / `target_time`, not Marathon Base.
- Marathon and Custom include structural Repeat sets with ordered `children[]`.
- Persisted `planned_workouts.steps` and `plan_preferences` had zero legacy repeat-unit hits.
- No fake executable pace, fake personal HR, or parent Repeat targets appeared.
- Desktop and exact 375px overflow checks passed; console/pageerror/bad HTTP response counts were
  `0`; disposable testers cleaned up to zero.

Accepted artifact folder:

`/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/qa-artifacts/screenshots/2026-06-30/openai-authored-dated-readback-cleanup-qa-rerun/`

Historical caution:

`openai-authored-dated-final-browser-acceptance-qa` is a pre-rerun failed artifact and must not be
used as acceptance evidence.

## Current Gate

Generated-plan backend/product readiness, generated-plan workout-document readback polish, and the
Hito DS inline editable text pattern are accepted. The current blocker before the next design polish
batch is active-plan content-editability readback: backend must align `edit_workout` capability with
the persisted manual edit contract so generated/imported/refresh rows do not appear editable before
the backend rejects them. Do not reopen backend generation semantics.

Provider upload/import and provider comparison from actual evidence remain explicitly unaccepted by
the generated-plan QA gates.

## Boundaries

Current product truth:

- Preset goals normalize into the same generated-plan path as custom distance goals.
- AI/local-fixture authorship is preview-time/review-time only; confirm persists the reviewed
  canonical draft and does not call AI again.
- Backend rejects unsafe/malformed drafts rather than silently persisting deterministic substitutes.
- Pace and HR remain metric-truth constrained; target time alone is not executable pace truth, and
  age-estimated HR is not personal HR truth.
- `training-plan-v2`, persisted `planned_workouts.steps`, export/import, and provider comparison
  input remain canonical compatibility surfaces.

Out of scope for this hold:

- new frontend polish without a product-readiness blocker;
- provider/FIT upload acceptance;
- broad engine redesign;
- new workout taxonomy;
- resurrecting deterministic builders as product truth;
- changing Supabase schema or production data.

## Compression Note

This active plan was compressed on 2026-07-02 under the source-size deletion-first rule. Removed
content was superseded implementation prompts, closeout transcripts, stale deterministic-builder
handoffs, and repeated validation detail. The current accepted generated-plan truth and hold boundary
are preserved here; no runtime behavior, product code, QA evidence, scripts, schemas, Supabase data,
or generated output changed.
