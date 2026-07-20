import { z } from "zod";
import { buildEffectivePersonalHeartRateProfile } from "@/lib/heart-rate-zones";
import { TRAINING_PLAN_V2_SEGMENT_TYPE_VALUES } from "@/lib/imported-plan";
import { PLANNED_WORKOUT_REPEAT_CHILD_ROLE_VALUES } from "@/lib/planned-workout-block-contract";
import {
  CANONICAL_WORKOUT_IDENTITY_VALUES,
  type CanonicalWorkoutIdentity,
} from "@/lib/rich-workout-model";
import type { StructuredPlanAuthoringInput } from "@/lib/structured-plan-authoring-schema";
import { addDaysIso, weekdayLong } from "@/lib/training";
import { WEEKDAY_NAMES } from "@/lib/weekday-rest-invariants";

export const AI_AUTHORED_PLAN_FIRST_CONTRACT_VERSION = "ai-authored-plan-first-v1" as const;
export const AI_AUTHORED_PLAN_FIRST_RESPONSE_SCHEMA_NAME =
  "hito_ai_authored_full_plan_draft" as const;
export const AI_AUTHORED_PLAN_FIRST_PACE_MIN_PER_KM_PATTERN =
  "^\\d{1,2}:[0-5]\\d(?:-\\d{1,2}:[0-5]\\d)?\\/km$" as const;
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
const providerTargetSchema = z
  .object({
    pace: z
      .string()
      .regex(new RegExp(AI_AUTHORED_PLAN_FIRST_PACE_MIN_PER_KM_PATTERN))
      .max(24)
      .nullable(),
    hr_zone: z.enum(AI_AUTHORED_PLAN_FIRST_HR_ZONE_REFERENCE_VALUES).nullable(),
    effort: providerNullableTextSchema(160),
  })
  .strict()
  .nullable();
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
const providerStepSchema = z.discriminatedUnion("kind", [
  providerUnitStepSchema,
  providerRepeatStepSchema,
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
          opening_target_policy: "effort_only_no_pace_or_hr" as const,
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
  const target = {
    type: "object",
    additionalProperties: false,
    required: ["pace", "hr_zone", "effort"],
    properties: {
      pace: {
        anyOf: [
          {
            type: "string",
            minLength: 7,
            maxLength: 24,
            pattern: AI_AUTHORED_PLAN_FIRST_PACE_MIN_PER_KM_PATTERN,
          },
          { type: "null" },
        ],
      },
      hr_zone: {
        anyOf: [
          {
            type: "string",
            enum: [...AI_AUTHORED_PLAN_FIRST_HR_ZONE_REFERENCE_VALUES],
          },
          { type: "null" },
        ],
      },
      effort: nullableText(160),
    },
  } as const;
  const nullableTarget = {
    anyOf: [target, { type: "null" }],
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
      target: nullableTarget,
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
      target: nullableTarget,
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
  const section = { anyOf: [unitStep, repeatStep] } as const;
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
  const levelSpecificInstructions = adaptationContext.adaptation.required
    ? [
        "Author the required first-session adaptation bridge yourself: use only Run/Walk, Easy, or Recovery workouts for the first 14 calendar days; schedule at least four adaptation contacts with at least one recovery/rest day between contacts; use effort cues without pace or HR targets; and place the first true Long Run no earlier than calendar day 15.",
        "Continue from the adaptation opening with a gradual bridge; do not jump directly from a short adaptation contact to a much longer continuous run. Extend the authored horizon when needed and never compress workouts to catch up with a requested goal date. Keep the selected distance goal visible in the later authored plan.",
      ]
    : ["Author directly from the supplied runner facts and selected fitness level."];
  const horizonInstruction = adaptationContext.adaptation.required
    ? "calendar.requested_target_date is a runner fact. Author endpoint.date as the final selected-distance date; preserve the requested date when the plan honestly fits, or author a later endpoint when the adaptation bridge requires more time."
    : "calendar.requested_target_date is a runner fact. Author endpoint.date as the final selected-distance date; preserve the requested date when the plan honestly fits, otherwise choose one complete horizon within the schema bounds.";
  const systemPrompt = [
    "You are Hito's AI running coach authoring one complete training calendar.",
    `Return only JSON for the ${AI_AUTHORED_PLAN_FIRST_RESPONSE_SCHEMA_NAME} schema.`,
    "Return a compact flat workouts[] list plus one endpoint. Omit rest days; every omitted calendar date is rest.",
    "For each workout select the exact canonical workout_identity and author its runner-facing title. Never invent an identity outside the enum.",
    "For each section select the exact canonical segment_type. Labels and cues are display truth, not classification fields.",
    "You own horizon, density, phases, workout mix, progression, long runs, repeats, pace, HR-zone references, effort, and execution cues.",
    "Author a coherent weekly training program across the complete horizon, not a sparse sequence of isolated long or quality workouts. Availability is a ceiling: choose the appropriate frequency, and support long runs and quality sessions with the easy or recovery running needed for the selected fitness level.",
    "Use duration_min or distance_km directly and preserve the authored number.",
    `Repeat parents are structural-only. rounds is the number of times the complete ordered children[] round executes; it is never a distance, duration, or total quantity. Put every child of one round in execution order; parent targets and prescriptions do not exist. Allowed child roles: ${PLANNED_WORKOUT_REPEAT_CHILD_ROLE_VALUES.join(", ")}. Recovery is optional and must never be invented.`,
    "Use kind=repeat only when that same complete ordered children[] sequence executes more than once. If children already enumerate a one-off ladder or progression, author those steps as kind=unit sections instead of repeating the whole ladder.",
    "A one-off section is always kind=unit. For 2x4km followed by one final 2km, author one repeat with rounds=2 and a 4km child, then one 2km unit; never encode the final 2km as rounds=10.",
    "When pace guidance is authored, use exactly M:SS/km or M:SS-M:SS/km. Put supplemental qualitative guidance in effort or cue.",
    "When target_finish_time is supplied and you author selected-distance race-pace guidance, include the exact target-finish pace inside the authored pace value or range.",
    "When HR guidance is authored, use one supplied heart_rate_profile reference such as Z2 or Z1-Z2. Hito resolves it to the supplied BPM range.",
    "Prefer Z1-Z5 references only in target.hr_zone. If a concise title, label, cue, or effort also names one supplied zone reference, Hito deterministically resolves that reference to the supplied BPM range without changing the authored training instruction.",
    "Use title, label, and cue only for concise runner execution content.",
    "Do not include medical, injury, diagnostic, disclaimer, hydration, or professional-advice narrative in any text field.",
    "runner.selected_fitness_level is explicit runner input. Do not infer it from other facts.",
    ...levelSpecificInstructions,
    "Dates are canonical. Return each non-rest workout exactly once in workouts[] and the selected-distance endpoint exactly once in endpoint.",
    horizonInstruction,
    "Every authored date must fall between calendar.start_date and calendar.latest_date and must use calendar.eligible_workout_weekdays. Never exceed calendar.max_workouts_per_week. In endpoint, main segment distance must equal goal.distance_meters exactly; warmup and cooldown are ancillary and may use their own time or distance prescriptions.",
    "Return the complete plan through endpoint. Never return a sample, summary, omitted-week marker, partial calendar, or trailing all-rest gap. Author at least one non-endpoint workout in the final 14 calendar days before endpoint.",
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

export function buildAiAuthoredPlanFirstProviderContext(
  authoringInput: StructuredPlanAuthoringInput,
) {
  const distance = authoringInput.planGoalIntent.distance;
  if (!distance) {
    throw new Error("Plan-first provider context requires an exact selected distance.");
  }
  const eligibleWorkoutWeekdays = WEEKDAY_NAMES.filter(
    (day) => !authoringInput.availability.fixedRestDays.includes(day),
  );
  const restWeekdays = WEEKDAY_NAMES.filter((day) =>
    authoringInput.availability.fixedRestDays.includes(day),
  );
  const heartRateProfile =
    authoringInput.runnerFacts.heartRateProfile ??
    buildEffectivePersonalHeartRateProfile({ age: authoringInput.runnerFacts.age });
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
      rest_weekdays: restWeekdays,
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
      heart_rate_profile: heartRateProfile
        ? {
            source: heartRateProfile.source,
            zones: heartRateProfile.zones.map((zone) => ({
              reference: zone.reference,
              min_bpm: zone.minBpm,
              max_bpm: zone.maxBpm,
            })),
          }
        : null,
    },
  };
}

function buildAllowedWorkoutDatePattern(authoringInput: StructuredPlanAuthoringInput) {
  const restDays = new Set(authoringInput.availability.fixedRestDays);
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
