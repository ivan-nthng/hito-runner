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

Release acceptance requires one materially fresh technical-runner production request to reach a
complete Review, followed by explicit Confirm and Calendar readback. Retained-response replay or a
fixture cannot close this edge again.
