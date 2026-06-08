import type { AdditionalPlanPersistenceMetadata } from "@/lib/plan-authoring-snapshot";
import type { PlanPresetReviewDraftContract } from "@/lib/plan-presets/schema";
import type { Json } from "@/lib/supabase/database";

export function buildPlanPresetPersistenceMetadata(
  draft: PlanPresetReviewDraftContract,
): AdditionalPlanPersistenceMetadata {
  const reviewMetadata = {
    schema_version: "plan-preset-review-v1",
    source_kind: draft.source_kind,
    source_status: draft.sourceStatus,
    preset_id: draft.presetId,
    preset_version: draft.presetVersion,
    start_date: draft.reviewShape.startDate,
    estimated_end_date: draft.reviewShape.estimatedEndDate,
    duration_weeks: draft.reviewShape.durationWeeks,
    days_per_week: draft.reviewShape.daysPerWeek,
    long_run_day: draft.reviewShape.longRunDay,
    program_family: draft.reviewShape.programFamily,
    workout_mix_summary: draft.reviewShape.workoutMixSummary,
    key_workout_types: draft.reviewShape.keyWorkoutTypes.slice(0, 8),
    metric_policy: draft.reviewShape.metricPolicy,
    metric_mode_summary: draft.reviewShape.metricModeSummary,
    level_fit_summary: draft.reviewShape.levelFitSummary,
    row_counts: draft.reviewShape.rowCounts,
    assumptions: draft.reviewShape.safetyAssumptions.slice(0, 8),
    identity_summary: draft.reviewShape.identitySummary.slice(0, 24),
    metric_truth: {
      executable_mode: draft.metricTruth.executableMode,
      pace_targets_allowed: draft.metricTruth.paceTargetsAllowed,
      pace_truth_source: draft.metricTruth.paceTruthSource,
      hr_targets_allowed: draft.metricTruth.hrTargetsAllowed,
      hr_target_source: draft.metricTruth.hrTargetSource,
      default_estimated_hr_available: draft.metricTruth.defaultEstimatedHrAvailable,
      default_estimated_hr_is_advisory_only: draft.metricTruth.defaultEstimatedHrIsAdvisoryOnly,
    },
  };

  return {
    goalMetadata: toJson({
      source_kind: draft.source_kind,
      source_status: draft.sourceStatus,
      preset_id: draft.presetId,
      preset_version: draft.presetVersion,
      start_date: draft.reviewShape.startDate,
      estimated_end_date: draft.reviewShape.estimatedEndDate,
      duration_weeks: draft.reviewShape.durationWeeks,
      program_family: draft.reviewShape.programFamily,
      row_counts: draft.reviewShape.rowCounts,
    }),
    planPreferences: toJson({
      plan_preset_review: reviewMetadata,
      plan_preset_authoring_summary: {
        running_days_per_week: draft.reviewShape.runningDaysPerWeek,
        fixed_rest_days: draft.reviewShape.fixedRestDays,
        preferred_long_run_day: draft.reviewShape.preferredLongRunDay,
        target_mode: draft.reviewShape.targetMode,
        weekly_rhythm_summary: draft.reviewShape.weeklyRhythmSummary,
        rest_days: draft.reviewShape.restDays,
      },
    }),
  };
}

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}
