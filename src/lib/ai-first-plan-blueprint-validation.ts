import type { AiFirstPlanBlueprintTraceMetadata } from "@/lib/ai-first-plan-draft-metadata";
import {
  isGoalFamilyCadencePlan,
  resolveAuthoringHorizonWeeks,
  resolveGoalFamilyIdentityPolicy,
} from "@/lib/ai-first-plan-blueprint-policy";
import type {
  AiBlueprintRepeatChild,
  AiBlueprintSection,
  AiBlueprintWeek,
  AiBlueprintWorkout,
  AiFirstPlanBlueprint,
  AiFirstPlanBlueprintNormalizationResult,
  CanonicalWorkout,
  NormalizationIssue,
  StructuredAuthoringInput,
} from "@/lib/ai-first-plan-blueprint-schema";
import {
  type AuthoredWorkoutFamily,
  hardWorkoutFamilies,
  weekdayValues,
  weekdayIndex,
} from "@/lib/ai-first-plan-blueprint-taxonomy";
import {
  hasRaceSpecificMetricSupport,
  isConservativeNoBenchmarkAdaptationSafeIdentity,
  isSupportedSpecificityIdentity,
  resolveSupportedIntensityCadence,
  resolveSupportedSpecificityIdentityOptions,
  shouldScheduleSupportedIntensityWeek,
  shouldUseConservativeNoBenchmarkLongDistanceAdaptation,
  shouldUseLongRunSteadyFinishAsSpecificStimulus,
  shouldUseRecoveryFirstAfterLongRun,
} from "@/lib/structured-plan-authoring-policy";
import {
  collectSelectedDistanceEndpointIssues,
  selectedDistanceEndpointMainDistanceMeters,
  SELECTED_DISTANCE_ENDPOINT_IDENTITY,
  SELECTED_DISTANCE_ENDPOINT_SOURCE_KIND,
} from "@/lib/plan-creation-engine/selected-distance-endpoint";
import { addDaysIso, diffDaysIso, weekdayLong, type StepPrescription } from "@/lib/training";

export interface AiFirstPlanBlueprintNormalizationOptions {
  enforcePreferredLongRunDay?: boolean;
}

export function buildNormalizationContext(
  authoringInput: StructuredAuthoringInput,
  options: AiFirstPlanBlueprintNormalizationOptions = {},
) {
  const expectedHorizonWeeks = resolveAuthoringHorizonWeeks(authoringInput);
  const enforcePreferredLongRunDay = options.enforcePreferredLongRunDay ?? false;
  const fixedRestDays: Set<string> = new Set(authoringInput.availability.unavailableDays);
  const runningDays: Set<string> = new Set(weekdayValues.filter((day) => !fixedRestDays.has(day)));
  const paceTargetsAllowed = Boolean(
    authoringInput.execution.watchAccess === "watch_or_app" &&
    (authoringInput.execution.guidancePreference === "pace" ||
      authoringInput.execution.guidancePreference === "mixed") &&
    authoringInput.currentLevel.recent5kPaceSecondsPerKm,
  );
  const estimatedMaxHr =
    typeof authoringInput.runnerProfile.age === "number"
      ? Math.round(208 - 0.7 * authoringInput.runnerProfile.age)
      : null;
  const lowSupportBuildConsistency =
    authoringInput.goal.goalType === "build_consistency" &&
    (authoringInput.runnerProfile.experienceLevel === "new_runner" ||
      authoringInput.availability.maxRunningDaysPerWeek <= 3 ||
      (!authoringInput.currentLevel.recent5kPaceSecondsPerKm && !authoringInput.goal.targetTime));
  const goalFamilyPolicy = resolveGoalFamilyIdentityPolicy(authoringInput);
  const goalFamilyCadencePlan = isGoalFamilyCadencePlan(authoringInput, goalFamilyPolicy);

  return {
    authoringInput,
    expectedHorizonWeeks,
    fixedRestDays,
    runningDays,
    paceTargetsAllowed,
    estimatedMaxHr,
    defaultHrAllowed: false,
    lowSupportBuildConsistency,
    goalFamilyPolicy,
    goalFamilyCadencePlan,
    dateAuthorshipMode: "openai_authored_dated_plan" as const,
    authoredWorkoutDatesRequired: true,
    preferredLongRunDay: enforcePreferredLongRunDay
      ? (authoringInput.availability.preferredLongRunDay ?? null)
      : null,
    requiredCadenceSlots: new Map(),
  };
}

export type AiFirstPlanBlueprintNormalizationContext = ReturnType<typeof buildNormalizationContext>;

export function validateBlueprintShell(
  blueprint: AiFirstPlanBlueprint,
  context: AiFirstPlanBlueprintNormalizationContext,
  issues: NormalizationIssue[],
) {
  if (blueprint.startDate !== context.authoringInput.schedule.startDate) {
    issues.push({
      code: "start_date_mismatch",
      path: "startDate",
      message: `Blueprint startDate ${blueprint.startDate} does not match authoring startDate ${context.authoringInput.schedule.startDate}.`,
    });
  }

  if (blueprint.preparationHorizonWeeks !== context.expectedHorizonWeeks) {
    issues.push({
      code: "horizon_mismatch",
      path: "preparationHorizonWeeks",
      message: "Blueprint horizon must match the validated structured authoring horizon.",
    });
  }

  const expectedRestDays = [...context.fixedRestDays].sort();
  const blueprintRestDays = [...blueprint.planPreferences.fixedRestDays].sort();

  if (JSON.stringify(expectedRestDays) !== JSON.stringify(blueprintRestDays)) {
    issues.push({
      code: "fixed_rest_days_mismatch",
      path: "planPreferences.fixedRestDays",
      message: "Blueprint fixed rest days must match validated authoring input.",
    });
  }

  if (
    blueprint.planPreferences.maxRunningDaysPerWeek !==
    context.authoringInput.availability.maxRunningDaysPerWeek
  ) {
    issues.push({
      code: "running_days_per_week_mismatch",
      path: "planPreferences.maxRunningDaysPerWeek",
      message: "Blueprint max running days/week must match validated authoring input.",
    });
  }

  const completeness = buildBlueprintCompleteness(blueprint, context);

  if (completeness.missingWeekNumbers.length > 0) {
    issues.push({
      code: "incomplete_blueprint_weeks",
      path: "weeks",
      message: `Blueprint included ${completeness.actualWeekCount} of ${completeness.expectedWeekCount} required week(s); missing weeks: ${formatBoundedList(
        completeness.missingWeekNumbers,
      )}.`,
    });
  } else if (blueprint.weeks.length !== context.expectedHorizonWeeks) {
    issues.push({
      code: "week_count_mismatch",
      path: "weeks",
      message: `Blueprint must include exactly ${context.expectedHorizonWeeks} week(s).`,
    });
  }

  const seenDates = new Set<string>();

  for (const week of blueprint.weeks) {
    const expectedRunningDayCount = expectedAuthoredWorkoutCountRangeForWeek(week, context);

    if (
      week.plannedWorkouts.length < expectedRunningDayCount.min ||
      week.plannedWorkouts.length > expectedRunningDayCount.max
    ) {
      issues.push({
        code: "running_day_count_mismatch",
        path: `weeks.${week.weekNumber}.plannedWorkouts`,
        message: `Week ${week.weekNumber} has ${week.plannedWorkouts.length} authored workouts; expected ${expectedRunningDayCount.min === expectedRunningDayCount.max ? expectedRunningDayCount.max : `${expectedRunningDayCount.min}-${expectedRunningDayCount.max}`}.`,
      });
    }

    if (!week.plannedWorkouts.some((workout) => isBlueprintLongRunIntent(workout))) {
      issues.push({
        code: "missing_weekly_long_run",
        path: `weeks.${week.weekNumber}.plannedWorkouts`,
        message: `Week ${week.weekNumber} needs one long-run intent so backend can preserve durability progression.`,
      });
    }

    validateHardDayDensity(week, context, issues);

    for (const workout of week.plannedWorkouts) {
      if (!workout.date) {
        issues.push({
          code: "missing_explicit_workout_date",
          path: `weeks.${week.weekNumber}.plannedWorkouts.date`,
          message:
            "OpenAI-authored generated plans must include an explicit ISO date for every authored workout.",
        });
      }

      const date = resolveBlueprintWorkoutDate(workout, week, context);

      if (!date) {
        issues.push({
          code: "workout_date_unresolved",
          path: `weeks.${week.weekNumber}.${workout.weekday}`,
          message: "Blueprint workout must provide a date or weekday slot inside its week.",
        });
        continue;
      }

      if (seenDates.has(date)) {
        issues.push({
          code: "duplicate_workout_date",
          path: `weeks.${week.weekNumber}.plannedWorkouts`,
          message: `${date} appears more than once.`,
        });
      }

      seenDates.add(date);

      const targetEndpointDate = context.authoringInput.schedule.targetDate === date;
      validateSelectedDistanceEndpointSignal({
        workout,
        date,
        targetEndpointDate,
        context,
        issues,
      });

      if (
        context.authoringInput.schedule.targetDate &&
        date > context.authoringInput.schedule.targetDate
      ) {
        issues.push({
          code: "target_date_overrun",
          path: `${date}.date`,
          message: `Authored workout ${date} lands after target date ${context.authoringInput.schedule.targetDate}.`,
        });
      }

      if (workout.date && workout.date !== date) {
        issues.push({
          code: "date_weekday_mismatch",
          path: `${workout.date}.weekday`,
          message: `${workout.date} does not match ${workout.weekday} inside week ${week.weekNumber}.`,
        });
      }

      if (context.fixedRestDays.has(workout.weekday)) {
        issues.push({
          code: "fixed_rest_day_violation",
          path: `${date}.workoutFamily`,
          message: `${date} is a fixed rest day and cannot contain an authored workout.`,
        });
      }

      if (!context.runningDays.has(workout.weekday) && !targetEndpointDate) {
        issues.push({
          code: "non_running_day_violation",
          path: `${date}.weekday`,
          message: `${date} is not one of the validated running days.`,
        });
      }

      if (
        isBlueprintLongRunIntent(workout) &&
        context.preferredLongRunDay &&
        workout.workoutIdentity !== "selected_distance_completion_or_checkpoint" &&
        workout.weekday !== context.preferredLongRunDay &&
        workout.date !== context.authoringInput.schedule.targetDate
      ) {
        issues.push({
          code: "preferred_long_run_day_violation",
          path: `${date}.weekday`,
          message: `Long runs should land on ${context.preferredLongRunDay}.`,
        });
      }

      validateGoalFamilyWorkoutIdentity(workout, date, context, issues);
      validateConservativeNoBenchmarkEarlyAdaptationWorkout(
        workout,
        date,
        week.weekNumber,
        context,
        issues,
      );

      if (
        context.lowSupportBuildConsistency &&
        [
          "controlled_tempo_session",
          "time_intervals",
          "distance_intervals",
          "5k_sharpening_repeats",
          "10k_rhythm_intervals",
          "race_pace_session",
          "taper_tuneup_run",
        ].includes(workout.workoutIdentity)
      ) {
        issues.push({
          code: "beginner_low_support_quality_cap",
          path: `${date}.workoutIdentity`,
          message:
            "Low-support build-consistency plans cannot use tempo, interval, or race-like identities.",
        });
      }

      if (containsForbiddenCoachingClaims(workout)) {
        issues.push({
          code: "forbidden_coaching_claim",
          path: `${date}.summary`,
          message:
            "Blueprint contains exact elevation, medical, rehab, unsupported metric precision, or physiological truth claims.",
        });
      }

      validateBlueprintWorkoutTargetContract({
        workout,
        date,
        context,
        issues,
      });
    }
  }

  validateGoalFamilyCadence(blueprint, context, issues);
}

function validateConservativeNoBenchmarkEarlyAdaptationWorkout(
  workout: AiBlueprintWorkout,
  date: string,
  weekNumber: number,
  context: AiFirstPlanBlueprintNormalizationContext,
  issues: NormalizationIssue[],
) {
  if (
    !shouldUseConservativeNoBenchmarkLongDistanceAdaptation(context.authoringInput, weekNumber) ||
    isConservativeNoBenchmarkAdaptationSafeIdentity(workout.workoutIdentity, weekNumber)
  ) {
    return;
  }

  issues.push({
    code: "conservative_no_benchmark_early_specificity",
    path: `${date}.workoutIdentity`,
    message: `Week ${weekNumber} conservative/no-benchmark long-distance adaptation must stay easy, recovery, long-aerobic, cutback, or relaxed-stride only; ${workout.workoutIdentity} is too specific too early.`,
  });
}

function validateBlueprintWorkoutTargetContract({
  workout,
  date,
  context,
  issues,
}: {
  workout: AiBlueprintWorkout;
  date: string;
  context: AiFirstPlanBlueprintNormalizationContext;
  issues: NormalizationIssue[];
}) {
  for (const [sectionIndex, section] of workout.sections.entries()) {
    const sectionPath = `${date}.sections.${sectionIndex + 1}`;

    if (section.kind === "repeat") {
      validateRepeatChildTargets({ section, path: sectionPath, issues });
      continue;
    }

    if (!hasMeaningfulEffortTarget(section.target)) {
      issues.push({
        code: "ai_authored_section_target_missing",
        path: `${sectionPath}.target`,
        message: `${section.label} must include AI-authored section target guidance such as effort, RPE, cue, or hint.`,
      });
    }
  }

  if (workout.workoutIdentity !== SELECTED_DISTANCE_ENDPOINT_IDENTITY) {
    return;
  }

  const expectedDistanceMeters = context.authoringInput.planGoalIntent?.distance?.distanceMeters;
  validateSelectedDistanceEndpointDynamics({ workout, date, expectedDistanceMeters, issues });
}

function validateRepeatChildTargets({
  section,
  path,
  issues,
}: {
  section: AiBlueprintSection;
  path: string;
  issues: NormalizationIssue[];
}) {
  const children = section.prescription.children ?? [];

  for (const [childIndex, child] of children.entries()) {
    if (!hasMeaningfulEffortTarget(child.target)) {
      issues.push({
        code: "ai_authored_repeat_child_target_missing",
        path: `${path}.children.${childIndex + 1}.target`,
        message: `${child.label} must include child-owned target guidance such as effort, RPE, cue, or hint.`,
      });
    }
  }
}

function validateSelectedDistanceEndpointDynamics({
  workout,
  date,
  expectedDistanceMeters,
  issues,
}: {
  workout: AiBlueprintWorkout;
  date: string;
  expectedDistanceMeters: number | null | undefined;
  issues: NormalizationIssue[];
}) {
  if (!expectedDistanceMeters) {
    return;
  }

  const hasWarmup = workout.sections.some(
    (section) => section.kind === "warm_up" && section.prescription.mode !== "none",
  );
  const hasCooldownOrWalkDown = workout.sections.some(
    (section) =>
      section.prescription.mode !== "none" &&
      (section.kind === "cooldown" ||
        /cool[- ]?down|walk[- ]?down/i.test(`${section.label} ${section.guidance}`)),
  );
  const nestedDistanceChildren = collectNestedEndpointDistanceChildren(workout.sections);

  if (!hasWarmup) {
    issues.push({
      code: "selected_distance_endpoint_missing_warmup",
      path: `${date}.sections`,
      message:
        "Selected-distance endpoints must include an authored warm-up or opening support section before the exact distance block.",
    });
  }

  if (!hasCooldownOrWalkDown) {
    issues.push({
      code: "selected_distance_endpoint_missing_cooldown",
      path: `${date}.sections`,
      message:
        "Selected-distance endpoints must include cooldown or walk-down support after the exact distance block.",
    });
  }

  if (nestedDistanceChildren.length < 3) {
    issues.push({
      code: "selected_distance_endpoint_not_nested_dynamic",
      path: `${date}.sections`,
      message:
        "Selected-distance endpoints must use a structural main-work section with ordered child distance dynamics, not only flat distance sections or one anonymous block.",
    });
    return;
  }

  if (
    isFormulaicTwentySixtyTwentySplit(nestedDistanceChildren.map((child) => child.distanceMeters))
  ) {
    issues.push({
      code: "selected_distance_endpoint_formulaic_split",
      path: `${date}.sections`,
      message:
        "Selected-distance endpoint dynamics must be coach-authored, not a fixed 20/60/20 arithmetic split.",
    });
  }

  if (!hasMeaningfulEndpointGuidanceVariation(nestedDistanceChildren)) {
    issues.push({
      code: "selected_distance_endpoint_flat_target_guidance",
      path: `${date}.sections`,
      message:
        "Selected-distance endpoint child sections must vary coaching cues, effort, or RPE across opening, body, and finish dynamics.",
    });
  }
}

function collectNestedEndpointDistanceChildren(sections: readonly AiBlueprintSection[]) {
  const children: {
    child: AiBlueprintRepeatChild;
    distanceMeters: number;
  }[] = [];

  for (const section of sections) {
    if (section.kind !== "repeat" || section.prescription.mode !== "repeats") {
      continue;
    }

    const repeatCount = section.prescription.repeat_count ?? 1;
    for (const child of section.prescription.children ?? []) {
      if (child.prescription.mode !== "distance" || !child.prescription.distance_km) {
        continue;
      }

      children.push({
        child,
        distanceMeters: Math.round(child.prescription.distance_km * 1000 * repeatCount),
      });
    }
  }

  return children;
}

function isFormulaicTwentySixtyTwentySplit(distanceMeters: readonly number[]) {
  if (distanceMeters.length < 3) {
    return false;
  }

  const total = distanceMeters.reduce((sum, meters) => sum + meters, 0);
  if (total <= 0) {
    return false;
  }

  const opening = distanceMeters[0] ?? 0;
  const finish = distanceMeters.at(-1) ?? 0;
  const body = total - opening - finish;

  return (
    Math.abs(opening / total - 0.2) < 0.015 &&
    Math.abs(body / total - 0.6) < 0.015 &&
    Math.abs(finish / total - 0.2) < 0.015
  );
}

function hasMeaningfulEndpointGuidanceVariation(
  children: readonly { child: AiBlueprintRepeatChild; distanceMeters: number }[],
) {
  const fingerprints = new Set(
    children.map(({ child }) =>
      normalizeGuidanceFingerprint(
        [
          child.guidance,
          child.target?.intensity,
          child.target?.cue,
          child.target?.hint,
          child.target?.rpe,
        ].join("|"),
      ),
    ),
  );

  return fingerprints.size >= 2;
}

function normalizeGuidanceFingerprint(value: string) {
  return value.toLowerCase().replaceAll(/\s+/g, " ").trim();
}

function hasMeaningfulEffortTarget(
  target: AiBlueprintSection["target"] | AiBlueprintRepeatChild["target"],
) {
  if (!target) {
    return false;
  }

  return Boolean(target.intensity || target.cue || target.hint || typeof target.rpe === "number");
}

function buildBlueprintCompleteness(
  blueprint: AiFirstPlanBlueprint,
  context: AiFirstPlanBlueprintNormalizationContext,
) {
  const expectedDates = buildExpectedAuthoredWorkoutDates(context);
  const authoredDates = new Set<string>();

  for (const week of blueprint.weeks) {
    for (const workout of week.plannedWorkouts) {
      const date = resolveBlueprintWorkoutDate(workout, week, context);

      if (date) {
        authoredDates.add(date);
      }
    }
  }

  const actualWeekNumbers = new Set(blueprint.weeks.map((week) => week.weekNumber));
  const missingWeekNumbers = Array.from(
    { length: context.expectedHorizonWeeks },
    (_value, index) => index + 1,
  ).filter((weekNumber) => !actualWeekNumbers.has(weekNumber));

  return {
    expectedWeekCount: context.expectedHorizonWeeks,
    actualWeekCount: blueprint.weeks.length,
    expectedRequiredSlotCount: expectedDates.length,
    actualAuthoredWorkoutCount: blueprint.weeks.reduce(
      (total, week) => total + week.plannedWorkouts.length,
      0,
    ),
    missingWeekNumbers,
    firstMissingRequiredDates: expectedDates
      .filter((date) => !authoredDates.has(date))
      .slice(0, 12),
  };
}

function buildExpectedAuthoredWorkoutDates(context: AiFirstPlanBlueprintNormalizationContext) {
  void context;

  return [];
}

function expectedAuthoredWorkoutCountRangeForWeek(
  week: AiBlueprintWeek,
  context: AiFirstPlanBlueprintNormalizationContext,
) {
  const weeklyTarget = context.authoringInput.availability.maxRunningDaysPerWeek;
  const targetDate = context.authoringInput.schedule.targetDate;
  const earlyConservativeMax = conservativeEarlyAuthoredWorkoutMax(context, week.weekNumber);

  if (!targetDate) {
    return earlyConservativeMax ? upToCount(earlyConservativeMax) : exactCount(weeklyTarget);
  }

  const weekStart = addDaysIso(
    context.authoringInput.schedule.startDate,
    (week.weekNumber - 1) * 7,
  );
  const weekEnd = addDaysIso(weekStart, 6);

  if (targetDate < weekStart || targetDate > weekEnd) {
    return earlyConservativeMax ? upToCount(earlyConservativeMax) : exactCount(weeklyTarget);
  }

  const availableDatesThroughTarget = Array.from({ length: 7 }, (_value, offset) =>
    addDaysIso(weekStart, offset),
  ).filter((date) => {
    const weekday = weekdayLong(date);

    return date <= targetDate && (!context.fixedRestDays.has(weekday) || date === targetDate);
  });

  return exactCount(Math.max(1, Math.min(weeklyTarget, availableDatesThroughTarget.length)));
}

function exactCount(value: number) {
  return {
    min: value,
    max: value,
  };
}

function upToCount(max: number) {
  return {
    min: 1,
    max,
  };
}

function conservativeEarlyAuthoredWorkoutMax(
  context: AiFirstPlanBlueprintNormalizationContext,
  weekNumber: number,
) {
  if (weekNumber > 4 || !isConservativeNoBenchmarkAuthoring(context)) {
    return null;
  }

  const distanceMeters = context.authoringInput.planGoalIntent?.distance?.distanceMeters ?? 10_000;
  const maxEarly =
    distanceMeters <= 10_000 &&
    context.authoringInput.runnerProfile.experienceLevel === "new_runner"
      ? 3
      : 4;

  return Math.min(context.authoringInput.availability.maxRunningDaysPerWeek, maxEarly);
}

function isConservativeNoBenchmarkAuthoring(context: AiFirstPlanBlueprintNormalizationContext) {
  const authoringInput = context.authoringInput;
  const noBenchmark = !authoringInput.currentLevel.recent5kPaceSecondsPerKm;
  const feasibilityStatus = authoringInput.planGoalIntent?.feasibility?.status ?? null;
  const targetTimeIntent = Boolean(
    authoringInput.goal.targetTime ||
    authoringInput.planGoalIntent?.targetFinishTime ||
    authoringInput.planGoalIntent?.targetOutcomePace,
  );

  return (
    noBenchmark &&
    (authoringInput.runnerProfile.experienceLevel === "new_runner" ||
      authoringInput.runnerProfile.experienceLevel === "returning_runner" ||
      feasibilityStatus === "aggressive_or_short_horizon" ||
      targetTimeIntent)
  );
}

function formatBoundedList(values: Array<string | number>) {
  const visibleValues = values.slice(0, 12);
  const suffix =
    values.length > visibleValues.length ? `, +${values.length - visibleValues.length} more` : "";

  return `${visibleValues.join(", ")}${suffix}`;
}

function validateHardDayDensity(
  week: AiBlueprintWeek,
  context: AiFirstPlanBlueprintNormalizationContext,
  issues: NormalizationIssue[],
) {
  const hardWorkouts = week.plannedWorkouts
    .filter((workout) => hardWorkoutFamilies.has(workout.workoutFamily))
    .sort((a, b) => weekdayIndex(a.weekday) - weekdayIndex(b.weekday));
  const maxHardDays = context.authoringInput.availability.maxRunningDaysPerWeek <= 3 ? 1 : 2;

  if (hardWorkouts.length > maxHardDays) {
    issues.push({
      code: "hard_day_density_too_high",
      path: `weeks.${week.weekNumber}.plannedWorkouts`,
      message: `Week ${week.weekNumber} has ${hardWorkouts.length} hard days; max safe density is ${maxHardDays}.`,
    });
  }

  for (let index = 1; index < hardWorkouts.length; index += 1) {
    if (
      weekdayIndex(hardWorkouts[index]!.weekday) - weekdayIndex(hardWorkouts[index - 1]!.weekday) <=
      1
    ) {
      issues.push({
        code: "back_to_back_hard_days",
        path: `weeks.${week.weekNumber}.plannedWorkouts`,
        message: `Week ${week.weekNumber} has hard days too close together.`,
      });
      break;
    }
  }
}

function validateGoalFamilyCadence(
  blueprint: AiFirstPlanBlueprint,
  context: AiFirstPlanBlueprintNormalizationContext,
  issues: NormalizationIssue[],
) {
  if (!context.goalFamilyCadencePlan) {
    return;
  }

  if (usesConservativeNoBenchmarkCadence(context)) {
    return;
  }

  const cadenceWeeks = new Set(
    blueprint.weeks
      .filter((week) =>
        week.plannedWorkouts.some((workout) => isBlueprintCadenceIntent(workout, context)),
      )
      .map((week) => week.weekNumber),
  );
  const cadenceExemptWeeks = new Set(
    blueprint.weeks
      .filter((week) => week.cutbackWeek || week.taperWeek)
      .map((week) => week.weekNumber),
  );

  const supportedIntensityCadence = resolveSupportedIntensityCadence(context.authoringInput);
  const cadenceFrequency =
    supportedIntensityCadence.applies && supportedIntensityCadence.frequency !== "none"
      ? supportedIntensityCadence.frequency
      : context.goalFamilyPolicy.cadence.frequency;

  if (cadenceFrequency === "none") {
    return;
  }

  const step = cadenceFrequency === "weekly" ? 1 : 2;
  const cadenceLabel =
    context.goalFamilyPolicy.cadence.kind === "quality"
      ? "quality, rhythm, or tune-up"
      : "goal-family specialty";

  for (let weekNumber = 1; weekNumber <= context.expectedHorizonWeeks; weekNumber += step) {
    const nextWeekNumber = step === 1 ? weekNumber : weekNumber + 1;
    const cadenceWindowRequired =
      shouldRequireGoalFamilyCadenceWeek(context, weekNumber, supportedIntensityCadence) ||
      (step !== 1 &&
        nextWeekNumber <= context.expectedHorizonWeeks &&
        shouldRequireGoalFamilyCadenceWeek(context, nextWeekNumber, supportedIntensityCadence));
    const cadenceWindowExempt =
      cadenceExemptWeeks.has(weekNumber) && (step === 1 || cadenceExemptWeeks.has(nextWeekNumber));

    if (!cadenceWindowRequired || cadenceWindowExempt) {
      continue;
    }

    if (!cadenceWeeks.has(weekNumber) && !cadenceWeeks.has(nextWeekNumber)) {
      issues.push({
        code: "goal_family_identity_cadence_gap",
        path: `weeks.${weekNumber}`,
        message: `${context.goalFamilyPolicy.label} plans need ${cadenceLabel} identities on the required week-aware cadence.`,
      });
    }
  }
}

function usesConservativeNoBenchmarkCadence(context: AiFirstPlanBlueprintNormalizationContext) {
  const hasOutcomeIntent = Boolean(
    context.authoringInput.goal.targetTime ||
    context.authoringInput.planGoalIntent?.targetFinishTime ||
    context.authoringInput.planGoalIntent?.targetOutcomePace,
  );

  return Boolean(
    !context.authoringInput.currentLevel.recent5kPaceSecondsPerKm &&
    (hasOutcomeIntent ||
      context.authoringInput.planGoalIntent?.feasibility?.status === "aggressive_or_short_horizon"),
  );
}

function shouldRequireGoalFamilyCadenceWeek(
  context: AiFirstPlanBlueprintNormalizationContext,
  weekNumber: number,
  supportedIntensityCadence: ReturnType<typeof resolveSupportedIntensityCadence>,
) {
  if (
    supportedIntensityCadence.applies &&
    supportedIntensityCadence.frequency !== "none" &&
    !shouldScheduleSupportedIntensityWeek(
      context.authoringInput,
      weekNumber,
      supportedIntensityCadence,
    )
  ) {
    return false;
  }

  return true;
}

function validateGoalFamilyWorkoutIdentity(
  workout: AiBlueprintWorkout,
  date: string,
  context: AiFirstPlanBlueprintNormalizationContext,
  issues: NormalizationIssue[],
) {
  const policy = context.goalFamilyPolicy;

  if (policy.excludedIdentities.has(workout.workoutIdentity)) {
    issues.push({
      code: "goal_family_identity_excluded",
      path: `${date}.workoutIdentity`,
      message: `${workout.workoutIdentity} is not appropriate for ${policy.label} blueprint plans.`,
    });
    return;
  }

  if (!policy.allowedIdentities.has(workout.workoutIdentity)) {
    issues.push({
      code: "goal_family_identity_not_allowed",
      path: `${date}.workoutIdentity`,
      message: `${workout.workoutIdentity} is outside the backend ${policy.label} identity matrix.`,
    });
  }
}

function validateSelectedDistanceEndpointSignal({
  workout,
  date,
  targetEndpointDate,
  context,
  issues,
}: {
  workout: AiBlueprintWorkout;
  date: string;
  targetEndpointDate: boolean;
  context: AiFirstPlanBlueprintNormalizationContext;
  issues: NormalizationIssue[];
}) {
  if (!isSelectedDistanceEndpointRequired(context) || !context.authoringInput.schedule.targetDate) {
    return;
  }

  const isEndpointSignal = workout.workoutIdentity === "selected_distance_completion_or_checkpoint";

  if (targetEndpointDate && !isEndpointSignal) {
    issues.push({
      code: "missing_selected_distance_endpoint_signal",
      path: `${date}.workoutIdentity`,
      message:
        "Target-date distance goals must use selected_distance_completion_or_checkpoint on the target date; taper, long, easy, steady, or rest cannot satisfy the selected-distance endpoint.",
    });
    return;
  }

  if (!targetEndpointDate && isEndpointSignal) {
    issues.push({
      code: "selected_distance_endpoint_wrong_date",
      path: `${date}.workoutIdentity`,
      message: `selected_distance_completion_or_checkpoint must land exactly on target date ${context.authoringInput.schedule.targetDate}.`,
    });
    return;
  }

  if (
    targetEndpointDate &&
    isEndpointSignal &&
    (workout.workoutFamily !== "race" || workout.calendarIconKey !== "race")
  ) {
    issues.push({
      code: "selected_distance_endpoint_shape_invalid",
      path: `${date}.workoutFamily`,
      message:
        "The selected-distance endpoint signal must use workoutFamily race and calendarIconKey race so backend can canonicalize it safely.",
    });
  }
}

function isBlueprintLongRunIntent(workout: AiBlueprintWorkout) {
  return (
    workout.workoutFamily === "long" ||
    workout.workoutIdentity === "selected_distance_completion_or_checkpoint" ||
    workout.workoutIdentity === "hike_run_endurance" ||
    workout.workoutIdentity === "mountain_long_run_time_on_feet"
  );
}

function isBlueprintCadenceIntent(
  workout: AiBlueprintWorkout,
  context: AiFirstPlanBlueprintNormalizationContext,
) {
  const policy = context.goalFamilyPolicy;

  return (
    policy.expectedQualityIdentities.has(workout.workoutIdentity) ||
    policy.specialtyIdentities.has(workout.workoutIdentity) ||
    (policy.cadence.useLongRunSlot && policy.longRunIdentities.has(workout.workoutIdentity)) ||
    (policy.cadence.kind === "quality" && isQualityFamily(workout.workoutFamily))
  );
}

function isQualityFamily(family: AuthoredWorkoutFamily) {
  return (
    family === "tempo" || family === "intervals" || family === "progression" || family === "race"
  );
}

export function validateNormalizedPlanDoctrine(
  workouts: CanonicalWorkout[],
  context: AiFirstPlanBlueprintNormalizationContext,
  issues: NormalizationIssue[],
) {
  validateSelectedDistanceEndpointDoctrine(workouts, context, issues);

  for (const workout of workouts) {
    if (context.fixedRestDays.has(workout.weekday) && workout.workout_family !== "rest") {
      issues.push({
        code: "fixed_rest_day_violation",
        path: `${workout.date}.workout_family`,
        message: `${workout.date} is a fixed rest day and cannot contain a non-rest workout.`,
      });
    }
  }

  validateSupportedSpecificityDoctrine(workouts, context, issues);

  const longRuns = workouts.filter(
    (workout) =>
      !isSelectedDistanceEndpointWorkout(workout) &&
      (workout.workout_family === "long" || workout.workout_type === "long_run"),
  );
  const longRunLoads = longRuns.map((workout) => estimateCanonicalWorkoutLoad(workout));
  let previousNonCutbackLongRunLoad = longRunLoads[0] ?? 0;

  for (let index = 1; index < longRunLoads.length; index += 1) {
    const previousWorkout = longRuns[index - 1]!;
    const currentLoad = longRunLoads[index]!;
    const previousLoad = longRunLoads[index - 1]!;
    const isAllowedCutbackRebound =
      isCutbackLongRun(previousWorkout) &&
      previousNonCutbackLongRunLoad > 0 &&
      currentLoad <= previousNonCutbackLongRunLoad * 1.25;

    if (currentLoad > previousLoad * 1.5 && !isAllowedCutbackRebound) {
      issues.push({
        code: "long_run_progression_too_steep",
        path: "planned_workouts",
        message: `Long-run progression jumps too aggressively between weeks (${longRunLoads
          .map((load) => Number(load.toFixed(1)))
          .join(" -> ")}).`,
      });
      break;
    }

    if (!isCutbackLongRun(longRuns[index]!)) {
      previousNonCutbackLongRunLoad = Math.max(previousNonCutbackLongRunLoad, currentLoad);
    }
  }

  const taperLongRuns = longRuns.filter((workout) => /taper/i.test(workout.phase));
  const preTaperPeak = Math.max(
    0,
    ...longRuns
      .filter((workout) => !/taper/i.test(workout.phase))
      .map((workout) => estimateCanonicalWorkoutLoad(workout)),
  );

  if (
    preTaperPeak > 0 &&
    taperLongRuns.some((workout) => estimateCanonicalWorkoutLoad(workout) >= preTaperPeak)
  ) {
    issues.push({
      code: "taper_peak_violation",
      path: "planned_workouts",
      message: "Taper long runs must stay below the pre-taper long-run peak.",
    });
  }

  validateRecoveryFirstAfterLongRuns(workouts, context, issues);
}

function isSelectedDistanceEndpointWorkout(workout: CanonicalWorkout) {
  return workout.source_workout_type === SELECTED_DISTANCE_ENDPOINT_SOURCE_KIND;
}

function isSelectedDistanceEndpointRequired(context: AiFirstPlanBlueprintNormalizationContext) {
  return (
    context.authoringInput.goal.goalType === "distance_build" &&
    Boolean(context.authoringInput.planGoalIntent?.distance)
  );
}

function validateSelectedDistanceEndpointDoctrine(
  workouts: CanonicalWorkout[],
  context: AiFirstPlanBlueprintNormalizationContext,
  issues: NormalizationIssue[],
) {
  const distanceMeters = isSelectedDistanceEndpointRequired(context)
    ? (context.authoringInput.planGoalIntent?.distance?.distanceMeters ?? null)
    : null;
  if (distanceMeters == null) {
    return;
  }

  issues.push(
    ...collectSelectedDistanceEndpointIssues({
      rows: workouts.map((workout) => ({
        id: workout.workout_id,
        date: workout.date,
        isRest: workout.workout_type === "rest",
        endpointKind: workout.source_workout_type,
        endpointIdentity: workout.workout_identity,
        endpointDistanceMeters: selectedDistanceEndpointMainDistanceMeters({
          endpointKind: workout.source_workout_type,
          segments: workout.segments,
        }),
        isSelectedEndpointSignal:
          workout.source_workout_type === SELECTED_DISTANCE_ENDPOINT_SOURCE_KIND ||
          workout.workout_identity === SELECTED_DISTANCE_ENDPOINT_IDENTITY,
      })),
      expectedDistanceMeters: distanceMeters,
      targetDate: context.authoringInput.schedule.targetDate,
    }),
  );
}

function validateSupportedSpecificityDoctrine(
  workouts: CanonicalWorkout[],
  context: AiFirstPlanBlueprintNormalizationContext,
  issues: NormalizationIssue[],
) {
  const workoutsByWeek = new Map<number, CanonicalWorkout[]>();

  for (const workout of workouts) {
    const weekWorkouts = workoutsByWeek.get(workout.week_number) ?? [];
    weekWorkouts.push(workout);
    workoutsByWeek.set(workout.week_number, weekWorkouts);
  }

  for (const [weekNumber, weekWorkouts] of workoutsByWeek) {
    const cadence = resolveSupportedIntensityCadence(context.authoringInput, weekNumber);

    if (!cadence.applies) {
      continue;
    }

    const specificityWorkouts = weekWorkouts.filter((workout) =>
      isSupportedSpecificityIdentity(workout.workout_identity),
    );
    const scheduledWeek =
      cadence.applies &&
      cadence.frequency !== "none" &&
      shouldScheduleSupportedIntensityWeek(context.authoringInput, weekNumber, cadence);

    if (!scheduledWeek) {
      if (
        specificityWorkouts.length > 0 &&
        !isAllowedLowSupportTenKMicroStrideWeek(context, weekNumber, specificityWorkouts)
      ) {
        issues.push({
          code: "supported_specificity_too_early",
          path: `weeks.${weekNumber}.plannedWorkouts`,
          message: `Week ${weekNumber} contains beginner/recreational specificity before backend support cadence allows it.`,
        });
      }
      continue;
    }

    const allowedSpecificity = new Set(
      resolveSupportedSpecificityIdentityOptions(context.authoringInput, weekNumber, cadence),
    );
    const disallowedSpecificity = specificityWorkouts.filter(
      (workout) => !allowedSpecificity.has(workout.workout_identity),
    );
    if (disallowedSpecificity.length > 0) {
      issues.push({
        code: "supported_specificity_identity_not_allowed",
        path: `weeks.${weekNumber}.plannedWorkouts`,
        message: `Week ${weekNumber} contains specificity not allowed by backend support cadence: ${disallowedSpecificity
          .map((workout) => workout.workout_identity)
          .join(", ")}.`,
      });
    }

    if (specificityWorkouts.length > 1) {
      issues.push({
        code: "supported_specificity_density_too_high",
        path: `weeks.${weekNumber}.plannedWorkouts`,
        message: `Week ${weekNumber} has more than one beginner/recreational specificity stimulus.`,
      });
    }

    if (
      shouldUseLongRunSteadyFinishAsSpecificStimulus(context.authoringInput, weekNumber, cadence) &&
      !specificityWorkouts.some(
        (workout) => workout.workout_identity === "long_run_with_steady_finish",
      )
    ) {
      issues.push({
        code: "missing_long_run_steady_finish_specificity",
        path: `weeks.${weekNumber}.plannedWorkouts`,
        message: `Week ${weekNumber} should use the long run as the specific stimulus instead of adding midweek load.`,
      });
    }

    if (
      !hasRaceSpecificMetricSupport(context.authoringInput) &&
      specificityWorkouts.some((workout) => workout.workout_identity === "race_pace_session")
    ) {
      issues.push({
        code: "unsupported_race_pace_specificity",
        path: `weeks.${weekNumber}.plannedWorkouts`,
        message:
          "Race-pace specificity requires usable benchmark, watch/app access, and pace or mixed guidance support.",
      });
    }
  }
}

function isAllowedLowSupportTenKMicroStrideWeek(
  context: AiFirstPlanBlueprintNormalizationContext,
  weekNumber: number,
  specificityWorkouts: readonly CanonicalWorkout[],
) {
  const distanceMeters = context.authoringInput.planGoalIntent?.distance?.distanceMeters ?? null;

  return Boolean(
    weekNumber === 2 &&
    distanceMeters != null &&
    distanceMeters <= 10_000 &&
    !context.authoringInput.currentLevel.recent5kPaceSecondsPerKm &&
    context.authoringInput.runnerProfile.experienceLevel === "new_runner" &&
    specificityWorkouts.length === 1 &&
    specificityWorkouts[0]?.workout_identity === "easy_run_with_strides",
  );
}

function isCutbackLongRun(workout: CanonicalWorkout) {
  const sourceWorkoutType = workout.source_workout_type ?? "";

  return (
    sourceWorkoutType.includes("cutback") ||
    /cutback|reduced/i.test(workout.title) ||
    /cutback/i.test(workout.summary)
  );
}

function validateRecoveryFirstAfterLongRuns(
  workouts: CanonicalWorkout[],
  context: AiFirstPlanBlueprintNormalizationContext,
  issues: NormalizationIssue[],
) {
  if (
    context.goalFamilyCadencePlan ||
    !shouldUseRecoveryFirstAfterLongRun(context.authoringInput)
  ) {
    return;
  }

  const runningWorkouts = workouts
    .filter((workout) => !isRestWorkout(workout))
    .sort((left, right) => left.date.localeCompare(right.date));

  for (let index = 0; index < runningWorkouts.length; index += 1) {
    const longRun = runningWorkouts[index]!;

    if (!isCanonicalLongRunWorkout(longRun)) {
      continue;
    }

    const nextWorkout = runningWorkouts[index + 1] ?? null;

    if (!nextWorkout || isRecoveryFirstWorkout(nextWorkout)) {
      continue;
    }

    if (
      nextWorkout.workout_identity === "easy_run_with_strides" &&
      diffDaysIso(nextWorkout.date, longRun.date) > 2
    ) {
      continue;
    }

    issues.push({
      code: "post_long_run_recovery_first_violation",
      path: `${nextWorkout.date}.workout_identity`,
      message: `${nextWorkout.date} follows a long run on ${longRun.date}; low-support long-run-heavy first plans must use recovery_jog or easy_aerobic_run in the next running slot.`,
    });
  }
}

function isRestWorkout(workout: CanonicalWorkout) {
  return workout.workout_family === "rest" || workout.workout_type === "rest";
}

function isCanonicalLongRunWorkout(workout: CanonicalWorkout) {
  const identity = workout.workout_identity ?? workout.source_workout_type ?? "";

  return (
    workout.workout_family === "long" ||
    workout.workout_type === "long_run" ||
    identity === "hike_run_endurance" ||
    identity === "mountain_long_run_time_on_feet" ||
    identity === "ultra_time_on_feet_durability"
  );
}

function isRecoveryFirstWorkout(workout: CanonicalWorkout) {
  const identity = workout.workout_identity ?? workout.source_workout_type ?? "";

  return identity === "recovery_jog" || identity === "easy_aerobic_run";
}

export function resolveBlueprintWorkoutDate(
  workout: AiBlueprintWorkout,
  week: AiBlueprintWeek,
  context: AiFirstPlanBlueprintNormalizationContext,
) {
  const weekStart = addDaysIso(
    context.authoringInput.schedule.startDate,
    (week.weekNumber - 1) * 7,
  );
  const dateForWeekday = Array.from({ length: 7 }, (_, offset) =>
    addDaysIso(weekStart, offset),
  ).find((candidate) => weekdayLong(candidate) === workout.weekday);

  if (!dateForWeekday) {
    return null;
  }

  if (workout.date && workout.date !== dateForWeekday) {
    return null;
  }

  return workout.date ?? dateForWeekday;
}

function estimateCanonicalWorkoutLoad(workout: CanonicalWorkout) {
  return workout.segments.reduce((total, segment) => {
    const prescription = segment.prescription;

    if (typeof segment.distance_km === "number") {
      return total + segment.distance_km;
    }

    if (prescription?.distance_km) {
      return total + prescription.distance_km;
    }

    if (typeof segment.duration_min === "number") {
      return total + segment.duration_min / 6;
    }

    if (prescription?.duration_min) {
      return total + prescription.duration_min / 6;
    }

    if (prescription?.mode === "repeats" && prescription.repeat_count) {
      if (prescription.children?.length) {
        return (
          total +
          prescription.children.reduce(
            (sum, child) => sum + estimateUnitDurationMin(child.prescription),
            0,
          ) *
            prescription.repeat_count
        );
      }

      if (!prescription.children?.length) {
        return total;
      }

      return (
        total +
        prescription.children.reduce(
          (sum, child) => sum + estimateUnitDurationMin(child.prescription),
          0,
        ) *
          prescription.repeat_count
      );
    }

    return total;
  }, 0);
}

function estimateUnitDurationMin(
  unit: NonNullable<NonNullable<StepPrescription["children"]>[number]["prescription"]>,
) {
  if (unit.mode === "time" && unit.duration_min) {
    return unit.duration_min / 6;
  }

  if (unit.mode === "distance" && unit.distance_km) {
    return unit.distance_km;
  }

  return 0;
}

function containsForbiddenCoachingClaims(workout: AiBlueprintWorkout) {
  const text = JSON.stringify(workout).toLowerCase();

  return (
    /\b(?:elevation gain|vertical gain|vert)\b.*\b\d+\s*(?:m|meters|metres|ft|feet)\b/.test(text) ||
    /\b\d+\s*(?:m|meters|metres|ft|feet)\b.*\b(?:elevation gain|vertical gain|vert)\b/.test(text) ||
    /\b(?:diagnose|diagnosis|treat|treatment|rehab|rehabilitation|therapy|medical)\b/.test(text) ||
    /\b(?:threshold hr|aet|anaerobic threshold|lactate threshold heart rate)\b/.test(text) ||
    /\b\d{2,3}\s*-\s*\d{2,3}\s*bpm\b/.test(text)
  );
}

export function failedAiBlueprintNormalization(
  reason: string,
  issues: NormalizationIssue[],
  blueprintTrace?: AiFirstPlanBlueprintTraceMetadata,
): Extract<AiFirstPlanBlueprintNormalizationResult, { ok: false }> {
  return {
    ok: false,
    reason,
    issues,
    fallback: {
      status: "blueprint_unavailable",
      source: "openai_ai_first_plan_blueprint",
      validationIssues: issues.map((issue) => issue.message).slice(0, 12),
      repairs: [],
      reviewAssumptions: [
        "Hito rejected this AI-authored blueprint before review because it did not pass backend validation.",
      ],
      metricPolicySummary:
        "Rejected AI blueprint produced no reviewed draft; existing pace, HR, fixed-rest-day, and effort-safety gates remain enforced.",
      blueprintTrace: blueprintTrace ?? null,
      datePlacement: blueprintTrace?.datePlacement,
    },
  };
}
