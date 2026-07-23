import { z } from "zod";

export const RUNNER_HEART_RATE_PROFILE_VERSION = "runner_hr_profile_v2" as const;
export const HEART_RATE_ZONE_REFERENCE_VALUES = ["Z1", "Z2", "Z3", "Z4", "Z5"] as const;
export const HEART_RATE_GUIDANCE_MIN_BPM = 40;
export const HEART_RATE_GUIDANCE_MAX_BPM = 220;

export type HeartRateZoneReference = (typeof HEART_RATE_ZONE_REFERENCE_VALUES)[number];
export type HeartRateZoneSource = "personal" | "estimated" | "unavailable";

const heartRateZoneValueObjectSchema = z
  .object({
    reference: z.enum(HEART_RATE_ZONE_REFERENCE_VALUES),
    minBpm: z
      .number()
      .int("Heart-rate guidance must use whole BPM values.")
      .min(HEART_RATE_GUIDANCE_MIN_BPM, "Heart-rate guidance must be at least 40 BPM.")
      .max(HEART_RATE_GUIDANCE_MAX_BPM, "Heart-rate guidance must be at most 220 BPM."),
    maxBpm: z
      .number()
      .int("Heart-rate guidance must use whole BPM values.")
      .min(HEART_RATE_GUIDANCE_MIN_BPM, "Heart-rate guidance must be at least 40 BPM.")
      .max(HEART_RATE_GUIDANCE_MAX_BPM, "Heart-rate guidance must be at most 220 BPM."),
  })
  .strict();
const heartRateZoneValueSchema = heartRateZoneValueObjectSchema.refine(
  (zone) => zone.minBpm <= zone.maxBpm,
  {
    message: "Heart-rate zone minimum must not exceed its maximum.",
    path: ["maxBpm"],
  },
);

const completeHeartRateZonesSchema = z
  .array(heartRateZoneValueSchema)
  .length(HEART_RATE_ZONE_REFERENCE_VALUES.length, {
    message: "Heart-rate profile must contain all five guidance bands.",
  })
  .superRefine(validateHeartRateGuidanceBandOrder);

export const personalHeartRateProfileInputSchema = z
  .object({
    zones: completeHeartRateZonesSchema,
  })
  .strict();

export const storedRunnerHeartRateProfileSchema = z.discriminatedUnion("source", [
  z
    .object({
      version: z.literal(RUNNER_HEART_RATE_PROFILE_VERSION),
      source: z.literal("estimated"),
    })
    .strict(),
  z
    .object({
      version: z.literal(RUNNER_HEART_RATE_PROFILE_VERSION),
      source: z.literal("personal"),
      zones: completeHeartRateZonesSchema,
    })
    .strict(),
]);

export const effectiveRunnerHeartRateProfileSchema = z
  .object({
    source: z.enum(["personal", "estimated"]),
    accepted: z.boolean(),
    sourceNote: z.string().trim().min(1).max(200),
    zones: z
      .array(
        heartRateZoneValueObjectSchema
          .extend({
            label: z.string().trim().min(1).max(80),
          })
          .refine((zone) => zone.minBpm <= zone.maxBpm, {
            message: "Heart-rate zone minimum must not exceed its maximum.",
            path: ["maxBpm"],
          }),
      )
      .length(HEART_RATE_ZONE_REFERENCE_VALUES.length, {
        message: "Heart-rate profile must contain all five guidance bands.",
      })
      .superRefine(validateHeartRateGuidanceBandOrder),
  })
  .strict();
export const acceptedRunnerHeartRateProfileSchema = effectiveRunnerHeartRateProfileSchema.extend({
  accepted: z.literal(true),
});

export type PersonalHeartRateProfileInput = z.output<typeof personalHeartRateProfileInputSchema>;
export type StoredRunnerHeartRateProfile = z.output<typeof storedRunnerHeartRateProfileSchema>;
export type EffectiveRunnerHeartRateProfile = z.output<
  typeof effectiveRunnerHeartRateProfileSchema
>;
export type AcceptedRunnerHeartRateProfile = z.output<typeof acceptedRunnerHeartRateProfileSchema>;

export interface HeartRateZoneReadback {
  reference: HeartRateZoneReference;
  label: string;
  rangeBpm: string;
  minBpm: number;
  maxBpm: number;
  description: string;
}

export interface HeartRateZonesSummary {
  source: HeartRateZoneSource;
  accepted: boolean;
  title: string;
  description: string;
  sourceNote: string | null;
  estimatedMaxHr: number | null;
  zones: HeartRateZoneReadback[];
}

export type DefaultEstimatedHrBandKey = "recovery" | "easy" | "longAerobic" | "steady" | "tempo";

type DefaultEstimatedHrBand = {
  reference: HeartRateZoneReference;
  key: DefaultEstimatedHrBandKey;
  label: string;
  description: string;
  range: [number, number];
};

export const DEFAULT_ESTIMATED_HR_SOURCE_NOTE = "Estimated from age; not measured zone data.";
export const PERSONAL_HR_SOURCE_NOTE = "Saved by the runner as personal heart-rate truth.";

const defaultEstimatedHrBands: DefaultEstimatedHrBand[] = [
  {
    reference: "Z1",
    key: "recovery",
    label: "Recovery",
    description: "Very easy effort for recovery days and warmups.",
    range: [0.55, 0.65],
  },
  {
    reference: "Z2",
    key: "easy",
    label: "Easy",
    description: "Comfortable aerobic running.",
    range: [0.6, 0.72],
  },
  {
    reference: "Z3",
    key: "longAerobic",
    label: "Long aerobic",
    description: "Long-run aerobic starting range.",
    range: [0.6, 0.75],
  },
  {
    reference: "Z4",
    key: "steady",
    label: "Steady",
    description: "Controlled steady effort.",
    range: [0.7, 0.8],
  },
  {
    reference: "Z5",
    key: "tempo",
    label: "Tempo",
    description: "Sustained harder effort when a workout asks for it.",
    range: [0.8, 0.88],
  },
];

export function buildHeartRateZonesSummary(
  age: number | null | undefined,
  storedProfile?: unknown,
): HeartRateZonesSummary {
  const effectiveProfile = buildEffectiveRunnerHeartRateProfile({
    age,
    storedProfile,
  });

  if (!effectiveProfile) {
    return {
      source: "unavailable",
      accepted: false,
      title: "Heart rate zones",
      description: "Add age to your profile to show broad default estimated starting ranges.",
      sourceNote: null,
      estimatedMaxHr: null,
      zones: [],
    };
  }

  return {
    source: effectiveProfile.source,
    accepted: isAcceptedStoredHeartRateProfile(storedProfile),
    title:
      effectiveProfile.source === "personal"
        ? "Personal heart-rate zones"
        : "Default estimated zones",
    description:
      effectiveProfile.source === "personal"
        ? "Saved personal ranges used as your current heart-rate guidance."
        : "Estimated from your profile data. These are editable starting ranges, not measured heart-rate zones.",
    sourceNote: effectiveProfile.sourceNote,
    estimatedMaxHr: effectiveProfile.source === "estimated" ? deriveEstimatedMaxHr(age) : null,
    zones: effectiveProfile.zones.map((zone) => ({
      ...zone,
      rangeBpm: formatBpmRange(zone.minBpm, zone.maxBpm),
      description: zoneDefinition(zone.reference).description,
    })),
  };
}

export function buildEffectiveRunnerHeartRateProfile({
  age,
  storedProfile,
}: {
  age: number | null | undefined;
  storedProfile?: unknown;
}): EffectiveRunnerHeartRateProfile | null {
  const stored = parseStoredRunnerHeartRateProfile(storedProfile);

  if (stored?.source === "personal") {
    return {
      source: "personal",
      accepted: true,
      sourceNote: PERSONAL_HR_SOURCE_NOTE,
      zones: stored.zones.map((zone) => ({
        ...zone,
        label: zoneDefinition(zone.reference).label,
      })),
    };
  }

  if (storedProfile != null && !stored) {
    return null;
  }

  const estimatedMaxHr = deriveEstimatedMaxHr(age);
  if (estimatedMaxHr == null) {
    return null;
  }

  return {
    source: "estimated",
    accepted: stored?.source === "estimated",
    sourceNote: DEFAULT_ESTIMATED_HR_SOURCE_NOTE,
    zones: defaultEstimatedHrBands.map((band) => {
      const [minBpm, maxBpm] = estimatedBpmRange(estimatedMaxHr, band.range);

      return {
        reference: band.reference,
        label: band.label,
        minBpm,
        maxBpm,
      };
    }),
  };
}

export function normalizeAcceptedHeartRateProfileForStorage(input: {
  age: number;
  value: PersonalHeartRateProfileInput;
}): StoredRunnerHeartRateProfile {
  const parsed = personalHeartRateProfileInputSchema.parse(input.value);
  const estimated = buildEffectiveRunnerHeartRateProfile({ age: input.age });

  if (
    estimated &&
    parsed.zones.every((zone, index) => {
      const estimatedZone = estimated.zones[index];
      return (
        estimatedZone?.reference === zone.reference &&
        estimatedZone.minBpm === zone.minBpm &&
        estimatedZone.maxBpm === zone.maxBpm
      );
    })
  ) {
    return {
      version: RUNNER_HEART_RATE_PROFILE_VERSION,
      source: "estimated",
    };
  }

  return {
    version: RUNNER_HEART_RATE_PROFILE_VERSION,
    source: "personal",
    zones: parsed.zones,
  };
}

export function parseStoredRunnerHeartRateProfile(
  value: unknown,
): StoredRunnerHeartRateProfile | null {
  const parsed = storedRunnerHeartRateProfileSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function buildAcceptedEffectiveRunnerHeartRateProfile(input: {
  age: number | null | undefined;
  storedProfile: unknown;
}): AcceptedRunnerHeartRateProfile | null {
  if (!isAcceptedStoredHeartRateProfile(input.storedProfile)) {
    return null;
  }

  const effective = buildEffectiveRunnerHeartRateProfile(input);
  const accepted = acceptedRunnerHeartRateProfileSchema.safeParse(effective);
  return accepted.success ? accepted.data : null;
}

export function resolveEffectiveHeartRateGuidance(
  profile: EffectiveRunnerHeartRateProfile | null | undefined,
  authoredReference: string,
) {
  if (!profile) {
    return null;
  }

  const match = authoredReference
    .trim()
    .toUpperCase()
    .match(/^Z([1-5])(?:\s*-\s*Z([1-5]))?$/);
  if (!match) {
    return null;
  }

  const startReference = `Z${match[1]}` as HeartRateZoneReference;
  const endReference = `Z${match[2] ?? match[1]}` as HeartRateZoneReference;
  const startIndex = HEART_RATE_ZONE_REFERENCE_VALUES.indexOf(startReference);
  const endIndex = HEART_RATE_ZONE_REFERENCE_VALUES.indexOf(endReference);
  if (startIndex > endIndex) {
    return null;
  }

  const startZone = profile.zones.find((zone) => zone.reference === startReference);
  const endZone = profile.zones.find((zone) => zone.reference === endReference);
  if (!startZone || !endZone) {
    return null;
  }

  return {
    authoredReference: authoredReference.trim(),
    canonicalReference:
      startReference === endReference ? startReference : `${startReference}-${endReference}`,
    source: profile.source,
    sourceNote: profile.sourceNote,
    minBpm: startZone.minBpm,
    maxBpm: endZone.maxBpm,
    rangeBpm: formatBpmRange(startZone.minBpm, endZone.maxBpm),
  };
}

function deriveEstimatedMaxHr(age: number | null | undefined) {
  if (typeof age !== "number" || !Number.isFinite(age)) {
    return null;
  }

  return Math.round(208 - 0.7 * age);
}

function estimatedBpmRange(
  estimatedMaxHr: number,
  [lower, upper]: [number, number],
): [number, number] {
  const lowerBpm = roundBpmToNearestFive(estimatedMaxHr * lower);
  const upperBpm = roundBpmToNearestFive(estimatedMaxHr * upper);

  return [lowerBpm, upperBpm];
}

function bpmRangeReadback(estimatedMaxHr: number, range: [number, number]) {
  const [minBpm, maxBpm] = estimatedBpmRange(estimatedMaxHr, range);

  return {
    minBpm,
    maxBpm,
    rangeBpm: formatBpmRange(minBpm, maxBpm),
  };
}

function formatBpmRange(minBpm: number, maxBpm: number) {
  return `${minBpm}-${maxBpm} bpm`;
}

function roundBpmToNearestFive(value: number) {
  return Math.round(value / 5) * 5;
}

function zoneDefinition(reference: HeartRateZoneReference) {
  const definition = defaultEstimatedHrBands.find((band) => band.reference === reference);
  if (!definition) {
    throw new Error(`Unknown heart-rate zone reference: ${reference}`);
  }
  return definition;
}

function isAcceptedStoredHeartRateProfile(value: unknown) {
  return storedRunnerHeartRateProfileSchema.safeParse(value).success;
}

function validateHeartRateGuidanceBandOrder(
  zones: ReadonlyArray<{
    reference: HeartRateZoneReference;
    minBpm: number;
    maxBpm: number;
  }>,
  context: z.RefinementCtx,
) {
  for (const [index, reference] of HEART_RATE_ZONE_REFERENCE_VALUES.entries()) {
    if (zones[index]?.reference !== reference) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [index, "reference"],
        message: `Heart-rate profile must keep ${reference} in canonical order.`,
      });
    }

    if (index === 0) continue;
    const previous = zones[index - 1];
    const current = zones[index];
    if (!previous || !current) continue;

    if (current.minBpm < previous.minBpm) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [index, "minBpm"],
        message:
          "Heart-rate guidance lower bounds must be non-decreasing from Recovery through Tempo.",
      });
    }
    if (current.maxBpm < previous.maxBpm) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [index, "maxBpm"],
        message:
          "Heart-rate guidance upper bounds must be non-decreasing from Recovery through Tempo.",
      });
    }
  }
}
