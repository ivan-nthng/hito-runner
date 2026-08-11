# FIT-Backed Planned Workout Product Presentation

## Work Item ID

2026-08-05-fit-backed-planned-workout-product-presentation

## Status

completed

## Type

defect

## Priority

high

## Owner

frontend

## Frontend Lane

Product

## Scope

runner-workout-completion-presentation

## Parent

[Planned Workout FIT Completion Lifecycle](./2026-08-05-planned-workout-fit-completion-lifecycle.md)

## Task

Align runner-facing completion, result, and feedback presentation with the accepted FIT-backed
planned-workout completion read model.

## Stage

Frontend Product implementation and retained local FIT/ZIP acceptance evidence complete.

## Next Recommended Role

QA only if an independently assigned broader acceptance replay is requested; no further Frontend
implementation handoff is required.

## Demonstrated Root Cause

The persisted snapshot already projects canonical FIT completion into `Workout.status`, but Product
presentation still uses `workout.log` as a result discriminator and treats an attached feedback
marker as sufficient to expose review. This can make a valid completed FIT result appear unfinished
or expose manual/result affordances before factual metrics exist.

## Intended Outcome

- Render the existing status and validated actual-metrics/comparison readback without recreating FIT
  lifecycle truth in the client.
- Keep manual subjective inputs independent from FIT-derived objective facts.
- Retain manual no-FIT completion paths and non-persisted past-skipped presentation.
- Refresh completion and feedback presentation when backend evidence changes.

## Frontend Execution Preflight — 2026-08-10

- Existing seam: reuse `WorkoutFeedbackPanel`, `RunCapturedReadback`, the existing Hito fact-row
  presentation, and `WorkoutActualMetricsSummary`; separate observed facts from the existing
  prescribed-only comparison without changing ingestion or lifecycle truth.
- Demonstrated discriminator: the DTO and mapper already return every required metric, while
  `RunCapturedReadback` renders only day, duration, and distance and is replaced by the comparison
  branch whenever a comparison exists. Frontend Product presentation is the first incorrect owner.
- New production runtime artifacts: none. The obsolete conditional responsibility that hides
  observed facts behind the Plan-vs-Run branch will be simplified; backend, parser, storage, route,
  and shared Design System owners remain unchanged.
- Focused proof: rendered readback contract, scoped lint/format/diff checks, production build, then
  a named loopback-only Product acceptance identity using the ordinary upload input with the
  supplied external ZIP. Retain its raw asset and derived local evidence after proving persisted
  metrics, reprocessing availability, refresh, desktop, exact 375 px, light/dark, focus,
  navigation, and overflow behavior.
- Stop boundary: a missing DTO/storage fact, unavailable raw-file retention/reprocessing, or a
  required Backend, security, or shared Design System change.

## Validation

Use the canonical local fixture and Product browser surfaces for matched FIT, no-FIT manual,
explicit partial, source removal, and activity deletion states. Verify desktop and 375px light/dark,
keyboard/focus, accessibility, overflow, console/network health, scoped static checks, build,
integrity, and managed runtime health.

## Current Execution Evidence

Historical status before the 2026-08-10 Product clarification: `blocked`.

The persisted snapshot already calculates the canonical FIT-completion chain. The active Product
candidate exposes that existing fact as `Workout.completionOrigin = "fit_activity"`; it does not add
storage, a provider branch, or a client-side inference. Product consumers must use this origin with
actual-metrics/comparison readback rather than treating a broad `feedback_ready` marker as review
eligibility, because non-running evidence can still be feedback-ready while remaining skipped.

### Closure Receipt

- Product now consumes the server-projected `completionOrigin: "fit_activity"` readback rather than
  inferring FIT completion from a manual log or feedback marker. The deterministic local foundation
  validator separately proves a clean FIT-completed workout has `status: completed`,
  `completionOrigin: fit_activity`, and no synthetic workout log, alongside its no-FIT,
  skipped-to-FIT, explicit-partial, source-removal, activity-deletion, and cleanup assertions.
  Targeted lint, formatting, diff hygiene, and the prior production build passed.
- Required real-browser upload proof remains unavailable after all approved local browser paths:
  the managed in-app browser exposed the canonical input but emitted no `filechooser`; the separate
  Chrome replay reached the real Activity file Dialog and its visible `input[type=file]`, but its
  file-chooser event also did not arrive. Chrome reports that its extension needs `Allow access to
file URLs` before it can select the existing safe FIT fixture. The available Safari session
  belonged to another runner and was left untouched to preserve concurrent work. No FIT bytes were
  attached, no upload request completed, and no provider or hosted mutation occurred.
- The named local `provider-engine` runner used to reach the actual Activity file Dialog was reset
  through the canonical QA pool lifecycle; its owned rows and assets are zero. Next owner:
  Frontend Product browser-validation continuation after an approved browser with local-file access
  can attach the existing safe FIT fixture through the ordinary input. No source correction is
  implied by this QA-capability boundary.

## Product Clarification — 2026-08-10

The user supplied one Garmin ZIP archive outside the repository for local acceptance. It contains
one FIT activity (about 200 KB). Local parser-only inspection, with no upload or GPS/route
disclosure, confirmed the existing canonical parser reads 5.1114 km, 45.16 minutes, average/max HR
134/145, average/max power 262/371, 454 kcal, eight laps, three structured intervals, and elevation
**+25 m / -33 m**.

Elevation is not absent from FIT intake. The parser reads total ascent/descent; the canonical
runner-activity source persists them; `workout_actual_metrics` persists
`actual_elevation_gain_m` and `actual_elevation_loss_m`; and the authenticated feedback DTO returns
both values. The first incorrect owner is Frontend Product presentation: the captured-run readback
renders only day, duration, and distance, while a plan comparison has no elevation signal when the
plan itself did not prescribe elevation.

### Accepted retention and display boundary

- The existing upload seam already stores the original user-owned FIT/ZIP privately in
  `workout-result-assets`, records its private source revision, and retains it by default for
  reprocessing. Keep that contract during testing. Do not add another file store, cleanup job, or
  browser cache. Explicit evidence removal remains the only deletion path. The local acceptance
  upload for this user-supplied file is deliberately retained after proof as test evidence; do not
  reset it through the ordinary disposable-fixture cleanup.
- Reuse `WorkoutActualMetricsSummary`. Show every non-null factual run metric it already returns in
  a compact observed-run readback: date, duration, distance, ascent, descent, average/max HR,
  average/max power, cadence, calories, and structured interval count.
- Keep Plan vs Run separate. Observed elevation, HR, power, cadence, and calories are not planned
  targets or comparison differences unless a future plan explicitly defines them.
- Do not add persistence for raw GPS records, route geometry, device internals, or parsed
  temperature in this slice. The private original retains richer evidence for later user-approved
  extraction; these fields are not required to correct the missing result presentation.
- Use the supplied ZIP only as a local, private acceptance input. Do not copy it into the
  repository, fixture corpus, backlog assets, screenshots, or hosted storage. Uploading it to
  Ivan's hosted account is a separate explicit hosted mutation and is not implied here.

## Historical Exact Handoff Prompt

This prompt initiated the completed 2026-08-10 Frontend Product continuation and is retained only
as task history.

```text
ROLE: FRONTEND

Lane: Product
Mode: Tracked

Start only after the active authenticated typography migration has completed. Read AGENTS.md,
agents/frontend.agent.md, skills/hito-frontend-design-system/SKILL.md, and this canonical item:
/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-05-fit-backed-planned-workout-product-presentation.md

Task: Finish factual user-facing FIT result presentation with the existing backend contract. The
user-supplied local Garmin ZIP is a real acceptance input. It parses through the existing canonical
parser with elevation +25 m / -33 m. The backend already privately retains the raw ZIP/FIT and
persists every metric required here; do not create persistence or ingestion code.

Product outcome:
- In Workout detail, render all non-null WorkoutActualMetricsSummary fields as observed Run facts:
  date, duration, distance, elevation gain/loss, average/max HR, average/max power, cadence,
  calories, and structured interval count.
- Keep Plan vs Run separate. Compare only facts actually prescribed by the plan; observed run facts
  must never be labelled as planned targets or differences.
- Preserve factual FIT completion status, manual no-FIT completion, partial/skipped states, source
  removal, activity deletion, history/FIT protection, and feedback behavior.

Reuse existing CompletionPanel, WorkoutComparisonReadback, WorkoutActualMetricsSummary, upload API,
canonical parser, raw asset retention, activity source, and persisted projections. Expected new
production artifacts: none. Do not add a model, API/RPC, migration, parser, fixture, file store,
cache, provider, AI call, route, shared primitive, token, or local browser truth.

Validation:
1. Use a named local Product-acceptance identity and the supplied ZIP only from its local path. Do
   not copy it into the repository, hand-shape database rows, or use hosted data. Keep the uploaded
   raw asset and its derived local evidence after proof; it is deliberately retained test data and
   may be removed only through the ordinary explicit evidence-delete flow later.
2. Exhaust supported non-prompting local browser/control paths for the ordinary upload input. If a
   platform permission dialog appears, abandon that path and pivot; never ask Ivan for approval.
   Prove raw-file availability/reprocessing and persisted factual metrics, including exact elevation.
3. Prove desktop and exact 375px light/dark presentation, readable fact rows, no page overflow,
   keyboard/focus behavior, normal navigation, unchanged Plan-vs-Run/matched/manual/partial
   semantics, focused static checks, and a production build.

Do not change backend persistence, parser/normalizer, raw-file retention/removal policy, schema,
auth, providers, saved plans, Calendar, shared Design System source, Figma, or unrelated dirty work.
Stop only if the existing DTO lacks a specified fact, ordinary upload cannot retain/reprocess the raw
file, or a required change reaches backend/security/shared-DS ownership. Keep commentary visible to
Ivan in Russian. Write the canonical item update, final formal receipt, and validation table in
English. Do not stage, commit, push, deploy, access hosted state, or call paid providers.
```

## Frontend Product Closure Receipt — 2026-08-10

### Implementation DoD

- `WorkoutFeedbackPanel` now renders the existing `WorkoutActualMetricsSummary` as a distinct
  **Observed run** section whenever factual metrics exist, independently of the prescribed-only
  **Plan vs run** comparison.
- The observed readback renders every non-null contracted field: date, duration, distance,
  elevation gain/loss, average/max heart rate, average/max power, cadence, calories, and structured
  interval count. No client-side lifecycle or scheduling truth was added.
- The ordinary upload input retained the user-supplied external Garmin ZIP under the named local
  Product-acceptance identity `fit-product-acceptance@local.test`. The raw asset and derived local
  evidence remain deliberately retained; the archive was not copied into the repository.
- Persisted readback after refresh reported 2026-07-30, 45.16 min, 5.11 km, +25 m / -33 m,
  134/145 bpm, 262/371 W, 69 spm, 454 kcal, and three structured intervals. The 80,050-byte raw
  source remained downloadable from local private storage with `raw_state: available`, so both raw
  availability and reprocessing availability are true.
- The comparison remained factual and separate: only prescribed activity, day, duration, distance,
  and structure appeared in Plan vs run; unprescribed elevation, heart rate, power, cadence, and
  calories appeared only as observed facts.

### Files changed

- `src/components/workout-completion/WorkoutComparisonReadback.tsx`
- `src/components/CompletionPanel.tsx` (task-owned readback composition only; unrelated existing
  slider, body-note, and typography hunks were preserved)
- `scripts/validate-workout-comparison-readback.tsx`
- this canonical work item

### Validation inventory

| Check                             | Scenario / environment                                                                                      | Result | Evidence                                                                                                                                                                              |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source and rendered contract      | Existing DTO/mapper and server-rendered readback                                                            | Passed | All contracted non-null fields asserted; comparison-present state does not show a false unavailable status.                                                                           |
| Ordinary FIT/ZIP upload           | Managed loopback runtime, named local acceptance identity, normal file input                                | Passed | Upload completed through the existing API; workout became FIT-completed and the factual readback survived refresh.                                                                    |
| Persisted facts and raw retention | Local Supabase read-only query and private-storage download                                                 | Passed | Parsed asset and normalized metrics persisted; exact elevation +25 m / -33 m; raw source available and 80,050-byte download confirmed.                                                |
| Plan vs Run separation            | Workout Feedback UI after upload                                                                            | Passed | Prescribed facts alone were compared; richer observed metrics were not labelled as plan targets or differences.                                                                       |
| Completion semantics              | Existing runner-activity foundation and workout-evidence validators; focused partial browser replay         | Passed | Manual no-FIT, FIT completion, skipped/source-removal/activity-deletion projections remained green; partial was saved and then restored to completed without removing the FIT result. |
| Responsive presentation           | Desktop 1280x720 and exact 375x812, light and dark                                                          | Passed | All fact rows remained readable; document and row geometry stayed inside the viewport with no horizontal overflow.                                                                    |
| Interaction and navigation        | Keyboard tab arrows, Calendar link, return to Feedback                                                      | Passed | Focus/active-tab behavior, URL state, Calendar navigation, and return navigation worked normally.                                                                                     |
| Runtime health                    | Managed loopback server and recent runtime events                                                           | Passed | Runtime healthy/fresh/compatible; no recent error/failure event or external provider call.                                                                                            |
| Focused static checks             | Prettier, ESLint, `validate-product-contracts`, readback/evidence/foundation validators, `git diff --check` | Passed | All task-relevant focused checks completed successfully.                                                                                                                              |
| Production build                  | `npm run build`                                                                                             | Passed | Vite/Nitro production build completed; standard chunk-size warnings only.                                                                                                             |

### Coverage boundary

No broad browser replay of manual no-FIT completion, source removal, or activity deletion was run
against the retained acceptance record because those destructive paths were unchanged and would
remove the required evidence. Their canonical focused validator coverage passed. No broad browser
matrix, hosted/release validation, or Global QA was performed or claimed.

### Ownership and blockers

The first incorrect owner was Frontend Product presentation. Backend persistence, parser,
normalizer, raw-file policy, schema, authentication, providers, Calendar, saved plans, shared Design
System source, and unrelated dirty work were not changed. New production runtime artifacts: none.
The managed web runtime was stopped after proof without deleting the retained local acceptance
identity, database evidence, or raw source. No blocker remains for this implementation slice. No
subagent was used.
