import type { GenerateAiFirstPlanDraftPreviewOptions } from "@/lib/ai-first-plan-draft-service";
import {
  buildAiAuthoredPlanFirstProviderDraft,
  type AiAuthoredPlanFirstDraft,
} from "@/lib/ai-authored-plan-first-compiler";
import {
  AI_AUTHORED_PLAN_FIRST_RESPONSE_SCHEMA_NAME,
  resolveAiAuthoredPlanFirstProviderHorizonWeeks,
} from "@/lib/ai-authored-plan-first-provider-contract";
import type { StructuredPlanAuthoringInput } from "@/lib/structured-plan-authoring";
import { isLoopbackRuntimeUrl } from "@/lib/supabase/env";
import { addDaysIso, diffDaysIso, startOfWeekIso } from "@/lib/training";
import { WEEKDAY_NAMES, type WeekdayName } from "@/lib/weekday-rest-invariants";

export const AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV =
  "HITO_AI_GENERATED_PLAN_DEV_FIXTURE" as const;
export const AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_DELAY_MS_ENV =
  "HITO_AI_GENERATED_PLAN_DEV_FIXTURE_DELAY_MS" as const;
export const AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL =
  "hito-local-qa-dev-ai-generated-plan-fixture" as const;

const MAX_AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_DELAY_MS = 10 * 60 * 1000;

type RuntimeEnv = Record<string, string | undefined>;

type AiGeneratedRunningPlanFixturePreviewOptions = Omit<
  GenerateAiFirstPlanDraftPreviewOptions,
  "input" | "inputKind"
>;

export function buildAiGeneratedRunningPlanDevFixturePreviewOptions(input: {
  authoringInput: StructuredPlanAuthoringInput;
  today?: string | null;
  env?: RuntimeEnv;
}): AiGeneratedRunningPlanFixturePreviewOptions | null {
  const delayMs = resolveAiGeneratedRunningPlanDevFixtureDelayMs(input.env);

  if (!isAiGeneratedRunningPlanDevFixtureEnabled(input.env)) {
    return null;
  }

  return {
    apiKey: "local-qa-dev-ai-generated-plan-fixture",
    model: AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL,
    today: input.today ?? input.authoringInput.schedule.startDate,
    fetchImpl: buildAiGeneratedRunningPlanDevFixtureFetch(input, delayMs),
  };
}

export function isAiGeneratedRunningPlanDevFixtureEnabled(env = readRuntimeEnv()) {
  const flag = parseBooleanFlag(env[AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV]);
  const localAuthBypassEnabled = parseBooleanFlag(env.LOCAL_AUTH_BYPASS_ENABLED) === true;
  const localAuthAccountsFile =
    typeof env.LOCAL_AUTH_BYPASS_ACCOUNTS_FILE === "string"
      ? env.LOCAL_AUTH_BYPASS_ACCOUNTS_FILE.trim()
      : "";
  const localAuthRuntime = localAuthBypassEnabled && Boolean(localAuthAccountsFile);
  const deployedRuntime = Boolean(env.VERCEL || env.CI);

  if (flag === false || deployedRuntime || !localAuthRuntime) {
    return false;
  }

  return flag === true || flag === null;
}

export function buildAiGeneratedRunningPlanDevFixtureOpenAiFetch(input: {
  authoringInput: StructuredPlanAuthoringInput;
  today?: string | null;
  env?: RuntimeEnv;
}): typeof fetch {
  return buildAiGeneratedRunningPlanDevFixtureFetch(
    input,
    resolveAiGeneratedRunningPlanDevFixtureDelayMs(input.env),
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

function buildAiGeneratedRunningPlanDevFixtureFetch(
  input: {
    authoringInput: StructuredPlanAuthoringInput;
    today?: string | null;
  },
  delayMs: number,
): typeof fetch {
  const draft = buildAiAuthoredPlanFirstProviderDraft(
    buildAiGeneratedRunningPlanDevFixtureFullPlanDraft(input.authoringInput),
    {
      startDate: input.authoringInput.schedule.startDate,
      endDate: input.authoringInput.schedule.targetDate ?? undefined,
    },
  );

  return async (_url, init) => {
    await waitForFixtureProviderCompletion(delayMs, init?.signal);

    return new Response(
      JSON.stringify({
        id: `local-dev-ai-plan-first-${slugify(input.authoringInput.goal.goalLabel)}`,
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

export function isAiGeneratedRunningPlanDevFixtureModel(model: string | null | undefined) {
  return model === AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL;
}

function buildAiGeneratedRunningPlanDevFixtureFullPlanDraft(
  authoringInput: StructuredPlanAuthoringInput,
): AiAuthoredPlanFirstDraft {
  const horizonWeeks = resolvePlanFirstFixtureHorizonWeeks(authoringInput);

  return {
    metadata: {
      goal: authoringInput.goal.goalLabel,
      target_date: authoringInput.schedule.targetDate ?? null,
      target_time: authoringInput.goal.targetTime ?? null,
      athlete: {
        age: authoringInput.runnerProfile.age ?? null,
        height_cm: null,
        weight_kg: null,
        experience: authoringInput.runnerProfile.experienceLevel,
      },
      rest_days: [...authoringInput.availability.unavailableDays],
      long_run_day: authoringInput.availability.preferredLongRunDay ?? "Sunday",
      note: "Local QA/dev AI-authored full-plan fixture. Guidance is authored as plan review truth and compiled by the backend.",
      warnings: [],
      assumptions: [
        "This fixture mimics a single AI-authored full calendar draft for parser/compiler validation.",
        "Pace strings and HR-zone labels are coach guidance; raw BPM claims are intentionally absent.",
      ],
    },
    weeks: Array.from({ length: horizonWeeks }, (_value, index) =>
      buildPlanFirstFixtureWeek({
        authoringInput,
        weekNumber: index + 1,
        horizonWeeks,
      }),
    ),
  };
}

function resolvePlanFirstFixtureHorizonWeeks(authoringInput: StructuredPlanAuthoringInput) {
  const requestedWeeks = resolveAiAuthoredPlanFirstProviderHorizonWeeks(authoringInput);
  const targetDate = authoringInput.schedule.targetDate;

  if (!targetDate) {
    return requestedWeeks ?? 4;
  }

  const weekStart = startOfWeekIso(authoringInput.schedule.startDate);
  const targetWeek = Math.floor(diffDaysIso(targetDate, weekStart) / 7) + 1;

  return Math.min(52, Math.max(1, targetWeek));
}

function buildPlanFirstFixtureWeek({
  authoringInput,
  weekNumber,
  horizonWeeks,
}: {
  authoringInput: StructuredPlanAuthoringInput;
  weekNumber: number;
  horizonWeeks: number;
}): AiAuthoredPlanFirstDraft["weeks"][number] {
  const longRunDay = authoringInput.availability.preferredLongRunDay ?? "Sunday";
  const fixedRestDays = new Set(authoringInput.availability.unavailableDays);
  const qualityDay = firstAvailableWeekday(authoringInput, ["Wednesday", "Thursday", "Tuesday"]);
  const strideDay = firstAvailableWeekday(authoringInput, ["Thursday", "Friday", "Monday"]);
  const mediumLongDay = firstAvailableWeekday(authoringInput, ["Friday", "Monday", "Thursday"]);
  const distanceKm = authoringInput.planGoalIntent?.distance?.distanceKm ?? 10;
  const weekStart = startOfWeekIso(authoringInput.schedule.startDate);
  const targetDate = authoringInput.schedule.targetDate ?? null;
  const lowSupportTenK =
    Math.round(distanceKm * 1000) === 10_000 &&
    (authoringInput.runnerProfile.experienceLevel === "new_runner" ||
      (authoringInput.runnerProfile.experienceLevel === "returning_runner" &&
        authoringInput.currentLevel.recent5kPaceSecondsPerKm == null));
  const week: AiAuthoredPlanFirstDraft["weeks"][number] = {
    week: weekNumber,
    estimated_km: Math.round(distanceKm * (0.25 + weekNumber / horizonWeeks) * 10) / 10,
    monday: buildRestDay(null),
    tuesday: buildRestDay(null),
    wednesday: buildRestDay(null),
    thursday: buildRestDay(null),
    friday: buildRestDay(null),
    saturday: buildRestDay(null),
    sunday: buildRestDay(null),
  };

  for (const weekday of WEEKDAY_NAMES) {
    const key = weekday.toLowerCase() as keyof Omit<
      AiAuthoredPlanFirstDraft["weeks"][number],
      "week" | "estimated_km"
    >;
    const date = addDaysIso(weekStart, (weekNumber - 1) * 7 + weekdayIndex(weekday));
    const isTargetDate = Boolean(targetDate && date === targetDate);
    const isTaperProximityPreEndpoint = Boolean(
      targetDate && date < targetDate && date >= addDaysIso(targetDate, -14),
    );
    const isRaceWeekLightTouch = Boolean(targetDate && date === addDaysIso(targetDate, -4));

    if (targetDate && date > targetDate) {
      week[key] = buildRestDay(date);
      continue;
    }

    if (isTargetDate) {
      week[key] = buildEndpointDay({ date, distanceKm, lowSupportTenK });
      continue;
    }

    if (fixedRestDays.has(weekday)) {
      week[key] = buildRestDay(date);
      continue;
    }

    if (lowSupportTenK && isWeekdayAfter(weekday, longRunDay)) {
      week[key] = buildRestDay(date);
      continue;
    }

    if (isTaperProximityPreEndpoint) {
      week[key] =
        isRaceWeekLightTouch && authoringInput.availability.preferredRunningDays.includes(weekday)
          ? buildEasyDay({
              type: "Easy",
              date,
              minutes: 20,
              notes: "Light sharpening touch before the endpoint.",
            })
          : buildRestDay(date);
      continue;
    }

    if (weekday === longRunDay) {
      week[key] = buildLongRunDay({
        date,
        distanceKm,
        weekNumber,
        horizonWeeks,
        lowSupportTenK,
        hasTargetDate: Boolean(targetDate),
      });
      continue;
    }

    if (
      !lowSupportTenK &&
      weekday === qualityDay &&
      weekNumber > Math.max(2, Math.round(horizonWeeks * 0.2))
    ) {
      week[key] = buildRepeatRichQualityDay({ date, weekNumber });
      continue;
    }

    if (weekday === strideDay && weekNumber % 2 === 1) {
      week[key] = buildStrideDay({ date, lowSupportTenK });
      continue;
    }

    if (!lowSupportTenK && weekday === mediumLongDay && weekNumber > 3) {
      week[key] = buildEasyDay({
        type: "Medium Long",
        date,
        minutes: Math.min(70, 35 + weekNumber * 2),
        notes: "Aerobic durability without racing the workout.",
      });
      continue;
    }

    week[key] = authoringInput.availability.preferredRunningDays.includes(weekday)
      ? buildEasyDay({
          type: "Easy",
          date,
          minutes: lowSupportTenK
            ? resolveLocalFixtureLowSupportTenKMinutes("easy", weekNumber, horizonWeeks)
            : 40,
          notes: "Easy aerobic support run.",
        })
      : buildRestDay(date);
  }

  return week;
}

function resolveLocalFixtureLowSupportTenKMinutes(
  kind: "easy" | "long_run" | "cutback_long_run",
  weekNumber: number,
  horizonWeeks: number,
) {
  if (kind === "easy") {
    return weekNumber <= 4 ? 20 : weekNumber <= 8 ? 25 : 30;
  }

  if (kind === "cutback_long_run" || weekNumber >= horizonWeeks - 1) {
    return 40;
  }

  const buildIndex = Array.from({ length: weekNumber }, (_, index) => index + 1).filter(
    (candidateWeek) => candidateWeek % 4 !== 0 && candidateWeek < horizonWeeks - 1,
  ).length;

  return Math.min(75, 30 + buildIndex * 5);
}

function buildRestDay(date: string | null): AiAuthoredPlanFirstDraft["weeks"][number]["monday"] {
  return { type: "Rest", date, notes: null, steps: [] };
}

function buildEndpointDay({
  date,
  distanceKm,
  lowSupportTenK,
}: {
  date: string;
  distanceKm: number;
  lowSupportTenK: boolean;
}): AiAuthoredPlanFirstDraft["weeks"][number]["monday"] {
  return {
    type: "Selected Distance Day",
    date,
    notes: "Endpoint workout covers the selected distance exactly.",
    steps: [
      { phase: "Warm Up", duration_min: lowSupportTenK ? 5 : 10, target_hr: "Z1" },
      { phase: "Work", distance_km: distanceKm, target_hr: "Z2" },
      { phase: "Cool Down", duration_min: lowSupportTenK ? 5 : 10, target_hr: "Z1" },
    ],
  };
}

function buildLongRunDay({
  date,
  distanceKm,
  weekNumber,
  horizonWeeks,
  lowSupportTenK,
  hasTargetDate,
}: {
  date: string;
  distanceKm: number;
  weekNumber: number;
  horizonWeeks: number;
  lowSupportTenK: boolean;
  hasTargetDate: boolean;
}): AiAuthoredPlanFirstDraft["weeks"][number]["monday"] {
  const lowSupportLongRunMinutes = lowSupportTenK
    ? resolveLocalFixtureLowSupportTenKMinutes(
        weekNumber >= horizonWeeks - 1 ? "cutback_long_run" : "long_run",
        weekNumber,
        horizonWeeks,
      )
    : null;
  const longDistanceKm =
    !hasTargetDate && weekNumber === horizonWeeks
      ? distanceKm
      : lowSupportTenK
        ? null
        : Math.max(6, Math.round(Math.min(distanceKm * 0.65, 8 + weekNumber * 1.2) * 10) / 10);

  return {
    type: "Long Run",
    date,
    notes: "Long aerobic durability progression.",
    steps: [
      { phase: "Warm Up", duration_min: lowSupportTenK ? 5 : 10, target_hr: "Z1" },
      longDistanceKm
        ? { phase: "Work", distance_km: longDistanceKm, target_hr: "Z2" }
        : {
            phase: "Work",
            duration_min: Math.max(20, (lowSupportLongRunMinutes ?? 35) - 10),
            target_hr: "Z2",
          },
      { phase: "Cool Down", duration_min: lowSupportTenK ? 5 : 10, target_hr: "Z1" },
    ],
  };
}

function buildRepeatRichQualityDay({
  date,
  weekNumber,
}: {
  date: string;
  weekNumber: number;
}): AiAuthoredPlanFirstDraft["weeks"][number]["monday"] {
  const tempo = weekNumber % 2 === 0;

  return {
    type: tempo ? "Tempo" : "Intervals",
    date,
    notes: tempo
      ? "Controlled threshold durability with recoveries."
      : "Short controlled interval rhythm with full recoveries.",
    steps: [
      { phase: "Warm Up", duration_min: 15, target_hr: "Z1-Z2" },
      {
        phase: "Work",
        blocks: [
          {
            repeat: tempo ? 3 : 6,
            interval: tempo
              ? { duration_min: 8, target_pace: "comfortably hard", target_hr: "Z3" }
              : { duration_min: 2, target_pace: "controlled interval rhythm", target_hr: "Z4" },
            recovery: { duration_min: tempo ? 3 : 2, target_hr: "Z1" },
          },
        ],
      },
      { phase: "Cool Down", duration_min: 10, target_hr: "Z1" },
    ],
  };
}

function buildStrideDay({
  date,
  lowSupportTenK,
}: {
  date: string;
  lowSupportTenK: boolean;
}): AiAuthoredPlanFirstDraft["weeks"][number]["monday"] {
  return {
    type: "Easy + Strides",
    date,
    notes: "Relaxed strides after easy running.",
    steps: [
      { phase: "Warm Up", duration_min: lowSupportTenK ? 5 : 10, target_hr: "Z1" },
      { phase: "Work", duration_min: lowSupportTenK ? 10 : 35, target_hr: "Z2" },
      { phase: "Strides", repeat: lowSupportTenK ? 4 : 6, duration_sec: 20, recovery_sec: 40 },
      { phase: "Cool Down", duration_min: 5, target_hr: "Z1" },
    ],
  };
}

function buildEasyDay({
  type,
  date,
  minutes,
  notes,
}: {
  type: string;
  date: string;
  minutes: number;
  notes: string;
}): AiAuthoredPlanFirstDraft["weeks"][number]["monday"] {
  return {
    type,
    date,
    notes,
    steps: [
      { phase: "Warm Up", duration_min: 5, target_hr: "Z1" },
      { phase: "Work", duration_min: Math.max(10, minutes - 10), target_hr: "Z2" },
      { phase: "Cool Down", duration_min: 5, target_hr: "Z1" },
    ],
  };
}

function firstAvailableWeekday(
  authoringInput: StructuredPlanAuthoringInput,
  candidates: readonly WeekdayName[],
) {
  const fixedRestDays = new Set(authoringInput.availability.unavailableDays);
  return (
    candidates.find((weekday) => !fixedRestDays.has(weekday)) ??
    authoringInput.availability.preferredRunningDays.find(
      (weekday) => !fixedRestDays.has(weekday),
    ) ??
    "Monday"
  );
}

function isWeekdayAfter(candidate: WeekdayName, previous: WeekdayName) {
  return weekdayIndex(candidate) === (weekdayIndex(previous) + 1) % WEEKDAY_NAMES.length;
}

function weekdayIndex(weekday: WeekdayName) {
  return WEEKDAY_NAMES.indexOf(weekday);
}

function parseBooleanFlag(value: string | undefined): boolean | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return null;
}

async function waitForFixtureProviderCompletion(delayMs: number, signal?: AbortSignal | null) {
  if (delayMs <= 0) {
    return;
  }

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
