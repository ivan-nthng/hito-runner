import assert from "node:assert/strict";
import { buildPlanPresetReviewDraftContract } from "../../src/lib/plan-presets/expand";
import { resolvePlanPresetCards } from "../../src/lib/plan-presets/resolver";
import type {
  PlanPresetCardViewModel,
  PlanPresetEligibilityRequestInput,
} from "../../src/lib/plan-presets/schema";
import { addDaysIso } from "../../src/lib/training";

export type PlanPresetDraft = ReturnType<typeof buildPlanPresetReviewDraftContract>;

export const baseInput = {
  profile: {
    age: 36,
    weightKg: 76,
    heightCm: 180,
  },
  benchmark: {
    fitnessLevel: "running_regularly",
  },
  availability: {
    runningDaysPerWeek: 4,
    fixedRestDays: ["Wednesday", "Sunday"],
    preferredLongRunDay: "Saturday",
  },
  goal: {
    goalDistance: "half_marathon",
    goalStyle: "balanced",
    terrainFocus: "standard",
  },
  execution: {
    watchAccess: "watch_or_app",
    guidancePreference: "mixed",
  },
  strength: {
    preference: "mobility",
  },
  schedule: null,
  comment: null,
} satisfies PlanPresetEligibilityRequestInput;

export function assertDraftRejected(
  cardId: "10k" | "half_marathon" | "marathon",
  input: PlanPresetEligibilityRequestInput,
  label: string,
) {
  assert.throws(
    () =>
      buildPlanPresetReviewDraftContract({
        cardId,
        input,
      }),
    /Plan preset is not eligible|supports relaxed or balanced|supports balanced/i,
    `Expected ${label} to reject preset draft expansion.`,
  );
}

export function assertNoFixedRestWorkoutLeaks(draft: PlanPresetDraft, fixedRestDays: string[]) {
  const fixedRestDaySet = new Set(fixedRestDays);
  const leaks = draft.canonicalPlan.planned_workouts.filter(
    (workout) => workout.workout_type !== "rest" && fixedRestDaySet.has(workout.weekday),
  );

  assert.deepEqual(leaks, []);
}

export function assertLongRunDayPreserved(draft: PlanPresetDraft, weekday: string) {
  const longRunWeekdays = new Set(
    draft.canonicalPlan.planned_workouts
      .filter((workout) => workout.workout_type === "long_run")
      .map((workout) => workout.weekday),
  );

  assert.deepEqual([...longRunWeekdays], [weekday]);
}

export function assertPostLongRunNextRunRecoveryOrEasy(draft: PlanPresetDraft) {
  const nonRestWorkouts = draft.canonicalPlan.planned_workouts
    .filter((workout) => workout.workout_type !== "rest")
    .sort((left, right) => left.date.localeCompare(right.date));

  for (const [index, workout] of nonRestWorkouts.entries()) {
    if (workout.workout_type !== "long_run") continue;

    const nextWorkout = nonRestWorkouts[index + 1];

    if (!nextWorkout) continue;

    assert.ok(
      nextWorkout.workout_identity === "recovery_jog" ||
        nextWorkout.workout_identity === "easy_aerobic_run",
      `Expected next running slot after ${workout.date} long run to be recovery/easy, got ${nextWorkout.workout_identity}.`,
    );
  }
}

export function assertNoFakePaceOrHrTargets(draft: PlanPresetDraft) {
  for (const workout of draft.canonicalPlan.planned_workouts) {
    if (workout.workout_type === "rest") continue;

    assert.equal(workout.metric_mode?.pace_targets_allowed, false);
    assert.equal(workout.metric_mode?.hr_targets_allowed, false);
    assert.equal(workout.metric_mode?.hr_target_source, "effort_only");

    for (const segment of workout.segments) {
      assert.equal(hasPaceTarget(segment.target), false);
      assert.equal(hasPaceTarget(segment.recovery_target), false);
      assert.equal(hasExecutableHrTarget(segment.target), false);
      assert.equal(hasExecutableHrTarget(segment.recovery_target), false);
    }
  }
}

export function assertNoExecutableHrTargets(draft: PlanPresetDraft) {
  for (const workout of draft.canonicalPlan.planned_workouts) {
    assert.equal(workout.metric_mode?.hr_targets_allowed ?? false, false);

    for (const segment of workout.segments) {
      assert.equal(hasExecutableHrTarget(segment.target), false);
      assert.equal(hasExecutableHrTarget(segment.recovery_target), false);
    }
  }
}

export function assertHasPaceTargets(draft: PlanPresetDraft) {
  assert.equal(
    draft.canonicalPlan.planned_workouts.some((workout) =>
      workout.segments.some(
        (segment) => hasPaceTarget(segment.target) || hasPaceTarget(segment.recovery_target),
      ),
    ),
    true,
  );
}

export function assertStructureOnlyRowsAreExecutable(draft: PlanPresetDraft) {
  for (const workout of draft.canonicalPlan.planned_workouts) {
    if (workout.workout_type === "rest") continue;

    assert.equal(workout.metric_mode?.executable_mode, "structure_only_executable");
    assert.equal(
      workout.segments.every((segment) => segmentHasExecutableStructure(segment)),
      true,
      `Expected executable structure in ${workout.date} ${workout.title}`,
    );
  }
}

export function assertRichNonRestRows(draft: PlanPresetDraft) {
  for (const workout of draft.canonicalPlan.planned_workouts) {
    if (workout.workout_type === "rest") continue;

    assert.ok(workout.workout_family);
    assert.ok(workout.workout_identity);
    assert.ok(workout.calendar_icon_key);
    assert.ok(workout.goal_context);
    assert.ok(workout.metric_mode);
    assert.ok(workout.segments.length > 0);
  }
}

export function assertNoSingleSegmentNonRestRows(draft: PlanPresetDraft) {
  const singleSegmentRows = draft.canonicalPlan.planned_workouts.filter(
    (workout) => workout.workout_type !== "rest" && workout.segments.length <= 1,
  );

  assert.deepEqual(singleSegmentRows, []);
}

export function draftWorkoutIdentities(draft: PlanPresetDraft) {
  return draft.canonicalPlan.planned_workouts.map(
    (workout) => workout.workout_identity ?? workout.source_workout_type ?? null,
  );
}

export function assertNoForbiddenIdentities(
  draft: PlanPresetDraft,
  forbidden: ReadonlySet<string>,
) {
  assert.deepEqual(
    draftWorkoutIdentities(draft).filter((identity) => identity && forbidden.has(identity)),
    [],
  );
}

export function assertFinalWeekIdentity(draft: PlanPresetDraft, expectedIdentity: string) {
  const finalWeek = draft.reviewShape.durationWeeks;
  const finalIdentities = draft.canonicalPlan.planned_workouts
    .filter((workout) => workout.week_number === finalWeek && workout.workout_type !== "rest")
    .map((workout) => workout.workout_identity ?? workout.source_workout_type ?? null);

  assert.ok(
    finalIdentities.includes(expectedIdentity),
    `Expected final week to include ${expectedIdentity}; got ${finalIdentities.filter(Boolean).join(", ")}.`,
  );
}

export function assertAtMostOneSpecificTouchPerWeek(
  draft: PlanPresetDraft,
  isSpecificTouch: (identity: string | null) => boolean,
  label: string,
) {
  const counts = new Map<number, number>();

  for (const workout of draft.canonicalPlan.planned_workouts) {
    if (!isSpecificTouch(workout.workout_identity ?? workout.source_workout_type ?? null)) {
      continue;
    }

    counts.set(workout.week_number, (counts.get(workout.week_number) ?? 0) + 1);
  }

  for (const [weekNumber, count] of counts) {
    assert.equal(count <= 1, true, `Expected at most one ${label} touch in week ${weekNumber}.`);
  }
}

export function assertCardProgramSummary(
  card: PlanPresetCardViewModel,
  expected: {
    durationWeeks?: number;
    startDate: string;
    estimatedEndDate?: string;
    daysPerWeek: number;
    longRunDay: string;
    programFamily: string;
  },
) {
  if (typeof expected.durationWeeks === "number") {
    assert.equal(card.durationWeeks, expected.durationWeeks);
  }

  assert.equal(card.startDate, expected.startDate);
  assert.equal(
    card.estimatedEndDate,
    expected.estimatedEndDate ?? addDaysIso(card.startDate, card.durationWeeks * 7 - 1),
  );
  assert.equal(card.daysPerWeek, expected.daysPerWeek);
  assert.equal(card.longRunDay, expected.longRunDay);
  assert.equal(card.programFamily, expected.programFamily);
  assert.ok(card.durationWeeks > 0);
  assert.ok(card.workoutMixSummary.length > 0);
  assert.ok(card.keyWorkoutTypes.length >= 3);
  assert.ok(card.metricModeSummary.length > 0);
  assert.ok(card.whyThisFits.length > 0);
  assert.ok(card.levelFitSummary.length > 0);
}

export function assertDraftProgramSummary(
  draft: PlanPresetDraft,
  expected: {
    durationWeeks?: number;
    startDate: string;
    estimatedEndDate?: string;
    daysPerWeek: number;
    longRunDay: string;
    programFamily: string;
  },
) {
  if (typeof expected.durationWeeks === "number") {
    assert.equal(draft.reviewShape.durationWeeks, expected.durationWeeks);
  }

  assert.equal(draft.reviewShape.startDate, expected.startDate);
  assert.equal(
    draft.reviewShape.estimatedEndDate,
    expected.estimatedEndDate ??
      addDaysIso(draft.reviewShape.startDate, draft.reviewShape.durationWeeks * 7 - 1),
  );
  assert.equal(draft.reviewShape.daysPerWeek, expected.daysPerWeek);
  assert.equal(draft.reviewShape.longRunDay, expected.longRunDay);
  assert.equal(draft.reviewShape.programFamily, expected.programFamily);
  assert.equal(draft.reviewShape.horizonWeeks, draft.reviewShape.durationWeeks);
  assert.equal(draft.reviewShape.rowCounts.weekCount, draft.reviewShape.durationWeeks);
  assert.equal(draft.reviewShape.rowCounts.calendarRows, draft.reviewShape.durationWeeks * 7);
  assert.equal(
    draft.reviewShape.rowCounts.nonRestRows,
    draft.reviewShape.durationWeeks * draft.reviewShape.daysPerWeek,
  );
  assert.equal(
    draft.reviewShape.rowCounts.restRows,
    draft.reviewShape.rowCounts.calendarRows - draft.reviewShape.rowCounts.nonRestRows,
  );
  assert.equal(
    draft.canonicalPlan.planned_workouts.length,
    draft.reviewShape.rowCounts.calendarRows,
  );
  assert.equal(draft.reviewShape.disabledReasonSummary, null);
  assert.equal(draft.reviewShape.customReasonSummary, null);
  assert.ok(draft.reviewShape.workoutMixSummary.length > 0);
  assert.ok(draft.reviewShape.keyWorkoutTypes.length >= 3);
  assert.ok(draft.reviewShape.metricModeSummary.length > 0);
  assert.ok(draft.reviewShape.whyThisFits.length > 0);
  assert.ok(draft.reviewShape.levelFitSummary.length > 0);
  assert.ok(draft.reviewShape.weeklyRhythmSummary.includes(`${expected.daysPerWeek} runs/week`));
  assert.ok(draft.reviewShape.weeklyRhythmSummary.includes(expected.longRunDay));
  assert.deepEqual(draft.reviewShape.restDays, draft.reviewShape.fixedRestDays);
}

export function assertAdaptiveProgramMetadata(draft: PlanPresetDraft) {
  const adaptiveProgram = draft.reviewShape.adaptiveProgram;

  assert.ok(adaptiveProgram.scenarioId.length > 0);
  assert.ok(adaptiveProgram.programBias.length > 0);
  assert.ok(adaptiveProgram.finalOutcomeRule.length > 0);
  assert.ok(adaptiveProgram.progressionConservatism.length > 0);
  assert.ok(adaptiveProgram.impactLoadAdjustment.length > 0);
  assert.ok(adaptiveProgram.longRunRampPolicy.length > 0);
  assert.ok(adaptiveProgram.cutbackFrequency.length > 0);
  assert.ok(adaptiveProgram.moderateTouchCapPerWeek <= 1);
  assert.ok(adaptiveProgram.loadAdjustmentSummary.length > 0);
  assert.ok(adaptiveProgram.loadAdjustmentSummary.includes("preset-phase-template-table.csv"));
  assert.ok(adaptiveProgram.loadAdjustmentSummary.includes("preset-weekly-archetype-table.csv"));
  assert.ok(adaptiveProgram.loadAdjustmentSummary.includes("preset-builder-io-contract.csv"));
  assert.equal(
    /\b(weight|bmi|obese|overweight|underweight|medical)\b/i.test(
      adaptiveProgram.loadAdjustmentSummary,
    ),
    false,
  );
}

export function buildTenKInput(
  overrides: Partial<PlanPresetEligibilityRequestInput> = {},
): PlanPresetEligibilityRequestInput {
  return {
    ...baseInput,
    ...overrides,
    goal: {
      goalDistance: "10k",
      goalStyle: "relaxed",
      terrainFocus: "standard",
      ...overrides.goal,
    },
    benchmark: overrides.benchmark ?? {
      fitnessLevel: "beginner",
    },
    availability: {
      runningDaysPerWeek: 3,
      fixedRestDays: ["Wednesday", "Sunday"],
      preferredLongRunDay: "Saturday",
      ...overrides.availability,
    },
  };
}

export function buildHalfMarathonInput(
  overrides: Partial<PlanPresetEligibilityRequestInput> = {},
): PlanPresetEligibilityRequestInput {
  return {
    ...baseInput,
    ...overrides,
    goal: {
      goalDistance: "half_marathon",
      goalStyle: "balanced",
      terrainFocus: "standard",
      ...overrides.goal,
    },
    benchmark: overrides.benchmark ?? {
      fitnessLevel: "running_regularly",
    },
    availability: {
      runningDaysPerWeek: 4,
      fixedRestDays: ["Wednesday", "Sunday"],
      preferredLongRunDay: "Saturday",
      ...overrides.availability,
    },
  };
}

export function buildMarathonInput(
  overrides: Partial<PlanPresetEligibilityRequestInput> = {},
): PlanPresetEligibilityRequestInput {
  return {
    ...baseInput,
    ...overrides,
    goal: {
      goalDistance: "marathon",
      goalStyle: "balanced",
      terrainFocus: "standard",
      ...overrides.goal,
    },
    benchmark: overrides.benchmark ?? {
      fitnessLevel: "performance_focused",
    },
    availability: {
      runningDaysPerWeek: 5,
      fixedRestDays: ["Wednesday", "Sunday"],
      preferredLongRunDay: "Saturday",
      ...overrides.availability,
    },
  };
}

export function findCard(
  result: ReturnType<typeof resolvePlanPresetCards>,
  cardId: "10k" | "half_marathon" | "marathon",
) {
  const card = result.cards.find((candidate) => candidate.cardId === cardId);

  assert.ok(card, `Expected ${cardId} card.`);

  return card;
}

function hasPaceTarget(target: Record<string, unknown> | undefined) {
  return Boolean(target?.pace_min_per_km_range || target?.pace_range_min_km || target?.pace);
}

function hasExecutableHrTarget(target: Record<string, unknown> | undefined) {
  return Boolean(
    (target?.hr_bpm_range || target?.hr_bpm) && target.hr_target_source === "personal_hr_zone",
  );
}

function segmentHasExecutableStructure(segment: {
  segment_type: string;
  prescription?: {
    mode: "time" | "distance" | "repeats" | "none";
    duration_min?: number;
    distance_km?: number;
    repeat_count?: number;
    children?: Array<{
      role: "warm_up" | "run" | "walk" | "work" | "recover" | "finish" | "cooldown";
      prescription: {
        mode: "time" | "distance" | "none";
        duration_min?: number;
        distance_km?: number;
      };
    }>;
  };
}) {
  if (segment.segment_type === "rest") return true;

  if (!segment.prescription) {
    return false;
  }

  if (segment.prescription.mode === "time") {
    return typeof segment.prescription.duration_min === "number";
  }

  if (segment.prescription.mode === "distance") {
    return typeof segment.prescription.distance_km === "number";
  }

  if (segment.prescription.mode === "repeats") {
    return (
      typeof segment.prescription.repeat_count === "number" &&
      Boolean(segment.prescription.children?.length) &&
      segment.prescription.children.every(
        (child) =>
          child.prescription.mode === "none" ||
          typeof child.prescription.duration_min === "number" ||
          typeof child.prescription.distance_km === "number",
      )
    );
  }

  return false;
}
