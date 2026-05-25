Archive Note

Archived during the 2026-05-25 active-plan inventory cleanup.

Classification: Complete / archive now.

Reason: The implemented behavior is now reflected in current docs or in newer archived closeout plans. This artifact is historical and should not drive new work by inertia.

Future agents should not continue this artifact by default. If the product need returns, create a fresh active plan from current `docs/current-*` truth.

---

Status

Implemented

Owner

Backend

Last Updated

2026-05-18

Context

Hito Running now has several live or near-live AI-assisted seams that will eventually need capability gating:

- active-plan refresh proposal generation
- active-plan refresh apply lifecycle
- Garmin AI interpretation
- planned voice-to-plan authoring

The architecture direction is already agreed:

- all current real users must remain effectively `Pro`
- billing is later
- gating must be backend-owned
- `Basic` should eventually include one AI-backed plan update

Implementation Update

2026-05-18 backend foundation slice delivered:

- additive `runner_entitlements` table stores explicit backend-owned Basic/Pro rows
- additive `runner_capability_usage` table stores lifetime metered capability usage
- missing entitlement rows resolve in backend code to effective `Pro` with `prebilling_default_pro`
- capability registry now owns `ai_plan_update`, `voice_to_plan`, and `garmin_ai_interpretation`
- `ai_plan_update` is checked before active-plan refresh proposal generation and counted only after successful proposal generation for explicit Basic users
- approved refresh proposal apply does not increment usage
- `garmin_ai_interpretation` gates only workout AI insight generation, not upload, parsing, actual metrics, deterministic comparison, or deterministic feedback readback
- authenticated clients can read their own entitlement/usage rows through RLS, but entitlement and usage writes remain server/admin-owned
- rollout repair applied the migration to the linked Supabase project and regenerated `src/lib/supabase/database.ts` from that linked schema, so real DB truth and local type truth now match

This slice should future-proof the AI boundaries without introducing Stripe, pricing, or UI redesign.

Goal

Create the smallest backend-owned entitlement foundation that can later gate:

- `ai_plan_update`
- `voice_to_plan`
- `garmin_ai_interpretation`

while preserving the current temporary rollout:

- all real users effectively behave as `Pro`
- no existing live flow becomes locked by accident

Scope

This slice should deliver:

- one canonical capability-key registry
- one backend entitlement resolution module
- one backend capability-check seam
- one additive entitlement table
- one additive metered-usage table
- one structured locked-state response shape
- one initial wiring plan for current AI-backed actions

This slice should not deliver:

- billing integration
- pricing or subscription UI
- feature-flag dashboards
- full permission framework for every route or component
- commercial enforcement in the visible product yet

Core Rule

Entitlement truth must be backend-owned.

Frontend may later mirror:

- locked
- available
- included use remaining

But the source of truth must live in backend code and persisted backend data.

Capability Keys

Use these exact canonical keys in the first slice:

- `ai_plan_update`
- `voice_to_plan`
- `garmin_ai_interpretation`

Why keep these names:

- they match the current product language closely
- they describe user-valued capabilities rather than route names
- they avoid coupling entitlement keys to current module filenames
- they are narrow enough to stay honest:
  - `ai_plan_update` covers the AI-powered plan-refresh workflow
  - `voice_to_plan` covers voice-input authoring specifically
  - `garmin_ai_interpretation` covers only the AI layer on top of Garmin evidence, not deterministic Garmin ingestion or comparison

Recommended explicit rename from the earlier architecture draft:

- prefer `garmin_ai_interpretation`
- not `garmin_ai_feedback`

Reason:

- the live product already separates deterministic `Feedback` truth from the bounded AI interpretation layer
- the entitlement key should gate only the AI interpretation part, not the whole feedback surface

Minimal Schema / Storage Shape

Create two small additive tables only.

### 1. `runner_entitlements`

Purpose:

- store explicit tier overrides and future subscription-backed entitlement truth
- support a missing-row default that still resolves current users as `Pro`

Recommended columns:

- `user_id uuid primary key`
- `tier text not null`
  values:
  - `basic`
  - `pro`
- `source text not null`
  values:
  - `prebilling_default_pro`
  - `manual_override`
  - `subscription`
  - `promo`
- `status text not null default 'active'`
  values:
  - `active`
  - `inactive`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Recommended constraint posture:

- `user_id` references the authenticated user table with cascade delete
- `tier`, `source`, and `status` use bounded check constraints

Important simplification:

- do not add `effective_from` / `effective_until` in the first slice
- do not add plan-level or capability-level override rows

Reason:

- billing is not live
- scheduled future entitlement windows are not needed yet
- one current entitlement row is enough

### 2. `runner_capability_usage`

Purpose:

- count included metered usage such as the one Basic AI plan update

Recommended columns:

- `user_id uuid not null`
- `capability_key text not null`
- `period_key text not null default 'lifetime'`
- `used_count integer not null default 0`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Recommended key:

- composite primary key:
  - `(user_id, capability_key, period_key)`

Recommended constraint posture:

- `used_count >= 0`
- `capability_key` limited in code through the canonical registry

Important simplification:

- do not add separate allowance rows
- do not add invoice linkage
- do not add monthly reset logic

The first period model should be:

- `period_key = "lifetime"`

That is enough for the current Basic allowance story.

Default Rollout Behavior

The first slice must preserve the pre-billing default:

- all real users effectively resolve as `Pro`

Canonical resolution rule:

- if `runner_entitlements` row exists and is `active`, use it
- if no row exists, resolve the runner as:
  - `tier = pro`
  - `source = prebilling_default_pro`
  - `status = active`

Why this is the safest rollout:

- no backfill is required
- no current user is accidentally locked by a missed migration step
- the entitlement module can ship before any commercial enforcement exists

Important:

- the missing-row default must live in backend resolution code
- not in frontend assumptions

Backend Check API Shape

Add one small entitlement module family.

Recommended modules:

- `src/lib/entitlements/capability-registry.ts`
- `src/lib/entitlements/resolve-runner-entitlement.ts`
- `src/lib/entitlements/check-runner-capability.ts`
- `src/lib/entitlements/record-runner-capability-usage.ts`
- `src/lib/entitlements/types.ts`

Recommended canonical types:

```text
CapabilityKey =
  | "ai_plan_update"
  | "voice_to_plan"
  | "garmin_ai_interpretation"
```

```text
RunnerTier = "basic" | "pro"
```

```text
CapabilityCheckResult =
  | {
      allowed: true
      capabilityKey: CapabilityKey
      tier: RunnerTier
      source: string
      usage: null | {
        model: "metered_included"
        periodKey: string
        used: number
        limit: number
        remaining: number
      }
    }
  | {
      allowed: false
      reason: "capability_locked"
      capabilityKey: CapabilityKey
      tier: RunnerTier
      source: string
      requiredTier: "pro"
      message: string
      usage: null | {
        model: "metered_included"
        periodKey: string
        used: number
        limit: number
        remaining: number
      }
    }
```

Recommended functions:

- `resolveRunnerEntitlement(userId)`
- `checkRunnerCapability({ userId, capabilityKey })`
- `recordRunnerCapabilityUsage({ userId, capabilityKey, periodKey })`

Important simplification:

- do not create one giant policy engine
- keep the registry and check logic small and explicit

Capability Policy Registry

For the first slice, the registry should define only these three capability policies:

### `ai_plan_update`

- `basic`:
  - allowed while `remaining > 0`
- `pro`:
  - allowed
- usage model:
  - `metered_included`
- included allowance:
  - `1`
- period:
  - `lifetime`

### `voice_to_plan`

- `basic`:
  - locked
- `pro`:
  - allowed
- usage model:
  - `pro_only`

### `garmin_ai_interpretation`

- `basic`:
  - locked
- `pro`:
  - allowed
- usage model:
  - `pro_only`

Do not add a `core_saved_mode` capability in the first slice.

Reason:

- the current ask is specifically about future-proofing premium AI boundaries
- adding core capability keys now would broaden the system before needed

Usage Allowance Model

The product requirement is:

- `Basic` includes one AI-backed plan update

For the first concrete slice, define the counting boundary now even though current users still resolve to `Pro`.

Recommended counting rule:

- count usage on successful AI refresh proposal generation
- not on UI click
- not on proposal-open
- not on final apply

Why count at proposal generation:

- proposal generation is the first expensive AI action in the plan-update loop
- it already creates the user-visible AI output
- it avoids letting a future Basic user generate unlimited expensive proposals for free
- apply should complete the already-approved proposal, not consume a second unit

Therefore:

- `proposeActivePlanRefresh` is the metered action boundary for `ai_plan_update`
- `applyActivePlanRefreshProposal` should not decrement allowance again

What is checked now in the first rollout:

- all current no-row users resolve to `Pro`
- `checkRunnerCapability` therefore always allows the live AI seams unless a future explicit Basic override row exists
- no visible current user should hit a locked state accidentally

Graceful Locked-State Response Shape

When a backend action is not entitled, it must not throw a generic 500.

Recommended canonical response shape for server-action business results:

```text
{
  ok: false,
  reason: "capability_locked",
  capabilityKey: "ai_plan_update" | "voice_to_plan" | "garmin_ai_interpretation",
  requiredTier: "pro",
  currentTier: "basic" | "pro",
  message: string,
  usage: {
    model: "metered_included",
    used: number,
    limit: number,
    remaining: number,
    periodKey: "lifetime"
  } | null
}
```

Message guidance:

- `ai_plan_update`
  - explain that the included Basic update is already used
- `voice_to_plan`
  - explain that voice-to-plan is Pro
- `garmin_ai_interpretation`
  - explain that AI interpretation is Pro, while deterministic Garmin feedback remains available if that path is still allowed

Important boundary:

- locked responses must preserve deterministic or manual alternatives where those already exist

Current AI Seams To Wire First

### 1. `proposeActivePlanRefresh`

Capability:

- `ai_plan_update`

Behavior:

- run entitlement check before proposal generation
- if locked, return structured locked result
- if allowed and later running as `basic`, consume usage only after successful proposal generation

### 2. Garmin AI interpretation generation

Capability:

- `garmin_ai_interpretation`

Behavior:

- check capability before generating `workout_ai_insights`
- if locked, do not fail upload or deterministic comparison
- still persist:
  - uploaded asset
  - normalized actual metrics
  - deterministic comparison
- simply skip AI insight generation and return the deterministic feedback path only

This is critical:

- entitlement must not break Garmin evidence upload or deterministic comparison truth

### 3. Future voice-to-plan entry seam

Capability:

- `voice_to_plan`

Behavior:

- gate transcription or transcript-confirmation entry before expensive voice-processing work
- keep transcript text as the only payload that later enters the existing text authoring seam

Likely Files / Modules Involved

Add:

- `src/lib/entitlements/capability-registry.ts`
- `src/lib/entitlements/types.ts`
- `src/lib/entitlements/resolve-runner-entitlement.ts`
- `src/lib/entitlements/check-runner-capability.ts`
- `src/lib/entitlements/record-runner-capability-usage.ts`

Update:

- `src/lib/training-api.ts`
  - gate `proposeActivePlanRefresh`
  - reserve later hook point for future voice-to-plan server actions
- `src/lib/workout-result-import/ingest-garmin-result.ts`
  - gate AI interpretation generation only
- `src/lib/supabase/database.ts`
  - add generated table types for the new schema

Add migration:

- one new Supabase migration for:
  - `runner_entitlements`
  - `runner_capability_usage`

Future but not this slice:

- `src/lib/voice-authoring/*`

Migration Notes

This slice should be additive only.

Recommended migration behavior:

1. create `runner_entitlements`
2. create `runner_capability_usage`
3. do not backfill all current users
4. rely on backend missing-row default to `pro`

This keeps rollout safe because:

- no existing product row needs to change
- no existing user can be accidentally downgraded during migration

Rollback Notes

If the entitlement slice needs rollback:

- application rollback can simply stop calling the entitlement module
- the new tables can remain unused without harming saved-mode product truth
- because current rollout defaults missing rows to `Pro`, this slice should not create destructive data coupling

Do not build rollback around deleting runner rows or rewriting existing product data.

Validation Strategy

### Backend validation

- no-row authenticated runner resolves to:
  - `tier = pro`
  - `source = prebilling_default_pro`
- explicit `basic` row with no prior usage:
  - `ai_plan_update` allowed with `remaining = 1`
- after one successful usage increment for Basic:
  - `ai_plan_update` becomes locked with `remaining = 0`
- explicit `basic` row:
  - `voice_to_plan` locked
  - `garmin_ai_interpretation` locked
- explicit `pro` row:
  - all three capabilities allowed

### Product-path validation

- current live `Update plan` proposal flow stays available for ordinary current users
- Garmin FIT/ZIP upload plus deterministic comparison still works when Garmin AI interpretation is locked
- no current onboarding, logging, export, or deterministic saved-mode seam becomes gated by mistake

### Storage validation

- usage increments only after successful qualifying AI action
- repeated failed proposal generation does not consume usage
- repeated Garmin deterministic uploads do not create entitlement usage rows for `garmin_ai_interpretation`

Checklist

- [x] define canonical capability-key registry
- [x] add additive Supabase schema for entitlement rows
- [x] add additive Supabase schema for capability-usage rows
- [x] implement backend default resolution to `Pro` when no row exists
- [x] implement backend capability-check helper
- [x] implement backend usage-record helper for metered capabilities
- [x] wire `ai_plan_update` check into proposal generation seam
- [x] wire `garmin_ai_interpretation` check into Garmin AI generation seam only
- [x] keep all live users effectively `Pro`
- [x] verify locked-state result shape is structured and non-500

Exit Criteria

- one backend-owned entitlement resolution seam exists
- one canonical capability-key registry exists
- one additive usage-counter seam exists for metered capabilities
- current no-row users remain effectively `Pro`
- `ai_plan_update` can later enforce one included Basic use without redesign
- Garmin deterministic truth remains available independently from Garmin AI interpretation
- the voice-to-plan track has a clear entitlement hook before implementation starts

Next Recommended Role

QA

Suggested Next Step

Verify the pre-billing entitlement behavior against a real persisted account after applying the migration: no-row users remain effectively `Pro`, explicit Basic rows receive one included `ai_plan_update`, and locked Garmin AI interpretation still leaves upload plus deterministic comparison available.
