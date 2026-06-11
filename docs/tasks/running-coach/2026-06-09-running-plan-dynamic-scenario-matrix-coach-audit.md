# Running Plan Dynamic Scenario Matrix Coach Audit

## 1. Task

Audit the dynamic running-plan scenario matrix for training quality before create-path implementation.

## 2. Stage

RUNNING COACH quality audit / dynamic scenario matrix acceptance before create-path.

## 3. Artifact Reviewed

- `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-08-running-plan-creation-engine-rebuild.md`
- `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/2026-06-09-running-plan-engine-pattern-library-and-composition-grammar.md`
- `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/2026-06-09-running-plan-engine-selected-plan-stimulus-contract.md`
- `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/qa-artifacts/plan-engine-coach-review/2026-06-09-dynamic-scenario-matrix/README.md`
- `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/qa-artifacts/plan-engine-coach-review/2026-06-09-dynamic-scenario-matrix/summary.json`
- `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/qa-artifacts/plan-engine-coach-review/2026-06-09-dynamic-scenario-matrix/coach-review-subset.json`
- Targeted individual scenario files from the same artifact directory for:
  - representative 10K subset cases
  - representative Half Marathon subset cases
  - representative Marathon Base subset cases
  - preview-unavailable `builder_validation_failed` and `long_run_day_blocked` edge cases
  - conservative-load Half Marathon and Marathon Base edge cases

## 4. Current Training Quality

The matrix is technically disciplined and mostly coach-readable:

- metric truth is clean
- endpoints are honest
- runner-level differences are visible
- recovery spacing gates are doing real work instead of silently passing bad compression

But training quality is not uniformly coach-credible across the whole 396-scenario matrix.

Current quality by family:

- `10K`: coach-credible across the supported matrix
- `Half Marathon`: strong in standard-load supported scenarios, weak in conservative-load supported scenarios
- `Marathon Base`: credible in standard-load scenarios, too thin in several conservative-load higher-support scenarios

This is not a “generic fail.” It is a targeted quality miss:

- the engine now knows how to soften load
- but in several conservative-load Half Marathon and Marathon Base cases it softens by removing identity instead of reshaping identity

## 5. Matrix-Level Findings

### What works

- The matrix is not collapsing into one generic plan repeated 396 times.
- Standard-load variants show meaningful deterministic differentiation:
  - 10K `sometimes_runs`: `strides -> tempo -> intervals -> tempo -> strides`
  - 10K `runs_a_lot`: adds `hills`
  - 10K `professional_competitive`: adds a second interval exposure
  - Half `runs_a_lot`: introduces threshold durability
  - Half `professional_competitive`: adds threshold plus a sharper durable-repeatability week
  - Marathon Base `runs_a_lot` and `professional_competitive`: add threshold and hills without turning into a race plan
- Fixed rest-day and long-run preference pressure is not being hand-waved away; blocked cases are surfaced when the schedule becomes dishonest.
- The builder is correctly refusing several compressed 3-day higher-support standard-load scenarios because recovery adjacency breaks.

### Where the matrix is still weak

- Conservative-load logic often removes family identity instead of preserving a softer version of that identity.
- The matrix is more sensitive to runner level than to body/load profile.
- `coach-review-subset.json` is useful, but it is too flattering:
  - it favors successful standard-load examples
  - it underrepresents preview-unavailable logic
  - it underrepresents the weakest conservative-load preview-ready cases

## 6. Family Findings

### 10K

Verdict: acceptable and coach-credible.

Why it works:

- `beginner_new_runner` stays simple with strides-only development and no fake richness
- `sometimes_runs` gets real 10K structure through tempo plus one interval week
- `runs_a_lot` adds hills
- `professional_competitive` adds a second interval week
- conservative-load 10K softens appropriately by dropping intervals/hills and keeping tempo plus strides

Important nuance:

- conservative-load `sometimes_runs`, `runs_a_lot`, and `professional_competitive` all converge to the same gentler `strides + tempo` ladder
- this is acceptable for 10K because the family can still feel coherent without pretending sharper fitness

### Half Marathon

Verdict: mixed; standard-load is credible, conservative-load is not strong enough.

Standard-load `sometimes_runs` now passes:

- `2:strides, 3:tempo, 6:tempo, 9:intervals, 11:tempo, 13:strides`
- family signals include:
  - `half_long_run_durability`
  - `half_durable_repeatability`
  - `half_long_run_steady_finish`
  - `half_specific_durability`
- long-run detail rotates checkpoints and finishes meaningfully

Standard-load `runs_a_lot` and `professional_competitive` are solid:

- threshold is present
- long-run role is visible
- professional version adds a sharper durable-repeatability week

Conservative-load `sometimes_runs`, `runs_a_lot`, and `professional_competitive` are too thin:

- development sequence becomes `2:strides, 3:tempo, 6:tempo, 9:tempo, 11:tempo, 13:strides`
- family signals collapse to:
  - `half_turnover`
  - `half_sustained_support`
  - `half_exact_endpoint`
- long-run detail over 90 minutes shrinks to only one checkpoint intent and one finish intent
- no visible half-specific durability survives the softening

This is the biggest coaching miss in the matrix.

Conservative Half Marathon is currently safe, but it reads too much like “a gentle generic distance plan that ends at 21.1K” rather than “a conservative half-marathon plan.”

### Marathon Base

Verdict: standard-load credible, conservative-load higher-support scenarios underpowered.

Standard-load `sometimes_runs` works:

- tempo support is present
- time-on-feet signals appear
- steady-finish long-run roles exist
- endpoint remains honest and non-race-like

Standard-load `runs_a_lot` and `professional_competitive` are strong:

- threshold and hills appear
- long-run role and time-on-feet signals are visible
- endpoint stays base-only

Conservative-load `sometimes_runs` is still acceptable:

- it simplifies toward strides-only turnover
- this is sparse, but it stays honest for a base family

Conservative-load `runs_a_lot` and `professional_competitive` are too flattened:

- both lose threshold, hills, time-on-feet, and steady-finish signals
- they collapse toward `strides + tempo + endpoint`
- long runs over 90 minutes repeat only one checkpoint intent and one finish intent

That is too much softening for these runner levels. It preserves safety, but it stops feeling like a meaningful Marathon Base progression.

## 7. Runner-Level And Load-Context Findings

### Runner-level differentiation

Strong:

- `10K` clearly distinguishes all four runner levels
- Half and Marathon standard-load paths clearly distinguish `sometimes_runs`, `runs_a_lot`, and `professional_competitive`

Weak:

- conservative-load Half Marathon collapses the three supported runner levels into the same training idea
- conservative-load Marathon Base collapses `runs_a_lot` and `professional_competitive` too far

### Body/load profile effect

The engine is clearly using body/load profile.

But the current behavior is mostly subtractive:

- fewer sharper touches
- less long-run role complexity
- fewer family signals

That is only half-correct.

A good conservative profile should not just remove workouts. It should keep the family promise through softer identities:

- Half Marathon:
  - durability-tempo
  - conservative long-run checkpoint role
  - controlled steady finish only when safe
- Marathon Base:
  - time-on-feet
  - fueling/form checkpoints
  - durable finish role without threshold/hill stress if needed

## 8. Scenario-Specific Findings

### Representative good scenarios

- `matrix__10k__sometimes_runs__average_adult__4d__wednesday_saturday__sunday__normal_monday`
  - good 10K rhythm
  - enough variety
  - not overdone

- `matrix__10k__professional_competitive__young_light__4d__wednesday_saturday__sunday__midweek_wednesday`
  - visibly richer than `runs_a_lot`
  - second interval touch appears
  - still one-touch-per-week discipline

- `matrix__half_marathon__sometimes_runs__young_light__5d__monday_friday__saturday__normal_monday`
  - now clearly half-shaped
  - long-run detail variety is meaningful
  - interval use is bounded and justified

- `matrix__marathon_base__professional_competitive__young_light__5d__monday_friday__saturday__normal_monday`
  - strongest Marathon Base expression in the matrix
  - threshold, hills, and long-run roles coexist without becoming a hidden race plan

### Representative weak preview-ready scenarios

- `matrix__half_marathon__sometimes_runs__older_heavier__3d__none__sunday__midweek_wednesday`
  - preview-ready, but too generic
  - four tempo weeks and no visible half-specific durability
  - long-run detail variety is minimal
  - should stay available only if Backend restores a softer half-specific signal

- `matrix__marathon_base__runs_a_lot__older_heavier__3d__none__saturday__midweek_wednesday`
  - preview-ready, but flattened too far
  - runner level says `runs_a_lot`, but the plan no longer feels meaningfully richer than a cautious `sometimes_runs` base
  - long-run detail repeats one shell too often

- `matrix__marathon_base__professional_competitive__older_heavier__3d__none__sunday__midweek_wednesday`
  - safe, but under-signaled
  - professional identity nearly disappears under conservative load

## 9. Unavailable / Blocked Scenario Findings

Historical scope note:

- this 2026-06-09 audit reflects the pre-auto-extension matrix
- runner-level unavailability for coach-plausible beginner Half or Marathon-Base scenarios is no longer canonical after:
  - `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/2026-06-10-running-plan-universal-no-dead-end-doctrine.md`

### Appropriate unavailable cases

In that historical snapshot, `unsupported_runner_level_for_family` was only appropriate:

- only where the family mapping itself is not yet implemented

`long_run_day_blocked` is appropriate:

- when `preferredLongRunDay = Saturday`
- and Saturday is a fixed rest day
- especially in `wednesday_saturday` 4-day patterns

This is honest and should stay blocked.

### `builder_validation_failed` cases are mostly appropriate

Representative example:

- `matrix__half_marathon__sometimes_runs__young_light__3d__none__saturday__normal_monday`
- validation issue:
  - next running row after intervals becomes long run

Representative 10K example:

- `matrix__10k__runs_a_lot__average_adult__3d__none__unset_default__midweek_wednesday`
- validation issues:
  - next running row after intervals becomes long run
  - next running row after hills becomes long run

Coaching judgment:

- these should remain unavailable
- the builder is correctly refusing an overcompressed pattern rather than pretending it is valid

### One important nuance

The current unavailable individual scenario files are sparse for human coach review.

The useful unavailable evidence currently lives in `summary.json`, not in every per-scenario file.

That is acceptable for QA, but not ideal for future human coach audits.

## 10. Recommended Coaching Changes

1. Preserve the current 10K matrix logic.
2. Preserve current standard-load Half Marathon logic.
3. Preserve current standard-load Marathon Base logic.
4. Improve conservative-load Half Marathon so it retains at least one soft half-specific durability signal.
5. Improve conservative-load Marathon Base for `runs_a_lot` and `professional_competitive` so it retains at least one base-specific long-run or time-on-feet signal.
6. Enrich long-run detail variety for conservative higher-support Marathon Base cases; repeating one checkpoint/finish shell is not enough.
7. Expand `coach-review-subset.json` to include:
  - one preview-unavailable `builder_validation_failed` example
  - one `long_run_day_blocked` example
  - one conservative-load Half Marathon preview-ready weak case
  - one conservative-load Marathon Base preview-ready weak case

## 11. Backend Rules To Encode

### Conservative Half Marathon must not collapse to generic tempo support

For supported conservative-load Half Marathon:

- at least one of these must survive:
  - conservative half-durability tempo identity
  - long-run durability checkpoint role
  - long-run controlled finish role when safe
- `familySignals` must include more than `half_turnover`, `half_sustained_support`, `half_exact_endpoint`

### Conservative Marathon Base higher-support paths must retain base identity

For `runs_a_lot` and `professional_competitive` conservative-load Marathon Base:

- at least one of these must survive:
  - `marathon_base_time_on_feet`
  - `marathon_base_steady_finish`
  - richer long-run checkpoint rotation
- safe softening may remove threshold or hills
- safe softening must not erase all base-specific long-run role

### Long-run detail variety gate

If a preview-ready scenario contains 4+ long runs over 90 minutes:

- one checkpoint/finish shell is not enough
- require at least 2 meaningful checkpoint intents or 2 meaningful finish intents unless the scenario is explicitly ultra-conservative and early-base only

### Human-review artifact gate

Future `coach-review-subset.json` should include:

- at least one weak-but-preview-ready conservative case
- at least one builder-failed compression case
- at least one long-run-day-blocked case

## 12. What Not To Change

- do not weaken metric-truth boundaries
- do not introduce fake pace or fake personal HR
- do not add a 5K benchmark dependency
- do not add a no-watch/no-app branch
- do not solve richness by forcing intervals every week
- do not turn Marathon Base into a hidden marathon race plan
- do not remove recovery-spacing validation just to make more scenarios preview-ready

## 13. Verdict

Not yet coach-credible enough for create-path acceptance.

Reason:

- the matrix is strong in standard-load scenarios
- but conservative-load Half Marathon and higher-support Marathon Base still lose too much family identity
- preview-unavailable logic is appropriately strict
- the remaining problem is coaching richness under constrained load, not technical validity

Decision:

- `Needs BACKEND quality refinement before create-path`

## 14. Next Recommended Role

BACKEND

## 15. Blockers

- Conservative-load Half Marathon needs a softer but still unmistakably half-specific durability signal.
- Conservative-load Marathon Base for `runs_a_lot` and `professional_competitive` needs stronger base-specific long-run/time-on-feet expression.
- `coach-review-subset.json` should be widened so future human review covers unavailable and weak preview-ready edge cases, not only the flattering middle of the matrix.
