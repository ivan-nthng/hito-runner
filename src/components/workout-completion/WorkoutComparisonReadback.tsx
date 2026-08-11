/* eslint-disable react-refresh/only-export-components */
import { formatDate, formatDurationMin } from "@/lib/training";
import { Icon } from "@/components/ui/icon";
import type {
  WorkoutActualMetricsSummary,
  WorkoutComparisonDifferencePayload,
  WorkoutComparisonSegmentGroup,
  WorkoutComparisonSignal,
  WorkoutComparisonSignalKey,
  WorkoutComparisonSummary,
  WorkoutComparisonSupportItem,
} from "@/lib/workout-result-import/types";

type ComparisonRow = {
  key: WorkoutComparisonSignalKey;
  label: string;
  plan: string;
  run: string;
  difference: string;
};

const PRIMARY_SIGNAL_ORDER: WorkoutComparisonSignalKey[] = [
  "activity_type",
  "date_alignment",
  "duration",
  "distance",
  "structured_step_count",
];

export function DeterministicComparisonReadback({
  comparison,
}: {
  comparison: WorkoutComparisonSummary;
}) {
  const payload = getComparisonPayload(comparison);
  const rows = buildPlanRunDifferenceRows(comparison);
  const structureGroups = getStructureGroups(payload);
  const detailLines = buildComparisonDetailLines(comparison, payload);

  return (
    <div className="mt-4 space-y-4">
      <ComparisonRowGroup rows={rows} />

      {structureGroups.length > 0 ? (
        <details className="hito-disclosure">
          <summary className="hito-disclosure-summary">
            <span className="hito-label text-foreground">Workout structure</span>
            <Icon name="chevron-down" size="xs" className="hito-disclosure-chevron" />
          </summary>
          <div className="hito-disclosure-body">
            <StructureReadback groups={structureGroups} />
          </div>
        </details>
      ) : null}

      {detailLines.length > 0 ? (
        <details className="hito-disclosure">
          <summary className="hito-disclosure-summary">
            <span className="hito-label text-foreground">Comparison details</span>
            <Icon name="chevron-down" size="xs" className="hito-disclosure-chevron" />
          </summary>
          <div className="hito-disclosure-body">
            {detailLines.map((line) => (
              <p key={line} className="hito-body-small">
                {line}
              </p>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}

export function RunCapturedReadback({
  actual,
  comparisonAvailable = false,
}: {
  actual: WorkoutActualMetricsSummary;
  comparisonAvailable?: boolean;
}) {
  const rows = [
    actual.activityLocalDate
      ? { label: "Workout day", value: formatDateValue(actual.activityLocalDate) }
      : null,
    actual.actualDurationMin != null
      ? { label: "Duration", value: formatDurationMin(actual.actualDurationMin) }
      : null,
    actual.actualDistanceKm != null
      ? { label: "Distance", value: formatKilometres(actual.actualDistanceKm) }
      : null,
    actual.actualElevationGainM != null
      ? { label: "Elevation gain", value: formatWholeNumber(actual.actualElevationGainM, "m") }
      : null,
    actual.actualElevationLossM != null
      ? { label: "Elevation loss", value: formatWholeNumber(actual.actualElevationLossM, "m") }
      : null,
    actual.actualAvgHr != null
      ? { label: "Average heart rate", value: formatWholeNumber(actual.actualAvgHr, "bpm") }
      : null,
    actual.actualMaxHr != null
      ? { label: "Maximum heart rate", value: formatWholeNumber(actual.actualMaxHr, "bpm") }
      : null,
    actual.actualAvgPower != null
      ? { label: "Average power", value: formatWholeNumber(actual.actualAvgPower, "W") }
      : null,
    actual.actualMaxPower != null
      ? { label: "Maximum power", value: formatWholeNumber(actual.actualMaxPower, "W") }
      : null,
    actual.actualAvgCadence != null
      ? { label: "Average cadence", value: formatWholeNumber(actual.actualAvgCadence, "spm") }
      : null,
    actual.actualCalories != null
      ? { label: "Calories", value: formatWholeNumber(actual.actualCalories, "kcal") }
      : null,
    actual.actualIntervalCount != null
      ? {
          label: "Structured intervals",
          value: `${actual.actualIntervalCount} interval${actual.actualIntervalCount === 1 ? "" : "s"}`,
        }
      : null,
  ].filter(notNull);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="hito-ui-panel-title">Observed run</h3>
        {!comparisonAvailable ? (
          <span className="hito-status-pill" data-tone="muted">
            Comparison unavailable
          </span>
        ) : null}
      </div>
      {rows.length > 0 ? (
        <dl className="hito-row-group">
          {rows.map((row) => (
            <div key={row.label} className="hito-list-row">
              <dt className="hito-list-row-title">{row.label}</dt>
              <dd className="hito-technical-mono text-right">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {!comparisonAvailable ? (
        <p className="hito-body-small">
          The activity was captured, but no plan comparison is available.
        </p>
      ) : null}
    </div>
  );
}

export function getComparisonCoverageMeta(comparison: WorkoutComparisonSummary): {
  label: string;
  tone: "muted" | "signal" | "warning";
} {
  switch (comparison.comparisonStatus) {
    case "complete":
      return { label: "Complete comparison", tone: "signal" };
    case "partial":
      return { label: "Partial comparison", tone: "warning" };
    default:
      return { label: "Limited comparison", tone: "muted" };
  }
}

export function buildPlanRunDifferenceRows(comparison: WorkoutComparisonSummary): ComparisonRow[] {
  const signalsByKey = new Map(
    getComparisonSignals(comparison).map((signal) => [signal.key, signal]),
  );

  return PRIMARY_SIGNAL_ORDER.flatMap((key) => {
    const signal = signalsByKey.get(key);

    if (!signal) {
      return [];
    }

    if (
      key === "distance" &&
      signal.plannedValue == null &&
      signal.actualValue == null &&
      signal.status === "not_applicable"
    ) {
      return [];
    }

    return [buildComparisonRow(signal)];
  });
}

function ComparisonRowGroup({ rows }: { rows: ComparisonRow[] }) {
  return (
    <dl className="hito-row-group">
      <div
        aria-hidden="true"
        className="hidden grid-cols-[minmax(7rem,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)] gap-4 px-4 py-3 sm:grid"
      >
        <div className="hito-caption">Metric</div>
        <div className="hito-caption">Plan</div>
        <div className="hito-caption">Run</div>
        <div className="hito-caption">Difference</div>
      </div>
      {rows.map((row) => (
        <div
          key={row.key}
          className="hito-list-row block min-w-0 sm:grid sm:grid-cols-[minmax(7rem,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)] sm:items-start sm:gap-4"
        >
          <dt className="min-w-0">
            <span className="hito-list-row-title">{row.label}</span>
          </dt>
          <ComparisonValue metric={row.label} label="Plan" value={row.plan} />
          <ComparisonValue metric={row.label} label="Run" value={row.run} />
          <ComparisonValue metric={row.label} label="Difference" value={row.difference} />
        </div>
      ))}
    </dl>
  );
}

function ComparisonValue({
  metric,
  label,
  value,
}: {
  metric: string;
  label: string;
  value: string;
}) {
  return (
    <dd className="mt-3 min-w-0 sm:mt-0">
      <span className="sr-only">
        {metric}, {label}:{" "}
      </span>
      <span aria-hidden="true" className="hito-caption sm:hidden">
        {label}
      </span>
      <p className="hito-technical-mono mt-1 break-words sm:mt-0">{value}</p>
    </dd>
  );
}

function StructureReadback({ groups }: { groups: WorkoutComparisonSegmentGroup[] }) {
  return (
    <dl className="hito-row-group">
      <div
        aria-hidden="true"
        className="hidden grid-cols-[minmax(7rem,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)] gap-4 px-4 py-3 sm:grid"
      >
        <div className="hito-caption">Section</div>
        <div className="hito-caption">Plan</div>
        <div className="hito-caption">Run</div>
        <div className="hito-caption">Difference</div>
      </div>
      {groups.map((group) => {
        const row = buildStructureRow(group);

        return (
          <div
            key={group.key}
            className="hito-list-row block min-w-0 sm:grid sm:grid-cols-[minmax(7rem,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)] sm:items-start sm:gap-4"
          >
            <dt className="min-w-0">
              <span className="hito-list-row-title">{group.label}</span>
            </dt>
            <ComparisonValue metric={group.label} label="Plan" value={row.plan} />
            <ComparisonValue metric={group.label} label="Run" value={row.run} />
            <ComparisonValue metric={group.label} label="Difference" value={row.difference} />
          </div>
        );
      })}
    </dl>
  );
}

function buildComparisonRow(signal: WorkoutComparisonSignal): ComparisonRow {
  const label = humanizeSignalLabel(signal);
  const plan = formatSignalValue(signal.plannedValue, signal.unit, "plan");
  const run = formatSignalValue(signal.actualValue, signal.unit, "run");

  if (signal.status === "missing_actual") {
    return {
      key: signal.key,
      label,
      plan,
      run: "Unavailable",
      difference: "Run data unavailable",
    };
  }

  if (signal.status === "not_applicable") {
    return {
      key: signal.key,
      label,
      plan: signal.key === "distance" ? "No target" : plan,
      run,
      difference: "Not compared",
    };
  }

  const difference = formatSignalDifference(signal);

  return {
    key: signal.key,
    label,
    plan,
    run,
    difference,
  };
}

function buildStructureRow(
  group: WorkoutComparisonSegmentGroup,
): Omit<ComparisonRow, "key" | "label"> {
  if (group.status === "missing_actual") {
    return {
      plan: formatStructureValue(group.plannedStepCount, group.plannedDurationMin),
      run: "Unavailable",
      difference: "Run data unavailable",
    };
  }

  if (group.status === "not_applicable") {
    return {
      plan: formatStructureValue(group.plannedStepCount, group.plannedDurationMin),
      run: formatStructureValue(group.actualStepCount, group.actualDurationMin),
      difference: "Not compared",
    };
  }

  const difference = formatStructuredDifference(group);
  return {
    plan: formatStructureValue(group.plannedStepCount, group.plannedDurationMin),
    run: formatStructureValue(group.actualStepCount, group.actualDurationMin),
    difference,
  };
}

function formatSignalDifference(signal: WorkoutComparisonSignal) {
  if (signal.key === "activity_type") {
    return signal.status === "matched" ? "Matched activity" : "Different activity";
  }

  if (signal.key === "date_alignment") {
    if (signal.delta === 0) {
      return "Same day";
    }

    const days = typeof signal.delta === "number" ? Math.abs(signal.delta) : null;
    const direction = signal.delta != null && signal.delta > 0 ? "Later" : "Earlier";
    const value =
      days == null ? direction : `${days} day${days === 1 ? "" : "s"} ${direction.toLowerCase()}`;
    return value;
  }

  if (signal.key === "structured_step_count") {
    const status =
      signal.status === "matched"
        ? "Matched structure"
        : signal.status === "partial"
          ? "Partly matched"
          : "Different structure";
    return appendSignedAmount(status, signal);
  }

  if (signal.status === "matched") {
    return appendSignedAmount("Within plan", signal);
  }

  const direction =
    typeof signal.delta === "number" && signal.delta < 0 ? "Below plan" : "Above plan";
  return appendSignedAmount(direction, signal);
}

function formatStructuredDifference(group: WorkoutComparisonSegmentGroup) {
  const status =
    group.status === "matched"
      ? "Matched structure"
      : group.status === "partial"
        ? "Partly matched"
        : "Different structure";
  const delta = formatSignedDuration(group.durationDeltaMin);

  return delta ? `${delta} · ${status}` : status;
}

function appendSignedAmount(status: string, signal: WorkoutComparisonSignal) {
  const delta = formatSignedValue(signal.delta, signal.unit);
  return delta ? `${delta} · ${status}` : status;
}

function formatSignalValue(
  value: WorkoutComparisonSignal["plannedValue"],
  unit: WorkoutComparisonSignal["unit"],
  side: "plan" | "run",
) {
  if (value == null || value === "") {
    return side === "plan" ? "—" : "Unavailable";
  }

  if (unit === "date" && typeof value === "string") {
    return formatDateValue(value);
  }

  if (unit === "km" && typeof value === "number") {
    return formatKilometres(value);
  }

  if (unit === "min" && typeof value === "number") {
    return formatDurationMin(value);
  }

  return humanizeValue(String(value));
}

function formatStructureValue(stepCount: number, durationMin: number | null) {
  const stepLabel = `${stepCount} step${stepCount === 1 ? "" : "s"}`;
  return durationMin == null ? stepLabel : `${stepLabel} · ${formatDurationMin(durationMin)}`;
}

function formatSignedValue(
  value: number | null | undefined,
  unit: WorkoutComparisonSignal["unit"],
) {
  if (typeof value !== "number" || !Number.isFinite(value) || value === 0) {
    return null;
  }

  const sign = value > 0 ? "+" : "−";
  const magnitude = Math.abs(value);

  if (unit === "min") {
    return `${sign}${magnitude.toFixed(1)} min`;
  }

  if (unit === "km") {
    return `${sign}${magnitude.toFixed(2)} km`;
  }

  if (unit === "count") {
    return `${sign}${magnitude}`;
  }

  return null;
}

function formatSignedDuration(value: number | null) {
  return formatSignedValue(value, "min");
}

function buildComparisonDetailLines(
  comparison: WorkoutComparisonSummary,
  payload: WorkoutComparisonDifferencePayload | null,
) {
  const signals = getComparisonSignals(comparison);
  const supportItems = getSupportItems(payload);
  const coverage = getComparisonCoverageMeta(comparison);
  const details = [
    `Coverage: ${coverage.label}.`,
    `Confidence: ${Math.round(comparison.comparisonConfidence * 100)}%.`,
    `Checks available: ${payload?.summary.comparedSignalCount ?? signals.length} of ${payload?.summary.visibleSignalCount ?? signals.length}.`,
  ];

  const reasons = signals
    .filter(
      (signal) =>
        signal.reason && (signal.status === "missing_actual" || signal.status === "not_applicable"),
    )
    .map((signal) => `${humanizeSignalLabel(signal)}: ${signal.reason}`);
  const unsupported = supportItems
    .filter((item) => item.status === "unsupported")
    .map((item) => humanizeSupportSignalLabel(item));
  const tolerance = signals.find(
    (signal) =>
      typeof signal.matchedTolerancePct === "number" &&
      typeof signal.partialTolerancePct === "number",
  );

  if (unsupported.length > 0) {
    details.push(`Not comparable in this upload: ${formatInlineList(unsupported)}.`);
  }

  if (tolerance?.matchedTolerancePct != null && tolerance.partialTolerancePct != null) {
    details.push(
      `Duration and distance use the backend thresholds: within ${Math.round(tolerance.matchedTolerancePct * 100)}%, partial through ${Math.round(tolerance.partialTolerancePct * 100)}%.`,
    );
  }

  return [...details, ...reasons];
}

function getStructureGroups(payload: WorkoutComparisonDifferencePayload | null) {
  const summary = payload?.segmentSummary;

  return summary?.status === "available" && Array.isArray(summary.groups)
    ? summary.groups.filter(
        (group) =>
          group.plannedStepCount > 0 ||
          group.actualStepCount > 0 ||
          group.plannedDurationMin != null ||
          group.actualDurationMin != null,
      )
    : [];
}

function getSupportItems(payload: WorkoutComparisonDifferencePayload | null) {
  const items = payload?.supportMatrix?.signals;
  return Array.isArray(items) ? items.filter(isSupportItem) : [];
}

function getComparisonPayload(
  comparison: WorkoutComparisonSummary,
): WorkoutComparisonDifferencePayload | null {
  const payload = comparison.differencePayload;
  return payload && typeof payload === "object" && !Array.isArray(payload) ? payload : null;
}

function getComparisonSignals(comparison: WorkoutComparisonSummary) {
  const payload = getComparisonPayload(comparison);
  return Array.isArray(payload?.signals) ? payload.signals.filter(isComparisonSignal) : [];
}

function isComparisonSignal(value: unknown): value is WorkoutComparisonSignal {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof (value as Record<string, unknown>).key === "string" &&
    typeof (value as Record<string, unknown>).status === "string",
  );
}

function isSupportItem(value: unknown): value is WorkoutComparisonSupportItem {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof (value as Record<string, unknown>).key === "string" &&
    typeof (value as Record<string, unknown>).status === "string",
  );
}

function humanizeSignalLabel(signal: WorkoutComparisonSignal) {
  if (signal.key === "activity_type") {
    return "Activity";
  }

  if (signal.key === "date_alignment") {
    return "Workout day";
  }

  if (signal.key === "duration") {
    return "Duration";
  }

  if (signal.key === "distance") {
    return "Distance";
  }

  if (signal.key === "structured_step_count") {
    return "Workout structure";
  }

  return signal.label;
}

function humanizeSupportSignalLabel(item: WorkoutComparisonSupportItem) {
  switch (item.key) {
    case "date_alignment":
      return "workout day";
    case "structured_step_count":
      return "workout structure";
    case "step_duration":
      return "step timing";
    case "segment_group_duration":
      return "workout sections";
    case "heart_rate":
      return "heart rate";
    default:
      return item.label.trim() || item.key.replace(/_/g, " ");
  }
}

function formatDateValue(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? formatDate(value, { month: "short", day: "numeric" })
    : value;
}

function formatKilometres(value: number) {
  return `${value.toFixed(2)} km`;
}

function formatWholeNumber(value: number, unit: string) {
  return `${Math.round(value)} ${unit}`;
}

function humanizeValue(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatInlineList(items: string[]) {
  const uniqueItems = Array.from(new Set(items));

  if (uniqueItems.length <= 1) {
    return uniqueItems[0] ?? "";
  }

  if (uniqueItems.length === 2) {
    return `${uniqueItems[0]} and ${uniqueItems[1]}`;
  }

  return `${uniqueItems.slice(0, -1).join(", ")}, and ${uniqueItems.at(-1)}`;
}

function notNull<T>(value: T | null): value is T {
  return value != null;
}

export function hasPrimaryMatchedVerdict(comparison: WorkoutComparisonSummary | null) {
  return Boolean(
    comparison &&
    comparison.completionState === "matched" &&
    comparison.comparisonStatus !== "insufficient_data",
  );
}
