export type HeartRateZoneSource = "personal" | "default_estimated" | "unavailable";

export interface HeartRateZoneReadback {
  label: string;
  rangeBpm: string;
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
  key: DefaultEstimatedHrBandKey;
  label: string;
  description: string;
  range: [number, number];
};

export const DEFAULT_ESTIMATED_HR_SOURCE_NOTE = "Estimated from age; not measured zone data.";

const defaultEstimatedHrBands: DefaultEstimatedHrBand[] = [
  {
    key: "recovery",
    label: "Recovery",
    description: "Very easy effort for recovery days and warmups.",
    range: [0.55, 0.65],
  },
  {
    key: "easy",
    label: "Easy",
    description: "Comfortable aerobic running.",
    range: [0.6, 0.72],
  },
  {
    key: "longAerobic",
    label: "Long aerobic",
    description: "Long-run aerobic starting range.",
    range: [0.6, 0.75],
  },
  {
    key: "steady",
    label: "Steady",
    description: "Controlled steady effort.",
    range: [0.7, 0.8],
  },
  {
    key: "tempo",
    label: "Tempo",
    description: "Sustained harder effort when a workout asks for it.",
    range: [0.8, 0.88],
  },
];

export function buildHeartRateZonesSummary(age: number | null | undefined): HeartRateZonesSummary {
  const estimatedMaxHr = deriveEstimatedMaxHr(age);

  if (estimatedMaxHr == null) {
    return {
      source: "unavailable",
      title: "Heart rate zones",
      description:
        "Add age to your profile to show broad default estimated starting ranges. Personal/manual zones are not saved yet.",
      sourceNote: null,
      estimatedMaxHr: null,
      zones: [],
    };
  }

  return {
    source: "default_estimated",
    title: "Default estimated zones",
    description:
      "Estimated from your profile data. These are starting ranges, not measured heart-rate zones.",
    sourceNote: DEFAULT_ESTIMATED_HR_SOURCE_NOTE,
    estimatedMaxHr,
    zones: defaultEstimatedHrBands.map((band) => ({
      label: band.label,
      description: band.description,
      rangeBpm: formatEstimatedHrRange(estimatedMaxHr, band.range),
    })),
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
    label: band.label,
    description: band.description,
    rangeBpm: formatEstimatedHrRange(estimatedMaxHr, band.range),
  };
}

function deriveEstimatedMaxHr(age: number | null | undefined) {
  if (typeof age !== "number" || !Number.isFinite(age)) {
    return null;
  }

  return Math.round(208 - 0.7 * age);
}

function formatEstimatedHrRange(estimatedMaxHr: number, [lower, upper]: [number, number]) {
  const lowerBpm = roundBpmToNearestFive(estimatedMaxHr * lower);
  const upperBpm = roundBpmToNearestFive(estimatedMaxHr * upper);

  return `${lowerBpm}-${upperBpm} bpm`;
}

function roundBpmToNearestFive(value: number) {
  return Math.round(value / 5) * 5;
}
