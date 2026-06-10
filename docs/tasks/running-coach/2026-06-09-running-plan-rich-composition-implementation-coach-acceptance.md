# 1. Task

Perform final coaching-quality acceptance of the rich running-plan dynamic scenario matrix after Backend implementation and QA artifact cleanup.

# 2. Stage

RUNNING COACH quality acceptance / rich composition matrix before create-path planning.

# 3. Current Training Quality

The rebuilt dynamic matrix is now coach-credible enough for create-path architecture planning.

This is a meaningful improvement over the earlier matrix audit:

- 10K remains clearly differentiated by runner level and load context.
- supported Half Marathon no longer collapses into generic tempo filler in conservative cases
- Marathon Base conservative cases now keep aerobic durability / time-on-feet identity instead of flattening into empty support-only repetition
- blocked scenarios are mostly honest and protective rather than artificially squeezed into unsafe previews

The current matrix is not perfect, but it now clears the coaching-quality bar for planning the create path.

# 4. Findings

## Evidence reviewed

- Active plan:
  - [2026-06-08-running-plan-creation-engine-rebuild.md](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-08-running-plan-creation-engine-rebuild.md)
- Coach-owned doctrine:
  - [2026-06-09-running-plan-rich-composition-matrix.md](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/2026-06-09-running-plan-rich-composition-matrix.md)
  - [2026-06-09-running-plan-engine-pattern-library-and-composition-grammar.md](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/2026-06-09-running-plan-engine-pattern-library-and-composition-grammar.md)
  - [2026-06-09-running-plan-dynamic-scenario-matrix-coach-audit.md](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/2026-06-09-running-plan-dynamic-scenario-matrix-coach-audit.md)
- Dynamic matrix evidence:
  - [summary.json](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/qa-artifacts/plan-engine-coach-review/2026-06-09-dynamic-scenario-matrix/summary.json)
  - [coach-review-subset.json](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/qa-artifacts/plan-engine-coach-review/2026-06-09-dynamic-scenario-matrix/coach-review-subset.json)
  - targeted scenario JSON files referenced by the subset and summary
- Legacy acceptance pack cross-check:
  - [README.md](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/qa-artifacts/plan-engine-scenarios/2026-06-09/README.md)
  - [summary.json](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/qa-artifacts/plan-engine-scenarios/2026-06-09/summary.json)

## Matrix-level judgment

- `468` total scenarios with `247` preview-ready and `221` unavailable is acceptable for this stage because the unavailable share is driven mostly by honest blockers:
  - `unsupported_runner_level_for_family: 78`
  - `insufficient_available_days: 80`
  - `long_run_day_blocked: 33`
  - `builder_validation_failed: 30`
- fake pace and fake personal HR remain absent
- executable ranges are fully resolved
- endpoint honesty remains intact for all supported families
- the artifact folder is now clean and self-regenerating, which makes future coaching review trustworthy

## 10K

Accepted.

What is working:

- `beginner_new_runner` stays simple and safe with strides-only development
- `sometimes_runs` standard-load plans now feel like real 10K plans, not just tempo calendars
- `runs_a_lot` adds hills appropriately
- `professional_competitive` visibly differs through a second interval exposure
- conservative-load 10K softens by dropping sharper work while keeping turnover and endpoint honesty

Coach verdict:

- 10K is ready for create-path planning across supported matrix cases

## Half Marathon

Accepted.

This family was the prior blocker. It is now meaningfully better.

What changed in a coaching-significant way:

- conservative supported Half scenarios now carry explicit half-specific durability signals again
- long-run roles now preserve `durability_checkpoint` and `steady_finish` identity instead of reading as plain duration filler
- standard-load `runs_a_lot` and `professional_competitive` still preserve threshold durability rather than generic tempo repetition

Important example:

- the reviewed conservative `runs_a_lot` Half scenario keeps:
  - `half_long_run_durability`
  - `half_specific_durability`
  - `half_long_run_steady_finish`
  - durability-oriented tempo blocks with executable repeat anatomy

Remaining limitation:

- conservative Half still uses a tempo-led development sequence rather than a richer threshold/interval mix
- that is acceptable here because the underlying durability identity is preserved and the plan remains honest about reduced support

Coach verdict:

- supported Half Marathon is now strong enough for create-path planning

## Marathon Base

Accepted.

What is working:

- standard-load `runs_a_lot` and `professional_competitive` remain clearly richer than `sometimes_runs`
- Marathon Base still avoids leaking into hidden marathon race-plan behavior
- conservative-load cases now keep:
  - `marathon_base_time_on_feet`
  - `marathon_base_steady_finish`
  - richer long-run checkpoint and finish anatomy

Important nuance:

- conservative Marathon Base is intentionally softer, but it no longer feels empty
- this is the right direction for a base family

Coach verdict:

- Marathon Base is now acceptable for create-path planning as a base-building family, not a race-readiness family

## Watch-executable usefulness

Accepted with one caution.

What is already strong:

- key quality workouts show exact warmup/work/recovery/cooldown structure
- long runs now include meaningful opener/main/checkpoint/finish anatomy
- conservative cases still preserve executable structure, not just descriptive copy

What still risks underselling the quality:

- several reviewed row labels remain generic at the row level, even when segment anatomy is rich
- the coaching substance is there, but a future create-path/UI consumer must not flatten it back into generic visible naming

## Subset representativeness

Mostly acceptable, but slightly light.

The `16`-scenario subset now covers:

- all three families
- beginner and supported runners
- standard and conservative load
- one family-level block
- one long-run/rest conflict block
- one compressed/builder-validation block

What is still missing for future human-review efficiency:

- at least one explicit `insufficient_available_days` example
- at least one additional `builder_validation_failed` example from 10K or Marathon Base

This is not a blocker for acceptance. It is a review-quality polish issue.

# 5. Safety Concerns

- Do not relax current unavailable gates just to increase preview-ready counts.
- Do not force intervals into conservative or low-availability scenarios to make plans look richer.
- Do not let Marathon Base drift into target-time or race-readiness signaling.
- Do not turn default HR readback into personal HR truth.
- Keep day-after-long-run recovery protection and non-adjacent quality placement intact.

# 6. Recommended Coaching Changes

No backend coaching-quality repair is required before create-path planning.

Recommended non-blocking polish:

- keep future create-path review surfaces visibly exposing family identity, not only generic row titles
- extend the human-review subset with one more `insufficient_available_days` sample and one more `builder_validation_failed` sample
- during later create-path product work, preserve the current long-run role language so conservative Half and Marathon Base do not visually regress back into filler

# 7. Product Rules To Encode

- Create-path planning may proceed only if it preserves the current backend-owned composition grammar as canonical truth.
- Unavailable scenarios must remain honest product states, not silently degraded generic plans.
- Visible review/create surfaces should expose family-specific workout identity and long-run role strongly enough that the runner can perceive the difference between:
  - 10K turnover/repeatability
  - Half durability
  - Marathon Base time-on-feet durability
- Conservative-load scenarios must continue preserving family identity through softer signals, not by removing identity entirely.

# 8. What Not To Change

- do not weaken metric-truth boundaries
- do not add fake pace from target time
- do not add fake personal HR
- do not add no-watch / no-app branches to rescue unsupported scenarios
- do not force weekly intervals to create visual variety
- do not turn Marathon Base into a hidden marathon race plan
- do not reopen AI-authored normal-path planning

# 9. Acceptance Decision

Accepted for create-path architecture planning.

This is not “perfect training richness achieved.”

This is:

- coaching-quality acceptable
- family-specific enough
- honest enough
- safe enough
- differentiated enough

to move from backend matrix refinement into create-path planning.

# 10. Next Recommended Role

ARCHITECT

# 11. Blockers

None for create-path planning.

Non-blocking caution:

- create-path product surfaces must not visually flatten the now-acceptable backend richness back into generic workout naming.
