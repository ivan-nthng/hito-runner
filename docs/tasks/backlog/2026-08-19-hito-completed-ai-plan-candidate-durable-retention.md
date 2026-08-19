# Hito Completed AI Plan Candidate Durable Retention

Work Item ID: `2026-08-19-hito-completed-ai-plan-candidate-durable-retention`
Status: completed
Type: Tracked
Priority: highest
Owner: BACKEND
Epic: runner-core-readiness
Parent: [Hito Generated Plan Preview Preparation Failure](./2026-08-18-hito-generated-plan-preview-preparation-failure.md)

## Scope

Persist every completed, parseable JSON plan response from OpenAI before any schema or compiler
decision. Preserve its exact structured response body and normalized validation/compiler outcome in
private, server-owned storage, without making it Calendar authority.

## Archive Intent

Retain through the adaptive-plan-engine transition because this is a reliability invariant for every
future plan-generation path.

## Task

After a provider response has completed and parses as JSON, durably retain its exact JSON response
body before schema validation or compiler-policy acceptance. Store the outcome of later schema and
compiler checks alongside it. A rejected candidate must remain recoverable by its owner, but must
not materialize workouts, become an active plan, replace Calendar truth, or bypass
review/confirmation. The accepted path remains the current source-artifact and
Calendar-confirmation flow.

## User Report

Ivan: “Все JSON'ы нужно сохранять. Мы платим за них деньги.” Every parseable JSON response returned
by OpenAI for plan generation must be durable server truth, even when a later validation stage
rejects it. The rejected 63-workout Half Marathon output could be read once from OpenAI but had no
durable copy after compiler rejection, so recovery depended on a fragile external log/browser path.

## Evidence

- [P0 preview-failure receipt](./2026-08-18-hito-generated-plan-preview-preparation-failure.md):
  provider response reached `completed`; the compiler then produced
  `ai_authored_plan_first_rejected_before_review`.
- [Recovery receipt](./2026-08-18-hito-recover-failed-half-marathon-preview-as-import-json.md):
  the exact 63-workout output existed but was not retained before rejection.

## Observed Behavior

The existing flow retains a candidate only after compiler acceptance for review. A completed JSON
response rejected by schema or policy is discarded, leaving no recovery artifact.

## Expected Behavior

Every completed, parseable JSON plan response is privately server-retained before schema and
compiler policy. Rejected candidates remain recoverable but non-authoritative; accepted candidates
follow the existing review and Calendar-confirmation behavior unchanged.

## Source Investigation

The current P0 record proves the ordering boundary: provider completion passed, then the compiler
rejected the result before the save/review path. Inspect only the AI plan-response, generation-ledger,
candidate/source-persistence, and focused proof seams to identify the canonical private persistence
owner. Reuse it when it can retain exact JSON; otherwise add the smallest private persistence shape
required for this product invariant.

## Likely Root Cause

The durable-save boundary sits after compiler policy instead of immediately after completed JSON
parsing. This is a recovery/data-lifecycle gap, not a reason to weaken compiler safety.

## What Not To Touch

- Persist the exact parseable OpenAI JSON response body that the plan engine receives. Do not persist
  a broader provider envelope, prompt text, access tokens, or unrelated provider metadata.
- Do not alter runner-owned Calendar authority, source provenance rules, review/confirmation,
  existing accepted-plan materialisation, FIT/evidence, RLS, migrations, or hosted data without a
  demonstrated invariant and a separate Product decision.
- Do not add a second plan container, local fallback, client cache, compatibility authority, or new
  provider request/retry behavior.

## Validation Expectations

Prove completed parseable JSON responses survive schema/compiler rejection and can be read only by
their owner with exact structured content and privacy-safe diagnostics; prove they create zero
Calendar workouts until normal review/confirmation; prove accepted existing paths remain unchanged;
and cover correction, cleanup, RLS, focused type/format/diff hygiene.

## Stage

Backend implementation and focused independent QA are complete. Historical recovery of the pasted
63-workout response and any hosted migration or release action remain separate Product-routed work.

## Next Recommended Role

PRODUCT

## Handoff Prompt

```text
ROLE: PRODUCT

Task: Hito Completed AI Plan Candidate Durable Retention
Stage: Review the completed owner-level receipt and route the historical response recovery and
release continuation as separate authorized work.
Canonical item: /Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-19-hito-completed-ai-plan-candidate-durable-retention.md

Do not reinterpret this completed local Backend contract as hosted schema parity, deployment,
historical-response recovery, browser acceptance, Global QA, or release readiness. Preserve the
existing private retention and Calendar boundaries when routing successor work.
```

## Implementation Receipt

### Preflight And Root Cause

- Mode remained Tracked because the change adds private persisted truth, a migration, RLS, and
  authenticated ownership behavior.
- The existing `plan_cycles` candidate owner stores only compiler-accepted, reviewed canonical plans;
  it cannot truthfully retain an exact parseable JSON response rejected before review. The local
  generation ledger is diagnostic evidence, not durable owner-private product data.
- The first incorrect boundary was `generateAiFirstPlanDraftPreview`: it parsed the completed JSON,
  ran schema/compiler policy, and discarded rejected content before any durable write.
- The smallest admitted addition was one private response table plus one focused server persistence
  owner. No second plan container, client cache, compatibility path, callback injection, provider
  retry, or Calendar authority was added.

### Implemented Contract

- Migration `20260819124828_ai_plan_generation_response_retention.sql` creates
  `ai_plan_generation_responses` with owner identity, generation/provider identity, exact JSON text,
  SHA-256, schema/compiler outcomes, bounded diagnostic code/path, immutable body/identity/final
  outcome guards, owner-select RLS, service-only writes, and Auth-owner cascade cleanup.
- `ai-plan-generation-response-persistence.ts` validates parseable JSON and bounded identities,
  retains exact bytes idempotently, records final normalized outcomes, and supports owner-filtered
  retrieval by internal row or provider response identity.
- The completed JSON write now occurs immediately after parsing and before runner-context, provider
  schema, or compiler decisions. A persistence failure fails closed. The authenticated action passes
  the runner identity; an ownerless canonical OpenAI transport is refused before provider invocation.
- Schema rejection records `rejected/not_run`; compiler rejection records `accepted/rejected` plus
  the first privacy-safe code/path; accepted output records `accepted/accepted`. Rejected and accepted
  raw responses do not create `plan_cycles` or `planned_workouts` before the existing review flow.
- Independent QA found that the existing extraction seam trimmed leading/trailing bytes. Backend
  fixed it forward so whitespace is used only to reject empty output while the original JSON text is
  retained. QA reran the contract and passed it.

### Files Changed

- `supabase/migrations/20260819124828_ai_plan_generation_response_retention.sql`
- `src/lib/ai-plan-generation-response-persistence.ts`
- `src/lib/ai-first-plan-draft-service.ts`
- `src/lib/running-plan-engine-actions.ts`
- `src/lib/supabase/database.ts`
- `scripts/validate-ai-generated-running-plan-creation.ts`
- this canonical receipt

All unrelated dirty checkout bytes were preserved. No provider, Frontend, Design System, Calendar,
saved-plan materialisation, FIT/evidence, configuration, dependency, Git, or hosted state was changed.

### Validation Inventory

| Check                                                | Scenario / environment                                                | Result | Evidence                                                                                                                 |
| ---------------------------------------------------- | --------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------ |
| Local admission                                      | Repository-managed loopback Supabase                                  | Passed | `npm run supabase:local:status`; `127.0.0.1:54321`                                                                       |
| Clean schema replay                                  | Disposable local database, pinned CLI `2.109.1`                       | Passed | `supabase db reset --local`; all repository migrations applied in order, ending `20260819124828`                         |
| Focused static contract                              | Existing generated-plan validator                                     | Passed | `node --import tsx ./scripts/validate-ai-generated-running-plan-creation.ts`                                             |
| Persistence, exact bytes, RLS, immutability, cleanup | Disposable Auth owner plus isolation user                             | Passed | `node --env-file=.env.local --import tsx ./scripts/validate-ai-generated-running-plan-creation.ts --require-persistence` |
| Rejection non-authority                              | Schema rejection and compiler rejection                               | Passed | Exact response retained; zero `plan_cycles` and zero `planned_workouts`                                                  |
| Accepted-path regression                             | Four existing generated-plan scenarios plus owned canonical transport | Passed | Existing review contract remained accepted; canonical transport called once and retained before return                   |
| Backend source plus local DB                         | Existing 21-check Backend suite                                       | Passed | `npm run validate:backend:local-db`; runtime and release groups explicitly skipped                                       |
| Schema lint                                          | Local `public` schema                                                 | Passed | Pinned `supabase db lint --local --schema public --level warning --fail-on warning`; no errors                           |
| Migration history                                    | Local repository replay                                               | Passed | Pinned `supabase migration list --local --output-format json`; final version `20260819124828`                            |
| Generated types                                      | Local schema versus formatted `database.ts`                           | Passed | Pinned type generation piped through repository Prettier produced an empty diff                                          |
| Focused TypeScript                                   | Task-owned files filtered from repository diagnostics                 | Passed | No task-owned TypeScript diagnostic                                                                                      |
| Format and whitespace                                | Task-owned TypeScript and whole-file diffs                            | Passed | Prettier check and targeted `git diff --check`                                                                           |
| Independent QA                                       | Named QA role, focused local replay                                   | Passed | Initial exact-byte defect fixed forward; final `Verdict: Passed`                                                         |

### Omitted Checks And Consequence

- No OpenAI request, paid provider call, historical 63-workout ingestion, hosted migration/data
  mutation, deployment, browser QA, Global QA, staging, commit, or push was run. Therefore this receipt
  proves only the completed local Backend contract and its independent focused acceptance.
- The 21-check Backend suite passed before the final exact-byte fix; after that two-line extraction
  correction, the complete focused static/persistence validator and independent QA were rerun. No
  broader suite was repeated because the fix affected only the directly covered extraction seam.

### Next Owner

Return to PRODUCT. Product may separately route recovery of the historical 63-workout response and
the hosted migration/release chain under their own explicit authorities. No blocker remains in this
local Backend slice.
