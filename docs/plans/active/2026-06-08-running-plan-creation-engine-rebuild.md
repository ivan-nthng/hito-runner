# Running Plan Creation Engine Rebuild

## Status

in_progress

## Type

plan

## Priority

high

## Next Recommended Role

designer

## Task

Define the Hito inline editable text/editor pattern after workout-document readback acceptance.

## Stage

DESIGNER audit / Hito inline editable text pattern contract.

## Exact Handoff Prompt

```text
ROLE: DESIGNER

Task:
Define the Hito inline editable text/editor pattern after workout-document readback acceptance.

Stage:
DESIGNER audit / Hito inline editable text pattern contract.

Plan:
/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-08-running-plan-creation-engine-rebuild.md

Context:
Generated-plan creation and the first real-user workout-document readback polish are accepted.
Frontend implemented compact generated workout-document readback and a safe editable-heading pilot
in editable manual context. QA passed desktop and exact 375px. Generated rows remain read-only,
backend generated-plan truth is unchanged, and manual editable heading was validated only where
editing is real.

Product wants to avoid fixing design blindly. The next right gate is a shared Hito inline editable
text/editor pattern contract before broader rollout.

Root cause:
Visible symptom: Hito now has a useful editable-heading pilot, but inline editing is not yet a
documented system pattern.
Underlying cause: editable text states, affordances, accessibility, and read-only boundaries are not
centrally owned in Hito DS, so future surfaces could create route-local editors.
Canonical owner: DESIGNER / Hito DS interaction pattern definition first, then FRONTEND
implementation. This is not backend plan semantics and not generated-row editing.

Scope:
1. Read AGENTS.md, agents/designer.agent.md, relevant design/Hito DS skills, this plan,
   docs/tasks/frontend-specs/2026-07-07-generated-plan-real-user-experience-design-pass.md,
   docs/current-product.md, docs/current-system.md, docs/current-functional-map.md, and accepted QA:
   /Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/qa-artifacts/screenshots/2026-07-07/generated-plan-workout-document-readback-polish-qa/
2. Inspect the accepted editable-heading pilot and nearby source context if useful:
   src/components/ui/editable-heading.tsx,
   src/components/manual-workout/ManualWorkoutConstructorEditor.tsx,
   src/components/workout-structure/WorkoutDocumentReadback.tsx,
   src/routes/workout.$date.tsx,
   src/routes/hitoDS.tsx,
   src/components/hito-ds/*,
   src/styles.css.
3. Define the smallest shared Hito inline editable text/editor contract:
   normal/read state, hover state, focus-visible state, edit state, disabled/read-only state,
   validation/error state if needed, mobile/touch discoverability, keyboard behavior, labels, and
   save/cancel expectations.
4. Define exactly where the pattern is allowed in v1:
   editable manual workout titles/section labels/template names or similar true-edit contexts.
   Generated plan preview/detail rows must remain read-only unless backend capability metadata later
   explicitly allows editing.
5. Define how the pattern should appear on /hitoDS if Frontend promotes or keeps a shared component.
6. Decide the first bounded FRONTEND rollout batch only if the design contract is ready. Prefer
   documenting/promoting the existing editable-heading pilot rather than inventing a second inline
   editor.

Validation:
- Design/source/artifact review only; do not edit runtime product code.
- State which accepted QA evidence was used and what remains out of scope.
- If a design spec/doc is updated, run scoped `git diff --check`.

Stop conditions:
- Stop if the pattern would imply generated workout content editing, backend plan semantics, new
  metric truth, provider/FIT comparison, Supabase/schema changes, live OpenAI behavior, or a broad
  design-system redesign.
- Stop if the first implementation batch cannot be bounded to one FRONTEND owner and one validation
  story.
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

Generated-plan backend/product readiness and the first generated-plan workout-document readback
polish are accepted. The next gate is DESIGNER definition of the shared Hito inline editable
text/editor pattern, using the accepted manual editable-heading pilot as evidence while keeping
generated plan rows read-only unless backend capability metadata later explicitly allows editing.
Do not reopen backend generation semantics unless the design pass finds a source-proved blocker.

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
