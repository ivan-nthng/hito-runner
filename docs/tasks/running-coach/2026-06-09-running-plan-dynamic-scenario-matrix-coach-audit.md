# Running Plan Dynamic Scenario Matrix Coach Audit

Date: 2026-06-09
Owner: Running Coach
Status: historical audit; superseded by later rich-composition and no-dead-end repairs
Stage: RUNNING COACH quality audit / dynamic scenario matrix acceptance before create-path

Doctrine digest:
`/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/running-coach-doctrine-digest.md`

Evidence preserved:

- `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-08-running-plan-creation-engine-rebuild.md`
- `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/2026-06-09-running-plan-engine-pattern-library-and-composition-grammar.md`
- `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/2026-06-09-running-plan-engine-selected-plan-stimulus-contract.md`
- `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/qa-artifacts/plan-engine-coach-review/2026-06-09-dynamic-scenario-matrix/README.md`
- `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/qa-artifacts/plan-engine-coach-review/2026-06-09-dynamic-scenario-matrix/summary.json`
- `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/qa-artifacts/plan-engine-coach-review/2026-06-09-dynamic-scenario-matrix/coach-review-subset.json`

## Final Verdict

At this point the dynamic matrix was **not yet coach-credible enough for create-path acceptance**.

The matrix was technically disciplined: metric truth was clean, endpoints were honest, runner-level
differences were visible, and recovery-spacing gates refused dishonest compression. The remaining
failure was coaching richness under constrained load, not technical validity.

Family verdicts:

- `10K`: acceptable and coach-credible across supported cases.
- `Half Marathon`: credible in standard-load supported scenarios, too generic in conservative-load supported scenarios.
- `Marathon Base`: credible in standard-load scenarios, too thin in conservative-load higher-support scenarios.

Historical scope note:

- This audit reflects the pre-auto-extension matrix.
- Runner-level unavailability for coach-plausible beginner Half or Marathon Base scenarios is no
  longer canonical after the no-dead-end doctrine.

## Findings To Preserve

The accepted parts of the matrix should not be regressed:

- 10K supported paths showed real progression through strides, tempo, intervals, and hills where support allowed.
- Standard-load Half Marathon included threshold/durability signals and honest `21100m` endpoint behavior.
- Standard-load Marathon Base included time-on-feet, threshold/hills for stronger runners, and base-only endpoint language.
- `builder_validation_failed` and `long_run_day_blocked` examples were mostly appropriate when recovery adjacency or fixed-rest constraints made the preview unsafe.

The weak cases drove later repair work:

- Conservative Half Marathon collapsed toward generic tempo plus endpoint instead of preserving half-specific durability.
- Conservative `runs_a_lot` and `professional_competitive` Marathon Base lost threshold, hills, time-on-feet, and steady-finish identity.
- Long runs over 90 minutes repeated too few checkpoint/finish intents.
- `coach-review-subset.json` was too flattering and underrepresented unavailable or weak preview-ready cases.

Representative weak anchors:

- `matrix__half_marathon__sometimes_runs__older_heavier__3d__none__sunday__midweek_wednesday`
- `matrix__marathon_base__runs_a_lot__older_heavier__3d__none__saturday__midweek_wednesday`
- `matrix__marathon_base__professional_competitive__older_heavier__3d__none__sunday__midweek_wednesday`

## Rules Preserved In The Digest

- Do not weaken metric-truth boundaries.
- Do not introduce fake pace or fake personal HR.
- Do not solve richness by forcing intervals every week.
- Do not turn Marathon Base into a hidden marathon race plan.
- Do not remove recovery-spacing validation just to make more scenarios preview-ready.
- Conservative load should soften family identity, not erase it.
- Long-run detail variety matters when long runs exceed roughly 90 minutes.

## Supersession

The blocking conservative-load richness findings were superseded by later rich-composition and
anti-flatness repair acceptance. Keep this file as historical evidence of the pre-repair failure
mode and of the strict safety/metric boundaries that the repairs had to preserve.
