# Polar Auto Sync Integration Plan

## Status

backlog

## Type

plan

## Priority

high

## Next Recommended Role

ARCHITECT

## Task

Plan the next Polar auto-sync integration slice when provider sync is prioritized.

## Stage

ARCHITECT plan / future provider sync integration.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

TASK:
Plan the next Polar auto-sync integration slice when provider sync is prioritized.

STAGE:
ARCHITECT plan / future provider sync integration

CONTEXT:
- Source path: docs/tasks/backlog/2026-05-21-polar-auto-sync-integration-plan.md
- Markdown metadata is canonical for this repo-derived admin Backlog item.
- Supabase mirrors this item for discovery and prompt copy only.
- This plan was demoted from `docs/plans/active` during the 2026-06-15 global teardown audit
  because Polar sync is a concrete future integration, not the current active execution owner.

CONSTRAINTS:
- Edit this markdown file, not the admin Backlog mirror, when task truth changes.
- Preserve Hito canonical architecture and current role boundaries.
- Do not broaden scope beyond this work item.

OUTPUT:
Use the project role output format.
```

## Owner

Architect / Backend

## Last Updated

2026-06-15

## Backlog Demotion Note

Moved from active plans to backlog during the 2026-06-15 global teardown audit because Polar
automatic sync is still a concrete future integration plan and is not yet implemented.

This remains the highest-signal provider-sync backlog plan, but it is not the next committed
implementation slice.

## Context

Hito already has one canonical saved-mode workout feedback pipeline:

`evidence -> normalized actual metrics -> deterministic comparison -> optional AI interpretation -> Feedback readback`

Garmin currently enters that pipeline through explicit FIT/ZIP upload. Polar must not create a second product model or a second comparison surface. The first Polar integration should be the connected-provider version of the same truth path: provider evidence is saved first, normalized into existing actual-workout truth, matched conservatively to `planned_workouts`, then compared and optionally interpreted through the existing feedback architecture.

Research source baseline:

- Polar AccessLink Dynamic API v4: https://www.polar.com/polar-api-v4
- Polar AccessLink v3 docs: https://www.polar.com/accesslink-api/

The official v4 docs support OAuth, refresh tokens, `training_sessions:read`, `profile:read`, `devices:read`, `GET /v4/data/training-sessions/list`, optional training-session features, one-day requests when features are included, and rate limits of 3000 requests per 15 minutes and 100000 requests per 24 hours. The v3 exercise transaction area is documented as deprecated, so v3 must not be the primary architecture base.

## Product Goal

The target runner experience is automatic sync:

1. Runner connects Polar once.
2. Runner has a planned workout today.
3. Runner completes the workout with a Polar watch.
4. Polar receives the workout in the Polar ecosystem.
5. Hito automatically pulls recent Polar sessions.
6. Hito matches a running session to the planned workout.
7. Hito stores raw provider truth.
8. Hito normalizes actual metrics.
9. Hito runs deterministic planned-vs-actual comparison.
10. Hito optionally generates bounded AI insight if entitlement allows.
11. Hito shows the result in the existing workout-detail `Feedback` surface.

Fallback product behavior:

- Keep one visible `Sync Polar` or `Sync now` action for delayed or missed sync.
- The manual action must call the same backend sync pipeline as scheduled sync.
- Manual sync is a retry/freshness affordance, not a separate ingestion model.

## Chosen API Strategy

Use Polar AccessLink Dynamic API v4 as the primary integration API.

Recommended path:

- Phase 1: auto pull MVP plus manual sync fallback.
- Phase 2: freshness improvement only if needed, possibly with v3 webhook as a trigger.
- Phase 3: optional expansion into recovery, device, route, and profile enrichment after running-session sync is stable.

Rejected primary path:

- Do not build the first Polar integration around v3 exercise transactions or v3 FIT/TCX/GPX downloads. That can mimic Garmin upload mechanically, but it leans on deprecated exercise transaction resources and would make Hito's first connected-provider foundation weaker.

## Why v4 Is Primary

v4 is the best first foundation because:

- It is the newer Polar API surface.
- It uses direct OAuth and refresh tokens.
- It exposes direct training-session listing without the older transaction flow.
- It can return richer training-session data through features such as `statistics`, `laps`, `zones`, `hill-splits`, and `routes`.
- It keeps future enrichment in the same API family without making sleep/recovery part of v1.

The first Hito slice should request only the minimum feature set needed for feedback:

- Start with `statistics`, `laps`, and `zones` if they are available and stable enough for normalization.
- Consider `hill-splits` later for mountain-running usefulness.
- Avoid `routes` in v1 unless Backend needs a route summary for provenance. Do not build map UI in v1.

Because v4 feature requests are limited to one day at a time, the sync worker should fetch feature-enriched sessions day-by-day across a bounded recent window.

## Where v3 May Be Used Later

v3 may be used later only as a freshness signal:

- v3 webhook event such as `EXERCISE` can wake up or mark a connection as needing sync.
- v3 notification/webhook payload must not become canonical workout truth.
- The canonical data pull should still run through the selected provider sync pipeline and normalize into Hito's existing actual/comparison tables.

Do not use v3 exercise transactions as the main data source in v1.

## Canonical Pipeline

```text
Polar OAuth connection
-> automatic recent-window sync
-> optional manual Sync now fallback
-> v4 training-session pull
-> raw provider payload saved
-> running-session filter
-> normalization
-> conservative planned-workout matching
-> existing workout_actual_metrics
-> existing deterministic workout_comparisons
-> optional workout_ai_insights
-> existing Feedback readback
```

Important boundary:

- Raw provider payload is evidence/provenance.
- Normalized actual metrics are Hito product truth.
- Deterministic comparison remains the primary verdict.
- AI interpretation remains optional, bounded, and secondary.

## What We Reuse From Garmin

Reuse:

- `workout_result_assets` as the evidence/readback asset layer, extended for provider-synced assets.
- `workout_actual_metrics` as normalized actual workout truth.
- `workout_comparisons` as deterministic planned-vs-actual truth.
- `workout_ai_insights` as the optional bounded interpretation layer.
- Existing comparison builder, once actual metrics are normalized into comparable columns/payloads.
- Existing `Feedback` tab readback model and calendar feedback markers.
- Existing `garmin_ai_interpretation` entitlement behavior for the AI interpretation step unless renamed later to a provider-neutral key.

Do not reuse:

- Garmin file upload UI as the primary Polar UX.
- FIT/ZIP parser architecture as the Polar primary source.
- Garmin-specific copy where Polar should read as connected watch evidence.

## What Must Stay Provider-Neutral

The following concepts should become provider-neutral or remain provider-neutral before Polar ships:

- Feedback marker source language should not imply all feedback is Garmin-only.
- `workout_actual_metrics.source_kind` must accept at least `garmin_fit` and `polar_training_session`.
- `workout_result_assets.asset_kind` must accept at least `garmin_fit`, `garmin_zip`, and `polar_training_session`.
- Readback summaries should say `Polar` only when describing the evidence source, not when describing the overall comparison architecture.
- The AI insight prompt should receive normalized actual metrics, deterministic comparison payload, and body-note caution context, not raw Polar JSON.

Potential later naming cleanup:

- `garmin_ai_interpretation` is currently the live entitlement key. For v1, Backend may reuse it as "connected workout AI interpretation" if that avoids entitlement churn, but the plan should record whether a later provider-neutral capability key such as `workout_ai_interpretation` is needed before billing.

## What Polar Adds That Garmin Upload Did Not Need

Polar adds connected-provider concerns:

- OAuth connect/callback/disconnect.
- Encrypted access and refresh token storage.
- Token refresh.
- Scheduled recent-window sync.
- Manual sync fallback using the same pipeline.
- Idempotency by remote training-session id.
- Raw provider JSON persistence before normalization.
- Connection health and sync freshness state.
- Conservative matching because the user no longer manually attaches a file to one planned workout.

## OAuth And Token Ownership

Backend owns OAuth and tokens.

Required flow:

1. Frontend opens `Connect Polar`.
2. Backend redirects to `https://auth.polar.com/oauth/authorize?...`.
3. Polar redirects back to a Hito callback route.
4. Backend exchanges the code for token response.
5. Backend stores `access_token`, `refresh_token`, `expires_in`, and granted `scope`.
6. Backend fetches minimal profile/account identity if `profile:read` is granted.
7. Frontend receives only connection status, never tokens.

Token rules:

- Store tokens server-side only.
- Encrypt access and refresh tokens at rest.
- Refresh expired access tokens before sync.
- If refresh fails, mark connection `needs_reconnect`.
- Do not expose Polar client secret to browser code.

Recommended first scopes:

- Required: `training_sessions:read`
- Recommended: `profile:read`
- Optional: `devices:read`

Later-only scopes:

- `sleep:read`
- `nightly_recharge:read`
- `activity:read`
- `routes:read`
- `sports:read`

## Provider Connection Storage

Add one backend-owned provider connection truth layer.

Suggested table: `provider_connections`

Suggested columns:

- `id uuid primary key`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `provider text not null check (provider in ('polar'))`
- `provider_user_id text`
- `provider_account_payload jsonb`
- `granted_scopes text[] not null default '{}'`
- `access_token_encrypted text not null`
- `refresh_token_encrypted text not null`
- `access_token_expires_at timestamptz`
- `status text not null check (status in ('active', 'needs_reconnect', 'revoked', 'sync_error'))`
- `last_successful_sync_at timestamptz`
- `last_sync_started_at timestamptz`
- `last_sync_error text`
- `sync_cursor jsonb`
- `last_synced_date date`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Suggested constraints:

- unique active connection per `(user_id, provider)` in v1.
- server/admin writes only.
- authenticated users may read their own connection status, not tokens.

Do not create a full subscription/billing/provider framework in this slice.

## Raw Payload Storage

Add one raw provider payload layer.

Suggested table: `provider_raw_payloads`

Suggested columns:

- `id uuid primary key`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `connection_id uuid not null references provider_connections(id) on delete cascade`
- `provider text not null check (provider in ('polar'))`
- `remote_entity_type text not null check (remote_entity_type in ('training_session'))`
- `remote_entity_id text not null`
- `remote_started_at timestamptz`
- `remote_local_date date`
- `pulled_at timestamptz not null default now()`
- `payload jsonb not null`
- `payload_checksum text not null`
- `normalization_status text not null check (normalization_status in ('pending', 'normalized', 'skipped', 'failed', 'duplicate', 'ambiguous'))`
- `normalization_error text`
- `planned_workout_id uuid references public.planned_workouts(id) on delete set null`
- `workout_actual_metrics_id uuid references public.workout_actual_metrics(id) on delete set null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Suggested constraints:

- unique `(provider, remote_entity_type, remote_entity_id)`.
- index `(user_id, remote_local_date desc)`.
- index `(connection_id, pulled_at desc)`.

Rules:

- Save raw payload before normalization.
- Upsert raw payload idempotently by remote entity id.
- If the checksum is unchanged, do not re-normalize unless explicitly forced.
- If checksum changes, re-normalization may run, but provenance must remain clear.
- Raw payload persistence does not mean the session is product-visible.

## Normalization Into Existing Hito Entities

Normalize only running-compatible Polar training sessions in v1.

Target normalized fields:

- provider identity: `polar`
- source kind: `polar_training_session`
- remote session id
- raw provider payload id
- activity start time
- activity local date
- duration in minutes
- distance in km
- average heart rate
- max heart rate
- calories
- ascent/descent
- device id/model when available
- lap/step-like payload when available
- zones/statistics payload when available
- route summary when available
- completeness flags

Recommended `workout_actual_metrics` mapping:

- `source_kind`: `polar_training_session`
- `activity_started_at`: Polar `startTime`
- `activity_local_date`: local date derived from session start or provider-local truth
- `actual_duration_min`: `durationMillis / 60000`
- `actual_distance_km`: `distanceMeters / 1000`
- `actual_avg_hr`: from statistics/zones/session data when available
- `actual_max_hr`: from statistics when available
- `actual_calories`: calories
- `actual_elevation_gain_m`: ascent if available
- `actual_elevation_loss_m`: descent if available
- `actual_interval_count`: lap count or null if not comparable
- `actual_step_payload`: normalized laps/segments when comparable
- `lap_payload`: provider laps payload, normalized enough for readback/comparison
- `summary_payload`: provider summary, remote ids, feature list, raw payload id, completeness flags

Recommended `workout_result_assets` mapping:

- `asset_kind`: `polar_training_session`
- `storage_bucket`: empty or provider/raw sentinel if schema allows, otherwise use a provider payload reference strategy in migration.
- `storage_path`: stable synthetic path such as `polar/{connection_id}/{remote_session_id}` if current schema requires uniqueness.
- `original_file_name`: runner-facing synthetic label such as `Polar training session`.
- `mime_type`: `application/json`
- `file_size_bytes`: serialized payload byte size or `1` if schema requires positive size and raw JSON size is tracked elsewhere.
- `parse_status`: `parsed` after successful normalization, `failed` after normalization failure.
- `primary_file_kind`: null.
- `primary_file_name`: null or remote session id.

Backend should decide whether to extend `workout_result_assets` directly or add provider payload linkage fields. The smallest safe path is to extend existing check constraints and store a synthetic JSON-backed evidence asset while keeping raw payload truth in `provider_raw_payloads`.

## Workout Matching Strategy

Polar matching must be conservative because the runner did not manually choose one planned workout.

Matching rules:

1. Same user only.
2. Running-compatible Polar session only.
3. Local activity date must match `planned_workouts.workout_date`.
4. Rest days are ignored.
5. If exactly one running-compatible planned workout exists on that date, attach confidently.
6. If multiple candidates exist, use source workout type, planned duration, and planned distance as tie-breakers.
7. If still ambiguous, save raw payload and mark normalization `ambiguous`; do not attach.
8. If there is no planned workout for the session date, save raw payload and mark `skipped` with reason `no_planned_workout`.
9. If existing active Garmin or Polar evidence is already attached, do not silently overwrite.
10. Replacement of existing evidence is out of scope for v1 unless an explicit confirm flow is added.

Suggested match states in raw payload normalization metadata:

- `matched`
- `no_active_plan`
- `no_planned_workout`
- `rest_day`
- `non_running`
- `ambiguous`
- `duplicate`
- `existing_evidence`
- `normalized_failed`

## Automatic Sync Strategy

V1 should start with scheduled recent-window pull.

Recommended cadence:

- Run scheduled sync every 30 to 60 minutes for active Polar connections if hosting supports it.
- If scheduler granularity is limited, hourly is acceptable for v1.
- Also run a daily wider safety sync for the last 7 days.

Recommended window:

- Normal automatic sync: today plus last 3 days.
- Safety/backfill sync: today plus last 7 days.
- Do not pull long historical ranges in v1 unless a user explicitly reconnects or Backend runs an admin backfill.

Request strategy:

- Because v4 feature requests are one day at a time, call `training-sessions/list` per date when requesting features.
- Keep feature set small.
- Skip reprocessing remote sessions whose payload checksum did not change.
- Respect rate limits and store retry/backoff state after `429`.

If the app has no active plan:

- Connection may remain active.
- Sync may save raw payloads in the bounded recent window.
- Do not create `workout_actual_metrics` without a planned workout match.
- Do not show this as workout feedback.

If there is no planned workout today:

- Save raw recent running session if pulled.
- Mark normalization as skipped/no planned workout.
- Do not create comparison or AI insight.

## Manual Sync Fallback

Expose one `Sync Polar` or `Sync now` action.

Rules:

- Uses the same backend sync service as scheduled sync.
- Runs the same recent-window logic.
- Does not bypass token refresh, idempotency, matching, or replacement rules.
- Returns one compact status:
  - synced and feedback ready
  - synced but no matching planned run
  - already up to date
  - reconnect needed
  - temporarily unavailable/rate limited

Likely UI placement:

- First release can place this in a quiet Polar connection row, likely `/integrations` or a small account/settings connection area.
- Do not add it as a primary nav item.
- Existing workout-detail `Feedback` can show status once a matching session has created feedback truth.

## Failure Handling

Revoked token:

- Mark connection `needs_reconnect`.
- Stop scheduled sync for that connection.
- Keep existing raw payloads, actual metrics, comparisons, and insights.

Expired token:

- Refresh server-side before sync.
- If refresh succeeds, continue.
- If refresh fails, mark `needs_reconnect`.

Partial scopes:

- Missing `training_sessions:read` blocks sync.
- Missing `profile:read` or `devices:read` should not block workout sync.
- Store granted scopes and show scoped limitation if needed.

Duplicate sessions:

- Use remote session id and checksum.
- Do not create duplicate `workout_actual_metrics`.
- Do not supersede existing metrics unless the same provider session changes and replacement policy is explicit.

Rate limit / `429`:

- Store `last_sync_error`.
- Back off until a safe retry time.
- Manual sync should return a bounded retry-later response.

Non-running sessions:

- Save raw payload if included in the bounded sync response.
- Mark normalization `skipped`.
- Do not create actual metrics.

Missing feature subsets:

- Normalize available summary truth.
- Mark completeness flags.
- Deterministic comparison should return partial or insufficient data rather than inventing metrics.

Ambiguous planned-workout match:

- Keep raw payload.
- Do not attach to a planned workout.
- Manual resolution is out of scope for v1 unless an explicit confirm surface is added later.

Existing Garmin evidence already attached:

- Do not silently replace.
- Mark Polar raw payload as `skipped` or `ambiguous` with reason `existing_evidence`.
- A future explicit replacement flow can decide provider precedence.

No planned workout for session date:

- Keep raw provider truth if already pulled.
- Do not create product feedback.

Provider outage:

- Preserve previous sync state.
- Store bounded connection error.
- Do not delete or alter prior feedback.

Malformed payload:

- Store raw payload if possible.
- Mark normalization `failed`.
- Do not create actual metrics.

Normalization failure:

- Mark raw payload `failed`.
- If an asset row was created, mark parse/normalization failed.
- Do not create comparison.

Comparison failure:

- Keep normalized metrics.
- Store bounded error for sync result.
- Do not generate AI insight without comparison.

AI insight locked by entitlement:

- Keep raw payload, metrics, and deterministic comparison.
- Skip AI insight generation with locked-state metadata.
- Existing Feedback readback should still show factual comparison.

## Phased Rollout

### Phase 1: Auto Pull MVP + Manual Sync Fallback

Goal:

- Deliver connected Polar running-session sync into existing Feedback.

Work:

- Add provider connection schema.
- Add raw provider payload schema.
- Add Polar OAuth connect/callback/disconnect.
- Add token encryption/refresh.
- Add scheduled recent-window sync service.
- Add manual `Sync now` action using the same sync service.
- Add Polar v4 client wrapper.
- Pull bounded recent training sessions.
- Save raw payloads first.
- Normalize running sessions.
- Match conservatively to `planned_workouts`.
- Persist existing workout actual/comparison/AI truth.
- Read back through existing Feedback surface.

### Phase 2: Freshness / Webhook Improvement

Goal:

- Improve sync latency only if scheduled pull is not good enough.

Work:

- Optionally add v3 webhook verification.
- Treat webhook as a signal to run recent-window v4 sync.
- Do not make webhook payload canonical workout truth.

### Phase 3: Optional Expansion

Goal:

- Enrich Hito only after core running-session sync is stable.

Possible later work:

- sleep
- nightly recharge
- continuous heart rate
- devices readback
- zones/profile enrichment
- route details
- provider conflict resolution

## Backend Responsibilities

Backend owns:

- OAuth start/callback/disconnect.
- Token encryption and refresh.
- Provider connection truth.
- Scheduled sync service.
- Manual sync action.
- Polar v4 API client.
- Raw payload persistence.
- Provider payload idempotency.
- Running-session detection.
- Normalization into canonical actual metrics.
- Conservative matching to planned workouts.
- Existing evidence/metrics/comparison/AI writes.
- Failure state shaping.
- Rate-limit handling.
- Provider-neutral readback fields where needed.

Likely files/modules:

- `src/lib/polar/polar-client.ts`
- `src/lib/polar/polar-oauth.ts`
- `src/lib/polar/polar-sync.ts`
- `src/lib/polar/normalize-polar-training-session.ts`
- `src/lib/provider-connections/*` if a small shared layer is useful
- `src/routes/api.integrations.polar.connect.tsx`
- `src/routes/api.integrations.polar.callback.tsx`
- `src/routes/api.integrations.polar.sync.tsx`
- a scheduled sync route or cron target
- Supabase migrations for provider connection and raw payload tables
- type updates for existing workout-result asset/source-kind values

Keep the module names flexible, but keep the responsibilities small.

## Frontend Responsibilities

Frontend owns:

- Connect Polar action.
- Disconnect/reconnect state if included in v1.
- Sync status display.
- Manual `Sync now` fallback button.
- Calm copy for delayed sync or reconnect needed.
- Existing Feedback readback consumption once backend creates canonical feedback truth.

Frontend must not:

- Hold Polar tokens.
- Call Polar APIs directly.
- Match workouts client-side.
- Create actual metrics client-side.
- Decide provider conflict/overwrite policy.

Likely UI surface:

- Start in a quiet integrations/settings connection surface.
- Keep workout-detail `Feedback` focused on feedback truth, not OAuth management.
- Do not re-add `/integrations` as primary nav just for Polar.

## QA Expectations

Backend QA:

- Connect Polar OAuth callback stores connection without exposing tokens.
- Refresh token path works.
- Scheduled sync pulls bounded recent dates.
- Manual `Sync now` uses same pipeline.
- Raw payload is saved before normalization.
- Duplicate remote session does not create duplicate metrics.
- Non-running session is skipped.
- Running session with one matching planned workout creates actual metrics.
- Existing deterministic comparison is created.
- AI insight is created only when entitlement allows.
- Existing Garmin evidence is not silently overwritten.
- Revoked/expired token states are bounded.
- Rate-limit response is bounded.

Frontend QA:

- Connect button starts OAuth.
- Connected state is clear.
- Sync now status is clear.
- Reconnect state is clear.
- Existing workout-detail Feedback displays Polar-backed actual/comparison truth without a separate Polar UI.
- Calendar feedback marker still works from canonical feedback truth.

Regression QA:

- Garmin upload still works.
- Garmin remove still works.
- Manual workout logging still works.
- Deterministic comparison readback still works.
- AI insight readback still works.
- Basic/Pro AI lock still skips only the AI interpretation layer.

## Risks

- Polar v4 response fields may differ by sport profile, device, or granted features.
- Feature-rich v4 requests are one-day-at-a-time, so naive sync can over-request.
- Automatic sync can create surprising attachments if matching is too aggressive.
- Existing schema checks are Garmin-specific and must be widened carefully.
- Current feedback marker naming uses `garmin_feedback`; provider-neutral marker semantics may need a small compatibility step.
- Token encryption needs a clear server-only key strategy.
- Provider conflict handling can become a product rabbit hole if v1 tries to solve Garmin-vs-Polar replacement.

## Non-Goals

- No all-Polar-data import.
- No sleep/recovery import in v1.
- No automatic plan mutation from Polar.
- No v3 exercise transaction foundation.
- No separate Polar feedback UI.
- No map/route visualization.
- No broad provider framework beyond the minimum needed for Polar and existing Garmin compatibility.
- No manual match resolver in v1 unless ambiguity blocks basic QA.
- No provider conflict/overwrite UI in v1.
- No billing or pricing changes.

## What We Refuse To Build In V1

- A second actual-workout model.
- A second comparison engine.
- A Polar dashboard.
- A health data lake.
- A background job framework unless the existing hosting/runtime cannot support scheduled sync.
- Webhook-first ingestion.
- Silent evidence replacement.
- Plan changes based on Polar data.

## Exit Criteria

- A saved runner can connect one Polar account.
- Backend stores encrypted Polar tokens server-side only.
- Scheduled sync pulls recent Polar training sessions for active connections.
- `Sync now` can retry the same pipeline.
- Raw Polar training-session payload is persisted before normalization.
- Running sessions normalize into existing workout actual truth.
- Conservative matching attaches only confident sessions to planned workouts.
- Existing deterministic comparison runs for matched sessions.
- Optional AI insight runs only through the existing bounded entitlement-aware layer.
- Existing Feedback readback shows Polar-backed truth without a separate Polar UI.
- Duplicate sessions do not duplicate feedback.
- Existing Garmin upload/remove behavior does not regress.

## Checklist

- [ ] Add provider connection and raw provider payload storage.
- [ ] Add Polar OAuth connect/callback and encrypted token storage.
- [ ] Add Polar v4 client and token refresh.
- [ ] Add scheduled recent-window sync plus manual `Sync now` fallback.
- [ ] Persist raw Polar training-session payload before normalization.
- [ ] Normalize running sessions into existing workout actual truth.
- [ ] Match conservatively to planned workouts.
- [ ] Reuse existing deterministic comparison and optional AI insight.
- [ ] Expose minimal frontend connection/sync status after backend truth is stable.
- [ ] QA Garmin upload/remove regression.

## Next Recommended Role

BACKEND

## Suggested Next Step

Implement Phase 1 backend foundation in the smallest safe sequence:

1. Add provider connection and raw payload migrations.
2. Add Polar OAuth connect/callback and encrypted token storage.
3. Add Polar v4 client and token refresh.
4. Add recent-window sync service with raw-payload persistence.
5. Add running-session normalization into existing actual metrics.
6. Add conservative planned-workout matching.
7. Reuse existing comparison and AI insight write path.
8. Add manual `Sync now` route/action using the same sync service.
9. Add minimal frontend connection/sync status only after backend truth is stable.
