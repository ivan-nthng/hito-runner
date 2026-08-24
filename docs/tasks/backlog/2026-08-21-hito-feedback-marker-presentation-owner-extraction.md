# Hito Feedback Marker Presentation Owner Extraction

Work Item ID: `2026-08-21-hito-feedback-marker-presentation-owner-extraction`
Notion Task: [HITO-239](https://app.notion.com/p/Extract-Feedback-Marker-Presentation-Ownership-3c3fe5f58cf5810b84b6ec8c1bb3adbe)
Type: Maintenance
Parent: [Hito Modular Monolith Domain-Boundary Transformation Implementation](./2026-08-18-hito-modular-monolith-domain-boundary-transformation-implementation.md)
Depends On: [Hito Shared Facade First Extraction Decision](./2026-08-21-hito-shared-facade-first-extraction-decision.md)
Evidence From: [Hito Shared Facade First Extraction Decision](./2026-08-21-hito-shared-facade-first-extraction-decision.md#architecture-decision--2026-08-21)

## Scope

Complete the one admitted Phase-6 extraction: move workout feedback-marker display mapping from
`training.ts` to its Frontend presentation owner. The factual Result/Evidence marker state remains
unchanged and provider-neutral; only labels and short labels move.

## Archive Intent

Retain the presentation contract, old-export removal proof and focused label assertions as technical
input for HITO-218. Operational lifecycle, delivery steps, handoffs and history live only in the
linked Notion task.

## Task

Create `src/components/workout-feedback-marker-presentation.ts` as the sole owner of the existing
pure `feedbackMarkerMeta` mapping over `WorkoutFeedbackMarkerSummary | null`. Migrate exactly
`TodayHero.tsx` and `calendar-projection.ts` to this owner. Delete the old `training.ts` export
without an alias, re-export, fallback or duplicate mapping.

The new presentation contract preserves exactly these outputs:

- `null` input returns `null`;
- `evidence_attached` returns `Evidence attached` / `Evidence`;
- `feedback_ready` returns `Feedback ready` / `Feedback`.

Extend the existing `scripts/validate-workout-comparison-readback.tsx` proof with direct assertions
for those three cases. The mapper has a type-only dependency on the existing public
Result/Evidence type. Neither Result/Evidence internals nor `training.ts` may import the
presentation owner.

## What Not To Touch

Do not change marker states, labels, visibility, styling, routes, Calendar snapshot assembly,
WorkoutDocument, persistence, evidence policy, providers, schema/RLS/RPC, runtime/fixtures,
credentials, hosted state or Git lifecycle. Do not alter accepted HITO-224/HITO-232/HITO-235/
HITO-236/HITO-237 boundaries.

## Proof

Before the write, reconfirm the two direct production consumers and the one-way Result/Evidence
type-to-Presentation dependency. Prove the three exact mapper outputs, the existing factual
evidence contract, zero `feedbackMarkerMeta` occurrences in `training.ts`, zero old-path aliases
or duplicate mappings and no Result/Evidence-to-Presentation reverse import. Run focused TypeScript,
Prettier and diff hygiene. Browser proof is not required unless the diff changes observable label,
visibility or interaction behavior.

Stop and return to PRODUCT if another production consumer appears, a third domain is required, an
observable label/visibility behavior must change, a reverse import arises, or the move touches
persisted/route behavior. Rollback is limited to the uncommitted mapper/import/proof slice; do not
retain parallel owners as a fallback.
