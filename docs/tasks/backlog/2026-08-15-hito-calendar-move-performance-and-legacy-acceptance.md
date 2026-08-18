# Hito Calendar Move Performance And Legacy Acceptance

Work Item ID: `2026-08-15-hito-calendar-move-performance-and-legacy-acceptance`
Status: backlog
Type: Tracked
Priority: high
Owner: QA
Epic: platform-and-operations
Scope: Independent local acceptance and performance characterization of Calendar Move/Undo after
the stored-Rest recovery repair. Verification only; no product, Backend, Design System, schema, or
fixture-source implementation.
Archive Intent: Retain as the deferred physical-device/browser-control acceptance record; compact
after its terminal device replay.
Parent: [Hito iPad Calendar Drag, Sidebar, And Move Recovery](./2026-08-15-hito-ipad-calendar-drag-sidebar-and-move-recovery.md)
Depends On: [Workout Move Undo Stored Rest Reversibility](./2026-08-15-hito-workout-move-undo-stored-rest-reversibility.md)
Evidence From: [Calendar Workout Standalone Entity And Plan Source Decoupling Discovery](./2026-08-15-hito-calendar-workout-standalone-entity-and-plan-source-decoupling-discovery.md)

## Task

Run the complete focused Calendar movement acceptance after the completed Backend stored-Rest Undo
repair. Establish whether the reported slow day movement is observable, quantify it without adding
instrumentation, and separate any UI latency from the demonstrated legacy plan-container work that
the Architecture discovery has assigned to later Backend slices.

## Accepted Product Rule

A plan is source/provenance only. Confirmed calendar workouts are runner-owned, origin-neutral
entities. Move, Undo, Add, Edit, Copy, Clear, completion, evidence, visibility, and schedule must
never require a plan container. Current legacy storage may be reported as a temporary fact, but it
cannot be accepted as an intended cause or copied into a workaround.

## Required Acceptance Inventory

1. Admit a fresh, healthy, loopback-only managed `qa_fixture` runtime and use only named disposable
   local QA identities. Reuse existing reset/seed/cleanup paths; do not directly shape data or use
   hosted services.
2. Replay the explicit no-hover iPad-class Move fallback at `768×1024` and `1024×768` in Light and
   Dark. Record whether a real iPad/Safari device is available; Chromium emulation is not a
   substitute for actual-device touch proof.
3. For each supported target, prove one durable sequence: Workout -> empty date -> reload -> Undo ->
   reload; Workout -> stored Rest -> reload -> Undo -> two reloads; and the occupied/replacement
   rejection boundary. Confirm exact source/target identity, Rest identity, provenance, and no
   duplicate rows.
4. Replay keyboard/pointer Move, cancellation, Escape/focus return, `Back to Calendar`, desktop
   native drag where the fixture permits it, document/sidebar scroll ownership, horizontal overflow,
   and console health. Continue independent scenarios after a failure.
5. Characterize local movement timing with five sequential successful samples for empty-target Move
   and stored-Rest Move/Undo after one warm-up each. Record:
   - click/keyboard action to visible pending or feedback;
   - action to visible Calendar projection update;
   - action to durable reload confirmation;
   - browser console/network/server timing evidence when available;
   - median and slowest sample, fixture state, viewport, and runtime identity.
     These are local characterization figures, not production latency claims.
6. Inspect the existing Architecture dependency map only far enough to associate an observed slow
   phase with its first likely owner. Do not label legacy coupling as the demonstrated cause without
   timing/source evidence. If a phase cannot be measured with current observability, state the exact
   missing discriminator rather than adding a profiler, log, helper, or runtime code.
7. Run final disposable cleanup and prove zero task-owned data. Store screenshots and timing evidence
   under `qa-artifacts/`; update only this canonical item.

## Expected Outcome

- Move and Undo remain correct and responsive in the local fixture, including a displaced Rest.
- Any material delay has a reproducible phase boundary, evidence, and one first incorrect owner.
- The QA report does not propose a client-only cache, optimistic mutation, duplicate state, or plan
  compatibility path. Performance improvements route to the responsible Backend or Frontend owner
  after the measurement.
- The later standalone-workout migration remains the only path for removing legacy plan-container
  authority. This QA task neither implements nor substitutes for it.

## Boundaries

- Reuse the existing Calendar interaction, managed QA runtime, disposable fixture lifecycle, and
  browser-control surfaces. New runtime artifacts, production helpers, migrations, fixtures,
  validators, dependencies, and observability systems: none.
- Preserve the completed Backend Move/Undo source and migration, the active architecture discovery,
  all unrelated dirty hunks, and existing design-system contracts.
- QA may ask the existing named ARCHITECT or BACKEND role one bounded read-only question if a timing
  observation cannot be mapped to a canonical owner. Do not interrupt an active writer, dispatch
  implementation, or make a repair.

## Validation Expectations

The receipt must include a Check | Scenario / environment | Result | Evidence table; every discovered
failure rather than only the first; timing samples; cleanup proof; actual-device versus emulation
coverage; and explicit distinctions among local QA, Global QA, hosted, release, and production
acceptance. `Verdict: Passed` requires all required local scenarios and cleanup to converge. A real
iPad/Safari coverage gap keeps that portion open but must not prevent reporting other outcomes.

## Stage

Deferred physical iPad/Safari and native desktop-drag acceptance. The local Move/Undo,
performance, and sidebar contracts were superseded by the accepted Runner Core baseline; this item
does not block release-candidate admission.

## Next Recommended Role

QA when the physical-device or native desktop-drag control surface is available.

## QA Execution And Browser Path Preflight — 2026-08-15

- **Mode / validation layer:** Tracked independent focused local QA and performance
  characterization. This is not Global QA, hosted, release, deployment, production, or real-device
  acceptance.
- **Owner and write boundary:** QA owns browser/runtime/fixture evidence and this receipt only.
  Runtime source, styles, shared primitives, schema, migrations, fixture source, configuration,
  providers, hosted data, and Git lifecycle are read-only. New runtime artifacts or compatibility
  paths: none.
- **Candidate/runtime admission:** the managed server was stopped with `artifact_missing`; no build,
  runtime process, build lock, pool lease, or competing lifecycle owner was present. The Git index
  was empty. QA owns one serialized `qa:server:restart` in `qa_fixture`, followed by a fresh/healthy/
  loopback/receipt-matching status gate before browser navigation.
- **Local data boundary:** local Supabase resolved only to `http://127.0.0.1:54321`.
  `qa-baseline@local.test` (`baseline-no-plan`) is the named disposable identity. Its admission
  inventory contained the retained profile plus one legacy plan and two workouts; the normal
  profile-preserving `pool-reset-plan` lifecycle will establish zero task-owned data before setup
  and fully clean it afterward. Protected Admin, retained FIT, hosted, and real identities are
  excluded.
- **Browser path:** the built-in managed browser is the primary non-prompting control surface at
  exact `768x1024`, `1024x768`, desktop, and focused phone sizes in Light/Dark. DOM, focus, keyboard,
  pointer, overflow, console, screenshots, and reload readback will be recorded. No real iPad/Safari
  device is connected; responsive Chromium evidence will not be represented as actual-device touch
  proof.
- **Timing method:** after one warm-up per target class, take five sequential successful samples
  using existing browser-observed action/feedback, Calendar projection, reload completion, runtime
  event, and durable Product/readback evidence. Record action-to-feedback, action-to-projection, and
  action-to-reload-confirmed durations, plus median/slowest. No source profiler, helper, log, fixture,
  or runtime instrumentation will be added.
- **Accepted architecture boundary:** plans remain source/provenance only. Current plan-shaped IDs,
  metadata, and storage are temporary legacy implementation facts from the Architecture discovery;
  this QA run will neither normalize them as Product authority nor propose a client workaround.
- **Failure policy:** continue every safe independent case. Stop only the affected mutation branch
  if fixture integrity, persistence truth, or cleanup cannot be established; record the exact
  replay and first proven owner or missing discriminator. QA does not fix forward.

## Tracked QA Receipt — 2026-08-15

### Task And Validation Layer

- **Task:** Hito Calendar Move Performance And Legacy Acceptance.
- **Stage:** independent local acceptance and performance characterization.
- **Validation layer:** focused local QA only. This receipt does not claim Global QA, actual-device,
  hosted, release, deployment, production, or production-latency acceptance.
- **Role file:** `agents/qa.agent.md`.
- **Skills used:** `skills/hito-qa-browser-regression/SKILL.md` and
  `skills/hito-backend-supabase-contract/SKILL.md` for the named local Supabase/fixture lifecycle.
- **Subagents:** none. No timing or ownership question remained that required interrupting an
  existing ARCHITECT or BACKEND owner.

### Browser And Runtime Preflight

QA admitted one serialized fresh artifact after proving that the previous managed server was
stopped with `artifact_missing`, the index was empty, no build/runtime owner or lock was active, and
local Supabase was loopback-only. `npm run qa:server:restart -- --provider-mode qa_fixture` produced
PID `88826`; the terminal status gate remained `managed: true`, `compatible: true`,
`loopbackBind: true`, `healthy: true`, `providerMode: qa_fixture`, `artifactFreshness: fresh`, and
`freshnessReason: receipt_matches`. Local Supabase remained `http://127.0.0.1:54321` with no hosted
access. The retained FIT identity was not used or mutated.

The browser path was the Codex in-app Chromium artifact. Exact responsive viewports were
`768x1024` and `1024x768` in Light and Dark; the timing run used `1024x768` Dark, and the desktop
drag attempt used `1470x801`. This environment reported `hover: hover` and a fine pointer, so it is
not actual no-hover iPad/Safari evidence.

### Executed Inventory

| Check                              | Scenario / environment                                                            | Result                                                | Evidence                                                                                                                                                                                                                                                                                            |
| ---------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Managed runtime admission          | Fresh loopback `qa_fixture`, PID `88826`                                          | Passed                                                | Final `qa:server:status`: managed, compatible, loopback-bound, healthy, fresh, receipt-matching; local Supabase check also passed.                                                                                                                                                                  |
| Named disposable lifecycle         | `qa-baseline@local.test` / `baseline-no-plan`                                     | Passed                                                | Admission reset reached one retained profile and zero task-owned rows; Product UI created one manual provenance plan plus the three required Calendar rows.                                                                                                                                         |
| Portrait responsive fallback       | `768x1024`, Light and Dark                                                        | Passed for responsive Chromium only                   | Document `clientWidth === scrollWidth === 768`; sidebar `clientHeight === scrollHeight === 1024`, `scrollTop 0`; visible action triggers were `28x28`. Screenshots: `ipad-portrait-light.png`, `ipad-portrait-dark.png`.                                                                            |
| Landscape responsive fallback      | `1024x768`, Light and Dark                                                        | Passed for responsive Chromium only                   | Document `clientWidth === scrollWidth === 1024`; sidebar `clientHeight === scrollHeight === 768`, `scrollTop 0`; hidden hover actions became usable through focus. Screenshots: `ipad-landscape-light.png`, `ipad-landscape-dark.png`.                                                              |
| Empty target Move/Undo             | Workout `2026-08-17` -> empty `2026-08-20` -> reload -> Undo -> reload            | Passed                                                | Five post-warm-up sequences returned the same workout to `2026-08-17`, left `2026-08-20` empty, and created no duplicate.                                                                                                                                                                           |
| Stored Rest Move/Undo              | Workout `2026-08-17` -> stored Rest `2026-08-18` -> reload -> Undo -> two reloads | Passed                                                | Five post-warm-up sequences plus the second final reload restored the same source and Rest identities. Read-only SQL showed exactly three unique rows: source `41e726f6-577d-4e55-bd6b-df868722a917`, Rest `fc5aa7f8-da51-420b-8590-7b016d8f5a43`, occupied `b633d1b6-c234-4f02-bf7d-d42ff149236e`. |
| Occupied target boundary           | Move source to occupied `2026-08-19`                                              | Passed                                                | Product showed the factual `Replace target workout?` review; Cancel plus reload preserved source and occupied rows unchanged. No implicit replacement occurred.                                                                                                                                     |
| Pointer Move and cancellation      | Calendar source menu and empty-target menu                                        | Passed                                                | Pointer opened Move, target selection exposed `Move selected workout here`, and `Cancel move` preserved the source and returned focus to the target trigger.                                                                                                                                        |
| Keyboard, Escape, and focus return | Source action and stored-Rest add menu                                            | Passed for button/menu controls                       | Enter opened the semantic source action; Escape closed menus; focus returned to the invoking button with `aria-expanded=false`.                                                                                                                                                                     |
| Back to Calendar                   | Workout detail at `/workout/2026-08-17?tab=overview`                              | Passed by pointer; native-link keyboard path unproven | Pointer activation returned to `/`. Both `Back to Calendar` and the ordinary `Progress` anchor failed to activate through the available CUA/locator Enter path, so the common control limitation does not isolate a Product defect.                                                                 |
| Desktop native drag                | `1470x801`, source draggable card -> empty target                                 | Coverage gap                                          | DOM exposed `draggable=true` and valid source/target rectangles. Two bounded native CUA drag paths produced no drag event, mutation, toast, or server action. Menu Move remained independently passed.                                                                                              |
| Overflow and scroll ownership      | Portrait, landscape, desktop                                                      | Passed                                                | No page-level horizontal overflow; document owned vertical scrolling; the sticky sidebar did not acquire a competing scroll position.                                                                                                                                                               |
| Console/runtime/provider health    | Full browser matrix and runtime event readback                                    | Passed                                                | Browser warning/error inventory was empty. Runtime POST/GET events were HTTP `200`, loopback-only, and `providerKind: null`; no provider dispatch occurred.                                                                                                                                         |
| Legacy authority discriminator     | Current SQL/readback plus Architecture dependency map                             | Passed                                                | Calendar rows retained an archived `plan_cycle_id` and legacy move metadata as temporary provenance/storage facts. No measured slow phase was attributed to that legacy shape, and no client workaround or compatibility path is proposed.                                                          |
| Final cleanup                      | Named `pool-reset-plan`, inventory, browser reload                                | Passed                                                | One plan/three workouts converged to zero plan cycles, workouts, logs, results, activity rows, comparisons, templates, entitlements, and capability rows; no leases remained; browser returned to `Choose how to start your plan.`                                                                  |

### Local Timing Characterization

Five successful samples followed one excluded warm-up for each target class. Figures are cumulative
browser-observed milliseconds on the local managed fixture, not production latency claims.

| Target / phase                                             |             Median |            Slowest |
| ---------------------------------------------------------- | -----------------: | -----------------: |
| Empty Move: pending feedback                               |             137 ms |             162 ms |
| Empty Move: Calendar projection                            |             270 ms |             455 ms |
| Empty Move: reload-confirmed durability                    |             575 ms |             900 ms |
| Empty Undo: pending / projection / reload durability       | 125 / 235 / 507 ms | 137 / 347 / 723 ms |
| Stored Rest Move: pending feedback                         |             137 ms |             144 ms |
| Stored Rest Move: Calendar projection                      |             342 ms |             352 ms |
| Stored Rest Move: reload-confirmed durability              |             555 ms |             627 ms |
| Stored Rest Undo: pending / projection / reload durability | 121 / 226 / 767 ms | 122 / 229 / 798 ms |

The complete raw five-sample inventory is in
`qa-artifacts/screenshots/2026-08-15/hito-calendar-move-performance-and-legacy-acceptance/timing-results.md`.
The browser and loopback server evidence does not show a material slow phase, so no performance
defect or first incorrect performance owner is established.

### Issues And Coverage Gaps

- **Product defects:** none found in the executed local matrix.
- **Actual-device gap:** no real iPad/Safari or touch device was available. Responsive Chromium at
  the exact iPad-class sizes is useful layout evidence but cannot close no-hover/touch acceptance.
- **Desktop-drag control gap:** the fixture exposed the draggable contract, but neither supported CUA
  drag path delivered a native drag event. This leaves desktop native drag unproven; it is not
  reported as a Product defect because event delivery itself was not established.
- **Native anchor-key gap:** the available Enter path did not activate either the task-owned Back
  link or an ordinary shell anchor, while pointer Back worked. The environment therefore does not
  isolate a task-owned anchor defect. Keyboard button/menu Move remained proved.
- **Coverage consequence:** `Verdict: Passed` requires every required local scenario. Actual-device
  no-hover/touch proof and native desktop drag remain open, so the terminal pass cannot be claimed
  even though every executed mutation, persistence, timing, overflow, provider, console, and cleanup
  check passed.

### Evidence

- `qa-artifacts/screenshots/2026-08-15/hito-calendar-move-performance-and-legacy-acceptance/timing-results.md`
- `qa-artifacts/screenshots/2026-08-15/hito-calendar-move-performance-and-legacy-acceptance/desktop-after-timing.png`
- `qa-artifacts/screenshots/2026-08-15/hito-calendar-move-performance-and-legacy-acceptance/final-cleanup-zero.png`
- `qa-artifacts/screenshots/2026-08-15/hito-calendar-move-performance-and-legacy-acceptance/ipad-portrait-light.png`
- `qa-artifacts/screenshots/2026-08-15/hito-calendar-move-performance-and-legacy-acceptance/ipad-portrait-dark.png`
- `qa-artifacts/screenshots/2026-08-15/hito-calendar-move-performance-and-legacy-acceptance/ipad-landscape-light.png`
- `qa-artifacts/screenshots/2026-08-15/hito-calendar-move-performance-and-legacy-acceptance/ipad-landscape-dark.png`

**Verdict: Failed**

The failed verdict reflects incomplete required device/control evidence, not a demonstrated Product,
Backend, or performance defect. The item remains blocked for a drag-capable desktop control path and
real iPad/Safari no-hover/touch replay. Next owner remains QA. The standalone-workout Architecture
item remains the sole accepted path for legacy plan-container removal.

## Exact Handoff Prompt

```text
ROLE: QA

Task: Hito Calendar Move Performance And Legacy Acceptance
Stage: Deferred physical-device acceptance — local Calendar Move/Undo acceptance passed; real iPad/Safari and native desktop-drag remain separately unproved.

## Product Lifecycle Reconciliation — 2026-08-18

This is an explicit physical-device/browser-control evidence gate, not an open Runner Core source
defect. Its local Move/Undo and performance contract was superseded by the accepted 2026-08-17
Runner Core baseline; retain the deferred real-device scope under Platform and Operations.
Mode: Tracked
Canonical item: docs/tasks/backlog/2026-08-15-hito-calendar-move-performance-and-legacy-acceptance.md
Parent: docs/tasks/backlog/2026-08-15-hito-ipad-calendar-drag-sidebar-and-move-recovery.md
Depends On: docs/tasks/backlog/2026-08-15-hito-workout-move-undo-stored-rest-reversibility.md
Evidence From: docs/tasks/backlog/2026-08-15-hito-calendar-workout-standalone-entity-and-plan-source-decoupling-discovery.md

Ivan explicitly authorized immediate execution. Read AGENTS.md, agents/qa.agent.md,
skills/hito-qa-browser-regression/SKILL.md, the complete canonical item, the completed Move/Undo
receipt, and the Architecture discovery before action. Read hito-backend-supabase-contract only if
the required local fixture lifecycle needs it. QA owns verification only: do not edit runtime source,
styles, shared primitives, schema, migrations, fixture source, configuration, hosted data, providers,
or Git lifecycle.

First admit a fresh, healthy, loopback-only managed qa_fixture artifact. Use only named disposable
local identities and the existing lifecycle to create, reset, and fully clean data. Run every required
scenario in the item; continue all safe independent cases after a defect. Cover no-hover iPad-class
portrait/landscape Move fallback, keyboard/pointer/desktop drag where available, empty/Rest/occupied
targets, Move -> reload -> Undo -> reload, focus/Escape, sidebar/page overflow, and console health.
State real iPad/Safari availability truthfully.

Measure five post-warm-up local samples each for empty-target Move and stored-Rest Move/Undo: action
to pending feedback, projection update, and reload-confirmed durability. Record median and slowest
sample with runtime/fixture/viewport context. Use existing browser/network/server evidence only; do
not add instrumentation. Associate a slow phase with an owner only when evidence proves it. The
standalone-workout Architecture discovery is the source of truth for legacy removal; QA must not
introduce a client workaround, plan compatibility path, or implementation recommendation without a
demonstrated cause.

You may ask existing named ARCHITECT or BACKEND for one narrow read-only cause/ownership fact if it
materially closes an evidence gap; do not interrupt an active writer and do not delegate repairs.
Perform final disposable cleanup, save QA artifacts, and update only this canonical item with an
English tracked QA receipt. List every defect and coverage gap. Do not claim Global QA, hosted,
release, or production acceptance.
```
