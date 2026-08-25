/* eslint-disable react-refresh/only-export-components */
import { formatDurationMin } from "@/lib/training";
import { Icon } from "@/components/ui/icon";
import { useHitoProductMessage, useHitoUiLocale } from "@/components/ui/hito-ui-locale-provider";
import {
  DEFAULT_RESOLVED_UI_LOCALE,
  formatUiDate,
  formatUiNumber,
  type ResolvedUiLocale,
} from "@/lib/ui-locale";
import { formatHitoProductMessage, getHitoKnownProductMessage } from "@/lib/ui-locale-messages";
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
  const locale = useHitoUiLocale();
  const t = useHitoProductMessage();
  const payload = getComparisonPayload(comparison);
  const rows = buildPlanRunDifferenceRows(comparison, locale);
  const structureGroups = getStructureGroups(payload);
  const detailLines = buildComparisonDetailLines(comparison, payload, locale);

  return (
    <div className="mt-4 space-y-4">
      <ComparisonRowGroup rows={rows} locale={locale} />

      {structureGroups.length > 0 ? (
        <details className="hito-disclosure">
          <summary className="hito-disclosure-summary">
            <span className="hito-label-md text-foreground">{t("Workout structure")}</span>
            <Icon name="chevron-down" size="xs" className="hito-disclosure-chevron" />
          </summary>
          <div className="hito-disclosure-body">
            <StructureReadback groups={structureGroups} locale={locale} />
          </div>
        </details>
      ) : null}

      {detailLines.length > 0 ? (
        <details className="hito-disclosure">
          <summary className="hito-disclosure-summary">
            <span className="hito-label-md text-foreground">{t("Comparison details")}</span>
            <Icon name="chevron-down" size="xs" className="hito-disclosure-chevron" />
          </summary>
          <div className="hito-disclosure-body">
            {detailLines.map((line) => (
              <p key={line} className="hito-body-sm text-secondary">
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
  const locale = useHitoUiLocale();
  const t = useHitoProductMessage();
  const rows = [
    actual.activityLocalDate
      ? { label: t("Workout day"), value: formatDateValue(actual.activityLocalDate, locale) }
      : null,
    actual.actualDurationMin != null
      ? { label: t("Duration"), value: formatDurationMin(actual.actualDurationMin) }
      : null,
    actual.actualDistanceKm != null
      ? { label: t("Distance"), value: formatKilometres(actual.actualDistanceKm, locale) }
      : null,
    actual.actualElevationGainM != null
      ? {
          label: t("Elevation gain"),
          value: formatWholeNumber(actual.actualElevationGainM, "m", locale),
        }
      : null,
    actual.actualElevationLossM != null
      ? {
          label: t("Elevation loss"),
          value: formatWholeNumber(actual.actualElevationLossM, "m", locale),
        }
      : null,
    actual.actualAvgHr != null
      ? {
          label: t("Average heart rate"),
          value: formatWholeNumber(actual.actualAvgHr, "bpm", locale),
        }
      : null,
    actual.actualMaxHr != null
      ? {
          label: t("Maximum heart rate"),
          value: formatWholeNumber(actual.actualMaxHr, "bpm", locale),
        }
      : null,
    actual.actualAvgPower != null
      ? {
          label: t("Average power"),
          value: formatWholeNumber(actual.actualAvgPower, "W", locale),
        }
      : null,
    actual.actualMaxPower != null
      ? {
          label: t("Maximum power"),
          value: formatWholeNumber(actual.actualMaxPower, "W", locale),
        }
      : null,
    actual.actualAvgCadence != null
      ? {
          label: t("Average cadence"),
          value: formatWholeNumber(actual.actualAvgCadence, "spm", locale),
        }
      : null,
    actual.actualCalories != null
      ? {
          label: t("Calories"),
          value: formatWholeNumber(actual.actualCalories, "kcal", locale),
        }
      : null,
    actual.actualIntervalCount != null
      ? {
          label: t("Structured intervals"),
          value: t(actual.actualIntervalCount === 1 ? "{count} interval" : "{count} intervals", {
            count: formatUiNumber(actual.actualIntervalCount, locale),
          }),
        }
      : null,
  ].filter(notNull);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="hito-ui-title-xs text-foreground">{t("Observed run")}</h3>
        {!comparisonAvailable ? (
          <span className="hito-status-pill" data-tone="muted">
            {t("Comparison unavailable")}
          </span>
        ) : null}
      </div>
      {rows.length > 0 ? (
        <dl className="hito-row-group">
          {rows.map((row) => (
            <div key={row.label} className="hito-list-row">
              <dt className="hito-body-md text-foreground">{row.label}</dt>
              <dd className="hito-technical-sm text-secondary text-right">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {!comparisonAvailable ? (
        <p className="hito-body-sm text-secondary">
          {t("The activity was captured, but no plan comparison is available.")}
        </p>
      ) : null}
    </div>
  );
}

export function getComparisonCoverageMeta(
  comparison: WorkoutComparisonSummary,
  locale: ResolvedUiLocale = DEFAULT_RESOLVED_UI_LOCALE,
): {
  label: string;
  tone: "muted" | "signal" | "warning";
} {
  switch (comparison.comparisonStatus) {
    case "complete":
      return { label: getHitoKnownProductMessage(locale, "Complete comparison"), tone: "signal" };
    case "partial":
      return { label: getHitoKnownProductMessage(locale, "Partial comparison"), tone: "warning" };
    default:
      return { label: getHitoKnownProductMessage(locale, "Limited comparison"), tone: "muted" };
  }
}

export function buildPlanRunDifferenceRows(
  comparison: WorkoutComparisonSummary,
  locale: ResolvedUiLocale = DEFAULT_RESOLVED_UI_LOCALE,
): ComparisonRow[] {
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

    return [buildComparisonRow(signal, locale)];
  });
}

function ComparisonRowGroup({ rows, locale }: { rows: ComparisonRow[]; locale: ResolvedUiLocale }) {
  const copy = (value: string) => getHitoKnownProductMessage(locale, value);
  return (
    <dl className="hito-row-group">
      <div
        aria-hidden="true"
        className="hidden grid-cols-[minmax(7rem,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)] gap-4 px-4 py-3 sm:grid"
      >
        <div className="hito-body-xs text-tertiary">{copy("Metric")}</div>
        <div className="hito-body-xs text-tertiary">{copy("Plan")}</div>
        <div className="hito-body-xs text-tertiary">{copy("Run")}</div>
        <div className="hito-body-xs text-tertiary">{copy("Difference")}</div>
      </div>
      {rows.map((row) => (
        <div
          key={row.key}
          className="hito-list-row block min-w-0 sm:grid sm:grid-cols-[minmax(7rem,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)] sm:items-start sm:gap-4"
        >
          <dt className="min-w-0">
            <span className="hito-body-md text-foreground">{row.label}</span>
          </dt>
          <ComparisonValue metric={row.label} label={copy("Plan")} value={row.plan} />
          <ComparisonValue metric={row.label} label={copy("Run")} value={row.run} />
          <ComparisonValue metric={row.label} label={copy("Difference")} value={row.difference} />
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
      <span aria-hidden="true" className="hito-body-xs text-tertiary sm:hidden">
        {label}
      </span>
      <p className="hito-technical-sm text-secondary mt-1 break-words sm:mt-0">{value}</p>
    </dd>
  );
}

function StructureReadback({
  groups,
  locale,
}: {
  groups: WorkoutComparisonSegmentGroup[];
  locale: ResolvedUiLocale;
}) {
  const copy = (value: string) => getHitoKnownProductMessage(locale, value);
  return (
    <dl className="hito-row-group">
      <div
        aria-hidden="true"
        className="hidden grid-cols-[minmax(7rem,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)] gap-4 px-4 py-3 sm:grid"
      >
        <div className="hito-body-xs text-tertiary">{copy("Section")}</div>
        <div className="hito-body-xs text-tertiary">{copy("Plan")}</div>
        <div className="hito-body-xs text-tertiary">{copy("Run")}</div>
        <div className="hito-body-xs text-tertiary">{copy("Difference")}</div>
      </div>
      {groups.map((group) => {
        const row = buildStructureRow(group, locale);

        return (
          <div
            key={group.key}
            className="hito-list-row block min-w-0 sm:grid sm:grid-cols-[minmax(7rem,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)] sm:items-start sm:gap-4"
          >
            <dt className="min-w-0">
              <span className="hito-body-md text-foreground">{group.label}</span>
            </dt>
            <ComparisonValue metric={group.label} label={copy("Plan")} value={row.plan} />
            <ComparisonValue metric={group.label} label={copy("Run")} value={row.run} />
            <ComparisonValue
              metric={group.label}
              label={copy("Difference")}
              value={row.difference}
            />
          </div>
        );
      })}
    </dl>
  );
}

function buildComparisonRow(
  signal: WorkoutComparisonSignal,
  locale: ResolvedUiLocale,
): ComparisonRow {
  const copy = (value: string) => getHitoKnownProductMessage(locale, value);
  const label = humanizeSignalLabel(signal, locale);
  const plan = formatSignalValue(signal.plannedValue, signal.unit, "plan", locale);
  const run = formatSignalValue(signal.actualValue, signal.unit, "run", locale);

  if (signal.status === "missing_actual") {
    return {
      key: signal.key,
      label,
      plan,
      run: copy("Unavailable"),
      difference: copy("Run data unavailable"),
    };
  }

  if (signal.status === "not_applicable") {
    return {
      key: signal.key,
      label,
      plan: signal.key === "distance" ? copy("No target") : plan,
      run,
      difference: copy("Not compared"),
    };
  }

  const difference = formatSignalDifference(signal, locale);

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
  locale: ResolvedUiLocale,
): Omit<ComparisonRow, "key" | "label"> {
  const copy = (value: string) => getHitoKnownProductMessage(locale, value);
  if (group.status === "missing_actual") {
    return {
      plan: formatStructureValue(group.plannedStepCount, group.plannedDurationMin, locale),
      run: copy("Unavailable"),
      difference: copy("Run data unavailable"),
    };
  }

  if (group.status === "not_applicable") {
    return {
      plan: formatStructureValue(group.plannedStepCount, group.plannedDurationMin, locale),
      run: formatStructureValue(group.actualStepCount, group.actualDurationMin, locale),
      difference: copy("Not compared"),
    };
  }

  const difference = formatStructuredDifference(group, locale);
  return {
    plan: formatStructureValue(group.plannedStepCount, group.plannedDurationMin, locale),
    run: formatStructureValue(group.actualStepCount, group.actualDurationMin, locale),
    difference,
  };
}

function formatSignalDifference(signal: WorkoutComparisonSignal, locale: ResolvedUiLocale) {
  const copy = (value: string) => getHitoKnownProductMessage(locale, value);
  if (signal.key === "activity_type") {
    return signal.status === "matched" ? copy("Matched activity") : copy("Different activity");
  }

  if (signal.key === "date_alignment") {
    if (signal.delta === 0) {
      return copy("Same day");
    }

    const days = typeof signal.delta === "number" ? Math.abs(signal.delta) : null;
    const later = signal.delta != null && signal.delta > 0;
    const direction = copy(later ? "Later" : "Earlier");
    const value =
      days == null
        ? direction
        : formatHitoProductMessage(
            locale,
            days === 1
              ? later
                ? "{count} day later"
                : "{count} day earlier"
              : later
                ? "{count} days later"
                : "{count} days earlier",
            { count: formatUiNumber(days, locale) },
          );
    return value;
  }

  if (signal.key === "structured_step_count") {
    const status =
      signal.status === "matched"
        ? copy("Matched structure")
        : signal.status === "partial"
          ? copy("Partly matched")
          : copy("Different structure");
    return appendSignedAmount(status, signal, locale);
  }

  if (signal.status === "matched") {
    return appendSignedAmount(copy("Within plan"), signal, locale);
  }

  const direction = copy(
    typeof signal.delta === "number" && signal.delta < 0 ? "Below plan" : "Above plan",
  );
  return appendSignedAmount(direction, signal, locale);
}

function formatStructuredDifference(
  group: WorkoutComparisonSegmentGroup,
  locale: ResolvedUiLocale,
) {
  const copy = (value: string) => getHitoKnownProductMessage(locale, value);
  const status =
    group.status === "matched"
      ? copy("Matched structure")
      : group.status === "partial"
        ? copy("Partly matched")
        : copy("Different structure");
  const delta = formatSignedDuration(group.durationDeltaMin, locale);

  return delta ? `${delta} · ${status}` : status;
}

function appendSignedAmount(
  status: string,
  signal: WorkoutComparisonSignal,
  locale: ResolvedUiLocale,
) {
  const delta = formatSignedValue(signal.delta, signal.unit, locale);
  return delta ? `${delta} · ${status}` : status;
}

function formatSignalValue(
  value: WorkoutComparisonSignal["plannedValue"],
  unit: WorkoutComparisonSignal["unit"],
  side: "plan" | "run",
  locale: ResolvedUiLocale,
) {
  if (value == null || value === "") {
    return side === "plan" ? "—" : getHitoKnownProductMessage(locale, "Unavailable");
  }

  if (unit === "date" && typeof value === "string") {
    return formatDateValue(value, locale);
  }

  if (unit === "km" && typeof value === "number") {
    return formatKilometres(value, locale);
  }

  if (unit === "min" && typeof value === "number") {
    return formatDurationMin(value);
  }

  return getHitoKnownProductMessage(locale, humanizeValue(String(value)));
}

function formatStructureValue(
  stepCount: number,
  durationMin: number | null,
  locale: ResolvedUiLocale,
) {
  const stepLabel = formatHitoProductMessage(
    locale,
    stepCount === 1 ? "{count} step" : "{count} steps",
    { count: formatUiNumber(stepCount, locale) },
  );
  return durationMin == null ? stepLabel : `${stepLabel} · ${formatDurationMin(durationMin)}`;
}

function formatSignedValue(
  value: number | null | undefined,
  unit: WorkoutComparisonSignal["unit"],
  locale: ResolvedUiLocale,
) {
  if (typeof value !== "number" || !Number.isFinite(value) || value === 0) {
    return null;
  }

  const sign = value > 0 ? "+" : "−";
  const magnitude = Math.abs(value);

  if (unit === "min") {
    return `${sign}${formatUiNumber(magnitude, locale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })} min`;
  }

  if (unit === "km") {
    return `${sign}${formatUiNumber(magnitude, locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} km`;
  }

  if (unit === "count") {
    return `${sign}${formatUiNumber(magnitude, locale)}`;
  }

  return null;
}

function formatSignedDuration(value: number | null, locale: ResolvedUiLocale) {
  return formatSignedValue(value, "min", locale);
}

function buildComparisonDetailLines(
  comparison: WorkoutComparisonSummary,
  payload: WorkoutComparisonDifferencePayload | null,
  locale: ResolvedUiLocale,
) {
  const signals = getComparisonSignals(comparison);
  const supportItems = getSupportItems(payload);
  const coverage = getComparisonCoverageMeta(comparison, locale);
  const details = [
    formatHitoProductMessage(locale, "Coverage: {coverage}.", { coverage: coverage.label }),
    formatHitoProductMessage(locale, "Confidence: {confidence}%.", {
      confidence: formatUiNumber(Math.round(comparison.comparisonConfidence * 100), locale),
    }),
    formatHitoProductMessage(locale, "Checks available: {available} of {visible}.", {
      available: formatUiNumber(payload?.summary.comparedSignalCount ?? signals.length, locale),
      visible: formatUiNumber(payload?.summary.visibleSignalCount ?? signals.length, locale),
    }),
  ];

  const reasons = signals
    .filter(
      (signal) =>
        signal.reason && (signal.status === "missing_actual" || signal.status === "not_applicable"),
    )
    .map(
      (signal) =>
        `${humanizeSignalLabel(signal, locale)}: ${getHitoKnownProductMessage(
          locale,
          signal.reason ?? "",
        )}`,
    );
  const unsupported = supportItems
    .filter((item) => item.status === "unsupported")
    .map((item) => humanizeSupportSignalLabel(item, locale));
  const tolerance = signals.find(
    (signal) =>
      typeof signal.matchedTolerancePct === "number" &&
      typeof signal.partialTolerancePct === "number",
  );

  if (unsupported.length > 0) {
    details.push(
      formatHitoProductMessage(locale, "Not comparable in this upload: {items}.", {
        items: formatInlineList(unsupported, locale),
      }),
    );
  }

  if (tolerance?.matchedTolerancePct != null && tolerance.partialTolerancePct != null) {
    details.push(
      formatHitoProductMessage(
        locale,
        "Duration and distance use the backend thresholds: within {matched}%, partial through {partial}%.",
        {
          matched: formatUiNumber(Math.round(tolerance.matchedTolerancePct * 100), locale),
          partial: formatUiNumber(Math.round(tolerance.partialTolerancePct * 100), locale),
        },
      ),
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

function humanizeSignalLabel(signal: WorkoutComparisonSignal, locale: ResolvedUiLocale) {
  if (signal.key === "activity_type") {
    return getHitoKnownProductMessage(locale, "Activity");
  }

  if (signal.key === "date_alignment") {
    return getHitoKnownProductMessage(locale, "Workout day");
  }

  if (signal.key === "duration") {
    return getHitoKnownProductMessage(locale, "Duration");
  }

  if (signal.key === "distance") {
    return getHitoKnownProductMessage(locale, "Distance");
  }

  if (signal.key === "structured_step_count") {
    return getHitoKnownProductMessage(locale, "Workout structure");
  }

  return getHitoKnownProductMessage(locale, signal.label);
}

function humanizeSupportSignalLabel(item: WorkoutComparisonSupportItem, locale: ResolvedUiLocale) {
  const copy = (value: string) => getHitoKnownProductMessage(locale, value);
  switch (item.key) {
    case "date_alignment":
      return copy("workout day");
    case "structured_step_count":
      return copy("workout structure");
    case "step_duration":
      return copy("step timing");
    case "segment_group_duration":
      return copy("workout sections");
    case "heart_rate":
      return copy("heart rate");
    default:
      return item.label.trim() || item.key.replace(/_/g, " ");
  }
}

function formatDateValue(value: string, locale: ResolvedUiLocale) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? formatUiDate(value, locale, { month: "short", day: "numeric" })
    : value;
}

function formatKilometres(value: number, locale: ResolvedUiLocale) {
  return `${formatUiNumber(value, locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} km`;
}

function formatWholeNumber(value: number, unit: string, locale: ResolvedUiLocale) {
  return `${formatUiNumber(Math.round(value), locale)} ${unit}`;
}

function humanizeValue(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatInlineList(items: string[], locale: ResolvedUiLocale) {
  const uniqueItems = Array.from(new Set(items));
  return new Intl.ListFormat(locale === "pt-BR" ? "pt-BR" : "en-US", {
    style: "long",
    type: "conjunction",
  }).format(uniqueItems);
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
