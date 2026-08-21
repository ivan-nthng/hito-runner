# Hito Notion Task And Epic Progress Visibility

Work Item ID: `2026-08-21-hito-notion-task-and-epic-progress-visibility`
Notion Task: `HITO-229`
Status: completed
Type: maintenance
Priority: high
Owner: PRODUCT
Epic: rebuild-hito-product-foundation
Scope: Notion task-control presentation and lifecycle projection only.
Archive Intent: Retain the minimal display contract and redacted schema rollback reference. Do not
retain a second tracker, phase-task database, custom counter, background service, or mirrored
technical documentation.

## Outcome

Make execution progress legible without splitting one product outcome into artificial phase tasks.

- Task delivery steps remain checked/unchecked body blocks; they are not duplicated into a property.
- An Epic has one native numeric `Completion` formula derived from related non-cancelled Task
  statuses: `Done / (all related Tasks except Cancelled)`.
- The `Hito Epics` native `Progress` view renders that numeric formula as a horizontal bar chart.
- `Phase` remains the current kind of work; it is not the delivery-checklist sequence.

## Boundaries

- Reuse the existing `Hito Running` Tasks and `Hito Epics` data sources and their relation.
- Do not retain a custom `Progress` text property or manually maintained counter.
- Add only the native computed `Completion` formula to the existing Epics data source.
- Reuse one native chart view named `Progress`; do not introduce a dashboard, second data source or
  generated visualisation.
- Do not add a phase database, child-task hierarchy, duplicate lifecycle, custom ID, runtime
  dependency, Supabase data, provider, or repository sync daemon.
- Existing task body checkboxes are the source of delivery-step truth. A database formula cannot read
  page-body blocks, so a Task does not display an invented automatic percentage.
- A delivery step becomes a separate Task only when it has a separately schedulable outcome,
  independent acceptance, or an autonomous blocker.

## Delivery Plan

- [x] Create the tracked Task and capture a private schema snapshot before mutation.
- [x] Remove the rejected Task/Epic `Progress` text fields and their values.
- [x] Add and read back native Epic `Completion` over the existing Task relation.
- [x] Keep HITO-224 as the proof page: seven delivery-step checkboxes, without a duplicate display.
- [x] Verify the Foundation Epic calculation excludes `Cancelled` and needs no lifecycle refresh.
- [x] Create and read back the formula-backed native `Progress` horizontal-bar view.
- [x] Record the native-boundary rule and verify final live readback.

## Validation

- Confirm both rejected text properties are absent and no unrelated schema delta exists.
- Confirm HITO-224 retains its source checklist without a duplicate Task projection.
- Confirm `Completion` is a computed native formula and cancelled Tasks do not contribute to its
  denominator.
- Confirm the `Progress` view is a horizontal bar chart over the same formula with a `0..1` axis.
- Confirm a fresh Epic page read returns the expected numeric value without a lifecycle write.

## Preflight Receipt

- A private schema snapshot was written outside the repository with mode `0600` before mutation.
- HITO-229 was created in the existing `Hito Running` data source with Primary Area `Platform` and
  the active `Rebuild Hito’s Product Foundation` relation.
- No product source, Supabase, hosted service, Git lifecycle, or other Task lifecycle was changed.

## Superseded Attempt

The initial text projection was rejected by Product because it required a duplicate write on every
lifecycle transition. It was removed rather than retained as a compatibility display.

## Implementation Receipt

- Removed both `Progress` rich-text properties and all of their row values from the existing Tasks
  and Epics data sources.
- Added one native `Completion` formula to `Hito Epics`. It filters related Tasks where Status is
  not `Cancelled`, then divides related `Done` Tasks by that remaining count. It has no writable
  row value and no refresh action.
- HITO-224 retains its seven delivery-step checkboxes as its only phase map. No phase Task,
  child-task hierarchy, manual counter, custom bar, runtime dependency, or repository sync service
  was added.
- Created one native `Progress` chart view in `Hito Epics`: horizontal bars, `Completion` as its
  numeric measure, explicit `0..1` scale, green value gradient and data labels. It updates from the
  formula and does not receive agent writes.
- Replaced the manual-projection rule in `AGENTS.md` and the routing contract with the computed
  Epic boundary. The Task checklist remains the truth; Notion controls any native percentage/bar
  presentation for `Completion`.

### Validation

| Check                                | Result                                                                     |
| ------------------------------------ | -------------------------------------------------------------------------- |
| Private pre-mutation schema snapshot | Passed; mode `0600`, outside repository                                    |
| Rejected text fields                 | Passed; Task and Epic `Progress` properties are absent                     |
| HITO-224 proof                       | Passed; top checklist remains present; no duplicate Task property exists   |
| Epic calculation                     | Passed; native Foundation `Completion` is `4 / 7` after this Task closes   |
| Native visualisation                 | Passed; `Progress` is a horizontal bar over `Completion` on a `0..1` axis  |
| Lifecycle                            | Passed; HITO-229 closes only after final native-boundary readback          |
| Final readback                       | Passed; formula, no text properties and unchanged task checklist confirmed |

No Runner source, Supabase, hosted state, browser, build, Git lifecycle, or deployment action was
performed. The migration intentionally does not invent delivery plans for HITO-216, HITO-218 or
HITO-219; their active owner admits real steps on their own Task pages when needed.
