# Authenticated Product Typography And FIT Local QA

- **Work Item ID:** `authenticated-product-typography-and-fit-local-qa`
- **Status:** `completed`
- **Type:** `local-global-qa-acceptance`
- **Priority:** `high`
- **Owner:** `qa`
- **Scope:** `authenticated Product typography adoption and retained local Garmin FIT result flow`
- **Archive Intent:** `retain_in_place`
- **Stage:** `Global QA Acceptance: Passed for the bounded local post-change Product-review slice`
- **Next Recommended Role:** `product`

## Task

Independently verify the two changes made after the prior bounded Calendar and saved Plans acceptance:
the authenticated Product migration to existing Poppins UI title roles, and the factual retained
Garmin FIT result flow with observed-run metrics. This is a local Product-review gate, not hosted,
deployment, production, or release acceptance.

## User Report

The service is being prepared for real users. The user required consistent Poppins headers inside
the authenticated service while preserving Fraunces for editorial/marketing surfaces, and supplied
a real Garmin ZIP after observing that elevation was not visible in the result UI. Original FIT files
must remain privately retained during testing rather than being automatically deleted.

## Evidence

- [Authenticated Product UI title adoption](2026-08-10-authenticated-product-ui-title-adoption.md)
  migrated all 63 in-scope consumers with no shared typography or editorial-surface change.
- [FIT-backed planned workout Product presentation](2026-08-05-fit-backed-planned-workout-product-presentation.md)
  now renders factual observed metrics and retains one named local acceptance record with a raw
  source available for reprocessing.
- The prior [Calendar and saved Plans Global QA](2026-08-10-runner-calendar-and-saved-plans-global-qa.md)
  remains accepted evidence for its unchanged scope. Do not claim its flows were rerun.

## Product Contract

- Authenticated Product headers use existing Poppins UI title roles at their established geometry.
  Fraunces remains unchanged in public, marketing, editorial, Admin, DevTools, and `/hitoDS`
  surfaces.
- A Garmin FIT result displays all non-null persisted observed facts separately from Plan vs Run:
  date, duration, distance, ascent/descent, average/max HR, average/max power, cadence, calories,
  and structured intervals.
- Plan vs Run compares only prescribed facts. Observed elevation and other unprescribed facts never
  appear as targets or differences.
- The original user-owned ZIP/FIT is privately retained in the named local acceptance identity for
  reprocessing; no QA cleanup may remove that record or raw source.

## Validation Expectations

1. Write Browser Path Preflight. Use one fresh managed loopback runtime and a supported local
   browser/control path. Do not request browser approval, use hosted data, or start a duplicate
   server.
2. On the retained local FIT acceptance identity, verify upload readback after refresh, raw-file
   availability/reprocessing, the exact observed elevation `+25 m / -33 m`, all other available
   fact rows, and Plan-vs-Run separation. Do not upload another copy, remove evidence, or use a
   destructive lifecycle.
3. At desktop and exact 375px in light and dark, inspect representative Calendar, Workout/Feedback,
   Progress, Settings, onboarding, and a modal heading. Prove Poppins UI title resolution,
   readable wrapping, focus semantics, and no page-level horizontal overflow.
4. Verify normal navigation, no browser console errors, focused static/runtime integrity, and the
   absence of provider/hosted access. Preserve the retained local evidence and stop only the managed
   runtime after proof.

## What Not To Touch

- Product source, schema, migrations, FIT parser/normalizer, persistence, raw-file removal policy,
  fixture source, authentication, providers, Calendar/Plans behavior, Design System source, Figma,
  dependencies, or lockfiles.
- The retained FIT acceptance identity, its raw asset, activity, metrics, comparison, or other
  derived evidence. Do not call a reset that deletes it.
- Hosted data, deployment, release, staging, commits, pushes, and unrelated dirty work.

## Exact Handoff Prompt

```text
ROLE: QA

Mode: Tracked
Validation layer: Independent local Global QA Acceptance for the post-change authenticated Product
review. It covers Poppins title adoption and the retained Garmin FIT observed-run flow only; it is
not hosted, deployment, production, or release acceptance.

Read AGENTS.md, agents/qa.agent.md, skills/hito-qa-browser-regression/SKILL.md, and this canonical
item before work:
/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-10-authenticated-product-typography-and-fit-local-qa.md

Read the two completed implementation receipts and the prior accepted Calendar/Plans QA scope:
- docs/tasks/backlog/2026-08-10-authenticated-product-ui-title-adoption.md
- docs/tasks/backlog/2026-08-05-fit-backed-planned-workout-product-presentation.md
- docs/tasks/backlog/2026-08-10-runner-calendar-and-saved-plans-global-qa.md

Task: Independently validate the current local authenticated Product for the two changed contracts.
Do not implement fixes.

Required proof:
1. Write Browser Path Preflight. Start one fresh managed loopback runtime only when needed; use any
   supported non-prompting local browser/control surface. A platform permission dialog is a path
   failure: abandon it and pivot without asking Ivan. Do not use hosted data or a duplicate server.
2. Use the retained local `fit-product-acceptance@local.test` identity. Do not upload another file,
   remove the existing evidence, or invoke a reset that could delete it. After refresh, prove the
   private raw source is available/reprocessable, the observed facts include +25 m / -33 m
   elevation, and the other persisted values remain factual. Prove Plan vs Run contains only
   prescribed comparisons and does not relabel observed values as planned targets.
3. Inspect representative Calendar, Workout/Feedback, Progress, Settings, onboarding, and a modal
   heading on desktop and exact 375px in light/dark. Prove the authenticated heading hierarchy is
   Poppins UI while the in-scope layout, semantics, wrapping, focus, and page containment hold.
4. Prove normal navigation and empty browser-console errors. Run proportional current runtime/build
   integrity only as required by the tested artifact. Preserve provider isolation and do not claim
   that unchanged Calendar/Plans flows were rerun; cite the earlier accepted item as inherited
   evidence.

If every required check passes, mark this item completed with `Global QA Acceptance: Passed for the
bounded local post-change Product-review slice`. If a required check fails, leave it blocked with
the exact reproduction and first incorrect owner. Keep commentary visible to Ivan in Russian. Write
the canonical item update, final formal receipt, and validation table in English. Do not edit source,
schema, fixtures, dependencies, retained FIT evidence, hosted state, or Git lifecycle.
```

## Global QA Acceptance Receipt — 2026-08-10

- **Role:** QA
- **Role file:** `agents/qa.agent.md`
- **Skills used:** `skills/hito-qa-browser-regression/SKILL.md`,
  `skills/hito-backend-supabase-contract/SKILL.md`, and the installed Supabase safety skill
- **Validation layer:** Independent local Global QA Acceptance for the bounded authenticated
  typography and retained FIT Product-review slice
- **Implementation DoD:** Accepted from the two completed owner receipts; not reclassified as or
  substituted for this independent QA gate
- **Global QA Acceptance:** Passed for the bounded local post-change Product-review slice
- **Subagents:** None. This browser/runtime replay remained a single bounded QA workstream.

### Browser Path Preflight

QA found no healthy managed server to reuse, started exactly one canonical `qa_fixture` runtime on
`http://127.0.0.1:3000`, and verified that it was managed, compatible, healthy, loopback-bound, and
fresh against the current checkout. The retained `fit-product-acceptance@local.test` identity was
used for FIT, Calendar, Workout/Feedback, Progress, Settings, and modal proof. The existing
`qa-baseline@local.test` no-plan identity was used only to expose onboarding without resetting or
mutating the retained FIT profile. Browser proof used the non-prompting in-app browser at
1280x720 and exact 375x812, in light and dark themes. The original dark preference and retained FIT
session were restored before browser teardown. No platform approval dialog, duplicate server,
hosted data, upload, raw-source removal, or fixture reset was used.

### Validation inventory

| Check                             | Scenario / environment                                                            | Result              | Evidence                                                                                                                                                                                                                                                                 |
| --------------------------------- | --------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Fresh managed runtime             | Canonical `qa_fixture` lifecycle, `127.0.0.1:3000`                                | Passed              | PID 7916 was managed, compatible, loopback-bound, healthy, and `artifactFreshness: fresh`; the server was stopped cleanly after proof.                                                                                                                                   |
| Unauthenticated boundary          | Fresh local browser session after retained-profile sign-out                       | Passed              | The public login surface rendered before local authentication; no Product data was exposed.                                                                                                                                                                              |
| Retained authentication           | `fit-product-acceptance@local.test` through ordinary local login and refresh      | Passed              | Calendar and the FIT-backed Workout/Feedback flow rendered the retained runner identity and result. The session was restored after the bounded onboarding cross-check.                                                                                                   |
| Retained row inventory            | Local Supabase `http://127.0.0.1:54321`, read-only inventory                      | Passed              | Final counts remained 1 profile, 2 plan cycles, 55 planned workouts, 1 log, 1 asset, 1 actual-metrics row, 1 comparison, 2 evidence revisions, 1 match, 1 activity revision, 1 source revision, 1 source, and 1 activity; no leases.                                     |
| Private raw source                | Read-only source revision and private-storage download                            | Passed              | `raw_state: available`, revision 1, `garmin_zip`, private bucket/path present, 80,050 bytes persisted and downloaded, `garmin_fit_activity_v1`, and expected capability keys. No filename/path or service credential was recorded in the receipt.                        |
| Observed FIT facts                | Refreshed Workout/Feedback Product readback plus persisted metrics                | Passed              | Jul 30, 45.16 min, 5.11 km, +25 m / -33 m, 134/145 bpm, 262/371 W, 69 spm, 454 calories, and 3 intervals agreed between browser and local persisted readback.                                                                                                            |
| FIT linkage                       | Read-only local asset, source, activity, match, metrics, and comparison joins     | Passed              | Asset-to-workout, metrics-to-asset, comparison-to-metrics, match-to-workout/source revision, current source revision, and source-to-activity links all resolved true.                                                                                                    |
| Plan vs Run separation            | Rendered comparison and persisted `difference_payload`                            | Passed              | Only `activity_type`, `date_alignment`, `duration`, `distance`, and `structured_step_count` were compared. Distance remained `No target`/`Not compared`; elevation, HR, power, cadence, and calories were not relabelled as planned targets.                             |
| Calendar typography               | Desktop light; exact 375px light and dark                                         | Passed              | `August 2026` resolved to Poppins through the UI section-title role; wrapping remained readable and document/body widths equalled the viewport.                                                                                                                          |
| Workout/Feedback typography       | Desktop dark; exact 375px light                                                   | Passed              | `Easy Run`, comparison section titles, `Observed run`, and `Plan vs run` resolved to Poppins with preserved H1/H2/H3 semantics and contained wrapping.                                                                                                                   |
| Progress typography               | Desktop light; exact 375px dark                                                   | Passed              | `Activity history` remained an H1 using `hito-ui-page-title`; the retained Jul 30 activity rendered and page widths matched the viewport.                                                                                                                                |
| Settings typography               | Desktop dark; exact 375px dark                                                    | Passed              | The page and section hierarchy resolved to Poppins UI roles. The 375px page remained contained and the long title wrapped without clipping.                                                                                                                              |
| Onboarding typography             | Existing no-plan local identity, desktop and exact 375px dark                     | Passed              | `Choose how to start your plan.` remained an H1 using `hito-ui-page-title`, resolved to Poppins, wrapped readably, and remained within 1280px/375px page bounds. No profile or plan data was changed.                                                                    |
| Modal typography and focus        | Body Notes, desktop dark and exact 375px light                                    | Passed              | `Body notes` remained an H2 using the UI modal/dialog title role. Opening placed focus on an in-dialog control; Escape closed the dialog. Both dialog bounds stayed inside the viewport.                                                                                 |
| Page containment                  | All listed desktop and exact 375px routes                                         | Passed              | Every measured root/body width equalled `innerWidth`; no page-level horizontal overflow was observed.                                                                                                                                                                    |
| Navigation and console            | Calendar -> Workout/Feedback -> Settings -> Progress -> Calendar, plus onboarding | Passed              | Normal route controls completed the flow; browser error logs were empty before and after the bounded identity switch.                                                                                                                                                    |
| Provider and hosted isolation     | Runtime events since the fresh server start                                       | Passed              | 42 current-run events contained zero provider events and zero failures. Runtime provider mode was `qa_fixture`; browser and database origins remained loopback-only.                                                                                                     |
| Focused Product contract          | `npm run validate-product-contracts`                                              | Passed              | Heart-rate guidance editor proof and Workout comparison readback contract both passed.                                                                                                                                                                                   |
| Typography source containment     | Current authenticated runner Product source search                                | Passed              | Zero legacy `hito-page/modal/section/panel-title` or direct `font-display` references remained in the authenticated runner Product scope. Remaining matches were only the explicitly excluded editorial/public/Admin/login/hub surfaces.                                 |
| Build/runtime integrity           | Fresh managed build plus `validate-build-output-integrity.mjs`                    | Passed              | The tested local artifact passed with 209 MJS files and 3,051 relative MJS imports; standard pre-existing build warnings were non-gating. The canonical receipt update occurred after this proof and intentionally made the reusable Admin repo-snapshot artifact stale. |
| Preservation                      | Before/after source hashes, retained inventory, and final browser state           | Passed              | Tested Product source hashes were unchanged, retained FIT counts/facts stayed stable, the browser ended on the retained identity in dark theme, and only the managed runtime was stopped.                                                                                |
| Inherited Calendar/Plans evidence | Prior accepted local Global QA item                                               | Accepted, not rerun | The unchanged Calendar/Plans mutation flows remain covered by `2026-08-10-runner-calendar-and-saved-plans-global-qa.md`; this receipt does not claim a replay.                                                                                                           |

### Saved evidence

Browser screenshots are stored under
`qa-artifacts/screenshots/2026-08-10/authenticated-product-typography-and-fit-local-qa/`.
The set contains 16 desktop/mobile captures covering the FIT observed rows, Plan vs Run rows,
Calendar, Progress, Settings, onboarding, and the Body Notes modal in the tested light/dark matrix.

### Issues and coverage gaps

- No Product defect was found in this bounded acceptance slice.
- An actual reprocess mutation was not invoked because the assignment prohibited mutation of the
  retained FIT evidence. Reprocess readiness is supported by `raw_state: available`, successful
  private-source download, the retained normalizer version, and source capabilities; this receipt
  does not claim that a new reprocessing execution was performed.
- Unchanged Calendar/Plans mutation flows were not rerun. Their prior accepted local QA receipt is
  inherited evidence, so no new regression claim is made for that unchanged slice.
- Public/editorial, Admin, DevTools, and `/hitoDS` surfaces were not browser-swept. Source inspection
  confirmed their retained legacy typography references remain outside the authenticated Product
  migration; their browser behavior is outside this acceptance claim.
- Hosted, deployment, production, release, Safari/cross-browser, and paid-provider checks were not
  run. This verdict has no coverage beyond the local loopback Product-review slice.
- Focus return to the original modal trigger after Escape was not asserted. Initial in-dialog focus,
  Escape dismissal, semantics, and containment were proven; no stronger trigger-restoration claim
  is made.
- After the managed runtime was stopped, this canonical receipt changed the repository-document
  digest embedded in the built Admin snapshot. Final server status is therefore stopped with the
  reusable artifact stale/broken for the post-receipt checkout. The exact tested artifact was fresh
  and passed integrity immediately before this documentation-only lifecycle update; Product source
  hashes remained unchanged. No second runtime or rebuild was started, so this receipt does not
  claim that the post-receipt documentation snapshot is build-current.

### Verdict

**Verdict: Passed**

**Global QA Acceptance: Passed for the bounded local post-change Product-review slice.**
