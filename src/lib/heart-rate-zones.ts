import { z } from "zod";

export const PERSONAL_HEART_RATE_PROFILE_VERSION = "personal_hr_profile_v1" as const;
export const HEART_RATE_ZONE_REFERENCE_VALUES = ["Z1", "Z2", "Z3", "Z4", "Z5"] as const;

export type HeartRateZoneReference = (typeof HEART_RATE_ZONE_REFERENCE_VALUES)[number];
export type HeartRateZoneSource = "personal" | "default_estimated" | "unavailable";

const heartRateZoneValueObjectSchema = z
  .object({
    reference: z.enum(HEART_RATE_ZONE_REFERENCE_VALUES),
    minBpm: z.number().int().min(1).max(300),
    maxBpm: z.number().int().min(1).max(300),
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
  .length(HEART_RATE_ZONE_REFERENCE_VALUES.length)
  .superRefine((zones, context) => {
    const references = new Set(zones.map((zone) => zone.reference));

    for (const reference of HEART_RATE_ZONE_REFERENCE_VALUES) {
      if (!references.has(reference)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Heart-rate profile is missing ${reference}.`,
        });
      }
    }
  });

export const personalHeartRateProfileInputSchema = z
  .object({
    zones: completeHeartRateZonesSchema,
  })
  .strict();

export const storedPersonalHeartRateProfileSchema = z
  .object({
    version: z.literal(PERSONAL_HEART_RATE_PROFILE_VERSION),
    zones: completeHeartRateZonesSchema,
  })
  .strict();

export const effectivePersonalHeartRateProfileSchema = z
  .object({
    source: z.enum(["personal", "default_estimated"]),
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
      .length(HEART_RATE_ZONE_REFERENCE_VALUES.length),
  })
  .strict();

export type PersonalHeartRateProfileInput = z.output<typeof personalHeartRateProfileInputSchema>;
export type StoredPersonalHeartRateProfile = z.output<typeof storedPersonalHeartRateProfileSchema>;
export type EffectivePersonalHeartRateProfile = z.output<
  typeof effectivePersonalHeartRateProfileSchema
>;

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
  const effectiveProfile = buildEffectivePersonalHeartRateProfile({
    age,
    storedProfile,
  });

  if (!effectiveProfile) {
    return {
      source: "unavailable",
      title: "Heart rate zones",
      description: "Add age to your profile to show broad default estimated starting ranges.",
      sourceNote: null,
      estimatedMaxHr: null,
      zones: [],
    };
  }

  return {
    source: effectiveProfile.source,
    title:
      effectiveProfile.source === "personal"
        ? "Personal heart-rate zones"
        : "Default estimated zones",
    description:
      effectiveProfile.source === "personal"
        ? "Saved personal ranges used as your current heart-rate guidance."
        : "Estimated from your profile data. These are editable starting ranges, not measured heart-rate zones.",
    sourceNote: effectiveProfile.sourceNote,
    estimatedMaxHr:
      effectiveProfile.source === "default_estimated" ? deriveEstimatedMaxHr(age) : null,
    zones: effectiveProfile.zones.map((zone) => ({
      ...zone,
      rangeBpm: formatBpmRange(zone.minBpm, zone.maxBpm),
      description: zoneDefinition(zone.reference).description,
    })),
  };
}

export function buildEffectivePersonalHeartRateProfile({
  age,
  storedProfile,
}: {
  age: number | null | undefined;
  storedProfile?: unknown;
}): EffectivePersonalHeartRateProfile | null {
  const personalProfile = parseStoredPersonalHeartRateProfile(storedProfile);

  if (personalProfile) {
    return {
      source: "personal",
      sourceNote: PERSONAL_HR_SOURCE_NOTE,
      zones: orderZones(personalProfile.zones).map((zone) => ({
        ...zone,
        label: zoneDefinition(zone.reference).label,
      })),
    };
  }

  const estimatedMaxHr = deriveEstimatedMaxHr(age);
  if (estimatedMaxHr == null) {
    return null;
  }

  return {
    source: "default_estimated",
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

export function normalizePersonalHeartRateProfileForStorage(
  value: PersonalHeartRateProfileInput,
): StoredPersonalHeartRateProfile {
  const parsed = personalHeartRateProfileInputSchema.parse(value);

  return {
    version: PERSONAL_HEART_RATE_PROFILE_VERSION,
    zones: orderZones(parsed.zones),
  };
}

export function parseStoredPersonalHeartRateProfile(
  value: unknown,
): StoredPersonalHeartRateProfile | null {
  const parsed = storedPersonalHeartRateProfileSchema.safeParse(value);
  return parsed.success
    ? {
        ...parsed.data,
        zones: orderZones(parsed.data.zones),
      }
    : null;
}

export function resolveEffectiveHeartRateGuidance(
  profile: EffectivePersonalHeartRateProfile | null | undefined,
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

export function buildDefaultEstimatedHrBandReadback(
  age: number | null | undefined,
  key: DefaultEstimatedHrBandKey,
): HeartRateZoneReadback | null {
  const estimatedMaxHr = deriveEstimatedMaxHr(age);
  const band = defaultEstimatedHrBands.find((candidate) => candidate.key === key);

  if (estimatedMaxHr == null || !band) {
    return null;
  }

  return {
    reference: band.reference,
    label: band.label,
    description: band.description,
    ...bpmRangeReadback(estimatedMaxHr, band.range),
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

function orderZones<T extends { reference: HeartRateZoneReference }>(zones: readonly T[]): T[] {
  return HEART_RATE_ZONE_REFERENCE_VALUES.map((reference) => {
    const zone = zones.find((candidate) => candidate.reference === reference);
    if (!zone) {
      throw new Error(`Heart-rate profile is missing ${reference}.`);
    }
    return zone;
  });
}
