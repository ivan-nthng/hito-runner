# Watch-Executable Long-Run Strategies

## Status

completed

## Type

plan

## Priority

high

## Next Recommended Role

architect

## Task

Keep the sole AI-authored provider contract aligned with the accepted long-run compiler policy and
close the recurrent missing-anatomy reliability gate.

## Stage

BACKEND fix-forward and integrated validation complete. The provider contract now states the
time-based anatomy threshold unambiguously, and two authorized real-provider results reached signed
review through the unchanged compiler.

## Track Tags

`running-engine`, `long-run`, `watch-execution`, `marathon`

## Product History And Current Truth

The accepted [watch-execution doctrine](../running-coach/2026-07-20-watch-execution-primary-target-doctrine.md)
already establishes that a 50- or 60-minute `long_aerobic_run` may remain one continuous body leaf
with one numeric target. It also rejects cosmetic equal splits and requires meaningful anatomy for
longer sessions.

The Running Coach policy now resolves sequential strategies. `long_aerobic_run`, `cutback_long_run`,
and `taper_long_run` remain one-command workouts. `long_run_with_steady_finish` and
`marathon_steady_specificity` may have one controlled same-mode change. `progression_run` may use a
bounded two- or three-stage ladder. Race-execution strategy remains future-only and cannot be
claimed by Marathon Base.

On 2026-07-23, a real `openai_responses_api` preview reached the compiler and was rejected with
`ai_authored_plan_first_long_run_target_mode_mixed`. Backend traced this to a contradictory provider
prompt: it encouraged BPM for the long body and pace for pace-specific fragments while also
prohibiting mixed substantive modes. The compiler rejection was correct and remains in force.

The provider contract now requires the AI to choose one substantive mode before authoring a long
run: BPM changes only to BPM, and pace changes only to pace. Deterministic contract and regression
proof, independent QA, build, and local runtime checks passed. A later real UI provider flow also
reached signed review, one explicit confirm, and persisted readback without a retry, repair,
fallback, or fixture leakage.

## Canonical Owners

- Coaching source of truth: [watch-execution doctrine](../running-coach/2026-07-20-watch-execution-primary-target-doctrine.md).
- Shared enforcement: [long-run-execution-policy.ts](../../../src/lib/long-run-execution-policy.ts).
- Generated compiler: [ai-authored-plan-first-compiler.ts](../../../src/lib/ai-authored-plan-first-compiler.ts).
- Manual construction: [validator.ts](../../../src/lib/manual-workout-authoring/validator.ts).

## Accepted Policy

- Continuous `long_aerobic_run` at 60 minutes or less is valid. Longer long-run anatomy must use
  meaningful executable structure, never equal visual splitting.
- Sequential targets require an identity-approved coaching purpose and meaningful stage boundary.
  Current long-run identities use time-based stages by default; distance stages require a genuine
  race or course purpose and validated pace truth.
- Current long-run strategies are pace-led or BPM-led per workout. Mixed pace/BPM strategy is not
  available until a future dedicated race-execution identity exists.
- Hydration remains targetless and non-runnable. It may separate meaningful stages but cannot
  satisfy anatomy by itself.
- The complete decision and examples remain in the canonical doctrine; this backlog item does not
  duplicate them.

## Accepted Implementation History

The Backend slice makes generated compiler validation and manual construction agree with the
accepted policy through one shared enforcement owner. It rejects invalid authored anatomy without
inventing blocks, targets, or progression. Historical saved plans remain readable and unchanged.

Owner-level proof covered the old prompt discriminator, same-mode and conflict matrices, fixture
isolation, review/confirm, generated/manual validators, build integrity, and independent QA. That
accepted baseline is retained.

Implementation DoD: Passed.

The previous live canary did not test the provider contract because its direct CLI silently imposed
`45_000 ms` while the product runtime uses `timeoutMs: 0`. Backend proved that path, removed the
implicit deadline, requires live callers to declare either a bounded timeout or `0`, rejects
malformed and timer-overflow inputs before dispatch, and records effective timeout and abort
provenance in sanitized evidence. Deterministic timeout, cancellation, no-deadline, plan-contract,
build, and independent QA checks passed. No paid provider call was used for this repair.

On 2026-07-26, a completed and parseable real-provider response exposed a narrower contract defect:
one 95-minute `long_aerobic_run` had no Hydration event. The prompt mentioned the threshold, but
described it as belonging to an identity, did not tell the model how to total Repeat duration, and
later described Hydration placement as discretionary. The wire-schema description did not carry the
threshold at all. A successful comparison response never crossed 90 minutes, which isolated the
provider boundary from the correctly rejecting compiler.

The canonical prompt and schema now define runnable-duration arithmetic, preserve the exact
90-minute boundary, require Hydration above it even when warm-up or cooldown exists, and state that
this mandatory rule takes precedence over discretionary Hydration guidance. Deterministic 90- and
95-minute regressions pass. Two deliberate `gpt-5.2` calls then completed, parsed, compiled, and
reached signed non-persisting review with zero policy issues. No retry, repair, fallback, or backend
authorship was introduced.

The old exact-response source snapshot is retired. It had no runtime consumer and no longer matched
the current named-band heart-rate wire contract. The maintained loopback QA fixture remains the
single deterministic local transport and still follows the ordinary parser, compiler, review,
confirm, and local persistence seams.

Implementation DoD: Passed.

Global QA Acceptance: Passed on the real UI provider, review, confirm, readback, and export flow.
