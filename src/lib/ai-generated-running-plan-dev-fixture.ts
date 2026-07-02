import {
  AI_FIRST_PLAN_BLUEPRINT_SCHEMA_VERSION,
  type AiFirstPlanBlueprint,
} from "@/lib/ai-first-plan-blueprint-authoring";
import {
  resolveAuthoringHorizonWeeks,
  resolveGoalFamilyIdentityPolicy,
} from "@/lib/ai-first-plan-blueprint-policy";
import { weekdayIndex, type AuthoredWorkoutIdentity } from "@/lib/ai-first-plan-blueprint-taxonomy";
import type { GenerateAiFirstPlanDraftPreviewOptions } from "@/lib/ai-first-plan-draft-service";
import { resolveCanonicalWorkoutModel } from "@/lib/rich-workout-model";
import type { StructuredPlanAuthoringInput } from "@/lib/structured-plan-authoring";
import {
  phaseForWeek,
  resolveSupportedIntensityCadence,
  resolveSupportedSpecificityIdentityOptions,
  shouldScheduleSupportedIntensityWeek,
  shouldUseLongRunSteadyFinishAsSpecificStimulus,
} from "@/lib/structured-plan-authoring-policy";
import { addDaysIso, weekdayLong } from "@/lib/training";
import { WEEKDAY_NAMES, type WeekdayName } from "@/lib/weekday-rest-invariants";

export const AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_ENV =
  "HITO_AI_GENERATED_PLAN_DEV_FIXTURE" as const;
export const AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL =
  "hito-local-qa-dev-ai-generated-plan-fixture" as const;

type BlueprintWorkout = AiFirstPlanBlueprint["weeks"][number]["plannedWorkouts"][number];
type BlueprintWeek = AiFirstPlanBlueprint["weeks"][number];
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
  if (!isAiGeneratedRunningPlanDevFixtureEnabled(input.env)) {
    return null;
  }

  return {
    apiKey: "local-qa-dev-ai-generated-plan-fixture",
    model: AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL,
    today: input.today ?? input.authoringInput.schedule.startDate,
    fetchImpl: buildAiGeneratedRunningPlanDevFixtureOpenAiFetch(input),
    blueprintEnforcePreferredLongRunDay: Boolean(
      input.authoringInput.availability.preferredLongRunDay,
    ),
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
}): typeof fetch {
  const blueprint = buildAiGeneratedRunningPlanDevFixtureBlueprint(input.authoringInput);

  return async () =>
    new Response(
      JSON.stringify({
        id: `local-dev-ai-generated-${slugify(input.authoringInput.goal.goalLabel)}`,
        status: "completed",
        output_text: JSON.stringify(blueprint),
        usage: {
          input_tokens: 100,
          output_tokens: 100,
          total_tokens: 200,
        },
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );
}

export function isAiGeneratedRunningPlanDevFixtureModel(model: string | null | undefined) {
  return model === AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL;
}

function buildAiGeneratedRunningPlanDevFixtureBlueprint(
  authoringInput: StructuredPlanAuthoringInput,
): AiFirstPlanBlueprint {
  const horizonWeeks = resolveAuthoringHorizonWeeks(authoringInput);
  const weeks: BlueprintWeek[] = [];

  for (let weekNumber = 1; weekNumber <= horizonWeeks; weekNumber += 1) {
    weeks.push(buildFixtureWeek({ authoringInput, weekNumber, horizonWeeks }));
  }

  return {
    schemaVersion: AI_FIRST_PLAN_BLUEPRINT_SCHEMA_VERSION,
    planName: `${authoringInput.goal.goalLabel} plan`,
    generatedFor: "Hito generated-plan runner",
    goalSummary: authoringInput.goal.goalLabel,
    startDate: authoringInput.schedule.startDate,
    targetDate: authoringInput.schedule.targetDate ?? null,
    preparationHorizonWeeks: horizonWeeks,
    planPreferences: {
      preferredRunningDays: [...authoringInput.availability.preferredRunningDays],
      fixedRestDays: [...authoringInput.availability.unavailableDays],
      preferredLongRunDay: authoringInput.availability.preferredLongRunDay ?? null,
      maxRunningDaysPerWeek: authoringInput.availability.maxRunningDaysPerWeek,
    },
    reviewAssumptions: [
      "This dated plan draft was reviewed through backend validation before persistence.",
      "Backend validation owns canonical calendar safety, workout structure, and metric truth.",
      "Outcome pace remains goal intent, not executable segment pace.",
    ],
    metricPolicySummary:
      "Dated Hito workout identities are reviewed by backend validation before runner-facing readback.",
    weeks,
  };
}

function buildFixtureWeek(input: {
  authoringInput: StructuredPlanAuthoringInput;
  weekNumber: number;
  horizonWeeks: number;
}): BlueprintWeek {
  const { authoringInput, weekNumber, horizonWeeks } = input;
  const weekStart = addDaysIso(authoringInput.schedule.startDate, (weekNumber - 1) * 7);
  const phase = phaseForWeek(weekNumber, horizonWeeks);
  const authoredWeekdays = chooseFixtureWeekdays(input);
  const longRunDay = resolveFixtureLongRunDay(input);
  const specificity = chooseFixtureSpecificityIdentity(input);
  const plannedWorkouts = authoredWeekdays.map((weekday) => {
    const date = dateForWeekday(weekStart, weekday);
    const identity =
      weekday === longRunDay
        ? chooseFixtureLongRunIdentity({ ...input, phase })
        : specificity?.weekday === weekday
          ? specificity.identity
          : chooseFixtureSupportIdentity({ ...input, weekday, phase });

    return buildFixtureBlueprintWorkout({ date, weekday, identity, phase, authoringInput });
  });

  return {
    weekNumber,
    phase,
    theme: `${phase} week ${weekNumber}`,
    microcycleIntent:
      "The dated plan draft chooses workout dates; backend validates the calendar before review.",
    cutbackWeek: weekNumber > 1 && weekNumber < horizonWeeks && weekNumber % 4 === 0,
    taperWeek: phase === "Taper",
    longRunIntent: "Preserve one controlled long-run durability slot.",
    longRunProgression: "Progress gradually, cut back regularly, and taper before the endpoint.",
    plannedWorkouts,
  };
}

function chooseFixtureWeekdays(input: {
  authoringInput: StructuredPlanAuthoringInput;
  weekNumber: number;
  horizonWeeks: number;
}) {
  const { authoringInput, weekNumber, horizonWeeks } = input;
  const weekStart = addDaysIso(authoringInput.schedule.startDate, (weekNumber - 1) * 7);
  const fixedRestDays = new Set(authoringInput.availability.unavailableDays);
  const targetDate =
    authoringInput.schedule.targetDate && weekNumber === horizonWeeks
      ? authoringInput.schedule.targetDate
      : null;
  const targetDateWeekday = targetDate ? weekdayLong(targetDate) : null;
  const allowedWeekdays = WEEKDAY_NAMES.filter((weekday) => {
    const date = dateForWeekday(weekStart, weekday);
    const fixedRestDay = fixedRestDays.has(weekday);
    const targetEndpointDay = targetDateWeekday === weekday && date === targetDate;

    return (!fixedRestDay || targetEndpointDay) && (!targetDate || date <= targetDate);
  });
  const targetCount = Math.min(
    authoringInput.availability.maxRunningDaysPerWeek,
    allowedWeekdays.length,
  );
  const longRunDay = resolveFixtureLongRunDay(input);
  const specificity = chooseFixtureSpecificityIdentity(input);
  const selected = new Set<WeekdayName>();

  if (
    specificity &&
    specificity.weekday !== longRunDay &&
    allowedWeekdays.includes(specificity.weekday)
  ) {
    selected.add(specificity.weekday);
  }

  if (allowedWeekdays.includes(longRunDay)) {
    selected.add(longRunDay);
  }

  for (const weekday of authoringInput.availability.preferredRunningDays) {
    if (selected.size >= targetCount) break;
    if (allowedWeekdays.includes(weekday)) {
      selected.add(weekday);
    }
  }

  for (const weekday of allowedWeekdays) {
    if (selected.size >= targetCount) break;
    selected.add(weekday);
  }

  return [...selected].sort((left, right) => weekdayIndex(left) - weekdayIndex(right));
}

function chooseFixtureSpecificityIdentity(input: {
  authoringInput: StructuredPlanAuthoringInput;
  weekNumber: number;
  horizonWeeks: number;
}): { weekday: WeekdayName; identity: AuthoredWorkoutIdentity } | null {
  const { authoringInput, weekNumber } = input;
  const cadence = resolveSupportedIntensityCadence(authoringInput, weekNumber);
  const supportedOptions = resolveSupportedSpecificityIdentityOptions(
    authoringInput,
    weekNumber,
    cadence,
  );
  const goalFamilyOptions = chooseGoalFamilyCadenceIdentityOptions(authoringInput, weekNumber);
  const usesGoalFamilyCadence = goalFamilyOptions.length > 0;
  const options = usesGoalFamilyCadence ? goalFamilyOptions : supportedOptions;

  if (
    options.length === 0 ||
    (!usesGoalFamilyCadence &&
      cadence.applies &&
      shouldUseLongRunSteadyFinishAsSpecificStimulus(authoringInput, weekNumber, cadence)) ||
    (!usesGoalFamilyCadence &&
      cadence.applies &&
      cadence.frequency !== "none" &&
      !shouldScheduleSupportedIntensityWeek(authoringInput, weekNumber, cadence))
  ) {
    return null;
  }

  const identity = chooseFixtureSpecificityOption({ authoringInput, weekNumber, options });
  const weekday = chooseFixtureSpecificityWeekday({
    authoringInput,
    longRunDay: resolveFixtureLongRunDay(input),
  });

  return weekday ? { weekday, identity } : null;
}

function chooseGoalFamilyCadenceIdentityOptions(
  authoringInput: StructuredPlanAuthoringInput,
  weekNumber: number,
): AuthoredWorkoutIdentity[] {
  const policy = resolveGoalFamilyIdentityPolicy(authoringInput);

  if (policy.cadence.frequency === "none") {
    return [];
  }

  if (policy.cadence.frequency === "every_two_weeks" && weekNumber % 2 === 0) {
    return [];
  }

  return [
    ...policy.expectedQualityIdentities,
    ...policy.specialtyIdentities,
    ...(authoringInput.goal.goalType === "marathon" ||
    authoringInput.goal.goalType === "distance_build"
      ? (["progression_run"] as const)
      : []),
    ...policy.longRunIdentities,
  ].filter(
    (identity) =>
      policy.allowedIdentities.has(identity) &&
      identity !== "long_aerobic_run" &&
      identity !== "cutback_long_run" &&
      identity !== "taper_long_run",
  );
}

function chooseFixtureSpecificityOption(input: {
  authoringInput: StructuredPlanAuthoringInput;
  weekNumber: number;
  options: readonly string[];
}): AuthoredWorkoutIdentity {
  const preferred = fixtureFamilyRichnessIdentity(input.authoringInput, input.weekNumber);

  if (preferred && input.options.includes(preferred)) {
    return preferred;
  }

  return input.options[0] as AuthoredWorkoutIdentity;
}

function chooseFixtureSpecificityWeekday(input: {
  authoringInput: StructuredPlanAuthoringInput;
  longRunDay: WeekdayName;
}) {
  const fixedRestDays = new Set(input.authoringInput.availability.unavailableDays);
  const allowedWeekdays = WEEKDAY_NAMES.filter(
    (weekday) => !fixedRestDays.has(weekday) && weekday !== input.longRunDay,
  );
  const adjacentToLongRun = new Set([
    offsetWeekday(input.longRunDay, -1),
    offsetWeekday(input.longRunDay, 1),
  ]);

  return (
    allowedWeekdays.find((weekday) => !adjacentToLongRun.has(weekday)) ?? allowedWeekdays[0] ?? null
  );
}

function resolveFixtureLongRunDay(input: {
  authoringInput: StructuredPlanAuthoringInput;
  weekNumber: number;
  horizonWeeks: number;
}): WeekdayName {
  const { authoringInput, weekNumber, horizonWeeks } = input;
  const fixedRestDays = new Set(authoringInput.availability.unavailableDays);
  const targetDateWeekday =
    authoringInput.schedule.targetDate && weekNumber === horizonWeeks
      ? weekdayLong(authoringInput.schedule.targetDate)
      : null;

  if (isWeekdayName(targetDateWeekday)) {
    return targetDateWeekday;
  }

  const preferred = authoringInput.availability.preferredLongRunDay;
  if (preferred && !fixedRestDays.has(preferred)) {
    return preferred;
  }

  return (
    (["Sunday", "Saturday", "Friday"] as const).find((weekday) => !fixedRestDays.has(weekday)) ??
    WEEKDAY_NAMES.find((weekday) => !fixedRestDays.has(weekday)) ??
    "Sunday"
  );
}

function chooseFixtureLongRunIdentity(input: {
  authoringInput: StructuredPlanAuthoringInput;
  weekNumber: number;
  horizonWeeks: number;
  phase: BlueprintWeek["phase"];
}): AuthoredWorkoutIdentity {
  const cadence = resolveSupportedIntensityCadence(input.authoringInput, input.weekNumber);

  if (input.phase === "Taper" || input.weekNumber === input.horizonWeeks) {
    return "taper_long_run";
  }

  if (input.weekNumber > 1 && input.weekNumber < input.horizonWeeks && input.weekNumber % 4 === 0) {
    return "cutback_long_run";
  }

  if (
    shouldUseLongRunSteadyFinishAsSpecificStimulus(input.authoringInput, input.weekNumber, cadence)
  ) {
    return "long_run_with_steady_finish";
  }

  return "long_aerobic_run";
}

function chooseFixtureSupportIdentity(input: {
  authoringInput: StructuredPlanAuthoringInput;
  weekNumber: number;
  horizonWeeks: number;
  weekday: WeekdayName;
  phase: BlueprintWeek["phase"];
}): AuthoredWorkoutIdentity {
  const distanceMeters = input.authoringInput.planGoalIntent?.distance?.distanceMeters ?? null;
  const needsLateBridge =
    (input.authoringInput.goal.goalType === "half_marathon" ||
      input.authoringInput.goal.goalType === "marathon" ||
      input.authoringInput.goal.goalType === "distance_build" ||
      (distanceMeters != null && distanceMeters > 10_000)) &&
    input.weekNumber > Math.floor(input.horizonWeeks / 2);

  if (needsLateBridge && input.weekday !== resolveFixtureLongRunDay(input)) {
    return "steady_aerobic_run";
  }

  if (input.phase === "Taper") {
    return "recovery_jog";
  }

  if (input.weekNumber > 1 && input.weekNumber % 4 === 0) {
    return "recovery_jog";
  }

  return input.weekNumber % 3 === 0 ? "steady_aerobic_run" : "easy_aerobic_run";
}

function fixtureFamilyRichnessIdentity(
  authoringInput: StructuredPlanAuthoringInput,
  weekNumber: number,
): AuthoredWorkoutIdentity | null {
  const distanceMeters = authoringInput.planGoalIntent?.distance?.distanceMeters ?? null;
  const goalType = authoringInput.goal.goalType;

  if (weekNumber <= 2) {
    return null;
  }

  if (goalType === "10k" || (distanceMeters != null && distanceMeters <= 10_000)) {
    if (weekNumber % 3 === 1) return "easy_run_with_strides";
    if (weekNumber % 3 === 2) return "controlled_tempo_session";
    return "10k_rhythm_intervals";
  }

  if (goalType === "half_marathon" || (distanceMeters != null && distanceMeters <= 21_100)) {
    if (weekNumber % 3 === 1) return "time_intervals";
    if (weekNumber % 3 === 2) return "half_marathon_threshold_durability";
    return "controlled_tempo_session";
  }

  if (
    goalType === "marathon" ||
    goalType === "distance_build" ||
    (distanceMeters != null && distanceMeters > 21_100)
  ) {
    if (weekNumber % 3 === 1) return "race_pace_session";
    if (weekNumber % 3 === 2) return "controlled_tempo_session";
    return "marathon_steady_specificity";
  }

  return null;
}

function buildFixtureBlueprintWorkout(input: {
  date: string;
  weekday: WeekdayName;
  identity: AuthoredWorkoutIdentity;
  phase: BlueprintWeek["phase"];
  authoringInput: StructuredPlanAuthoringInput;
}): BlueprintWorkout {
  const title = fixtureTitleForIdentity(input.identity);
  const resolved = resolveCanonicalWorkoutModel({
    workoutType: "easy",
    workoutIdentity: input.identity,
    title,
  });

  return {
    date: input.date,
    weekday: input.weekday,
    workoutFamily: resolved.workoutFamily as BlueprintWorkout["workoutFamily"],
    workoutIdentity: resolved.workoutIdentity as BlueprintWorkout["workoutIdentity"],
    calendarIconKey: resolved.calendarIconKey as BlueprintWorkout["calendarIconKey"],
    title,
    summary: "Backend-reviewed dated workout with clear structure and effort guidance.",
    plannedRpe: plannedRpeForFamily(resolved.workoutFamily),
    estimatedFatigue: estimatedFatigueForFamily(resolved.workoutFamily),
    recoveryPriority:
      resolved.workoutFamily === "long" || resolved.workoutFamily === "recovery"
        ? "high"
        : "medium",
    segmentIntent: segmentIntentForFamily(resolved.workoutFamily),
    metricIntent: "effort_only",
  };
}

function fixtureTitleForIdentity(identity: AuthoredWorkoutIdentity) {
  switch (identity) {
    case "easy_aerobic_run":
      return "Easy aerobic run";
    case "recovery_jog":
      return "Recovery jog";
    case "steady_aerobic_run":
      return "Steady aerobic run";
    case "cutback_aerobic_run":
      return "Cutback aerobic run";
    case "easy_run_with_strides":
      return "Easy run with relaxed strides";
    case "long_aerobic_run":
      return "Long aerobic run";
    case "long_run_with_steady_finish":
      return "Long run with steady finish";
    case "cutback_long_run":
      return "Cutback long run";
    case "taper_long_run":
      return "Taper long run";
    case "controlled_tempo_session":
      return "Controlled tempo session";
    case "half_marathon_threshold_durability":
      return "Half-marathon threshold durability";
    case "marathon_steady_specificity":
      return "Marathon steady specificity";
    case "distance_intervals":
      return "Distance intervals";
    case "time_intervals":
      return "Time intervals";
    case "5k_sharpening_repeats":
      return "5K sharpening repeats";
    case "10k_rhythm_intervals":
      return "10K rhythm intervals";
    case "progression_run":
      return "Progression run";
    case "race_pace_session":
      return "Controlled race-rhythm session";
    case "taper_tuneup_run":
      return "Taper tune-up run";
    case "uphill_repeats":
      return "Uphill repeats";
    case "rolling_hills_session":
      return "Rolling hills session";
    case "technical_trail_easy":
      return "Technical trail easy run";
    case "controlled_downhill_durability":
      return "Controlled downhill durability";
    case "hike_run_endurance":
      return "Hike-run endurance";
    case "mountain_long_run_time_on_feet":
      return "Mountain long run";
    case "ultra_time_on_feet_durability":
      return "Ultra time-on-feet durability";
    case "climbing_steady_run":
      return "Climbing steady run";
    case "quality_session":
      return "Quality session";
  }
}

function dateForWeekday(weekStart: string, weekday: WeekdayName) {
  const date = Array.from({ length: 7 }, (_value, offset) => addDaysIso(weekStart, offset)).find(
    (candidate) => weekdayLong(candidate) === weekday,
  );

  return date ?? weekStart;
}

function offsetWeekday(weekday: WeekdayName, offset: number) {
  const index = weekdayIndex(weekday);
  const nextIndex = (index + offset + WEEKDAY_NAMES.length) % WEEKDAY_NAMES.length;

  return WEEKDAY_NAMES[nextIndex]!;
}

function isWeekdayName(value: string | null): value is WeekdayName {
  return Boolean(value && WEEKDAY_NAMES.includes(value as WeekdayName));
}

function plannedRpeForFamily(family: string) {
  if (family === "recovery") return 3;
  if (family === "easy") return 4;
  if (family === "long" || family === "steady" || family === "progression") return 5;
  return 6;
}

function estimatedFatigueForFamily(family: string): BlueprintWorkout["estimatedFatigue"] {
  if (family === "recovery") return "very_low";
  if (family === "long") return "medium_high";
  if (family === "tempo" || family === "intervals" || family === "hills") return "medium_high";
  return "medium";
}

function segmentIntentForFamily(family: string): BlueprintWorkout["segmentIntent"] {
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
    case "progression":
      return "progression";
    case "race":
      return "race_tuneup";
    default:
      return "easy_aerobic";
  }
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
