# Universal Selected-Distance No-Dead-End UX Taxonomy

Date: 2026-06-11
Owner: Product
Status: Accepted product contract for next implementation sequencing
Plan: `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-08-running-plan-creation-engine-rebuild.md`

## Root Cause

Visible symptom:

- Product discussion kept narrowing the next exposure decision to `Marathon Completion`.

Underlying cause:

- The selected-plan UX still did not have a universal product contract for distance ambition,
  beginner status, low availability, and long auto-extended horizons.

Canonical owner:

- Product taxonomy and runner-facing UX boundary, before Frontend exposure or create-path widening.

The correct product rule is global:

- Hito should not refuse a selected-distance plan just because the runner is a beginner, low-volume,
  conservative, slow, or needs a very long plan.
- Hito should auto-extend the horizon when more calendar time makes the request honest.
- The runner can decide whether to accept the long plan after seeing it.

## Accepted Product Law

If the runner selects a distance and gives constraints, Hito should produce an honest selected-distance
plan whenever the request is structurally possible.

This applies to:

- `10K`
- `Half Marathon`
- `Marathon Completion`
- future custom distances
- future selected-distance families

Hito must not ask the runner whether they want more weeks as a separate decision. The plan duration
is backend-owned plan truth. The UI explains why the plan is long.

## Valid Versus Invalid Unavailable States

### Invalid Normal Blocking Reasons

These must not be normal reasons to block selected-distance plan preview or creation:

- beginner level
- low current fitness
- slow runner
- conservative load
- heavy body/load context
- ambitious distance by itself
- long required timeline
- low availability when more weeks can honestly solve the plan

### Valid Structural Unavailable Reasons

These remain valid unavailable reasons:

- insufficient available running days for the family contract
- impossible long-run placement
- fixed rest-day conflict that removes a required training shape
- recovery compression that more weeks cannot solve
- unsupported family mapping for a future/custom distance
- target date or fixed endpoint date below the minimum honest family floor

Unavailable copy must explain the structural reason, not blame the runner.

## Current Family Taxonomy

| User intent | Product option | Family truth | Endpoint truth | Runner-facing promise |
| --- | --- | --- | --- | --- |
| Run 10K | `10K selected-distance plan` | exact selected-distance family | exact `10000m` | Build to a 10K finish/checkpoint honestly. |
| Run a half marathon | `Half Marathon selected-distance plan` | exact selected-distance family | exact `21100m` | Build to a half-marathon finish/checkpoint honestly. |
| Finish a marathon | `Marathon Completion selected-distance plan` | completion-focused selected-distance family | exact `42195m` | Build to completing the full marathon distance. |
| Build marathon durability | `Marathon Base plan` | base-only family | no selected-distance `42195m` endpoint | Build aerobic durability and time-on-feet without promising full-marathon completion. |

`Marathon Completion` and `Marathon Base` must never collapse into one card, label, or endpoint promise.

## Recommended Runner-Facing Labels

Selected-distance cards/options:

- `Run 10K`
- `Run a Half Marathon`
- `Finish a Marathon`

Base-building option:

- `Build Marathon Base`

Avoid labels that imply performance readiness:

- `Race a Marathon`
- `Marathon Race Plan`
- `3:30 Marathon Plan`
- `Target Pace Plan`
- `Race-Ready Marathon`

## Runner-Facing Descriptions

### 10K

Short description:

- `A selected-distance plan that builds toward a real 10K finish.`

Long-horizon explanation:

- `Because of your current rhythm and schedule, Hito gives you more runway instead of squeezing the plan.`

### Half Marathon

Short description:

- `A selected-distance plan that builds toward a real half-marathon finish.`

Long-horizon explanation:

- `This may be a longer bridge if you are newer to running or have fewer weekly run days. That is intentional.`

### Marathon Completion

Short description:

- `A finish-focused plan that builds toward completing the full marathon distance.`

Long-horizon explanation:

- `For a new runner or a 3-day schedule, this can be a very long plan. Hito extends the runway so the work stays honest.`

### Marathon Base

Short description:

- `A base-building plan for marathon durability, not a full-marathon completion plan.`

Boundary explanation:

- `Choose this when you want aerobic durability and time-on-feet before a future marathon-specific plan.`

## Long-Horizon UX Rules

Long plans must feel intentional, not broken.

Use language like:

- `Longer build`
- `More runway for your schedule`
- `Extended because of your current rhythm`
- `Built around 3 days per week`
- `A longer, steadier path`

Avoid language like:

- `You are not ready`
- `Too hard`
- `Unavailable because beginner`
- `Unsafe goal`
- `Try something easier`
- `Do you want to add more weeks?`

The UI may show:

- total weeks
- start/end date
- selected-distance endpoint
- why the horizon is long
- what the plan optimizes for

The UI must not ask:

- whether the runner wants the longer horizon
- whether the runner wants a shorter unsafe version

## Future Custom Distance Contract

Future custom distances should follow the same law.

If Hito has an honest family mapping:

- map the distance to the closest supported family contract
- auto-extend as needed
- show exact endpoint distance when the product promises selected-distance completion

If Hito does not yet have an honest family mapping:

- return a structural/product unavailable state
- explain that this distance type is not supported yet
- do not blame runner level or ambition
- do not silently downgrade to a different family

## Review Boundary

Selected-distance review should show:

- family label
- total duration/weeks
- start/end date
- endpoint distance where applicable
- why the plan is long, if unusually long
- preview-only / not-saved status until confirm
- no OpenAI normal-path claim unless that actually changes

Selected-distance review must not show:

- fake precise pace from target time
- fake personal HR
- race-pace or target-pace copy
- target-time readiness
- race-readiness claims
- hidden Marathon Base substitution for full marathon completion

## Next Implementation Gate

Next owner:

- `BACKEND`

Reason:

- Frontend should not expose a new selectable `Finish a Marathon` option before create/confirm/persist
  exactness is proven for the newly accepted `Marathon Completion` family.
- Preview is QA-passed, but user-facing exposure needs the save/create path to be safe for this
  family as well.

Next gate:

- Extend the selected running-plan confirm/persist contract to include `Marathon Completion`, with
  server-side preview rebuild, review token/checksum exactness, exact `42195m` persisted endpoint
  proof, Marathon Base preservation, and disposable persistence cleanup proof.

After that:

- Frontend can expose the universal selected-distance taxonomy using existing selected-plan card and
  preview UI patterns.

## What Not To Change

- Do not merge `Marathon Completion` into `Marathon Base`.
- Do not reintroduce runner-level dead ends.
- Do not add fake pace or fake personal HR.
- Do not add target-time readiness or race-pace copy.
- Do not make long plans feel like an error.
- Do not ask the runner to approve extra weeks as a separate planning decision.
- Do not expose selected-distance cards before the relevant create/confirm path is accepted.
- Do not mix this with manual workout authoring, Plan Presets cleanup, or unrelated UI redesign.
