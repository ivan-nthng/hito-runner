Archive Note

Archived during the 2026-05-25 active-plan inventory cleanup.

Classification: Complete / archive now.

Reason: The first Basic/Pro entitlement foundation is implemented and described in current docs. Billing/pricing remains a future product decision that should get a new plan when prioritized.

Future agents should not continue this artifact by default. If the product need returns, create a fresh active plan from current `docs/current-*` truth.

---

# Basic Pro Entitlement Architecture Plan

## Status

Draft

## Owner

Architect

## Last Updated

2026-05-18

## Context

Hito Running already has several capabilities that will eventually need commercial gating:

- core saved-mode plan and workout experience
- AI-backed plan creation compatibility paths
- AI-backed plan refresh and update proposals
- Garmin AI recommendation and interpretation
- planned voice-to-plan authoring

Right now there is no canonical entitlement layer.

That creates future risk:

- premium gating could end up scattered across UI buttons and local conditions
- usage limits such as `one included AI plan edit in Basic` would be hard to enforce consistently
- future billing integration would have to retrofit entitlement logic into already-live product flows

The product brief now defines the future commercial shape:

- `Basic`
- `Pro`
- all current users temporarily behave as `Pro`
- one included AI-backed plan edit belongs to `Basic`
- repeated AI-assisted edits belong to `Pro`
- voice-to-plan belongs to `Pro`

This plan defines how to implement that safely.

## Goal

Create one canonical entitlement model that:

- classifies runner capabilities by tier
- supports included usage allowances
- can default all current users to `Pro` now
- can later switch to real subscription-backed access without rewriting the product

## Core Architectural Rule

Entitlement truth must be backend-owned.

UI may mirror entitlements, but it must not be the source of truth.

Canonical rule:

- every gated capability must be enforceable at the server/action layer
- frontend may hide, explain, or upsell
- backend must still reject unauthorized premium actions safely

## Required Capability Classes

The system should distinguish at least these capability classes:

### 1. Core included capabilities

Examples:

- saved runner profile
- first plan creation
- calendar and workout access
- manual workout logging
- user settings

### 2. Metered included capabilities

Examples:

- one included AI-backed plan update or edit in `Basic`

### 3. Pro-only capabilities

Examples:

- repeated AI-backed plan updates after the included allowance is consumed
- Garmin AI recommendation layer
- voice-to-plan

This should be modeled explicitly, not inferred ad hoc from route names.

## Recommended Data Model Direction

### Runner entitlement table

Recommended new table:

- `runner_entitlements`

Recommended columns:

- `user_id uuid primary key`
- `tier text not null`
  values:
  `basic`
  `pro`
- `rollout_source text not null`
  values:
  `default_pro_preview`
  `manual_override`
  `subscription`
  `promo`
- `status text not null`
  values:
  `active`
  `inactive`
- `effective_from timestamptz not null default now()`
- `effective_until timestamptz null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Purpose:

- one canonical current tier row per runner
- future-safe for real subscription sync later

### Capability usage table

Recommended new table:

- `runner_capability_usage`

Recommended columns:

- `id uuid primary key`
- `user_id uuid not null`
- `capability_key text not null`
- `period_key text not null`
- `used_count integer not null default 0`
- `allowance_count integer not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Purpose:

- support rules such as:
  `basic_ai_plan_updates_included = 1`

`period_key` may initially be simple:

- `lifetime`

Do not overbuild recurring quota periods before the product truly needs them.

## Capability Registry Direction

Do not scatter string literals across the app.

Create one canonical capability registry in code, for example:

- `core_saved_mode`
- `ai_plan_update`
- `garmin_ai_feedback`
- `voice_to_plan`

Each capability should define:

- human-readable label
- tier requirement
- included allowance if any
- fallback messaging metadata

This registry should be used by:

- backend policy checks
- frontend locked-state messaging
- later admin or billing tooling

## Enforcement Direction

### Backend-first enforcement

Enforce at the server action / mutation layer for:

- AI plan refresh proposal generation
- AI plan refresh apply if tied to premium proposal flows
- Garmin AI recommendation generation when gated
- voice-to-plan transcription or final plan generation handoff when gated

Important:

- deterministic non-premium flows should continue to work when intended
- locked premium actions should return structured capability errors, not generic 500s

### Frontend behavior

Frontend should:

- show available actions when entitled
- show locked or upsell state when not entitled
- preserve the runner’s current context

Frontend must not:

- pretend a capability is available and only fail later with generic error copy

## Rollout Strategy

### Phase 0 rollout default

Before billing exists:

- every current real runner gets `tier = pro`
- source:
  `default_pro_preview`

This allows the entitlement architecture to ship without reducing current access.

### Phase 1 transition

When subscriptions are introduced:

- new or migrated runners may become `basic` or `pro`
- promo or manual override can still keep specific runners on `pro`

This means the rollout logic should be separate from the capability rules themselves.

## Included Basic Allowance Rule

The product brief requires:

- Basic gets one included AI-backed plan edit or update

Recommended first implementation:

- capability key:
  `ai_plan_update`
- `basic`
  allowance count = `1`
- `pro`
  unlimited for the current product meaning

Important architectural rule:

- do not encode this as special-case product copy only
- do not encode it as a boolean such as `has_used_free_edit`
- use the same capability-usage model that later premium limits can reuse

## Locked-State Product Behavior

When the runner lacks access to a premium capability:

- do not destroy or hide existing saved data
- do not block core workout logging or plan viewing
- do not let the runner enter a long premium flow only to fail at the end

Recommended behavior:

- explain what the action would do
- say that it is Pro
- if relevant, show whether the included Basic allowance is already used
- offer safe next action:
  continue manually
  keep current plan
  upgrade later

## Scope Decisions By Capability

### AI plan update

Recommended rule:

- first included update in Basic
- repeated usage requires Pro

### Garmin AI interpretation

Recommended rule:

- classify as Pro now
- even if the deterministic Garmin comparison remains available more broadly later

### Voice-to-plan

Recommended rule:

- Pro-only from the start

### Deterministic Garmin comparison

Recommended current posture:

- leave final Basic/Pro classification open for a later explicit decision
- do not block this architecture work on that decision

## Option Evaluation

### Option 1: UI-only gating later

Pros:

- fast

Cons:

- unsafe
- easy to break
- impossible to meter reliably

Decision:

- reject

### Option 2: Backend entitlements plus capability registry now

Pros:

- safe
- future-ready
- supports billing later
- supports temporary `all users are Pro` rollout now

Cons:

- some upfront work before monetization is live

Decision:

- choose

### Option 3: Wait for Stripe before defining product tiers

Pros:

- fewer tables now

Cons:

- pushes product decisions into billing integration
- increases future refactor cost

Decision:

- reject

## Recommended Delivery Sequence

### Phase 1: Capability map and backend entitlement truth

Deliver:

- canonical capability registry
- runner entitlement table
- backend helper for capability checks

### Phase 2: Usage allowance support

Deliver:

- usage tracking for metered capabilities
- first included Basic allowance for AI plan update

### Phase 3: Product-facing locked states

Deliver:

- structured premium capability errors
- frontend locked/upsell states for gated actions

### Phase 4: Rollout default

Deliver:

- pre-billing default:
  all users effectively `pro`
- feature flags or rollout source support for later migration

## Risks

- If capability naming is inconsistent, gating will drift across surfaces.
- If usage counting is tied to UI clicks instead of successful backend actions, allowances will be wrong.
- If downgrade behavior is too aggressive, users may think the product lost their data.
- If too many hybrid features stay unclassified, the entitlement system will exist without clear product meaning.

## Validation Plan

### Backend validation

- a non-entitled user cannot execute a gated premium action even with direct request access
- a Pro user can execute the same action
- the included Basic allowance decrements only on successful qualifying action completion
- current pre-billing default users resolve as Pro without manual per-user setup

### Product validation

- locked premium actions return clear bounded messages
- core saved-mode flows still work for Basic
- existing runner data remains visible regardless of premium gating

### Migration validation

- switching a user from temporary Pro to Basic does not delete or corrupt data
- usage counts remain stable across refreshes and repeat sessions

## Checklist

- [ ] define canonical capability keys
- [ ] add runner entitlement persistence
- [ ] add capability-usage persistence for metered allowances
- [ ] add backend helper for `canUseCapability(...)`
- [ ] wire premium checks into AI-backed actions
- [ ] define structured locked-state responses
- [ ] keep all current users effectively Pro for the pre-billing rollout
- [ ] validate the single included Basic AI update rule

## Exit Criteria

- The product has one backend-owned entitlement model for Basic and Pro.
- The system can classify capabilities without relying on route-level hacks.
- The one included Basic AI plan update is enforceable.
- Current users can still behave as Pro before billing is launched.
- Future billing integration can attach to this entitlement system without rewriting core product flows.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Created the architecture plan for future Basic vs Pro entitlement handling, including canonical tier state, included-usage tracking, backend enforcement, and a pre-billing rollout where all current users remain effectively Pro.

### Key Decisions

- Entitlements must be backend-owned, not UI-only.
- The capability model should separate core included access, metered included access, and Pro-only access.
- One included AI-backed plan update belongs to Basic.
- Voice-to-plan and repeated AI-assisted updates belong to Pro.
- Current users should remain effectively Pro until billing is introduced.

### Current State

- The product already has multiple AI-assisted capabilities in flight or live.
- There is no canonical entitlement or subscription model yet.
- Billing is not implemented yet.

### Constraints

- Do not tie gating only to hidden buttons.
- Do not lock users out of existing saved data or core manual workflows.
- Do not wait for payment integration before defining entitlement truth.

### Risks / Open Questions

- Some hybrid features still need later explicit classification.
- Usage allowances must be counted at successful backend action boundaries.
- Locked-state product messaging must stay clear without degrading trust.

### Next Recommended Role

ARCHITECT

### Suggested Next Step

Turn this plan into a concrete schema-and-enforcement proposal for capability keys, entitlement rows, included-usage tracking, and backend checks around premium AI actions.
```
