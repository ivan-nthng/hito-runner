# Runner Core Freeze And Design Polish Plan

## Status

completed

## Type

plan

## Priority

high

## Next Recommended Role

product

## Task

Close the frozen Runner Core and its first bounded design-polish batch.

## Stage

Completed / Runner Core freeze and first design-polish closure.

## Decision

Freeze applies to the **runner core**, not the whole repository: profile persistence, plan
creation, signed review/confirm, today/future workout editing, logging, settings, calendar/detail
readback, export/import, and local observability. Admin backlog work and explicitly new product
features remain separate tracks.

During the freeze, frontend design polish may change layout, visual hierarchy, copy, interaction
clarity, accessibility, and responsive behavior. It must not alter runner-visible lifecycle rules,
provider prompts/contracts, persistence semantics, review exactness, migrations, or data retention.
Only P0/P1 regressions or a concrete runner-blocking defect reopen a frozen core contract.

## Freeze Gates

The runner core is ready to freeze when one release-candidate checkpoint proves all of the following
against current integrated source, not prior partial artifacts:

1. **Source hygiene:** every intentional source, migration, and doctrine file is in the normal diff
   or index; no required runtime file is `??`; generated residue such as `supabase/.temp/cli-latest`
   is excluded; `git diff --check` passes.
2. **Current truth:** `current-product`, `current-system`, `current-state`,
   `current-functional-map`, active plans, and the technical log contain no conflicting current
   claim about plan authorship, watch targets, profile persistence, or today/future editing.
3. **Runner lifecycle:** a saved profile reloads age, height, weight, fitness, availability, and
   accepted estimated or personal HR zones independently of plan creation; Quick setup
   creates/reviews/confirms a real-provider plan; future and today workouts
   can be reviewed and edited; past and Rest rows remain non-editable; logging and saved readback
   stay coherent.
4. **Plan quality contract:** the accepted 10K, Half Marathon, Marathon, and Custom scenarios
   retain one primary execution mode per runnable leaf through signed review, persistence, and
   export/import. Paid calls are not repeated unless current integrated code invalidates existing
   evidence or a P0/P1 regression requires it.
5. **Release safety:** current validators, production build, build integrity, local database reset
   and persistence proofs pass; browser QA covers desktop and exact 375px with no overflow,
   console/page errors, or bad HTTP; disposable QA data returns to zero.
6. **Observability:** local loopback logs correlate request, generation, OpenAI response, provider
   outcome, compiler outcome, and persistence outcome. Raw provider transcripts remain private local
   artifacts, never a cache, fallback, Git artifact, or hosted product store.

## 2026-07-20 Architecture Verdict

**Runner Core code freeze: PASS.** The accepted manual-template catalog, proof helper, and template
visibility migration are intentional source changes inside the normal diff boundary; no maintained
source remains untracked. Generated Supabase CLI temp state is removed from versioned truth and
ignored. A fresh loopback Supabase reset applied the complete migration history, targeted contract
and persistence validators passed with disposable cleanup to zero, and production build plus
build-output integrity passed.

The canonical managed server was rebuilt and independently restored to `providerMode: real`.
Managed, compatible, loopback-bound, healthy status and HTTP `200` were verified without calling
OpenAI; stale fixture environment residue cannot activate the local QA provider in real mode.
Existing accepted browser and four-scenario paid-provider evidence remains the behavioral proof
because current-source validation exposed no Runner Core regression.

The final release-hygiene tail is closed: the unconsumed direct
`listManualWorkoutSavedTemplates` server wrapper and public re-export are removed, while the
canonical `listManualWorkoutSavedTemplatesForUser` function remains live inside
`listManualWorkoutTemplateCatalog`. Focused manual-authoring validation, targeted lint, production
build, build integrity, reference scans, and diff checks passed. No remaining pre-freeze parallel
capability or P0/P1 blocker is source-proved.

Hosted external-user testing remains a separate release/ops decision because non-loopback auth,
hosted migration/RLS parity, provider failure handling, privacy/retention, and deployment recovery
were not accepted by this local Runner Core freeze.

## 2026-07-21 Runner Baseline And HR Truth Addendum

The frozen Runner Core now includes one accepted baseline lifecycle: age, height, weight, fitness,
and accepted HR provenance persist without plan rows; setup and Settings share the same read/edit
contract; AI may choose either accepted estimated/personal BPM or effort without HR being forced;
and confirm freezes numeric BPM into the reviewed plan. Later profile changes affect future authoring
only. This accepted extension does not change the separate hosted-release boundary above.

## 2026-07-20 Designer Audit And Integrated Polish Verdict

**Bounded polish batch: PASS.** The fresh source and browser audit found one material shared-theme
regression that remained after the broader Hito DS conformance closeout: active rows and active
segment boundaries in `WorkoutStructureTimeline` still used white-specific visual values. That made
the selected row almost disappear on light surfaces even though the same interaction remained clear
in dark mode.

The shared timeline owner now resolves both treatments through the existing semantic foreground
token. No new primitive, token family, component API, route-local recipe, product state, or workout
behavior was added. The correction therefore reaches generated workout readback, manual workout
preview/editor composition, and `IntervalsViz` through their existing shared owner.

Validation covered targeted lint, production build, build-output integrity, scoped diff checks, and
fresh built-in-browser inspection on desktop and exact `375px` in dark and light themes. Active row,
segment boundary, tooltip, inactive dimming, workout colors, and focus retention remained coherent;
document width matched the viewport at both sizes, browser console errors were empty, the canonical
workout URL resolved to HTTP `200`, and the disposable local runner returned to zero rows after the
pass. `/hitoDS` did not change because this batch corrected a consumer to an already-canonical token
contract rather than changing reference truth.

### Calendar Decision

Dates after the final workout of an active schedule retain the same runner-facing `Rest` grammar as
any other unassigned active-plan date. A plan is a collection of scheduled workouts, not a separate
calendar state with an end boundary; a runner can later create a new plan through AI, manual
authoring, or import. Do not introduce an after-plan or outside-plan rendering state for this case.

## 2026-07-20 Runner Shell Current-Location Polish Verdict

**Second bounded polish batch: PASS.** Fresh source and browser evidence showed workout detail lost
its Calendar parent state in both shell variants: desktop and mobile used different pathname tests,
and neither current link exposed `aria-current`. The shared `AppShell` now owns one route-to-navigation
rule, keeps Calendar current on calendar and workout-detail routes, keeps Progress current only in its
route family, and leaves unrelated routes neutral.

The correction reuses the existing `hito-shell-nav-row`, `hito-shell-mobile-row`, `data-active`,
active marker, and focus-visible treatment. No navigation destination, icon, layout, token, CSS,
Runner Core lifecycle, or persisted truth changed. The shared shell now matches the current-location
semantics already demonstrated by Hito DS and Admin navigation without introducing another primitive.

Validation covered targeted lint, production build, build-output integrity, scoped diff checks, and
built-in-browser proof on `/`, workout detail, Progress, and Settings. Desktop and exact `375px`, dark
and light themes, keyboard focus, `aria-current`, route navigation, HTTP, console state, and horizontal
overflow all passed. The disposable local runner returned to zero rows after validation.

## 2026-07-21 Onboarding Footer Containment Verdict

**Bounded responsive fix: PASS.** The shared onboarding submit footer was viewport-centered while the
AppShell desktop sidebar already occupied its own fixed-width column. At the shared `md` breakpoint,
the footer now uses the existing shell sidebar width and Hito spacing tokens for its main-content
inset; the existing mobile in-flow behavior remains unchanged.

Built-in-browser validation covered live Quick setup and its expanded Advanced settings at
`1280x960` light mode, wider desktop, and exact `375px`. Footer overlap with the sidebar, profile, and
final form content was zero; document width matched viewport width, actions remained reachable, all
local HTTP responses were `200`, console/page errors were empty, provider calls remained zero, and
disposable data cleanup remained zero.

### Deferred Design Backlog

1. **Shared tabs need one behavior-owner pass before route-local fixes.** Settings, workout detail,
   and plan creation share visual tab grammar but do not yet share one complete keyboard and panel
   relationship contract. Keep this separate from shell navigation because its validation surface and
   interaction risk are broader.
2. **Radio-style choice controls need one keyboard-owner pass.** Existing choice-card, choice-toggle,
   and scale visuals are canonical, but roving focus and arrow-key behavior should be consolidated
   only through their shared selection-control owner.
3. **Calendar's low-level Button compatibility seam remains bounded debt.** Consolidate it only when
   the date picker/calendar control family is next changed; do not add a third button API now.
4. **Workout title and metric anatomy remains small repeated composition debt.** Align or extract it
   only when a visible hierarchy correction is required; the current two title consumers and mixed
   metric variants do not justify a speculative component family.

Keep accepted manual-editor geometry, workout color semantics, calendar cell geometry, readback
density, plan-note composition, and frozen Runner Core lifecycle contracts unchanged unless fresh
evidence proves a concrete regression.

## Handoff Rules

- The Runner Core contract is frozen. Product behavior changes require a separate scoped plan or a
  concrete P0/P1 regression.
- If a gate fails, route one bounded fix to the first incorrect owner. The implementation owner
  performs its own reusable QA and fix-forward; Product is not a relay.
- Runner-facing visual work now routes to DESIGNER then FRONTEND as bounded design-polish tasks.
- Ask Product before changing runner-visible product behavior, coaching doctrine, schema/migrations,
  destructive/history semantics, privacy retention, or paid-provider policy.

## Exact Handoff Prompt

```text
No active handoff. Select a new polish task only when fresh runner evidence identifies a concrete
visual, accessibility, or responsive defect.
```

## Exit

This plan is complete. Runner self-use and controlled tester feedback now supply evidence for any
future bounded polish work; new product capabilities remain separate planned work, not freeze
exceptions.
