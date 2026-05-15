# Heart Rate Zones Profile And Plan Application Brief

## Status

Draft

## Owner

Product Agent

## Last Updated

2026-05-14

## Problem

Hito Running can already store a runner profile, generate a plan, log workouts, and ingest Garmin FIT evidence. But the product still lacks one canonical way to understand and reuse the runner's personal heart rate zones.

Right now the plan can carry heart-rate targets inside workouts, but the product does not yet own:

- whether the runner knows their zones
- how the runner can enter or estimate them
- where those zones live in the profile
- how those zones affect active and future plans

Without that, heart-rate guidance stays generic, runner trust stays weak, and Garmin-based evidence cannot yet improve the plan at the runner-profile level.

## Why Now

- the product already has a live Garmin FIT upload and deterministic parsing path
- the product already has a persisted `runner_profile` seam that can own stable runner-level truth
- the product already generates and replaces plans in saved mode
- heart-rate zones become more valuable once the runner can upload real workout evidence instead of using generic defaults

## Decision

Hito Running should add one canonical `heart rate zone profile` capability with two entry paths:

1. manual entry for runners who already know their zones
2. guided estimation from one structured aerobic test workout plus uploaded FIT evidence

That profile-level zone truth should then be available for:

- future plan creation
- explicit update of the current active plan
- later profile review and manual adjustment

The product must not silently overwrite plan targets or pretend that estimated zones are certain when the evidence quality is weak.

## Product Boundaries

This feature owns:

- profile-level storage of heart rate zone truth
- the onboarding question about whether the runner already knows their zones
- one guided test workout path for runners who do not know them
- deterministic FIT-based AeT estimation and validity checks
- explicit confirmation before applying new zones to an existing active plan

This feature does not own:

- direct provider sync
- threshold-lab-grade physiology claims
- silent rewriting of archived plans or historical workouts
- automatic always-on adaptive coaching

## Canonical Product Model

One runner should have one current active heart-rate-zone profile.

That active profile should always have:

- source
  `manual` or `estimated_from_test`
- confidence state
  clear enough to trust or too weak to apply automatically
- last updated timestamp
- the actual zone boundaries the rest of the product can reuse

If the runner estimates zones again later, the product should replace the active zone profile only after showing the result and asking for confirmation.

## Target Outcomes

- Runners who already know their heart rate zones can enter them without friction.
- Runners who do not know their zones can follow one guided workout and upload one FIT file to estimate them.
- The product stores one canonical active heart-rate-zone profile at the runner level.
- New plan generation can use that profile directly.
- Existing active-plan heart-rate targets can be updated only after explicit runner confirmation.
- The profile area gives the runner one obvious place to review and update their body data and heart-rate-zone data later.

## In Scope

- onboarding question:
  `Do you know your heart rate zones?`
- manual zone entry path during setup
- guided aerobic-test path during setup for unknown zones
- deterministic validation and estimation from uploaded FIT file
- user profile surface with identity placeholders, physical data, and heart-rate-zone section
- explicit `apply to current active plan` confirmation flow
- use of active zones during future plan creation

## Out Of Scope

- Apple Health, Garmin Connect OAuth, or Strava sync
- VO2 max, lactate threshold, recovery score, or broader physiology dashboards
- automatic updates to archived plans
- silent mutation of the active plan without runner confirmation
- doctor-grade or lab-grade heart-rate prescription claims
- broad profile-editing system beyond the bounded fields needed for this slice

## Tradeoffs

- We accept a two-step experience for runners who do not know their zones because trustworthy estimation needs a structured test and uploaded evidence.
- We prefer one bounded AeT-based estimation path over multiple competing zone methods in v1.
- We keep one active zone profile per runner instead of supporting multiple saved methodologies at once.
- We treat estimated zones as product-helpful training guidance, not medical truth.
- We update only the active plan and future plan generation paths, not historical archived plans, to keep history auditable.

## Primary User Flows

### 1. Runner already knows zones

1. During onboarding, the runner says they know their zones.
2. The product asks them to enter zones manually.
3. The zones are saved to the active runner profile.
4. If the runner is creating a new plan, that plan uses the zones immediately.
5. If the runner already has an active plan, the product offers to update that active plan with the new zones.

### 2. Runner does not know zones

1. During onboarding, the runner says they do not know their zones.
2. The product offers one guided aerobic-test workout protocol.
3. The runner completes the test and uploads the FIT file in the existing `Feedback` path.
4. The system validates the workout quality and either:
   accepts the workout and estimates zones
   or rejects it honestly and explains why the test was not valid enough
5. The runner sees the estimated zones and confidence.
6. The runner explicitly confirms whether to save them and whether to apply them to the current active plan.

### 3. Existing saved-mode runner later updates zones

1. The runner opens `User profile`.
2. The runner sees current physical fields and current heart-rate-zone profile.
3. The runner either edits zones manually or starts the guided test path.
4. After new zones are available, the product offers to apply them to the active plan.

## Guided Test Protocol Boundary

The product should support one bounded aerobic-test protocol only:

- 60 minutes total
- warmup
- stage 1
- stage 2
- stage 3
- cooldown

This protocol is the only first-release estimation contract.

The product should not support multiple test methodologies in v1.

## Validity Contract

The product must reject a test when the evidence quality is too weak.

At minimum, first-release rejection logic must account for:

- insufficient total duration
- pause or idle time above threshold
- terrain instability
- pace instability above threshold
- poor heart-rate signal quality

If the workout is rejected, the product must say that the test was not valid enough to estimate zones yet.

## Plan Application Boundary

`Apply my heart rate zones` should mean:

- update the current active plan's future-facing heart-rate target truth so the runner sees their current zones reflected in relevant workouts
- use those same zones for future plan creation and replacement

It should not mean:

- rewrite archived plans
- rewrite completed historical workouts
- silently mutate the active plan without confirmation

## Acceptance Criteria

1. Onboarding asks the runner whether they already know their heart rate zones.
2. A runner who knows their zones can enter them manually and save them to a canonical runner-level profile.
3. A runner who does not know their zones can start one guided aerobic-test path with a clearly described workout protocol.
4. The system can accept one uploaded FIT file from that test and either estimate zones deterministically or reject the workout honestly for validity reasons.
5. The estimated result includes at least:
   AeT estimate
   zone boundaries
   confidence or validity state
6. The runner must explicitly confirm before newly entered or estimated zones update the active plan.
7. New plan creation can use the active heart-rate-zone profile automatically once it exists.
8. The profile area includes a visible heart-rate-zone section plus bounded physical profile fields.
9. Historical and archived plan truth remains unchanged by this feature.

## Success Signals

- more saved-mode runners end up with a usable heart-rate-zone profile
- fewer plans rely on generic heart-rate guidance once runner-specific zones exist
- runners can understand whether their zones were entered manually or estimated from a test
- plan updates from zone changes feel explicit rather than surprising

## Next Recommended Role

ARCHITECT

## Suggested Next Step

Turn this brief into one bounded implementation plan that defines:

- runner-profile zone storage
- the guided test workout lifecycle
- deterministic FIT-based validity and AeT estimation
- active-plan reapplication rules
- onboarding, profile, and feedback UX sequencing

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Created the product brief for runner-level heart-rate-zone ownership, including manual entry, guided test estimation from FIT upload, profile visibility, and explicit plan reapplication.

### Key Decisions

- Use one canonical active heart-rate-zone profile per runner.
- Support only two first-release paths: manual entry and guided aerobic-test estimation.
- Require explicit runner confirmation before applying new zones to an active plan.
- Keep archived plans and historical workouts unchanged.

### Current State

- The app already has runner profiles, saved-mode plan creation and replacement, and live Garmin FIT upload plus deterministic parsing inside workout `Feedback`.
- It does not yet have runner-level heart-rate-zone truth or a plan-update path based on those zones.

### Constraints

- Do not turn v1 into a broad physiology or integrations platform.
- Do not silently rewrite active plans or historical truth.
- Do not support multiple competing zone-estimation methodologies in the first release.

### Risks / Open Questions

- AeT estimation quality depends on workout validity and signal quality.
- The exact active-plan update model must stay bounded so it does not become a hidden plan-regeneration system.
- The profile surface can easily sprawl if it tries to become a full account-settings product.

### Next Recommended Role

ARCHITECT

### Suggested Next Step

Write the implementation plan for heart-rate-zone storage, guided test orchestration, FIT-based estimation, and explicit active-plan reapplication.
```
