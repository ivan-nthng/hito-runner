# Hito Financial And Commercial Source-Of-Truth Audit

Work Item ID: `2026-08-15-hito-financial-and-commercial-source-of-truth-audit`
Status: completed
Type: Tracked
Priority: high
Owner: ARCHITECT
Epic: commercial-financial-foundation
Scope: Read-only architecture audit of financial facts, commercial grants, Admin readback, and
local-fixture isolation. No production implementation.
Archive Intent: Retain as the source boundary for the first Backend slices; compact after those
slices have accepted contracts and their own evidence.
Parent: [Admin Overview, Financial Model, And QA Fixture Redesign](./2026-08-15-hito-admin-overview-information-architecture-and-qa-fixture-redesign-intake.md)
Evidence From: [Paid Plans, Usage Credits, And Cost Attribution](./2026-08-15-hito-paid-plans-usage-credits-and-cost-attribution.md)

## Outcome

Hito needs four independent authorities. Existing Admin Analytics can continue to own product
health readback, but it cannot own financial actuals, commercial grant history, or forecasts.
`runner_entitlements` may inform a transition projection, but its single mutable Basic/Pro row is
not a safe commercial authority. The first recommended implementation is a small BACKEND financial-
fact history slice for manually sourced expenses and cash/receipt events, after PRODUCT accepts the
listed financial conventions. Commercial grants follow as a separate serial Backend slice.

No runtime, schema, migration, RLS, auth, fixture, provider, hosted, browser, build, Git, or release
state changed in this audit.

## Execution Preflight

- **Mode and owner:** Tracked, ARCHITECT-owned discovery. The canonical item is the only writable
  seam.
- **Evidence:** current Admin Analytics, entitlement/capability schema, AI preview/confirm and local
  generation trace, QA identity lifecycle, parent financial intake, and commercial intake.
- **Existing seam reused:** the current canonical item and existing Backend source boundaries. New
  runtime artifacts are `none`.
- **Dirty boundary:** two immediate pre-write `git status --porcelain=v1 -z` snapshots matched at
  SHA-256 `36e52d69094f3be8d149b7bfd91f2735145823382d1fd043609a1ad4a561aab6`.
  Concurrent source and documentation work remained outside this item.
- **Release safety:** the current documentation release receipt is terminal. No active release
  candidate freeze admitted this file.
- **Proof:** source-backed ownership map, fresh source hashes, scoped Markdown/link/whitespace
  hygiene. Runtime and acceptance layers are explicitly omitted.

## Architecture Decision

The future Owner Console reads four non-overlapping truth classes through Backend-owned projections:

| Concern                           | Canonical authority                                                                                | Reusable current seam                                                                            | Boundary that must remain separate                                                       |
| --------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Product facts                     | Existing Hito product tables plus Backend Admin read model                                         | `admin-analytics.server.ts`, canonical profile/plan/workout/log rows, and authenticated identity | Counts do not prove commercial status, revenue, cash, or historical point-in-time state  |
| Durable financial facts           | A new minimal Backend-owned history of attributable money facts and cadence-aware operator sources | Admin server-function/read-model pattern only; no current finance persistence exists             | Never derive receipt, revenue, fee, refund, tax, or cash from entitlement or forecast    |
| Commercial entitlement and grants | A new durable grant history plus an effective-access projection                                    | Current entitlement table is transition evidence; current Auth identity is the subject boundary  | Billing is an input to a paid grant, not Hito's grant store; access is not cash evidence |
| Forecast scenarios                | A separate scenario calculation over an explicit actuals snapshot                                  | Existing Backend-shaped Admin route can later consume output                                     | A scenario never creates, edits, reconciles, or supersedes an actual or grant            |

This is one Owner Console read composition, not one shared ledger. Product facts, money facts, grants,
and scenarios keep different provenance and lifecycle rules even if one Admin response later joins
their projections.

## Demonstrated Current State

### Admin Analytics And Identity

- [`admin-analytics.server.ts`](../../../src/lib/admin-analytics.server.ts) is the Backend read owner
  for `/admin/analytics`. It loads Auth users and canonical product rows, classifies identities,
  removes non-real users before aggregation, and returns one generated-at snapshot.
- [`admin-analytics.ts`](../../../src/lib/admin-analytics.ts) exposes product/account activation,
  plan, workout, Garmin, entitlement, capability-usage, exclusion, and per-user fields only.
  There are no money, billing, subscription, receipt, expense, cash, currency, reconciliation, or
  forecast fields.
- [`admin-user-classification.ts`](../../../src/lib/admin-user-classification.ts) treats explicit
  local/Auth metadata as authoritative for admin/test classification, but it also uses email
  domain/prefix heuristics as `suspected_test`. That heuristic is useful for review; it is not a
  sufficient financial exclusion authority.
- Current Admin queries aggregate all rows at request time. `generatedAt` dates the read, not the
  underlying membership of a historical cohort. Historical user/subscription charts therefore need
  dated source events or an attributable snapshot contract; current totals cannot be backfilled as
  historical facts.

### Entitlement And Usage

- [`20260518183000_basic_pro_entitlement_foundation.sql`](../../../supabase/migrations/20260518183000_basic_pro_entitlement_foundation.sql)
  stores one row per user with `basic|pro`, one source, and `active|inactive`. It has no grant ID,
  granting actor/reason, effective interval, explicit no-expiry semantics, revocation history,
  external subscription reference, or fixture dataset scope.
- A missing entitlement row currently projects as effective Pro in Admin. Missing data is therefore
  intentionally permissive pre-billing behavior, not evidence of Free, Premium, a subscription, or
  a complimentary lifetime grant.
- `runner_capability_usage` is only a mutable aggregate `used_count` by user/capability/period. A
  repository source scan found no production AI-generation writer. It cannot prove an operation,
  reservation, reversal, grant, balance, provider usage, cost, money, or expiry.
- One mutable entitlement row cannot preserve overlapping paid, lifetime, and promotional sources or
  their history. A durable multi-grant invariant is required; `runner_entitlements` may remain only
  as an explicitly transitional projection until the owning Backend migration removes or redefines
  that responsibility.

### AI Generation And Cost Evidence

- [`running-plan-engine-actions.ts`](../../../src/lib/running-plan-engine-actions.ts) allows preview
  to enter the cost-bearing generation path without a persisted user. Confirmation requires a
  persisted authenticated user and applies the already reviewed draft without another provider call.
- [`ai-plan-generation-ledger.ts`](../../../src/lib/ai-plan-generation-ledger.ts) records provider,
  model, response, token counts, outcome, and sanitized hashes in local runtime observability. Its
  artifacts archive after the three-day active window and carry no durable user, billing, balance,
  or finance authority.
- The trace is useful implementation evidence for designing a later durable operation/cost record.
  It must not be imported wholesale or relabeled as actual provider cost. Token counts do not prove
  an invoice, applied price version, settlement currency, or cash payment.

### QA Fixture And Cleanup

- [`qa-test-user-lifecycle.mjs`](../../../scripts/lib/qa-test-user-lifecycle.mjs) owns a named reusable
  local tester pool, explicit Auth metadata, leases, deterministic reset, and cleanup of current
  user-owned tables.
- [`test-user-lifecycle.md`](../../process/test-user-lifecycle.md) correctly states that Auth
  metadata, not an email pattern, proves tester eligibility. The Admin heuristic is therefore a
  diagnostic fallback, not the canonical fixture discriminator.
- The lifecycle currently knows entitlement and capability-usage rows, but no financial or grant
  history tables exist. Future task-owned tables must be admitted to cleanup atomically with their
  Backend slice; the current cleanup list cannot be assumed to cover them.

## P0 Source Map

| Fact or output                    | Current owner/evidence                                           | Minimum truthful contract                                                                                                                | Current gap and reuse decision                                                             |
| --------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Auth identity                     | Supabase Auth through existing Backend auth                      | Stable persisted user ID; explicit admin/test metadata                                                                                   | Reuse as subject identity, not as customer/payment truth                                   |
| Runner/profile/plan/workout facts | Existing canonical product tables and Admin server read          | Dated row/event or explicit as-of snapshot, source owner, exclusion result                                                               | Reuse; current point-in-time totals alone cannot own history                               |
| AI generation operation           | Preview/confirm path and expiring local trace                    | Stable authenticated operation ID, terminal outcome, fixture/paid-provider class, timestamps                                             | Current trace is diagnostic and may be absent/anonymous; new durable operation slice later |
| Provider usage/cost               | Local trace has optional tokens/provider response                | Provider receipt or approved price-version derivation, currency, operation link, reconciliation state                                    | Not an actual today; reuse trace shape only as design evidence                             |
| Effective access                  | Current missing-row-to-Pro readback and optional entitlement row | Backend projection over baseline policy plus all effective grants                                                                        | Current behavior is pre-billing fallback and must not become commercial truth              |
| Complimentary lifetime Premium    | Product decision only                                            | Explicit grant kind, subject, effective date, `no_expiry`, actor/reason, lifecycle history                                               | Absent; requires durable grant history                                                     |
| Paid subscription access          | No provider or billing source                                    | Provider-neutral external authority reference and effective grant; receipt remains separate                                              | Absent; do not choose or simulate a provider                                               |
| Time-limited promotion            | Current entitlement source enum only                             | Explicit grant with effective/expiry interval, actor/reason, status history                                                              | Current row loses interval and overlapping history                                         |
| Expense actual                    | No runtime owner                                                 | Dated/cadence-aware amount in source currency, category, provenance, truth/reconciliation state                                          | New Backend financial-fact history; Admin pattern only is reusable                         |
| Customer receipt/cash             | No runtime owner                                                 | Gross amount, source currency, payment date, payer/customer link when known, fees/refunds/tax as separate attributable facts, provenance | New Backend financial-fact history; never infer from access                                |
| Recognized revenue                | No accounting/service-period authority                           | Explicit recognition policy and service period over attributable receipt/invoice facts                                                   | Unavailable until Product accepts policy and evidence exists                               |
| Cash balance/movement             | No bank/accounting source                                        | Dated attributable opening balance or movement, restricted/unrestricted class, reconciliation state                                      | New sourced fact; absence is `not_configured`, not zero                                    |
| Cross-currency total              | No FX/base-currency policy                                       | Source currency retained; accepted FX source/rate/effective date and derivation version                                                  | Group by source currency or return unavailable until Product decides                       |
| Forecast output                   | Product specification only                                       | Scenario ID, as-of actuals snapshot, horizon, assumptions, formula version, calculated timestamp                                         | Separate future slice; persistence policy unresolved                                       |

## Minimum Durable Financial-Fact Contract

This is an invariant set, not a table or migration design.

1. Every actual-capable record has a stable identity, dataset scope, fact kind, source owner/type and
   reference, source amount and currency, the relevant economic/payment date, optional service
   period, creation actor/time, and current reconciliation/truth class.
2. Expenses, customer collections, refunds, processor fees, remitted tax, financing, and cash
   movements remain distinct fact kinds. Net revenue, net collections, burn, and runway are derived
   projections with formula/input versions, never mutable input rows.
3. Corrections and voids preserve the superseded record and point to it; imports supplement or
   reconcile operator entries and do not silently overwrite their provenance.
4. A recurring operator expense is one cadence-aware source with effective dates. Monthly chart
   occurrences are marked derivations linked to that source, not twelve copied actuals.
5. `observed_reconciled`, `observed_unreconciled`, `operator_input`, `derived`, and `unavailable`
   stay distinguishable. A zero chart point is emitted only when an authoritative source proves zero
   for that period; missing coverage emits its reason and coverage state.
6. Source currency is always preserved. Until base currency and FX policy are accepted, cross-
   currency totals are unavailable or grouped by source currency; no implicit conversion is allowed.
7. Historical chart points expose period, fact/derivation class, source coverage, freshness, and
   reconciliation state. Partial coverage cannot be styled or aggregated as a complete actual.

## Minimum Commercial Grant Contract

| Identity state                 | Required authority                                               | Invariant                                                                                                                                                                        |
| ------------------------------ | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Free                           | Accepted baseline access policy evaluated by Backend             | No effective premium grant resolves to explicit `free` only after a successful authority read; read failure/missing policy is unavailable, not Free                              |
| Complimentary lifetime Premium | Durable Hito grant                                               | Explicit `complimentary_lifetime` kind, effective date, no-expiry policy, granting actor/reason, and auditable revoke/transition event; no subscription or receipt is fabricated |
| Future paid subscription       | External commercial authority plus durable Hito grant/projection | Provider-neutral external reference, effective interval/status, replay-safe transition; payment/settlement facts remain financial inputs                                         |
| Promotion                      | Durable Hito grant                                               | Explicit campaign/reason and bounded effective/expiry interval; never represented as lifetime through a null accident                                                            |
| Test/QA identity               | Explicit fixture metadata plus synthetic dataset scope           | Synthetic grants may exercise behavior, but never produce a real customer, paid user, revenue, receipt, cost, or conversion fact                                                 |

Multiple grants may overlap. Effective Premium is a deterministic Backend projection over active
grants; grant history is not overwritten when the winning source changes. Revocation ends authority
without deleting its provenance. Allowances, operation charging, renewal, and refund behavior are
later contracts and are not hidden inside this access foundation.

## Fixture Isolation Contract

1. Synthetic runner identities retain explicit Auth fixture metadata and a deterministic pool role.
   Email patterns remain diagnostics only.
2. Every synthetic financial, grant, operation, and scenario record carries an explicit synthetic
   dataset scope and deterministic dataset identity. A fake owner is valid only inside that scope.
3. Production/business read models filter to the real dataset scope before aggregation. Excluding
   rows after a total is computed is forbidden.
4. Synthetic financial facts never reconcile against real provider/payment references. Fixture
   provider modes and costs are labeled synthetic even when their numerical shape resembles actuals.
5. Fixture cleanup owns every row created by a scenario, proves zero task-owned rows after reset,
   and cannot delete an unclassified or real identity. New tables and cleanup support ship in the
   same Backend slice.
6. Real Admin views may expose excluded-row diagnostics, but excluded rows never contribute to user,
   customer, paid/free, receipt, revenue, cost, margin, CAC, or cash denominators.

## Forecast Isolation Contract

- A forecast starts from an immutable explicit `as_of` actuals projection and records its source
  coverage. Missing actuals stay missing; a scenario may supply a labeled assumption but cannot
  backfill history.
- Scenario assumptions and derived monthly outputs have their own identity and formula version.
  Calculation reads actuals and never writes to financial facts, grants, billing, or another
  scenario.
- Scenario persistence is deferred. Until PRODUCT accepts it, Backend work may define pure input and
  output contracts but must not add scenario storage.
- Forecast revenue, cash, paid users, and costs are never returned under actual/reconciled labels.

## Recommended Serial Backend Decomposition

PRODUCT accepts each slice's unresolved decisions and creates one canonical child item before
dispatch. The slices serialize because they touch shared identity, persistence, Admin readback, or
fixture cleanup.

| Order and owner                                                           | Existing seam and smallest change                                                                                                                                    | Required invariant and evidence                                                                                                                                                                                                | Persistence risk and non-goals                                                                                                                               |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1. BACKEND — manual financial-fact history (recommended first)**        | Reuse Supabase migration/RLS conventions and Backend server read/write patterns; add only the accepted expense and cash/receipt source facts plus task-owned cleanup | Provenance, source currency, dates/cadence, truth/reconciliation state, correction history, real/synthetic scope; RLS/authority proof, deterministic CRUD/readback, missing-vs-zero, recurrence, correction, and cleanup cases | New durable money data is high risk. No forecast, formula catalog, provider import, subscription, recognized-revenue inference, Admin UI, or hosted mutation |
| **2. BACKEND — actuals projection and historical read model**             | Compose accepted financial facts with existing product facts behind a Backend Admin contract                                                                         | Dated points, coverage/freshness, formula/input versions, source-currency grouping, exclusions before aggregation; fixtures for partial, zero, unavailable, and conflicting facts                                              | Avoid materialized duplicate truth. No client formulas, forecast storage, or MRR without billing evidence                                                    |
| **3. BACKEND — commercial grant history and effective-access projection** | Transition from `runner_entitlements` and its consumers; keep Auth as subject identity                                                                               | Explicit Free result, lifetime no-expiry grant, bounded promotion, provider-neutral paid grant, overlap/revocation history, replay safety, fixture isolation; migration/readback/RLS/current-user transition proof             | Existing missing-row-to-Pro behavior makes migration high risk. No checkout, allowance, credits, billing receipt, price, or provider selection               |
| **4. BACKEND — authenticated AI operation and usage/cost evidence**       | Reuse preview/confirm boundary and the diagnostic trace shape without treating local artifacts as truth                                                              | Stable user/operation identity before paid call, idempotent terminal states, confirm causes no second charge, fixture/provider separation, attributable token/price-version evidence                                           | Requires Product's charged capability and failure/settlement policy. No public price, allowance balance, or invoice claim                                    |
| **5. BACKEND — allowance/grant-operation ledger**                         | Build on accepted grants and operations; retire or explicitly reduce aggregate `runner_capability_usage` responsibility                                              | Grant/reserve/release/settle/reverse history and exact projection; concurrency, retry, renewal, expiry, downgrade, and cleanup proof                                                                                           | Requires exact allowance, reset/rollover, spend order, refund, and transition decisions. No provider checkout                                                |
| **6. BACKEND/authorized integration — billing and settlement ingestion**  | Connect a separately selected provider to grants and financial facts through replay-safe Backend ingestion                                                           | External event identity, signature/authority, ordering/replay, invoice/settlement/refund/fee reconciliation, secrets boundary                                                                                                  | Provider, markets, tax/legal treatment, hosted credentials, and paid test inventory need separate explicit authority                                         |
| **7. BACKEND — forecast calculation and optional storage**                | Read the actuals projection through an explicit as-of boundary                                                                                                       | Scenario isolation, custom horizon, formula versions, denominator/missing cases, byte-stable actuals                                                                                                                           | Persistence waits for Product policy; no mutation of facts, grants, or billing                                                                               |

### Why Slice 1 Is First

The accepted first financial scope is durable expenses and revenue/cash history, and it does not
depend on a payment provider, public price, or allowance. It creates the minimum factual substrate
for the Owner Console and future reconciliation while preventing entitlement from becoming a revenue
proxy. Commercial grants are second because current-user transition and revocation policy remain
unresolved and the present missing-row-to-Pro fallback makes an immediate entitlement migration more
dangerous.

## Exact Product Decisions Before Dispatch

PRODUCT must return to Ivan for the following choices; this audit does not make them:

1. **Before Slice 1:** base currency; timezone/month-close convention; initial expense and cash/
   receipt categories and source rows; whether each manual receipt is an unreconciled cash fact only
   or also has an accepted service-period revenue treatment; tax display/treatment; correction and
   reconciliation authority; first real versus synthetic dataset boundary.
2. **Before Slice 3:** which existing users receive complimentary lifetime Premium; effective date;
   granting actor/reason vocabulary; revocation/transfer policy; default Free transition; behavior
   for current explicit Basic/Pro/inactive rows.
3. **Before Slices 4-5:** first charged capability, exact included allowance, settlement/failure/
   refund matrix, renewal/reset/rollover/spend order, downgrade/cancellation behavior, and current
   unauthenticated preview transition.
4. **Before Slice 6:** payment provider, markets, public price/package, tax/refund/legal policy,
   hosted authority, and bounded paid test inventory.
5. **Before Slice 7:** scenario-persistence policy, first horizon, break-even target, and accepted
   formula/assumption ownership.

The provider, public price, tax policy, base currency, exact allowance, and scenario-persistence
policy remain explicitly undecided.

## Fresh Source Hashes

Captured immediately before the task-owned write from the current dirty but stable worktree:

| Source seam                                                               | SHA-256                                                            |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `src/lib/admin-analytics.ts`                                              | `cfbc76aeace1d3f7baa4d324f6a8671660027e23da5ffe66668ce21524a5d15c` |
| `src/lib/admin-analytics.server.ts`                                       | `ec598c465af6f50443f5ce858c2fd0a8e4db3bdf68c9f8032e220320c053bb4f` |
| `src/lib/admin-user-classification.ts`                                    | `224567dfb14c95e7615bddfa85a1c031cf30ca8e127385de43ec8d57ff6f3154` |
| `supabase/migrations/20260518183000_basic_pro_entitlement_foundation.sql` | `b283d56ac50b3031267557cbed77c943f25f3b968aec3ea0cdbe9735644c366c` |
| `src/lib/supabase/database.ts`                                            | `0cd8d960ce1cb8ece6c99aee540710c3fc500f71b12c2040de7ac32036853bf0` |
| `src/lib/running-plan-engine-actions.ts`                                  | `afefc0827e818fd19131de1bfc57af5add85307a40d6da40b42edcda8b537f04` |
| `src/lib/ai-plan-generation-ledger.ts`                                    | `188edf373f53fc5c62d0fb6a04b53ee17fccde9336f8a6aaffb3cf42e704082e` |
| `src/lib/ai-first-plan-draft-service.ts`                                  | `7f78c4e362eda531d175b17a4de2a856eeaacd901088807e001a43acff5c1116` |
| `scripts/lib/qa-test-user-lifecycle.mjs`                                  | `8caa56124a04c3fade31ac9adfb63b540f68c7006e88cadd7c8018ca3b9f1836` |
| `scripts/test-user.mjs`                                                   | `ae2edd74c2fcf9efc13bfd0e36081b322d590cdb641de5f8c57a8dcffce04203` |
| `docs/process/test-user-lifecycle.md`                                     | `9d2e0047b86efc6735195eb896f607bf6a629d3445bb19773f376e08a9f14560` |

## Validation And Coverage

| Check                        | Scenario / environment                                                                                   | Result | Evidence                                                                                      |
| ---------------------------- | -------------------------------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| Instruction and context read | AGENTS, ARCHITECT role, architecture skill, canonical item, plan, parent, evidence                       | Passed | Complete bounded reads through EOF                                                            |
| Current-source ownership map | Admin, identity, entitlement, usage, AI preview/trace, QA lifecycle                                      | Passed | Direct source inspection and repository reachability searches                                 |
| Financial-runtime absence    | Runtime/schema/script search for billing, payment, cash, revenue, currency, expense, and forecast owners | Passed | No financial owner found; only the pre-billing entitlement migration matched commercial terms |
| Dirty-boundary stability     | Two immediate full status snapshots before write                                                         | Passed | Matching SHA-256 `36e52d...`                                                                  |
| Scoped formatting            | This canonical item                                                                                      | Passed | Prettier write plus check                                                                     |
| Local Markdown links         | Changed item                                                                                             | Passed | Every relative Markdown target resolves from this item                                        |
| Whitespace/diff hygiene      | Changed item/worktree                                                                                    | Passed | Direct scan, `git diff --check`, and untracked-item `git diff --no-index --check`             |

Browser, runtime, build, database, migration, RLS, fixture replay, hosted, payment/provider, financial
reconciliation, independent QA, Global QA, release, and production acceptance were not run. This
read-only architecture result claims none of them.

## Residual Risks And Return

- Current missing-entitlement-as-Pro behavior remains live and is not commercial proof.
- Current Admin identity exclusions are strong for metadata-proven local QA users but still include
  heuristic suspected-test classifications; future financial queries need explicit dataset scope.
- No historical money, paid-customer, provider-cost, or subscription truth exists yet.
- AI preview may reach a cost-bearing provider path without a persisted identity; the commercial
  operation slice must close that boundary before charging or metering.
- Manual financial history needs Product-approved accounting/close semantics before it can be called
  actual, reconciled revenue, or decision-grade cash.

Next recommended role: **PRODUCT**. PRODUCT should accept the minimum financial-fact contract and the
Slice 1 decisions, then dispatch one new bounded **BACKEND** child item for manual financial-fact
history only. No implementation dispatch was performed by ARCHITECT.

## Stage

Completed — source-of-truth audit returned to PRODUCT; implementation and all acceptance layers
remain pending.

## Next Recommended Role

PRODUCT
