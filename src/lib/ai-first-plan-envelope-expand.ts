import {
  buildNormalizationContext,
  validateNormalizedPlanDoctrine,
} from "@/lib/ai-first-plan-blueprint-validation";
import { decodeAndValidateAiFirstPlanEnvelope } from "@/lib/ai-first-plan-envelope-decode";
import {
  applyAiFirstPlanEnvelopeSpecificity,
  isEnvelopeGoalSpecificCadenceIdentity,
} from "@/lib/ai-first-plan-envelope-specificity";
import type {
  AiFirstPlanEnvelopeExpansionResult,
  AiFirstPlanEnvelopeIssue,
  AiFirstPlanEnvelopeSpecificityTrace,
  CanonicalWorkout,
  StructuredAuthoringInput,
} from "@/lib/ai-first-plan-envelope-schema";
import { resolveAuthoringHorizonWeeks } from "@/lib/ai-first-plan-blueprint-policy";
import { trainingPlanV2Schema } from "@/lib/imported-plan";
import { buildStructuredAuthoringPlan } from "@/lib/structured-plan-authoring";
import { addDaysIso, weekdayLong } from "@/lib/training";

const ENVELOPE_SPECIALTY_CADENCE_IDENTITIES = new Set([
  "ultra_time_on_feet_durability",
  "technical_trail_easy",
  "climbing_steady_run",
  "rolling_hills_session",
  "uphill_repeats",
  "controlled_downhill_durability",
  "hike_run_endurance",
  "mountain_long_run_time_on_feet",
]);

export function expandAiFirstPlanEnvelopeToTrainingPlan({
  envelope,
  authoringInput,
}: {
  envelope: unknown;
  authoringInput: StructuredAuthoringInput;
}): AiFirstPlanEnvelopeExpansionResult {
  const decoded = decodeAndValidateAiFirstPlanEnvelope({ envelope, authoringInput });

  if (!decoded.ok) {
    return {
      ok: false,
      reason: "ai_first_plan_envelope_invalid",
      issues: decoded.issues,
    };
  }

  const horizonWeeks = resolveAuthoringHorizonWeeks(authoringInput);
  const scaffoldSchedule = authoringInput.schedule.targetDate
    ? {
        ...authoringInput.schedule,
        preparationHorizonWeeks: null,
      }
    : {
        ...authoringInput.schedule,
        preparationHorizonWeeks: horizonWeeks,
      };
  const scaffoldInput: StructuredAuthoringInput = {
    ...authoringInput,
    schedule: scaffoldSchedule,
    preferences: {
      ...authoringInput.preferences,
      notes: appendBoundedNote(
        authoringInput.preferences.notes,
        "Expanded from compact ai-first-plan-envelope-v1 intent; backend owns dates, rows, identities, segments, and metric targets.",
      ),
    },
  };
  const context = buildNormalizationContext(authoringInput);
  const scaffoldPlan = buildStructuredAuthoringPlan(scaffoldInput);
  const scaffoldWorkouts = ensureFullHorizonEnvelopeScaffoldWorkouts({
    scaffoldWorkouts: scaffoldPlan.planned_workouts,
    context,
  });
  const specificity = applyAiFirstPlanEnvelopeSpecificity({
    workouts: scaffoldWorkouts,
    envelope: decoded.envelope,
    authoringInput,
  });
  const candidatePlan = {
    ...scaffoldPlan,
    plan_id: `ai-first-plan-envelope-${slugify(authoringInput.goal.goalType)}-${authoringInput.schedule.startDate}`,
    plan_name: decoded.envelope.planName,
    source_kind: "ai_first_plan_envelope_v1",
    start_date: authoringInput.schedule.startDate,
    preparation_horizon_weeks: horizonWeeks,
    ...(authoringInput.schedule.targetDate
      ? { target_date: authoringInput.schedule.targetDate }
      : {}),
    planned_workouts: specificity.workouts,
  };
  const issues: AiFirstPlanEnvelopeIssue[] = [];

  validateEnvelopeExpandedRows(candidatePlan.planned_workouts, context, issues);
  validateNormalizedPlanDoctrine(candidatePlan.planned_workouts, context, issues);

  const parsedPlan = trainingPlanV2Schema.safeParse(candidatePlan);

  if (!parsedPlan.success) {
    issues.push(
      ...parsedPlan.error.issues.slice(0, 12).map((issue) => ({
        code: "training_plan_v2_invalid",
        path: issue.path.join(".") || "root",
        message: issue.message,
      })),
    );
  }

  if (issues.length > 0 || !parsedPlan.success) {
    return {
      ok: false,
      reason: "ai_first_plan_envelope_expansion_failed",
      issues: issues.slice(0, 24),
    };
  }

  return {
    ok: true,
    canonicalPlan: parsedPlan.data,
    metadata: {
      sourceKind: "ai_first_plan_envelope_v1",
      sourceStatus: "expanded_from_envelope",
      validationIssues: [],
      validationIssueCount: 0,
      repairs: [
        "Backend expanded compact envelope intent into canonical training-plan-v2 rows without OpenAI row-level workout authorship.",
        ...buildSpecificityRepairNotes(specificity.trace),
      ],
      reviewAssumptions: decoded.envelope.reviewAssumptions,
      specificityTrace: specificity.trace,
    },
  };
}

function validateEnvelopeExpandedRows(
  workouts: CanonicalWorkout[],
  context: ReturnType<typeof buildNormalizationContext>,
  issues: AiFirstPlanEnvelopeIssue[],
) {
  const expectedRowCount = context.expectedHorizonWeeks * 7;

  if (workouts.length !== expectedRowCount) {
    issues.push({
      code: "envelope_expanded_row_count_mismatch",
      path: "planned_workouts",
      message: `Expanded envelope produced ${workouts.length} rows; expected ${expectedRowCount}.`,
    });
  }

  const workoutsByDate = new Map<string, CanonicalWorkout[]>();

  for (const workout of workouts) {
    workoutsByDate.set(workout.date, [...(workoutsByDate.get(workout.date) ?? []), workout]);
  }

  for (let offset = 0; offset < expectedRowCount; offset += 1) {
    const date = addDaysIso(context.authoringInput.schedule.startDate, offset);
    const weekday = weekdayLong(date);
    const dateWorkouts = workoutsByDate.get(date) ?? [];

    if (dateWorkouts.length !== 1) {
      issues.push({
        code:
          dateWorkouts.length === 0 ? "envelope_missing_calendar_date" : "envelope_duplicate_date",
        path: `${date}.planned_workouts`,
        message: "Expanded envelope must produce exactly one reviewed row per calendar date.",
      });
      continue;
    }

    const workout = dateWorkouts[0]!;
    const rest = isRestWorkout(workout);

    if (context.fixedRestDays.has(weekday) && !rest) {
      issues.push({
        code: "envelope_fixed_rest_day_violation",
        path: `${date}.workout_family`,
        message: `${date} is a fixed rest day and cannot contain a non-rest workout.`,
      });
    }

    if (context.runningDays.has(weekday) && rest) {
      issues.push({
        code: "envelope_missing_required_running_slot",
        path: `${date}.workout_family`,
        message: `${date} is a required running slot and must contain a workout.`,
      });
    }

    if (!rest) {
      validateRichWorkoutFields(workout, date, issues);
      validateMetricGates(workout, context, issues);
    }
  }

  validatePreferredLongRunDay(workouts, context, issues);
  validateRequiredCadenceSlots(workouts, context, issues);
}

function buildSpecificityRepairNotes(trace: AiFirstPlanEnvelopeSpecificityTrace) {
  const fulfilledCount = trace.fulfilledIdentities.length;

  if (fulfilledCount === 0) {
    return [];
  }

  return [
    `Backend matched compact envelope road specificity intent to ${fulfilledCount} canonical workout identity slot(s).`,
  ];
}

function validateRichWorkoutFields(
  workout: CanonicalWorkout,
  date: string,
  issues: AiFirstPlanEnvelopeIssue[],
) {
  if (!workout.workout_family || !workout.workout_identity || !workout.calendar_icon_key) {
    issues.push({
      code: "envelope_rich_fields_missing",
      path: `${date}.workout_identity`,
      message:
        "Expanded envelope non-rest rows must include rich family, identity, and icon truth.",
    });
  }

  if (!workout.goal_context || !workout.metric_mode || workout.segments.length === 0) {
    issues.push({
      code: "envelope_rich_detail_missing",
      path: `${date}.segments`,
      message:
        "Expanded envelope non-rest rows must include goal context, metric mode, and segments.",
    });
  }
}

function validateMetricGates(
  workout: CanonicalWorkout,
  context: ReturnType<typeof buildNormalizationContext>,
  issues: AiFirstPlanEnvelopeIssue[],
) {
  if (context.paceTargetsAllowed) {
    return;
  }

  const serialized = JSON.stringify(workout.segments).toLowerCase();

  if (serialized.includes("pace_min_per_km_range")) {
    issues.push({
      code: "envelope_unsupported_pace_target",
      path: `${workout.date}.segments`,
      message:
        "Expanded envelope cannot introduce pace targets when backend gates do not allow them.",
    });
  }
}

function validatePreferredLongRunDay(
  workouts: CanonicalWorkout[],
  context: ReturnType<typeof buildNormalizationContext>,
  issues: AiFirstPlanEnvelopeIssue[],
) {
  const preferredLongRunDay = context.authoringInput.availability.preferredLongRunDay;

  if (!preferredLongRunDay) {
    return;
  }

  for (let weekNumber = 1; weekNumber <= context.expectedHorizonWeeks; weekNumber += 1) {
    const longRun = workouts.find(
      (workout) =>
        workout.week_number === weekNumber &&
        (workout.workout_family === "long" || workout.workout_type === "long_run"),
    );

    if (!longRun) {
      issues.push({
        code: "envelope_missing_weekly_long_run",
        path: `weeks.${weekNumber}`,
        message: `Week ${weekNumber} must include a backend-expanded long-run row.`,
      });
      continue;
    }

    if (longRun.weekday !== preferredLongRunDay) {
      issues.push({
        code: "envelope_preferred_long_run_day_violation",
        path: `${longRun.date}.weekday`,
        message: `Week ${weekNumber} long run must land on ${preferredLongRunDay}.`,
      });
    }
  }
}

function validateRequiredCadenceSlots(
  workouts: CanonicalWorkout[],
  context: ReturnType<typeof buildNormalizationContext>,
  issues: AiFirstPlanEnvelopeIssue[],
) {
  for (const [weekNumber, slot] of context.requiredCadenceSlots.entries()) {
    const weekWorkouts = workouts.filter((candidate) => candidate.week_number === weekNumber);
    const hasCadenceSignal = weekWorkouts.some((workout) => {
      const identity = workout.workout_identity ?? workout.source_workout_type ?? null;

      if (!identity) {
        return false;
      }

      return (
        slot.identityOptions.some((option) => option === identity) ||
        (slot.kind === "specialty" && ENVELOPE_SPECIALTY_CADENCE_IDENTITIES.has(identity)) ||
        isEnvelopeGoalSpecificCadenceIdentity(identity, context.authoringInput)
      );
    });

    if (!hasCadenceSignal) {
      issues.push({
        code: "envelope_required_cadence_missing",
        path: `weeks.${weekNumber}.workout_identity`,
        message: `Week ${weekNumber} must preserve ${slot.kind} cadence within backend-owned weekly placement.`,
      });
    }
  }
}

function ensureFullHorizonEnvelopeScaffoldWorkouts({
  scaffoldWorkouts,
  context,
}: {
  scaffoldWorkouts: CanonicalWorkout[];
  context: ReturnType<typeof buildNormalizationContext>;
}) {
  const scaffoldByDate = new Map(scaffoldWorkouts.map((workout) => [workout.date, workout]));

  return Array.from({ length: context.expectedHorizonWeeks * 7 }, (_value, offset) => {
    const date = addDaysIso(context.authoringInput.schedule.startDate, offset);
    const existingWorkout = scaffoldByDate.get(date);

    if (existingWorkout) {
      return existingWorkout;
    }

    return buildTailEnvelopeScaffoldWorkout({
      date,
      weekNumber: Math.floor(offset / 7) + 1,
      weekday: weekdayLong(date),
      scaffoldWorkouts,
    });
  });
}

function buildTailEnvelopeScaffoldWorkout({
  date,
  weekNumber,
  weekday,
  scaffoldWorkouts,
}: {
  date: string;
  weekNumber: number;
  weekday: string;
  scaffoldWorkouts: CanonicalWorkout[];
}): CanonicalWorkout {
  const template =
    [...scaffoldWorkouts]
      .reverse()
      .find((workout) => workout.weekday === weekday && !isRestWorkout(workout)) ??
    [...scaffoldWorkouts].reverse().find((workout) => workout.weekday === weekday) ??
    scaffoldWorkouts.at(-1);

  if (!template) {
    throw new Error("Cannot expand AI first-plan envelope without a scaffold workout template.");
  }

  const identity =
    template.workout_identity ?? template.source_workout_type ?? template.workout_type;

  return {
    ...template,
    workout_id: `ai-envelope-scaffold-tail-${slugify(identity)}-${date}`,
    date,
    weekday,
    week_number: weekNumber,
    segments: template.segments.map((segment, index) => ({
      ...segment,
      segment_id: segment.segment_id
        ? `${segment.segment_id}-${date}`
        : `ai-envelope-scaffold-tail-${date}-${index + 1}`,
    })),
  };
}

function isRestWorkout(workout: CanonicalWorkout) {
  return workout.workout_family === "rest" || workout.workout_type === "rest";
}

function appendBoundedNote(existingNote: string | null | undefined, addition: string) {
  const combined = [existingNote?.trim(), addition].filter(Boolean).join(" ");

  return combined.length > 500 ? `${combined.slice(0, 497)}...` : combined;
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "plan";
}
