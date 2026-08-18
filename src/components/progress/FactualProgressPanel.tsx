import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { HitoButton } from "@/components/ui/button";
import { HitoChoiceToggle } from "@/components/ui/hito-choice-toggle";
import { HitoDateField } from "@/components/ui/hito-date-time-input";
import { isHitoIsoDate } from "@/components/ui/hito-date-time-utils";
import { HitoFactualActivityPointSequence } from "@/components/ui/hito-factual-activity-point-sequence";
import { HitoFactualBarChart } from "@/components/ui/hito-factual-bar-chart";
import { useHitoRadioGroup } from "@/components/ui/hito-radio-group";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  RunnerActivityProgressProductAdvancedMetrics,
  RunnerActivityProgressProductFactMetric,
  RunnerActivityFitSequenceProductModel,
  RunnerActivityProgressProductModel,
  RunnerActivityProgressProductRecord,
  RunnerActivityProgressProductSessionLoadWindow,
  RunnerActivityProgressProductSnapshot,
} from "@/lib/runner-activity/product-contract";
import type {
  RunnerActivityFitChartMetricId,
  RunnerActivityFitSequenceMetricId,
  RunnerActivityFitSequenceQuickPeriodId,
} from "@/lib/runner-activity/read-model-types";
import { formatDate } from "@/lib/training";
import type { ProgressSequenceSelection, ProgressState } from "./runner-activity-progress-types";
import {
  PROGRESS_FACTS,
  advancedConfidenceLabel,
  advancedUnavailableReasonLabel,
  confidenceLabel,
  formatAdvancedWindow,
  formatFact,
  formatRecordContext,
  formatRecordTime,
  formatRollingSummary,
  formatSessionLoad,
  formatWindow,
  missingReasonLabel,
  recordClassLabel,
  recordConfidenceLabel,
  recordDistanceLabel,
  type ProgressFactKey,
} from "./runner-activity-progress-view-model";

const PROGRESS_WEEKLY_METRICS = [
  { id: "sessions", label: "Runs" },
  { id: "running_time", label: "Running time" },
  { id: "distance", label: "Distance" },
  { id: "elevation", label: "Elevation" },
  { id: "reported_load", label: "Reported load" },
] satisfies Array<{ id: RunnerActivityFitChartMetricId; label: string }>;

export function FactualProgressPanel({
  state,
  onRetry,
  onSequenceSelectionChange,
  sequenceSelection,
}: {
  state: ProgressState;
  onRetry: () => void;
  onSequenceSelectionChange: (selection: ProgressSequenceSelection) => void;
  sequenceSelection: ProgressSequenceSelection;
}) {
  const [weeklyMetric, setWeeklyMetric] = useState<RunnerActivityFitChartMetricId>("distance");

  return (
    <section aria-labelledby="factual-progress-title">
      <header className="hito-page-header">
        <p className="hito-label-md text-foreground">Comparable evidence</p>
        <h1 id="factual-progress-title" className="hito-ui-title-xl mt-2 max-w-[44rem]">
          Progress
        </h1>
        <p className="hito-body-md mt-4 max-w-[40rem] text-secondary">
          Recorded running facts, current records, and your reported training load.
        </p>
      </header>

      {state.status === "loading" || state.status === "idle" ? <ProgressSkeleton /> : null}
      {state.status === "error" ? <ProgressError message={state.error} onRetry={onRetry} /> : null}
      {state.status === "updating" ? (
        <div className="hito-state-surface" data-tone="signal" role="status" aria-live="polite">
          <p className="hito-label-md text-foreground">Updating</p>
          <h2 className="hito-ui-title-sm text-foreground mt-2">
            Your activity facts are being refreshed.
          </h2>
          <p className="hito-body-md text-secondary mt-2">
            Current values will return when the backend snapshot is ready.
          </p>
          <div className="hito-state-actions">
            <HitoButton type="button" size="md" variant="secondary" onClick={onRetry}>
              <Icon name="refresh" size="sm" />
              Check again
            </HitoButton>
          </div>
        </div>
      ) : null}
      {state.status === "ready" ? (
        <ProgressReadback
          progress={state.data}
          sequenceSelection={sequenceSelection}
          weeklyMetric={weeklyMetric}
          onRetry={onRetry}
          onSequenceSelectionChange={onSequenceSelectionChange}
          onWeeklyMetricChange={setWeeklyMetric}
        />
      ) : null}
    </section>
  );
}

function ProgressReadback({
  onRetry,
  onSequenceSelectionChange,
  progress,
  sequenceSelection,
  weeklyMetric,
  onWeeklyMetricChange,
}: {
  onRetry: () => void;
  onSequenceSelectionChange: (selection: ProgressSequenceSelection) => void;
  onWeeklyMetricChange: (metric: RunnerActivityFitChartMetricId) => void;
  progress: RunnerActivityProgressProductModel;
  sequenceSelection: ProgressSequenceSelection;
  weeklyMetric: RunnerActivityFitChartMetricId;
}) {
  const current = progress.rolling28Day.current;
  const previous = progress.rolling28Day.previous;
  const summary = formatRollingSummary(current);
  const visibleFacts = PROGRESS_FACTS.filter(
    ({ key }) =>
      current.facts[key].availability === "available" ||
      previous.facts[key].availability === "available",
  );
  const weeklyMetricGroup = useHitoRadioGroup({
    idPrefix: "progress-weekly-metric",
    items: PROGRESS_WEEKLY_METRICS.map(({ id }) => ({ value: id })),
    value: weeklyMetric,
  });
  const weeklyPeriod =
    progress.fitProgress.status === "current"
      ? progress.fitProgress.chart.advertisedPeriods[0]
      : null;
  const weeklySeries = weeklyPeriod?.series.find((series) => series.id === weeklyMetric) ?? null;

  return (
    <div className="space-y-8">
      <ActivitySequenceReadback
        asOfDate={progress.asOfDate}
        sequence={progress.fitActivitySequence}
        selection={sequenceSelection}
        onRetry={onRetry}
        onSelectionChange={onSequenceSelectionChange}
      />

      {summary ? (
        <>
          <section aria-labelledby="rolling-summary-title">
            <p className="hito-label-md text-foreground">Last 28 days</p>
            <h2
              id="rolling-summary-title"
              className="mt-3 font-sans text-3xl leading-tight sm:text-4xl"
            >
              {summary}
            </h2>
            <p className="hito-body-xs text-tertiary mt-2">
              {formatWindow(current)} · {current.eligibleActivityCount} recorded activities
            </p>
          </section>

          {weeklyPeriod && weeklySeries ? (
            <HitoFactualBarChart
              controls={{
                ariaLabel: "Weekly factual chart controls",
                content: (
                  <fieldset className="grid min-w-0 gap-2">
                    <legend className="hito-label-md text-foreground">Metric</legend>
                    <div
                      className="hito-choice-toggle-group"
                      {...weeklyMetricGroup.groupProps}
                      aria-label="Weekly factual chart metric"
                    >
                      {PROGRESS_WEEKLY_METRICS.map((metric) => (
                        <HitoChoiceToggle
                          key={metric.id}
                          size="sm"
                          {...weeklyMetricGroup.getRadioProps(metric.id)}
                          selected={weeklyMetric === metric.id}
                          onClick={() => onWeeklyMetricChange(metric.id)}
                        >
                          {metric.label}
                        </HitoChoiceToggle>
                      ))}
                    </div>
                  </fieldset>
                ),
              }}
              period={weeklyPeriod}
              series={weeklySeries}
            />
          ) : progress.fitProgress.status === "updating" ? (
            <div className="hito-state-surface" data-tone="signal" role="status">
              <p className="hito-label-md text-foreground">Updating weekly FIT progress</p>
              <p className="hito-body-md mt-2 text-secondary">
                Current weekly facts will return when the update is complete.
              </p>
            </div>
          ) : progress.fitProgress.status === "unavailable" ? (
            <div className="hito-state-surface" data-tone="warning" role="status">
              <p className="hito-label-md text-foreground">Weekly FIT progress unavailable</p>
              <p className="hito-body-md mt-2 text-secondary">
                This historical snapshot does not include the current weekly FIT series.
              </p>
            </div>
          ) : null}

          {visibleFacts.length > 0 ? (
            <section aria-labelledby="progress-facts-title">
              <div className="hito-section-header">
                <h2 id="progress-facts-title" className="hito-ui-title-sm text-foreground">
                  Running facts
                </h2>
                <span className="hito-label-sm uppercase tracking-[0.18em] text-tertiary">
                  Current and previous 28 days
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {visibleFacts.map(({ key, label }) => (
                  <ProgressFactDisclosure
                    key={key}
                    factKey={key}
                    label={label}
                    current={current}
                    previous={previous}
                  />
                ))}
              </div>
            </section>
          ) : null}

          <Gate4Readback advancedMetrics={progress.advancedMetrics} />

          {progress.calendarWeeks.length > 0 ? (
            <details className="hito-disclosure">
              <summary className="hito-disclosure-summary">
                <span>Weekly facts</span>
                <Icon name="chevron-down" size="xs" className="hito-disclosure-chevron" />
              </summary>
              <div className="hito-disclosure-body">
                <ul className="hito-row-group">
                  {progress.calendarWeeks.map((week) => (
                    <li
                      key={`${week.window.startDate}:${week.window.endDate}`}
                      className="hito-list-row !items-start"
                    >
                      <div>
                        <p className="hito-body-md text-foreground">{formatWindow(week)}</p>
                        <p className="hito-body-sm mt-1 text-secondary">
                          {formatRollingSummary(week) ?? "No recorded running facts"}
                        </p>
                      </div>
                      <span className="hito-body-xs text-tertiary shrink-0">Week</span>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          ) : null}
        </>
      ) : (
        <ProgressEmptyState />
      )}
    </div>
  );
}

const PROGRESS_SEQUENCE_METRICS = [
  { id: "distance", label: "Distance" },
  { id: "timer_duration", label: "Timer duration" },
  { id: "observed_average_pace", label: "Observed pace" },
  { id: "elevation_gain", label: "Elevation gain" },
  { id: "reported_load", label: "Reported load" },
] satisfies Array<{ id: RunnerActivityFitSequenceMetricId; label: string }>;

function ActivitySequenceReadback({
  asOfDate,
  onRetry,
  onSelectionChange,
  selection,
  sequence,
}: {
  asOfDate: string;
  onRetry: () => void;
  onSelectionChange: (selection: ProgressSequenceSelection) => void;
  selection: ProgressSequenceSelection;
  sequence: RunnerActivityFitSequenceProductModel;
}) {
  const [customOpen, setCustomOpen] = useState(selection.period === "custom");
  const [customStartDate, setCustomStartDate] = useState(
    selection.startDate ?? sequence.selectedPeriod.startDate,
  );
  const [customEndDate, setCustomEndDate] = useState(
    selection.endDate ?? sequence.selectedPeriod.endDate,
  );
  const [customErrors, setCustomErrors] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});
  const periodItems = [
    ...sequence.advertisedPeriods.map((period) => ({ value: period.id })),
    { value: "custom" as const },
  ];
  const periodGroup = useHitoRadioGroup({
    idPrefix: "progress-sequence-period",
    items: periodItems,
    value: customOpen ? "custom" : selection.period,
  });
  const metricGroup = useHitoRadioGroup({
    idPrefix: "progress-sequence-metric",
    items: PROGRESS_SEQUENCE_METRICS.map(({ id }) => ({ value: id })),
    value: selection.metric,
  });

  useEffect(() => {
    if (selection.period !== "custom") return;
    setCustomOpen(true);
    setCustomStartDate(selection.startDate ?? sequence.selectedPeriod.startDate);
    setCustomEndDate(selection.endDate ?? sequence.selectedPeriod.endDate);
    setCustomErrors({});
  }, [
    selection.endDate,
    selection.period,
    selection.startDate,
    sequence.selectedPeriod.endDate,
    sequence.selectedPeriod.startDate,
  ]);

  const selectQuickPeriod = (period: RunnerActivityFitSequenceQuickPeriodId) => {
    setCustomOpen(false);
    setCustomErrors({});
    onSelectionChange({
      period,
      metric: selection.metric,
      startDate: null,
      endDate: null,
    });
  };

  const applyCustomRange = () => {
    const nextErrors: { startDate?: string; endDate?: string } = {};
    if (!isHitoIsoDate(customStartDate)) {
      nextErrors.startDate = "Enter a valid start date in YYYY-MM-DD format.";
    }
    if (!isHitoIsoDate(customEndDate)) {
      nextErrors.endDate = "Enter a valid end date in YYYY-MM-DD format.";
    }
    if (!nextErrors.startDate && !nextErrors.endDate && customStartDate > customEndDate) {
      nextErrors.startDate = "Start date must be on or before the end date.";
    }
    if (!nextErrors.endDate && isHitoIsoDate(customEndDate) && customEndDate > asOfDate) {
      nextErrors.endDate = `End date cannot be after ${asOfDate}.`;
    }
    setCustomErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      window.requestAnimationFrame(() => {
        document
          .getElementById(
            nextErrors.startDate
              ? "activity-sequence-custom-start"
              : "activity-sequence-custom-end",
          )
          ?.focus();
      });
      return;
    }

    onSelectionChange({
      period: "custom",
      metric: selection.metric,
      startDate: customStartDate,
      endDate: customEndDate,
    });
  };

  return (
    <div
      id="factual-activity-sequence-title"
      tabIndex={-1}
      className="grid min-w-0 gap-6 border-b border-hairline pb-8 outline-none"
    >
      <HitoFactualActivityPointSequence
        controls={{
          ariaLabel: "Activity sequence controls",
          content: (
            <div className="grid min-w-0 gap-4">
              <fieldset className="grid min-w-0 gap-2">
                <legend className="hito-label-md text-foreground">Period</legend>
                <div
                  className="hito-choice-toggle-group"
                  {...periodGroup.groupProps}
                  aria-label="Activity sequence period"
                >
                  {sequence.advertisedPeriods.map((period) => (
                    <HitoChoiceToggle
                      key={period.id}
                      size="sm"
                      {...periodGroup.getRadioProps(period.id)}
                      selected={!customOpen && selection.period === period.id}
                      data-progress-sequence-period={period.id}
                      onClick={() => {
                        if (period.id === "custom") {
                          setCustomOpen(true);
                          setCustomErrors({});
                          return;
                        }
                        selectQuickPeriod(period.id);
                      }}
                    >
                      {period.label}
                    </HitoChoiceToggle>
                  ))}
                  <HitoChoiceToggle
                    size="sm"
                    {...periodGroup.getRadioProps("custom")}
                    selected={customOpen}
                    data-progress-sequence-period="custom"
                    aria-expanded={customOpen}
                    aria-controls="activity-sequence-custom-panel"
                    onClick={() => {
                      setCustomOpen(true);
                      setCustomErrors({});
                    }}
                  >
                    <Icon name="calendar" size="sm" />
                    Custom
                  </HitoChoiceToggle>
                </div>
              </fieldset>

              {customOpen ? (
                <div
                  id="activity-sequence-custom-panel"
                  className="hito-state-surface grid min-w-0 gap-4"
                  data-tone="neutral"
                >
                  <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                    <HitoDateField
                      id="activity-sequence-custom-start"
                      label="Start date"
                      value={customStartDate}
                      maxDate={asOfDate}
                      error={customErrors.startDate}
                      onChange={(value) => {
                        setCustomStartDate(value);
                        setCustomErrors((current) => ({ ...current, startDate: undefined }));
                      }}
                    />
                    <HitoDateField
                      id="activity-sequence-custom-end"
                      label="End date"
                      value={customEndDate}
                      maxDate={asOfDate}
                      error={customErrors.endDate}
                      onChange={(value) => {
                        setCustomEndDate(value);
                        setCustomErrors((current) => ({ ...current, endDate: undefined }));
                      }}
                    />
                  </div>
                  <div>
                    <HitoButton
                      id="activity-sequence-custom-apply"
                      type="button"
                      size="md"
                      variant="secondary"
                      onClick={applyCustomRange}
                    >
                      Apply dates
                    </HitoButton>
                  </div>
                </div>
              ) : null}

              <fieldset className="grid min-w-0 gap-2">
                <legend className="hito-label-md text-foreground">Metric</legend>
                <div
                  className="hito-choice-toggle-group"
                  {...metricGroup.groupProps}
                  aria-label="Activity sequence metric"
                >
                  {PROGRESS_SEQUENCE_METRICS.map((metric) => (
                    <HitoChoiceToggle
                      key={metric.id}
                      size="sm"
                      {...metricGroup.getRadioProps(metric.id)}
                      selected={selection.metric === metric.id}
                      onClick={() =>
                        onSelectionChange({
                          ...selection,
                          metric: metric.id,
                        })
                      }
                    >
                      {metric.label}
                    </HitoChoiceToggle>
                  ))}
                </div>
              </fieldset>
            </div>
          ),
        }}
        metricId={selection.metric}
        sequence={sequence}
        stateAction={
          sequence.status === "updating" || sequence.status === "unavailable" ? (
            <HitoButton
              id="activity-sequence-retry-action"
              type="button"
              size="md"
              variant="secondary"
              onClick={onRetry}
            >
              <Icon name="refresh" size="sm" />
              Check again
            </HitoButton>
          ) : undefined
        }
      />
    </div>
  );
}

function Gate4Readback({
  advancedMetrics,
}: {
  advancedMetrics: RunnerActivityProgressProductAdvancedMetrics;
}) {
  if (advancedMetrics.status === "updating") {
    return (
      <section
        className="hito-state-surface"
        data-tone="signal"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-labelledby="activity-intelligence-updating-title"
      >
        <p className="hito-label-md text-foreground">Updating records and reported load</p>
        <h2
          id="activity-intelligence-updating-title"
          className="hito-ui-title-sm text-foreground mt-2"
        >
          A recent activity change is being applied.
        </h2>
        <p className="hito-body-md text-secondary mt-2">
          Current record and load values will return when the update is complete.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="activity-intelligence-title"
      className="border-t border-hairline pt-8"
    >
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Records and reported training load are current.
      </p>
      <div className="hito-section-header">
        <div>
          <h2 id="activity-intelligence-title" className="hito-ui-title-sm text-foreground">
            Records and reported load
          </h2>
          <p className="hito-label-sm uppercase tracking-[0.18em] text-tertiary">
            {advancedMetrics.historical ? "Historical" : "Current"} · Based on activity evidence
            through {formatDate(advancedMetrics.asOfDate)}.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-8">
        <RecordsReadback metrics={advancedMetrics} />
        <SessionLoadReadback metrics={advancedMetrics} />
        <Gate5UnavailableReadback metrics={advancedMetrics} />
      </div>
    </section>
  );
}

function RecordsReadback({
  metrics,
}: {
  metrics: Extract<RunnerActivityProgressProductAdvancedMetrics, { status: "current" }>;
}) {
  const unavailableReasons = [...new Set(metrics.records.unavailableReasons)];

  return (
    <section aria-labelledby="activity-records-title">
      <div className="hito-section-header">
        <div>
          <h3 id="activity-records-title" className="hito-ui-title-sm text-foreground">
            Current records
          </h3>
          <p className="hito-label-sm uppercase tracking-[0.18em] text-tertiary">
            Accepted whole-activity and official results
          </p>
        </div>
      </div>

      {metrics.records.items.length > 0 ? (
        <ul className="hito-row-group mt-4">
          {metrics.records.items.map((record) => (
            <RecordRow key={record.id} record={record} />
          ))}
        </ul>
      ) : (
        <div className="mt-4">
          <p className="hito-body-md text-secondary font-medium">No current records to show.</p>
          <p className="hito-body-xs text-tertiary mt-1">
            {unavailableReasons.length > 0
              ? unavailableReasons.map(advancedUnavailableReasonLabel).join(" · ")
              : "Hito only shows exact whole-activity records and official results entered by you."}
          </p>
        </div>
      )}
    </section>
  );
}

function RecordRow({ record }: { record: RunnerActivityProgressProductRecord }) {
  const context = formatRecordContext(record.context);
  return (
    <li className="hito-list-row !items-start gap-4">
      <div className="min-w-0">
        <p className="hito-body-md text-foreground">{recordDistanceLabel(record)}</p>
        <p className="hito-body-sm mt-1 text-secondary">{recordClassLabel(record)}</p>
        <p className="hito-body-xs text-tertiary mt-1">
          {[
            record.eventDate ? formatDate(record.eventDate) : null,
            context,
            recordConfidenceLabel(record),
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      <span className="shrink-0 text-right text-lg font-medium tabular-nums">
        {formatRecordTime(record.elapsedSeconds)}
      </span>
    </li>
  );
}

function SessionLoadReadback({
  metrics,
}: {
  metrics: Extract<RunnerActivityProgressProductAdvancedMetrics, { status: "current" }>;
}) {
  const current = metrics.sessionRpeLoad.rolling28Day.current;
  const previous = metrics.sessionRpeLoad.rolling28Day.previous;

  return (
    <section aria-labelledby="reported-load-title" className="border-t border-hairline pt-8">
      <details className="hito-disclosure">
        <summary className="hito-disclosure-summary min-h-11">
          <span className="min-w-0">
            <span id="reported-load-title" className="block">
              Reported training load
            </span>
            <span className="hito-body-xs text-tertiary mt-1 block">
              {current.metric.availability === "available"
                ? advancedConfidenceLabel(current.metric.confidence)
                : "Not available for this period"}
            </span>
          </span>
          <span className="ml-auto mr-2 shrink-0 text-right text-sm tabular-nums">
            {formatSessionLoad(current.metric)}
          </span>
          <Icon name="chevron-down" size="xs" className="hito-disclosure-chevron" />
        </summary>
        <div className="hito-disclosure-body">
          <p className="hito-body-md text-secondary max-w-2xl">
            Based on observed activity duration and the whole-session effort you reported.
          </p>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <SessionLoadWindow label="Current 28 days" window={current} />
            <SessionLoadWindow label="Previous 28 days" window={previous} />
          </div>

          {metrics.sessionRpeLoad.calendarWeeks.length > 0 ? (
            <div className="mt-6">
              <p className="hito-label-md text-foreground">Weekly reported load</p>
              <ul className="hito-row-group">
                {metrics.sessionRpeLoad.calendarWeeks.map((week) => (
                  <li
                    key={`${week.startDate}:${week.endDate}`}
                    className="hito-list-row !items-start"
                  >
                    <div className="min-w-0">
                      <p className="hito-body-md text-foreground">{formatAdvancedWindow(week)}</p>
                      <p className="hito-body-sm mt-1 text-secondary">
                        {advancedConfidenceLabel(week.metric.confidence)}
                      </p>
                    </div>
                    <span className="shrink-0 text-right tabular-nums">
                      {formatSessionLoad(week.metric)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-5 border-t border-hairline pt-4">
            <p className="hito-technical-sm text-muted-foreground">
              Formula {metrics.sessionRpeLoad.formulaVersion}
            </p>
          </div>
        </div>
      </details>
    </section>
  );
}

function SessionLoadWindow({
  label,
  window,
}: {
  label: string;
  window: RunnerActivityProgressProductSessionLoadWindow;
}) {
  const reasons = [...new Set(window.metric.unavailableReasons)];
  return (
    <div className="min-w-0">
      <p className="hito-label-md text-foreground">{label}</p>
      <p className="mt-2 text-2xl font-medium tabular-nums">{formatSessionLoad(window.metric)}</p>
      <p className="hito-body-xs text-tertiary mt-1">{formatAdvancedWindow(window)}</p>
      <p className="hito-body-xs text-tertiary mt-2">
        {advancedConfidenceLabel(window.metric.confidence)} ·{" "}
        {window.metric.includedObservationCount} included ·{" "}
        {window.metric.unavailableObservationCount} unavailable
      </p>
      {reasons.length > 0 ? (
        <ul className="hito-body-xs text-tertiary mt-2 list-disc space-y-1 pl-4">
          {reasons.map((reason) => (
            <li key={reason}>{advancedUnavailableReasonLabel(reason)}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function Gate5UnavailableReadback({
  metrics,
}: {
  metrics: Extract<RunnerActivityProgressProductAdvancedMetrics, { status: "current" }>;
}) {
  return (
    <section aria-labelledby="detailed-progress-title" className="border-t border-hairline pt-6">
      <h3 id="detailed-progress-title" className="hito-ui-title-sm text-foreground">
        Detailed progress metrics are not available yet.
      </h3>
      <p className="hito-body-md text-secondary mt-2 max-w-3xl">
        Hito does not yet store the detailed workout samples needed to calculate best efforts inside
        longer runs or compare pace, heart rate, aerobic efficiency, and durability.
      </p>
      <p className="hito-body-xs text-tertiary mt-2">
        {advancedUnavailableReasonLabel(metrics.detailedMetrics.reason)}
      </p>
    </section>
  );
}

function ProgressFactDisclosure({
  factKey,
  label,
  current,
  previous,
}: {
  factKey: ProgressFactKey;
  label: string;
  current: RunnerActivityProgressProductSnapshot;
  previous: RunnerActivityProgressProductSnapshot;
}) {
  const currentMetric = current.facts[factKey];
  const previousMetric = previous.facts[factKey];
  return (
    <details className="hito-disclosure">
      <summary className="hito-disclosure-summary">
        <span className="min-w-0">
          <span className="block">{label}</span>
          <span className="hito-body-xs text-tertiary mt-1 block">
            {confidenceLabel(currentMetric)}
          </span>
        </span>
        <span className="ml-auto mr-2 text-right text-sm tabular-nums">
          {formatFact(currentMetric)}
        </span>
        <Icon name="chevron-down" size="xs" className="hito-disclosure-chevron" />
      </summary>
      <div className="hito-disclosure-body">
        <div className="grid gap-4 sm:grid-cols-2">
          <FactWindow label="Current 28 days" snapshot={current} metric={currentMetric} />
          <FactWindow label="Previous 28 days" snapshot={previous} metric={previousMetric} />
        </div>
        <FactEvidence metric={currentMetric} snapshot={current} />
      </div>
    </details>
  );
}

function FactWindow({
  label,
  snapshot,
  metric,
}: {
  label: string;
  snapshot: RunnerActivityProgressProductSnapshot;
  metric: RunnerActivityProgressProductFactMetric;
}) {
  return (
    <div>
      <p className="hito-label-md text-foreground">{label}</p>
      <p className="mt-2 text-lg tabular-nums">{formatFact(metric)}</p>
      <p className="hito-body-xs text-tertiary mt-1">{formatWindow(snapshot)}</p>
    </div>
  );
}

function FactEvidence({
  metric,
  snapshot,
}: {
  metric: RunnerActivityProgressProductFactMetric;
  snapshot: RunnerActivityProgressProductSnapshot;
}) {
  const missingReasons = [...new Set(metric.missingReasons)];
  return (
    <div className="mt-5 border-t border-hairline pt-4">
      <p className="hito-body-xs text-tertiary">
        {metric.includedActivityCount} included · {metric.missingActivityCount} missing · Formula{" "}
        {snapshot.formulaVersion}
      </p>
      {missingReasons.length > 0 ? (
        <ul className="hito-body-xs text-tertiary mt-2 list-disc space-y-1 pl-4">
          {missingReasons.map((reason) => (
            <li key={reason}>{missingReasonLabel(reason)}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function ProgressSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading running progress">
      <div aria-hidden="true">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-4 h-10 w-full max-w-lg" />
        <Skeleton className="mt-4 h-4 w-full max-w-xl" />
      </div>
      <div className="space-y-3" aria-hidden="true">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
      <span className="sr-only">Loading factual progress.</span>
    </div>
  );
}

function ProgressEmptyState() {
  return (
    <div className="hito-state-surface">
      <p className="hito-label-md text-foreground">Not enough recorded activity</p>
      <h2 className="hito-ui-title-sm text-foreground mt-2">
        Progress facts will appear after recorded runs.
      </h2>
      <p className="hito-body-md text-secondary mt-2">
        Hito will show only facts supported by your activity evidence.
      </p>
      <div className="hito-state-actions">
        <HitoButton asChild size="md" variant="primary">
          <Link to="/">Open Calendar</Link>
        </HitoButton>
      </div>
    </div>
  );
}

function ProgressError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="hito-state-surface" data-tone="destructive" role="alert">
      <p className="hito-label-md text-destructive">Could not load running progress</p>
      <p className="hito-body-md text-secondary mt-2">{message}</p>
      <div className="hito-state-actions">
        <HitoButton
          id="progress-retry-action"
          type="button"
          size="md"
          variant="secondary"
          onClick={onRetry}
        >
          <Icon name="refresh" size="sm" />
          Try again
        </HitoButton>
      </div>
    </div>
  );
}
