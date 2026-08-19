# Hito Generated Plan Preview Preparation Failure

- **Work Item ID:** `hito-generated-plan-preview-preparation-failure`
- **Status:** `completed`
- **Type:** Bug
- **Priority:** P0
- **Owner:** QA
- **Parent:** [Modular Monolith Domain-Boundary Transformation Implementation](2026-08-18-hito-modular-monolith-domain-boundary-transformation-implementation.md)
- **Scope:** Establish the exact server-side cause of the reported hosted generated-plan preview
  failure. The incident proves a Backend diagnostic-retention gap, so add the smallest privacy-safe
  compiler-rejection diagnostic to the existing server error seam before a normal future request
  can distinguish provider-authored invalid output from a compiler defect. This bug is independent
  of the Phase 2A-0 persistence-proof environment gate.
- **Archive Intent:** Retain the root-cause and repair receipt as Runner Core incident evidence.

## Task

At approximately 19:31 on 2026-08-18, Ivan requested a Half Marathon plan in the hosted product.
The Generated Plan review modal displayed `The plan preview could not be prepared`; it stated that
nothing was created or saved.

Investigate the exact request through the existing route/action and hosted read-only logs. Identify
the first incorrect canonical owner and make the smallest owner-correct repair if the cause is
reproducible. Preserve the runner-owned Calendar/source-provenance boundary: neither a failed
preview nor its recovery may create an active plan container or mutate an existing Calendar workout.

## User Report And Evidence

- User report: “Посмотри логи. Я сейчас попытался сделать план, и хуй там.”
- Screenshot: [2026-08-18 at 19.31.10](/Users/ivan/Desktop/Screenshot%202026-08-18%20at%2019.31.10.png)
- Observed behavior: the preview modal opens but reports preparation failure and no saved plan.
- Expected behavior: a complete reviewable plan preview is prepared, or a truthful actionable error
  identifies the unavailable external dependency without implying that user input was invalid.

## Source Investigation

The production Vercel project recorded one matching `POST` to the generated-plan server-function
route at `2026-08-18T22:23:16Z`. The request completed with application HTTP `200`; Vercel reported
no runtime error cluster in the surrounding `22:20Z`-`22:45Z` window. The screenshot copy maps
uniquely to the existing `compiler_rejection` product outcome. The action projects that outcome as
`ai_generated_plan_unavailable` only after the provider response has passed the successful HTTP and
`completed`-response gates and the canonical compiler has returned
`ai_authored_plan_first_rejected_before_review`.

The available hosted application/function logs do not contain the provider's numeric upstream HTTP
status, the generation trace, or the compiler issue code/path. Therefore the evidence establishes a
safe compiler refusal after a successful completed provider response, but it does not distinguish
an invalid provider-authored schedule from an incorrect Backend compiler invariant. The missing
privacy-safe compiler issue code/path is itself a Backend diagnostic-retention defect. The original
incident cannot be reconstructed after the fact; the next normal request must expose the existing
compiler reason without recording raw provider or runner content.

## Investigation Receipt

- **Preflight:** `main` at `14ccfbfe8742d5d894e9629169a946d144a4d06f`; index empty; unrelated
  working-tree changes preserved byte-for-byte.
- **Hosted evidence:** read-only Vercel runtime inspection only. One matching production action,
  application HTTP `200`, and no runtime error cluster were observed. No hosted state or
  configuration was changed and no provider request was made.
- **Normalized path:** product code `ai_generated_plan_unavailable`; preview outcome
  `compiler_rejection`; internal reason `ai_authored_plan_first_rejected_before_review`.
- **Upstream boundary:** the provider response necessarily passed `response.ok` and normalized
  status `completed`; the exact numeric upstream status is not emitted by the available hosted log.
- **First-owner discriminator still required:** the privacy-safe compiler issue code/path from the
  incident generation trace. That value determines whether the first incorrect owner is the
  provider-authored draft or a Backend compiler rule.
- **Changes:** this receipt only. No runtime source, test, migration, fixture, configuration, data,
  Git, deployment, or provider mutation.

| Check                         | Scenario / environment                 | Result  | Evidence                                                                                 |
| ----------------------------- | -------------------------------------- | ------- | ---------------------------------------------------------------------------------------- |
| Hosted request correlation    | Vercel production, `22:20Z`-`22:45Z`   | Passed  | One matching server action at `22:23:16Z`, HTTP `200`                                    |
| Runtime exception check       | Vercel grouped runtime errors          | Passed  | No runtime errors in the incident window                                                 |
| Error normalization trace     | Existing route/action/compiler seams   | Passed  | `compiler_rejection` / `ai_generated_plan_unavailable` after completed provider response |
| Exact first-owner attribution | Hosted generation/compiler diagnostics | Blocked | Compiler issue code/path is not present in available logs                                |

Omitted source validation has no repair-coverage consequence because no production source changed.
A synthetic hosted retry was intentionally omitted because it would invoke the paid provider and
would not recover the original incident discriminator. Continue with the existing Backend error seam
to retain a privacy-safe compiler diagnostic for the next normal request; do not retry or weaken the
compiler contract as a workaround.

## Implementation Receipt

- **Stage:** Backend diagnostic-retention repair completed; independent QA remains separate.
- **Root cause:** the completed-provider compiler failure retained issue messages internally but
  discarded the structured compiler issue `code` and `path` before product-result projection, and
  the production action emitted no privacy-safe compiler diagnostic to its existing server log.
- **Reused seam:** the existing AI first-plan unavailable metadata, generated-plan unavailable/error
  contract, product projection, and server `console.error` path. No runtime artifact, telemetry
  framework, persistence model, route, dependency, migration, or compatibility path was added.
- **Change:** the first normalized compiler issue now travels as `compilerDiagnostic: { code, path }`
  through the existing unavailable result. Non-compiler and safely absent diagnostics are explicit
  `null`. Compiler rejection projection writes only the normalized error code and this diagnostic
  object to the function log; it does not write provider output, issue messages, prompts, tokens,
  identity fields, or personal content.
- **Focused proof:** the existing generated-plan creation validator's completed-provider compiler
  rejection fixture now proves the retained code/path, identical product projection, exact
  privacy-safe log payload, and `null` diagnostics for other failure classes.
- **Files changed:** `src/lib/ai-first-plan-draft-service.ts`,
  `src/lib/ai-generated-running-plan.ts`, `src/lib/running-plan-engine-actions.ts`,
  `scripts/validate-ai-generated-running-plan-creation.ts`, and this canonical receipt.
- **Preserved boundaries:** no provider call, hosted mutation/configuration, source-plan or Calendar
  mutation, browser/runtime action, migration, fixture persistence, Git action, or deployment.

| Check                                | Scenario / environment                          | Result                        | Evidence                                                                                                         |
| ------------------------------------ | ----------------------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Focused compiler/result/log contract | Existing deterministic generated-plan validator | Passed                        | `AI-generated plan-first creation contract checks passed`                                                        |
| Privacy-safe absence                 | Non-compiler unavailable cases                  | Passed                        | `compilerDiagnostic === null`; no compiler log emitted                                                           |
| Formatting and diff hygiene          | Four task-owned source/proof files              | Passed                        | Prettier completed; `git diff --check` passed                                                                    |
| Repository-wide TypeScript           | Current dirty checkout                          | Blocked by unrelated baseline | Existing Admin, Frontend, Calendar, workout, and generated route errors; no task-owned diagnostic error observed |

The omitted hosted request proof means production logging is not claimed until a later normal user
request reaches deployed code; no synthetic paid-provider request was authorized. The Backend slice
is complete. Return to PRODUCT for independent focused QA; no release or deployment readiness is
claimed.

## Required Discriminator

For a future normal request, the existing server-side error path must retain the compiler issue code
and path (or an explicit safe absence) together with the existing normalized result. It must exclude
the raw provider response, runner prompt, access tokens, and personal data. Do not infer a provider,
credential, database, or frontend cause from the generic UI copy.

## What Not To Touch

- Do not mutate hosted runner, source-plan, Calendar, or evidence data during investigation.
- Do not rotate secrets, change Vercel/Supabase configuration, call paid providers for a synthetic
  retry, deploy, stage, commit, or push.
- Do not add a telemetry framework, database record, provider-response store, route, dependency, or
  user-facing compatibility copy. Reuse the existing compiler/action error seam only.
- Do not reopen the separate Phase 2A-0 provenance extraction or add an active-plan compatibility
  path.

## Validation Expectations

After a source repair, prove the direct preview/request contract with the existing focused
mechanism. Use hosted logs only read-only. Add a disposable local persistence/browser replay only
when the changed owner and available runtime make it applicable. Report omitted hosted/provider
proof truthfully.

## Stage

Backend implementation and independent focused QA are complete. A later normal deployed request may
provide hosted log evidence without reopening this local acceptance.

## Next Recommended Role

PRODUCT

## Handoff Prompt

```text
ROLE: QA

Task: Hito Generated Plan Preview Preparation Failure
Mode: Tracked Bug
Canonical item: /Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-18-hito-generated-plan-preview-preparation-failure.md

Read AGENTS.md, agents/qa.agent.md, the directly matching Backend/Supabase contract procedure, this
canonical item, and only the changed compiler/result/action/log seams plus the existing focused
generated-plan validator. Validate; do not edit product source, scripts, hosted state, configuration,
secrets, data, Git, or deployment.

Independently prove that a completed-provider compiler rejection preserves only the normalized
`compilerDiagnostic.code` and `.path` (or explicit `null`) through the existing unavailable result
and existing server log; it must not expose raw provider output, issue messages, runner prompts,
tokens, identity fields, or personal content. Verify non-compiler failures remain diagnostic-null.

Run the existing focused deterministic contract proof and changed-file formatting/diff checks. Do
not call the paid provider or create a synthetic hosted request. If you reproduce a source/privacy
defect, return the exact artifact to BACKEND; do not repair it. If all checks pass, record the
English QA receipt and mark this item completed. Hosted proof remains explicitly pending a later
normal deployed request.
```

## Independent QA Acceptance Receipt — 2026-08-18

### Stage And Preflight

QA performed focused Definition-of-Done acceptance of the completed Backend diagnostic-retention
repair. Scope was limited to the changed compiler, unavailable-result, Product action/log seams,
the existing deterministic generated-plan validator, and task-scoped formatting/diff hygiene. No
provider, hosted, runtime, persistence, browser, configuration, secret, data, source, script, Git,
or deployment mutation was admitted.

### Validation Inventory

| Check                             | Scenario / environment                                                       | Result | Evidence                                                                                                                                                             |
| --------------------------------- | ---------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Compiler diagnostic normalization | Completed-provider compiler rejection                                        | Passed | The first normalized issue retains only `code` and `path`; the deterministic fixture returned `ai_authored_plan_first_fixed_rest_day_violation` at `days.2026-06-10` |
| Unavailable Product projection    | Compiler rejection and non-compiler failures                                 | Passed | Product output preserves `compilerDiagnostic`; provider runtime, incomplete output, malformed output, and structured-input failures retain explicit `null`           |
| Server-log minimization           | Existing compiler-rejection `console.error` seam                             | Passed | The emitted JSON has exactly `code` and `compilerDiagnostic`; diagnostic has only normalized `code` and `path`                                                       |
| Privacy exclusions                | Product/log key assertions and existing privacy canaries                     | Passed | No raw provider output, issue message, runner prompt, token, identity field, or personal content is projected or logged by this seam                                 |
| Focused deterministic contract    | `node --import tsx ./scripts/validate-ai-generated-running-plan-creation.ts` | Passed | `AI-generated plan-first creation contract checks passed` for 10K, Half Marathon, Marathon, and custom 15K scenarios                                                 |
| Formatting and diff hygiene       | Four changed source/proof files plus this item                               | Passed | Prettier check and task-scoped `git diff --check` passed                                                                                                             |

### Issues And Coverage Gaps

No task-owned source, privacy, result-projection, or logging defect was reproduced. A hosted log
observation remains intentionally pending until a later normal deployed request reaches this code;
this acceptance did not call a paid provider, synthesize a hosted request, deploy, or claim hosted
runtime proof.

### Verdict

Verdict: Passed. The focused local Backend diagnostic-retention contract is independently accepted.
This does not establish hosted, deployment, release, production, browser, or Global QA readiness.
