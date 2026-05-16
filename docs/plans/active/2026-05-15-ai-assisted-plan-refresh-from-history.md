# AI-Assisted Plan Refresh From History

## Status

Draft

## Owner

Architect

## Last Updated

2026-05-15

## Context

Hito already has:

- text-first plan creation
- saved-mode active plan lifecycle
- chosen start-date apply semantics
- preserved workout history across archived plans
- deterministic Garmin comparison
- bounded workout AI interpretation
- a newly defined longitudinal `RunnerCoachContext` direction

What it does not yet have is one explicit runner-triggered way to say:

- update my plan
- this has been too hard
- I missed several days
- keep the same goal, but reconsider the remaining schedule using my real history

That is the missing bridge between:

- "AI can explain one workout"
- and
- "AI can help revise the actual training plan like a real coach would"

## Problem Definition

The current product can:

- create a new plan from free text
- replace a plan through free text or advanced JSON
- preserve or archive history safely

But it cannot yet do one specific higher-value coaching action:

- reinterpret the active plan using the runner’s actual recent execution and current condition

This matters because the user does not only want summaries.

They want a coaching loop:

1. Hito creates the plan.
2. The runner trains against it.
3. Real history accumulates:
   completed, partial, skipped workouts
   Garmin evidence
   deterministic comparison
   workout body notes
4. The runner explicitly asks Hito to revise the plan.
5. AI uses the saved history plus the same goal and runner basics to propose a better remaining plan.

## Product Decision

Introduce one bounded explicit workflow:

- `Update plan`

Definition:

- the runner explicitly requests a plan refresh
- Hito uses canonical runner history and current active-plan context
- AI proposes revised plan input or revised canonical plan truth
- deterministic validation and existing apply/replacement safeguards still decide persistence

This is **not**:

- silent adaptation
- per-workout auto-mutation
- a broad plan editor
- a diagnosis-aware medical engine

## Canonical User Intent

The first release should support these explicit intents:

1. "This plan has been too hard."
2. "I missed the last few workouts."
3. "Rebuild the rest of the plan from where I am now."
4. "Keep the same race/goal, but adjust to my real current state."

The runner may also add short free text explaining:

- fatigue
- inconsistency
- practical schedule issues
- discomfort context

## Scope

### In scope

- one explicit runner-triggered `Update plan` action
- use of `RunnerCoachContext` as AI input
- preservation of the same primary goal unless the runner explicitly changes it
- interpretation of recent actual execution against plan truth
- explicit review and apply confirmation
- reuse of current plan-apply continuity safeguards

### Out of scope

- automatic background plan mutation
- workout-by-workout visual editing
- full plan CMS
- broad chat coach product
- diagnosis or treatment logic
- screenshot OCR in this slice

## Canonical Workflow

Recommended canonical path:

1. runner opens the current plan-management surface
2. runner chooses `Update plan`
3. runner gives short context in free text
4. backend loads:
   current active plan
   runner profile
   recent workout history
   deterministic actual-vs-planned patterns
   evidence completeness
   body-note caution context
5. backend builds one bounded `RunnerCoachContext`
6. backend builds one task-specific `PlanRefreshPromptInput`
7. OpenAI returns bounded structured refresh output
8. deterministic validation converts that output into canonical structured authoring input or canonical `training-plan-v2` truth
9. Hito shows the runner the proposed updated plan before apply
10. current apply/replacement continuity rules decide whether it can safely replace the active future schedule

## Relationship To Existing Work

### What this should reuse

#### 1. Existing text-first plan creation seam

- [src/lib/openai-plan-authoring.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/openai-plan-authoring.ts)

This is the nearest correct existing AI generation seam.

The refresh workflow should reuse its pattern:

- user intent in
- bounded structured output from OpenAI
- deterministic validation
- canonical plan truth out

#### 2. Existing active-plan lifecycle

- [src/components/PlanManagementDialog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/PlanManagementDialog.tsx)
- [src/lib/plan-apply-policy.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/plan-apply-policy.ts)

Refresh should not invent a second plan lifecycle.

#### 3. Existing longitudinal AI context direction

- [2026-05-15-longitudinal-ai-coach-context-plan.md](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-05-15-longitudinal-ai-coach-context-plan.md)

This refresh flow is a downstream use of that context layer, not a separate AI architecture.

## Core Product Rule

AI-assisted plan refresh must preserve one simple rule:

- the runner is asking to revise the **remaining plan**
- not to erase the recorded past

So v1 should treat:

- archived and logged history as fixed truth
- today/future active schedule as replaceable truth, subject to continuity rules

## Effective Refresh Semantics

### Recommended v1 semantics

When refresh is approved and applied:

- past logged workouts remain attached to historical truth
- the current active plan is replaced only for the future schedule window
- the same overall goal remains unless the runner explicitly asked to change it
- the new plan should start from the runner’s effective current state, not from the original untouched baseline

### Practical apply meaning

Recommended first-release behavior:

- refresh rebuilds the current active plan from `today` forward by default
- the system may reuse the existing chosen-start-date/apply seam later
- but the first explicit refresh slice should not introduce a second restart-date UX immediately

Reason:

- this keeps the mental model small
- the runner asks for an updated current plan
- not for a second advanced import-like scheduling tool

## What The AI Should Consider

AI refresh input should include:

- active goal and target date
- active plan preferences and constraints
- original authoring-relevant runner basics when available
- recent adherence:
  completed / partial / skipped
- recent actual workload where trustworthy
- Garmin-backed deterministic mismatches and patterns
- recent long-run and quality-workout consistency
- workout-scoped body-note caution context
- the runner’s explicit refresh request text

## What The AI Should Not Control

AI must not directly decide:

- whether plan replacement is safe
- whether saved history can be detached
- final date mapping
- stored lifecycle state
- diagnosis or injury classification
- unsupported physiological claims

## Deterministic Validation Boundary

OpenAI should return one bounded refresh artifact such as:

- refreshed structured authoring input
  or
- one bounded refresh-plan contract that still maps deterministically into canonical plan truth

The backend must still own:

- validation
- plan generation/build
- effective schedule mapping
- continuity checks
- apply blocking

## Update Plan Surface Recommendation

Smallest good v1:

- put `Update plan` inside `Open plan`

Why:

- it already owns active-plan lifecycle
- it already owns create/replace/import/delete semantics
- it avoids inventing a separate coach dashboard

Recommended UX shape:

- current plan summary
- one new secondary action:
  `Update plan`
- opens a short bounded prompt:
  "What should change?"
- examples:
  `This has been too hard.`
  `I missed the last 4 days. Rebuild the next weeks.`
  `Keep the same race goal but adjust to my real recent training.`

## Recommended Output Shape

Before apply, the runner should see:

- short reasoned summary:
  what the refresh is reacting to
- what stays the same:
  goal / target
- what changed:
  volume / intensity / progression / recovery emphasis
- apply or cancel

This should feel like:

- explicit plan review
- not hidden AI mutation

## Truth Boundaries To Preserve

- deterministic workout history remains canonical
- deterministic Garmin comparison remains canonical
- body notes remain workout-scoped caution context only
- AI may suggest a revised plan
- AI must not silently overwrite the current active plan
- current continuity guards must stay active

## What Becomes Easier For The Runner

- they no longer need to pretend they are creating a totally new plan when they really want a revision
- they can keep the same goal while adding real training-history context
- they can ask for a reset after missed days or excessive difficulty without losing the saved history model

## What We Must Not Reintroduce

- a second separate “AI coach” lifecycle outside `Open plan`
- silent future-workout rewrites
- raw OpenAI plan persistence without validation
- destructive history detachment
- a broad editable plan CMS

## Implementation Decomposition

### ARCHITECT decisions now

- define refresh as explicit active-plan lifecycle action
- define reuse of `RunnerCoachContext`
- define future-only replacement semantics
- define boundary between summary, proposal, and apply

### BACKEND changes

- build task-specific `PlanRefreshPromptInput`
- connect refresh generation to `RunnerCoachContext`
- validate refresh output
- reuse canonical plan build/apply seam
- preserve current continuity guards

### FRONTEND changes

- add `Update plan` entry inside `Open plan`
- collect short free-text refresh reason
- show proposed refresh summary
- require explicit apply

### QA requirements

- refresh path never detaches saved history
- same-goal refresh works after skipped workouts
- same-goal refresh works after “too hard” runner report
- malformed AI refresh output cannot overwrite the active plan
- apply/cancel leaves active-plan state consistent

## Risks

- the model can overfit to a short bad week
- the refresh can become too aggressive without clear guardrails
- the surface can blur into generic plan creation if the UX is not explicit
- future-only replacement semantics must stay compatible with current plan lifecycle truth

## Exit Criteria

- one canonical explicit `Update plan` workflow is defined
- reuse of `RunnerCoachContext` is explicit
- same-goal refresh semantics are clear
- deterministic validation and continuity boundaries are explicit
- placement inside `Open plan` is defined
- one next recommended role is chosen

## Next Recommended Role

BACKEND

## Suggested Next Step

After the first backend `RunnerCoachContext` seam exists, define and implement one bounded `PlanRefreshPromptInput` plus validated refresh-generation path that rebuilds the remaining active schedule from current saved history without detaching past truth.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Defined the first canonical AI-assisted plan-refresh workflow for Hito: an explicit `Update plan` action that uses longitudinal runner history to revise the remaining active schedule while preserving saved past truth.

### Key Decisions

- Put the first refresh action inside `Open plan`.
- Reuse the future `RunnerCoachContext` seam instead of inventing a separate AI architecture.
- Keep refresh explicit and confirm-before-apply; never silently mutate the plan.
- Treat past logged history as fixed truth and revise only the remaining active schedule.

### Current State

- Hito already has text-first plan generation, active-plan lifecycle controls, deterministic Garmin comparison, bounded workout AI interpretation, and preserved archived-plan history.
- Hito does not yet have a longitudinal AI context seam or a dedicated plan-refresh workflow.

### Constraints

- Do not create a broad coach chat or plan CMS in the first slice.
- Do not allow AI to bypass continuity guards or history-preservation rules.
- Do not let AI own date mapping, lifecycle state, or diagnosis-like judgments.

### Risks / Open Questions

- The best first refresh default is `today forward`, but later this may need chosen restart-date support.
- The runner-facing review surface should stay small and explicit so refresh does not look like silent automation.

### Next Recommended Role

BACKEND

### Suggested Next Step

Implement the first backend `RunnerCoachContext` seam, then add one task-specific validated refresh-generation path for explicit same-goal plan revision from real saved history.
```
