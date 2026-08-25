import type {
  RunnerActivityHistoryProductItem,
  RunnerActivityProgressProductFactMetric,
  RunnerActivityProgressProductRecord,
  RunnerActivityProgressProductSessionLoadMetric,
  RunnerActivityProgressProductSessionLoadWindow,
  RunnerActivityProgressProductSnapshot,
} from "@/lib/runner-activity/product-contract";
import { formatUiDate, formatUiNumber, type ResolvedUiLocale } from "@/lib/ui-locale";
import { getHitoProductMessage, type HitoProductMessageKey } from "@/lib/ui-locale-messages";

export type ProgressFactKey = keyof RunnerActivityProgressProductSnapshot["facts"];

export const PROGRESS_FACTS: Array<{ key: ProgressFactKey; label: HitoProductMessageKey }> = [
  { key: "sessions", label: "Runs" },
  { key: "runningTime", label: "Running time" },
  { key: "distance", label: "Distance" },
  { key: "elevationGain", label: "Elevation gain" },
  { key: "longestDistance", label: "Longest run" },
  { key: "longestDuration", label: "Longest duration" },
];

export function activityDisplayDate(
  activity: RunnerActivityHistoryProductItem,
  locale: ResolvedUiLocale,
) {
  const localDate = activity.historicalTime.localDate;
  if (!localDate) return getHitoProductMessage(locale, "Date unavailable");

  const currentYear = new Date().getUTCFullYear();
  const activityYear = Number(localDate.slice(0, 4));
  return formatUiDate(localDate, locale, {
    month: "short",
    day: "numeric",
    ...(activityYear === currentYear ? {} : { year: "numeric" }),
  });
}

export function activityDateRail(
  activity: RunnerActivityHistoryProductItem,
  locale: ResolvedUiLocale,
) {
  const localDate = activity.historicalTime.localDate;
  if (!localDate) return { day: "--", month: getHitoProductMessage(locale, "Date") };

  return {
    day: localDate.slice(8, 10).replace(/^0/, ""),
    month: formatUiDate(localDate, locale, { month: "short" }),
  };
}

export function activityPrimaryFacts(
  activity: RunnerActivityHistoryProductItem,
  locale: ResolvedUiLocale,
) {
  return [
    activity.distanceKm == null ? null : `${formatDecimal(activity.distanceKm, locale)} km`,
    activity.duration == null ? null : formatMinutes(activity.duration.minutes),
  ].filter((value): value is string => value !== null);
}

export function activitySupportingFacts(
  activity: RunnerActivityHistoryProductItem,
  locale: ResolvedUiLocale,
) {
  return [
    activity.pace == null ? null : `${formatPace(activity.pace.secondsPerKm)} /km`,
    activity.observedHeartRate == null
      ? null
      : `${Math.round(activity.observedHeartRate.averageBpm)} ${getHitoProductMessage(locale, "bpm average")}`,
  ].filter((value): value is string => value !== null);
}

export function activityDisclosureLabel(
  activity: RunnerActivityHistoryProductItem,
  locale: ResolvedUiLocale,
) {
  return [
    activityDisplayDate(activity, locale),
    activity.identity.label,
    ...activityPrimaryFacts(activity, locale),
  ].join(", ");
}

export function formatStartedTime(
  activity: RunnerActivityHistoryProductItem,
  locale: ResolvedUiLocale,
) {
  if (!activity.historicalTime.startedAt) return null;

  try {
    return formatUiDate(new Date(activity.historicalTime.startedAt), locale, {
      hour: "numeric",
      minute: "2-digit",
      timeZone: activity.historicalTime.timezone ?? "UTC",
      timeZoneName: activity.historicalTime.timezone ? "short" : undefined,
    });
  } catch {
    return formatUiDate(new Date(activity.historicalTime.startedAt), locale, {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "UTC",
      timeZoneName: "short",
    });
  }
}

export function formatFact(
  metric: RunnerActivityProgressProductFactMetric,
  locale: ResolvedUiLocale,
) {
  if (metric.availability !== "available" || metric.value == null) {
    return getHitoProductMessage(locale, "Not available");
  }

  switch (metric.unit) {
    case "sessions":
      return `${Math.round(metric.value)} ${getHitoProductMessage(
        locale,
        Math.round(metric.value) === 1 ? "run" : "runs",
      )}`;
    case "minutes":
      return formatMinutes(metric.value);
    case "kilometers":
      return `${formatDecimal(metric.value, locale)} km`;
    case "meters":
      return `${Math.round(metric.value)} m`;
  }
}

export function formatRollingSummary(
  snapshot: RunnerActivityProgressProductSnapshot,
  locale: ResolvedUiLocale,
) {
  const facts = [snapshot.facts.sessions, snapshot.facts.runningTime, snapshot.facts.distance]
    .filter((metric) => metric.availability === "available" && metric.value != null)
    .map((metric) => formatFact(metric, locale));

  return facts.length > 0 ? facts.join(" · ") : null;
}

export function formatWindow(
  snapshot: RunnerActivityProgressProductSnapshot,
  locale: ResolvedUiLocale,
) {
  return `${formatUiDate(snapshot.window.startDate, locale, {
    month: "short",
    day: "numeric",
  })} – ${formatUiDate(snapshot.window.endDate, locale, { month: "short", day: "numeric" })}`;
}

export function confidenceLabel(
  metric: RunnerActivityProgressProductFactMetric,
  locale: ResolvedUiLocale,
) {
  if (metric.confidence === "complete") {
    return getHitoProductMessage(locale, "Complete evidence");
  }
  if (metric.confidence === "partial") {
    return getHitoProductMessage(locale, "Partial evidence");
  }
  return getHitoProductMessage(locale, "Unavailable");
}

export function missingReasonLabel(reason: string, locale: ResolvedUiLocale) {
  const labels: Record<string, HitoProductMessageKey> = {
    no_recorded_activities: "No recorded activities in this period",
    distance_missing: "Distance was not recorded",
    timer_duration_missing: "Timer duration was not recorded",
    elevation_gain_missing: "Elevation gain was not recorded",
    historical_date_missing: "Historical activity date was unavailable",
    current_revision_missing: "Current activity evidence was unavailable",
  };
  const label = labels[reason];
  return label ? getHitoProductMessage(locale, label) : reason.replaceAll("_", " ");
}

export function formatSessionLoad(
  metric: RunnerActivityProgressProductSessionLoadMetric,
  locale: ResolvedUiLocale,
) {
  if (metric.availability !== "available" || metric.displayValue == null) {
    return getHitoProductMessage(locale, "Not available");
  }
  return `${formatUiNumber(Math.round(metric.displayValue), locale)} AU`;
}

export function formatAdvancedWindow(
  window: RunnerActivityProgressProductSessionLoadWindow,
  locale: ResolvedUiLocale,
) {
  return `${formatUiDate(window.startDate, locale, {
    month: "short",
    day: "numeric",
  })} – ${formatUiDate(window.endDate, locale, { month: "short", day: "numeric" })}`;
}

export function advancedConfidenceLabel(
  confidence: RunnerActivityProgressProductSessionLoadMetric["confidence"],
  locale: ResolvedUiLocale,
) {
  if (confidence === "complete") return getHitoProductMessage(locale, "Complete evidence");
  if (confidence === "partial") return getHitoProductMessage(locale, "Partial evidence");
  return getHitoProductMessage(locale, "Unavailable");
}

export function advancedUnavailableReasonLabel(reason: string, locale: ResolvedUiLocale) {
  const labels: Record<string, HitoProductMessageKey> = {
    runner_rpe_not_recorded: "Session effort was not reported",
    rpe_out_of_range: "Reported effort was outside the accepted 1-10 range",
    actual_duration_not_observed: "Observed activity duration was unavailable",
    activity_rpe_link_missing: "Reported effort was not linked to this recorded activity",
    activity_rpe_link_ambiguous: "Reported effort could not be linked to one recorded activity",
    outcome_ineligible: "The recorded outcome is not eligible for session load",
    skipped_has_no_session_load: "Skipped workouts do not have session load",
    source_revision_invalidated: "The supporting activity evidence changed",
    activity_revision_invalidated: "The supporting activity was corrected",
    official_result_not_confirmed: "No current runner-confirmed official result",
    normalized_stream_not_persisted: "Detailed workout samples are not available yet",
    unsupported_record_class: "This record class is not supported yet",
    metric_recalculation_pending: "The metric is being recalculated",
  };
  return getHitoProductMessage(
    locale,
    labels[reason] ?? "Required activity evidence is not available",
  );
}

export function recordDistanceLabel(
  record: RunnerActivityProgressProductRecord,
  locale: ResolvedUiLocale,
) {
  const [amount, unit] = record.distanceKey.split("_");
  if (record.distanceKey === "half_marathon") return getHitoProductMessage(locale, "Half marathon");
  if (record.distanceKey === "marathon") return getHitoProductMessage(locale, "Marathon");
  if (unit === "km") return `${amount}K`;
  if (unit === "mile") {
    return `${amount} ${getHitoProductMessage(locale, amount === "1" ? "mile" : "miles")}`;
  }
  return `${formatDecimal(record.distanceMeters / 1000, locale)} km`;
}

export function recordClassLabel(
  record: RunnerActivityProgressProductRecord,
  locale: ResolvedUiLocale,
) {
  return getHitoProductMessage(
    locale,
    record.recordClass === "runner_confirmed_official_result"
      ? "Official result entered by you"
      : "Hito-observed whole activity",
  );
}

export function recordConfidenceLabel(
  record: RunnerActivityProgressProductRecord,
  locale: ResolvedUiLocale,
) {
  return getHitoProductMessage(
    locale,
    record.confidence === "complete" ? "Complete evidence" : "Partial evidence",
  );
}

export function formatRecordTime(seconds: number) {
  const rounded = Math.max(0, Math.round(seconds));
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const remainder = rounded % 60;
  if (hours === 0) return `${minutes}:${String(remainder).padStart(2, "0")}`;
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export function formatRecordContext(context: string | null) {
  if (!context) return null;
  return context.replaceAll("_", " ").replace(/^./, (character) => character.toUpperCase());
}

function formatPace(secondsPerKm: number) {
  const totalSeconds = Math.max(0, Math.round(secondsPerKm));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatMinutes(minutes: number) {
  const rounded = Math.max(0, Math.round(minutes));
  const hours = Math.floor(rounded / 60);
  const remainder = rounded % 60;

  if (hours === 0) return `${remainder} min`;
  if (remainder === 0) return `${hours} h`;
  return `${hours} h ${remainder} min`;
}

function formatDecimal(value: number, locale: ResolvedUiLocale) {
  return formatUiNumber(value, locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}
