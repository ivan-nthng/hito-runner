# Post-Upload Plan vs Run Comparison Experience

**Status:** Ready for Frontend after the active activity-file dialog slice is reconciled

**Owner:** Designer -> Frontend Product

**Last updated:** 2026-07-31

## Purpose

Define the runner-facing factual comparison shown after Hito has ingested one supported Garmin FIT
activity and produced the canonical deterministic planned-versus-actual comparison.

This specification is the visual/readback contract for the existing comparison. It does not own
ingestion, normalized metrics, comparison thresholds, persistence, or AI interpretation. Product
semantics remain owned by
`docs/tasks/product-briefs/2026-07-30-post-workout-analysis-and-ai-verdict-contract.md` and the
existing backend comparison types.

## Design evidence and root cause

### Visible problem

The accepted desktop readback in
`qa-artifacts/screenshots/2026-07-30/garmin-fit-upload-readiness/desktop-valid-fit-readback.png`
shows the same comparison truth through several consecutive layers:

- a global verdict;
- `Run summary` deltas;
- `What this review checked` status pills;
- `Workout structure` groups;
- another complete signal list; and
- technical `Comparison notes`.

The result is accurate but reads like a diagnostic report. Red/green status treatment also makes
`different from plan` look like a universal bad result even though longer, shorter, earlier, later,
or structurally different are not universally better or worse.

The exact-375 screenshot from the same QA folder also proves that the current long hierarchy does
not provide a sufficiently compact mobile scan path.

### First incorrect owner

The canonical comparison payload is not the defect. It already keeps plan, actual, delta, support,
coverage, and detailed step truth separate. The first incorrect owner is the presentation/view-model
composition in:

- `src/components/workout-completion/WorkoutComparisonReadback.tsx`;
- the `Plan vs run` and empty `Next step` composition in `src/components/CompletionPanel.tsx`.

The readback repeats rather than prioritizes the backend-shaped truth. The correction must replace
that composition, not add a second comparison model.

### Figma reference boundary

The provided Figma node `7777:1285` is an image-only analytics reference, not an editable Hito
running comparison design. It supports three layout principles only:

- compact summary before detail;
- open, low-card composition;
- strong value alignment.

It does not justify a line chart, analytics KPIs, or new time-series data. Hito currently has no
canonical time-series comparison contract for this surface, so the implementation must not add a
chart.

## Current factual data contract

Frontend must render only the canonical values already present in
`src/lib/workout-result-import/types.ts` and must not reclassify workout quality.

### Supported source and asset truth

- One Garmin `.fit` activity or one `.zip` containing exactly one usable FIT activity.
- Asset filename, asset kind, parse state, extracted FIT filename when relevant, and created time.
- Parse errors are runner-safe messages from the server boundary.
- A replacement is currently a truthful two-step lifecycle: remove existing evidence, then upload
  another file. There is no atomic replace command to imply in the UI.

### Actual run facts available

The normalized record may contain local date, duration, distance, average/maximum heart rate,
power, cadence, calories, elevation, interval count, and structured step data. Availability does
not mean comparability.

The primary `Plan vs run` surface may show only facts owned by the deterministic comparison payload:

- activity type;
- workout date alignment;
- duration;
- explicit planned distance versus actual distance when planned distance exists;
- structured step count when supported;
- aligned step and warm-up/main/recovery/cooldown group facts when comparison-ready.

Pace, heart rate, and RPE remain outside the primary comparison while the support matrix marks them
unsupported. Their raw actual values must not be presented as though they were compared with a plan
target.

### Existing comparison states

- Coverage: `complete`, `partial`, `insufficient_data`.
- Overall completion evidence: `matched`, `partially_matched`, `unclear`.
- Per fact: `matched`, `partial`, `mismatch`, `missing_actual`, `not_applicable`.
- Per support item: `compared`, `missing_actual`, `unsupported`, `not_applicable`.
- Optional detailed structure: ordered step and segment-group summaries only when backend output
  marks them available.
- Confidence is a bounded backend value. It is supporting evidence, not a score of the runner.

### Future-only truth

Upload does not request or generate an AI verdict. The following remain outside this specification:

- automatic or explicit AI verdict implementation;
- a next-workout recommendation;
- future-plan changes;
- Garmin sync;
- other devices or providers;
- new analytics or trend services;
- pace/heart-rate comparison without a future normalized comparable contract.

Previously persisted AI insight data, if present, may continue to render through its existing
separate readback. This slice must not add, regenerate, reinterpret, or place it inside the factual
comparison.

## Canonical hierarchy

### 1. Evidence owner row

Keep the attached activity-file owner above the comparison using the current attached-file row or
the accepted activity-file dialog result. It contains source, filename, added time, and the existing
remove action. Do not repeat the filename inside `Plan vs run`.

The active upload-dialog implementation remains a separate in-flight task. This specification does
not redesign its selection or upload anatomy.

### 2. Comparison header

Use one open section separated from the evidence owner by a hairline and spacing, not an enclosing
card.

- Title: `Plan vs run` using the existing panel/section title role.
- Right-side compact status communicates evidence coverage, not a global judgement:
  - `Complete comparison`;
  - `Partial comparison`;
  - `Limited comparison`.
- Do not put `Matched plan`, `Different from plan`, a score, or a red/green verdict beside the
  section title.
- Do not repeat a generic explanatory paragraph when comparison data is present.

### 3. Primary comparison rows

Render one low-card row group. Each fact appears once.

Desktop row order:

1. Activity
2. Workout day
3. Duration
4. Distance, when plan or actual distance truth exists
5. Workout structure, when a structured signal exists

Each row has four aligned semantic regions:

| Metric | Plan | Run | Difference |
| --- | --- | --- | --- |
| Duration | `45 min` | `48 min` | `+3 min · Within plan` |
| Distance without plan target | `No target` | `7.4 km` | `Not compared` |
| Workout day | `Jul 29` | `Jul 30` | `1 day later` |

Rules:

- Plan and Run are equal visual peers; Difference is the scan result, not a verdict on effort.
- Values use the existing technical/data role; metric and status labels use existing list-row,
  caption, and status roles.
- Keep the backend's plan and actual values. Do not calculate another target, tolerance, or score.
- A difference may use the backend delta sign and status to format plain direction. It must not
  infer coaching meaning.
- One hairline between rows is enough. Do not box individual metrics.
- Do not show the current separate `Run summary` and full signal list together. These rows replace
  both.

### 4. Difference language and tone

The visible labels are factual and metric-specific:

- numeric matched: `Within plan`;
- numeric partial/mismatch with positive delta: `Above plan` plus the signed amount;
- numeric partial/mismatch with negative delta: `Below plan` plus the signed amount;
- date: `Same day`, `Earlier`, or `Later`;
- activity: `Matched activity` or `Different activity`;
- structure: `Matched structure`, `Partly matched`, or `Different structure`;
- missing actual: `Run data unavailable`;
- no planned target / not applicable: `Not compared`.

`Above` and `Below` describe a measured direction only. They never mean better or worse.

Tone policy:

- `Within plan`: quiet signal/accent treatment with text and a non-color cue;
- `Above`, `Below`, `Different`: neutral foreground/muted treatment, not destructive red;
- `Partial`: warning is allowed only to describe evidence completeness;
- `Unavailable` / `Not compared`: muted;
- success and destructive tones remain reserved for operation outcomes such as upload/remove
  success or failure, not workout execution judgement.

### 5. Workout structure detail

When `segmentSummary` or `stepSummary` is available, the primary `Workout structure` row opens one
existing Hito disclosure immediately below the row group.

- Summary remains in the primary row.
- Disclosure label: `Workout structure`.
- Inside, each backend-provided group appears once as a divided row with Plan, Run, and Difference.
- Preserve backend group order and labels.
- Do not render separate group status pills plus another raw structured-steps row.
- When detailed structure is `not_applicable`, do not show an empty disclosure; the primary row
  carries `Not compared`.

### 6. Comparison details

Use one closed Hito disclosure, `Comparison details`, after the primary rows. It contains supporting,
not primary, truth:

- coverage and confidence;
- number of checks available;
- missing/not-applicable reasons from the canonical signal objects;
- unsupported signals from the support matrix;
- backend tolerance notes when needed to understand a status.

This disclosure replaces the visible `What this review checked` pill gallery and the separate
`Comparison notes` disclosure. Do not show generic prose before the facts.

### 7. AI boundary

Do not render an empty `Next step` section or copy that says a next step is `being prepared` after
upload. That wording falsely implies automatic AI work.

If a historical persisted insight already exists, keep its existing readback as a clearly separate
section below the factual comparison. A future explicit AI action requires its own Product/Backend
contract and is not part of this implementation.

## Responsive contract

This consumer must follow the canonical
[Hito DS Narrow-Screen Readability Contract](./2026-07-31-hito-ds-narrow-screen-readability-contract.md).
No-overflow proof alone is insufficient: the route and primary comparison section must also occupy
the usable viewport width, preserve canonical typography roles, and reflow rather than scale.

### Desktop and tablet

- The comparison uses the available workout-detail content column; no additional max-width card.
- Show one quiet column-label row: `Plan`, `Run`, `Difference`.
- Use a four-column grid with stable alignment and wrapping inside cells.
- Keep status/delta text on one line when space permits; values may wrap without overlapping.

### Exact 375px

- Do not preserve a squeezed desktop table or introduce horizontal scrolling.
- Each metric remains one divided row.
- First line: metric label plus compact factual status.
- Second line: a two-column `Plan` / `Run` value pair with visible captions.
- Difference amount, when distinct from the status, follows below in the same row.
- Disclosures and actions use the full available width.
- No value, pill, or action may force the page wider than the viewport.
- The route box uses the canonical `space-4` mobile gutters; a normal primary section must not
  collapse below the DS readable-width acceptance floor.
- Body, body-small, caption, and technical roles keep their canonical size and line height. Do not
  shrink text to preserve the desktop grid.
- Normal prose keeps normal word boundaries. Emergency wrapping is limited to the bounded filename
  or other genuinely unbounded technical value owner.
- The source filename may truncate in its owner row, while the full value remains available to
  assistive technology/title treatment already used by that owner.

## State model

| Canonical state | Runner-facing behavior |
| --- | --- |
| No asset | Do not render `Plan vs run`; the activity-file entry owns the empty state. |
| Uploading/processing | The active activity-file flow owns progress. Do not render placeholder comparison rows or fake progress. |
| Parse/upload failure | Keep the runner-safe error and retry/remove path near the file owner. Do not render a stale or empty comparison section. |
| Actual metrics, no comparison | Show one compact `Run captured` actual summary and `Comparison unavailable`; do not invent plan statuses. |
| Complete comparison | Show all canonical primary rows with `Complete comparison` coverage. |
| Partial comparison | Show available primary facts, preserve unavailable rows only when they contain useful actual/plan truth, and use `Partial comparison`. |
| Insufficient data | Show available actual facts, `Limited comparison`, and explicit unavailable reasons without a negative verdict. |
| No comparable planned target | Show `No target` in Plan, the actual value when available, and `Not compared`; no delta. |
| Detailed structure unavailable | Keep the primary structure status; omit the detail disclosure. |
| Removing | Keep the current comparison readable while the remove action is pending; disable repeated removal. |
| Remove succeeds | Remove the evidence owner and comparison together, then return to the existing activity-file entry. Manual log truth remains. |
| Remove fails | Retain the existing comparison and show the runner-safe removal error near the owner action. |
| Replacement | Current truthful flow is remove, then upload. Do not show a one-step `Replace` action until backend/product owns one. |

## Accessibility and interaction

- Use a semantic description-list or equivalent grouped-row structure so every Plan, Run, and
  Difference value has an accessible metric label at desktop and mobile.
- Status text must remain understandable without color or icon.
- Disclosures reuse native details/summary behavior or the existing accessible Hito disclosure.
- Keep visible focus on remove and disclosure controls.
- Opening/closing details must not move focus unexpectedly.
- Announce upload/remove operation outcomes through the existing feedback owner; do not add a second
  live region inside comparison rows.
- Use the `−` sign and localized/established formatters consistently; do not rely on arrow direction
  alone.

## Hito DS reuse

No new shared primitive is required for v1.

Reuse:

- existing `hito-panel-title` / section-title hierarchy;
- `hito-row-group`, `hito-list-row`, and hairline dividers;
- `hito-caption`, `hito-list-row-title`, and `hito-technical-mono`;
- compact `hito-status-pill` only where a compact status materially aids scanning;
- `hito-disclosure` for structure and technical details;
- Hito `Icon`, button, focus, theme, spacing, and responsive contracts;
- the existing workout-detail and attached-evidence composition.

Do not create comparison cards, a route-local status-chip family, a chart primitive, or a new
planned/actual data model.

## Implementation boundary

Canonical Product Frontend owners:

- `WorkoutComparisonReadback.tsx`: replace repeated summary/support/signal anatomy with the single
  primary row group and two bounded disclosures.
- `CompletionPanel.tsx`: keep evidence orchestration, render the comparison only when truthful data
  exists, and remove automatic-AI-implying empty `Next step` presentation.

Frontend must first reconcile the active concurrent activity-file dialog work. Do not overwrite or
revert that task's in-flight changes.

The backend comparison builder, persisted rows, read queries, evidence-bundle identity checks,
upload/remove actions, and provider support remain unchanged.

## Acceptance criteria

1. Every primary comparison fact appears once.
2. A runner can scan Plan, Run, and Difference without opening a disclosure.
3. The surface never labels a longer/shorter/earlier/later run as universally better or worse.
4. Complete, partial, insufficient, missing-actual, and no-target states use canonical backend truth.
5. Distance without an explicit plan target reads `Not compared`, while actual distance remains
   visible when available.
6. Pace, heart rate, and RPE are not presented as compared metrics.
7. Structure detail appears only when canonical aligned detail is available.
8. No empty `Next step` or `being prepared` copy implies automatic AI dispatch.
9. Upload failure does not leave a stale or empty comparison section.
10. Removal success clears evidence and comparison together; removal failure preserves both.
11. Desktop and exact 375px have no horizontal overflow, clipping, duplicated pills, or card stack.
12. Dark and light themes preserve contrast; direction/status remains clear without color.
13. Keyboard users can reach and operate disclosures and evidence actions with visible focus.
14. No plan, upload, comparison, persistence, provider, AI, or manual-log behavior changes.

## Required implementation validation

- Source discriminator proving primary facts are no longer rendered by both summary and signal
  layers.
- Complete, partial, insufficient, missing-actual, not-applicable, and no-target fixtures.
- Structured detail available and unavailable fixtures.
- Upload failure, removal pending/success/failure, and remove-then-upload replacement path.
- Dark/light desktop and exact 375px browser screenshots.
- Keyboard/focus and no-color status review.
- No horizontal overflow, console/page errors, or stale comparison after removal.
- Targeted lint, production build, build-integrity, and scoped diff checks.

## Non-goals

- AI verdict UI or dispatch.
- Plan adaptation or future workout edits.
- Garmin account sync.
- Additional activity providers or file formats.
- New comparison thresholds, metrics, analytics, or backend truth.
- Changes to manual workout result logging.
- A shared chart or comparison component added only for this screen.
