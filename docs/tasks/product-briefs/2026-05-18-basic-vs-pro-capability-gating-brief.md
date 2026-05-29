# Basic Vs Pro Capability Gating Brief

## Status

backlog

## Type

product_brief

## Priority

medium

## Next Recommended Role

ARCHITECT

## Task

Advance Basic Vs Pro Capability Gating Brief.

## Stage

ARCHITECT product brief

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

TASK:
Advance Basic Vs Pro Capability Gating Brief.

STAGE:
ARCHITECT product brief

CONTEXT:
- Source path: docs/tasks/product-briefs/2026-05-18-basic-vs-pro-capability-gating-brief.md
- Markdown metadata is canonical for this repo-derived admin Backlog item.
- Supabase mirrors this item for discovery and prompt copy only.

CONSTRAINTS:
- Edit this markdown file, not the admin Backlog mirror, when task truth changes.
- Preserve Hito canonical architecture and current role boundaries.
- Do not broaden scope beyond this work item.

OUTPUT:
Use the project role output format.
```

## Owner

Product Agent

## Last Updated

2026-05-18

## Problem

Hito Running already has a growing set of saved-mode capabilities, and several of the most valuable new ones are AI-assisted:

- text-to-plan authoring compatibility
- plan refresh and update proposals
- Garmin comparison interpretation and recommendation
- upcoming voice-to-plan authoring

The product currently behaves as one undifferentiated capability tier.

That is fine while the product is still early, but it creates a future risk:

- AI-heavy features are expensive and should not remain implicitly unlimited forever
- the team has no canonical rule yet for what belongs to `Basic` versus `Pro`
- if future billing is added without a capability model first, feature gating will become brittle and break product flows unexpectedly

## Why Now

- multiple AI capabilities already exist or are actively planned
- some future features will carry real per-use model cost
- the product needs one canonical capability map before monetization arrives
- the team wants all current users to remain effectively `Pro` for now, while still preparing a safe future split

## Decision

Hito Running should define the capability split now, before paid subscription is live.

The product should support at least two future commercial tiers:

- `Basic`
- `Pro`

For the current pre-subscription phase:

- all real users should continue to receive `Pro` access by default
- but the system should still know which features are logically `Basic` and which are logically `Pro`

This creates one future-safe entitlement model without introducing an immediate paywall.

## Product Boundary

This feature owns:

- the canonical `Basic` vs `Pro` feature matrix
- one future-safe entitlement model
- one consistent rule for which actions are metered, limited, or Pro-only
- safe fallback behavior when a runner does not have access to a capability

This feature does not own:

- payment processor integration itself
- pricing page design
- tax, invoicing, or billing operations
- enterprise or multi-seat packaging

## Core Product Decision

The capability split should follow product value and model-cost reality, not route boundaries.

That means we should classify features by capability type:

1. core product access
2. bounded included AI usage
3. Pro-only AI assistance

Do not define tiers as:

- entire routes are Basic or Pro
- all AI is free forever
- all AI is Pro-only regardless of product importance

## Initial Capability Strategy

### Basic

Basic should include the core runner loop:

- account and saved profile
- onboarding and first plan creation
- calendar and workout detail
- manual workout logging
- user settings and avatar
- non-AI deterministic saved-mode behavior

Basic should also include one bounded AI convenience:

- one included plan edit or update after the initial plan creation

That one included edit is important because it keeps the product from feeling like a trap after the runner creates the first plan.

### Pro

Pro should include the AI-heavy or repeated-assistance capabilities, including:

- repeated AI plan updates after the included Basic allowance is exhausted
- Garmin AI recommendation and interpretation layer
- voice-to-plan authoring
- future AI-heavy guidance features

Assumption for future planning:

- the upcoming voice-to-plan slice should be treated as `Pro`
- the current and future AI-assisted update flows should be treated as `Pro` after the Basic included allowance is consumed

## Required Product Rules

### 1. Everyone is temporarily Pro now

Before paid subscriptions go live:

- every current user should keep access to the full feature set
- the product should still internally classify capabilities as Basic or Pro

This lets the team test the entitlement system without degrading the current user experience.

### 2. Gating must not live only in the UI

The product must not rely on hidden buttons alone.

If a capability is Pro-only or metered, the backend must know it too.

### 3. One included Basic edit must be explicit

`Basic` should not mean:

- unlimited AI plan refresh forever

It should mean:

- the runner can create the first plan
- the runner can make one included AI-backed plan update
- after that, further AI-assisted updates become Pro behavior

### 4. Graceful downgrade behavior

When a runner lacks access to a capability, the product should:

- explain what is unavailable
- preserve non-AI manual alternatives where they exist
- avoid dead-end broken states

### 5. No surprise lockouts

When subscriptions later go live, the entitlement model should preserve:

- current saved data
- current plan truth
- manual logging
- deterministic core experience

What changes should be access to premium assistance, not access to previously created runner history.

## First-Release Capability Matrix

### Basic

- saved account and profile
- create first plan
- view calendar and workout detail
- manual workout logging
- deterministic Garmin upload and comparison facts when the product later chooses to keep those in Basic
- one included AI-backed plan edit or update

### Pro

- repeated AI-backed plan edits or updates
- Garmin AI recommendation or interpretation
- voice-to-plan authoring
- future advanced AI guidance features

### To be explicitly decided later

Some hybrid capabilities may need a later explicit classification:

- deterministic Garmin evidence upload itself
- heart-rate-zone estimation and active-plan application
- export-related premium behavior if any

Those should not be left ambiguous forever, but they do not need to block the first entitlement architecture.

## Acceptance Criteria

1. The product has one canonical future-facing feature matrix for `Basic` and `Pro`.
2. The system distinguishes core deterministic product access from AI-assisted premium capabilities.
3. The product explicitly includes one AI-backed plan edit or update in `Basic`.
4. Repeated AI-assisted plan updates are defined as `Pro`.
5. Voice-to-plan is defined as `Pro`.
6. Current users can remain effectively `Pro` before billing is launched.
7. The entitlement model is designed to be enforced by backend truth, not only hidden UI affordances.
8. Later subscription launch will not require rewriting saved-mode product architecture from scratch.

## Tradeoffs

- We accept some upfront architecture work before real billing exists in order to avoid brittle future paywalls.
- We keep the first matrix intentionally small instead of trying to classify every imaginable future feature now.
- We preserve the core saved-mode runner loop in `Basic` so monetization does not destroy product trust.

## Success Signals

- future billing can be added without large product rewrites
- AI-cost-heavy features have an explicit entitlement story
- current users can stay fully enabled during the transition period
- the product can clearly explain why some future actions are premium without breaking the base runner experience

## Next Recommended Role

ARCHITECT

## Suggested Next Step

Translate this feature matrix into one entitlement architecture plan that defines:

- canonical tier fields
- included-usage counters
- backend gating rules
- temporary `all users are Pro` rollout behavior
- fallback UI behavior for locked premium actions

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Created the product brief for future `Basic` vs `Pro` capability gating, with current users temporarily treated as Pro and AI-heavy features explicitly classified before billing exists.

### Key Decisions

- Define the feature split now, before paid subscriptions launch.
- Keep all current users effectively Pro for the pre-billing phase.
- Preserve the core saved-mode runner loop in Basic.
- Include one AI-backed plan edit in Basic, then treat repeated AI plan updates as Pro.
- Treat voice-to-plan as Pro.

### Current State

- The product already has multiple AI-assisted or AI-planned capabilities in flight, but no canonical entitlement model yet.
- There is no billing system or subscription architecture defining those capabilities today.

### Constraints

- Do not tie entitlement only to UI hiding.
- Do not lock users out of their existing saved data or manual core workflow.
- Do not wait for billing integration before defining the capability model.

### Risks / Open Questions

- Some hybrid features still need explicit later classification, such as deterministic Garmin upload or heart-rate-zone estimation.
- The included Basic allowance must be implemented cleanly so it does not create edge-case confusion.
- Premium messaging must stay clear without making the product feel hostile.

### Next Recommended Role

ARCHITECT

### Suggested Next Step

Write the entitlement architecture plan for canonical tier state, usage counters, backend enforcement, rollout defaults, and graceful locked-state behavior.
```
