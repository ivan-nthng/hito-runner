import type { GenerateAiFirstPlanDraftPreviewOptions } from "@/lib/ai-first-plan-draft-service";
import {
  ADAPTIVE_CONTINUATION_COMPILER_VERSION,
  ADAPTIVE_CONTINUATION_PROMPT_VERSION,
  ADAPTIVE_CONTINUATION_PROVIDER_CONTRACT_VERSION,
  ADAPTIVE_CONTINUATION_RESPONSE_SCHEMA_NAME,
  type AdaptiveContinuationAuthoringBriefV2,
  type AdaptiveContinuationProviderResponse,
} from "@/lib/adaptive-continuation-authoring";
import {
  AI_AUTHORED_PLAN_FIRST_RESPONSE_SCHEMA_NAME,
  buildAiAuthoredFirstSessionAdaptationContext,
  resolveAiAuthoredPlanFirstDetailedEndDate,
  type AiAuthoredPlanFirstCompilerDraft,
} from "@/lib/ai-authored-plan-first-provider-contract";
import {
  buildEffectiveRunnerHeartRateProfile,
  resolveEffectiveHeartRateGuidance,
} from "@/lib/heart-rate-zones";
import { normalizePlanGoalIntent } from "@/lib/plan-creation-engine/plan-goal-intent";
import type { StructuredPlanAuthoringInput } from "@/lib/structured-plan-authoring-schema";
import {
  RUNNER_PLAN_CAPABILITY_FORMULA_VERSION,
  RUNNER_PLAN_CAPABILITY_VECTOR_VERSION,
  type RunnerPlanCapabilityVectorV1,
  type SevenDayCapabilitySliceV1,
} from "@/lib/runner-activity/plan-capability-contract";
import { structuredPlanAuthoringInputSchema } from "@/lib/structured-plan-authoring-schema";
import { isLoopbackRuntimeUrl } from "@/lib/supabase/env";
import { addDaysIso, diffDaysIso, startOfWeekIso, todayIso, weekdayLong } from "@/lib/training";
import { WEEKDAY_NAMES, type WeekdayName } from "@/lib/weekday-rest-invariants";
import { resolveCanonicalWorkoutModel } from "@/lib/rich-workout-model";
import {
  WORKOUT_DOCUMENT_HYDRATION_CUE,
  WORKOUT_DOCUMENT_HYDRATION_LABEL,
} from "@/lib/workout-document";

export const AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV =
  "HITO_AI_GENERATED_PLAN_DEV_FIXTURE" as const;
export const AI_GENERATED_RUNNING_PLAN_PROVIDER_MODE_ENV =
  "HITO_AI_GENERATED_PLAN_PROVIDER_MODE" as const;
export const AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_DELAY_MS_ENV =
  "HITO_AI_GENERATED_PLAN_DEV_FIXTURE_DELAY_MS" as const;
export const AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV =
  "HITO_AI_GENERATED_PLAN_DEV_FIXTURE_SCENARIO" as const;
export const AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL =
  "hito-local-qa-dev-ai-generated-plan-fixture" as const;
export const AI_GENERATED_RUNNING_PLAN_QA_FIXTURE_RESPONSE_ID =
  "local-dev-ai-plan-first-10k" as const;

const MAX_AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_DELAY_MS = 10 * 60 * 1000;
const NON_REPEAT_TEMPO_FIXTURE_SCENARIO = "non_repeat_tempo" as const;
const CAMELOT_FIXTURE_SCENARIO = "camelot" as const;
const DEFAULT_FIXTURE_HORIZON_DAYS = 56;
const QA_FIXTURE_PAST_WEEKS = 6;

type QaFixtureAuthoringMode = "historical_replay" | "prospective_preview";

type RuntimeEnv = Record<string, string | undefined>;
export type AiGeneratedRunningPlanProviderMode = "real" | "qa_fixture";
type AiGeneratedRunningPlanDevFixtureScenario =
  | "default"
  | typeof NON_REPEAT_TEMPO_FIXTURE_SCENARIO
  | typeof CAMELOT_FIXTURE_SCENARIO;
type ProviderFixtureSection =
  AiAuthoredPlanFirstCompilerDraft["detailed_block"]["workouts"][number]["sections"][number];
type ProviderFixtureWorkoutDay =
  AiAuthoredPlanFirstCompilerDraft["detailed_block"]["workouts"][number];
type ProviderFixtureFinalDay = AiAuthoredPlanFirstCompilerDraft["detailed_block"]["final_workout"];
type ProviderFixtureUnitSection = Extract<ProviderFixtureSection, { kind: "unit" }>;
type ProviderFixtureTarget = NonNullable<ProviderFixtureUnitSection["target"]>;
type ProviderFixtureRepeatChild = Extract<
  ProviderFixtureSection,
  { kind: "repeat" }
>["children"][number];
type ProviderFixtureTargetContext = Pick<
  StructuredPlanAuthoringInput["runnerFacts"],
  "heartRateProfile"
> & { paceTargetsAllowed: boolean };

type AiGeneratedRunningPlanFixturePreviewOptions = Omit<
  GenerateAiFirstPlanDraftPreviewOptions,
  "input"
>;

export function buildAiGeneratedRunningPlanDevFixturePreviewOptions(input: {
  qaFixtureAuthorized: boolean;
  authoringInput: StructuredPlanAuthoringInput;
  env?: RuntimeEnv;
}): AiGeneratedRunningPlanFixturePreviewOptions | null {
  if (!input.qaFixtureAuthorized || !isAiGeneratedRunningPlanDevFixtureEnabled(input.env)) {
    return null;
  }

  const delayMs = resolveAiGeneratedRunningPlanDevFixtureDelayMs(input.env);

  return {
    apiKey: "local-qa-dev-ai-generated-plan-fixture",
    model: AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL,
    today: input.authoringInput.runnerCapability.cutoff.date,
    fetchImpl: buildAiGeneratedRunningPlanDevFixtureFetch(
      { authoringInput: input.authoringInput },
      delayMs,
      "default",
    ),
  };
}

export function buildAiGeneratedRunningPlanQaFixtureAuthoringInput(
  asOfDate: string = todayIso(),
  options: {
    mode?: QaFixtureAuthoringMode;
    selectedTargetDate?: string;
  } = {},
): StructuredPlanAuthoringInput {
  const mode = options.mode ?? "historical_replay";
  const startDate =
    mode === "prospective_preview"
      ? prospectiveQaFixtureStartDate(asOfDate)
      : addDaysIso(startOfWeekIso(asOfDate), -7 * QA_FIXTURE_PAST_WEEKS);
  const selectedTargetDate =
    options.selectedTargetDate ?? addDaysIso(startDate, DEFAULT_FIXTURE_HORIZON_DAYS - 1);
  const factualCutoffDate = mode === "prospective_preview" ? asOfDate : startDate;
  const heartRateProfile = buildEffectiveRunnerHeartRateProfile({ age: 36 });
  if (!heartRateProfile) {
    throw new Error("Local QA fixture could not build its fixed heart-rate profile.");
  }

  const planGoalIntent = normalizePlanGoalIntent({
    rawIntent: {
      distance: { kind: "preset", preset: "10K" },
      targetDate: selectedTargetDate,
    },
    startDate,
  });
  if (!planGoalIntent.ok || !planGoalIntent.intent.distance) {
    throw new Error("Local QA fixture could not build its fixed distance goal.");
  }

  return structuredPlanAuthoringInputSchema.parse({
    schedule: {
      startDate,
    },
    runnerFacts: {
      age: 36,
      heightCm: 178,
      weightKg: 72,
      selfReportedLevel: "runs_a_lot",
      benchmark: {
        kind: "recent_5k",
        source: "recent_5k_pace",
        paceSecondsPerKm: 330,
        label: "Recent 5K pace 5:30/km",
      },
      heartRateProfile: {
        ...heartRateProfile,
        accepted: true,
      },
    },
    availability: {
      fixedRestDays: ["Wednesday", "Friday", "Sunday"],
      maxRunningDaysPerWeek: 4,
      preferredLongRunDay: "Saturday",
    },
    planGoalIntent: planGoalIntent.intent,
    runnerCapability: buildQaFixtureRunnerCapability({
      cutoffDate: factualCutoffDate,
      startDate,
    }),
  });
}

export function buildProspectiveAiGeneratedRunningPlanQaFixtureAuthoringInput(
  input: StructuredPlanAuthoringInput,
): StructuredPlanAuthoringInput {
  return structuredPlanAuthoringInputSchema.parse({
    ...input,
    schedule: {
      ...input.schedule,
      startDate: prospectiveQaFixtureStartDate(input.runnerCapability.cutoff.date),
    },
  });
}

function buildQaFixtureRunnerCapability(input: {
  cutoffDate: string;
  startDate: string;
}): RunnerPlanCapabilityVectorV1 {
  const emptySlices = Array.from({ length: 12 }, (_, index) => {
    const endDate = addDaysIso(input.cutoffDate, -(index * 7));
    return {
      sliceIndex: index as SevenDayCapabilitySliceV1["sliceIndex"],
      startDate: addDaysIso(endDate, -6),
      endDate,
      completeSevenDays: true as const,
      contactCount: 0,
      duration: {
        unit: "seconds" as const,
        value: 0,
        authority: "exact" as const,
        includedActivityCount: 0,
        missingActivityCount: 0,
        reasonCodes: [],
      },
      distance: {
        unit: "metres" as const,
        value: 0,
        authority: "exact" as const,
        includedActivityCount: 0,
        missingActivityCount: 0,
        reasonCodes: [],
      },
      eligibleEasyLongContacts: [],
      activityRevisionFingerprint: "a".repeat(64),
    };
  });
  return {
    version: RUNNER_PLAN_CAPABILITY_VECTOR_VERSION,
    formulaVersion: RUNNER_PLAN_CAPABILITY_FORMULA_VERSION,
    vectorId: "b".repeat(64),
    snapshot: {
      version: "runner_fitness_profile_snapshot_v1",
      snapshotId: `qa-fixture-capability-${input.startDate}`,
      runnerFactsRevision: `qa-fixture-runner-facts-${input.startDate}`,
    },
    cutoff: {
      date: input.cutoffDate,
      timeZone: "UTC",
      timezoneBasis: "historical_local_date",
    },
    sourceFingerprint: "c".repeat(64),
    sevenDaySlices: emptySlices,
    windows: {
      recent7: { sliceIndex: 0, state: "unavailable" },
      base28: { sliceIndexes: [0, 1, 2, 3], state: "unavailable" },
      capacity90: {
        completeSliceIndexes: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        leadingPartialBoundary: {
          startDate: addDaysIso(input.cutoffDate, -89),
          endDate: addDaysIso(input.cutoffDate, -84),
          completeSevenDays: false,
          contextOnly: true,
        },
        state: "unavailable",
      },
    },
    performanceEvidence: {
      phase: "phase_a_whole_activity_only",
      state: "unavailable",
      records: [],
      contiguousSegmentEvidence: {
        state: "unavailable",
        reasonCodes: ["performance_samples_unavailable", "performance_segment_unavailable"],
      },
      heartRateAuthority: "unavailable",
      reasonCodes: [
        "performance_whole_activity_unavailable",
        "performance_samples_unavailable",
        "performance_segment_unavailable",
      ],
    },
    evidenceConfidence: {
      recent7: "unavailable",
      base28: "unavailable",
      capacity90: "unavailable",
      performanceEvidence: "unavailable",
    },
    openingAnchor: {
      basis: "unavailable",
      recent7DistanceMetres: 0,
      recent7DurationSeconds: 0,
      enforcedOpeningDemand: null,
      longRunDemand: null,
      reasonCodes: ["opening_anchor_unavailable"],
    },
    additionalEasyContact: {
      currentContacts: 0,
      proposedContacts: 0,
      decision: "not_applicable_reentry",
      supportSliceIndex: null,
      maximumOpeningDemand: null,
      reasonCodes: ["recent7_no_contacts"],
    },
    constraints: {
      maximumRunningDaysPerWeek: 4,
      fixedRestDays: ["Wednesday", "Friday", "Sunday"],
      preferredLongRunDay: "Saturday",
      currentRunningLimitation: "unavailable",
      outcomeAdmission: "permitted",
    },
    reasonCodes: [
      "recent7_no_contacts",
      "opening_anchor_unavailable",
      "limitation_state_unavailable",
      "capacity90_partial_boundary",
      "capacity90_recurrence_unproven",
      "performance_whole_activity_unavailable",
      "performance_samples_unavailable",
      "performance_segment_unavailable",
    ],
  };
}

export function isAiGeneratedRunningPlanDevFixtureEnabled(env = readRuntimeEnv()) {
  const flag = parseBooleanFlag(env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV]);
  const providerMode = resolveAiGeneratedRunningPlanProviderMode(env);
  const localAuthBypassEnabled = parseBooleanFlag(env.LOCAL_AUTH_BYPASS_ENABLED) === true;
  const localAuthAccountsFile =
    typeof env.LOCAL_AUTH_BYPASS_ACCOUNTS_FILE === "string"
      ? env.LOCAL_AUTH_BYPASS_ACCOUNTS_FILE.trim()
      : "";
  const localAuthRuntime = localAuthBypassEnabled && Boolean(localAuthAccountsFile);
  const deployedRuntime = Boolean(env.VERCEL || env.CI);

  return (
    providerMode === "qa_fixture" &&
    flag === true &&
    !deployedRuntime &&
    localAuthRuntime &&
    isLoopbackRuntimeUrl(env.NEXT_PUBLIC_SUPABASE_URL)
  );
}

export function resolveAiGeneratedRunningPlanProviderMode(
  env = readRuntimeEnv(),
): AiGeneratedRunningPlanProviderMode {
  return env[AI_GENERATED_RUNNING_PLAN_PROVIDER_MODE_ENV]?.trim() === "qa_fixture"
    ? "qa_fixture"
    : "real";
}

export function buildAiGeneratedRunningPlanDevFixtureOpenAiFetch(input: {
  authoringInput: StructuredPlanAuthoringInput;
  today?: string | null;
  env?: RuntimeEnv;
}): typeof fetch {
  return buildAiGeneratedRunningPlanDevFixtureFetch(
    input,
    resolveAiGeneratedRunningPlanDevFixtureDelayMs(input.env),
    resolveAiGeneratedRunningPlanDevFixtureScenario(input.env),
  );
}

export function buildAiGeneratedContinuationDevFixtureOpenAiFetch(input: {
  authoringInput: Omit<StructuredPlanAuthoringInput, "requestContext">;
  brief: AdaptiveContinuationAuthoringBriefV2;
}): typeof fetch {
  const response = buildAiGeneratedContinuationDevFixtureProviderResponse(input);

  return async () =>
    new Response(
      JSON.stringify({
        id: [
          "local-dev-adaptive-continuation",
          ADAPTIVE_CONTINUATION_PROMPT_VERSION,
          ADAPTIVE_CONTINUATION_COMPILER_VERSION,
          input.brief.blueprint.id,
          input.brief.decision.interval.startDate,
          input.brief.constraints.continuationInputFingerprint.slice(0, 12),
          input.brief.constraints.targetIntervalOccupancyFingerprint.slice(0, 12),
          input.brief.constraints.calendarOutcomeFingerprint.slice(0, 12),
          input.brief.constraints.evidenceRevisionFingerprint.slice(0, 12),
        ].join("-"),
        status: "completed",
        output_text: JSON.stringify(response),
        usage: {
          input_tokens: 100,
          output_tokens: 100,
          output_tokens_details: { reasoning_tokens: 25 },
          total_tokens: 200,
        },
        text: {
          format: {
            name: ADAPTIVE_CONTINUATION_RESPONSE_SCHEMA_NAME,
          },
        },
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );
}

export function resolveAiGeneratedRunningPlanDevFixtureDelayMs(env = readRuntimeEnv()) {
  const rawDelay = env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_DELAY_MS_ENV]?.trim();

  if (!rawDelay) {
    return 0;
  }
  if (!isAiGeneratedRunningPlanDevFixtureEnabled(env)) {
    throw new Error(
      `${AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_DELAY_MS_ENV} requires the local plan-first fixture to be enabled.`,
    );
  }
  if (!isLoopbackRuntimeUrl(env.NEXT_PUBLIC_SUPABASE_URL)) {
    throw new Error(
      `${AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_DELAY_MS_ENV} requires loopback NEXT_PUBLIC_SUPABASE_URL.`,
    );
  }

  const delayMs = Number(rawDelay);
  if (
    !Number.isSafeInteger(delayMs) ||
    delayMs <= 0 ||
    delayMs > MAX_AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_DELAY_MS
  ) {
    throw new Error(
      `${AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_DELAY_MS_ENV} must be an integer from 1 to ${MAX_AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_DELAY_MS}.`,
    );
  }

  return delayMs;
}

export function isAiGeneratedRunningPlanDevFixtureModel(model: string | null | undefined) {
  return model === AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL;
}

function resolveAiGeneratedRunningPlanDevFixtureScenario(
  env = readRuntimeEnv(),
): AiGeneratedRunningPlanDevFixtureScenario {
  const rawScenario = env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV]?.trim();

  if (!rawScenario) {
    return "default";
  }
  if (
    rawScenario !== NON_REPEAT_TEMPO_FIXTURE_SCENARIO &&
    rawScenario !== CAMELOT_FIXTURE_SCENARIO
  ) {
    throw new Error(
      `${AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV} must be ${NON_REPEAT_TEMPO_FIXTURE_SCENARIO} or ${CAMELOT_FIXTURE_SCENARIO}.`,
    );
  }
  if (
    !isAiGeneratedRunningPlanDevFixtureEnabled(env) ||
    !isLoopbackRuntimeUrl(env.NEXT_PUBLIC_SUPABASE_URL)
  ) {
    throw new Error(
      `${AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV} requires loopback NEXT_PUBLIC_SUPABASE_URL.`,
    );
  }

  return rawScenario;
}

function buildAiGeneratedRunningPlanDevFixtureFetch(
  input: {
    authoringInput: StructuredPlanAuthoringInput;
    today?: string | null;
  },
  delayMs: number,
  fixtureScenario: AiGeneratedRunningPlanDevFixtureScenario,
): typeof fetch {
  const outputText = JSON.stringify(
    buildAiGeneratedRunningPlanDevFixtureProviderDraft(input.authoringInput, fixtureScenario),
  );
  const distance = requireSelectedDistance(input.authoringInput);

  return async (_url, init) => {
    await waitForFixtureProviderCompletion(delayMs, init?.signal);

    return new Response(
      JSON.stringify({
        id: `local-dev-ai-plan-first-${slugify(distance.label)}`,
        status: "completed",
        output_text: outputText,
        usage: {
          input_tokens: 100,
          output_tokens: 100,
          output_tokens_details: { reasoning_tokens: 25 },
          total_tokens: 200,
        },
        text: {
          format: {
            name: AI_AUTHORED_PLAN_FIRST_RESPONSE_SCHEMA_NAME,
          },
        },
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );
  };
}

export function buildAiGeneratedRunningPlanDevFixtureProviderDraft(
  authoringInput: StructuredPlanAuthoringInput,
  fixtureScenario: AiGeneratedRunningPlanDevFixtureScenario = "default",
): AiAuthoredPlanFirstCompilerDraft {
  const distance = requireSelectedDistance(authoringInput);
  const startDate = authoringInput.schedule.startDate;
  const requestedTargetDate = authoringInput.planGoalIntent.targetDate;
  if (!requestedTargetDate) {
    throw new Error("Local plan-first fixture requires a runner-selected target date.");
  }
  const adaptationContext = buildAiAuthoredFirstSessionAdaptationContext(authoringInput);
  const paceTargetsAllowed = Boolean(
    authoringInput.runnerFacts.benchmark || authoringInput.planGoalIntent.targetFinishTime,
  );
  const targetDate = requestedTargetDate;
  const detailedEndDate = resolveAiAuthoredPlanFirstDetailedEndDate({ startDate, targetDate });
  const targetInDetailedHorizon = targetDate === detailedEndDate;
  const finalWorkoutDate = targetInDetailedHorizon
    ? targetDate
    : findAvailableDateOnOrBefore(
        detailedEndDate,
        startDate,
        authoringInput.availability.fixedRestDays ?? [],
      );
  const workouts = buildFixtureWorkoutDays({
    startDate,
    endDate: detailedEndDate,
    endpointDate: finalWorkoutDate,
    maxWorkoutsPerWeek: authoringInput.availability.maxRunningDaysPerWeek ?? 4,
    fixedRestDays: authoringInput.availability.fixedRestDays ?? [],
    fixtureScenario,
    adaptationRequired: adaptationContext.adaptation.required,
    targetContext: {
      heartRateProfile: authoringInput.runnerFacts.heartRateProfile,
      paceTargetsAllowed,
    },
  });
  const finalWorkout = targetInDetailedHorizon
    ? buildEndpointFixtureDay(finalWorkoutDate, distance.distanceMeters, {
        heartRateProfile: authoringInput.runnerFacts.heartRateProfile,
        paceTargetsAllowed,
      })
    : authoringInput.availability.preferredLongRunDay === weekdayForDate(finalWorkoutDate) &&
        diffDaysIso(finalWorkoutDate, startDate) >= 21
      ? buildCutbackLongRunFixtureDay(finalWorkoutDate, {
          heartRateProfile: authoringInput.runnerFacts.heartRateProfile,
          paceTargetsAllowed,
        })
      : buildEasyFixtureDay(finalWorkoutDate, {
          heartRateProfile: authoringInput.runnerFacts.heartRateProfile,
          paceTargetsAllowed,
        });
  const targetAssumption = `${distance.label} target on ${targetDate}`;
  const projections = buildFixtureBlueprintProjections({
    detailedEndDate,
    targetDate,
    targetAssumption,
    expectedWeeklyCadence: authoringInput.availability.maxRunningDaysPerWeek ?? 4,
    fixedRestDays: authoringInput.availability.fixedRestDays ?? [],
    preferredLongRunDay: authoringInput.availability.preferredLongRunDay ?? null,
  });
  const workoutFamilies = [
    ...new Set([
      ...workouts.map(fixtureWorkoutFamily),
      fixtureWorkoutFamily(finalWorkout),
      ...projections.map((projection) => projection.cadence_or_workout_family),
    ]),
  ].sort();

  const draft: AiAuthoredPlanFirstCompilerDraft = {
    blueprint: {
      start_date: startDate,
      selected_target_date: targetDate,
      target_assumption: targetAssumption,
      phases: [
        {
          phase: "Training plan",
          start_date: startDate,
          end_date: targetDate,
          expected_weekly_cadence: authoringInput.availability.maxRunningDaysPerWeek ?? 4,
          workout_families: workoutFamilies,
        },
      ],
      projections,
    },
    detailed_block: {
      start_date: startDate,
      end_date: detailedEndDate,
      workouts,
      final_workout: finalWorkout,
    },
  };
  return draft;
}

export function buildAiGeneratedContinuationDevFixtureProviderResponse(input: {
  authoringInput: Omit<StructuredPlanAuthoringInput, "requestContext">;
  brief: AdaptiveContinuationAuthoringBriefV2;
}): AdaptiveContinuationProviderResponse {
  const targetContext = {
    heartRateProfile: input.authoringInput.runnerFacts.heartRateProfile,
    paceTargetsAllowed: Boolean(
      input.authoringInput.runnerFacts.benchmark ||
      input.authoringInput.planGoalIntent.targetFinishTime,
    ),
  };
  const distance = requireSelectedDistance(input.authoringInput);
  const authoredDays: ProviderFixtureFinalDay[] = [...input.brief.projections]
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((projection) => {
      const authored = {
        ...buildContinuationFixtureDay({
          date: projection.date,
          workoutFamily: projection.workoutFamily,
          selectedTargetDate: input.brief.blueprint.selectedTargetDate,
          selectedDistanceMeters: distance.distanceMeters,
          targetContext,
        }),
        phase: projection.phase,
      };
      const safeAuthored = applyContinuationFixtureTargetBoundarySafety({
        workout: authored,
        authoringInput: input.authoringInput,
        brief: input.brief,
      });
      if (input.brief.decision.interval.blockMode !== "resolved_interruption_bridge") {
        return safeAuthored;
      }
      const dayOffset = diffDaysIso(projection.date, input.brief.decision.interval.startDate);
      return capContinuationFixtureRunnableDuration(
        safeAuthored,
        dayOffset < 7 ? (projection.workoutFamily === "long" ? 60 : 25) : 75,
      );
    });
  const finalWorkout = authoredDays.at(-1);
  if (!finalWorkout) {
    throw new Error("The continuation fixture requires at least one reviewed projection.");
  }
  const workouts = authoredDays.slice(0, -1);
  if (!workouts.every(isProviderFixtureWorkoutDay)) {
    throw new Error("The continuation fixture endpoint must be the final reviewed workout.");
  }

  return {
    contract_version: ADAPTIVE_CONTINUATION_PROVIDER_CONTRACT_VERSION,
    detailed_block: {
      start_date: input.brief.decision.interval.startDate,
      end_date: input.brief.decision.interval.endDate,
      workouts,
      final_workout: finalWorkout,
    },
  };
}

function applyContinuationFixtureTargetBoundarySafety(input: {
  workout: ProviderFixtureFinalDay;
  authoringInput: Omit<StructuredPlanAuthoringInput, "requestContext">;
  brief: AdaptiveContinuationAuthoringBriefV2;
}) {
  const benchmark = input.authoringInput.runnerFacts.benchmark;
  if (
    input.brief.decision.interval.blockMode !== "target_taper_boundary" ||
    input.authoringInput.planGoalIntent.targetFinishTime ||
    input.brief.decision.comparableContextKeys.length > 0 ||
    !benchmark ||
    benchmark.kind !== "recent_5k" ||
    input.workout.workout_identity !== "distance_intervals"
  ) {
    return input.workout;
  }
  const workout = structuredClone(input.workout);
  const pace = `${fixturePace(benchmark.paceSecondsPerKm)}-${fixturePace(benchmark.paceSecondsPerKm + 15)}/km`;
  for (const section of workout.sections) {
    if (section.kind !== "repeat") continue;
    for (const child of section.children) {
      if (child.role !== "work" || child.target.primary_execution_mode !== "pace") continue;
      child.target.command = pace;
      child.cue = "Run each repeat evenly and stay controlled. RPE max 8/10";
    }
  }
  return workout;
}

function fixturePace(secondsPerKm: number) {
  return `${Math.floor(secondsPerKm / 60)}:${String(secondsPerKm % 60).padStart(2, "0")}`;
}

function capContinuationFixtureRunnableDuration<T extends ProviderFixtureFinalDay>(
  day: T,
  maximumMinutes: number,
): T {
  let currentMinutes = 0;
  for (const section of day.sections) {
    if (section.kind === "hydration") continue;
    if (section.kind === "unit") {
      if (section.prescription.mode !== "time") return day;
      currentMinutes += section.prescription.duration_min;
      continue;
    }
    for (const child of section.children) {
      if (child.prescription.mode !== "time") return day;
      currentMinutes += child.prescription.duration_min * section.rounds;
    }
  }
  if (currentMinutes <= maximumMinutes) return day;
  const scale = maximumMinutes / currentMinutes;
  const scaled = structuredClone(day);
  for (const section of scaled.sections) {
    if (section.kind === "hydration") continue;
    if (section.kind === "unit" && section.prescription.mode === "time") {
      section.prescription.duration_min = Number(
        (section.prescription.duration_min * scale).toFixed(3),
      );
      continue;
    }
    if (section.kind === "repeat") {
      for (const child of section.children) {
        if (child.prescription.mode === "time") {
          child.prescription.duration_min = Number(
            (child.prescription.duration_min * scale).toFixed(3),
          );
        }
      }
    }
  }
  return scaled;
}

function buildFixtureBlueprintProjections(input: {
  detailedEndDate: string;
  targetDate: string;
  targetAssumption: string;
  expectedWeeklyCadence: number;
  fixedRestDays: readonly WeekdayName[];
  preferredLongRunDay: WeekdayName | null;
}): AiAuthoredPlanFirstCompilerDraft["blueprint"]["projections"] {
  if (input.targetDate <= input.detailedEndDate) return [];

  const projections: AiAuthoredPlanFirstCompilerDraft["blueprint"]["projections"] = [];
  const futureStartDate = addDaysIso(input.detailedEndDate, 1);
  for (
    let weekStart = startOfWeekIso(futureStartDate);
    weekStart <= input.targetDate;
    weekStart = addDaysIso(weekStart, 7)
  ) {
    const intervalStart = futureStartDate > weekStart ? futureStartDate : weekStart;
    const weekEnd = addDaysIso(weekStart, 6);
    const intervalEnd = input.targetDate < weekEnd ? input.targetDate : weekEnd;
    const dates: string[] = [];
    for (let date = intervalStart; date <= intervalEnd; date = addDaysIso(date, 1)) {
      dates.push(date);
    }
    const requiredCount = Math.min(input.expectedWeeklyCadence, dates.length);
    const availableDates = dates.filter(
      (date) => !input.fixedRestDays.includes(weekdayLong(date) as WeekdayName),
    );
    const selectedDates = availableDates.slice(0, requiredCount);
    for (const date of dates) {
      if (selectedDates.length >= requiredCount) break;
      if (!selectedDates.includes(date)) selectedDates.push(date);
    }
    if (
      dates.includes(input.targetDate) &&
      !selectedDates.includes(input.targetDate) &&
      selectedDates.length > 0
    ) {
      selectedDates[selectedDates.length - 1] = input.targetDate;
    }
    selectedDates.sort((left, right) => left.localeCompare(right));
    for (const date of selectedDates) {
      const isTarget = date === input.targetDate;
      const weekday = weekdayLong(date) as WeekdayName;
      const weekOrdinal = Math.floor(
        (Date.parse(`${weekStart}T00:00:00Z`) -
          Date.parse(`${startOfWeekIso(futureStartDate)}T00:00:00Z`)) /
          (7 * 86_400_000),
      );
      const workoutFamily = isTarget
        ? "race"
        : input.preferredLongRunDay === weekday
          ? "long"
          : weekday === "Tuesday"
            ? weekOrdinal % 2 === 0
              ? "intervals"
              : "steady"
            : "easy";
      projections.push({
        projection_id: isTarget ? `fixture-target-${date}` : `fixture-projection-${date}`,
        date,
        phase: "Training plan",
        cadence_or_workout_family: workoutFamily,
        target_assumption: input.targetAssumption,
        review_timing: isTarget ? "target_review" : "details_closer_to_date",
        label: "Planned · details closer to the date",
      });
    }
  }
  return projections;
}

function buildFixtureWorkoutDays(input: {
  startDate: string;
  endDate: string;
  endpointDate: string;
  maxWorkoutsPerWeek: number | null;
  fixedRestDays: readonly WeekdayName[];
  fixtureScenario: AiGeneratedRunningPlanDevFixtureScenario;
  adaptationRequired: boolean;
  targetContext: ProviderFixtureTargetContext;
}): AiAuthoredPlanFirstCompilerDraft["detailed_block"]["workouts"] {
  const days = new Map<
    string,
    AiAuthoredPlanFirstCompilerDraft["detailed_block"]["workouts"][number]
  >();
  if (input.adaptationRequired) {
    const adaptationBuilders = [
      buildRunWalkFixtureDay,
      buildAdaptationEasyFixtureDay,
      buildRecoveryFixtureDay,
      buildProgressedRunWalkFixtureDay,
    ] as const;
    let nextContactDate = input.startDate;

    for (const build of adaptationBuilders) {
      const date = findSchedulableFixtureDate({
        candidate: nextContactDate,
        days,
        ...input,
      });
      if (!date) {
        throw new Error(
          "Local plan-first fixture could not author the required adaptation bridge.",
        );
      }
      days.set(date, build(date, input.targetContext));
      nextContactDate = addDaysIso(date, 2);
    }

    const firstLongRunDate = findSchedulableFixtureDate({
      candidate: laterIso(addDaysIso(input.startDate, 14), nextContactDate),
      days,
      ...input,
    });
    if (!firstLongRunDate) {
      throw new Error(
        "Local plan-first fixture could not author the first post-adaptation long run.",
      );
    }
    days.set(
      firstLongRunDate,
      buildAdaptationLongRunFixtureDay(firstLongRunDate, input.targetContext),
    );

    const qualityDate = findSchedulableFixtureDate({
      candidate: addDaysIso(firstLongRunDate, 4),
      days,
      ...input,
    });
    if (qualityDate) {
      const buildQuality =
        input.fixtureScenario === NON_REPEAT_TEMPO_FIXTURE_SCENARIO
          ? buildTempoFixtureDay
          : buildRepeatFixtureDay;
      days.set(qualityDate, buildQuality(qualityDate, input.targetContext));
    }
  } else {
    const weekCount = Math.ceil(
      (Date.parse(`${input.endDate}T00:00:00Z`) -
        Date.parse(`${input.startDate}T00:00:00Z`) +
        86_400_000) /
        (7 * 86_400_000),
    );
    for (let weekIndex = 0; weekIndex < weekCount; weekIndex += 1) {
      const weekStart = addDaysIso(input.startDate, weekIndex * 7);
      const weekEnd = earlierIso(addDaysIso(weekStart, 6), input.endDate);
      const candidates = buildStandardFixtureWeekCandidates({
        weekIndex,
        fixtureScenario: input.fixtureScenario,
        targetContext: input.targetContext,
      });

      for (const candidate of candidates) {
        const date = findSchedulableFixtureDate({
          candidate: addDaysIso(weekStart, candidate.offset),
          endDate: weekEnd,
          endpointDate: input.endpointDate,
          days,
          maxWorkoutsPerWeek: input.maxWorkoutsPerWeek,
          fixedRestDays: input.fixedRestDays,
        });
        if (date) days.set(date, candidate.build(date));
      }
    }
  }

  if (input.maxWorkoutsPerWeek != null) {
    const endpointWeekStart = startOfWeekIso(input.endpointDate);
    const endpointWeekDates = [...days.keys()]
      .filter((date) => startOfWeekIso(date) === endpointWeekStart)
      .sort();
    const priorWeekContactCount = [...days.keys()].filter(
      (date) => startOfWeekIso(date) === addDaysIso(endpointWeekStart, -7),
    ).length;
    const maximumContactsBeforeFinal = Math.min(
      input.maxWorkoutsPerWeek - 1,
      priorWeekContactCount > 0 ? priorWeekContactCount - 1 : input.maxWorkoutsPerWeek - 1,
    );
    while (endpointWeekDates.length > maximumContactsBeforeFinal) {
      const removableDate = selectFixtureDateToRemoveForFinalWorkout(days, endpointWeekDates);
      days.delete(removableDate);
      endpointWeekDates.splice(endpointWeekDates.indexOf(removableDate), 1);
    }
  }

  const hasFinalHorizonWorkout = [...days.keys()].some(
    (date) => date < input.endpointDate && addDaysIso(date, 14) >= input.endpointDate,
  );
  if (!hasFinalHorizonWorkout) {
    const finalHorizonDate = findSchedulableFixtureDate({
      candidate: addDaysIso(input.endpointDate, -14),
      endDate: addDaysIso(input.endpointDate, -1),
      endpointDate: input.endpointDate,
      days,
      maxWorkoutsPerWeek: input.maxWorkoutsPerWeek,
      fixedRestDays: input.fixedRestDays,
    });
    if (finalHorizonDate) {
      days.set(finalHorizonDate, buildEasyFixtureDay(finalHorizonDate, input.targetContext));
    }
  }

  return [...days.values()].sort((left, right) => left.date.localeCompare(right.date));
}

function selectFixtureDateToRemoveForFinalWorkout(
  days: ReadonlyMap<string, ProviderFixtureWorkoutDay>,
  candidateDates: readonly string[],
) {
  const byRemovalPriority = [...candidateDates].sort((left, right) => {
    const priority = (date: string) => {
      const family = fixtureWorkoutFamily(days.get(date)!);
      if (!["easy", "recovery", "long"].includes(family)) return 0;
      if (family === "recovery") return 1;
      if (family === "easy") return 2;
      return 3;
    };
    return priority(left) - priority(right) || right.localeCompare(left);
  });
  const removableDate = byRemovalPriority[0];
  if (!removableDate) {
    throw new Error("Local plan-first fixture could not reserve its final workout slot.");
  }
  return removableDate;
}

function findSchedulableFixtureDate(input: {
  candidate: string;
  endDate: string;
  endpointDate: string;
  days: ReadonlyMap<string, unknown>;
  maxWorkoutsPerWeek: number | null;
  fixedRestDays: readonly WeekdayName[];
}) {
  for (let date = input.candidate; date <= input.endDate; date = addDaysIso(date, 1)) {
    if (
      date !== input.endpointDate &&
      !input.days.has(date) &&
      !input.fixedRestDays.includes(weekdayForDate(date)) &&
      canAddWorkout(input.days, date, input.maxWorkoutsPerWeek)
    ) {
      return date;
    }
  }
  return null;
}

function buildStandardFixtureWeekCandidates(input: {
  weekIndex: number;
  fixtureScenario: AiGeneratedRunningPlanDevFixtureScenario;
  targetContext: ProviderFixtureTargetContext;
}) {
  if (input.weekIndex % 4 === 3) {
    const cutbackQuality =
      input.fixtureScenario === NON_REPEAT_TEMPO_FIXTURE_SCENARIO
        ? buildTempoFixtureDay
        : buildRepeatFixtureDay;
    return [
      {
        offset: 0,
        build: (date: string) => buildAdaptationEasyFixtureDay(date, input.targetContext),
      },
      { offset: 1, build: (date: string) => cutbackQuality(date, input.targetContext) },
      {
        offset: 3,
        build: (date: string) => buildRecoveryFixtureDay(date, input.targetContext),
      },
      {
        offset: 5,
        build: (date: string) => buildCutbackLongRunFixtureDay(date, input.targetContext),
      },
    ];
  }
  const qualityBuilders =
    input.fixtureScenario === CAMELOT_FIXTURE_SCENARIO
      ? [buildSteadyFixtureDay, buildDistanceIntervalsFixtureDay, buildUphillRepeatsFixtureDay]
      : input.fixtureScenario === NON_REPEAT_TEMPO_FIXTURE_SCENARIO
        ? [buildTempoFixtureDay, buildDistanceIntervalsFixtureDay, buildUphillRepeatsFixtureDay]
        : [buildRepeatFixtureDay, buildDistanceIntervalsFixtureDay, buildUphillRepeatsFixtureDay];
  const firstBuilders =
    input.fixtureScenario === CAMELOT_FIXTURE_SCENARIO
      ? [buildEasyFixtureDay]
      : [buildEasyFixtureDay, buildStridesFixtureDay, buildEasyFixtureDay];
  const quality = qualityBuilders[input.weekIndex % qualityBuilders.length]!;
  const first = firstBuilders[input.weekIndex % firstBuilders.length]!;

  return [
    { offset: 0, build: (date: string) => first(date, input.targetContext) },
    { offset: 1, build: (date: string) => quality(date, input.targetContext) },
    { offset: 3, build: (date: string) => buildRecoveryFixtureDay(date, input.targetContext) },
    { offset: 5, build: (date: string) => buildLongRunFixtureDay(date, input.targetContext) },
  ];
}

function buildEasyFixtureDay(date: string, context: ProviderFixtureTargetContext) {
  return workoutDay(date, "easy_aerobic_run", "Easy Run", [
    unitSection("warmup", "Warm Up", timePrescription(5), paceTarget("7:15-7:45/km", context)),
    unitSection("main", "Work", timePrescription(25), heartRateTarget("Z2", context)),
    unitSection("cooldown", "Cool Down", timePrescription(5), paceTarget("7:30-8:00/km", context)),
  ]);
}

function buildContinuationFixtureDay(input: {
  date: string;
  workoutFamily: string;
  selectedTargetDate: string;
  selectedDistanceMeters: number;
  targetContext: ProviderFixtureTargetContext;
}): ProviderFixtureFinalDay {
  const { date, targetContext } = input;
  switch (input.workoutFamily) {
    case "recovery":
      return buildRecoveryFixtureDay(date, targetContext);
    case "easy":
      return buildEasyFixtureDay(date, targetContext);
    case "steady":
      return buildSteadyFixtureDay(date, targetContext);
    case "long":
      return buildLongRunFixtureDay(date, targetContext);
    case "tempo":
      return buildTempoFixtureDay(date, targetContext);
    case "intervals":
      return buildDistanceIntervalsFixtureDay(date, targetContext);
    case "progression":
      return {
        ...buildTempoFixtureDay(date, targetContext),
        workout_identity: "progression_run" as const,
        title: "Progression Run",
      };
    case "race":
      return date === input.selectedTargetDate
        ? buildEndpointFixtureDay(date, input.selectedDistanceMeters, targetContext)
        : {
            ...buildTempoFixtureDay(date, targetContext),
            workout_identity: "race_pace_session" as const,
            title: "Race Pace Session",
          };
    case "hills":
      return buildUphillRepeatsFixtureDay(date, targetContext);
    case "trail":
      return {
        ...buildEasyFixtureDay(date, targetContext),
        workout_identity: "technical_trail_easy" as const,
        title: "Easy Trail Run",
      };
    default:
      throw new Error(`The continuation fixture has no ${input.workoutFamily} family author.`);
  }
}

function buildSteadyFixtureDay(date: string, context: ProviderFixtureTargetContext) {
  return workoutDay(date, "steady_aerobic_run", "Steady Run", [
    unitSection("warmup", "Warm Up", timePrescription(8), paceTarget("7:00-7:30/km", context)),
    {
      ...unitSection(
        "main",
        "Controlled steady",
        timePrescription(25),
        heartRateTarget("Z3", context),
      ),
      cue: "Hold controlled aerobic pressure without crossing into threshold effort.",
    },
    unitSection("cooldown", "Cool Down", timePrescription(7), paceTarget("7:15-7:45/km", context)),
  ]);
}

function isProviderFixtureWorkoutDay(
  day: ProviderFixtureFinalDay,
): day is ProviderFixtureWorkoutDay {
  return day.workout_identity !== "selected_distance_completion_or_checkpoint";
}

function buildRunWalkFixtureDay(date: string, context: ProviderFixtureTargetContext) {
  return buildRunWalkAdaptationFixtureDay(date, 4, context);
}

function buildProgressedRunWalkFixtureDay(date: string, context: ProviderFixtureTargetContext) {
  return buildRunWalkAdaptationFixtureDay(date, 5, context);
}

function buildRunWalkAdaptationFixtureDay(
  date: string,
  repeatCount: number,
  context: ProviderFixtureTargetContext,
) {
  return workoutDay(date, "recovery_jog", "Run/Walk", [
    unitSection(
      "warmup",
      "Warm Up Walk",
      timePrescription(5),
      paceTarget("9:30-11:00/km", context),
    ),
    {
      kind: "repeat",
      segment_type: "interval_block",
      label: "Repeat",
      cue: null,
      rounds: repeatCount,
      children: [
        repeatChild(
          "run",
          "Easy Jog",
          timePrescription(2),
          paceTarget("7:30-8:15/km", context, "Z2"),
        ),
        repeatChild("walk", "Walk", timePrescription(1), paceTarget("9:30-11:00/km", context)),
      ],
    },
    unitSection(
      "cooldown",
      "Cool Down Walk",
      timePrescription(5),
      paceTarget("9:30-11:00/km", context),
    ),
  ]);
}

function buildAdaptationEasyFixtureDay(date: string, context: ProviderFixtureTargetContext) {
  return workoutDay(date, "easy_aerobic_run", "Easy", [
    unitSection(
      "warmup",
      "Warm Up Walk",
      timePrescription(5),
      paceTarget("9:30-11:00/km", context),
    ),
    unitSection("main", "Work", timePrescription(15), heartRateTarget("Z2", context)),
    unitSection(
      "cooldown",
      "Cool Down Walk",
      timePrescription(5),
      paceTarget("9:30-11:00/km", context),
    ),
  ]);
}

function buildRecoveryFixtureDay(date: string, context: ProviderFixtureTargetContext) {
  return workoutDay(date, "recovery_jog", "Recovery", [
    unitSection(
      "warmup",
      "Warm Up Walk",
      timePrescription(5),
      paceTarget("9:30-11:00/km", context),
    ),
    unitSection("recovery_jog", "Work", timePrescription(12), heartRateTarget("Z1", context)),
    unitSection(
      "cooldown",
      "Cool Down Walk",
      timePrescription(5),
      paceTarget("9:30-11:00/km", context),
    ),
  ]);
}

function buildAdaptationLongRunFixtureDay(date: string, context: ProviderFixtureTargetContext) {
  return workoutDay(date, "long_aerobic_run", "Long Run", [
    unitSection(
      "warmup",
      "Warm Up Walk",
      timePrescription(5),
      paceTarget("9:30-11:00/km", context),
    ),
    unitSection("main", "Work", timePrescription(30), heartRateTarget("Z2", context)),
    hydrationSection(),
    unitSection(
      "cooldown",
      "Cool Down Walk",
      timePrescription(5),
      paceTarget("9:30-11:00/km", context),
    ),
  ]);
}

function buildTempoFixtureDay(date: string, context: ProviderFixtureTargetContext) {
  return workoutDay(date, "controlled_tempo_session", "Tempo", [
    unitSection("warmup", "Warm Up", timePrescription(10), paceTarget("7:00-7:30/km", context)),
    {
      ...unitSection(
        "tempo_block",
        "Work",
        timePrescription(20),
        paceTarget("5:40-5:55/km", context, "Z4"),
      ),
      cue: "Keep the effort controlled at RPE max 7/10.",
    },
    unitSection("cooldown", "Cool Down", timePrescription(10), paceTarget("7:15-7:45/km", context)),
  ]);
}

function buildRepeatFixtureDay(date: string, context: ProviderFixtureTargetContext) {
  return workoutDay(date, "controlled_tempo_session", "Tempo", [
    unitSection("warmup", "Warm Up", timePrescription(10), paceTarget("7:00-7:30/km", context)),
    {
      kind: "repeat",
      segment_type: "interval_block",
      label: "Repeat",
      cue: null,
      rounds: 3,
      children: [
        {
          ...repeatChild(
            "work",
            "Work",
            timePrescription(2),
            paceOrShortEffortTarget("5:40-5:55/km", context, "controlled_short_repetition"),
          ),
          cue: "Keep the effort controlled at RPE max 7/10.",
        },
        {
          ...repeatChild(
            "recover",
            "Recovery",
            timePrescription(1.5),
            paceOrShortRecoveryEffortTarget("7:15-8:00/km", context),
          ),
          cue: "Recover fully at relaxed, controlled effort and let breathing settle.",
        },
      ],
    },
    unitSection("cooldown", "Cool Down", timePrescription(10), paceTarget("7:15-7:45/km", context)),
  ]);
}

function buildDistanceIntervalsFixtureDay(date: string, context: ProviderFixtureTargetContext) {
  return workoutDay(date, "distance_intervals", "Distance Intervals", [
    unitSection("warmup", "Warm Up", timePrescription(10), paceTarget("6:45-7:15/km", context)),
    {
      kind: "repeat",
      segment_type: "interval_block",
      label: "400 m repeats",
      cue: "Run each repeat evenly and keep the recovery relaxed.",
      rounds: 5,
      children: [
        {
          ...repeatChild(
            "work",
            "400 m",
            distancePrescription(0.4),
            paceOrShortEffortTarget("4:45-4:55/km", context, "controlled_short_repetition"),
          ),
          cue: "Run each repetition at controlled hard effort, RPE max 8/10.",
        },
        {
          ...repeatChild(
            "recover",
            "Easy recovery",
            timePrescription(1.5),
            paceOrShortRecoveryEffortTarget("7:15-8:00/km", context),
          ),
          cue: "Recover fully at relaxed, controlled effort; do not chase heart rate.",
        },
      ],
    },
    unitSection("cooldown", "Cool Down", timePrescription(10), paceTarget("7:00-7:30/km", context)),
  ]);
}

function buildUphillRepeatsFixtureDay(date: string, context: ProviderFixtureTargetContext) {
  return workoutDay(date, "uphill_repeats", "Uphill Repeats", [
    unitSection("warmup", "Warm Up", timePrescription(12), paceTarget("6:45-7:15/km", context)),
    {
      kind: "repeat",
      segment_type: "interval_block",
      label: "Uphill set",
      cue: "Run tall uphill at controlled effort, never a sprint, then jog back down under control.",
      rounds: 6,
      children: [
        {
          ...repeatChild(
            "work",
            "Uphill",
            distancePrescription(0.1),
            terrainEffortTarget("controlled_uphill"),
          ),
          cue: "Run tall at controlled uphill effort; never a sprint.",
        },
        {
          ...repeatChild(
            "recover",
            "Jog down",
            timePrescription(1),
            terrainEffortTarget("controlled_downhill_recovery"),
          ),
          cue: "Jog back downhill under control and recover fully.",
        },
      ],
    },
    unitSection("cooldown", "Cool Down", timePrescription(10), paceTarget("7:00-7:30/km", context)),
  ]);
}

function buildStridesFixtureDay(date: string, context: ProviderFixtureTargetContext) {
  return workoutDay(date, "easy_run_with_strides", "Easy Run with Strides", [
    unitSection(
      "warmup",
      "Easy running",
      timePrescription(25),
      paceTarget("6:35-7:05/km", context),
    ),
    {
      kind: "repeat",
      segment_type: "strides",
      label: "Relaxed strides",
      cue: "Accelerate smoothly without sprinting.",
      rounds: 4,
      children: [
        {
          ...repeatChild(
            "work",
            "Stride",
            timePrescription(0.33),
            paceOrShortEffortTarget("4:20-4:40/km", context, "controlled_stride"),
          ),
          cue: "Accelerate smoothly with relaxed form at controlled fast effort; never sprint.",
        },
        {
          ...repeatChild(
            "recover",
            "Easy reset",
            timePrescription(1),
            paceOrShortRecoveryEffortTarget("7:15-8:00/km", context),
          ),
          cue: "Reset at relaxed, controlled effort and recover fully before the next stride.",
        },
      ],
    },
    unitSection("cooldown", "Cool Down", timePrescription(5), paceTarget("7:00-7:30/km", context)),
  ]);
}

function buildLongRunFixtureDay(date: string, context: ProviderFixtureTargetContext) {
  return workoutDay(date, "long_aerobic_run", "Long Run", [
    unitSection("warmup", "Warm Up", timePrescription(10), paceTarget("7:00-7:30/km", context)),
    unitSection("main", "Work", timePrescription(40), heartRateTarget("Z2", context)),
    hydrationSection(),
    unitSection("cooldown", "Cool Down", timePrescription(5), paceTarget("7:15-7:45/km", context)),
  ]);
}

function buildCutbackLongRunFixtureDay(date: string, context: ProviderFixtureTargetContext) {
  return workoutDay(date, "cutback_long_run", "Cutback Long Run", [
    unitSection("warmup", "Warm Up", timePrescription(5), paceTarget("7:00-7:30/km", context)),
    unitSection("main", "Work", timePrescription(20), heartRateTarget("Z2", context)),
    unitSection("cooldown", "Cool Down", timePrescription(5), paceTarget("7:15-7:45/km", context)),
  ]);
}

function buildEndpointFixtureDay(
  date: string,
  distanceMeters: number,
  context: ProviderFixtureTargetContext,
): ProviderFixtureFinalDay {
  return {
    date,
    phase: "Training plan",
    workout_identity: "selected_distance_completion_or_checkpoint" as const,
    title: "Selected Distance",
    cue: "Complete the selected distance.",
    sections: [
      unitSection(
        "main",
        "Work",
        distancePrescription(distanceMeters / 1000),
        paceTarget("5:30-5:45/km", context, "Z3"),
      ),
    ],
  };
}

function workoutDay(
  date: string,
  workoutIdentity: AiAuthoredPlanFirstCompilerDraft["detailed_block"]["workouts"][number]["workout_identity"],
  title: string,
  sections: AiAuthoredPlanFirstCompilerDraft["detailed_block"]["workouts"][number]["sections"],
): AiAuthoredPlanFirstCompilerDraft["detailed_block"]["workouts"][number] {
  return {
    date,
    phase: "Training plan",
    workout_identity: workoutIdentity,
    title,
    cue: `${title} execution.`,
    sections,
  };
}

function unitSection(
  segmentType: Extract<ProviderFixtureSection, { kind: "unit" }>["segment_type"],
  label: string,
  prescription: { mode: "time"; duration_min: number } | { mode: "distance"; distance_km: number },
  sectionTarget: ProviderFixtureTarget,
) {
  return {
    kind: "unit" as const,
    segment_type: segmentType,
    label,
    cue: null,
    prescription,
    target: sectionTarget,
  } satisfies ProviderFixtureUnitSection;
}

function repeatChild(
  role: ProviderFixtureRepeatChild["role"],
  label: string,
  prescription: { mode: "time"; duration_min: number } | { mode: "distance"; distance_km: number },
  childTarget: ProviderFixtureTarget,
): ProviderFixtureRepeatChild {
  return {
    role,
    label,
    cue: null,
    prescription,
    target: childTarget,
  };
}

function paceTarget(
  pace: string,
  context: ProviderFixtureTargetContext,
  fallbackReference: "Z1" | "Z2" | "Z3" | "Z4" | "Z5" = "Z1",
): ProviderFixtureTarget {
  if (!context.paceTargetsAllowed) {
    return heartRateTarget(fallbackReference, context);
  }
  return {
    primary_execution_mode: "pace",
    command: pace,
  };
}

function terrainEffortTarget(
  effortKind: "controlled_uphill" | "controlled_downhill_recovery",
): ProviderFixtureTarget {
  return {
    primary_execution_mode: "effort",
    effort_kind: effortKind,
  };
}

function paceOrShortEffortTarget(
  pace: string,
  context: ProviderFixtureTargetContext,
  effortKind: "controlled_short_repetition" | "controlled_stride",
): ProviderFixtureTarget {
  return context.paceTargetsAllowed
    ? { primary_execution_mode: "pace", command: pace }
    : { primary_execution_mode: "effort", effort_kind: effortKind };
}

function paceOrShortRecoveryEffortTarget(
  pace: string,
  context: ProviderFixtureTargetContext,
): ProviderFixtureTarget {
  return context.paceTargetsAllowed
    ? { primary_execution_mode: "pace", command: pace }
    : { primary_execution_mode: "effort", effort_kind: "controlled_short_recovery" };
}

function heartRateTarget(
  reference: "Z1" | "Z2" | "Z3" | "Z4" | "Z5",
  context: ProviderFixtureTargetContext,
): ProviderFixtureTarget {
  const guidance = resolveEffectiveHeartRateGuidance(context.heartRateProfile, reference);
  if (!guidance) throw new Error(`Fixture heart-rate reference ${reference} is unavailable.`);
  return {
    primary_execution_mode: "heart_rate",
    band_reference: reference,
    command: guidance.rangeBpm,
  };
}

function hydrationSection(): ProviderFixtureSection {
  return {
    kind: "hydration",
    label: WORKOUT_DOCUMENT_HYDRATION_LABEL,
    cue: WORKOUT_DOCUMENT_HYDRATION_CUE,
  };
}

function timePrescription(durationMin: number) {
  return { mode: "time" as const, duration_min: durationMin };
}

function distancePrescription(distanceKm: number) {
  return { mode: "distance" as const, distance_km: distanceKm };
}

function canAddWorkout(
  days: ReadonlyMap<string, unknown>,
  date: string,
  maxWorkoutsPerWeek: number | null,
) {
  if (maxWorkoutsPerWeek == null) return true;

  const weekStart = startOfWeekIso(date);
  return (
    [...days.keys()].filter((candidateDate) => startOfWeekIso(candidateDate) === weekStart).length <
    maxWorkoutsPerWeek
  );
}

function findAvailableDateOnOrBefore(
  candidate: string,
  startDate: string,
  fixedRestDays: readonly WeekdayName[],
) {
  for (let date = candidate; date >= startDate; date = addDaysIso(date, -1)) {
    if (!fixedRestDays.includes(weekdayForDate(date))) return date;
  }
  return startDate;
}

function weekdayForDate(date: string) {
  return WEEKDAY_NAMES[
    new Date(`${date}T00:00:00Z`).getUTCDay() === 0
      ? 6
      : new Date(`${date}T00:00:00Z`).getUTCDay() - 1
  ]!;
}

function requireSelectedDistance(authoringInput: StructuredPlanAuthoringInput) {
  const distance = authoringInput.planGoalIntent.distance;
  if (!distance) {
    throw new Error("Local plan-first fixture requires an exact selected distance.");
  }
  return distance;
}

function prospectiveQaFixtureStartDate(asOfDate: string) {
  const currentWeekStart = startOfWeekIso(asOfDate);
  return currentWeekStart < asOfDate ? addDaysIso(currentWeekStart, 7) : currentWeekStart;
}

function fixtureWorkoutFamily(day: ProviderFixtureWorkoutDay | ProviderFixtureFinalDay) {
  const family = resolveCanonicalWorkoutModel({
    workoutType: "quality",
    workoutIdentity: day.workout_identity,
  }).workoutFamily;
  if (family === "recorded") {
    throw new Error("The plan-authoring fixture cannot use the factual recorded Activity family.");
  }
  return family;
}

function parseBooleanFlag(value: string | undefined): boolean | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return null;
}

async function waitForFixtureProviderCompletion(delayMs: number, signal?: AbortSignal | null) {
  if (delayMs <= 0) return;
  if (signal?.aborted) {
    throw new DOMException("Local plan-first fixture request was cancelled.", "AbortError");
  }

  await new Promise<void>((resolve, reject) => {
    const complete = () => {
      signal?.removeEventListener("abort", cancel);
      resolve();
    };
    const cancel = () => {
      clearTimeout(timeoutId);
      reject(new DOMException("Local plan-first fixture request was cancelled.", "AbortError"));
    };
    const timeoutId = setTimeout(complete, delayMs);
    signal?.addEventListener("abort", cancel, { once: true });
  });
}

function readRuntimeEnv(): RuntimeEnv {
  const processEnv =
    typeof globalThis !== "undefined" &&
    "process" in globalThis &&
    typeof globalThis.process === "object" &&
    globalThis.process &&
    "env" in globalThis.process &&
    typeof globalThis.process.env === "object"
      ? globalThis.process.env
      : undefined;
  return processEnv ?? {};
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "");
}

function laterIso(left: string, right: string) {
  return left >= right ? left : right;
}

function earlierIso(left: string, right: string) {
  return left <= right ? left : right;
}
