# Product History Digest

Status: active digest
Last Updated: 2026-06-20
Owner: ARCHITECT

## Purpose And Source Boundary

This digest is the compact narrative layer for Hito product evolution and major architecture
decisions. It exists so future agents can understand why current seams exist without reading every
archived execution prompt.

This digest is not:

- the shipped-history source for `/changelog`; that remains [changelog](./changelog.md)
- the implemented-behavior source; that remains [current product](../current-product.md) and
  [current system](../current-system.md)
- an active execution plan or backlog
- a QA artifact inventory
- a log or screenshot retention policy

Use this file for orientation. Use current docs for current truth, active plans for next work, and
archived plans for detailed historical evidence.

## Current Truth Sources

- [Current product](../current-product.md) owns runner-facing implemented behavior.
- [Current system](../current-system.md) owns implemented architecture and runtime owners.
- [Current state](../current-state.md) owns the current project snapshot and next recommended work.
- [Current functional map](../current-functional-map.md) owns business-flow cleanup and source
  hierarchy.
- [Changelog](./changelog.md) owns dated shipped-history entries.
- [Hito Docs and Artifact Compression](../plans/active/2026-06-20-hito-docs-and-artifact-compression.md)
  owns the current docs/artifact compression track.

## Evolution Timeline

### 2026-05-05 To 2026-05-12: Baseline Import And Saved-Mode Foundation

- Hito started from an imported TanStack Start baseline and preserved the route/component shape while
  turning preview mode into an honest non-persisted path.
- Supabase-backed saved mode became the canonical persisted truth for runner profiles, active plan
  cycles, planned workouts, workout logs, and later feedback/evidence seams.
- Early Supabase storage planning separated raw imported JSON/provenance from trusted user-visible
  plan truth. Current runtime plan truth is `plan_cycles` plus `planned_workouts`; richer
  import-batch provenance remains historical/deferred unless current docs and source say otherwise.
- Advanced JSON import and `training-plan-v2` became the durable plan artifact contract, with
  preview/readback compatibility preserved where needed.
- Early product cleanup reduced fake dashboard or analytics claims and kept integrations/status
  surfaces honest until real provider evidence existed.
- Early architecture cleanup intentionally demoted split truth such as local saved fallbacks,
  preview-derived saved bootstrap, legacy `week_1_preview[]`, old Supabase env aliases, and
  co-equal JSON/structured authoring paths. The direction became Supabase-backed `training-plan-v2`
  and text-first saved-mode truth instead of multiple parallel plan sources.
- The original `training-plan-v2` template contract was not a generic JSON dump. It defined
  planned-structure-only truth, excluded runtime state, and normalized bounded segment/repeat
  structure into canonical planned-workout step data.
- Screenshot/OCR verdict planning was an early future evidence idea. It was later superseded by the
  live Garmin FIT/ZIP result-asset, actual-metrics, comparison, and bounded AI-insight pipeline; any
  screenshot/OCR revival should start from current Garmin/evidence truth rather than from the old
  archived plan.

### 2026-05-13 To 2026-05-22: Product Simplification, Auth, Feedback, And Entitlement Foundations

- The app shifted toward a login-first saved experience with local loopback bypass kept as a
  development-only unblock path.
- Workout detail and feedback grew from completion logging into Garmin FIT/ZIP evidence, deterministic
  comparison, and bounded AI interpretation readback.
- Longitudinal AI context settled on a backend-built, task-scoped `RunnerCoachContext` from
  canonical persisted truth and deterministic aggregates; it stayed downstream/proposal-first, not
  a persistent AI-memory subsystem or silent mutation authority.
- Basic/Pro entitlement foundations were added as backend-owned capability truth without shipping
  billing/pricing UI.
- AI-assisted active-plan refresh settled the same boundary: AI may propose remaining-schedule
  changes from saved history, but backend review/apply owns stale-proposal checks, protected history,
  and mutation safety.
- Active-plan schedule edit settled on backend preview/apply ownership: same-frequency edits could
  reflow deterministic schedule dates, frequency changes required regeneration, protected/logged
  history could not be silently rewritten, and profile defaults/OpenAI were not mutation authority.
- `Open plan` became the saved-mode management hub for lifecycle actions, import/export, and
  refresh review/apply while backend lifecycle and export payloads remained source-of-truth.
- Runner settings drew a hard line between runner-level defaults and active-plan truth: profile and
  training preferences may prefill future plans, but settings edits must not silently rewrite the
  current active plan.
- UI simplification and Hito DS work began moving route-local chrome toward shared primitives while
  keeping product behavior stable.
- Early DS normalization established that Hito was not redesigning by vibes; it was removing
  unowned custom UI, with documented exceptions for visualization geometry, internal `/hitoDS`
  chrome, and explicit shell-specific families.
- Text-first/OpenAI and start-date work were historical product pivots. The durable rule is that
  text, JSON, or voice-like inputs must end in validated canonical plan truth and backend apply
  safety before persistence; old text-first onboarding is not current UI truth by default.
- Garmin feedback work established deterministic-first evidence: AI interpretation is additive to
  canonical comparison truth, and calendar/home feedback markers are bounded discovery cues rather
  than verdicts or hidden mutation paths.
- Modal architecture work converged on a bounded Hito product-dialog recipe with stable internal
  scroll and footer reachability, not a broad overlay subsystem.
- Early full-product QA specs are historical baseline coverage only. Current docs, active plans,
  changelog, and protected QA artifacts own current validation truth.

### 2026-05-23 To 2026-06-01: Structured First Plan And AI Blueprint Wave

- Structured first-plan creation moved to review-before-confirm semantics: draft review is
  non-mutating, and confirm persists only the exact reviewed canonical plan.
- The AI first-plan direction pivoted away from full nested model-authored plans toward compact
  `ai-first-plan-blueprint-v1` coaching intent that backend validation expands into canonical
  `training-plan-v2`.
- Backend doctrine enforced metric truth, fixed rest days, recovery-first sequencing, family-specific
  cadence, long-horizon extension, run/walk adaptation, beginner/recreational intensity limits, and
  supported half/marathon specificity.
- `ai-first-plan-envelope-v1` remained non-live/internal. It was validated as a foundation but not
  adopted as production default.

Key archived evidence:

- [AI-authored first-plan pipeline](../plans/archive/2026-05-26-ai-authored-first-plan-pipeline.md)
- [Envelope production adoption and prompt simplification](../plans/archive/2026-06-01-ai-first-plan-envelope-production-adoption-and-prompt-simplification.md)

### 2026-06-06 To 2026-06-07: Plan Presets And No-Active-Plan Shortcuts

- Plan Presets shipped as no-active-plan discovery cards for `10K Foundation`, `Half Marathon
  Balanced`, and `Marathon Base`.
- The accepted runner-facing model became card discovery into selected running-plan preview/create,
  not a revived Plan Preset-owned create engine.
- Backend-owned preset card truth included eligibility, duration, date summaries, workout mix, metric
  honesty, and fit copy.
- Future preset families and active-plan replacement/refresh from presets were split into backlog
  rather than keeping the completed plan active.

Key archived evidence:

- [Plan Preset library and custom authoring escape hatch](../plans/archive/2026-06-06-first-plan-preset-library-and-custom-authoring-escape-hatch.md)

### 2026-06-09 To 2026-06-13: Manual Builder, Active-Plan Editing, Export, And Running-Plan Quality

- Manual user-built plans became a real saved active-plan source, with reviewed first create,
  existing-plan Add, personal templates, direct manual Copy/Paste, Delete/Clear review, direct Move,
  constructor UI, and JSON/Markdown export in the proved scope.
- Active-plan editing began converging on a shared calendar lifecycle: viewing is shared, mutation
  eligibility is backend-shaped and capability-driven.
- Running-plan quality work closed the flatness/prescription blocker across supported selected-plan
  families, separating backend composition truth from frontend display.
- Future-only boundaries stayed explicit: recurrence, universal Copy/Paste, Restore UI, broader
  generated-row mutation, QR/share/import, PDF/watch export, and runner-facing persisted content
  editing require separate gates.

Key current evidence:

- [Manual workout authoring plan](../plans/active/2026-06-09-manual-workout-authoring-and-user-built-plans.md)
- [Running plan creation engine rebuild](../plans/active/2026-06-08-running-plan-creation-engine-rebuild.md)

### 2026-06-15 To 2026-06-20: Hito DS, Test Calendar, And Core Stack Simplification

- `/hitoDS` became the canonical DS/specimen/Figma bridge owner, and `/test-calendar` was archived as
  a paused static sandbox after TC1/TC2 parity proof.
- The Hito Stack Simplification Strike moved from opportunistic proof extraction into a global
  business-flow teardown map.
- Cleanup removed stale compatibility facades, duplicate ops scripts, orphan components, local
  duplicate-space residue, old Plan Preset builder/review residue, stale backlog duplicates, and
  selected short-path runtime imports.
- The core cleanup ledger closed at `cleanup-burndown-v1 = 40/40`, `0 remaining`, `100%`.
- The next track became docs/history compression and artifact-retention strategy, not more runtime
  cleanup by momentum.

Key archived evidence:

- [Hito Stack Simplification Strike](../plans/archive/2026-06-07-hito-stack-simplification-strike.md)
- [Hito DS workout-library calendar/detail playground history](../plans/archive/2026-06-09-hito-ds-workout-library-calendar-detail-playground.md)

## Major Product Capability Tracks

### First-Plan Creation

Hito now has multiple accepted no-active-plan paths with distinct owners:

- structured Quick setup uses backend-reviewed draft/confirm through first-plan actions
- selected-distance plans preview and confirm through running-plan engine actions
- Plan Preset cards are discovery only and hand creation to selected-plan preview/create
- manual setup creates a `manual_user_built_plan_v1` active plan through manual authoring review
- advanced JSON import remains a secondary migration/testing fallback

### Active-Plan Calendar Lifecycle

The saved calendar is one viewing surface across active-plan sources, but mutation rights stay
backend-shaped:

- eligible Add/Clear/Move is capability-driven
- manual Copy/Paste and Move use accepted direct backend mutation in the proved manual scope
- Clear uses backend-shaped review/confirm
- protected/logged/evidence-backed rows remain blocked
- universal Copy/Paste and broader generated-row mutation remain future-only

### Running-Plan Quality And Metric Truth

The running-plan engine moved from technically valid plans toward runner-facing, coach-credible
plans:

- blueprint output must pass family-specific richness and prescription grammar gates
- benchmark-backed pace truth may produce pace targets where backend allows it
- personal HR targets remain blocked without personal HR-zone truth
- target time alone does not create pace truth
- no fake pace and no fake personal HR remain hard guardrails

### Future Provider And Physiology Boundaries

Provider and physiology backlog work remains deliberately future-scoped:

- Garmin FIT/ZIP upload is the current live evidence path; Polar/connected-provider sync should
  reuse the same provider-evidence pipeline rather than creating provider-specific feedback truth.
- Future provider sync must preserve raw provider evidence, normalize into canonical actual metrics,
  match conservatively to planned workouts, and reuse deterministic comparison before optional AI.
- Personal HR-zone/AeT work remains a separate runner-level physiology track. Age-estimated HR is
  advisory/readback-only, executable HR targets require real personal zone truth, and applying new
  zones to an active plan requires explicit review/confirm.
- PDF export, light/dark mode, and commercial Basic/Pro expansion are future backlog tracks; current
  docs and source own only the accepted JSON/Markdown export, dark-first UI, and pre-billing
  entitlement foundation.

### Admin, Backlog, And Work Dashboard

Admin work evolved into an internal operations surface:

- `/admin/analytics` and `/admin/capture` are admin-only surfaces
- repo-derived markdown mirrors into Admin Backlog through explicit importer scripts
- `docs/work-dashboard.md` is the side-pane work summary generated by `npm run work:dashboard*`
- live Admin sync remains explicit; no routine docs refresh should mutate Admin without intent

### Hito DS And Figma Bridge

Hito DS owns the internal component/specimen grammar:

- `/hitoDS` is the canonical DS/specimen owner
- `/hitoDS/export/figma` is the code-owned downstream bridge surface
- product runtime routes remain owners of real persisted behavior
- `/test-calendar` is archived static sandbox history unless a future plan reopens it
- Early Hito DS specs defined a small product-shaped visual contract and helped remove route-local
  drift, but old token/foundation details are now historical. Current DS truth lives in
  `src/styles.css`, `/hitoDS`, current docs, and the active Hito DS IA/specimen plan.
- Later DS/workbench specs accepted the internal workbench responsive shell, the static
  calendar/workout playground seam, and the input-owned Hito Date Picker interaction. Current truth
  lives in current docs, changelog, source, and `/hitoDS`; historical specs now preserve only compact
  boundaries such as specimen-only behavior, product-owned schedule truth, and known non-blocking QA
  gaps.
- Dropdown/list-item family work was absorbed into the canonical `/hitoDS` IA plan: shared
  `DropdownMenu`/`Select` wrappers remain the infrastructure, one Hito menu-row anatomy documents
  product/admin variants, and calendar specimen truth stays with `HitoCalendarDayCell` /
  `HitoWorkoutDayRow` rather than older section-specific specs.
- `/admin/capture` Backlog copy settled on calm internal admin wording: `Backlog`, `Add quick note`,
  `Copy prompt`, `Ready for Codex`, and manual handoff only. The admin Backlog mirrors repo markdown
  for discovery/prompt copy; it does not auto-dispatch Codex work or replace markdown truth.

### Voice And Text Authoring

- Voice-to-plan split into preserved backend transcript/text authoring truth and future raw-audio
  transport. Visible transcript/voice onboarding UI is not current accepted product truth.
- If voice returns, it should add one bounded audio-to-transcript input seam before the existing
  authoring path, not a realtime assistant, not a raw-audio-to-plan shortcut, and not an extra
  summarization pipeline.

## Major Architecture Decisions

- Backend owns validation, normalization, persistence, lifecycle rules, entitlement, mutation safety,
  metric truth, and audit metadata.
- Frontend owns interaction and rendering of backend-shaped truth, not local schedule/persistence
  authority.
- `training-plan-v2` and canonical Supabase rows remain the persisted plan shape; import/export
  compatibility must not become duplicate plan truth.
- AI may draft, enrich, explain, or propose within backend validation, but confirm/apply boundaries
  must persist deterministic canonical truth.
- Risky mutations require review/confirm or explicit direct mutation contracts with backend
  protection and audit metadata.
- Hito DS primitives are the UI contract; route-local UI should migrate toward shared primitives when
  a bounded QA-safe slice exists.
- Generated/proof/vendor roots are not product code and must be counted separately from source size.

## Cleanup And Compression Decisions

- The Hito Stack Simplification core cleanup track is complete and archived at `40/40`.
- Broad `training-api.ts` cleanup remains unsafe without fresh import proof; only proved sub-seams
  were narrowed.
- Runtime/frontend cleanup should not be selected by line count alone because many large files are
  live product surfaces or browser-sensitive owners.
- Docs compression should start with archived plans and digest links, not current docs or changelog.
- `qa-artifacts/` is protected evidence until a separate QA retention policy exists.
- `logs/` and `test-results/` may be handled by DEVTOOLS dry-run/apply retention tooling, but no
  deletion is approved by this digest.

## Preserved Evidence Index

The detailed history remains available in linked source artifacts:

| Track | Detailed source |
| --- | --- |
| Core stack cleanup ledger | [Hito Stack Simplification Strike](../plans/archive/2026-06-07-hito-stack-simplification-strike.md) |
| Plan Presets | [Plan Preset Library And Custom Authoring Escape Hatch](../plans/archive/2026-06-06-first-plan-preset-library-and-custom-authoring-escape-hatch.md) |
| AI first-plan blueprint wave | [AI-Authored First-Plan Pipeline](../plans/archive/2026-05-26-ai-authored-first-plan-pipeline.md) |
| Shipped product history | [Changelog](./changelog.md) |
| Current business-flow source hierarchy | [Current functional map](../current-functional-map.md) |

## Not Included Here

- Full QA command logs and screenshot inventories.
- Raw prompt handoffs from archived execution plans.
- Detailed implementation diffs.
- Current active next-role prompts.
- Changelog duplication.
- Future-only backlog ideas unless they explain a historical boundary.
