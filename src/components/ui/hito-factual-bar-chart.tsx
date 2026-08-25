import {
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import { HitoButton } from "@/components/ui/button";
import { useHitoUiLocale } from "@/components/ui/hito-ui-locale-provider";
import { Icon } from "@/components/ui/icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type {
  RunnerActivityFitChartPeriod,
  RunnerActivityFitChartPoint,
  RunnerActivityFitChartSeries,
} from "@/lib/runner-activity/product-contract";
import { formatUiDate, formatUiNumber, type ResolvedUiLocale } from "@/lib/ui-locale";
import {
  formatHitoProductMessage,
  getHitoKnownProductMessage,
  getHitoProductMessage,
} from "@/lib/ui-locale-messages";

type ReadySeries = Extract<RunnerActivityFitChartSeries, { status: "ready" }>;
type SeriesCore = Pick<
  ReadySeries,
  "display" | "evidenceLabel" | "id" | "purpose" | "title" | "unit" | "unitLabel"
>;

export type HitoFactualBarChartPeriod = Pick<
  RunnerActivityFitChartPeriod,
  "bucketResolution" | "endDate" | "id" | "label" | "startDate" | "state"
>;

export type HitoFactualBarChartErrorSeries = SeriesCore & {
  points: readonly [];
  reasonLabel: string;
  status: "error";
};

export type HitoFactualBarChartSeries =
  | RunnerActivityFitChartSeries
  | HitoFactualBarChartErrorSeries;

export type HitoFactualBarChartControls = {
  ariaLabel: string;
  content: ReactNode;
};

export function HitoFactualBarChart({
  className,
  controls,
  period,
  series,
  stateAction,
}: {
  className?: string;
  controls?: HitoFactualBarChartControls;
  period: HitoFactualBarChartPeriod;
  series: HitoFactualBarChartSeries;
  stateAction?: ReactNode;
}) {
  const locale = useHitoUiLocale();
  const titleId = `hito-factual-chart-${series.id}-title`;
  const summaryId = `hito-factual-chart-${series.id}-summary`;

  return (
    <figure
      className={cn("grid min-w-0 gap-5", className)}
      aria-labelledby={titleId}
      aria-describedby={summaryId}
      data-hito-component="factual-bar-chart"
      data-status={series.status}
    >
      <figcaption className="grid min-w-0 gap-2">
        <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 id={titleId} className="hito-ui-title-sm">
            {getHitoKnownProductMessage(locale, series.title)}
          </h3>
          <span className="hito-technical-sm text-secondary">{series.unitLabel}</span>
        </div>
        <p id={summaryId} className="hito-body-sm text-secondary max-w-3xl">
          {getHitoKnownProductMessage(locale, series.purpose)}
        </p>
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
        {getHitoKnownProductMessage(locale, period.label)} ·{" "}
        <time dateTime={period.startDate}>
          {formatUiDate(period.startDate, locale, {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </time>
        –
        <time dateTime={period.endDate}>
          {formatUiDate(period.endDate, locale, {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </time>{" "}
        · {getHitoKnownProductMessage(locale, series.evidenceLabel)}
      </p>

      {series.status === "ready" ? (
        <ReadyFactualBarChart locale={locale} period={period} series={series} />
      ) : (
        <article
          className="hito-state-surface"
          data-size="md"
          data-tone={series.status === "error" ? "destructive" : "warning"}
          role={series.status === "error" ? "alert" : "status"}
        >
          <p className="hito-label-md">
            {getHitoProductMessage(
              locale,
              series.status === "error" ? "Chart unavailable" : "Updating chart",
            )}
          </p>
          <p className="hito-body-sm mt-2 text-secondary">
            {getHitoKnownProductMessage(locale, series.reasonLabel)}
          </p>
          {stateAction ? <div className="hito-state-actions">{stateAction}</div> : null}
        </article>
      )}
    </figure>
  );
}

function ReadyFactualBarChart({
  locale,
  period,
  series,
}: {
  locale: ResolvedUiLocale;
  period: HitoFactualBarChartPeriod;
  series: ReadySeries;
}) {
  const initialIndex = firstAvailablePointIndex(series.points);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [pinnedIndex, setPinnedIndex] = useState<number | null>(null);
  const pointRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const pointIdentity = series.points.map((point) => point.id).join("|");
  const maxValue = Math.max(
    0,
    ...series.points.map((point) => (point.value === null ? 0 : point.value)),
  );
  const guideIndex = pinnedIndex ?? hoveredIndex ?? focusedIndex ?? activeIndex;
  const guidePoint = series.points[guideIndex] ?? null;
  const guideHeight = pointHeight(guidePoint, maxValue);

  useEffect(() => {
    const nextIndex = firstAvailablePointIndex(series.points);
    setActiveIndex(nextIndex);
    setFocusedIndex(null);
    setHoveredIndex(null);
    setPinnedIndex(null);
  }, [pointIdentity, series.points]);

  const moveActivePoint = (nextIndex: number) => {
    if (!series.points.length) return;
    const boundedIndex = Math.max(0, Math.min(nextIndex, series.points.length - 1));
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
      moveActivePoint(series.points.length - 1);
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

  const plotStyle = {
    "--hito-factual-bar-count": Math.max(series.points.length, 1),
  } as CSSProperties;

  return (
    <TooltipProvider delayDuration={100}>
      <div className="grid min-w-0 gap-4">
        <div
          className="max-w-full overflow-x-auto overscroll-x-contain pb-1"
          aria-label={formatHitoProductMessage(locale, "{title} plot scroll region", {
            title: getHitoKnownProductMessage(locale, series.title),
          })}
        >
          <div
            className="relative grid h-[calc(var(--space-10)*6)] min-w-full items-stretch border-b border-hairline"
            style={{
              ...plotStyle,
              gridTemplateColumns:
                "repeat(var(--hito-factual-bar-count), minmax(calc(var(--space-10) + var(--space-1)), 1fr))",
              minWidth: "calc(var(--hito-factual-bar-count) * (var(--space-10) + var(--space-1)))",
            }}
            role="group"
            aria-label={formatHitoProductMessage(
              locale,
              "{title}, {period}, {startDate} to {endDate}",
              {
                title: getHitoKnownProductMessage(locale, series.title),
                period: getHitoKnownProductMessage(locale, period.label),
                startDate: period.startDate,
                endDate: period.endDate,
              },
            )}
            data-hito-factual-chart-plot
          >
            <span className="pointer-events-none absolute inset-x-0 top-0 border-t border-hairline" />
            <span className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-hairline" />
            <span className="hito-technical-sm text-tertiary pointer-events-none absolute bottom-1 left-1 z-10">
              0 {series.unitLabel}
            </span>
            {guidePoint?.value !== null ? (
              <span
                className="pointer-events-none absolute inset-x-0 z-10 border-t border-dashed"
                style={{
                  borderColor: "var(--color-chart-1)",
                  bottom: `${guideHeight}%`,
                }}
                aria-hidden="true"
                data-hito-factual-chart-guide
              />
            ) : null}

            {series.points.map((point, index) => {
              const height = pointHeight(point, maxValue);
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
                      className="relative z-20 grid min-w-0 grid-rows-[minmax(0,1fr)_auto] gap-2 rounded-lg px-1 pb-1 pt-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      tabIndex={activeIndex === index ? 0 : -1}
                      aria-label={pointAccessibleName(series, point, locale)}
                      aria-pressed={pinnedIndex === index}
                      data-point-id={point.id}
                      data-point-state={point.state}
                      data-point-zero={point.state !== "unavailable" && point.value === 0}
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
                      <span className="relative flex min-h-0 items-end justify-center" aria-hidden>
                        {point.state === "unavailable" ? (
                          <span className="hito-label-sm text-secondary mb-1 rounded-md border border-dashed border-foreground px-1 py-0.5">
                            N/A
                          </span>
                        ) : point.value === 0 ? (
                          <span className="mb-1 h-1 w-6 rounded-full bg-chart-1" />
                        ) : (
                          <span
                            className={cn(
                              "relative w-full max-w-[var(--space-10)] rounded-t-lg bg-chart-1",
                              point.state === "partial" && "border border-chart-1",
                            )}
                            style={{
                              height: `${height}%`,
                              background:
                                point.state === "partial"
                                  ? "repeating-linear-gradient(135deg, var(--color-chart-1) 0, var(--color-chart-1) var(--space-1), color-mix(in oklch, var(--color-chart-1) 34%, transparent) var(--space-1), color-mix(in oklch, var(--color-chart-1) 34%, transparent) calc(var(--space-1) * 2))"
                                  : undefined,
                            }}
                          ></span>
                        )}
                      </span>
                      <span className="hito-label-sm text-secondary truncate text-center">
                        {getHitoKnownProductMessage(locale, point.shortLabel)}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={8} className="max-w-xs">
                    <FactualPointReadback locale={locale} point={point} series={series} />
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {series.points.some((point) => point.state !== "available") ? (
          <div className="hito-body-xs text-secondary flex flex-wrap gap-x-4 gap-y-1">
            {series.points.some((point) => point.state === "partial") ? (
              <span>{getHitoProductMessage(locale, "Partial · striped bar")}</span>
            ) : null}
            {series.points.some((point) => point.state === "unavailable") ? (
              <span>{getHitoProductMessage(locale, "Unavailable · N/A gap marker")}</span>
            ) : null}
          </div>
        ) : null}

        {pinnedIndex !== null && series.points[pinnedIndex] ? (
          <div
            className="hito-state-surface flex min-w-0 items-start justify-between gap-3"
            data-size="sm"
            data-tone="neutral"
            role="status"
            aria-live="polite"
            data-hito-factual-chart-pinned-readback
          >
            <FactualPointReadback
              locale={locale}
              point={series.points[pinnedIndex]}
              series={series}
            />
            <HitoButton
              size="xs"
              variant="ghost"
              iconOnly
              aria-label={getHitoProductMessage(locale, "Close active point")}
              onClick={() => {
                pointRefs.current[activeIndex]?.focus();
                setPinnedIndex(null);
              }}
            >
              <Icon name="close" size="xs" decorative />
            </HitoButton>
          </div>
        ) : null}

        <FactualChartDataTable locale={locale} period={period} series={series} />
      </div>
    </TooltipProvider>
  );
}

function FactualPointReadback({
  locale,
  point,
  series,
}: {
  locale: ResolvedUiLocale;
  point: RunnerActivityFitChartPoint;
  series: ReadySeries;
}) {
  return (
    <div className="grid min-w-0 gap-1">
      <p className="hito-label-md">{getHitoKnownProductMessage(locale, series.title)}</p>
      <p className="hito-body-sm">
        {pointPeriodLabel(point, locale)} · {pointDisplayValue(point, locale)}
      </p>
      <p className="hito-body-xs text-secondary">
        {pointCompletionLabel(point, locale)} · {pointStateLabel(point.state, locale)} ·{" "}
        {pointCoverageLabel(point, locale)}
      </p>
      {point.reasonLabels.length ? (
        <p className="hito-body-xs text-secondary">
          {point.reasonLabels.map((reason) => getHitoKnownProductMessage(locale, reason)).join(" ")}
        </p>
      ) : null}
      <p className="hito-technical-sm text-tertiary">
        {getHitoKnownProductMessage(locale, series.evidenceLabel)}
      </p>
    </div>
  );
}

function FactualChartDataTable({
  locale,
  period,
  series,
}: {
  locale: ResolvedUiLocale;
  period: HitoFactualBarChartPeriod;
  series: ReadySeries;
}) {
  return (
    <details className="hito-disclosure">
      <summary className="hito-disclosure-summary min-h-11">
        <span>{getHitoProductMessage(locale, "View data")}</span>
        <Icon name="chevron-down" size="xs" className="hito-disclosure-chevron" decorative />
      </summary>
      <div className="hito-disclosure-body">
        <div
          className="hito-data-table-scroll"
          role="region"
          aria-label={formatHitoProductMessage(locale, "{title} data table", {
            title: getHitoKnownProductMessage(locale, series.title),
          })}
          tabIndex={0}
        >
          <table className="hito-data-table hito-data-table-min-lg">
            <caption className="sr-only">
              {formatHitoProductMessage(locale, "{title}, {period}, {startDate} to {endDate}", {
                title: getHitoKnownProductMessage(locale, series.title),
                period: getHitoKnownProductMessage(locale, period.label),
                startDate: period.startDate,
                endDate: period.endDate,
              })}
            </caption>
            <thead>
              <tr>
                {["Period", "Value", "Completion", "State", "Coverage", "Reason"].map((heading) => (
                  <th key={heading} scope="col" className="hito-data-table-cell text-left">
                    {getHitoKnownProductMessage(locale, heading)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {series.points.map((point) => (
                <tr key={point.id}>
                  <th scope="row" className="hito-data-table-cell hito-data-table-cell-start">
                    {pointPeriodLabel(point, locale)}
                  </th>
                  <td className="hito-data-table-cell whitespace-nowrap tabular-nums">
                    {pointDisplayValue(point, locale)}
                  </td>
                  <td className="hito-data-table-cell">{pointCompletionLabel(point, locale)}</td>
                  <td className="hito-data-table-cell">{pointStateLabel(point.state, locale)}</td>
                  <td className="hito-data-table-cell">{pointCoverageLabel(point, locale)}</td>
                  <td className="hito-data-table-cell hito-data-table-cell-end">
                    {point.reasonLabels.length
                      ? point.reasonLabels
                          .map((reason) => getHitoKnownProductMessage(locale, reason))
                          .join(" ")
                      : getHitoProductMessage(locale, "Not applicable")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </details>
  );
}

function firstAvailablePointIndex(points: readonly RunnerActivityFitChartPoint[]) {
  const index = points.findIndex((point) => point.state !== "unavailable");
  return index >= 0 ? index : 0;
}

function pointHeight(point: RunnerActivityFitChartPoint | null, maxValue: number) {
  if (!point || point.value === null || maxValue <= 0) return 0;
  return Math.max(0, Math.min((point.value / maxValue) * 100, 100));
}

function pointStateLabel(state: RunnerActivityFitChartPoint["state"], locale: ResolvedUiLocale) {
  if (state === "partial") return getHitoProductMessage(locale, "Partial");
  if (state === "unavailable") return getHitoProductMessage(locale, "Unavailable");
  return getHitoProductMessage(locale, "Available");
}

function pointPeriodLabel(point: RunnerActivityFitChartPoint, locale: ResolvedUiLocale) {
  const dateOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  } as const;

  return formatHitoProductMessage(locale, "{startDate} through {endDate}", {
    startDate: formatUiDate(point.startDate, locale, dateOptions),
    endDate: formatUiDate(point.endDate, locale, dateOptions),
  });
}

function pointCompletionLabel(point: RunnerActivityFitChartPoint, locale: ResolvedUiLocale) {
  return getHitoProductMessage(locale, point.completionLabel);
}

function pointCoverageLabel(point: RunnerActivityFitChartPoint, locale: ResolvedUiLocale) {
  return formatHitoProductMessage(
    locale,
    "{includedCount} of {candidateCount} accepted activities",
    {
      includedCount: formatUiNumber(point.coverage.includedCount, locale),
      candidateCount: formatUiNumber(point.coverage.candidateCount, locale),
    },
  );
}

function pointDisplayValue(point: RunnerActivityFitChartPoint, locale: ResolvedUiLocale) {
  return point.displayValue ?? getHitoProductMessage(locale, "Unavailable");
}

function pointAccessibleName(
  series: ReadySeries,
  point: RunnerActivityFitChartPoint,
  locale: ResolvedUiLocale,
) {
  const value = pointDisplayValue(point, locale);
  const reason = point.reasonLabels.length
    ? ` ${point.reasonLabels.map((item) => getHitoKnownProductMessage(locale, item)).join(" ")}`
    : "";
  return `${pointPeriodLabel(point, locale)}. ${getHitoKnownProductMessage(locale, series.title)}: ${value}. ${pointCompletionLabel(point, locale)}. ${pointStateLabel(point.state, locale)}. ${pointCoverageLabel(point, locale)}.${reason}`;
}
