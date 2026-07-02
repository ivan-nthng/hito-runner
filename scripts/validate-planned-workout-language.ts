import assert from "node:assert/strict";
import {
  buildManualWorkoutUserBuiltTrainingPlan,
  reviewManualWorkoutDraft,
  type ManualWorkoutDraftInput,
  type ManualWorkoutDraftReviewResult,
} from "../src/lib/manual-workout-authoring";
import {
  MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  type ManualWorkoutTemplateKey,
} from "../src/lib/manual-workout-authoring/schema";
import {
  buildPlannedWorkoutLanguage,
  RUNNER_FACING_BLOCK_TYPE_LABELS,
  RUNNER_FACING_WORKOUT_TYPE_VALUES,
  type PlannedWorkoutLanguageReadModel,
} from "../src/lib/planned-workout-language";
import { reduceRepeatChildrenToChildFirst } from "../src/lib/planned-workout-block-contract";
import {
  activePlanExportToTrainingPlanV2,
  buildActivePlanExportPayload,
  renderPlanExportJson,
  renderPlanExportMarkdown,
} from "../src/lib/plan-export";
import {
  buildImportedPlanSeed,
  importedPlanSchema,
  type TrainingPlanV2,
} from "../src/lib/imported-plan";
import { buildPersistedWorkoutInsertRows } from "../src/lib/persisted-plan-replacement";
import {
  buildReviewedRunningPlanPreview,
  type RunningPlanPreviewActionInput,
} from "../src/lib/running-plan-engine-actions";
import { buildRunningPlanCanonicalPlan } from "../src/lib/running-plan-engine-review";
import {
  RICH_WORKOUT_DRAFT_SCHEMA_VERSION,
  normalizeRichWorkoutDraftToTrainingPlan,
  type RichWorkoutDraft,
} from "../src/lib/rich-workout-draft-authoring";
import {
  buildStructuredAuthoringPlan,
  type StructuredPlanAuthoringInput,
} from "../src/lib/structured-plan-authoring";
import { buildDeterministicWorkoutComparison } from "../src/lib/workout-result-import/compare-workout-result";
import type { Database } from "../src/lib/supabase/database";
import type { Step, StepTarget } from "../src/lib/training";

type PersistedPlanCycleRow = Database["public"]["Tables"]["plan_cycles"]["Row"];
type PersistedPlannedWorkoutRow = Database["public"]["Tables"]["planned_workouts"]["Row"];
type TrainingPlanWorkout = TrainingPlanV2["planned_workouts"][number];
type TrainingPlanSegment = TrainingPlanWorkout["segments"][number];
type TrainingPlanRepeatChild = NonNullable<
  NonNullable<TrainingPlanSegment["prescription"]>["children"]
>[number];

const ACCEPTED_WORKOUT_TYPES = new Set<string>(RUNNER_FACING_WORKOUT_TYPE_VALUES);
const ACCEPTED_BLOCK_LABELS = new Set<string>(Object.values(RUNNER_FACING_BLOCK_TYPE_LABELS));
const INTERNAL_IDENTITIES = [
  "controlled_tempo_session",
  "half_marathon_threshold_durability",
  "base_endpoint_marker",
  "tenk_completion_or_checkpoint",
] as const;

async function main() {
  validateAcceptedRunnerFacingTypesAreDerivable();
  validateManualAndGeneratedRowsUseTheSameLanguage();
  validateUnifiedRepeatReducerOwnsChildFirstCompatibility();
  await validateGeneratedAndAiPlansUseUnifiedBlockContract();
  validateSourceKindIsProvenanceOnly();
  validateInternalIdentityLabelsStayBackendOnly();
  validateExportKeepsCanonicalJsonAndRunnerFacingMarkdown();
  validateManualBlockContractRoundtripKeepsTargetSource();
  validateComparisonUsesCanonicalPlannedTruthOnly();

  console.log("Planned workout language read-model contract passed.");
}

function validateAcceptedRunnerFacingTypesAreDerivable() {
  const languages = [
    languageForManualTemplate("rest_day"),
    languageForManualTemplate("recovery_jog"),
    languageForManualTemplate("easy_aerobic_run"),
    languageForManualTemplate("steady_aerobic_run"),
    languageForManualTemplate("long_aerobic_run"),
    languageForManualTemplate("progression_run"),
    languageForManualTemplate("controlled_tempo_session"),
    languageForManualTemplate("time_intervals"),
    languageForManualTemplate("uphill_repeats"),
    languageForManualTemplate("run_walk_adaptation"),
  ];

  assert.deepEqual(
    new Set(languages.map((language) => language.runnerFacingWorkoutType)),
    ACCEPTED_WORKOUT_TYPES,
    "the accepted v1 runner-facing workout taxonomy must be derivable from canonical fields",
  );

  for (const language of languages) {
    assertAcceptedLanguageShape(language);
  }
}

function validateManualAndGeneratedRowsUseTheSameLanguage() {
  const manual = readyManualDraft("manual tempo", {
    templateKey: "controlled_tempo_session",
    workoutDate: "2026-07-01",
    title: "Controlled tempo session",
  }).draft;
  const manualLanguage = buildPlannedWorkoutLanguage({
    workoutType: manual.workoutType,
    sourceWorkoutType: manual.sourceWorkoutType,
    sourceKind: manual.sourceKind,
    workoutFamily: manual.workoutFamily,
    workoutIdentity: manual.workoutIdentity,
    calendarIconKey: manual.calendarIconKey,
    metricMode: manual.metricMode,
    title: manual.title,
    steps: manual.steps,
  });
  const generatedLanguage = buildPlannedWorkoutLanguage({
    workoutType: manual.workoutType,
    sourceWorkoutType: manual.sourceWorkoutType,
    sourceKind: "running_plan_engine_10k_builder_v1",
    workoutFamily: manual.workoutFamily,
    workoutIdentity: manual.workoutIdentity,
    calendarIconKey: manual.calendarIconKey,
    metricMode: manual.metricMode,
    title: manual.title,
    steps: manual.steps,
  });

  assert.deepEqual(
    withoutProvenance(generatedLanguage),
    withoutProvenance(manualLanguage),
    "manual and generated rows with the same canonical workout truth must resolve to the same language",
  );
  assert.notEqual(
    generatedLanguage.provenance.sourceKind,
    manualLanguage.provenance.sourceKind,
    "source kind should remain provenance, not a language rule input",
  );
}

async function validateGeneratedAndAiPlansUseUnifiedBlockContract() {
  const selectedPreview = await buildReviewedRunningPlanPreview({
    age: 36,
    heightCm: 178,
    weightKg: 74,
    runnerLevel: "runs_a_lot",
    distanceFamily: "10K",
    daysPerWeek: 5,
    fixedRestDays: ["Wednesday", "Saturday"],
    preferredLongRunDay: "Sunday",
    startDate: "2026-06-23",
  } satisfies RunningPlanPreviewActionInput);

  assert.equal(selectedPreview.ok, true, "selected-plan generated preview should be reviewable.");

  if (!selectedPreview.ok) {
    throw new Error(`selected-plan preview rejected unexpectedly: ${selectedPreview.reason}`);
  }

  const selectedPlan = buildRunningPlanCanonicalPlan(selectedPreview.draft);
  assertGeneratedPlanUsesUnifiedBlockContract(
    selectedPlan,
    "selected-plan generated canonical plan",
  );

  const structuredPlan = buildStructuredAuthoringPlan(buildStructuredAuthoringRepeatInput());
  assertGeneratedPlanUsesUnifiedBlockContract(
    structuredPlan,
    "structured first-plan authoring canonical plan",
  );

  const arbitraryRepeatPlan = buildArbitraryRepeatChildrenTrainingPlan(selectedPlan);
  assertGeneratedPlanUsesUnifiedBlockContract(
    arbitraryRepeatPlan,
    "generated/AI arbitrary repeat-children fixture",
  );
  assertArbitraryRepeatChildrenRoundtrip(arbitraryRepeatPlan);

  const aiNormalized = normalizeRichWorkoutDraftToTrainingPlan({
    canonicalPlan: selectedPlan,
    draft: buildAiLikeRepeatRichWorkoutDraft(selectedPlan),
  });

  if (!aiNormalized.ok) {
    throw new Error(
      `AI-like rich workout draft rejected unexpectedly: ${aiNormalized.reason}: ${aiNormalized.issues.join(" | ")}`,
    );
  }

  assert.equal(aiNormalized.ok, true, "AI-like rich workout draft should normalize.");

  assertGeneratedPlanUsesUnifiedBlockContract(
    aiNormalized.canonicalPlan,
    "AI-like rich workout draft normalized plan",
  );
}

function assertGeneratedPlanUsesUnifiedBlockContract(plan: TrainingPlanV2, label: string) {
  assert.equal(plan.schema_version, "training-plan-v2", `${label} should stay training-plan-v2.`);
  assertNoLegacyRepeatPairFields(plan, label);

  const repeatWorkouts = plan.planned_workouts.filter((workout) =>
    workout.segments.some((segment) => segment.prescription?.mode === "repeats"),
  );

  assert.ok(repeatWorkouts.length > 0, `${label} should include at least one repeat-set workout.`);

  for (const workout of plan.planned_workouts) {
    const language = buildLanguageForTrainingPlanWorkout(workout, plan.source_kind ?? null);
    assertAcceptedLanguageShape(language);
    assertNoGeneratedWorkoutUserEnteredTargetTruth(workout, label);
  }

  for (const workout of repeatWorkouts) {
    const language = buildLanguageForTrainingPlanWorkout(workout, plan.source_kind ?? null);
    const repeatSegments = workout.segments.filter(
      (segment) => segment.prescription?.mode === "repeats",
    );

    for (const segment of repeatSegments) {
      const repeatBlock = language.runnerFacingBlocks.find(
        (block) =>
          block.type === "repeat_set" &&
          block.sourceSegmentType === segment.segment_type &&
          block.repeatCount === segment.prescription?.repeat_count,
      );

      assert.ok(
        repeatBlock,
        `${label} should expose ${workout.workout_id} ${segment.segment_type} as a Repeat set.`,
      );

      assert.deepEqual(
        repeatBlock.children.map((child) => child.type),
        expectedRepeatChildTypes(segment),
        `${label} should preserve repeat child order for ${workout.workout_id}.`,
      );
    }
  }

  const importedSeed = buildImportedPlanSeed(importedPlanSchema.parse(plan));
  const importedRepeatSteps = importedSeed.workouts.flatMap((workout) =>
    workout.steps.filter((step) => step.repeats),
  );

  assert.ok(
    importedRepeatSteps.length > 0,
    `${label} should roundtrip repeat prescriptions into persisted planned_workouts.steps.`,
  );

  for (const step of importedRepeatSteps) {
    assert.ok(
      step.children?.length,
      `${label} import seed must preserve canonical repeat children[].`,
    );
    assert.equal(
      Object.hasOwn(step, "work") || Object.hasOwn(step, "recovery"),
      false,
      `${label} import seed must not fall back to pair-shaped work/recovery for canonical output.`,
    );
    assert.ok(
      step.children.every((child) => typeof child.type === "string" && child.type.length > 0),
      `${label} import seed should preserve typed canonical repeat children.`,
    );
  }
}

function validateUnifiedRepeatReducerOwnsChildFirstCompatibility() {
  const childFirst = reduceRepeatChildrenToChildFirst({
    children: [
      repeatChild("run", "Run", 4, "comfortable_run"),
      repeatChild("walk", "Walk", 1, "easy_walk"),
      repeatChild("work", "Tempo", 2, "controlled_tempo"),
      repeatChild("recover", "Recover", 1, "easy_recovery"),
    ],
  });

  assert.equal(
    childFirst.source,
    "children",
    "unified repeat reducer must accept ordered children[].",
  );
  assert.deepEqual(
    childFirst.children.map((child) => child.role),
    ["run", "walk", "work", "recover"],
    "unified repeat reducer must preserve arbitrary child order.",
  );

  const duplicateWorkRecover = reduceRepeatChildrenToChildFirst({
    children: [
      repeatChild("work", "Work", 2, "controlled_strong"),
      repeatChild("recover", "Recover", 1, "reset"),
      repeatChild("work", "Work again", 1, "quick_but_smooth"),
      repeatChild("recover", "Recover again", 1, "reset_again"),
    ],
  });

  assert.deepEqual(
    duplicateWorkRecover.children.map((child) => child.role),
    ["work", "recover", "work", "recover"],
    "unified repeat reducer must support duplicate roles inside one repeated sequence.",
  );

  const retiredLegacyPair = reduceRepeatChildrenToChildFirst({});

  assert.equal(
    retiredLegacyPair.source,
    "none",
    "unified repeat reducer must not materialize retired repeat_unit/recovery_unit pairs.",
  );
  assert.deepEqual(retiredLegacyPair.children, []);

  validateRetiredRepeatUnitImportAdapter();
  validateFlatSegmentRepeatFieldsStayRetired();
}

function validateRetiredRepeatUnitImportAdapter() {
  assert.throws(
    () =>
      importedPlanSchema.parse({
        schema_version: "training-plan-v2",
        plan_name: "Retired repeat-unit adapter proof",
        source_kind: "legacy_training_plan_v2_import_fixture",
        generated_for: "Hito validator",
        start_date: "2026-07-01",
        planned_workouts: [
          {
            workout_id: "retired-repeat-unit-pair",
            date: "2026-07-01",
            weekday: "Wednesday",
            week_number: 1,
            phase: "Retired import compatibility",
            workout_type: "intervals",
            title: "Retired repeat-unit fixture",
            summary: "repeat_unit/recovery_unit input should be rejected; use children[].",
            segments: [
              {
                segment_id: "retired-repeat-unit-pair-segment",
                segment_type: "interval_block",
                sequence: 1,
                label: "Retired repeat unit pair",
                prescription: {
                  mode: "repeats",
                  repeat_count: 3,
                  repeat_unit: { mode: "time", duration_min: 2 },
                  recovery_unit: { mode: "time", duration_min: 1 },
                },
              },
            ],
          },
        ],
      }),
    /Unrecognized key|repeat prescriptions require children/,
    "repeat_unit/recovery_unit imports must stay retired; use prescription.children[].",
  );
}

function validateFlatSegmentRepeatFieldsStayRetired() {
  assert.throws(
    () =>
      importedPlanSchema.parse({
        schema_version: "training-plan-v2",
        plan_name: "Retired flat repeat fields proof",
        source_kind: "legacy_training_plan_v2_import_fixture",
        generated_for: "Hito validator",
        start_date: "2026-07-01",
        planned_workouts: [
          {
            workout_id: "retired-flat-repeat-fields",
            date: "2026-07-01",
            weekday: "Wednesday",
            week_number: 1,
            phase: "Retired import compatibility",
            workout_type: "intervals",
            title: "Retired flat repeat fields fixture",
            summary:
              "Flat segment-level work/recovery repeat fields should not remain a second repeat language.",
            segments: [
              {
                segment_id: "retired-flat-repeat-fields-segment",
                segment_type: "interval_block",
                sequence: 1,
                label: "Retired flat repeat fields",
                repeat_count: 3,
                work_duration_min: 2,
                recovery_duration_min: 1,
              },
            ],
          },
        ],
      }),
    /Unrecognized key|prescription\.mode = repeats|prescription/,
    "flat segment-level repeat_count/work_duration/recovery_duration imports must stay retired; use prescription.children[].",
  );
}

function buildLanguageForTrainingPlanWorkout(
  workout: TrainingPlanWorkout,
  sourceKind: string | null,
) {
  return buildPlannedWorkoutLanguage({
    workoutType: workout.workout_type,
    sourceWorkoutType: workout.source_workout_type,
    sourceKind,
    workoutFamily: workout.workout_family,
    workoutIdentity: workout.workout_identity,
    calendarIconKey: workout.calendar_icon_key,
    metricMode: workout.metric_mode,
    title: workout.title,
    steps: workout.segments,
  });
}

function buildStructuredAuthoringRepeatInput(): StructuredPlanAuthoringInput {
  return {
    goal: {
      goalType: "distance_build",
      goalLabel: "Build durable distance",
      goalStyle: "balanced",
      targetTime: null,
      targetEventName: null,
    },
    schedule: {
      startDate: "2026-06-23",
      targetDate: null,
      preparationHorizonWeeks: 12,
    },
    runnerProfile: {
      experienceLevel: "consistent_runner",
      baselineSessionsPerWeek: 5,
      baselineLongRunKm: 12,
      age: 36,
      recentInjuryRecoveryContext: null,
      preferredEffortLanguage: "mixed",
    },
    currentLevel: {
      recentResultSummary: null,
      recentRaceResults: [],
      recent5kPaceSecondsPerKm: null,
      currentEasyPaceRange: null,
      currentTrainingLoadSummary: "Comfortable running five days per week.",
    },
    availability: {
      preferredRunningDays: ["Monday", "Tuesday", "Thursday", "Friday", "Sunday"],
      unavailableDays: ["Wednesday", "Saturday"],
      maxRunningDaysPerWeek: 5,
      allowBackToBackDays: true,
      preferredLongRunDay: "Sunday",
    },
    constraints: {
      injuryConstraints: [],
      hardConstraints: [],
    },
    preferences: {
      preferredWorkoutMix: "balanced",
      terrainFocus: "standard",
      strengthOrMobilityInterest: "none",
      indoorTreadmillOk: false,
      notes: null,
    },
    execution: {
      watchAccess: "watch_or_app",
      guidancePreference: "mixed",
    },
  };
}

function buildArbitraryRepeatChildrenTrainingPlan(basePlan: TrainingPlanV2): TrainingPlanV2 {
  const baseWorkout =
    basePlan.planned_workouts.find((workout) => workout.workout_type !== "rest") ??
    basePlan.planned_workouts[0];

  assert.ok(baseWorkout, "arbitrary repeat fixture needs a base workout.");

  return importedPlanSchema.parse({
    ...basePlan,
    plan_name: "Generated/AI arbitrary repeat children contract",
    source_kind: "ai_first_plan_blueprint_v1",
    planned_workouts: [
      buildRepeatChildrenWorkout(baseWorkout, {
        workoutId: "repeat_children_run_walk",
        date: "2026-06-23",
        weekday: "Tuesday",
        title: "Run walk repeat children",
        summary: "3 x Run 4 min plus Walk 1 min.",
        repeatCount: 3,
        children: [
          repeatChild("run", "Run", 4, "comfortable_run"),
          repeatChild("walk", "Walk", 1, "easy_walk"),
        ],
      }),
      buildRepeatChildrenWorkout(baseWorkout, {
        workoutId: "repeat_children_easy_tempo_recover",
        date: "2026-06-25",
        weekday: "Thursday",
        title: "Easy tempo recover repeat children",
        summary: "4 x Easy 3 min plus Tempo 2 min plus Recover 1 min.",
        repeatCount: 4,
        children: [
          repeatChild("run", "Easy", 3, "easy"),
          repeatChild("work", "Tempo", 2, "controlled_tempo"),
          repeatChild("recover", "Recover", 1, "easy_recovery"),
        ],
      }),
      buildRepeatChildrenWorkout(baseWorkout, {
        workoutId: "repeat_children_duplicate_work_recover",
        date: "2026-06-27",
        weekday: "Saturday",
        title: "Duplicate work recover repeat children",
        summary: "6 x Work, Recover, Work, Recover with distinct effort cues.",
        repeatCount: 6,
        children: [
          repeatChild("work", "Work", 2, "controlled_strong"),
          repeatChild("recover", "Recover", 1, "reset"),
          repeatChild("work", "Work", 1, "quick_but_smooth"),
          repeatChild("recover", "Recover", 1, "reset_again"),
        ],
      }),
    ],
  });
}

function buildRepeatChildrenWorkout(
  baseWorkout: TrainingPlanWorkout,
  fixture: {
    workoutId: string;
    date: string;
    weekday: string;
    title: string;
    summary: string;
    repeatCount: number;
    children: TrainingPlanRepeatChild[];
  },
): TrainingPlanWorkout {
  return {
    ...baseWorkout,
    workout_id: fixture.workoutId,
    date: fixture.date,
    weekday: fixture.weekday,
    week_number: 1,
    phase: "Unified repeat children proof",
    workout_family: "intervals",
    workout_identity: "time_intervals",
    calendar_icon_key: "intervals",
    source_workout_type: "repeat_children_contract",
    workout_type: "intervals",
    title: fixture.title,
    summary: fixture.summary,
    metric_mode: {
      guidance: "effort",
      executable_mode: "structure_only_executable",
      pace_targets_allowed: false,
      hr_targets_allowed: false,
      hr_target_source: "effort_only",
      reason: "Fixture proves ordered repeat children without generated pace or HR targets.",
    },
    segments: [
      {
        segment_id: `${fixture.workoutId}_repeat`,
        segment_type: "interval_block",
        label: "Repeat set",
        sequence: 1,
        guidance: "Repeat the ordered child blocks exactly as written.",
        prescription: {
          mode: "repeats",
          repeat_count: fixture.repeatCount,
          children: fixture.children,
        },
      },
    ],
  };
}

function repeatChild(
  role: TrainingPlanRepeatChild["role"],
  label: string,
  durationMin: number,
  intensity: string,
): TrainingPlanRepeatChild {
  return {
    role,
    label,
    prescription: {
      mode: "time",
      duration_min: durationMin,
    },
    target: {
      intensity,
      cue: `Use ${label.toLowerCase()} effort; do not chase invented pace or HR.`,
    },
  };
}

function assertArbitraryRepeatChildrenRoundtrip(plan: TrainingPlanV2) {
  const expectedByWorkoutId = new Map(
    plan.planned_workouts.map((workout) => {
      const repeatSegment = workout.segments.find(
        (segment) => segment.prescription?.mode === "repeats",
      );

      assert.ok(repeatSegment, `${workout.workout_id} should include one repeat segment.`);

      return [
        workout.workout_id,
        {
          languageTypes: expectedRepeatChildTypes(repeatSegment),
          persistedTypes: (repeatSegment.prescription?.children ?? []).map((child) =>
            repeatChildRoleToPersistedStepType(child.role),
          ),
          exportedRoles: (repeatSegment.prescription?.children ?? []).map((child) => child.role),
        },
      ];
    }),
  );

  for (const workout of plan.planned_workouts) {
    const language = buildLanguageForTrainingPlanWorkout(workout, plan.source_kind ?? null);
    const repeatBlock = language.runnerFacingBlocks.find((block) => block.type === "repeat_set");
    const expected = expectedByWorkoutId.get(workout.workout_id);

    assert.ok(expected, `${workout.workout_id} should have expected repeat children.`);
    assert.ok(repeatBlock, `${workout.workout_id} should read back a Repeat set.`);
    assert.deepEqual(
      repeatBlock.children.map((child) => child.type),
      expected.languageTypes,
      `${workout.workout_id} should preserve arbitrary repeat child order in language readback.`,
    );
  }

  const importedSeed = buildImportedPlanSeed(importedPlanSchema.parse(plan));

  for (const workout of importedSeed.workouts) {
    const expected = expectedByWorkoutId.get(workout.sourceWorkoutId);
    const repeatStep = workout.steps.find((step) => step.repeats);

    assert.ok(
      expected,
      `${workout.sourceWorkoutId} should have expected persisted repeat children.`,
    );
    assert.ok(repeatStep?.children, `${workout.sourceWorkoutId} should persist repeat children.`);
    assert.deepEqual(
      repeatStep.children.map((child) => child.type),
      expected.persistedTypes,
      `${workout.sourceWorkoutId} should persist arbitrary repeat child order.`,
    );
    assert.equal(
      Object.hasOwn(repeatStep, "work"),
      false,
      `${workout.sourceWorkoutId} should not synthesize work.`,
    );
    assert.equal(
      Object.hasOwn(repeatStep, "recovery"),
      false,
      `${workout.sourceWorkoutId} should not synthesize recovery.`,
    );
  }

  const userId = "00000000-0000-4000-8000-000000000710";
  const planCycle: PersistedPlanCycleRow = {
    ...buildFakePlanCycle(userId),
    id: "99999999-9999-4999-8999-000000000710",
    title: "Generated repeat children export proof",
    source_kind: "ai_first_plan_blueprint_v1",
    source_template: "ai_first_plan_blueprint_v1",
  };
  const rows: PersistedPlannedWorkoutRow[] = buildPersistedWorkoutInsertRows(
    planCycle.id,
    userId,
    importedSeed.workouts,
  ).map((row, index) => ({
    id: `99999999-9999-4999-8999-00000000071${index}`,
    created_at: "2026-06-25T00:00:00.000Z",
    ...row,
  }));
  const payload = buildActivePlanExportPayload({
    planCycle,
    workouts: rows,
    exportedAt: "2026-06-25T12:45:00.000Z",
  });
  const parsedExport = importedPlanSchema.parse(activePlanExportToTrainingPlanV2(payload));
  const parsedJsonExport = importedPlanSchema.parse(JSON.parse(renderPlanExportJson(payload)));

  for (const exportedPlan of [parsedExport, parsedJsonExport]) {
    assertNoLegacyRepeatPairFields(
      exportedPlan,
      "active-plan export should emit child-first repeat JSON",
    );

    for (const workout of exportedPlan.planned_workouts) {
      const expected = expectedByWorkoutId.get(workout.workout_id);
      const repeatSegment = workout.segments.find(
        (segment) => segment.prescription?.mode === "repeats",
      );

      assert.ok(expected, `${workout.workout_id} should have expected export repeat children.`);
      assert.ok(repeatSegment, `${workout.workout_id} should export one repeat segment.`);
      assert.equal(
        repeatSegment.target,
        undefined,
        `${workout.workout_id} Repeat set parent should not carry a target.`,
      );
      assert.equal(
        repeatSegment.recovery_target,
        undefined,
        `${workout.workout_id} Repeat set parent should not carry a recovery target.`,
      );
      assert.deepEqual(
        repeatSegment.prescription?.children?.map((child) => child.role),
        expected.exportedRoles,
        `${workout.workout_id} should export arbitrary repeat children in order.`,
      );
      assertNoGeneratedWorkoutUserEnteredTargetTruth(
        workout,
        `${workout.workout_id} arbitrary repeat export`,
      );
    }
  }
}

function assertNoLegacyRepeatPairFields(value: unknown, label: string) {
  const serialized = JSON.stringify(value);

  assert.doesNotMatch(serialized, /"repeat_unit"/, `${label} must not emit repeat_unit.`);
  assert.doesNotMatch(serialized, /"recovery_unit"/, `${label} must not emit recovery_unit.`);
}

function assertNoGeneratedWorkoutUserEnteredTargetTruth(
  workout: TrainingPlanWorkout,
  label: string,
) {
  const targetRecords = workout.segments.flatMap((segment) =>
    collectTrainingSegmentTargets(segment),
  );

  for (const target of targetRecords) {
    assert.notEqual(
      targetValue(target, "target_source"),
      "user_entered",
      `${label} must not turn generated/AI targets into manual runner-entered truth.`,
    );
    assert.notEqual(
      targetValue(target, "hr_target_source"),
      "personal_hr_zone",
      `${label} must not invent personal HR-zone truth.`,
    );
  }

  if (!workout.metric_mode?.pace_targets_allowed) {
    assert.equal(
      targetRecords.some((target) => targetValue(target, "pace_min_per_km_range")),
      false,
      `${label} must not emit pace targets unless the accepted benchmark seam allows pace.`,
    );
  }
}

function collectTrainingSegmentTargets(segment: TrainingPlanSegment) {
  return [
    ...(segment.target ? [segment.target] : []),
    ...(segment.recovery_target ? [segment.recovery_target] : []),
    ...(segment.prescription?.children ?? []).flatMap((child) =>
      child.target ? [child.target] : [],
    ),
  ];
}

function expectedRepeatChildTypes(segment: TrainingPlanSegment) {
  const children = segment.prescription?.children;

  if (children?.length) {
    return children.map((child) => repeatChildRoleToBlockType(child.role));
  }

  return [];
}

function repeatChildRoleToBlockType(role: TrainingPlanRepeatChild["role"]) {
  switch (role) {
    case "warm_up":
      return "warm_up";
    case "run":
      return "run";
    case "walk":
      return "walk";
    case "work":
      return "work";
    case "recover":
      return "recover";
    case "finish":
      return "finish";
    case "cooldown":
      return "cooldown";
  }
}

function repeatChildRoleToPersistedStepType(role: TrainingPlanRepeatChild["role"]) {
  switch (role) {
    case "warm_up":
      return "warmup";
    case "run":
      return "run";
    case "walk":
      return "walk";
    case "work":
      return "work";
    case "recover":
      return "recovery";
    case "finish":
      return "finish";
    case "cooldown":
      return "cooldown";
  }
}

function buildAiLikeRepeatRichWorkoutDraft(plan: TrainingPlanV2): RichWorkoutDraft {
  return {
    schemaVersion: RICH_WORKOUT_DRAFT_SCHEMA_VERSION,
    assumptions: ["Fixture keeps Hito's deterministic metric and repeat-structure gates."],
    workouts: plan.planned_workouts.map((workout) => {
      const repeatSegment = workout.segments.find(
        (segment) => segment.prescription?.mode === "repeats",
      );

      if (workout.workout_type === "rest") {
        return buildAiLikeRestWorkoutDraft(workout);
      }

      return {
        workoutId: workout.workout_id,
        date: workout.date,
        workoutFamily: workout.workout_family ?? "easy",
        workoutIdentity: workout.workout_identity ?? "easy_aerobic_run",
        calendarIconKey: workout.calendar_icon_key ?? "easy",
        title: `AI-shaped ${workout.title}`,
        summary: `AI-shaped ${workout.summary}`,
        goalContext: toRichDraftGoalContext(workout),
        metricMode: toRichDraftMetricMode(workout),
        segments: repeatSegment
          ? [
              buildAiLikeTimeSegment(workout, "warmup", 1, "Warm up", 8),
              buildAiLikeRepeatSegment(workout, repeatSegment, 2),
              buildAiLikeTimeSegment(workout, "cooldown", 3, "Cool down", 6),
            ]
          : [
              buildAiLikeTimeSegment(workout, "warmup", 1, "Warm up", 8),
              buildAiLikeTimeSegment(workout, "main", 2, "Steady run", 24),
              buildAiLikeTimeSegment(workout, "cooldown", 3, "Cool down", 6),
            ],
      };
    }),
  };
}

function buildAiLikeRestWorkoutDraft(
  workout: TrainingPlanWorkout,
): RichWorkoutDraft["workouts"][number] {
  return {
    workoutId: workout.workout_id,
    date: workout.date,
    workoutFamily: "rest",
    workoutIdentity: "rest_and_recovery",
    calendarIconKey: "rest",
    title: workout.title,
    summary: workout.summary,
    goalContext: toRichDraftGoalContext(workout),
    metricMode: toRichDraftMetricMode(workout),
    segments: [
      {
        segmentId: `${workout.workout_id}_ai_rest`,
        segmentType: "rest",
        label: "Rest",
        sequence: 1,
        prescription: emptyRichDraftPrescription("none"),
        guidance: "No running scheduled.",
        target: emptyRichDraftTarget(),
      },
    ],
  };
}

function buildAiLikeTimeSegment(
  workout: TrainingPlanWorkout,
  segmentType: "warmup" | "main" | "cooldown",
  sequence: number,
  label: string,
  durationMin: number,
): RichWorkoutDraft["workouts"][number]["segments"][number] {
  return {
    segmentId: `${workout.workout_id}_ai_${sequence}`,
    segmentType,
    label,
    sequence,
    prescription: {
      mode: "time",
      durationMin,
      distanceKm: null,
      repeatCount: null,
    },
    guidance: `${label} with clear effort control and no invented metric targets.`,
    target: {
      ...emptyRichDraftTarget(),
      intensity: segmentType === "main" ? "controlled_effort" : "easy",
      cue: segmentType === "main" ? "Keep this smooth." : "Keep it relaxed.",
    },
  };
}

function buildAiLikeRepeatSegment(
  workout: TrainingPlanWorkout,
  segment: TrainingPlanSegment,
  sequence: number,
): RichWorkoutDraft["workouts"][number]["segments"][number] {
  const prescription = segment.prescription;

  assert.equal(
    prescription?.mode,
    "repeats",
    "AI-like repeat fixture must be built from a canonical repeat segment.",
  );
  assert.ok(prescription.children?.length, "AI-like repeat fixture needs ordered repeat children.");

  const children = prescription.children.map((child, index) => ({
    role: child.role,
    label: child.label ?? repeatChildRoleToPersistedStepType(child.role),
    sequence: child.sequence ?? index + 1,
    guidance: child.guidance ?? "Keep this repeat child controlled and repeatable.",
    prescription: toRichDraftUnitPrescription(child.prescription),
    target: {
      ...toRichDraftTarget(child.target),
      intensity: child.role === "recover" || child.role === "walk" ? "easy" : "controlled_effort",
      cue:
        child.role === "recover" || child.role === "walk"
          ? "Recover before the next repeat."
          : "Hold effort without chasing pace or HR.",
    },
  }));

  return {
    segmentId: `${workout.workout_id}_ai_repeat`,
    segmentType: segment.segment_type === "strides" ? "strides" : "interval_block",
    label: segment.label ?? "Repeat set",
    sequence,
    prescription: {
      mode: "repeats",
      durationMin: null,
      distanceKm: null,
      repeatCount: prescription.repeat_count ?? 1,
      children,
    },
    guidance: "Keep the work controlled and let the recovery stay honest.",
    target: {
      ...emptyRichDraftTarget(),
      intensity: "controlled_effort",
      cue: "Run the repeat rhythm without chasing invented pace or HR.",
    },
  };
}

function toRichDraftUnitPrescription(unit: TrainingPlanRepeatChild["prescription"]) {
  return {
    mode: unit.mode,
    durationMin: unit.mode === "time" ? (unit.duration_min ?? null) : null,
    distanceKm: unit.mode === "distance" ? (unit.distance_km ?? null) : null,
  };
}

function toRichDraftGoalContext(workout: TrainingPlanWorkout) {
  return {
    goalType: workout.goal_context?.goal_type ?? "build_consistency",
    goalStyle: workout.goal_context?.goal_style ?? null,
    terrainFocus: workout.goal_context?.terrain_focus ?? "standard",
    targetDate: workout.goal_context?.target_date ?? null,
    targetTime: workout.goal_context?.target_time ?? null,
  };
}

function toRichDraftMetricMode(workout: TrainingPlanWorkout) {
  return {
    guidance: workout.metric_mode?.guidance ?? "effort",
    paceTargetsAllowed: workout.metric_mode?.pace_targets_allowed ?? false,
    hrTargetsAllowed: workout.metric_mode?.hr_targets_allowed ?? false,
    reason: workout.metric_mode?.reason ?? "Fixture mirrors deterministic metric truth.",
  };
}

function emptyRichDraftPrescription(mode: "none") {
  return {
    mode,
    durationMin: null,
    distanceKm: null,
    repeatCount: null,
  };
}

function emptyRichDraftTarget() {
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

function toRichDraftTarget(target: Record<string, unknown> | undefined) {
  return {
    ...emptyRichDraftTarget(),
    intensity: stringTargetValue(target, "intensity"),
    rpe: stringTargetValue(target, "rpe"),
    cue: stringTargetValue(target, "cue"),
    hint: stringTargetValue(target, "hint") ?? stringTargetValue(target, "source_note"),
    paceMinPerKmRange: stringTargetValue(target, "pace_min_per_km_range"),
    pace: stringTargetValue(target, "pace"),
    hrBpmRange: stringTargetValue(target, "hr_bpm_range"),
    hrBpm: stringTargetValue(target, "hr_bpm"),
  };
}

function stringTargetValue(target: Record<string, unknown> | undefined, key: string) {
  const value = target?.[key];
  return typeof value === "string" || typeof value === "number" ? String(value) : null;
}

function validateSourceKindIsProvenanceOnly() {
  const base = languageForManualTemplate("uphill_repeats");
  const alternate = buildPlannedWorkoutLanguage({
    workoutType: "quality",
    sourceWorkoutType: base.provenance.sourceWorkoutType,
    sourceKind: "ai_first_plan_blueprint_v1",
    workoutFamily: base.canonical.workoutFamily,
    workoutIdentity: base.canonical.workoutIdentity,
    calendarIconKey: base.canonical.calendarIconKey,
    metricMode: {
      guidance: base.metricTruth.guidance,
      executable_mode: base.metricTruth.executableMode,
      pace_targets_allowed: base.metricTruth.paceTargetsAllowed,
      hr_targets_allowed: base.metricTruth.hrTargetsAllowed,
      hr_target_source: base.metricTruth.hrTargetSource,
      reason: base.metricTruth.reason,
    },
    title: "Uphill repeats",
    steps: [],
  });

  assert.equal(alternate.runnerFacingWorkoutType, "hills");
  assert.equal(alternate.provenance.sourceKind, "ai_first_plan_blueprint_v1");
}

function validateInternalIdentityLabelsStayBackendOnly() {
  const controlledTempo = languageForManualTemplate("controlled_tempo_session");
  const threshold = languageForManualTemplate("half_marathon_threshold_durability");
  const endpoint = buildPlannedWorkoutLanguage({
    workoutType: "long_run",
    sourceWorkoutType: "base_endpoint_marker",
    sourceKind: "running_plan_engine_marathon_base_builder_v1",
    workoutFamily: "long",
    workoutIdentity: "base_endpoint_marker",
    calendarIconKey: "long",
    title: "Base endpoint marker",
    steps: [],
  });

  assert.equal(controlledTempo.runnerFacingWorkoutTypeLabel, "Tempo");
  assert.equal(threshold.runnerFacingWorkoutTypeLabel, "Tempo");
  assert.equal(endpoint.runnerFacingWorkoutTypeLabel, "Long Run");

  const runnerFacingText = [
    controlledTempo.runnerFacingWorkoutTypeLabel,
    threshold.runnerFacingWorkoutTypeLabel,
    endpoint.runnerFacingWorkoutTypeLabel,
    ...controlledTempo.runnerFacingBlocks.map((block) => block.label),
    ...threshold.runnerFacingBlocks.map((block) => block.label),
  ].join(" ");

  for (const identity of INTERNAL_IDENTITIES) {
    assert.doesNotMatch(
      runnerFacingText,
      new RegExp(identity),
      `${identity} must remain backend-only and not become a primary runner-facing label`,
    );
  }
}

function validateExportKeepsCanonicalJsonAndRunnerFacingMarkdown() {
  const userId = "00000000-0000-4000-8000-000000000701";
  const planCycle = buildFakePlanCycle(userId);
  const thresholdReview = readyManualDraft("manual threshold export", {
    templateKey: "half_marathon_threshold_durability",
    workoutDate: "2026-07-02",
    title: "Threshold durability",
  });
  const row = buildPersistedRow({
    userId,
    planCycleId: planCycle.id,
    id: "99999999-9999-4999-8999-000000000701",
    review: thresholdReview,
  });
  const payload = buildActivePlanExportPayload({
    planCycle,
    workouts: [row],
    exportedAt: "2026-06-25T12:00:00.000Z",
  });
  const [workout] = payload.workouts;

  assert.ok(workout, "export payload should include the threshold workout");
  assert.equal(workout.plannedWorkoutLanguage.runnerFacingWorkoutTypeLabel, "Tempo");
  assert.equal(
    workout.plannedWorkoutLanguage.canonical.workoutIdentity,
    "half_marathon_threshold_durability",
  );

  const exportedPlan = activePlanExportToTrainingPlanV2(payload);
  const parsed = importedPlanSchema.parse(exportedPlan);
  const [exportedWorkout] = parsed.planned_workouts;

  assert.ok(exportedWorkout, "training-plan-v2 export should include the workout");
  assert.equal(exportedWorkout.workout_identity, "half_marathon_threshold_durability");
  assert.equal(
    Object.hasOwn(exportedWorkout, "planned_workout_language"),
    false,
    "training-plan-v2 JSON must not grow a second persisted language object",
  );
  assert.doesNotThrow(() => buildImportedPlanSeed(parsed));

  const json = renderPlanExportJson(payload);
  assert.match(json, /"workout_identity": "half_marathon_threshold_durability"/);
  assert.doesNotMatch(json, /planned_workout_language|runnerFacingWorkoutType/);

  const markdown = renderPlanExportMarkdown(payload);
  assert.match(markdown, /- Type: Tempo/);
  assert.match(markdown, /- Blocks: Warm-up -> Repeat set -> Cooldown/);
  assert.doesNotMatch(markdown, /half_marathon_threshold_durability|controlled_tempo_session/);
}

function validateComparisonUsesCanonicalPlannedTruthOnly() {
  const review = readyManualDraft("comparison tempo", {
    templateKey: "controlled_tempo_session",
    workoutDate: "2026-07-03",
    title: "Controlled tempo session",
  });
  const comparison = buildDeterministicWorkoutComparison({
    plannedWorkout: {
      id: "99999999-9999-4999-8999-000000000702",
      workout_date: review.draft.workoutDate,
      workout_type: review.draft.workoutType,
      source_workout_type: review.draft.sourceWorkoutType,
      title: review.draft.title,
      steps: review.draft.steps,
    },
    actualMetrics: {
      id: "99999999-9999-4999-8999-000000000703",
      source_kind: "garmin_fit",
      activity_local_date: review.draft.workoutDate,
      actual_duration_min: review.draft.totalDurationMin,
      actual_distance_km: null,
      actual_interval_count: 3,
      actual_step_payload: null,
    },
  });
  const plannedWorkout = comparison.differencePayload.plannedWorkout as Record<string, unknown>;

  assert.equal(plannedWorkout.sourceWorkoutType, "controlled_tempo_session");
  assert.equal(plannedWorkout.workoutType, "quality");
  assert.equal(
    Object.hasOwn(plannedWorkout, "runnerFacingWorkoutType"),
    false,
    "Garmin/FIT comparison must stay tied to canonical planned workout truth, not display labels",
  );
}

function validateManualBlockContractRoundtripKeepsTargetSource() {
  const userId = "00000000-0000-4000-8000-000000000704";
  const planCycle = buildFakePlanCycle(userId);
  const review = readyManualDraft("manual block contract roundtrip", {
    templateKey: "controlled_tempo_session",
    workoutDate: "2026-07-04",
    title: "Runner-entered target repeat set",
    entries: [
      {
        kind: "block",
        block: {
          blockKey: "warmup_block",
          durationSeconds: 10 * 60,
          target: { rpe: 3, cue: "Start relaxed." },
        },
      },
      {
        kind: "repeat_group",
        group: {
          repeatCount: 3,
          safetyKind: "tempo_repeats",
          groupLabel: "3 x tempo with easy recovery",
          workBlock: {
            blockKey: "tempo_block",
            durationSeconds: 5 * 60,
            target: { targetSource: "user_entered", paceMinPerKmRange: "5:10-5:25/km" },
          },
          recoveryBlock: {
            blockKey: "interval_recovery_block",
            durationSeconds: 2 * 60,
            target: { targetSource: "user_entered", hrBpmCap: 155 },
          },
        },
      },
      {
        kind: "block",
        block: {
          blockKey: "cooldown_block",
          durationSeconds: 8 * 60,
          target: { rpe: 2, cue: "Let the effort drop." },
        },
      },
    ],
  });
  const row = buildPersistedRow({
    userId,
    planCycleId: planCycle.id,
    id: "99999999-9999-4999-8999-000000000704",
    review,
  });
  const persistedTargets = flattenStepTargets(readSteps(row.steps));

  assertUserEnteredPaceRangeTarget(persistedTargets, "persisted planned_workouts.steps");
  assertUserEnteredHrCapTarget(persistedTargets, "persisted planned_workouts.steps");
  assertUserEnteredRpeTarget(persistedTargets, "persisted planned_workouts.steps");

  const payload = buildActivePlanExportPayload({
    planCycle,
    workouts: [row],
    exportedAt: "2026-06-25T12:30:00.000Z",
  });
  const parsedExport = importedPlanSchema.parse(JSON.parse(renderPlanExportJson(payload)));
  const [exportedWorkout] = parsedExport.planned_workouts;

  assert.ok(exportedWorkout, "manual block contract export should include one workout.");
  const repeatSegment = exportedWorkout.segments.find(
    (segment) => segment.prescription?.mode === "repeats",
  );

  assert.ok(repeatSegment, "repeat group should export as one training-plan-v2 repeat segment.");
  const repeatChildTargets = repeatSegment.prescription?.children?.flatMap((child) =>
    child.target ? [child.target] : [],
  );
  assertUserEnteredPaceRangeTarget(repeatChildTargets ?? [], "training-plan-v2 repeat work target");
  assertUserEnteredHrCapTarget(repeatChildTargets ?? [], "training-plan-v2 repeat recovery target");

  const roundtripSeed = buildImportedPlanSeed(parsedExport);
  const [roundtripWorkout] = roundtripSeed.workouts;

  assert.ok(roundtripWorkout, "training-plan-v2 import seed should include roundtripped workout.");
  const roundtripTargets = flattenStepTargets(roundtripWorkout.steps);

  assertUserEnteredPaceRangeTarget(roundtripTargets, "training-plan-v2 import seed steps");
  assertUserEnteredHrCapTarget(roundtripTargets, "training-plan-v2 import seed steps");
  assertUserEnteredRpeTarget(roundtripTargets, "training-plan-v2 import seed steps");

  const comparison = buildDeterministicWorkoutComparison({
    plannedWorkout: {
      id: row.id,
      workout_date: row.workout_date,
      workout_type: row.workout_type,
      source_workout_type: row.source_workout_type,
      title: row.title,
      steps: row.steps,
    },
    actualMetrics: {
      id: "99999999-9999-4999-8999-000000000705",
      source_kind: "garmin_fit",
      activity_local_date: row.workout_date,
      actual_duration_min: review.draft.totalDurationMin,
      actual_distance_km: null,
      actual_interval_count: null,
      actual_step_payload: null,
    },
  });
  const comparedSignalKeys = comparison.differencePayload.summary.comparedSignalKeys;
  const supportSignals = comparison.differencePayload.supportMatrix.signals;

  assert.equal(
    comparedSignalKeys.includes("pace"),
    false,
    "provider comparison must not compare pace without normalized actual pace evidence.",
  );
  assert.equal(
    comparedSignalKeys.includes("heart_rate"),
    false,
    "provider comparison must not compare HR without normalized actual HR evidence.",
  );
  assert.equal(
    supportSignals.find((signal) => signal.key === "pace")?.status,
    "unsupported",
    "provider comparison should keep planned pace targets out of deterministic comparison.",
  );
  assert.equal(
    supportSignals.find((signal) => signal.key === "heart_rate")?.status,
    "unsupported",
    "provider comparison should keep planned HR targets out of deterministic comparison.",
  );
  assert.doesNotMatch(
    JSON.stringify(comparison.differencePayload),
    /pace_seconds_per_km|hr_bpm_cap|hr_bpm_min|hr_bpm_max|"rpe"/,
    "provider comparison input must not treat target-only pace, HR, or RPE as compared actual evidence.",
  );
}

function readSteps(value: PersistedPlannedWorkoutRow["steps"]): Step[] {
  return Array.isArray(value) ? (value as unknown as Step[]) : [];
}

function flattenStepTargets(steps: Step[]): StepTarget[] {
  return steps.flatMap((step) => [
    ...(step.target ? [step.target] : []),
    ...flattenStepTargets(step.children ?? []),
  ]);
}

function assertUserEnteredPaceRangeTarget(
  targets: Array<StepTarget | Record<string, unknown>>,
  label: string,
) {
  const target = targets.find((candidate) => targetValue(candidate, "pace_min_per_km_range"));

  assert.ok(target, `${label} should preserve a runner-entered pace range target.`);
  assert.equal(targetValue(target, "target_source"), "user_entered");
  assert.equal(targetValue(target, "pace_min_per_km_range"), "5:10/km-5:25/km");
  assert.equal(targetValue(target, "pace_min_seconds_per_km"), 310);
  assert.equal(targetValue(target, "pace_max_seconds_per_km"), 325);
}

function assertUserEnteredHrCapTarget(
  targets: Array<StepTarget | Record<string, unknown>>,
  label: string,
) {
  const target = targets.find((candidate) => targetValue(candidate, "hr_bpm_cap") === 155);

  assert.ok(target, `${label} should preserve a runner-entered HR cap target.`);
  assert.equal(targetValue(target, "target_source"), "user_entered");
  assert.equal(targetValue(target, "hr_target_source"), "user_entered");
  assert.equal(targetValue(target, "hr_bpm"), "155 bpm");
  assert.equal(targetValue(target, "hr_bpm_cap"), 155);
}

function assertUserEnteredRpeTarget(
  targets: Array<StepTarget | Record<string, unknown>>,
  label: string,
) {
  const target = targets.find((candidate) => targetValue(candidate, "rpe") === 3);

  assert.ok(target, `${label} should preserve a runner-entered RPE target.`);
  assert.equal(targetValue(target, "target_source"), "user_entered");
}

function targetValue(target: StepTarget | Record<string, unknown>, key: string) {
  return (target as Record<string, unknown>)[key];
}

function assertAcceptedLanguageShape(language: PlannedWorkoutLanguageReadModel) {
  assert.ok(ACCEPTED_WORKOUT_TYPES.has(language.runnerFacingWorkoutType));

  for (const block of flattenBlocks(language.runnerFacingBlocks)) {
    assert.ok(
      ACCEPTED_BLOCK_LABELS.has(block.label),
      `${block.label} should be one of the accepted v1 runner-facing block labels`,
    );
  }
}

function flattenBlocks(blocks: PlannedWorkoutLanguageReadModel["runnerFacingBlocks"]) {
  return blocks.flatMap((block) => [block, ...flattenBlocks(block.children)]);
}

function languageForManualTemplate(templateKey: ManualWorkoutTemplateKey) {
  const review = readyManualDraft(`manual ${templateKey}`, {
    templateKey,
    workoutDate: "2026-07-01",
    title: `${templateKey} language proof`,
  });

  return buildPlannedWorkoutLanguage({
    workoutType: review.draft.workoutType,
    sourceWorkoutType: review.draft.sourceWorkoutType,
    sourceKind: review.draft.sourceKind,
    workoutFamily: review.draft.workoutFamily,
    workoutIdentity: review.draft.workoutIdentity,
    calendarIconKey: review.draft.calendarIconKey,
    metricMode: review.draft.metricMode,
    title: review.draft.title,
    steps: review.draft.steps,
  });
}

function readyManualDraft(
  label: string,
  input: ManualWorkoutDraftInput,
): Extract<ManualWorkoutDraftReviewResult, { ok: true }> {
  const result = reviewManualWorkoutDraft(input);
  assert.equal(result.ok, true, `${label} should be reviewable`);

  if (!result.ok) {
    throw new Error(`${label} rejected unexpectedly.`);
  }

  return result;
}

function withoutProvenance(language: PlannedWorkoutLanguageReadModel) {
  return {
    ...language,
    provenance: null,
  };
}

function buildFakePlanCycle(userId: string): PersistedPlanCycleRow {
  return {
    id: "99999999-9999-4999-8999-000000000700",
    user_id: userId,
    title: "Unified language export proof",
    goal_summary: "Language read-model proof",
    start_date: "2026-07-01",
    end_date: "2026-07-07",
    target_date: null,
    status: "active",
    source_kind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
    source_template: "manual_user_built_plan_v1",
    schema_version: "training-plan-v2",
    goal_metadata: null,
    plan_preferences: null,
    created_at: "2026-06-25T00:00:00.000Z",
    updated_at: "2026-06-25T00:00:00.000Z",
  };
}

function buildPersistedRow({
  userId,
  planCycleId,
  id,
  review,
}: {
  userId: string;
  planCycleId: string;
  id: string;
  review: Extract<ManualWorkoutDraftReviewResult, { ok: true }>;
}): PersistedPlannedWorkoutRow {
  const canonicalPlan = buildManualWorkoutUserBuiltTrainingPlan(review.draft);
  const importedSeed = buildImportedPlanSeed(canonicalPlan);
  const [insertRow] = buildPersistedWorkoutInsertRows(planCycleId, userId, importedSeed.workouts);

  assert.ok(insertRow, "persisted row fixture should produce one insert row");

  return {
    id,
    created_at: "2026-06-25T00:00:00.000Z",
    ...insertRow,
  };
}

await main();
