# Running Plan Creation Engine Rebuild

## Status

in_progress

## Type

plan

## Priority

high

## Next Recommended Role

qa

## Task

Validate generated-plan legacy purge in browser.

## Stage

QA validation / generated-plan legacy purge browser acceptance.

## Exact Handoff Prompt

```text
ROLE: QA

Task:
Validate generated-plan legacy purge in browser.

Stage:
QA validation / generated-plan legacy purge browser acceptance.

Plan:
/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-08-running-plan-creation-engine-rebuild.md

Context:
Backend removed the pre-customer legacy generated-plan/preset stack. Current product truth is the
unified distance-goal AI-authored dated plan flow: presets are UI shortcuts to distanceMeters,
backend owns review/confirm/persistence, and deterministic generated-plan product builders plus
backend Plan Preset discovery are deleted.

Scope:
1. Run the standard QA server/build-output preflight.
2. Browser-validate Quick setup generated-plan preview/create/saved-calendar/workout-detail for:
   - 10K;
   - 21.1K / Half Marathon;
   - 42.195K / Marathon;
   - Custom 15K.
3. Include desktop and exact 375px coverage.
4. Smoke manual workout authoring enough to prove the purge did not break manual review/create.
5. Verify generated workout detail renders child-first repeat readback and no deleted legacy truth:
   `Plan Preset`, `10K Foundation`, `Half Marathon Balanced`, `Marathon Base`,
   `base_endpoint_marker`, `plan_preset`, `running_plan_engine_*_builder` as current product truth,
   `repeat_unit`, `recovery_unit`, fake executable pace, fake personal HR, or raw deterministic
   builder source kinds.
6. Use disposable testers/fixtures and clean them back to zero app-owned residue.
7. Do not implement fixes; route one owner with artifacts if validation fails.

Validation:
- Desktop and exact 375px browser proof for all four goal paths.
- Console warning/error and pageerror counts `0`.
- No page-level horizontal overflow.
- DB/readback proof for created plans and workout detail.
- Disposable cleanup proof returns zero app-owned residue.
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
| Browser/readback acceptance | 10K, Marathon target-time, and Custom 15K target-time preview/create/saved-calendar/workout-detail passed before the pre-customer legacy purge; post-purge browser reacceptance is the current QA gate. |
| Post-create use | Quick setup-created generated plan can open saved calendar, show child-first workout detail, log first generated non-rest workout, and read back completion. |

## Pre-Customer Legacy Purge

Backend removed obsolete generated-plan compatibility now that Hito has no customer-generated
production content to preserve for those paths. Deleted or collapsed current runtime/proof owners:

- deterministic generated-plan product builders;
- backend `Marathon Base` / `base_endpoint_marker` generated-plan identity/readback residue;
- backend Plan Preset discovery/action modules;
- old Plan Preset validator/proof helpers and scenario generators;
- obsolete `plan_preset_v1` / deterministic builder editability fixtures;
- finalized-runtime support for deleted Plan Preset CSVs.

Remaining current truth:

- goal cards are UI shortcuts to `planGoalIntent.distanceMeters`;
- confirm persists the reviewed AI/local-fixture-authored canonical draft and does not call AI again;
- import/export/provider contracts stay only where the app currently uses them;
- browser reacceptance is required before this purge is considered fully QA-closed.

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

The current gate is QA browser reacceptance after the pre-customer legacy purge. Do not select a new
running-plan implementation or source-size cleanup batch from this plan until QA proves the four
visible distance-goal paths still create/read back correctly.

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
