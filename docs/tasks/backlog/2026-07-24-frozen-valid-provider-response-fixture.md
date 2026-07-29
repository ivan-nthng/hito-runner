# Frozen Valid Provider Response Fixture

## Work Item ID

2026-07-24-frozen-valid-provider-response-fixture

## Status

completed

## Type

change_request

## Priority

high

## Owner

backend

## Scope

generated-plan-creation-engine

## Archive Intent

retain_in_place

## Next Recommended Role

architect

## Task

Record the historical exact-response fixture acceptance and its later retirement without
reclassifying either historical provider response.

## Stage

SUPERSEDED / the exact-response source snapshot was retired after the canonical provider contract
and heart-rate target representation moved forward.

## Historical Closeout

- Previously retained response:
  `resp_087b0500cafdf37b006a6385c75bac8196b4d0b65bb3e36bb2`.
- Historical output SHA-256:
  `915856deb6afaeefc4cee6eea568d49777a9f9585a8faef29c1eb9f9b693653b`.
- Historical rejected response:
  `resp_0e3227503a0c4e33006a62992c1d648195beb8227d87c266bb` remains negative-only
  evidence for nine target-change and four missing-anatomy issues. Its raw payload is not a fixture.
- Historical root cause: the compiler-valid frozen snapshot was wired into the loopback fixture, but
  exact confirm/persistence provenance, real wall-clock delay, and the historical negative identity
  were not all represented in one complete proof boundary.
- Current truth: the exact-response source and its closed proof pair were retired on 2026-07-26
  after reachability showed no runtime consumer and the payload no longer matched the canonical
  named-band heart-rate target contract. The existing dynamic loopback fixture remains the only
  maintained QA transport and still feeds provider-shaped data through the normal parser, compiler,
  review signer, confirm action, and canonical local persistence path.

## Source Investigation

- Confirmed: `src/lib/ai-generated-running-plan-dev-fixture.ts` owns the loopback fixture
  input, response construction, scenario selection, and provider isolation.
- Confirmed: `scripts/validate-ai-generated-running-plan-creation.ts` exercises valid fixture input,
  invalid structural input refusal, provider isolation, and deterministic output invariants.
- Confirmed: the accepted long-run canary record retains the rejected mixed-target provider response
  as historical negative evidence, not a valid fixture.

## Preserved Boundaries

- No production provider fallback, Admin persistence, or runner-data mutation.
- Valid fixture data is local validation infrastructure, not product truth or an alternate planner.
- Keep invalid historical evidence for regression discrimination; do not normalize it into acceptance.

## Historical Validation Evidence

- The retired exact fixture replay was deterministic and isolated from runner authoring input at the
  time of its acceptance.
- Invalid structural input remains blocked before provider dispatch.
- Provider/fixture provenance and review/confirm boundaries remain truthful.
- Independent QA evidence is required for task-level closure; Global QA remains separate.

## Historical Validation Result

| Check | Result | Evidence |
| --- | --- | --- |
| Frozen provider replay | Passed | Exact response parses and compiles through the ordinary provider-shaped path with zero policy issues. |
| Actual fixture delay | Passed | Parent measured 15,162 ms; independent QA measured 15,154 ms. |
| Signed review | Passed | Review token is present, checksum is 64 characters, and preview remains non-persisting. |
| Provider isolation | Passed | Fixture preview and confirm recorded zero provider calls and `callsOpenAi: false`. |
| Confirm and readback | Passed | Loopback disposable proof persisted the exact response ID and reviewed checksum, then cleaned up. |
| Real-mode boundary | Passed | Synthetic real-mode proof bypassed the fixture and reached the injected real-provider seam once. |
| Contract validators | Passed | Generated plan, goal intent, confirm, workout language, doctrine, and manual authoring checks passed. |
| Build and integrity | Passed | Fresh production build and build-output integrity validation passed. |
| Independent QA | Passed | One reused read-only QA subagent found no remaining fixture-contract blocker and was closed. |
| Paid or hosted calls | Not run by design | No OpenAI call or hosted Supabase mutation was needed for this closure. |

This table records the original accepted slice; it is not evidence that the retired exact-response
snapshot is a current runtime fixture. Current fixture and provider-contract evidence belongs to
the 2026-07-23 long-run strategy task.
