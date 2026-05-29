# Hito Running UI Absorption Scope

## Status

backlog

## Type

product_brief

## Priority

medium

## Next Recommended Role

DESIGNER

## Task

Advance Hito Running UI Absorption Scope.

## Stage

DESIGNER product brief

## Exact Handoff Prompt

```text
ROLE: DESIGNER

TASK:
Advance Hito Running UI Absorption Scope.

STAGE:
DESIGNER product brief

CONTEXT:
- Source path: docs/tasks/product-briefs/2026-05-05-hito-running-ui-absorption-scope.md
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

2026-05-05

## Problem

Hito Running needs a canonical MVP scope before absorbing the imported running UI. The imported UI already contains strong planning surfaces, but it currently carries a different product identity, a hardcoded half-marathon training narrative, and placeholder promises that would push Hito Running beyond its first usable product boundary.

Without a fixed scope document, design and architecture work will drift toward fake capability coverage, imported assumptions, and a broader coaching product than the MVP brief supports.

## Imported UI Reality

- The imported UI has a strong structural skeleton for three important MVP surfaces: `today`, `weekly plan`, and `workout log`.
- The imported UI is positioned as `Stride`, not Hito Running.
- The imported UI is framed as an AI-assisted half-marathon coach rather than a bounded MVP planner.
- The imported UI hardcodes one runner, one goal, one race timeline, and one 13-week plan.
- The imported UI includes no onboarding or setup path that captures a user's goal or baseline before showing the plan.
- The imported UI includes completion logging UI, but the product loop is not truly closed because logging does not establish a trusted user-facing week status update grounded in real product state.
- The imported UI includes `/progress`, `/body`, and `/integrations`, but these surfaces are largely future-facing and depend on promises that are outside the Hito Running MVP boundary.
- The imported UI repeatedly implies live AI adaptation, OCR ingestion, weather awareness, Garmin/Strava connectivity, and device-backed insights even though those capabilities are not yet part of the MVP.

## Keep Now

- `/`
  Use as the Phase 1 home surface.
  Its job is to orient the runner around two answers only: what is planned this week and what should I do today.
- `weekly plan surface`
  Keep as a core planning surface inside `/`.
  The imported month or week planning skeleton is useful, but the canonical MVP meaning is weekly clarity, not long-block performance analytics.
- `/workout/$date`
  Keep as the per-workout detail surface for planned session review and completion logging.
- `today workout emphasis`
  Keep the idea that one workout should be easy to open from home without requiring interpretation of the whole week.
- `basic completion logging`
  Keep completion, partial completion, skip, and brief notes as the core logging outcome set.
- `week status update`
  Keep one simple post-log outcome that tells the runner whether the current week remains on track, partially off track, or needs reset.

## Defer Now

- `/progress`
  Defer. This surface assumes analytics maturity, trend trust, and outcome interpretation that the MVP does not yet own.
- `/body`
  Defer. Body-state logging creates an expectation of injury-aware adaptation that the MVP should not promise.
- `/integrations`
  Defer. Device and service connectivity are support capabilities, not part of the first product loop.
- `AI adaptation`
  Defer. The MVP does not promise dynamic coaching logic that rewrites plans based on signals.
- `OCR ingestion`
  Defer. Screenshot parsing is not required to complete the first runner workflow.
- `device sync`
  Defer. Garmin, Strava, Apple Health, and similar inputs are outside the MVP boundary.
- `weather enrichment`
  Defer. Conditions may be useful later, but they are not part of the first trustworthy plan-and-log loop.
- `predictive readiness, recovery scoring, and biometric guidance`
  Defer. These increase interpretation burden and trust risk before the base product loop is stable.

## Canonical MVP Flow

1. Onboarding
   Introduce Hito Running as a simple running plan product and set expectation that the app will help the runner know the next run and stay on track.
2. Goal capture
   The runner chooses one primary goal for the current plan cycle.
   Phase 1 supports one active goal at a time.
3. Baseline capture
   The runner provides a small set of simple current-state inputs so the first plan can be grounded in reality.
   This is baseline capture, not deep assessment.
4. Weekly plan
   After setup, the runner lands on one canonical weekly plan view.
   This is the main planning home for the product.
5. Today workout
   From the weekly plan, the runner can immediately identify and open today's planned workout.
6. Completion logging
   After the workout, the runner marks it as completed, partial, or skipped and may add lightweight context.
7. Week status update
   After logging, Hito Running updates the week's visible status in a simple way that helps the runner decide whether to continue as planned or reset expectations.

## Product Positioning Decision

Hito Running v1 should be positioned as a clearly bounded hybrid: a consistency-first running planner for one concrete goal.

This means:

- It is not a generic AI running coach.
- It is not only a habit tracker with no goal structure.
- It is not limited to half-marathon event training.
- It is allowed to support event-based goals, but the product promise is clarity and adherence, not high-performance optimization.

The practical product stance for v1 is:

- Help the runner define one goal.
- Turn that goal into a manageable weekly plan.
- Make today's run obvious.
- Help the runner stay on track through simple completion logging.

This choice best matches the MVP brief because it preserves the imported UI's planning strength while preventing the product from overcommitting to advanced coaching depth or race-specific performance claims.

## Copy / Promise Corrections

- Remove `Stride` naming and replace all product framing with Hito Running naming.
- Remove half-marathon-default framing as the global product identity.
- Remove sub-2-hour race language as a default promise.
- Remove named-runner assumptions such as a hardcoded runner identity.
- Remove hardcoded race dates, race countdown framing, and prewritten block labels unless they are generated from real user setup.
- Remove any implication that Garmin, Strava, Apple Health, or other integrations are connected in Phase 1.
- Remove AI coach, AI insight, AI hook, adaptive engine, or similar promise language from MVP surfaces.
- Remove OCR and screenshot-import promise copy from completion logging.
- Remove weather, recovery score, readiness, fatigue forecast, and biometric authority language from MVP surfaces.
- Rewrite home, weekly plan, and workout detail copy to focus on plan clarity, today's action, and simple adherence status.
- Rewrite completion logging copy so it reflects a closed MVP loop: log result, update week status, continue plan.

## Login Decision

Login should not be treated as part of the first MVP product phase.

Product reasoning:

- The first thing to validate is whether the setup-to-plan-to-log loop is understandable and valuable.
- Requiring login too early adds activation friction before the core planning loop is proven.
- Login is better treated as a support capability after flow stabilization, especially when continuity, saved history, or cross-device use becomes necessary.

Exception:

- If the very first user test requires durable saved plans across sessions or devices, login can be introduced as an enabling capability, but not as part of the core MVP promise.

## Open Questions

- Which goal types are explicitly allowed in Phase 1: consistency, first race completion, distance build, or a narrower subset?
- Does week status need exactly three states, or is there a simpler two-state model that is clearer in early testing?
- Is the first onboarding plan meant to feel utility-like or lightly coach-like in tone, as long as it avoids fake intelligence claims?
- Should the weekly plan default to a week view only, or can a month view remain as secondary navigation without changing the MVP promise?

## Next Recommended Role

DESIGNER

## Suggested Next Step

Turn this scope into an implementation-ready frontend spec for the Phase 1 runner flow only: onboarding, goal capture, baseline capture, weekly plan, today workout, completion logging, and week status update, including the exact empty and review states needed to keep the flow trustworthy.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Created the canonical product scope for absorbing the imported running UI into Hito Running's MVP, keeping only the home, weekly plan, and workout-detail loop while deferring analytics, body tracking, integrations, and AI-style enrichment.

### Key Decisions

- Positioned Hito Running v1 as a consistency-first running planner for one concrete goal rather than an AI half-marathon coach.
- Deferred `/progress`, `/body`, `/integrations`, OCR, device sync, weather, and adaptive coaching promises outside Phase 1.

### Current State

- A canonical UI absorption scope document now exists in `docs/tasks/product-briefs/`.
- The MVP boundary is now fixed around onboarding, goal capture, baseline capture, weekly plan, today workout, completion logging, and week status update.

### Constraints

- Do not reintroduce imported copy or promises that imply live AI, connected integrations, biometric authority, or hardcoded race-specific assumptions.
- Do not expand the Phase 1 scope by using visual docs to introduce new product logic.

### Risks / Open Questions

- Goal-type breadth for Phase 1 is still not fully pinned down.
- The simplest reliable week-status model may still need design pressure testing before it is treated as final.

### Next Recommended Role

DESIGNER

### Suggested Next Step

Produce the frontend flow spec for the bounded MVP surfaces and states so architecture can follow a locked product and UX scope.
```
