# Longitudinal AI Coach Context Plan

## Status

Draft

## Owner

Architect

## Last Updated

2026-05-15

## Context

The current Hito product already uses OpenAI in two bounded places only:

1. text-first plan creation:
   free text -> OpenAI -> validated structured authoring input -> canonical `training-plan-v2` plan truth
2. workout-detail `Feedback` interpretation:
   deterministic Garmin comparison -> bounded AI explanation and next-workout recommendation

That means AI is not currently acting like a longitudinal coach with access to the full runner history.

At the same time, the saved-mode product now already preserves most of the history that a future coaching layer would need:

- `runner_profiles`
- active and archived `plan_cycles`
- `planned_workouts`
- `workout_logs`
- `workout_result_assets`
- `workout_actual_metrics`
- `workout_comparisons`
- `workout_ai_insights`
- workout-scoped `body_notes`

So the core question is no longer "can Hito save the history?"

The real question is:
- how to expose that history to AI through one safe canonical context seam
- without turning the system into an opaque AI memory product
- and without letting AI replace deterministic product truth

## Is This Realistic?

Yes.

It is realistic if Hito does **not** give AI unconstrained raw authority over the whole database and instead introduces one backend-owned longitudinal runner context layer.

Recommended model:

- canonical persisted user truth stays in Supabase
- backend builds one bounded `RunnerCoachContext`
- AI receives only that task-scoped context
- deterministic summaries and metrics remain primary wherever math or product truth matters

This is a normal next step from the current architecture.

It does **not** require a second product database, a vector-memory platform, or a general-purpose agent runtime in v1.

## Existing Work Audit

### What already exists

#### 1. Free-text plan creation through OpenAI

Current and still valid:

- [src/lib/openai-plan-authoring.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/openai-plan-authoring.ts)
- [docs/plans/archive/2026-05-07-openai-text-to-plan-authoring-plan.md](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/archive/2026-05-07-openai-text-to-plan-authoring-plan.md)
- [docs/plans/archive/2026-05-12-text-first-plan-creation-and-start-date-policy-plan.md](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/archive/2026-05-12-text-first-plan-creation-and-start-date-policy-plan.md)

Status:
- current
- implemented
- bounded correctly

#### 2. Bounded workout AI interpretation

Current and still valid:

- [src/lib/workout-result-import/generate-workout-ai-insight.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/workout-result-import/generate-workout-ai-insight.ts)
- [docs/plans/active/2026-05-15-workout-body-note-modal-and-ai-context.md](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-05-15-workout-body-note-modal-and-ai-context.md)
- [docs/plans/active/2026-05-06-workout-screenshot-openai-verdict-plan.md](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-05-06-workout-screenshot-openai-verdict-plan.md)

Status:
- current
- implemented in the Garmin path
- deliberately narrow

#### 3. Runner-level profile expansion

Relevant current dependency:

- [docs/plans/active/2026-05-14-heart-rate-zones-profile-and-aet-estimation-plan.md](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-05-14-heart-rate-zones-profile-and-aet-estimation-plan.md)

Status:
- partial
- still planning, not fully implemented
- relevant because longitudinal coaching should eventually read canonical runner physiology/profile truth from one place

### What does not exist yet

No prior canonical plan was found for:

- one longitudinal per-runner AI coaching context
- one AI-readable full-history runner profile
- one backend-owned coaching summary seam spanning archived plans, logged workouts, Garmin evidence, comparisons, and prior AI outputs

Conclusion:

- reuse the current bounded OpenAI seams
- reuse the existing Supabase history tables
- add one new canonical **context-building layer**
- do not invent a parallel AI architecture

## What We Reuse From Earlier Work

- text-first authoring already proved the correct AI boundary:
  OpenAI proposes; deterministic validation owns persistence
- workout-feedback AI already proved the correct evidence boundary:
  deterministic comparison stays primary; AI interpretation stays secondary
- saved-mode plan lifecycle already preserves history through archived plans rather than destructive deletion
- workout-scoped body notes already exist as bounded caution context

These are the right building blocks for a longitudinal coach layer.

## Problem Definition

Today Hito can answer only narrow AI questions:

- "turn this request into a plan"
- "explain this one uploaded run against this one planned workout"

It cannot yet answer broader coaching questions such as:

- how is this runner trending over the last 6 to 12 weeks?
- how often are they completing quality sessions?
- are they undertraining, drifting, or showing stable consistency?
- what does this specific workout mean in the context of recent weeks?
- what recurring discomfort or caution patterns are showing up?

Current limitation:

- AI prompt inputs are workout-local or authoring-local
- there is no reusable longitudinal runner context builder
- `runner_profiles` still hold only bounded setup/settings truth, not a coaching-ready history summary
- the current AI seams do not load archived-plan history or multi-workout patterns

## Product Decision

Hito should introduce one canonical internal capability:

- `RunnerCoachContext`

Definition:

- a backend-owned, task-scoped, AI-readable context object for one authenticated runner
- built only from canonical persisted truth
- assembled on demand for specific coaching tasks
- never treated as the source of record itself

This should become the single internal context seam for future AI coaching tasks such as:

1. workout-specific historical summary
2. weekly or monthly training dynamics summary
3. next-workout recommendation with recent-history awareness
4. future runner-facing "coach summary" surfaces or chat

This is a **backend context layer**, not a new user-facing product by itself.

## Current AI Usage Audit

### AI is currently used here

1. `src/lib/openai-plan-authoring.ts`
   for free-text plan authoring only
2. `src/lib/workout-result-import/generate-workout-ai-insight.ts`
   for bounded workout interpretation only

### AI is not currently used here

- not for longitudinal training summaries
- not for cross-workout pattern analysis
- not for full runner history review
- not for archived-plan history synthesis
- not for cross-workout body-note patterns
- not for dynamic program management

### Current practical answer to the user question

No, AI is **not** currently "everywhere" in Hito.

Right now it is present only in:

- plan generation
- bounded workout feedback wording and recommendation

It is **not yet** acting like a real coach with full per-user historical context.

## Canonical Runner Coach Context

### Core rule

The AI layer should never query arbitrary raw tables directly from UI flows.

Instead:

`Supabase canonical truth -> deterministic context builder -> RunnerCoachContext -> task-specific AI prompt`

### Recommended `RunnerCoachContext` sections

#### 1. Runner identity and profile

- runner id
- display name
- goal label
- profile basics already stored canonically:
  age
  weight
  height
- future physiological truth when implemented:
  heart-rate zones
  AeT-derived zone metadata

#### 2. Active plan context

- active plan id
- title
- source kind
- effective start date
- target date
- plan preferences
- current week number
- active-plan upcoming workout summary

#### 3. Plan history summary

- all active + archived plan cycles for that user
- each plan summarized, not dumped in full by default
- start/end window
- plan goal
- plan source kind
- whether the runner completed it partially, fully, or abandoned it

#### 4. Workout history summary

- date-ordered logged workouts across active and archived plans
- completion state
- manual actuals
- body-note presence
- workout type and title
- planned duration/distance
- recent windows:
  last 7 days
  last 28 days
  last 84 days

#### 5. Evidence history summary

- Garmin evidence attached count
- workouts with normalized actual metrics
- workouts with deterministic comparison
- workouts with AI feedback
- screenshot evidence later when that path exists

#### 6. Deterministic longitudinal aggregates

These should be backend-computed before AI sees them:

- workouts completed / partial / skipped
- completion rate by recent window
- planned vs actual volume by recent window where trustworthy
- number of consecutive missed workouts
- quality-session completion rate
- long-run consistency
- body-note incidence count and recent severity summary

AI should interpret these aggregates, not compute them from scratch.

#### 7. Recent notable events

One bounded event list for the recent horizon:

- plan replaced
- schedule cleared
- workout skipped
- Garmin evidence attached
- recommendation escalated to `review`
- body note with elevated severity

This is useful for runner summaries without forcing the model to reconstruct narrative from every row.

## Canonical Pipeline

Recommended canonical pipeline:

1. canonical user truth persists in Supabase
2. deterministic backend loaders fetch only this runner’s history
3. deterministic backend aggregation builds `RunnerCoachContext`
4. task-specific prompt builder narrows that context again
5. OpenAI returns bounded interpretation text or structured summary output
6. deterministic quality gate validates output shape and basic language quality
7. result is stored only if the product needs persistence

This keeps AI downstream of trusted history rather than upstream of it.

## Truth Boundaries To Preserve

### Deterministic truth remains primary for

- stored runner identity
- plan ownership
- active vs archived plan state
- workout logs
- Garmin parsed actual metrics
- deterministic planned-vs-actual comparison
- body-note storage
- completion counts and recent-history aggregates

### AI may interpret

- what recent adherence patterns suggest
- how one workout fits into recent weeks
- whether recent load looks steady or inconsistent
- how to phrase a conservative next-step suggestion
- a human-readable training summary

### AI must not become truth for

- completion status
- date arithmetic
- training volume math
- plan lifecycle state
- injury diagnosis
- silent plan changes
- unsupported physiological conclusions

## What AI May Use

OpenAI may receive:

- bounded runner profile truth
- active-plan summary
- archived-plan summary
- recent workout history summary
- deterministic longitudinal aggregates
- current workout deterministic comparison
- prior bounded AI outputs only as reference, not as source truth
- workout-scoped body notes as caution context

## What AI Must Not Pretend To Know

- hidden cause of pain or injury
- exact physiology from incomplete evidence
- training-zone truth that has not been derived canonically
- future performance guarantees
- that the plan has already been adapted unless the backend explicitly changed it

## Storage And Query Direction

### Recommended v1 approach

Do **not** start with a new persistent AI-memory subsystem.

Start with:

- one backend `RunnerCoachContext` builder
- one deterministic longitudinal aggregate helper
- one task-specific prompt-input builder per AI use case

### Why this is the right first step

- the canonical raw history already exists in Supabase
- current AI usage is still bounded
- token budgets require summarization anyway
- on-demand deterministic shaping is simpler than inventing a second persistent truth layer

### What may be added later if proven necessary

Only if performance or token cost becomes a real issue:

- one cached `runner_history_summary` style table or materialized summary payload
- one regeneration job for stale summaries

That should be a later optimization, not the starting architecture.

## First Recommended AI Use Cases

The first longitudinal uses should stay small and product-relevant:

### 1. Training dynamics summary

Examples:

- "How has the last month gone?"
- "What patterns stand out in my recent training?"

Why first:

- high runner value
- no need for live chat product yet
- directly benefits from preserved history

### 2. Workout-specific historical context

Examples:

- "How does this workout compare with my recent similar work?"
- "Was this missed session part of a pattern?"

Why second:

- fits existing workout-detail `Feedback`
- builds on the current Garmin + deterministic comparison foundation

### 3. Future bounded coach summary surface or chat

This should wait until the context layer is trustworthy.

## Recommended Delivery Sequence

### Phase 0: Context contract

Goal:

- define one canonical `RunnerCoachContext` TypeScript/domain contract

Deliver:

- field list
- recent-window rules
- aggregate rules
- task-scoped input variants

Risk:

- overbuilding a generic memory schema

Rollback posture:

- keep it as a non-persisted contract layer only

Next likely role:

- BACKEND

### Phase 1: Deterministic runner-history aggregation

Goal:

- add one backend seam that collects and summarizes a runner’s longitudinal history

Deliver:

- runner profile summary
- plan history summary
- recent workout history summary
- deterministic aggregates
- notable-events summary

Risk:

- mixing raw row truth and interpreted summary truth

Rollback posture:

- keep raw tables as sole source of record
- treat aggregates as derived and replaceable

Next likely role:

- BACKEND

### Phase 2: First longitudinal AI input builder

Goal:

- build one task-specific prompt input using `RunnerCoachContext`

Recommended first task:

- training dynamics summary

Risk:

- prompt bloat or token overflow

Rollback posture:

- reduce horizon and event depth
- keep only recent-window summary plus notable events

Next likely role:

- BACKEND

### Phase 3: First runner-facing summary surface

Goal:

- expose one bounded longitudinal AI summary to the runner

Recommended first surface:

- summary block or modal, not a full coach chat

Risk:

- overclaiming coaching authority too early

Rollback posture:

- keep it as explicit summary / reflection wording
- not "adaptive coach"

Next likely role:

- FRONTEND

### Phase 4: Expand workout-detail historical awareness

Goal:

- let workout `Feedback` or later summary surfaces use recent-history context when appropriate

Risk:

- recommendation becoming too broad or opaque

Rollback posture:

- deterministic workout comparison remains primary
- historical context stays secondary explanation

Next likely role:

- BACKEND

## Backend Responsibilities

- own the `RunnerCoachContext` builder
- own longitudinal aggregates
- own task-scoped prompt inputs
- own output validation and storage decisions
- enforce per-user isolation
- keep AI downstream of deterministic truth

## Frontend Responsibilities

- expose runner-facing summary surfaces only after backend context exists
- never assemble the coaching context on the client
- never let the browser invent history math or coaching conclusions

## QA Expectations

- AI context never mixes data across users
- AI summaries reflect archived + active saved history correctly
- deterministic aggregates match stored workout truth
- body-note context softens interpretation without producing diagnosis
- if Garmin/screenshot evidence is missing, the summary stays honest
- if history is sparse, AI says so plainly
- no silent plan changes occur from longitudinal AI output

## What We Must Not Build

- a freeform “AI has raw database access” system
- a second profile database outside Supabase
- an unbounded chat-memory platform before task-specific context exists
- AI-computed source-of-truth metrics
- diagnosis, treatment, or medical-risk scoring
- automatic plan adaptation in the same first slice

## Open Questions

1. What should be the first runner-facing longitudinal surface:
   a summary card, a modal, or a dedicated route?
2. Should prior `workout_ai_insights` be included in context by default, or only when the user asks about a specific past workout?
3. When screenshot OCR arrives later, should screenshot-derived normalized metrics merge into the same evidence-history summary with Garmin, or remain source-labeled but shared?
4. How much archived-plan detail is useful before prompt size becomes wasteful?
5. Should future heart-rate-zone truth be required before richer physiological coaching, or only additive when available?

## Risks

- the model can sound more authoritative than the product actually is
- raw-history prompt size can grow too large without deterministic summarization
- confusing prior AI outputs with canonical fact could create AI-on-AI drift
- trying to solve chat, adaptation, summary, and workout feedback at once would overbuild the system

## Exit Criteria

- one canonical longitudinal AI context direction is defined
- current AI usage and current non-usage are explicit
- deterministic vs AI truth boundaries are explicit
- one recommended storage/query approach exists without inventing a second memory subsystem
- one practical phase order exists
- one next recommended role is chosen

## Next Recommended Role

BACKEND

## Suggested Next Step

Implement the first backend-only `RunnerCoachContext` contract and deterministic history-aggregate builder, then wire one bounded longitudinal AI summary task on top of that context before designing a broader runner-facing coach surface.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Defined the first canonical architecture for giving AI bounded access to a runner’s longitudinal Hito history without turning AI into the source of truth.

### Key Decisions

- Keep Supabase canonical user history as the only source of record.
- Introduce one backend-owned `RunnerCoachContext` builder instead of direct raw AI access to the database.
- Reuse the existing bounded AI pattern: deterministic truth first, AI interpretation second.
- Start with longitudinal summaries and historical workout context before any broad coach-chat or adaptive-plan behavior.

### Current State

- OpenAI is live only for text-to-plan authoring and bounded workout feedback.
- Hito already stores most of the per-user history needed for longitudinal coaching across profiles, plans, workouts, Garmin evidence, deterministic comparisons, AI insights, and workout-scoped body notes.
- No canonical longitudinal AI context layer exists yet.

### Constraints

- Do not create a second AI-memory subsystem in v1.
- Do not let AI replace deterministic metrics, status, or plan lifecycle truth.
- Do not broaden into diagnosis, automatic plan mutation, or a generic coach chat platform in the first slice.

### Risks / Open Questions

- Prompt size can grow quickly without deterministic summarization.
- Historical AI outputs must not become mistaken for canonical fact.
- The first runner-facing longitudinal surface is still undecided and should wait until the backend context seam is trustworthy.

### Next Recommended Role

BACKEND

### Suggested Next Step

Add one backend `RunnerCoachContext` contract plus deterministic longitudinal aggregate builder from existing Supabase history, then use that seam for a first bounded training-dynamics summary task.
```
