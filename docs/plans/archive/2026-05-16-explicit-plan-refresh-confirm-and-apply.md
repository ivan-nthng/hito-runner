Archive Note

Archived during the 2026-05-25 active-plan inventory cleanup.

Classification: Complete / archive now.

Reason: The implemented behavior is now reflected in current docs or in newer archived closeout plans. This artifact is historical and should not drive new work by inertia.

Future agents should not continue this artifact by default. If the product need returns, create a fresh active plan from current `docs/current-*` truth.

---

# Explicit Plan Refresh Confirm And Apply

## Status

In progress - first frontend confirm/apply slice implemented

## Owner

Backend / Frontend

## Last Updated

2026-05-16

## Implementation Update

2026-05-16 backend apply foundation slice:

- proposal generation now returns a backend-owned apply fingerprint covering active plan identity/update time, current day, mutable boundary, remaining schedule signature, and recent history signature
- added an explicit backend apply seam for approved refresh proposals; viewing/generating a proposal still never mutates plans
- stale proposals return an honest `stale_proposal` result before any plan generation or database mutation
- successful apply uses archive/replace, not in-place mutation: the old active plan is archived and a new `active_plan_refresh_v1` active plan is created
- fixed past/logged workout truth is carried into the replacement active plan, and refresh metadata is stored in `plan_preferences.active_plan_refresh`
- frontend `Apply update` / `Keep current plan` controls now exist in the proposal review state

2026-05-16 frontend confirm/apply slice:

- added the first runner-facing decision row inside `Open plan` proposal review
- `Keep current plan` is a true safe reject path: it resets the proposal review and does not call the apply seam
- `Apply update` is the only mutation path: it calls the backend apply seam, shows pending state, prevents double submit, and refreshes the active-plan view after success
- stale responses render as proposal-specific stale copy with a `Generate fresh proposal` action

2026-05-16 weekday rest-day invariant follow-up:

- apply fingerprints now include fixed weekday rest-day truth when known
- refresh apply passes the invariant into the replacement authoring prompt
- generated replacement workouts are validated before persistence, and any non-rest workout on a fixed rest weekday blocks apply instead of relaxing the runner constraint

2026-05-16 apply-path hardening slice:

- refresh apply now derives one authoritative generation timeline from the current remaining schedule
- original active-plan `targetDate` is preserved only when it is still at least seven days after the refresh start
- if the original target is too close, refresh apply asks canonical authoring for `targetDate: null` plus a safe remaining-schedule horizon instead of letting schema validation fail
- the OpenAI authoring seam now supports a narrow caller-provided repair hook, used here only to correct refresh apply schedule fields before canonical validation
- invalid generated refresh output now returns a bounded `invalid_refresh_plan` blocked result instead of leaking raw validation text

2026-05-16 apply blocker repair:

- the refresh apply repair hook now runs before validation for schema-valid but policy-invalid generated output
- generated availability is normalized against resolved fixed weekday rest days before canonical plan generation
- replacement assembly now clamps refreshed workouts to the proposal fingerprint's original remaining-schedule end date
- a realistic apply smoke confirmed archive/replace succeeds, stale reuse still blocks, and Sunday fixed rest-day truth remains preserved

2026-05-16 final apply reliability hardening:

- reproduced the remaining bounded `invalid_refresh_plan` class as JSON-schema-valid authoring output that failed stricter local canonical validation because both baseline long-run fields were `null`
- refresh apply now repairs ordinary generated goal, runner-baseline, schedule, and availability fields from persisted runner/active-plan context before canonical validation
- two fresh realistic proposal/apply attempts now archive/replaced successfully on the same tester class while preserving Wednesday/Sunday fixed rest days
- malformed unsafe generated output still returns bounded `invalid_refresh_plan` and leaves the active plan unchanged

## Context

Hito now has a live proposal-only `Update plan` flow:

- the runner asks for an update
- backend builds one bounded `RunnerCoachContext`
- AI produces a proposal-only refresh artifact
- the runner can review why the remaining plan might change
- no plan rows are mutated yet

This is the right trust-first first step.

The missing piece is the explicit safety contract for moving from:

- `show me the proposal`

to:

- `yes, apply this update`

without ever creating accidental mutation, hidden plan rewriting, or silent loss of past truth.

## Problem Definition

The product now explains an update proposal, but it does not yet define:

- what exact review information must be shown before apply
- what `Apply update` means structurally
- what `Keep current plan` means structurally
- when a proposal becomes stale
- what must be revalidated before mutation

Without that contract, the next implementation step could easily become unsafe or ambiguous.

## Proposal Review Contract

Before the runner can apply an update, the product must show one review state that clearly answers:

1. what Hito thinks should change
2. why
3. what date range or schedule window is affected
4. what stays fixed
5. whether anything has already changed

### Minimum required review content

#### 1. Proposal summary

- one short human-readable summary
- not technical
- not implementation-shaped

Example shape:

- "Ease the next two weeks and reduce the next long run because recent adherence and effort suggest the current block is too aggressive."

#### 2. Rationale

- one bounded list of reasons
- grounded in recent saved history
- may reference:
  - missed workouts
  - shortened workouts
  - Garmin comparison mismatch patterns
  - body-note caution context

#### 3. What changes from a specific date forward

The runner must see:

- the first affected date
- the last affected date if known
- that the proposal applies only to the remaining active schedule
- a bounded summary of targeted changes

This must be explicit, not implied.

#### 4. What stays fixed

Always show:

- past workouts stay fixed
- logged history stays fixed
- only the remaining active schedule is under review
- the current goal/target stays the same unless the runner explicitly changed it

#### 5. Shift semantics

The review must say plainly whether the proposal:

- keeps the current remaining schedule dates and only changes content
or
- shifts upcoming schedule timing from a specific future date

This must never be hidden inside generic wording.

#### 6. Explicit pre-apply boundary note

Always show one clear statement:

- "Nothing has changed yet."

That line is mandatory.

## What The Runner Must Understand Before Apply

Before the runner can confirm, they must understand:

- this is still a proposal
- the current plan is still active
- only the future remaining schedule can change
- past/logged history will not be rewritten
- they can decline and keep the current plan untouched

## Confirm / Reject Contract

The review state should expose exactly two primary outcomes:

### 1. `Apply update`

Meaning:

- the runner explicitly approves replacing the remaining active schedule with the reviewed update

What happens:

1. backend revalidates the proposal against current active-plan truth
2. if still valid, backend creates and applies the refreshed future schedule
3. current active-plan lifecycle updates through the canonical persisted seam
4. runner returns to saved mode with the updated active schedule

### 2. `Keep current plan`

Meaning:

- the runner rejects the proposed update

What happens:

- no plan mutation
- no active-plan lifecycle change
- no background retry or delayed apply
- the runner keeps the current active plan exactly as-is

This is a true safe reject path, not a soft dismiss.

## Apply Safety Rules

### Proposal staleness

A proposal must be treated as stale if any of the following are true before apply:

1. the active plan id changed
2. the active plan `updated_at` changed
3. the current date crossed into a new day compared with proposal generation
4. the remaining mutable schedule changed
5. relevant saved workout/log context used for the proposal changed

In practice, this means the backend should compare one proposal fingerprint against current truth before apply.

### Recommended v1 proposal fingerprint

The apply step should revalidate a backend-owned proposal signature built from:

- active plan id
- active plan `updated_at`
- proposal generation timestamp
- proposal boundary:
  first mutable date
  last mutable date
- remaining active workout identity/date signature
- latest relevant saved workout-log update included in context

### What happens if stale

If stale:

- apply is blocked
- current plan stays untouched
- runner sees honest copy such as:
  "This proposal is no longer current. Review a fresh update before applying changes."

No partial apply is allowed.

### Mandatory pre-apply revalidation

Before apply, backend must revalidate:

- active plan still exists and is still active
- current runner is still authorized for that plan
- mutable schedule window still matches proposal assumptions
- continuity/history-preservation rules still hold
- generated updated plan still validates canonically

## Lifecycle Model

### Chosen canonical model

Refresh apply should **archive/replace**, not mutate rows in place.

Recommended model:

1. current active plan remains the review source of truth until confirm
2. on approved apply, backend creates a new plan version for the updated remaining schedule
3. previous active plan is archived
4. new refreshed plan becomes the active plan
5. past/logged truth remains attached to the historical/archived plan rows as needed by the canonical continuity rules

### Why this model is correct

- preserves auditability
- matches the existing lifecycle posture better than in-place overwrites
- avoids hidden loss of the previous active schedule
- keeps plan-refresh apply conceptually aligned with existing replace/import behavior

### What must not happen instead

Do not:

- rewrite existing future rows in place with no archival boundary
- blend proposal application into unclear partial edits on the same active row set
- apply only some of the refresh while leaving ambiguous mixed-plan state

## Human Control Rules

- no silent mutation
- no auto-apply
- no auto-rewrite after viewing proposal
- no hidden background apply
- no loss of past or logged history
- no proposal apply without explicit runner confirmation
- runner always has a safe reject path

## What Must Never Happen

- viewing a proposal changes the active plan
- dismissing the modal changes the active plan
- a stale proposal applies anyway
- past workouts or logged history are rewritten by refresh apply
- apply bypasses continuity or history-preservation safety
- AI output persists directly without deterministic validation and lifecycle checks

## UI Placement

Confirm/reject should live:

- inside `Open plan`
- in the proposal review state
- not in a separate coach app
- not as a shell-level plan-note shortcut

Recommended v1 review state flow:

1. runner opens `Open plan`
2. runner enters `Update plan` request
3. runner reviews proposal
4. visible actions:
   - `Apply update`
   - `Keep current plan`

If stale on attempt to apply:

- stay in the same ownership surface
- show clear stale-state messaging
- offer `Refresh proposal again`

## What We Leave For Later

- multiple saved proposal history
- coach chat product
- diff-by-diff manual editor
- per-workout cherry-pick of proposal changes
- OCR/similar-run/PDF work
- automated or scheduled plan refresh

## QA Expectations

- proposal review always states that nothing has changed yet
- `Keep current plan` always leaves the active plan untouched
- `Apply update` never succeeds on stale proposal context - backend foundation implemented
- proposal apply never rewrites past/logged history - backend foundation carries fixed workout/log truth forward
- archive/replace lifecycle remains consistent and auditable - backend foundation implemented with `active_plan_refresh_v1`
- malformed or invalid proposal output cannot mutate the active plan
- reload after apply shows one coherent active plan, not mixed old/new schedule state

## Risks

- stale detection can be too weak if proposal fingerprints are underspecified
- archive/replace semantics can become confusing if the review copy does not explain that only the future schedule changes
- the product can overstate confidence if review copy sounds like an already-approved coaching action

## Exit Criteria

- one explicit review contract is defined
- one explicit confirm/reject contract is defined
- one canonical apply lifecycle model is chosen
- stale-proposal behavior is explicit
- human-control rules are explicit
- one next recommended role is chosen

## Next Recommended Role

BACKEND

## Suggested Next Step

Design the backend apply token/fingerprint and revalidation contract for approved refresh proposals, then implement the archive/replace apply path behind the existing `Open plan` review surface so only explicitly confirmed, still-current proposals can mutate the remaining active schedule.
