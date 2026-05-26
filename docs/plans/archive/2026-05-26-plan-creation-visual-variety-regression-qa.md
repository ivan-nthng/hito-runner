# Plan Creation Visual Variety Regression QA

## Status

Complete / Closed / Passed for controlled beta

## Owner

QA

## Last Updated

2026-05-26

## Closeout Note

Closed on 2026-05-26 after QA visual variety regression and Running Coach review.

Evidence:

- QA report: `docs/process/hito-plan-creation-visual-variety-regression-qa-2026-05-26.md`
- Screenshot folder: `docs/process/screenshots/plan-creation-visual-variety-regression-2026-05-26/`

QA verdict: Passed.

Running Coach verdict:

- passed for controlled beta
- good enough for real runners
- not a perfect pass
- QA wording was slightly too clean
- no launch blockers

Backlog / polish caveats, not blockers:

- beginner/easy support runs can still be plain; one sampled beginner support run was one block
- marathon and ultra calendar views can still look quieter or repetitive at a glance because detail pages carry more coaching credibility
- future evidence should include stronger mid-cycle calendar views for marathon and ultra
- continue improving support-day detail richness over time

No immediate BACKEND or FRONTEND follow-up is required from this plan. Future work should start only from a concrete product finding, Running Coach finding, or user-facing regression.

## Context

Hito plan creation is currently approved for controlled beta, but the product owner wants one more focused regression pass against the most visible quality risk:

- plans looking repetitive across days and across goal types
- support runs looking like copy-paste shells
- workout detail pages missing meaningful segment structure
- segment rows existing but not giving enough run-specific execution detail
- calendar screenshots hiding weak detail pages

This pass is not a full release-readiness rerun and should not reopen completed implementation by inertia. It is a targeted QA evidence pass to decide whether the current rich plan output still feels coach-authored in real browser surfaces.

Reference QA matrix:

- `docs/process/hito-plan-creation-qa-matrix.md`

Previous evidence:

- `docs/process/hito-plan-creation-richness-qa-results-2026-05-26.md`
- `docs/process/hito-plan-creation-visual-richness-qa-2026-05-26.md`
- `docs/process/screenshots/plan-creation-richness-2026-05-26/`

## Problem Definition

The current risk is not whether plans can be created. The risk is whether generated plans still look like real running coaching after the user opens the plan:

- different runners should not receive the same visible weekly pattern
- different goal families should not collapse into the same Easy/Long/Quality set
- workout detail should show executable segment structure
- every sampled non-rest workout should include clear purpose, segment guidance, and safe target/cue language
- screenshots must make these findings visible rather than relying only on summaries

## Scope

In scope:

- structured plan creation through the current product UI
- saved-mode calendar/home view after confirm
- workout detail view for sampled workouts
- screenshot evidence for every scenario
- browser-first QA using the built-in Codex app/browser
- Safari only if the built-in browser cannot cover the path
- evidence file under `docs/process/`

Out of scope:

- product code changes
- backend generator changes
- prompt/schema changes
- voice-to-plan
- active-plan refresh/apply
- Garmin/Polar feedback
- medical or injury coaching validation beyond existing safety guardrails

## Required Scenarios

QA should create fresh disposable plans for at least these scenarios:

1. Beginner consistency plan:
   - no watch/app
   - no benchmark
   - 3 running days/week
   - fixed rest days
   - goal: build consistency

2. Supported 10K plan:
   - watch/app available
   - usable recent 5K benchmark
   - 4 running days/week
   - goal: balanced 10K

3. Half marathon target-time plan:
   - watch/app available
   - usable recent 5K benchmark
   - 5 running days/week
   - target-time pressure
   - goal: half marathon

4. Low-support marathon plan:
   - no trustworthy benchmark
   - watch unknown or unavailable
   - 4 running days/week
   - goal: marathon

5. Relaxed ultra plan:
   - no watch/app
   - unknown benchmark
   - 4 running days/week
   - goal: ultra marathon

6. Mountain/trail plan:
   - no watch/app
   - unknown benchmark
   - fixed rest days
   - goal: mountain running or trail/mountain context

Optional if time allows:

- one default estimated HR guidance scenario where age is present and no personal HR zones exist

## Screenshot Requirements

Create a new screenshot folder:

`docs/process/screenshots/plan-creation-variety-regression-2026-05-26/`

For each required scenario, capture:

- one calendar/home screenshot showing the visible weekly pattern
- one early support-run detail screenshot
- one long-run detail screenshot
- one scenario-specific workout detail screenshot:
  - 10K: interval/rhythm workout
  - half marathon: tempo/threshold/steady-finish workout
  - marathon: cutback or marathon-specific long workout
  - ultra: time-on-feet or ultra durability workout
  - mountain/trail: trail, hills, downhill, climbing, or hike/run workout

Screenshots must show enough of the detail page to confirm:

- workout title / exact identity when visible
- segment list
- duration/distance or target/cue rows where available
- guidance/cue/hint text
- metric target state

If the whole page cannot fit in one screenshot, capture multiple screenshots for that detail page.

## Pass / Fail Criteria

Pass only if all required scenarios satisfy:

- calendar patterns differ meaningfully across goal families
- no required scenario appears as the same day pattern repeated every week without phase/cutback/long-run progression
- support runs are intentionally simple when appropriate, but not empty shells
- every sampled non-rest workout detail has meaningful segment structure
- sampled segment rows contain executable details, not just generic labels
- interval/tempo/hill/trail/ultra-specific workouts are not collapsed into generic `Quality`
- long runs show goal-appropriate progression or cutback/taper context
- no fake pace precision appears without watch/app plus benchmark support
- HR guidance follows current policy:
  - personal HR only with personal HR-zone truth
  - default estimated HR only when clearly labelled and allowed
  - no unlabeled fake HR precision
- fixed rest days remain respected
- no `[object Object]`, blank detail body, broken route, or missing renderer state appears

Fail if any of these are observed:

- multiple different goal scenarios produce nearly identical visible workout sets
- a sampled non-rest workout detail has no segment list
- a sampled non-rest workout detail has segments but no meaningful run-specific guidance
- ultra, mountain, trail, hills, tempo, or intervals appear as generic shells
- calendar and detail identity disagree
- screenshots cannot substantiate the written verdict

Severity guidance:

- `blocker`: repeated generic plan output across goal families, unsafe metric precision, rest-day violation, missing detail renderer, or multiple sampled non-rest workouts without meaningful segments
- `should fix`: isolated under-rich workout detail, weak support-run copy, or a calendar label that hides useful backend specificity
- `acceptable but watch`: beginner/easy plans that are intentionally conservative but still executable

## QA Execution Notes

Use disposable local tester accounts only. Do not mutate real users.

Use the built-in Codex app/browser first. Safari is a fallback only if the built-in browser cannot cover the flow or the task explicitly needs Safari-specific validation. If Safari is used, reuse the existing Safari window/tab instead of opening new windows.

For each scenario, record:

- account used
- input values
- creation path
- whether review was non-mutating before confirm
- active plan title/date range
- screenshots captured
- visible workout families found
- exact workout identities sampled
- segment count and segment quality observations
- metric target observations
- verdict

## Expected QA Artifact

Create:

`docs/process/hito-plan-creation-visual-variety-regression-qa-2026-05-26.md`

The QA artifact must include:

1. Task
2. Stage
3. Browser Path Preflight
4. Accounts / fixtures used
5. Scenario coverage
6. Screenshot index
7. Calendar variety findings
8. Workout detail / segment findings
9. Metric target findings
10. Issues found
11. Coverage gaps
12. Verdict

Use exact verdict format:

- `Verdict: Passed`
- `Verdict: Failed`

## Exit Criteria

- QA creates the requested plans or documents any fixture/setup blocker.
- QA captures screenshots for every required scenario.
- QA opens and screenshots multiple workout detail pages per scenario.
- QA explicitly states whether repetition or missing segment detail still exists.
- QA report is saved under `docs/process/`.
- If failed, QA provides exact screenshots and scenario names for ARCHITECT/RUNNING COACH/BACKEND follow-up.

## Next Recommended Role

None

## Suggested Next Step

No immediate next slice. Treat the recorded caveats as backlog polish.

## Exact QA Handoff Prompt

```text
ROLE: QA

TASK:
Run the Hito plan creation visual variety regression pass.

STAGE:
QA validation

PLAN:
docs/plans/active/2026-05-26-plan-creation-visual-variety-regression-qa.md

REQUIRED READING:
1. AGENTS.md
2. docs/process/hito-plan-creation-qa-matrix.md
3. docs/process/hito-plan-creation-visual-richness-qa-2026-05-26.md
4. docs/current-product.md
5. docs/current-system.md
6. docs/current-state.md

GOAL:
Create several different plans through the product, open them, and prove with screenshots whether they still look repetitive or under-structured. We specifically want to catch:
- the same workout pattern repeated every day/week
- different goals collapsing into the same visible plan
- non-rest workout details without segment structure
- segments that exist but do not explain the run clearly enough

SCENARIOS:
Run at least:
1. Beginner consistency, no watch, no benchmark, 3 days/week, fixed rest days.
2. Supported 10K, watch/app, recent 5K benchmark, 4 days/week.
3. Half marathon target-time, watch/app, recent 5K benchmark, 5 days/week.
4. Low-support marathon, no benchmark, watch unknown/unavailable, 4 days/week.
5. Relaxed ultra, no watch, unknown benchmark, 4 days/week.
6. Mountain/trail, no watch, unknown benchmark, fixed rest days.

SCREENSHOTS:
Create:
docs/process/screenshots/plan-creation-variety-regression-2026-05-26/

For every scenario capture:
- calendar/home visible plan pattern
- one early support-run detail
- one long-run detail
- one scenario-specific workout detail

The detail screenshots must show segment structure and enough segment/cue/target text to judge whether the workout is actually executable.

BROWSER POLICY:
Use the built-in Codex app/browser first. Safari is fallback only if the built-in browser cannot cover the flow or a Safari-specific issue is being tested. If Safari is needed, reuse the current Safari window/tab; do not open multiple Safari windows. Include a Browser Path Preflight line.

DO NOT:
- change product code
- change generator logic
- use real user accounts
- mark the pass as successful without screenshot evidence
- rely only on calendar screenshots

OUTPUT ARTIFACT:
Create:
docs/process/hito-plan-creation-visual-variety-regression-qa-2026-05-26.md

OUTPUT FORMAT:
1. Task
2. Stage
3. Browser Path Preflight
4. Accounts / fixtures used
5. Scenario coverage
6. Screenshot index
7. Calendar variety findings
8. Workout detail / segment findings
9. Metric target findings
10. Issues found
11. Coverage gaps
12. Verdict

Use exact verdict format:
- Verdict: Passed
- Verdict: Failed
```
