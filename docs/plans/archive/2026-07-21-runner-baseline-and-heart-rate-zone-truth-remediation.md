# Runner Baseline And Heart-Rate Zone Truth Remediation Plan

## Status

completed

## Type

plan

## Priority

high

## Next Recommended Role

product

## Task

Establish first-time and returning-runner baseline persistence, accepted heart-rate zone provenance,
and immutable plan-time BPM snapshots.

## Stage

Completed / Gate 3 acceptance and Architect source-of-truth closeout.

## Exact Handoff Prompt

```text
ROLE: PRODUCT

Task:
Select the next product track outside the completed runner baseline and heart-rate remediation plan.

Stage:
PRODUCT prioritization after completed Runner Core remediation.

Canonical plan:
/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/archive/2026-07-21-runner-baseline-and-heart-rate-zone-truth-remediation.md

Required outcome:
- Treat the accepted baseline/HR lifecycle as frozen Runner Core truth.
- Do not reopen it without a concrete regression or a new Product decision.
- Choose the next track independently of this closed plan.
```

## Owner

ARCHITECT -> BACKEND -> FRONTEND -> RUNNING COACH / QA -> ARCHITECT closeout

## Last Updated

2026-07-21

## Incident Decision

This file supersedes its earlier future AeT-estimation scope. The immediate product incident is the
missing end-to-end baseline and plan-time heart-rate lifecycle. Aerobic-threshold testing, FIT-based
zone estimation, adaptive physiology, and rewriting active plans remain separate future work.

The accepted pipeline is:

`runner baseline -> accepted effective HR profile -> AI authoring context -> compiler BPM snapshot -> signed review -> confirm -> immutable plan readback`

AI remains the plan author. Backend owns profile truth, validation, snapshot compilation,
review/confirm exactness, persistence, and readback. Frontend collects and renders backend-shaped
truth; it does not calculate coaching policy.

## Root Cause

**Visible symptom at intake:** first-time setup could not show, accept, edit, and durably reuse HR
zones before a plan existed; returning setup could not reliably restore the full baseline; accepted
estimated ranges could not become an AI-authored HR command.

**Underlying cause:** runner baseline persistence was coupled to plan creation. The settings action
updated only an existing `runner_profiles` row, fitness level was not structured profile truth, and
generated-plan preview obtained HR context through a server-side fallback rather than one explicit
reviewed profile snapshot. Provider and compiler then treated `personal` as the only HR-primary
eligibility state.

**First incorrect owner:** backend runner-profile persistence and plan-time authoring input. The
accepted correction fixed that owner before frontend adoption.

## Gate 1 Implemented Evidence

- `runner_profiles` now stores fitness, baseline revision, and accepted estimated/personal HR
  provenance without requiring plan rows or placeholder goal truth.
- One runner-profile action creates or updates the complete baseline, preserves personal ranges on
  age changes, and refreshes age-derived accepted estimates only when age changes.
- Plan preview loads one accepted profile snapshot; provider context and compiler share it, review
  signs it, and confirm rejects a changed profile revision before any plan persistence.
- Internal authored HR references compile to exact BPM plus estimated/personal provenance before
  review. Confirmed workout targets remain immutable when Settings changes later.
- Local migration upgrade/fresh-reset, RLS isolation, baseline-only persistence, unavailable-preview,
  stale-review, BPM export/readback, one-command, no-pace, availability-ceiling, and cleanup proofs
  pass without hosted mutation or paid provider use.
- Gate 2 then adopted the canonical baseline save/read contract, rendered `estimated`/`personal`
  source values, and removed the retired frontend source check.

## Canonical Product Contract

### Runner baseline

- Age, height, weight, and fitness level are one persisted authenticated runner baseline.
- Age alone derives estimated zones. Other baseline facts are AI context only for HR calculation.
- Valid baseline persistence is independent of plan preview, plan confirm, manual plan creation, and
  provider availability.
- One backend read model serves first-time setup, returning setup, and Settings.

### HR provenance

- `estimated` means age-derived and explicitly accepted without changing any BPM boundary.
- `personal` means the runner changed at least one BPM boundary and saved the complete validated set.
- Accepting defaults never relabels them as personal or measured truth.
- Changing age refreshes only an estimated profile. Personal ranges survive age and other baseline
  changes unchanged.
- Invalid, partial, unordered, overlapping, or out-of-range profiles never partially persist.

### Plan-time authoring and snapshot

- A plan preview uses one effective accepted HR profile from the runner's current reviewed setup.
- AI may choose `heart_rate` as the only primary command for an appropriate runnable leaf when an
  accepted estimated or personal profile is available. HR availability does not force AI to use it.
- Internal zone references are authoring vocabulary only. Before review, compiler resolves them to
  numeric min/max BPM and records `estimated` or `personal` provenance.
- Profile identity/revision and the resulting BPM snapshot participate in signed review exactness.
- Confirm persists exactly the reviewed workout targets. Later profile changes cannot mutate any
  already confirmed workout, including future scheduled workouts.

### Watch and coaching boundaries

- Every runnable unit and Repeat child has exactly one primary mode. Pace and BPM never compete on
  the same leaf; Repeat parents own no target.
- Estimated HR is non-medical guidance and must remain visibly labelled estimated in setup/review.
- Runner-facing surfaces show semantic labels and BPM ranges, never raw Z1-Z5.
- HR zones and finish-time goals never create pace truth. Pace remains benchmark/AI-contract bound.
- Availability remains a maximum. Backend must not fill all available days or alter AI-selected
  weekly density merely because more days are available.

## Delivery Sequence

### Gate 1 - BACKEND canonical profile and snapshot contract

Make profile-only persistence, fitness-level readback, estimated/personal provenance, age lifecycle,
one effective plan-time snapshot, stale-review protection, numeric BPM compilation, and future-only
Settings impact true through the existing backend owners. Reconcile or delete duplicated HR
fallbacks rather than layering another resolver.

This is the first implementation gate because every setup UI and browser acceptance case depends on
backend-shaped provenance, revision, and save semantics.

**Status:** implemented and owner-validated on loopback Supabase. Integrated browser acceptance
remains part of Gates 2-3.

### Gate 2 - FRONTEND setup and shared editor adoption

After Gate 1 passes, render the backend HR summary in first-time and returning setup, reuse one
controlled version of the existing Settings range editor, save baseline independently of plan
creation, and invalidate open previews when backend profile revision changes. Preserve the existing
AppShell Settings affordances and make heart-rate range editing discoverable from its existing
profile-information context; add no route-local HR calculator, duplicate navigation, or form recipe.

**Status:** accepted. Setup and Settings share the backend-shaped BPM editor/readback contract;
first-time and returning flows, revision invalidation, desktop/exact-375px rendering, persistence,
readback, error states, and disposable cleanup passed.

### Gate 3 - RUNNING COACH and QA acceptance

Running Coach reconciles the accepted one-primary-command doctrine with explicitly accepted
estimated profiles and verifies that AI remains free to choose effort instead. QA proves the full
first-time, returning, plan snapshot, immutability, responsive, persistence, and cleanup matrix.
Paid-provider proof is required only if backend/provider contract changes cannot be accepted from
deterministic representation plus existing provider evidence; that decision is a later explicit
release gate, not permission for this implementation to call OpenAI.

**Status:** accepted. Running Coach accepted optional `heart_rate` use from explicitly accepted
estimated or personal profiles while preserving AI freedom to choose effort, one primary command,
no pace invention, and conservative effort/run-walk preferences. QA reconciled every required
inventory row from current Gate 1 contract/persistence evidence and fresh Gate 2 browser evidence.

### Gate 4 - ARCHITECT closeout

After implementation and QA acceptance, reconcile `current-product`, `current-system`,
`current-state`, the watch doctrine, Runner Core freeze boundary, technical log, and dashboard.
Current docs continue to describe implemented behavior until those gates pass.

**Status:** completed. Current product/system/state/functional-map truth, watch doctrine, Runner Core
freeze boundary, technical log, changelog, and dashboard were reconciled without runtime changes.

## Definition Of Done

### Implementation DoD

- One backend profile lifecycle persists and reloads all baseline facts without creating plan truth.
- Estimated and personal sources are distinguishable through setup, authoring, review, persistence,
  export/import, and readback.
- Review/confirm is exact for the effective profile and numeric target snapshot.
- Confirmed plans are immutable under later Settings changes.
- Frontend reuses the existing BPM editor/readback grammar and existing Settings navigation.
- One-primary-command, pace-source, Repeat, availability-ceiling, auth, RLS, and cleanup boundaries
  remain intact.

### Global QA Acceptance

**Passed on 2026-07-21.** The integrated backend/frontend contract passed the full browser plus
persistence/readback matrix below. Fresh Gate 2 browser evidence was reused rather than rerun;
deterministic provider/compiler evidence plus the accepted live-provider watch matrix covers target
selection without requiring another paid call.

## Required Test Inventory

| Check | Scenario / environment | Required result | Evidence owner |
|---|---|---|---|
| First-time estimate | New authenticated runner, valid age, no profile | Setup returns age-derived BPM ranges with `estimated` provenance before any plan/provider call. | BACKEND + FRONTEND |
| Baseline-only persistence | New runner saves age/height/weight/fitness, then reloads | Facts survive reload while plan cycles/workouts remain zero; no fake goal or plan truth is created. | BACKEND / persistence |
| Returning readback | Existing estimated and existing personal runners | Setup returns the correct saved/effective zones and complete baseline before plan creation. | BACKEND + FRONTEND |
| Estimate acceptance | Runner saves unchanged generated ranges | Source remains `estimated`; values are not represented as personal or measured. | BACKEND + FRONTEND |
| Estimated to personal | Runner changes at least one BPM boundary | Complete validated profile persists as `personal` and reloads exactly. | BACKEND + FRONTEND |
| Age change - estimated | Accepted estimated profile, then age changes | Estimated BPM regenerates from age only. | BACKEND |
| Age change - personal | Personal profile, then age changes | Personal zones remain unchanged; only age/context changes. | BACKEND |
| Non-age isolation | Same age with changed height, weight, or fitness | Estimated BPM values remain identical; changed facts still persist and reach AI context. | BACKEND |
| Failed plan independence | Saved baseline followed by unavailable/failed preview or confirm | Baseline and accepted HR profile remain saved; no plan rows persist on failed creation. | BACKEND / persistence |
| AI authoring context | Accepted estimated and personal profiles | AI contract receives exact numeric zones, source, acceptance, baseline facts, and availability ceiling. | BACKEND + RUNNING COACH |
| Numeric compilation | AI authors an internal HR-zone reference | Compiler emits exact numeric BPM/source snapshot before review; runner readback contains no raw Z reference. | BACKEND |
| Review exactness | Profile changes after preview and before confirm | Old confirm is stale/blocked; refreshed review uses the new profile snapshot. | BACKEND |
| Confirmed immutability | Settings zones change after plan confirm | Existing plan/workout BPM, review checksum, logs, evidence, export, and readback remain unchanged; next authoring uses new profile. | BACKEND + QA |
| One primary command | Units and ordered Repeat children | Exactly one primary mode per leaf, no pace/BPM competition, targetless Repeat parent, order preserved. | RUNNING COACH + QA |
| No pace invention | HR profile present, no benchmark, optional finish time | No executable pace is derived from HR or finish time alone. | BACKEND + RUNNING COACH |
| Availability ceiling | Runner offers more days than AI selects | AI-selected density is preserved and never exceeds the ceiling; backend does not fill unused days. | BACKEND + RUNNING COACH |
| Settings affordance | Desktop and exact 375px shell/profile menu | Existing compact affordance reaches Settings; no duplicate navigation or overflow. | FRONTEND + QA |
| BPM UI and a11y | Setup, Settings, review, workout detail; desktop and exact 375px | Semantic labels, BPM units, provenance, validation, keyboard/focus, and errors are usable; raw Z1-Z5 is absent. | FRONTEND + QA |
| Database safety | Fresh local reset, existing v1 personal row, malformed input, second runner | Migration/readback is reproducible, prior personal values survive, invalid data is rejected, RLS/isolation and cleanup pass. | BACKEND + QA |
| Regression | Current generated/manual/import/export validators and production build | Accepted Runner Core behavior remains intact; no paid provider call is required for owner-level DoD. | BACKEND + QA |

Every executed or omitted check must appear in the final owner report as
`Check | Scenario / environment | Result | Evidence`. Any failed or omitted required check keeps the
relevant gate open.

## Risks And Stop Conditions

- Do not create a second profile table, HR calculator, frontend source of truth, or provider-only
  compatibility path.
- Do not persist placeholder plan/goal values merely to make a profile-only save fit the old schema.
- Do not allow an invalid stored HR payload to silently become accepted estimated truth.
- Do not let preview use a stale stored age while displaying a newly entered age.
- Do not rewrite existing plan targets when profile values change.
- Do not make HR mandatory for every plan or every aerobic workout.
- Do not expose raw zone codes, medical authority, or measured-fitness claims to runners.
- Do not apply hosted migrations or call paid providers without a separate approved release gate.
- Preserve unrelated dirty-tree work; stop if source ownership cannot be separated safely.

## Exit Criteria

The plan closes only when backend and frontend gates pass, Running Coach accepts the revised target
boundary, Global QA passes the full integrated matrix with disposable cleanup, and current docs no
longer describe estimated HR as permanently non-command or Settings HR editing as future work.

## Archived Architecture Closeout - 2026-07-21

**Gate 3 and the plan are closed.** Baseline persistence is independent of plan creation; accepted
estimated and personal profiles can inform AI without forcing HR; compiler output contains one
numeric primary command per runnable leaf; later Settings changes affect future authoring only and
cannot rewrite a confirmed plan. Evidence:
`qa-artifacts/screenshots/2026-07-21/runner-baseline-heart-rate-gate-2/fix-forward-proof.json`,
`scripts/running-plan-engine-confirm/persistence-proof.ts`, and the accepted watch doctrine.

No further Backend, Frontend, Running Coach, QA, browser, Supabase, or OpenAI gate belongs to this
plan. Hosted release readiness remains outside this local Runner Core remediation.

## Suggested Next Step

None inside this completed plan. Product may select the next independent product track.
