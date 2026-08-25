# HITO-277 — Establish Camelot Interactive QA Fixture

## Technical Boundary

Camelot is version `camelot_interactive_qa_fixture_v1`, one explicitly selected local profile over
the existing `test-user`, managed QA lifecycle, Saved plan/candidate, Review/Confirm, Calendar and
FIT/Result-Evidence owners. It adds no schema, migration, hosted path, provider path or parallel
writer.

The lifecycle publishes one canonical build into two independently managed immutable runtime
snapshots: `qa_fixture` on `127.0.0.1:3000` and Camelot on `localhost:3100`. Each slot owns its PID,
state, log, lease and freshness receipt. The slots share only the admitted local Supabase service;
start, status, restart, reset and stop remain profile-scoped and cannot stop or clean the other
slot.

The high-level contract is documented in
[`docs/process/camelot-interactive-qa-fixture.md`](../../process/camelot-interactive-qa-fixture.md).
The base is a fresh fixture-owned `initial_plan_review` checkpoint: one deterministic retained
response, one immutable Blueprint, one review-ready detailed candidate, 28 WorkoutDocuments, zero
confirmations and zero Calendar rows. The existing deterministic authoring fixture remains the sole
provider-free plan source for further valid goal selections.

The FIT boundary is server-owned and exact-profile authorized. Arbitrary selected bytes are not
sent to the parser or Storage; Camelot substitutes the existing checksum-pinned synthetic FIT and
returns only the public `camelot_simulated_fit_outcome_v1` receipt with a sanitized presentation
filename. Non-Camelot upload behavior is unchanged.

## Proof Inventory

| Check              | Scenario / environment                                          | Result | Evidence                                          |
| ------------------ | --------------------------------------------------------------- | ------ | ------------------------------------------------- |
| Static boundary    | local/hosted/provider/identity guards                           | Pass   | `npm run validate-camelot-interactive-qa-fixture` |
| Existing lifecycle | pool classification, lease and cleanup                          | Pass   | `npm run validate-test-user-lifecycle`            |
| Managed lifecycle  | start → status → status → reset → status → stop                 | Pass   | Safe command receipts                             |
| Concurrent slots   | qa_fixture:3000 + camelot:3100; independent status/stop/build   | Pass   | Managed slot receipts and listener readback       |
| Persistence        | owner/RLS, review eligibility, 28 documents, zero Calendar rows | Pass   | Camelot status receipt                            |
| Public Saved plans | Camelot cookie list → Restore; foreign pool login rejected      | Pass   | Camelot public server-function status readback    |
| Provider isolation | deterministic retained lineage and zero usage                   | Pass   | Camelot status receipt                            |
| Source hygiene     | task-owned diagnostics, Prettier and diff                       | Pass   | Focused command output                            |

## Explicit Omissions

No browser QA, Frontend wiring, provider call, Running Coach review, hosted Supabase mutation,
schema/type generation, Git lifecycle or HITO-271 evidence mutation belongs to this Backend slice.
