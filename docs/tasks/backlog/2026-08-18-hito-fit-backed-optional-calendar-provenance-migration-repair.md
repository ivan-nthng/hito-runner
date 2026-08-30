# Hito FIT-Backed Optional Calendar Provenance Migration Repair

Work Item ID: `2026-08-18-hito-fit-backed-optional-calendar-provenance-migration-repair`
Status: closed
Type: Tracked
Priority: highest
Owner: BACKEND
Epic: runner-core-readiness
Parent: [Hito Hosted Runner Core Migration Parity And Production Deploy](./2026-08-18-hito-hosted-runner-core-migration-parity-and-production-deploy.md)
Depends On: [Hito Hosted FIT-Retaining Calendar Cleanup And Release Continuation](./2026-08-18-hito-hosted-fit-retaining-calendar-cleanup-and-release-continuation.md)
Evidence From: [Hito Modular Monolith Domain-Boundary Transformation](../../plans/archive/2026-08-18-hito-modular-monolith-domain-boundary-transformation.md)

## Scope

Correct the first incorrect owner of the remaining hosted migration stop: migration
`20260816004652_standalone_calendar_write_foundation.sql` still requires a valid immutable saved-plan
link for an AI-origin workout before it establishes the accepted optional-provenance Calendar shape.
The retained raw FIT/ZIP-backed workout is known AI-origin but has no reconstructable saved source
link. Preserve it as `origin_kind = ai` with optional source provenance absent; do not create or
reconstruct a plan container.

## Archive Intent

Retain the migration correction, clean replay, hosted proof, and release continuation as the final
record for this legacy-source transition.

## Task

Amend only the not-yet-hosted migration so its ordering makes origin classification independent from
optional source provenance. For an AI-authored historical workout with an unreadable or missing
saved-plan linkage, retain the workout and set its optional provenance reference to null after the
origin backfill. The same path must not invent a source record, reintroduce plan authority, weaken
ownership/evidence protection, or affect valid manual, AI, or imported provenance.

The migration must remain fail-closed for unknown source kinds, cross-runner source links, invalid
origin values, and malformed nonoptional evidence truth. Reuse existing migration/seam/proof owners;
add no compatibility model, new table, RPC, provider path, or generic migration framework.

## User Authorization

Ivan explicitly authorized completing the release while retaining only the raw FIT/ZIP-backed
workout. This authorizes the narrow migration-source correction, its clean local replay, the linked
hosted migration continuation, and redeployment of the resulting committed `main` SHA. It does not
authorize deleting the retained FIT/ZIP workout, fabricating a source plan, changing unrelated
historical migrations, exposing private data, or modifying hosted configuration/secrets/domains.

## Validation Expectations

- Prove the retained AI-origin FIT/ZIP workout migrates with null optional provenance and unchanged
  evidence/result/activity graph.
- Prove valid manual, AI-linked, and file-import source paths retain their current origin/provenance
  behavior; unknown/cross-runner/malformed inputs still fail closed.
- Run a clean local migration replay and focused existing Runner Core persistence/ACL checks.
- Resume the exact three hosted migrations only after the source patch is committed and pushed;
  verify hosted parity, Vercel build SHA, prebuild parity, and public HTTP reachability.
- Preserve unrelated dirty work and keep the receipt aggregate/privacy-safe.

## Stage

Superseded before implementation; no migration-source change retained

## Next Recommended Role

PRODUCT

## Blockers

None. This item was superseded before implementation.

## Supersession — 2026-08-18

Ivan authorized deletion of all remaining hosted runner training data, including the previously
retained FIT/ZIP-backed workout. No provenance repair or migration-source change is required. This
item is superseded by
[Hito Hosted Runner Training Data Full Reset And Release Unblock](./2026-08-18-hito-hosted-runner-training-data-full-reset-and-release-unblock.md).
