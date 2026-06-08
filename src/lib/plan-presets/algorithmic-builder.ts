import {
  FUTURE_TEMPLATE_VERSION,
  trainingPlanV2Schema,
  type TrainingPlanV2,
} from "@/lib/imported-plan";
import {
  getPlanPresetBuilderIoContracts,
  getPlanPresetIdentityPlacementRules,
  getPlanPresetPhaseTemplates,
  getPlanPresetProgressionMathRules,
  getPlanPresetQualityGates,
  getPlanPresetSegmentAnatomyTable,
  getPlanPresetWeeklyArchetypes,
  type PlanPresetBuilderIoContract,
  type PlanPresetPhaseTemplate,
  type ResolvedPlanPresetProgram,
} from "@/lib/plan-presets/program-data";
import {
  assertFixedRestAndLongRunDay,
  buildPresetNotes,
  buildWorkoutContext,
  enforcePostLongRunRecovery,
  expandSingleSegmentSupportRows,
  retagWorkout,
} from "@/lib/plan-presets/recipe-expanders/shared";
import type {
  PlanPresetEligibilityInput,
  PlanPresetRecipeSummary,
} from "@/lib/plan-presets/schema";
import {
  buildEasyTarget,
  buildSteadyFinishTarget,
  buildLongRunTarget,
} from "@/lib/structured-plan-authoring-metrics";
import { normalizeStructuredPlanAuthoringInput } from "@/lib/structured-plan-authoring";
import { finalizeGeneratedWorkoutRows } from "@/lib/structured-plan-authoring-finalize";
import {
  structuredPlanAuthoringInputSchema,
  type NormalizedStructuredInput,
  type StructuredWeekday,
  type TrainingPhase,
} from "@/lib/structured-plan-authoring-schema";
import { phaseForWeek, isoWeekday, slugify } from "@/lib/structured-plan-authoring-policy";
import { buildLongRunWorkout } from "@/lib/structured-plan-authoring-sequencing";
import {
  buildAerobicStridesWorkout,
  buildCutbackAerobicWorkout,
  buildEasyWorkout,
  buildHalfMarathonThresholdWorkout,
  buildMarathonSteadySpecificityWorkout,
  buildProgressionWorkout,
  buildRestWorkout,
  buildSteadyWorkout,
  buildTempoWorkout,
  buildTenKRhythmWorkout,
  buildTimeIntervalsWorkout,
  type BuildWorkoutContext,
} from "@/lib/structured-plan-authoring-workouts";
import type { StructuredFirstPlanAuthoringInput } from "@/lib/structured-first-plan-onboarding";
import { addDaysIso, diffDaysIso } from "@/lib/training";
import type { RunnerFitnessLevel } from "@/lib/runner-training-preferences";

type PlanPresetBuiltWeek = {
  weekNumber: number;
  sourcePhaseName: string;
  sourcePhaseOrder: number;
  trainingPhase: TrainingPhase;
  archetypeId: string;
};

type PlanPresetBuilderDiagnostics = {
  phaseSequenceId: string;
  phaseNames: string[];
  weeklyArchetypeIds: string[];
  finalOutcomeIdentities: string[];
  sourceArtifactTables: string[];
};

type PlanPresetAlgorithmicBuildResult = {
  authoringInput: StructuredFirstPlanAuthoringInput;
  canonicalPlan: TrainingPlanV2;
  diagnostics: PlanPresetBuilderDiagnostics;
};

type BuilderState = {
  recipe: PlanPresetRecipeSummary;
  program: ResolvedPlanPresetProgram;
  runnerLevel: Exclude<RunnerFitnessLevel, "custom">;
  daysPerWeek: number;
  normalized: NormalizedStructuredInput;
  builtIdentitiesByWeek: Map<number, string[]>;
  builtIdentityCounts: Map<string, number>;
};

type SlotResolutionContext = {
  token: string;
  week: PlanPresetBuiltWeek;
  weekIndex: number;
  date: string;
  weekday: StructuredWeekday;
  previousRunningWorkout: TrainingPlanV2["planned_workouts"][number] | null;
  selectedTokens: string[];
};

const sourceArtifactTables = [
  "preset-goal-contract-matrix.csv",
  "preset-phase-template-table.csv",
  "preset-weekly-archetype-table.csv",
  "preset-identity-placement-rules.csv",
  "preset-segment-anatomy-table.csv",
  "preset-progression-math-rules.csv",
  "preset-quality-gates.csv",
  "preset-builder-io-contract.csv",
];

const recipeLabels = {
  "10k_foundation": "10K Foundation",
  half_marathon_balanced: "Half Marathon Balanced",
  marathon_base: "Marathon Base",
} as const;

const recipeGoalTypes = {
  "10k_foundation": "10k",
  half_marathon_balanced: "half_marathon",
  marathon_base: "marathon",
} as const;

const recipeWorkoutMix = {
  "10k_foundation": "easy_heavy",
  half_marathon_balanced: "balanced",
  marathon_base: "balanced",
} as const;

const specificIdentitySet = new Set([
  "progression_run",
  "controlled_tempo_session",
  "half_marathon_threshold_durability",
  "half_readiness_marker",
  "marathon_steady_specificity",
  "base_endpoint_marker",
  "time_intervals",
  "10k_rhythm_intervals",
  "tenk_completion_or_checkpoint",
  "long_run_with_steady_finish",
]);

export function validatePlanPresetAlgorithmicInput({
  recipe,
  input,
}: {
  recipe: PlanPresetRecipeSummary;
  input: PlanPresetEligibilityInput;
}) {
  const expectedGoalDistance = recipeGoalTypes[recipe.recipeFamilyId];

  if (input.goal.goalDistance !== expectedGoalDistance) {
    throw new Error(`${recipe.programFamily} draft expansion requires a matching setup.`);
  }

  if (recipe.recipeFamilyId === "10k_foundation") {
    if (input.goal.goalStyle !== "relaxed" && input.goal.goalStyle !== "balanced") {
      throw new Error("10K Foundation supports relaxed or balanced goal styles only.");
    }

    return;
  }

  if (input.goal.goalStyle !== "balanced") {
    throw new Error(`${recipe.programFamily} supports balanced goal style only.`);
  }
}

export function buildPlanPresetAlgorithmicDraft({
  recipe,
  sourceInput,
  program,
  runnerLevel,
}: {
  recipe: PlanPresetRecipeSummary;
  sourceInput: StructuredFirstPlanAuthoringInput;
  program: ResolvedPlanPresetProgram;
  runnerLevel: Exclude<RunnerFitnessLevel, "custom">;
}): PlanPresetAlgorithmicBuildResult {
  const authoringInput = buildPlanPresetAlgorithmicAuthoringInput({
    recipe,
    sourceInput,
    program,
  });
  const normalized = normalizeStructuredPlanAuthoringInput(authoringInput);
  const weeks = buildPhaseArchitecture({
    recipe,
    program,
    runnerLevel,
    daysPerWeek: normalized.availability.maxRunningDaysPerWeek,
  });
  const state: BuilderState = {
    recipe,
    program,
    runnerLevel,
    daysPerWeek: normalized.availability.maxRunningDaysPerWeek,
    normalized,
    builtIdentitiesByWeek: new Map(),
    builtIdentityCounts: new Map(),
  };
  const planWorkouts = finalizeGeneratedWorkoutRows(
    expandSingleSegmentSupportRows(
      enforcePostLongRunRecovery(buildAlgorithmicWorkouts(state, weeks)),
    ),
    normalized,
  );
  const canonicalPlan = trainingPlanV2Schema.parse({
    schema_version: FUTURE_TEMPLATE_VERSION,
    plan_id: `plan-preset-${slugify(recipe.programFamily)}-${normalized.schedule.startDate}`,
    plan_name: `${recipe.programFamily} Plan Preset`,
    source_kind: "plan_preset_v1",
    created_at: new Date().toISOString(),
    generated_for: "You",
    goal: {
      goal_type: recipeGoalTypes[recipe.recipeFamilyId],
      goal_label: recipe.programFamily,
      target_event: {
        label: `${recipe.programFamily} Plan Preset`,
        event_name: `${recipe.programFamily} Plan Preset`,
      },
    },
    runner_profile: {
      experience_level: normalized.runnerProfile.experienceLevel,
      baseline_sessions_per_week: normalized.runnerProfile.baselineSessionsPerWeek,
      ...(normalized.runnerProfile.baselineLongRunKm
        ? { baseline_long_run_km: normalized.runnerProfile.baselineLongRunKm }
        : {}),
      ...(normalized.runnerProfile.baselineLongRunDurationMin
        ? { baseline_long_run_duration_min: normalized.runnerProfile.baselineLongRunDurationMin }
        : {}),
      ...(normalized.runnerProfile.age ? { age: normalized.runnerProfile.age } : {}),
      ...(normalized.runnerProfile.preferredEffortLanguage
        ? { preferred_effort_language: normalized.runnerProfile.preferredEffortLanguage }
        : {}),
      ...(normalized.currentLevel.recentResultSummary
        ? { recent_result_summary: normalized.currentLevel.recentResultSummary }
        : {}),
      ...(normalized.currentLevel.recentRaceResults.length > 0
        ? {
            recent_race_results: normalized.currentLevel.recentRaceResults.map((entry) => ({
              distance: entry.distance,
              result_time: entry.resultTime,
              ...(entry.resultDate ? { result_date: entry.resultDate } : {}),
            })),
          }
        : {}),
    },
    start_date: normalized.schedule.startDate,
    preparation_horizon_weeks: normalized.schedule.horizonWeeks,
    plan_preferences: {
      preferred_run_days: normalized.availability.runningDays,
      blocked_days: normalized.availability.unavailableDays,
      max_running_days_per_week: normalized.availability.maxRunningDaysPerWeek,
      allow_back_to_back_days: normalized.availability.allowBackToBackDays,
      preferred_long_run_day: normalized.availability.longRunDay,
      injury_constraints: normalized.constraints.injuryConstraints,
      hard_constraints: normalized.constraints.hardConstraints,
      preferred_workout_mix: recipeWorkoutMix[recipe.recipeFamilyId],
      terrain_focus: normalized.preferences.terrainFocus,
      ...(normalized.preferences.strengthOrMobilityInterest
        ? {
            strength_or_mobility_interest: normalized.preferences.strengthOrMobilityInterest,
          }
        : {}),
      indoor_treadmill_ok: normalized.preferences.indoorTreadmillOk,
      ...(normalized.preferences.notes ? { notes: normalized.preferences.notes } : {}),
    },
    planned_workouts: planWorkouts,
  });

  assertFixedRestAndLongRunDay({
    canonicalPlan,
    authoringInput,
    recipeLabel: recipe.programFamily,
  });
  assertPlanPresetAlgorithmicQualityGates({
    canonicalPlan,
    program,
    daysPerWeek: normalized.availability.maxRunningDaysPerWeek,
  });

  return {
    authoringInput,
    canonicalPlan,
    diagnostics: {
      phaseSequenceId: weeks[0]?.sourcePhaseName ?? "unknown",
      phaseNames: Array.from(new Set(weeks.map((week) => week.sourcePhaseName))),
      weeklyArchetypeIds: Array.from(new Set(weeks.map((week) => week.archetypeId))),
      finalOutcomeIdentities: findFinalOutcomeIdentities(canonicalPlan),
      sourceArtifactTables,
    },
  };
}

export function assertPlanPresetAlgorithmicQualityGates({
  canonicalPlan,
  program,
  daysPerWeek,
}: {
  canonicalPlan: TrainingPlanV2;
  program: ResolvedPlanPresetProgram;
  daysPerWeek: number;
}) {
  const identities = canonicalPlan.planned_workouts
    .filter((workout) => workout.workout_type !== "rest")
    .map(
      (workout) => workout.workout_identity ?? workout.source_workout_type ?? workout.workout_type,
    );
  const identitySet = new Set(identities);
  const gates = getPlanPresetQualityGates().filter(
    (gate) =>
      gate.required &&
      (gate.familyId === program.scenario.familyId || gate.familyId === "all_supported_families") &&
      rangeIncludes(gate.daysPerWeek, daysPerWeek),
  );

  for (const gate of gates) {
    if (gate.checkType === "weekly_density") {
      assertAtMostOneSpecificTouchPerWeek(canonicalPlan, gate.gateDescription);
      continue;
    }

    if (gate.checkType === "spacing_rule") {
      assertPostLongRunRecoveryOrEasy(canonicalPlan, gate.gateDescription);
      continue;
    }

    if (gate.checkType === "identity_presence") {
      if (
        !hasIdentityPresence({
          identitySet,
          familyId: program.scenario.familyId,
          gateId: gate.gateId,
        })
      ) {
        throw new Error(`Plan Preset quality gate failed: ${gate.gateDescription}.`);
      }
      continue;
    }

    if (gate.checkType === "phase_identity_presence") {
      if (
        !hasPhaseIdentityPresence({
          canonicalPlan,
          familyId: program.scenario.familyId,
          gateId: gate.gateId,
        })
      ) {
        throw new Error(`Plan Preset phase quality gate failed: ${gate.gateDescription}.`);
      }
      continue;
    }

    if (gate.checkType === "final_outcome_presence") {
      if (!hasFinalOutcomePresence(canonicalPlan, program.scenario.familyId)) {
        throw new Error(`Plan Preset final outcome gate failed: ${gate.gateDescription}.`);
      }
      continue;
    }

    if (gate.checkType === "identity_histogram") {
      if (!hasLowFrequencyDevelopmentMotif(canonicalPlan, gate.minimumCount)) {
        throw new Error(`Plan Preset identity histogram gate failed: ${gate.gateDescription}.`);
      }
    }
  }
}

function buildPlanPresetAlgorithmicAuthoringInput({
  recipe,
  sourceInput,
  program,
}: {
  recipe: PlanPresetRecipeSummary;
  sourceInput: StructuredFirstPlanAuthoringInput;
  program: ResolvedPlanPresetProgram;
}) {
  const label = recipeLabels[recipe.recipeFamilyId];

  return structuredPlanAuthoringInputSchema.parse({
    ...sourceInput,
    goal: {
      ...sourceInput.goal,
      goalType: recipeGoalTypes[recipe.recipeFamilyId],
      goalLabel: label,
      targetTime: null,
      targetEventName: `${label} Plan Preset`,
    },
    schedule: {
      ...sourceInput.schedule,
      targetDate: null,
      preparationHorizonWeeks: program.durationWeeks,
    },
    preferences: {
      ...sourceInput.preferences,
      preferredWorkoutMix: recipeWorkoutMix[recipe.recipeFamilyId],
      notes: buildPresetNotes(label, sourceInput.preferences.notes),
    },
    constraints: {
      injuryConstraints: [],
      hardConstraints: [],
    },
  });
}

function buildPhaseArchitecture({
  recipe,
  program,
  runnerLevel,
  daysPerWeek,
}: {
  recipe: PlanPresetRecipeSummary;
  program: ResolvedPlanPresetProgram;
  runnerLevel: Exclude<RunnerFitnessLevel, "custom">;
  daysPerWeek: number;
}) {
  const phaseRows = selectPhaseTemplateRows({
    recipe,
    program,
    runnerLevel,
    daysPerWeek,
  });
  const allocations = allocatePhaseWeeks(phaseRows, program.durationWeeks);
  const weeks: PlanPresetBuiltWeek[] = [];

  for (const allocation of allocations) {
    for (let count = 0; count < allocation.weekCount; count += 1) {
      const weekNumber = weeks.length + 1;
      const archetype = selectWeeklyArchetype({
        familyId: recipe.recipeFamilyId,
        daysPerWeek,
        phaseName: allocation.phase.phaseName,
        weekNumber,
        finalWeek: program.durationWeeks,
      });
      weeks.push({
        weekNumber,
        sourcePhaseName: allocation.phase.phaseName,
        sourcePhaseOrder: allocation.phase.phaseOrder,
        trainingPhase: mapPresetPhaseToTrainingPhase(
          allocation.phase.phaseName,
          weekNumber,
          program.durationWeeks,
        ),
        archetypeId: archetype.weekArchetype,
      });
    }
  }

  return weeks;
}

function buildAlgorithmicWorkouts(state: BuilderState, weeks: PlanPresetBuiltWeek[]) {
  const workouts: TrainingPlanV2["planned_workouts"] = [];
  const totalDays =
    diffDaysIso(state.normalized.schedule.endDate, state.normalized.schedule.startDate) + 1;

  for (let dayOffset = 0; dayOffset < totalDays; dayOffset += 1) {
    const date = addDaysIso(state.normalized.schedule.startDate, dayOffset);
    const weekNumber = Math.floor(dayOffset / 7) + 1;
    const week = weeks[weekNumber - 1]!;
    const weekday = isoWeekday(date);
    const workoutId = `wk_${weekNumber}_${date}`;

    if (!state.normalized.availability.runningDays.includes(weekday)) {
      workouts.push(
        buildRestWorkout({
          workoutId,
          date,
          weekday,
          weekNumber,
          phase: week.trainingPhase,
          normalized: state.normalized,
        }),
      );
      continue;
    }

    const weekTokens = selectWeekTokens({
      state,
      week,
    });
    const token = tokenForWeekday({
      tokens: weekTokens,
      weekday,
      longRunDay: state.normalized.availability.longRunDay,
      runningDays: state.normalized.availability.runningDays,
    });
    const previousRunningWorkout =
      workouts.filter((workout) => workout.workout_type !== "rest").at(-1) ?? null;
    const workout = buildWorkoutForSlot({
      state,
      context: {
        token,
        week,
        weekIndex: weekNumber - 1,
        date,
        weekday,
        previousRunningWorkout,
        selectedTokens: weekTokens,
      },
      workoutId,
    });

    workouts.push(workout);
  }

  return workouts;
}

function buildWorkoutForSlot({
  state,
  context,
  workoutId,
}: {
  state: BuilderState;
  context: SlotResolutionContext;
  workoutId: string;
}) {
  const resolvedIdentity = resolveSlotIdentity(state, context);
  const workoutContext: BuildWorkoutContext = {
    workoutId,
    date: context.date,
    weekday: context.weekday,
    weekNumber: context.week.weekNumber,
    phase: context.week.trainingPhase,
    normalized: state.normalized,
  };
  const workout = buildWorkoutByIdentity({
    identity: resolvedIdentity,
    context: workoutContext,
    normalized: state.normalized,
    familyId: state.recipe.recipeFamilyId,
  });
  const identity = workout.workout_identity ?? workout.source_workout_type ?? resolvedIdentity;
  const weekIdentities = state.builtIdentitiesByWeek.get(context.week.weekNumber) ?? [];

  state.builtIdentitiesByWeek.set(context.week.weekNumber, [...weekIdentities, identity]);
  state.builtIdentityCounts.set(identity, (state.builtIdentityCounts.get(identity) ?? 0) + 1);

  return workout;
}

function buildWorkoutByIdentity({
  identity,
  context,
  normalized,
  familyId,
}: {
  identity: string;
  context: BuildWorkoutContext;
  normalized: NormalizedStructuredInput;
  familyId: PlanPresetRecipeSummary["recipeFamilyId"];
}) {
  assertSegmentAnatomyExists(identity);

  if (identity === "recovery_jog") {
    return retagWorkout(
      buildEasyWorkout(context) as TrainingPlanV2["planned_workouts"][number],
      "recovery_jog",
      "Recovery jog",
      "Very easy recovery running.",
    );
  }

  if (identity === "easy_aerobic_run") {
    return retagWorkout(
      buildEasyWorkout(context) as TrainingPlanV2["planned_workouts"][number],
      "easy_aerobic_run",
      "Easy aerobic run",
      "Easy aerobic support run.",
    );
  }

  if (identity === "cutback_aerobic_run") {
    return buildCutbackAerobicWorkout(context) as TrainingPlanV2["planned_workouts"][number];
  }

  if (identity === "easy_run_with_strides") {
    return retagWorkout(
      buildAerobicStridesWorkout(context) as TrainingPlanV2["planned_workouts"][number],
      "easy_run_with_strides",
      "Easy run with relaxed strides",
      "Easy aerobic run with short relaxed strides.",
    );
  }

  if (identity === "steady_aerobic_run") {
    return buildSteadyWorkout(context) as TrainingPlanV2["planned_workouts"][number];
  }

  if (identity === "progression_run") {
    return buildProgressionWorkout(context) as TrainingPlanV2["planned_workouts"][number];
  }

  if (identity === "controlled_tempo_session") {
    return buildTempoWorkout(context) as TrainingPlanV2["planned_workouts"][number];
  }

  if (identity === "half_marathon_threshold_durability") {
    const workout = buildHalfMarathonThresholdWorkout(
      context,
    ) as TrainingPlanV2["planned_workouts"][number];

    return context.weekNumber === normalized.schedule.horizonWeeks
      ? {
          ...workout,
          title: "Half marathon readiness marker",
          summary: "Controlled half-marathon readiness marker without race-pace promises.",
        }
      : workout;
  }

  if (identity === "marathon_steady_specificity") {
    return buildMarathonSteadySpecificityWorkout(
      context,
    ) as TrainingPlanV2["planned_workouts"][number];
  }

  if (identity === "time_intervals") {
    return buildTimeIntervalsWorkout(context) as TrainingPlanV2["planned_workouts"][number];
  }

  if (identity === "10k_rhythm_intervals") {
    const workout = buildTenKRhythmWorkout(context) as TrainingPlanV2["planned_workouts"][number];

    return workout;
  }

  if (identity === "tenk_completion_or_checkpoint") {
    return buildTenkCompletionOrCheckpointWorkout(context, normalized);
  }

  if (identity === "half_readiness_marker") {
    return buildHalfReadinessMarkerWorkout(context, normalized);
  }

  if (identity === "long_aerobic_run") {
    return coerceLongRunIdentity(
      buildLongRunWorkout(context) as TrainingPlanV2["planned_workouts"][number],
      "long_aerobic_run",
      normalized,
    );
  }

  if (identity === "cutback_long_run") {
    return retagWorkout(
      coerceLongRunIdentity(
        buildLongRunWorkout(context) as TrainingPlanV2["planned_workouts"][number],
        "long_aerobic_run",
        normalized,
      ),
      "cutback_long_run",
      "Cutback long run",
      "Reduced long run to absorb the block.",
    );
  }

  if (identity === "long_run_with_steady_finish") {
    const workout = buildLongRunWorkout(context) as TrainingPlanV2["planned_workouts"][number];
    const title =
      familyId === "marathon_base" && context.weekNumber === normalized.schedule.horizonWeeks
        ? "Marathon base endpoint long run"
        : "Long run with steady finish";
    const summary =
      familyId === "marathon_base" && context.weekNumber === normalized.schedule.horizonWeeks
        ? "Marathon base endpoint that confirms durable long-run readiness without race-peak claims."
        : "Long aerobic run with a controlled steady finish.";

    return retagWorkout(
      {
        ...ensureSteadyFinishSegment(workout, normalized),
        title,
        summary,
      },
      "long_run_with_steady_finish",
      title,
      summary,
    );
  }

  if (identity === "base_endpoint_marker") {
    return buildBaseEndpointMarkerWorkout(context, normalized);
  }

  throw new Error(`Plan Preset builder cannot build identity ${identity}.`);
}

function buildTenkCompletionOrCheckpointWorkout(
  context: BuildWorkoutContext,
  normalized: NormalizedStructuredInput,
) {
  const title = "10K completion checkpoint";
  const summary = "Controlled 10K completion/checkpoint session without race-pace promises.";
  const workout = buildTenKRhythmWorkout(context) as TrainingPlanV2["planned_workouts"][number];

  return retagWorkout(
    {
      ...workout,
      title,
      summary,
      planned_rpe: 7,
      segments: [
        buildTimeSegment({
          workoutId: context.workoutId,
          sequence: 1,
          segmentType: "warmup",
          label: "Easy warmup",
          guidance: "Start calm and give yourself room to settle.",
          durationMin: 12,
          target: buildEasyTarget(normalized),
        }),
        {
          segment_id: `${context.workoutId}_seg_2`,
          sequence: 2,
          segment_type: "main" as const,
          label: "10K completion or checkpoint block",
          guidance:
            "Run the planned checkpoint honestly and evenly. This is not a target-time race.",
          prescription: {
            mode: "distance" as const,
            distance_km: 10,
          },
          distance_km: 10,
          target: {
            ...buildSteadyFinishTarget(normalized),
            intensity: "controlled_completion",
            cue: "Even, confident, and controlled from start to finish.",
          },
        },
        buildTimeSegment({
          workoutId: context.workoutId,
          sequence: 3,
          segmentType: "cooldown",
          label: "Easy settle",
          guidance: "Downshift before stopping.",
          durationMin: 5,
          target: buildEasyTarget(normalized, { hrBand: null }),
        }),
        buildTimeSegment({
          workoutId: context.workoutId,
          sequence: 4,
          segmentType: "cooldown",
          label: "Cooldown",
          guidance: "Finish controlled and confident.",
          durationMin: 8,
          target: buildEasyTarget(normalized),
        }),
      ],
    },
    "tenk_completion_or_checkpoint",
    title,
    summary,
  );
}

function buildHalfReadinessMarkerWorkout(
  context: BuildWorkoutContext,
  normalized: NormalizedStructuredInput,
) {
  const title = "Half marathon readiness marker";
  const summary = "Controlled half-marathon readiness marker without race-pace promises.";
  const workout = buildHalfMarathonThresholdWorkout(
    context,
  ) as TrainingPlanV2["planned_workouts"][number];

  return retagWorkout(
    {
      ...workout,
      title,
      summary,
      planned_rpe: 7,
      segments: [
        buildTimeSegment({
          workoutId: context.workoutId,
          sequence: 1,
          segmentType: "warmup",
          label: "Easy warmup",
          guidance: "Arrive patient and smooth.",
          durationMin: 12,
          target: buildEasyTarget(normalized),
        }),
        buildTimeSegment({
          workoutId: context.workoutId,
          sequence: 2,
          segmentType: "main",
          label: "Easy or steady base block",
          guidance: "Build into the session calmly.",
          durationMin: 30,
          target: buildLongRunTarget(normalized),
        }),
        buildTimeSegment({
          workoutId: context.workoutId,
          sequence: 3,
          segmentType: "main",
          label: "Readiness marker block",
          guidance: "Finish with calm half-specific intent, not a race press.",
          durationMin: 18,
          target: {
            ...buildSteadyFinishTarget(normalized),
            intensity: "controlled_half_specific",
            cue: "Calm half-specific intent, smooth enough to finish with control.",
          },
        }),
        buildTimeSegment({
          workoutId: context.workoutId,
          sequence: 4,
          segmentType: "cooldown",
          label: "Cooldown",
          guidance: "Bring effort down smoothly.",
          durationMin: 8,
          target: buildEasyTarget(normalized),
        }),
      ],
    },
    "half_readiness_marker",
    title,
    summary,
  );
}

function buildBaseEndpointMarkerWorkout(
  context: BuildWorkoutContext,
  normalized: NormalizedStructuredInput,
) {
  const title = "Marathon base endpoint marker";
  const summary = "Durable marathon-base endpoint without race-peak claims.";
  const workout = buildLongRunWorkout(context) as TrainingPlanV2["planned_workouts"][number];

  return retagWorkout(
    {
      ...workout,
      title,
      summary,
      planned_rpe: 6,
      segments: [
        buildTimeSegment({
          workoutId: context.workoutId,
          sequence: 1,
          segmentType: "warmup",
          label: "Easy warmup",
          guidance: "Start patient and economical.",
          durationMin: 12,
          target: buildEasyTarget(normalized),
        }),
        buildTimeSegment({
          workoutId: context.workoutId,
          sequence: 2,
          segmentType: "main",
          label: "Durable base block",
          guidance: "Show durable marathon composure without forcing pace.",
          durationMin: 50,
          target: {
            ...buildLongRunTarget(normalized),
            intensity: "steady_plus",
            cue: "Durable and composed; this is a base endpoint, not marathon race pace.",
          },
        }),
        buildTimeSegment({
          workoutId: context.workoutId,
          sequence: 3,
          segmentType: "main",
          label: "Easy settle",
          guidance: "Downshift before finishing.",
          durationMin: 5,
          target: buildEasyTarget(normalized, { hrBand: null }),
        }),
        buildTimeSegment({
          workoutId: context.workoutId,
          sequence: 4,
          segmentType: "cooldown",
          label: "Cooldown",
          guidance: "Finish calm and durable.",
          durationMin: 8,
          target: buildEasyTarget(normalized),
        }),
      ],
    },
    "base_endpoint_marker",
    title,
    summary,
  );
}

function buildTimeSegment({
  workoutId,
  sequence,
  segmentType,
  label,
  guidance,
  durationMin,
  target,
}: {
  workoutId: string;
  sequence: number;
  segmentType: "warmup" | "main" | "cooldown";
  label: string;
  guidance: string;
  durationMin: number;
  target: Record<string, unknown>;
}) {
  return {
    segment_id: `${workoutId}_seg_${sequence}`,
    sequence,
    segment_type: segmentType,
    label,
    guidance,
    prescription: {
      mode: "time" as const,
      duration_min: durationMin,
    },
    duration_min: durationMin,
    target,
  };
}

function resolveSlotIdentity(state: BuilderState, context: SlotResolutionContext) {
  if (context.token === "rest_or_floating") {
    return "rest_and_recovery";
  }

  const rule = findBuilderIoRule({
    state,
    token: context.token,
    phaseName: context.week.sourcePhaseName,
  });

  if (!rule) {
    return context.token;
  }

  return normalizeMarkerIdentity(
    shouldUseFallbackIdentity({ state, context, rule })
      ? rule.fallbackOutputIdentity
      : rule.canonicalOutputIdentity,
  );
}

function shouldUseFallbackIdentity({
  state,
  context,
  rule,
}: {
  state: BuilderState;
  context: SlotResolutionContext;
  rule: PlanPresetBuilderIoContract;
}) {
  const previousIsLongRun = context.previousRunningWorkout?.workout_type === "long_run";
  const weekIdentities = state.builtIdentitiesByWeek.get(context.week.weekNumber) ?? [];
  const progressionCount = state.builtIdentityCounts.get("progression_run") ?? 0;
  const supportBaseStable = context.week.sourcePhaseOrder >= 3;
  const inFinalWeek = context.week.weekNumber === state.normalized.schedule.horizonWeeks;
  const lowerConservatism =
    state.program.progressionConservatism === "baseline" ||
    state.program.progressionConservatism === "moderate";

  switch (rule.fallbackCondition) {
    case "no_fallback":
      return false;
    case "unless_after_long_run_or_cutback":
      return !(previousIsLongRun || context.week.sourcePhaseName.includes("cutback"));
    case "if_prior_long_run_or_heavier_outcome":
    case "if_next_running_slot_after_long_run":
    case "if_endpoint_or_recent_long_run_needs_more_recovery":
      return previousIsLongRun;
    case "if_strides_not_supported_this_week":
      return previousIsLongRun || context.week.sourcePhaseName.includes("cutback");
    case "after_two_stable_base_weeks":
      return context.week.sourcePhaseOrder >= 3 && context.week.weekNumber > 3;
    case "if_conservatism_remains_high":
      return (
        state.program.progressionConservatism === "high" ||
        state.program.progressionConservatism === "maximum_preset"
      );
    case "after_progression_tolerance_proven":
      return progressionCount >= 2 && lowerConservatism;
    case "if_progression_already_repeated":
      return progressionCount >= 2 && lowerConservatism;
    case "after_clear_support_base":
      return !supportBaseStable;
    case "if_checkpoint_not_due_this_week":
      return !inFinalWeek;
    case "if_endpoint_week_still_needs_reduced_long_load":
      return !inFinalWeek;
    case "if_support_is_fuller_and_conservatism_lower":
      return state.daysPerWeek >= 4 && lowerConservatism && context.week.sourcePhaseOrder >= 3;
    case "if_no_other_specific_touch_and_durability_stable":
      return (
        context.week.sourcePhaseOrder >= 3 &&
        !weekIdentities.some((identity) => specificIdentitySet.has(identity))
      );
    case "only_in_stronger_later_variants":
      return state.daysPerWeek >= 4 && context.week.sourcePhaseOrder >= 4 && lowerConservatism;
    case "if_midweek_touch_is_lighter":
      return !weekIdentities.some((identity) => specificIdentitySet.has(identity));
    case "if_tempo_would_be_too_heavy":
      return previousIsLongRun || !lowerConservatism;
    case "only_if_marker_already_exists_earlier":
      return false;
    case "if_final_block_load_is_heavier_than_expected":
      return previousIsLongRun;
    case "if_steady_would_overload_endpoint_week":
      return inFinalWeek || previousIsLongRun;
    case "only_if_endpoint_metadata_remains_explicit":
      return false;
    default:
      return false;
  }
}

function selectPhaseTemplateRows({
  recipe,
  program,
  runnerLevel,
  daysPerWeek,
}: {
  recipe: PlanPresetRecipeSummary;
  program: ResolvedPlanPresetProgram;
  runnerLevel: Exclude<RunnerFitnessLevel, "custom">;
  daysPerWeek: number;
}) {
  const rows = getPlanPresetPhaseTemplates();
  const exactRows = rows.filter(
    (row) =>
      row.familyId === recipe.recipeFamilyId &&
      row.runnerLevel === runnerLevel &&
      rangeIncludes(row.daysPerWeek, daysPerWeek) &&
      program.durationWeeks >= row.durationMinWeeks &&
      program.durationWeeks <= row.durationMaxWeeks,
  );

  if (exactRows.length > 0) {
    return exactRows.sort((left, right) => left.phaseOrder - right.phaseOrder);
  }

  const fallbackRunnerLevels = Array.from(
    new Set(
      [
        runnerLevel,
        runnerLevel === "performance_focused" ? "running_regularly" : null,
        runnerLevel === "new_to_running" ? "beginner" : null,
        "beginner",
        "running_regularly",
      ].filter(Boolean),
    ),
  ) as Array<Exclude<RunnerFitnessLevel, "custom">>;
  const fallbackRows = fallbackRunnerLevels
    .map((fallbackRunnerLevel) =>
      rows.filter(
        (row) =>
          row.familyId === recipe.recipeFamilyId &&
          row.runnerLevel === fallbackRunnerLevel &&
          rangeIncludes(row.daysPerWeek, daysPerWeek),
      ),
    )
    .find((candidates) => candidates.length > 0);

  if (fallbackRows && fallbackRows.length > 0) {
    return fallbackRows.sort((left, right) => left.phaseOrder - right.phaseOrder);
  }

  const lowFrequencyFallbackRows = fallbackRunnerLevels
    .map((fallbackRunnerLevel) =>
      rows.filter(
        (row) =>
          row.familyId === recipe.recipeFamilyId &&
          row.runnerLevel === fallbackRunnerLevel &&
          rangeIncludes(row.daysPerWeek, Math.max(2, Math.min(daysPerWeek, 3))),
      ),
    )
    .find((candidates) => candidates.length > 0);

  if (lowFrequencyFallbackRows && lowFrequencyFallbackRows.length > 0) {
    return lowFrequencyFallbackRows.sort((left, right) => left.phaseOrder - right.phaseOrder);
  }

  throw new Error(
    `Plan Preset phase template is missing ${recipe.recipeFamilyId}/${runnerLevel}/${daysPerWeek}d.`,
  );
}

function allocatePhaseWeeks(phaseRows: PlanPresetPhaseTemplate[], durationWeeks: number) {
  const allocations = phaseRows.map((phase) => ({
    phase,
    weekCount: Math.max(phase.phaseMinWeeks, Math.round(durationWeeks * phase.phaseTargetRatio)),
  }));
  let total = allocations.reduce((sum, allocation) => sum + allocation.weekCount, 0);

  while (total < durationWeeks) {
    const candidate =
      allocations
        .slice()
        .reverse()
        .find((allocation) => !isFinalPhase(allocation.phase.phaseName)) ?? allocations[0]!;

    candidate.weekCount += 1;
    total += 1;
  }

  while (total > durationWeeks) {
    const candidate = allocations
      .slice()
      .sort((left, right) => right.weekCount - left.weekCount)
      .find((allocation) => allocation.weekCount > allocation.phase.phaseMinWeeks);

    if (!candidate) break;
    candidate.weekCount -= 1;
    total -= 1;
  }

  return allocations.filter((allocation) => allocation.weekCount > 0);
}

function selectWeeklyArchetype({
  familyId,
  daysPerWeek,
  phaseName,
  weekNumber,
  finalWeek,
}: {
  familyId: PlanPresetRecipeSummary["recipeFamilyId"];
  daysPerWeek: number;
  phaseName: string;
  weekNumber: number;
  finalWeek: number;
}) {
  const normalizedPhaseName = normalizeArchetypePhaseName(
    familyId,
    phaseName,
    weekNumber,
    finalWeek,
  );
  const rows = getPlanPresetWeeklyArchetypes().filter(
    (row) => row.familyId === familyId && rangeIncludes(row.daysPerWeek, daysPerWeek),
  );
  const archetype =
    rows
      .filter((row) => row.phaseName === normalizedPhaseName)
      .sort(
        (left, right) => specificityScore(right.daysPerWeek) - specificityScore(left.daysPerWeek),
      )[0] ??
    getPlanPresetWeeklyArchetypes()
      .filter((row) => row.familyId === familyId && row.phaseName === normalizedPhaseName)
      .sort(
        (left, right) =>
          archetypeDayDistance(left.daysPerWeek, daysPerWeek) -
          archetypeDayDistance(right.daysPerWeek, daysPerWeek),
      )[0] ??
    rows
      .filter((row) => row.phaseName === fallbackArchetypePhaseName(familyId, normalizedPhaseName))
      .sort(
        (left, right) => specificityScore(right.daysPerWeek) - specificityScore(left.daysPerWeek),
      )[0] ??
    rows[0];

  if (!archetype) {
    throw new Error(
      `Plan Preset weekly archetype is missing ${familyId}/${daysPerWeek}d/${normalizedPhaseName}.`,
    );
  }

  return archetype;
}

function selectWeekTokens({ state, week }: { state: BuilderState; week: PlanPresetBuiltWeek }) {
  const archetype = selectWeeklyArchetype({
    familyId: state.recipe.recipeFamilyId,
    daysPerWeek: state.daysPerWeek,
    phaseName: week.sourcePhaseName,
    weekNumber: week.weekNumber,
    finalWeek: state.normalized.schedule.horizonWeeks,
  });
  const entries = archetype.slots
    .map((token, index) => ({ token, slotId: `slot_${index + 1}` }))
    .filter((entry) => entry.token !== "rest_or_floating");
  const longRunEntry =
    entries.find((entry) => entry.slotId === archetype.longRunSlot) ??
    entries.find((entry) => tokenLooksLikeLongRun(entry.token)) ??
    entries.at(-1)!;
  const essentialEntries = entries.filter(
    (entry) =>
      entry === longRunEntry ||
      tokenLooksSpecific(entry.token) ||
      tokenLooksLikeFinalOutcome(entry.token),
  );
  const selected = [...essentialEntries];

  for (const entry of entries) {
    if (selected.includes(entry)) continue;
    if (selected.length >= state.daysPerWeek) break;
    selected.push(entry);
  }

  const tokens = selected
    .sort((left, right) => Number(left.slotId.slice(5)) - Number(right.slotId.slice(5)))
    .slice(0, state.daysPerWeek)
    .map((entry) => entry.token);

  return limitSpecificTokens(
    rotateHalfLongRunSpecificity({
      tokens: ensureLowFrequencyDevelopmentToken({
        tokens: ensureCutbackLongRunToken({
          tokens: ensureFinalOutcomeToken({
            tokens,
            familyId: state.recipe.recipeFamilyId,
            weekNumber: week.weekNumber,
            finalWeek: state.normalized.schedule.horizonWeeks,
          }),
          state,
          week,
        }),
        state,
        week,
      }),
      state,
      week,
    }),
  );
}

function tokenForWeekday({
  tokens,
  weekday,
  longRunDay,
  runningDays,
}: {
  tokens: string[];
  weekday: StructuredWeekday;
  longRunDay: StructuredWeekday;
  runningDays: StructuredWeekday[];
}) {
  const longTokenIndex = tokens.findIndex(
    (token) => tokenLooksLikeLongRun(token) || tokenLooksLikeFinalOutcome(token),
  );

  if (weekday === longRunDay && longTokenIndex !== -1) {
    return tokens[longTokenIndex]!;
  }

  const nonLongTokens = tokens.filter((_, index) => index !== longTokenIndex);
  const nonLongDays = runningDays.filter((day) => day !== longRunDay);
  const dayIndex = nonLongDays.indexOf(weekday);

  return nonLongTokens[dayIndex] ?? "easy_recovery_support";
}

function findBuilderIoRule({
  state,
  token,
  phaseName,
}: {
  state: BuilderState;
  token: string;
  phaseName: string;
}) {
  const allTokenRules = getPlanPresetBuilderIoContracts().filter(
    (rule) =>
      rule.contractType === "weekly_slot_alias" &&
      rule.sourceTokenOrMarker === token &&
      (rule.familyId === state.recipe.recipeFamilyId || rule.familyId === "all_supported_families"),
  );
  const rules = allTokenRules.filter(
    (rule) =>
      rangeIncludes(rule.daysPerWeek, state.daysPerWeek) &&
      runnerLevelMatches(rule.runnerLevel, state.runnerLevel),
  );
  const fallbackRules = rules.length > 0 ? rules : allTokenRules;

  return (
    fallbackRules
      .filter((rule) => phaseMatches(rule.appliesToPhase, phaseName))
      .sort((left, right) => ruleSpecificity(right, state) - ruleSpecificity(left, state))[0] ??
    fallbackRules.sort(
      (left, right) => ruleSpecificity(right, state) - ruleSpecificity(left, state),
    )[0]
  );
}

function coerceLongRunIdentity(
  workout: TrainingPlanV2["planned_workouts"][number],
  identity: "long_aerobic_run",
  normalized: NormalizedStructuredInput,
) {
  return retagWorkout(
    {
      ...workout,
      segments: workout.segments.map((segment) => {
        if (!/steady finish/i.test(segment.label ?? "")) {
          return segment;
        }

        return {
          ...segment,
          label: "Patient long-run finish",
          guidance: "Keep the finish easy and controlled rather than pressing into steady work.",
          target: buildLongRunTarget(normalized),
        };
      }),
    },
    identity,
    "Long aerobic run",
    "Long aerobic run.",
  );
}

function ensureSteadyFinishSegment(
  workout: TrainingPlanV2["planned_workouts"][number],
  normalized: NormalizedStructuredInput,
) {
  if (workout.segments.some((segment) => /steady finish/i.test(segment.label ?? ""))) {
    return workout;
  }

  const lastSegment = workout.segments.at(-1);

  if (!lastSegment) return workout;

  return {
    ...workout,
    segments: workout.segments.map((segment, index, sourceSegments) =>
      index === sourceSegments.length - 1
        ? {
            ...segment,
            label: "Controlled steady finish",
            guidance: "Gently lift the effort late, but keep it sustainable and relaxed.",
            target: buildSteadyFinishTarget(normalized),
          }
        : segment,
    ),
  };
}

function assertSegmentAnatomyExists(identity: string) {
  const hasAnatomy = getPlanPresetSegmentAnatomyTable().some(
    (entry) => entry.identity === identity,
  );

  if (!hasAnatomy) {
    throw new Error(`Plan Preset segment anatomy is missing identity ${identity}.`);
  }
}

function normalizeMarkerIdentity(identity: string) {
  if (identity === "none" || identity === "rest_day") return "rest_and_recovery";

  return identity;
}

function hasIdentityPresence({
  identitySet,
  familyId,
  gateId,
}: {
  identitySet: Set<string>;
  familyId: PlanPresetRecipeSummary["recipeFamilyId"];
  gateId: string;
}) {
  if (familyId === "10k_foundation") {
    return [
      "easy_run_with_strides",
      "progression_run",
      "10k_rhythm_intervals",
      "tenk_completion_or_checkpoint",
    ].some((identity) => identitySet.has(identity));
  }

  if (familyId === "half_marathon_balanced") {
    return [
      "progression_run",
      "controlled_tempo_session",
      "half_marathon_threshold_durability",
      "half_readiness_marker",
      "long_run_with_steady_finish",
    ].some((identity) => identitySet.has(identity));
  }

  if (familyId === "marathon_base") {
    return [
      "marathon_steady_specificity",
      "long_run_with_steady_finish",
      "base_endpoint_marker",
    ].some((identity) => identitySet.has(identity));
  }

  return identitySet.has(gateId);
}

function hasPhaseIdentityPresence({
  canonicalPlan,
  familyId,
}: {
  canonicalPlan: TrainingPlanV2;
  familyId: PlanPresetRecipeSummary["recipeFamilyId"];
  gateId: string;
}) {
  const lateWorkouts = canonicalPlan.planned_workouts.filter(
    (workout) =>
      workout.week_number >= Math.ceil((canonicalPlan.preparation_horizon_weeks ?? 1) * 0.45),
  );
  const identities = new Set(
    lateWorkouts.map((workout) => workout.workout_identity ?? workout.source_workout_type ?? ""),
  );

  return hasIdentityPresence({ identitySet: identities, familyId, gateId: "" });
}

function hasFinalOutcomePresence(
  canonicalPlan: TrainingPlanV2,
  familyId: PlanPresetRecipeSummary["recipeFamilyId"],
) {
  const finalWeek = canonicalPlan.preparation_horizon_weeks ?? 1;
  const finalWeekWorkouts = canonicalPlan.planned_workouts.filter(
    (workout) => workout.week_number === finalWeek,
  );
  const finalIdentitySet = new Set(
    finalWeekWorkouts.map((workout) => workout.workout_identity ?? workout.source_workout_type),
  );

  if (familyId === "10k_foundation") {
    return finalIdentitySet.has("tenk_completion_or_checkpoint");
  }

  if (familyId === "half_marathon_balanced") {
    return finalIdentitySet.has("half_readiness_marker");
  }

  return finalIdentitySet.has("base_endpoint_marker");
}

function hasLowFrequencyDevelopmentMotif(canonicalPlan: TrainingPlanV2, minimumCount: number) {
  const developmentCount = canonicalPlan.planned_workouts.filter((workout) =>
    [
      "easy_run_with_strides",
      "progression_run",
      "10k_rhythm_intervals",
      "tenk_completion_or_checkpoint",
    ].includes(workout.workout_identity ?? ""),
  ).length;

  return developmentCount >= minimumCount;
}

function assertAtMostOneSpecificTouchPerWeek(
  canonicalPlan: TrainingPlanV2,
  gateDescription: string,
) {
  const countsByWeek = new Map<number, number>();

  for (const workout of canonicalPlan.planned_workouts) {
    const identity = workout.workout_identity ?? workout.source_workout_type ?? "";

    if (!specificIdentitySet.has(identity)) continue;

    countsByWeek.set(workout.week_number, (countsByWeek.get(workout.week_number) ?? 0) + 1);
  }

  for (const [weekNumber, count] of countsByWeek) {
    if (count > 1) {
      throw new Error(
        `Plan Preset weekly density gate failed: ${gateDescription}; week ${weekNumber} has ${count} specific touches.`,
      );
    }
  }
}

function assertPostLongRunRecoveryOrEasy(canonicalPlan: TrainingPlanV2, gateDescription: string) {
  const nonRestWorkouts = canonicalPlan.planned_workouts.filter(
    (workout) => workout.workout_type !== "rest",
  );

  for (const [index, workout] of nonRestWorkouts.entries()) {
    if (workout.workout_type !== "long_run") continue;

    const nextWorkout = nonRestWorkouts[index + 1];

    if (!nextWorkout) continue;

    if (
      nextWorkout.workout_identity !== "recovery_jog" &&
      nextWorkout.workout_identity !== "easy_aerobic_run"
    ) {
      throw new Error(
        `Plan Preset spacing gate failed: ${gateDescription}; ${nextWorkout.date} is ${nextWorkout.workout_identity}.`,
      );
    }
  }
}

function findFinalOutcomeIdentities(canonicalPlan: TrainingPlanV2) {
  const finalWeek = canonicalPlan.preparation_horizon_weeks ?? 1;

  return Array.from(
    new Set(
      canonicalPlan.planned_workouts
        .filter((workout) => workout.week_number === finalWeek && workout.workout_type !== "rest")
        .map(
          (workout) =>
            workout.workout_identity ?? workout.source_workout_type ?? workout.workout_type,
        ),
    ),
  );
}

function normalizeArchetypePhaseName(
  familyId: PlanPresetRecipeSummary["recipeFamilyId"],
  phaseName: string,
  weekNumber: number,
  finalWeek: number,
) {
  if (isFinalPhase(phaseName) || weekNumber === finalWeek) {
    if (familyId === "marathon_base") return "base_endpoint";
    if (familyId === "half_marathon_balanced") return "completion";
    return "completion";
  }

  if (phaseName === "adaptation" || phaseName === "aerobic_development") return "base";
  if (phaseName === "cutback_recovery") {
    if (familyId === "10k_foundation") return "cutback_recovery";
    return familyId === "marathon_base" ? "long_run_specificity" : "half_specificity";
  }
  if (phaseName === "controlled_tempo" || phaseName === "threshold_durability") {
    return familyId === "half_marathon_balanced" && phaseName === "threshold_durability"
      ? "threshold_durability"
      : "progression_tempo";
  }

  return phaseName;
}

function fallbackArchetypePhaseName(
  familyId: PlanPresetRecipeSummary["recipeFamilyId"],
  phaseName: string,
) {
  if (familyId === "10k_foundation") {
    return phaseName === "completion" ? "completion" : "progression_rhythm";
  }

  if (familyId === "half_marathon_balanced") {
    if (phaseName === "completion") return "half_specificity";
    if (phaseName === "threshold_durability") return "progression_tempo";
    return "base";
  }

  if (phaseName === "base_endpoint") return "long_run_specificity";
  if (phaseName === "base") return "marathon_specificity";
  return "marathon_specificity";
}

function ensureFinalOutcomeToken({
  tokens,
  familyId,
  weekNumber,
  finalWeek,
}: {
  tokens: string[];
  familyId: PlanPresetRecipeSummary["recipeFamilyId"];
  weekNumber: number;
  finalWeek: number;
}) {
  if (weekNumber !== finalWeek) {
    return tokens;
  }

  const finalToken =
    familyId === "10k_foundation"
      ? "10k_completion_or_checkpoint"
      : familyId === "half_marathon_balanced"
        ? "readiness_marker_or_long_run_specificity"
        : "base_endpoint_long_run_or_shorter_specific_long";
  const longIndex = tokens.findIndex((token) => tokenLooksLikeLongRun(token));

  if (longIndex !== -1) {
    return tokens.map((token, index) => {
      if (index === longIndex) {
        return finalToken;
      }

      return tokenLooksLikeLongRun(token) ? "easy_recovery_support" : token;
    });
  }

  return tokens.length > 0 ? [finalToken, ...tokens.slice(1)] : [finalToken];
}

function ensureLowFrequencyDevelopmentToken({
  tokens,
  state,
  week,
}: {
  tokens: string[];
  state: BuilderState;
  week: PlanPresetBuiltWeek;
}) {
  if (
    state.recipe.recipeFamilyId !== "10k_foundation" ||
    state.daysPerWeek !== 2 ||
    week.sourcePhaseOrder < 3 ||
    week.weekNumber === state.normalized.schedule.horizonWeeks ||
    week.weekNumber % 3 !== 0
  ) {
    return tokens;
  }

  const longIndex = tokens.findIndex((token) => tokenLooksLikeLongRun(token));

  if (longIndex === -1) {
    return tokens;
  }

  return tokens.map((token, index) =>
    index === longIndex ? "10k_completion_or_checkpoint" : token,
  );
}

function ensureCutbackLongRunToken({
  tokens,
  state,
  week,
}: {
  tokens: string[];
  state: BuilderState;
  week: PlanPresetBuiltWeek;
}) {
  const interval = state.program.cutbackFrequency.includes("3rd") ? 3 : 4;
  const shouldCutback =
    week.sourcePhaseName === "cutback_recovery" ||
    (week.weekNumber > 2 &&
      week.weekNumber < state.normalized.schedule.horizonWeeks &&
      week.weekNumber % interval === 0);

  if (!shouldCutback) {
    return tokens;
  }

  const longIndex = tokens.findIndex((token) => tokenLooksLikeLongRun(token));

  if (longIndex === -1) {
    return tokens;
  }

  return tokens.map((token, index) => (index === longIndex ? "cutback_long_run" : token));
}

function rotateHalfLongRunSpecificity({
  tokens,
  state,
  week,
}: {
  tokens: string[];
  state: BuilderState;
  week: PlanPresetBuiltWeek;
}) {
  if (
    state.recipe.recipeFamilyId !== "half_marathon_balanced" ||
    week.weekNumber === state.normalized.schedule.horizonWeeks ||
    week.sourcePhaseOrder < 5 ||
    week.weekNumber % 2 !== 0
  ) {
    return tokens;
  }

  return tokens.map((token) =>
    tokenLooksSpecific(token) && !tokenLooksLikeLongRun(token) ? "easy_recovery_support" : token,
  );
}

function limitSpecificTokens(tokens: string[]) {
  const finalTokenIndex = tokens.findIndex((token) => tokenLooksLikeFinalOutcome(token));

  if (finalTokenIndex !== -1) {
    return tokens.map((token, index) =>
      index !== finalTokenIndex && tokenLooksSpecific(token) ? "easy_recovery_support" : token,
    );
  }

  let hasSpecificToken = false;

  return tokens.map((token) => {
    if (!tokenLooksSpecific(token)) {
      return token;
    }

    if (!hasSpecificToken) {
      hasSpecificToken = true;
      return token;
    }

    return "easy_recovery_support";
  });
}

function mapPresetPhaseToTrainingPhase(
  phaseName: string,
  weekNumber: number,
  horizonWeeks: number,
): TrainingPhase {
  if (isFinalPhase(phaseName)) return "Specific";
  if (phaseName === "marathon_specificity") return "Build";
  if (phaseName.includes("specific") || phaseName.includes("threshold")) return "Specific";
  if (phaseName.includes("progression") || phaseName.includes("tempo")) return "Build";
  if (phaseName.includes("cutback")) return "Base";

  return phaseForWeek(weekNumber, horizonWeeks);
}

function isFinalPhase(phaseName: string) {
  return phaseName === "completion" || phaseName === "base_endpoint";
}

function phaseMatches(appliesToPhase: string, phaseName: string) {
  if (appliesToPhase === "any") return true;
  if (appliesToPhase === phaseName) return true;
  if (appliesToPhase === "base_or_cutback") {
    return phaseName === "base" || phaseName === "adaptation" || phaseName === "cutback_recovery";
  }
  if (appliesToPhase === "completion_or_light_week") {
    return (
      isFinalPhase(phaseName) || phaseName === "completion" || phaseName === "cutback_recovery"
    );
  }

  return appliesToPhase.split("_or_").includes(phaseName);
}

function runnerLevelMatches(
  ruleRunnerLevel: string,
  runnerLevel: Exclude<RunnerFitnessLevel, "custom">,
) {
  if (ruleRunnerLevel === "all") return true;
  if (ruleRunnerLevel === runnerLevel) return true;
  if (ruleRunnerLevel === "beginner" && runnerLevel === "new_to_running") return true;
  if (ruleRunnerLevel === "new_to_running_or_beginner") {
    return runnerLevel === "new_to_running" || runnerLevel === "beginner";
  }
  if (ruleRunnerLevel === "running_regularly_or_performance_focused") {
    return runnerLevel === "running_regularly" || runnerLevel === "performance_focused";
  }

  return false;
}

function ruleSpecificity(rule: PlanPresetBuilderIoContract, state: BuilderState) {
  let score = rule.resolutionPriority;

  if (rule.familyId === state.recipe.recipeFamilyId) score += 10;
  if (rule.runnerLevel === state.runnerLevel) score += 5;
  if (/^\d+$/.test(rule.daysPerWeek)) score += 3;

  return score;
}

function specificityScore(daysPerWeek: string) {
  return /^\d+$/.test(daysPerWeek) ? 2 : 1;
}

function archetypeDayDistance(daysPerWeek: string, value: number) {
  if (/^\d+$/.test(daysPerWeek)) return Math.abs(Number(daysPerWeek) - value);

  const match = daysPerWeek.match(/^(\d+)-(\d+)$/);

  if (!match) return 99;

  if (value >= Number(match[1]) && value <= Number(match[2])) return 0;

  return Math.min(Math.abs(Number(match[1]) - value), Math.abs(Number(match[2]) - value));
}

function rangeIncludes(range: string, value: number) {
  const trimmed = range.trim();

  if (trimmed === "all") return true;
  if (/^\d+$/.test(trimmed)) return Number(trimmed) === value;

  const match = trimmed.match(/^(\d+)-(\d+)$/);

  if (!match) return false;

  return value >= Number(match[1]) && value <= Number(match[2]);
}

function tokenLooksLikeLongRun(token: string) {
  return /long_run|long_aerobic|cutback_long|short_long|base_endpoint/.test(token);
}

function tokenLooksLikeFinalOutcome(token: string) {
  return /completion|checkpoint|readiness_marker|base_endpoint/.test(token);
}

function tokenLooksSpecific(token: string) {
  return /specific|tempo|threshold|progression|rhythm|checkpoint|readiness|marker/.test(token);
}
