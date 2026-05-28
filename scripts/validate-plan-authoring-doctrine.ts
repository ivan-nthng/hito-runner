import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildStructuredFirstPlanAuthoringInput,
  buildStructuredFirstPlanDraftReview,
  parseStructuredFirstPlanOnboardingInput,
  type StructuredFirstPlanOnboardingRequestInput,
} from "../src/lib/structured-first-plan-onboarding";
import {
  buildExactActivePlanRefreshDraft,
  mutableWorkoutGuardsStillOpen,
  parseActivePlanRefreshDraftPayload,
  rebuildActivePlanRefreshDraftWithRichWorkoutDraft,
} from "../src/lib/active-plan-refresh-draft";
import {
  buildReviewedFirstPlanImportedSeed,
  type PersistedPlanCycleRow,
  type PersistedPlannedWorkoutRow,
} from "../src/lib/active-plan-persistence";
import {
  generateCanonicalPlanFromText,
  generateRichWorkoutDraftForCanonicalPlan,
  buildRichDraftFallbackReason,
  structuredAuthoringOpenAiSchema,
} from "../src/lib/openai-plan-authoring";
import {
  buildPlanScopedStructuredAuthoringMetadata,
  mergePlanPersistenceMetadata,
} from "../src/lib/plan-authoring-snapshot";
import { prepareImportedPlanApplyPolicy } from "../src/lib/plan-apply-policy";
import {
  buildPersistedWorkoutInsertRows,
  persistedWorkoutRowToImportedSeed,
} from "../src/lib/persisted-plan-replacement";
import {
  activePlanExportToTrainingPlanV2,
  buildActivePlanExportPayload,
  renderPlanExportMarkdown,
} from "../src/lib/plan-export";
import {
  canonicalFamilyToLegacyWorkoutType,
  resolveCanonicalWorkoutModel,
  type CalendarIconKey,
  type CanonicalWorkoutFamily,
  type CanonicalWorkoutIdentity,
} from "../src/lib/rich-workout-model";
import {
  RICH_WORKOUT_DRAFT_SCHEMA_VERSION,
  buildDeterministicRichWorkoutFallbackMetadata,
  normalizeRichWorkoutDraftToTrainingPlan,
} from "../src/lib/rich-workout-draft-authoring";
import {
  AI_FIRST_PLAN_DRAFT_SCHEMA_VERSION,
  buildAiFirstPlanDraftPrompt,
  normalizeAiFirstPlanDraftToTrainingPlan,
  type AiFirstPlanDraft,
} from "../src/lib/ai-first-plan-draft-authoring";
import {
  AI_FIRST_PLAN_BLUEPRINT_SCHEMA_VERSION,
  buildAiFirstPlanBlueprintPrompt,
  normalizeAiFirstPlanBlueprintToTrainingPlan,
  type AiFirstPlanBlueprint,
} from "../src/lib/ai-first-plan-blueprint-authoring";
import { generateAiFirstPlanDraftPreview } from "../src/lib/ai-first-plan-draft-service";
import { generateStructuredFirstPlanDraftForUser } from "../src/lib/first-plan-actions";
import {
  buildActivePlanRefreshFingerprint,
  buildDeterministicActivePlanRefreshProposal,
  generateActivePlanRefreshProposal,
} from "../src/lib/plan-refresh-proposal";
import type { RunnerCoachContext } from "../src/lib/runner-coach-context";
import {
  buildStructuredAuthoringPlan,
  structuredPlanAuthoringInputSchema,
} from "../src/lib/structured-plan-authoring";
import { addDaysIso, deriveWorkoutRichModel, weekdayLong } from "../src/lib/training";
import { parseVoiceToPlanConfirmRequest } from "../src/lib/voice-to-plan-authoring";
import { serverEnv } from "../src/lib/supabase/env";
import type { WeekdayName } from "../src/lib/weekday-rest-invariants";
import {
  buildImportedPlanSeed,
  importedPlanSchema,
  type ImportedPlanSeed,
  type TrainingPlanV2,
} from "../src/lib/imported-plan";

type SegmentRecord = Record<string, unknown>;

const fixedRestDays = ["Wednesday", "Sunday"] as const;

function buildRequest(
  goalDistance: StructuredFirstPlanOnboardingRequestInput["goal"]["goalDistance"],
  overrides: Partial<StructuredFirstPlanOnboardingRequestInput> = {},
): StructuredFirstPlanOnboardingRequestInput {
  return {
    profile: { age: 34, weightKg: 72, heightCm: 178 },
    benchmark: { kind: "recent_5k_time", recent5kTime: "24:00" },
    availability: {
      runningDaysPerWeek: 5,
      fixedRestDays: [...fixedRestDays],
      preferredLongRunDay: "Saturday",
    },
    goal: {
      goalDistance,
      goalStyle: "balanced",
      terrainFocus: goalDistance === "mountain_running" ? "mountain" : "standard",
      targetTime: null,
      targetDate: null,
    },
    strength: { preference: "mobility" },
    execution: { watchAccess: "watch_or_app", guidancePreference: "pace" },
    comment: null,
    ...overrides,
  };
}

function buildPlan(input: StructuredFirstPlanOnboardingRequestInput) {
  const parsedInput = parseStructuredFirstPlanOnboardingInput(input);
  const authoringInput = buildStructuredFirstPlanAuthoringInput(parsedInput);

  return {
    input: parsedInput,
    authoringInput,
    plan: buildStructuredAuthoringPlan(authoringInput),
  };
}

function buildPlanWithNoAge(input: StructuredFirstPlanOnboardingRequestInput) {
  const { authoringInput } = buildPlan(input);

  return buildStructuredAuthoringPlan({
    ...authoringInput,
    runnerProfile: {
      ...authoringInput.runnerProfile,
      age: null,
    },
  });
}

function buildPlanWithHorizon(
  goalDistance: StructuredFirstPlanOnboardingRequestInput["goal"]["goalDistance"],
  horizonWeeks: number,
) {
  const authoringInput = buildStructuredFirstPlanAuthoringInput(buildRequest(goalDistance));

  return buildStructuredAuthoringPlan({
    ...authoringInput,
    schedule: {
      ...authoringInput.schedule,
      targetDate: null,
      preparationHorizonWeeks: horizonWeeks,
    },
  });
}

function nonRestWorkouts(plan: TrainingPlanV2) {
  return plan.planned_workouts.filter((workout) => workout.workout_type !== "rest");
}

function planWithoutGeneratedTimestamp(plan: TrainingPlanV2) {
  const { created_at: _createdAt, ...stablePlan } = plan;

  return stablePlan;
}

function longRunDistances(plan: TrainingPlanV2) {
  return plan.planned_workouts
    .filter((workout) => workout.workout_type === "long_run")
    .map((workout) => ({
      week: workout.week_number,
      phase: workout.phase,
      title: workout.title,
      km: Number(
        workout.segments
          .reduce((sum, segment) => {
            const record = segment as SegmentRecord;
            const prescription = record.prescription as Record<string, unknown> | undefined;
            const distance =
              typeof record.distance_km === "number"
                ? record.distance_km
                : typeof prescription?.distance_km === "number"
                  ? prescription.distance_km
                  : 0;

            return sum + distance;
          }, 0)
          .toFixed(1),
      ),
    }));
}

function allSegments(plan: TrainingPlanV2): SegmentRecord[] {
  return plan.planned_workouts.flatMap((workout) => workout.segments as SegmentRecord[]);
}

function hasTargetKey(plan: TrainingPlanV2, key: string) {
  return allSegments(plan).some((segment) => {
    const target = segment.target as Record<string, unknown> | undefined;
    const recoveryTarget = segment.recovery_target as Record<string, unknown> | undefined;

    return Boolean(target?.[key] || recoveryTarget?.[key]);
  });
}

function hrTargetRecords(plan: TrainingPlanV2) {
  return allSegments(plan).flatMap((segment) => {
    const targets = [segment.target, segment.recovery_target] as Array<
      Record<string, unknown> | undefined
    >;

    return targets.filter(
      (target): target is Record<string, unknown> =>
        typeof target?.hr_bpm_range === "string" || typeof target?.hr_bpm === "string",
    );
  });
}

function assertDefaultEstimatedHrGuidance(plan: TrainingPlanV2, label: string) {
  const hrTargets = hrTargetRecords(plan);

  assert.ok(hrTargets.length > 0, `${label}: expected default estimated HR guidance`);

  for (const target of hrTargets) {
    assert.equal(
      target.hr_target_source,
      "default_estimated_hr",
      `${label}: HR target should identify default estimated source`,
    );
    assert.equal(target.label, "Default HR guidance", `${label}: HR label should be bounded`);
    assert.equal(
      target.source_note,
      "Estimated from age, not personalized zones.",
      `${label}: HR source note should avoid personalization claims`,
    );
  }

  const hrMetricModes = plan.planned_workouts
    .map((workout) => workout.metric_mode)
    .filter((metricMode) => metricMode?.hr_targets_allowed);

  assert.ok(hrMetricModes.length > 0, `${label}: metric_mode should expose HR-enabled workouts`);

  for (const metricMode of hrMetricModes) {
    assert.equal(
      metricMode?.hr_target_source,
      "default_estimated_hr",
      `${label}: metric_mode should expose default estimated HR source`,
    );
  }
}

function assertEffortOnlyHrGuidance(plan: TrainingPlanV2, label: string) {
  assert.equal(hasTargetKey(plan, "hr_bpm_range"), false, `${label}: should not emit HR ranges`);
  assert.equal(hasTargetKey(plan, "hr_bpm"), false, `${label}: should not emit HR values`);

  for (const workout of plan.planned_workouts) {
    assert.equal(
      workout.metric_mode?.hr_targets_allowed,
      false,
      `${label}: metric_mode should keep HR disabled when no age or personal zones exist`,
    );
    assert.equal(
      workout.metric_mode?.hr_target_source,
      "effort_only",
      `${label}: metric_mode should identify effort-only HR policy`,
    );
  }
}

function targetHasHr(target: Record<string, unknown> | undefined) {
  return typeof target?.hr_bpm_range === "string" || typeof target?.hr_bpm === "string";
}

function assertNoHrOnMainTargetsForIdentities(
  plan: TrainingPlanV2,
  identities: string[],
  label: string,
) {
  const identitySet = new Set(identities);
  const offenders = nonRestWorkouts(plan).flatMap((workout) => {
    if (!identitySet.has(workout.source_workout_type ?? "")) {
      return [];
    }

    return (workout.segments as SegmentRecord[])
      .filter((segment) =>
        ["main", "tempo_block", "interval_block", "strides"].includes(
          String(segment.segment_type ?? ""),
        ),
      )
      .filter((segment) => targetHasHr(segment.target as Record<string, unknown> | undefined))
      .map((segment) => `${workout.workout_id}:${workout.source_workout_type}:${segment.label}`);
  });

  assert.deepEqual(
    offenders,
    [],
    `${label}: interval/hill/trail work targets should not carry misleading HR ranges`,
  );
}

function targetKeys(segment: SegmentRecord) {
  const target = segment.target as Record<string, unknown> | undefined;

  return target ? Object.keys(target).filter((key) => target[key] != null) : [];
}

function workoutDurationMin(workout: TrainingPlanV2["planned_workouts"][number]) {
  return (workout.segments as SegmentRecord[]).reduce((sum, segment) => {
    const prescription = segment.prescription as Record<string, unknown> | undefined;
    const duration =
      typeof segment.duration_min === "number"
        ? segment.duration_min
        : typeof prescription?.duration_min === "number"
          ? prescription.duration_min
          : 0;

    return sum + duration;
  }, 0);
}

function supportWorkoutSample(plan: TrainingPlanV2, sourceWorkoutType: string) {
  return plan.planned_workouts.find((workout) => workout.source_workout_type === sourceWorkoutType);
}

function assertSupportRunRichness(plan: TrainingPlanV2, label: string) {
  for (const sourceWorkoutType of ["easy_aerobic_run", "steady_aerobic_run", "long_aerobic_run"]) {
    const workout = supportWorkoutSample(plan, sourceWorkoutType);

    assert.ok(workout, `${label}: expected ${sourceWorkoutType} support workout`);
    assert.ok(
      workout.segments.length > 1,
      `${label}: ${sourceWorkoutType} should have opener/main/finish structure`,
    );

    for (const segment of workout.segments as SegmentRecord[]) {
      assert.ok(
        typeof segment.guidance === "string" && segment.guidance.trim().length > 0,
        `${label}: ${sourceWorkoutType} segment should include guidance`,
      );
      assert.ok(
        targetKeys(segment).includes("cue") ||
          targetKeys(segment).includes("hint") ||
          targetKeys(segment).includes("intensity"),
        `${label}: ${sourceWorkoutType} segment should include target cue, hint, or intensity`,
      );
    }
  }
}

function assertSubstantialWorkoutIdentitiesAreStructured({
  plan,
  label,
  sourceWorkoutTypes,
  minimumDurationMin,
  expectedText,
}: {
  plan: TrainingPlanV2;
  label: string;
  sourceWorkoutTypes: string[];
  minimumDurationMin: number;
  expectedText: RegExp[];
}) {
  const matchingWorkouts = plan.planned_workouts.filter(
    (workout) =>
      sourceWorkoutTypes.includes(workout.source_workout_type ?? "") &&
      workoutDurationMin(workout) >= minimumDurationMin,
  );

  assert.ok(
    matchingWorkouts.length > 0,
    `${label}: expected at least one substantial ${sourceWorkoutTypes.join(", ")} workout`,
  );

  const singleSegmentWorkouts = matchingWorkouts.map((workout) => {
    if (workout.segments.length > 1) return null;

    return `${workout.date}:${workout.source_workout_type}:${workoutDurationMin(workout)}min`;
  });

  assert.deepEqual(
    singleSegmentWorkouts.filter(Boolean),
    [],
    `${label}: substantial terrain/endurance workouts should not persist as one block`,
  );

  for (const workout of matchingWorkouts) {
    for (const segment of workout.segments as SegmentRecord[]) {
      assert.ok(
        typeof segment.guidance === "string" && segment.guidance.trim().length > 0,
        `${label}: ${workout.source_workout_type} segment should include runner guidance`,
      );
      assert.ok(
        targetKeys(segment).includes("cue") ||
          targetKeys(segment).includes("hint") ||
          targetKeys(segment).includes("intensity"),
        `${label}: ${workout.source_workout_type} segment should include target cue, hint, or intensity`,
      );
    }
  }

  const text = JSON.stringify(matchingWorkouts);

  for (const pattern of expectedText) {
    assert.match(text, pattern, `${label}: expected meaningful terrain/endurance guidance`);
  }
}

function assertNoSingleSegmentNonRestRows(
  rows: ReturnType<typeof buildPersistedWorkoutInsertRows>,
  label: string,
) {
  const singleSegmentRows = rows
    .filter(
      (row) => row.workout_type !== "rest" && ((row.steps as SegmentRecord[]) ?? []).length <= 1,
    )
    .map((row) => `${row.workout_date}:${row.workout_identity ?? row.source_workout_type}`);

  assert.deepEqual(
    singleSegmentRows,
    [],
    `${label}: saved non-rest workouts should not be anonymous one-block rows`,
  );
}

function assertStructuredCreatePersistsRichWorkoutTruth(
  input: StructuredFirstPlanOnboardingRequestInput,
  label: string,
) {
  const { plan } = buildPlan(input);
  const preparedApply = prepareImportedPlanApplyPolicy(
    plan,
    { workouts: [], logsByWorkoutId: new Map() },
    null,
    null,
    plan.start_date,
    null,
  );
  const rows = buildPersistedWorkoutInsertRows(
    "00000000-0000-4000-8000-000000000950",
    "00000000-0000-4000-8000-000000000951",
    preparedApply.importedSeed.workouts,
  );
  const missingRichRows = rows
    .filter(
      (row) =>
        !row.workout_family ||
        !row.workout_identity ||
        !row.calendar_icon_key ||
        !row.goal_context ||
        !row.metric_mode,
    )
    .map((row) => `${row.workout_date}:${row.title}`);

  assert.deepEqual(missingRichRows, [], `${label}: saved rows should persist rich workout fields`);
  assertNoSingleSegmentNonRestRows(rows, label);
  assertRichWorkoutContract(plan, label);
  assertFixedRestDays(plan);

  return { plan, rows };
}

function assertFixedRestDays(plan: TrainingPlanV2) {
  const violations = nonRestWorkouts(plan).filter((workout) =>
    fixedRestDays.includes(workout.weekday as (typeof fixedRestDays)[number]),
  );

  assert.equal(violations.length, 0, "fixed rest days must not contain non-rest workouts");
}

function assertLongRunDoctrine(plan: TrainingPlanV2, minPeakKm: number) {
  const longRuns = longRunDistances(plan);
  const peak = Math.max(...longRuns.map((entry) => entry.km));
  const first = longRuns[0]!;
  const last = longRuns.at(-1)!;

  assert.ok(peak >= minPeakKm, `long-run peak ${peak}km should reach at least ${minPeakKm}km`);
  assert.ok(peak > first.km + 3, "long runs should progress beyond the opening long run");

  assertWeekFourCutback(plan, "long-run doctrine");

  assert.ok(last.km <= peak * 0.75, "final taper long run should be materially below peak");
  assertNoTaperPeakLongRun(plan);
}

function assertWeekFourCutback(plan: TrainingPlanV2, label: string) {
  const longRuns = longRunDistances(plan);
  const week3 = longRuns.find((entry) => entry.week === 3);
  const week4 = longRuns.find((entry) => entry.week === 4);
  const week5 = longRuns.find((entry) => entry.week === 5);

  assert.ok(week3 && week4 && week5, `${label}: fixture should include weeks 3/4/5`);
  assert.ok(
    week4.km < week3.km,
    `${label}: week 4 cutback ${week4.km}km should reduce from week 3 ${week3.km}km`,
  );
  assert.ok(
    week4.km < week5.km,
    `${label}: week 4 cutback ${week4.km}km should be lower than week 5 rebuild ${week5.km}km`,
  );
}

function assertNoTaperPeakLongRun(plan: TrainingPlanV2) {
  const longRuns = longRunDistances(plan);
  const taperLongRuns = longRuns.filter((entry) => entry.phase === "Taper");

  if (taperLongRuns.length === 0) {
    return;
  }

  const peak = Math.max(...longRuns.map((entry) => entry.km));
  const firstTaperWeek = Math.min(...taperLongRuns.map((entry) => entry.week));
  const peakRuns = longRuns.filter((entry) => entry.km === peak);

  assert.ok(
    peakRuns.every((entry) => entry.phase !== "Taper" && entry.week < firstTaperWeek),
    `peak long run ${peak}km must occur before taper, not inside a Taper phase week`,
  );

  for (const taperRun of taperLongRuns) {
    assert.ok(
      taperRun.km < peak,
      `Taper week ${taperRun.week} long run ${taperRun.km}km must be below peak ${peak}km`,
    );
  }
}

function assertTaperReducesLongRun(plan: TrainingPlanV2) {
  const longRuns = longRunDistances(plan);
  const firstTaperWeek = longRuns.find((entry) => entry.phase === "Taper")?.week;

  assert.ok(firstTaperWeek, "plan should include a taper long run");

  const preTaperPeak = Math.max(
    ...longRuns.filter((entry) => entry.week < firstTaperWeek).map((entry) => entry.km),
  );
  const taperPeak = Math.max(
    ...longRuns.filter((entry) => entry.week >= firstTaperWeek).map((entry) => entry.km),
  );
  const finalLongRun = longRuns.at(-1)!;

  assert.ok(
    taperPeak <= preTaperPeak * 0.92,
    `taper long-run peak ${taperPeak}km should reduce from pre-taper peak ${preTaperPeak}km`,
  );
  assert.ok(
    finalLongRun.km <= preTaperPeak * 0.75,
    `final taper long run ${finalLongRun.km}km should be meaningfully below pre-taper peak ${preTaperPeak}km`,
  );
}

function structuredReviewAssumptions(input: StructuredFirstPlanOnboardingRequestInput) {
  const { input: parsedInput, authoringInput, plan } = buildPlan(input);

  return buildStructuredFirstPlanDraftReview(parsedInput, plan, authoringInput).assumptions;
}

function hasLongDistanceHonesty(assumptions: string[]) {
  return assumptions.some((assumption) =>
    /finish-oriented|durability-limited|longer horizon|more running days|race-specific durability|conservative/i.test(
      assumption,
    ),
  );
}

function assertLongDistanceHonesty(
  input: StructuredFirstPlanOnboardingRequestInput,
  message: string,
) {
  assert.ok(hasLongDistanceHonesty(structuredReviewAssumptions(input)), message);
}

function assertNoLongDistanceHonesty(
  input: StructuredFirstPlanOnboardingRequestInput,
  message: string,
) {
  assert.equal(hasLongDistanceHonesty(structuredReviewAssumptions(input)), false, message);
}

function assertPhaseSpecificity(plan: TrainingPlanV2) {
  const identitiesByPhase = new Map<string, Set<string>>();

  for (const workout of nonRestWorkouts(plan)) {
    const identities = identitiesByPhase.get(workout.phase) ?? new Set<string>();
    identities.add(workout.source_workout_type ?? workout.workout_type);
    identitiesByPhase.set(workout.phase, identities);
  }

  assert.ok(identitiesByPhase.has("Base"), "plan should include Base phase");
  assert.ok(identitiesByPhase.has("Build"), "plan should include Build phase");
  assert.ok(identitiesByPhase.has("Specific"), "plan should include Specific phase");
  assert.ok(identitiesByPhase.has("Taper"), "plan should include Taper phase");
  assert.ok(
    identitiesByPhase.get("Specific")?.has("progression_run") ||
      identitiesByPhase.get("Specific")?.has("uphill_repeats") ||
      identitiesByPhase.get("Specific")?.has("climbing_steady_run") ||
      identitiesByPhase.get("Specific")?.has("marathon_steady_specificity"),
    "Specific phase should affect workout selection",
  );
  assert.ok(
    identitiesByPhase.get("Taper")?.has("taper_tuneup_run"),
    "Taper phase should include a taper tune-up identity",
  );
}

function sourceWorkoutTypes(plan: TrainingPlanV2) {
  return new Set(
    nonRestWorkouts(plan).map((workout) => workout.source_workout_type ?? workout.workout_type),
  );
}

function sourceWorkoutTypesByPhase(plan: TrainingPlanV2) {
  const identitiesByPhase = new Map<string, Set<string>>();

  for (const workout of nonRestWorkouts(plan)) {
    const identities = identitiesByPhase.get(workout.phase) ?? new Set<string>();
    identities.add(workout.source_workout_type ?? workout.workout_type);
    identitiesByPhase.set(workout.phase, identities);
  }

  return identitiesByPhase;
}

function assertRoadPerformanceQualityCadence(plan: TrainingPlanV2, label: string) {
  const qualityIdentities = new Set([
    "time_intervals",
    "distance_intervals",
    "5k_sharpening_repeats",
    "10k_rhythm_intervals",
    "controlled_tempo_session",
    "half_marathon_threshold_durability",
    "race_pace_session",
    "taper_tuneup_run",
  ]);
  const qualityWeeks = new Set(
    nonRestWorkouts(plan)
      .filter((workout) =>
        qualityIdentities.has(workout.source_workout_type ?? workout.workout_identity ?? ""),
      )
      .map((workout) => workout.week_number),
  );
  const weekNumbers = Array.from(
    new Set(plan.planned_workouts.map((workout) => workout.week_number)),
  ).sort((left, right) => left - right);

  for (let index = 0; index < weekNumbers.length; index += 2) {
    const week = weekNumbers[index]!;
    const nextWeek = weekNumbers[index + 1];

    assert.ok(
      qualityWeeks.has(week) || (nextWeek != null && qualityWeeks.has(nextWeek)),
      `${label}: road performance quality should appear at least every 1-2 weeks`,
    );
  }
}

function assertRichWorkoutContract(plan: TrainingPlanV2, label: string) {
  for (const workout of plan.planned_workouts) {
    assert.ok(workout.workout_family, `${label}: workout_family should be present`);
    assert.ok(workout.workout_identity, `${label}: workout_identity should be present`);
    assert.ok(workout.calendar_icon_key, `${label}: calendar_icon_key should be present`);
    assert.ok(workout.metric_mode, `${label}: metric_mode should be present`);

    const resolved = resolveCanonicalWorkoutModel({
      workoutType: workout.workout_type,
      sourceWorkoutType: workout.source_workout_type ?? null,
      workoutFamily: workout.workout_family,
      workoutIdentity: workout.workout_identity,
      calendarIconKey: workout.calendar_icon_key,
      metricMode: workout.metric_mode,
      title: workout.title,
      steps: workout.segments as SegmentRecord[],
    });

    assert.equal(
      workout.workout_family,
      resolved.workoutFamily,
      `${label}: workout_family should match backend compatibility mapping`,
    );
    assert.equal(
      workout.workout_identity,
      resolved.workoutIdentity,
      `${label}: workout_identity should match backend compatibility mapping`,
    );
    assert.equal(
      workout.calendar_icon_key,
      resolved.calendarIconKey,
      `${label}: calendar_icon_key should match backend compatibility mapping`,
    );
    if (hasTargetKey({ ...plan, planned_workouts: [workout] }, "pace_min_per_km_range")) {
      assert.equal(
        workout.metric_mode.pace_targets_allowed,
        true,
        `${label}: emitted pace targets require pace-enabled metric mode`,
      );
    }
    if (hasTargetKey({ ...plan, planned_workouts: [workout] }, "hr_bpm_range")) {
      assert.equal(
        workout.metric_mode.hr_targets_allowed,
        true,
        `${label}: emitted HR targets require HR-enabled metric mode`,
      );
    }
  }
}

function assertRichAiDraftNormalizer() {
  const paceEnabledPlan = buildPlan(buildRequest("10k")).plan;
  const defaultEstimatedHrPlan = buildPlan(
    buildRequest("half_marathon", {
      benchmark: { kind: "unknown" },
      goal: {
        goalDistance: "half_marathon",
        goalStyle: "target_time",
        terrainFocus: "standard",
        targetTime: "2:00:00",
        targetDate: "2026-08-30",
      },
      execution: { watchAccess: "watch_or_app", guidancePreference: "mixed" },
    }),
  ).plan;
  const noAgeEffortOnlyPlan = buildPlanWithNoAge(
    buildRequest("half_marathon", {
      benchmark: { kind: "unknown" },
      goal: {
        goalDistance: "half_marathon",
        goalStyle: "target_time",
        terrainFocus: "standard",
        targetTime: "2:00:00",
        targetDate: "2026-08-30",
      },
      execution: { watchAccess: "watch_or_app", guidancePreference: "mixed" },
    }),
  );

  const normalizedValid = normalizeRichWorkoutDraftToTrainingPlan({
    canonicalPlan: paceEnabledPlan,
    draft: buildAiLikeRichWorkoutDraft(paceEnabledPlan),
  });

  assert.equal(normalizedValid.ok, true, "valid AI-like rich draft should normalize");

  if (normalizedValid.ok) {
    assert.equal(
      normalizedValid.metadata.status,
      "rich_draft_applied",
      "valid rich draft should report applied metadata",
    );
    assertRichWorkoutContract(normalizedValid.canonicalPlan, "normalized AI-like rich draft");

    for (const workout of nonRestWorkouts(normalizedValid.canonicalPlan)) {
      const segmentTypes = workout.segments.map((segment) => segment.segment_type);
      assert.ok(
        segmentTypes.includes("warmup"),
        "normalized non-rest rich draft should include warmup",
      );
      assert.ok(
        segmentTypes.some((segmentType) =>
          ["main", "tempo_block", "interval_block", "strides"].includes(segmentType),
        ),
        "normalized non-rest rich draft should include main-equivalent work",
      );
      assert.ok(
        segmentTypes.includes("cooldown"),
        "normalized non-rest rich draft should include cooldown",
      );
    }
  }

  const fakeHrNormalized = normalizeRichWorkoutDraftToTrainingPlan({
    canonicalPlan: noAgeEffortOnlyPlan,
    draft: buildAiLikeRichWorkoutDraft(noAgeEffortOnlyPlan, { includeFakeHr: true }),
  });

  assert.equal(
    fakeHrNormalized.ok,
    true,
    "fake HR draft should strip unsafe HR instead of failing",
  );

  if (fakeHrNormalized.ok) {
    assertEffortOnlyHrGuidance(
      fakeHrNormalized.canonicalPlan,
      "AI rich draft normalization without age",
    );
    assert.equal(
      hasTargetKey(fakeHrNormalized.canonicalPlan, "pace_min_per_km_range"),
      false,
      "AI rich draft normalization must not invent pace targets without benchmark support",
    );
  }

  const fakeHrWithDefaultNormalized = normalizeRichWorkoutDraftToTrainingPlan({
    canonicalPlan: defaultEstimatedHrPlan,
    draft: buildAiLikeRichWorkoutDraft(defaultEstimatedHrPlan, { includeFakeHr: true }),
  });

  assert.equal(
    fakeHrWithDefaultNormalized.ok,
    true,
    "fake HR draft with age should normalize through backend default HR policy",
  );

  if (fakeHrWithDefaultNormalized.ok) {
    assertDefaultEstimatedHrGuidance(
      fakeHrWithDefaultNormalized.canonicalPlan,
      "AI rich draft normalization with default estimated HR",
    );
    assert.equal(
      JSON.stringify(fakeHrWithDefaultNormalized.canonicalPlan).includes("150-160"),
      false,
      "AI rich draft normalization must not preserve unsupported AI-supplied HR ranges",
    );
  }

  const malformedDraft = buildAiLikeRichWorkoutDraft(defaultEstimatedHrPlan);
  const firstRunningWorkout = malformedDraft.workouts.find(
    (workout) => workout.workoutFamily !== "rest",
  );

  assert.ok(firstRunningWorkout, "malformed rich draft fixture needs one running workout");
  firstRunningWorkout!.segments = firstRunningWorkout!.segments.filter(
    (segment) => segment.segmentType === "main",
  );

  const malformedResult = normalizeRichWorkoutDraftToTrainingPlan({
    canonicalPlan: defaultEstimatedHrPlan,
    draft: malformedDraft,
  });

  assert.equal(
    malformedResult.ok,
    false,
    "single-segment non-rest rich draft should fail normalization and trigger fallback",
  );

  if (!malformedResult.ok) {
    assert.equal(
      malformedResult.fallback.status,
      "deterministic_fallback",
      "malformed rich draft should expose deterministic fallback metadata",
    );
    assert.ok(
      malformedResult.fallback.reviewAssumptions.some((assumption) =>
        /deterministic structured generator/i.test(assumption),
      ),
      "malformed rich draft fallback should be detectable in assumptions",
    );
  }
}

async function assertTextAuthoringRichDraftOptInContract() {
  const { authoringInput } = buildPlan(buildRequest("10k"));
  const deterministicPlan = buildStructuredAuthoringPlan(authoringInput);
  const originalFetch = globalThis.fetch;
  const originalOpenAiApiKey = serverEnv.openAiApiKey;
  const originalOpenAiPlanModel = serverEnv.openAiPlanModel;
  let richDraftMode: "valid" | "malformed" = "valid";
  let requestedSchemas: string[] = [];

  serverEnv.openAiApiKey = "test-openai-key";
  serverEnv.openAiPlanModel = "test-openai-model";
  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body ?? "{}")) as {
      text?: { format?: { name?: string } };
    };
    const schemaName = body.text?.format?.name ?? "unknown";
    requestedSchemas.push(schemaName);

    if (schemaName === "structured_plan_authoring_input") {
      return openAiFixtureResponse(`structured-${requestedSchemas.length}`, authoringInput);
    }

    if (schemaName === "rich_workout_draft") {
      const draft = buildAiLikeRichWorkoutDraft(deterministicPlan);

      if (richDraftMode === "malformed") {
        const firstRunningWorkout = draft.workouts.find(
          (workout) => workout.workoutFamily !== "rest",
        );

        assert.ok(firstRunningWorkout, "rich draft opt-in fixture needs one running workout");
        firstRunningWorkout!.segments = firstRunningWorkout!.segments.filter(
          (segment) => segment.segmentType === "main",
        );
      }

      return openAiFixtureResponse(`rich-${requestedSchemas.length}`, draft);
    }

    return new Response(
      JSON.stringify({
        error: { message: `Unexpected schema request: ${schemaName}` },
      }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }) as typeof fetch;

  try {
    const defaultResult = await generateCanonicalPlanFromText(
      "Create a 10K plan with normal structure.",
    );

    assert.deepEqual(
      requestedSchemas,
      ["structured_plan_authoring_input"],
      "generateCanonicalPlanFromText should not request rich drafts by default",
    );
    assert.equal(
      defaultResult.richDraftMetadata.status,
      "not_requested",
      "default text authoring helper result should report rich draft as not requested",
    );
    assert.deepEqual(
      planWithoutGeneratedTimestamp(defaultResult.canonicalPlan),
      planWithoutGeneratedTimestamp(deterministicPlan),
      "default text authoring helper result should remain deterministic",
    );

    requestedSchemas = [];
    richDraftMode = "valid";
    const richResult = await generateCanonicalPlanFromText(
      "Create a 10K plan with rich workout structure.",
      { enableRichWorkoutDraft: true },
    );

    assert.deepEqual(
      requestedSchemas,
      ["structured_plan_authoring_input", "rich_workout_draft"],
      "opted-in text authoring should request the rich workout draft schema",
    );
    assert.equal(
      richResult.richDraftMetadata.status,
      "rich_draft_applied",
      "valid opted-in rich draft should be applied",
    );
    assert.ok(
      richResult.canonicalPlan.planned_workouts.some((workout) =>
        /^Coach-shaped /.test(workout.title),
      ),
      "opted-in rich draft should affect normalized canonical workout structure",
    );

    requestedSchemas = [];
    richDraftMode = "malformed";
    const fallbackResult = await generateCanonicalPlanFromText(
      "Create a 10K plan with malformed rich workout structure.",
      { enableRichWorkoutDraft: true },
    );

    assert.deepEqual(
      requestedSchemas,
      ["structured_plan_authoring_input", "rich_workout_draft"],
      "malformed opted-in text authoring should still request the rich draft schema",
    );
    assert.equal(
      fallbackResult.richDraftMetadata.status,
      "deterministic_fallback",
      "malformed opted-in rich draft should fall back detectably",
    );
    assert.deepEqual(
      planWithoutGeneratedTimestamp(fallbackResult.canonicalPlan),
      planWithoutGeneratedTimestamp(deterministicPlan),
      "malformed opted-in rich draft should keep deterministic canonical plan truth",
    );
  } finally {
    globalThis.fetch = originalFetch;
    serverEnv.openAiApiKey = originalOpenAiApiKey;
    serverEnv.openAiPlanModel = originalOpenAiPlanModel;
  }
}

function assertActivePlanRefreshRichDraftContract() {
  const context = buildRefreshFixtureContext();
  const currentPlan = buildRefreshFixturePlanRow(context);
  const existingWorkouts = {
    workouts: context.remainingActiveSchedule.map((workout, index) =>
      buildRefreshFixtureWorkoutRow(context, workout, index),
    ),
    logsByWorkoutId: new Map(),
  };
  const proposalOutput = {
    applyContext: { generatedAt: context.generatedAt },
    review: {
      summary:
        "Refresh the remaining marathon block with richer workout structure while keeping protected history fixed.",
      proposedChanges: [
        "Improve future mutable workouts with richer warmup, main, and cooldown guidance.",
      ],
    },
    recommendedAuthoringPrompt:
      "Refresh this as a marathon plan with credible long-run progression, fixed rest days, and no fake HR or pace targets.",
  };
  const deterministicDraft = buildExactActivePlanRefreshDraft({
    context,
    currentPlan,
    existingWorkouts,
    proposalOutput,
    fingerprint: buildActivePlanRefreshFingerprint(context),
    weekdayRestInvariant: context.weekdayRestInvariant,
    evidenceSets: { loggedWorkoutIds: new Set(), evidenceWorkoutIds: new Set() },
  });

  assert.equal(
    deterministicDraft.richWorkoutDraftMetadata.status,
    "not_requested",
    "deterministic refresh draft should report rich draft as not requested by default",
  );

  const normalizedRichDraft = normalizeRichWorkoutDraftToTrainingPlan({
    canonicalPlan: deterministicDraft.canonicalPlan,
    draft: buildAiLikeRichWorkoutDraft(deterministicDraft.canonicalPlan),
  });

  assert.equal(
    normalizedRichDraft.ok,
    true,
    "refresh rich draft fixture should normalize against the deterministic refreshed schedule",
  );

  if (normalizedRichDraft.ok) {
    const richRefreshDraft = rebuildActivePlanRefreshDraftWithRichWorkoutDraft({
      draft: deterministicDraft,
      canonicalPlan: normalizedRichDraft.canonicalPlan,
      metadata: normalizedRichDraft.metadata,
    });
    const parsedRichDraft = parseActivePlanRefreshDraftPayload(richRefreshDraft);

    assert.equal(parsedRichDraft.ok, true, "rich refresh draft checksum should verify");
    assert.equal(
      richRefreshDraft.richWorkoutDraftMetadata.status,
      "rich_draft_applied",
      "valid refresh rich draft should expose applied metadata",
    );
    assert.ok(
      richRefreshDraft.canonicalPlan.planned_workouts.some((workout) =>
        /^Coach-shaped /.test(workout.title),
      ),
      "refresh rich draft should persist the normalized rich canonical plan into the reviewed draft",
    );
    assertRichWorkoutContract(richRefreshDraft.canonicalPlan, "rich active-plan refresh draft");
    assertFixedRestDays(richRefreshDraft.canonicalPlan);
    assert.equal(
      hasTargetKey(richRefreshDraft.canonicalPlan, "hr_bpm_range"),
      false,
      "refresh rich draft must not emit HR targets without HR-zone truth",
    );
    assert.equal(
      mutableWorkoutGuardsStillOpen(richRefreshDraft, {
        loggedWorkoutIds: new Set([richRefreshDraft.mutableWorkoutGuards[0]!.workoutId]),
        evidenceWorkoutIds: new Set(),
      }),
      false,
      "rich refresh draft must preserve protected mutable guard stale-blocking",
    );
  }

  const malformedDraft = buildAiLikeRichWorkoutDraft(deterministicDraft.canonicalPlan);
  const firstRunningWorkout = malformedDraft.workouts.find(
    (workout) => workout.workoutFamily !== "rest",
  );

  assert.ok(firstRunningWorkout, "refresh malformed rich draft fixture needs one running workout");
  firstRunningWorkout!.segments = firstRunningWorkout!.segments.filter(
    (segment) => segment.segmentType === "main",
  );

  const malformedResult = normalizeRichWorkoutDraftToTrainingPlan({
    canonicalPlan: deterministicDraft.canonicalPlan,
    draft: malformedDraft,
  });

  assert.equal(
    malformedResult.ok,
    false,
    "malformed refresh rich draft should fail normalization before review",
  );

  if (!malformedResult.ok) {
    const fallbackRefreshDraft = rebuildActivePlanRefreshDraftWithRichWorkoutDraft({
      draft: deterministicDraft,
      canonicalPlan: deterministicDraft.canonicalPlan,
      metadata: buildDeterministicRichWorkoutFallbackMetadata(malformedResult.reason),
    });
    const parsedFallbackDraft = parseActivePlanRefreshDraftPayload(fallbackRefreshDraft);

    assert.equal(parsedFallbackDraft.ok, true, "fallback refresh draft checksum should verify");
    assert.equal(
      fallbackRefreshDraft.richWorkoutDraftMetadata.status,
      "deterministic_fallback",
      "malformed refresh rich draft should fall back detectably",
    );
    assert.deepEqual(
      planWithoutGeneratedTimestamp(fallbackRefreshDraft.canonicalPlan),
      planWithoutGeneratedTimestamp(deterministicDraft.canonicalPlan),
      "malformed refresh rich draft fallback should keep deterministic canonical plan truth",
    );
  }
}

function assertActivePlanRefreshApplyDoesNotGenerate() {
  const source = readFileSync("src/lib/active-plan-refresh-actions.ts", "utf8");
  const applyStart = source.indexOf("export async function applyActivePlanRefreshProposalForUser");
  const applyEnd = source.indexOf("function staleActivePlanRefreshResult", applyStart);
  const applySection = source.slice(applyStart, applyEnd);

  assert.ok(applyStart >= 0 && applyEnd > applyStart, "apply function source should be readable");
  assert.doesNotMatch(
    applySection,
    /generateRichWorkoutDraftForCanonicalPlan|generateActivePlanRefreshProposal|openai-plan-authoring/,
    "active-plan refresh apply must not call OpenAI, regenerate, or reinterpret the reviewed draft",
  );
}

async function assertActivePlanRefreshTimeoutFallbackContract() {
  const context = buildRefreshFixtureContext();
  const currentPlan = buildRefreshFixturePlanRow(context);
  const existingWorkouts = {
    workouts: context.remainingActiveSchedule.map((workout, index) =>
      buildRefreshFixtureWorkoutRow(context, workout, index),
    ),
    logsByWorkoutId: new Map(),
  };
  const runnerPrompt = "Refresh the future plan with richer workouts but keep protected history.";
  const originalFetch = globalThis.fetch;
  const originalOpenAiApiKey = serverEnv.openAiApiKey;
  const originalOpenAiPlanModel = serverEnv.openAiPlanModel;

  serverEnv.openAiApiKey = "test-openai-key";
  serverEnv.openAiPlanModel = "test-openai-model";
  globalThis.fetch = ((_input: RequestInfo | URL, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      const rejectAsAbort = () => {
        const error = new Error("The mocked OpenAI request was aborted.");
        error.name = "AbortError";
        reject(error);
      };

      if (init?.signal?.aborted) {
        rejectAsAbort();
        return;
      }

      init?.signal?.addEventListener("abort", rejectAsAbort, { once: true });
    })) as typeof fetch;

  try {
    let proposalTimedOut = false;
    const proposal = await generateActivePlanRefreshProposal({
      context,
      runnerPrompt,
      timeoutMs: 5,
    }).catch((error: unknown) => {
      assert.equal(
        error instanceof Error && error.name === "AbortError",
        true,
        "mocked proposal timeout should surface as an abort",
      );
      proposalTimedOut = true;

      return buildDeterministicActivePlanRefreshProposal({
        context,
        runnerPrompt,
        fallbackReason: "refresh_proposal_timed_out",
      });
    });

    assert.equal(
      proposalTimedOut,
      true,
      "refresh proposal timeout fixture should exercise deterministic proposal fallback",
    );
    assert.equal(
      proposal.model,
      "deterministic_refresh_fallback",
      "timed-out refresh proposal should return deterministic fallback proposal metadata",
    );

    const deterministicDraft = buildExactActivePlanRefreshDraft({
      context,
      currentPlan,
      existingWorkouts,
      proposalOutput: proposal.output,
      fingerprint: proposal.output.applyContext.fingerprint,
      weekdayRestInvariant: context.weekdayRestInvariant,
      evidenceSets: { loggedWorkoutIds: new Set(), evidenceWorkoutIds: new Set() },
    });
    const proposalFallbackDraft = rebuildActivePlanRefreshDraftWithRichWorkoutDraft({
      draft: deterministicDraft,
      canonicalPlan: deterministicDraft.canonicalPlan,
      metadata: buildDeterministicRichWorkoutFallbackMetadata("refresh_proposal_timed_out"),
    });

    assert.equal(
      parseActivePlanRefreshDraftPayload(proposalFallbackDraft).ok,
      true,
      "timed-out proposal fallback refresh draft checksum should verify",
    );
    assert.equal(
      proposalFallbackDraft.richWorkoutDraftMetadata.status,
      "deterministic_fallback",
      "timed-out proposal should still return bounded rich draft fallback metadata",
    );
    assert.equal(
      proposalFallbackDraft.richWorkoutDraftMetadata.fallbackReason,
      "refresh_proposal_timed_out",
      "timed-out proposal fallback metadata should explain that the proposal step timed out",
    );

    const richTimeoutDraft = await generateRichWorkoutDraftForCanonicalPlan({
      authoringText: runnerPrompt,
      authoringInput: deterministicDraft.authoringSnapshot.authoringInput,
      deterministicPlan: deterministicDraft.canonicalPlan,
      timeoutMs: 5,
    }).catch((error: unknown) =>
      rebuildActivePlanRefreshDraftWithRichWorkoutDraft({
        draft: deterministicDraft,
        canonicalPlan: deterministicDraft.canonicalPlan,
        metadata: buildDeterministicRichWorkoutFallbackMetadata(
          buildRichDraftFallbackReason(error),
        ),
      }),
    );

    assert.equal(
      richTimeoutDraft.richWorkoutDraftMetadata.status,
      "deterministic_fallback",
      "timed-out rich draft should fall back to deterministic refresh draft metadata",
    );
    assert.equal(
      richTimeoutDraft.richWorkoutDraftMetadata.fallbackReason,
      "rich_draft_timed_out",
      "timed-out rich draft fallback metadata should use the bounded timeout reason",
    );
    assert.deepEqual(
      planWithoutGeneratedTimestamp(richTimeoutDraft.canonicalPlan),
      planWithoutGeneratedTimestamp(deterministicDraft.canonicalPlan),
      "timed-out rich draft should keep deterministic canonical refresh truth",
    );
  } finally {
    globalThis.fetch = originalFetch;
    serverEnv.openAiApiKey = originalOpenAiApiKey;
    serverEnv.openAiPlanModel = originalOpenAiPlanModel;
  }
}

function openAiFixtureResponse(responseId: string, payload: unknown) {
  return new Response(
    JSON.stringify({
      id: responseId,
      output_text: JSON.stringify(payload),
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}

function buildAiLikeRichWorkoutDraft(
  plan: TrainingPlanV2,
  options: { includeFakeHr?: boolean } = {},
) {
  return {
    schemaVersion: RICH_WORKOUT_DRAFT_SCHEMA_VERSION,
    assumptions: ["Rich draft kept Hito's deterministic rest days and metric safety gates."],
    workouts: plan.planned_workouts.map((workout) => {
      if (workout.workout_type === "rest") {
        return {
          workoutId: workout.workout_id,
          date: workout.date,
          workoutFamily: "rest",
          workoutIdentity: "rest_and_recovery",
          calendarIconKey: "rest",
          title: workout.title,
          summary: workout.summary,
          goalContext: toDraftGoalContext(workout),
          metricMode: toDraftMetricMode(workout),
          segments: [
            {
              segmentId: `${workout.workout_id}_draft_rest`,
              segmentType: "rest",
              label: "Rest",
              sequence: 1,
              prescription: emptyDraftPrescription("none"),
              guidance: "No running scheduled.",
              target: emptyDraftTarget(),
            },
          ],
        };
      }

      return {
        workoutId: workout.workout_id,
        date: workout.date,
        workoutFamily: workout.workout_family ?? "easy",
        workoutIdentity: workout.workout_identity ?? "easy_aerobic_run",
        calendarIconKey: workout.calendar_icon_key ?? "easy",
        title: `Coach-shaped ${workout.title}`,
        summary: `Richer ${workout.summary}`,
        goalContext: toDraftGoalContext(workout),
        metricMode: toDraftMetricMode(workout),
        segments: [
          buildDraftSegment(workout, "warmup", 1, "Warm up", 8, options),
          buildDraftSegment(workout, "main", 2, "Purposeful main set", 24, options),
          buildDraftSegment(workout, "cooldown", 3, "Cool down", 6, options),
        ],
      };
    }),
  };
}

function buildDraftSegment(
  workout: TrainingPlanV2["planned_workouts"][number],
  segmentType: "warmup" | "main" | "cooldown",
  sequence: number,
  label: string,
  durationMin: number,
  options: { includeFakeHr?: boolean },
) {
  return {
    segmentId: `${workout.workout_id}_draft_${sequence}`,
    segmentType,
    label,
    sequence,
    prescription: {
      mode: "time",
      durationMin,
      distanceKm: null,
      repeatCount: null,
      repeatUnit: null,
      recoveryUnit: null,
    },
    guidance: `${label} with clear effort control and no invented metrics.`,
    target: {
      ...emptyDraftTarget(),
      intensity: segmentType === "main" ? "controlled_effort" : "easy",
      cue: segmentType === "main" ? "Stay smooth and purposeful." : "Keep it relaxed.",
      hint:
        segmentType === "cooldown"
          ? "Finish able to speak comfortably."
          : "Let effort guide the segment.",
      hrBpmRange: options.includeFakeHr ? "150-160" : null,
      hrBpm: options.includeFakeHr ? "155" : null,
      paceMinPerKmRange: options.includeFakeHr ? "4:45-5:00" : null,
    },
  };
}

function toDraftGoalContext(workout: TrainingPlanV2["planned_workouts"][number]) {
  return {
    goalType: workout.goal_context?.goal_type ?? "build_consistency",
    goalStyle: workout.goal_context?.goal_style ?? null,
    terrainFocus: workout.goal_context?.terrain_focus ?? "standard",
    targetDate: workout.goal_context?.target_date ?? null,
    targetTime: workout.goal_context?.target_time ?? null,
  };
}

function toDraftMetricMode(workout: TrainingPlanV2["planned_workouts"][number]) {
  return {
    guidance: workout.metric_mode?.guidance ?? "effort",
    paceTargetsAllowed: workout.metric_mode?.pace_targets_allowed ?? false,
    hrTargetsAllowed: workout.metric_mode?.hr_targets_allowed ?? false,
    reason: workout.metric_mode?.reason ?? "Fixture metric mode mirrors deterministic truth.",
  };
}

function emptyDraftPrescription(mode: "none") {
  return {
    mode,
    durationMin: null,
    distanceKm: null,
    repeatCount: null,
    repeatUnit: null,
    recoveryUnit: null,
  };
}

function emptyDraftTarget() {
  return {
    intensity: null,
    rpe: null,
    cue: null,
    hint: null,
    paceMinPerKmRange: null,
    pace: null,
    hrBpmRange: null,
    hrBpm: null,
  };
}

function assertRichIdentityMapping(
  sourceWorkoutType: string | null,
  workoutType: TrainingPlanV2["planned_workouts"][number]["workout_type"],
  expected: {
    identity: CanonicalWorkoutIdentity;
    family: CanonicalWorkoutFamily;
    icon: CalendarIconKey;
    legacyWorkoutType?: ReturnType<typeof canonicalFamilyToLegacyWorkoutType>;
  },
) {
  const resolved = resolveCanonicalWorkoutModel({
    workoutType,
    sourceWorkoutType,
    title: sourceWorkoutType ?? workoutType,
    steps: [],
  });

  assert.equal(
    resolved.workoutIdentity,
    expected.identity,
    `${sourceWorkoutType ?? workoutType} should map to canonical workout identity`,
  );
  assert.equal(
    resolved.workoutFamily,
    expected.family,
    `${sourceWorkoutType ?? workoutType} should map to canonical workout family`,
  );
  assert.equal(
    resolved.calendarIconKey,
    expected.icon,
    `${sourceWorkoutType ?? workoutType} should map to canonical calendar icon`,
  );
  assert.equal(
    canonicalFamilyToLegacyWorkoutType(resolved.workoutFamily, resolved.workoutIdentity),
    expected.legacyWorkoutType ??
      (workoutType === "tempo" ||
      workoutType === "intervals" ||
      workoutType === "progression" ||
      workoutType === "race" ||
      workoutType === "quality"
        ? "quality"
        : workoutType === "recovery"
          ? "easy"
          : workoutType),
    `${sourceWorkoutType ?? workoutType} should map back to the expected legacy workout type`,
  );
}

function assertLegacyCompactOnlyInference(
  title: string,
  expected: {
    identity: CanonicalWorkoutIdentity;
    family: CanonicalWorkoutFamily;
    icon: CalendarIconKey;
  },
  steps: SegmentRecord[] = [],
) {
  const resolved = resolveCanonicalWorkoutModel({
    workoutType: "quality",
    sourceWorkoutType: null,
    title,
    steps,
  });

  assert.equal(
    resolved.workoutIdentity,
    expected.identity,
    `compact-only title "${title}" should infer useful workout identity`,
  );
  assert.equal(
    resolved.workoutFamily,
    expected.family,
    `compact-only title "${title}" should infer useful workout family`,
  );
  assert.equal(
    resolved.calendarIconKey,
    expected.icon,
    `compact-only title "${title}" should infer useful calendar icon`,
  );
}

function assertRichCompatibilityMapping() {
  assertRichIdentityMapping("easy_aerobic_run", "easy", {
    identity: "easy_aerobic_run",
    family: "easy",
    icon: "easy",
  });
  assertRichIdentityMapping("steady_aerobic_run", "steady_or_easy", {
    identity: "steady_aerobic_run",
    family: "steady",
    icon: "steady",
  });
  assertRichIdentityMapping("aerobic_strides", "easy", {
    identity: "easy_run_with_strides",
    family: "easy",
    icon: "easy",
  });
  assertRichIdentityMapping("5k_sharpening_repeats", "quality", {
    identity: "5k_sharpening_repeats",
    family: "intervals",
    icon: "intervals",
  });
  assertRichIdentityMapping("10k_rhythm_intervals", "quality", {
    identity: "10k_rhythm_intervals",
    family: "intervals",
    icon: "intervals",
  });
  assertRichIdentityMapping("half_marathon_threshold_durability", "tempo", {
    identity: "half_marathon_threshold_durability",
    family: "tempo",
    icon: "tempo",
  });
  assertRichIdentityMapping("marathon_steady_specificity", "steady_or_easy", {
    identity: "marathon_steady_specificity",
    family: "steady",
    icon: "steady",
  });
  assertRichIdentityMapping("ultra_time_on_feet_durability", "steady_or_easy", {
    identity: "ultra_time_on_feet_durability",
    family: "long",
    icon: "long",
    legacyWorkoutType: "long_run",
  });
  assertRichIdentityMapping("controlled_downhill_durability", "quality", {
    identity: "controlled_downhill_durability",
    family: "hills",
    icon: "hills",
  });
  assertRichIdentityMapping("hike_run_endurance", "steady_or_easy", {
    identity: "hike_run_endurance",
    family: "trail",
    icon: "trail",
    legacyWorkoutType: "long_run",
  });
  assertRichIdentityMapping("mountain_long_run_time_on_feet", "long_run", {
    identity: "mountain_long_run_time_on_feet",
    family: "trail",
    icon: "trail",
  });
  assertRichIdentityMapping("rest_and_recovery", "rest", {
    identity: "rest_and_recovery",
    family: "rest",
    icon: "rest",
  });
  assertRichIdentityMapping(null, "quality", {
    identity: "quality_session",
    family: "intervals",
    icon: "intervals",
  });
  assertLegacyCompactOnlyInference("Controlled tempo session", {
    identity: "controlled_tempo_session",
    family: "tempo",
    icon: "tempo",
  });
  assertLegacyCompactOnlyInference("Distance intervals", {
    identity: "distance_intervals",
    family: "intervals",
    icon: "intervals",
  });
  assertLegacyCompactOnlyInference("Time intervals", {
    identity: "time_intervals",
    family: "intervals",
    icon: "intervals",
  });
  assertLegacyCompactOnlyInference("Introductory Controlled Intervals", {
    identity: "distance_intervals",
    family: "intervals",
    icon: "intervals",
  });
  assertLegacyCompactOnlyInference("Reduced Load Race Rhythm", {
    identity: "race_pace_session",
    family: "race",
    icon: "race",
  });
  assertLegacyCompactOnlyInference("Race Week Leg Opener", {
    identity: "taper_tuneup_run",
    family: "race",
    icon: "race",
  });
  assertLegacyCompactOnlyInference(
    "Quality session",
    {
      identity: "distance_intervals",
      family: "intervals",
      icon: "intervals",
    },
    [
      {
        type: "intervals",
        segment_type: "interval_block",
        label: "Intervals",
        target: { intensity: "hard but controlled" },
      },
    ],
  );
  assertLegacyCompactOnlyInference("Progression run", {
    identity: "progression_run",
    family: "progression",
    icon: "progression",
  });
  assertLegacyCompactOnlyInference("Race pace tune-up", {
    identity: "taper_tuneup_run",
    family: "race",
    icon: "race",
  });
  assertLegacyCompactOnlyInference("Rolling hills session", {
    identity: "rolling_hills_session",
    family: "hills",
    icon: "hills",
  });
  assertLegacyCompactOnlyInference("Uphill repeats", {
    identity: "uphill_repeats",
    family: "hills",
    icon: "hills",
  });
  assertLegacyCompactOnlyInference("Quality session", {
    identity: "quality_session",
    family: "intervals",
    icon: "intervals",
  });
  assertLegacyCompactOnlyInference(
    "Quality session",
    {
      identity: "controlled_tempo_session",
      family: "tempo",
      icon: "tempo",
    },
    [
      {
        type: "run",
        segment_type: "tempo_block",
        label: "Controlled tempo block",
        target: { intensity: "tempo" },
      },
    ],
  );

  const restMetricMode = resolveCanonicalWorkoutModel({
    workoutType: "rest",
    sourceWorkoutType: null,
    title: "Rest day",
    steps: [],
  }).metricMode;

  assert.equal(
    restMetricMode.reason,
    "Rest day has no execution metric targets.",
    "rest metric mode should not imply effort execution cues",
  );

  const defaultHrMetricMode = resolveCanonicalWorkoutModel({
    workoutType: "easy",
    sourceWorkoutType: null,
    title: "Easy aerobic run",
    steps: [
      {
        segment_type: "main",
        label: "Easy aerobic block",
        target: {
          hr_bpm_range: "110-130 bpm",
          hr_target_source: "default_estimated_hr",
          label: "Default HR guidance",
          source_note: "Estimated from age, not personalized zones.",
        },
      },
    ],
  }).metricMode;

  assert.equal(
    defaultHrMetricMode.hrTargetSource,
    "default_estimated_hr",
    "metric-mode fallback should preserve target-level default HR source",
  );
  assert.equal(
    defaultHrMetricMode.hrTargetLabel,
    "Default HR guidance",
    "metric-mode fallback should preserve default HR label",
  );
}

function assertRichPersistenceReadback() {
  const plan = buildPlan(buildRequest("half_marathon")).plan;
  const seed = buildImportedPlanSeed(plan);
  const insertRows = buildPersistedWorkoutInsertRows(
    "00000000-0000-4000-8000-000000000901",
    "00000000-0000-4000-8000-000000000902",
    seed.workouts,
  );
  const thresholdRow = insertRows.find(
    (row) => row.workout_identity === "half_marathon_threshold_durability",
  );

  assert.ok(thresholdRow, "persisted insert rows should carry rich threshold identity");
  assert.equal(
    thresholdRow.workout_family,
    "tempo",
    "persisted insert rows should carry rich workout family",
  );
  assert.equal(
    thresholdRow.calendar_icon_key,
    "tempo",
    "persisted insert rows should carry calendar icon key",
  );
  assert.equal(
    typeof thresholdRow.goal_context,
    "object",
    "persisted insert rows should carry bounded goal context json",
  );
  assert.equal(
    typeof thresholdRow.metric_mode,
    "object",
    "persisted insert rows should carry metric mode json",
  );

  const reloaded = deriveWorkoutRichModel({
    type: thresholdRow.workout_type,
    sourceWorkoutType: thresholdRow.source_workout_type,
    workoutFamily: thresholdRow.workout_family,
    workoutIdentity: thresholdRow.workout_identity,
    calendarIconKey: thresholdRow.calendar_icon_key,
    goalContext: thresholdRow.goal_context,
    metricMode: thresholdRow.metric_mode,
    title: thresholdRow.title,
    steps: thresholdRow.steps as SegmentRecord[],
  });

  assert.equal(
    reloaded.workoutIdentity,
    "half_marathon_threshold_durability",
    "saved workout readback should prefer stored rich identity",
  );
  assert.equal(reloaded.workoutFamily, "tempo", "saved workout readback should keep rich family");
  assert.equal(
    reloaded.goalContext?.goalType,
    "half_marathon",
    "saved workout readback should expose stored goal context",
  );

  const persistedRow: PersistedPlannedWorkoutRow = {
    id: "00000000-0000-4000-8000-000000000903",
    created_at: "2026-05-01T00:00:00.000Z",
    ...thresholdRow,
    source_workout_type: "quality",
  };
  const carriedForward = persistedWorkoutRowToImportedSeed(persistedRow, {
    fallbackSourceWorkoutIdPrefix: "fixed",
  });

  assert.equal(
    carriedForward.workoutIdentity,
    "half_marathon_threshold_durability",
    "carry-forward should preserve stored rich identity even when legacy source type is generic",
  );
  assert.equal(
    carriedForward.workoutFamily,
    "tempo",
    "carry-forward should preserve stored rich family for fixed/protected workouts",
  );
  assert.equal(
    carriedForward.goalContext?.goalType,
    "half_marathon",
    "carry-forward should preserve stored rich goal context",
  );
  assert.equal(
    carriedForward.metricMode.guidance,
    reloaded.metricMode.guidance,
    "carry-forward should preserve stored metric-mode semantics",
  );

  const oldCompact = deriveWorkoutRichModel({
    type: "quality",
    sourceWorkoutType: null,
    title: "Controlled tempo session",
    steps: [],
  });

  assert.equal(
    oldCompact.workoutIdentity,
    "controlled_tempo_session",
    "old compact-only rows should still use title fallback when rich fields are absent",
  );
}

function persistedPlanRowForSeed(seed: ImportedPlanSeed): PersistedPlanCycleRow {
  return {
    id: "00000000-0000-4000-8000-000000000910",
    user_id: "00000000-0000-4000-8000-000000000911",
    status: "active",
    title: seed.title,
    goal_summary: seed.goalSummary,
    source_template: seed.sourceTemplate,
    schema_version: seed.schemaVersion,
    source_kind: seed.sourceKind,
    start_date: seed.startDate,
    end_date: seed.endDate,
    target_date: seed.targetDate,
    goal_metadata: seed.goalMetadata,
    plan_preferences: seed.planPreferences,
    created_at: "2026-05-01T00:00:00.000Z",
    updated_at: "2026-05-01T00:00:00.000Z",
  };
}

function persistedWorkoutRowsForSeed(seed: ImportedPlanSeed): PersistedPlannedWorkoutRow[] {
  return buildPersistedWorkoutInsertRows(
    "00000000-0000-4000-8000-000000000910",
    "00000000-0000-4000-8000-000000000911",
    seed.workouts,
  ).map((row, index) => ({
    id: `00000000-0000-4000-8000-${(920 + index).toString().padStart(12, "0")}`,
    created_at: "2026-05-01T00:00:00.000Z",
    ...row,
  }));
}

function assertRichImportExportRoundtrip() {
  const plan = buildPlan(buildRequest("half_marathon")).plan;
  const seed = buildImportedPlanSeed(plan);
  const persistedRows = persistedWorkoutRowsForSeed(seed);
  const exportPayload = buildActivePlanExportPayload({
    planCycle: persistedPlanRowForSeed(seed),
    workouts: persistedRows,
    exportedAt: "2026-05-25T12:00:00.000Z",
  });
  const exportedPlan = activePlanExportToTrainingPlanV2(exportPayload);
  const parsedExport = importedPlanSchema.parse(exportedPlan);
  const roundtripSeed = buildImportedPlanSeed(parsedExport);
  const roundtripRows = buildPersistedWorkoutInsertRows(
    "00000000-0000-4000-8000-000000000930",
    "00000000-0000-4000-8000-000000000931",
    roundtripSeed.workouts,
  );
  const nonRestExports = parsedExport.planned_workouts.filter(
    (workout) => workout.workout_type !== "rest",
  );

  assert.ok(nonRestExports.length > 0, "rich export fixture should include non-rest workouts");

  for (const workout of nonRestExports) {
    assert.ok(workout.source_workout_type, "rich JSON export should preserve source_workout_type");
    assert.ok(workout.workout_family, "rich JSON export should include workout_family");
    assert.ok(workout.workout_identity, "rich JSON export should include workout_identity");
    assert.ok(workout.calendar_icon_key, "rich JSON export should include calendar_icon_key");
    assert.ok(workout.goal_context, "rich JSON export should include bounded goal_context");
    assert.ok(workout.metric_mode, "rich JSON export should include metric_mode");
  }

  assert.ok(
    roundtripRows.every((row) => row.workout_family && row.workout_identity),
    "re-imported rich export should persist rich fields into planned_workouts rows",
  );

  const markdown = renderPlanExportMarkdown(exportPayload);
  assert.match(
    markdown,
    /Focus: Tempo · Half Marathon Threshold Durability|Focus: Intervals ·/,
    "Markdown export should mention exact rich focus without replacing segment detail",
  );

  const template = JSON.parse(
    readFileSync("public/templates/hito-training-plan-v2-template.json", "utf8"),
  );
  const parsedTemplate = importedPlanSchema.parse(template);
  assert.ok(
    parsedTemplate.planned_workouts.every(
      (workout) =>
        workout.workout_family &&
        workout.workout_identity &&
        workout.calendar_icon_key &&
        workout.metric_mode,
    ),
    "template JSON should validate with rich workout fields",
  );

  const compactOnlyPlan = importedPlanSchema.parse({
    schema_version: "training-plan-v2",
    plan_name: "Compact legacy v2 plan",
    generated_for: "Fixture runner",
    start_date: "2026-05-25",
    planned_workouts: [
      {
        workout_id: "compact-tempo-1",
        date: "2026-05-25",
        weekday: "Monday",
        week_number: 1,
        phase: "Base",
        workout_type: "quality",
        title: "Controlled tempo session",
        summary: "Compact-only old row without rich fields.",
        segments: [
          {
            segment_type: "main",
            duration_min: 30,
            target: { intensity: "tempo", cue: "Controlled and repeatable" },
          },
        ],
      },
    ],
  });
  const compactSeed = buildImportedPlanSeed(compactOnlyPlan);

  assert.equal(
    compactSeed.workouts[0]?.workoutIdentity,
    "controlled_tempo_session",
    "older compact-only training-plan-v2 imports should derive rich identity from fallback semantics",
  );
  assert.equal(
    compactSeed.workouts[0]?.workoutFamily,
    "tempo",
    "older compact-only training-plan-v2 imports should derive rich family from fallback semantics",
  );

  const referenceFixture = readAiFirstPlanReferenceFixture();

  if (referenceFixture) {
    const parsedReference = importedPlanSchema.parse(referenceFixture);
    const referenceSeed = buildImportedPlanSeed(parsedReference);
    const referenceIdentities = new Set(
      referenceSeed.workouts.map((workout) => workout.workoutIdentity),
    );

    assert.ok(
      referenceIdentities.has("distance_intervals"),
      "reference-style imports should preserve interval identity from title/segment truth",
    );
    assert.ok(
      referenceIdentities.has("controlled_tempo_session"),
      "reference-style imports should preserve tempo identity from title/segment truth",
    );
    assert.ok(
      referenceIdentities.has("race_pace_session"),
      "reference-style imports should preserve race-rhythm identity from title/segment truth",
    );
    assert.ok(
      !referenceSeed.workouts.some(
        (workout) =>
          workout.title.match(/interval|race rhythm|leg opener/i) &&
          workout.workoutIdentity === "quality_session",
      ),
      "reference-style imports should not collapse clear interval/race-rhythm rows to generic quality_session",
    );
  }
}

function assertRichSavedModeQaFixture() {
  const fixture = importedPlanSchema.parse(
    JSON.parse(readFileSync("scripts/fixtures/rich-workout-saved-mode-fixture.json", "utf8")),
  );
  const expectedRichRows = [
    ["qa-rich-steady-001", "steady", "steady_aerobic_run", "steady"],
    ["qa-rich-hills-001", "hills", "rolling_hills_session", "hills"],
    ["qa-rich-trail-001", "trail", "technical_trail_easy", "trail"],
  ] as const;

  assert.equal(
    fixture.source_kind,
    "qa_rich_workout_fixture",
    "saved-mode QA fixture should be clearly marked test-only",
  );
  assert.equal(
    fixture.planned_workouts.length,
    4,
    "saved-mode QA fixture should keep a small, exact browser-QA surface",
  );

  for (const [workoutId, family, identity, icon] of expectedRichRows) {
    const workout = fixture.planned_workouts.find((entry) => entry.workout_id === workoutId);

    assert.ok(workout, `saved-mode QA fixture should include ${workoutId}`);
    assert.equal(workout.workout_family, family, `${workoutId} should store workout_family`);
    assert.equal(workout.workout_identity, identity, `${workoutId} should store workout_identity`);
    assert.equal(workout.calendar_icon_key, icon, `${workoutId} should store calendar_icon_key`);
    assert.ok(workout.goal_context, `${workoutId} should store bounded goal_context`);
    assert.ok(workout.metric_mode, `${workoutId} should store metric_mode`);
    assert.equal(
      workout.metric_mode?.pace_targets_allowed,
      false,
      `${workoutId} should not store fixture pace targets`,
    );
    assert.equal(
      workout.metric_mode?.hr_targets_allowed,
      false,
      `${workoutId} should not store fixture HR targets`,
    );
  }

  const compactFallback = fixture.planned_workouts.find(
    (entry) => entry.workout_id === "qa-legacy-compact-tempo-001",
  );

  assert.ok(compactFallback, "saved-mode QA fixture should include a compact fallback row");
  assert.equal(
    compactFallback.source_workout_type,
    undefined,
    "compact fallback row should omit source_workout_type",
  );
  assert.equal(
    compactFallback.workout_family,
    undefined,
    "compact fallback row should omit stored rich family",
  );
  assert.equal(
    compactFallback.workout_identity,
    undefined,
    "compact fallback row should omit stored rich identity",
  );

  const seed = buildImportedPlanSeed(fixture);
  const compactSeed = seed.workouts.find(
    (workout) => workout.sourceWorkoutId === "qa-legacy-compact-tempo-001",
  );

  assert.ok(compactSeed, "compact fallback row should normalize into a seed workout");
  const fallbackReadback = deriveWorkoutRichModel({
    type: compactSeed.workoutType,
    sourceWorkoutType: null,
    title: compactSeed.title,
    steps: compactSeed.steps,
  });

  assert.equal(
    fallbackReadback.workoutIdentity,
    "controlled_tempo_session",
    "compact fixture row should still derive tempo identity from title/steps when stored rich truth is absent",
  );
  assert.equal(
    fallbackReadback.workoutFamily,
    "tempo",
    "compact fixture row should still derive tempo family from title/steps when stored rich truth is absent",
  );

  for (const workout of fixture.planned_workouts) {
    for (const segment of workout.segments as SegmentRecord[]) {
      const target = segment.target as Record<string, unknown> | undefined;
      assert.ok(
        typeof segment.guidance === "string" ||
          typeof target?.cue === "string" ||
          typeof target?.hint === "string",
        `${workout.workout_id}: every fixture segment should carry backend guidance/cue/hint`,
      );
    }
  }

  const fixtureText = JSON.stringify(fixture);
  assert.doesNotMatch(fixtureText, /hr_bpm|pace_min_per_km|pace_range_min_km|cadence_spm_range/);
}

function planSearchText(plan: TrainingPlanV2) {
  return JSON.stringify(plan).toLowerCase();
}

function assertMountainTrailDoctrine(plan: TrainingPlanV2, label: string) {
  const identities = sourceWorkoutTypes(plan);
  const identitiesByPhase = sourceWorkoutTypesByPhase(plan);
  const text = planSearchText(plan);
  const taperIdentities = identitiesByPhase.get("Taper") ?? new Set<string>();

  assert.ok(
    identities.has("technical_trail_easy") ||
      identities.has("controlled_downhill_durability") ||
      identities.has("hike_run_endurance") ||
      identities.has("mountain_long_run_time_on_feet"),
    `${label}: mountain/trail plans should include mountain-specific identities beyond generic hill labels`,
  );
  assert.ok(
    identities.has("controlled_downhill_durability"),
    `${label}: controlled downhill or eccentric durability should appear before taper`,
  );
  assert.ok(
    identities.has("mountain_long_run_time_on_feet") || identities.has("hike_run_endurance"),
    `${label}: longer mountain plans should include time-on-feet or hike-run endurance framing`,
  );
  assert.ok(
    /controlled descents?|controlled descent|eccentric durability/.test(text),
    `${label}: controlled descent or eccentric durability guidance should be visible`,
  );
  assert.ok(
    /power-hike|hike-run|time-on-feet|time on feet/.test(text),
    `${label}: hike-run, power-hike, or time-on-feet language should be visible`,
  );
  assert.ok(
    /technical|footing|risky terrain|risky sections/.test(text),
    `${label}: technical terrain caution should be present`,
  );
  assert.equal(
    /\b(?:elevation gain|vertical gain)\b|\b\d+\s*(?:meters|metres|feet|ft)\b/i.test(text),
    false,
    `${label}: mountain doctrine must not prescribe exact elevation gain or route metrics`,
  );

  assert.ok(
    identitiesByPhase.get("Base")?.has("technical_trail_easy") ||
      identitiesByPhase.get("Base")?.has("rolling_hills_session"),
    `${label}: Base phase should start with easy terrain exposure or low-risk hills`,
  );
  assert.ok(
    identitiesByPhase.get("Build")?.has("uphill_repeats") ||
      identitiesByPhase.get("Build")?.has("rolling_hills_session") ||
      identitiesByPhase.get("Build")?.has("climbing_steady_run"),
    `${label}: Build phase should add climbing or rolling-hill strength`,
  );
  assert.ok(
    identitiesByPhase.get("Specific")?.has("controlled_downhill_durability") ||
      identitiesByPhase.get("Specific")?.has("hike_run_endurance") ||
      identitiesByPhase.get("Specific")?.has("mountain_long_run_time_on_feet"),
    `${label}: Specific phase should add race-like mountain durability work`,
  );
  assert.equal(
    taperIdentities.has("controlled_downhill_durability") ||
      taperIdentities.has("hike_run_endurance"),
    false,
    `${label}: Taper phase should not contain peak downhill or hike-run durability stress`,
  );
  assertNoRoadRaceSharpeningInTaper(plan, label);
  assert.ok(
    text.includes("terrain stress") || text.includes("preserve freshness"),
    `${label}: taper copy should reduce terrain stress and preserve freshness`,
  );
}

function assertNoRoadRaceSharpeningInTaper(plan: TrainingPlanV2, label: string) {
  const taperIdentities = sourceWorkoutTypesByPhase(plan).get("Taper") ?? new Set<string>();
  const forbiddenRoadSharpening = [
    "5k_sharpening_repeats",
    "10k_rhythm_intervals",
    "half_marathon_threshold_durability",
    "marathon_steady_specificity",
  ];

  assert.equal(
    forbiddenRoadSharpening.some((identity) => taperIdentities.has(identity)),
    false,
    `${label}: taper should avoid road-race sharpening identities`,
  );
}

function assertNoRoadRaceSharpening(plan: TrainingPlanV2, label: string) {
  const identities = sourceWorkoutTypes(plan);
  const forbiddenRoadSharpening = [
    "5k_sharpening_repeats",
    "10k_rhythm_intervals",
    "half_marathon_threshold_durability",
    "marathon_steady_specificity",
  ];

  assert.equal(
    forbiddenRoadSharpening.some((identity) => identities.has(identity)),
    false,
    `${label}: should not receive road-race sharpening identities`,
  );
}

function assertGoalFamilyWorkoutIdentity() {
  const fiveK = buildPlan(
    buildRequest("5k", {
      availability: {
        runningDaysPerWeek: 4,
        fixedRestDays: [...fixedRestDays],
        preferredLongRunDay: "Saturday",
      },
      goal: {
        goalDistance: "5k",
        goalStyle: "ambitious",
        terrainFocus: "standard",
        targetTime: null,
        targetDate: null,
      },
    }),
  ).plan;
  const fiveKTypes = sourceWorkoutTypes(fiveK);
  const fiveKText = planSearchText(fiveK);

  assert.ok(
    fiveKTypes.has("aerobic_strides") || fiveKTypes.has("5k_sharpening_repeats"),
    "ambitious 5K should include safe short-rep or stride sharpening",
  );
  assert.ok(
    /short controlled reps|relaxed strides|controlled faster running/.test(fiveKText),
    "5K sharpening should use controlled faster-running cues",
  );

  const tenK = buildPlan(
    buildRequest("10k", {
      availability: {
        runningDaysPerWeek: 4,
        fixedRestDays: [...fixedRestDays],
        preferredLongRunDay: "Saturday",
      },
      goal: {
        goalDistance: "10k",
        goalStyle: "ambitious",
        terrainFocus: "standard",
        targetTime: null,
        targetDate: null,
      },
    }),
  ).plan;
  const tenKTypes = sourceWorkoutTypes(tenK);

  assert.ok(tenKTypes.has("10k_rhythm_intervals"), "10K should include rhythm intervals");
  assert.ok(
    /rhythm|sustained quality/.test(planSearchText(tenK)),
    "10K work should include rhythm or sustained-quality cues",
  );

  const half = buildPlan(
    buildRequest("half_marathon", {
      availability: {
        runningDaysPerWeek: 4,
        fixedRestDays: [...fixedRestDays],
        preferredLongRunDay: "Saturday",
      },
    }),
  ).plan;
  const halfTypes = sourceWorkoutTypes(half);

  assert.ok(
    halfTypes.has("half_marathon_threshold_durability"),
    "half marathon should include threshold/steady durability work",
  );
  assert.ok(
    /threshold|steady durability|sustained aerobic strength/.test(planSearchText(half)),
    "half marathon work should include threshold or steady durability cues",
  );

  const marathon = buildPlan(
    buildRequest("marathon", {
      goal: {
        goalDistance: "marathon",
        goalStyle: "target_time",
        terrainFocus: "standard",
        targetTime: "3:45:00",
        targetDate: null,
      },
    }),
  ).plan;
  const marathonTypes = sourceWorkoutTypes(marathon);
  const marathonText = planSearchText(marathon);

  assert.ok(
    marathonTypes.has("marathon_steady_specificity"),
    "marathon should include controlled steady specificity",
  );
  assert.ok(
    /marathon-steady|marathon durability|familiar fueling|time-on-feet/.test(marathonText),
    "marathon work should include controlled steady, fueling, or time-on-feet cues",
  );

  const ultraNoPace = buildPlan(
    buildRequest("ultra_marathon", {
      benchmark: { kind: "unknown" },
      execution: { watchAccess: "none", guidancePreference: "effort" },
    }),
  ).plan;
  const ultraTypes = sourceWorkoutTypes(ultraNoPace);

  assert.ok(
    ultraTypes.has("ultra_time_on_feet_durability") ||
      ultraTypes.has("mountain_long_run_time_on_feet"),
    "ultra should keep time-on-feet durability identity",
  );
  assertNoRoadRaceSharpening(
    ultraNoPace,
    "ultra should not receive inappropriate road-race sharpening identities",
  );
  assert.equal(
    hasTargetKey(ultraNoPace, "pace_min_per_km_range"),
    false,
    "ultra with no pace support should remain effort-based",
  );

  const limitedFiveK = buildPlan(
    buildRequest("5k", {
      benchmark: { kind: "unknown" },
      availability: {
        runningDaysPerWeek: 3,
        fixedRestDays: [...fixedRestDays],
        preferredLongRunDay: "Saturday",
      },
      execution: { watchAccess: "none", guidancePreference: "effort" },
    }),
  ).plan;
  const limitedFiveKTypes = sourceWorkoutTypes(limitedFiveK);

  assert.equal(
    limitedFiveKTypes.has("5k_sharpening_repeats"),
    false,
    "limited-support 5K should not receive aggressive sharpening repeats",
  );
  assert.equal(
    hasTargetKey(limitedFiveK, "pace_min_per_km_range"),
    false,
    "limited-support 5K should not invent pace targets",
  );
}

function assertBeginnerBuildConsistencyQualityCap() {
  const beginnerRequest = buildRequest("build_consistency", {
    benchmark: { fitnessLevel: "beginner" },
    availability: {
      runningDaysPerWeek: 3,
      fixedRestDays: [...fixedRestDays],
      preferredLongRunDay: "Saturday",
    },
    execution: { watchAccess: "none", guidancePreference: "effort" },
  });
  const { input, authoringInput, plan } = buildPlan(beginnerRequest);
  const review = buildStructuredFirstPlanDraftReview(input, plan, authoringInput);
  const sourceTypes = sourceWorkoutTypes(plan);
  const forbiddenQualityTypes = [
    "controlled_tempo_session",
    "time_intervals",
    "distance_intervals",
    "5k_sharpening_repeats",
    "10k_rhythm_intervals",
    "half_marathon_threshold_durability",
    "marathon_steady_specificity",
    "taper_tuneup_run",
  ];
  const allowedConsistencyTypes = new Set([
    "easy_aerobic_run",
    "recovery_jog",
    "steady_aerobic_run",
    "long_aerobic_run",
    "cutback_aerobic_run",
    "cutback_long_run",
    "taper_long_run",
    "aerobic_strides",
    "progression_run",
  ]);

  assert.equal(
    authoringInput.runnerProfile.experienceLevel,
    "new_runner",
    "product beginner fitness level should map to backend new_runner",
  );
  assert.ok(
    review.runnerUnderstanding.benchmark.includes("beginner"),
    "review should show the runner-facing beginner label",
  );
  assert.equal(
    review.runnerUnderstanding.benchmark.includes("returning_runner"),
    false,
    "review should not expose internal returning-runner wording for beginner fitness level",
  );
  assert.equal(
    review.planShape.qualityRhythm,
    "No regular quality day; runs stay mostly easy.",
    "beginner consistency review should not promise a regular quality day",
  );
  assert.equal(
    forbiddenQualityTypes.some((identity) => sourceTypes.has(identity)),
    false,
    "beginner low-support build-consistency plan should not emit tempo, interval, or race-like identities",
  );
  assert.deepEqual(
    [...sourceTypes].filter((identity) => !allowedConsistencyTypes.has(identity)),
    [],
    "beginner build-consistency plan should stay within easy/steady/long/cutback identities",
  );
  assert.equal(
    hasTargetKey(plan, "pace_min_per_km_range"),
    false,
    "beginner consistency plan without watch/benchmark support should not emit pace targets",
  );
  assertDefaultEstimatedHrGuidance(
    plan,
    "beginner consistency plan with age but no personal HR zones",
  );

  const weakSupportConsistency = buildPlan(
    buildRequest("build_consistency", {
      benchmark: { kind: "unknown" },
      availability: {
        runningDaysPerWeek: 4,
        fixedRestDays: [...fixedRestDays],
        preferredLongRunDay: "Saturday",
      },
      execution: { watchAccess: "none", guidancePreference: "effort" },
    }),
  ).plan;

  assert.equal(
    forbiddenQualityTypes.some((identity) =>
      sourceWorkoutTypes(weakSupportConsistency).has(identity),
    ),
    false,
    "build-consistency plans with no usable benchmark and no target-time pressure should stay conservative",
  );
}

function assertMetricTargetPolicy() {
  const supportedPace = buildPlan(buildRequest("10k")).plan;
  const mountainPlan = buildPlan(buildRequest("mountain_running")).plan;

  assert.equal(
    hasTargetKey(supportedPace, "pace_min_per_km_range"),
    true,
    "watch/app plus pace preference plus usable recent 5K should emit pace targets",
  );

  assert.equal(
    hasTargetKey(
      buildPlan(
        buildRequest("10k", {
          execution: { watchAccess: "watch_or_app", guidancePreference: "mixed" },
        }),
      ).plan,
      "pace_min_per_km_range",
    ),
    true,
    "mixed guidance with watch/app plus usable recent 5K should emit pace targets",
  );

  assert.equal(
    hasTargetKey(
      buildPlan(
        buildRequest("10k", {
          execution: { watchAccess: "watch_or_app", guidancePreference: "effort" },
        }),
      ).plan,
      "pace_min_per_km_range",
    ),
    false,
    "effort guidance should not emit pace targets even with a usable benchmark",
  );

  assert.equal(
    hasTargetKey(
      buildPlan(
        buildRequest("10k", {
          execution: { watchAccess: "unknown", guidancePreference: "pace" },
        }),
      ).plan,
      "pace_min_per_km_range",
    ),
    false,
    "pace targets require known watch/app access",
  );

  assert.equal(
    hasTargetKey(
      buildPlan(
        buildRequest("10k", {
          benchmark: { kind: "unknown" },
          execution: { watchAccess: "watch_or_app", guidancePreference: "mixed" },
        }),
      ).plan,
      "pace_min_per_km_range",
    ),
    false,
    "mixed guidance must not invent pace targets without usable recent 5K truth",
  );

  for (const plan of [supportedPace, buildPlan(buildRequest("marathon")).plan, mountainPlan]) {
    assertDefaultEstimatedHrGuidance(
      plan,
      "age-supported plan without personal HR zones should use default estimated HR",
    );
  }

  assertEffortOnlyHrGuidance(
    buildPlanWithNoAge(buildRequest("10k")),
    "plan without age or personal HR zones",
  );

  assertNoHrOnMainTargetsForIdentities(
    supportedPace,
    ["distance_intervals", "time_intervals", "10k_rhythm_intervals", "5k_sharpening_repeats"],
    "short rep and interval workouts",
  );
  assertNoHrOnMainTargetsForIdentities(
    mountainPlan,
    [
      "uphill_repeats",
      "rolling_hills_session",
      "technical_trail_easy",
      "controlled_downhill_durability",
      "climbing_steady_run",
    ],
    "hill and technical trail workouts",
  );

  const halfPlan = buildPlan(buildRequest("half_marathon")).plan;
  const sustainedTempoHrTargets = nonRestWorkouts(halfPlan)
    .filter((workout) =>
      ["controlled_tempo_session", "half_marathon_threshold_durability"].includes(
        workout.source_workout_type ?? "",
      ),
    )
    .flatMap((workout) => workout.segments as SegmentRecord[])
    .filter((segment) =>
      ["main", "tempo_block", "interval_block"].includes(String(segment.segment_type ?? "")),
    )
    .filter((segment) => targetHasHr(segment.target as Record<string, unknown> | undefined));

  assert.ok(
    sustainedTempoHrTargets.length > 0,
    "sustained tempo/threshold blocks should receive broad default estimated HR guidance when age exists",
  );
}

function buildAiFirstPlanAuthoringInput(
  overrides: Partial<ReturnType<typeof structuredPlanAuthoringInputSchema.parse>> = {},
) {
  const { authoringInput } = buildPlan(
    buildRequest("half_marathon", {
      goal: {
        goalDistance: "half_marathon",
        goalStyle: "target_time",
        terrainFocus: "standard",
        targetTime: "2:00:00",
        targetDate: "2026-06-14",
      },
      execution: { watchAccess: "watch_or_app", guidancePreference: "mixed" },
    }),
  );

  return structuredPlanAuthoringInputSchema.parse({
    ...authoringInput,
    ...overrides,
    schedule: {
      ...authoringInput.schedule,
      startDate: "2026-06-01",
      targetDate: "2026-06-14",
      preparationHorizonWeeks: 2,
      ...(overrides.schedule ?? {}),
    },
    availability: {
      ...authoringInput.availability,
      preferredRunningDays: ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"],
      unavailableDays: ["Wednesday", "Sunday"],
      maxRunningDaysPerWeek: 5,
      preferredLongRunDay: "Saturday",
      ...(overrides.availability ?? {}),
    },
  });
}

function buildAiFirstPlanDraftFixture(): AiFirstPlanDraft {
  const startDate = "2026-06-01";
  const goalContext = {
    goalType: "half_marathon",
    goalStyle: "target_time",
    terrainFocus: "standard" as const,
    targetDate: "2026-06-14",
    targetTime: "2:00:00",
  };
  const metricMode = {
    guidance: "mixed" as const,
    paceTargetsAllowed: true,
    hrTargetsAllowed: false,
    hrTargetSource: "effort_only" as const,
    hrTargetLabel: null,
    hrTargetSourceNote: null,
    reason: "Pace may be used only where backend benchmark/watch gates allow it.",
  };

  const workoutsByDay = [
    {
      family: "easy",
      identity: "easy_aerobic_run",
      icon: "easy",
      title: "Easy aerobic run",
      summary: "Easy support run with relaxed mechanics and a controlled finish.",
      mainType: "main",
      mainLabel: "Easy aerobic block",
      durationMin: 45,
      rpe: 4,
      fatigue: "low",
      recovery: "medium",
      pace: "6:20-7:20/km",
    },
    {
      family: "tempo",
      identity: "half_marathon_threshold_durability",
      icon: "tempo",
      title: "Half marathon threshold durability",
      summary: "Controlled threshold durability without forcing target pace.",
      mainType: "tempo_block",
      mainLabel: "Controlled threshold block",
      durationMin: 54,
      rpe: 6,
      fatigue: "medium_high",
      recovery: "medium",
      pace: "5:20-5:50/km",
    },
    null,
    {
      family: "steady",
      identity: "steady_aerobic_run",
      icon: "steady",
      title: "Steady aerobic run",
      summary: "Steady support run that builds half-marathon durability.",
      mainType: "main",
      mainLabel: "Steady aerobic block",
      durationMin: 50,
      rpe: 5,
      fatigue: "medium",
      recovery: "medium",
      pace: "5:55-6:35/km",
    },
    {
      family: "recovery",
      identity: "recovery_jog",
      icon: "recovery",
      title: "Recovery jog",
      summary: "Very easy recovery day to absorb the week's work.",
      mainType: "main",
      mainLabel: "Recovery jog block",
      durationMin: 35,
      rpe: 3,
      fatigue: "very_low",
      recovery: "high",
      pace: null,
    },
    {
      family: "long",
      identity: "long_run_with_steady_finish",
      icon: "long",
      title: "Long run with steady finish",
      summary: "Aerobic long run with a short steady finish for target-time awareness.",
      mainType: "main",
      mainLabel: "Long aerobic block",
      durationMin: 80,
      rpe: 5,
      fatigue: "medium_high",
      recovery: "high",
      pace: "6:25-7:25/km",
    },
    null,
  ] as const;

  const weeks = [1, 2].map((weekNumber) => ({
    weekNumber,
    phase: weekNumber === 1 ? ("Base" as const) : ("Build" as const),
    theme: weekNumber === 1 ? "Settle into rhythm" : "Add controlled durability",
    microcycleIntent:
      weekNumber === 1
        ? "Introduce half-marathon rhythm while keeping easy days truly easy."
        : "Progress steady durability and keep the long run on Saturday.",
    cutbackWeek: false,
    taperWeek: false,
    plannedWorkouts: workoutsByDay.map((template, dayIndex) => {
      const date = addDaysIso(startDate, (weekNumber - 1) * 7 + dayIndex);
      const weekday = weekdayLong(date);

      if (!template) {
        return buildAiRestDraftWorkout(date, weekday, goalContext, metricMode);
      }

      return buildAiRunningDraftWorkout({
        date,
        weekday,
        goalContext,
        metricMode,
        ...template,
      });
    }),
  }));

  return {
    schemaVersion: AI_FIRST_PLAN_DRAFT_SCHEMA_VERSION,
    planName: "AI half marathon draft",
    generatedFor: "Doctrine fixture",
    goal: {
      goalType: "half_marathon",
      goalLabel: "Half marathon",
      goalStyle: "target_time",
      targetTime: "2:00:00",
      targetDate: "2026-06-14",
    },
    startDate,
    targetDate: "2026-06-14",
    preparationHorizonWeeks: 2,
    planPreferences: {
      preferredRunningDays: ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"],
      fixedRestDays: ["Wednesday", "Sunday"],
      preferredLongRunDay: "Saturday",
      maxRunningDaysPerWeek: 5,
    },
    reviewAssumptions: [
      "Target-time work is included only where benchmark support allows pace guidance.",
      "Default HR guidance, if shown, is estimated from age and not personalized zones.",
    ],
    metricPolicySummary:
      "Pace is gated by watch/app plus recent benchmark truth; HR is default estimated only.",
    weeks,
  };
}

function buildAiFirstPlanBlueprintFixture(): AiFirstPlanBlueprint {
  const startDate = "2026-06-01";
  const workoutsByDay = [
    {
      family: "easy",
      identity: "easy_aerobic_run",
      icon: "easy",
      title: "Easy aerobic run",
      summary: "Easy support run with relaxed mechanics and a controlled finish.",
      rpe: 4,
      fatigue: "low",
      recovery: "medium",
      segmentIntent: "easy_aerobic",
      metricIntent: "mixed_if_allowed",
    },
    {
      family: "tempo",
      identity: "half_marathon_threshold_durability",
      icon: "tempo",
      title: "Half marathon threshold durability",
      summary: "Controlled threshold durability without forcing target pace.",
      rpe: 6,
      fatigue: "medium_high",
      recovery: "medium",
      segmentIntent: "tempo_sustained",
      metricIntent: "mixed_if_allowed",
    },
    null,
    {
      family: "steady",
      identity: "steady_aerobic_run",
      icon: "steady",
      title: "Steady aerobic run",
      summary: "Steady support run that builds half-marathon durability.",
      rpe: 5,
      fatigue: "medium",
      recovery: "medium",
      segmentIntent: "steady_aerobic",
      metricIntent: "mixed_if_allowed",
    },
    {
      family: "recovery",
      identity: "recovery_jog",
      icon: "recovery",
      title: "Recovery jog",
      summary: "Very easy recovery day to absorb the week's work.",
      rpe: 3,
      fatigue: "very_low",
      recovery: "high",
      segmentIntent: "recovery",
      metricIntent: "effort_only",
    },
    {
      family: "long",
      identity: "long_run_with_steady_finish",
      icon: "long",
      title: "Long run with steady finish",
      summary: "Aerobic long run with a short steady finish for target-time awareness.",
      rpe: 5,
      fatigue: "medium_high",
      recovery: "high",
      segmentIntent: "long_durability",
      metricIntent: "mixed_if_allowed",
    },
    null,
  ] as const;

  const weeks = [1, 2].map((weekNumber) => ({
    weekNumber,
    phase: weekNumber === 1 ? ("Base" as const) : ("Build" as const),
    theme: weekNumber === 1 ? "Settle into rhythm" : "Add controlled durability",
    microcycleIntent:
      weekNumber === 1
        ? "Introduce half-marathon rhythm while keeping easy days truly easy."
        : "Progress steady durability and keep the long run on Saturday.",
    cutbackWeek: false,
    taperWeek: false,
    longRunIntent: "Keep Saturday durability progressing without forcing race effort.",
    longRunProgression: "Use backend expansion to preserve safe long-run progression.",
    plannedWorkouts: workoutsByDay.flatMap((template, dayIndex) => {
      if (!template) {
        return [];
      }

      const date = addDaysIso(startDate, (weekNumber - 1) * 7 + dayIndex);

      return [
        {
          date,
          weekday: weekdayLong(
            date,
          ) as AiFirstPlanBlueprint["weeks"][number]["plannedWorkouts"][number]["weekday"],
          workoutFamily: template.family,
          workoutIdentity: template.identity,
          calendarIconKey: template.icon,
          title: template.title,
          summary: template.summary,
          plannedRpe: template.rpe,
          estimatedFatigue: template.fatigue,
          recoveryPriority: template.recovery,
          segmentIntent: template.segmentIntent,
          metricIntent: template.metricIntent,
        },
      ];
    }),
  }));

  return {
    schemaVersion: AI_FIRST_PLAN_BLUEPRINT_SCHEMA_VERSION,
    planName: "AI blueprint half marathon",
    generatedFor: "Doctrine fixture",
    goalSummary: "Half marathon target-time plan",
    startDate,
    targetDate: "2026-06-14",
    preparationHorizonWeeks: 2,
    planPreferences: {
      preferredRunningDays: ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"],
      fixedRestDays: ["Wednesday", "Sunday"],
      preferredLongRunDay: "Saturday",
      maxRunningDaysPerWeek: 5,
    },
    reviewAssumptions: [
      "Target-time work is included only where benchmark support allows pace guidance.",
      "Backend expands compact workout intent into canonical segments and metric truth.",
    ],
    metricPolicySummary:
      "AI supplies metric intent only; backend applies pace gates and default estimated HR policy.",
    weeks,
  };
}

function buildAiFirstPlanBlueprintIdentityFixture(): AiFirstPlanBlueprint {
  const startDate = "2026-06-01";
  const weekdayOffsets = new Map([
    ["Monday", 0],
    ["Tuesday", 1],
    ["Wednesday", 2],
    ["Thursday", 3],
    ["Friday", 4],
    ["Saturday", 5],
    ["Sunday", 6],
  ]);
  const weeks = [
    {
      phase: "Base" as const,
      theme: "Establish rhythm",
      microcycleIntent: "Pair easy support with threshold durability and a steady-finish long run.",
      cutbackWeek: false,
      taperWeek: false,
      workouts: [
        blueprintWorkoutTemplate("Monday", "easy", "easy_aerobic_run", "easy", "Easy aerobic run"),
        blueprintWorkoutTemplate(
          "Tuesday",
          "tempo",
          "half_marathon_threshold_durability",
          "tempo",
          "Half marathon threshold durability",
        ),
        blueprintWorkoutTemplate(
          "Thursday",
          "steady",
          "steady_aerobic_run",
          "steady",
          "Steady aerobic run",
        ),
        blueprintWorkoutTemplate(
          "Friday",
          "intervals",
          "time_intervals",
          "intervals",
          "Time intervals",
        ),
        blueprintWorkoutTemplate(
          "Saturday",
          "long",
          "long_run_with_steady_finish",
          "long",
          "Long run with steady finish",
        ),
      ],
    },
    {
      phase: "Build" as const,
      theme: "Build repeatability",
      microcycleIntent:
        "Use controlled repeats and steady support without adding terrain-specific work.",
      cutbackWeek: false,
      taperWeek: false,
      workouts: [
        blueprintWorkoutTemplate("Monday", "recovery", "recovery_jog", "recovery", "Recovery jog"),
        blueprintWorkoutTemplate(
          "Tuesday",
          "intervals",
          "distance_intervals",
          "intervals",
          "Distance intervals",
        ),
        blueprintWorkoutTemplate(
          "Thursday",
          "tempo",
          "controlled_tempo_session",
          "tempo",
          "Controlled tempo session",
        ),
        blueprintWorkoutTemplate("Friday", "recovery", "recovery_jog", "recovery", "Recovery jog"),
        blueprintWorkoutTemplate(
          "Saturday",
          "long",
          "long_run_with_steady_finish",
          "long",
          "Long run with steady finish",
        ),
      ],
    },
  ];

  return {
    schemaVersion: AI_FIRST_PLAN_BLUEPRINT_SCHEMA_VERSION,
    planName: "AI blueprint identity matrix",
    generatedFor: "Doctrine fixture",
    goalSummary: "Half marathon identity-aware blueprint expansion",
    startDate,
    targetDate: "2026-06-14",
    preparationHorizonWeeks: 2,
    planPreferences: {
      preferredRunningDays: ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"],
      fixedRestDays: ["Wednesday", "Sunday"],
      preferredLongRunDay: "Saturday",
      maxRunningDaysPerWeek: 5,
    },
    reviewAssumptions: [
      "Backend expands compact identity intent into executable workout details.",
      "AI supplies no numeric metric truth; backend owns pace and HR policy.",
    ],
    metricPolicySummary:
      "AI supplies metric intent only; backend applies pace gates and default estimated HR policy.",
    weeks: weeks.map((week, weekIndex) => ({
      weekNumber: weekIndex + 1,
      phase: week.phase,
      theme: week.theme,
      microcycleIntent: week.microcycleIntent,
      cutbackWeek: week.cutbackWeek,
      taperWeek: week.taperWeek,
      longRunIntent: "Keep Saturday durability specific but controlled.",
      longRunProgression: "Backend validates long-run and taper sanity after expansion.",
      plannedWorkouts: week.workouts.map((workout) => {
        const offset = weekIndex * 7 + (weekdayOffsets.get(workout.weekday) ?? 0);
        const date = addDaysIso(startDate, offset);

        return {
          ...workout,
          date,
        };
      }),
    })),
  };
}

function buildAiFirstPlanBlueprintMissingIdentityFixture(): AiFirstPlanBlueprint {
  const startDate = "2026-07-06";
  const weekdayOffsets = new Map([
    ["Monday", 0],
    ["Tuesday", 1],
    ["Wednesday", 2],
    ["Thursday", 3],
    ["Friday", 4],
    ["Saturday", 5],
    ["Sunday", 6],
  ]);
  const weeks = [
    {
      phase: "Base" as const,
      theme: "Sharpen without overload",
      microcycleIntent: "Introduce trail skill, controlled climbing, and mountain time-on-feet.",
      cutbackWeek: false,
      taperWeek: false,
      workouts: [
        blueprintWorkoutTemplate("Monday", "easy", "easy_aerobic_run", "easy", "Easy aerobic run"),
        blueprintWorkoutTemplate(
          "Tuesday",
          "trail",
          "technical_trail_easy",
          "trail",
          "Technical trail easy run",
        ),
        blueprintWorkoutTemplate(
          "Thursday",
          "hills",
          "climbing_steady_run",
          "hills",
          "Climbing steady run",
        ),
        blueprintWorkoutTemplate("Friday", "recovery", "recovery_jog", "recovery", "Recovery jog"),
        blueprintWorkoutTemplate(
          "Saturday",
          "trail",
          "mountain_long_run_time_on_feet",
          "trail",
          "Mountain long run time on feet",
        ),
      ],
    },
    {
      phase: "Build" as const,
      theme: "Rhythm and terrain control",
      microcycleIntent:
        "Pair rolling terrain with controlled downhill durability and hike-run endurance.",
      cutbackWeek: false,
      taperWeek: false,
      workouts: [
        blueprintWorkoutTemplate(
          "Monday",
          "steady",
          "steady_aerobic_run",
          "steady",
          "Steady aerobic run",
        ),
        blueprintWorkoutTemplate(
          "Tuesday",
          "hills",
          "rolling_hills_session",
          "hills",
          "Rolling hills session",
        ),
        blueprintWorkoutTemplate(
          "Thursday",
          "hills",
          "controlled_downhill_durability",
          "hills",
          "Controlled downhill durability",
        ),
        blueprintWorkoutTemplate("Friday", "easy", "easy_aerobic_run", "easy", "Easy aerobic run"),
        blueprintWorkoutTemplate(
          "Saturday",
          "trail",
          "hike_run_endurance",
          "trail",
          "Hike-run endurance",
        ),
      ],
    },
    {
      phase: "Specific" as const,
      theme: "Controlled race rhythm",
      microcycleIntent:
        "Use uphill strength while keeping terrain support and cutback durability conservative.",
      cutbackWeek: true,
      taperWeek: false,
      workouts: [
        blueprintWorkoutTemplate("Monday", "recovery", "recovery_jog", "recovery", "Recovery jog"),
        blueprintWorkoutTemplate("Tuesday", "hills", "uphill_repeats", "hills", "Uphill repeats"),
        blueprintWorkoutTemplate(
          "Thursday",
          "trail",
          "technical_trail_easy",
          "trail",
          "Technical trail easy run",
        ),
        blueprintWorkoutTemplate("Friday", "easy", "easy_aerobic_run", "easy", "Easy aerobic run"),
        blueprintWorkoutTemplate(
          "Saturday",
          "trail",
          "ultra_time_on_feet_durability",
          "trail",
          "Ultra time-on-feet durability",
        ),
      ],
    },
    {
      phase: "Taper" as const,
      theme: "Freshness and terrain control",
      microcycleIntent: "Keep light terrain rhythm and reduce the long-run load for freshness.",
      cutbackWeek: false,
      taperWeek: true,
      workouts: [
        blueprintWorkoutTemplate("Monday", "easy", "easy_aerobic_run", "easy", "Easy aerobic run"),
        blueprintWorkoutTemplate(
          "Tuesday",
          "trail",
          "technical_trail_easy",
          "trail",
          "Technical trail easy run",
        ),
        blueprintWorkoutTemplate(
          "Thursday",
          "steady",
          "steady_aerobic_run",
          "steady",
          "Steady aerobic run",
        ),
        blueprintWorkoutTemplate("Friday", "recovery", "recovery_jog", "recovery", "Recovery jog"),
        blueprintWorkoutTemplate("Saturday", "long", "taper_long_run", "long", "Taper long run"),
      ],
    },
  ].slice(0, 1);

  return {
    schemaVersion: AI_FIRST_PLAN_BLUEPRINT_SCHEMA_VERSION,
    planName: "AI blueprint full identity coverage",
    generatedFor: "Doctrine fixture",
    goalSummary: "Mountain identity-aware blueprint expansion",
    startDate,
    targetDate: "2026-07-12",
    preparationHorizonWeeks: 1,
    planPreferences: {
      preferredRunningDays: ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"],
      fixedRestDays: ["Wednesday", "Sunday"],
      preferredLongRunDay: "Saturday",
      maxRunningDaysPerWeek: 5,
    },
    reviewAssumptions: [
      "Backend expands performance and mountain blueprint identities into executable detail.",
      "AI supplies no numeric metric truth; backend owns pace and HR policy.",
    ],
    metricPolicySummary:
      "AI supplies metric intent only; backend applies pace gates and default estimated HR policy.",
    weeks: weeks.map((week, weekIndex) => ({
      weekNumber: weekIndex + 1,
      phase: week.phase,
      theme: week.theme,
      microcycleIntent: week.microcycleIntent,
      cutbackWeek: week.cutbackWeek,
      taperWeek: week.taperWeek,
      longRunIntent: "Keep Saturday durability specific but controlled.",
      longRunProgression: "Backend validates long-run and taper sanity after expansion.",
      plannedWorkouts: week.workouts.map((workout) => {
        const offset = weekIndex * 7 + (weekdayOffsets.get(workout.weekday) ?? 0);
        const date = addDaysIso(startDate, offset);

        return {
          ...workout,
          date,
        };
      }),
    })),
  };
}

function blueprintWorkoutTemplate(
  weekday: AiFirstPlanBlueprint["weeks"][number]["plannedWorkouts"][number]["weekday"],
  workoutFamily: CanonicalWorkoutFamily,
  workoutIdentity: CanonicalWorkoutIdentity,
  calendarIconKey: CalendarIconKey,
  title: string,
): AiFirstPlanBlueprint["weeks"][number]["plannedWorkouts"][number] {
  const segmentIntentByFamily: Record<
    CanonicalWorkoutFamily,
    AiFirstPlanBlueprint["weeks"][number]["plannedWorkouts"][number]["segmentIntent"]
  > = {
    easy: "easy_aerobic",
    recovery: "recovery",
    steady: "steady_aerobic",
    long: "long_durability",
    tempo: "tempo_sustained",
    intervals: "interval_repeats",
    hills: "hill_strength",
    trail: "trail_terrain",
    progression: "progression",
    race: "race_tuneup",
    rest: "rest",
  };

  return {
    date: null,
    weekday,
    workoutFamily,
    workoutIdentity,
    calendarIconKey,
    title,
    summary: `${title} authored as compact blueprint intent for backend expansion.`,
    plannedRpe:
      workoutFamily === "recovery"
        ? 3
        : workoutFamily === "long"
          ? 5
          : workoutFamily === "easy"
            ? 4
            : 6,
    estimatedFatigue:
      workoutFamily === "recovery"
        ? "very_low"
        : workoutFamily === "long"
          ? "medium_high"
          : "medium",
    recoveryPriority: workoutFamily === "long" || workoutFamily === "recovery" ? "high" : "medium",
    segmentIntent: segmentIntentByFamily[workoutFamily],
    metricIntent: "mixed_if_allowed",
  };
}

function blueprintWorkoutFromIdentity(
  weekday: AiFirstPlanBlueprint["weeks"][number]["plannedWorkouts"][number]["weekday"],
  workoutIdentity: CanonicalWorkoutIdentity,
) {
  const title = titleFromIdentity(workoutIdentity);
  const resolved = resolveCanonicalWorkoutModel({ workoutIdentity, title });

  return blueprintWorkoutTemplate(
    weekday,
    resolved.workoutFamily,
    resolved.workoutIdentity,
    resolved.calendarIconKey,
    title,
  );
}

function titleFromIdentity(identity: CanonicalWorkoutIdentity) {
  return identity
    .split("_")
    .map((part) => (part.length > 0 ? part[0]!.toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function buildGoalFamilyCadenceAuthoringInput({
  goalDistance,
  goalStyle = "ambitious",
  targetTime = null,
  targetDate = "2026-07-12",
  terrainFocus = "standard",
  experienceLevel = "experienced_runner",
  runningDays = ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"],
  horizonWeeks = 6,
}: {
  goalDistance: StructuredFirstPlanOnboardingRequestInput["goal"]["goalDistance"];
  goalStyle?: StructuredFirstPlanOnboardingRequestInput["goal"]["goalStyle"];
  targetTime?: string | null;
  targetDate?: string | null;
  terrainFocus?: StructuredFirstPlanOnboardingRequestInput["goal"]["terrainFocus"];
  experienceLevel?: ReturnType<
    typeof structuredPlanAuthoringInputSchema.parse
  >["runnerProfile"]["experienceLevel"];
  runningDays?: string[];
  horizonWeeks?: number;
}) {
  const startDate = "2026-06-01";
  const baselineLongRunDurationMin =
    goalDistance === "ultra_marathon" || goalDistance === "mountain_running"
      ? 80
      : goalDistance === "marathon"
        ? 70
        : goalDistance === "build_consistency"
          ? 35
          : 55;

  return buildAiFirstPlanAuthoringInput({
    goal: {
      goalType: goalDistance,
      goalLabel: titleFromIdentity(
        goalDistance === "build_consistency" ? "easy_aerobic_run" : "long_aerobic_run",
      ),
      goalStyle,
      targetTime,
    },
    runnerProfile: {
      age: 34,
      experienceLevel,
      baselineSessionsPerWeek: runningDays.length,
      baselineLongRunDurationMin,
      recentInjuryRecoveryContext: null,
      preferredEffortLanguage: "mixed",
    },
    preferences: {
      terrainFocus,
      preferredWorkoutMix: "balanced",
      strengthTraining: "some",
    },
    schedule: {
      startDate,
      targetDate,
      preparationHorizonWeeks: horizonWeeks,
    },
    availability: {
      preferredRunningDays: runningDays,
      unavailableDays: ["Wednesday", "Sunday"],
      maxRunningDaysPerWeek: runningDays.length,
      preferredLongRunDay: "Saturday",
    },
  });
}

function buildGoalFamilyCadenceBlueprint({
  planName,
  goalSummary,
  authoringInput,
  weeklyIdentities,
}: {
  planName: string;
  goalSummary: string;
  authoringInput: ReturnType<typeof structuredPlanAuthoringInputSchema.parse>;
  weeklyIdentities: CanonicalWorkoutIdentity[][];
}): AiFirstPlanBlueprint {
  const weekdayOffsets = new Map([
    ["Monday", 0],
    ["Tuesday", 1],
    ["Wednesday", 2],
    ["Thursday", 3],
    ["Friday", 4],
    ["Saturday", 5],
    ["Sunday", 6],
  ]);
  const runningDays = authoringInput.availability.preferredRunningDays;

  return {
    schemaVersion: AI_FIRST_PLAN_BLUEPRINT_SCHEMA_VERSION,
    planName,
    generatedFor: "Goal-family doctrine fixture",
    goalSummary,
    startDate: authoringInput.schedule.startDate,
    targetDate: authoringInput.schedule.targetDate,
    preparationHorizonWeeks: authoringInput.schedule.preparationHorizonWeeks,
    planPreferences: {
      preferredRunningDays: runningDays,
      fixedRestDays: authoringInput.availability.unavailableDays,
      preferredLongRunDay: authoringInput.availability.preferredLongRunDay,
      maxRunningDaysPerWeek: authoringInput.availability.maxRunningDaysPerWeek,
    },
    reviewAssumptions: ["Goal-family identity cadence is backend-validated."],
    metricPolicySummary: "Backend owns pace and HR target truth.",
    weeks: weeklyIdentities.map((identities, weekIndex) => ({
      weekNumber: weekIndex + 1,
      phase:
        weekIndex >= weeklyIdentities.length - 1
          ? ("Taper" as const)
          : weekIndex >= Math.floor(weeklyIdentities.length * 0.6)
            ? ("Specific" as const)
            : weekIndex >= Math.floor(weeklyIdentities.length * 0.25)
              ? ("Build" as const)
              : ("Base" as const),
      theme: `Week ${weekIndex + 1} goal-family cadence`,
      microcycleIntent: `Use ${goalSummary} identities without random filler.`,
      cutbackWeek: weekIndex === 2,
      taperWeek: weekIndex >= weeklyIdentities.length - 1,
      longRunIntent: "Keep the Saturday long-run slot durable and controlled.",
      longRunProgression: "Backend validates long-run and taper sanity after expansion.",
      plannedWorkouts: identities.map((identity, dayIndex) => {
        const weekday = runningDays[dayIndex]!;
        const date = addDaysIso(
          authoringInput.schedule.startDate,
          weekIndex * 7 + (weekdayOffsets.get(weekday) ?? 0),
        );

        return {
          ...blueprintWorkoutFromIdentity(
            weekday as AiFirstPlanBlueprint["weeks"][number]["plannedWorkouts"][number]["weekday"],
            identity,
          ),
          date,
        };
      }),
    })),
  };
}

function buildAiRunningDraftWorkout({
  date,
  weekday,
  goalContext,
  metricMode,
  family,
  identity,
  icon,
  title,
  summary,
  mainType,
  mainLabel,
  durationMin,
  rpe,
  fatigue,
  recovery,
  pace,
}: {
  date: string;
  weekday: string;
  goalContext: AiFirstPlanDraft["weeks"][number]["plannedWorkouts"][number]["goalContext"];
  metricMode: AiFirstPlanDraft["weeks"][number]["plannedWorkouts"][number]["metricMode"];
  family: AiFirstPlanDraft["weeks"][number]["plannedWorkouts"][number]["workoutFamily"];
  identity: AiFirstPlanDraft["weeks"][number]["plannedWorkouts"][number]["workoutIdentity"];
  icon: AiFirstPlanDraft["weeks"][number]["plannedWorkouts"][number]["calendarIconKey"];
  title: string;
  summary: string;
  mainType: "main" | "tempo_block";
  mainLabel: string;
  durationMin: number;
  rpe: number;
  fatigue: AiFirstPlanDraft["weeks"][number]["plannedWorkouts"][number]["estimatedFatigue"];
  recovery: AiFirstPlanDraft["weeks"][number]["plannedWorkouts"][number]["recoveryPriority"];
  pace: string | null;
}): AiFirstPlanDraft["weeks"][number]["plannedWorkouts"][number] {
  return {
    date,
    weekday: weekday as AiFirstPlanDraft["weeks"][number]["plannedWorkouts"][number]["weekday"],
    workoutFamily: family,
    workoutIdentity: identity,
    calendarIconKey: icon,
    title,
    summary,
    plannedRpe: rpe,
    estimatedFatigue: fatigue,
    recoveryPriority: recovery,
    goalContext,
    metricMode,
    segments: [
      buildAiDraftSegment("warmup", "Warm up", 1, 10, "Start easy and settle your stride.", null),
      buildAiDraftSegment(
        mainType,
        mainLabel,
        2,
        Math.max(10, durationMin - 20),
        "Keep the effort controlled and repeatable.",
        pace,
      ),
      buildAiDraftSegment("cooldown", "Cool down", 3, 10, "Ease down before stopping.", null),
    ],
  };
}

function buildAiRestDraftWorkout(
  date: string,
  weekday: string,
  goalContext: AiFirstPlanDraft["weeks"][number]["plannedWorkouts"][number]["goalContext"],
  metricMode: AiFirstPlanDraft["weeks"][number]["plannedWorkouts"][number]["metricMode"],
): AiFirstPlanDraft["weeks"][number]["plannedWorkouts"][number] {
  return {
    date,
    weekday: weekday as AiFirstPlanDraft["weeks"][number]["plannedWorkouts"][number]["weekday"],
    workoutFamily: "rest",
    workoutIdentity: "rest_and_recovery",
    calendarIconKey: "rest",
    title: "Rest and recovery",
    summary: "No running today. Keep the day genuinely restful.",
    plannedRpe: 1,
    estimatedFatigue: "very_low",
    recoveryPriority: "high",
    goalContext,
    metricMode: { ...metricMode, guidance: "effort", paceTargetsAllowed: false },
    segments: [
      {
        segmentId: `rest-${date}`,
        segmentType: "rest",
        label: "Rest",
        sequence: 1,
        prescription: {
          mode: "none",
          durationMin: null,
          distanceKm: null,
          repeatCount: null,
          repeatUnit: null,
          recoveryUnit: null,
        },
        guidance: "No running today.",
        target: emptyAiDraftTarget(),
      },
    ],
  };
}

function buildAiDraftSegment(
  segmentType: AiFirstPlanDraft["weeks"][number]["plannedWorkouts"][number]["segments"][number]["segmentType"],
  label: string,
  sequence: number,
  durationMin: number,
  guidance: string,
  paceMinPerKmRange: string | null,
) {
  return {
    segmentId: `${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${sequence}`,
    segmentType,
    label,
    sequence,
    prescription: {
      mode: "time",
      durationMin,
      distanceKm: null,
      repeatCount: null,
      repeatUnit: null,
      recoveryUnit: null,
    },
    guidance,
    target: {
      ...emptyAiDraftTarget(),
      intensity:
        segmentType === "tempo_block" ? "comfortably hard and controlled" : "easy to steady",
      rpe: segmentType === "tempo_block" ? 6 : 4,
      cue: guidance,
      paceMinPerKmRange,
    },
  };
}

function emptyAiDraftTarget() {
  return {
    intensity: null,
    rpe: null,
    cue: null,
    hint: null,
    paceMinPerKmRange: null,
    pace: null,
    hrBpmRange: null,
    hrBpm: null,
    hrTargetSource: null,
    label: null,
    sourceNote: null,
  };
}

function readAiFirstPlanReferenceFixture() {
  try {
    return JSON.parse(
      readFileSync(
        "/Users/ivan/Downloads/ivan_half_marathon_training_plan_v2_full_2026-05-05.json",
        "utf8",
      ),
    ) as unknown;
  } catch {
    return null;
  }
}

function assertAiFirstPlanDraftContract() {
  const authoringInput = buildAiFirstPlanAuthoringInput();
  const referenceFixture = readAiFirstPlanReferenceFixture();
  const prompt = buildAiFirstPlanDraftPrompt({
    authoringInput,
    today: "2026-05-26",
    referenceExample: referenceFixture,
  });

  assert.equal(
    prompt.responseSchema.properties.schemaVersion.enum[0],
    AI_FIRST_PLAN_DRAFT_SCHEMA_VERSION,
    "AI first-plan prompt should expose the draft schema version",
  );
  assert.match(
    prompt.userPrompt,
    /Reference is for richness and weekly structure only/,
    "AI first-plan prompt should use the external plan only as bounded reference guidance",
  );
  assert.doesNotMatch(
    prompt.userPrompt,
    /garmin_sync_placeholder|completion_state|user_feedback_placeholder/,
    "AI first-plan reference guidance must not include runtime placeholder truth",
  );

  const draft = buildAiFirstPlanDraftFixture();
  const normalized = normalizeAiFirstPlanDraftToTrainingPlan({ draft, authoringInput });

  assert.equal(normalized.ok, true, "valid rich AI first-plan draft should normalize");

  if (normalized.ok) {
    assert.equal(
      normalized.metadata.status,
      "ai_authored",
      "valid AI first-plan draft should report ai_authored metadata",
    );
    assert.equal(
      normalized.canonicalPlan.schema_version,
      "training-plan-v2",
      "AI first-plan output should be canonical training-plan-v2",
    );
    assertRichWorkoutContract(normalized.canonicalPlan, "AI first-plan normalized output");
    assertFixedRestDays(normalized.canonicalPlan);
    assertDefaultEstimatedHrGuidance(
      normalized.canonicalPlan,
      "AI first-plan default estimated HR",
    );
    assert.equal(
      hasTargetKey(normalized.canonicalPlan, "pace_min_per_km_range"),
      true,
      "AI first-plan output may keep pace only when backend gates allow it",
    );
  }

  const fakePersonalHrDraft = structuredClone(draft);
  fakePersonalHrDraft.weeks[0]!.plannedWorkouts[0]!.segments[1]!.target.hrBpmRange = "150-160 bpm";
  fakePersonalHrDraft.weeks[0]!.plannedWorkouts[0]!.segments[1]!.target.hrTargetSource =
    "personal_hr_zone";
  const fakePersonalHrNormalized = normalizeAiFirstPlanDraftToTrainingPlan({
    draft: fakePersonalHrDraft,
    authoringInput,
  });

  assert.equal(
    fakePersonalHrNormalized.ok,
    true,
    "AI first-plan normalizer should repair fake personalized HR instead of preserving it",
  );

  if (fakePersonalHrNormalized.ok) {
    assert.equal(
      JSON.stringify(fakePersonalHrNormalized.canonicalPlan).includes("personal_hr_zone"),
      false,
      "AI first-plan normalizer must not preserve fake personal HR-zone source",
    );
    assert.ok(
      fakePersonalHrNormalized.metadata.repairs.some((repair) => /HR target/i.test(repair)),
      "AI first-plan normalizer should make HR repair metadata visible",
    );
  }

  const noPaceAuthoringInput = buildAiFirstPlanAuthoringInput({
    currentLevel: { recentRaceResults: [], recent5kPaceSecondsPerKm: null },
    execution: { watchAccess: "none", guidancePreference: "effort" },
  });
  const unsupportedPaceNormalized = normalizeAiFirstPlanDraftToTrainingPlan({
    draft,
    authoringInput: noPaceAuthoringInput,
  });

  assert.equal(
    unsupportedPaceNormalized.ok,
    true,
    "AI first-plan normalizer should repair unsupported pace targets instead of failing",
  );

  if (unsupportedPaceNormalized.ok) {
    assert.equal(
      hasTargetKey(unsupportedPaceNormalized.canonicalPlan, "pace_min_per_km_range"),
      false,
      "AI first-plan normalizer must strip unsupported pace targets",
    );
    assert.ok(
      unsupportedPaceNormalized.metadata.repairs.some((repair) => /pace target/i.test(repair)),
      "AI first-plan normalizer should make pace repair metadata visible",
    );
  }

  const fixedRestViolationDraft = structuredClone(draft);
  fixedRestViolationDraft.weeks[0]!.plannedWorkouts[2] =
    fixedRestViolationDraft.weeks[0]!.plannedWorkouts[0]!;
  fixedRestViolationDraft.weeks[0]!.plannedWorkouts[2]!.date = "2026-06-03";
  fixedRestViolationDraft.weeks[0]!.plannedWorkouts[2]!.weekday = "Wednesday";
  const fixedRestViolation = normalizeAiFirstPlanDraftToTrainingPlan({
    draft: fixedRestViolationDraft,
    authoringInput,
  });

  assert.equal(fixedRestViolation.ok, false, "fixed rest-day violations should be rejected");

  const incompleteHorizonDraft = structuredClone(draft);
  incompleteHorizonDraft.weeks = [incompleteHorizonDraft.weeks[0]!];
  const incompleteHorizonResult = normalizeAiFirstPlanDraftToTrainingPlan({
    draft: incompleteHorizonDraft,
    authoringInput,
  });

  assert.equal(
    incompleteHorizonResult.ok,
    false,
    "AI first-plan drafts must cover the full requested horizon",
  );

  const oneBlockDraft = structuredClone(draft);
  const longWorkout = oneBlockDraft.weeks[0]!.plannedWorkouts[5]!;
  longWorkout.segments = [longWorkout.segments[1]!];
  const oneBlockResult = normalizeAiFirstPlanDraftToTrainingPlan({
    draft: oneBlockDraft,
    authoringInput,
  });

  assert.equal(oneBlockResult.ok, false, "one-block substantial non-rest workouts are rejected");

  const invalidTaxonomyDraft = structuredClone(draft) as unknown as Record<string, unknown>;
  (
    (invalidTaxonomyDraft.weeks as Array<{ plannedWorkouts: Array<Record<string, unknown>> }>)[0]!
      .plannedWorkouts[0] as Record<string, unknown>
  ).workoutIdentity = "banana_repeats";
  const invalidTaxonomyResult = normalizeAiFirstPlanDraftToTrainingPlan({
    draft: invalidTaxonomyDraft,
    authoringInput,
  });

  assert.equal(invalidTaxonomyResult.ok, false, "invalid AI workout taxonomy is rejected");
}

function assertAiFirstPlanBlueprintGoalFamilyCadence() {
  const fiveDay = ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"];
  const cases = [
    {
      label: "beginner consistency",
      authoringInput: buildGoalFamilyCadenceAuthoringInput({
        goalDistance: "build_consistency",
        goalStyle: "relaxed",
        targetDate: null,
        experienceLevel: "new_runner",
        runningDays: ["Monday", "Thursday", "Saturday"],
      }),
      weeks: Array.from({ length: 6 }, (_value, index) => [
        index === 2 ? "cutback_aerobic_run" : "easy_aerobic_run",
        "steady_aerobic_run",
        index === 5 ? "taper_long_run" : "long_aerobic_run",
      ]),
      expected: ["easy_aerobic_run", "steady_aerobic_run"],
      forbidden: ["controlled_tempo_session", "time_intervals", "race_pace_session"],
      cadence: [],
    },
    {
      label: "5K supported",
      authoringInput: buildGoalFamilyCadenceAuthoringInput({
        goalDistance: "5k",
        goalStyle: "ambitious",
        runningDays: fiveDay,
      }),
      weeks: [
        [
          "easy_aerobic_run",
          "5k_sharpening_repeats",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "time_intervals",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "distance_intervals",
          "steady_aerobic_run",
          "recovery_jog",
          "cutback_long_run",
        ],
        [
          "easy_aerobic_run",
          "controlled_tempo_session",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "5k_sharpening_repeats",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "taper_tuneup_run",
          "steady_aerobic_run",
          "recovery_jog",
          "taper_long_run",
        ],
      ],
      expected: ["5k_sharpening_repeats", "time_intervals"],
      forbidden: ["10k_rhythm_intervals", "marathon_steady_specificity"],
      cadence: [
        "5k_sharpening_repeats",
        "time_intervals",
        "distance_intervals",
        "controlled_tempo_session",
        "taper_tuneup_run",
      ],
    },
    {
      label: "10K supported",
      authoringInput: buildGoalFamilyCadenceAuthoringInput({
        goalDistance: "10k",
        goalStyle: "ambitious",
        runningDays: fiveDay,
      }),
      weeks: [
        [
          "easy_aerobic_run",
          "10k_rhythm_intervals",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "controlled_tempo_session",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "time_intervals",
          "steady_aerobic_run",
          "recovery_jog",
          "cutback_long_run",
        ],
        [
          "easy_aerobic_run",
          "distance_intervals",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "race_pace_session",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "taper_tuneup_run",
          "steady_aerobic_run",
          "recovery_jog",
          "taper_long_run",
        ],
      ],
      expected: ["10k_rhythm_intervals", "race_pace_session"],
      forbidden: ["5k_sharpening_repeats", "mountain_long_run_time_on_feet"],
      cadence: [
        "10k_rhythm_intervals",
        "controlled_tempo_session",
        "time_intervals",
        "distance_intervals",
        "race_pace_session",
        "taper_tuneup_run",
      ],
    },
    {
      label: "half marathon target-time",
      authoringInput: buildGoalFamilyCadenceAuthoringInput({
        goalDistance: "half_marathon",
        goalStyle: "target_time",
        targetTime: "2:00:00",
        runningDays: fiveDay,
      }),
      weeks: [
        [
          "easy_aerobic_run",
          "half_marathon_threshold_durability",
          "steady_aerobic_run",
          "recovery_jog",
          "long_run_with_steady_finish",
        ],
        [
          "easy_aerobic_run",
          "controlled_tempo_session",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "distance_intervals",
          "steady_aerobic_run",
          "recovery_jog",
          "cutback_long_run",
        ],
        [
          "easy_aerobic_run",
          "race_pace_session",
          "steady_aerobic_run",
          "recovery_jog",
          "long_run_with_steady_finish",
        ],
        [
          "easy_aerobic_run",
          "time_intervals",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "taper_tuneup_run",
          "steady_aerobic_run",
          "recovery_jog",
          "taper_long_run",
        ],
      ],
      expected: ["half_marathon_threshold_durability", "race_pace_session"],
      forbidden: ["5k_sharpening_repeats", "mountain_long_run_time_on_feet"],
      cadence: [
        "half_marathon_threshold_durability",
        "controlled_tempo_session",
        "distance_intervals",
        "race_pace_session",
        "time_intervals",
        "taper_tuneup_run",
      ],
    },
    {
      label: "half marathon balanced supported",
      authoringInput: buildGoalFamilyCadenceAuthoringInput({
        goalDistance: "half_marathon",
        goalStyle: "balanced",
        targetTime: null,
        runningDays: fiveDay,
      }),
      weeks: [
        [
          "easy_aerobic_run",
          "steady_aerobic_run",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "progression_run",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "steady_aerobic_run",
          "steady_aerobic_run",
          "recovery_jog",
          "cutback_long_run",
        ],
        [
          "easy_aerobic_run",
          "controlled_tempo_session",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "half_marathon_threshold_durability",
          "steady_aerobic_run",
          "recovery_jog",
          "long_run_with_steady_finish",
        ],
        [
          "easy_aerobic_run",
          "taper_tuneup_run",
          "steady_aerobic_run",
          "recovery_jog",
          "taper_long_run",
        ],
      ],
      expected: [
        "progression_run",
        "controlled_tempo_session",
        "half_marathon_threshold_durability",
      ],
      forbidden: ["5k_sharpening_repeats", "race_pace_session", "mountain_long_run_time_on_feet"],
      cadence: [
        "progression_run",
        "controlled_tempo_session",
        "half_marathon_threshold_durability",
        "taper_tuneup_run",
      ],
    },
    {
      label: "marathon",
      authoringInput: buildGoalFamilyCadenceAuthoringInput({
        goalDistance: "marathon",
        goalStyle: "target_time",
        targetTime: "4:15:00",
        runningDays: fiveDay,
      }),
      weeks: [
        [
          "easy_aerobic_run",
          "marathon_steady_specificity",
          "steady_aerobic_run",
          "recovery_jog",
          "long_run_with_steady_finish",
        ],
        [
          "easy_aerobic_run",
          "steady_aerobic_run",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "controlled_tempo_session",
          "steady_aerobic_run",
          "recovery_jog",
          "cutback_long_run",
        ],
        [
          "easy_aerobic_run",
          "steady_aerobic_run",
          "steady_aerobic_run",
          "recovery_jog",
          "long_run_with_steady_finish",
        ],
        [
          "easy_aerobic_run",
          "marathon_steady_specificity",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "taper_tuneup_run",
          "steady_aerobic_run",
          "recovery_jog",
          "taper_long_run",
        ],
      ],
      expected: ["marathon_steady_specificity", "long_run_with_steady_finish"],
      forbidden: ["5k_sharpening_repeats", "10k_rhythm_intervals"],
      cadence: ["marathon_steady_specificity", "controlled_tempo_session", "taper_tuneup_run"],
    },
    {
      label: "ultra",
      authoringInput: buildGoalFamilyCadenceAuthoringInput({
        goalDistance: "ultra_marathon",
        goalStyle: "balanced",
        runningDays: fiveDay,
      }),
      weeks: [
        [
          "easy_aerobic_run",
          "technical_trail_easy",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "steady_aerobic_run",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "rolling_hills_session",
          "steady_aerobic_run",
          "recovery_jog",
          "hike_run_endurance",
        ],
        [
          "easy_aerobic_run",
          "steady_aerobic_run",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "technical_trail_easy",
          "steady_aerobic_run",
          "recovery_jog",
          "ultra_time_on_feet_durability",
        ],
        [
          "easy_aerobic_run",
          "technical_trail_easy",
          "steady_aerobic_run",
          "recovery_jog",
          "taper_long_run",
        ],
      ],
      expected: ["ultra_time_on_feet_durability", "hike_run_endurance"],
      forbidden: ["5k_sharpening_repeats", "race_pace_session"],
      cadence: [
        "ultra_time_on_feet_durability",
        "hike_run_endurance",
        "technical_trail_easy",
        "rolling_hills_session",
        "climbing_steady_run",
      ],
    },
    {
      label: "mountain/trail",
      authoringInput: buildGoalFamilyCadenceAuthoringInput({
        goalDistance: "mountain_running",
        goalStyle: "ambitious",
        terrainFocus: "mountain",
        runningDays: fiveDay,
      }),
      weeks: [
        [
          "easy_aerobic_run",
          "technical_trail_easy",
          "climbing_steady_run",
          "recovery_jog",
          "mountain_long_run_time_on_feet",
        ],
        [
          "easy_aerobic_run",
          "steady_aerobic_run",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "controlled_downhill_durability",
          "steady_aerobic_run",
          "recovery_jog",
          "hike_run_endurance",
        ],
        [
          "easy_aerobic_run",
          "rolling_hills_session",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "uphill_repeats",
          "climbing_steady_run",
          "recovery_jog",
          "mountain_long_run_time_on_feet",
        ],
        [
          "easy_aerobic_run",
          "technical_trail_easy",
          "steady_aerobic_run",
          "recovery_jog",
          "taper_long_run",
        ],
      ],
      expected: [
        "technical_trail_easy",
        "controlled_downhill_durability",
        "mountain_long_run_time_on_feet",
      ],
      forbidden: ["5k_sharpening_repeats", "race_pace_session"],
      cadence: [
        "technical_trail_easy",
        "controlled_downhill_durability",
        "rolling_hills_session",
        "uphill_repeats",
        "mountain_long_run_time_on_feet",
      ],
    },
  ] as const;

  for (const testCase of cases) {
    const result = normalizeAiFirstPlanBlueprintToTrainingPlan({
      blueprint: buildGoalFamilyCadenceBlueprint({
        planName: `${testCase.label} cadence`,
        goalSummary: testCase.label,
        authoringInput: testCase.authoringInput,
        weeklyIdentities: testCase.weeks,
      }),
      authoringInput: testCase.authoringInput,
    });

    assert.equal(
      result.ok,
      true,
      result.ok
        ? `${testCase.label} goal-family cadence should normalize`
        : `${testCase.label} goal-family cadence should normalize: ${JSON.stringify(result.issues)}`,
    );

    if (!result.ok) continue;

    const firstSix = firstSixWeekIdentityReport(result.canonicalPlan);
    const identities = new Set(firstSix.flat());

    for (const expected of testCase.expected) {
      assert.ok(identities.has(expected), `${testCase.label}: expected ${expected}`);
    }

    for (const forbidden of testCase.forbidden) {
      assert.ok(!identities.has(forbidden), `${testCase.label}: should not include ${forbidden}`);
    }

    if (testCase.cadence.length > 0) {
      assertGoalFamilyCadence(firstSix, [...testCase.cadence], testCase.label);
      assert.ok(
        !onlyGenericSupportIdentities(firstSix),
        `${testCase.label}: supported plan should not collapse into generic support filler`,
      );
    }
  }

  const genericBalancedHalfInput = buildGoalFamilyCadenceAuthoringInput({
    goalDistance: "half_marathon",
    goalStyle: "balanced",
    targetTime: null,
    runningDays: fiveDay,
  });
  const genericBalancedHalfResult = normalizeAiFirstPlanBlueprintToTrainingPlan({
    blueprint: buildGoalFamilyCadenceBlueprint({
      planName: "Generic balanced half cadence should fail",
      goalSummary: "balanced half without early specificity",
      authoringInput: genericBalancedHalfInput,
      weeklyIdentities: Array.from({ length: 6 }, (_value, index) => [
        "easy_aerobic_run",
        "steady_aerobic_run",
        "steady_aerobic_run",
        "recovery_jog",
        index === 2 ? "cutback_long_run" : index === 5 ? "taper_long_run" : "long_aerobic_run",
      ]),
    }),
    authoringInput: genericBalancedHalfInput,
  });

  assert.equal(
    genericBalancedHalfResult.ok,
    false,
    "supported balanced half-marathon blueprints should not pass with empty early cadence",
  );

  if (!genericBalancedHalfResult.ok) {
    assert.ok(
      genericBalancedHalfResult.issues.some(
        (issue) => issue.code === "missing_required_goal_family_cadence",
      ),
      "supported balanced half-marathon fallback should explain missing required cadence",
    );
  }
}

function firstSixWeekIdentityReport(plan: TrainingPlanV2) {
  return Array.from({ length: 6 }, (_value, weekIndex) =>
    nonRestWorkouts(plan)
      .filter((workout) => workout.week_number === weekIndex + 1)
      .map(
        (workout) =>
          workout.source_workout_type ?? workout.workout_identity ?? workout.workout_type,
      ),
  );
}

function onlyGenericSupportIdentities(firstSixWeekIdentities: Array<Array<string | null>>) {
  const generic = new Set([
    "easy_aerobic_run",
    "steady_aerobic_run",
    "recovery_jog",
    "long_aerobic_run",
  ]);

  return firstSixWeekIdentities.flat().every((identity) => identity && generic.has(identity));
}

function assertGoalFamilyCadence(
  firstSixWeekIdentities: Array<Array<string | null>>,
  cadenceIdentities: string[],
  label: string,
) {
  const cadenceSet = new Set(cadenceIdentities);

  for (let index = 0; index < firstSixWeekIdentities.length; index += 2) {
    const current = firstSixWeekIdentities[index] ?? [];
    const next = firstSixWeekIdentities[index + 1] ?? [];
    const hasCadence = [...current, ...next].some((identity) =>
      identity ? cadenceSet.has(identity) : false,
    );

    assert.ok(
      hasCadence,
      `${label}: expected goal-family cadence in weeks ${index + 1}-${index + 2}`,
    );
  }
}

function assertAiFirstPlanBlueprintContract() {
  const authoringInput = buildAiFirstPlanAuthoringInput();
  const referenceFixture = readAiFirstPlanReferenceFixture();
  const prompt = buildAiFirstPlanBlueprintPrompt({
    authoringInput,
    today: "2026-05-26",
    referenceExample: referenceFixture,
  });

  assert.equal(
    prompt.responseSchema.properties.schemaVersion.enum[0],
    AI_FIRST_PLAN_BLUEPRINT_SCHEMA_VERSION,
    "AI first-plan blueprint prompt should expose the blueprint schema version",
  );
  assert.match(
    prompt.systemPrompt,
    /backend expands it into canonical training-plan-v2/,
    "AI first-plan blueprint prompt should make backend expansion ownership explicit",
  );
  assert.doesNotMatch(
    prompt.userPrompt,
    /garmin_sync_placeholder|completion_state|user_feedback_placeholder/,
    "AI first-plan blueprint prompt must not include runtime placeholder truth",
  );
  assert.match(
    prompt.userPrompt,
    /Required authored workout slots/,
    "AI first-plan blueprint prompt should provide exact required date slots",
  );
  assert.match(
    prompt.userPrompt,
    /mustBeQuality/,
    "AI first-plan blueprint prompt should require quality slots for supported road target-time plans",
  );
  assert.match(
    prompt.userPrompt,
    /Goal-family identity policy/,
    "AI first-plan blueprint prompt should expose the backend goal-family identity policy",
  );
  assert.match(
    prompt.systemPrompt,
    /required cadence slots/,
    "AI first-plan blueprint prompt should require goal-family cadence slots for supported plans",
  );
  assert.equal(
    prompt.responseSchema.properties.weeks.items.properties.plannedWorkouts.minItems,
    authoringInput.availability.maxRunningDaysPerWeek,
    "AI first-plan blueprint response schema should require the validated weekly running-day count",
  );
  assert.equal(
    prompt.responseSchema.properties.weeks.items.properties.plannedWorkouts.maxItems,
    authoringInput.availability.maxRunningDaysPerWeek,
    "AI first-plan blueprint response schema should reject extra authored weekly workouts",
  );
  assert.doesNotMatch(
    JSON.stringify(prompt.responseSchema.properties.weeks.items.properties.plannedWorkouts),
    /rest_and_recovery/,
    "AI first-plan blueprint authored workout schema should exclude rest identities",
  );

  const blueprint = buildAiFirstPlanBlueprintFixture();
  const normalized = normalizeAiFirstPlanBlueprintToTrainingPlan({ blueprint, authoringInput });

  assert.equal(normalized.ok, true, "valid compact AI first-plan blueprint should normalize");

  if (normalized.ok) {
    assert.equal(
      normalized.metadata.status,
      "ai_authored",
      "valid AI first-plan blueprint should report ai_authored metadata",
    );
    assert.equal(
      normalized.metadata.source,
      "openai_ai_first_plan_blueprint",
      "valid AI first-plan blueprint should report blueprint source metadata",
    );
    assert.equal(
      normalized.canonicalPlan.source_kind,
      "ai_first_plan_blueprint_v1",
      "AI first-plan blueprint output should be source-visible canonical training-plan-v2",
    );
    assertRichWorkoutContract(normalized.canonicalPlan, "AI first-plan blueprint output");
    assertFixedRestDays(normalized.canonicalPlan);
    assertDefaultEstimatedHrGuidance(
      normalized.canonicalPlan,
      "AI first-plan blueprint default estimated HR",
    );
    assert.equal(
      hasTargetKey(normalized.canonicalPlan, "pace_min_per_km_range"),
      true,
      "AI first-plan blueprint may keep pace only when backend gates allow it",
    );
    assertRoadPerformanceQualityCadence(normalized.canonicalPlan, "valid AI first-plan blueprint");
    assert.equal(
      normalized.canonicalPlan.planned_workouts.some(
        (workout) =>
          workout.workout_type !== "rest" &&
          workout.segments.length < 3 &&
          workoutDurationMin(workout) >= 35,
      ),
      false,
      "AI first-plan blueprint expansion must not create one-block substantial workouts",
    );
  }

  const identityAuthoringInput = buildAiFirstPlanAuthoringInput({
    schedule: {
      startDate: "2026-06-01",
      targetDate: "2026-06-14",
      preparationHorizonWeeks: 2,
    },
  });
  const identityBlueprint = buildAiFirstPlanBlueprintIdentityFixture();
  const identityNormalized = normalizeAiFirstPlanBlueprintToTrainingPlan({
    blueprint: identityBlueprint,
    authoringInput: identityAuthoringInput,
  });

  assert.equal(
    identityNormalized.ok,
    true,
    identityNormalized.ok
      ? "AI first-plan blueprint identity matrix should normalize"
      : `AI first-plan blueprint identity matrix should normalize: ${JSON.stringify(
          identityNormalized.issues,
        )}`,
  );

  if (identityNormalized.ok) {
    const plan = identityNormalized.canonicalPlan;
    assertBlueprintIdentityExpansion(plan, "half_marathon_threshold_durability", [
      /threshold/i,
      /sustained|durability/i,
    ]);
    assertBlueprintIdentityExpansion(plan, "long_run_with_steady_finish", [/steady finish/i]);
    assertBlueprintIdentityExpansion(plan, "time_intervals", [/repeat|3 min/i], true);
    assertBlueprintIdentityExpansion(plan, "distance_intervals", [/400m|distance/i], true);
    assertBlueprintIdentityExpansion(plan, "controlled_tempo_session", [/tempo|controlled/i]);
    assertBlueprintIdentityExpansion(plan, "recovery_jog", [/recovery/i]);
    assertBlueprintIdentityExpansion(plan, "steady_aerobic_run", [/steady aerobic/i]);
    assertBlueprintIdentityExpansion(plan, "easy_aerobic_run", [/easy aerobic|conversational/i]);
    assert.deepEqual(
      nonRestWorkouts(plan)
        .filter((workout) => workoutDurationMin(workout) >= 35)
        .filter((workout) => workout.segments.length < 3)
        .map((workout) => workout.source_workout_type),
      [],
      "AI first-plan blueprint identity expansion should not create substantial one-block shells",
    );
    assertNoHrOnMainTargetsForIdentities(
      plan,
      [
        "time_intervals",
        "distance_intervals",
        "rolling_hills_session",
        "uphill_repeats",
        "technical_trail_easy",
        "climbing_steady_run",
      ],
      "AI first-plan blueprint identity expansion",
    );
  }

  const missingIdentityAuthoringInput = buildAiFirstPlanAuthoringInput({
    goal: {
      goalType: "mountain_running",
      goalLabel: "Mountain running",
      goalStyle: "ambitious",
      targetTime: null,
    },
    preferences: {
      terrainFocus: "mountain",
      preferredWorkoutMix: "balanced",
      strengthTraining: "some",
    },
    schedule: {
      startDate: "2026-07-06",
      targetDate: "2026-07-12",
      preparationHorizonWeeks: 1,
    },
  });
  const missingIdentityBlueprint = buildAiFirstPlanBlueprintMissingIdentityFixture();
  const missingIdentityNormalized = normalizeAiFirstPlanBlueprintToTrainingPlan({
    blueprint: missingIdentityBlueprint,
    authoringInput: missingIdentityAuthoringInput,
  });

  assert.equal(
    missingIdentityNormalized.ok,
    true,
    missingIdentityNormalized.ok
      ? "AI first-plan blueprint full identity coverage should normalize"
      : `AI first-plan blueprint full identity coverage should normalize: ${JSON.stringify(
          missingIdentityNormalized.issues,
        )}`,
  );

  if (missingIdentityNormalized.ok) {
    const plan = missingIdentityNormalized.canonicalPlan;
    assertBlueprintIdentityExpansion(plan, "technical_trail_easy", [/technical|trail|footing/i]);
    assertBlueprintIdentityExpansion(plan, "climbing_steady_run", [/climbing|hill|grade/i]);
    assertBlueprintIdentityExpansion(plan, "mountain_long_run_time_on_feet", [
      /mountain|time-on-feet|terrain/i,
      /fueling|hydration|effort/i,
    ]);
    assert.deepEqual(
      nonRestWorkouts(plan)
        .filter((workout) => workoutDurationMin(workout) >= 35)
        .filter((workout) => workout.segments.length < 3)
        .map((workout) => workout.source_workout_type),
      [],
      "AI first-plan blueprint full identity coverage should not create substantial one-block shells",
    );
    assertNoHrOnMainTargetsForIdentities(
      plan,
      ["mountain_long_run_time_on_feet"],
      "AI first-plan blueprint full identity coverage",
    );
  }

  const noPaceAuthoringInput = buildAiFirstPlanAuthoringInput({
    currentLevel: { recentRaceResults: [], recent5kPaceSecondsPerKm: null },
    execution: { watchAccess: "none", guidancePreference: "effort" },
  });
  const unsupportedPaceNormalized = normalizeAiFirstPlanBlueprintToTrainingPlan({
    blueprint,
    authoringInput: noPaceAuthoringInput,
  });

  assert.equal(
    unsupportedPaceNormalized.ok,
    true,
    "AI first-plan blueprint normalizer should repair unsupported pace intent instead of failing",
  );

  if (unsupportedPaceNormalized.ok) {
    assert.equal(
      hasTargetKey(unsupportedPaceNormalized.canonicalPlan, "pace_min_per_km_range"),
      false,
      "AI first-plan blueprint normalizer must strip unsupported pace targets",
    );
  }

  const fixedRestViolationBlueprint = structuredClone(blueprint);
  fixedRestViolationBlueprint.weeks[0]!.plannedWorkouts[0]!.date = "2026-06-03";
  fixedRestViolationBlueprint.weeks[0]!.plannedWorkouts[0]!.weekday = "Wednesday";
  const fixedRestViolation = normalizeAiFirstPlanBlueprintToTrainingPlan({
    blueprint: fixedRestViolationBlueprint,
    authoringInput,
  });

  assert.equal(fixedRestViolation.ok, false, "blueprint fixed rest-day violations are rejected");

  const missingQualityBlueprint = structuredClone(blueprint);
  missingQualityBlueprint.weeks[0]!.plannedWorkouts[1] = {
    ...missingQualityBlueprint.weeks[0]!.plannedWorkouts[1]!,
    workoutFamily: "steady",
    workoutIdentity: "steady_aerobic_run",
    calendarIconKey: "steady",
    title: "Steady aerobic run",
    segmentIntent: "steady_aerobic",
  };
  const missingQualityResult = normalizeAiFirstPlanBlueprintToTrainingPlan({
    blueprint: missingQualityBlueprint,
    authoringInput,
  });

  assert.equal(
    missingQualityResult.ok,
    false,
    "supported road target-time blueprints must preserve required weekly quality cadence",
  );

  const invalidTaxonomyBlueprint = structuredClone(blueprint) as unknown as Record<string, unknown>;
  (
    (
      invalidTaxonomyBlueprint.weeks as Array<{ plannedWorkouts: Array<Record<string, unknown>> }>
    )[0]!.plannedWorkouts[0] as Record<string, unknown>
  ).workoutIdentity = "banana_repeats";
  const invalidTaxonomyResult = normalizeAiFirstPlanBlueprintToTrainingPlan({
    blueprint: invalidTaxonomyBlueprint,
    authoringInput,
  });

  assert.equal(invalidTaxonomyResult.ok, false, "invalid blueprint taxonomy is rejected");

  const fakeHrBlueprint = structuredClone(blueprint);
  fakeHrBlueprint.weeks[0]!.plannedWorkouts[0]!.summary =
    "Easy run with fake 150-160 bpm personal threshold HR.";
  const fakeHrResult = normalizeAiFirstPlanBlueprintToTrainingPlan({
    blueprint: fakeHrBlueprint,
    authoringInput,
  });

  assert.equal(fakeHrResult.ok, false, "fake personalized HR claims in blueprint are rejected");
}

function assertBlueprintIdentityExpansion(
  plan: TrainingPlanV2,
  identity: CanonicalWorkoutIdentity,
  expectedPatterns: RegExp[],
  expectRepeatBlock = false,
) {
  const workout = plan.planned_workouts.find(
    (candidate) => candidate.source_workout_type === identity,
  );

  assert.ok(workout, `AI first-plan blueprint should include ${identity}`);
  assert.ok(
    workout.segments.length >= 3,
    `AI first-plan blueprint ${identity} should expand into executable segment structure`,
  );

  const segmentText = JSON.stringify(workout.segments);

  for (const pattern of expectedPatterns) {
    assert.match(
      segmentText,
      pattern,
      `AI first-plan blueprint ${identity} should include identity-specific guidance matching ${pattern}`,
    );
  }

  if (expectRepeatBlock) {
    assert.ok(
      (workout.segments as SegmentRecord[]).some(
        (segment) =>
          segment.segment_type === "interval_block" &&
          (segment.prescription as Record<string, unknown> | undefined)?.mode === "repeats",
      ),
      `AI first-plan blueprint ${identity} should use repeat-aware interval structure`,
    );
  }
}

async function assertAiFirstPlanDraftServiceContract() {
  const authoringInput = buildAiFirstPlanAuthoringInput();
  const referenceFixture = readAiFirstPlanReferenceFixture();
  const draft = buildAiFirstPlanDraftFixture();
  const blueprint = buildAiFirstPlanBlueprintFixture();
  const validResult = await generateAiFirstPlanDraftPreview({
    input: authoringInput,
    inputKind: "structured_authoring",
    referenceExample: referenceFixture,
    today: "2026-05-26",
    apiKey: "test-openai-key",
    model: "test-ai-first-plan-model",
    timeoutMs: 1_000,
    fetchImpl: (async () =>
      openAiFixtureResponse("ai-first-plan-blueprint-valid", blueprint)) as typeof fetch,
  });

  assert.equal(validResult.ok, true, "AI first-plan service should return a bounded result");

  if (validResult.ok) {
    assert.equal(
      validResult.metadata.status,
      "ai_authored",
      "valid AI first-plan service draft should preserve ai_authored status",
    );
    assert.equal(
      validResult.metadata.responseId,
      "ai-first-plan-blueprint-valid",
      "AI first-plan service should expose bounded response id metadata",
    );
    assert.equal(
      validResult.metadata.source,
      "openai_ai_first_plan_blueprint",
      "AI first-plan service should default to the compact blueprint contract",
    );
    assert.equal(
      validResult.canonicalPlan.schema_version,
      "training-plan-v2",
      "AI first-plan service should return normalized training-plan-v2",
    );
  }

  const strictDiagnosticResult = await generateAiFirstPlanDraftPreview({
    input: authoringInput,
    inputKind: "structured_authoring",
    referenceExample: referenceFixture,
    today: "2026-05-26",
    apiKey: "test-openai-key",
    model: "test-ai-first-plan-model",
    contractMode: "strict_draft",
    timeoutMs: 1_000,
    fetchImpl: (async () => openAiFixtureResponse("ai-first-plan-valid", draft)) as typeof fetch,
  });

  assert.equal(
    strictDiagnosticResult.ok,
    true,
    "strict diagnostic AI first-plan service path should remain available",
  );

  if (strictDiagnosticResult.ok) {
    assert.equal(
      strictDiagnosticResult.metadata.source,
      "openai_ai_first_plan_draft",
      "strict diagnostic path should preserve draft source metadata",
    );
  }

  const invalidResult = await generateAiFirstPlanDraftPreview({
    input: authoringInput,
    inputKind: "structured_authoring",
    apiKey: "test-openai-key",
    model: "test-ai-first-plan-model",
    timeoutMs: 1_000,
    fetchImpl: (async () =>
      openAiFixtureResponse("ai-first-plan-invalid", {
        schemaVersion: AI_FIRST_PLAN_BLUEPRINT_SCHEMA_VERSION,
        planName: "Invalid",
        weeks: [],
      })) as typeof fetch,
  });

  assert.equal(
    invalidResult.ok,
    false,
    "invalid AI first-plan service draft should return bounded blueprint-unavailable failure",
  );

  if (!invalidResult.ok && invalidResult.reason === "ai_first_plan_blueprint_unavailable") {
    assert.equal(
      invalidResult.metadata.sourceStatus,
      "blueprint_unavailable",
      "invalid AI first-plan service draft should not become deterministic fallback",
    );
    assert.equal(
      invalidResult.metadata.fallbackReason,
      "ai_first_plan_blueprint_schema_invalid",
      "invalid AI first-plan service draft should expose validation fallback reason",
    );
    assert.ok(
      invalidResult.metadata.validationIssueCount > 0,
      "invalid AI first-plan service draft should expose bounded validation issue count",
    );
  }

  const timeoutResult = await generateAiFirstPlanDraftPreview({
    input: authoringInput,
    inputKind: "structured_authoring",
    apiKey: "test-openai-key",
    model: "test-ai-first-plan-model",
    timeoutMs: 5,
    fetchImpl: (async () => new Promise<Response>(() => undefined)) as typeof fetch,
  });

  assert.equal(
    timeoutResult.ok,
    false,
    "timed-out AI first-plan service should return bounded blueprint-unavailable failure",
  );

  if (!timeoutResult.ok && timeoutResult.reason === "ai_first_plan_blueprint_unavailable") {
    assert.equal(
      timeoutResult.metadata.sourceStatus,
      "blueprint_unavailable",
      "timed-out AI first-plan service should not become deterministic fallback",
    );
    assert.equal(
      timeoutResult.metadata.fallbackReason,
      "ai_first_plan_blueprint_timed_out",
      "timed-out AI first-plan service should expose timeout fallback reason",
    );
  }
}

async function assertStructuredFirstPlanDraftBlueprintReviewContract() {
  const availability = {
    runningDaysPerWeek: 2,
    fixedRestDays: ["Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    preferredLongRunDay: "Tuesday",
  } satisfies StructuredFirstPlanOnboardingRequestInput["availability"];
  const initialInput = parseStructuredFirstPlanOnboardingInput(
    buildRequest("half_marathon", {
      availability,
      goal: {
        goalDistance: "half_marathon",
        goalStyle: "target_time",
        terrainFocus: "standard",
        targetTime: "2:00:00",
        targetDate: "2026-06-14",
      },
    }),
  );
  const initialAuthoringInput = buildStructuredFirstPlanAuthoringInput(initialInput);
  const targetDate = addDaysIso(initialAuthoringInput.schedule.startDate, 13);
  const input = parseStructuredFirstPlanOnboardingInput(
    buildRequest("half_marathon", {
      availability,
      goal: {
        goalDistance: "half_marathon",
        goalStyle: "target_time",
        terrainFocus: "standard",
        targetTime: "2:00:00",
        targetDate,
      },
    }),
  );
  const authoringInput = buildStructuredFirstPlanAuthoringInput(input);
  const blueprint = buildMinimalAiFirstPlanBlueprintForAuthoringInput(authoringInput);
  const aiResult = await generateStructuredFirstPlanDraftForUser("doctrine-fixture-user", input, {
    aiPreview: {
      apiKey: "test-openai-key",
      model: "test-ai-first-plan-model",
      timeoutMs: 1_000,
      fetchImpl: (async () =>
        openAiFixtureResponse("structured-first-plan-blueprint-valid", blueprint)) as typeof fetch,
    },
  });

  assert.equal(aiResult.ok, true, "structured first-plan draft should return a bounded result");
  assert.equal(aiResult.status, "draft_ready", "structured first-plan draft should be ready");

  if (aiResult.ok && aiResult.status === "draft_ready") {
    assert.equal(
      aiResult.sourceKind,
      "ai_first_plan_blueprint_v1",
      "structured first-plan draft should expose AI blueprint source kind",
    );
    assert.equal(
      aiResult.generation.sourceStatus,
      "ai_authored",
      "structured first-plan draft should expose AI-authored source status",
    );
    assert.equal(
      aiResult.draft.canonicalPlan.source_kind,
      "ai_first_plan_blueprint_v1",
      "structured first-plan draft should review canonical AI blueprint plan truth",
    );
    assert.ok(
      aiResult.draft.draftToken.includes(":"),
      "structured first-plan draft should include a signed reviewed-plan token",
    );
    assertRichWorkoutContract(aiResult.draft.canonicalPlan, "structured first-plan AI draft");
    assertFixedRestDays(aiResult.draft.canonicalPlan);
  }

  const invalidResult = await generateStructuredFirstPlanDraftForUser(
    "doctrine-fixture-user",
    input,
    {
      aiPreview: {
        apiKey: "test-openai-key",
        model: "test-ai-first-plan-model",
        timeoutMs: 1_000,
        fetchImpl: (async () =>
          openAiFixtureResponse("structured-first-plan-blueprint-invalid", {
            schemaVersion: AI_FIRST_PLAN_BLUEPRINT_SCHEMA_VERSION,
            planName: "Invalid",
            weeks: [],
          })) as typeof fetch,
      },
    },
  );

  assert.equal(
    invalidResult.ok,
    false,
    "invalid blueprint structured first-plan draft should return bounded failure",
  );
  assert.equal(
    invalidResult.status,
    "draft_failed",
    "invalid blueprint must not produce a reviewable deterministic draft",
  );

  if (!invalidResult.ok && invalidResult.status === "draft_failed") {
    assert.equal(
      invalidResult.generation.sourceStatus,
      "blueprint_unavailable",
      "invalid blueprint structured draft should expose unavailable status",
    );
    assert.equal(
      invalidResult.generation.fallbackReason,
      "ai_first_plan_blueprint_schema_invalid",
      "invalid blueprint structured draft should expose bounded fallback reason",
    );
    assert.equal(
      invalidResult.generation.sourceKind,
      "ai_first_plan_blueprint_v1",
      "invalid blueprint structured draft should keep the blueprint source boundary",
    );
  }

  const timeoutResult = await generateStructuredFirstPlanDraftForUser(
    "doctrine-fixture-user",
    input,
    {
      aiPreview: {
        apiKey: "test-openai-key",
        model: "test-ai-first-plan-model",
        timeoutMs: 5,
        fetchImpl: (async () => new Promise<Response>(() => undefined)) as typeof fetch,
      },
    },
  );

  assert.equal(
    timeoutResult.ok,
    false,
    "timed-out blueprint structured first-plan draft should return bounded failure",
  );

  if (!timeoutResult.ok && timeoutResult.status === "draft_failed") {
    assert.equal(
      timeoutResult.generation.sourceStatus,
      "blueprint_unavailable",
      "timed-out blueprint structured draft should expose unavailable status",
    );
    assert.equal(
      timeoutResult.generation.fallbackReason,
      "ai_first_plan_blueprint_timed_out",
      "timed-out blueprint structured draft should expose bounded timeout reason",
    );
    assert.ok(
      !("draft" in timeoutResult),
      "timed-out blueprint structured draft must not include a reviewed-plan token",
    );
  }
}

function assertReviewedFirstPlanPersistenceExactness() {
  const reviewedPlan = buildReviewedFirstPlanExactnessFixture();
  const seed = buildReviewedFirstPlanImportedSeed(reviewedPlan);
  const rows = buildPersistedWorkoutInsertRows("reviewed-plan", "reviewed-user", seed.workouts);

  assert.equal(
    seed.workouts.length,
    reviewedPlan.planned_workouts.length,
    "reviewed first-plan persistence seed should keep every reviewed calendar row",
  );
  assert.equal(
    seed.endDate,
    "2026-06-01",
    "reviewed first-plan persistence seed should keep trailing reviewed calendar days",
  );
  assert.equal(
    rows.length,
    reviewedPlan.planned_workouts.length,
    "reviewed first-plan persisted rows should match reviewed row count exactly",
  );
  assert.equal(
    rows.at(-1)?.workout_date,
    "2026-06-01",
    "reviewed first-plan persisted rows should keep reviewed final date",
  );

  const reviewedRestRow = rows.find((row) => row.workout_date === "2026-05-31");
  assert.ok(reviewedRestRow, "reviewed rest day should be persisted");
  assert.equal(
    reviewedRestRow?.title,
    "Rest and recovery",
    "reviewed rest day title should not be rewritten into synthetic fixed-rest copy",
  );
  assert.equal(
    reviewedRestRow?.notes,
    "No run today; protect recovery.",
    "reviewed rest day notes should come from the reviewed canonical row",
  );
  assert.deepEqual(
    reviewedRestRow?.steps,
    [],
    "reviewed rest day should keep the canonical empty persisted steps shape",
  );
  assert.notEqual(
    reviewedRestRow?.notes,
    "Fixed weekday rest day.",
    "reviewed first-plan confirm must not insert synthetic fixed-rest notes",
  );

  const invalidReviewedPlan: TrainingPlanV2 = {
    ...reviewedPlan,
    planned_workouts: reviewedPlan.planned_workouts.map((workout) =>
      workout.date === "2026-05-31"
        ? {
            ...workout,
            workout_type: "easy",
            source_workout_type: "easy_aerobic_run",
            workout_family: "easy",
            workout_identity: "easy_aerobic_run",
            calendar_icon_key: "easy",
            title: "Invalid fixed-rest run",
            summary: "This tampered draft tries to place running on a fixed rest day.",
            segments: [
              {
                segment_id: "invalid-main",
                segment_type: "main",
                label: "Easy run",
                sequence: 1,
                guidance: "This should be rejected before persistence.",
                prescription: { mode: "time", duration_min: 30 },
              },
            ],
          }
        : workout,
    ),
  };

  assert.throws(
    () => buildReviewedFirstPlanImportedSeed(invalidReviewedPlan),
    /Fixed rest-day constraints would be violated/,
    "reviewed first-plan persistence should validate fixed rest days without rewriting",
  );
}

function buildReviewedFirstPlanExactnessFixture(): TrainingPlanV2 {
  const metricMode = {
    guidance: "effort" as const,
    pace_targets_allowed: false,
    hr_targets_allowed: false,
    hr_target_source: "effort_only" as const,
    reason: "Fixture stays effort-only.",
  };
  const goalContext = {
    goal_type: "half_marathon",
    goal_style: "target_time",
    terrain_focus: "standard" as const,
    target_date: "2026-06-01",
    target_time: "2:00:00",
  };

  return {
    schema_version: "training-plan-v2",
    plan_name: "Reviewed AI blueprint exactness fixture",
    source_kind: "ai_first_plan_blueprint_v1",
    generated_for: "Doctrine fixture",
    goal: {
      goal_type: "half_marathon",
      goal_label: "Half marathon target-time plan",
      target_event: { date: "2026-06-01" },
    },
    runner_profile: {
      experience_level: "returning_runner",
      baseline_sessions_per_week: 2,
      baseline_long_run_duration_min: 45,
      age: 34,
      primary_goal: "Half marathon",
    },
    start_date: "2026-05-30",
    preparation_horizon_weeks: 1,
    target_date: "2026-06-01",
    plan_preferences: {
      preferred_run_days: ["Saturday"],
      blocked_days: ["Sunday"],
      max_running_days_per_week: 1,
      preferred_long_run_day: "Saturday",
    },
    training_constraints: {
      running_days_per_week: 1,
      full_rest_days: ["Sunday"],
      long_run_day: "Saturday",
    },
    planned_workouts: [
      {
        workout_id: "reviewed-easy-2026-05-30",
        date: "2026-05-30",
        weekday: "Saturday",
        week_number: 1,
        phase: "Base",
        workout_type: "easy",
        source_workout_type: "easy_aerobic_run",
        workout_family: "easy",
        workout_identity: "easy_aerobic_run",
        calendar_icon_key: "easy",
        goal_context: goalContext,
        metric_mode: metricMode,
        title: "Easy aerobic run",
        summary: "A reviewed easy run with visible structure.",
        planned_rpe: 4,
        estimated_fatigue: "low",
        recovery_priority: "medium",
        segments: [
          {
            segment_id: "easy-warmup",
            segment_type: "warmup",
            label: "Ease in",
            sequence: 1,
            guidance: "Start relaxed and conversational.",
            prescription: { mode: "time", duration_min: 8 },
          },
          {
            segment_id: "easy-main",
            segment_type: "main",
            label: "Easy aerobic",
            sequence: 2,
            guidance: "Stay smooth and effort-led.",
            prescription: { mode: "time", duration_min: 24 },
          },
          {
            segment_id: "easy-finish",
            segment_type: "cooldown",
            label: "Easy finish",
            sequence: 3,
            guidance: "Finish lighter than you started.",
            prescription: { mode: "time", duration_min: 8 },
          },
        ],
      },
      {
        workout_id: "reviewed-rest-2026-05-31",
        date: "2026-05-31",
        weekday: "Sunday",
        week_number: 1,
        phase: "Base",
        workout_type: "rest",
        source_workout_type: "rest_and_recovery",
        workout_family: "rest",
        workout_identity: "rest_and_recovery",
        calendar_icon_key: "rest",
        goal_context: goalContext,
        metric_mode: metricMode,
        title: "Rest and recovery",
        summary: "Reviewed rest day should persist exactly.",
        estimated_fatigue: "low",
        recovery_priority: "high",
        segments: [
          {
            segment_id: "reviewed-rest",
            segment_type: "rest",
            label: "Rest and recovery",
            sequence: 1,
            guidance: "No run today; protect recovery.",
            prescription: { mode: "none" },
          },
        ],
      },
      {
        workout_id: "reviewed-trailing-rest-2026-06-01",
        date: "2026-06-01",
        weekday: "Monday",
        week_number: 1,
        phase: "Base",
        workout_type: "rest",
        source_workout_type: "rest_and_recovery",
        workout_family: "rest",
        workout_identity: "rest_and_recovery",
        calendar_icon_key: "rest",
        goal_context: goalContext,
        metric_mode: metricMode,
        title: "Trailing reviewed rest",
        summary: "Reviewed trailing calendar day should not be dropped.",
        estimated_fatigue: "low",
        recovery_priority: "medium",
        segments: [
          {
            segment_id: "reviewed-trailing-rest",
            segment_type: "rest",
            label: "Rest",
            sequence: 1,
            guidance: "Keep the reviewed trailing day in saved mode.",
            prescription: { mode: "none" },
          },
        ],
      },
    ],
  };
}

function buildMinimalAiFirstPlanBlueprintForAuthoringInput(
  authoringInput: ReturnType<typeof buildStructuredFirstPlanAuthoringInput>,
): AiFirstPlanBlueprint {
  const startDate = authoringInput.schedule.startDate;
  const runningDays = authoringInput.availability.preferredRunningDays.filter(
    (weekday) => !authoringInput.availability.unavailableDays.includes(weekday),
  );
  const horizonWeeks = 2;

  return {
    schemaVersion: AI_FIRST_PLAN_BLUEPRINT_SCHEMA_VERSION,
    planName: "AI blueprint first-plan review fixture",
    generatedFor: "Doctrine fixture",
    goalSummary: "Half marathon target-time plan",
    startDate,
    targetDate: authoringInput.schedule.targetDate ?? addDaysIso(startDate, 13),
    preparationHorizonWeeks: horizonWeeks,
    planPreferences: {
      preferredRunningDays: authoringInput.availability.preferredRunningDays,
      fixedRestDays: authoringInput.availability.unavailableDays,
      preferredLongRunDay: authoringInput.availability.preferredLongRunDay,
      maxRunningDaysPerWeek: authoringInput.availability.maxRunningDaysPerWeek,
    },
    reviewAssumptions: [
      "Backend expands compact workout intent into canonical segments and metric truth.",
    ],
    metricPolicySummary:
      "AI supplies metric intent only; backend applies pace gates and default estimated HR policy.",
    weeks: Array.from({ length: horizonWeeks }, (_value, weekIndex) => ({
      weekNumber: weekIndex + 1,
      phase: weekIndex === 0 ? "Base" : "Build",
      theme: weekIndex === 0 ? "Set rhythm" : "Progress durability",
      microcycleIntent: "Keep the compact AI-authored week simple but reviewable.",
      cutbackWeek: false,
      taperWeek: false,
      longRunIntent: "Keep the long run on the reviewed preferred long-run day.",
      longRunProgression: "Progress long-run durability conservatively.",
      plannedWorkouts: runningDays.map((weekday) => {
        const isLongRun = weekday === authoringInput.availability.preferredLongRunDay;
        const date = dateForWeekdayInSevenDayWindow(addDaysIso(startDate, weekIndex * 7), weekday);

        return {
          date,
          weekday,
          workoutFamily: isLongRun ? "long" : "easy",
          workoutIdentity: isLongRun ? "long_aerobic_run" : "easy_aerobic_run",
          calendarIconKey: isLongRun ? "long" : "easy",
          title: isLongRun ? "Long aerobic run" : "Easy aerobic run",
          summary: isLongRun
            ? "Reviewable long-run durability from the AI-authored blueprint."
            : "Reviewable easy support running from the AI-authored blueprint.",
          plannedRpe: isLongRun ? 5 : 4,
          estimatedFatigue: isLongRun ? "medium" : "low",
          recoveryPriority: isLongRun ? "high" : "medium",
          segmentIntent: isLongRun ? "long_durability" : "easy_aerobic",
          metricIntent: "mixed_if_allowed",
        };
      }),
    })),
  };
}

function dateForWeekdayInSevenDayWindow(startDate: string, weekday: WeekdayName) {
  for (let offset = 0; offset < 7; offset += 1) {
    const date = addDaysIso(startDate, offset);

    if (weekdayLong(date) === weekday) {
      return date;
    }
  }

  return startDate;
}

for (const goalDistance of [
  "5k",
  "10k",
  "half_marathon",
  "marathon",
  "ultra_marathon",
  "mountain_running",
] as const) {
  const { plan } = buildPlan(buildRequest(goalDistance));

  assertFixedRestDays(plan);
  assertDefaultEstimatedHrGuidance(plan, `${goalDistance} with age but no personal HR zones`);
  assert.equal(
    hasTargetKey(plan, "pace_min_per_km_range"),
    true,
    "known benchmark plus watch/app pace guidance should emit pace targets",
  );
}

assertLongRunDoctrine(buildPlan(buildRequest("half_marathon")).plan, 16);
assertLongRunDoctrine(buildPlan(buildRequest("marathon")).plan, 26);
assertLongRunDoctrine(buildPlan(buildRequest("ultra_marathon")).plan, 30);
assertLongRunDoctrine(buildPlan(buildRequest("mountain_running")).plan, 22);
assertWeekFourCutback(buildPlan(buildRequest("5k")).plan, "5K cutback fixture");
assertWeekFourCutback(buildPlan(buildRequest("10k")).plan, "10K cutback fixture");
assertTaperReducesLongRun(buildPlan(buildRequest("marathon")).plan);
assertTaperReducesLongRun(buildPlan(buildRequest("ultra_marathon")).plan);
assertTaperReducesLongRun(buildPlanWithHorizon("5k", 8));
assertNoTaperPeakLongRun(buildPlanWithHorizon("10k", 9));
assertPhaseSpecificity(buildPlan(buildRequest("marathon")).plan);
assertMountainTrailDoctrine(buildPlan(buildRequest("mountain_running")).plan, "mountain balanced");
assertMountainTrailDoctrine(
  buildPlan(
    buildRequest("mountain_running", {
      availability: {
        runningDaysPerWeek: 5,
        fixedRestDays: [...fixedRestDays],
        preferredLongRunDay: "Saturday",
      },
      goal: {
        goalDistance: "mountain_running",
        goalStyle: "ambitious",
        terrainFocus: "mountain",
        targetTime: null,
        targetDate: null,
      },
      execution: { watchAccess: "watch_or_app", guidancePreference: "pace" },
    }),
  ).plan,
  "mountain ambitious",
);
assertMountainTrailDoctrine(
  buildPlan(
    buildRequest("ultra_marathon", {
      goal: {
        goalDistance: "ultra_marathon",
        goalStyle: "balanced",
        terrainFocus: "mountain",
        targetTime: null,
        targetDate: null,
      },
    }),
  ).plan,
  "ultra with mountain terrain",
);

const ultraEffortOnlyRichnessPlan = buildPlan(
  buildRequest("ultra_marathon", {
    benchmark: { kind: "unknown" },
    execution: { watchAccess: "none", guidancePreference: "effort" },
  }),
).plan;
assertSubstantialWorkoutIdentitiesAreStructured({
  plan: ultraEffortOnlyRichnessPlan,
  label: "S7 ultra effort-only richness",
  sourceWorkoutTypes: ["ultra_time_on_feet_durability"],
  minimumDurationMin: 45,
  expectedText: [/time[- ]on[- ]feet/i, /hike/i, /durability|recovery protection/i],
});

const mountainEffortOnlyRichnessPlan = buildPlan(
  buildRequest("mountain_running", {
    benchmark: { kind: "unknown" },
    execution: { watchAccess: "none", guidancePreference: "effort" },
  }),
).plan;
assertSubstantialWorkoutIdentitiesAreStructured({
  plan: mountainEffortOnlyRichnessPlan,
  label: "S8 mountain technical trail richness",
  sourceWorkoutTypes: ["technical_trail_easy"],
  minimumDurationMin: 30,
  expectedText: [/technical|trail|footing/i, /control|risky|cautious/i],
});
assertSubstantialWorkoutIdentitiesAreStructured({
  plan: mountainEffortOnlyRichnessPlan,
  label: "S8 mountain climbing steady richness",
  sourceWorkoutTypes: ["climbing_steady_run"],
  minimumDurationMin: 35,
  expectedText: [/climb|hill|hilly/i, /controlled|grade|descent/i],
});
assertGoalFamilyWorkoutIdentity();
assertBeginnerBuildConsistencyQualityCap();
assertMetricTargetPolicy();
assertRichCompatibilityMapping();
assertRichPersistenceReadback();
assertRichImportExportRoundtrip();
assertRichSavedModeQaFixture();
assertRichAiDraftNormalizer();
assertAiFirstPlanDraftContract();
assertAiFirstPlanBlueprintGoalFamilyCadence();
assertAiFirstPlanBlueprintContract();
await assertAiFirstPlanDraftServiceContract();
await assertStructuredFirstPlanDraftBlueprintReviewContract();
assertReviewedFirstPlanPersistenceExactness();
await assertTextAuthoringRichDraftOptInContract();
assertActivePlanRefreshRichDraftContract();
assertActivePlanRefreshApplyDoesNotGenerate();
await assertActivePlanRefreshTimeoutFallbackContract();
assertRichWorkoutContract(buildPlan(buildRequest("5k")).plan, "5K rich contract");
assertRichWorkoutContract(buildPlan(buildRequest("half_marathon")).plan, "half rich contract");
assertRichWorkoutContract(
  buildPlan(buildRequest("mountain_running")).plan,
  "mountain rich contract",
);

{
  const { plan: halfBalancedNoBenchmark } = assertStructuredCreatePersistsRichWorkoutTruth(
    buildRequest("half_marathon", {
      benchmark: { fitnessLevel: "running_regularly", recent5kTime: null },
      execution: { watchAccess: "watch_or_app", guidancePreference: "mixed" },
    }),
    "saved structured half marathon balanced without benchmark",
  );

  assert.equal(
    hasTargetKey(halfBalancedNoBenchmark, "pace_min_per_km_range"),
    false,
    "saved half marathon without benchmark should stay effort-only",
  );
  assertDefaultEstimatedHrGuidance(
    halfBalancedNoBenchmark,
    "saved half marathon without benchmark but with age",
  );
}

{
  const request = buildRequest("half_marathon", {
    benchmark: { kind: "unknown" },
    goal: {
      goalDistance: "half_marathon",
      goalStyle: "target_time",
      terrainFocus: "standard",
      targetTime: "2:00:00",
      targetDate: "2026-08-30",
    },
    execution: { watchAccess: "watch_or_app", guidancePreference: "mixed" },
  });
  const { input, authoringInput, plan } = buildPlan(request);
  const review = buildStructuredFirstPlanDraftReview(input, plan, authoringInput);
  const persistenceMetadata = buildPlanScopedStructuredAuthoringMetadata({
    source: "structured_first_plan",
    authoringInput,
    goalStyle: input.goal.goalStyle,
    targetTime: input.goal.targetTime,
    metricPolicySummary: review.planShape.metricPolicy,
    reviewAssumptions: review.assumptions,
  });
  const goalMetadata = persistenceMetadata.goalMetadata as Record<string, unknown>;
  const planPreferences = persistenceMetadata.planPreferences as Record<string, unknown>;
  const storedAuthoringInput = planPreferences.structured_authoring_input as Record<
    string,
    unknown
  >;

  assert.equal(
    goalMetadata.goal_style,
    "target_time",
    "structured target-time plans should persist goal style as plan metadata",
  );
  assert.equal(
    goalMetadata.target_time,
    "2:00:00",
    "structured target-time plans should persist target time as bounded plan metadata",
  );
  assert.equal(
    plan.target_date,
    "2026-08-30",
    "structured target-time plans should persist target date in canonical plan metadata",
  );
  assert.deepEqual(
    (storedAuthoringInput.goal as Record<string, unknown>).goalStyle,
    "target_time",
    "structured authoring snapshot should preserve goal style for refresh",
  );
  assert.equal(
    hasTargetKey(plan, "pace_min_per_km_range"),
    false,
    "target-time half marathon without benchmark must stay effort-only even with watch/app mixed guidance",
  );
  assertDefaultEstimatedHrGuidance(
    plan,
    "target-time half marathon without benchmark but with age",
  );
  assert.ok(
    sourceWorkoutTypes(plan).has("half_marathon_threshold_durability"),
    "target-time half marathon should still include half-marathon threshold durability structure",
  );
  assertSupportRunRichness(plan, "target-time half marathon without benchmark");
  assertStructuredCreatePersistsRichWorkoutTruth(
    request,
    "saved structured half marathon target-time without benchmark",
  );
}

{
  const plan = buildPlan(
    buildRequest("half_marathon", {
      goal: {
        goalDistance: "half_marathon",
        goalStyle: "target_time",
        terrainFocus: "standard",
        targetTime: "2:00:00",
        targetDate: null,
      },
      execution: { watchAccess: "watch_or_app", guidancePreference: "pace" },
    }),
  ).plan;

  assert.equal(
    hasTargetKey(plan, "pace_min_per_km_range"),
    true,
    "target-time half marathon with recent 5K and watch/app pace guidance should keep pace targets",
  );
  assertSupportRunRichness(plan, "target-time half marathon with benchmark");
}

{
  const { plan } = assertStructuredCreatePersistsRichWorkoutTruth(
    buildRequest("marathon", {
      benchmark: { fitnessLevel: "beginner", recent5kTime: null },
      availability: {
        runningDaysPerWeek: 5,
        fixedRestDays: [...fixedRestDays],
        preferredLongRunDay: "Saturday",
      },
      execution: { watchAccess: "none", guidancePreference: "effort" },
    }),
    "saved structured marathon balanced low-support",
  );
  const sourceTypes = sourceWorkoutTypes(plan);
  const forbiddenHardIdentities = [
    "controlled_tempo_session",
    "time_intervals",
    "distance_intervals",
    "5k_sharpening_repeats",
    "10k_rhythm_intervals",
    "half_marathon_threshold_durability",
    "marathon_steady_specificity",
  ];

  assert.ok(
    sourceTypes.has("recovery_jog") && sourceTypes.has("cutback_aerobic_run"),
    "low-support balanced marathon should vary safe support-run purpose without adding hard days",
  );
  assert.equal(
    forbiddenHardIdentities.some((identity) => sourceTypes.has(identity)),
    false,
    "low-support balanced marathon should not add hard quality identities for calendar variety",
  );
  assert.equal(
    hasTargetKey(plan, "pace_min_per_km_range"),
    false,
    "low-support balanced marathon without benchmark/watch support should not emit pace targets",
  );
  assertDefaultEstimatedHrGuidance(
    plan,
    "low-support balanced marathon with age but no personal HR zones",
  );
}

{
  const request = buildRequest("marathon", {
    benchmark: { kind: "unknown" },
    goal: {
      goalDistance: "marathon",
      goalStyle: "target_time",
      terrainFocus: "standard",
      targetTime: "3:30:00",
      targetDate: null,
    },
  });
  const { authoringInput, plan } = buildPlan(request);
  const review = buildStructuredFirstPlanDraftReview(request, plan, authoringInput);

  assert.ok(
    review.assumptions.some((assumption) => /stays effort-based/i.test(assumption)),
    "target-time review should be honest when benchmark support is missing",
  );
  assert.ok(
    review.assumptions.some((assumption) =>
      /Target-time intent is treated as directional/i.test(assumption),
    ),
    "target-time pressure without benchmark support should add long-distance honesty",
  );
}

{
  const request = buildRequest("marathon", {
    goal: {
      goalDistance: "marathon",
      goalStyle: "target_time",
      terrainFocus: "standard",
      targetTime: "3:30:00",
      targetDate: null,
    },
  });
  const { authoringInput, plan } = buildPlan(request);
  const review = buildStructuredFirstPlanDraftReview(request, plan, authoringInput);

  assert.ok(
    review.assumptions.some((assumption) => /looks aggressive/i.test(assumption)),
    "target-time review should flag aggressive benchmark support",
  );
}

assertLongDistanceHonesty(
  buildRequest("marathon", {
    benchmark: { kind: "unknown" },
    availability: {
      runningDaysPerWeek: 2,
      fixedRestDays: [...fixedRestDays],
      preferredLongRunDay: "Saturday",
    },
  }),
  "low-frequency marathon should be labeled finish-oriented or durability-limited",
);

assertLongDistanceHonesty(
  buildRequest("marathon", {
    benchmark: { kind: "unknown" },
    availability: {
      runningDaysPerWeek: 3,
      fixedRestDays: [...fixedRestDays],
      preferredLongRunDay: "Saturday",
    },
  }),
  "3-day marathon with weak benchmark support should be labeled conservative",
);

assertLongDistanceHonesty(
  buildRequest("ultra_marathon", {
    benchmark: { kind: "unknown" },
    availability: {
      runningDaysPerWeek: 3,
      fixedRestDays: [...fixedRestDays],
      preferredLongRunDay: "Saturday",
    },
  }),
  "low-frequency ultra with unknown current load should include durability honesty",
);

assertLongDistanceHonesty(
  buildRequest("mountain_running", {
    benchmark: { kind: "unknown" },
    availability: {
      runningDaysPerWeek: 2,
      fixedRestDays: [...fixedRestDays],
      preferredLongRunDay: "Saturday",
    },
    goal: {
      goalDistance: "mountain_running",
      goalStyle: "target_time",
      terrainFocus: "mountain",
      targetTime: "2:30:00",
      targetDate: null,
    },
  }),
  "low-frequency mountain target-time plan should include conservative durability honesty",
);

assertNoLongDistanceHonesty(
  buildRequest("half_marathon"),
  "supported half marathon should not receive long-distance limitation copy",
);

assertNoLongDistanceHonesty(
  buildRequest("10k"),
  "supported 10K should not receive long-distance limitation copy",
);

const goalEnum = structuredAuthoringOpenAiSchema.properties.goal.properties.goalType.enum;
assert.ok(goalEnum.includes("ultra_marathon"), "text authoring schema should accept ultra goals");
assert.ok(
  goalEnum.includes("mountain_running"),
  "text authoring schema should accept mountain goals",
);
assert.ok(
  "execution" in structuredAuthoringOpenAiSchema.properties,
  "text authoring schema should include execution mode",
);
assert.ok(
  "terrainFocus" in structuredAuthoringOpenAiSchema.properties.preferences.properties,
  "text authoring schema should include terrain focus",
);

{
  const context = buildRefreshFixtureContext();
  const currentPlan = buildRefreshFixturePlanRow(context);
  const existingWorkouts = {
    workouts: context.remainingActiveSchedule.map((workout, index) =>
      buildRefreshFixtureWorkoutRow(context, workout, index),
    ),
    logsByWorkoutId: new Map(),
  };
  const fingerprint = buildActivePlanRefreshFingerprint(context);
  const draft = buildExactActivePlanRefreshDraft({
    context,
    currentPlan,
    existingWorkouts,
    proposalOutput: {
      applyContext: { generatedAt: context.generatedAt },
      review: {
        summary:
          "Rebuild the remaining marathon block with better long-run progression while keeping fixed rest days.",
        proposedChanges: [
          "Progress the remaining long runs more credibly while keeping the plan conservative.",
        ],
      },
      recommendedAuthoringPrompt:
        "Refresh this as a marathon plan with credible long-run progression, cutback weeks, taper behavior, and effort-based guidance only.",
    },
    fingerprint,
    weekdayRestInvariant: context.weekdayRestInvariant,
    evidenceSets: { loggedWorkoutIds: new Set(), evidenceWorkoutIds: new Set() },
  });
  const parsedDraft = parseActivePlanRefreshDraftPayload(draft);

  assert.equal(parsedDraft.ok, true, "refresh draft checksum should verify");
  assert.equal(
    draft.reviewMetadata.affectedDateRange.startDate,
    context.refreshBoundary.firstMutableDate,
    "refresh draft metadata should expose the mutable date boundary",
  );
  assert.equal(
    draft.reviewMetadata.affectedDateRange.endDate,
    context.refreshBoundary.lastMutableDate,
    "refresh draft metadata should expose the affected end date",
  );
  assert.equal(
    draft.reviewMetadata.sourceAssumption,
    draft.authoringSnapshot.sourceAssumption,
    "refresh draft review metadata should mirror the authoring source assumption",
  );
  assert.equal(
    draft.authoringSnapshot.source,
    "reconstructed_active_plan",
    "legacy plans without stored authoring truth should use reconstructed refresh fallback",
  );
  assert.ok(
    draft.reviewMetadata.longDistanceHonestyAssumptions.some((assumption) =>
      /durability|conservative|finish-oriented/i.test(assumption),
    ),
    "refresh draft should expose long-distance honesty metadata",
  );
  assert.ok(
    sourceWorkoutTypes(draft.canonicalPlan).has("marathon_steady_specificity"),
    "marathon refresh draft should use the same marathon-specific identity as first-plan generation",
  );
  assert.ok(
    (draft.reviewMetadata.longRunPeakAfterKm ?? 0) >
      (draft.reviewMetadata.longRunPeakBeforeKm ?? 0) + 8,
    "refresh draft should improve a shallow marathon long-run structure",
  );
  assertFixedRestDays(draft.canonicalPlan);
  assertNoTaperPeakLongRun(draft.canonicalPlan);
  assert.equal(
    hasTargetKey(draft.canonicalPlan, "hr_bpm_range"),
    false,
    "refresh draft must not emit HR targets without HR-zone truth",
  );
  assert.equal(
    hasTargetKey(draft.canonicalPlan, "pace_min_per_km_range"),
    false,
    "reconstructed refresh draft must not emit pace targets without execution and benchmark truth",
  );
  assert.equal(
    mutableWorkoutGuardsStillOpen(draft, {
      loggedWorkoutIds: new Set(),
      evidenceWorkoutIds: new Set(),
    }),
    true,
    "unlogged mutable workouts should remain open before apply",
  );
  assert.equal(
    mutableWorkoutGuardsStillOpen(draft, {
      loggedWorkoutIds: new Set([draft.mutableWorkoutGuards[0]!.workoutId]),
      evidenceWorkoutIds: new Set(),
    }),
    false,
    "a formerly mutable logged workout should stale-block apply",
  );
  assert.equal(
    mutableWorkoutGuardsStillOpen(draft, {
      loggedWorkoutIds: new Set(),
      evidenceWorkoutIds: new Set([draft.mutableWorkoutGuards[1]!.workoutId]),
    }),
    false,
    "a formerly mutable evidence-backed workout should stale-block apply",
  );
}

{
  const context = buildRefreshFixtureContext();
  const stored = buildPlan(
    buildRequest("half_marathon", {
      goal: {
        goalDistance: "half_marathon",
        goalStyle: "target_time",
        terrainFocus: "standard",
        targetTime: "2:00:00",
        targetDate: "2026-08-23",
      },
      availability: {
        runningDaysPerWeek: 5,
        fixedRestDays: [...fixedRestDays],
        preferredLongRunDay: "Saturday",
      },
      execution: { watchAccess: "watch_or_app", guidancePreference: "pace" },
    }),
  );
  const storedMetadata = buildPlanScopedStructuredAuthoringMetadata({
    source: "structured_first_plan",
    authoringInput: stored.authoringInput,
    goalStyle: "target_time",
    targetTime: "2:00:00",
  });
  const currentPlan = {
    ...buildRefreshFixturePlanRow(context),
    goal_metadata: mergePlanPersistenceMetadata(
      buildRefreshFixturePlanRow(context).goal_metadata,
      storedMetadata.goalMetadata,
    ),
    plan_preferences: mergePlanPersistenceMetadata(
      buildRefreshFixturePlanRow(context).plan_preferences,
      storedMetadata.planPreferences,
    ),
  };
  const existingWorkouts = {
    workouts: context.remainingActiveSchedule.map((workout, index) =>
      buildRefreshFixtureWorkoutRow(context, workout, index),
    ),
    logsByWorkoutId: new Map(),
  };
  const draft = buildExactActivePlanRefreshDraft({
    context,
    currentPlan,
    existingWorkouts,
    proposalOutput: {
      applyContext: { generatedAt: context.generatedAt },
      review: {
        summary:
          "Refresh the remaining half-marathon target-time block while preserving saved setup truth.",
        proposedChanges: [
          "Use the saved benchmark and execution mode rather than reconstructing from generic plan text.",
        ],
      },
      recommendedAuthoringPrompt:
        "Refresh this half-marathon target-time plan using the saved structured authoring truth.",
    },
    fingerprint: buildActivePlanRefreshFingerprint(context),
    weekdayRestInvariant: context.weekdayRestInvariant,
    evidenceSets: { loggedWorkoutIds: new Set(), evidenceWorkoutIds: new Set() },
  });

  assert.equal(
    draft.authoringSnapshot.source,
    "stored_authoring_input",
    "refresh should prefer stored structured authoring truth when available",
  );
  assert.equal(
    draft.authoringSnapshot.authoringInput.goal.goalType,
    "half_marathon",
    "stored authoring truth should preserve the original goal family during refresh",
  );
  assert.equal(
    draft.authoringSnapshot.authoringInput.goal.goalStyle,
    "target_time",
    "stored authoring truth should preserve target-time style during refresh",
  );
  assert.equal(
    draft.authoringSnapshot.authoringInput.execution.guidancePreference,
    "pace",
    "stored authoring truth should preserve execution-mode guidance preference",
  );
  assert.equal(
    hasTargetKey(draft.canonicalPlan, "pace_min_per_km_range"),
    true,
    "stored benchmark plus watch/app pace truth should survive into refresh draft pace targets",
  );
}

{
  const context = buildRefreshFixtureContext();
  const currentPlan = buildRefreshFixturePlanRow(context);
  const existingWorkouts = {
    workouts: context.remainingActiveSchedule.map((workout, index) =>
      buildRefreshFixtureWorkoutRow(context, workout, index),
    ),
    logsByWorkoutId: new Map(),
  };
  const protectedLoggedWorkout = existingWorkouts.workouts.find(
    (workout) => workout.workout_type !== "rest",
  )!;
  const protectedEvidenceWorkout = existingWorkouts.workouts.find(
    (workout) => workout.workout_type !== "rest" && workout.id !== protectedLoggedWorkout.id,
  )!;
  const evidenceSets = {
    loggedWorkoutIds: new Set([protectedLoggedWorkout.id]),
    evidenceWorkoutIds: new Set([protectedEvidenceWorkout.id]),
  };
  const draft = buildExactActivePlanRefreshDraft({
    context,
    currentPlan,
    existingWorkouts,
    proposalOutput: {
      applyContext: { generatedAt: context.generatedAt },
      review: {
        summary:
          "Rebuild the remaining marathon block with better long-run progression while keeping protected history fixed.",
        proposedChanges: [
          "Preserve logged or evidence-backed future workouts and regenerate only still-mutable rows.",
        ],
      },
      recommendedAuthoringPrompt:
        "Refresh this as a marathon plan while preserving logged and evidence-backed workouts.",
    },
    fingerprint: buildActivePlanRefreshFingerprint(context),
    weekdayRestInvariant: context.weekdayRestInvariant,
    evidenceSets,
  });

  assert.equal(
    draft.reviewMetadata.preservedWorkoutCount,
    2,
    "refresh draft should count logged and evidence-backed mutable workouts as preserved",
  );
  assert.equal(
    draft.mutableWorkoutGuards.some(
      (guard) =>
        guard.workoutId === protectedLoggedWorkout.id ||
        guard.workoutId === protectedEvidenceWorkout.id,
    ),
    false,
    "logged and evidence-backed workouts should not remain in mutable guard rows",
  );
  assert.equal(
    mutableWorkoutGuardsStillOpen(draft, evidenceSets),
    true,
    "already-protected workouts should not stale-block their own draft",
  );
}

{
  const context = buildMountainRefreshFixtureContext();
  const currentPlan = buildMountainRefreshFixturePlanRow(context);
  const existingWorkouts = {
    workouts: context.remainingActiveSchedule.map((workout, index) =>
      buildRefreshFixtureWorkoutRow(context, workout, index),
    ),
    logsByWorkoutId: new Map(),
  };
  const fingerprint = buildActivePlanRefreshFingerprint(context);
  const draft = buildExactActivePlanRefreshDraft({
    context,
    currentPlan,
    existingWorkouts,
    proposalOutput: {
      applyContext: { generatedAt: context.generatedAt },
      review: {
        summary:
          "Refresh the remaining mountain block with better trail specificity while keeping fixed rest days.",
        proposedChanges: [
          "Replace generic hill-only future workouts with controlled descents, time-on-feet, and cautious trail guidance.",
        ],
      },
      recommendedAuthoringPrompt:
        "Refresh this as a mountain running plan with controlled descents, power-hike allowance, time-on-feet long runs, technical-terrain caution, and effort-based guidance only.",
    },
    fingerprint,
    weekdayRestInvariant: context.weekdayRestInvariant,
    evidenceSets: { loggedWorkoutIds: new Set(), evidenceWorkoutIds: new Set() },
  });
  const parsedDraft = parseActivePlanRefreshDraftPayload(draft);

  assert.equal(parsedDraft.ok, true, "mountain refresh draft checksum should verify");
  assertMountainTrailDoctrine(draft.canonicalPlan, "mountain refresh draft");
  assertNoRoadRaceSharpening(draft.canonicalPlan, "mountain refresh draft");
  assertFixedRestDays(draft.canonicalPlan);
  assert.equal(
    hasTargetKey(draft.canonicalPlan, "hr_bpm_range"),
    false,
    "mountain refresh draft must not emit HR targets without HR-zone truth",
  );
  assert.equal(
    hasTargetKey(draft.canonicalPlan, "pace_min_per_km_range"),
    false,
    "mountain refresh draft must not emit pace targets without execution and benchmark truth",
  );
}

{
  const { authoringInput, plan } = buildPlan(buildRequest("ultra_marathon"));
  const parsedVoiceConfirm = parseVoiceToPlanConfirmRequest({
    draft: {
      authoringInput,
      canonicalPlan: plan,
    },
    supplement: {
      age: 34,
      weightKg: 72,
      heightCm: 178,
      fixedRestDays: [...fixedRestDays],
      runningDaysPerWeek: 5,
      goalDistance: "ultra_marathon",
      goalStyle: "balanced",
      terrainFocus: "mountain",
      watchAccess: "watch_or_app",
      guidancePreference: "pace",
    },
  });

  assert.equal(
    parsedVoiceConfirm.ok,
    true,
    "voice confirm should accept expanded structured goal contract",
  );

  if (parsedVoiceConfirm.ok) {
    assert.deepEqual(
      planWithoutGeneratedTimestamp(parsedVoiceConfirm.canonicalPlan),
      planWithoutGeneratedTimestamp(buildStructuredAuthoringPlan(authoringInput)),
      "voice confirm should rebuild deterministic canonical plan truth from authoring input",
    );
  }

  assert.match(
    readFileSync("src/lib/voice-to-plan-authoring.ts", "utf8"),
    /enableRichWorkoutDraft:\s*false/,
    "voice draft generation should explicitly keep rich workout drafts disabled for Slice 4A",
  );
}

console.log("Plan authoring doctrine fixtures passed.");

function buildRefreshFixtureContext(): RunnerCoachContext {
  const today = "2026-06-01";
  const activePlanId = fixtureUuid(1);
  const remainingWeeks = 10;
  const remainingActiveSchedule = Array.from({ length: remainingWeeks * 7 }, (_, index) => {
    const date = addDaysIso(today, index);
    const weekday = weekdayLong(date);
    const weekNumber = Math.floor(index / 7) + 1;
    const isRest = weekday === "Wednesday" || weekday === "Sunday";
    const isLongRun = weekday === "Saturday";
    const workoutType = isRest ? "rest" : isLongRun ? "long_run" : "easy";
    const title = isRest
      ? "Rest and recovery"
      : isLongRun
        ? "Short marathon long run"
        : "Easy aerobic run";

    return {
      id: fixtureUuid(index + 10),
      date,
      title,
      workoutType,
      phase:
        weekNumber <= 3
          ? "Base"
          : weekNumber <= 7
            ? "Build"
            : weekNumber <= 10
              ? "Specific"
              : "Taper",
      weekNumber,
      plannedDurationMin: isRest ? 0 : isLongRun ? 70 + weekNumber * 2 : 40,
      plannedDistanceKm: isRest ? null : isLongRun ? 8 + weekNumber * 0.5 : 6,
      stepCount: isRest ? 0 : 1,
      notes: null,
    } satisfies RunnerCoachContext["remainingActiveSchedule"][number];
  });

  return {
    schemaVersion: "runner-coach-context-v1",
    generatedAt: "2026-06-01T12:00:00.000Z",
    today,
    runner: {
      userId: fixtureUuid(2),
      displayName: "Refresh Fixture",
      goalType: "distance_build",
      goalLabel: "Marathon",
      baselineSessionsPerWeek: 5,
      baselineLongRunKm: 10,
      baselineNotes: null,
    },
    activePlan: {
      id: activePlanId,
      title: "Old shallow marathon plan",
      goalSummary: "Marathon",
      sourceKind: "structured_authoring_v1",
      sourceTemplate: "training-plan-v2",
      schemaVersion: "training-plan-v2",
      startDate: "2026-05-01",
      endDate: "2026-08-23",
      targetDate: "2026-08-23",
      updatedAt: "2026-06-01T11:00:00.000Z",
    },
    weekdayRestInvariant: {
      blockedWeekdays: ["Wednesday", "Sunday"],
      source: "active_plan",
    },
    refreshBoundary: {
      target: "remaining_active_schedule_only",
      firstMutableDate: today,
      lastMutableDate: addDaysIso(today, remainingWeeks * 7 - 1),
      pastAndLoggedHistoryIsFixed: true,
      requiresExplicitApply: true,
    },
    remainingActiveSchedule,
    recentWorkoutHistory: [],
    recentAdherence: {
      lookbackDays: 56,
      plannedNonRestCount: 0,
      completedCount: 0,
      partialCount: 0,
      skippedCount: 0,
      unloggedPastNonRestCount: 0,
    },
    recentActualLoad: {
      loggedWorkoutCount: 0,
      totalDurationMin: 0,
      totalDistanceKm: 0,
      garminActivityCount: 0,
    },
    recentComparisonSignals: [],
    bodyNoteCautions: [],
  };
}

function buildRefreshFixturePlanRow(context: RunnerCoachContext): PersistedPlanCycleRow {
  return {
    id: context.activePlan!.id,
    user_id: context.runner.userId,
    status: "active",
    title: context.activePlan!.title,
    goal_summary: context.activePlan!.goalSummary,
    source_template: context.activePlan!.sourceTemplate,
    schema_version: context.activePlan!.schemaVersion,
    source_kind: context.activePlan!.sourceKind,
    start_date: context.activePlan!.startDate,
    end_date: context.activePlan!.endDate,
    target_date: context.activePlan!.targetDate,
    goal_metadata: { goal_type: "marathon", goal_label: "Marathon" },
    plan_preferences: {
      blocked_days: ["Wednesday", "Sunday"],
      preferred_run_days: ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"],
      preferred_long_run_day: "Saturday",
      max_running_days_per_week: 5,
    },
    created_at: "2026-05-01T00:00:00.000Z",
    updated_at: context.activePlan!.updatedAt,
  };
}

function buildMountainRefreshFixtureContext(): RunnerCoachContext {
  const context = buildRefreshFixtureContext();

  return {
    ...context,
    runner: {
      ...context.runner,
      goalType: "mountain_running",
      goalLabel: "Mountain running",
      baselineLongRunKm: 9,
    },
    activePlan: context.activePlan
      ? {
          ...context.activePlan,
          title: "Old hill-only mountain plan",
          goalSummary: "Mountain running",
        }
      : null,
    remainingActiveSchedule: context.remainingActiveSchedule.map((workout) => ({
      ...workout,
      title:
        workout.workoutType === "long_run"
          ? "Generic hilly long run"
          : workout.workoutType === "rest"
            ? workout.title
            : "Generic hill run",
      notes:
        workout.workoutType === "rest"
          ? workout.notes
          : "Older mountain-like plan with generic hill wording only.",
    })),
  };
}

function buildMountainRefreshFixturePlanRow(context: RunnerCoachContext): PersistedPlanCycleRow {
  const plan = buildRefreshFixturePlanRow(context);

  return {
    ...plan,
    title: "Old hill-only mountain plan",
    goal_summary: "Mountain running",
    goal_metadata: { goal_type: "mountain_running", goal_label: "Mountain running" },
    plan_preferences: {
      ...((plan.plan_preferences as Record<string, unknown>) ?? {}),
      blocked_days: ["Wednesday", "Sunday"],
      preferred_run_days: ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"],
      preferred_long_run_day: "Saturday",
      max_running_days_per_week: 5,
      terrain_focus: "mountain",
    },
  };
}

function buildRefreshFixtureWorkoutRow(
  context: RunnerCoachContext,
  workout: RunnerCoachContext["remainingActiveSchedule"][number],
  index: number,
): PersistedPlannedWorkoutRow {
  return {
    id: workout.id,
    plan_cycle_id: context.activePlan!.id,
    user_id: context.runner.userId,
    workout_date: workout.date,
    weekday: weekdayLong(workout.date),
    week_number: workout.weekNumber,
    phase: workout.phase,
    workout_type: workout.workoutType,
    source_workout_id: `old-${index}`,
    source_workout_type: workout.workoutType,
    workout_family: null,
    workout_identity: null,
    calendar_icon_key: null,
    goal_context: null,
    metric_mode: null,
    title: workout.title,
    notes: workout.notes,
    planned_rpe: workout.workoutType === "rest" ? null : 4,
    estimated_fatigue: null,
    recovery_priority: null,
    steps: [],
    display_order: index,
    created_at: "2026-05-01T00:00:00.000Z",
  };
}

function fixtureUuid(index: number) {
  return `00000000-0000-4000-8000-${index.toString().padStart(12, "0")}`;
}
