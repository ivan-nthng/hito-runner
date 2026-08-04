import { Link } from "@tanstack/react-router";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  RunnerActivityAdvancedMetricsCurrent,
  RunnerActivityAdvancedMetricsReadModel,
  RunnerActivityFactMetric,
  RunnerActivityFactSnapshot,
  RunnerActivityProgressReadModel,
  RunnerActivityRecordItem,
  RunnerActivitySessionLoadWindow,
} from "@/lib/runner-activity/read-model-types";
import { formatDate } from "@/lib/training";
import type { ProgressState } from "./runner-activity-progress-types";
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

export function FactualProgressPanel({
  state,
  onRetry,
}: {
  state: ProgressState;
  onRetry: () => void;
}) {
  return (
    <section aria-labelledby="factual-progress-title">
      <header className="hito-page-header">
        <p className="hito-label">Comparable evidence</p>
        <h1 id="factual-progress-title" className="hito-page-title">
          Progress
        </h1>
        <p className="hito-page-copy">
          Recorded running facts, current records, and your reported training load.
        </p>
      </header>

      {state.status === "loading" || state.status === "idle" ? <ProgressSkeleton /> : null}
      {state.status === "error" ? <ProgressError message={state.error} onRetry={onRetry} /> : null}
      {state.status === "updating" ? (
        <div className="hito-state-surface" data-tone="signal" role="status" aria-live="polite">
          <p className="hito-label">Updating</p>
          <h2 className="hito-section-title mt-2">Your activity facts are being refreshed.</h2>
          <p className="hito-body mt-2">
            Current values will return when the backend snapshot is ready.
          </p>
          <div className="hito-state-actions">
            <button
              type="button"
              className="hito-button hito-button-secondary hito-button-md"
              onClick={onRetry}
            >
              <Icon name="refresh" size="sm" />
              Check again
            </button>
          </div>
        </div>
      ) : null}
      {state.status === "ready" ? <ProgressReadback progress={state.data} /> : null}
    </section>
  );
}

function ProgressReadback({ progress }: { progress: RunnerActivityProgressReadModel }) {
  const current = progress.rolling28Day.current;
  const previous = progress.rolling28Day.previous;
  const summary = formatRollingSummary(current);
  const visibleFacts = PROGRESS_FACTS.filter(
    ({ key }) =>
      current.facts[key].availability === "available" ||
      previous.facts[key].availability === "available",
  );

  if (!summary) return <ProgressEmptyState />;

  return (
    <div className="space-y-8">
      <section aria-labelledby="rolling-summary-title">
        <p className="hito-label">Last 28 days</p>
        <h2
          id="rolling-summary-title"
          className="mt-3 font-display text-3xl leading-tight sm:text-4xl"
        >
          {summary}
        </h2>
        <p className="hito-caption mt-2">
          {formatWindow(current)} · {current.evidence.eligibleActivityCount} recorded activities
        </p>
      </section>

      {visibleFacts.length > 0 ? (
        <section aria-labelledby="progress-facts-title">
          <div className="hito-section-header">
            <h2 id="progress-facts-title" className="hito-section-title">
              Running facts
            </h2>
            <span className="hito-section-subtitle">Current and previous 28 days</span>
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
                <li key={week.id} className="hito-list-row !items-start">
                  <div>
                    <p className="hito-list-row-title">{formatWindow(week)}</p>
                    <p className="hito-list-row-copy">
                      {formatRollingSummary(week) ?? "No recorded running facts"}
                    </p>
                  </div>
                  <span className="hito-caption shrink-0">Week</span>
                </li>
              ))}
            </ul>
          </div>
        </details>
      ) : null}
    </div>
  );
}

function Gate4Readback({
  advancedMetrics,
}: {
  advancedMetrics: RunnerActivityAdvancedMetricsReadModel;
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
        <p className="hito-label">Updating records and reported load</p>
        <h2 id="activity-intelligence-updating-title" className="hito-section-title mt-2">
          A recent activity change is being applied.
        </h2>
        <p className="hito-body mt-2">
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
          <h2 id="activity-intelligence-title" className="hito-section-title">
            Records and reported load
          </h2>
          <p className="hito-section-subtitle">
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

function RecordsReadback({ metrics }: { metrics: RunnerActivityAdvancedMetricsCurrent }) {
  const unavailableReasons = [
    ...new Set(
      [metrics.records.unavailableReason, ...metrics.records.unavailableReasons].filter(
        (reason): reason is string => Boolean(reason),
      ),
    ),
  ];

  return (
    <section aria-labelledby="activity-records-title">
      <div className="hito-section-header">
        <div>
          <h3 id="activity-records-title" className="hito-section-title">
            Current records
          </h3>
          <p className="hito-section-subtitle">Accepted whole-activity and official results</p>
        </div>
      </div>

      {metrics.records.items.length > 0 ? (
        <ul className="hito-row-group mt-4">
          {metrics.records.items.map((record) => (
            <RecordRow key={record.observationId} record={record} />
          ))}
        </ul>
      ) : (
        <div className="mt-4">
          <p className="hito-body font-medium">No current records to show.</p>
          <p className="hito-caption mt-1">
            {unavailableReasons.length > 0
              ? unavailableReasons.map(advancedUnavailableReasonLabel).join(" · ")
              : "Hito only shows exact whole-activity records and official results entered by you."}
          </p>
        </div>
      )}
    </section>
  );
}

function RecordRow({ record }: { record: RunnerActivityRecordItem }) {
  const context = formatRecordContext(record.context);
  return (
    <li className="hito-list-row !items-start gap-4">
      <div className="min-w-0">
        <p className="hito-list-row-title">{recordDistanceLabel(record)}</p>
        <p className="hito-list-row-copy">{recordClassLabel(record)}</p>
        <p className="hito-caption mt-1">
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

function SessionLoadReadback({ metrics }: { metrics: RunnerActivityAdvancedMetricsCurrent }) {
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
            <span className="hito-caption mt-1 block">
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
          <p className="hito-support-copy max-w-2xl">
            Based on observed activity duration and the whole-session effort you reported.
          </p>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <SessionLoadWindow label="Current 28 days" window={current} />
            <SessionLoadWindow label="Previous 28 days" window={previous} />
          </div>

          {metrics.sessionRpeLoad.calendarWeeks.length > 0 ? (
            <div className="mt-6">
              <p className="hito-label">Weekly reported load</p>
              <ul className="hito-row-group">
                {metrics.sessionRpeLoad.calendarWeeks.map((week) => (
                  <li
                    key={`${week.startDate}:${week.endDate}`}
                    className="hito-list-row !items-start"
                  >
                    <div className="min-w-0">
                      <p className="hito-list-row-title">{formatAdvancedWindow(week)}</p>
                      <p className="hito-list-row-copy">
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
            <p className="hito-technical-mono text-xs text-muted-foreground">
              Formula {metrics.formulaVersions.sessionRpeLoad}
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
  window: RunnerActivitySessionLoadWindow;
}) {
  const reasons = [...new Set(window.metric.unavailableReasons)];
  return (
    <div className="min-w-0">
      <p className="hito-label">{label}</p>
      <p className="mt-2 text-2xl font-medium tabular-nums">{formatSessionLoad(window.metric)}</p>
      <p className="hito-caption mt-1">{formatAdvancedWindow(window)}</p>
      <p className="hito-caption mt-2">
        {advancedConfidenceLabel(window.metric.confidence)} ·{" "}
        {window.metric.includedObservationCount} included ·{" "}
        {window.metric.unavailableObservationCount} unavailable
      </p>
      {reasons.length > 0 ? (
        <ul className="hito-caption mt-2 list-disc space-y-1 pl-4">
          {reasons.map((reason) => (
            <li key={reason}>{advancedUnavailableReasonLabel(reason)}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function Gate5UnavailableReadback({ metrics }: { metrics: RunnerActivityAdvancedMetricsCurrent }) {
  return (
    <section aria-labelledby="detailed-progress-title" className="border-t border-hairline pt-6">
      <h3 id="detailed-progress-title" className="hito-section-title">
        Detailed progress metrics are not available yet.
      </h3>
      <p className="hito-body mt-2 max-w-3xl">
        Hito does not yet store the detailed workout samples needed to calculate best efforts inside
        longer runs or compare pace, heart rate, aerobic efficiency, and durability.
      </p>
      <p className="hito-caption mt-2">
        {advancedUnavailableReasonLabel(metrics.streamDependentMetrics.aerobicEfficiency.reason)}
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
  current: RunnerActivityFactSnapshot;
  previous: RunnerActivityFactSnapshot;
}) {
  const currentMetric = current.facts[factKey];
  const previousMetric = previous.facts[factKey];
  return (
    <details className="hito-disclosure">
      <summary className="hito-disclosure-summary">
        <span className="min-w-0">
          <span className="block">{label}</span>
          <span className="hito-caption mt-1 block">{confidenceLabel(currentMetric)}</span>
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
  snapshot: RunnerActivityFactSnapshot;
  metric: RunnerActivityFactMetric;
}) {
  return (
    <div>
      <p className="hito-label">{label}</p>
      <p className="mt-2 text-lg tabular-nums">{formatFact(metric)}</p>
      <p className="hito-caption mt-1">{formatWindow(snapshot)}</p>
    </div>
  );
}

function FactEvidence({
  metric,
  snapshot,
}: {
  metric: RunnerActivityFactMetric;
  snapshot: RunnerActivityFactSnapshot;
}) {
  const missingReasons = [...new Set(metric.missingReasons)];
  return (
    <div className="mt-5 border-t border-hairline pt-4">
      <p className="hito-caption">
        {metric.includedActivityCount} included · {metric.missingActivityCount} missing · Formula{" "}
        {snapshot.formulaVersion}
      </p>
      {missingReasons.length > 0 ? (
        <ul className="hito-caption mt-2 list-disc space-y-1 pl-4">
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
      <p className="hito-label">Not enough recorded activity</p>
      <h2 className="hito-section-title mt-2">Progress facts will appear after recorded runs.</h2>
      <p className="hito-body mt-2">
        Hito will show only facts supported by your activity evidence.
      </p>
      <div className="hito-state-actions">
        <Link to="/" className="hito-button hito-button-primary hito-button-md">
          Open Calendar
        </Link>
      </div>
    </div>
  );
}

function ProgressError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="hito-state-surface" data-tone="destructive" role="alert">
      <p className="hito-label text-destructive">Could not load running progress</p>
      <p className="hito-body mt-2">{message}</p>
      <div className="hito-state-actions">
        <button
          type="button"
          className="hito-button hito-button-secondary hito-button-md"
          onClick={onRetry}
        >
          <Icon name="refresh" size="sm" />
          Try again
        </button>
      </div>
    </div>
  );
}
