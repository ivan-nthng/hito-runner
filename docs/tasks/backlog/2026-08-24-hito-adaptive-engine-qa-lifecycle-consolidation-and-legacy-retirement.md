# Consolidate Adaptive Engine QA Lifecycle And Retire Superseded Paths

## Work Item

HITO-272 · tracked maintenance child of HITO-250. Notion is the lifecycle authority; this file is
the technical decision and evidence boundary.

## Outcome

Keep one repeatable, provider-free UI replay of the accepted adaptive-engine journey while removing
only the exact test and documentation paths that it supersedes. The final product path remains:

`authenticated runner -> reviewed plan -> Calendar -> FIT/RPE facts -> Runner Fitness Profile -> continuation -> Review/Confirm`

No engine feature, provider policy, Calendar authority, Runner Profile formula, UI behaviour, or
hosted runner data is in scope for replacement.

## Evidence To Retain

- HITO-271 hosted Global QA receipt and its exact Preview/Supabase commit evidence.
- The dedicated non-personal `.invalid` technical runner; reset its owned records, storage and leases
  between replays but do not delete the identity.
- Redacted initial, first-continuation and second-continuation Running Coach review/verdict artifacts,
  the final thin UI receipt, the compact provider-attempt ledger and canonical technical contract.
- `scripts/test-user.mjs` only insofar as it remains the single reachable owner of the retained
  lifecycle. Secrets, raw provider content, magic/action links and user PII are never retained in
  repository documentation or Git.

## Observed Cleanup Boundary

The accepted journey left one public command owner, `scripts/test-user.mjs`, plus historical local
adaptive commands and a group of hosted-pool subcommands. Earlier ignored bootstrap implementations
were removed after the hosted lifecycle replaced them. The next owner must prove—not infer—which
remaining commands, helpers, Markdown records and receipts are still required by the no-provider UI
replay before removing or consolidating any of them.

## Product Decision — 2026-08-24

The completed HITO-271 reset intentionally removed all runner-owned response, candidate,
confirmation, Calendar and evidence rows. Redacted receipts prove the accepted journey but cannot
truthfully reconstruct its sealed source lineage. Therefore the retained `.invalid` identity alone
is not a no-provider replay source.

Use one **versioned deterministic server-owned UI fixture** as the sole future replay source. It is
setup for UI regression only: it must not claim provider, Running Coach, Review/Confirm, compiler or
Calendar-persistence acceptance already proved by HITO-271. It may invoke only the existing test-user
and canonical persistence owners, must carry explicit fixture provenance, and must never become a
second runtime writer or a way to restore private provider content. A fresh Coach review is not
required for the already-approved three-block HITO-271 journey.

## Delivery Sequence

1. **ARCHITECT — discovery.** Produce a direct inbound/reachability and evidence-retention matrix.
   Select one retained replay entry point and exact deletion/consolidation candidates. Stop if a
   candidate holds unique accepted evidence, a security boundary or the only canonical workflow.
2. **BACKEND — bounded consolidation.** Move no data, make no provider call and add no test framework.
   Reuse the retained owner, remove only candidates proven superseded, and preserve one resettable
   hosted runner lifecycle.
3. **QA — no-provider UI replay.** Recreate only the retained deterministic journey, sign in as the
   technical runner, verify Calendar/FIT/RPE/Profile/continuation controls and desktop/mobile/console
   behaviour, then reset runner-owned data and independently confirm that no old path is live.

## What Not To Touch

- Do not delete HITO-271 receipts, Coach verdicts, provider-cost metadata, the technical runner or
  canonical adaptive-engine documentation.
- Do not use Docker as an acceptance gate, create a Supabase project/branch, change production data,
  call a provider, re-run Running Coach, or create alternate Auth, Calendar, importer or test writers.
- Do not delete migrations, generated types or raw security evidence because they are old or large.
- Do not convert repository documentation into a duplicate Notion history.

## Validation

- Exact source/command/doc inbound census before every removal.
- Local Markdown links, Prettier, whitespace and `git diff --check`.
- One retained no-provider UI replay and runner-owned reset/readback.
- Independent QA confirms zero alternate live paths and retained evidence availability.

## Architecture Discovery Receipt — 2026-08-24

### Snapshot And Authority

- The audited candidate is `codex/runner-calendar-public-snapshot` at
  `8e85db5a618b010622bbcd624bf4083b3b7ed42d`; its package, scripts and documentation
  boundary was clean at inspection time. The shared-main checkout was not treated as the candidate.
- HITO-271 is terminal in Notion with hosted Global QA PASS. Its final UI receipt binds the READY
  Preview to `8e85db5a618b010622bbcd624bf4083b3b7ed42d`; live HITO-271 readback records hosted Supabase
  migration parity at `55/55`, three confirmations, 60 Calendar workouts, zero projection rows,
  zero final runner-owned rows/leases and the retained non-personal `.invalid` Auth identity.
- Notion remains lifecycle truth. This file and the existing adaptive-engine contract remain
  technical truth. External redacted artifacts are immutable evidence, not fixture or persistence
  input.

### Direct Command And Consumer Census

| Candidate surface                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Direct consumers / reachability                                                                                                                                                                                                                  | Decision                                                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hosted-pool-adopt`, `hosted-pool-status`, `hosted-pool-auth-link`, `hosted-pool-checkpoint`, `hosted-pool-reset`                                                                                                                                                                                                                                                                                                                                                 | Public branches and usage text in candidate `scripts/test-user.mjs`; HITO-271 receipt checkpoints prove identity adoption, auth preparation, staged evidence and final reset. No package alias or tracked Markdown command consumer exists.      | **Retain now.** They are the only demonstrated hosted identity/lifecycle owner, but are not one replay entry point.                                                                                                        |
| `hosted-pool-calendar-date`, `hosted-pool-fit-artifact`, `hosted-pool-profile-snapshot`                                                                                                                                                                                                                                                                                                                                                                           | Public branches in the same script; final receipt checkpoints prove Calendar-date, FIT and factual-profile use.                                                                                                                                  | **Retain now.** They write/read canonical owners for the accepted journey and cannot be replaced by artifact injection.                                                                                                    |
| `hosted-pool-continuation-preflight`, `hosted-pool-attempt-ledger`, `hosted-pool-latest-diagnostic`, `hosted-pool-recompile-technical`, `hosted-pool-candidate-artifact`, `hosted-pool-record-coach-verdict`, `hosted-pool-confirm-candidate`                                                                                                                                                                                                                     | Public branches in the same script; HITO-271 checkpoints prove preflight, retained-response compile, redacted evidence, Coach verdict and sealed confirmation use.                                                                               | **Retain now; consolidation candidate only.** No command is independently deletable until one replay owner proves the complete sequence and negative gates.                                                                |
| `adaptive-blueprint-seed`, `adaptive-blueprint-continuation-seed`, `adaptive-blueprint-status`, `adaptive-blueprint-continuation-proof`, `adaptive-blueprint-continuation-profile-proof`, `adaptive-blueprint-continuation-prepare`, `adaptive-blueprint-two-profile-replay`, `adaptive-blueprint-second-continuation-preflight`, `adaptive-blueprint-second-continuation-author`, `adaptive-blueprint-second-continuation-recompile`, `adaptive-blueprint-reset` | Each has a direct `package.json` alias and a branch in `scripts/test-user.mjs`; all delegate to `scripts/lib/runner-design-profile-fixture.ts`. HITO-271 history records direct use of the local continuation commands before hosted acceptance. | **Superseded for hosted Global QA, but not safe to delete.** They remain reachable local fixture/proof commands. Remove only after their package aliases and every focused-proof consumer migrate to a proven replacement. |
| Generic pool, inventory, cleanup, design-profile and file-flow commands in `scripts/test-user.mjs`                                                                                                                                                                                                                                                                                                                                                                | Current local test-user contract and validators consume them.                                                                                                                                                                                    | **Out of scope / retain.** HITO-272 must not turn a hosted adaptive consolidation into a replacement Auth/importer writer.                                                                                                 |

The candidate has one physical dispatcher but two operational families: a local fixture family and a
hosted HITO-271 family. File co-location is not convergence. No public command above has enough
evidence for deletion solely because another command reaches a similarly named stage.

### Evidence Retention Matrix

| Evidence                                 | Exact retained owner and binding                                                                                                                                                                                                                                          | Disposition                                                                                                                                          |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| HITO-271 lifecycle and final verdict     | Live HITO-271 Notion page; terminal hosted Global QA PASS and zero-count cleanup readback                                                                                                                                                                                 | **RETAIN.** Lifecycle truth; do not copy its chronology into Markdown.                                                                               |
| Technical identity and lifecycle receipt | External `hosted-journey-receipt.json`, SHA-256 `dcbc1a4e1a7c43f3d918cd0a52f49cd3bed8485524471fbfc1b02a76e0a92f2`, mode `0600`; records identity retention and released lease                                                                                             | **RETAIN.** The `.invalid` identity is reusable; the receipt is evidence only.                                                                       |
| Initial Coach pair                       | External `initial-candidate-for-coach-review.json`, SHA-256 `d68ecab573f5b3bc7fe16256bebf30e5820c4ac5acedb51c27edb220a371c8af`; verdict SHA-256 `a0abf5a4465d46b8f3927b3e5ce9ff2ab132e9f74a1483d0b8eed7fea3c2a339`                                                        | **RETAIN.** Redacted exact candidate/verdict binding.                                                                                                |
| First-continuation Coach pair            | External `first-continuation-candidate-for-coach-review-v2.json`, SHA-256 `fe74a59ce75282895a5efb6ca9bf1a36ae4e3923f4614100963f7a1277d357f6`; verdict SHA-256 `247601d37d4a114a845962a9a306aa1e4276c76e878c238fa6aa8fa3e4d999d1`                                          | **RETAIN.** The earlier rejected pair is useful rejection evidence, but this v2 pair is the accepted binding.                                        |
| Second-continuation Coach pair           | External `second-continuation-candidate-review.json`, SHA-256 `9b6860421c279873cd407e01ced53db73c3a66c23b53b7bcba9c8d872fc13160`; verdict SHA-256 `1a8415154d97628b0ed18ac1dbefb39e47868caaa0ac7f584f055b2131464dd2`                                                      | **RETAIN.** Redacted target/taper acceptance binding.                                                                                                |
| Compact provider ledger                  | External `provider-attempts-final.json`, SHA-256 `8ec6b838ef106a0c8eddd69b961ab86f39480027a8d64772f905e5a8519848c1`, mode `0600`                                                                                                                                          | **RETAIN.** It is the redacted aggregate; earlier ledger revisions and diagnostics are subordinate evidence, not runtime inputs.                     |
| Final thin UI receipt                    | External `final-thin-ui-receipt.json`, SHA-256 `d675aeb83a2cd40bbb65bb69c308c6cd1ff29e3225b8658d5fe5b6da17a24ca9`, mode `0600`                                                                                                                                            | **RETAIN.** Binds READY Preview commit `8e85db5a...`, desktop/mobile proof, `3/60/0`, zero UI-pass provider dispatch and pre-cleanup counts.         |
| Preview/Supabase provenance              | Final receipt plus HITO-271 readback: READY Preview at `8e85db5a...`; candidate contains 55 migration files and HITO-271 records hosted `55/55`. Earlier `acceptance-preflight.json` remains truthful historical evidence for `1eb0b280...` at `54/54`, not final parity. | **RETAIN both without conflation.** The earlier preflight must not overwrite the final provenance.                                                   |
| Canonical adaptive-engine contract       | Candidate `docs/tasks/backlog/2026-08-18-hito-adaptive-blueprint-four-week-detail-engine.md`, SHA-256 `d5e3ad238c79627eefa4aeec33f63b9ce5a373dd8ef2556baa591ce2fe1ad423`                                                                                                  | **RETAIN.** It is the only admitted technical contract despite containing older receipt narration; compaction requires a separate unique-fact proof. |

The external evidence root is
`/Users/ivan/Library/Caches/hito-running/hosted-qa/hito-271`. It also contains callback and synthetic
credential/bootstrap files. Those files are not durable acceptance evidence and are security-cleanup
candidates, but this read-only task has no deletion authority and the retained replay is not yet
reproducible. They must not be copied into Git or documentation.

### Ignored, Generated And Documentation Boundary

| Surface                                                         | Direct proof                                                                                                                                                                                                                                             | Decision                                                                                                                                                                                       |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Candidate `.tanstack/qa-artifacts/hito-271/` (18 ignored files) | Git ignore owner is `qa-artifacts/`; filename census found zero package/source/script/doc inbound references. The set contains local recovery, generated-type, migration-preflight, screenshot and local Coach artifacts predating the hosted final set. | **DELETE CANDIDATE later, not now.** Preserve until the external mandatory set is independently read back and the artifact-retention policy admits cleanup. None is a replay authority.        |
| Candidate `.tanstack/hito-running-local-accounts.json`          | Direct consumers are `scripts/configure-local-supabase-env.mjs`, `src/lib/local-auth-account-registry.server.ts` and the current test-user lifecycle contract.                                                                                           | **RETAIN.** It is current local bootstrap state and unrelated to the hosted HITO-271 identity.                                                                                                 |
| External callback and synthetic-credential artifacts            | Hosted auth/bootstrap commands created mode-`0600` files; final cleanup retained only the `.invalid` identity.                                                                                                                                           | **SECURITY DELETE CANDIDATE later.** Delete only after a replacement replay admission proves they are no longer required; never retain their content in Markdown.                              |
| `docs/process/test-user-lifecycle.md`                           | It is the current local lifecycle contract, but its absolute claims that `test-user` refuses every non-loopback URL and never accepts hosted targets conflict with the admitted hosted-only subcommands in the same dispatcher.                          | **RECONCILE, not delete.** BACKEND must describe the exact HITO-271 hosted exception or move the hosted owner behind one command, while preserving the local prohibition for generic commands. |
| Existing adaptive-engine contract                               | Unique architecture and acceptance boundaries coexist with historical decision/receipt narration. It remains linked technical truth and is not replaceable by Notion history alone.                                                                      | **RETAIN now.** No safe lifecycle-only compaction was proven within this direct-path audit.                                                                                                    |
| Other backlog/history records                                   | No direct command or evidence consumer was demonstrated in the admitted census.                                                                                                                                                                          | **No change.** A broad documentation cleanup would exceed HITO-272 and risk deleting unique evidence.                                                                                          |

### No-Provider Replay Discriminator

The accepted hosted UI journey is **not reproducible after the final owner-row reset without a
provider call**:

1. `hosted-pool-reset` calls the canonical reset with no preserved
   `ai_plan_generation_responses`; it returns retained responses, Blueprint, candidates,
   confirmations, Calendar workouts, results and adaptive input revisions to zero while retaining
   only the Auth identity.
2. Blueprint/candidate/confirmation state is owned through foreign keys rooted in the retained
   response and Blueprint lineage. Deleting that owner state removes the only server-authoritative
   replay source.
3. `hosted-pool-recompile-technical` can compile only an existing retained response row. Redacted
   Coach pairs, provider ledger and UI receipt intentionally exclude raw provider content and cannot
   reconstruct the row.
4. The local `adaptive-blueprint-*` family can build fixture state, but using it to restore the
   hosted accepted journey would be the forbidden fixture injection/manual lineage restoration and
   an alternate writer.

The exact missing input is one canonically owned, server-readable initial authoring response and its
immutable lineage from which the reviewed initial candidate/Blueprint can be compiled before normal
confirmation. No such live row or admitted provider-free seed remains after cleanup. Preserving only
the `.invalid` identity is insufficient.

### Decision And Proposed Backend Batch

**Decision: no deletion or command consolidation is safe in the current state.** Creating a wrapper
around the 15 hosted subcommands would make the interface shorter but would not make the journey
replayable. Deleting the 11 local commands would remove the only current deterministic fixture path
without replacing the hosted zero-state gap.

The smallest future BACKEND batch is therefore conditional and serial:

1. After PRODUCT admits exactly one replay source, keep `scripts/test-user.mjs` as the sole command
   owner and expose one HITO-271 replay entry point. It may use only canonical server actions and
   owner-bound state; it must fail closed on missing identity, deployment SHA, migration parity,
   lineage, Coach verdict, stale review or reset drift.
2. Orchestrate adopt/status, canonical factual FIT/RPE/Profile writes, retained-response compile,
   redacted review/verdict binding, sealed confirm, thin UI handoff and exact reset through that one
   entry point. Do not create Auth, Calendar or importer writers and do not call a provider.
3. Migrate package and focused-proof consumers one by one. Only then remove public hosted stage
   commands that have zero direct/runtime/type-only consumers and remove each local
   `adaptive-blueprint-*` alias/branch whose proof has an equivalent retained owner.
4. Reconcile the hosted exception in the existing test-user lifecycle contract; independently
   verify the mandatory evidence hashes; delete only proven generated/bootstrap candidates under a
   separately admitted recovery/security boundary.

This batch cannot begin until PRODUCT chooses a legitimate zero-provider source. The finite choices
are: admit retention of a canonical owner-bound replay row set across cleanup, or admit creation of a
versioned deterministic server-owned initial response fixture. A fresh provider call would also
restore the lineage but violates HITO-272's no-provider outcome. No default is architecturally
equivalent, so the choice cannot be inferred.

### Validation And Residual Boundary

| Check                                                          | Result           | Evidence                                                                                                                                          |
| -------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Candidate identity and dirty boundary                          | Passed           | Exact candidate HEAD `8e85db5a...`; scoped package/script/docs status clean.                                                                      |
| Direct command consumers                                       | Passed           | All 15 hosted commands are dispatcher-only in repository text; all 11 local adaptive commands also have package aliases.                          |
| HITO-271 lifecycle/evidence readback                           | Passed           | Live terminal Notion receipt plus external mode-`0600` artifact metadata/hashes; raw provider and credential content was not inspected or copied. |
| Reset/replay ownership discriminator                           | Passed           | Reset deletes all retained response and adaptive owner rows; retained technical evidence cannot restore them.                                     |
| Runtime, browser, provider, hosted mutation, source/tests, Git | Omitted by scope | This was read-only discovery; no replay or deletion acceptance is claimed.                                                                        |

Next owner is **PRODUCT** for the single replay-source decision. BACKEND implementation remains
unadmitted, and HITO-271 stays terminal.

## Backend Implementation Receipt — 2026-08-24

HITO-272 Backend consolidation was implemented in the accepted candidate checkout
`codex/runner-calendar-public-snapshot`, starting from HITO-271 commit
`8e85db5a618b010622bbcd624bf4083b3b7ed42d`. The shared-main untracked discovery record and all
external HITO-271 evidence remained unchanged.

- Added `adaptive_engine_ui_replay_v1` as the one deterministic server-owned UI setup source. The
  public lifecycle is `adaptive-ui-replay-seed`, read-only `adaptive-ui-replay-status`, and the
  exact version-confirmed `adaptive-ui-replay-reset` under the existing `test-user` owner.
- The seed uses the existing initial authoring, immutable response/candidate persistence, signed
  Review/Confirm, Runner Calendar materialisation, FIT importer, RPE and Runner Fitness Profile
  owners. It creates new fixture-owned lineage and explicitly records that HITO-271 sealed lineage
  was not restored and historical acceptance is not claimed.
- The deterministic local persistence proof produced three confirmations, 53 independent Calendar
  workouts, four accepted deterministic response records, four canonical FIT/evidence chains,
  factual Snapshot revision, zero future-projection Calendar rows and zero external provider
  dispatches. This fixture shape is not the HITO-271 `3/60` acceptance receipt.
- Exact reset returned all 26 counted owner tables, storage objects and the adaptive pool lease to
  zero while preserving the Auth identity; Hito stopped project-qualified afterward.
- Removed all 15 zero-consumer `hosted-pool-*` dispatcher branches and their private stage/bootstrap
  implementation, including the magic-link/action-token shortcut. No alias or compatibility path
  remains. Local `adaptive-blueprint-*` commands remain focused Backend proofs and cannot target
  hosted Supabase.
- Static proof passed: test-user lifecycle validator, initial authoring contract, signed confirm
  contract, Node syntax/ESLint, scoped Prettier and direct reachability census. Whole-checkout
  TypeScript remains at the inherited 94-diagnostic baseline with zero diagnostics on HITO-272
  changed paths.

Omitted by scope: browser/UI replay, hosted mutation, provider calls, Running Coach, Global QA,
release, deployment and Git lifecycle. QA owns the independent provider-free UI replay and final
zero-alternate-path/readback acceptance.

## Backend Hosted Bootstrap Fix-Forward Receipt — 2026-08-24

The reproduced `adaptive_ui_replay_hosted_env_bootstrap_order` defect was fixed in the existing
`scripts/test-user.mjs` owner. The exact hosted project URL and current key classes are now resolved
and installed process-locally before importing any Supabase environment, canonical fixture or
server persistence module. The local Auth registry remains the only safe Node-only import required
before configuration; no second configuration, Auth, persistence or fixture path was added.

The approved hosted lifecycle then passed through the retained metadata-proven `.invalid` technical
runner: `seed` created `adaptive_engine_ui_replay_v1` with three confirmations, 53 runner-owned
Calendar workouts, four canonical FIT/evidence chains, factual Snapshot revision, zero projection
Calendar rows and zero external provider dispatches; independent `status` reproduced that shape and
the explicit non-executable projection contract; exact version-confirmed `reset` returned all 26
owner counts, storage objects and the adaptive lease to zero while retaining the Auth identity.
The seed recorded that HITO-271 sealed lineage was not restored and historical acceptance was not
claimed.

The same run also exposed and closed a fail-closed inventory issue: a masked CLI secret-key prefix
could satisfy the old prefix-only selector. Current hosted key selection now requires a complete
current-key shape, and the focused validator proves a masked inventory is rejected before any
network or persistence owner is imported. Raw key values were never written to an argument, file,
receipt, repository or report.

All 15 retired `hosted-pool-*` command names remain absent from executable package/script source;
only the focused negative assertion and historical receipt text mention the retired family. Node
syntax, the focused lifecycle validator, ESLint, scoped Prettier and diff hygiene passed. The whole
checkout retains its inherited 94 TypeScript diagnostics with zero diagnostics on HITO-272 paths,
and the Git index remains empty. The five retained HITO-271 redacted acceptance artifacts preserve
their accepted mode-`0600` SHA-256 identities. Browser UI replay, provider calls, Coach review,
release, deployment and Git lifecycle remain omitted; independent QA owns only the provider-free UI
replay and cleanup acceptance edge.

## HITO-273 Provider-Free Interaction Checkpoint Extension — 2026-08-24

HITO-273 extends the accepted `adaptive_engine_ui_replay_v1` lifecycle with one `--checkpoint`
selector; it does not add a command, fixture family, Auth seam, persistence writer, migration or test
framework. The existing `seed`, `status` and exact version-confirmed `reset` entry points remain the
only public lifecycle.

- `initial_plan_review` leaves the retained technical `.invalid` runner at canonical zero and
  records `onboarding_ready`. It does not preseed a candidate or client state. The existing initial
  review is an action-result-only UI contract: `previewRunningPlanDraft` returns the signed reviewed
  draft into transient client state, while the persisted Source candidate has no public read seam
  that can rehydrate the ordinary Review/Confirm controls. The provider-free `qa_fixture` authoring
  action is loopback/local-Auth-only and cannot run for the retained hosted identity. Therefore this
  checkpoint cannot truthfully expose initial Review/Confirm under the admitted Backend-only scope;
  seeding an otherwise unreachable candidate would create an orphan test path rather than replay the
  product contract.
- `continuation_actions` creates one new fixture-owned initial Blueprint/candidate/confirmation
  lineage through canonical owners, 28 runner-owned Calendar rows, eight resolved factual outcomes
  and 25 stable non-executable projections, then stops at `check_in_needed`. It exposes the normal
  check-in, prepare, Review, Confirm, Calendar open/return and inert-projection controls. One completed
  workout without FIT or RPE is named as the browser target, and the same lifecycle writes a
  synthetic mode-`0600` FIT input under the ignored HITO-273 artifact directory for the normal upload
  route.
- `complete_surface` remains the default HITO-272 three-confirmation readback and is unchanged.

Hosted setup proof used the retained metadata-proven technical runner. `initial_plan_review`
seed/status stayed at all 26 owner counts zero. Independent QA reproduced the exact
`adaptive_ui_replay_initial_plan_qa_fixture_identity_gap`: the hosted runner cannot enter the local
fixture authoring action, and no persisted-candidate-to-product-review projection exists. QA did not
dispatch the real provider action, fabricate client state or restore HITO-271 lineage; exact reset
preserved the technical Auth identity and returned all owned state to zero. `continuation_actions`
seed/status read back one
deterministic retained response, one Blueprint, one detailed candidate, one confirmation, 28 Calendar
rows, eight logs, two canonical FIT/evidence chains, `check_in_needed`, 25 inert projections, zero
projection Calendar rows and zero external provider dispatches. Unknown checkpoints and an
unowned/nonexistent Auth subject failed before fixture mutation. Exact reset returned all 26 counts,
storage objects and the adaptive lease to zero, removed the synthetic FIT input and retained the Auth
identity.

The lifecycle validator, initial plan compiler contract, Node syntax, ESLint, scoped Prettier and diff
hygiene passed. Whole-checkout TypeScript remains at the inherited 94-diagnostic baseline with zero
diagnostics on HITO-273 paths; the Git index remains empty. HITO-271 sealed IDs, provider/Coach
artifacts and Global QA acceptance were neither read as runtime input nor restored or rewritten.
Backend did not run browser QA, call a provider or Running Coach, deploy, commit, push or perform
release work. HITO-273 requires a Product-owned decision between a separately admitted public
review-draft read/hydration contract and leaving initial Review/Confirm covered only by HITO-271;
the bounded Backend fixture must not invent either path.

## HITO-273 Durable Saved Plan Review Decision — 2026-08-24

### Demonstrated Boundary

- `previewRunningPlanDraft` persists every accepted owner candidate through
  `retainAdaptiveTrainingSourceCandidateForUser`, then returns a signed product review projection.
  Its only production caller keeps that projection in React state, so closing the dialog or reloading
  currently loses the entrypoint even though the immutable candidate remains stored.
- `adaptive_training_detailed_candidates` is the sole generated-candidate owner. Its immutable row
  already carries candidate identity/version/hash, canonical plan and review conflicts, frozen
  authoring input, provenance, fact references, confirmation lineage and owner-bound Blueprint and
  retained-response relations. No new table or persistence owner is required.
- The existing Saved plans UI reads immutable `plan_cycles` records. Its generic `Start plan` action
  can materialise those records directly into Calendar. It does not own generated candidates and
  must never be reused to start a generated review without the sealed Review/Confirm gate.
- `confirmRunningPlanDraft` remains the sole initial generated-plan materialisation action. It
  revalidates the signed review, current Runner Fitness/Profile facts, immutable source candidate,
  WorkoutDocuments, collisions and owner before atomically creating runner-owned Calendar workouts.

The root defect is therefore not a missing modal restore. It is the absent public route from the
durable generated candidate into the normal Saved plans -> Restore plan -> fresh Review -> Confirm
journey.

### One Saved Plans Surface, Two Owner-Bound Reads

Keep the existing Saved plans surface and add generated reviews as a discriminated record kind. Do
not copy a generated candidate into `plan_cycles`, merge the two persistence models or let
`active-plan-persistence.ts` become the adaptive-candidate owner.

The generated-review owner exposes exactly two read actions through the existing
`running-plan-engine-actions.ts` public boundary:

```ts
type SavedPlanReviewValidity =
  | { state: "current"; reason: null }
  | { state: "stale"; reason: "facts_changed" | "invalid_lineage" | "invalid_content" }
  | { state: "expired"; reason: "already_confirmed" };

type SavedPlanReviewSummary = {
  kind: "generated_review";
  candidate: { id: string; version: number; sha256: string };
  title: string;
  goal: { distanceLabel: string; targetDate: string | null; targetFinishTime: string | null };
  schedule: { startDate: string; endDate: string };
  createdAt: string;
  validity: SavedPlanReviewValidity;
  generationLedgerReference: { generationId: string };
};

listSavedPlanReviews(): Promise<{
  ok: true;
  records: readonly SavedPlanReviewSummary[];
}>;

type RestoreSavedPlanReviewResult =
  | {
      ok: true;
      status: "review_ready";
      summary: SavedPlanReviewSummary;
      review: RunningPlanPreviewProductDraft;
    }
  | {
      ok: true;
      status: "read_only";
      summary: SavedPlanReviewSummary;
      review: Omit<RunningPlanPreviewProductDraft, "reviewToken" | "reviewChecksum">;
    }
  | {
      ok: false;
      status: "unavailable";
      reason: "unauthenticated" | "not_found" | "foreign";
      message: string;
    };

restoreSavedPlanReview({ candidateId, candidateVersion }):
  Promise<RestoreSavedPlanReviewResult>;
```

Both actions resolve the authenticated persisted user first and ask
`adaptive-blueprint-persistence.ts` for initial-candidate rows only. The list returns compact safe
summaries. Restore deterministically rebuilds the ordinary safe review projection from immutable
candidate, Blueprint, frozen input and retained-response metadata, re-runs the existing schemas and
projectors, and issues a fresh proof only when validity is `current`.

`generationLedgerReference.generationId` is the existing opaque generation-ledger identity reached
through `source_response_id`; it is traceability, not provider identity or mutation authority. The
public actions never return the raw response or prompt, provider response ID, token/cost internals,
private hashes beyond candidate identity, request/version internals, credentials, artifact paths,
HITO-271 seals, RLS/storage mechanics or another user's existence.

### Retention, Validity And Mutation Rules

- A successful compiled owner-bound generated candidate appears in Saved plans immediately. Closing
  X, route navigation, reload or a new session changes presentation only: the record remains, no
  Calendar row is written, no provider request is dispatched and no currency is charged.
- `current` means owner, version/hash, initial-unconfirmed lineage, accepted retained response,
  Blueprint, schemas, deterministic projection and current factual-input comparison all pass.
  Restore returns a fresh ordinary Review with a new signed proof.
- `stale` remains listed and can be opened read-only with the reason visible and Confirm disabled.
  It never triggers regeneration or silently substitutes current facts.
- `expired` means an initial block confirmation already owns the candidate. It also remains listed
  and opens read-only. V1 adds no clock TTL and does not infer deletion from confirmation.
- `foreign`, `not_found` and `unauthenticated` disclose no candidate, owner, Blueprint, timing or
  generation metadata. A foreign identity may use the same generic unavailable copy as not found.
- Retention ends only through a future explicit user hide/delete decision. This slice adds no such
  mutation because the immutable candidate table has no hide/delete state and Product admitted no
  schema change. Closing, reloading, confirming or becoming stale/expired are never discard events.

Restore is a read/sign operation. `confirmRunningPlanDraft` remains the only Calendar mutation and
the final validity recheck, so a freshly restored review can still fail as stale, invalid, collided
or replacement-required. Neither list nor restore grants source/container authority.

### Frontend Consumer Map

1. `SavedPlanLibraryPanel` remains the one user-facing Saved plans surface. It composes the existing
   confirmed/imported plan summaries with `SavedPlanReviewSummary` rows; no second library route,
   store or client-side projection is introduced.
2. A `generated_review` row exposes `Restore plan`, never the generic `Start plan`, export or direct
   replace-future actions. `Start plan` remains confined to its existing `plan_cycles` record kind.
3. Restore calls `restoreSavedPlanReview` and opens the existing ordinary Review/Confirm surface with
   the fresh server projection. It does not resurrect the closed modal instance or old React state.
4. A current result feeds the existing single review state and existing Confirm action. A stale or
   expired result renders the same content read-only with an explicit state and no Confirm control.
   Closing returns to Saved plans and leaves the durable record unchanged.

### Reuse, Removal And Dependency Direction

- **Reuse:** immutable adaptive candidates and owner/hash checks, retained generation ledger,
  canonical plan-to-WorkoutDocument projection, product review DTO, `addRunningPlanReviewProof`,
  current auth resolution, Saved plans surface, ordinary Review UI and existing Confirm action.
- **Add only:** one private initial-candidate list/detail projection and two public read actions; the
  immediate preview DTO gains the same candidate identity so fresh and restored review prove parity.
- **Reconcile:** discriminate Saved plans rows by owner kind. Delete any generated-review call path to
  `startSavedPlanRecord`; it must be structurally impossible for that action to accept an adaptive
  candidate identity.
- **Remove after parity:** the HITO-273 `initial_plan_review` blocked assertion and the assumption that
  initial Review/Confirm is reachable only from the immediate preview result. Do not remove the
  transient fresh-preview journey; both journeys converge on the same Review DTO and Confirm action.
- **Direction:** Saved plans UI -> generated-review actions -> private adaptive candidate/ledger reads
  -> deterministic Review -> existing Confirm -> Runner Calendar. The generic plan library remains
  separate behind its existing public actions. Persistence imports neither UI nor Calendar mutation,
  and Frontend imports no private persistence type.

### Serial Delivery And Proof

1. **BACKEND:** implement owner-bound list/detail projections and public list/restore actions. Prove
   immediate preview and restore yield equivalent safe Review content; current restore can Confirm
   once; confirmed/stale remain visible read-only; malformed/foreign/not-found/unauthenticated reveal
   nothing; no private/raw fields serialize; generic `startSavedPlanRecord` rejects generated IDs;
   close/reload causes no write, provider dispatch or ledger debit.
2. **FRONTEND:** add `generated_review` rows to the existing Saved plans surface and route only their
   `Restore plan` action into the ordinary Review state. Prove close/reload/new-session continuity,
   current/stale/expired rendering, Confirm gating, focus/keyboard/mobile behavior and that generated
   rows never expose generic Start/export/replace actions.
3. **QA:** run the existing provider-free HITO-273 matrix through Saved plans -> Restore plan ->
   Review -> Confirm, then continuation check-in/prepare/review/confirm, FIT/RPE, Calendar return,
   inert projections, desktop and 375px. Prove exact reset, zero provider dispatch and no charge.
   Running Coach and HITO-271 private evidence remain out of scope.

Rollback removes the list/restore reads and generated-review UI rows while leaving persisted
candidates, immediate preview and Confirm unchanged; no schema/data rollback exists. Stop if the safe
Review cannot be rebuilt losslessly without raw/private data, a new store or migration is required,
Confirm would weaken, the generic Start path cannot be made type/validator-disjoint, or a runtime/type
cycle appears.

The accepted boundary is complete. PRODUCT owns acceptance and admission of the bounded BACKEND
implementation slice; no implementation was dispatched from this decision.

### HITO-273 Backend Implementation Receipt — 2026-08-24

- Added owner-scoped generated-review list/detail reads over the existing immutable initial candidate,
  Blueprint and retained-response lineage. The initial historical relationship remains canonical as
  candidate -> Blueprint -> retained response; no migration or second persistence owner was added.
- Added `listSavedPlanReviews` and `restoreSavedPlanReview` through the existing running-plan engine
  boundary. Restore rebuilds the ordinary safe product draft from persisted facts, emits a new review
  proof only for a current record and never returns provider-private material or a HITO-271 seal.
- Added the generated candidate identity to the immediate preview product DTO so immediate and restored
  reviews share one explicit persistence identity. Legacy `Start plan` remains backed only by
  `plan_cycles`; it has no adaptive-candidate read.
- Replaced the blocked `initial_plan_review` checkpoint with one fresh fixture-owned response,
  Blueprint and unconfirmed candidate. Seed/status expose Restore eligibility with zero confirmations,
  zero Calendar rows and zero external provider dispatches; reset returns all 26 owner counts, storage
  and the lease to zero while retaining the technical Auth identity.
- Focused persistence proof covered current Restore -> fresh Review -> Confirm (one immutable
  confirmation and 28 Calendar rows), expired and stale read-only results without a review seal,
  foreign/missing fail-closed reads, exact reset and no provider dispatch. Browser rendering remains a
  separate Frontend/QA edge.
