import assert from "node:assert/strict";
import { generateCanonicalPlanFromText } from "../../src/lib/openai-plan-authoring";
import type { TrainingPlanV2 } from "../../src/lib/imported-plan";
import {
  canonicalFamilyToLegacyWorkoutType,
  resolveCanonicalWorkoutModel,
  type CalendarIconKey,
  type CanonicalWorkoutFamily,
  type CanonicalWorkoutIdentity,
} from "../../src/lib/rich-workout-model";
import {
  RICH_WORKOUT_DRAFT_SCHEMA_VERSION,
  normalizeRichWorkoutDraftToTrainingPlan,
} from "../../src/lib/rich-workout-draft-authoring";
import type { StructuredFirstPlanOnboardingRequestInput } from "../../src/lib/structured-first-plan-onboarding";
import {
  buildStructuredAuthoringPlan,
  type StructuredPlanAuthoringInput,
} from "../../src/lib/structured-plan-authoring";
import { serverEnv } from "../../src/lib/supabase/env";
import {
  assertEffortOnlyHrGuidance,
  assertNoDefaultEstimatedHrTargets,
  hasTargetKey,
} from "./metric-target-readback";

type SegmentRecord = Record<string, unknown>;

export type DoctrineRequestBuilder = (
  goalDistance: StructuredFirstPlanOnboardingRequestInput["goal"]["goalDistance"],
  overrides?: Partial<StructuredFirstPlanOnboardingRequestInput>,
) => StructuredFirstPlanOnboardingRequestInput;

export interface RichWorkoutDraftNormalizerDependencies {
  assertRichWorkoutContract: (plan: TrainingPlanV2, label: string) => void;
  buildPlan: (input: StructuredFirstPlanOnboardingRequestInput) => {
    authoringInput: StructuredPlanAuthoringInput;
    plan: TrainingPlanV2;
  };
  buildPlanWithNoAge: (input: StructuredFirstPlanOnboardingRequestInput) => TrainingPlanV2;
  buildRequest: DoctrineRequestBuilder;
}

export async function assertRichWorkoutDraftNormalizerContracts(
  deps: RichWorkoutDraftNormalizerDependencies,
) {
  assertRichCompatibilityMapping();
  assertRichAiDraftNormalizer(deps);
  await assertTextAuthoringRichDraftOptInContract(deps);
}

function nonRestWorkouts(plan: TrainingPlanV2) {
  return plan.planned_workouts.filter((workout) => workout.workout_type !== "rest");
}

function planWithoutGeneratedTimestamp(plan: TrainingPlanV2) {
  const { created_at: _createdAt, ...stablePlan } = plan;

  return stablePlan;
}

function assertRichAiDraftNormalizer({
  assertRichWorkoutContract,
  buildPlan,
  buildPlanWithNoAge,
  buildRequest,
}: RichWorkoutDraftNormalizerDependencies) {
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
      execution: { watchAccess: "unknown", guidancePreference: "effort" },
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
      execution: { watchAccess: "unknown", guidancePreference: "effort" },
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
    assertNoDefaultEstimatedHrTargets(
      fakeHrWithDefaultNormalized.canonicalPlan,
      "AI rich draft normalization with age but no personal HR zones",
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

async function assertTextAuthoringRichDraftOptInContract({
  buildPlan,
  buildRequest,
}: RichWorkoutDraftNormalizerDependencies) {
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

export function openAiFixtureResponse(responseId: string, payload: unknown) {
  return new Response(
    JSON.stringify({
      id: responseId,
      output_text: JSON.stringify(payload),
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}

export function buildAiLikeRichWorkoutDraft(
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
  assert.equal(
    defaultHrMetricMode.hrTargetsAllowed,
    false,
    "metric-mode fallback must not treat default HR source as personal HR target truth",
  );
  assert.equal(
    defaultHrMetricMode.executableMode,
    "correction_required",
    "metric-mode fallback without numeric structure should request correction instead of effort-only execution",
  );
}
