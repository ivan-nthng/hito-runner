# Running Plan Anti-Flatness Repair Coach Acceptance

Date: 2026-06-11
Owner: Running Coach
Status: Accepted after Backend long-horizon anti-flatness repair
Plan: `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-08-running-plan-creation-engine-rebuild.md`
Previous audit: `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/2026-06-10-running-plan-no-dead-end-long-horizon-coach-audit.md`
Primary doctrine: `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/2026-06-10-running-plan-universal-no-dead-end-doctrine.md`

## Scope

This acceptance reviews coaching quality only:

- long-horizon anti-flatness repair effect
- family identity preservation
- soft midweek phase meaning
- long-run role balance
- conservative 10K late-plan richness
- coaching risk from the repair

It does not review:

- CLI/build/browser behavior
- Supabase/DB behavior
- create/confirm/persist
- frontend rendering

## High-Level Verdict

The anti-flatness repair clears the previous coaching blocker.

The repaired long-horizon `Marathon Base` beginner and conservative plans now show enough soft midweek phase meaning to be coach-credible. The new `steady_aerobic_run` and `steady_support_week` additions improve phase shape without turning `Marathon Base` into hidden marathon race preparation.

The conservative long-horizon `10K` repair also closes the late-plan identity desert that previously made the second half of the block read too flat.

## Repaired Scenario Assessment

### 1. `matrix__marathon_base__beginner_new_runner__young_light__3d__none__sunday__normal_monday`

Accepted.

Why:

- the previous empty middle is now broken up by `9:strides`, `17:strides`, `25:steady_aerobic_run`, `33:steady_aerobic_run`, `39:strides`
- `steady_support_week` appears in weeks `25` and `33` instead of leaving the entire bridge to the long run
- long-run roles still carry the main aerobic story, but they are no longer the only source of phase meaning
- this is still conservative and sparse, which is appropriate for `beginner_new_runner` on `3d`

### 2. `matrix__marathon_base__beginner_new_runner__young_light__5d__monday_friday__sunday__normal_monday`

Accepted.

Why:

- `5:strides`, `11:strides`, `15:steady_aerobic_run`, `23:strides` is not flashy, but it is enough visible progression for a safe `5d` beginner base plan
- the plan now reads as: early turnover, mid-block steady support, late sharpening, not just easy/recovery/long filler
- the added support touch is still soft enough to preserve the base-only contract

### 3. `beginner_marathon_base`

Accepted.

Why:

- the acceptance-pack alias now carries the same repaired shape as the matrix scenario
- this closes the previous concern that the canonical acceptance fixture itself was flat

### 4. `matrix__marathon_base__beginner_new_runner__older_heavier__5d__none__unset_default__normal_monday`

Accepted.

Why:

- `7:strides`, `14:strides`, `21:steady_aerobic_run`, `27:steady_aerobic_run`, `31:strides` gives the plan more than one soft bridge signal
- the conservative/heavier context is still visibly softened, but it is no longer bland
- `steady_support_week` shows up without adding sharpness or unsafe density

### 5. `matrix__marathon_base__runs_a_lot__older_heavier__3d__none__sunday__midweek_wednesday`

Accepted.

Why:

- the added steady support at weeks `17`, `26`, `37`, and `45` fixes the long dead zone from the previous audit
- the plan now reintroduces midweek identity across the full-year block instead of front-loading it all before week `10`
- tempo stays limited and early, which keeps the plan in `Marathon Base` territory rather than drifting toward marathon-specific race work

### 6. `matrix__10k__sometimes_runs__older_heavier__3d__wednesday_saturday__unset_default__midweek_wednesday`

Accepted.

Why:

- the new week `13:tempo` reminder meaningfully improves the late middle of the plan
- the block now reads as repeated turnover plus tempo support, then a later reminder before taper
- this keeps the plan conservative without letting the second half collapse into support-only filler

## Coaching Conclusions

### Marathon Base anti-flatness

The repair is sufficient because it adds:

- visible soft midweek bridge work
- repeated family identity across long horizons
- support-week phase meaning between early turnover and late steady-finish long runs

It does not cross the line into:

- marathon race-readiness
- aggressive threshold loading
- interval-heavy weeks
- fake marathon-pace specificity

### Long-run role balance

Long runs remain the primary durability carrier, but they are no longer overloaded as the only rich feature.

That balance matters. A long-horizon base plan can stay simple, but it should still show:

- early turnover reminders
- occasional steady support
- visible phase changes before taper

The repaired scenarios now do that.

### Conservative 10K anti-flatness

The added late reminder is enough. Conservative `10K` does not need frequent intensity, but it does need at least one late-cycle identity check so the plan does not visually go dead after the first third.

## Risks Checked

No new blocker-level coaching risk was found in the repaired scenarios:

- not too aggressive
- not under-recovered
- not misleadingly named
- not too close to marathon race-plan territory
- not dependent on fake pace or fake personal HR

## Optional Polish

Not a blocker, but worth preserving in future doctrine:

- if a long-horizon `Marathon Base` beginner plan exceeds roughly `36-40` weeks, keep at least two non-adjacent soft support weeks after the midpoint
- if a conservative `10K` plan exceeds roughly `18-20` weeks, keep one late support reminder before taper

These are already directionally present in the repaired scenarios and should remain protected by future validator logic.

## Recommendation

Pass to `ARCHITECT`.

This repair closes the prior coaching-quality blocker and is strong enough for the next product gate, as long as the base-only boundary and metric-truth guardrails remain unchanged.
