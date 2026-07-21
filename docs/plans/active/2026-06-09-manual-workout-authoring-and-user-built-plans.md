# Manual Workout Authoring And User-Built Plans

## Status

completed

## Type

plan

## Priority

high

## Next Recommended Role

product

## Task

Keep the accepted backend-owned manual-template catalog and full AI/manual editor parity closed.

## Stage

FRONTEND implementation and QA / completed.

## Exact Handoff Prompt

```text
ROLE: PRODUCT

Task:
Select the next product track without reopening accepted manual-template behavior.

Stage:
PRODUCT selection / manual authoring plan completed.

The backend-owned catalog, personal-template reuse/delete, built-in hide/restore, full reviewed
AI/manual editor parity, persisted readback, past/Rest denial, responsive browser proof, and cleanup
are accepted. Treat independent future capabilities as new product work.
```

## Completed Backend Prompt

```text
ROLE: BACKEND

Task:
Repair manual workout template behavior around editable structure defaults, user targets, saved
templates, and per-user built-in template visibility.

Stage:
BACKEND implementation / manual template contract correction.

Plan:
/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-09-manual-workout-authoring-and-user-built-plans.md

Context:
Product clarified the desired manual template behavior. Built-in Hito workout templates should not
prefill pace, HR, or RPE targets. They should open as useful editable workout structures with
sensible duration/repeat defaults:
- warm-up;
- main/work block;
- recovery blocks where relevant;
- cooldown;
- repeat count and child blocks for repeats.

The runner chooses pace, HR, or RPE targets manually if they want them. Hito must not invent pace,
personal HR, or target truth.

Root cause and architecture fit:
Visible symptom: Choose template feels like a weak or confusing template system.
Underlying cause: backend/manual template contract does not yet fully distinguish:
1. built-in Hito structural templates;
2. user-entered segment targets;
3. user-owned saved templates;
4. per-user visibility/hiding of built-in templates.
Canonical owner: backend manual workout authoring registry, validation, review contract,
saved-template actions, and per-user template visibility state. Frontend must render backend-owned
template truth.

Required reading:
1. `AGENTS.md`
2. `agents/backend.agent.md`
3. `skills/hito-backend-supabase-contract/SKILL.md`
4. `docs/plans/active/2026-06-09-manual-workout-authoring-and-user-built-plans.md`
5. `src/lib/manual-workout-authoring/templates.ts`
6. `src/lib/manual-workout-authoring/schema.ts`
7. `src/lib/manual-workout-authoring/validator.ts`
8. `src/lib/manual-workout-authoring/actions.ts`
9. `src/lib/manual-workout-authoring/saved-templates.ts`
10. `src/components/manual-workout/manual-workout-authoring-utils.ts` (read-only consumer inspection)
11. `src/components/manual-workout/ManualWorkoutAuthoringControls.tsx` (read-only consumer inspection)
12. `src/components/manual-workout/ManualWorkoutConstructorEditor.tsx` (read-only consumer inspection)

Scope:
1. Preserve the no-fake metric contract:
   - built-in templates must not seed pace;
   - built-in templates must not seed HR;
   - built-in templates must not seed RPE;
   - pace/HR/RPE targets remain user-entered only.
2. Ensure every visible built-in template opens with useful editable structure defaults:
   - durations or distances where appropriate;
   - repeat count;
   - child blocks for repeat sets;
   - warm-up/cooldown where appropriate;
   - no empty non-rest workout templates.
3. Ensure the constructor/review path allows the user to:
   - edit durations/distances;
   - edit repeat count;
   - edit work/recovery block values;
   - add safe additional blocks/sections;
   - remove optional blocks where still valid;
   - review before saving.
4. Treat every confirmed AI-authored workout on today or a future date as fully editable through
   that same constructor, not as a passive AI readback. For every supported canonical AI workout
   shape, the runner must be able to edit title, notes, block identity, duration or distance,
   repeat count, ordered Repeat children, pace, BPM, effort/RPE, and cues; add, remove, duplicate,
   and reorder ordinary blocks and Repeat children; then complete the same review/confirm flow as
   manual authoring. Unchanged AI target truth remains AI provenance; a runner-changed target becomes
   runner-entered truth. Original source/provenance and pre-edit workout history remain durable.
   Past workouts and Rest remain non-editable, and structural validation remains shared with manual
   authoring. Do not introduce an AI-specific reduced editor or source-based edit denial.
5. Preserve user-entered target support:
   - exact/range pace;
   - HR bpm cap/range;
   - RPE 0-10;
   - target source must remain `user_entered`.
6. Confirm or implement user-owned saved template behavior:
   - user can save a reviewed workout as a personal template with a custom name;
   - saved personal templates preserve reviewed structure and any user-entered targets;
   - user can delete their own saved templates.
7. Add or repair per-user built-in template visibility behavior:
   - user can hide built-in Hito templates from their picker;
   - built-in templates are not globally deleted from the registry;
   - if the user hides all built-ins, picker can show only personal templates;
   - provide a backend-owned restore/reset built-in templates path if needed.
8. Do not create frontend-local template truth. Frontend may call backend actions and render
   backend-shaped template lists, but backend owns registry, saved templates, validation, and
   visibility.
9. Keep built-in template labels runner-facing and simple:
   - Rest;
   - Recovery;
   - Easy;
   - Steady;
   - Long Run;
   - Progression;
   - Tempo;
   - Intervals;
   - Hills;
   - Run/Walk.
   Internal identities may remain secondary metadata only.

Constraints:
- Do not add fake pace/HR/RPE defaults to built-in templates.
- Do not infer targets from age, height, weight, watch ownership, title, goal, benchmark, or target
  time.
- Do not physically delete global built-in templates when a user removes them from their picker.
- Do not bypass review/confirm.
- Do not move template truth into frontend state.
- Do not break existing saved personal templates.
- Do not edit frontend UI in this backend task. Inspect frontend consumers read-only, and report the
  smallest FRONTEND follow-up if rendering/action wiring is required.

Validation:
- Update manual template/default proof so it asserts:
  - visible built-ins are not empty;
  - visible built-ins have useful editable structure;
  - built-ins do not seed pace/HR/RPE targets;
  - user-entered targets still pass;
  - fake/non-user-entered targets still fail.
- Validate saved-template save/read/delete behavior if touched.
- Validate built-in hide/restore behavior if implemented.
- Prove AI/manual editor equivalence for the closed canonical AI identity set at source level and
  with representative persisted browser flows: edit an AI workout's pace or BPM/effort, duration or
  distance, Repeat count/child, added block, and removed optional block; review, confirm, reload,
  and verify runner-entered changes plus original AI provenance/history. Also prove past and Rest
  remain non-editable.
- Run:
  - `node --import tsx ./scripts/manual-workout-authoring/template-defaults-proof.ts`
  - `node --import tsx ./scripts/manual-workout-authoring/constructor-contract-proof.ts`
  - `npm run validate-manual-workout-authoring`
  - targeted ESLint for touched backend/manual-workout files
  - `git diff --check -- <touched files>`

Stop conditions:
- Stop if per-user built-in visibility requires a schema/data-retention Product decision beyond
  existing user-scoped settings or template tables.
- Stop if implementing visibility safely requires frontend UI changes in the same slice; report the
  smallest FRONTEND follow-up instead.
- Stop if any change would weaken no-fake-pace/no-fake-HR/no-fake-RPE doctrine, review exactness, or
  saved personal template ownership.
```

## Current Source Of Truth

Manual workout authoring is a current product lane for building and maintaining a user-built active
plan on the same calendar as generated and imported plans. A plan is scheduled workout truth; once a
workout row exists, source kind is provenance and safety metadata, not a separate runner-facing
calendar product.

Canonical owners:

- Backend owns manual workout registry truth, review/confirm, validation, persistence, saved
  templates, per-user template visibility, copy/paste reconstruction, Add/Move/Clear semantics, and
  export/import compatibility.
- Frontend owns interaction and rendering only: it collects draft input, displays backend-shaped
  contracts, and must not invent template, target, schedule, or persistence truth locally.
- Hito DS owns shared visual primitives, color tokens, mobile picker/dialog behavior, and reusable
  presentation seams.

Implemented and accepted product behavior:

- `Build my plan myself` can create the first active manual plan after a reviewed manual workout.
- Saved manual calendars can add reviewed workouts on eligible today-or-future Rest/no-workout dates.
- Manual workouts can be moved, copied/pasted, cleared, exported, and logged through backend-owned
  review/confirm and row-state capability seams.
- Manual Review add renders backend `constructorContract.timeline`, including structural Repeat set
  groups and ordered child rows.
- Repeat set is structural-only. Work/Recover child blocks own structure, optional user-entered
  targets, colors/readback, and comparison semantics.
- Manual target controls are accepted for No target, exact/range pace, HR bpm cap/range, and RPE
  `0-10`; backend preserves `user_entered` target source truth.
- Built-in/default templates must not prefill pace, HR, or RPE. Fake personal HR, default/age HR as
  executable truth, generated manual pace, power, cadence, grade/elevation, route, and terrain targets
  remain unsupported.
- JSON/Markdown export for persisted manual active plans is available through the calendar header
  overflow via the canonical active-plan export seam.

## Accepted Closeout

The backend Manual Template Contract Correction and frontend catalog adoption are complete.

Root cause:

- Backend now separates built-in structural templates, runner-entered targets, personal saved
  templates, ownership/deletion, and per-user built-in visibility.
- Persisted manual and AI-authored workouts reconstruct through the same full constructor without
  losing ordered Repeat children, primary target mode, target provenance, notes, or cues.
- The picker renders the backend-owned catalog and calls the existing personal delete and per-runner
  built-in hide/restore actions; the static built-in list no longer owns picker behavior.

Current decision:

- Built-in Hito templates are editable structural starting points, not personal metric prescriptions.
- Built-ins must provide useful structure: warm-up, main/work blocks, recovery where relevant,
  cooldown, repeat count, and child blocks for repeats.
- Built-ins must not seed pace, HR, or RPE.
- Personal saved templates should preserve reviewed structure and any user-entered targets.
- Hiding a built-in from the picker is per-user visibility, not global registry deletion.
- Runner-edited RPE is a valid single effort command in reviewed and saved readback; unchanged
  AI-authored target values keep AI provenance.

## Accepted Chain Ledger

| Area | Accepted current truth |
| --- | --- |
| One calendar model | Manual, generated, selected, preset, and imported rows share the saved calendar; source kind is provenance. |
| Manual first plan | First reviewed manual workout can create `manual_user_built_plan_v1`. |
| Manual Add/Move/Clear | Backend capability metadata owns eligible dates/rows; frontend renders backend affordances. |
| Copy/Paste | Manual copy/paste reconstructs through backend-owned manual draft/review, not raw row cloning. |
| Constructor contract | Backend `manual_workout_constructor_contract_v1` and `constructorContract.timeline` are accepted. |
| Repeat model | Ordered repeat `children[]` is canonical; parent Repeat set is structural-only. |
| Target inputs | Per-segment user-entered pace/HR/RPE v1 is accepted; no fake metric truth. |
| Planned workout language | Runner-facing labels are backend-owned through `plannedWorkoutLanguage`. |
| Workout/section colors | Hito DS owns workout and section color tokens; Repeat set has no standalone color token. |
| Generated-plan dependency | Generated-plan child-first readback and Quick setup create/use are accepted separately in the running-plan plan. |

## Boundaries

Do not reopen in this plan unless fresh source proof contradicts accepted behavior:

- primitive-token cleanup;
- mobile fullscreen dropdown rollout;
- Hito DS color-token contract;
- OpenAI-authored generated-plan acceptance;
- child-first repeat compatibility purge;
- local QA runtime relocation.

Still future-only or separate lanes:

- recurrence;
- Restore/Put back/Redo UI;
- PDF/watch export;
- QR/share/import-from-share;
- coach/organization authoring;
- provider/FIT comparison enhancements beyond accepted planned-vs-actual input compatibility;
- frontend UI changes for template visibility unless backend first exposes the safe contract.

Confirmed-workout ownership is shared product truth, not a future manual-only lane: every confirmed
non-rest workout on today or a future date can enter the reviewed persisted content-edit flow
regardless of manual/generated/imported/replacement origin, logs, completion, or evidence. Past
workouts are not editable. Review/confirm, auth, stale protection, atomic persistence, original
provenance, and durable pre-edit history remain mandatory. Current policy, capability projection,
reconstruction, atomic persistence, and workout-detail UI implement that rule; the active manual
template gate in this plan does not reopen it.

## Compression Note

This active plan was compressed on 2026-07-02 under the source-size deletion-first rule. The removed
material was historical prompts, copied closeout chains, and transcript-like validation detail already
superseded by current docs, accepted validators, or this compact ledger. No runtime behavior,
product code, QA evidence, scripts, schemas, Supabase data, or generated output changed.
