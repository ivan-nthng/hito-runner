import {
  AI_AUTHORED_PLAN_FIRST_ENDPOINT_IDENTITY,
  aiAuthoredDetailedBlockSchema,
  aiAuthoredPlanFirstCompilerDraftSchema,
  resolveAiAuthoredPaceProvenance,
  type AiAuthoredPlanFirstCompilerDraft,
  type AiAuthoredPlanFirstCompilerStep,
  type AiAuthoredPlanFirstCompilerUnit,
  type AiAuthoredPlanFirstCompilerWorkout,
} from "@/lib/ai-authored-plan-first-provider-contract";
import { resolveEffectiveHeartRateGuidance } from "@/lib/heart-rate-zones";
import {
  FUTURE_TEMPLATE_VERSION,
  buildImportedPlanSeed,
  trainingPlanV2Schema,
  type TrainingPlanV2,
} from "@/lib/imported-plan";
import { SELECTED_DISTANCE_ENDPOINT_SOURCE_KIND } from "@/lib/plan-creation-engine/selected-distance-endpoint";
import { collectWorkoutDurationTitleIssues } from "@/lib/workout-duration-title-contract";
import {
  canonicalFamilyToLegacyWorkoutType,
  deriveCanonicalMetricMode,
  resolveCanonicalWorkoutModel,
  toCanonicalMetricModeJson,
  type CanonicalWorkoutIdentity,
} from "@/lib/rich-workout-model";
import {
  validateLongRunExecutionPolicy,
  type LongRunExecutionStage,
  type LongRunExecutionStageRole,
} from "@/lib/long-run-execution-policy";
import type { StructuredPlanAuthoringInput } from "@/lib/structured-plan-authoring-schema";
import { addDaysIso, diffDaysIso, startOfWeekIso, weekdayLong } from "@/lib/training";
import { uniqueWeekdays, type WeekdayName } from "@/lib/weekday-rest-invariants";
import {
  AI_AUTHORED_PLAN_GUIDANCE_TARGET_SOURCE,
  WORKOUT_DOCUMENT_HYDRATION_CUE,
  WORKOUT_DOCUMENT_HYDRATION_LABEL,
} from "@/lib/workout-document";
import { stableJsonStringify } from "@/lib/review-token-signing";
import type { ZodIssue } from "zod";
import type { WorkoutDocument } from "@/lib/workout-document";

type CompilerIssue = { code: string; message: string; path?: string };
type StructuredAuthoringInput = Omit<StructuredPlanAuthoringInput, "requestContext">;
type TrainingPlanSegment = TrainingPlanV2["planned_workouts"][number]["segments"][number];
type TrainingPlanTarget = NonNullable<TrainingPlanSegment["target"]>;
type TrainingPlanRepeatChild = NonNullable<
  NonNullable<TrainingPlanSegment["prescription"]>["children"]
>[number];
type TargetExecutionContext = {
  workoutIdentity: CanonicalWorkoutIdentity;
  segmentType: string;
  repeatChildRole?: AiAuthoredPlanFirstCompilerUnit["role"];
  authoredPurpose: string | null;
  prescription: AiAuthoredPlanFirstCompilerUnit["prescription"];
};

export const AI_AUTHORED_PLAN_FIRST_SOURCE_KIND = "adaptive_blueprint_four_week_v1" as const;
export const AI_AUTHORED_BLUEPRINT_VERSION = "adaptive_blueprint_v1" as const;
export const AI_AUTHORED_PLAN_FIRST_COMPILER_VERSION = "adaptive_blueprint_compiler_v10" as const;

export interface AiAuthoredBlueprintSummary {
  version: typeof AI_AUTHORED_BLUEPRINT_VERSION;
  startDate: string;
  selectedTargetDate: string;
  targetAssumption: string;
  phases: AiAuthoredPlanFirstCompilerDraft["blueprint"]["phases"];
  projections: AiAuthoredPlanFirstCompilerDraft["blueprint"]["projections"];
  detailedHorizon: {
    startDate: string;
    endDate: string;
    calendarWeekCount: number;
    targetBoundary: boolean;
  };
}

export interface AiAuthoredBlueprintReviewConflict {
  code: "fixed_rest_day_preference_conflict" | "preferred_long_run_day_conflict";
  date: string;
  message: string;
}

type AiAuthoredPlanFirstCompileResult =
  | {
      ok: true;
      canonicalPlan: TrainingPlanV2;
      blueprint: AiAuthoredBlueprintSummary;
      reviewConflicts: AiAuthoredBlueprintReviewConflict[];
      validationIssues: string[];
    }
  | {
      ok: false;
      reason: string;
      issues: CompilerIssue[];
    };

export function compileAiAuthoredPlanFirstDraft({
  draft,
  authoringInput,
}: {
  draft: unknown;
  authoringInput: StructuredAuthoringInput;
}): AiAuthoredPlanFirstCompileResult {
  if ("requestContext" in authoringInput) {
    return {
      ok: false,
      reason: "ai_authored_plan_first_transient_context_after_dispatch",
      issues: [
        {
          code: "ai_authored_plan_first_transient_context_after_dispatch",
          message: "Transient runner context cannot enter the post-provider compiler boundary.",
          path: "authoringInput.requestContext",
        },
      ],
    };
  }

  const normalized = normalizeProviderDraft({ draft, authoringInput });

  if (!normalized.ok) {
    return normalized;
  }

  const issues = [...normalized.issues];
  const reviewConflicts: AiAuthoredBlueprintReviewConflict[] = [];
  const compiled = compileProviderDraft({
    draft: normalized.draft,
    authoringInput,
    issues,
    reviewConflicts,
  });

  if (issues.length > 0) {
    return {
      ok: false,
      reason: "ai_authored_plan_first_rejected_before_review",
      issues,
    };
  }

  const canonicalResult = trainingPlanV2Schema.safeParse(compiled);
  if (!canonicalResult.success) {
    return {
      ok: false,
      reason: "ai_authored_plan_first_compiler_output_invalid",
      issues: canonicalResult.error.issues.slice(0, 16).map((issue) => ({
        code: "ai_authored_plan_first_compiler_output_invalid",
        path: issue.path.join(".") || "root",
        message: issue.message,
      })),
    };
  }

  const durationTitleIssues = collectWorkoutDurationTitleIssues(
    canonicalResult.data.planned_workouts,
  );
  if (durationTitleIssues.length > 0) {
    return {
      ok: false,
      reason: "ai_authored_plan_first_rejected_before_review",
      issues: durationTitleIssues.map((issue) => ({
        code: `ai_authored_plan_first_${issue.code}`,
        path: issue.path,
        message: issue.message,
      })),
    };
  }

  return {
    ok: true,
    canonicalPlan: canonicalResult.data,
    blueprint: buildBlueprintSummary(normalized.draft),
    reviewConflicts,
    validationIssues: [],
  };
}

export type AiAuthoredContinuationCompileResult =
  | {
      ok: true;
      workoutDocuments: WorkoutDocument[];
      reviewConflicts: AiAuthoredBlueprintReviewConflict[];
    }
  | { ok: false; reason: string; issues: CompilerIssue[] };

export function compileAiAuthoredContinuationDetailedBlock(input: {
  response: unknown;
  authoringInput: StructuredAuthoringInput;
  blueprint: AiAuthoredBlueprintSummary;
  interval: {
    startDate: string;
    endDate: string;
    blockMode: "normal_four_week" | "target_taper_boundary" | "resolved_interruption_bridge";
  };
  projections: Array<{
    projectionId: string;
    date: string;
    phase: string;
    workoutFamily: string;
  }>;
}): AiAuthoredContinuationCompileResult {
  const parsed = aiAuthoredDetailedBlockSchema.safeParse(input.response);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "adaptive_continuation_provider_schema_invalid",
      issues: parsed.error.issues.slice(0, 16).map((issue) => ({
        code: "adaptive_continuation_provider_schema_invalid",
        path: issue.path.join(".") || "root",
        message: issue.message,
      })),
    };
  }
  const block = parsed.data;
  const authoredDays = [...block.workouts, block.final_workout].sort((left, right) =>
    left.date.localeCompare(right.date),
  );
  const expected = [...input.projections].sort((left, right) =>
    left.date.localeCompare(right.date),
  );
  const issues: CompilerIssue[] = [];
  if (block.start_date !== input.interval.startDate || block.end_date !== input.interval.endDate) {
    issues.push({
      code: "adaptive_continuation_interval_mismatch",
      path: "detailed_block",
      message: "The authored continuation block must match the exact reviewed interval.",
    });
  }
  if (
    authoredDays.length !== expected.length ||
    authoredDays.some((day, index) => day.date !== expected[index]?.date)
  ) {
    issues.push({
      code: "adaptive_continuation_projection_coverage_mismatch",
      path: "detailed_block",
      message: "The authored continuation must cover each reviewed projection exactly once.",
    });
  }
  for (const [index, day] of authoredDays.entries()) {
    const projection = expected[index];
    if (!projection) continue;
    if (day.phase !== projection.phase) {
      issues.push({
        code: "adaptive_continuation_phase_mismatch",
        path: `detailed_block.workouts.${index}.phase`,
        message: "The authored workout phase does not match its immutable Blueprint projection.",
      });
    }
    if (familyForIdentity(day.workout_identity) !== projection.workoutFamily) {
      issues.push({
        code: "adaptive_continuation_family_mismatch",
        path: `detailed_block.workouts.${index}.workout_identity`,
        message: "The authored workout family does not match its immutable Blueprint projection.",
      });
    }
  }
  validateContinuationSteadyFamilyFidelity({ authoredDays, issues });
  if (input.interval.blockMode === "resolved_interruption_bridge") {
    validateResolvedInterruptionBridgeDensity({
      authoredDays,
      intervalStartDate: input.interval.startDate,
      issues,
    });
  }
  if (block.final_workout.date !== authoredDays.at(-1)?.date) {
    issues.push({
      code: "adaptive_continuation_final_workout_not_last",
      path: "detailed_block.final_workout.date",
      message: "The continuation final_workout must be the chronologically last reviewed workout.",
    });
  }
  if (issues.length > 0) {
    return { ok: false, reason: issues[0]!.code, issues };
  }

  const compilerInput: StructuredAuthoringInput = {
    ...input.authoringInput,
    schedule: { ...input.authoringInput.schedule, startDate: input.interval.startDate },
  };
  const reviewConflicts: AiAuthoredBlueprintReviewConflict[] = [];
  const compiled = compileProviderDraft({
    draft: {
      blueprint: {
        start_date: input.blueprint.startDate,
        selected_target_date: input.blueprint.selectedTargetDate,
        target_assumption: input.blueprint.targetAssumption,
        phases: input.blueprint.phases,
        projections: input.blueprint.projections,
      },
      detailed_block: block,
    },
    authoringInput: compilerInput,
    issues,
    reviewConflicts,
  });
  if (issues.length > 0) {
    return { ok: false, reason: issues[0]!.code, issues };
  }
  const canonical = trainingPlanV2Schema.safeParse({
    ...compiled,
    planned_workouts: compiled.planned_workouts.filter(
      (workout) => workout.workout_type !== "rest",
    ),
  });
  if (!canonical.success) {
    return {
      ok: false,
      reason: "adaptive_continuation_compiler_output_invalid",
      issues: canonical.error.issues.slice(0, 16).map((issue) => ({
        code: "adaptive_continuation_compiler_output_invalid",
        path: issue.path.join(".") || "root",
        message: issue.message,
      })),
    };
  }
  return {
    ok: true,
    workoutDocuments: buildImportedPlanSeed(canonical.data).workouts,
    reviewConflicts,
  };
}

function validateContinuationSteadyFamilyFidelity(input: {
  authoredDays: readonly AiAuthoredPlanFirstCompilerWorkout[];
  issues: CompilerIssue[];
}) {
  const easyCommandSignatures = new Set(
    input.authoredDays
      .filter((day) => familyForIdentity(day.workout_identity) === "easy")
      .map((day) => stableJsonStringify(day.sections)),
  );
  for (const [index, day] of input.authoredDays.entries()) {
    if (
      day.workout_identity === "steady_aerobic_run" &&
      easyCommandSignatures.has(stableJsonStringify(day.sections))
    ) {
      input.issues.push({
        code: "adaptive_continuation_steady_aerobic_matches_easy_signature",
        path: `detailed_block.workouts.${index}.sections`,
        message:
          "A steady aerobic continuation must preserve a controlled-steady command distinct from every easy command.",
      });
    }
  }
}

function validateResolvedInterruptionBridgeDensity(input: {
  authoredDays: AiAuthoredPlanFirstCompilerWorkout[];
  intervalStartDate: string;
  issues: CompilerIssue[];
}) {
  let firstWeekDurationMinutes = 0;
  for (const [index, day] of input.authoredDays.entries()) {
    const dayOffset = diffDaysIso(day.date, input.intervalStartDate);
    const durationMinutes = completeRunnableDurationMinutes(day);
    if (durationMinutes == null) {
      continue;
    }
    const isLong = familyForIdentity(day.workout_identity) === "long";
    if (dayOffset < 7) {
      firstWeekDurationMinutes += durationMinutes;
      const maximumDurationMinutes = isLong ? 60 : 35;
      if (durationMinutes > maximumDurationMinutes + Number.EPSILON) {
        input.issues.push({
          code: isLong
            ? "adaptive_continuation_bridge_opening_long_too_dense"
            : "adaptive_continuation_bridge_opening_session_too_dense",
          path: `detailed_block.workouts.${index}.sections`,
          message: `The opening bridge ${isLong ? "long" : "non-long"} workout exceeds ${maximumDurationMinutes} runnable minutes.`,
        });
      }
    } else if (isLong && durationMinutes > 75 + Number.EPSILON) {
      input.issues.push({
        code: "adaptive_continuation_bridge_second_long_too_dense",
        path: `detailed_block.workouts.${index}.sections`,
        message: "The second bridge long workout exceeds 75 runnable minutes.",
      });
    }
  }
  if (firstWeekDurationMinutes > 165 + Number.EPSILON) {
    input.issues.push({
      code: "adaptive_continuation_bridge_opening_week_too_dense",
      path: "detailed_block.workouts",
      message: "The opening bridge week exceeds 165 runnable minutes.",
    });
  }
}

function normalizeProviderDraft({
  draft,
  authoringInput,
}: {
  draft: unknown;
  authoringInput: StructuredAuthoringInput;
}):
  | { ok: true; draft: AiAuthoredPlanFirstCompilerDraft; issues: CompilerIssue[] }
  | { ok: false; reason: string; issues: CompilerIssue[] } {
  const providerResult = aiAuthoredPlanFirstCompilerDraftSchema.safeParse(draft);

  if (!providerResult.success) {
    return {
      ok: false,
      reason: "ai_authored_plan_first_provider_schema_invalid",
      issues: providerResult.error.issues.slice(0, 16).map((issue) => ({
        code: providerSchemaIssueCode(issue),
        path: issue.path.join(".") || "root",
        message: issue.message,
      })),
    };
  }

  const issues: CompilerIssue[] = [];
  const startDate = authoringInput.schedule.startDate;
  const latestDate = addDaysIso(startDate, 363);
  const targetDate = providerResult.data.blueprint.selected_target_date;
  const fourWeekEndDate = addDaysIso(startDate, 27);
  const detailedEndDate = targetDate < fourWeekEndDate ? targetDate : fourWeekEndDate;
  const authoredDays = [
    ...providerResult.data.detailed_block.workouts,
    providerResult.data.detailed_block.final_workout,
  ];
  const authoredDates = new Set<string>();

  for (const [index, day] of authoredDays.entries()) {
    const path =
      index === authoredDays.length - 1
        ? "detailed_block.final_workout.date"
        : `detailed_block.workouts.${index}.date`;

    if (authoredDates.has(day.date)) {
      issues.push({
        code: "ai_authored_plan_first_duplicate_date",
        path,
        message: `${day.date} appears more than once in the provider draft.`,
      });
    }
    authoredDates.add(day.date);

    if (day.date < startDate || day.date > detailedEndDate) {
      issues.push({
        code: "ai_authored_plan_first_date_out_of_range",
        path,
        message: `${day.date} falls outside the detailed horizon ${startDate} through ${detailedEndDate}.`,
      });
    }
  }

  if (providerResult.data.blueprint.start_date !== startDate) {
    issues.push({
      code: "ai_authored_blueprint_start_date_mismatch",
      path: "blueprint.start_date",
      message: `Blueprint start ${providerResult.data.blueprint.start_date} must equal ${startDate}.`,
    });
  }
  if (targetDate < startDate || targetDate > latestDate) {
    issues.push({
      code: "ai_authored_blueprint_target_date_out_of_range",
      path: "blueprint.selected_target_date",
      message: `Blueprint target ${targetDate} must fall between ${startDate} and ${latestDate}.`,
    });
  }
  if (!authoringInput.planGoalIntent.targetDate) {
    issues.push({
      code: "ai_authored_blueprint_selected_target_missing",
      path: "authoringInput.planGoalIntent.targetDate",
      message: "A Blueprint requires the runner-selected target date before provider review.",
    });
  } else if (targetDate !== authoringInput.planGoalIntent.targetDate) {
    issues.push({
      code: "ai_authored_blueprint_selected_target_mismatch",
      path: "blueprint.selected_target_date",
      message: `Blueprint target ${targetDate} must preserve the selected target ${authoringInput.planGoalIntent.targetDate}.`,
    });
  }
  if (authoringInput.initialPlanProfile.cutoffDate > startDate) {
    issues.push({
      code: "ai_authored_blueprint_profile_cutoff_after_detailed_start",
      path: "authoringInput.initialPlanProfile.cutoffDate",
      message: `Runner facts cutoff ${authoringInput.initialPlanProfile.cutoffDate} cannot post-date the prospective detailed start ${startDate}.`,
    });
  }
  if (
    providerResult.data.detailed_block.start_date !== startDate ||
    providerResult.data.detailed_block.end_date !== detailedEndDate
  ) {
    issues.push({
      code: "ai_authored_blueprint_detailed_horizon_invalid",
      path: "detailed_block",
      message: `Detailed block must cover ${startDate} through ${detailedEndDate}.`,
    });
  }

  validateBlueprintPhases({
    phases: providerResult.data.blueprint.phases,
    startDate,
    targetDate,
    requestedWeeklyCadence: resolveRequestedExactWeeklyCadence(
      authoringInput.availability.maxRunningDaysPerWeek,
    ),
    issues,
  });
  validateBlueprintProjections({
    projections: providerResult.data.blueprint.projections,
    phases: providerResult.data.blueprint.phases,
    detailedEndDate,
    targetDate,
    issues,
  });
  validateDetailedWorkoutPhases({
    authoredDays,
    phases: providerResult.data.blueprint.phases,
    issues,
  });

  const finalWorkout = providerResult.data.detailed_block.final_workout;
  if (authoredDays.some((day) => day !== finalWorkout && day.date >= finalWorkout.date)) {
    issues.push({
      code: "ai_authored_blueprint_final_detailed_workout_invalid",
      path: "detailed_block.final_workout.date",
      message: "final_workout must be the unique chronologically last detailed workout.",
    });
  }
  const targetInDetailedHorizon = targetDate <= fourWeekEndDate;
  const endpointDays = authoredDays.filter(
    (day) => day.workout_identity === AI_AUTHORED_PLAN_FIRST_ENDPOINT_IDENTITY,
  );
  if (targetInDetailedHorizon) {
    if (
      endpointDays.length !== 1 ||
      finalWorkout.workout_identity !== AI_AUTHORED_PLAN_FIRST_ENDPOINT_IDENTITY ||
      finalWorkout.date !== targetDate
    ) {
      issues.push({
        code: "ai_authored_blueprint_target_boundary_endpoint_invalid",
        path: "detailed_block.final_workout",
        message:
          "A target inside the first four weeks requires one exact target-date final workout.",
      });
    }
  } else if (endpointDays.length > 0) {
    issues.push({
      code: "ai_authored_blueprint_future_endpoint_detail_forbidden",
      path: "detailed_block",
      message:
        "A future target must remain non-executable Blueprint intent outside the first detailed block.",
    });
  }

  const authoredContactsByWeek = new Map<number, number>();
  const weekOneStart = startOfWeekIso(startDate);
  for (const day of authoredDays) {
    const weekNumber = Math.floor(diffDaysIso(day.date, weekOneStart) / 7) + 1;
    authoredContactsByWeek.set(weekNumber, (authoredContactsByWeek.get(weekNumber) ?? 0) + 1);
  }
  for (const [weekNumber, contactCount] of authoredContactsByWeek) {
    const maxRunningDaysPerWeek = authoringInput.availability.maxRunningDaysPerWeek;
    if (maxRunningDaysPerWeek != null && contactCount > maxRunningDaysPerWeek) {
      issues.push({
        code: "ai_authored_plan_first_availability_ceiling_exceeded",
        path: `weeks.${weekNumber}`,
        message: `Week ${weekNumber} has ${contactCount} workouts but the runner allows at most ${maxRunningDaysPerWeek}.`,
      });
    }
  }
  validateRequestedDetailedCadence({
    authoredContactsByWeek,
    startDate,
    detailedEndDate,
    weekOneStart,
    requestedWeeklyCadence: resolveRequestedExactWeeklyCadence(
      authoringInput.availability.maxRunningDaysPerWeek,
    ),
    issues,
  });
  validateFourDayWeekQualityDensity({
    authoredDays,
    weekOneStart,
    maxRunningDaysPerWeek: authoringInput.availability.maxRunningDaysPerWeek,
    issues,
  });
  validateMissingBaselineProgressionSafety({
    authoredDays,
    startDate,
    detailedEndDate,
    weekOneStart,
    issues,
  });

  const preparationHorizonWeeks = Math.max(
    1,
    Math.ceil((diffDaysIso(targetDate, startDate) + 1) / 7),
  );
  if (preparationHorizonWeeks > 52) {
    issues.push({
      code: "ai_authored_plan_first_horizon_out_of_range",
      path: "blueprint.selected_target_date",
      message: "Provider draft exceeds the canonical 52-week plan horizon.",
    });
  }

  return {
    ok: true,
    issues,
    draft: {
      ...providerResult.data,
      blueprint: {
        ...providerResult.data.blueprint,
        phases: [...providerResult.data.blueprint.phases],
        projections: [...providerResult.data.blueprint.projections].sort((left, right) =>
          left.date.localeCompare(right.date),
        ),
      },
      detailed_block: {
        ...providerResult.data.detailed_block,
        workouts: [...providerResult.data.detailed_block.workouts].sort((left, right) =>
          left.date.localeCompare(right.date),
        ),
      },
    },
  };
}

function resolveRequestedExactWeeklyCadence(maxRunningDaysPerWeek: number | null) {
  return maxRunningDaysPerWeek === 4 ? 4 : null;
}

function validateRequestedDetailedCadence(input: {
  authoredContactsByWeek: ReadonlyMap<number, number>;
  startDate: string;
  detailedEndDate: string;
  weekOneStart: string;
  requestedWeeklyCadence: number | null;
  issues: CompilerIssue[];
}) {
  if (input.requestedWeeklyCadence == null) return;

  for (
    let weekStart = input.weekOneStart;
    weekStart <= input.detailedEndDate;
    weekStart = addDaysIso(weekStart, 7)
  ) {
    const weekEnd = addDaysIso(weekStart, 6);
    if (weekStart < input.startDate || weekEnd > input.detailedEndDate) continue;
    const weekNumber = Math.floor(diffDaysIso(weekStart, input.weekOneStart) / 7) + 1;
    const contactCount = input.authoredContactsByWeek.get(weekNumber) ?? 0;
    if (contactCount === input.requestedWeeklyCadence) continue;
    input.issues.push({
      code: "ai_authored_plan_first_requested_weekly_cadence_mismatch",
      path: `weeks.${weekNumber}`,
      message: `Full detailed calendar week ${weekNumber} must contain exactly the runner-requested ${input.requestedWeeklyCadence} workouts; received ${contactCount}.`,
    });
  }
}

const MAX_MISSING_BASELINE_LONG_RUN_BUILD_MINUTES = 10;
const MAX_MISSING_BASELINE_WEEKLY_DURATION_INCREASE_RATIO = 0.15;
const MINIMUM_MISSING_BASELINE_CUTBACK_RATIO = 0.15;
const MISSING_BASELINE_LONG_RUN_QUALITY_IDENTITIES = new Set<CanonicalWorkoutIdentity>([
  "long_run_with_steady_finish",
  "marathon_steady_specificity",
]);

function validateMissingBaselineProgressionSafety(input: {
  authoredDays: readonly AiAuthoredPlanFirstCompilerWorkout[];
  startDate: string;
  detailedEndDate: string;
  weekOneStart: string;
  issues: CompilerIssue[];
}) {
  const longRuns = input.authoredDays
    .filter((day) => familyForIdentity(day.workout_identity) === "long")
    .sort((left, right) => left.date.localeCompare(right.date));

  for (const day of input.authoredDays) {
    if (!MISSING_BASELINE_LONG_RUN_QUALITY_IDENTITIES.has(day.workout_identity)) continue;
    input.issues.push({
      code: "ai_authored_plan_first_missing_baseline_long_run_quality_forbidden",
      path: `${day.date}.workout_identity`,
      message:
        "Without a recent volume and longest-run baseline, the first detailed block cannot prescribe a long-run quality finish.",
    });
  }

  let previousTimedLongRun: { date: string; durationMinutes: number } | null = null;
  for (const day of longRuns) {
    const durationMinutes = completeRunnableDurationMinutes(day);
    if (durationMinutes == null) continue;
    if (
      previousTimedLongRun &&
      durationMinutes - previousTimedLongRun.durationMinutes >
        MAX_MISSING_BASELINE_LONG_RUN_BUILD_MINUTES + Number.EPSILON
    ) {
      input.issues.push({
        code: "ai_authored_plan_first_missing_baseline_long_run_progression_exceeded",
        path: `${day.date}.sections`,
        message: `Without a recent volume and longest-run baseline, a timed long run may increase by at most ${MAX_MISSING_BASELINE_LONG_RUN_BUILD_MINUTES} minutes from the previous timed long run (${previousTimedLongRun.date}).`,
      });
    }
    previousTimedLongRun = { date: day.date, durationMinutes };
  }

  const weeks = new Map<string, AiAuthoredPlanFirstCompilerWorkout[]>();
  for (const day of input.authoredDays) {
    const weekStart = startOfWeekIso(day.date);
    const days = weeks.get(weekStart) ?? [];
    days.push(day);
    weeks.set(weekStart, days);
  }
  let previousTimedWeek: {
    weekStart: string;
    durationMinutes: number;
    contactCount: number;
  } | null = null;
  const timedWeeks: Array<{
    weekStart: string;
    durationMinutes: number;
    contactCount: number;
    longRunDurationMinutes: number | null;
  }> = [];
  for (const [weekStart, days] of [...weeks.entries()].sort(([left], [right]) =>
    left.localeCompare(right),
  )) {
    const durationMinutes = days
      .map(knownTimedRunnableDurationMinutes)
      .reduce((sum, duration) => sum + duration, 0);
    const timedLongRuns = days
      .filter((day) => familyForIdentity(day.workout_identity) === "long")
      .map(completeRunnableDurationMinutes)
      .filter((duration): duration is number => duration != null);
    timedWeeks.push({
      weekStart,
      durationMinutes,
      contactCount: days.length,
      longRunDurationMinutes: timedLongRuns.length === 1 ? timedLongRuns[0]! : null,
    });
    if (
      previousTimedWeek &&
      days.length === previousTimedWeek.contactCount &&
      durationMinutes >
        previousTimedWeek.durationMinutes *
          (1 + MAX_MISSING_BASELINE_WEEKLY_DURATION_INCREASE_RATIO) +
          Number.EPSILON
    ) {
      input.issues.push({
        code: "ai_authored_plan_first_missing_baseline_weekly_duration_progression_exceeded",
        path: `weeks.${Math.floor(diffDaysIso(weekStart, input.weekOneStart) / 7) + 1}`,
        message:
          "Without a recent volume baseline, summed explicitly timed runnable minutes may increase by at most 15 percent from the previous comparable calendar week.",
      });
    }
    previousTimedWeek = { weekStart, durationMinutes, contactCount: days.length };
  }

  const fullTimedWeeks = timedWeeks.filter(
    (week) =>
      week.weekStart >= input.startDate && addDaysIso(week.weekStart, 6) <= input.detailedEndDate,
  );
  if (fullTimedWeeks.length === 4) {
    const thirdWeek = fullTimedWeeks[2]!;
    const fourthWeek = fullTimedWeeks[3]!;
    const maximumCutbackDuration =
      thirdWeek.durationMinutes * (1 - MINIMUM_MISSING_BASELINE_CUTBACK_RATIO);
    if (fourthWeek.contactCount > thirdWeek.contactCount) {
      input.issues.push({
        code: "ai_authored_plan_first_missing_baseline_fourth_week_contact_cutback_missing",
        path: `weeks.${Math.floor(diffDaysIso(fourthWeek.weekStart, input.weekOneStart) / 7) + 1}`,
        message:
          "Without a recent volume baseline, the fourth full detailed week must not increase runnable contacts above week three.",
      });
    }
    if (fourthWeek.durationMinutes > maximumCutbackDuration + Number.EPSILON) {
      input.issues.push({
        code: "ai_authored_plan_first_missing_baseline_fourth_week_cutback_missing",
        path: `weeks.${Math.floor(diffDaysIso(fourthWeek.weekStart, input.weekOneStart) / 7) + 1}`,
        message:
          "Without a recent volume baseline, the fourth full detailed week must cut summed explicitly timed runnable minutes by at least 15 percent from week three.",
      });
    }
    if (
      thirdWeek.longRunDurationMinutes != null &&
      fourthWeek.longRunDurationMinutes != null &&
      fourthWeek.longRunDurationMinutes >
        thirdWeek.longRunDurationMinutes * (1 - MINIMUM_MISSING_BASELINE_CUTBACK_RATIO) +
          Number.EPSILON
    ) {
      input.issues.push({
        code: "ai_authored_plan_first_missing_baseline_fourth_week_long_run_cutback_missing",
        path: `weeks.${Math.floor(diffDaysIso(fourthWeek.weekStart, input.weekOneStart) / 7) + 1}`,
        message:
          "Without a recent longest-run baseline, the fourth full detailed week must cut the timed long run by at least 15 percent from week three.",
      });
    }
  }
}

function knownTimedRunnableDurationMinutes(workout: AiAuthoredPlanFirstCompilerWorkout): number {
  let total = 0;
  for (const section of workout.sections) {
    if (section.kind === "hydration") continue;
    if (section.kind === "unit") {
      if (section.prescription.mode === "time") total += section.prescription.duration_min;
      continue;
    }
    for (const child of section.children) {
      if (child.prescription.mode === "time") {
        total += child.prescription.duration_min * section.rounds;
      }
    }
  }
  return total;
}

function completeRunnableDurationMinutes(
  workout: AiAuthoredPlanFirstCompilerWorkout,
): number | null {
  let total = 0;
  for (const section of workout.sections) {
    if (section.kind === "hydration") continue;
    if (section.kind === "unit") {
      if (section.prescription.mode !== "time") return null;
      total += section.prescription.duration_min;
      continue;
    }
    for (const child of section.children) {
      if (child.prescription.mode !== "time") return null;
      total += child.prescription.duration_min * section.rounds;
    }
  }
  return total;
}

const FOUR_DAY_WEEK_QUALITY_FAMILIES = new Set([
  "steady",
  "tempo",
  "intervals",
  "progression",
  "race",
  "hills",
]);

function validateFourDayWeekQualityDensity(input: {
  authoredDays: readonly AiAuthoredPlanFirstCompilerWorkout[];
  weekOneStart: string;
  maxRunningDaysPerWeek: number | null;
  issues: CompilerIssue[];
}) {
  if (input.maxRunningDaysPerWeek == null || input.maxRunningDaysPerWeek > 4) return;

  const daysByWeek = new Map<number, AiAuthoredPlanFirstCompilerWorkout[]>();
  for (const day of input.authoredDays) {
    const weekNumber = Math.floor(diffDaysIso(day.date, input.weekOneStart) / 7) + 1;
    const days = daysByWeek.get(weekNumber) ?? [];
    days.push(day);
    daysByWeek.set(weekNumber, days);
  }

  for (const [weekNumber, days] of daysByWeek) {
    const qualityDays = days.filter((day) =>
      FOUR_DAY_WEEK_QUALITY_FAMILIES.has(familyForIdentity(day.workout_identity)),
    );
    const longRunDays = days.filter((day) => familyForIdentity(day.workout_identity) === "long");
    if (qualityDays.length <= 1 && longRunDays.length <= 1) continue;

    input.issues.push({
      code: "ai_authored_plan_first_four_day_week_quality_density_exceeded",
      path: `weeks.${weekNumber}`,
      message:
        "A plan with at most four running days may contain at most one non-long quality session and one long run per calendar week; remaining sessions must be easy or recovery.",
    });
  }
}

function validateBlueprintPhases({
  phases,
  startDate,
  targetDate,
  requestedWeeklyCadence,
  issues,
}: {
  phases: AiAuthoredPlanFirstCompilerDraft["blueprint"]["phases"];
  startDate: string;
  targetDate: string;
  requestedWeeklyCadence: number | null;
  issues: CompilerIssue[];
}) {
  let expectedStart = startDate;
  for (const [index, phase] of phases.entries()) {
    if (phase.start_date !== expectedStart || phase.end_date < phase.start_date) {
      issues.push({
        code: "ai_authored_blueprint_phase_bounds_invalid",
        path: `blueprint.phases.${index}`,
        message: `Blueprint phase ${phase.phase} must start on ${expectedStart} and have ordered bounds.`,
      });
    }
    if (
      requestedWeeklyCadence != null &&
      phase.expected_weekly_cadence !== requestedWeeklyCadence
    ) {
      issues.push({
        code: "ai_authored_blueprint_requested_weekly_cadence_mismatch",
        path: `blueprint.phases.${index}.expected_weekly_cadence`,
        message: `Blueprint phase ${phase.phase} must preserve the runner-requested cadence of ${requestedWeeklyCadence} workouts per full calendar week.`,
      });
    }
    expectedStart = addDaysIso(phase.end_date, 1);
  }
  if (phases.at(-1)?.end_date !== targetDate) {
    issues.push({
      code: "ai_authored_blueprint_phase_horizon_incomplete",
      path: "blueprint.phases",
      message: `Blueprint phases must end on selected target ${targetDate}.`,
    });
  }
}

function validateBlueprintProjections({
  projections,
  phases,
  detailedEndDate,
  targetDate,
  issues,
}: {
  projections: AiAuthoredPlanFirstCompilerDraft["blueprint"]["projections"];
  phases: AiAuthoredPlanFirstCompilerDraft["blueprint"]["phases"];
  detailedEndDate: string;
  targetDate: string;
  issues: CompilerIssue[];
}) {
  const ids = new Set<string>();
  const dates = new Set<string>();
  const projectionsByPhaseWeek = new Map<string, number>();
  for (const [index, projection] of projections.entries()) {
    if (ids.has(projection.projection_id) || dates.has(projection.date)) {
      issues.push({
        code: "ai_authored_blueprint_projection_identity_invalid",
        path: `blueprint.projections.${index}`,
        message: "Blueprint projections require unique IDs and dates.",
      });
    }
    ids.add(projection.projection_id);
    dates.add(projection.date);
    const phase = phases.find(
      (candidate) =>
        candidate.phase === projection.phase &&
        projection.date >= candidate.start_date &&
        projection.date <= candidate.end_date,
    );
    if (projection.date <= detailedEndDate || projection.date > targetDate || !phase) {
      issues.push({
        code: "ai_authored_blueprint_projection_bounds_invalid",
        path: `blueprint.projections.${index}`,
        message: `${projection.projection_id} must be future non-executable intent inside its Blueprint phase.`,
      });
      continue;
    }
    if (!phase.workout_families.includes(projection.cadence_or_workout_family)) {
      issues.push({
        code: "ai_authored_blueprint_projection_family_invalid",
        path: `blueprint.projections.${index}.cadence_or_workout_family`,
        message: `${projection.projection_id} must use a workout family permitted by ${phase.phase}.`,
      });
    }
    const phaseWeekKey = `${phase.phase}\u0000${startOfWeekIso(projection.date)}`;
    projectionsByPhaseWeek.set(phaseWeekKey, (projectionsByPhaseWeek.get(phaseWeekKey) ?? 0) + 1);
  }
  if (targetDate > detailedEndDate) {
    const targetProjection = projections.find(
      (projection) =>
        projection.date === targetDate && projection.review_timing === "target_review",
    );
    if (!targetProjection) {
      issues.push({
        code: "ai_authored_blueprint_target_projection_missing",
        path: "blueprint.projections",
        message: `Future Blueprint intent must include one target-review projection on ${targetDate}.`,
      });
    }
    for (const [index, phase] of phases.entries()) {
      if (phase.end_date <= detailedEndDate) continue;
      if (
        !projections.some(
          (projection) =>
            projection.phase === phase.phase &&
            projection.date >= phase.start_date &&
            projection.date <= phase.end_date,
        )
      ) {
        issues.push({
          code: "ai_authored_blueprint_phase_projection_missing",
          path: `blueprint.phases.${index}`,
          message: `Future phase ${phase.phase} requires at least one non-executable projection.`,
        });
      }
    }
    const futureStartDate = addDaysIso(detailedEndDate, 1);
    for (const [phaseIndex, phase] of phases.entries()) {
      const phaseFutureStart =
        phase.start_date < futureStartDate ? futureStartDate : phase.start_date;
      const phaseFutureEnd = phase.end_date > targetDate ? targetDate : phase.end_date;
      if (phaseFutureStart > phaseFutureEnd) continue;

      for (
        let weekStart = startOfWeekIso(phaseFutureStart);
        weekStart <= phaseFutureEnd;
        weekStart = addDaysIso(weekStart, 7)
      ) {
        const weekEnd = addDaysIso(weekStart, 6);
        const intervalStart = phaseFutureStart > weekStart ? phaseFutureStart : weekStart;
        const intervalEnd = phaseFutureEnd < weekEnd ? phaseFutureEnd : weekEnd;
        const availableDateCount = diffDaysIso(intervalEnd, intervalStart) + 1;
        const expectedProjectionCount = Math.min(phase.expected_weekly_cadence, availableDateCount);
        const actualProjectionCount =
          projectionsByPhaseWeek.get(`${phase.phase}\u0000${weekStart}`) ?? 0;
        if (actualProjectionCount !== expectedProjectionCount) {
          issues.push({
            code: "ai_authored_blueprint_projection_cadence_incomplete",
            path: `blueprint.phases.${phaseIndex}`,
            message: `${phase.phase} requires exactly ${expectedProjectionCount} provisional projection slots in the calendar week starting ${weekStart}; received ${actualProjectionCount}.`,
          });
        }
      }
    }
  } else if (projections.length > 0) {
    issues.push({
      code: "ai_authored_blueprint_post_target_projection_forbidden",
      path: "blueprint.projections",
      message: "A target-boundary detailed block cannot create post-target projections.",
    });
  }
}

function validateDetailedWorkoutPhases({
  authoredDays,
  phases,
  issues,
}: {
  authoredDays: AiAuthoredPlanFirstCompilerWorkout[];
  phases: AiAuthoredPlanFirstCompilerDraft["blueprint"]["phases"];
  issues: CompilerIssue[];
}) {
  for (const day of authoredDays) {
    const phase = phases.find(
      (candidate) => day.date >= candidate.start_date && day.date <= candidate.end_date,
    );
    if (!phase || phase.phase !== day.phase) {
      issues.push({
        code: "ai_authored_blueprint_detailed_phase_mismatch",
        path: `detailed_block.days.${day.date}.phase`,
        message: `${day.date} must use its owning Blueprint phase name.`,
      });
      continue;
    }
    const workoutFamily = familyForIdentity(day.workout_identity);
    if (!phase.workout_families.includes(workoutFamily)) {
      issues.push({
        code: "ai_authored_blueprint_detailed_family_mismatch",
        path: `detailed_block.days.${day.date}.workout_identity`,
        message: `${day.date} uses ${workoutFamily}, which is not permitted by Blueprint phase ${phase.phase}.`,
      });
    }
  }
}

function compileProviderDraft({
  draft,
  authoringInput,
  issues,
  reviewConflicts,
}: {
  draft: AiAuthoredPlanFirstCompilerDraft;
  authoringInput: StructuredAuthoringInput;
  issues: CompilerIssue[];
  reviewConflicts: AiAuthoredBlueprintReviewConflict[];
}): TrainingPlanV2 {
  const fixedRestDays = authoringInput.availability.fixedRestDays;
  const restDays = uniqueWeekdays(fixedRestDays ?? []);
  const weekOneStart = startOfWeekIso(authoringInput.schedule.startDate);
  const targetDate = draft.blueprint.selected_target_date;
  const detailedEndDate = draft.detailed_block.end_date;
  const authoredDays = new Map<string, AiAuthoredPlanFirstCompilerWorkout>();
  for (const day of [...draft.detailed_block.workouts, draft.detailed_block.final_workout]) {
    authoredDays.set(day.date, day);
  }
  const workouts: TrainingPlanV2["planned_workouts"] = [];

  if (targetDate <= detailedEndDate) {
    validateEndpointDistance(draft.detailed_block.final_workout, authoringInput, issues);
  } else {
    const targetWeekday = weekdayLong(targetDate);
    if (restDays.includes(targetWeekday as WeekdayName)) {
      reviewConflicts.push({
        code: "fixed_rest_day_preference_conflict",
        date: targetDate,
        message: `The selected target date is ${targetWeekday}, a preferred Rest day; preserve the target only after explicit review.`,
      });
    }
  }

  for (const projection of draft.blueprint.projections) {
    if (projection.date === targetDate) continue;
    const weekday = weekdayLong(projection.date);
    if (!restDays.includes(weekday as WeekdayName)) continue;
    reviewConflicts.push({
      code: "fixed_rest_day_preference_conflict",
      date: projection.date,
      message: `Future ${projection.cadence_or_workout_family} intent is proposed on preferred Rest day ${weekday}; review placement when preparing its detailed block.`,
    });
  }

  for (
    let date = authoringInput.schedule.startDate;
    date <= detailedEndDate;
    date = addDaysIso(date, 1)
  ) {
    const weekday = weekdayLong(date);
    const weekNumber = Math.floor(diffDaysIso(date, weekOneStart) / 7) + 1;
    const day = authoredDays.get(date) ?? null;

    if (restDays.includes(weekday as WeekdayName) && day) {
      reviewConflicts.push({
        code: "fixed_rest_day_preference_conflict",
        date,
        message: `${day.title} is proposed on preferred Rest day ${weekday}; review placement before confirmation.`,
      });
    }
    if (
      day &&
      authoringInput.availability.preferredLongRunDay &&
      familyForIdentity(day.workout_identity) === "long" &&
      weekday !== authoringInput.availability.preferredLongRunDay
    ) {
      reviewConflicts.push({
        code: "preferred_long_run_day_conflict",
        date,
        message: `${day.title} is proposed on ${weekday}, not preferred long-run day ${authoringInput.availability.preferredLongRunDay}.`,
      });
    }

    workouts.push(
      day
        ? buildWorkout({
            day,
            date,
            weekday,
            weekNumber,
            authoringInput,
            targetDate,
            isEndpoint: day.workout_identity === AI_AUTHORED_PLAN_FIRST_ENDPOINT_IDENTITY,
            issues,
          })
        : buildRestWorkout({ date, weekday, weekNumber, authoringInput, targetDate }),
    );
  }

  const firstDate = workouts.at(0)?.date ?? authoringInput.schedule.startDate;
  const preparationHorizonWeeks = Math.max(
    1,
    Math.ceil((diffDaysIso(targetDate, authoringInput.schedule.startDate) + 1) / 7),
  );
  const goalLabel = requireSelectedDistance(authoringInput).label;
  const preferredLongRunDay = authoringInput.availability.preferredLongRunDay ?? undefined;
  return {
    schema_version: FUTURE_TEMPLATE_VERSION,
    plan_id: `ai-authored-plan-first-${slugify(goalLabel)}-${firstDate}`,
    plan_name: buildPlanName(authoringInput),
    source_kind: AI_AUTHORED_PLAN_FIRST_SOURCE_KIND,
    source_status: "ai_authored",
    created_at: new Date(`${firstDate}T00:00:00.000Z`).toISOString(),
    generated_for: "Hito generated-plan runner",
    goal: {
      goal_type: "distance_goal",
      goal_label: goalLabel,
      ...buildDistanceGoalFields(authoringInput),
      target_event: {
        label: goalLabel,
        date: targetDate,
        event_date: targetDate,
        event_name: goalLabel,
      },
    },
    runner_profile: {
      experience_level: authoringInput.runnerFacts.selfReportedLevel,
      age: authoringInput.runnerFacts.age,
      height_cm: authoringInput.runnerFacts.heightCm,
      weight_kg: authoringInput.runnerFacts.weightKg,
      ...(authoringInput.runnerFacts.benchmark
        ? { recent_result_summary: authoringInput.runnerFacts.benchmark.label }
        : {}),
    },
    start_date: firstDate,
    preparation_horizon_weeks: preparationHorizonWeeks,
    target_date: targetDate,
    plan_preferences: {
      ...(fixedRestDays ? { blocked_days: restDays } : {}),
      ...(preferredLongRunDay ? { preferred_long_run_day: preferredLongRunDay } : {}),
      ...(authoringInput.availability.maxRunningDaysPerWeek != null
        ? {
            max_running_days_per_week: authoringInput.availability.maxRunningDaysPerWeek,
          }
        : {}),
    },
    planned_workouts: workouts,
  };
}

function buildBlueprintSummary(
  draft: AiAuthoredPlanFirstCompilerDraft,
): AiAuthoredBlueprintSummary {
  return {
    version: AI_AUTHORED_BLUEPRINT_VERSION,
    startDate: draft.blueprint.start_date,
    selectedTargetDate: draft.blueprint.selected_target_date,
    targetAssumption: draft.blueprint.target_assumption,
    phases: draft.blueprint.phases.map((phase) => ({
      ...phase,
      workout_families: [...phase.workout_families],
    })),
    projections: draft.blueprint.projections.map((projection) => ({ ...projection })),
    detailedHorizon: {
      startDate: draft.detailed_block.start_date,
      endDate: draft.detailed_block.end_date,
      calendarWeekCount: Math.ceil(
        (diffDaysIso(draft.detailed_block.end_date, draft.detailed_block.start_date) + 1) / 7,
      ),
      targetBoundary: draft.detailed_block.end_date === draft.blueprint.selected_target_date,
    },
  };
}

function buildWorkout({
  day,
  date,
  weekday,
  weekNumber,
  authoringInput,
  targetDate,
  isEndpoint,
  issues,
}: {
  day: AiAuthoredPlanFirstCompilerWorkout;
  date: string;
  weekday: string;
  weekNumber: number;
  authoringInput: StructuredAuthoringInput;
  targetDate: string;
  isEndpoint: boolean;
  issues: CompilerIssue[];
}): TrainingPlanV2["planned_workouts"][number] {
  issues.push(
    ...validateLongRunExecutionPolicy({
      workoutIdentity: day.workout_identity,
      stages: providerSectionsToExecutionStages(day.sections, date),
    }).map((issue) => ({
      code: `ai_authored_plan_first_${issue.code}`,
      path: issue.path ?? `${date}.sections`,
      message: issue.message,
    })),
  );
  const segments = day.sections.map((section, index) =>
    buildSegment({
      section,
      date,
      sequence: index + 1,
      workoutIdentity: day.workout_identity,
      authoringInput,
      issues,
    }),
  );
  if (!segments.some((segment) => segment.segment_type !== "fueling")) {
    issues.push({
      code: "ai_authored_plan_first_hydration_without_runnable_step",
      path: `${date}.sections`,
      message: "Hydration cannot be the only step in a generated workout.",
    });
  }
  const workoutIdentity = day.workout_identity;
  const workoutFamily = familyForIdentity(workoutIdentity);
  const metricMode = toCanonicalMetricModeJson(deriveCanonicalMetricMode(segments));
  return {
    workout_id: `ai-plan-first-${slugify(workoutIdentity)}-${date}`,
    date,
    weekday,
    week_number: weekNumber,
    phase: day.phase,
    workout_type: canonicalFamilyToLegacyWorkoutType(workoutFamily, workoutIdentity),
    source_workout_type: isEndpoint ? SELECTED_DISTANCE_ENDPOINT_SOURCE_KIND : workoutIdentity,
    workout_family: workoutFamily,
    workout_identity: workoutIdentity,
    calendar_icon_key: workoutFamily,
    goal_context: buildGoalContext(authoringInput, targetDate),
    metric_mode: {
      ...metricMode,
      reason:
        metricMode.guidance === "pace" || metricMode.guidance === "mixed"
          ? "AI-authored pace guidance is preserved from the signed reviewed plan."
          : metricMode.reason,
    },
    title: day.title,
    summary: day.cue,
    segments,
  };
}

function providerSectionsToExecutionStages(
  sections: AiAuthoredPlanFirstCompilerWorkout["sections"],
  date: string,
): LongRunExecutionStage[] {
  return sections.flatMap((section, sectionIndex) => {
    const sectionPath = `${date}.sections.${sectionIndex}`;
    if (section.kind === "hydration") {
      return [{ role: "event" as const, runnable: false, path: sectionPath }];
    }

    if (section.kind === "unit") {
      return [
        providerUnitToExecutionStage({
          role: providerUnitStageRole(section.segment_type),
          prescription: section.prescription,
          target: section.target,
          path: sectionPath,
        }),
      ];
    }

    return Array.from({ length: section.rounds }, (_, roundIndex) =>
      section.children.map((child, childIndex) =>
        providerUnitToExecutionStage({
          role: providerRepeatChildStageRole(child.role),
          prescription: child.prescription,
          target: child.target,
          path: `${sectionPath}.rounds.${roundIndex}.children.${childIndex}`,
        }),
      ),
    ).flat();
  });
}

function providerUnitToExecutionStage({
  role,
  prescription,
  target,
  path,
}: {
  role: LongRunExecutionStageRole;
  prescription: AiAuthoredPlanFirstCompilerUnit["prescription"];
  target: AiAuthoredPlanFirstCompilerUnit["target"];
  path: string;
}): LongRunExecutionStage {
  const executionTarget =
    target.primary_execution_mode === "pace" || target.primary_execution_mode === "heart_rate"
      ? {
          mode: target.primary_execution_mode,
          command: target.command,
        }
      : undefined;
  return {
    role,
    runnable: true,
    ...(prescription.mode === "time"
      ? { durationSeconds: prescription.duration_min * 60 }
      : { distanceMeters: prescription.distance_km * 1000 }),
    ...(executionTarget ? { target: executionTarget } : {}),
    path,
  };
}

function providerUnitStageRole(
  segmentType: Extract<AiAuthoredPlanFirstCompilerStep, { kind: "unit" }>["segment_type"],
): LongRunExecutionStageRole {
  switch (segmentType) {
    case "warmup":
      return "entry";
    case "cooldown":
      return "settle";
    case "finish":
      return "finish";
    case "recovery":
    case "recovery_jog":
      return "support";
    default:
      return "body";
  }
}

function providerRepeatChildStageRole(
  role: AiAuthoredPlanFirstCompilerUnit["role"],
): LongRunExecutionStageRole {
  switch (role) {
    case "warm_up":
      return "entry";
    case "cooldown":
      return "settle";
    case "recover":
    case "walk":
      return "support";
    case "finish":
      return "finish";
    case "run":
    case "work":
      return "body";
  }
}

function buildSegment({
  section,
  date,
  sequence,
  workoutIdentity,
  authoringInput,
  issues,
}: {
  section: AiAuthoredPlanFirstCompilerStep;
  date: string;
  sequence: number;
  workoutIdentity: CanonicalWorkoutIdentity;
  authoringInput: StructuredAuthoringInput;
  issues: CompilerIssue[];
}): TrainingPlanV2["planned_workouts"][number]["segments"][number] {
  const path = `${date}.sections.${sequence - 1}`;

  if (section.kind === "hydration") {
    return {
      segment_id: `ai-plan-first-${date}-segment-${sequence}`,
      segment_type: "fueling",
      label: WORKOUT_DOCUMENT_HYDRATION_LABEL,
      sequence,
      guidance: WORKOUT_DOCUMENT_HYDRATION_CUE,
      prescription: { mode: "none" },
    };
  }

  if (section.kind === "repeat") {
    const parentSegmentId = `ai-plan-first-${date}-segment-${sequence}`;
    return {
      segment_id: parentSegmentId,
      segment_type: section.segment_type,
      label: section.label,
      sequence,
      ...(section.cue ? { guidance: section.cue } : {}),
      prescription: {
        mode: "repeats",
        repeat_count: section.rounds,
        children: section.children.map((child, childIndex) =>
          buildRepeatChild({
            child,
            segmentId: `${parentSegmentId}-child-${childIndex + 1}`,
            sequence: childIndex + 1,
            path: `${path}.children.${childIndex}`,
            workoutIdentity,
            segmentType: section.segment_type,
            authoringInput,
            issues,
          }),
        ),
      },
    };
  }

  const target = buildTarget(section.target, path, authoringInput, issues, {
    workoutIdentity,
    segmentType: section.segment_type,
    authoredPurpose: section.cue,
    prescription: section.prescription,
  });

  return {
    segment_id: `ai-plan-first-${date}-segment-${sequence}`,
    segment_type: section.segment_type,
    label: section.label,
    sequence,
    ...(section.cue ? { guidance: section.cue } : {}),
    prescription: { ...section.prescription },
    ...(target ? { target } : {}),
  };
}

function buildRepeatChild({
  child,
  segmentId,
  sequence,
  path,
  workoutIdentity,
  segmentType,
  authoringInput,
  issues,
}: {
  child: AiAuthoredPlanFirstCompilerUnit;
  segmentId: string;
  sequence: number;
  path: string;
  workoutIdentity: CanonicalWorkoutIdentity;
  segmentType: string;
  authoringInput: StructuredAuthoringInput;
  issues: CompilerIssue[];
}): TrainingPlanRepeatChild {
  const target = buildTarget(child.target, path, authoringInput, issues, {
    workoutIdentity,
    segmentType,
    repeatChildRole: child.role,
    authoredPurpose: child.cue,
    prescription: child.prescription,
  });

  return {
    segment_id: segmentId,
    role: child.role,
    label: child.label,
    sequence,
    ...(child.cue ? { guidance: child.cue } : {}),
    prescription: { ...child.prescription },
    ...(target ? { target } : {}),
  };
}

function buildTarget(
  value: AiAuthoredPlanFirstCompilerUnit["target"],
  path: string,
  authoringInput: StructuredAuthoringInput,
  issues: CompilerIssue[],
  context: TargetExecutionContext,
): TrainingPlanTarget | undefined {
  const paceProvenance = resolveAiAuthoredPaceProvenance(authoringInput);
  validateBoundedEffortTarget({ value, path, context, issues, paceProvenance });
  const target: TrainingPlanTarget = {
    primary_execution_mode: value.primary_execution_mode,
    target_source: AI_AUTHORED_PLAN_GUIDANCE_TARGET_SOURCE,
    source_note: "Target from the created plan.",
    ...(value.primary_execution_mode === "pace"
      ? { pace: value.command, hr_target_source: "effort_only" as const }
      : {}),
  };

  if (value.primary_execution_mode === "pace") {
    if (paceProvenance === "no_benchmark_ai_estimate") {
      issues.push({
        code: "ai_authored_plan_first_executable_pace_without_factual_authority",
        path,
        message:
          "Executable pace requires a runner benchmark or explicit target finish time; generic AI-estimated pace is not factual authority.",
      });
    }
    validateBenchmarkRelativeQualityPace({
      command: value.command,
      path,
      authoringInput,
      issues,
      context,
    });
    target.source_note =
      paceProvenance === "benchmark_backed"
        ? "AI-authored pace informed by the runner benchmark."
        : paceProvenance === "goal_informed_ai_estimate"
          ? "AI-estimated pace informed by the selected goal; no runner benchmark supplied."
          : "AI-estimated pace; no runner benchmark supplied.";
    target.extra = { pace_provenance: paceProvenance };
    return target;
  }

  if (value.primary_execution_mode === "effort") {
    target.intensity = {
      controlled_uphill: "Controlled uphill effort",
      controlled_downhill_recovery: "Controlled downhill recovery",
      controlled_short_repetition: "Controlled short repetition effort",
      controlled_stride: "Controlled stride effort",
      controlled_short_recovery: "Controlled short recovery effort",
    }[value.effort_kind];
    target.source_note = ["controlled_short_repetition", "controlled_stride"].includes(
      value.effort_kind,
    )
      ? "Short work is governed by controlled effort; no executable pace or heart rate was inferred."
      : "Terrain-controlled effort; no executable pace, heart rate, grade, or gradient was inferred.";
    return target;
  }

  const effectiveProfile = authoringInput.runnerFacts.heartRateProfile;
  if (!effectiveProfile.accepted) {
    issues.push({
      code: "ai_authored_plan_first_accepted_hr_primary_truth_missing",
      path,
      message: "Heart-rate-primary execution requires an accepted heart-rate profile snapshot.",
    });
    return target;
  }

  const resolvedGuidance = resolveEffectiveHeartRateGuidance(
    effectiveProfile,
    value.band_reference,
  );
  if (!resolvedGuidance) {
    issues.push({
      code: "ai_authored_plan_first_hr_band_reference_invalid",
      path,
      message: `Heart-rate band ${value.band_reference} is not available in the accepted runner profile snapshot.`,
    });
    return target;
  }

  const executionRange = parseBpmExecutionRange(value.command);
  if (!executionRange || executionRange.minBpm >= executionRange.maxBpm) {
    issues.push({
      code: "ai_authored_plan_first_hr_execution_range_invalid",
      path,
      message: "Heart-rate execution requires an increasing numeric BPM range.",
    });
    return target;
  }

  const usesFullBand =
    executionRange.minBpm === resolvedGuidance.minBpm &&
    executionRange.maxBpm === resolvedGuidance.maxBpm;
  if (
    executionRange.minBpm < resolvedGuidance.minBpm ||
    executionRange.maxBpm > resolvedGuidance.maxBpm
  ) {
    issues.push({
      code: "ai_authored_plan_first_hr_execution_range_outside_band",
      path,
      message: `Heart-rate command ${value.command} must stay inside ${value.band_reference} ${resolvedGuidance.rangeBpm}.`,
    });
    return target;
  }
  if (!usesFullBand && executionRange.maxBpm - executionRange.minBpm < 5) {
    issues.push({
      code: "ai_authored_plan_first_hr_execution_subrange_too_narrow",
      path,
      message: "An AI-selected heart-rate subrange must span at least 5 BPM.",
    });
    return target;
  }
  if (!usesFullBand && !context.authoredPurpose?.trim()) {
    issues.push({
      code: "ai_authored_plan_first_hr_execution_subrange_purpose_missing",
      path,
      message: "An AI-selected heart-rate subrange requires an authored stage cue.",
    });
    return target;
  }
  if (!usesFullBand && prohibitsHeartRateSubrange(context)) {
    issues.push({
      code: "ai_authored_plan_first_hr_execution_subrange_prohibited",
      path,
      message:
        "Short intervals, strides, uphill repeats, and taper tune-up transitions cannot use an HR-primary subrange.",
    });
    return target;
  }

  target.hr_bpm_range = value.command;
  target.hr_bpm_min = executionRange.minBpm;
  target.hr_bpm_max = executionRange.maxBpm;
  target.hr_target_source =
    resolvedGuidance.source === "personal" ? "personal_hr_zone" : "default_estimated_hr";
  target.label = resolvedGuidance.source === "personal" ? "Personal HR" : "Estimated HR";
  target.source_note = resolvedGuidance.sourceNote;
  target.extra = {
    hr_zone_reference: resolvedGuidance.canonicalReference,
    hr_profile_source: resolvedGuidance.source,
    hr_band_bpm_min: resolvedGuidance.minBpm,
    hr_band_bpm_max: resolvedGuidance.maxBpm,
    hr_execution_range_kind: usesFullBand ? "full_band" : "ai_selected_subrange",
  };

  return target;
}

function validateBoundedEffortTarget(input: {
  value: AiAuthoredPlanFirstCompilerUnit["target"];
  path: string;
  context: TargetExecutionContext;
  issues: CompilerIssue[];
  paceProvenance: ReturnType<typeof resolveAiAuthoredPaceProvenance>;
}) {
  const isUphillRepeat = input.context.workoutIdentity === "uphill_repeats";
  const isWork = input.context.repeatChildRole === "work";
  const isRecovery = input.context.repeatChildRole === "recover";
  const requiresTerrainEffort = isUphillRepeat && (isWork || isRecovery);
  const shortRepeatEffortKind = resolveRequiredShortRepeatEffortKind(input.context);
  const requiresShortRepeatEffort =
    input.paceProvenance === "no_benchmark_ai_estimate" && shortRepeatEffortKind != null;

  if (!requiresTerrainEffort && !requiresShortRepeatEffort) {
    if (input.value.primary_execution_mode !== "effort") return;
    input.issues.push({
      code: "ai_authored_plan_first_effort_context_invalid",
      path: input.path,
      message:
        "Effort targets are limited to bounded short work without factual pace authority and terrain-controlled uphill children.",
    });
    return;
  }

  if (requiresShortRepeatEffort) {
    if (input.value.primary_execution_mode !== "effort") {
      input.issues.push({
        code: "ai_authored_plan_first_short_work_delayed_metric_invalid",
        path: input.path,
        message:
          "Short work and its fixed-duration recovery without factual pace authority must use controlled effort because heart rate cannot govern the bout in time.",
      });
      return;
    }
    if (input.value.effort_kind !== shortRepeatEffortKind) {
      input.issues.push({
        code: "ai_authored_plan_first_short_work_effort_kind_mismatch",
        path: input.path,
        message: `This short repeat child requires effort_kind=${shortRepeatEffortKind}.`,
      });
    }
    if (!/controlled|smooth|relaxed/i.test(input.context.authoredPurpose ?? "")) {
      input.issues.push({
        code: "ai_authored_plan_first_short_work_control_guidance_missing",
        path: input.path,
        message: "Short effort work requires a local controlled-execution cue.",
      });
    }
    return;
  }

  if (input.value.primary_execution_mode !== "effort") {
    input.issues.push({
      code: isWork
        ? "ai_authored_plan_first_uphill_executable_metric_without_terrain_evidence"
        : "ai_authored_plan_first_downhill_recovery_metric_without_terrain_evidence",
      path: input.path,
      message:
        "Uphill work and downhill recovery cannot use executable pace or heart rate without provider-neutral terrain or gradient evidence.",
    });
    return;
  }

  const expectedKind = isWork ? "controlled_uphill" : "controlled_downhill_recovery";
  if (input.value.effort_kind !== expectedKind) {
    input.issues.push({
      code: "ai_authored_plan_first_terrain_effort_kind_mismatch",
      path: input.path,
      message: `This terrain child requires effort_kind=${expectedKind}.`,
    });
  }

  if (isWork && input.context.prescription.mode !== "distance") {
    input.issues.push({
      code: "ai_authored_plan_first_uphill_distance_missing",
      path: input.path,
      message: "Uphill repeat work requires an explicit distance inside the repeated set.",
    });
  }
  if (isRecovery && input.context.prescription.mode !== "time") {
    input.issues.push({
      code: "ai_authored_plan_first_downhill_recovery_duration_missing",
      path: input.path,
      message: "Uphill repeat recovery requires an explicit recovery duration.",
    });
  }

  const cue = input.context.authoredPurpose ?? "";
  const cueIsSafe = isWork
    ? /controlled/i.test(cue) && /(?:not|never) (?:a )?sprint/i.test(cue)
    : /control(?:led)?|under control/i.test(cue);
  if (!cueIsSafe) {
    input.issues.push({
      code: isWork
        ? "ai_authored_plan_first_uphill_non_sprinting_guidance_missing"
        : "ai_authored_plan_first_downhill_control_guidance_missing",
      path: input.path,
      message: isWork
        ? "Uphill work must state controlled effort and explicitly say it is not a sprint."
        : "Downhill recovery must state that the descent remains controlled.",
    });
  }
}

function resolveRequiredShortRepeatEffortKind(
  context: TargetExecutionContext,
): "controlled_short_repetition" | "controlled_stride" | "controlled_short_recovery" | null {
  if (
    context.repeatChildRole === "recover" &&
    context.prescription.mode === "time" &&
    ((context.workoutIdentity === "easy_run_with_strides" &&
      context.prescription.duration_min <= 1) ||
      ((context.workoutIdentity === "controlled_tempo_session" ||
        context.workoutIdentity === "distance_intervals") &&
        context.prescription.duration_min <= 1.5))
  ) {
    return "controlled_short_recovery";
  }
  if (context.repeatChildRole !== "work") return null;
  if (
    context.workoutIdentity === "easy_run_with_strides" &&
    context.prescription.mode === "time" &&
    context.prescription.duration_min <= 0.5
  ) {
    return "controlled_stride";
  }
  if (
    context.workoutIdentity === "controlled_tempo_session" &&
    context.prescription.mode === "time" &&
    context.prescription.duration_min <= 2
  ) {
    return "controlled_short_repetition";
  }
  if (
    context.workoutIdentity === "distance_intervals" &&
    context.prescription.mode === "distance" &&
    context.prescription.distance_km <= 0.4
  ) {
    return "controlled_short_repetition";
  }
  return null;
}

function validateBenchmarkRelativeQualityPace(input: {
  command: string;
  path: string;
  authoringInput: StructuredAuthoringInput;
  issues: CompilerIssue[];
  context: TargetExecutionContext;
}) {
  const rule = resolveBenchmarkRelativeQualityRule(input.context.workoutIdentity);
  if (!rule || !isSubstantiveBenchmarkRelativeQualityLeaf(input.context)) return;

  const benchmark = input.authoringInput.runnerFacts.benchmark;
  if (!benchmark || benchmark.kind !== "recent_5k") return;

  const paceRange = parsePaceExecutionRange(input.command);
  if (!paceRange) return;

  if (paceRange.fastestSecondsPerKm <= benchmark.paceSecondsPerKm) {
    input.issues.push({
      code:
        rule.kind === "tempo"
          ? "ai_authored_plan_first_tempo_pace_not_slower_than_recent_5k"
          : "ai_authored_plan_first_10k_rhythm_pace_not_slower_than_recent_5k",
      path: input.path,
      message: `${rule.label} pace must be strictly slower than the factual recent 5K benchmark when no separate threshold truth is available.`,
    });
  }

  const rpeCeiling = readBenchmarkRelativeRpeCeiling(input.context.authoredPurpose);
  if (rpeCeiling == null || rpeCeiling > rule.maximumRpe) {
    input.issues.push({
      code:
        rule.kind === "tempo"
          ? "ai_authored_plan_first_tempo_rpe_ceiling_missing"
          : "ai_authored_plan_first_10k_rhythm_rpe_ceiling_missing",
      path: input.path,
      message: `Benchmark-backed ${rule.label} pace requires a local cue with an explicit RPE max N/10 ceiling at or below ${rule.maximumRpe}/10.`,
    });
  }
}

function resolveBenchmarkRelativeQualityRule(identity: CanonicalWorkoutIdentity) {
  if (familyForIdentity(identity) === "tempo") {
    return { kind: "tempo", label: "Tempo", maximumRpe: 7 } as const;
  }
  if (identity === "10k_rhythm_intervals") {
    return { kind: "10k_rhythm", label: "10K rhythm", maximumRpe: 8 } as const;
  }
  return null;
}

function isSubstantiveBenchmarkRelativeQualityLeaf(context: TargetExecutionContext) {
  if (context.repeatChildRole != null) {
    return ["work", "run", "finish"].includes(context.repeatChildRole);
  }
  return !["warmup", "cooldown", "recovery", "recovery_jog"].includes(context.segmentType);
}

function readBenchmarkRelativeRpeCeiling(cue: string | null) {
  const match = /\bRPE max ([0-9]|10)\/10\b/i.exec(cue ?? "");
  return match ? Number(match[1]) : null;
}

const ALWAYS_SHORT_STAGE_HR_SUBRANGE_IDENTITIES = new Set<CanonicalWorkoutIdentity>([
  "distance_intervals",
  "time_intervals",
  "5k_sharpening_repeats",
  "10k_rhythm_intervals",
  "uphill_repeats",
]);

function prohibitsHeartRateSubrange(context: TargetExecutionContext) {
  if (ALWAYS_SHORT_STAGE_HR_SUBRANGE_IDENTITIES.has(context.workoutIdentity)) return true;
  if (context.segmentType === "strides") return true;
  if (
    context.workoutIdentity === "taper_tuneup_run" &&
    (context.segmentType === "finish" || context.repeatChildRole != null)
  ) {
    return true;
  }

  return false;
}

function parseBpmExecutionRange(command: string) {
  const match = /^(\d{2,3})-(\d{2,3}) bpm$/.exec(command);
  if (!match) return null;

  return {
    minBpm: Number(match[1]),
    maxBpm: Number(match[2]),
  };
}

function parsePaceExecutionRange(command: string) {
  const match = /^(\d{1,2}):([0-5]\d)(?:-(\d{1,2}):([0-5]\d))?\/km$/.exec(command);
  if (!match) return null;

  const first = Number(match[1]) * 60 + Number(match[2]);
  const second = match[3] == null ? first : Number(match[3]) * 60 + Number(match[4]);
  return {
    fastestSecondsPerKm: Math.min(first, second),
    slowestSecondsPerKm: Math.max(first, second),
  };
}

function validateEndpointDistance(
  endpoint: AiAuthoredPlanFirstCompilerWorkout,
  authoringInput: StructuredAuthoringInput,
  issues: CompilerIssue[],
) {
  const expectedKm = requireSelectedDistance(authoringInput).distanceKm;
  const actualKm = endpoint.sections
    .filter(
      (section): section is Exclude<AiAuthoredPlanFirstCompilerStep, { kind: "hydration" }> =>
        section.kind !== "hydration" && section.segment_type === "main",
    )
    .reduce((total, section) => {
      if (section.kind === "unit") {
        return (
          total + (section.prescription.mode === "distance" ? section.prescription.distance_km : 0)
        );
      }

      const childDistanceKm = section.children.reduce(
        (childTotal, child) =>
          childTotal +
          (child.prescription.mode === "distance" ? child.prescription.distance_km : 0),
        0,
      );
      return total + childDistanceKm * section.rounds;
    }, 0);

  if (Math.abs(actualKm - expectedKm) > 0.005) {
    issues.push({
      code: "ai_authored_plan_first_endpoint_distance_mismatch",
      path: "detailed_block.final_workout.sections",
      message: `Endpoint main distance ${actualKm} km does not match selected distance ${expectedKm} km.`,
    });
  }
}

function buildRestWorkout({
  date,
  weekday,
  weekNumber,
  authoringInput,
  targetDate,
}: {
  date: string;
  weekday: string;
  weekNumber: number;
  authoringInput: StructuredAuthoringInput;
  targetDate: string;
}): TrainingPlanV2["planned_workouts"][number] {
  return {
    workout_id: `ai-plan-first-rest-${date}`,
    date,
    weekday,
    week_number: weekNumber,
    phase: "Rest",
    workout_type: "rest",
    source_workout_type: "rest_and_recovery",
    workout_family: "rest",
    workout_identity: "rest_and_recovery",
    calendar_icon_key: "rest",
    goal_context: buildGoalContext(authoringInput, targetDate),
    metric_mode: toCanonicalMetricModeJson({
      guidance: "effort",
      executableMode: "none",
      paceTargetsAllowed: false,
      hrTargetsAllowed: false,
      hrTargetSource: "effort_only",
      hrTargetLabel: null,
      hrTargetSourceNote: null,
      reason: "Rest day has no execution targets.",
    }),
    title: "Rest",
    summary: "Rest",
    segments: [
      {
        segment_id: `ai-plan-first-rest-${date}-segment-1`,
        segment_type: "rest",
        sequence: 1,
        label: "Rest",
        prescription: { mode: "none" },
      },
    ],
  };
}

function providerSchemaIssueCode(issue: ZodIssue) {
  const path = issue.path.join(".");
  if (path.endsWith(".date")) {
    return "ai_authored_plan_first_invalid_calendar_date";
  }
  if (path.includes("workout_identity")) {
    return "ai_authored_plan_first_workout_identity_invalid";
  }
  if (path.includes("segment_type")) {
    return "ai_authored_plan_first_segment_type_invalid";
  }
  if (path.includes("rounds") || (path.includes("children") && !path.includes(".target."))) {
    return "ai_authored_plan_first_repeat_structure_invalid";
  }
  return "ai_authored_plan_first_provider_schema_invalid";
}

function familyForIdentity(identity: CanonicalWorkoutIdentity) {
  return resolveCanonicalWorkoutModel({
    workoutType: "quality",
    workoutIdentity: identity,
  }).workoutFamily;
}

function buildGoalContext(authoringInput: StructuredAuthoringInput, targetDate: string) {
  const distance = requireSelectedDistance(authoringInput);

  return {
    goal_type: "distance_goal",
    distance_km: distance.distanceKm,
    distance_meters: distance.distanceMeters,
    target_date: targetDate,
    target_time: authoringInput.planGoalIntent.targetFinishTime?.label ?? null,
  };
}

function buildDistanceGoalFields(authoringInput: StructuredAuthoringInput) {
  const distance = requireSelectedDistance(authoringInput);
  return {
    distance_km: distance.distanceKm,
    distance_meters: distance.distanceMeters,
  };
}

function buildPlanName(authoringInput: StructuredAuthoringInput) {
  const goalLabel = requireSelectedDistance(authoringInput).label;
  const targetTime = authoringInput.planGoalIntent.targetFinishTime?.label ?? null;
  return targetTime ? `${goalLabel} plan (${targetTime})` : `${goalLabel} plan`;
}

function requireSelectedDistance(authoringInput: StructuredAuthoringInput) {
  const distance = authoringInput.planGoalIntent.distance;
  if (!distance) {
    throw new Error("Plan-first compiler requires an exact selected distance.");
  }
  return distance;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
