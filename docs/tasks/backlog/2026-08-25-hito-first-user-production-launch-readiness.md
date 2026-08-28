# First-User Production Launch Readiness

**Date:** 2026-08-25
**Mode:** Tracked
**Category:** Release
**Primary Area:** Runner
**Epic:** `ship-adaptive-four-week-training`
**Priority:** Highest
**Owner:** BACKEND
**Archive intent:** Keep as the compact production launch receipt after terminal acceptance.

## Outcome

Prove that one disposable first runner can complete the current production journey without internal
help: authenticate, provide required setup facts, create and explicitly confirm an initial plan,
recover an unconfirmed saved review, use Calendar, attach factual FIT/RPE evidence, and read coherent
Progress/Profile state in English and Portuguese.

This is the first-user launch gate, not a new engine implementation, provider redesign, broad
feature sweep, payment launch, integration rollout or invitation campaign.

## Preserved Contracts

- Production revision and hosted Supabase schema must be identified before mutation.
- Review and explicit Confirm remain the only path from a generated candidate to Calendar.
- Saved reviews survive close/reload and restore without a second provider dispatch.
- Calendar, Result/Evidence and Runner Fitness Profile remain the factual owners.
- Missing evidence stays missing; Progress does not invent fitness or readiness conclusions.
- English/Portuguese localization applies to product UI and structured product errors, never to
  runner-authored, AI-authored or FIT-derived content.
- Only a named disposable technical runner may be used. Personal or existing production users are
  out of scope.

## Execution Boundary

QA owns the production journey and evidence. A reproduced defect returns on this same Task to the
first incorrect existing owner for root-cause fix-forward, then comes back to QA. Do not create a
retry Task or parallel runtime owner.

Use deterministic retained responses first. One paid initial-plan provider dispatch is permitted
only if live transport/model configuration remains the exact unproven launch discriminator after
the retained-response journey. Record attempt count, model, elapsed time, tokens and derived cost;
do not retry an equivalent failure without a code/config discriminator. Running Coach review is
required only for a newly dispatched or semantically changed plan candidate.

## Acceptance Matrix

1. Production deployment, commit, hosted migration parity, auth/session persistence and technical
   runner ownership are identified and healthy.
2. Required onboarding fields show exact inline correction and first-invalid focus; rejected input
   creates no provider request, candidate, confirmation or Calendar row.
3. Initial plan request opens a complete review, explicit Confirm creates the exact standalone
   Calendar workouts once, and reload/new tab preserves the result.
4. Closing an unconfirmed review preserves one Saved plan; Restore opens a fresh review without a
   duplicate provider dispatch; duplicate Confirm is unavailable or rejected.
5. FIT upload and RPE create factual Result/Evidence through the production UI; History,
   Progress/Profile and Calendar agree after reload. An arbitrary or malformed file fails safely.
6. English and Portuguese, Light and Dark, desktop `1470x801` and mobile `375x812`, keyboard/focus,
   dialog containment, dates/numbers, overflow, console warnings/errors and HTTP failures are
   checked on the affected public and authenticated surfaces.
7. Final readback records provider dispatches, confirmations, Calendar rows, evidence/profile
   revisions and omissions. Disposable task-owned data, Storage and leases return to zero while the
   approved technical Auth identity is handled according to its retained lifecycle contract.

## Stop And Release Rule

Do not stop for a routine same-owner defect: fix the canonical root and replay the failed edge. Stop
for Product only when the current production behavior requires a new user-visible policy, unsafe
production-data action, new paid-provider budget, or scope outside this first-user journey.

Terminal acceptance means independent QA passed the complete admitted matrix and returned one
compact human review packet with exact production revision, evidence, residual risk and a clear
invite/no-invite recommendation. Commit, push, migration or deployment of a newly fixed candidate
requires the Task's explicit release edge; QA never performs those actions.

## 2026-08-27 Fresh-Provider Reopening

A real first-user request on Git-backed production `348bff97` reproduced
`provider_incomplete_output`. The canonical domain was HTTP `200` and Vercel recorded the server
action as HTTP `200`; the product failed closed before response retention, candidate creation,
confirmation or Calendar materialisation. Hosted readback found no completed provider response in
the preceding 24 hours, so the runner's goal details, compiler and Calendar were not the failing
boundary.

The previous terminal result proved recovery and confirmation from a retained completed response.
It did not prove that a fresh arbitrary-user request would complete under provider variability, so
the terminal claim is withdrawn and this Task is reopened on BACKEND.

The canonical first-plan service imposed a fixed `32_000` token ceiling even though the response
contains the complete Blueprint and four executable weeks, and both obsolete
`OPENAI_FIRST_PLAN_*` configuration entries were declared but unused. OpenAI counts visible output
and reasoning against `max_output_tokens`; the production-safe fix raises the one canonical ceiling
to `128_000`, removes the false configuration knobs, and records only redacted terminal telemetry
for non-completed provider responses. Raw prompts, raw responses and user facts are never logged.

The first materially fresh owner-bound production discriminator on the released `64_000` revision
still returned `status=incomplete` with `incomplete_details.reason=max_output_tokens`; it created no
retained response, candidate, confirmation or Calendar workout. GPT-5.2 supports `128_000` maximum
output tokens and `reasoning.effort=none`. Because this workload needs one strict complete JSON
document rather than open-ended deliberation, the follow-up root fix uses both exact settings before
one new paid discriminator. This is a changed provider request, not an equivalent retry.

The released `128_000` / `reasoning.effort=none` request still stopped before inference with an empty
`max_output_tokens` response and zero usage. Two materially distinct provider diagnostics isolated
the boundary: the full Hito prompt completed with a minimal strict schema, the full Hito schema
returned the same zero-usage incomplete envelope with a minimal prompt, and the same schema
completed after its duplicated regular-expression keywords were removed. The provider schema is
therefore structural only. The existing strict compiler remains the sole authority for permitted
dates, pace/BPM syntax and runner-facing text, so removing provider-side regex duplication weakens
neither review validation nor Calendar safety.

On the first structural-schema production replay, GPT-5.2 completed in 76 seconds and the response
passed the local provider schema. The compiler then correctly rejected it before candidate creation:
the first Blueprint phase continued three days beyond the detailed block but carried no future
projection slots for that straddling partial phase-week. Provider contract `v20` now supplies the
exact Backend-derived detailed-block end and future-projection start dates and states that a phase
which crosses that boundary must project its remaining future slice. This is a materially distinct
request; the compiler cadence rule is unchanged.

The `v20` replay covered the straddling phase but exposed a second ambiguity: the response declared
phase cadence `4` while authoring only three workouts in complete detailed weeks and two or three
future slots per week. Provider contract `v21` defines cadence as the exact count of every non-rest
session, explicitly including Easy and Recovery, and requires a mechanical detailed/future
phase-week audit before return. The accepted completeness compiler remains unchanged.

The `v21` replay stopped treating cadence as an aspiration but still emitted one every-other-day
projection sequence across Monday/Sunday and phase boundaries. Provider contract `v22` now states
the compiler's exact inclusive phase-week interval algorithm, audits phases independently when they
share a calendar week, and supplies concrete partial-boundary examples. The compiler and its
full-projection requirement remain unchanged; no Backend projection is invented or repaired.

Release acceptance requires one materially fresh technical-runner production request to reach a
complete Review, followed by explicit Confirm and Calendar readback. Retained-response replay or a
fixture cannot close this edge again.

## 2026-08-27 Fresh v22 Production Proof

Git-backed production `da4e9d3` / `dpl_ASUKtopz2e2j9LgAK8uQHjZxAkLV` reached `READY`; the canonical
`www.hitocajon.com` alias returned HTTP `200`, and `main == origin/main`. One fresh owner-bound
`gpt-5.2` request on provider contract `v22` completed in `75.149s`, used `7,454` input and `7,591`
output tokens with zero reasoning tokens, and cost a derived `$0.1193` at the public standard rate
of `$1.75` / `$14.00` per million input/output tokens. Provider schema and compiler both accepted
response `81bde615-92a5-4833-8d9c-f3806388674d`; candidate
`77716029-845e-49ad-b125-a314f71b5f07` version `1` retained SHA-256
`09ac1f3a10c5cf4dbb60f0ed6a8b18a2635524bb3b6fd28d6c2aa0ef83c05628`.

The ordinary production Plans UI displayed one current Half Marathon review, restored its exact
28-day/28-document content without a second provider response, and exposed the explicit
`Add to Calendar` action. Technical confirmation created one immutable block confirmation, exactly
28 `planned_workouts`, and exactly 28 Calendar mutation events. Reload restored the current workout
and 31 provisional Blueprint projections; a fresh tab restored the confirmed review as read-only,
with no duplicate Confirm action. Both tabs reported zero console warning/error entries.

This closes the fresh-provider technical defect that reopened HITO-280. It does not substitute for
the required independent Running Coach verdict on a semantically new candidate. The canonical
sidebar bridge did not acknowledge the bounded Coach handoff after two attempts, so task-owned QA
rows remain retained for that review and exact cleanup. HITO-280 remains non-terminal on BACKEND
execution-host recovery; no further provider request is admitted for this candidate.

## 2026-08-28 Current-Production Replay And Mobile Fix-Forward

Running Coach independently approved the exact retained `v22` candidate as safe to confirm. The
current Git-backed production `83d89c4` / `dpl_66N2wBTBSJLPm7amc6LmKLy257XW` then restored the same
technical runner after reload and in a fresh tab without a second provider dispatch or duplicate
materialisation: hosted truth remained one retained response, one detailed candidate, one block
confirmation, 28 Calendar workouts and 28 Calendar mutation events.

The same production replay reproduced two presentation defects at `375x812` in Portuguese/Dark:
the three-tab Progress strip widened the document from 375 to 450 pixels, and Calendar navigation
could render Portuguese while the root document language reverted to `en`. The bounded FRONTEND
fix makes simple mobile Tabs own their horizontal overflow and makes RootShell render the one
resolved locale directly as the `html` language. Focused locale, lint, formatting, diff-hygiene and
production-build checks passed; the exact fix remains subject to Git-backed production deployment
and independent browser replay before terminal acceptance.
