import {
  HEART_RATE_GUIDANCE_MAX_BPM,
  HEART_RATE_GUIDANCE_MIN_BPM,
  personalHeartRateProfileInputSchema,
  type HeartRateZonesSummary,
  type PersonalHeartRateProfileInput,
} from "@/lib/heart-rate-zones";

export type HeartRateDraftField = "minBpm" | "maxBpm";

export type HeartRateProfileDraftZone = {
  reference: PersonalHeartRateProfileInput["zones"][number]["reference"];
  label: string;
  description: string;
  minBpm: string;
  maxBpm: string;
  sliderMinBpm: number;
  sliderMaxBpm: number;
};

export type HeartRateDraftValidation = {
  fieldErrors: Record<string, string>;
  zoneErrors: Record<number, string>;
  profile: PersonalHeartRateProfileInput | null;
  summary: string | null;
};

export const HEART_RATE_GUIDANCE_SCALE = {
  min: HEART_RATE_GUIDANCE_MIN_BPM,
  max: HEART_RATE_GUIDANCE_MAX_BPM,
  ticks: [40, 85, 130, 175, 220],
} as const;

export function buildHeartRateProfileDraft(
  summary: HeartRateZonesSummary,
): HeartRateProfileDraftZone[] {
  return summary.zones.map((zone) => ({
    reference: zone.reference,
    label: zone.label,
    description: zone.description,
    minBpm: String(zone.minBpm),
    maxBpm: String(zone.maxBpm),
    sliderMinBpm: zone.minBpm,
    sliderMaxBpm: zone.maxBpm,
  }));
}

export function updateHeartRateDraftText({
  draft,
  field,
  index,
  value,
}: {
  draft: HeartRateProfileDraftZone[];
  field: HeartRateDraftField;
  index: number;
  value: string;
}) {
  const next = draft.map((zone, zoneIndex) =>
    zoneIndex === index ? { ...zone, [field]: value } : zone,
  );
  const parsedValue = parseBpm(value);
  const zone = next[index];

  if (!zone || parsedValue == null || !canSyncTextValue(next, index, field, parsedValue)) {
    return next;
  }

  next[index] = {
    ...zone,
    [field === "minBpm" ? "sliderMinBpm" : "sliderMaxBpm"]: parsedValue,
  };

  return next;
}

export function updateHeartRateDraftFromSlider({
  draft,
  field,
  index,
  value,
}: {
  draft: HeartRateProfileDraftZone[];
  field: HeartRateDraftField;
  index: number;
  value: number;
}) {
  const zone = draft[index];
  if (!zone) {
    return draft;
  }

  const [lowerBound, upperBound] = heartRateSliderBounds(draft, index, field);
  const nextValue = clamp(Math.round(value), lowerBound, upperBound);

  return draft.map((item, zoneIndex) =>
    zoneIndex === index
      ? {
          ...item,
          [field]: String(nextValue),
          [field === "minBpm" ? "sliderMinBpm" : "sliderMaxBpm"]: nextValue,
        }
      : item,
  );
}

export function heartRateSliderBounds(
  draft: HeartRateProfileDraftZone[],
  index: number,
  field: HeartRateDraftField,
): readonly [number, number] {
  const zone = draft[index];
  if (!zone) {
    return [HEART_RATE_GUIDANCE_MIN_BPM, HEART_RATE_GUIDANCE_MAX_BPM];
  }

  const previous = draft[index - 1];
  const following = draft[index + 1];

  if (field === "minBpm") {
    return [
      previous?.sliderMinBpm ?? HEART_RATE_GUIDANCE_MIN_BPM,
      Math.min(zone.sliderMaxBpm, following?.sliderMinBpm ?? HEART_RATE_GUIDANCE_MAX_BPM),
    ];
  }

  return [
    Math.max(zone.sliderMinBpm, previous?.sliderMaxBpm ?? HEART_RATE_GUIDANCE_MIN_BPM),
    following?.sliderMaxBpm ?? HEART_RATE_GUIDANCE_MAX_BPM,
  ];
}

export function validateHeartRateProfileDraft(
  draft: HeartRateProfileDraftZone[],
): HeartRateDraftValidation {
  const fieldErrors: Record<string, string> = {};
  const zoneErrors: Record<number, string> = {};
  const parsedZones = draft.map((zone) => {
    const minBpm = parseBpm(zone.minBpm);
    const maxBpm = parseBpm(zone.maxBpm);
    return minBpm == null || maxBpm == null
      ? null
      : {
          reference: zone.reference,
          minBpm,
          maxBpm,
        };
  });
  let hasInvalidValue = false;
  let hasReversedBand = false;
  let hasDecreasingEndpoint = false;

  draft.forEach((zone, index) => {
    const parsedZone = parsedZones[index];
    const minBpm = parsedZone?.minBpm ?? null;
    const maxBpm = parsedZone?.maxBpm ?? null;

    if (minBpm == null) {
      hasInvalidValue = true;
      fieldErrors[fieldErrorKey(index, "minBpm")] = bpmValueError(zone.minBpm);
    }
    if (maxBpm == null) {
      hasInvalidValue = true;
      fieldErrors[fieldErrorKey(index, "maxBpm")] = bpmValueError(zone.maxBpm);
    }
    if (minBpm == null || maxBpm == null) {
      return;
    }

    if (minBpm > maxBpm) {
      hasReversedBand = true;
      fieldErrors[fieldErrorKey(index, "maxBpm")] = "Upper bound must be at or above lower bound.";
      zoneErrors[index] = "This guidance band ends before it starts.";
    }

    const previous = parsedZones[index - 1];
    if (!previous) {
      return;
    }

    if (minBpm < previous.minBpm) {
      hasDecreasingEndpoint = true;
      fieldErrors[fieldErrorKey(index, "minBpm")] =
        `Lower bound must be at least ${previous.minBpm} BPM.`;
      zoneErrors[index] = `${zone.label} must not start below the previous guidance band.`;
    }
    if (maxBpm < previous.maxBpm) {
      hasDecreasingEndpoint = true;
      fieldErrors[fieldErrorKey(index, "maxBpm")] =
        `Upper bound must be at least ${previous.maxBpm} BPM.`;
      zoneErrors[index] = `${zone.label} must not end below the previous guidance band.`;
    }
  });

  const parsed = personalHeartRateProfileInputSchema.safeParse({
    zones: parsedZones.filter(
      (zone): zone is PersonalHeartRateProfileInput["zones"][number] => zone != null,
    ),
  });
  const hasErrors = Object.keys(fieldErrors).length > 0 || Object.keys(zoneErrors).length > 0;

  return {
    fieldErrors,
    zoneErrors,
    profile: parsed.success && !hasErrors ? parsed.data : null,
    summary: hasInvalidValue
      ? `Use whole BPM values from ${HEART_RATE_GUIDANCE_MIN_BPM} to ${HEART_RATE_GUIDANCE_MAX_BPM}.`
      : hasReversedBand
        ? "Each guidance band must start at or below its end."
        : hasDecreasingEndpoint
          ? "Keep lower and upper bounds non-decreasing through the guidance order."
          : !parsed.success
            ? "Check all five guidance bands before saving."
            : null,
  };
}

export function fieldErrorKey(index: number, field: HeartRateDraftField) {
  return `${index}-${field}`;
}

function canSyncTextValue(
  draft: HeartRateProfileDraftZone[],
  index: number,
  field: HeartRateDraftField,
  value: number,
) {
  const [lowerBound, upperBound] = heartRateSliderBounds(draft, index, field);
  return value >= lowerBound && value <= upperBound;
}

function parseBpm(value: string) {
  const normalized = value.trim();
  if (!/^\d+$/.test(normalized)) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isInteger(parsed) &&
    parsed >= HEART_RATE_GUIDANCE_MIN_BPM &&
    parsed <= HEART_RATE_GUIDANCE_MAX_BPM
    ? parsed
    : null;
}

function bpmValueError(value: string) {
  return value.trim()
    ? `Use a whole BPM value from ${HEART_RATE_GUIDANCE_MIN_BPM} to ${HEART_RATE_GUIDANCE_MAX_BPM}.`
    : "Enter a BPM value.";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
