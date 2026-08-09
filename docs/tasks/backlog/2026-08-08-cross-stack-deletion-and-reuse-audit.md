# Cross-Stack Deletion, Reuse, And Scalability Audit

## Work Item ID

2026-08-08-cross-stack-deletion-and-reuse-audit

## Status

in_progress

## Type

plan

## Priority

high

## Owner

backend

## Scope

cross-stack-simplification

## Batch

hito-scalability-unification

## Archive Intent

retain_in_place

## Task

Find evidence-backed deletion, reuse, consolidation, and ownership improvements across Backend and
Frontend Product source, then select one coherent next cleanup batch that makes Hito easier to
change and scale without weakening security, product truth, or validation.

## Stage

BACKEND canonical persisted-preference correction is completed. DESIGN SYSTEM Rank 4 remains the
next admitted cross-owner boundary and was not started inside this Backend batch.

## Next Recommended Role

design-system

## Exact Handoff Prompt

```text
ROLE: DESIGN SYSTEM

Task:
Retire the legacy `ui/button.tsx` Button/CVA compatibility API after migrating its exact Calendar
and date-time-input consumers to the existing Hito control contract.

Canonical work item:
docs/tasks/backlog/2026-08-08-cross-stack-deletion-and-reuse-audit.md

Stage:
DESIGN SYSTEM Rank 4 compatibility retirement with independent interaction review.

Required outcome:
- Preserve DayPicker navigation/day-button semantics, keyboard/focus behavior, disabled/range states,
  and approved desktop/375px light/dark presentation.
- Delete the legacy Button exports, variants, and compatibility prop once consumer reachability is
  zero.
- Add no replacement compatibility API or route-local control primitive.
- Keep this parent in_progress and record one compact owner receipt.

Boundaries:
Do not change Product behavior, Backend contracts, persistence, auth, providers, hosted state, or
completed Backend/Design System batches.

Definition of Done:
The exact legacy API has zero consumers and is removed; focused Design System validation, date-picker
interaction/browser proof, build/integrity, diff hygiene, and independent review pass.

Approval policy:
Routine local inspection, implementation, fixture/browser QA, and validation proceed under standing
authorization. Do not stage, commit, push, deploy, mutate hosted state, or request routine approval.
```

## Issue Category

research

## Severity

high

## Human Priority

now

## Reported

2026-08-08

## User Report

The product still feels too expensive to change. The user wants Architect, Backend, and Frontend to
find what can be deleted, reused, unified, or simplified so the product can scale without another
large speculative rewrite.

## Evidence

- The completed
  [Hito Stack Complexity Reduction Program](2026-08-04-hito-stack-complexity-reduction-program.md)
  closed its admitted Slices 8A-8H and must not be reopened as unfinished work.
- Current documentation names separate blocked or unavailable boundaries: hosted Admin readback and
  Global QA, FIT-backed Product presentation, Local Inspector evidence, Gate 5 streams, and provider
  sync.
- The operational backlog contains lifecycle drift, including an `in_progress` Admin Capture parent
  after released Backend children changed the current truth.
- The primary checkout is clean on `main@a236b60f1dadee25e91e95cb8840af4a886d6298`.
- No current source artifact yet proves which new paths are safe deletion or consolidation
  candidates. File size and user frustration are audit inputs, not deletion proof.

## Observed Behavior

Small changes often require expensive source discovery and broad proof reconciliation. Existing
cleanup receipts do not establish that the current codebase has no remaining mixed
responsibilities, dead consumers, duplicate validators, route-local UI drift, or stale compatibility
paths.

## Expected Behavior

One Architect-owned audit integrates Backend and Frontend evidence into a prioritized map of safe
deletion/reuse candidates, retained intentional complexity, and one bounded next cleanup batch.

## Source Investigation

The completed complexity parent, current system/product/state documents, Developer Velocity item,
functional map, and nonterminal backlog inventory were inspected before dispatch. They prove a
completed prior cleanup program plus separate unfinished capability/evidence gates; they do not yet
prove a new cleanup implementation target.

## Likely Root Cause

Established: the retained framework stack is not the demonstrated cause. Source reachability shows
that the apparent size is largely active lifecycle, persistence, auth, FIT, Admin, generated-output,
and proof ownership. Product reuse is already centralized at its shared setup, calendar,
workout-document, DTO, and Design System seams. The remaining avoidable cost is dormant or
unregistered tooling proof plus separate operational lifecycle reconciliation; it is not a reason to
add a framework, state layer, service split, registry, or compatibility path.

## Recommended Fix Direction

Retire only a proof path after its present reachability and protection value are reconciled. Leave
runtime/Product/DS contracts and active evidence gates with their current owners.

## What Not To Touch

- Do not reopen Slices 8A-8H or replace the retained stack without new evidence.
- Do not weaken auth, RLS, admin isolation, persistence, FIT/provider lifecycle, review/confirm,
  build integrity, or Global QA requirements for lower line count.
- Do not delete migrations, generated artifacts with current consumers, canonical fixtures,
  historical evidence, or blocked capability records merely because they are large or old.
- Do not implement cross-owner changes or create another plan, registry, runtime, or cleanup branch.

## Validation Expectations

- Every candidate has consumer evidence, canonical owner, replacement, risk/security classification,
  and required proof.
- Hotspots are classified by responsibility and reachability rather than line count alone.
- Backend and Frontend Product reviews are integrated and closed.
- Findings are separated into next batch, later backlog, and retain/do-not-touch.
- Exactly one next batch has expected net simplification and proportionate validation.

## Reopened Product Decision

The prior receipt remains valid only as an immediate-safe-deletion scan. Product rejected it as the
requested scalability result because an active consumer was treated as a retain decision instead of
a migration requirement. The reopened audit must find consolidation paths that first move consumers
to an existing canonical owner and then delete the superseded implementation. The prepared Backend
micro-batch was never dispatched and is superseded by this broader architecture pass.

## Historical Immediate-Safe-Deletion Receipt

Baseline: `main@a236b60f1dadee25e91e95cb8840af4a886d6298`. Backend and Frontend Product conducted
bounded read-only reviews; Architect checked the route/owner map, package scripts, validator
manifest, generated-consumer seams, current documents, and the nonterminal backlog boundaries.

| Classification   | Candidate or boundary                                                                                                                    | Evidence and retained owner                                                                                                                                                   | Disposition                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Next batch       | `scripts/validate-artifact-hygiene.mjs`                                                                                                  | It has no package, manifest, source, documentation, policy, or skill consumer. The package-reachable `npm run artifact:hygiene` reporter continues to own its helper modules. | One Backend tooling batch below.                                          |
| Later evidence   | Manual Admin triage literals versus Markdown mirror lifecycle literals                                                                   | Both are live, but their statuses and roles differ; unification needs a Product/Architecture contract decision.                                                               | Retain separate contracts.                                                |
| Later governance | Operational lifecycle/current-document drift                                                                                             | The backlog remains the only queue; stale status claims are a documentation-owner concern, not runtime cleanup.                                                               | Reconcile only from accepted receipts and without changing active owners. |
| Retain           | Product setup, calendar, workout-document, Progress DTO/view-model, and Hito DS reuse seams                                              | All audited Product modules have inbound consumers. Their apparently similar inputs adapt different review, visibility, persistence, or interaction contracts.                | No Product deletion or consolidation batch is admitted.                   |
| Retain           | Admin mirror, Runner Activity Gates 1-4, generated Supabase/DS output, migrations, managed QA/build lifecycle, active Backend validators | Each has active routes, build/package consumers, direct typed consumers, or required security/lifecycle proof.                                                                | Do not split, delete, or rewrite by file size.                            |
| Out of cleanup   | Hosted Admin readback and Global QA; FIT Product browser evidence; Local Inspector evidence; Gate 5 streams/provider sync                | These are separately blocked, active, or deliberately unavailable capability boundaries.                                                                                      | No acceptance or cleanup claim.                                           |

No unused package, second framework, duplicate Product metric truth, or safe Backend runtime deletion
was proven. The retained React/TanStack Start/Vite/Nitro/Vercel/Supabase stack remains the canonical
single application stack.

## Historical Selected Boundary (Superseded)

This was the earlier zero-consumer selection. It is not the current execution boundary: the live
working tree now carries its deletion and a separate untracked retirement work item, both of which
remain outside this audit and are preserved unchanged.

**Owner:** Backend (tooling)
**Status:** ready to dispatch, not dispatched by this audit
**Risk class:** low, isolated executable-proof retirement; no runtime, API, data, or product change.

Retire `scripts/validate-artifact-hygiene.mjs` only. It is a 244-line synthetic contract validator
with zero external reachability and is absent from `package.json` and the Backend validation manifest.
Keep `npm run artifact:hygiene`, `scripts/report-local-artifact-hygiene.mjs`, and the
`scripts/artifact-hygiene/*` implementation package unchanged: they remain the reachable local
reporting/retention owner.

Expected simplification: one dormant executable proof path and its maintenance surface disappear;
no replacement abstraction is added. Before deletion, Backend must classify every assertion in the
validator as either covered by an active reachable contract or deliberately retired as non-required
historical test coverage. Required proof is exact consumer/configuration scans, that assertion
disposition, a non-mutating artifact-reporter invocation, `npm run validate:backend -- --list`, scoped
diff hygiene, and independent owner-level review. Stop without deleting if any assertion remains a
required release, security, evidence-retention, or QA guard, or if a live procedure depends on it.

Implementation DoD for the future slice: the file alone is removed, all retained reporter/package
consumers still resolve, the validator manifest remains truthful, and the assertion disposition plus
independent review prove that no required proof was silently weakened. Global QA Acceptance remains
unchanged and is not part of this slice.

## Revised Maximum-Reuse Portfolio (Current)

**Status:** `in_progress`. Ranks 1-3 are completed at their owner scopes; Rank 4 is the next admitted
batch. This receipt supersedes the historical zero-consumer selection as the current
execution order; it does not reopen a released cleanup slice or accept an unreviewed workspace
deletion.

### Quantified Baseline And Method

All source conclusions use Git objects at `main@a236b60f1dadee25e91e95cb8840af4a886d6298`, not the
dirty working tree. That tree contains 338 tracked TypeScript/TSX/CSS source files (113,823 lines),
88 tracked script files (45,194 lines), and 38 package entrypoints. File size prioritized review but
did not admit a candidate on its own.

The reopened audit proved the missing filter: an active consumer requires a bounded migration; it is
not evidence that the current owner or duplicate implementation is necessary. The retained
React/TanStack Start/Vite/Nitro/Vercel/Supabase stack remains justified. No framework migration,
service split, state manager, registry, compatibility layer, or test system is admitted.

### Ranked Migration-And-Deletion Portfolio

| Rank                | Current responsibility and consumers                                                                                                                                                                                                                                                                                                                                       | Canonical seam and bounded migration                                                                                                                                                                                         | Obsolete maintenance surface and expected reduction                                                                                                                                                                                                                                                                 | Risk, proof, and stop condition                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 — **first batch** | `src/styles/foundations.css` holds twelve workout bases and 132 raw shade declarations in a 304-line palette block. `src/lib/workout-color-tokens.ts` exposes the raw shade API; its sole external consumer is the primitive-ramp tab in `reference-foundations-page.tsx`. Product, Calendar, Manual Workout, and timeline use only semantic type/section color functions. | **DESIGN SYSTEM:** retain the twelve bases and `workoutTypeColorVar` / `workoutSectionColorVar`. Replace the raw-ramp tab with the existing semantic role reference, preserving equivalent semantic computed colors.         | Delete the 132 raw shade declarations, raw shade types/families/helpers, and Foundations-only primitive-ramp presentation. Net: more than 300 CSS lines plus one raw API/reference concept removed; no new runtime API or manifest token.                                                                           | Medium visual-contract risk. Compare semantic computed colors before/after; prove no old shade consumers; run DS validator and manifest parity; verify Foundations, Calendar, Manual Workout, and timeline at desktop/375px in light/dark; obtain independent review. Stop if raw ramps are an approved DS reference contract, any semantic output changes, or a Product/generated-manifest contract is required.                     |
| 2                   | The five live Manual Workout mutation paths repeat `asJsonRecord`, `toJson`, and strict client-payload rejection helpers. The equal helpers occur in add, delete/clear, copy, edit, and move flows.                                                                                                                                                                        | **BACKEND:** use existing `manual-workout-authoring/persistence.ts` for JSON conversion/record reading and `schema.ts` for strict-input classification; migrate all current mutation consumers to those owners.              | Delete 11 local helper copies. Expected net: about 35–45 LOC and three duplicate responsibilities removed after small exports/imports.                                                                                                                                                                              | Medium persistence/review-contract risk. Prove metadata, RPC/review payloads, and client-payload rejection reason/message stay byte-equivalent; run manual-workout validator and disposable persistence proof; obtain independent Backend review. Stop on an import cycle or changed review token, persistence shape, or rejection result.                                                                                            |
| 3                   | `clean-build-output.mjs` and `finalize-build-output.mjs` each implement the same generated-sibling conflict canonicalization; the resolver block is byte-identical and neighboring naming/removal rules overlap.                                                                                                                                                           | **BACKEND:** migrate both scripts to the existing `scripts/lib/qa-runtime-paths.mjs` owner, which already has nine consumers for QA build-path truth.                                                                        | Delete the duplicate resolver and associated local naming/removal branches. Expected net: at least 50 duplicate LOC and three local interpretations become one.                                                                                                                                                     | Medium build-integrity risk. Prove the shared recognizer preserves root-bounded removal and artifact discovery; run the relevant existing build/finalizer/integrity checks and independent review. Stop if a safe-removal or artifact-discovery difference cannot be represented by the existing seam.                                                                                                                                |
| 4                   | `ui/button.tsx` retains a 53-line legacy CVA `Button` / `buttonVariants` API solely for `ui/calendar.tsx`; `hito-date-time-input.tsx` is its sole caller via `buttonVariant`. `class-variance-authority` remains live for Sheet.                                                                                                                                           | **DESIGN SYSTEM:** migrate Calendar navigation/day-button and the date-time input to the existing Hito button/control contract.                                                                                              | Delete legacy Button exports, variants, compatibility prop, and Calendar-only handoff. Net: one public compatibility API and roughly 50 local lines removed; no package removal claimed.                                                                                                                            | Medium interaction/accessibility risk. Prove the exact consumer set; run DS checks and focused date-picker keyboard/focus, disabled, range, desktop/375px light/dark browser proof. Stop if Hito control semantics cannot preserve DayPicker behavior without a new compatibility API.                                                                                                                                                |
| 5 — held            | `CompletionPanel.tsx:618-1513` mixes manual result logging with Feedback invitation, upload/remove lifecycle, fixture branch, and factual comparison/AI readback. `WorkoutActivityFileDialog` imports its panel back from this general component; the workout route has two public feedback entrypoints.                                                                   | **FRONTEND — Product:** move Feedback presentation/lifecycle ownership into the existing `workout-completion/` seam, which already owns body note, dialog presentation, comparison and AI readback, and feedback formatting. | Delete `WorkoutFeedbackPanel`, `LogResultFeedbackBridge`, feedback helpers/imports, and the inverse dialog import from `CompletionPanel` after all consumers migrate. `CompletionPanel` should return to manual result logging; the audit does not claim a net repository-LOC total for a behavior-preserving move. | High FIT lifecycle risk. Require Product contract validation, source ownership assertions, production build, focused Feedback and Complete-to-Feedback browser checks, and independent Product/QA review. Hold until the required browser evidence can cover native attachment honestly. Stop on any API/provider/FIT semantic change, duplicate upload state, fixture-as-truth, or substitution for blocked native attachment proof. |
| 6                   | Authenticated Product retains 55 legacy title-role uses across 28 paths (page 12, modal 17, section 21, panel 5) and at least seven raw `font-display` recipes. Existing canonical UI title roles have no Product consumer.                                                                                                                                                | **FRONTEND — Product:** adopt existing `hito-ui-page/modal/section/panel-title` roles and preserve declared custom/sans geometry where applicable.                                                                           | Remove 55 Product compatibility dependencies and route-local typography recipes. Editorial roles remain live in Hub, Changelog, and DS, so neither their deletion nor a net CSS reduction is claimed.                                                                                                               | Medium visual/Product risk. Require source migration proof plus route browser proof at desktop/375px; avoid active FIT-owned `CompletionPanel` hunks. Stop if a custom geometry requires a new semantic role or changes the approved title hierarchy.                                                                                                                                                                                 |

### First Batch Implementation Receipt (2026-08-08)

**Owner:** DESIGN SYSTEM  
**Baseline:** `main@a236b60f1dadee25e91e95cb8840af4a886d6298`  
**Lifecycle:** owner-scoped implementation completed; parent remains `in_progress`  
**Risk class:** medium, visual semantic-token consolidation

The root-cause discriminator found twelve required workout-domain bases plus 132 numeric shade
declarations. Source reachability found no Product consumer of the raw shade CSS or TypeScript API;
the only external raw-API consumer was the Foundations primitive-ramp specimen. Calendar, Manual
Workout, timeline, training, and other reference surfaces already consumed the semantic
`workoutTypeColorVar` / `workoutSectionColorVar` contract.

The batch retained the twelve bases and all semantic type/section role names and slots. It deleted
the 132 numeric shade declarations, raw shade and palette types, palette-family metadata, primitive
token/var helpers, primitive mappings, and the Foundations raw-ramp specimen. Foundations now shows
the generated global primitive manifest separately from workout semantic roles. A deterministic DS
validator rejects any restored numeric shade, raw TypeScript API, or raw-ramp reference marker while
also requiring the twelve bases and semantic helpers. No Product API, package, generated manifest,
domain meaning, persistence, or runtime lifecycle changed.

Task-owned source delta: 161 insertions and 464 deletions across four files, net `-303` lines. The
insertions are semantic rewiring, concise reference copy, and retirement assertions rather than a
replacement abstraction.

Validation receipt:

- `npm run validate-hito-ds-components` passed with `retiredWorkoutShades: 0` and
  `workoutDomainBases: 12`.
- `node --import tsx scripts/generate-hito-ds-manifest.mjs --check` passed with the manifest still at
  38 primitive colors, 29 semantic colors, and 18 text styles; workout domain colors remain excluded.
- Targeted ESLint, Prettier, source reachability, raw-marker retirement, scoped `git diff --check`,
  fresh production build, managed build-integrity freshness, and loopback runtime health passed.
- Pre/post computed-style captures matched for every rendered workout type/section semantic slot in
  both light and dark themes.
- `/hitoDS/foundations`, Calendar, Manual Workout draft anatomy, and workout timeline passed at
  `1470x801` and exact `375x812`, light and dark, without page/dialog overflow. The Manual Workout
  draft was closed without save or review confirmation.
- The deterministic local design profile was converged through the existing local-only fixture seam;
  its plain status check passed with 55 planned workouts and zero workout logs or result rows.
- Independent read-only Design System review confirmed the source boundary, semantic parity,
  browser matrix, and absence of retained raw-path reach.

One exploratory Product fixture runtime verifier outside this DS contract encountered a pre-existing
missing `progress.interpretation` shape. It is not counted as a passing check and does not alter this
owner-scoped result: the plain fixture status, required DS validators, Product browser routes, build,
and runtime health all passed. Progress fixture-runtime compatibility remains outside this batch.

At Rank 1 closure, `scripts/validate-artifact-hygiene.mjs` and its untracked retirement item remained
outside that batch pending the Backend script audit; the current Backend receipt below records their
subsequent retirement. No staging, commit, push, deployment, hosted mutation, or provider call
occurred. One attempted metadata `--help` check exposed that the existing importer defaulted to a
live upsert: because `.env.local` is loopback-only, it reconciled only the local Admin mirror (three
repo-derived rows created, 226 refreshed, and manual rows unchanged at zero). Markdown remained
canonical, no hosted state was reached, and the subsequent parser-only metadata check passed without
mutation. `Implementation DoD: Passed` for Rank 1. `Global QA Acceptance: Pending`.

### Backend Script Retirement And Rank 3 Receipt (2026-08-09)

| Boundary                             | Disposition                                                                             |                                              Task-start → final | Retained owner and proof                                                                                                                                                                              |
| ------------------------------------ | --------------------------------------------------------------------------------------- | --------------------------------------------------------------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Production/tooling source and config | Deleted dormant local plan importer; reduced importer CLI and duplicated build resolver |                                    2,679 → 2,185 lines (`-494`) | Reviewed Product import owns `training-plan-v2`; `qa-runtime-paths.mjs` owns pure sibling classification; CLI requires explicit dry-run/live and returns before context/sync on help or invalid input |
| Proof source                         | Deleted zero-value Product wrapper and removed synthetic importer DI/spy case family    |                                     2,380 → 2,289 lines (`-91`) | Package directly chains both Product proofs; Admin validator remains canonical; Manual Workout proofs and semantics are unchanged                                                                     |
| Documentation                        | Removed the separate artifact-retirement item and compacted this parent                 |                                        534 → 351 lines (`-183`) | This parent preserves the zero-consumer retirement fact and remains `in_progress`                                                                                                                     |
| Total task-owned changed set         | Net-negative                                                                            |                                    5,593 → 4,825 lines (`-768`) | No new file, command, framework, dependency, adapter, fixture, registry, or proof family                                                                                                              |
| Tracked `scripts/**` corpus          | Three whole paths retired                                                               | 90 files / 45,484 lines → 87 / 45,001 (`-3` / `-483` vs `HEAD`) | Current-task materialized start was 89 / 45,585; final is 87 / 45,001 (`-2` / `-584`)                                                                                                                 |
| Retention                            | Retained all other scripts                                                              |                                   87 / 87 final paths reachable | Package, Backend manifest, Vite/runtime/generated roots, nested imports, and current procedures account for every retained path; independent read-only review passed                                  |

`validate-artifact-hygiene.mjs`, `import-current-plan.mjs`, and
`validate-product-contracts.ts` are retired. Direct credential-free importer subprocesses, the full
Backend source suite, retained Product proofs, artifact reporter help, production build/finalizer,
build integrity, formatting, diff hygiene, and final reachability are the closure inventory. No
hosted credential, live import, provider call, schema/migration change, staging, commit, push, or
deployment occurred. `Implementation DoD: Passed`; `Global QA Acceptance: Pending`.

### Backend Persisted Preference Decoding Receipt (2026-08-09)

- **Owner and reduction:** `runner-training-preferences.ts` solely owns canonical stored
  normalization; `training-api.ts` retains snapshot assembly and authored-frequency derivation.
  Four duplicate readers were deleted, and the three-file tracked-code scope moved from 1,469 to
  1,429 lines (`+42 / -82`, net `-40`), including zero validator growth.
- **Canonical-only contract:** persisted preferences accept snake_case fields and exact canonical
  weekday values only. Speculative camelCase storage, abbreviations, alternate casing, and partial
  malformed recovery were removed with their 94 proof lines; strict Settings saves remain unchanged.
- **Proof:** the loopback inventory found zero non-canonical rows, so no cleanup was required. Focused
  schedule/export checks, the 14-check Backend suite, authenticated snapshot digest, disposable local
  persistence/RLS cleanup, production build/integrity, formatting, diff hygiene, and independent
  read-only review passed. No hosted access, new file, helper, proof case, API, schema, migration, or
  compatibility layer occurred. This parent remains `in_progress`; Rank 4 was not started.

### Intentional Complexity, Evidence Holds, And Exclusions

| Classification          | Boundary                                                                                                                                         | Evidence-backed disposition                                                                                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Retain                  | `/hitoDS` Typography Inspector picker and its DevTools imports                                                                                   | The accepted typography provenance contract requires this real Inspector consumer-proof specimen. It is intentional cross-surface proof, not accidental coupling; removal needs a replacement evidence decision.                  |
| Retain                  | TS and JSON Design System manifests; interactive reference and Figma export board                                                                | They share source digest but have distinct validator/downstream and capture/reference consumers. Combining them would remove a required contract rather than a duplicate.                                                         |
| Later cross-owner       | `.hito-shell-profile-trigger` quiet-surface compatibility selector                                                                               | Product `AppShell` and Admin `AdminWorkspaceNav` must both adopt `hito-surface-quiet` before the selector can be removed; it is not a same-owner first batch.                                                                     |
| Need new semantic proof | `training.ts` repeat/duration wrappers versus `workout-document` helpers                                                                         | Consumers are live, but `repeatChildSteps` deliberately returns an empty list for non-repeat structures while the document helper returns children. Do not collapse these paths until an equivalent call-site contract is proved. |
| Product/QA decision     | Legacy arbitrary-email `test-user` commands                                                                                                      | The named-pool lifecycle seam exists, but repair/migration documentation still retains the legacy commands. Their removal requires a Product/QA lifecycle decision, not an architectural inference.                               |
| Out of cleanup          | Admin authenticated hosted readback, Global QA, FIT native browser attachment, Gate 5 normalized streams/provider sync, Local Inspector evidence | These are security, capability, or acceptance boundaries. They remain independently blocked/unavailable and are not simplified or accepted here.                                                                                  |
| Retired Backend tooling | Dormant artifact validator, package-only local plan importer, and zero-value Product proof wrapper                                               | Their durable disposition is recorded in the Backend receipt above; no separate retirement item or replacement path remains.                                                                                                      |

### Closure

The maximum-reuse audit remains **in progress**, not completed: Ranks 1-3 have passed their
owner-scoped validation and independent review, and the persisted-preference decoding consolidation
has passed its Backend scope. Three admitted portfolio batches remain; Rank 4, the Design System
legacy Button compatibility retirement, is the next truthful boundary. No release, hosted
acceptance, or Global QA Acceptance is claimed.
