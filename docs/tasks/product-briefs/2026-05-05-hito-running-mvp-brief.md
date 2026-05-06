# Hito Running MVP Brief

## Status

Draft

## Owner

Product Agent

## Last Updated

2026-05-05

## Working Assumption

This brief assumes Hito Running is a consumer product that helps runners follow a clear training plan and stay consistent over time. If the product is actually aimed at a different user, sport, or business model, this brief should be replaced rather than stretched.

## Problem

Many runners want structure, but generic training plans are hard to personalize and easy to abandon. Users need one clear place to understand what to do this week, what to do today, and whether they are still on track toward their goal.

## Why It Matters

If the first version does not make the next run obvious, users will fall back to ad hoc workouts, lose confidence, and stop returning. A simple and trustworthy planning loop is more valuable than a wide feature set at this stage.

## Target User

Primary user:

- solo runners training for a concrete goal such as building consistency, finishing a first race, or improving distance tolerance

Secondary user:

- returning runners who need light structure after a break

## Target Outcomes

- Users can state a running goal and current baseline in simple terms.
- Users receive a weekly plan that feels understandable and manageable.
- Users can quickly tell what run is scheduled for today.
- Users can record whether they completed or skipped a planned run.
- Users can understand whether they are on track without interpreting complex training data.

## In Scope For MVP

- goal capture at onboarding
- simple baseline capture such as current weekly frequency or comfort level
- one clear weekly training view
- one clear daily workout view
- basic completion logging for planned runs
- lightweight progress status that shows on track, partially off track, or needs reset

## Non-Goals

- advanced coaching logic
- live GPS run tracking
- social feed or community features
- marketplace, commerce, or coach matching
- deep analytics for pace, heart rate, or splits
- support for multiple sports in the same MVP

## Tradeoffs

- We prioritize clarity over personalization depth.
- We prioritize habit formation over advanced performance analysis.
- We choose one primary runner journey over broad flexibility.
- We accept a simpler progress model if it makes daily decisions faster.

## Acceptance Criteria

1. A new user can define one primary running goal and one simple current-state baseline.
2. After setup, the user is shown a single weekly plan with clearly labeled planned runs.
3. The product exposes a clear "today" view so the user does not need to interpret the whole week to know the next action.
4. A user can mark a planned run as completed or skipped.
5. After a completion or skip action, the product updates the user-visible plan status in a way that communicates whether the week is still on track.
6. The MVP does not require social features, device integrations, or advanced biometric data to complete the core workflow.
7. The primary value proposition can be explained in one sentence: know your next run and stay on track toward your goal.

## Success Metrics

- activation: users who finish setup and reach a weekly plan view
- clarity: users who can identify today's planned run without additional explanation
- adherence: planned runs marked completed during the first two weeks
- retention signal: users who return to check their plan on multiple days in the first week

## Open Questions

- Is the first target user a beginner runner, a race trainee, or a general fitness user?
- Should the first goal types be consistency-based, distance-based, or event-based?
- Is progress judged mainly by plan adherence or by performance improvement?
- Is the product intended to feel coach-like, utility-like, or habit-like?

## Next Recommended Role

DESIGNER

## Suggested Next Step

Turn this brief into a focused first-flow spec for onboarding, weekly plan, and daily run status so scope can be pressure-tested before implementation.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Created the first canonical product brief for Hito Running's MVP, centered on a simple runner workflow: set a goal, see the weekly plan, know today's run, and log completion.

### Key Decisions

- Scoped the MVP around planning clarity and adherence rather than advanced coaching depth.
- Treated social, GPS tracking, and deep analytics as explicit non-goals.

### Current State

- A draft product brief now exists in `docs/tasks/product-briefs/`.
- Core assumptions are explicit because the repository did not yet contain product-specific context.

### Constraints

- Do not treat this brief as implemented product behavior.
- Replace, do not stretch, the brief if Hito Running's actual user or product shape differs materially.

### Risks / Open Questions

- The repo did not include confirmed product context, so the brief is assumption-led.
- Goal type and target runner segment still need confirmation.

### Next Recommended Role

DESIGNER

### Suggested Next Step

Convert the brief into a first-flow spec that validates whether the onboarding-to-today-plan loop is the right MVP slice.
```
