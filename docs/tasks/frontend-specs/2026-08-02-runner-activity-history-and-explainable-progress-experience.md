# Runner Activity History And Explainable Progress Experience

## Status

design_complete_backend_read_model_ready

## Owner

frontend

## Frontend Lane

Product

## Canonical Task

[Runner Activity History And Explainable Progress Experience](../backlog/2026-08-02-runner-activity-history-and-explainable-progress-experience.md)

## Purpose

Define one calm runner-facing place for recorded activity history and personal progress without
creating a second activity model, a dashboard wall, or an opaque fitness score.

This specification is implementation-ready. Backend Gate 2 now supplies the canonical collection
and factual Progress read models; Product Frontend must consume them without local metric arithmetic.

## Root Cause And Source Mapping

The current `/progress` route summarizes planned workouts and workout logs from `TrainingSnapshot`.
It does not read canonical runner activities, activity revisions, or profile snapshots. Gate 1 now
provides the first correct source boundary for recorded Garmin FIT/ZIP activity truth, but it does
not yet expose the history collection or longitudinal metric read models required by this surface.
Current plan/log totals also include a partial-workout estimate, so even visually similar existing
summary values cannot be relabelled as canonical activity history.

The first incorrect owner is therefore not route styling. It is the missing Backend read model
between canonical activity truth and the existing Product route. Frontend must render that read
model and must not derive eligibility, confidence, trends, or deletion effects locally.

Source boundaries:

- Gate 1 owns canonical recorded activity, source/revision provenance, optional planned-workout
  match, raw-file retention, and activity deletion.
- The Runner Profile Constitution owns metric definitions, eligibility, windows, confidence, and
  prohibited claims.
- Backend Gate 2 owns trustworthy weekly and rolling-28-day facts.
- Later Backend gates own runner-reported load and stream-dependent aerobic metrics.
- Product Frontend owns the hierarchy and interaction defined here after those read models exist.
- Existing workout detail continues to own planned-versus-actual comparison for a matched workout.

## Current Truth Ledger

| Capability | Current truth | Runner-facing consequence |
| --- | --- | --- |
| Canonical recorded activity | Gate 1 owner-level implementation and QA complete; Gate 7 Global QA remains pending | Valid source for Gate 2 history, not yet a shipped history UI |
| Manual Garmin source | FIT or one-FIT ZIP only | Show `Garmin file` provenance only in detail, not as a provider ecosystem |
| Recorded facts | Date/time, elapsed/timer duration, distance, and evidence-backed summary facts such as average HR | May appear when present; missing facts remain absent |
| Activity naming/type | No general canonical naming/classification contract is established | Use backend-provided name/type; otherwise show `Run`, never infer from filename or Frontend heuristics |
| Planned-workout relationship | Optional runner-selected match | Link to the workout when present; an unmatched run remains a first-class activity |
| Raw-file removal | Deletes original file only | Activity and progress contribution remain; explain this in activity detail |
| Activity deletion | Deletes canonical activity and its profile contribution | Remove only after Backend success; do not decrement progress optimistically |
| History collection read model | Gate 2 owner-level implementation and QA complete | Ready for Product Frontend consumption |
| Weekly/28-day fact snapshots | Gate 2 owner-level implementation and QA complete | Ready for the first factual Progress summary |
| RPE load | Later policy/backend gate | Hide until duration basis, partial/stopped policy, and read model are accepted |
| Aerobic metrics | Gate 5, not implemented | Hide until stream persistence, eligibility, versioning, and comparison read model exist |

The foundation records Gate 1 owner-level implementation and QA as complete. Gate 7 Global QA
remains pending for a selected integrated release and does not block Gate 2.

## Accepted Information Architecture

Keep the existing shell destination `/progress`; do not add another primary navigation item.

Inside that destination, use the existing `simple` Hito tabs:

1. `Activity history`
2. `Progress`

The direct `/progress` entry opens `Activity history` because observed facts are the foundation for
interpretation. Each tab must have a deep-linkable route or URL state and participate in browser
history. The shell keeps one active `Progress` location for both views.

Each tab owns its own concise page header:

- Activity history: title `Activity history`; one short line describing recorded runs.
- Progress: title `Progress`; one short line describing personal change from comparable evidence.

Do not add a parent hero, dashboard summary banner, or a second navigation card above the tabs.
History remains useful without an active plan; the current no-plan gate must not survive in the new
activity-backed experience.

## Activity History Layout

### Page anatomy

1. Page header and `simple` tabs.
2. Optional compact period/filter row only when the collection is large enough to need it.
3. One open `hito-row-group` activity list with hairline dividers.
4. Pagination or `Load more` from the Backend cursor; never load an unbounded history silently.
5. Activity detail in the existing Hito Dialog/Sheet family.

The initial slice does not require search, charts, a calendar heatmap, source filters, or card tiles.

### Activity row hierarchy

Every row has one primary focusable disclosure target, not a collection of competing controls. The
visual row is a grid/list item, not one wrapping `<button>`: its separate overflow menu is a sibling
control so interactive elements are never nested.

| Level | Content | Rule |
| --- | --- | --- |
| Date rail | Local day and short month; year when not current | Use backend historical local date/timezone; never reassign the day from the browser timezone |
| Primary identity | Canonical activity name, otherwise canonical type, otherwise `Run` | Do not synthesize a workout name from the source filename |
| Primary facts | Distance and duration | Show only present observed facts; duration basis comes from Backend |
| Supporting facts | Average pace and average HR | Pace must be backend-provided with its duration basis; HR is observed activity HR |
| Relationship | Matched planned-workout title/date when present | Quiet linked metadata; no match is normal, not an error |
| Provenance/status | Manual result, source removed, updating, or quality limitation only when applicable | Default recorded Garmin source stays out of the scan line |
| Actions | Overflow menu | Keep deletion and source privacy actions out of the row body |

Long names truncate to one line on desktop and clamp to two lines at 375px. Fact units use the
existing metric/data typography and tabular numerals. Missing pace or HR collapses cleanly; do not
render `--`, empty columns, or `No HR` in every row.

### Activity detail

Opening a row preserves list context:

- desktop: bounded, scroll-safe Hito Dialog;
- exact 375px: full-height Hito Sheet with title, close, and reachable footer/actions;
- closing returns focus to the originating row.

Detail order:

1. Date/time and activity identity.
2. Observed summary facts: distance, duration, pace, average HR, and other already-supported facts
   only when present.
3. Planned relationship: link to the existing workout detail and its Plan vs Run comparison when
   matched; `Unplanned run` when explicitly unmatched.
4. Source and provenance disclosure: `Garmin file`, observation/revision status, and whether the
   original is still retained.
5. Privacy and deletion actions.

Do not duplicate laps, exact Plan vs Run comparison, or coaching feedback inside the history detail
when the matched workout already owns them.

### Privacy and deletion actions

`Remove original file` and `Delete activity from history` are separate actions with separate
confirmation copy:

- Remove original file: explain that the normalized activity stays in history and continues to
  contribute to progress, but Hito can no longer reprocess the original file.
- Delete activity from history: explain that the activity, its observed evidence, comparisons, and
  profile contribution are removed; a separate manually reported completion may remain.

Both actions use existing Hito destructive confirmation patterns. On success, Backend returns the
new activity/profile state or invalidation status. Frontend must not fabricate a recalculated total.

## Progress Layout

### Compact summary

The first viewport contains one factual rolling-28-day line, for example:

`8 runs · 5 h 12 min · 49.6 km`

Below it, show at most one backend-supplied explainable change statement and one evidence line:

- `At a similar heart rate, your comparable pace was faster.`
- `Early signal · based on 4 comparable runs in each period.`

If no longitudinal metric is eligible, replace those two lines with one calm availability sentence.
Do not render a disabled grid of metric cards.

The compact summary is not a score and has no gauge, ring, grade, league, readiness color, or
celebratory interpretation. More distance or load is never labelled as better fitness.

### Metric disclosure list

Use one open/divider list. Available metrics are rows; selecting a row expands an existing Hito
disclosure. The initial collapsed row shows:

- metric name;
- plain-language direction supplied by Backend;
- current value with unit;
- baseline value or range;
- metric-specific confidence (`Early signal`, `Established`, or unavailable reason).

Expanded content shows:

- baseline and current date windows;
- original values and units, not only a percentage;
- comparable activity count in each window;
- excluded activity count and runner-safe reason groups;
- relevant context such as terrain class or summary-only evidence;
- a link to the contributing activities when the read model supports it;
- metric/formula series only as quiet provenance, not a technical payload.

Metric order when available:

1. Pace at comparable heart rate.
2. Heart rate at comparable pace.
3. Aerobic efficiency.
4. Durability and controlled aerobic duration.
5. Consistency and running facts.
6. Session load.

Only Backend-returned eligible metrics render. The order expresses runner comprehension, not
calculation priority.

### Metric-specific boundaries

| Metric | Required runner-facing evidence | Must remain hidden when |
| --- | --- | --- |
| Consistency/facts | Canonical session count, time, distance, window, excluded count | Gate 2 snapshot is absent or updating |
| Aerobic efficiency | Compatible aerobic observations, current/baseline values, confidence, formula series | Stream-dependent eligibility is absent; summary-only fallback is not yet accepted for v1 |
| Pace at comparable HR | Fixed observed HR bucket, both pace values, eligible minutes/runs, confidence | Bucket lacks recorded samples or would require extrapolation |
| HR at comparable pace | Fixed observed pace bucket, both HR values, compatible runs, confidence | Reference pace or evidence minimum is unresolved/insufficient |
| Durability | Compatible continuous sessions, both decoupling/duration facts, confidence | Session is short, structured, mixed-terrain, or otherwise ineligible |
| Load | Duration, whole-session RPE, accepted duration/partial policy | RPE or policy/read model is absent |

## Confidence And Tone

Confidence belongs to each metric, never to the runner as a whole:

- fewer than 3 eligible observations in either comparison window: unavailable, `Not enough
  comparable runs yet`;
- 3-5 in each window: `Early signal`;
- at least 6 in each window: `Established`.

An improving summary requires the accepted Backend trend state and multiple compatible metrics.
One activity never establishes improvement or decline.

Use Hito signal/muted tones for direction and confidence. Do not use success green for improvement
or destructive red for an unfavorable observation. Warning/error tones are reserved for actual
data-quality or loading failures.

## State Contract

### No activities

Show one low-chrome Hito empty state:

- no fake zero metrics or empty chart;
- explain that recorded runs will appear here;
- primary action returns to Calendar;
- do not add a new global upload flow in this slice.

### Loading

Use 3-5 skeleton rows matching final history geometry. Progress uses one summary-line skeleton and
two disclosure-row skeletons. Mark the region `aria-busy`; skeleton decoration is hidden from
assistive technology.

### Collection or progress error

Keep tabs and the unaffected sibling view reachable. Show a section-level Hito error state with
`Try again`. Never replace missing/stale progress with old values labelled current.

### Insufficient comparable evidence

Keep observed 28-day facts visible. Show one explanation and the evidence count; do not list every
locked metric separately.

### Lower confidence

Show `Early signal`, both comparison windows, and counts. Avoid certainty verbs such as `proved`,
`fitness increased`, or `declined`.

### Missing heart rate

The activity remains in history and contributes to evidence-backed time, distance, and consistency.
Hide HR-dependent metrics and explain once that recorded HR is required for those comparisons.

### Unplanned run

Show it as a normal activity with quiet `Unplanned run` metadata in detail. It never counts as
planned completion. Backend alone decides whether it is eligible for an aerobic metric.

### Manual result

Gate 1 currently owns recorded Garmin activity, not a canonical manual-activity history model. Do
not merge existing manual workout logs into this collection. If a later Backend read model adds a
manual activity, mark it `Manually entered`; it may contribute only to explicitly allowed facts and
must never impersonate sensor evidence.

### Original source removed

The list row remains unchanged. Detail shows `Original file removed` and explains that normalized
facts remain while source reprocessing is unavailable.

### Activity deleted or corrected

After successful deletion, remove the row and show Backend-returned progress as `Updating` until a
new snapshot is ready. Never show a stale metric as current. This task does not add tombstones.

### Upload failure

A failed upload creates no history row. The existing workout activity-file flow continues to own
its actionable error. History shows an error only when its own collection request fails.

## Desktop And Exact 375px

### Desktop

- Reuse `hito-route-gutter`, `hito-route-stack`, and the current `max-w-5xl` rhythm.
- Keep the history list full-width and open; do not split it into a dashboard sidebar.
- Align date, identity, primary facts, and supporting facts through a stable grid.
- Metric disclosures use the same content width as history.

### Exact 375px

- One column only; no compressed desktop table and no horizontal scroll.
- Tabs fit as two equal or content-width items in the existing simple-tab contract.
- Each history row places date/identity first, distance/duration on the next line, and optional
  pace/HR below in muted data text.
- Row actions keep a 44px touch target without consuming the identity line.
- Expanded activity detail uses a full-height Sheet; controls and destructive actions remain
  reachable above safe-area padding.
- Metric rows stack current and baseline values; arrows are decorative and never carry meaning
  alone.
- Text follows the existing Hito 375px typography/gutter contract; no route-local scale reduction.

## Accessibility And Motion

- Tabs use the existing Hito tab semantics with `aria-selected`, keyboard navigation, and visible
  focus.
- Activity history is a semantic list; each row has one accessible disclosure name containing date,
  identity, distance, and duration when present.
- Dates use `<time datetime>`. Units are announced with values; visual abbreviations do not become
  ambiguous screen-reader copy.
- Optional facts are omitted rather than announced as empty.
- Disclosure controls expose expanded state and preserve focus.
- Destructive confirmations name the activity and state the different retention effects.
- Trend direction is conveyed in text, not color or motion.
- Any value transition is non-essential. Under reduced motion, update immediately without animated
  counters, chart draws, or celebratory effects.

## Hito DS Reuse

Reuse without creating a new DS family:

- `AppShell` and its single selected `Progress` navigation state;
- `hito-route-gutter`, `hito-route-stack`, `hito-page-header`, and canonical typography roles;
- `simple` Hito tabs;
- `hito-row-group`, `hito-list-row`, divider, caption, metric/data typography, and status pill;
- Hito disclosure;
- Hito Button/Icon Button, DropdownMenu, Dialog, Sheet, Skeleton, toast, and destructive
  confirmation patterns;
- existing semantic tones, focus rings, light/dark tokens, and narrow-screen gutter contract.

`ActivityHistoryRow` and `ProgressMetricDisclosure` may be shared Product-domain components if used
more than once. They are not generic Hito DS primitives. No genuine shared DS gap is proven by this
spec.

Do not reuse the current plan-volume comparison bars as a substitute for canonical activity
progress. They answer a different question and their hover-led presentation is not required by this
text-first design.

## Independent Reviews Incorporated

Running Coach review established:

- weekly/28-day facts are safe after Gate 2 but increased volume is not increased fitness;
- aerobic claims remain dormant until stream-dependent Gate 5 evidence and metric-specific
  confidence exist;
- fewer than three comparable observations is unavailable, three to five is an early signal, and
  six or more is established evidence for that metric;
- manual, unplanned, missing-HR, and removed-source states must preserve their provenance and must
  not be silently treated as observed aerobic truth.

Frontend-readiness review established:

- Gate 1 currently has no history collection GET/read model; the activity route exposes deletion
  only;
- canonical activity source currently has no general display name or pace contract;
- the existing route, shell, tabs, grouped rows, disclosures, overlays, and state primitives are
  sufficient;
- exact 375px needs deliberate row reflow, not a compressed desktop table;
- future visual trends require equivalent text and keyboard access, so this initial contract keeps
  its primary comparison textual.

## Backend Read Model Boundary

Frontend implementation may begin only when Backend provides authenticated, runner-owned read
models with these semantics:

### Activity collection

- cursor-paginated canonical activities ordered by historical local date/start time;
- canonical identity/type fallback supplied by Backend;
- distance and explicit duration basis;
- optional backend-derived pace with provenance/basis;
- optional observed average HR;
- planned-workout relationship;
- source/raw retention state and allowed actions;
- updating/quality state;
- no raw route coordinates or private source paths.

### Progress summary

- immutable weekly and rolling-28-day factual snapshots;
- current and previous/baseline window IDs and dates;
- metric-specific availability, confidence, current/baseline values, units, direction, evidence
  counts, exclusions, context, and formula version;
- explicit `updating`/invalidated state after correction or deletion;
- no universal score or frontend-computable formula payload.

Gate sequence:

1. Gate 1 owner-level implementation and QA are accepted; Gate 7 Global QA remains pending.
2. Backend Gate 2 exposes activity collection and trustworthy 28-day facts.
3. Product Frontend implements Activity History and the factual Progress summary.
4. Gate 7 Global QA validates the selected integrated release boundary after its selected gates
   exist.
5. Later Backend gates unlock load and aerobic disclosures without changing this page anatomy.

## Acceptance Criteria

- `/progress` offers deep-linkable `Activity history` and `Progress` views under one shell item.
- History comes only from canonical activities and remains usable without an active plan.
- Rows prioritize date, identity, distance, and duration; optional pace/HR never create empty slots.
- Unplanned activities remain first-class; planned comparison stays in workout detail.
- Raw-file removal and activity deletion have visibly different consequences.
- Progress begins with one 28-day factual line and at most one evidence-backed change statement.
- No score, grade, readiness state, fake physiology, frontend eligibility, or hidden formula exists.
- Missing or incompatible evidence removes the affected metric without erasing observed facts.
- Desktop and exact 375px remain low-noise, keyboard accessible, and free of horizontal overflow.
- Existing Hito DS primitives own the UI; no route-local control family or dashboard card grid is
  introduced.

## Non-Goals

- Provider sync, Garmin OAuth, Strava, other device sources, or cross-source merge UI.
- New ingestion/upload entry points.
- AI coaching verdicts or automatic plan changes.
- Race prediction, VO2max, readiness, injury risk, or universal fitness score.
- Frontend metric arithmetic, confidence inference, activity classification, deduplication, or
  snapshot mutation.
- Route maps, exact coordinates, social sharing, leaderboards, or public profiles.
- Personal bests, streaks, planned completion, and session load before their accepted backend gates.

## Design Definition Of Done

- Source and current UI seams are mapped.
- Running Coach semantic review is incorporated.
- Frontend-readiness review is incorporated.
- One low-noise desktop/mobile interaction model covers every required state.
- Backend gates are explicit, so Frontend can implement without inventing truth.
- Scoped documentation diff validation passes.

## Blockers

No design blocker. Runtime implementation is blocked only by the missing Backend Gate 2
activity-history/28-day progress read model. Gate 7 Global QA follows the selected integrated
release boundary. Aerobic and load disclosures remain dormant until their later metric gates are
implemented.
