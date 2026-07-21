import {
  AI_AUTHORED_PLAN_FIRST_ENDPOINT_IDENTITY,
  aiAuthoredPlanFirstProviderDraftSchema,
  type AiAuthoredPlanFirstProviderDraft,
  type AiAuthoredPlanFirstProviderStep,
  type AiAuthoredPlanFirstProviderUnit,
  type AiAuthoredPlanFirstProviderWorkout,
} from "@/lib/ai-authored-plan-first-provider-contract";
import { resolveEffectiveHeartRateGuidance } from "@/lib/heart-rate-zones";
import {
  FUTURE_TEMPLATE_VERSION,
  trainingPlanV2Schema,
  type TrainingPlanV2,
} from "@/lib/imported-plan";
import { SELECTED_DISTANCE_ENDPOINT_SOURCE_KIND } from "@/lib/plan-creation-engine/selected-distance-endpoint";
import {
  canonicalFamilyToLegacyWorkoutType,
  deriveCanonicalMetricMode,
  resolveCanonicalWorkoutModel,
  toCanonicalMetricModeJson,
  type CanonicalWorkoutIdentity,
} from "@/lib/rich-workout-model";
import type { StructuredPlanAuthoringInput } from "@/lib/structured-plan-authoring-schema";
import { addDaysIso, diffDaysIso, startOfWeekIso, weekdayLong } from "@/lib/training";
import { WEEKDAY_NAMES, type WeekdayName } from "@/lib/weekday-rest-invariants";
import { AI_AUTHORED_PLAN_GUIDANCE_TARGET_SOURCE } from "@/lib/workout-document";
import type { ZodIssue } from "zod";

type CompilerIssue = { code: string; message: string; path?: string };
type StructuredAuthoringInput = StructuredPlanAuthoringInput;
type TrainingPlanSegment = TrainingPlanV2["planned_workouts"][number]["segments"][number];
type TrainingPlanTarget = NonNullable<TrainingPlanSegment["target"]>;
type TrainingPlanRepeatChild = NonNullable<
  NonNullable<TrainingPlanSegment["prescription"]>["children"]
>[number];

export const AI_AUTHORED_PLAN_FIRST_SOURCE_KIND = "ai_authored_plan_first_v1" as const;
export type AiAuthoredPlanFirstCompileResult =
  | {
      ok: true;
      canonicalPlan: TrainingPlanV2;
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
  const normalized = normalizeProviderDraft({ draft, authoringInput });

  if (!normalized.ok) {
    return normalized;
  }

  const issues = [...normalized.issues];
  const compiled = compileProviderDraft({
    draft: normalized.draft,
    authoringInput,
    issues,
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

  return {
    ok: true,
    canonicalPlan: canonicalResult.data,
    validationIssues: [],
  };
}

function normalizeProviderDraft({
  draft,
  authoringInput,
}: {
  draft: unknown;
  authoringInput: StructuredAuthoringInput;
}):
  | { ok: true; draft: AiAuthoredPlanFirstProviderDraft; issues: CompilerIssue[] }
  | { ok: false; reason: string; issues: CompilerIssue[] } {
  const providerResult = aiAuthoredPlanFirstProviderDraftSchema.safeParse(draft);

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
  const endDate = providerResult.data.endpoint.date;
  const authoredDays = [...providerResult.data.workouts, providerResult.data.endpoint];
  const authoredDates = new Set<string>();

  for (const [index, day] of authoredDays.entries()) {
    const path = index === authoredDays.length - 1 ? "endpoint.date" : `workouts.${index}.date`;

    if (authoredDates.has(day.date)) {
      issues.push({
        code: "ai_authored_plan_first_duplicate_date",
        path,
        message: `${day.date} appears more than once in the provider draft.`,
      });
    }
    authoredDates.add(day.date);

    if (day.date < startDate || day.date > endDate) {
      issues.push({
        code: "ai_authored_plan_first_date_out_of_range",
        path,
        message: `${day.date} falls outside ${startDate} through ${endDate}.`,
      });
    }
  }

  const authoredContactsByWeek = new Map<number, number>();
  const weekOneStart = startOfWeekIso(startDate);
  for (const day of authoredDays) {
    const weekNumber = Math.floor(diffDaysIso(day.date, weekOneStart) / 7) + 1;
    authoredContactsByWeek.set(weekNumber, (authoredContactsByWeek.get(weekNumber) ?? 0) + 1);
  }
  for (const [weekNumber, contactCount] of authoredContactsByWeek) {
    if (contactCount > authoringInput.availability.maxRunningDaysPerWeek) {
      issues.push({
        code: "ai_authored_plan_first_availability_ceiling_exceeded",
        path: `weeks.${weekNumber}`,
        message: `Week ${weekNumber} has ${contactCount} workouts but the runner allows at most ${authoringInput.availability.maxRunningDaysPerWeek}.`,
      });
    }
  }

  if (endDate < startDate) {
    issues.push({
      code: "ai_authored_plan_first_date_out_of_range",
      path: "endpoint.date",
      message: `Endpoint date ${endDate} is before plan start date ${startDate}.`,
    });
  }

  const preparationHorizonWeeks = Math.max(1, Math.ceil((diffDaysIso(endDate, startDate) + 1) / 7));
  if (preparationHorizonWeeks > 52) {
    issues.push({
      code: "ai_authored_plan_first_horizon_out_of_range",
      path: "endpoint.date",
      message: "Provider draft exceeds the canonical 52-week plan horizon.",
    });
  }

  const lastAuthoredWorkout = providerResult.data.workouts
    .slice()
    .sort((left, right) => left.date.localeCompare(right.date))
    .at(-1);
  if (!lastAuthoredWorkout || diffDaysIso(endDate, lastAuthoredWorkout.date) > 14) {
    issues.push({
      code: "ai_authored_plan_first_incomplete_horizon",
      path: "workouts",
      message:
        "Provider draft must include a non-endpoint workout in the final 14 calendar days before endpoint.",
    });
  }

  return {
    ok: true,
    issues,
    draft: {
      ...providerResult.data,
      workouts: [...providerResult.data.workouts].sort((left, right) =>
        left.date.localeCompare(right.date),
      ),
    },
  };
}

function compileProviderDraft({
  draft,
  authoringInput,
  issues,
}: {
  draft: AiAuthoredPlanFirstProviderDraft;
  authoringInput: StructuredAuthoringInput;
  issues: CompilerIssue[];
}): TrainingPlanV2 {
  const restDays = uniqueWeekdays(authoringInput.availability.fixedRestDays);
  const weekOneStart = startOfWeekIso(authoringInput.schedule.startDate);
  const targetDate = draft.endpoint.date;
  const authoredDays = new Map<string, AiAuthoredPlanFirstProviderWorkout>();
  for (const day of [...draft.workouts, draft.endpoint]) {
    authoredDays.set(day.date, day);
  }
  const workouts: TrainingPlanV2["planned_workouts"] = [];

  validateEndpointDistance(draft.endpoint, authoringInput, issues);

  for (
    let date = authoringInput.schedule.startDate;
    date <= targetDate;
    date = addDaysIso(date, 1)
  ) {
    const weekday = weekdayLong(date);
    const weekNumber = Math.floor(diffDaysIso(date, weekOneStart) / 7) + 1;
    const day = authoredDays.get(date) ?? null;

    if (restDays.includes(weekday as WeekdayName) && day) {
      issues.push({
        code: "ai_authored_plan_first_fixed_rest_day_violation",
        path: `days.${date}`,
        message: `${weekday} is a fixed rest day but the provider draft scheduled ${day.title}.`,
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
            isEndpoint: day === draft.endpoint,
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
  const authoredRunningDays = uniqueWeekdays(
    workouts
      .filter((workout) => workout.workout_type !== "rest")
      .map((workout) => workout.weekday as WeekdayName),
  );
  const authoredRunningDaysPerWeek = Math.max(
    1,
    ...Array.from(
      workouts
        .filter((workout) => workout.workout_type !== "rest")
        .reduce((counts, workout) => {
          counts.set(workout.week_number, (counts.get(workout.week_number) ?? 0) + 1);
          return counts;
        }, new Map<number, number>())
        .values(),
    ),
  );

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
      preferred_running_days: authoredRunningDays,
      blocked_days: restDays,
      ...(preferredLongRunDay ? { preferred_long_run_day: preferredLongRunDay } : {}),
      max_running_days_per_week: authoringInput.availability.maxRunningDaysPerWeek,
    },
    training_constraints: {
      running_days_per_week: authoredRunningDaysPerWeek,
      full_rest_days: restDays,
      ...(preferredLongRunDay ? { long_run_day: preferredLongRunDay } : {}),
    },
    planned_workouts: workouts,
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
  day: AiAuthoredPlanFirstProviderWorkout;
  date: string;
  weekday: string;
  weekNumber: number;
  authoringInput: StructuredAuthoringInput;
  targetDate: string;
  isEndpoint: boolean;
  issues: CompilerIssue[];
}): TrainingPlanV2["planned_workouts"][number] {
  const segments = day.sections.map((section, index) =>
    buildSegment({
      section,
      date,
      sequence: index + 1,
      authoringInput,
      issues,
    }),
  );
  const workoutIdentity = day.workout_identity;
  const workoutFamily = familyForIdentity(workoutIdentity);
  const metricMode = toCanonicalMetricModeJson(deriveCanonicalMetricMode(segments));
  const phase = resolveRunnerFacingHeartRateReferences(
    day.phase,
    `${date}.phase`,
    authoringInput,
    issues,
  );
  const title = resolveRunnerFacingHeartRateReferences(
    day.title,
    `${date}.title`,
    authoringInput,
    issues,
  );
  const summary = resolveRunnerFacingHeartRateReferences(
    day.cue,
    `${date}.cue`,
    authoringInput,
    issues,
  );

  return {
    workout_id: `ai-plan-first-${slugify(workoutIdentity)}-${date}`,
    date,
    weekday,
    week_number: weekNumber,
    phase,
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
    title,
    summary,
    segments,
  };
}

function buildSegment({
  section,
  date,
  sequence,
  authoringInput,
  issues,
}: {
  section: AiAuthoredPlanFirstProviderStep;
  date: string;
  sequence: number;
  authoringInput: StructuredAuthoringInput;
  issues: CompilerIssue[];
}): TrainingPlanV2["planned_workouts"][number]["segments"][number] {
  const path = `${date}.sections.${sequence - 1}`;
  const label = resolveRunnerFacingHeartRateReferences(
    section.label,
    `${path}.label`,
    authoringInput,
    issues,
  );
  const guidance = section.cue
    ? resolveRunnerFacingHeartRateReferences(section.cue, `${path}.cue`, authoringInput, issues)
    : null;

  if (section.kind === "repeat") {
    return {
      segment_id: `ai-plan-first-${date}-segment-${sequence}`,
      segment_type: section.segment_type,
      label,
      sequence,
      ...(guidance ? { guidance } : {}),
      prescription: {
        mode: "repeats",
        repeat_count: section.rounds,
        children: section.children.map((child, childIndex) =>
          buildRepeatChild({
            child,
            sequence: childIndex + 1,
            path: `${path}.children.${childIndex}`,
            authoringInput,
            issues,
          }),
        ),
      },
    };
  }

  const target = buildTarget(section.target, path, authoringInput, issues);

  return {
    segment_id: `ai-plan-first-${date}-segment-${sequence}`,
    segment_type: section.segment_type,
    label,
    sequence,
    ...(guidance ? { guidance } : {}),
    prescription: { ...section.prescription },
    ...(target ? { target } : {}),
  };
}

function buildRepeatChild({
  child,
  sequence,
  path,
  authoringInput,
  issues,
}: {
  child: AiAuthoredPlanFirstProviderUnit;
  sequence: number;
  path: string;
  authoringInput: StructuredAuthoringInput;
  issues: CompilerIssue[];
}): TrainingPlanRepeatChild {
  const target = buildTarget(child.target, path, authoringInput, issues);
  const label = resolveRunnerFacingHeartRateReferences(
    child.label,
    `${path}.label`,
    authoringInput,
    issues,
  );
  const guidance = child.cue
    ? resolveRunnerFacingHeartRateReferences(child.cue, `${path}.cue`, authoringInput, issues)
    : null;

  return {
    role: child.role,
    label,
    sequence,
    ...(guidance ? { guidance } : {}),
    prescription: { ...child.prescription },
    ...(target ? { target } : {}),
  };
}

function buildTarget(
  value: AiAuthoredPlanFirstProviderUnit["target"],
  path: string,
  authoringInput: StructuredAuthoringInput,
  issues: CompilerIssue[],
): TrainingPlanTarget | undefined {
  const target: TrainingPlanTarget = {
    primary_execution_mode: value.primary_execution_mode,
    target_source: AI_AUTHORED_PLAN_GUIDANCE_TARGET_SOURCE,
    hr_target_source: "effort_only",
    source_note: "AI-authored target preserved from the signed reviewed plan.",
    ...(value.primary_execution_mode === "pace" ? { pace: value.command } : {}),
    ...(value.primary_execution_mode === "effort" || value.primary_execution_mode === "run_walk"
      ? { intensity: value.command }
      : {}),
  };

  if (value.primary_execution_mode === "pace" && !authoringInput.runnerFacts.benchmark) {
    issues.push({
      code: "ai_authored_plan_first_pace_primary_truth_missing",
      path,
      message: "Pace-primary execution requires explicit validated runner benchmark truth.",
    });
  }

  if (value.primary_execution_mode !== "heart_rate") {
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

  const resolvedGuidance = resolveEffectiveHeartRateGuidance(effectiveProfile, value.command);

  if (!resolvedGuidance) {
    issues.push({
      code: "ai_authored_plan_first_hr_zone_reference_invalid",
      path,
      message: `Heart-rate reference ${value.command} is not available in the runner profile.`,
    });
    return target;
  }

  target.hr_bpm_range = resolvedGuidance.rangeBpm;
  target.hr_bpm_min = resolvedGuidance.minBpm;
  target.hr_bpm_max = resolvedGuidance.maxBpm;
  target.hr_target_source =
    resolvedGuidance.source === "personal" ? "personal_hr_zone" : "default_estimated_hr";
  target.label = resolvedGuidance.source === "personal" ? "Personal HR" : "Estimated HR";
  target.source_note = resolvedGuidance.sourceNote;
  target.extra = {
    hr_zone: resolvedGuidance.authoredReference,
    hr_zone_reference: resolvedGuidance.canonicalReference,
    hr_profile_source: resolvedGuidance.source,
  };

  return target;
}

const AI_AUTHORED_HR_REFERENCE_PATTERN = /\bZ[1-5](?:-Z[1-5])?\b/g;

function resolveRunnerFacingHeartRateReferences(
  value: string,
  path: string,
  authoringInput: StructuredAuthoringInput,
  issues: CompilerIssue[],
) {
  const references = value.match(AI_AUTHORED_HR_REFERENCE_PATTERN);
  if (!references?.length) {
    return value;
  }

  const effectiveProfile = authoringInput.runnerFacts.heartRateProfile;
  let resolved = value;

  for (const reference of new Set(references)) {
    const guidance = resolveEffectiveHeartRateGuidance(effectiveProfile, reference);
    if (!guidance) {
      issues.push({
        code: "ai_authored_plan_first_hr_zone_reference_invalid",
        path,
        message: `Heart-rate reference ${reference} is not available in the runner profile.`,
      });
      continue;
    }

    resolved = resolved.replaceAll(
      reference,
      guidance.source === "personal" ? guidance.rangeBpm : `${guidance.rangeBpm} estimated`,
    );
  }

  return resolved;
}

function validateEndpointDistance(
  endpoint: AiAuthoredPlanFirstProviderWorkout,
  authoringInput: StructuredAuthoringInput,
  issues: CompilerIssue[],
) {
  const expectedKm = requireSelectedDistance(authoringInput).distanceKm;
  const actualKm = endpoint.sections
    .filter((section) => section.segment_type === "main")
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
      path: "endpoint.sections",
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

function uniqueWeekdays(values: readonly WeekdayName[]) {
  return WEEKDAY_NAMES.filter((day) => values.includes(day));
}
