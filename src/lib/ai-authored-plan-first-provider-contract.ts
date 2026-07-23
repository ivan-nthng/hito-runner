import { z } from "zod";
import { resolveEffectiveHeartRateGuidance } from "@/lib/heart-rate-zones";
import { TRAINING_PLAN_V2_SEGMENT_TYPE_VALUES } from "@/lib/imported-plan";
import { PLANNED_WORKOUT_REPEAT_CHILD_ROLE_VALUES } from "@/lib/planned-workout-block-contract";
import {
  CANONICAL_WORKOUT_IDENTITY_VALUES,
  type CanonicalWorkoutIdentity,
} from "@/lib/rich-workout-model";
import type { StructuredPlanAuthoringInput } from "@/lib/structured-plan-authoring-schema";
import { addDaysIso, weekdayLong } from "@/lib/training";
import { WEEKDAY_NAMES } from "@/lib/weekday-rest-invariants";
import type { AiAuthoredPaceProvenance } from "@/lib/workout-document";

export const AI_AUTHORED_PLAN_FIRST_CONTRACT_VERSION = "ai-authored-plan-first-v1" as const;
export const AI_AUTHORED_PLAN_FIRST_RESPONSE_SCHEMA_NAME =
  "hito_ai_authored_full_plan_draft" as const;
export const AI_AUTHORED_PLAN_FIRST_PACE_MIN_PER_KM_PATTERN =
  "^\\d{1,2}:[0-5]\\d(?:-\\d{1,2}:[0-5]\\d)?\\/km$" as const;
export const AI_AUTHORED_PLAN_FIRST_BPM_PATTERN = "^\\d{2,3}(?:-\\d{2,3})? bpm$" as const;
export const AI_AUTHORED_PLAN_FIRST_ISO_DATE_PATTERN =
  "^(?:(?:\\d{4})-(?:(?:01|03|05|07|08|10|12)-(?:0[1-9]|[12]\\d|3[01])|(?:04|06|09|11)-(?:0[1-9]|[12]\\d|30)|02-(?:0[1-9]|1\\d|2[0-8]))|(?:(?:\\d{2}(?:0[48]|[2468][048]|[13579][26])|(?:[02468][048]|[13579][26])00))-02-29)$" as const;
export const AI_AUTHORED_PLAN_FIRST_TEXT_PATTERN = "^\\S(?:.*\\S)?$" as const;
export const AI_AUTHORED_FIRST_SESSION_ADAPTATION_DOCTRINE_VERSION =
  "first_session_adaptation_v1" as const;
export const AI_AUTHORED_PLAN_FIRST_ENDPOINT_IDENTITY =
  "selected_distance_completion_or_checkpoint" as const;

export const AI_AUTHORED_PLAN_FIRST_WORKOUT_IDENTITY_VALUES =
  CANONICAL_WORKOUT_IDENTITY_VALUES.filter(
    (identity) =>
      identity !== "rest_and_recovery" && identity !== AI_AUTHORED_PLAN_FIRST_ENDPOINT_IDENTITY,
  ) as readonly Exclude<
    CanonicalWorkoutIdentity,
    "rest_and_recovery" | typeof AI_AUTHORED_PLAN_FIRST_ENDPOINT_IDENTITY
  >[];

export const AI_AUTHORED_PLAN_FIRST_HR_ZONE_REFERENCE_VALUES = [
  "Z1",
  "Z2",
  "Z3",
  "Z4",
  "Z5",
  "Z1-Z2",
  "Z1-Z3",
  "Z1-Z4",
  "Z1-Z5",
  "Z2-Z3",
  "Z2-Z4",
  "Z2-Z5",
  "Z3-Z4",
  "Z3-Z5",
  "Z4-Z5",
] as const;

export const AI_AUTHORED_PLAN_FIRST_PRIMARY_EXECUTION_MODE_VALUES = ["pace", "heart_rate"] as const;

export const AI_AUTHORED_PLAN_FIRST_HYDRATION_LABEL = "Hydration" as const;
export const AI_AUTHORED_PLAN_FIRST_HYDRATION_CUE = "Take water." as const;

export const AI_AUTHORED_PLAN_FIRST_UNIT_SECTION_TYPE_VALUES =
  TRAINING_PLAN_V2_SEGMENT_TYPE_VALUES.filter(
    (type) =>
      type !== "rest" && type !== "fueling" && type !== "interval_block" && type !== "strides",
  );

export const AI_AUTHORED_PLAN_FIRST_REPEAT_SECTION_TYPE_VALUES =
  TRAINING_PLAN_V2_SEGMENT_TYPE_VALUES.filter((type) => type !== "rest" && type !== "fueling");

export type AiAuthoredPlanFirstSelectedFitnessLevel =
  | "new_to_running"
  | "beginner"
  | "running_regularly"
  | "performance_focused";

const providerTextSchema = (maxLength: number) =>
  z.string().min(1).max(maxLength).regex(new RegExp(AI_AUTHORED_PLAN_FIRST_TEXT_PATTERN));
const providerNullableTextSchema = (maxLength: number) => providerTextSchema(maxLength).nullable();
const providerPaceSchema = z
  .string()
  .regex(new RegExp(AI_AUTHORED_PLAN_FIRST_PACE_MIN_PER_KM_PATTERN))
  .max(24);
const providerBpmSchema = z.string().regex(new RegExp(AI_AUTHORED_PLAN_FIRST_BPM_PATTERN)).max(24);
const providerTargetSchema = z.discriminatedUnion("primary_execution_mode", [
  z
    .object({
      primary_execution_mode: z.literal("pace"),
      command: providerPaceSchema,
    })
    .strict(),
  z
    .object({
      primary_execution_mode: z.literal("heart_rate"),
      command: providerBpmSchema,
    })
    .strict(),
]);
const providerTimePrescriptionSchema = z
  .object({
    mode: z.literal("time"),
    duration_min: z.number().min(0.01).max(720),
  })
  .strict();
const providerDistancePrescriptionSchema = z
  .object({
    mode: z.literal("distance"),
    distance_km: z.number().min(0.001).max(500),
  })
  .strict();
const providerUnitPrescriptionSchema = z.discriminatedUnion("mode", [
  providerTimePrescriptionSchema,
  providerDistancePrescriptionSchema,
]);
const providerRepeatChildSchema = z
  .object({
    role: z.enum(PLANNED_WORKOUT_REPEAT_CHILD_ROLE_VALUES),
    label: providerTextSchema(80),
    cue: providerNullableTextSchema(160),
    prescription: providerUnitPrescriptionSchema,
    target: providerTargetSchema,
  })
  .strict();
const providerUnitStepSchema = z
  .object({
    kind: z.literal("unit"),
    segment_type: z.enum(
      AI_AUTHORED_PLAN_FIRST_UNIT_SECTION_TYPE_VALUES as [
        (typeof AI_AUTHORED_PLAN_FIRST_UNIT_SECTION_TYPE_VALUES)[number],
        ...(typeof AI_AUTHORED_PLAN_FIRST_UNIT_SECTION_TYPE_VALUES)[number][],
      ],
    ),
    label: providerTextSchema(120),
    cue: providerNullableTextSchema(160),
    prescription: providerUnitPrescriptionSchema,
    target: providerTargetSchema,
  })
  .strict();
const providerRepeatStepSchema = z
  .object({
    kind: z.literal("repeat"),
    segment_type: z.enum(
      AI_AUTHORED_PLAN_FIRST_REPEAT_SECTION_TYPE_VALUES as [
        (typeof AI_AUTHORED_PLAN_FIRST_REPEAT_SECTION_TYPE_VALUES)[number],
        ...(typeof AI_AUTHORED_PLAN_FIRST_REPEAT_SECTION_TYPE_VALUES)[number][],
      ],
    ),
    label: providerTextSchema(120),
    cue: providerNullableTextSchema(160),
    rounds: z.number().int().min(2).max(100),
    children: z.array(providerRepeatChildSchema).min(1).max(12),
  })
  .strict();
const providerHydrationStepSchema = z
  .object({
    kind: z.literal("hydration"),
    label: z.literal(AI_AUTHORED_PLAN_FIRST_HYDRATION_LABEL),
    cue: z.literal(AI_AUTHORED_PLAN_FIRST_HYDRATION_CUE),
  })
  .strict();
const providerStepSchema = z.discriminatedUnion("kind", [
  providerUnitStepSchema,
  providerRepeatStepSchema,
  providerHydrationStepSchema,
]);
const providerWorkoutBaseSchema = z
  .object({
    date: z.string().regex(new RegExp(AI_AUTHORED_PLAN_FIRST_ISO_DATE_PATTERN)),
    phase: providerTextSchema(80),
    workout_identity: z.enum(
      AI_AUTHORED_PLAN_FIRST_WORKOUT_IDENTITY_VALUES as [
        (typeof AI_AUTHORED_PLAN_FIRST_WORKOUT_IDENTITY_VALUES)[number],
        ...(typeof AI_AUTHORED_PLAN_FIRST_WORKOUT_IDENTITY_VALUES)[number][],
      ],
    ),
    title: providerTextSchema(120),
    cue: providerTextSchema(160),
    sections: z.array(providerStepSchema).min(1).max(12),
  })
  .strict();
const providerEndpointSchema = providerWorkoutBaseSchema.extend({
  workout_identity: z.literal(AI_AUTHORED_PLAN_FIRST_ENDPOINT_IDENTITY),
});

export const aiAuthoredPlanFirstProviderDraftSchema = z
  .object({
    workouts: z.array(providerWorkoutBaseSchema).min(1).max(260),
    endpoint: providerEndpointSchema,
  })
  .strict();

export type AiAuthoredPlanFirstProviderDraft = z.infer<
  typeof aiAuthoredPlanFirstProviderDraftSchema
>;
export type AiAuthoredPlanFirstProviderWorkout =
  | AiAuthoredPlanFirstProviderDraft["workouts"][number]
  | AiAuthoredPlanFirstProviderDraft["endpoint"];
export type AiAuthoredPlanFirstProviderStep = z.infer<typeof providerStepSchema>;
export type AiAuthoredPlanFirstProviderUnit = z.infer<typeof providerRepeatChildSchema>;

export function buildAiAuthoredFirstSessionAdaptationContext(
  authoringInput: StructuredPlanAuthoringInput,
) {
  const selectedFitnessLevel = resolveSelectedFitnessLevel(authoringInput);
  const required = selectedFitnessLevel === "new_to_running" || selectedFitnessLevel === "beginner";

  return {
    selectedFitnessLevel,
    adaptation: required
      ? {
          doctrine: AI_AUTHORED_FIRST_SESSION_ADAPTATION_DOCTRINE_VERSION,
          required: true as const,
          opening_calendar_days: 14,
          minimum_adaptation_contacts: 4,
          minimum_recovery_days_between_contacts: 1,
          opening_workout_types: ["Run/Walk", "Easy", "Recovery"] as const,
          first_true_long_run_not_before_calendar_day: 15,
          opening_target_policy: "numeric_pace_or_bpm_with_supplemental_easy_cues" as const,
          extend_authored_horizon_if_needed: true as const,
          compress_load_to_requested_date: false as const,
        }
      : {
          doctrine: AI_AUTHORED_FIRST_SESSION_ADAPTATION_DOCTRINE_VERSION,
          required: false as const,
        },
  };
}

export function buildAiAuthoredPlanFirstOpenAiSchema(authoringInput: StructuredPlanAuthoringInput) {
  const allowedWorkoutDatePattern = buildAllowedWorkoutDatePattern(authoringInput);
  const text = (maxLength: number) =>
    ({
      type: "string",
      minLength: 1,
      maxLength,
      pattern: AI_AUTHORED_PLAN_FIRST_TEXT_PATTERN,
    }) as const;
  const nullableText = (maxLength: number) =>
    ({
      anyOf: [text(maxLength), { type: "null" }],
    }) as const;
  const paceProvenance = resolveAiAuthoredPaceProvenance(authoringInput);
  const paceTarget = {
    type: "object",
    additionalProperties: false,
    required: ["primary_execution_mode", "command"],
    properties: {
      primary_execution_mode: { type: "string", const: "pace" },
      command: {
        type: "string",
        minLength: 7,
        maxLength: 24,
        pattern: AI_AUTHORED_PLAN_FIRST_PACE_MIN_PER_KM_PATTERN,
      },
    },
  } as const;
  const heartRateCommands = [
    ...new Set(
      AI_AUTHORED_PLAN_FIRST_HR_ZONE_REFERENCE_VALUES.flatMap((reference) => {
        const guidance = resolveEffectiveHeartRateGuidance(
          authoringInput.runnerFacts.heartRateProfile,
          reference,
        );
        return guidance ? [guidance.rangeBpm] : [];
      }),
    ),
  ];
  const heartRateTarget = {
    type: "object",
    additionalProperties: false,
    required: ["primary_execution_mode", "command"],
    properties: {
      primary_execution_mode: { type: "string", const: "heart_rate" },
      command: { type: "string", enum: heartRateCommands },
    },
  } as const;
  const targetVariants = [paceTarget, heartRateTarget];
  const target = {
    anyOf: targetVariants,
  } as const;
  const prescription = {
    anyOf: [
      {
        type: "object",
        additionalProperties: false,
        required: ["mode", "duration_min"],
        properties: {
          mode: { type: "string", const: "time" },
          duration_min: { type: "number", minimum: 0.01, maximum: 720 },
        },
      },
      {
        type: "object",
        additionalProperties: false,
        required: ["mode", "distance_km"],
        properties: {
          mode: { type: "string", const: "distance" },
          distance_km: { type: "number", minimum: 0.001, maximum: 500 },
        },
      },
    ],
  } as const;
  const repeatChild = {
    type: "object",
    additionalProperties: false,
    required: ["role", "label", "cue", "prescription", "target"],
    properties: {
      role: { type: "string", enum: [...PLANNED_WORKOUT_REPEAT_CHILD_ROLE_VALUES] },
      label: text(80),
      cue: nullableText(160),
      prescription,
      target,
    },
  } as const;
  const unitStep = {
    type: "object",
    additionalProperties: false,
    required: ["kind", "segment_type", "label", "cue", "prescription", "target"],
    properties: {
      kind: { type: "string", const: "unit" },
      segment_type: { type: "string", enum: [...AI_AUTHORED_PLAN_FIRST_UNIT_SECTION_TYPE_VALUES] },
      label: text(120),
      cue: nullableText(160),
      prescription,
      target,
    },
  } as const;
  const repeatStep = {
    type: "object",
    additionalProperties: false,
    required: ["kind", "segment_type", "label", "cue", "rounds", "children"],
    properties: {
      kind: { type: "string", const: "repeat" },
      segment_type: {
        type: "string",
        enum: [...AI_AUTHORED_PLAN_FIRST_REPEAT_SECTION_TYPE_VALUES],
      },
      label: text(120),
      cue: nullableText(160),
      rounds: {
        type: "integer",
        minimum: 2,
        maximum: 100,
        description:
          "Number of times the complete ordered children array executes. Never use distance, duration, or a total quantity as rounds.",
      },
      children: {
        type: "array",
        minItems: 1,
        maxItems: 12,
        items: repeatChild,
      },
    },
  } as const;
  const hydrationStep = {
    type: "object",
    additionalProperties: false,
    required: ["kind", "label", "cue"],
    properties: {
      kind: { type: "string", const: "hydration" },
      label: { type: "string", const: AI_AUTHORED_PLAN_FIRST_HYDRATION_LABEL },
      cue: { type: "string", const: AI_AUTHORED_PLAN_FIRST_HYDRATION_CUE },
    },
  } as const;
  const section = { anyOf: [unitStep, repeatStep, hydrationStep] } as const;
  const workoutProperties = {
    date: { type: "string", pattern: allowedWorkoutDatePattern },
    phase: text(80),
    workout_identity: {
      type: "string",
      enum: [...AI_AUTHORED_PLAN_FIRST_WORKOUT_IDENTITY_VALUES],
    },
    title: text(120),
    cue: text(160),
    sections: { type: "array", minItems: 1, maxItems: 12, items: section },
  } as const;
  const workout = {
    type: "object",
    additionalProperties: false,
    required: ["date", "phase", "workout_identity", "title", "cue", "sections"],
    properties: workoutProperties,
  } as const;
  const endpoint = {
    ...workout,
    properties: {
      ...workoutProperties,
      workout_identity: {
        type: "string",
        const: AI_AUTHORED_PLAN_FIRST_ENDPOINT_IDENTITY,
      },
    },
  } as const;

  return {
    type: "object",
    additionalProperties: false,
    required: ["workouts", "endpoint"],
    properties: {
      workouts: { type: "array", minItems: 1, maxItems: 260, items: workout },
      endpoint,
    },
  } as const;
}

export function buildAiAuthoredPlanFirstPrompt({
  authoringInput,
  today,
}: {
  authoringInput: StructuredPlanAuthoringInput;
  today?: string;
}) {
  const adaptationContext = buildAiAuthoredFirstSessionAdaptationContext(authoringInput);
  const paceProvenance = resolveAiAuthoredPaceProvenance(authoringInput);
  const levelSpecificInstructions = adaptationContext.adaptation.required
    ? [
        "Author the required first-session adaptation bridge yourself: use only Run/Walk, Easy, or Recovery workouts for the first 14 calendar days; schedule at least four adaptation contacts with at least one recovery/rest day between contacts; give every movement leaf one broad numeric pace or accepted-profile BPM command and keep conversational effort as supplemental cue text; and place the first true Long Run no earlier than calendar day 15.",
        "Continue from the adaptation opening with a gradual bridge; do not jump directly from a short adaptation contact to a much longer continuous run. Extend the authored horizon when needed and never compress workouts to catch up with a requested goal date. Keep the selected distance goal visible in the later authored plan.",
      ]
    : ["Author directly from the supplied runner facts and selected fitness level."];
  const horizonInstruction = adaptationContext.adaptation.required
    ? "calendar.requested_target_date is a runner fact. Author endpoint.date as the final selected-distance date; preserve the requested date when the plan honestly fits, or author a later endpoint when the adaptation bridge requires more time."
    : "calendar.requested_target_date is a runner fact. Author endpoint.date as the final selected-distance date; preserve the requested date when the plan honestly fits, otherwise choose one complete horizon within the schema bounds.";
  const weekdayInstruction = authoringInput.availability.fixedRestDays?.length
    ? "Every authored date must fall between calendar.start_date and calendar.latest_date and must use calendar.eligible_workout_weekdays."
    : "Every authored date must fall between calendar.start_date and calendar.latest_date. No eligible_workout_weekdays preference was supplied; choose the workout weekdays as the coach.";
  const availabilityInstructions = [
    authoringInput.availability.maxRunningDaysPerWeek == null
      ? "No weekly running-day ceiling was supplied. Choose the appropriate workout frequency and rest-day distribution as the coach."
      : `Treat calendar.max_workouts_per_week=${authoringInput.availability.maxRunningDaysPerWeek} as an upper ceiling, never an exact workout count; author fewer sessions when appropriate.`,
    authoringInput.availability.fixedRestDays?.length
      ? "calendar.fixed_rest_weekdays are runner-declared constraints. Never schedule a runnable workout on them."
      : "No fixed rest weekdays were supplied. Choose rest-day placement as the coach.",
  ];
  const systemPrompt = [
    "You are Hito's AI running coach authoring one complete training calendar.",
    `Return only JSON for the ${AI_AUTHORED_PLAN_FIRST_RESPONSE_SCHEMA_NAME} schema.`,
    "Return a compact flat workouts[] list plus one endpoint. Omit rest days; every omitted calendar date is rest.",
    "For each workout select the exact canonical workout_identity and author its runner-facing title. Never invent an identity outside the enum.",
    "For each section select the exact canonical segment_type. Labels and cues are display truth, not classification fields.",
    "You own horizon, density, phases, workout mix, progression, long runs, repeats, pace, BPM target selection, effort context, Hydration placement, and execution cues.",
    "Author a coherent weekly training program across the complete horizon, not a sparse sequence of isolated long or quality workouts. You own actual workout frequency and rest-day placement within only the runner constraints that were supplied; support long runs and quality sessions with the easy or recovery running you judge appropriate.",
    ...availabilityInstructions,
    "Use duration_min or distance_km directly and preserve the authored number.",
    `Repeat parents are structural-only. rounds is the number of times the complete ordered children[] round executes; it is never a distance, duration, or total quantity. Put every child of one round in execution order; parent targets and prescriptions do not exist. Allowed child roles: ${PLANNED_WORKOUT_REPEAT_CHILD_ROLE_VALUES.join(", ")}. Recovery is optional and must never be invented.`,
    "Use kind=repeat only when that same complete ordered children[] sequence executes more than once. If children already enumerate a one-off ladder or progression, author those steps as kind=unit sections instead of repeating the whole ladder.",
    "A one-off section is always kind=unit. For 2x4km followed by one final 2km, author one repeat with rounds=2 and a 4km child, then one 2km unit; never encode the final 2km as rounds=10.",
    "Every kind=unit section and every ordered Repeat child is a runnable leaf and must author exactly one numeric target.primary_execution_mode: pace or heart_rate. Repeat parents remain structural and never own a target or primary mode. Effort, RPE, talk-test, and cue text are supplemental context only and never a target command.",
    `Each target has exactly one command. For primary_execution_mode=pace, command is exactly one M:SS/km or M:SS-M:SS/km pace command. A benchmark improves precision but is not required; without one, author a conservative estimated range. Hito classifies the factual pace provenance as ${paceProvenance} from the signed runner context and never derives the pace value.`,
    "For primary_execution_mode=heart_rate, command is one exact numeric BPM range supplied in runner.heart_rate_profile and allowed by the schema. Never alter, approximate, or combine a profile range outside the schema. The accepted profile source remains estimated or personal exactly as supplied.",
    "Choose the numeric mode as the coach: recovery usually uses accepted-profile BPM, otherwise broad estimated pace; easy may use BPM or pace; general long aerobic work usually uses BPM while pace-specific portions use pace; warm-up/cooldown use broad pace unless sustained enough for BPM; steady may use either; tempo/threshold usually use pace while sustained continuous blocks may use BPM; interval work and short movement recoveries use pace; short hills and strides use pace; race-pace work uses pace; race day uses pace unless explicitly authored as HR-controlled. Run/Walk Run and Walk children each use numeric pace. Heart-rate availability never forces its use, and one leaf never has both pace and BPM.",
    "Use kind=hydration only as a separate, non-runnable step in an appropriate prolonged session, race-specific session with aid access, or supplied warm/humid context. Its label and cue are fixed by schema, and it has no prescription, duration, distance, Repeat, pace, BPM, or effort target. Do not add it to every workout, invent environmental context, prescribe quantities or schedules, or make medical claims. A Hydration step cannot be a Repeat child or the only step in a workout.",
    "Never put raw Z1-Z5 references in title, label, cue, or target.command. Zone references remain input-only provenance.",
    "Use title, label, and cue only for concise runner execution content.",
    "Do not include medical, injury, diagnostic, disclaimer, or professional-advice narrative in any text field.",
    "runner.selected_fitness_level is explicit runner input. Do not infer it from other facts.",
    ...levelSpecificInstructions,
    "Dates are canonical. Return each non-rest workout exactly once in workouts[] and the selected-distance endpoint exactly once in endpoint. endpoint.date is reserved exclusively for endpoint: every workouts[].date must be strictly earlier than endpoint.date, with no second workout on that date.",
    horizonInstruction,
    `${weekdayInstruction} In endpoint, main segment distance must equal goal.distance_meters exactly; warmup and cooldown are ancillary and may use their own time or distance prescriptions.`,
    "Return the complete authored plan through endpoint. Never return a sample, summary, omitted-week marker, or partial endpoint object. You own taper and workout density through the endpoint; backend will not add, move, or require a late workout.",
  ].join("\n");
  const userPrompt = JSON.stringify({
    today: today ?? null,
    contractVersion: AI_AUTHORED_PLAN_FIRST_CONTRACT_VERSION,
    runnerFacts: buildAiAuthoredPlanFirstProviderContext(authoringInput),
  });

  return {
    systemPrompt,
    userPrompt,
    responseSchema: buildAiAuthoredPlanFirstOpenAiSchema(authoringInput),
  };
}

export function resolveAiAuthoredPaceProvenance(
  authoringInput: StructuredPlanAuthoringInput,
): AiAuthoredPaceProvenance {
  if (authoringInput.runnerFacts.benchmark) return "benchmark_backed";
  if (authoringInput.planGoalIntent.targetFinishTime) return "goal_informed_ai_estimate";
  return "no_benchmark_ai_estimate";
}

export function buildAiAuthoredPlanFirstProviderContext(
  authoringInput: StructuredPlanAuthoringInput,
) {
  const distance = authoringInput.planGoalIntent.distance;
  if (!distance) {
    throw new Error("Plan-first provider context requires an exact selected distance.");
  }
  const fixedRestWeekdays = authoringInput.availability.fixedRestDays?.length
    ? authoringInput.availability.fixedRestDays
    : null;
  const eligibleWorkoutWeekdays = fixedRestWeekdays
    ? WEEKDAY_NAMES.filter((day) => !fixedRestWeekdays.includes(day))
    : null;
  const heartRateProfile = authoringInput.runnerFacts.heartRateProfile;
  const adaptationContext = buildAiAuthoredFirstSessionAdaptationContext(authoringInput);

  return {
    goal: {
      distance_meters: distance.distanceMeters,
      target_finish_time: authoringInput.planGoalIntent.targetFinishTime?.label ?? null,
    },
    calendar: {
      start_date: authoringInput.schedule.startDate,
      latest_date: addDaysIso(authoringInput.schedule.startDate, 363),
      requested_target_date: authoringInput.planGoalIntent.targetDate,
      eligible_workout_weekdays: eligibleWorkoutWeekdays,
      fixed_rest_weekdays: fixedRestWeekdays,
      max_workouts_per_week: authoringInput.availability.maxRunningDaysPerWeek,
      preferred_long_run_day: authoringInput.availability.preferredLongRunDay ?? null,
    },
    runner: {
      age: authoringInput.runnerFacts.age,
      height_cm: authoringInput.runnerFacts.heightCm,
      weight_kg: authoringInput.runnerFacts.weightKg,
      selected_fitness_level: adaptationContext.selectedFitnessLevel,
      first_session_adaptation: adaptationContext.adaptation,
      benchmark: authoringInput.runnerFacts.benchmark,
      heart_rate_profile: {
        source: heartRateProfile.source,
        accepted: heartRateProfile.accepted,
        primary_command_eligible: true,
        zones: heartRateProfile.zones.map((zone) => ({
          reference: zone.reference,
          min_bpm: zone.minBpm,
          max_bpm: zone.maxBpm,
        })),
      },
    },
  };
}

function buildAllowedWorkoutDatePattern(authoringInput: StructuredPlanAuthoringInput) {
  const restDays = new Set<string>(authoringInput.availability.fixedRestDays ?? []);
  const dates: string[] = [];

  for (let offset = 0; offset < 364; offset += 1) {
    const date = addDaysIso(authoringInput.schedule.startDate, offset);
    if (!restDays.has(weekdayLong(date))) {
      dates.push(date);
    }
  }

  const grouped = new Map<string, Map<string, string[]>>();
  for (const date of dates) {
    const [year, month, day] = date.split("-");
    if (!year || !month || !day) continue;
    const months = grouped.get(year) ?? new Map<string, string[]>();
    const days = months.get(month) ?? [];
    days.push(day);
    months.set(month, days);
    grouped.set(year, months);
  }

  const years = [...grouped.entries()].map(([year, months]) => {
    const monthPattern = [...months.entries()]
      .map(([month, days]) => `${month}-(?:${days.join("|")})`)
      .join("|");
    return `${year}-(?:${monthPattern})`;
  });

  return `^(?:${years.join("|")})$`;
}

function resolveSelectedFitnessLevel(
  authoringInput: StructuredPlanAuthoringInput,
): AiAuthoredPlanFirstSelectedFitnessLevel {
  switch (authoringInput.runnerFacts.selfReportedLevel) {
    case "beginner_new_runner":
      return "new_to_running";
    case "sometimes_runs":
      return "beginner";
    case "runs_a_lot":
      return "running_regularly";
    case "professional_competitive":
      return "performance_focused";
  }
}
