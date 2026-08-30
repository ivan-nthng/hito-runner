# Hito Shared Facade First Extraction Decision

Work Item ID: `2026-08-21-hito-shared-facade-first-extraction-decision`
Notion Task: [HITO-238](https://app.notion.com/p/Choose-the-First-Shared-Facade-Extraction-3c3fe5f58cf581debdf2d22a87cf06d4)
Type: Research / Decision
Parent: [Hito Modular Monolith Domain-Boundary Transformation Implementation](./2026-08-18-hito-modular-monolith-domain-boundary-transformation-implementation.md)
Depends On: [Hito Identity-Owned Actor Classification](./2026-08-21-hito-identity-owned-actor-classification.md)
Evidence From: [Hito Modular Monolith Domain-Boundary Transformation](../../plans/archive/2026-08-18-hito-modular-monolith-domain-boundary-transformation.md#phase-6--shared-facade-reduction-and-truth-reconciliation)

## Scope

Make one finite Phase-6 decision: identify the first source-backed responsibility that can be
removed from a shared facade without creating a compatibility path or broad extraction. The outcome
is one admitted implementation slice or evidence that none is ready. It is not a rewrite of
`training-api.ts`, `route-data-actions.ts` or `training.ts`.

## Archive Intent

Retain the direct-consumer map, selected canonical owner and removal boundary as technical input for
HITO-218. Operational lifecycle, delivery steps, handoffs and history live only in the linked
Notion task.

## Task

Inspect only the current direct production and focused-proof consumers of the demonstrated
responsibilities in `training-api.ts`, `route-data-actions.ts` and `training.ts`, after the accepted
Calendar, Evidence/Progress and Identity moves. Select one responsibility only when it has a
canonical domain owner, one-way dependency direction, bounded consumers, an explicit public
contract, a removable old export/responsibility and focused proof.

Possible candidate responsibilities are Calendar snapshot/types, WorkoutDocument aliases, result
marker display, and locale/date presentation. These are hypotheses, not pre-authorized moves. The
decision must reject any candidate that would require cross-domain persistence access, route-side
policy reconstruction, a compatibility facade, a second writer or a new framework.

## What Not To Touch

Do not implement source moves, alter public behavior, move files by size, rewrite current-system
documentation, introduce a package/registry/dependency framework, change schema/RLS/RPC, runtime,
fixtures, providers, hosted state, credentials or Git lifecycle. Do not re-open accepted
HITO-224/HITO-232/HITO-235/HITO-236/HITO-237 boundaries.

## Proof

The decision records one direct-consumer map, runtime and type-only dependency direction, proposed
canonical owner and public contract, exact deletion/reverse-import condition, focused validation
and rollback/stop condition. If no candidate meets all conditions, record the first missing
discriminator and leave implementation unadmitted.

## Architecture Decision — 2026-08-21

### Decision

Admit exactly one next implementation slice: move the runner-facing workout feedback marker
presentation mapping out of `src/lib/training.ts` into one Frontend-owned presentation contract.
The current export is `feedbackMarkerMeta`. Its factual input remains
`WorkoutFeedbackMarkerSummary` in the accepted Result/Evidence public contract; this slice moves
only the two labels and their short labels. It does not move result state, Calendar snapshot
assembly, persistence, evidence policy or Design System primitives.

The proposed owner is `src/components/workout-feedback-marker-presentation.ts`. This is a real
presentation owner, not a facade: it owns one pure mapping and is consumed directly. Do not
re-export it from `training.ts` and do not add an alias, fallback or second representation.

### Current Direct-Consumer Census

| Candidate                | Direct production consumers                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Focused-proof consumers                                                                                                                                                                                                                                                                  | Decision                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Calendar snapshot/types  | `TrainingSnapshot` has 12 direct consumers: `AppShell.tsx`, `Calendar.tsx`, `CompletionPanel.tsx`, `TodayHero.tsx`, `calendar-projection.ts`, `manual-calendar-actions.ts`, `WorkoutActivityFileDialog.tsx`, `route-data-actions.ts`, `runner-calendar-snapshot.ts`, `training-api.ts`, `user-settings-actions.ts`, and `workout.$date.tsx`                                                                                                                                              | `validate-runner-calendar-context.ts` directly proves the accepted persisted snapshot owner                                                                                                                                                                                              | Reject for Phase 6A. HITO-232 already moved persisted assembly to `runner-calendar-snapshot.ts`; the remaining union deliberately spans signed-out preview, onboarding and authenticated Calendar consumers. Moving it would reopen that accepted boundary and lacks one domain owner.                                             |
| WorkoutDocument aliases  | 11 unique production files use 12 import declarations from `training.ts`: `WorkoutGlyph.tsx`, `ManualWorkoutDocumentPreview.tsx`, `WorkoutStructureTimeline.tsx`, `workout-document-notes.ts`, `workout-structure-timeline-items.ts`, `signed-out-preview-plan.ts`, `manual-workout-authoring/templates.ts`, `plan-creation-engine/source-types.ts`, `plan-export.ts`, `workout-glyph.ts`, and `compare-workout-result.ts`; `manual-workout-authoring/templates.ts` has two declarations | Five direct proof files import `Step` or `StepTarget`: constructor, move, saved-template and template-default proofs plus `validate-planned-workout-language.ts`                                                                                                                         | Reject as the first slice. The aliases are type-only, but their consumers cross Presentation, signed-out preview, source authoring/export and Result/Evidence. One owner cannot remove all aliases without taking another domain's implementation boundary. HITO-224 remains accepted and is not reopened.                         |
| Result-marker display    | `feedbackMarkerMeta` has exactly two direct production consumers: `src/components/TodayHero.tsx` and `src/components/calendar/calendar-projection.ts`                                                                                                                                                                                                                                                                                                                                    | No current proof imports the mapper. `validate-workout-evidence-comparison.ts` already proves the factual marker states, and `validate-workout-comparison-readback.tsx` is the existing Frontend Product readback proof to receive the three direct mapping assertions in the same slice | **Select.** One Frontend owner, two bounded consumers, one terminal public input contract, no persistence or route reconstruction, and one removable old export.                                                                                                                                                                   |
| Locale/date presentation | `formatDate`, `weekdayShort` and `weekdayLong` have 23 production import sites and seven direct proof/fixture consumers                                                                                                                                                                                                                                                                                                                                                                  | `validate-plan-goal-intent-contract.ts` proves the current fixed English/date-only behavior; several Calendar, plan and runner-activity proofs consume `weekdayLong`                                                                                                                     | Reject. `ui-locale.ts` owns locale resolution but does not yet expose a display-formatter contract, while the current helpers hard-code `en-US`. The Phase-6 plan explicitly holds locale work for a locale outcome; moving these helpers now would either preserve wrong authority or require a Product/Frontend locale decision. |

`training-api.ts` now delegates persisted Calendar assembly to `runner-calendar-snapshot.ts` and
contains transport/authentication composition for its route functions. `route-data-actions.ts`
composes accepted projections and has one direct production importer, `training-api.ts`. Neither
contains a smaller demonstrated responsibility that should be extracted in this decision.

### Public Contract And Dependency Direction

The Frontend-owned contract is:

```ts
export type WorkoutFeedbackMarkerPresentation =
  | {
      state: "evidence_attached";
      label: "Evidence attached";
      shortLabel: "Evidence";
    }
  | {
      state: "feedback_ready";
      label: "Feedback ready";
      shortLabel: "Feedback";
    };

export function feedbackMarkerMeta(
  marker: WorkoutFeedbackMarkerSummary | null,
): WorkoutFeedbackMarkerPresentation | null;
```

The implementation must copy the existing mapping without changing output. The final dependency
direction is one-way:

```text
Result/Evidence public type
  <- type-only import -- Frontend feedback-marker presentation
  <- runtime imports --- TodayHero and Calendar projection
```

`src/lib/workout-result-import/types.ts` has no import back to Presentation or `training.ts`.
Neither Result/Evidence internals, `training-api.ts`, `route-data-actions.ts` nor
`runner-calendar-snapshot.ts` may import the new presentation owner. `training.ts` retains its
type-only `WorkoutFeedbackMarkerSummary` dependency solely because `Workout.feedbackMarker` is part
of the shared snapshot DTO; it must not retain label derivation or import the new owner. Recursive
traversal from the new owner therefore terminates at the public Result/Evidence type and cannot
return through a runtime or type-only edge.

### Next Implementation Slice

Owner: `FRONTEND`, Primary Area `Runner`.

1. Add `src/components/workout-feedback-marker-presentation.ts` with the exact public contract and
   unchanged pure mapping above.
2. Migrate `TodayHero.tsx` and `calendar-projection.ts` directly to that owner.
3. Delete `feedbackMarkerMeta` from `training.ts`; do not re-export or alias it.
4. Extend the existing `scripts/validate-workout-comparison-readback.tsx` proof with direct
   assertions for `null`, `evidence_attached` and `feedback_ready`, including both labels.
5. Prove the Result/Evidence producer and the shared facade boundary without changing either:
   run `scripts/validate-workout-evidence-comparison.ts`, the focused Product readback proof,
   focused TypeScript, reverse-import search, formatting and `git diff --check`.

The slice is complete only when reverse search finds `feedbackMarkerMeta` in the new owner, its two
consumers and the focused proof, with zero occurrences in `training.ts`; the two label pairs also
have zero ownership in `training.ts`. There must be no old-path re-export, alias, fallback, duplicate
mapper or Result/Evidence-to-Presentation import.

### Stop And Rollback

Stop and return to PRODUCT before implementation expands if source reveals another production
consumer, a third domain, a required change to marker states/copy, a reverse dependency, persisted
or route behavior, or a need to alter HITO-224/HITO-232/HITO-235/HITO-236/HITO-237 source. An
observable label or visibility change is a product change and requires its own decision and
risk-derived browser proof; this admitted slice is behavior-preserving.

Rollback is the exact uncommitted Frontend slice: restore the mapper and two imports to their prior
locations and remove the new owner/proof assertions. No schema, data, environment or provider state
is involved. Do not retain the new owner beside the old export as a rollback or compatibility path.

### Acceptance Boundary

This decision admits only the bounded Frontend extraction above. It does not claim source
implementation, test execution, browser or independent QA, Global QA, release, deployment, hosted
parity or completion of Phase 6. PRODUCT owns acceptance and the next implementation dispatch.
