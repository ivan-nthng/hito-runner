import {
  AI_AUTHORED_PLAN_FIRST_ENDPOINT_IDENTITY,
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
import { WEEKDAY_NAMES, type WeekdayName } from "@/lib/weekday-rest-invariants";
import {
  AI_AUTHORED_PLAN_GUIDANCE_TARGET_SOURCE,
  WORKOUT_DOCUMENT_HYDRATION_CUE,
  WORKOUT_DOCUMENT_HYDRATION_LABEL,
} from "@/lib/workout-document";
import type { ZodIssue } from "zod";

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
};

export const AI_AUTHORED_PLAN_FIRST_SOURCE_KIND = "ai_authored_plan_first_v1" as const;
type AiAuthoredPlanFirstCompileResult =
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
    const maxRunningDaysPerWeek = authoringInput.availability.maxRunningDaysPerWeek;
    if (maxRunningDaysPerWeek != null && contactCount > maxRunningDaysPerWeek) {
      issues.push({
        code: "ai_authored_plan_first_availability_ceiling_exceeded",
        path: `weeks.${weekNumber}`,
        message: `Week ${weekNumber} has ${contactCount} workouts but the runner allows at most ${maxRunningDaysPerWeek}.`,
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
  draft: AiAuthoredPlanFirstCompilerDraft;
  authoringInput: StructuredAuthoringInput;
  issues: CompilerIssue[];
}): TrainingPlanV2 {
  const fixedRestDays = authoringInput.availability.fixedRestDays;
  const restDays = uniqueWeekdays(fixedRestDays ?? []);
  const weekOneStart = startOfWeekIso(authoringInput.schedule.startDate);
  const targetDate = draft.endpoint.date;
  const authoredDays = new Map<string, AiAuthoredPlanFirstCompilerWorkout>();
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
  return {
    role,
    runnable: true,
    ...(prescription.mode === "time"
      ? { durationSeconds: prescription.duration_min * 60 }
      : { distanceMeters: prescription.distance_km * 1000 }),
    target: {
      mode: target.primary_execution_mode,
      command: target.command,
    },
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
    return {
      segment_id: `ai-plan-first-${date}-segment-${sequence}`,
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
  sequence,
  path,
  workoutIdentity,
  segmentType,
  authoringInput,
  issues,
}: {
  child: AiAuthoredPlanFirstCompilerUnit;
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
  });

  return {
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
  const target: TrainingPlanTarget = {
    primary_execution_mode: value.primary_execution_mode,
    target_source: AI_AUTHORED_PLAN_GUIDANCE_TARGET_SOURCE,
    hr_target_source: "effort_only",
    source_note: "Target from the created plan.",
    ...(value.primary_execution_mode === "pace" ? { pace: value.command } : {}),
  };

  if (value.primary_execution_mode === "pace") {
    target.source_note =
      paceProvenance === "benchmark_backed"
        ? "AI-authored pace informed by the runner benchmark."
        : paceProvenance === "goal_informed_ai_estimate"
          ? "AI-estimated pace informed by the selected goal; no runner benchmark supplied."
          : "AI-estimated pace; no runner benchmark supplied.";
    target.extra = { pace_provenance: paceProvenance };
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
