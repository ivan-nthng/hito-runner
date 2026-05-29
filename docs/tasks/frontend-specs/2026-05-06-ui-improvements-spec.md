# Hito Running UI Improvements Spec

## Status

backlog

## Type

frontend_spec

## Priority

medium

## Next Recommended Role

FRONTEND

## Task

Advance Hito Running UI Improvements Spec.

## Stage

FRONTEND implementation spec

## Exact Handoff Prompt

```text
ROLE: FRONTEND

TASK:
Advance Hito Running UI Improvements Spec.

STAGE:
FRONTEND implementation spec

CONTEXT:
- Source path: docs/tasks/frontend-specs/2026-05-06-ui-improvements-spec.md
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

Designer Agent

## Last Updated

2026-05-06

## Context

Hito Running now has a working saved-mode product loop: login, JSON-first onboarding, persisted weekly plan, workout detail, completion logging, and backend-derived week status. The next visual and product refinement pass should improve clarity and reduce clutter without changing the underlying product logic.

This pass should stay grounded in the current app:

- preserve the strongest parts of the imported visual baseline
- preserve the current route structure and data seam
- make rest days feel calmer and less over-explained
- tighten the workout-detail page and its right-side information architecture
- improve the runner profile area so it behaves like a useful control center rather than a placeholder
- prepare a practical upload/import flow that can be exercised against real tester accounts through the existing test-user lifecycle

This is not a redesign of the whole product. It is a focused refinement pass for current working surfaces.

## Goals

- simplify rest-day presentation so it feels intentionally light rather than like an empty workout
- reduce heavy card clutter and wasted spacing in workout detail and related surfaces
- turn the right-side workout panel into one grouped frame instead of a stack of separate boxes
- make the runner profile dropdown more useful and more truthful
- add a lightweight, understandable `Upload JSON` flow entry from runner profile
- reduce explanatory copy where the interface already communicates enough
- keep future data constraints visible, especially around rest days that may later include small assignments

## Affected Surfaces

- workout detail route
  header
  overview tab
  completion tab
  right-side detail panel
  prev and next navigation cards
- home / today hero only where its treatment should stay aligned with workout-detail simplification
- runner profile area in the app shell
- runner profile dropdown
- onboarding / import-related UI as the visual baseline for a future in-product `Upload JSON` flow

## Before / After Intent

### Current Intent

- workout detail tries to fully populate every day, including rest days
- multiple bordered cards compete for attention in the right-side panel
- the page carries more explanatory copy than necessary
- the runner profile area still behaves partly like a system placeholder
- JSON import exists as onboarding infrastructure, but not as a lightweight saved-mode user flow

### Target Intent

- rest days feel calm, intentional, and visually lighter
- workout pages feel tighter, more premium, and less fragmented
- the right-side panel reads as one grouped frame with internal sections
- the runner profile dropdown becomes the obvious place for personal plan context and import actions
- upload/import becomes a small, credible flow instead of a big onboarding-only surface

## Rest Day Presentation Rules

### Canonical Rule

If a day is `rest`, do not present it as a standard workout day.

### Rest Day Header Rules

- do not show explicit `Rest` copy as the main headline treatment
- do not show `Distance`, `Duration`, or `Load`
- replace workout-stat treatment with a calm flat illustration or quiet visual placeholder
- the title area should feel like a pause in the plan, not like a missing workout
- use minimal supportive copy only if needed to orient the runner

### Rest Day Overview Rules

- overview can stay intentionally sparse
- do not force `Execution cues`
- do not force `Fueling & recovery`
- if no assignment exists, a light reflective or recovery-oriented placeholder is enough
- overall density should be much lower than a workout day

### Rest Day Right-Side Rules

Remove from rest-day presentation:

- `Targets`
- `Workout note`
- workout-specific detail sections

Keep on rest days:

- `Week Status`
- `Preview Boundary`
- `Previous` and `Next` navigation controls

### Rest Day Copy Reduction

Avoid:

- explicit explanatory `rest day` body copy unless it adds real product clarity
- instructional filler like `sleep, hydrate, walk` as the main content
- fake coaching language to fill visual space

Prefer:

- no headline claim beyond the date context
- one short support line only when useful
- the illustration or placeholder carrying most of the mood

### Future Data Constraint

Rest days must stay visually sparse by default, but the design must leave room for future exceptions where a rest day may include one light assignment such as:

- mobility
- strength
- general conditioning
- short recovery instruction

If such an assignment exists:

- keep the page visually lighter than a full workout day
- allow one small assignment block in the main content area
- still avoid workout metrics like distance, duration, and load unless the assignment truly includes them

## Surface/Card Simplification Rules

### Global Direction

Cards and surfaces should become tighter, smaller, and less repetitive.

### Canonical Simplification Rules

- reduce padding where cards currently feel overframed
- reduce vertical gaps between related sections
- prefer darker shared backdrops and subtle gradients over repeated bordered-card boxes
- reserve strong border treatment for state emphasis, not every block
- use dividers to organize grouped information before reaching for new cards

### Workout Detail Main Content

- preserve current hierarchy: header -> tabs -> main content -> side detail -> prev/next
- make content blocks feel denser and more intentional
- `Fueling & recovery` should lose its current heavy boxed-card feel
- prefer a flatter or darker grouped treatment for supportive subcontent
- avoid making every sub-block look like a separate mini-surface

### Right-Side Detail Panel

Current sections:

- `Targets`
- `Workout note`
- `Week status`
- `Preview Boundary`
- conditional `Skipped`

Target treatment:

- the whole right column should read as one grouped frame
- sections should be separated mostly by dividers, not by distinct bordered cards
- spacing between sections should be tight and consistent
- preserve colored emphasis only where it already helps:
  signal emphasis for `Targets` or `Preview Boundary`
  status color in `Week Status`
  destructive emphasis for `Skipped` when present

### Right-Side Panel Rules

- one shared outer frame
- minimal section padding
- subtle divider lines between sections
- remove visual repetition from stacked borders
- keep titles small and quiet
- keep metadata compact

### Navigation Card Rules

`Previous` and `Next` cards should remain, but they can also tighten:

- slightly reduced padding
- clearer date/title hierarchy
- less ornamental empty space

## Runner Profile Changes

### Current Problem

The runner profile area still communicates placeholder/system state more than personal plan state. It also duplicates `Sign out` in the top-level header area and in the dropdown.

### Required Changes

- remove top-level `Sign out` from the header area
- keep sign-out only inside the runner profile dropdown
- runner profile trigger should show:
  runner name
  current plan name

### Canonical Profile Content

Primary line:

- runner name, for example `Ivan`

Secondary line:

- current plan name, for example `Half Marathon Plan`

If exact real values are unavailable:

- fall back gracefully to a truthful generic state
- never invent fake names or fake plan titles

### Dropdown Changes

Add one actionable item:

- `Upload JSON`

Keep:

- `Sign out`

Later-only placeholder items such as settings or account may remain visually secondary, but they should not compete with the new import action.

### Profile Area Copy Reduction

Reduce or remove:

- generic labels like `Runner profile`
- generic labels like `Saved progress enabled`
- system-heavy metadata that belongs elsewhere

Prefer:

- one personal identifier
- one plan identifier
- the dropdown for secondary actions

## Upload JSON Flow

### Entry Point

User opens `Upload JSON` from the runner profile dropdown.

### Flow Shape

This should be a lightweight in-product import flow, not a full-page onboarding replacement.

Recommended container:

- modal on desktop
- drawer or modal-equivalent on mobile

### Step 1: Explain

The first view should explain:

- what the JSON import does
- that the user can work with their agent to generate or fill the JSON
- what kinds of inputs are useful when preparing that JSON

Useful input examples to mention:

- goals
- weight
- height
- recent results
- recent training context

This explanation should stay practical and short. It should not read like documentation.

### Step 2: Upload

Provide:

- file upload area for a JSON file
- optional visual indication that the file is being parsed
- clear parse failure messaging if the shape is invalid

The flow should feel lighter than the current onboarding gate:

- less educational chrome
- less large-surface scaffolding
- more compact action-first layout

### Step 3: Confirmation

After parsing, show a confirmation step with:

- plan name
- number of days
- number of workouts

Action buttons:

- `Apply`
- `Cancel`

The user should explicitly confirm before the plan is applied.

### Step 4: Apply

After confirmation:

- show a short applying state
- then return the user to the saved plan view
- the visible plan should reflect the newly applied data

### Flow Copy Direction

Reduce:

- long schema explanation
- field-level technical guidance
- repeated reminders about later exports

Prefer:

- short orientation
- short trust statement
- compact confirmation summary

### Relationship To Onboarding

This new flow is not a new product logic branch.

It should be treated as a lighter saved-mode import surface that reuses the same underlying import truth where possible, while presenting it with much less onboarding ceremony.

### Tester-Lifecycle Relevance

Because test-user lifecycle now exists, this flow should be spec'd in a way that Frontend can verify it against:

- a fresh tester account with no plan
- a tester account that already has a plan
- a reset tester account returned to onboarding state

## Interaction Notes

- removing top-level `Sign out` should not remove any sign-out capability; it simply consolidates it in the dropdown
- `Upload JSON` should be a primary dropdown action, not buried after low-value placeholders
- rest-day calmness should not break prev/next continuity
- rest-day UI should still support direct deep links from calendar cells
- grouped right-side panel should remain scannable on both desktop and narrower layouts
- any modal or drawer used for import must keep the action sequence obvious:
  explain -> upload -> confirm -> apply

## Open Questions / Edge Cases

- If the saved runner name is not yet available in the current snapshot, should the UI temporarily show email, username, or a neutral fallback label?
- If current plan naming is inconsistent between imported JSON titles and generated plan titles, which label should the runner profile show first?
- For rest days that contain optional assignments later, should the assignment appear inline in the main content area or as one small side-panel section?
- If a user uploads a JSON file that represents a replacement plan while an active plan already exists, should confirmation copy explicitly say it will replace the visible plan?
- Should `Upload JSON` be available only in authenticated saved mode, or also shown in onboarding-required mode as a route into setup completion?

## Out Of Scope

- redesigning the full home screen
- redesigning the full progress screen
- redesigning body or integrations surfaces
- changing product logic around week status calculation
- changing plan generation logic
- changing auth flows
- building JSON export
- broad design-system refactoring
- introducing AI product framing

## Next Recommended Role

FRONTEND

## Suggested Next Step

Implement this refinement pass in the current product surfaces: add rest-day-specific workout presentation, tighten the workout-detail and right-side panel layout, simplify copy and card density, move sign-out fully into the runner profile dropdown, and build the lightweight `Upload JSON` modal or drawer flow using the current import infrastructure as the behavioral baseline.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Created one canonical UI improvement spec for the next Hito refinement pass, focused on rest-day simplification, tighter workout-detail surfaces, runner profile cleanup, and a lightweight in-product `Upload JSON` flow.

### Key Decisions

- Rest days should stop pretending to be normal workout days and instead use intentionally sparse presentation with no workout metrics or filler copy by default.
- The workout-detail right column should become one grouped frame with dividers and tighter spacing, while the runner profile dropdown becomes the primary home for sign-out and the new `Upload JSON` action.

### Current State

- A practical frontend refinement spec now exists in `docs/tasks/frontend-specs/`.
- Frontend has a concrete next-pass target that stays inside the current route structure and product logic.

### Constraints

- Do not redesign the whole app or change the underlying product logic for week status, auth, or plan application.
- Do not reintroduce fake coaching, fake connected states, or extra explanatory copy where the UI can already communicate with simpler structure.

### Risks / Open Questions

- The current snapshot may not yet expose ideal runner-display and plan-display labels for the profile area, so implementation may need truthful fallbacks.
- Rest-day presentation must stay light by default while still leaving room for future small assignments such as mobility or strength.

### Next Recommended Role

FRONTEND

### Suggested Next Step

Implement the bounded UI refinement pass on workout detail, runner profile, and import flow surfaces, then verify it with tester accounts using the documented test-user lifecycle.
```
