# Production Data Compatibility And Supabase Lifecycle Gate

- **Date:** 2026-08-25
- **Mode:** Tracked
- **Category:** Maintenance
- **Primary Area:** Platform
- **Epic:** `ship-adaptive-four-week-training`
- **Priority:** Highest
- **Parent:** First-User Production Launch Readiness
- **Initial owner:** Architect
  **Archive intent:** Retain the accepted compatibility contract and final migration/decommission
  receipt; compact intermediate inventories after terminal acceptance.

## Outcome

Make the hosted Supabase and public server/API boundary safe for durable runner history before Hito
invites first users. Future schema, metrics and UI changes must preserve what a runner previously
stored and saw, or migrate it through an explicit, reversible and versioned rule.

This gate does not assume that fewer tables are better. It decides which physical objects own
canonical user truth, which are reproducible projections, which are immutable provenance or
migration history, and which are proven unreachable legacy. Consolidation or deletion is allowed
only after consumer, dependency, data, backup and restore proof.

## Phase 1 — Read-Only Architecture Inventory

Map the current production contract without mutation:

- every exposed/private table, view, function/RPC, trigger, enum, Storage bucket and Auth-dependent
  relation;
- all repository migrations, generated Supabase types, server actions/routes and direct runtime or
  type-only consumers;
- RLS, grants, `security invoker/definer`, ownership, foreign keys, indexes, policies and Storage
  access paths;
- current row counts, data age/range and identity ownership through redacted aggregate evidence;
- the exact API/request → validation → normalization → persistence → readback boundary for Identity,
  Calendar, Source/Blueprint, Result/Evidence, Runner Activity, Profile and retained AI responses.

Classify each object as exactly one of:

1. `canonical_retained_user_truth`;
2. `immutable_provenance_or_lineage`;
3. `derived_rebuildable_projection`;
4. `operational_or_migration_infrastructure`;
5. `legacy_deletion_candidate` with zero-consumer proof;
6. `unresolved` with the exact missing discriminator.

Names such as `plan_cycles` or `planned_workouts` are not deletion evidence. A table is not merged
merely because two objects appear similar. The first phase is read-only and performs no hosted
schema/data mutation, reset, key access, table deletion or migration rewrite.

## Durable Data Compatibility Contract

- Accepted runner facts, confirmed Calendar workouts, logs, FIT/source evidence, factual metric
  snapshots, review/confirmation lineage and runner-visible historical results are never silently
  overwritten, reinterpreted or discarded.
- New fields and metrics are additive by default. Missing historical facts remain missing rather
  than zero or inferred.
- A change to calculation, eligibility or runner-facing meaning creates a new formula/contract
  version. Historical results retain their original version unless Product accepts an explicit
  backfill and comparison policy.
- Canonical IDs, runner ownership, source revisions, timestamps/timezones and provenance survive
  every migration. Deduplication is explicit and reversible.
- API consumers receive one canonical server-owned contract. Frontend and AI never repair old rows
  or infer compatibility locally.
- A destructive or meaning-changing migration requires a transactional transform, pre/post
  invariants, count/fingerprint parity, rollback owner and retained evidence. Dual-write, silent
  fallback and permanent compatibility aliases are prohibited.
- Immutable repository migration history is never edited as cleanup. New migrations describe the
  accepted forward change.

## Backup, Restore And Deletion Gate

Before any hosted destructive or consolidating action, Backend must prove:

1. exact Supabase project, Vercel deployment/application revision, migration/type parity and sole
   writer freeze;
2. provider backup/PITR state plus an encrypted task-owned logical export with checksum;
3. successful restore into a disposable admitted environment and the commands/owner required for
   rollback;
4. per-object row counts, ownership counts and deterministic fingerprints before and after;
5. zero live runtime/type consumers, zero database dependencies, zero production traffic and no
   retained rollback/reference requirement for every deletion candidate;
6. RLS/grants/advisors/API contract checks and an independent QA replay over preserved historical
   fixtures after the candidate migration;
7. a Product-approved rollback window before the retired object is physically decommissioned.

No production object or user row is deleted during discovery. Architecture may decide that the
correct outcome is no deletion.

## Delivery Sequence

1. **ARCHITECT:** produce the complete owner/consumer/dependency classification, the stable public
   compatibility boundary, an explicit retain/rebuild/migrate/delete decision for each candidate,
   and the smallest ordered migration/decommission plan. Stop on unresolved user-visible meaning or
   retention policy.
2. **BACKEND:** obtain exact hosted admission, backup/restore proof and implement only the accepted
   repository-managed additive or consolidating migrations. Preserve old objects rollback-only
   until the accepted window closes.
3. **QA:** restore the pre-change dataset into the admitted disposable target, apply the candidate,
   prove old and new API/readback behavior, RLS isolation, formula/version history, counts,
   fingerprints and rollback, then replay the first-user launch dataset.
4. **PRODUCT:** accepts preserved runner-visible history and authorizes any final physical
   decommission separately. Only then may the parent launch gate complete.

## Stop Conditions

Return to Product only for a genuine data-retention or runner-visible reinterpretation decision,
new paid infrastructure, missing backup/restore authority, unresolved production writer, or a
proposed destructive target whose full consumer/dependency proof is incomplete. Routine schema,
RLS, API or migration defects remain same-Task fix-forward with the first incorrect owner.

## Architecture Decision — 2026-08-25

### Decision Snapshot

The repository and the read-only linked-hosted migration seam agree on 55 ordered migrations through
`20260824111500`. Generated public types describe 27 public tables, no public views, 18 exposed
public functions, five public enums and no public composite types. Migration replay additionally
defines 12 non-API trigger/support functions and 26 triggers. Three Storage buckets are declared.

No current public table is admitted for deletion. Every table either has a direct production
consumer, owns accepted account/runner truth, retains immutable source/evidence/confirmation
lineage, or stores a versioned projection needed to preserve a result already shown to a runner.
`plan_cycles` and `planned_workouts` remain necessary physical stores: the former owns immutable
source/Saved-review provenance, while the latter owns confirmed runner Calendar rows. Their names do
not restore plan-container authority.

The only source-backed deletion candidate is the legacy `admin-capture-assets` Storage bucket. Its
table was removed by migration `20260601110000`, no production source consumes the bucket, and the
Admin validator expects it to be absent. Physical deletion is not admitted until BACKEND proves the
hosted bucket exists or is absent, zero objects, zero policies/traffic/references and a recoverable
rollback boundary. No runner-data decision blocks the next read-only BACKEND admission slice.

### Evidence Boundary

- Checkout and `origin/main`: `44c3e0ba2a8ad50896ede7a496d946191dca838c`.
- Repository migrations: 55; ordered content ledger SHA-256
  `84758e257b3ba92eff261ab70cb87a3c9ce58b8323d980d1921567370b6e0790`.
- Generated public types: `src/lib/supabase/database.ts`, SHA-256
  `5690db978671e82ad614cb1c21946661a6f5a802299e5fde144a9079d8c33881`.
- Linked hosted read-only migration list: exact local/remote parity for all 55 versions. This proves
  migration-history parity only; it does not prove absence of manual catalog, grant, bucket, data or
  traffic drift.
- All current public tables have RLS enabled. Migration replay leaves 17 authenticated owner
  policies across 12 tables; remaining tables are service-role/RPC mediated.
- Twenty-six public tables have an `auth.users` cascade relationship.
  `runner_activity_evidence_revisions` additionally binds `actor_user_id` to Auth.
  `admin_capture_items.created_by_user_id` is application text, not an Auth foreign key.
- HITO-280 and all runtime/source/migration/environment bytes remained untouched.

### Public Table Ledger

`database.ts` is the shared type-only consumer for every row below and is omitted from the direct
consumer column. Proof scripts are retained consumers but do not replace the named production owner.

| Object                                           | Classification                            | Sole allowed meaning and direct production/type consumers                                                                                                                                    | Database dependency / decision                                                                                                |
| ------------------------------------------------ | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `runner_profiles`                                | `canonical_retained_user_truth`           | Identity/profile, locale, timezone, baseline and explicit preferences; user-settings, Calendar context/persistence, profile-avatar, template catalog, source persistence and Admin analytics | Auth-owned primary key; never reconstructed from Calendar, AI or UI                                                           |
| `planned_workouts`                               | `canonical_retained_user_truth`           | Confirmed runner-owned Calendar prescription; Calendar persistence/mutations, result import/readback, workout log/sidebar, source export, authoring/review and Activity history              | Optional `(user_id, plan_cycle_id)` provenance FK is `ON DELETE RESTRICT`; logs/evidence/activity links depend on workout ID  |
| `workout_logs`                                   | `canonical_retained_user_truth`           | Runner-authored outcome, notes, body notes, manual actuals and RPE; Calendar persistence/sidebar, workout-log actions, result ingestion, Activity metrics and Admin analytics                | One log per Calendar workout; evidence revisions may retain a nullable log reference                                          |
| `runner_activities`                              | `canonical_retained_user_truth`           | Provider-neutral activity identity/current revision and accepted summary; Activity Garmin source, history, facts and metrics                                                                 | Owns sources, revisions, matches, evidence and metrics; source removal cannot delete unrelated historical facts               |
| `runner_activity_evidence_revisions`             | `canonical_retained_user_truth`           | Versioned runner/official assertions and withdrawals; Activity evidence and metrics                                                                                                          | Immutable revision chain; Auth binds owner and actor; nullable log lineage                                                    |
| `runner_manual_workout_templates`                | `canonical_retained_user_truth`           | User-owned reusable authoring content; saved-template repository                                                                                                                             | Auth owner; draft/review versions remain explicit, not a second Calendar writer                                               |
| `runner_entitlements`                            | `canonical_retained_user_truth`           | Durable account grant/tier/status; Admin analytics is the current direct reader                                                                                                              | Auth-owned account fact; absence is not a free/zero inference                                                                 |
| `runner_capability_usage`                        | `canonical_retained_user_truth`           | Durable attributed capability consumption; Admin analytics is the current direct reader                                                                                                      | Auth-owned `(user, capability, period)` fact; counters require transactional ownership                                        |
| `workout_ai_insights`                            | `canonical_retained_user_truth`           | Runner-visible historical AI result with model/response attribution; result feedback and Admin analytics                                                                                     | References workout, comparison and actual metrics; never silently regenerated as the old result                               |
| `plan_cycles`                                    | `immutable_provenance_or_lineage`         | Source proposal, Saved plan review and export provenance; source-provenance, source persistence/lifecycle and plan export                                                                    | Archived/source-only; deletion is restricted while Calendar rows reference provenance                                         |
| `calendar_workout_mutation_events`               | `immutable_provenance_or_lineage`         | Calendar audit, review checksum and bounded Undo lineage; Calendar persistence/mutations and document edit                                                                                   | Self-referencing Undo chain; payload/checksum versions remain readable                                                        |
| `workout_result_assets`                          | `immutable_provenance_or_lineage`         | Result/FIT metadata and immutable raw-source pointer; result ingestion/readback, Activity source and Admin analytics                                                                         | References Calendar workout, log and source revision; raw removal changes state/pointer, not identity                         |
| `runner_activity_sources`                        | `immutable_provenance_or_lineage`         | Provider-neutral source identity/current source revision; Activity source/history/metrics                                                                                                    | Child of activity; current revision is attributable, not provider authority                                                   |
| `runner_activity_source_revisions`               | `immutable_provenance_or_lineage`         | Raw-source revision, capability, quality and Storage lineage; result feedback and Activity source/history/metrics                                                                            | Child of source; raw path may become explicitly removed while revision identity survives                                      |
| `runner_activity_revisions`                      | `immutable_provenance_or_lineage`         | Immutable normalized activity revision plus field provenance and normalizer version; Activity source/history/facts/metrics                                                                   | Child of activity and exactly one source revision; current pointer lives on activity                                          |
| `runner_activity_planned_workout_matches`        | `immutable_provenance_or_lineage`         | Attributed activity-to-Calendar match; Activity source/history/metrics and authoring protection                                                                                              | References activity, source revision and Calendar workout; not prescription authority                                         |
| `ai_plan_generation_responses`                   | `immutable_provenance_or_lineage`         | Private retained completed provider response, attempts, compiler/Coach/QA outcomes and version fingerprints; AI-response/adaptive persistence                                                | Auth owner; Blueprint/candidate rows reference it; raw body never enters Frontend DTOs                                        |
| `adaptive_training_blueprint_versions`           | `immutable_provenance_or_lineage`         | Immutable Blueprint content/compiler/source-contract version; adaptive persistence                                                                                                           | Owner-bound response FK; parent of candidates, inputs and confirmations                                                       |
| `adaptive_training_detailed_candidates`          | `immutable_provenance_or_lineage`         | Durable Saved plan review candidate, safe compiled content and input provenance; adaptive persistence                                                                                        | Owner-bound Blueprint and optional response FKs; confirmation is separate                                                     |
| `adaptive_training_continuation_input_revisions` | `immutable_provenance_or_lineage`         | Versioned explicit check-in/preferences input; adaptive persistence                                                                                                                          | Owner-bound Blueprint and supersession revision; never Calendar mutation                                                      |
| `adaptive_training_block_confirmations`          | `immutable_provenance_or_lineage`         | Sealed explicit confirmation, predecessor and Calendar materialization fingerprints; adaptive persistence/readback                                                                           | Owner-bound Blueprint/candidate/self lineage; Calendar IDs are evidence, not a second writer                                  |
| `workout_actual_metrics`                         | `derived_rebuildable_projection`          | Normalized actual metrics from retained activity/source evidence; result feedback/comparison/projection, authoring protection and Admin analytics                                            | References workout, log, raw asset, activity and revision; retain old rows until same-version deterministic rebuild is proven |
| `workout_comparisons`                            | `derived_rebuildable_projection`          | Versioned planned-versus-actual comparison; result feedback/projection, authoring protection and Admin analytics                                                                             | References workout and actual metrics; formula version freezes historical meaning                                             |
| `runner_activity_fact_snapshots`                 | `derived_rebuildable_projection`          | Versioned factual Product snapshot with explicit inputs, exclusions and missingness; Activity facts                                                                                          | Rebuild only from exact revisions and original formula version; runner-visible snapshot stays frozen until parity proof       |
| `runner_activity_metric_observations`            | `derived_rebuildable_projection`          | Versioned comparable metric observation with eligibility, confidence and missingness; Activity metrics                                                                                       | References activity/source/activity/evidence revisions; formula version and input fingerprint are mandatory                   |
| `runner_activity_metric_snapshots`               | `derived_rebuildable_projection`          | Versioned metric bundle and observation identities; Activity metrics                                                                                                                         | Preserve formula set/version map and exact inputs; no universal score replaces it                                             |
| `admin_capture_items`                            | `operational_or_migration_infrastructure` | Admin capture/triage inbox only; `admin-capture.server`                                                                                                                                      | Service/Admin boundary; not runner history, Notion lifecycle or an Auth FK                                                    |

No table is `legacy_deletion_candidate` or `unresolved` at this stage. Derived classification is not
permission to delete existing rows: a runner-visible instance stays frozen until a deterministic
same-version rebuild and API parity have passed.

### Functions, Triggers, Enums, Views And Platform Objects

All items in this section are `operational_or_migration_infrastructure` unless a retained-lineage
guard is explicitly noted. Function names are API/transaction seams, not additional data owners.

**Exposed public functions (18):**

- Calendar/materialization: `apply_calendar_workout_mutation`,
  `apply_calendar_workout_content_edit`, `clear_calendar_future_workouts`,
  `apply_reviewed_plan_persistence`, `apply_reviewed_future_schedule_persistence`,
  `apply_adaptive_initial_detailed_block_materialization` and
  `apply_adaptive_continuation_detailed_block_materialization`;
- adaptive retention: `retain_adaptive_training_source_candidate`,
  `retain_adaptive_training_continuation_input_revision` and
  `retain_adaptive_training_continuation_candidate`;
- Activity/Result: `persist_runner_activity_garmin_source`,
  `append_runner_activity_evidence_revision`, `sync_workout_log_runner_activity_rpe`,
  `finalize_runner_activity_planned_workout_projection`,
  `list_runner_fit_completed_planned_workouts`, `list_runner_activity_history_page` and
  `delete_runner_activity_from_history`;
- deployment evidence: `list_hito_applied_migration_versions` (service-role only).

The generated `graphql_public.graphql` function is Supabase platform infrastructure and has no Hito
production consumer. There are no application public views.

**Internal trigger/support functions (12):** `set_updated_at`,
`protect_ai_plan_generation_response_retention`, `protect_saved_plan_record_immutability`,
`reject_adaptive_training_source_update`, `reject_adaptive_training_lineage_update`,
`sync_runner_activity_match_from_result_asset`, `sync_runner_activity_match_rpe_trigger`,
`sync_runner_activity_revision_rpe_trigger`, `sync_workout_log_runner_activity_rpe_trigger`,
`sync_workout_log_user_id`, `validate_runner_heart_rate_profile_write` and
`validate_runner_profile_calendar_timezone`. The protect/reject functions are immutable-lineage
guards and cannot be removed while their tables remain.

Migration replay leaves exactly 26 triggers: immutable guards on the four adaptive lineage tables,
retained AI responses and Saved plan rows; `set_updated_at` triggers on Admin items, retained AI
responses, source plans, activities, Activity sources, entitlements, usage, templates, profiles,
actual metrics, AI insights, logs and result assets; profile validation triggers for timezone and
heart-rate truth; and Activity/Result synchronization triggers on result assets, activities, matches
and logs.

The exact trigger names are `adaptive_training_block_confirmations_reject_update`,
`adaptive_training_blueprint_versions_reject_update`,
`adaptive_training_continuation_input_revisions_reject_update`,
`adaptive_training_detailed_candidates_reject_update`, `admin_capture_items_set_updated_at`,
`ai_plan_generation_responses_protect_retention`, `ai_plan_generation_responses_set_updated_at`,
`plan_cycles_saved_plan_record_immutability`, `plan_cycles_set_updated_at`,
`runner_activities_set_updated_at`, `runner_activities_sync_revision_rpe`,
`runner_activity_matches_sync_runner_activity_rpe`, `runner_activity_sources_set_updated_at`,
`runner_capability_usage_set_updated_at`, `runner_entitlements_set_updated_at`,
`runner_manual_workout_templates_set_updated_at`, `runner_profiles_set_updated_at`,
`runner_profiles_validate_calendar_timezone`, `runner_profiles_validate_heart_rate_profile_write`,
`workout_actual_metrics_set_updated_at`, `workout_ai_insights_set_updated_at`,
`workout_logs_set_updated_at`, `workout_logs_sync_runner_activity_rpe`,
`workout_logs_sync_user_id`, `workout_result_assets_set_updated_at` and
`workout_result_assets_sync_runner_activity_match`.

The five retained enums are `runner_goal_type`, `plan_cycle_status`, `workout_type`,
`workout_outcome` and `runner_setup_state`. Existing values remain API/history vocabulary; removing
an apparently unused enum value requires row and consumer proof plus a forward migration.

System dependencies are `auth.users`, `storage.buckets`, `storage.objects` and
`supabase_migrations.schema_migrations`. They are provider infrastructure, not Hito deletion
targets. The migration-history RPC reads only the last of these through service role.

### Storage Ledger

| Bucket                  | Classification                    | Decision                                                                                                                                                                                 |
| ----------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `profile-avatars`       | `canonical_retained_user_truth`   | Public delivery does not make the user's chosen asset disposable. Preserve profile pointer, object path, ownership and explicit user-removal behavior.                                   |
| `workout-result-assets` | `immutable_provenance_or_lineage` | Private raw FIT/ZIP evidence backing source revisions and factual reconstruction. Preserve object identity/checksum/path until explicit source removal completes.                        |
| `admin-capture-assets`  | `legacy_deletion_candidate`       | Table removed, zero production consumer, validator expects absent. BACKEND must prove hosted existence, zero objects/policies/traffic and rollback before Product may authorize removal. |

### Stable Public Data Compatibility Contract

1. **Identity:** canonical row IDs, `user_id`, source/revision IDs, timestamps, runner-local date and
   timezone basis, provenance and confirmation lineage are immutable across migration. A correction
   creates an attributable revision/supersession or explicit lifecycle state; it does not rewrite
   historical identity.
2. **Additive evolution:** new storage/API fields are nullable or have a deterministic source-backed
   backfill. Missing old facts remain explicit missingness. `null`, unavailable and not-applicable
   never become zero, false or an AI guess.
3. **Versioned meaning:** every changed formula, eligibility rule, compiler, normalization or
   runner-facing semantic receives a new persisted version. Existing comparison/snapshot/metric/
   compiler/source-contract versions retain their original meaning.
4. **Historical freeze:** a result already shown to a runner is served under its persisted version.
   A backfill may add a new version only when immutable inputs, algorithm version and Product policy
   are explicit; it never silently overwrites the old result.
5. **One server contract:** Backend validates and translates persisted versions into one safe public
   DTO/action family. Frontend and AI cannot repair rows, infer provenance, recompute metrics or
   choose a fallback schema.
6. **Expand/migrate/contract:** add the new representation; freeze writers; transform transactionally
   with pre/post counts and fingerprints; switch the sole writer and server reader once; retain the
   old object rollback-only for the accepted window; then remove it only after zero dependency,
   traffic and rollback-reference proof. Permanent dual-write, aliases and silent fallback are
   forbidden.
7. **Deletion:** cascade behavior is not cleanup permission. Account deletion, explicit raw-source
   removal and final legacy decommission remain separate authorized lifecycles with their own
   evidence and retention policy.

### Ordered Retain / Rebuild / Migrate / Delete Programme

1. **Freeze compatibility baseline:** retain all 27 tables, all current functions, triggers, enums
   and the two live user buckets; record the migration and generated-type hashes.
2. **BACKEND hosted admission census:** prove exact project/ref, linked CLI identity, application and
   Vercel deployment revision, 55-version parity, generated-type parity, catalog object/RLS/grant/
   policy/index/FK fingerprints, bucket/object inventory, redacted per-table owner/count/date-range
   aggregates, advisors and current writer/traffic state. Any manual drift stops the slice.
3. **Recovery gate:** establish provider backup/PITR state; create a task-owned encrypted logical
   export without exposing values; checksum it; restore it into an admitted isolated disposable
   target; prove schema, counts, ownership fingerprints and representative historical API readback;
   record rollback owner, commands, access mode and retention window. No migration proceeds first.
4. **Projection proof:** for actual metrics, comparisons and Activity fact/metric tables, prove exact
   immutable inputs and same-version deterministic reconstruction. Until then retain every row as
   runner-visible history. New formula versions create new attributable results.
5. **Candidate migration:** none is currently required for runner tables. If hosted evidence confirms
   only empty `admin-capture-assets` residue, prepare one repository-managed removal with pre/post
   fingerprints and rollback; do not execute before separate Product decommission acceptance.
6. **QA:** restore the pre-change export, replay migrations/candidate, compare old/new safe API DTOs,
   owner isolation, RLS/grants, IDs, counts, fingerprints, missingness and versioned historical
   results, then prove rollback and the HITO-280 first-user dataset.
7. **PRODUCT:** accept preserved history and rollback window, and separately authorize final physical
   retirement. HITO-280 remains blocked until this gate is terminal.

### BACKEND Admission Gate And Stop Conditions

BACKEND may start only after rereading the live Task and confirming no concurrent schema/data/release
writer. Required evidence is exact, not inferred:

- Supabase organization/project ref, linked endpoint fingerprint and hosted deployment/application
  revision agree with the environment register and Vercel release;
- repository, remote, deployed application, all 55 migrations and generated types resolve to one
  admitted revision;
- provider backup/PITR status, encrypted logical export checksum, disposable restore identity and
  successful restore/readback are recorded without exposing credentials or personal values;
- catalog inventory covers tables, views, routines, triggers, enums, RLS, policies, grants, owners,
  indexes, FKs, Storage buckets/objects and Auth dependencies;
- pre/post evidence uses redacted counts, owner counts, date ranges and deterministic keyed
  fingerprints; raw personal rows never enter Markdown, Notion or logs;
- production has a sole-writer freeze, traffic and jobs are known, and rollback has a named owner,
  command, target and Product-approved window;
- every removal has zero runtime/type consumer, zero database dependency, zero object/row data, zero
  traffic and zero rollback/reference requirement;
- advisors, RLS/grants and historical API fixtures pass before QA handoff.

Stop on identity/revision drift, unavailable backup or restore, an unclassified row/object, exposed
personal data, unexpected consumer/traffic/writer, fingerprint mismatch, unsupported historical
version, failed rollback, paid/new environment need or any runner-visible reinterpretation. Do not
work around a stop with Frontend repair, AI reconstruction, dual writing, aliases or manual SQL.

### Product Decision Boundary

No Product decision is required to begin the finite read-only BACKEND admission census. Existing
runner facts and previously shown results are retained unchanged by default. PRODUCT is required
later only for a paid/new disposable environment if no admitted restore target exists, the exact
rollback/retention window, account/raw-source legal retention changes, a proposed reinterpretation or
backfill of runner-visible history, or final physical deletion of `admin-capture-assets`.

### Validation And Omissions

Architecture proof covered all migration files, generated types, direct production/type consumer
search, database relationships, RLS/policies/grants, functions, triggers, enums, buckets, Auth
references and linked migration parity. No row values, Storage objects, Auth users, secrets, backup,
PITR, traffic, advisors, live catalog dump or hosted application data were inspected. No Supabase,
schema, migration, runtime, provider, fixture, Git, deployment or HITO-280 mutation occurred.

## Backend Compatibility And Recovery Receipt — 2026-08-25

### Exact Hosted Admission

- Supabase project `dltfjwexyctmihclcjqj` (`hito-runn`, organization
  `ntuumykliuxzhbiajoih`, `us-east-1`) was `ACTIVE_HEALTHY` on PostgreSQL `17.6.1.113`.
- Vercel project `prj_2vQ43bjCsO7JEbH1Ggv93avrUcyL` (`hito-runner`) served production
  deployment `dpl_2N6A9Bd9VZYzvYyqS2TGaAS8EQD9`, state `READY`, from `main` at
  `44c3e0ba2a8ad50896ede7a496d946191dca838c`. The production alias returned HTTP 200.
- Repository `HEAD`, `origin/main` and the deployed Git revision were exact. Repository and hosted
  migration catalogs contained the same 55 ordered versions through `20260824111500`; the ordered
  ledger SHA-256 was
  `84758e257b3ba92eff261ab70cb87a3c9ce58b8323d980d1921567370b6e0790`.
- Linked generated public types became byte-exact after applying the repository Prettier rules. The
  shared type-contract SHA-256 was
  `5690db978671e82ad614cb1c21946661a6f5a802299e5fde144a9079d8c33881`.
- The read-only connection census found five other database sessions, zero active sessions and zero
  open transactions. No concurrent hosted schema/data writer or migration drift was observed.

### Redacted Data And Catalog Fingerprints

- All 27 public tables remain retained and RLS-enabled. They contained 404 rows in total; the
  aggregate content/owner SHA-256 was
  `5e03795b3a966adeacb441254597cef3a78ce9490711e3c6433cc2588b810955`.
- Five Auth identities were present; their redacted identity/timestamp SHA-256 was
  `4ef9c96333d8341aa83c9855559685bbdd20cdf7f0c4e97e5e235b4aa05a434d`.
- The populated public tables were: `adaptive_training_blueprint_versions` 1,
  `adaptive_training_detailed_candidates` 1, `admin_capture_items` 389,
  `ai_plan_generation_responses` 2, `runner_activity_fact_snapshots` 7,
  `runner_activity_metric_snapshots` 1 and `runner_profiles` 3. The other 20 public tables were
  empty. No row value or personal content entered this receipt.
- Historical version identity remained explicit: nine populated rows across three persisted version
  sources had SHA-256
  `bc6634521a6e6071b2b16bbbf218df7ea935681e70433bcd55a313c7a94f7e33`.

| Catalog contract        | Count | SHA-256                                                            |
| ----------------------- | ----: | ------------------------------------------------------------------ |
| Public tables           |    27 | `1635d9d7a5530f432f6ce379e10fa27a26723a950d681bef03524b5450a4799a` |
| Public columns          |   421 | `d0a049889c1f8d1d67b25a36ff507a32f70f73f3f12f1b872e5b15ee49515fcb` |
| Routines                |    30 | `6601f641a40bd89ce591e2275bbbcb058c83975fc3af044fbb9914b3509b3de0` |
| Triggers                |    26 | `35c356bc901ea2d77895077a1bfcae6264e2447c7c2591d4e3a97cf8b38fdf26` |
| Enum values             |    14 | `72b55e3d411bb896e5c4505a287b3fe9f644615d008e2811a5c6ba0951b48454` |
| Foreign keys            |    67 | `c4f92d8ea1af9b0c7096550e0ea9bca314da989e6ffb668cc15f27439ee5658e` |
| Indexes                 |    96 | `01dbbbee3b3ec62540fd774dab1d7c3fb48433aa2d095e412c65412e932f0440` |
| RLS policies            |    17 | `e205758b017ead2ed768a4c7f96f9b6e6d30860ec0552d76bbc9952e32a7d10f` |
| Public + Storage grants |   400 | `82ec7d6fbdcc64c04fcf1b4ecbcfdc6c2d1504c1da58a17e6eb0d9729b57d6a5` |

The two live user Storage buckets remain retained:

- `profile-avatars`: two object-metadata rows, 17,694 bytes, SHA-256
  `95c621ceeedd3e837a8fb199669dda9c73377056e44eea6a11ece14e60283afa`;
- `workout-result-assets`: 35 object-metadata rows, 3,077,052 bytes, SHA-256
  `cd262056ee3381a7c1d3ef11e5f84ff59d97eb4fe1169602a58a1ea5556e0b82`.

`admin-capture-assets` was absent: zero bucket, object, policy, routine and view references, and zero
literal last-24-hour Storage-log mentions. It remains a blocked deletion candidate. No deletion was
performed or authorized.

### Recovery And Disposable Restore

- Provider WAL-G physical backups were enabled and PITR was disabled. Eight completed daily backups
  were observed; the latest completed at `2026-08-25T07:28:55.042Z`.
- The external recovery root is
  `/Users/ivan/Developer/hito-running-hito281-recovery/2026-08-25-production-compatibility-gate/`.
  It is outside the repository and mode `0700`.
- The encrypted logical export `production-logical-export.tar.enc` is mode `0600`, 3,212,832 bytes,
  with ciphertext SHA-256
  `acb15a8ddbd57cd8e4caa91353a31051d552333428c45f6152c562c479d1921c`.
  Its separate mode-`0600` key is external; no value or hash was emitted. The manifest records every
  encrypted member checksum and the reproducible restore command.
- A byte-exact decrypt check passed. The plaintext tar SHA-256 was
  `a0e98f7af5877cd1e5858f7b1bb255accc09e243ceb857e47d2baa9c15609635`.
- The dump was restored transactionally into isolated local database `hito281_restore` within the
  repository-managed disposable Hito Supabase runtime. It recreated the exact linked Auth, Storage
  and public schemas before loading all retained metadata/data under the server-owned role with
  `session_replication_role=replica`.
- Restored public rows/content/owners, Auth identity timestamps, both Storage buckets and all 37
  Storage object-metadata rows, historical version fingerprints, catalog objects, policies and
  grants matched hosted evidence. Representative authenticated RLS readback returned one owned
  profile and zero foreign profiles; anonymous direct table read failed with SQLSTATE `42501`.
- The normalized 23-table/240-column Auth schema matched with SHA-256
  `153dfaf36a65013c498a554228e4f5d4bb9aa3ae43fea9f816a15d2252d92980`.
  `pg_dump` recreated 15 existing columns at different ordinal positions only; column names, types,
  nullability and defaults were unchanged.
- Supabase database backups and the logical database export retain Storage metadata, not the binary
  blob contents. Hosted blobs were not read or copied; any authorized disaster recovery must pair
  this database evidence with the provider's separate Storage-object recovery procedure.

### RLS, Grants, Advisors And Rollback Boundary

- Anonymous table grants were zero; authenticated table grants were 17. Anonymous and authenticated
  function-execute grants were seven each. Thirteen functions are `SECURITY DEFINER`.
- The current Supabase advisor baseline was recorded without changing schema: 15 service/RPC-mediated
  RLS tables have no direct policy; two functions have mutable `search_path`; four trigger-support
  definer functions remain executable by `anon`/`authenticated`; leaked-password protection is
  disabled. Performance findings include existing unindexed foreign keys, Auth RLS init-plan
  warnings and four unused indexes. These are verified follow-up risks, not compatibility drift or
  authority for an unadmitted migration.
- BACKEND owns recovery execution. PRODUCT retains authority for any hosted restore, rollback or
  physical decommission window. No hosted mutation occurred, so no rollback was executed and no
  rollback/decommission window started.
- The rollback sources are the latest completed provider physical backup and the encrypted logical
  export after checksum verification. Any future restore must first recheck target project identity,
  active writers and Storage-object recovery coverage.

### Validation, Cleanup And QA Edge

`supabase:deployment:parity`, generated-type parity, hosted/restored catalog/data fingerprints,
representative RLS isolation and encrypted-export verification passed. The disposable database and
all decrypted transient export files were removed after this receipt; the repository-managed local
Hito runtime was stopped project-qualified. The encrypted export, key and mode-`0600` manifest were
retained externally.

No hosted schema/data/Storage mutation, provider request, deployment, Git lifecycle, Product data
reinterpretation or physical deletion occurred. Existing IDs, owners, provenance, missingness and
formula/compiler versions were preserved. QA must independently verify the public API and historical
data contract, owner isolation, versions/fingerprints, backup/restore procedure, advisor evidence and
rollback boundary. Any reproduced defect returns to BACKEND on this unchanged Task.
