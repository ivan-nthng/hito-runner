# Phase 5 Final Legacy Removal Plan

## Status

Completed

## Owner

Architect

## Last Updated

2026-05-09

## Context

Phase 1 through Phase 4 are effectively complete, and the Phase 5 quarantine slices are now in place:

- `training-plan-v2` is the canonical file contract
- the deprecated `week_1_preview[]` support has been moved into dedicated compatibility helpers
- authenticated saved truth is Supabase-backed
- text-first authoring is the stable primary product path
- env aliases and deprecated local single-account env still exist only as compatibility value

The remaining problem is not feature completeness. It is removal discipline.

If the repo keeps:

- legacy `week_1_preview[]` import support
- Vite-era env aliases
- deprecated server-key aliases
- deprecated single-account local auth env

indefinitely, then the system will stay larger than necessary and future work will keep paying compatibility tax for no product benefit.

This plan defines the canonical final removal window and safe deletion sequence.

## Remaining Compatibility

### 1. Legacy import support

Current retained seams:

- [`src/lib/imported-plan-legacy.ts`](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/imported-plan-legacy.ts)
- [`src/lib/imported-plan.ts`](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/imported-plan.ts)
- [`scripts/lib/imported-plan-legacy-seed.mjs`](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/scripts/lib/imported-plan-legacy-seed.mjs)
- [`scripts/lib/imported-plan-seed.mjs`](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/scripts/lib/imported-plan-seed.mjs)

What remains:

- parser detection for `week_1_preview[]`
- deprecated compatibility schema
- deprecated summary/seed mapping
- legacy compatibility seed handling in CLI import tooling

Classification:

- explicit deprecated compatibility
- not canonical
- intended for removal, not indefinite quarantine

### 2. Env alias support

Current retained seams:

- [`src/lib/supabase/env.ts`](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/supabase/env.ts)
- [`.env.example`](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/.env.example)
- scripts still reading compatibility env names:
  - [`scripts/test-user.mjs`](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/scripts/test-user.mjs)
  - [`scripts/author-plan-from-text.mjs`](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/scripts/author-plan-from-text.mjs)
  - [`scripts/author-structured-plan.mjs`](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/scripts/author-structured-plan.mjs)
  - [`scripts/import-current-plan.mjs`](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/scripts/import-current-plan.mjs)

What remains:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Classification:

- deprecated compatibility only
- should be removed after one explicit removal window closes

### 3. Local dev-only auth compatibility

Current retained seams:

- [`src/lib/local-auth.ts`](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/local-auth.ts)
- [`src/lib/supabase/env.ts`](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/supabase/env.ts)
- [`scripts/test-user.mjs`](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/scripts/test-user.mjs)
- [`.env.example`](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/.env.example)

What remains:

- deprecated single-account local bypass env:
  - `LOCAL_AUTH_BYPASS_IDENTIFIER`
  - `LOCAL_AUTH_BYPASS_PASSWORD`
  - `LOCAL_AUTH_BYPASS_EMAIL`
  - `LOCAL_AUTH_BYPASS_USER_ID`

Canonical replacement that already exists:

- `LOCAL_AUTH_BYPASS_ACCOUNTS_FILE`

Classification:

- dev-only compatibility
- removal target after local teams confirm the accounts-file path is the only needed local setup

### 4. Testing and tooling compatibility

Current retained seams:

- legacy fallback reads in [`scripts/test-user.mjs`](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/scripts/test-user.mjs)
- legacy seed support in script-side import helpers

What remains:

- test-user tool still protects the older primary admin identity shape
- CLI paths still accept legacy import/env compatibility so older local setups do not break immediately

Classification:

- short-lived operational compatibility
- should not become a permanent tooling framework

## Removal Readiness Criteria

## Criteria For Removing `week_1_preview[]`

Legacy `week_1_preview[]` can be removed only when all of the following are true:

1. `training-plan-v2` is the only template referenced in:
   - visible onboarding/import copy
   - saved-mode advanced import copy
   - docs that describe the active product contract
2. QA-green confirms:
   - text-first onboarding is stable
   - advanced `training-plan-v2` import works end to end
   - replacement continuity guard still works with the canonical file contract
3. Ops tooling can seed, create, reset, and import plans without any dependency on `week_1_preview[]`.
4. No active local or documented workflow still points people to `/Users/ivan/Desktop/corrected_half_marathon_start_2026-05-05.json` or any other legacy-shape file as a normal path.
5. A final removal notice has been reflected in:
   - `docs/current-system.md`
   - `docs/current-product.md`
   - `.env.example` or relevant docs where import guidance lives

Evidence threshold:

- one explicit QA pass on the canonical v2 import path
- one explicit Backend/ops confirmation that no current command or tester workflow still needs legacy shape support

## Criteria For Removing Env Aliases

Env alias compatibility can be removed when all of the following are true:

1. Local `.env.local` and deployment env usage are confirmed to use only:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY`
2. No active script or runtime helper still documents Vite-era names as a normal setup path.
3. One local clean-start verification succeeds using only canonical env names.
4. One deploy-like verification succeeds using only canonical env names.

Evidence threshold:

- green local startup and auth flow with canonical env only
- green CLI tooling run with canonical env only
- no remaining docs that teach alias usage as anything more than legacy history

## Criteria For Removing Deprecated Single-Account Local Auth Env

The deprecated single-account local auth env can be removed when all of the following are true:

1. Loopback local development is green using only `LOCAL_AUTH_BYPASS_ACCOUNTS_FILE`.
2. `scripts/test-user.mjs` and related tooling no longer need to protect or materialize the older single-account shape.
3. The team confirms no maintained local setup still depends on:
   - `LOCAL_AUTH_BYPASS_IDENTIFIER`
   - `LOCAL_AUTH_BYPASS_PASSWORD`
   - `LOCAL_AUTH_BYPASS_EMAIL`
   - `LOCAL_AUTH_BYPASS_USER_ID`

Evidence threshold:

- one explicit local developer verification on a fresh setup
- one tester lifecycle run using only accounts-file-based local bypass

## Deletion Targets

### Delete when ready

- `src/lib/imported-plan-legacy.ts`
- legacy import branch references inside `src/lib/imported-plan.ts`
- `scripts/lib/imported-plan-legacy-seed.mjs`
- legacy import branch references inside `scripts/lib/imported-plan-seed.mjs`
- `.env.example` entries for:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - deprecated single-account local auth env
- alias fallback reads in:
  - `src/lib/supabase/env.ts`
  - `scripts/test-user.mjs`
  - `scripts/author-plan-from-text.mjs`
  - `scripts/author-structured-plan.mjs`
  - `scripts/import-current-plan.mjs`

### Keep longer

- `LOCAL_AUTH_BYPASS_ACCOUNTS_FILE`
  - reason:
    - still useful as a bounded loopback-only dev bridge while real email auth is intentionally paused locally
- loopback-only local auth runtime guard in `src/lib/local-auth.ts`
  - reason:
    - separate concern from env alias cleanup
    - still supports local development without reintroducing deploy-visible legacy

### Prefer deletion over indefinite quarantine

The following must not become permanent:

- legacy `week_1_preview[]` parser support
- Vite-era env aliases
- deprecated service-role alias
- deprecated single-account local bypass env

## Do Not Delete Yet

- do not delete loopback-only local auth compatibility yet
  - reason:
    - this plan is about final compatibility cleanup for legacy import and env leftovers, not the full removal of the local dev bypass itself
- do not delete `LOCAL_AUTH_BYPASS_ACCOUNTS_FILE` support yet
  - reason:
    - it is still the bounded canonical local dev bridge
- do not delete `training-plan-v2` advanced import tooling
  - reason:
    - advanced import still has valid migration/testing/ops value

## Smallest Viable First Deletion Slice

Remove Vite-era Supabase env aliases first:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Why this is the best first slice:

- smallest blast radius
- highest clarity gain
- product behavior does not depend on them
- they are already clearly deprecated
- removal pressure will expose any lingering local env drift quickly

This first slice should include:

- runtime env helper cleanup
- script env helper cleanup where applicable
- `.env.example` cleanup
- docs cleanup so canonical env names are the only documented path

Step 1 is now implemented:

- active runtime support for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` has been deleted
- CLI tooling now reads only `NEXT_PUBLIC_SUPABASE_URL` for the browser-facing Supabase URL contract
- `.env.example` and active implemented-behavior docs now teach only the canonical `NEXT_PUBLIC_*` browser env names

## Removal Sequence

### Step 1 — Remove Vite-era public env aliases

- goal:
  - make `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` the only public Supabase env contract
- status:
  - completed on 2026-05-09
- dependency:
  - canonical env verification on local and deploy-like runtime
- risk:
  - low to medium
  - old local env files may stop working
- rollback posture:
  - restore alias reads in one focused revert if local setup breaks unexpectedly
- next likely role:
  - `BACKEND`

### Step 2 — Remove deprecated server-key alias

- goal:
  - make `SUPABASE_SECRET_KEY` the only server write/admin key contract
- status:
  - completed on 2026-05-09
- dependency:
  - Step 1 complete
  - scripts and runtime verified against canonical key only
- risk:
  - medium
  - older local ops scripts or deploy secrets may still use `SUPABASE_SERVICE_ROLE_KEY`
- rollback posture:
  - re-add the fallback alias in one focused env helper revert if needed
- next likely role:
  - `BACKEND`

Step 2 is now implemented:

- active runtime support for `SUPABASE_SERVICE_ROLE_KEY` has been deleted
- active CLI tooling now reads only `SUPABASE_SECRET_KEY` for server-side Supabase admin/write access
- `.env.example` and active implemented-behavior docs now teach only `SUPABASE_SECRET_KEY` as the server-side Supabase key contract

### Step 3 — Remove deprecated single-account local auth env

- goal:
  - make `LOCAL_AUTH_BYPASS_ACCOUNTS_FILE` the only supported local bypass input
- status:
  - completed on 2026-05-09
- dependency:
  - local dev verification using only accounts-file setup
  - tester lifecycle tool green on canonical path
- risk:
  - medium
  - one or more local machines may still rely on the single-account env
- rollback posture:
  - restore deprecated env reads only if fresh local setup proof was incomplete
- next likely role:
  - `BACKEND`

Step 3 is now implemented:

- active runtime support for `LOCAL_AUTH_BYPASS_IDENTIFIER`, `LOCAL_AUTH_BYPASS_PASSWORD`, `LOCAL_AUTH_BYPASS_EMAIL`, and `LOCAL_AUTH_BYPASS_USER_ID` has been deleted
- local tooling now reads canonical local bypass identity only from the accounts file path
- `.env.example` and active local-ops docs now teach only `LOCAL_AUTH_BYPASS_ACCOUNTS_FILE` as the local bypass input contract

### Step 4 — Remove `week_1_preview[]` compatibility from runtime import seam

- goal:
  - make `training-plan-v2` the only accepted file contract in the active runtime import seam
- dependency:
  - Step 1 through Step 3 complete
  - explicit readiness criteria for legacy import removal satisfied
- risk:
  - medium to high
  - older test fixtures and manual import habits may fail immediately
- rollback posture:
  - keep the legacy helper file in version history only
  - if emergency rollback is needed, restore only the isolated compatibility module, not a broader mixed-path implementation
- next likely role:
  - `BACKEND`

Step 4 is now implemented:

- the active runtime import seam accepts only `training-plan-v2`
- deprecated `week_1_preview[]` detection, parsing, summary shaping, and seed mapping have been removed from `src/lib/imported-plan.ts`
- `src/lib/imported-plan-legacy.ts` has been deleted
- legacy files now fail truthfully with an explicit migration message instead of silently entering a compatibility branch

### Step 5 — Remove `week_1_preview[]` compatibility from script/tooling seam

- goal:
  - eliminate legacy seed handling from CLI import tooling and tester workflows
- dependency:
  - Step 4 complete
  - no active operational workflow uses legacy files
- risk:
  - medium
  - script-based migration/testing can fail if hidden fixtures still rely on old shape
- rollback posture:
  - restore script-side compatibility only if a real current ops dependency was missed
- next likely role:
  - `BACKEND`

Step 5 is now implemented:

- active CLI import tooling now accepts only `training-plan-v2`
- `scripts/lib/imported-plan-legacy-seed.mjs` has been deleted
- script defaults and import helpers no longer point to legacy fixtures or accept the old shape

### Step 6 — Clean docs and declare the removal window closed

- goal:
  - remove deprecated compatibility references from active docs and examples
- dependency:
  - all prior steps complete
- risk:
  - low
- rollback posture:
  - docs-only revert if necessary
- next likely role:
  - `ARCHITECT`

Step 6 is now implemented:

- active product/system/state docs now describe `training-plan-v2` as the only import contract
- advanced import UI copy no longer presents legacy compatibility as a live option
- the final Phase 5 legacy-removal window is now effectively closed

## Product/Ops Implications

### Normal users

What changes:

- nothing in the primary product path
- text-first onboarding remains unchanged
- saved mode remains unchanged

Why:

- normal users are no longer expected to author or upload legacy JSON

### Advanced import users

What changes:

- `training-plan-v2` becomes the only supported file format
- older `week_1_preview[]` files must be migrated before import

Why:

- the advanced path should still exist
- but it should have one canonical contract, not two

### Local developers

What changes:

- canonical env names become mandatory
- accounts-file-based local bypass becomes the only supported local bypass input once Step 3 is complete

Why:

- fewer env modes means fewer local setup surprises

### Test-user / ops tooling

What changes:

- tooling must use canonical env names only
- tooling must seed/import canonical `training-plan-v2` only
- hidden legacy fixture habits must stop

Why:

- tooling should reinforce the canonical system, not preserve older contracts indefinitely

## Anti-overengineering

- do not build a permanent compatibility registry
- do not add a feature flag framework just to keep old import/env modes around longer
- do not create a generic migration subsystem for one deprecated JSON shape
- do not preserve compatibility because “someone might still use it someday”

Canonical rule:

When the replacement path is stable and QA-green, removal is better than quarantine.

## Risks

- a local machine may still depend on deprecated env names
- a hidden script or fixture may still depend on `week_1_preview[]`
- removing script-side compatibility before runtime/docs are aligned can create confusing mixed-state failure
- removing local single-account env compatibility before accounts-file verification is complete can slow down local testing unnecessarily

## Exit Criteria

- `training-plan-v2` is the only supported import contract in runtime and tooling
- Vite-era env aliases are gone
- deprecated server-key alias is gone
- deprecated single-account local auth env is gone
- `.env.example` documents only canonical active env contracts plus the still-supported loopback accounts-file path
- active docs no longer describe `week_1_preview[]` as a live compatibility path
- the repo has fewer compatibility seams than it has on 2026-05-09

## Next Recommended Role

QA

## Suggested Next Step

Run one final Safari pass on the canonical `training-plan-v2` advanced import flow and the text-first onboarding flow, then archive this completed Phase 5 removal plan.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Completed the final Phase 5 legacy-removal window for `hito-running`, deleting deprecated `week_1_preview[]` compatibility, env alias cleanup leftovers, and deprecated single-account local auth env so the active canonical contracts are now singular.

### Key Decisions

- `training-plan-v2` is now the only supported file import contract.
- Vite-era env aliases and deprecated server-key aliases are now deleted from the active contract.
- Deprecated single-account local auth env has been removed after accounts-file-based local bypass verification.
- Local loopback auth compatibility itself is not the first deletion target in this plan.

### Current State

- Legacy import support is deleted from active runtime and tooling.
- Env aliases and deprecated local auth env are deleted from the active contract.
- Product-visible flow remains stable on text-first authoring, canonical `training-plan-v2` advanced import, and Supabase-backed saved truth.

### Constraints

- Do not preserve compatibility indefinitely.
- Prefer deletion over permanent quarantine.
- Keep one canonical import contract and one canonical env contract.
- Do not remove the loopback-only local dev bridge yet.

### Risks / Open Questions

- The loopback-only local bypass still remains as a bounded dev bridge and is outside this completed removal track.
- Older local notes or fixtures outside the repo may still reference deleted legacy contracts and would need manual migration if reused.

### Next Recommended Role

QA

### Suggested Next Step

Run one final canonical-only advanced-import QA pass in Safari, then archive this completed plan and treat any later loopback-bypass removal as a separate cleanup track.
```
