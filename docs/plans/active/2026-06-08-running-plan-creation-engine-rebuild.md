# Running Plan Creation Engine Rebuild

## Status

in_progress

## Type

plan

## Priority

high

## Next Recommended Role

architect

## Task

Hold running-plan rebuild after OpenAI-authored dated generated-plan acceptance.

## Stage

ARCHITECT holding / generated-plan canonical readback accepted.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Reassess the next running-plan gate only after source-size cleanup priority changes or a new provider/FIT/product-readiness blocker is selected.

Stage:
ARCHITECT holding / generated-plan canonical readback accepted.

Plan:
/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-08-running-plan-creation-engine-rebuild.md

Context:
OpenAI-authored dated generated-plan browser/readback acceptance is now complete. QA passed 10K,
Marathon target-time, and Custom 15K target-time preview/create/saved-calendar/workout-detail
coverage with child-first repeat readback, no legacy repeat units, no fake executable pace/HR, clean
desktop and 375px browser proof, and disposable cleanup to zero.

Scope:
- Do not route another running-plan implementation gate by momentum.
- Reassess only if Product reselects running-plan work, provider/FIT comparison becomes the next
  real-user-readiness gate, or fresh source/QA evidence exposes a backend-owned generated-plan
  blocker.
- Keep deterministic builders classified as validator/dev scaffolding, not normal product truth.
- Preserve source-size cleanup as the immediate active execution priority unless Product changes it.

Validation:
- Source/docs audit only unless a new implementation gate is selected.
- If docs/dashboard change, run npm run work:dashboard:no-admin and scoped git diff --check.
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
| Browser/readback acceptance | 10K, Marathon target-time, and Custom 15K target-time preview/create/saved-calendar/workout-detail passed with clean desktop and exact 375px proof. |
| Post-create use | Quick setup-created generated plan can open saved calendar, show child-first workout detail, log first generated non-rest workout, and read back completion. |

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

## Current Hold

No new running-plan implementation gate is selected from this plan right now.

Resume only if one of these triggers appears:

- Product reselects running-plan work after source-size cleanup priority changes.
- Provider/FIT comparison becomes the next real-user-readiness gate.
- Fresh source or QA evidence exposes a backend-owned generated-plan blocker.
- Product asks to rebuild or remove a still-current import/export/provider compatibility boundary.

Do not resume by momentum. Deterministic builders may remain only as validator/dev scaffolding or
local fixtures, not normal product truth. Provider upload/import and provider comparison from actual
evidence remain explicitly unaccepted by the generated-plan QA gates.

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
