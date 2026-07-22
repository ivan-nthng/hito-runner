import type { GenerateAiFirstPlanDraftPreviewOptions } from "@/lib/ai-first-plan-draft-service";
import {
  AI_AUTHORED_PLAN_FIRST_RESPONSE_SCHEMA_NAME,
  buildAiAuthoredFirstSessionAdaptationContext,
  type AiAuthoredPlanFirstProviderDraft,
} from "@/lib/ai-authored-plan-first-provider-contract";
import type { StructuredPlanAuthoringInput } from "@/lib/structured-plan-authoring-schema";
import { isLoopbackRuntimeUrl } from "@/lib/supabase/env";
import { addDaysIso, startOfWeekIso } from "@/lib/training";
import { WEEKDAY_NAMES, type WeekdayName } from "@/lib/weekday-rest-invariants";

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

const MAX_AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_DELAY_MS = 10 * 60 * 1000;
const NON_REPEAT_TEMPO_FIXTURE_SCENARIO = "non_repeat_tempo" as const;
const DEFAULT_FIXTURE_HORIZON_DAYS = 28;

type RuntimeEnv = Record<string, string | undefined>;
export type AiGeneratedRunningPlanProviderMode = "real" | "qa_fixture";
type AiGeneratedRunningPlanDevFixtureScenario =
  | "default"
  | typeof NON_REPEAT_TEMPO_FIXTURE_SCENARIO;
type ProviderFixtureSection =
  AiAuthoredPlanFirstProviderDraft["workouts"][number]["sections"][number];
type ProviderFixtureUnitSection = Extract<ProviderFixtureSection, { kind: "unit" }>;
type ProviderFixtureTarget = NonNullable<ProviderFixtureUnitSection["target"]>;
type ProviderFixtureRepeatChild = Extract<
  ProviderFixtureSection,
  { kind: "repeat" }
>["children"][number];

type AiGeneratedRunningPlanFixturePreviewOptions = Omit<
  GenerateAiFirstPlanDraftPreviewOptions,
  "input"
>;

export function buildAiGeneratedRunningPlanDevFixturePreviewOptions(input: {
  authoringInput: StructuredPlanAuthoringInput;
  qaFixtureAuthorized: boolean;
  today?: string | null;
  env?: RuntimeEnv;
}): AiGeneratedRunningPlanFixturePreviewOptions | null {
  if (!input.qaFixtureAuthorized || !isAiGeneratedRunningPlanDevFixtureEnabled(input.env)) {
    return null;
  }

  const delayMs = resolveAiGeneratedRunningPlanDevFixtureDelayMs(input.env);

  return {
    apiKey: "local-qa-dev-ai-generated-plan-fixture",
    model: AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL,
    today: input.today ?? input.authoringInput.schedule.startDate,
    fetchImpl: buildAiGeneratedRunningPlanDevFixtureFetch(
      input,
      delayMs,
      resolveAiGeneratedRunningPlanDevFixtureScenario(input.env),
    ),
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
  if (rawScenario !== NON_REPEAT_TEMPO_FIXTURE_SCENARIO) {
    throw new Error(
      `${AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_SCENARIO_ENV} must be ${NON_REPEAT_TEMPO_FIXTURE_SCENARIO}.`,
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

  return NON_REPEAT_TEMPO_FIXTURE_SCENARIO;
}

function buildAiGeneratedRunningPlanDevFixtureFetch(
  input: {
    authoringInput: StructuredPlanAuthoringInput;
    today?: string | null;
  },
  delayMs: number,
  fixtureScenario: AiGeneratedRunningPlanDevFixtureScenario,
): typeof fetch {
  const draft = buildProviderFixtureDraft(input.authoringInput, fixtureScenario);
  const distance = requireSelectedDistance(input.authoringInput);

  return async (_url, init) => {
    await waitForFixtureProviderCompletion(delayMs, init?.signal);

    return new Response(
      JSON.stringify({
        id: `local-dev-ai-plan-first-${slugify(distance.label)}`,
        status: "completed",
        output_text: JSON.stringify(draft),
        usage: {
          input_tokens: 100,
          output_tokens: 100,
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

function buildProviderFixtureDraft(
  authoringInput: StructuredPlanAuthoringInput,
  fixtureScenario: AiGeneratedRunningPlanDevFixtureScenario,
): AiAuthoredPlanFirstProviderDraft {
  const distance = requireSelectedDistance(authoringInput);
  const startDate = authoringInput.schedule.startDate;
  const requestedTargetDate = authoringInput.planGoalIntent.targetDate;
  const adaptationContext = buildAiAuthoredFirstSessionAdaptationContext(authoringInput);
  const minimumFixtureEndDate = addDaysIso(startDate, DEFAULT_FIXTURE_HORIZON_DAYS - 1);
  const endDate =
    adaptationContext.adaptation.required &&
    (!requestedTargetDate || requestedTargetDate < minimumFixtureEndDate)
      ? minimumFixtureEndDate
      : (requestedTargetDate ?? minimumFixtureEndDate);
  const endpointDate = findAvailableDateOnOrBefore(
    adaptationContext.adaptation.required ? endDate : (requestedTargetDate ?? endDate),
    startDate,
    authoringInput.availability.fixedRestDays,
  );
  const workouts = buildFixtureWorkoutDays({
    startDate,
    endDate,
    endpointDate,
    maxWorkoutsPerWeek: authoringInput.availability.maxRunningDaysPerWeek,
    fixedRestDays: authoringInput.availability.fixedRestDays,
    fixtureScenario,
    adaptationRequired: adaptationContext.adaptation.required,
    paceTruthAvailable: Boolean(authoringInput.runnerFacts.benchmark),
    acceptedHeartRateAvailable: authoringInput.runnerFacts.heartRateProfile.accepted,
  });

  return {
    workouts,
    endpoint: buildEndpointFixtureDay(endpointDate, distance.distanceMeters),
  };
}

function buildFixtureWorkoutDays(input: {
  startDate: string;
  endDate: string;
  endpointDate: string;
  maxWorkoutsPerWeek: number;
  fixedRestDays: readonly WeekdayName[];
  fixtureScenario: AiGeneratedRunningPlanDevFixtureScenario;
  adaptationRequired: boolean;
  paceTruthAvailable: boolean;
  acceptedHeartRateAvailable: boolean;
}): AiAuthoredPlanFirstProviderDraft["workouts"] {
  const days = new Map<string, AiAuthoredPlanFirstProviderDraft["workouts"][number]>();
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
      days.set(date, build(date));
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
      buildAdaptationLongRunFixtureDay(firstLongRunDate, input.acceptedHeartRateAvailable),
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
      days.set(qualityDate, buildQuality(qualityDate, input.paceTruthAvailable));
    }
  } else {
    const candidates = [
      { offset: 0, build: buildEasyFixtureDay },
      {
        offset: 2,
        build: (date: string) =>
          input.fixtureScenario === NON_REPEAT_TEMPO_FIXTURE_SCENARIO
            ? buildTempoFixtureDay(date, input.paceTruthAvailable)
            : buildRepeatFixtureDay(date, input.paceTruthAvailable),
      },
      {
        offset: 6,
        build: (date: string) => buildLongRunFixtureDay(date, input.acceptedHeartRateAvailable),
      },
      { offset: 9, build: buildEasyFixtureDay },
      ...(input.fixtureScenario === NON_REPEAT_TEMPO_FIXTURE_SCENARIO
        ? [
            {
              offset: 16,
              build: (date: string) => buildRepeatFixtureDay(date, input.paceTruthAvailable),
            },
          ]
        : []),
    ];

    for (const candidate of candidates) {
      const date = findAvailableDateOnOrAfter(
        addDaysIso(input.startDate, candidate.offset),
        input.endDate,
        input.fixedRestDays,
      );
      if (!date || date === input.endpointDate) continue;
      if (!canAddWorkout(days, date, input.maxWorkoutsPerWeek)) continue;
      days.set(date, candidate.build(date));
    }
  }

  for (const [date] of days) {
    if (
      startOfWeekIso(date) === startOfWeekIso(input.endpointDate) &&
      !canAddWorkout(
        new Map([...days].filter(([candidateDate]) => candidateDate !== date)),
        input.endpointDate,
        input.maxWorkoutsPerWeek,
      )
    ) {
      days.delete(date);
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
      days.set(finalHorizonDate, buildEasyFixtureDay(finalHorizonDate));
    }
  }

  return [...days.values()].sort((left, right) => left.date.localeCompare(right.date));
}

function findSchedulableFixtureDate(input: {
  candidate: string;
  endDate: string;
  endpointDate: string;
  days: ReadonlyMap<string, unknown>;
  maxWorkoutsPerWeek: number;
  fixedRestDays: readonly WeekdayName[];
}) {
  for (let date = input.candidate; date <= input.endDate; date = addDaysIso(date, 1)) {
    if (
      date !== input.endpointDate &&
      !input.fixedRestDays.includes(weekdayForDate(date)) &&
      canAddWorkout(input.days, date, input.maxWorkoutsPerWeek)
    ) {
      return date;
    }
  }
  return null;
}

function buildEasyFixtureDay(date: string) {
  return workoutDay(date, "easy_aerobic_run", "Easy Run", [
    unitSection("warmup", "Warm Up", timePrescription(5), effortTarget("Easy gradual movement")),
    unitSection("main", "Work", timePrescription(25), effortTarget("Conversational easy effort")),
    unitSection("cooldown", "Cool Down", timePrescription(5), effortTarget("Easy downshift")),
  ]);
}

function buildRunWalkFixtureDay(date: string) {
  return buildRunWalkAdaptationFixtureDay(date, 4);
}

function buildProgressedRunWalkFixtureDay(date: string) {
  return buildRunWalkAdaptationFixtureDay(date, 5);
}

function buildRunWalkAdaptationFixtureDay(date: string, repeatCount: number) {
  return workoutDay(date, "recovery_jog", "Run/Walk", [
    unitSection("warmup", "Warm Up Walk", timePrescription(5), effortTarget("Easy walk")),
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
          runWalkTarget("Conversational easy jog"),
        ),
        repeatChild("walk", "Walk", timePrescription(1), runWalkTarget("Relaxed walk")),
      ],
    },
    unitSection("cooldown", "Cool Down Walk", timePrescription(5), effortTarget("Easy walk")),
  ]);
}

function buildAdaptationEasyFixtureDay(date: string) {
  return workoutDay(date, "easy_aerobic_run", "Easy", [
    unitSection("warmup", "Warm Up Walk", timePrescription(5), effortTarget("Easy walk")),
    unitSection("main", "Work", timePrescription(15), effortTarget("Conversational easy effort")),
    unitSection("cooldown", "Cool Down Walk", timePrescription(5), effortTarget("Easy walk")),
  ]);
}

function buildRecoveryFixtureDay(date: string) {
  return workoutDay(date, "recovery_jog", "Recovery", [
    unitSection("warmup", "Warm Up Walk", timePrescription(5), effortTarget("Easy walk")),
    unitSection(
      "recovery_jog",
      "Work",
      timePrescription(12),
      effortTarget("Relaxed recovery effort"),
    ),
    unitSection("cooldown", "Cool Down Walk", timePrescription(5), effortTarget("Easy walk")),
  ]);
}

function buildAdaptationLongRunFixtureDay(date: string, acceptedHeartRateAvailable: boolean) {
  return workoutDay(date, "long_aerobic_run", "Long Run", [
    unitSection("warmup", "Warm Up Walk", timePrescription(5), effortTarget("Easy walk")),
    unitSection(
      "main",
      "Work",
      timePrescription(30),
      acceptedHeartRateAvailable
        ? heartRateTarget("Z2")
        : effortTarget("Conversational easy effort"),
    ),
    unitSection("cooldown", "Cool Down Walk", timePrescription(5), effortTarget("Easy walk")),
  ]);
}

function buildTempoFixtureDay(date: string, paceTruthAvailable: boolean) {
  return workoutDay(date, "controlled_tempo_session", "Tempo", [
    unitSection("warmup", "Warm Up", timePrescription(10), effortTarget("Easy gradual movement")),
    unitSection(
      "tempo_block",
      "Work",
      timePrescription(20),
      paceTruthAvailable ? paceTarget("4:50-5:00/km") : effortTarget("Controlled tempo effort"),
    ),
    unitSection("cooldown", "Cool Down", timePrescription(10), effortTarget("Easy downshift")),
  ]);
}

function buildRepeatFixtureDay(date: string, paceTruthAvailable: boolean) {
  return workoutDay(date, "controlled_tempo_session", "Tempo", [
    unitSection("warmup", "Warm Up", timePrescription(10), effortTarget("Easy gradual movement")),
    {
      kind: "repeat",
      segment_type: "interval_block",
      label: "Repeat",
      cue: null,
      rounds: 3,
      children: [
        repeatChild(
          "work",
          "Work",
          timePrescription(2),
          paceTruthAvailable ? paceTarget("4:45-4:55/km") : effortTarget("Controlled hard"),
        ),
        repeatChild("recover", "Recovery", timePrescription(1.5), effortTarget("Easy")),
      ],
    },
    unitSection("cooldown", "Cool Down", timePrescription(10), effortTarget("Easy downshift")),
  ]);
}

function buildLongRunFixtureDay(date: string, acceptedHeartRateAvailable: boolean) {
  return workoutDay(date, "long_aerobic_run", "Long Run", [
    unitSection("warmup", "Warm Up", timePrescription(10), effortTarget("Easy gradual movement")),
    unitSection(
      "main",
      "Work",
      timePrescription(40),
      acceptedHeartRateAvailable
        ? heartRateTarget("Z2")
        : effortTarget("Conversational aerobic effort"),
    ),
    unitSection("cooldown", "Cool Down", timePrescription(5), effortTarget("Easy downshift")),
  ]);
}

function buildEndpointFixtureDay(date: string, distanceMeters: number) {
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
        effortTarget("Selected-distance effort"),
      ),
    ],
  };
}

function workoutDay(
  date: string,
  workoutIdentity: AiAuthoredPlanFirstProviderDraft["workouts"][number]["workout_identity"],
  title: string,
  sections: AiAuthoredPlanFirstProviderDraft["workouts"][number]["sections"],
): AiAuthoredPlanFirstProviderDraft["workouts"][number] {
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

function paceTarget(pace: string): ProviderFixtureTarget {
  return {
    primary_execution_mode: "pace",
    command: pace,
  };
}

function effortTarget(effort: string): ProviderFixtureTarget {
  return {
    primary_execution_mode: "effort",
    command: effort,
  };
}

function heartRateTarget(
  reference: Extract<ProviderFixtureTarget, { primary_execution_mode: "heart_rate" }>["command"],
): ProviderFixtureTarget {
  return {
    primary_execution_mode: "heart_rate",
    command: reference,
  };
}

function runWalkTarget(effort: string): ProviderFixtureTarget {
  return {
    primary_execution_mode: "run_walk",
    command: effort,
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
  maxWorkoutsPerWeek: number,
) {
  const weekStart = startOfWeekIso(date);
  return (
    [...days.keys()].filter((candidateDate) => startOfWeekIso(candidateDate) === weekStart).length <
    maxWorkoutsPerWeek
  );
}

function findAvailableDateOnOrAfter(
  candidate: string,
  endDate: string,
  fixedRestDays: readonly WeekdayName[],
) {
  for (let date = candidate; date <= endDate; date = addDaysIso(date, 1)) {
    if (!fixedRestDays.includes(weekdayForDate(date))) return date;
  }
  return null;
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
