# Active Plan PDF Export Plan

## Status

backlog

## Type

plan

## Priority

medium

## Next Recommended Role

ARCHITECT

## Task

Plan a runner-facing PDF export for active training plans.

## Stage

ARCHITECT plan

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

TASK:
Plan a runner-facing PDF export for active training plans.

STAGE:
ARCHITECT plan

CONTEXT:
- Source path: docs/plans/active/2026-05-15-plan-export-pdf.md
- Markdown metadata is canonical for this repo-derived admin Backlog item.
- Supabase mirrors this item for discovery and prompt copy only.

CONSTRAINTS:
- Edit this markdown file, not the admin Backlog mirror, when task truth changes.
- Preserve Hito canonical architecture and current role boundaries.
- Do not broaden scope beyond this work item.

OUTPUT:
Use the project role output format.
```

Active Inventory Note

Kept active during the 2026-05-25 inventory cleanup because JSON and Markdown export are shipped, while PDF export remains a discrete future slice.

This should not be started by inertia. Pick it only when PRODUCT chooses plan-export PDF as the next product move.

Context

The first saved-mode plan export slice is now live:
- export lives in `Open plan`
- active plan only is the v1 scope
- one canonical backend export payload already exists in `src/lib/plan-export.ts`
- JSON and Markdown are implemented and QA-green

PDF is the next export slice, not part of the already-shipped export work.

Problem Definition

The next step is to add one runner-facing PDF export without turning export into:
- a reporting system
- a second planning interface
- a print dashboard

The PDF must reuse the current canonical export truth, stay readable for a runner, and omit unsupported detail instead of pretending that the app has denser print-ready semantics than it actually does.

PDF Surface

`Export as PDF` should appear in the same `Open plan` export menu that already contains:
- `Export as JSON`
- `Export as Markdown`

Recommendation:
- keep PDF as the third item in that same compact export menu
- do not create a separate PDF button elsewhere in the modal
- keep export absent when there is no active plan

PDF Document Model

PDF must derive from the existing backend-owned active-plan export payload in `src/lib/plan-export.ts`.

V1 scope:
- active plan only
- no archived plans
- no multi-plan export

Chosen document model:
- week-list view

Why week-list view is the right v1:
- it stays close to the current product’s saved week-oriented mental model
- it is easier to paginate cleanly than a dense month-grid calendar
- it keeps each workout row scannable without becoming a dashboard or worksheet

This should be calendar-style in feel, but week-list in structure.

What PDF Must Match From Existing Export Truth

- active saved plan only
- effective applied dates, including chosen-start-day shifts
- workout ordering
- workout titles
- visible workout-type identity
- same omission rules for unsupported fields
- same plan title, goal summary, effective start, and target date truth already used by JSON/Markdown export

PDF Content Rules

PDF v1 should include:

Top-of-document:
- plan title
- short goal summary
- effective start date
- target date if present

For each workout row:
- day/date
- workout icon or broad workout-type indicator
- workout type label
- workout title or short label
- distance if available
- pace if available
- heart rate if available
- one concise runner guidance line when appropriate

Recommended row content priority:
1. date + workout identity
2. short metrics line
3. one short guidance line

PDF v1 should exclude:
- full `steps` breakdown
- raw segment trees
- detailed interval internals
- dense metric stacks
- completion logs
- Garmin evidence
- deterministic comparison
- AI recommendation
- backend diagnostics
- archived-plan history

What PDF Intentionally Simplifies

- interval workouts become one runner-facing row, not a prescription tree
- segment-level structure is summarized into short guidance only
- pace and heart-rate are shown only when they are already normalized, visible targets
- rest days stay sparse and obvious

Missing Data Rules

- if distance is unavailable, omit the distance field
- if pace is unavailable or not normalized, omit the pace field
- if heart rate is unavailable or not normalized, omit the heart-rate field
- if only one of these fields is available, show only that field
- do not print placeholder dashes repeatedly just to preserve a grid shape
- if guidance is empty, omit the guidance line instead of filling it with generic copy

Layout Constraints

Page density:
- low-to-moderate density
- one workout per row
- no more than one short secondary line under the main row

Multi-page behavior:
- split cleanly by week sections
- allow weeks to continue across pages when necessary
- repeat document header only at natural page boundaries, not before every week

Scannability rules:
- boldest emphasis goes to date and workout identity
- metrics stay secondary
- guidance stays tertiary
- no tiny technical sublabels

V1 detail cap per workout:
- one line of identity
- one short metrics line if useful
- one short guidance line at most

Backend Responsibilities

- extend `src/lib/plan-export.ts` with one PDF format projection from the existing payload
- keep the canonical payload as the only export truth
- keep active-plan-only gating in the export seam
- own all omission rules
- return a real PDF attachment through the same authenticated route family
- own final filename, content type, and download body
- own PDF rendering

Because the repo currently has no established PDF generation pattern, backend should introduce the smallest server-owned PDF path possible rather than asking frontend to compose a second print document model.

Frontend Responsibilities

- add only one new menu item
- reuse the current export trigger and attachment download behavior
- keep no plan-local PDF rendering code

Rollout Recommendation

Smallest safe PDF slice:
- add one backend PDF projection from the existing export payload
- support active-plan PDF download from the existing `Open plan` menu
- keep the document week-list based and sparse

Explicitly wait:
- archived-plan PDF
- print customization
- richer technical workout breakdown
- comparison/report PDFs
- embedded Garmin or feedback data
- custom theming or branded cover pages

Checklist

- [ ] Add one backend PDF projection from the existing active-plan export payload.
- [ ] Keep active-plan-only export scope.
- [ ] Reuse the authenticated attachment download path.
- [ ] Add one `Export as PDF` menu item in `Open plan`.
- [ ] Omit unsupported distance, pace, HR, and guidance fields without placeholders.
- [ ] QA PDF download, file type, content shape, and JSON/Markdown regression.

What We Refuse To Turn Into A Print Dashboard

- a dense analytics packet
- a coach report
- a second workout-detail surface in PDF form
- a plan-editing artifact
- a metrics matrix with many empty cells

QA Expectations

- `Export as PDF` appears only when an active plan exists
- PDF content matches the active saved schedule, not source-file dates
- rest days remain sparse
- missing pace/HR/distance do not create noisy placeholders
- long plans paginate cleanly across multiple pages
- Safari download behavior matches the fixed JSON/Markdown export path

Risks

- trying to mirror workout-detail structure too closely would over-densify the PDF
- month-grid layout would become harder to paginate and easier to clutter
- introducing client-side PDF shaping would create a second export truth
- unsupported pace/HR semantics could be overclaimed if omission rules are not enforced strictly

Exit Criteria

- one bounded PDF document model is defined
- it reuses the existing canonical export payload
- active-plan-only scope remains intact
- inclusion and omission rules are explicit
- backend/frontend ownership is unambiguous
- rollout stays smaller than a general print/reporting system

Next Recommended Role

BACKEND

Suggested Next Step

Add one backend-owned PDF projection to `src/lib/plan-export.ts` from the existing active-plan export payload, using a sparse week-list runner document and the same authenticated attachment delivery path already proven by JSON/Markdown export.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Defined the first bounded PDF export slice for `Open plan` as a runner-facing week-list document derived from the already-live canonical export payload.

### Key Decisions

- PDF stays inside the existing `Open plan` export menu alongside JSON and Markdown.
- PDF derives from the same active-plan export payload already used by JSON/Markdown.
- V1 PDF uses a week-list document model, not a dense month-grid or reporting layout.
- PDF intentionally omits workout logs, Garmin evidence, comparison, AI feedback, and dense segment internals.

### Current State

- JSON and Markdown export are live and QA-green.
- The repo already has one canonical active-plan export payload in `src/lib/plan-export.ts`.
- No existing PDF generation pattern is present in the repo yet.

### Constraints

- Do not create a second document model on the frontend.
- Do not broaden export into a print dashboard or reporting system.
- Keep active-plan-only scope in v1.

### Risks / Open Questions

- The exact PDF rendering implementation is still open, but ownership should remain backend-side.
- Density must stay low enough that long plans remain printable and readable without route-level detail leaking into the document.

### Next Recommended Role

BACKEND

### Suggested Next Step

Implement one backend PDF projection from the current active-plan export payload and expose it through the same authenticated export route family already used for JSON and Markdown.
```
