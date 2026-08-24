import {
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import { HitoButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type {
  RunnerActivityFitSequenceMetricId,
  RunnerActivityFitSequenceObservation,
  RunnerActivityFitSequenceProductModel,
  RunnerActivityFitSequenceProductPoint,
} from "@/lib/runner-activity/product-contract";
import { formatDate } from "@/lib/training";
import { cn } from "@/lib/utils";

type ReadyOrEmptySequence = Extract<
  RunnerActivityFitSequenceProductModel,
  { status: "empty" | "ready" }
>;
type ReadySequence = Omit<ReadyOrEmptySequence, "status"> & { status: "ready" };
type EmptySequence = Omit<ReadyOrEmptySequence, "status"> & { status: "empty" };
type SequenceCore = Pick<
  ReadyOrEmptySequence,
  "advertisedPeriods" | "evidenceLabel" | "formulaVersion" | "selectedPeriod"
>;

export type HitoFactualActivityPointSequenceError = SequenceCore & {
  points: readonly [];
  reasonLabel: string;
  staleValuesReturned: false;
  status: "error";
};

export type HitoFactualActivityPointSequenceModel =
  | RunnerActivityFitSequenceProductModel
  | HitoFactualActivityPointSequenceError;

export type HitoFactualActivityPointSequenceControls = {
  ariaLabel: string;
  content: ReactNode;
};

const METRIC_PRESENTATION: Record<
  RunnerActivityFitSequenceMetricId,
  { purpose: string; title: string; unitLabel: RunnerActivityFitSequenceObservation["unitLabel"] }
> = {
  distance: {
    title: "Distance by FIT-recorded run",
    purpose:
      "Review the supplied distance for every FIT-recorded run in the exact selected period.",
    unitLabel: "km",
  },
  timer_duration: {
    title: "Timer duration by FIT-recorded run",
    purpose:
      "Review the supplied timer duration for every FIT-recorded run in the exact selected period.",
    unitLabel: "min",
  },
  observed_average_pace: {
    title: "Observed average pace by FIT-recorded run",
    purpose:
      "Review each supplied whole-activity observed pace without combining different workouts.",
    unitLabel: "/km",
  },
  elevation_gain: {
    title: "Elevation gain by FIT-recorded run",
    purpose:
      "Review the supplied elevation gain for every FIT-recorded run in the exact selected period.",
    unitLabel: "m",
  },
  reported_load: {
    title: "Reported load by FIT-recorded run",
    purpose:
      "Review the supplied session-RPE load for every FIT-recorded run in the exact selected period.",
    unitLabel: "AU",
  },
};

const MILLISECONDS_PER_DAY = 86_400_000;

export function HitoFactualActivityPointSequence({
  className,
  controls,
  metricId,
  sequence,
  stateAction,
}: {
  className?: string;
  controls?: HitoFactualActivityPointSequenceControls;
  metricId: RunnerActivityFitSequenceMetricId;
  sequence: HitoFactualActivityPointSequenceModel;
  stateAction?: ReactNode;
}) {
  const metric = METRIC_PRESENTATION[metricId];
  const titleId = `hito-factual-activity-sequence-${metricId}-title`;
  const summaryId = `hito-factual-activity-sequence-${metricId}-summary`;
  const membershipComplete =
    (sequence.status === "ready" || sequence.status === "empty") &&
    sequence.completeness.eligibleActivityCount === sequence.completeness.returnedPointCount;

  return (
    <figure
      className={cn("grid min-w-0 gap-5", className)}
      aria-labelledby={titleId}
      aria-describedby={summaryId}
      data-hito-component="factual-activity-point-sequence"
      data-status={sequence.status}
      data-metric={metricId}
    >
      <figcaption className="grid min-w-0 gap-2">
        <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 id={titleId} className="hito-ui-title-sm">
            {metric.title}
          </h3>
          <span className="hito-technical-sm text-secondary">{metric.unitLabel}</span>
        </div>
        <p id={summaryId} className="hito-body-sm text-secondary max-w-3xl">
          {metric.purpose}
        </p>
        {metricId === "observed_average_pace" ? (
          <p className="hito-body-xs text-secondary">
            Different workouts are not directly comparable.
          </p>
        ) : null}
      </figcaption>

      {controls ? (
        <div
          className="grid min-w-0 gap-3 rounded-xl bg-chrome-subtle p-3 sm:p-4"
          role="group"
          aria-label={controls.ariaLabel}
          data-hito-factual-figure-controls
        >
          {controls.content}
        </div>
      ) : null}

      <p className="hito-technical-sm text-tertiary">
        {sequence.selectedPeriod.label} ·{" "}
        <time dateTime={sequence.selectedPeriod.startDate}>
          {formatDate(sequence.selectedPeriod.startDate, {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </time>
        –
        <time dateTime={sequence.selectedPeriod.endDate}>
          {formatDate(sequence.selectedPeriod.endDate, {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </time>
        {sequence.status === "ready" || sequence.status === "empty"
          ? " · " +
            sequence.completeness.returnedPointCount +
            (sequence.completeness.returnedPointCount === 1 ? " activity" : " activities")
          : ""}{" "}
        · {sequence.evidenceLabel}
      </p>

      {isReadySequence(sequence) && membershipComplete ? (
        <ReadyFactualActivityPointSequence metricId={metricId} sequence={sequence} />
      ) : isEmptySequence(sequence) && membershipComplete ? (
        <SequenceState
          label="No activity evidence"
          message={
            "No FIT-recorded runs from " +
            formatDate(sequence.selectedPeriod.startDate, {
              day: "numeric",
              month: "short",
              year: "numeric",
            }) +
            " to " +
            formatDate(sequence.selectedPeriod.endDate, {
              day: "numeric",
              month: "short",
              year: "numeric",
            }) +
            "."
          }
          tone="neutral"
        />
      ) : sequence.status === "ready" || sequence.status === "empty" ? (
        <SequenceState
          label="Sequence unavailable"
          message="The supplied activity sequence is incomplete. No partial member set is shown."
          tone="warning"
        />
      ) : (
        <SequenceState
          label={
            sequence.status === "error"
              ? "Sequence unavailable"
              : sequence.status === "updating"
                ? "Updating sequence"
                : "Sequence unavailable"
          }
          message={sequenceReasonLabel(sequence)}
          tone={sequence.status === "error" ? "destructive" : "warning"}
          action={stateAction}
        />
      )}
    </figure>
  );
}

function ReadyFactualActivityPointSequence({
  metricId,
  sequence,
}: {
  metricId: RunnerActivityFitSequenceMetricId;
  sequence: ReadySequence;
}) {
  const metric = METRIC_PRESENTATION[metricId];
  const [activeIndex, setActiveIndex] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [pinnedIndex, setPinnedIndex] = useState<number | null>(null);
  const pointRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const pointIdentity = sequence.points.map((point) => point.id).join("|");
  const observations = sequence.points.map((point) => point.observations[metricId]);
  const maxValue = Math.max(0, ...observations.map((observation) => observation.value ?? 0));
  const maxObservation = observations.find((observation) => observation.value === maxValue) ?? null;
  const dayCount = Math.max(
    1,
    dateOrdinal(sequence.selectedPeriod.endDate) -
      dateOrdinal(sequence.selectedPeriod.startDate) +
      1,
  );
  const sameDayCounts = sequence.points.reduce<Map<string, number>>((counts, point) => {
    counts.set(
      point.historicalTime.localDate,
      (counts.get(point.historicalTime.localDate) ?? 0) + 1,
    );
    return counts;
  }, new Map());
  const plotStyle = {
    "--hito-factual-sequence-day-count": dayCount,
    "--hito-factual-sequence-point-count": Math.max(sequence.points.length, 1),
  } as CSSProperties;

  useEffect(() => {
    setActiveIndex(0);
    setFocusedIndex(null);
    setHoveredIndex(null);
    setPinnedIndex(null);
  }, [metricId, pointIdentity]);

  const moveActivePoint = (nextIndex: number) => {
    if (!sequence.points.length) return;
    const boundedIndex = Math.max(0, Math.min(nextIndex, sequence.points.length - 1));
    setActiveIndex(boundedIndex);
    setPinnedIndex(null);
    pointRefs.current[boundedIndex]?.focus();
  };

  const handlePointKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveActivePoint(index + 1);
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveActivePoint(index - 1);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      moveActivePoint(0);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      moveActivePoint(sequence.points.length - 1);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setActiveIndex(index);
      setPinnedIndex((current) => (current === index ? null : index));
      return;
    }
    if (event.key === "Escape" && pinnedIndex !== null) {
      event.preventDefault();
      setPinnedIndex(null);
    }
  };

  return (
    <TooltipProvider delayDuration={100}>
      <div className="grid min-w-0 gap-4">
        <div
          className="max-w-full overflow-x-auto overscroll-x-contain pb-1"
          aria-label={`${metric.title} plot scroll region`}
        >
          <div
            className="relative h-[calc(var(--space-10)*6)] min-w-full border-b border-hairline"
            style={{
              ...plotStyle,
              minWidth:
                "max(100%, calc(var(--hito-factual-sequence-day-count) * var(--space-3)), calc(var(--hito-factual-sequence-point-count) * (var(--space-10) + var(--space-1))))",
            }}
            role="group"
            aria-label={`${metric.title}, ${sequence.selectedPeriod.label}, ${sequence.selectedPeriod.startDate} to ${sequence.selectedPeriod.endDate}`}
            data-hito-factual-activity-sequence-plot
          >
            <span className="pointer-events-none absolute inset-x-0 top-0 border-t border-hairline" />
            <span className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-hairline" />
            <span className="hito-technical-sm text-tertiary pointer-events-none absolute bottom-1 left-1 z-10">
              0 {metric.unitLabel}
            </span>
            {maxObservation?.displayValue ? (
              <span className="hito-technical-sm text-tertiary pointer-events-none absolute left-1 top-1 z-10">
                {maxObservation.displayValue}
              </span>
            ) : null}
            {sequence.selectedPeriod.futureInterval ? (
              <span
                className="pointer-events-none absolute inset-y-0 border-l border-dashed border-hairline bg-chrome-subtle"
                style={futureIntervalStyle(sequence.selectedPeriod)}
                aria-hidden="true"
                data-hito-factual-activity-sequence-future
              />
            ) : null}

            {sequence.points.map((point, index) => {
              const observation = point.observations[metricId];
              const position = pointPosition(
                point,
                observation,
                sequence.selectedPeriod.startDate,
                dayCount,
                maxValue,
                sameDayCounts.get(point.historicalTime.localDate) ?? 1,
              );
              const tooltipOpen =
                pinnedIndex === null &&
                (hoveredIndex !== null ? hoveredIndex === index : focusedIndex === index);

              return (
                <Tooltip key={point.id} open={tooltipOpen}>
                  <TooltipTrigger asChild>
                    <button
                      ref={(node) => {
                        pointRefs.current[index] = node;
                      }}
                      type="button"
                      className="absolute z-20 grid size-[calc(var(--space-10)+var(--space-1))] place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      style={position}
                      tabIndex={activeIndex === index ? 0 : -1}
                      aria-label={pointAccessibleName(point, observation)}
                      aria-pressed={pinnedIndex === index}
                      data-point-id={point.id}
                      data-point-state={observation.state}
                      onBlur={() => setFocusedIndex(null)}
                      onClick={() => {
                        setActiveIndex(index);
                        setPinnedIndex((current) => (current === index ? null : index));
                      }}
                      onFocus={() => {
                        setActiveIndex(index);
                        setFocusedIndex(index);
                      }}
                      onKeyDown={(event) => handlePointKeyDown(event, index)}
                      onMouseEnter={() => {
                        setActiveIndex(index);
                        setHoveredIndex(index);
                      }}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      <PointMark observation={observation} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    sideOffset={8}
                    className="pointer-events-none max-w-xs"
                  >
                    <ActivityPointReadback point={point} observation={observation} />
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap justify-between gap-x-4 gap-y-1">
          <time
            className="hito-technical-sm text-tertiary"
            dateTime={sequence.selectedPeriod.startDate}
          >
            {formatDate(sequence.selectedPeriod.startDate)}
          </time>
          <time
            className="hito-technical-sm text-tertiary"
            dateTime={sequence.selectedPeriod.endDate}
          >
            {formatDate(sequence.selectedPeriod.endDate)}
          </time>
        </div>

        <div className="hito-body-xs text-secondary flex flex-wrap gap-x-4 gap-y-1">
          <span>Available · solid point</span>
          {observations.some((observation) => observation.state === "partial") ? (
            <span>Partial · outlined point</span>
          ) : null}
          {observations.some((observation) => observation.state === "unavailable") ? (
            <span>Unavailable · N/A point</span>
          ) : null}
          {sequence.selectedPeriod.futureInterval ? (
            <span>
              Future · {formatDate(sequence.selectedPeriod.futureInterval.startDate)}–
              {formatDate(sequence.selectedPeriod.futureInterval.endDate)} · not missing data
            </span>
          ) : null}
        </div>

        {pinnedIndex !== null && sequence.points[pinnedIndex] ? (
          <div
            className="hito-state-surface flex min-w-0 items-start justify-between gap-3"
            data-size="sm"
            data-tone="neutral"
            role="status"
            aria-live="polite"
            data-hito-factual-activity-sequence-pinned-readback
          >
            <ActivityPointReadback
              point={sequence.points[pinnedIndex]}
              observation={sequence.points[pinnedIndex].observations[metricId]}
            />
            <HitoButton
              size="xs"
              variant="ghost"
              iconOnly
              aria-label="Close active activity"
              onClick={() => {
                pointRefs.current[activeIndex]?.focus();
                setPinnedIndex(null);
              }}
            >
              <Icon name="close" size="xs" decorative />
            </HitoButton>
          </div>
        ) : null}

        <ActivitySequenceDataTable metricId={metricId} sequence={sequence} />
      </div>
    </TooltipProvider>
  );
}

function SequenceState({
  action,
  label,
  message,
  tone,
}: {
  action?: ReactNode;
  label: string;
  message: string;
  tone: "destructive" | "neutral" | "warning";
}) {
  return (
    <article
      className="hito-state-surface"
      data-size="md"
      data-tone={tone}
      role={tone === "destructive" ? "alert" : "status"}
    >
      <p className="hito-label-md">{label}</p>
      <p className="hito-body-sm mt-2 text-secondary">{message}</p>
      {action ? <div className="hito-state-actions">{action}</div> : null}
    </article>
  );
}

function PointMark({ observation }: { observation: RunnerActivityFitSequenceObservation }) {
  if (observation.state === "unavailable") {
    return (
      <span className="hito-label-sm text-secondary grid size-8 place-items-center rounded-full border border-dashed border-foreground">
        N/A
      </span>
    );
  }

  return (
    <span
      className={cn(
        "size-4 rounded-full bg-chart-1",
        observation.state === "partial" && "border-2 border-background ring-2 ring-chart-1",
      )}
      aria-hidden="true"
    />
  );
}

function ActivityPointReadback({
  observation,
  point,
}: {
  observation: RunnerActivityFitSequenceObservation;
  point: RunnerActivityFitSequenceProductPoint;
}) {
  return (
    <div className="grid min-w-0 gap-1">
      <p className="hito-label-md">
        {point.label} · {historicalTimeLabel(point)}
      </p>
      <p className="hito-body-sm">
        {observation.label}: {observationValue(observation)}
      </p>
      <p className="hito-body-xs text-secondary">
        {observationStateLabel(observation.state)} · {observationCoverageLabel(observation)}
      </p>
      <p className="hito-body-xs text-secondary">
        {point.context.runningContext ?? "Running context unavailable"}
      </p>
      {observation.reasonLabel ? (
        <p className="hito-body-xs text-secondary">{observation.reasonLabel}</p>
      ) : null}
      <p className="hito-technical-sm text-tertiary">{point.evidence.label}</p>
    </div>
  );
}

function ActivitySequenceDataTable({
  metricId,
  sequence,
}: {
  metricId: RunnerActivityFitSequenceMetricId;
  sequence: ReadySequence;
}) {
  const metric = METRIC_PRESENTATION[metricId];
  return (
    <details className="hito-disclosure">
      <summary className="hito-disclosure-summary min-h-11">
        <span>View data</span>
        <Icon name="chevron-down" size="xs" className="hito-disclosure-chevron" decorative />
      </summary>
      <div className="hito-disclosure-body">
        <div
          className="hito-data-table-scroll"
          role="region"
          aria-label={`${metric.title} data table`}
          tabIndex={0}
        >
          <table className="hito-data-table hito-data-table-min-lg">
            <caption className="sr-only">
              {metric.title}, {sequence.selectedPeriod.label}, {sequence.selectedPeriod.startDate}{" "}
              to {sequence.selectedPeriod.endDate}
            </caption>
            <thead>
              <tr>
                {[
                  "Activity",
                  "Date and time",
                  "Selected metric",
                  "State",
                  "Distance",
                  "Timer duration",
                  "Observed pace",
                  "Elevation gain",
                  "Reported load",
                  "Context",
                  "Evidence and coverage",
                  "Reason",
                ].map((heading) => (
                  <th key={heading} scope="col" className="hito-data-table-cell text-left">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sequence.points.map((point) => {
                const observation = point.observations[metricId];
                return (
                  <tr key={point.id}>
                    <th scope="row" className="hito-data-table-cell hito-data-table-cell-start">
                      {point.label} {point.sequenceIndex + 1}
                    </th>
                    <td className="hito-data-table-cell whitespace-nowrap">
                      {historicalTimeLabel(point)}
                    </td>
                    <td className="hito-data-table-cell whitespace-nowrap tabular-nums">
                      {observationValue(observation)}
                    </td>
                    <td className="hito-data-table-cell">
                      {observationStateLabel(observation.state)}
                    </td>
                    <ObservationCell observation={point.observations.distance} />
                    <ObservationCell observation={point.observations.timer_duration} />
                    <ObservationCell observation={point.observations.observed_average_pace} />
                    <ObservationCell observation={point.observations.elevation_gain} />
                    <ObservationCell observation={point.observations.reported_load} />
                    <td className="hito-data-table-cell">
                      {point.context.runningContext ?? "Unknown"}
                    </td>
                    <td className="hito-data-table-cell">
                      {point.evidence.label} · {observationCoverageLabel(observation)}
                    </td>
                    <td className="hito-data-table-cell hito-data-table-cell-end">
                      {observation.reasonLabel ?? "Not applicable"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </details>
  );
}

function ObservationCell({ observation }: { observation: RunnerActivityFitSequenceObservation }) {
  return (
    <td className="hito-data-table-cell min-w-40 align-top">
      <span className="whitespace-nowrap tabular-nums">
        {observationValue(observation)} · {observationStateLabel(observation.state)}
      </span>
      <span className="hito-body-xs text-secondary mt-1 block">
        {observationCoverageLabel(observation)}
        {observation.reasonLabel ? ` · ${observation.reasonLabel}` : ""}
      </span>
    </td>
  );
}

function pointPosition(
  point: RunnerActivityFitSequenceProductPoint,
  observation: RunnerActivityFitSequenceObservation,
  periodStartDate: string,
  dayCount: number,
  maxValue: number,
  sameDayCount: number,
) {
  const dayOffset = dateOrdinal(point.historicalTime.localDate) - dateOrdinal(periodStartDate);
  const timeFraction = historicalTimeFraction(point, sameDayCount);
  const x = clamp((dayOffset + timeFraction) / dayCount, 0, 1);
  const y =
    observation.value === null || maxValue <= 0 ? 0 : clamp(observation.value / maxValue, 0, 1);
  return {
    "--hito-factual-sequence-x": x,
    "--hito-factual-sequence-y": y,
    bottom: "calc(var(--hito-factual-sequence-y) * (100% - (var(--space-10) + var(--space-1))))",
    left: "calc((var(--space-10) + var(--space-1)) / 2 + var(--hito-factual-sequence-x) * (100% - (var(--space-10) + var(--space-1))))",
    marginLeft: "calc((var(--space-10) + var(--space-1)) / -2)",
  } as CSSProperties;
}

function futureIntervalStyle(period: ReadyOrEmptySequence["selectedPeriod"]) {
  if (!period.futureInterval) return undefined;
  const dayCount = Math.max(1, dateOrdinal(period.endDate) - dateOrdinal(period.startDate) + 1);
  const start = clamp(
    (dateOrdinal(period.futureInterval.startDate) - dateOrdinal(period.startDate)) / dayCount,
    0,
    1,
  );
  const end = clamp(
    (dateOrdinal(period.futureInterval.endDate) - dateOrdinal(period.startDate) + 1) / dayCount,
    start,
    1,
  );
  return { left: `${start * 100}%`, right: `${(1 - end) * 100}%` } as CSSProperties;
}

function historicalTimeFraction(
  point: RunnerActivityFitSequenceProductPoint,
  sameDayCount: number,
) {
  const { startedAt, timezone } = point.historicalTime;
  if (startedAt) {
    try {
      const parts = new Intl.DateTimeFormat("en", {
        hour: "2-digit",
        hour12: false,
        minute: "2-digit",
        second: "2-digit",
        timeZone: timezone ?? "UTC",
      }).formatToParts(new Date(startedAt));
      const value = (type: Intl.DateTimeFormatPartTypes) =>
        Number(parts.find((part) => part.type === type)?.value ?? 0);
      return (value("hour") * 3600 + value("minute") * 60 + value("second")) / 86_400;
    } catch {
      const match = startedAt.match(/T(\d{2}):(\d{2}):(\d{2})/);
      if (match) {
        return (Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3])) / 86_400;
      }
    }
  }
  return (point.sameDayOrder + 1) / (sameDayCount + 1);
}

function dateOrdinal(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / MILLISECONDS_PER_DAY;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(value, maximum));
}

function historicalTimeLabel(point: RunnerActivityFitSequenceProductPoint) {
  const time = point.historicalTime.startedAt
    ? new Intl.DateTimeFormat("en", {
        hour: "2-digit",
        hour12: false,
        minute: "2-digit",
        timeZone: point.historicalTime.timezone ?? "UTC",
      }).format(new Date(point.historicalTime.startedAt))
    : "Time unavailable";
  return `${point.historicalTime.localDate} · ${time}`;
}

function observationValue(observation: RunnerActivityFitSequenceObservation) {
  return observation.displayValue ?? "Unavailable";
}

function observationStateLabel(state: RunnerActivityFitSequenceObservation["state"]) {
  if (state === "partial") return "Partial";
  if (state === "unavailable") return "Unavailable";
  return "Available";
}

function observationCoverageLabel(observation: RunnerActivityFitSequenceObservation) {
  return `${observation.coverage.includedCount} of ${observation.coverage.candidateCount} included`;
}

function pointAccessibleName(
  point: RunnerActivityFitSequenceProductPoint,
  observation: RunnerActivityFitSequenceObservation,
) {
  const reason = observation.reasonLabel ? ` ${observation.reasonLabel}` : "";
  const context = point.context.runningContext ?? "Running context unavailable";
  return `${point.label} ${point.sequenceIndex + 1}. ${historicalTimeLabel(point)}. ${observation.label}: ${observationValue(observation)}. ${observationStateLabel(observation.state)}. ${observationCoverageLabel(observation)}. ${context}. ${point.evidence.label}.${reason}`;
}

function isReadySequence(
  sequence: HitoFactualActivityPointSequenceModel,
): sequence is ReadySequence {
  return sequence.status === "ready";
}

function isEmptySequence(
  sequence: HitoFactualActivityPointSequenceModel,
): sequence is EmptySequence {
  return sequence.status === "empty";
}

function sequenceReasonLabel(sequence: HitoFactualActivityPointSequenceModel) {
  return "reasonLabel" in sequence ? sequence.reasonLabel : "The activity sequence is unavailable.";
}
