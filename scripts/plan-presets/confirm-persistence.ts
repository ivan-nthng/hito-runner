import assert from "node:assert/strict";
import { buildReviewedFirstPlanImportedSeed } from "../../src/lib/active-plan-persistence";
import { buildPersistedWorkoutInsertRows } from "../../src/lib/persisted-plan-replacement";
import { buildPlanPresetReviewDraftContract } from "../../src/lib/plan-presets/expand";
import { buildPlanPresetPersistenceMetadata } from "../../src/lib/plan-presets/persistence-metadata";
import {
  isPlanPresetReviewDraftSignatureValid,
  signPlanPresetReviewDraft,
} from "../../src/lib/plan-presets/review-token";
import type { Json } from "../../src/lib/supabase/database";
import { baseInput } from "./helpers";

export async function validatePlanPresetConfirmPersistenceContract() {
  const draft = buildPlanPresetReviewDraftContract({
    cardId: "half_marathon",
    input: baseInput,
  });
  const signature = await signPlanPresetReviewDraft({
    cardId: "half_marathon",
    input: baseInput,
    draft,
  });
  const rebuiltDraft = buildPlanPresetReviewDraftContract({
    cardId: "half_marathon",
    input: baseInput,
  });

  assert.equal(
    await isPlanPresetReviewDraftSignatureValid(
      {
        cardId: "half_marathon",
        input: baseInput,
        draft,
      },
      signature,
    ),
    true,
  );
  assert.equal(
    await isPlanPresetReviewDraftSignatureValid(
      {
        cardId: "half_marathon",
        input: baseInput,
        draft: rebuiltDraft,
      },
      signature,
    ),
    true,
    "Expected a freshly issued review signature to validate against an immediate server-side rebuild.",
  );
  assert.equal(
    await isPlanPresetReviewDraftSignatureValid(
      {
        cardId: "half_marathon",
        input: baseInput,
        draft: {
          ...draft,
          canonicalPlan: {
            ...draft.canonicalPlan,
            created_at: "2099-01-01T00:00:00.000Z",
          },
        },
      },
      signature,
    ),
    true,
    "Expected volatile canonicalPlan.created_at differences to be excluded from review signature exactness.",
  );
  assert.equal(
    await isPlanPresetReviewDraftSignatureValid(
      {
        cardId: "half_marathon",
        input: {
          ...baseInput,
          schedule: {
            startDate: "2026-06-15",
            targetDate: null,
          },
        },
        draft,
      },
      signature,
    ),
    false,
    "Expected stale start-date/setup mismatch to invalidate the review signature.",
  );
  assert.equal(
    await isPlanPresetReviewDraftSignatureValid(
      {
        cardId: "half_marathon",
        input: {
          ...baseInput,
          profile: {
            ...baseInput.profile,
            weightKg: baseInput.profile.weightKg + 1,
          },
        },
        draft,
      },
      signature,
    ),
    false,
    "Expected changed setup input to invalidate the review signature.",
  );
  assert.equal(
    await isPlanPresetReviewDraftSignatureValid(
      {
        cardId: "10k",
        input: baseInput,
        draft,
      },
      signature,
    ),
    false,
    "Expected selected preset mismatch to invalidate the review signature.",
  );
  assert.equal(
    await isPlanPresetReviewDraftSignatureValid(
      {
        cardId: "half_marathon",
        input: baseInput,
        draft: {
          ...draft,
          reviewShape: {
            ...draft.reviewShape,
            estimatedEndDate: "2099-01-01",
          },
        },
      },
      signature,
    ),
    false,
    "Expected tampered review metadata to invalidate the review signature.",
  );
  assert.equal(
    await isPlanPresetReviewDraftSignatureValid(
      {
        cardId: "half_marathon",
        input: baseInput,
        draft: {
          ...draft,
          canonicalPlan: {
            ...draft.canonicalPlan,
            planned_workouts: draft.canonicalPlan.planned_workouts.map((workout, index) =>
              index === 0
                ? {
                    ...workout,
                    title: `${workout.title} tampered`,
                  }
                : workout,
            ),
          },
        },
      },
      signature,
    ),
    false,
    "Expected tampered canonical workout rows to invalidate the review signature.",
  );
  assert.equal(
    await isPlanPresetReviewDraftSignatureValid(
      {
        cardId: "half_marathon",
        input: baseInput,
        draft,
      },
      {
        reviewToken: "sha256:invalid",
        reviewChecksum: signature.reviewChecksum,
      },
    ),
    false,
    "Expected invalid review token to fail.",
  );
  assert.equal(
    await isPlanPresetReviewDraftSignatureValid(
      {
        cardId: "half_marathon",
        input: baseInput,
        draft,
      },
      {
        reviewToken: signature.reviewToken,
        reviewChecksum: "sha256:invalid",
      },
    ),
    false,
    "Expected mismatched review checksum to fail.",
  );

  assertPlanPresetPersistenceMetadata(draft);

  const importedSeed = buildReviewedFirstPlanImportedSeed(draft.canonicalPlan);
  const persistedRows = buildPersistedWorkoutInsertRows(
    "plan-cycle-id",
    "runner-id",
    importedSeed.workouts,
  );

  assert.equal(persistedRows.length, draft.canonicalPlan.planned_workouts.length);
  assert.equal(importedSeed.sourceKind, "plan_preset_v1");
  assert.equal(importedSeed.workouts.length, draft.reviewShape.rowCounts.calendarRows);
  assert.equal(
    importedSeed.workouts.filter((workout) => workout.workoutType !== "rest").length,
    draft.reviewShape.rowCounts.nonRestRows,
  );

  for (const [index, persistedRow] of persistedRows.entries()) {
    const reviewedWorkout = importedSeed.workouts[index];

    assert.equal(persistedRow.workout_date, reviewedWorkout.workoutDate);
    assert.equal(persistedRow.weekday, reviewedWorkout.weekday);
    assert.equal(persistedRow.week_number, reviewedWorkout.weekNumber);
    assert.equal(persistedRow.workout_type, reviewedWorkout.workoutType);
    assert.equal(persistedRow.workout_identity, reviewedWorkout.workoutIdentity);
    assert.deepEqual(persistedRow.steps, reviewedWorkout.steps);
  }
}

function assertPlanPresetPersistenceMetadata(
  draft: ReturnType<typeof buildPlanPresetReviewDraftContract>,
) {
  const metadata = buildPlanPresetPersistenceMetadata(draft);
  const goalMetadata = asRecord(metadata.goalMetadata);
  const planPreferences = asRecord(metadata.planPreferences);
  const review = asRecord(planPreferences.plan_preset_review);

  assert.equal(goalMetadata.source_kind, "plan_preset_v1");
  assert.equal(goalMetadata.source_status, "preset_recipe_expanded");
  assert.equal(goalMetadata.preset_id, draft.presetId);
  assert.equal(goalMetadata.preset_version, draft.presetVersion);
  assert.equal(goalMetadata.start_date, draft.reviewShape.startDate);
  assert.equal(goalMetadata.estimated_end_date, draft.reviewShape.estimatedEndDate);
  assert.deepEqual(goalMetadata.row_counts, draft.reviewShape.rowCounts);

  assert.equal(review.source_kind, "plan_preset_v1");
  assert.equal(review.source_status, "preset_recipe_expanded");
  assert.equal(review.preset_id, draft.presetId);
  assert.equal(review.preset_version, draft.presetVersion);
  assert.equal(review.metric_policy, draft.reviewShape.metricPolicy);
  assert.equal(review.metric_mode_summary, draft.reviewShape.metricModeSummary);
  assert.deepEqual(review.row_counts, draft.reviewShape.rowCounts);
}

function asRecord(value: Json | null | undefined): Record<string, Json> {
  assert.ok(value && typeof value === "object" && !Array.isArray(value));

  return value as Record<string, Json>;
}
