Status

JSON/Markdown export wired in `Open plan`; Safari download bug fixed; PDF pending

Owner

FRONTEND

Last Updated

2026-05-15

Context

Saved mode now has one real `Open plan` surface with:
- active-plan summary
- text-first replacement
- advanced JSON import with user-chosen start day
- clear-upcoming lifecycle
- delete-plan lifecycle

What was missing was the first real export feature from that same saved-mode ownership point.

The goal is not to build three unrelated download buttons. The goal is to define one canonical export model for the active saved plan, then project that model into:
- JSON
- Markdown
- PDF

Problem Definition

The current product is honest that JSON export is later, but the saved-mode plan-management surface is now mature enough that runners need a way to take the active plan out of Hito.

Without one export model, the repo risks creating:
- one machine export for import compatibility
- one separate Markdown summary
- one separate PDF print renderer

That would create three subtly different truths. This slice should avoid that.

Export Surface

V1 export should live inside `Open plan`, because that is already the canonical saved-mode plan-management surface.

Recommendation:
- keep export behind one small `Export` action in the `Open plan` header area or one quiet overflow menu
- do not add three peer buttons directly into the main modal body
- when no active plan exists, export is absent rather than disabled

V1 visible actions:
- `Export as JSON`
- `Export as Markdown`
- `Export as PDF`

This keeps one discovery point and avoids making export feel like a second management product.

Canonical Export Model

All three formats should derive from one backend-owned `active plan export payload`.

That payload should be shaped from:
- the current active `plan_cycle`
- its current active `planned_workouts`
- canonical normalized workout fields already used by saved-mode rendering

It must not be shaped from:
- route-local UI state
- raw imported source files
- preview data
- archived plans in v1

Recommended payload structure:

1. `plan`
- `schema_version`
- `plan_id`
- `title`
- `goal_summary`
- `created_for`
- `effective_start_date`
- `effective_end_date`
- `target_date`
- `source_kind`
- `exported_at`

2. `summary`
- `day_count`
- `workout_count`
- `weeks_count`

3. `workouts[]`
- ordered by effective calendar date
- each item should include:
  - `workout_id`
  - `date`
  - `weekday`
  - `week_number`
  - `phase`
  - `workout_type`
  - `source_workout_type`
  - `title`
  - `notes`
  - `steps`
  - `display_distance_km`
  - `display_duration_min`
  - `primary_target`
  - `primary_guidance`

This becomes the only export truth. JSON, Markdown, and PDF are projections of this payload, not independent serializers.

What Must Match Across All Formats

- the same active plan only
- the same effective applied dates
- the same ordered workout sequence
- the same workout titles and workout-type identity
- the same runner-visible distance and duration truth
- the same canonical omission behavior for unsupported fields

Format Rules

JSON

Purpose:
- machine-readable export
- round-trip-friendly advanced plan handoff
- canonical structured truth

V1 JSON rule:
- export the active saved plan as canonical `training-plan-v2`-compatible truth, using the current effective applied schedule
- the exported `start_date` should reflect the active plan’s effective saved start, not an older source-file start that no longer governs apply semantics
- preserve structured workout detail, including `steps`
- keep runtime-only state out

JSON should not include:
- completion state
- Garmin evidence state
- deterministic comparison state
- AI feedback state
- route/UI flags

Markdown

Purpose:
- readable sharing
- quick review outside the app
- lightweight copy/paste artifact

V1 Markdown rule:
- derive from the same export payload
- present a human-readable week-by-week or date-ordered plan summary
- include title, goal, effective start, target date if present, then ordered workout entries
- each workout should stay concise and runner-readable

Markdown should include:
- day/date
- workout type label
- workout title
- short distance and/or duration when available
- short target/guidance line when available

Markdown should not try to mirror full step-by-step technical structure unless that detail is already compact and readable.

PDF

Purpose:
- clean runner-facing printable/shareable plan
- simple calendar-style document

V1 PDF rule:
- derive from the same export payload
- render a simplified calendar-style schedule, not a diagnostic report
- prefer grouped weekly sections with clear date rows rather than a dense technical worksheet

PDF Rules

PDF v1 should include for each workout day:
- day/date
- workout icon or broad workout type indicator
- workout type label
- workout name/title
- distance when available
- simple execution guidance
- pace when available and normalized for display
- heart rate when available and normalized for display

PDF v1 may also include at the top:
- plan title
- short goal summary
- effective start date
- target date if present

PDF v1 should explicitly exclude:
- full step-by-step technical breakdown
- raw `steps` JSON
- dense metric stacks
- Garmin evidence data
- deterministic comparison layers
- AI recommendation/feedback layers
- backend/status diagnostics
- archived-history metadata

What PDF Intentionally Simplifies

- interval internals collapse into a runner-facing workout label plus short guidance
- segment structure is summarized, not expanded into technical prescription trees
- pace and heart-rate appear only when they are already clean display targets
- empty fields should disappear instead of creating placeholder clutter

Unsupported / Missing Data Rules

JSON
- preserve missing canonical fields honestly as absent or null according to the contract
- do not synthesize display values that are not canonical

Markdown
- if pace or heart rate are unavailable, omit them
- if distance is unavailable but duration exists, show duration only
- if both distance and duration are unavailable, keep the workout title/type and any short guidance only

PDF
- if pace is unavailable or not normalized, omit the pace line
- if heart rate is unavailable or not normalized, omit the heart-rate line
- if a workout is rest, show rest clearly and do not synthesize training metrics
- do not show `—` repeatedly across the page just to fill absent data

What JSON Start/Structure Truth Still Means Here

- JSON remains the canonical structured export/import contract
- exported JSON reflects the active saved plan as currently scheduled
- the export is not a replay of whatever raw file was originally imported
- chosen-start-day effects are already resolved into the exported schedule dates

Backend Responsibilities

- own the canonical export payload
- read only the active saved `plan_cycle` plus its active `planned_workouts`
- normalize export fields once
- ensure JSON, Markdown, and PDF all derive from the same payload
- enforce that export does not leak runtime-only saved state
- decide PDF generation ownership explicitly

PDF ownership recommendation:
- backend should own PDF document generation or PDF-ready rendering, because the payload and omission rules are canonical server concerns
- frontend should not assemble a second export document model client-side

Frontend Responsibilities

- expose one compact export trigger inside `Open plan`
- show the three export choices from that one entry point
- pass only the active export request and desired format
- handle loading, success, and download UX
- avoid duplicating export shaping or print logic in the browser

Rollout Recommendation

Recommended smallest safe rollout:

1. JSON + Markdown together
2. PDF immediately after the canonical payload is proven stable

Why this sequence is best:
- JSON and Markdown validate the canonical export payload quickly
- they prove the active-plan selection, effective-date mapping, and omission rules first
- PDF adds layout, pagination, and print QA complexity, so it should not be the first format used to discover payload mistakes

Do not ship PDF-first.

Implementation Update - 2026-05-15

Implemented in this slice:
- one backend-owned active-plan export payload in `src/lib/plan-export.ts`
- one authenticated server export action in `src/lib/training-api.ts`
- JSON projection into canonical `training-plan-v2` using active saved workout dates
- Markdown projection from the same payload for readable sharing
- explicit omission of runtime-only saved-mode state: workout logs, Garmin assets, deterministic comparison, AI feedback, UI flags, and route state
- honest missing-data behavior: unavailable distance, pace, and heart-rate are omitted rather than fabricated

Deferred from this slice:
- visible `Open plan` export controls
- PDF generation
- archived-plan export

What We Leave For Later

- archived-plan export
- bulk export across multiple plans
- workout-result or Garmin-feedback export
- comparison-report PDF
- custom print themes
- one-click public share links
- full technical workout-internals PDF

QA Expectations

- export is available only when an active plan exists
- all three formats reflect the same active plan title and effective start window
- exported schedule dates match the currently applied saved schedule, including chosen-start-day shifts
- JSON remains import-compatible with canonical `training-plan-v2` expectations
- Markdown stays readable and ordered correctly
- PDF stays visually clean, omits unsupported fields quietly, and does not leak technical comparison or feedback data
- deleting or clearing the active plan removes export availability from `Open plan`

Risks

- exporting raw imported source instead of active saved truth would reintroduce split truth
- PDF-first implementation could create a second client-side document model
- too much detail in PDF would turn a runner document into a technical artifact
- archived-plan export in v1 would complicate lifecycle semantics before active-plan export is stable

Exit Criteria

- [x] one canonical export payload is defined and accepted
- [x] export is scoped to the active saved plan only
- [x] JSON and Markdown derive from the same source model
- [ ] PDF derives from the same source model
- [x] PDF inclusion and omission rules are explicit
- [x] backend/frontend ownership is unambiguous
- [x] rollout order is fixed and small

Next Recommended Role

FRONTEND

Suggested Next Step

Wire the `Open plan` export controls for JSON and Markdown to the backend export action, then keep PDF as the next backend/document-generation slice from the same payload.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Implemented the first backend plan-export slice from saved-mode `Open plan`: one backend-owned active-plan export payload now projects to JSON and Markdown, with PDF still later.

### Key Decisions

- Export belongs inside `Open plan` behind one compact export trigger, not as three separate primary buttons.
- All formats must derive from one backend-shaped active-plan payload, not from route-local UI state or raw imported files.
- V1 export scope is active plan only; archived-plan export waits.
- Recommended rollout is JSON + Markdown first, then PDF.
- JSON uses canonical `training-plan-v2` with the active saved schedule dates as export truth.

### Current State

- `Open plan` already owns active-plan summary, text-first replacement, advanced JSON import, clear-upcoming, and delete-plan lifecycle.
- Backend JSON and Markdown export generation is implemented, but visible export controls are not wired yet.
- Chosen-start-day scheduling is reflected through saved `planned_workouts.workout_date` values in exported dates.

### Constraints

- Do not create separate format-specific export truths.
- Do not leak runtime-only state such as Garmin evidence, comparison, or AI feedback into canonical plan export.
- Keep PDF runner-facing and simplified rather than technical.
- Do not add archived-plan export in the first UI wiring slice.

### Risks / Open Questions

- Whether PDF generation should render from server HTML or a document generator is still an implementation choice, but ownership should remain backend-side.
- UI download behavior still needs browser-level QA once wired.

### Next Recommended Role

FRONTEND

### Suggested Next Step

Add the compact `Open plan` export trigger for JSON and Markdown using the backend export action, without duplicating export shaping in the browser.
```
