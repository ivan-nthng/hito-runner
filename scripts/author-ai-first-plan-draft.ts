import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import {
  generateAiFirstPlanDraftPreview,
  type AiFirstPlanGenerationContract,
  type AiFirstPlanDraftServiceInputKind,
} from "../src/lib/ai-first-plan-draft-service";
import {
  AI_FIRST_PLAN_DRAFT_SCHEMA_VERSION,
  type AiFirstPlanDraft,
} from "../src/lib/ai-first-plan-draft-authoring";
import {
  AI_FIRST_PLAN_BLUEPRINT_SCHEMA_VERSION,
  type AiFirstPlanBlueprint,
} from "../src/lib/ai-first-plan-blueprint-authoring";
import type { TrainingPlanV2 } from "../src/lib/imported-plan";
import { resolveCanonicalWorkoutModel } from "../src/lib/rich-workout-model";
import {
  buildStructuredFirstPlanAuthoringInput,
  parseStructuredFirstPlanOnboardingInput,
  type StructuredFirstPlanAuthoringInput,
} from "../src/lib/structured-first-plan-onboarding";
import {
  buildStructuredAuthoringPlan,
  structuredPlanAuthoringInputSchema,
} from "../src/lib/structured-plan-authoring";
import { addDaysIso, type Step, type StepPrescription } from "../src/lib/training";

type ParsedArgs = Record<string, string | true>;
type ScriptMode = "mock" | "mock_invalid" | "mock_timeout" | "live";
type FixtureKind = "one_week_smoke" | "compact_smoke" | "full_half" | "identity_coverage";

const COACH_SAMPLE_IDENTITIES = [
  "5k_sharpening_repeats",
  "10k_rhythm_intervals",
  "race_pace_session",
  "taper_tuneup_run",
  "marathon_steady_specificity",
  "controlled_downhill_durability",
  "hike_run_endurance",
  "mountain_long_run_time_on_feet",
] as const;

const DEFAULT_REFERENCE_FILE =
  "/Users/ivan/Downloads/ivan_half_marathon_training_plan_v2_full_2026-05-05.json";
type BlueprintWorkout = AiFirstPlanBlueprint["weeks"][number]["plannedWorkouts"][number];
type MockCadenceSpec = {
  family: BlueprintWorkout["workoutFamily"];
  identity: BlueprintWorkout["workoutIdentity"];
  icon: BlueprintWorkout["calendarIconKey"];
  title: string;
};

const options = parseArgs(process.argv.slice(2));

if (hasFlag(options, "help")) {
  printHelp();
  process.exit(0);
}

const mode = resolveMode(options);
const inputKind = parseInputKind(options["input-kind"]);
const contractMode = parseContractMode(options.contract);
const fixtureKind = parseFixtureKind(options.fixture);
const input = await readInput(options, inputKind, fixtureKind);
const referenceExample = hasFlag(options, "no-reference")
  ? null
  : await readReferenceExample(stringOption(options["reference-file"]));
const timeoutMs = parsePositiveIntegerOption(options["timeout-ms"]) ?? 45_000;
const maxOutputTokens = parsePositiveIntegerOption(options["max-output-tokens"]) ?? 32_000;
const authoringInput = resolveAuthoringInput(input, inputKind);
const includeCoachSample = hasFlag(options, "coach-sample");
const fetchImpl =
  mode === "live"
    ? undefined
    : buildMockOpenAiFetch(mode, authoringInput, contractMode, fixtureKind);

const result = await generateAiFirstPlanDraftPreview({
  input,
  inputKind,
  referenceExample,
  timeoutMs,
  maxOutputTokens,
  contractMode,
  apiKey: mode === "live" ? undefined : "mock-openai-key",
  model: mode === "live" ? undefined : "mock-ai-first-plan-draft-model",
  fetchImpl,
});

if (!result.ok) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        mode,
        contractMode,
        inputKind,
        fixture: fixtureKind,
        referenceIncluded: Boolean(referenceExample),
        reason: result.reason,
        issues: result.issues,
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
} else {
  console.log(
    JSON.stringify(
      {
        ok: true,
        mode,
        contractMode,
        inputKind,
        fixture: fixtureKind,
        referenceIncluded: Boolean(referenceExample),
        persisted: false,
        planName: result.canonicalPlan.plan_name,
        schemaVersion: result.canonicalPlan.schema_version,
        sourceKind: result.canonicalPlan.source_kind,
        sourceStatus: result.metadata.status,
        fallbackReason: result.metadata.fallbackReason,
        validationIssueCount: result.metadata.validationIssueCount,
        validationIssues: result.metadata.validationIssues.slice(0, 6),
        repairs: result.metadata.repairs.slice(0, 6),
        model: result.metadata.model,
        responseId: result.metadata.responseId,
        elapsedMs: result.metadata.elapsedMs,
        debug: result.metadata.debug,
        workoutCount: result.canonicalPlan.planned_workouts.length,
        weekCount: countWeeks(result.canonicalPlan),
        sampleWeeks: buildSampleWeeks(result.canonicalPlan),
        coachSample: includeCoachSample
          ? buildCoachSample(result.canonicalPlan, COACH_SAMPLE_IDENTITIES)
          : undefined,
      },
      null,
      2,
    ),
  );
}

async function readInput(
  options: ParsedArgs,
  inputKind: AiFirstPlanDraftServiceInputKind,
  fixtureKind: FixtureKind,
) {
  const inputFile = stringOption(options["input-file"]);

  if (inputFile) {
    return JSON.parse(await readFile(inputFile, "utf8")) as unknown;
  }

  if (inputKind === "structured_onboarding") {
    throw new Error("--input-file is required when --input-kind structured_onboarding is used.");
  }

  return buildDefaultAuthoringInput(fixtureKind);
}

async function readReferenceExample(referenceFileOption: string | null) {
  const referenceFile = referenceFileOption ?? DEFAULT_REFERENCE_FILE;

  if (!existsSync(referenceFile)) {
    return null;
  }

  try {
    return JSON.parse(await readFile(referenceFile, "utf8")) as unknown;
  } catch {
    return null;
  }
}

function resolveAuthoringInput(input: unknown, inputKind: AiFirstPlanDraftServiceInputKind) {
  if (inputKind === "structured_onboarding") {
    return buildStructuredFirstPlanAuthoringInput(parseStructuredFirstPlanOnboardingInput(input));
  }

  return structuredPlanAuthoringInputSchema.parse(input);
}

function buildMockOpenAiFetch(
  mode: Exclude<ScriptMode, "live">,
  authoringInput: StructuredFirstPlanAuthoringInput,
  contractMode: AiFirstPlanGenerationContract,
  fixtureKind: FixtureKind,
) {
  if (mode === "mock_timeout") {
    return (async () => new Promise<Response>(() => undefined)) as typeof fetch;
  }

  return (async (_input, _init) => {
    if (mode === "mock_invalid") {
      return openAiFixtureResponse(
        "mock-invalid-ai-first-plan",
        contractMode === "blueprint"
          ? {
              schemaVersion: AI_FIRST_PLAN_BLUEPRINT_SCHEMA_VERSION,
              planName: "Invalid mock AI first plan blueprint",
              weeks: [],
            }
          : {
              schemaVersion: AI_FIRST_PLAN_DRAFT_SCHEMA_VERSION,
              planName: "Invalid mock AI first plan",
              weeks: [],
            },
      );
    }

    return openAiFixtureResponse(
      "mock-ai-first-plan",
      contractMode === "blueprint"
        ? fixtureKind === "identity_coverage"
          ? buildMockAiFirstPlanIdentityCoverageBlueprint(authoringInput)
          : buildMockAiFirstPlanBlueprint(
              authoringInput,
              buildStructuredAuthoringPlan(authoringInput),
            )
        : buildMockAiFirstPlanDraft(authoringInput, buildStructuredAuthoringPlan(authoringInput)),
    );
  }) as typeof fetch;
}

function buildMockAiFirstPlanBlueprint(
  authoringInput: StructuredFirstPlanAuthoringInput,
  plan: TrainingPlanV2,
): AiFirstPlanBlueprint {
  const workoutsByWeek = new Map<number, TrainingPlanV2["planned_workouts"]>();

  for (const workout of plan.planned_workouts) {
    if (workout.workout_family === "rest" || workout.workout_type === "rest") {
      continue;
    }

    const week = workout.week_number;
    workoutsByWeek.set(week, [...(workoutsByWeek.get(week) ?? []), workout]);
  }

  return {
    schemaVersion: AI_FIRST_PLAN_BLUEPRINT_SCHEMA_VERSION,
    planName: `Mock AI blueprint ${plan.plan_name}`,
    generatedFor: plan.generated_for ?? "Hito runner",
    goalSummary: authoringInput.goal.goalLabel,
    startDate: authoringInput.schedule.startDate,
    targetDate: authoringInput.schedule.targetDate ?? null,
    preparationHorizonWeeks: plan.preparation_horizon_weeks,
    planPreferences: {
      preferredRunningDays: authoringInput.availability.preferredRunningDays,
      fixedRestDays: authoringInput.availability.unavailableDays,
      preferredLongRunDay: authoringInput.availability.preferredLongRunDay ?? null,
      maxRunningDaysPerWeek: authoringInput.availability.maxRunningDaysPerWeek,
    },
    reviewAssumptions: [
      "Mock AI first-plan blueprint chooses compact weekly intent while backend expands final segments.",
    ],
    metricPolicySummary:
      "Mock blueprint leaves numeric pace/HR truth to backend normalization and deterministic gates.",
    weeks: [...workoutsByWeek.entries()].map(([weekNumber, workouts]) => ({
      weekNumber,
      phase: normalizePhase(workouts[0]?.phase),
      theme: `Mock blueprint week ${weekNumber} theme`,
      microcycleIntent: "Keep a coach-readable rhythm without changing runner constraints.",
      cutbackWeek: workouts.some((workout) => /cutback/i.test(workout.source_workout_type ?? "")),
      taperWeek: workouts.some((workout) => /taper/i.test(workout.phase)),
      longRunIntent: "Preserve the backend long-run progression and Saturday placement.",
      longRunProgression: "Progress only through backend-safe duration/load rules.",
      plannedWorkouts: workouts.map((workout) =>
        buildMockAiBlueprintWorkout(authoringInput, workout),
      ),
    })),
  };
}

function buildMockAiFirstPlanIdentityCoverageBlueprint(
  authoringInput: StructuredFirstPlanAuthoringInput,
): AiFirstPlanBlueprint {
  const startDate = authoringInput.schedule.startDate;
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
      microcycleIntent:
        "Introduce 5K coordination, marathon-steady patience, and mountain time-on-feet.",
      cutbackWeek: false,
      taperWeek: false,
      workouts: [
        buildMockAiBlueprintWorkoutTemplate(
          "Monday",
          "easy",
          "easy_aerobic_run",
          "easy",
          "Identity sample easy aerobic run",
        ),
        buildMockAiBlueprintWorkoutTemplate(
          "Tuesday",
          "intervals",
          "5k_sharpening_repeats",
          "intervals",
          "Identity sample 5K sharpening repeats",
        ),
        buildMockAiBlueprintWorkoutTemplate(
          "Thursday",
          "steady",
          "marathon_steady_specificity",
          "steady",
          "Identity sample marathon steady specificity",
        ),
        buildMockAiBlueprintWorkoutTemplate(
          "Friday",
          "recovery",
          "recovery_jog",
          "recovery",
          "Identity sample recovery jog",
        ),
        buildMockAiBlueprintWorkoutTemplate(
          "Saturday",
          "trail",
          "mountain_long_run_time_on_feet",
          "trail",
          "Identity sample mountain long run time on feet",
        ),
      ],
    },
    {
      phase: "Build" as const,
      theme: "Rhythm and terrain control",
      microcycleIntent:
        "Pair 10K rhythm with controlled downhill durability and hike-run endurance.",
      cutbackWeek: false,
      taperWeek: false,
      workouts: [
        buildMockAiBlueprintWorkoutTemplate(
          "Monday",
          "steady",
          "steady_aerobic_run",
          "steady",
          "Identity sample steady aerobic run",
        ),
        buildMockAiBlueprintWorkoutTemplate(
          "Tuesday",
          "intervals",
          "10k_rhythm_intervals",
          "intervals",
          "Identity sample 10K rhythm intervals",
        ),
        buildMockAiBlueprintWorkoutTemplate(
          "Thursday",
          "hills",
          "controlled_downhill_durability",
          "hills",
          "Identity sample controlled downhill durability",
        ),
        buildMockAiBlueprintWorkoutTemplate(
          "Friday",
          "easy",
          "easy_aerobic_run",
          "easy",
          "Identity sample easy aerobic run",
        ),
        buildMockAiBlueprintWorkoutTemplate(
          "Saturday",
          "trail",
          "hike_run_endurance",
          "trail",
          "Identity sample hike-run endurance",
        ),
      ],
    },
    {
      phase: "Specific" as const,
      theme: "Controlled race rhythm",
      microcycleIntent:
        "Use a race-rhythm rehearsal while keeping terrain support and cutback durability conservative.",
      cutbackWeek: true,
      taperWeek: false,
      workouts: [
        buildMockAiBlueprintWorkoutTemplate(
          "Monday",
          "recovery",
          "recovery_jog",
          "recovery",
          "Identity sample recovery jog",
        ),
        buildMockAiBlueprintWorkoutTemplate(
          "Tuesday",
          "race",
          "race_pace_session",
          "race",
          "Identity sample race pace session",
        ),
        buildMockAiBlueprintWorkoutTemplate(
          "Thursday",
          "hills",
          "rolling_hills_session",
          "hills",
          "Identity sample rolling hills session",
        ),
        buildMockAiBlueprintWorkoutTemplate(
          "Friday",
          "easy",
          "easy_aerobic_run",
          "easy",
          "Identity sample easy aerobic run",
        ),
        buildMockAiBlueprintWorkoutTemplate(
          "Saturday",
          "long",
          "cutback_long_run",
          "long",
          "Identity sample cutback long run",
        ),
      ],
    },
    {
      phase: "Taper" as const,
      theme: "Freshness and tune-up",
      microcycleIntent: "Keep a light tune-up and reduce the long-run load for freshness.",
      cutbackWeek: false,
      taperWeek: true,
      workouts: [
        buildMockAiBlueprintWorkoutTemplate(
          "Monday",
          "race",
          "taper_tuneup_run",
          "race",
          "Identity sample taper tune-up run",
        ),
        buildMockAiBlueprintWorkoutTemplate(
          "Tuesday",
          "easy",
          "easy_aerobic_run",
          "easy",
          "Identity sample easy aerobic run",
        ),
        buildMockAiBlueprintWorkoutTemplate(
          "Thursday",
          "steady",
          "steady_aerobic_run",
          "steady",
          "Identity sample steady aerobic run",
        ),
        buildMockAiBlueprintWorkoutTemplate(
          "Friday",
          "recovery",
          "recovery_jog",
          "recovery",
          "Identity sample recovery jog",
        ),
        buildMockAiBlueprintWorkoutTemplate(
          "Saturday",
          "long",
          "taper_long_run",
          "long",
          "Identity sample taper long run",
        ),
      ],
    },
  ];

  return {
    schemaVersion: AI_FIRST_PLAN_BLUEPRINT_SCHEMA_VERSION,
    planName: "Mock AI blueprint identity coverage",
    generatedFor: "Hito running coach QA",
    goalSummary: "Identity coverage fixture for coach review",
    startDate,
    targetDate: authoringInput.schedule.targetDate ?? null,
    preparationHorizonWeeks: 4,
    planPreferences: {
      preferredRunningDays: authoringInput.availability.preferredRunningDays,
      fixedRestDays: authoringInput.availability.unavailableDays,
      preferredLongRunDay: authoringInput.availability.preferredLongRunDay ?? null,
      maxRunningDaysPerWeek: authoringInput.availability.maxRunningDaysPerWeek,
    },
    reviewAssumptions: [
      "Mock identity coverage blueprint exists only to inspect backend-expanded segment bodies.",
    ],
    metricPolicySummary:
      "AI supplies compact intent only; backend applies pace/default-HR policy during expansion.",
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

        return {
          ...workout,
          date: addDaysIso(startDate, offset),
        };
      }),
    })),
  };
}

function buildMockAiBlueprintWorkoutTemplate(
  weekday: AiFirstPlanBlueprint["weeks"][number]["plannedWorkouts"][number]["weekday"],
  workoutFamily: AiFirstPlanBlueprint["weeks"][number]["plannedWorkouts"][number]["workoutFamily"],
  workoutIdentity: AiFirstPlanBlueprint["weeks"][number]["plannedWorkouts"][number]["workoutIdentity"],
  calendarIconKey: AiFirstPlanBlueprint["weeks"][number]["plannedWorkouts"][number]["calendarIconKey"],
  title: string,
): AiFirstPlanBlueprint["weeks"][number]["plannedWorkouts"][number] {
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
        : workoutFamily === "long" || workoutIdentity === "mountain_long_run_time_on_feet"
          ? 5
          : workoutFamily === "easy"
            ? 4
            : 6,
    estimatedFatigue:
      workoutFamily === "recovery"
        ? "very_low"
        : workoutFamily === "long" || workoutIdentity === "mountain_long_run_time_on_feet"
          ? "medium_high"
          : "medium",
    recoveryPriority:
      workoutFamily === "long" ||
      workoutFamily === "recovery" ||
      workoutIdentity === "mountain_long_run_time_on_feet"
        ? "high"
        : "medium",
    segmentIntent: segmentIntentForFamily(workoutFamily),
    metricIntent: "mixed_if_allowed",
  };
}

function buildMockAiBlueprintWorkout(
  authoringInput: StructuredFirstPlanAuthoringInput,
  workout: TrainingPlanV2["planned_workouts"][number],
): BlueprintWorkout {
  const cadenceWorkout = buildMockGoalFamilyCadenceWorkout(authoringInput, workout);

  if (cadenceWorkout) {
    return cadenceWorkout;
  }

  const resolved = resolveCanonicalWorkoutModel({
    workoutType: workout.workout_type,
    sourceWorkoutType: workout.source_workout_type,
    workoutFamily: workout.workout_family,
    workoutIdentity: workout.workout_identity,
    calendarIconKey: workout.calendar_icon_key,
    title: workout.title,
    steps: workout.segments,
  });

  if (shouldUseMockSupportWorkoutInsteadOfExtraHardDay(authoringInput, workout, resolved)) {
    return {
      ...buildMockAiBlueprintWorkoutTemplate(
        workout.weekday as BlueprintWorkout["weekday"],
        "easy",
        "easy_aerobic_run",
        "easy",
        "Easy aerobic run",
      ),
      date: workout.date,
      summary:
        "Mock AI blueprint keeps non-cadence support days easy so backend hard-day density remains valid.",
    };
  }

  return {
    date: workout.date,
    weekday:
      workout.weekday as AiFirstPlanBlueprint["weeks"][number]["plannedWorkouts"][number]["weekday"],
    workoutFamily: resolved.workoutFamily,
    workoutIdentity: resolved.workoutIdentity,
    calendarIconKey: resolved.calendarIconKey,
    title: `Mock AI blueprint ${workout.title}`,
    summary: workout.summary ?? "Mock AI-authored blueprint workout with backend-safe expansion.",
    plannedRpe: workout.planned_rpe ?? 4,
    estimatedFatigue: workout.estimated_fatigue ?? "low",
    recoveryPriority: workout.recovery_priority ?? "medium",
    segmentIntent: segmentIntentForFamily(resolved.workoutFamily),
    metricIntent: resolved.metricMode.paceTargetsAllowed ? "mixed_if_allowed" : "effort_only",
  };
}

function shouldUseMockSupportWorkoutInsteadOfExtraHardDay(
  authoringInput: StructuredFirstPlanAuthoringInput,
  workout: TrainingPlanV2["planned_workouts"][number],
  resolved: ReturnType<typeof resolveCanonicalWorkoutModel>,
) {
  const cadenceWeekday = chooseMockCadenceWeekday(authoringInput);
  const cadence = mockCadenceIdentityForGoal(authoringInput, workout.week_number);

  if (!cadenceWeekday || !cadence || workout.weekday === cadenceWeekday) {
    return false;
  }

  return ["tempo", "intervals", "race", "hills"].includes(resolved.workoutFamily);
}

function buildMockGoalFamilyCadenceWorkout(
  authoringInput: StructuredFirstPlanAuthoringInput,
  workout: TrainingPlanV2["planned_workouts"][number],
): BlueprintWorkout | null {
  if (
    authoringInput.runnerProfile.experienceLevel === "new_runner" ||
    authoringInput.availability.maxRunningDaysPerWeek <= 3
  ) {
    return null;
  }

  const cadenceWeekday = chooseMockCadenceWeekday(authoringInput);
  const cadence = mockCadenceIdentityForGoal(authoringInput, workout.week_number);

  if (!cadenceWeekday || !cadence || workout.weekday !== cadenceWeekday) {
    return null;
  }

  return {
    ...buildMockAiBlueprintWorkoutTemplate(
      workout.weekday as BlueprintWorkout["weekday"],
      cadence.family,
      cadence.identity,
      cadence.icon,
      cadence.title,
    ),
    date: workout.date,
    summary: `${cadence.title} keeps the mock AI blueprint aligned with the backend goal-family cadence policy.`,
  };
}

function chooseMockCadenceWeekday(authoringInput: StructuredFirstPlanAuthoringInput) {
  const runningDays = authoringInput.availability.preferredRunningDays.filter(
    (weekday) => !authoringInput.availability.unavailableDays.includes(weekday),
  );
  const preferredLongRunDay = authoringInput.availability.preferredLongRunDay ?? null;
  const candidateOrder = ["Tuesday", "Thursday", "Monday", "Friday", "Wednesday", "Saturday"];

  return (
    candidateOrder.find(
      (weekday) => runningDays.includes(weekday) && weekday !== preferredLongRunDay,
    ) ?? null
  );
}

function mockCadenceIdentityForGoal(
  authoringInput: StructuredFirstPlanAuthoringInput,
  weekNumber: number,
): MockCadenceSpec | null {
  const finalTwoWeeks =
    weekNumber >= Math.max(1, authoringInput.schedule.preparationHorizonWeeks - 1);

  switch (authoringInput.goal.goalType) {
    case "5k":
      return finalTwoWeeks
        ? cadenceSpec("race", "taper_tuneup_run", "race", "Taper tune-up run")
        : cadenceSpec("intervals", "5k_sharpening_repeats", "intervals", "5K sharpening repeats");
    case "10k":
      return finalTwoWeeks
        ? cadenceSpec("race", "taper_tuneup_run", "race", "Taper tune-up run")
        : cadenceSpec("intervals", "10k_rhythm_intervals", "intervals", "10K rhythm intervals");
    case "half_marathon":
      if (
        authoringInput.goal.goalStyle !== "target_time" &&
        authoringInput.goal.goalStyle !== "ambitious" &&
        !authoringInput.goal.targetTime
      ) {
        return null;
      }

      return finalTwoWeeks
        ? cadenceSpec("race", "taper_tuneup_run", "race", "Taper tune-up run")
        : cadenceSpec(
            "tempo",
            "half_marathon_threshold_durability",
            "tempo",
            "Half marathon threshold durability",
          );
    case "marathon":
      return weekNumber % 2 === 1
        ? cadenceSpec(
            "steady",
            "marathon_steady_specificity",
            "steady",
            "Marathon steady specificity",
          )
        : null;
    case "ultra_marathon":
      return weekNumber % 2 === 1
        ? cadenceSpec(
            "trail",
            "ultra_time_on_feet_durability",
            "trail",
            "Ultra time-on-feet durability",
          )
        : null;
    case "mountain_running":
      return weekNumber % 2 === 1
        ? cadenceSpec("hills", "rolling_hills_session", "hills", "Rolling hills session")
        : null;
    default:
      return null;
  }
}

function cadenceSpec(
  family: BlueprintWorkout["workoutFamily"],
  identity: BlueprintWorkout["workoutIdentity"],
  icon: BlueprintWorkout["calendarIconKey"],
  title: string,
) {
  return { family, identity, icon, title };
}

function buildMockAiFirstPlanDraft(
  authoringInput: StructuredFirstPlanAuthoringInput,
  plan: TrainingPlanV2,
): AiFirstPlanDraft {
  const workoutsByWeek = new Map<number, TrainingPlanV2["planned_workouts"]>();

  for (const workout of plan.planned_workouts) {
    const week = workout.week_number;
    workoutsByWeek.set(week, [...(workoutsByWeek.get(week) ?? []), workout]);
  }

  return {
    schemaVersion: AI_FIRST_PLAN_DRAFT_SCHEMA_VERSION,
    planName: `Mock AI ${plan.plan_name}`,
    generatedFor: plan.generated_for ?? "Hito runner",
    goal: {
      goalType: authoringInput.goal.goalType,
      goalLabel: authoringInput.goal.goalLabel,
      goalStyle: authoringInput.goal.goalStyle ?? null,
      targetTime: authoringInput.goal.targetTime ?? null,
      targetDate: authoringInput.schedule.targetDate ?? null,
    },
    startDate: authoringInput.schedule.startDate,
    targetDate: authoringInput.schedule.targetDate ?? null,
    preparationHorizonWeeks: plan.preparation_horizon_weeks,
    planPreferences: {
      preferredRunningDays: authoringInput.availability.preferredRunningDays,
      fixedRestDays: authoringInput.availability.unavailableDays,
      preferredLongRunDay: authoringInput.availability.preferredLongRunDay ?? null,
      maxRunningDaysPerWeek: authoringInput.availability.maxRunningDaysPerWeek,
    },
    reviewAssumptions: [
      "Mock AI first-plan draft keeps fixed rest days, running frequency, and metric gates intact.",
    ],
    metricPolicySummary:
      "Mock draft leaves numeric pace/HR truth to backend normalization and deterministic gates.",
    weeks: [...workoutsByWeek.entries()].map(([weekNumber, workouts]) => ({
      weekNumber,
      phase: normalizePhase(workouts[0]?.phase),
      theme: `Mock week ${weekNumber} theme`,
      microcycleIntent: "Keep a coach-readable rhythm without changing runner constraints.",
      cutbackWeek: workouts.some((workout) => /cutback/i.test(workout.source_workout_type ?? "")),
      taperWeek: workouts.some((workout) => /taper/i.test(workout.phase)),
      plannedWorkouts: workouts.map((workout) => buildMockAiDraftWorkout(authoringInput, workout)),
    })),
  };
}

function buildMockAiDraftWorkout(
  authoringInput: StructuredFirstPlanAuthoringInput,
  workout: TrainingPlanV2["planned_workouts"][number],
): AiFirstPlanDraft["weeks"][number]["plannedWorkouts"][number] {
  const resolved = resolveCanonicalWorkoutModel({
    workoutType: workout.workout_type,
    sourceWorkoutType: workout.source_workout_type,
    workoutFamily: workout.workout_family,
    workoutIdentity: workout.workout_identity,
    calendarIconKey: workout.calendar_icon_key,
    title: workout.title,
    steps: workout.segments,
  });

  return {
    date: workout.date,
    weekday:
      workout.weekday as AiFirstPlanDraft["weeks"][number]["plannedWorkouts"][number]["weekday"],
    workoutFamily: resolved.workoutFamily,
    workoutIdentity: resolved.workoutIdentity,
    calendarIconKey: resolved.calendarIconKey,
    title: `Mock AI ${workout.title}`,
    summary: workout.summary ?? "Mock AI-authored workout with backend-safe structure.",
    plannedRpe: workout.planned_rpe ?? (resolved.workoutFamily === "rest" ? 1 : 4),
    estimatedFatigue: workout.estimated_fatigue ?? "low",
    recoveryPriority: workout.recovery_priority ?? "medium",
    goalContext: {
      goalType: authoringInput.goal.goalType,
      goalStyle: authoringInput.goal.goalStyle ?? null,
      terrainFocus: authoringInput.preferences.terrainFocus ?? "standard",
      targetDate: authoringInput.schedule.targetDate ?? null,
      targetTime: authoringInput.goal.targetTime ?? null,
    },
    metricMode: {
      guidance: workout.metric_mode?.guidance ?? "effort",
      paceTargetsAllowed: workout.metric_mode?.pace_targets_allowed ?? false,
      hrTargetsAllowed: false,
      hrTargetSource: "effort_only",
      hrTargetLabel: null,
      hrTargetSourceNote: null,
      reason: "Mock AI draft lets backend normalization own numeric metric truth.",
    },
    segments:
      resolved.workoutFamily === "rest"
        ? [buildMockRestSegment(workout)]
        : buildMockRunningSegments(workout, resolved.workoutFamily),
  };
}

function buildMockRestSegment(
  workout: TrainingPlanV2["planned_workouts"][number],
): AiFirstPlanDraft["weeks"][number]["plannedWorkouts"][number]["segments"][number] {
  return {
    segmentId: `${workout.workout_id}_mock_rest`,
    segmentType: "rest",
    label: "Rest",
    sequence: 1,
    prescription: emptyPrescription("none"),
    guidance: "No running scheduled; keep the day genuinely restorative.",
    target: emptyTarget(),
  };
}

function buildMockRunningSegments(
  workout: TrainingPlanV2["planned_workouts"][number],
  family: string,
): AiFirstPlanDraft["weeks"][number]["plannedWorkouts"][number]["segments"] {
  const totalDuration = Math.max(30, estimateWorkoutDurationMin(workout));
  const warmupDuration = Math.min(10, Math.max(6, Math.round(totalDuration * 0.2)));
  const cooldownDuration = Math.min(8, Math.max(5, Math.round(totalDuration * 0.15)));
  const mainDuration = Math.max(10, totalDuration - warmupDuration - cooldownDuration);

  return [
    buildMockSegment(workout, "warmup", 1, "Warmup", warmupDuration, "easy"),
    buildMockSegment(
      workout,
      family === "tempo" ? "tempo_block" : family === "intervals" ? "interval_block" : "main",
      2,
      "Main work",
      mainDuration,
      family === "long" ? "durable aerobic effort" : "controlled effort",
    ),
    buildMockSegment(workout, "cooldown", 3, "Cooldown", cooldownDuration, "relaxed"),
  ];
}

function buildMockSegment(
  workout: TrainingPlanV2["planned_workouts"][number],
  segmentType: "warmup" | "main" | "tempo_block" | "interval_block" | "cooldown",
  sequence: number,
  label: string,
  durationMin: number,
  intensity: string,
): AiFirstPlanDraft["weeks"][number]["plannedWorkouts"][number]["segments"][number] {
  return {
    segmentId: `${workout.workout_id}_mock_${sequence}`,
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
    guidance: `${label} with clear effort control and no invented metric precision.`,
    target: {
      ...emptyTarget(),
      intensity,
      cue: sequence === 2 ? "Keep the purpose obvious and sustainable." : "Stay relaxed.",
      hint: sequence === 3 ? "Finish fresher than you started." : "Use breathing as the guide.",
    },
  };
}

function estimateWorkoutDurationMin(workout: TrainingPlanV2["planned_workouts"][number]) {
  return workout.segments.reduce((total, segment) => total + estimateStepDurationMin(segment), 0);
}

function estimateStepDurationMin(step: Step) {
  if (typeof step.duration_min === "number") {
    return step.duration_min;
  }

  const prescription = step.prescription;

  if (!prescription) {
    return 0;
  }

  if (prescription.mode === "time" && prescription.duration_min) {
    return prescription.duration_min;
  }

  if (prescription.mode === "distance" && prescription.distance_km) {
    return prescription.distance_km * 6;
  }

  if (prescription.mode === "repeats" && prescription.repeat_count && prescription.repeat_unit) {
    const work = estimatePrescriptionUnitDurationMin(prescription.repeat_unit);
    const recovery = prescription.recovery_unit
      ? estimatePrescriptionUnitDurationMin(prescription.recovery_unit)
      : 0;

    return prescription.repeat_count * (work + recovery);
  }

  return 0;
}

function estimatePrescriptionUnitDurationMin(unit: NonNullable<StepPrescription["repeat_unit"]>) {
  if (unit.mode === "time" && unit.duration_min) {
    return unit.duration_min;
  }

  if (unit.mode === "distance" && unit.distance_km) {
    return unit.distance_km * 6;
  }

  return 0;
}

function emptyPrescription(mode: "time" | "distance" | "repeats" | "none") {
  return {
    mode,
    durationMin: null,
    distanceKm: null,
    repeatCount: null,
    repeatUnit: null,
    recoveryUnit: null,
  };
}

function emptyTarget() {
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

function openAiFixtureResponse(responseId: string, payload: unknown) {
  return new Response(
    JSON.stringify({
      id: responseId,
      output_text: JSON.stringify(payload),
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}

function buildSampleWeeks(plan: TrainingPlanV2) {
  const weeks = new Map<number, TrainingPlanV2["planned_workouts"]>();

  for (const workout of plan.planned_workouts) {
    weeks.set(workout.week_number, [...(weeks.get(workout.week_number) ?? []), workout]);
  }

  return [...weeks.entries()].slice(0, 2).map(([weekNumber, workouts]) => ({
    weekNumber,
    workouts: workouts.slice(0, 4).map((workout) => {
      const segmentTypes = workout.segments.map((segment) => segment.segment_type);

      return {
        date: workout.date,
        title: workout.title,
        workoutFamily: workout.workout_family ?? null,
        workoutIdentity: workout.workout_identity ?? null,
        calendarIconKey: workout.calendar_icon_key ?? null,
        segmentCount: workout.segments.length,
        segmentPresence: {
          warmup: segmentTypes.includes("warmup"),
          main: segmentTypes.some((segmentType) =>
            ["main", "tempo_block", "interval_block", "strides"].includes(segmentType),
          ),
          cooldown: segmentTypes.includes("cooldown"),
        },
      };
    }),
  }));
}

function buildCoachSample(
  plan: TrainingPlanV2,
  identities: readonly TrainingPlanV2["planned_workouts"][number]["workout_identity"][],
) {
  return identities.map((identity) => {
    const workout = plan.planned_workouts.find(
      (candidate) => candidate.workout_identity === identity,
    );

    if (!workout) {
      return {
        identity,
        present: false,
      };
    }

    return {
      identity,
      present: true,
      date: workout.date,
      title: workout.title,
      family: workout.workout_family,
      icon: workout.calendar_icon_key,
      metricMode: {
        guidance: workout.metric_mode?.guidance ?? null,
        paceTargetsAllowed: workout.metric_mode?.pace_targets_allowed ?? false,
        hrTargetsAllowed: workout.metric_mode?.hr_targets_allowed ?? false,
        hrTargetSource: workout.metric_mode?.hr_target_source ?? null,
      },
      segments: workout.segments.map((segment) => ({
        type: segment.segment_type,
        label: segment.label ?? null,
        prescription: summarizePrescription(segment.prescription),
        guidance: segment.guidance ?? null,
        target: {
          intensity: segment.target?.intensity ?? null,
          cue: segment.target?.cue ?? null,
          hint: segment.target?.hint ?? null,
          pace: segment.target?.pace_min_per_km_range ?? null,
          hr: segment.target?.hr_bpm_range ?? null,
          hrSource: segment.target?.hr_target_source ?? null,
        },
        recoveryTarget: segment.recovery_target
          ? {
              intensity: segment.recovery_target.intensity ?? null,
              cue: segment.recovery_target.cue ?? null,
              hint: segment.recovery_target.hint ?? null,
            }
          : null,
      })),
    };
  });
}

function summarizePrescription(prescription: StepPrescription | undefined) {
  if (!prescription) {
    return null;
  }

  if (prescription.mode === "time") {
    return `${prescription.duration_min} min`;
  }

  if (prescription.mode === "distance") {
    return `${prescription.distance_km} km`;
  }

  if (prescription.mode === "repeats") {
    const repeatUnit = prescription.repeat_unit
      ? prescription.repeat_unit.mode === "time"
        ? `${prescription.repeat_unit.duration_min} min`
        : `${prescription.repeat_unit.distance_km} km`
      : "work";
    const recoveryUnit = prescription.recovery_unit
      ? prescription.recovery_unit.mode === "time"
        ? `${prescription.recovery_unit.duration_min} min recovery`
        : `${prescription.recovery_unit.distance_km} km recovery`
      : "recovery as needed";

    return `${prescription.repeat_count} x ${repeatUnit} / ${recoveryUnit}`;
  }

  return "none";
}

function countWeeks(plan: TrainingPlanV2) {
  return new Set(plan.planned_workouts.map((workout) => workout.week_number)).size;
}

function normalizePhase(phase: string | null | undefined): "Base" | "Build" | "Specific" | "Taper" {
  if (phase === "Build" || phase === "Specific" || phase === "Taper") {
    return phase;
  }

  return "Base";
}

function segmentIntentForFamily(
  family: AiFirstPlanBlueprint["weeks"][number]["plannedWorkouts"][number]["workoutFamily"],
): AiFirstPlanBlueprint["weeks"][number]["plannedWorkouts"][number]["segmentIntent"] {
  switch (family) {
    case "recovery":
      return "recovery";
    case "steady":
      return "steady_aerobic";
    case "long":
      return "long_durability";
    case "tempo":
      return "tempo_sustained";
    case "intervals":
      return "interval_repeats";
    case "hills":
      return "hill_strength";
    case "trail":
      return "trail_terrain";
    case "progression":
      return "progression";
    case "race":
      return "race_tuneup";
    default:
      return "easy_aerobic";
  }
}

function buildDefaultAuthoringInput(fixtureKind: FixtureKind) {
  if (fixtureKind === "identity_coverage") {
    return buildIdentityCoverageAuthoringInput();
  }

  if (fixtureKind === "one_week_smoke") {
    return buildOneWeekSmokeAuthoringInput();
  }

  if (fixtureKind === "compact_smoke") {
    return buildCompactSmokeAuthoringInput();
  }

  return {
    goal: {
      goalType: "half_marathon",
      goalLabel: "Half marathon · Target time",
      goalStyle: "target_time",
      targetTime: "2:00:00",
      targetEventName: "Half marathon plan",
    },
    schedule: {
      startDate: "2026-06-01",
      targetDate: "2026-07-26",
      preparationHorizonWeeks: null,
    },
    runnerProfile: {
      experienceLevel: "consistent_runner",
      baselineSessionsPerWeek: 5,
      baselineLongRunKm: 12,
      baselineLongRunDurationMin: null,
      age: 38,
      recentInjuryRecoveryContext: null,
      preferredEffortLanguage: "mixed",
    },
    currentLevel: {
      recentResultSummary: "Recent 5K time: 24:30.",
      recentRaceResults: [{ distance: "5K", resultTime: "24:30", resultDate: null }],
      recent5kPaceSecondsPerKm: 294,
      currentEasyPaceRange: "6:25-7:20/km",
      currentTrainingLoadSummary: null,
    },
    availability: {
      preferredRunningDays: ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"],
      unavailableDays: ["Wednesday", "Sunday"],
      maxRunningDaysPerWeek: 5,
      allowBackToBackDays: false,
      preferredLongRunDay: "Saturday",
    },
    constraints: {
      injuryConstraints: [],
      hardConstraints: [],
    },
    preferences: {
      preferredWorkoutMix: "balanced",
      terrainFocus: "standard",
      strengthOrMobilityInterest: "mobility",
      indoorTreadmillOk: false,
      notes: "Ops smoke fixture for AI-authored first-plan draft validation.",
    },
    execution: {
      watchAccess: "watch_or_app",
      guidancePreference: "mixed",
    },
  } satisfies StructuredFirstPlanAuthoringInput;
}

function buildIdentityCoverageAuthoringInput() {
  return {
    goal: {
      goalType: "half_marathon",
      goalLabel: "Identity coverage · Coach sample",
      goalStyle: "target_time",
      targetTime: "2:00:00",
      targetEventName: "Identity coverage fixture",
    },
    schedule: {
      startDate: "2026-07-06",
      targetDate: "2026-08-02",
      preparationHorizonWeeks: 4,
    },
    runnerProfile: {
      experienceLevel: "consistent_runner",
      baselineSessionsPerWeek: 5,
      baselineLongRunKm: 12,
      baselineLongRunDurationMin: null,
      age: 38,
      recentInjuryRecoveryContext: null,
      preferredEffortLanguage: "mixed",
    },
    currentLevel: {
      recentResultSummary: "Recent 5K time: 24:30.",
      recentRaceResults: [{ distance: "5K", resultTime: "24:30", resultDate: null }],
      recent5kPaceSecondsPerKm: 294,
      currentEasyPaceRange: "6:25-7:20/km",
      currentTrainingLoadSummary: null,
    },
    availability: {
      preferredRunningDays: ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"],
      unavailableDays: ["Wednesday", "Sunday"],
      maxRunningDaysPerWeek: 5,
      preferredWorkoutMix: "balanced",
      terrainFocus: "mountain",
      strengthOrMobilityInterest: "mobility",
      indoorTreadmillOk: false,
      notes: "Non-mutating identity coverage fixture for coach-facing blueprint sample output.",
    },
    execution: {
      watchAccess: "watch_or_app",
      guidancePreference: "mixed",
    },
  } satisfies StructuredFirstPlanAuthoringInput;
}

function buildOneWeekSmokeAuthoringInput() {
  return {
    goal: {
      goalType: "half_marathon",
      goalLabel: "Half marathon · One-week diagnostic smoke",
      goalStyle: "target_time",
      targetTime: "2:00:00",
      targetEventName: "Half marathon plan",
    },
    schedule: {
      startDate: "2026-06-01",
      targetDate: null,
      preparationHorizonWeeks: 1,
    },
    runnerProfile: {
      experienceLevel: "consistent_runner",
      baselineSessionsPerWeek: 3,
      baselineLongRunKm: 8,
      baselineLongRunDurationMin: null,
      age: 38,
      recentInjuryRecoveryContext: null,
      preferredEffortLanguage: "mixed",
    },
    currentLevel: {
      recentResultSummary: "Recent 5K time: 24:30.",
      recentRaceResults: [{ distance: "5K", resultTime: "24:30", resultDate: null }],
      recent5kPaceSecondsPerKm: 294,
      currentEasyPaceRange: "6:25-7:20/km",
      currentTrainingLoadSummary: null,
    },
    availability: {
      preferredRunningDays: ["Monday", "Thursday", "Saturday"],
      unavailableDays: ["Tuesday", "Wednesday", "Friday", "Sunday"],
      maxRunningDaysPerWeek: 3,
      allowBackToBackDays: false,
      preferredLongRunDay: "Saturday",
    },
    constraints: {
      injuryConstraints: [],
      hardConstraints: [],
    },
    preferences: {
      preferredWorkoutMix: "balanced",
      terrainFocus: "standard",
      strengthOrMobilityInterest: "mobility",
      indoorTreadmillOk: false,
      notes:
        "One-week non-mutating diagnostic live smoke for AI-authored first-plan draft validation.",
    },
    execution: {
      watchAccess: "watch_or_app",
      guidancePreference: "mixed",
    },
  } satisfies StructuredFirstPlanAuthoringInput;
}

function buildCompactSmokeAuthoringInput() {
  return {
    goal: {
      goalType: "half_marathon",
      goalLabel: "Half marathon · Target time compact smoke",
      goalStyle: "target_time",
      targetTime: "2:00:00",
      targetEventName: "Half marathon plan",
    },
    schedule: {
      startDate: "2026-06-01",
      targetDate: null,
      preparationHorizonWeeks: 2,
    },
    runnerProfile: {
      experienceLevel: "consistent_runner",
      baselineSessionsPerWeek: 4,
      baselineLongRunKm: 10,
      baselineLongRunDurationMin: null,
      age: 38,
      recentInjuryRecoveryContext: null,
      preferredEffortLanguage: "mixed",
    },
    currentLevel: {
      recentResultSummary: "Recent 5K time: 24:30.",
      recentRaceResults: [{ distance: "5K", resultTime: "24:30", resultDate: null }],
      recent5kPaceSecondsPerKm: 294,
      currentEasyPaceRange: "6:25-7:20/km",
      currentTrainingLoadSummary: null,
    },
    availability: {
      preferredRunningDays: ["Monday", "Tuesday", "Thursday", "Saturday"],
      unavailableDays: ["Wednesday", "Friday", "Sunday"],
      maxRunningDaysPerWeek: 4,
      allowBackToBackDays: false,
      preferredLongRunDay: "Saturday",
    },
    constraints: {
      injuryConstraints: [],
      hardConstraints: [],
    },
    preferences: {
      preferredWorkoutMix: "balanced",
      terrainFocus: "standard",
      strengthOrMobilityInterest: "mobility",
      indoorTreadmillOk: false,
      notes: "Compact non-mutating live smoke for AI-authored first-plan draft validation.",
    },
    execution: {
      watchAccess: "watch_or_app",
      guidancePreference: "mixed",
    },
  } satisfies StructuredFirstPlanAuthoringInput;
}

function resolveMode(options: ParsedArgs): ScriptMode {
  if (hasFlag(options, "live")) {
    return "live";
  }

  if (hasFlag(options, "mock-timeout")) {
    return "mock_timeout";
  }

  if (hasFlag(options, "mock-invalid")) {
    return "mock_invalid";
  }

  return "mock";
}

function parseInputKind(value: string | true | undefined): AiFirstPlanDraftServiceInputKind {
  const normalized = stringOption(value);

  if (normalized === "structured_onboarding" || normalized === "structured_authoring") {
    return normalized;
  }

  if (normalized) {
    throw new Error("--input-kind must be structured_authoring or structured_onboarding.");
  }

  return "structured_authoring";
}

function parseContractMode(value: string | true | undefined): AiFirstPlanGenerationContract {
  const normalized = stringOption(value);

  if (normalized === "blueprint") {
    return "blueprint";
  }

  if (normalized === "strict-draft" || normalized === "strict_draft" || normalized === "draft") {
    return "strict_draft";
  }

  if (normalized) {
    throw new Error("--contract must be blueprint or strict-draft.");
  }

  return "blueprint";
}

function parseFixtureKind(value: string | true | undefined): FixtureKind {
  const normalized = stringOption(value);

  if (normalized === "one-week-smoke" || normalized === "one_week_smoke") {
    return "one_week_smoke";
  }

  if (normalized === "compact-smoke" || normalized === "compact_smoke") {
    return "compact_smoke";
  }

  if (normalized === "full-half" || normalized === "full_half") {
    return "full_half";
  }

  if (normalized === "identity-coverage" || normalized === "identity_coverage") {
    return "identity_coverage";
  }

  if (normalized) {
    throw new Error(
      "--fixture must be one-week-smoke, compact-smoke, full-half, or identity-coverage.",
    );
  }

  return "full_half";
}

function parsePositiveIntegerOption(value: string | true | undefined) {
  if (value == null || value === true) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("--timeout-ms must be a positive integer.");
  }

  return parsed;
}

function parseArgs(args: string[]): ParsedArgs {
  const parsed: ParsedArgs = {};

  for (let index = 0; index < args.length; index += 1) {
    const current = args[index];

    if (!current.startsWith("--")) {
      continue;
    }

    const key = current.slice(2);
    const next = args[index + 1];

    if (!next || next.startsWith("--")) {
      parsed[key] = true;
      continue;
    }

    parsed[key] = next;
    index += 1;
  }

  return parsed;
}

function hasFlag(options: ParsedArgs, key: string) {
  const value = options[key];

  return value === true || value === "true" || value === "1";
}

function stringOption(value: string | true | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function printHelp() {
  console.log(
    [
      "Usage:",
      "  npm run author-ai-first-plan-draft -- --mock-openai",
      "  npm run author-ai-first-plan-draft -- --mock-invalid",
      "  npm run author-ai-first-plan-draft -- --mock-timeout --timeout-ms 20",
      "  OPENAI_PLAN_MODEL=gpt-4.1-mini npm run author-ai-first-plan-draft -- --live --contract blueprint --fixture compact-smoke --no-reference --timeout-ms 120000 --max-output-tokens 8000",
      "",
      "Options:",
      "  --live                         Use the real OpenAI Responses API.",
      "  --mock-openai                  Use deterministic mock OpenAI output. This is the default.",
      "  --mock-invalid                 Use invalid mock output and verify deterministic fallback.",
      "  --mock-timeout                 Simulate a hung OpenAI request and verify timeout fallback.",
      "  --input-file <path>            JSON structured authoring input or onboarding input.",
      "  --input-kind <kind>            structured_authoring or structured_onboarding.",
      "  --contract <kind>              blueprint (default) or strict-draft diagnostic.",
      "  --fixture <kind>               one-week-smoke, compact-smoke, full-half, or identity-coverage when no input file is supplied.",
      "  --reference-file <path>        Optional rich reference JSON for prompt style guidance.",
      "  --no-reference                 Omit reference-style guidance for compact live latency smoke.",
      "  --timeout-ms <number>          Bounded OpenAI timeout. Default: 45000.",
      "  --max-output-tokens <number>   Bounded OpenAI output limit. Default: 32000.",
      "  --coach-sample                 Include bounded expanded segment bodies for coach review.",
      "",
      "The script is non-mutating and prints bounded review metadata only; it does not persist plans.",
    ].join("\n"),
  );
}
