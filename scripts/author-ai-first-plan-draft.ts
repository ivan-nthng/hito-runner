import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import {
  generateAiFirstPlanDraftPreview,
  type AiFirstPlanDraftServiceInputKind,
} from "../src/lib/ai-first-plan-draft-service";
import type { AiFirstPlanBlueprintTraceMetadata } from "../src/lib/ai-first-plan-draft-metadata";
import {
  AI_FIRST_PLAN_BLUEPRINT_SCHEMA_VERSION,
  type AiFirstPlanBlueprint,
} from "../src/lib/ai-first-plan-blueprint-authoring";
import { buildAiBlueprintWorkoutSections } from "../src/lib/ai-first-plan-blueprint-section-templates";
import { buildMockAiFirstPlanEnvelope } from "../src/lib/ai-first-plan-envelope-policy";
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
import { resolveAiFirstPlanBlueprintHorizonStrategy } from "../src/lib/ai-first-plan-blueprint-horizon";
import { addDaysIso, diffDaysIso, type StepPrescription } from "../src/lib/training";
import {
  DEFAULT_ENVELOPE_LIVE_MODEL,
  DEFAULT_REFERENCE_FILE,
  hasFlag,
  parseArgs,
  parseContractModeOrExit,
  parseFixtureKind,
  parseInputKind,
  parsePositiveIntegerOption,
  printHelp,
  resolveMode,
  stringOption,
  type FixtureKind,
  type ScriptContractMode,
  type ScriptMode,
} from "./ai-first-plan-draft-ops/cli";
import { buildDefaultAuthoringInput } from "./ai-first-plan-draft-ops/fixtures";

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

const TRACE_QUALITY_OR_SPECIFIC_IDENTITIES = new Set<string>([
  "5k_sharpening_repeats",
  "10k_rhythm_intervals",
  "time_intervals",
  "distance_intervals",
  "controlled_tempo_session",
  "half_marathon_threshold_durability",
  "marathon_steady_specificity",
  "progression_run",
  "race_pace_session",
  "taper_tuneup_run",
  "long_run_with_steady_finish",
  "uphill_repeats",
  "rolling_hills_session",
  "technical_trail_easy",
  "controlled_downhill_durability",
  "hike_run_endurance",
  "mountain_long_run_time_on_feet",
  "ultra_time_on_feet_durability",
  "climbing_steady_run",
]);

const TRACE_LONG_RUN_IDENTITIES = new Set<string>([
  "long_aerobic_run",
  "long_run_with_steady_finish",
  "cutback_long_run",
  "taper_long_run",
  "hike_run_endurance",
  "mountain_long_run_time_on_feet",
  "ultra_time_on_feet_durability",
]);

type BlueprintWorkout = AiFirstPlanBlueprint["weeks"][number]["plannedWorkouts"][number];
type MockCadenceSpec = {
  family: BlueprintWorkout["workoutFamily"];
  identity: BlueprintWorkout["workoutIdentity"];
  icon: BlueprintWorkout["calendarIconKey"];
  title: string;
};

type MockTemplateSectionOptions = {
  distanceMeters?: number | null;
  weekNumber?: number;
  horizonWeeks?: number | null;
};

const options = parseArgs(process.argv.slice(2));

if (hasFlag(options, "help")) {
  printHelp();
  process.exit(0);
}

const mode = resolveMode(options);
const inputKind = parseInputKind(options["input-kind"]);
const contractMode = parseContractModeOrExit(options.contract);
const fixtureKind = parseFixtureKind(options.fixture);
const input = await readInput(options, inputKind, fixtureKind);
const referenceExample = hasFlag(options, "no-reference")
  ? null
  : await readReferenceExample(stringOption(options["reference-file"]));
const timeoutMs = parsePositiveIntegerOption(options["timeout-ms"]) ?? 45_000;
const maxOutputTokens = parsePositiveIntegerOption(options["max-output-tokens"]) ?? 32_000;
const authoringInput = resolveAuthoringInput(input, inputKind);
const includeCoachSample = hasFlag(options, "coach-sample");
const includeBlueprintTrace = hasFlag(options, "trace-blueprint");
const includeEnvelopeTrace = contractMode === "envelope" || hasFlag(options, "trace-envelope");

const fetchImpl =
  mode === "live"
    ? undefined
    : buildMockOpenAiFetch(mode, authoringInput, contractMode, fixtureKind);
const model =
  mode === "live" && contractMode === "envelope"
    ? (readRequiredEnv("OPENAI_FIRST_PLAN_MODEL") ??
      readRequiredEnv("OPENAI_PLAN_MODEL") ??
      DEFAULT_ENVELOPE_LIVE_MODEL)
    : mode === "live"
      ? undefined
      : "mock-ai-first-plan-draft-model";

const result = await generateAiFirstPlanDraftPreview({
  input,
  inputKind,
  referenceExample,
  timeoutMs,
  maxOutputTokens,
  contractMode,
  apiKey: mode === "live" ? undefined : "mock-openai-key",
  model,
  fetchImpl,
});

if (!result.ok) {
  console.log(
    JSON.stringify(
      {
        ok: false,
        mode,
        contractMode,
        inputKind,
        fixture: fixtureKind,
        referenceIncluded: Boolean(referenceExample),
        reason: result.reason,
        message: "message" in result ? result.message : undefined,
        issues: result.issues,
        sourceKind: "metadata" in result ? result.metadata.sourceKind : undefined,
        sourceStatus: "metadata" in result ? result.metadata.sourceStatus : undefined,
        fallbackReason: "metadata" in result ? result.metadata.fallbackReason : undefined,
        validationIssueCount:
          "metadata" in result ? result.metadata.validationIssueCount : result.issues.length,
        model: "metadata" in result ? result.metadata.model : undefined,
        responseId: "metadata" in result ? result.metadata.responseId : undefined,
        elapsedMs: "metadata" in result ? result.metadata.elapsedMs : undefined,
        debug: "metadata" in result ? result.metadata.debug : undefined,
        blueprintTrace:
          includeBlueprintTrace && contractMode === "blueprint"
            ? buildBlueprintUnavailableTraceOutput({
                result,
                mode,
                fixtureKind,
                inputKind,
                referenceIncluded: Boolean(referenceExample),
              })
            : undefined,
        envelopeTrace:
          includeEnvelopeTrace && contractMode === "envelope" && "metadata" in result
            ? result.metadata.envelopeTrace
            : undefined,
      },
      null,
      2,
    ),
  );
  if (result.reason === "structured_input_invalid") {
    process.exitCode = 1;
  }
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
        blueprintTrace:
          includeBlueprintTrace && contractMode === "blueprint"
            ? buildBlueprintTraceOutput({
                result,
                mode,
                fixtureKind,
                inputKind,
                referenceIncluded: Boolean(referenceExample),
              })
            : undefined,
        envelopeTrace:
          includeEnvelopeTrace && contractMode === "envelope"
            ? result.metadata.envelopeTrace
            : undefined,
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
  contractMode: ScriptContractMode,
  fixtureKind: FixtureKind,
) {
  const requestAuthoringInput =
    contractMode === "blueprint"
      ? resolveAiFirstPlanBlueprintHorizonStrategy({ authoringInput }).openAiAuthoringInput
      : authoringInput;

  if (mode === "mock_timeout") {
    return (async () => new Promise<Response>(() => undefined)) as typeof fetch;
  }

  return (async (_input, _init) => {
    if (mode === "mock_invalid") {
      return openAiFixtureResponse(
        "mock-invalid-ai-first-plan",
        contractMode === "envelope"
          ? buildInvalidMockEnvelope()
          : {
              schemaVersion: AI_FIRST_PLAN_BLUEPRINT_SCHEMA_VERSION,
              planName: "Invalid mock AI first plan blueprint",
              weeks: [],
            },
      );
    }

    if (mode === "mock_partial") {
      if (contractMode === "envelope") {
        return openAiFixtureResponse(
          "mock-partial-ai-first-plan-envelope",
          buildPartialMockEnvelope(authoringInput),
        );
      }

      const blueprint = buildMockAiFirstPlanBlueprint(
        requestAuthoringInput,
        buildStructuredAuthoringPlan(requestAuthoringInput),
      );

      return openAiFixtureResponse("mock-partial-ai-first-plan", {
        ...blueprint,
        weeks: blueprint.weeks.slice(0, Math.min(5, blueprint.weeks.length)),
      });
    }

    return openAiFixtureResponse(
      "mock-ai-first-plan",
      contractMode === "envelope"
        ? buildMockAiFirstPlanEnvelope(authoringInput)
        : fixtureKind === "identity_coverage"
          ? buildMockAiFirstPlanIdentityCoverageBlueprint(requestAuthoringInput)
          : buildMockAiFirstPlanBlueprint(
              requestAuthoringInput,
              buildStructuredAuthoringPlan(requestAuthoringInput),
            ),
    );
  }) as typeof fetch;
}

function readRequiredEnv(name: string) {
  const value = process.env[name];

  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function buildInvalidMockEnvelope() {
  return {
    schemaVersion: "ai-first-plan-envelope-v1",
    planName: "Invalid mock planning envelope",
    goal: { family: "m", style: "tt" },
    horizonWeeks: 29,
    weeklyRhythm: {
      runDays: 5,
      longRunDay: "we",
      qualityFrequency: "w",
      specialtyFrequency: "w",
      supportBias: "easy",
    },
    longRunProgression: {
      mode: "specific",
      cutbackEveryWeeks: 4,
      taperWeeks: 3,
      peakIntent: "Invalid envelope intentionally violates rest and cadence safety.",
    },
    qualityEmphasis: { primary: "marathon", secondary: ["race"] },
    terrainSupport: { terrain: "roll", support: "mob", downhillCaution: false },
    metricGuidance: "mixed",
    phases: [],
    reviewAssumptions: [],
  };
}

function buildPartialMockEnvelope(authoringInput: StructuredFirstPlanAuthoringInput) {
  const envelope = buildMockAiFirstPlanEnvelope(authoringInput);

  return {
    ...envelope,
    planName: "Partial mock planning envelope",
    phases: envelope.phases.slice(0, 1).map((phase) => ({
      ...phase,
      endWeek: Math.min(phase.endWeek, Math.max(1, envelope.horizonWeeks - 1)),
    })),
    reviewAssumptions: ["Partial mock envelope intentionally omits full phase coverage."],
  };
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
      "Mock AI first-plan blueprint authors explicit workout sections for backend validation.",
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
      "Mock identity coverage blueprint exists only to inspect AI-authored structured sections after backend validation.",
    ],
    metricPolicySummary:
      "AI supplies section structure and effort guidance; backend applies pace/default-HR safety policy during validation.",
    weeks: weeks.map((week, weekIndex) => ({
      weekNumber: weekIndex + 1,
      phase: week.phase,
      theme: week.theme,
      microcycleIntent: week.microcycleIntent,
      cutbackWeek: week.cutbackWeek,
      taperWeek: week.taperWeek,
      longRunIntent: "Keep Saturday durability specific but controlled.",
      longRunProgression: "Backend validates long-run and taper sanity after canonicalization.",
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
  sectionOptions: MockTemplateSectionOptions = {},
): AiFirstPlanBlueprint["weeks"][number]["plannedWorkouts"][number] {
  const plannedRpe =
    workoutFamily === "recovery"
      ? 3
      : workoutFamily === "long" || workoutIdentity === "mountain_long_run_time_on_feet"
        ? 5
        : workoutFamily === "easy"
          ? 4
          : 6;

  return {
    date: null,
    weekday,
    workoutFamily,
    workoutIdentity,
    calendarIconKey,
    title,
    summary: `${title} authored with explicit blueprint sections for backend validation.`,
    plannedRpe,
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
    sections: buildAiBlueprintWorkoutSections({
      workoutIdentity,
      workoutFamily,
      plannedRpe,
      distanceMeters: sectionOptions.distanceMeters ?? null,
      weekNumber: sectionOptions.weekNumber,
      horizonWeeks: sectionOptions.horizonWeeks ?? undefined,
    }),
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
        {
          distanceMeters: authoringInput.planGoalIntent?.distance?.distanceMeters ?? null,
          weekNumber: workout.week_number,
          horizonWeeks: planHorizonWeeksForSections(authoringInput),
        },
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
    summary: workout.summary ?? "Mock AI-authored structured workout with backend-safe validation.",
    plannedRpe: workout.planned_rpe ?? 4,
    estimatedFatigue: workout.estimated_fatigue ?? "low",
    recoveryPriority: workout.recovery_priority ?? "medium",
    segmentIntent: segmentIntentForFamily(resolved.workoutFamily),
    metricIntent: resolved.metricMode.paceTargetsAllowed ? "mixed_if_allowed" : "effort_only",
    sections: buildAiBlueprintWorkoutSections({
      workoutIdentity: resolved.workoutIdentity,
      workoutFamily: resolved.workoutFamily,
      plannedRpe: workout.planned_rpe ?? 4,
      distanceMeters: authoringInput.planGoalIntent?.distance?.distanceMeters ?? null,
      weekNumber: workout.week_number,
      horizonWeeks: planHorizonWeeksForSections(authoringInput),
    }),
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
      {
        distanceMeters: authoringInput.planGoalIntent?.distance?.distanceMeters ?? null,
        weekNumber: workout.week_number,
        horizonWeeks: planHorizonWeeksForSections(authoringInput),
      },
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

function planHorizonWeeksForSections(authoringInput: StructuredFirstPlanAuthoringInput) {
  if (authoringInput.schedule.preparationHorizonWeeks) {
    return authoringInput.schedule.preparationHorizonWeeks;
  }

  if (!authoringInput.schedule.targetDate) {
    return 12;
  }

  return Math.max(
    1,
    Math.ceil(
      (diffDaysIso(authoringInput.schedule.targetDate, authoringInput.schedule.startDate) + 1) / 7,
    ),
  );
}

function mockCadenceIdentityForGoal(
  authoringInput: StructuredFirstPlanAuthoringInput,
  weekNumber: number,
): MockCadenceSpec | null {
  const finalTwoWeeks = weekNumber >= Math.max(1, planHorizonWeeksForSections(authoringInput) - 1);

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
      if (authoringInput.goal.goalStyle === "balanced" && !authoringInput.goal.targetTime) {
        if (weekNumber < 2 || weekNumber % 2 !== 0) {
          return null;
        }

        if (finalTwoWeeks) {
          return cadenceSpec("race", "taper_tuneup_run", "race", "Taper tune-up run");
        }

        const balancedCycle = Math.floor((weekNumber - 2) / 2) % 3;

        if (balancedCycle === 0) {
          return cadenceSpec("progression", "progression_run", "progression", "Progression run");
        }

        if (balancedCycle === 1) {
          return cadenceSpec(
            "tempo",
            "controlled_tempo_session",
            "tempo",
            "Controlled tempo session",
          );
        }

        return cadenceSpec(
          "tempo",
          "half_marathon_threshold_durability",
          "tempo",
          "Half marathon threshold durability",
        );
      }

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

function buildBlueprintTraceOutput({
  result,
  mode,
  fixtureKind,
  inputKind,
  referenceIncluded,
}: {
  result: Extract<Awaited<ReturnType<typeof generateAiFirstPlanDraftPreview>>, { ok: true }>;
  mode: ScriptMode;
  fixtureKind: FixtureKind;
  inputKind: AiFirstPlanDraftServiceInputKind;
  referenceIncluded: boolean;
}) {
  const trace = result.metadata.blueprintTrace;

  if (!trace) {
    return null;
  }

  return {
    requestSummary: {
      ...trace.requestSummary,
      inputKind,
      referenceIncluded,
    },
    openAiOrFallbackStatus: {
      sourceKind: trace.sourceKind,
      sourceStatus: trace.sourceStatus,
      fallbackReason: trace.fallbackReason,
      model: trace.model,
      responseId: result.metadata.responseId,
      mode,
      fixture: fixtureKind,
      timeoutMs: trace.timeoutMs,
      elapsedMs: trace.elapsedMs,
      requestPhase: result.metadata.debug.requestPhase,
      abortFired: result.metadata.debug.abortFired,
      openAiElapsedMs: result.metadata.debug.openAiElapsedMs,
      responseStatus: result.metadata.debug.responseStatus,
      responseIncompleteReason: result.metadata.debug.responseIncompleteReason,
      inputTokens: result.metadata.debug.inputTokens,
      outputTokens: result.metadata.debug.outputTokens,
      totalTokens: result.metadata.debug.totalTokens,
      outputTextChars: result.metadata.debug.outputTextChars,
    },
    requiredCadenceByWeek: trace.requiredCadenceSlots.map((slot) => ({
      weekNumber: slot.weekNumber,
      date: slot.date,
      weekday: slot.weekday,
      kind: slot.kind,
      identityOptions: slot.identityOptions,
      purpose: slot.purpose,
    })),
    blueprintCompleteness: trace.blueprintCompleteness ?? null,
    blueprintHorizonStrategy: trace.blueprintHorizonStrategy ?? null,
    authoredBlueprintIdentitiesByWeek: trace.authoredBlueprintWeeks.map((week) => ({
      weekNumber: week.weekNumber,
      phase: week.phase,
      theme: week.theme,
      identities: week.identities,
      families: week.families,
      icons: week.icons,
      dates: week.dates,
    })),
    validationIssuesAndRepairs: {
      issueCodes: trace.validationIssueCodes,
      issueSummary: trace.validationIssueSummary,
      repairs: trace.repairs,
    },
    normalizedCanonicalIdentitiesByWeek: trace.normalizedCanonicalWeeks.map((week) => ({
      weekNumber: week.weekNumber,
      identities: week.identities,
      families: week.families,
      icons: week.icons,
    })),
    firstSixWeekAcceptance: buildFirstSixWeekAcceptanceReport({
      plan: result.canonicalPlan,
      trace,
    }),
    finalCounts: {
      identities: trace.finalReviewedPlanIdentityCounts,
      families: trace.finalReviewedPlanFamilyCounts,
      icons: trace.finalReviewedPlanIconCounts,
      persistedIdentities: trace.persistedIdentityCounts,
    },
    safetyMetadata: {
      deterministicFallbackBoundary: trace.deterministicFallbackBoundary,
      persisted: false,
      rawPromptPrinted: false,
      rawAiPayloadPrinted: false,
      metricPolicySummary: result.metadata.metricPolicySummary,
    },
  };
}

function buildBlueprintUnavailableTraceOutput({
  result,
  mode,
  fixtureKind,
  inputKind,
  referenceIncluded,
}: {
  result: Extract<Awaited<ReturnType<typeof generateAiFirstPlanDraftPreview>>, { ok: false }>;
  mode: ScriptMode;
  fixtureKind: FixtureKind;
  inputKind: AiFirstPlanDraftServiceInputKind;
  referenceIncluded: boolean;
}) {
  if (!("metadata" in result) || !result.metadata.blueprintTrace) {
    return null;
  }

  const trace = result.metadata.blueprintTrace;

  return {
    requestSummary: {
      ...trace.requestSummary,
      inputKind,
      referenceIncluded,
    },
    openAiOrFallbackStatus: {
      sourceKind: trace.sourceKind,
      sourceStatus: trace.sourceStatus,
      fallbackReason: trace.fallbackReason,
      model: trace.model,
      responseId: result.metadata.responseId,
      mode,
      fixture: fixtureKind,
      timeoutMs: trace.timeoutMs,
      elapsedMs: trace.elapsedMs,
      requestPhase: result.metadata.debug.requestPhase,
      abortFired: result.metadata.debug.abortFired,
      openAiElapsedMs: result.metadata.debug.openAiElapsedMs,
      responseStatus: result.metadata.debug.responseStatus,
      responseIncompleteReason: result.metadata.debug.responseIncompleteReason,
      inputTokens: result.metadata.debug.inputTokens,
      outputTokens: result.metadata.debug.outputTokens,
      totalTokens: result.metadata.debug.totalTokens,
      outputTextChars: result.metadata.debug.outputTextChars,
    },
    requiredCadenceByWeek: trace.requiredCadenceSlots.map((slot) => ({
      weekNumber: slot.weekNumber,
      date: slot.date,
      weekday: slot.weekday,
      kind: slot.kind,
      identityOptions: slot.identityOptions,
      purpose: slot.purpose,
    })),
    blueprintCompleteness: trace.blueprintCompleteness ?? null,
    blueprintHorizonStrategy: trace.blueprintHorizonStrategy ?? null,
    authoredBlueprintIdentitiesByWeek: trace.authoredBlueprintWeeks.map((week) => ({
      weekNumber: week.weekNumber,
      phase: week.phase,
      theme: week.theme,
      identities: week.identities,
      families: week.families,
      icons: week.icons,
      dates: week.dates,
    })),
    validationIssuesAndRepairs: {
      issueCodes: trace.validationIssueCodes,
      issueSummary: trace.validationIssueSummary,
      repairs: trace.repairs,
    },
    normalizedCanonicalIdentitiesByWeek: trace.normalizedCanonicalWeeks.map((week) => ({
      weekNumber: week.weekNumber,
      identities: week.identities,
      families: week.families,
      icons: week.icons,
    })),
    finalCounts: {
      identities: trace.finalReviewedPlanIdentityCounts,
      families: trace.finalReviewedPlanFamilyCounts,
      icons: trace.finalReviewedPlanIconCounts,
      persistedIdentities: trace.persistedIdentityCounts,
    },
    safetyMetadata: {
      deterministicFallbackBoundary: trace.deterministicFallbackBoundary,
      persisted: false,
      rawPromptPrinted: false,
      rawAiPayloadPrinted: false,
    },
  };
}

function buildFirstSixWeekAcceptanceReport({
  plan,
  trace,
}: {
  plan: TrainingPlanV2;
  trace: AiFirstPlanBlueprintTraceMetadata;
}) {
  return Array.from({ length: Math.min(6, countWeeks(plan)) }, (_value, index) => {
    const weekNumber = index + 1;
    const authoredWeek = trace.authoredBlueprintWeeks.find(
      (week) => week.weekNumber === weekNumber,
    );
    const normalizedWeek = trace.normalizedCanonicalWeeks.find(
      (week) => week.weekNumber === weekNumber,
    );
    const weekWorkouts = plan.planned_workouts.filter(
      (workout) => workout.week_number === weekNumber,
    );
    const qualityOrSpecificWorkouts = weekWorkouts
      .filter((workout) =>
        workout.workout_identity
          ? TRACE_QUALITY_OR_SPECIFIC_IDENTITIES.has(workout.workout_identity)
          : false,
      )
      .map((workout) => ({
        date: workout.date,
        identity: workout.workout_identity,
        family: workout.workout_family,
        title: workout.title,
      }));
    const longRun = weekWorkouts.find((workout) =>
      workout.workout_identity
        ? TRACE_LONG_RUN_IDENTITIES.has(workout.workout_identity) ||
          workout.workout_family === "long"
        : workout.workout_family === "long",
    );

    return {
      weekNumber,
      authoredIdentities: authoredWeek?.identities ?? [],
      normalizedIdentities: normalizedWeek?.identities ?? [],
      requiredCadenceSlots: trace.requiredCadenceSlots
        .filter((slot) => slot.weekNumber === weekNumber)
        .map((slot) => ({
          date: slot.date,
          weekday: slot.weekday,
          identityOptions: slot.identityOptions,
          purpose: slot.purpose,
        })),
      qualityOrSpecificWorkouts,
      longRunIdentity: longRun?.workout_identity ?? null,
      restDays: weekWorkouts
        .filter((workout) => workout.workout_family === "rest" || workout.workout_type === "rest")
        .map((workout) => workout.weekday),
    };
  });
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
    const children = (prescription.children ?? [])
      .map((child) => {
        if (child.prescription.mode === "time") {
          return `${child.label ?? child.role}: ${child.prescription.duration_min} min`;
        }

        if (child.prescription.mode === "distance") {
          return `${child.label ?? child.role}: ${child.prescription.distance_km} km`;
        }

        return child.label ?? child.role;
      })
      .join(" + ");

    return `${prescription.repeat_count} x [${children || "ordered repeat children"}]`;
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
