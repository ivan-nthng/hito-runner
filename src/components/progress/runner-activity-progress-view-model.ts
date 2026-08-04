import type {
  RunnerActivityAdvancedMetricConfidence,
  RunnerActivityFactMetric,
  RunnerActivityFactSnapshot,
  RunnerActivityHistoryItem,
  RunnerActivityRecordItem,
  RunnerActivitySessionLoadMetric,
  RunnerActivitySessionLoadWindow,
} from "@/lib/runner-activity/read-model-types";
import { formatDate } from "@/lib/training";

export type ProgressFactKey = keyof RunnerActivityFactSnapshot["facts"];

export const PROGRESS_FACTS: Array<{ key: ProgressFactKey; label: string }> = [
  { key: "sessions", label: "Runs" },
  { key: "runningTime", label: "Running time" },
  { key: "distance", label: "Distance" },
  { key: "elevationGain", label: "Elevation gain" },
  { key: "longestDistance", label: "Longest run" },
  { key: "longestDuration", label: "Longest duration" },
];

export function activityDisplayDate(activity: RunnerActivityHistoryItem) {
  const localDate = activity.historicalTime.localDate;
  if (!localDate) return "Date unavailable";

  const currentYear = new Date().getUTCFullYear();
  const activityYear = Number(localDate.slice(0, 4));
  return formatDate(localDate, {
    month: "short",
    day: "numeric",
    ...(activityYear === currentYear ? {} : { year: "numeric" }),
  });
}

export function activityDateRail(activity: RunnerActivityHistoryItem) {
  const localDate = activity.historicalTime.localDate;
  if (!localDate) return { day: "--", month: "Date" };

  return {
    day: localDate.slice(8, 10).replace(/^0/, ""),
    month: formatDate(localDate, { month: "short" }),
  };
}

export function activityPrimaryFacts(activity: RunnerActivityHistoryItem) {
  return [
    activity.distanceKm == null ? null : `${formatDecimal(activity.distanceKm)} km`,
    activity.duration == null ? null : formatMinutes(activity.duration.minutes),
  ].filter((value): value is string => value !== null);
}

export function activitySupportingFacts(activity: RunnerActivityHistoryItem) {
  return [
    activity.pace == null ? null : `${formatPace(activity.pace.secondsPerKm)} /km`,
    activity.observedHeartRate == null
      ? null
      : `${Math.round(activity.observedHeartRate.averageBpm)} bpm average`,
  ].filter((value): value is string => value !== null);
}

export function activityDisclosureLabel(activity: RunnerActivityHistoryItem) {
  return [
    activityDisplayDate(activity),
    activity.identity.label,
    ...activityPrimaryFacts(activity),
  ].join(", ");
}

export function formatStartedTime(activity: RunnerActivityHistoryItem) {
  if (!activity.historicalTime.startedAt) return null;

  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: activity.historicalTime.timezone ?? "UTC",
      timeZoneName: activity.historicalTime.timezone ? "short" : undefined,
    }).format(new Date(activity.historicalTime.startedAt));
  } catch {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "UTC",
      timeZoneName: "short",
    }).format(new Date(activity.historicalTime.startedAt));
  }
}

export function formatFact(metric: RunnerActivityFactMetric) {
  if (metric.availability !== "available" || metric.value == null) return "Not available";

  switch (metric.unit) {
    case "sessions":
      return `${Math.round(metric.value)} ${Math.round(metric.value) === 1 ? "run" : "runs"}`;
    case "minutes":
      return formatMinutes(metric.value);
    case "kilometers":
      return `${formatDecimal(metric.value)} km`;
    case "meters":
      return `${Math.round(metric.value)} m`;
  }
}

export function formatRollingSummary(snapshot: RunnerActivityFactSnapshot) {
  const facts = [snapshot.facts.sessions, snapshot.facts.runningTime, snapshot.facts.distance]
    .filter((metric) => metric.availability === "available" && metric.value != null)
    .map(formatFact);

  return facts.length > 0 ? facts.join(" · ") : null;
}

export function formatWindow(snapshot: RunnerActivityFactSnapshot) {
  return `${formatDate(snapshot.window.startDate)} to ${formatDate(snapshot.window.endDate)}`;
}

export function confidenceLabel(metric: RunnerActivityFactMetric) {
  if (metric.confidence === "complete") return "Complete evidence";
  if (metric.confidence === "partial") return "Partial evidence";
  return "Unavailable";
}

export function missingReasonLabel(reason: string) {
  const labels: Record<string, string> = {
    no_recorded_activities: "No recorded activities in this period",
    distance_missing: "Distance was not recorded",
    timer_duration_missing: "Timer duration was not recorded",
    elevation_gain_missing: "Elevation gain was not recorded",
    historical_date_missing: "Historical activity date was unavailable",
    current_revision_missing: "Current activity evidence was unavailable",
  };
  return labels[reason] ?? reason.replaceAll("_", " ");
}

export function formatSessionLoad(metric: RunnerActivitySessionLoadMetric) {
  if (metric.availability !== "available" || metric.displayValue == null) return "Not available";
  return `${Math.round(metric.displayValue)} AU`;
}

export function formatAdvancedWindow(window: RunnerActivitySessionLoadWindow) {
  return `${formatDate(window.startDate)} to ${formatDate(window.endDate)}`;
}

export function advancedConfidenceLabel(confidence: RunnerActivityAdvancedMetricConfidence) {
  if (confidence === "complete") return "Complete evidence";
  if (confidence === "partial") return "Partial evidence";
  return "Unavailable";
}

export function advancedUnavailableReasonLabel(reason: string) {
  const labels: Record<string, string> = {
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
  return labels[reason] ?? "Required activity evidence is not available";
}

export function recordDistanceLabel(record: RunnerActivityRecordItem) {
  const [amount, unit] = record.distanceKey.split("_");
  if (record.distanceKey === "half_marathon") return "Half marathon";
  if (record.distanceKey === "marathon") return "Marathon";
  if (unit === "km") return `${amount}K`;
  if (unit === "mile") return `${amount} ${amount === "1" ? "mile" : "miles"}`;
  return `${formatDecimal(record.distanceMeters / 1000)} km`;
}

export function recordClassLabel(record: RunnerActivityRecordItem) {
  return record.recordClass === "runner_confirmed_official_result"
    ? "Official result entered by you"
    : "Hito-observed whole activity";
}

export function recordConfidenceLabel(record: RunnerActivityRecordItem) {
  return record.confidence === "complete" ? "Complete evidence" : "Partial evidence";
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

function formatDecimal(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value);
}
