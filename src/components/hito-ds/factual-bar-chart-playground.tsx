import { useState } from "react";

import { HitoDsPlayground } from "@/components/hito-ds/playground";
import { ReferenceListRow } from "@/components/hito-ds/reference";
import { HitoDsWorkbenchChoiceControl } from "@/components/hito-ds/workbench-settings-controls";
import { HitoButton } from "@/components/ui/button";
import {
  HitoFactualBarChart,
  type HitoFactualBarChartPeriod,
  type HitoFactualBarChartSeries,
} from "@/components/ui/hito-factual-bar-chart";

const CHART_STATES = [
  { label: "Ready", value: "ready" },
  { label: "Updating", value: "updating" },
  { label: "Error", value: "error" },
] as const;

type ChartState = (typeof CHART_STATES)[number]["value"];

export const FACTUAL_PERIOD = {
  id: "28_days",
  label: "28 days",
  startDate: "2026-07-20",
  endDate: "2026-08-16",
  state: "to_date",
  bucketResolution: "calendar_week",
} satisfies HitoFactualBarChartPeriod;

export const READY_DISTANCE_SERIES = {
  id: "distance",
  title: "Distance by week",
  purpose: "Compare supplied weekly FIT distance facts inside one exact advertised period.",
  status: "ready",
  unit: "kilometers",
  unitLabel: "km",
  display: { format: "decimal", maximumFractionDigits: 1 },
  evidenceLabel: "From FIT file",
  formulaVersion: "runner_activity_fit_progress_v1",
  points: [
    {
      id: "2026-07-20",
      startDate: "2026-07-20",
      endDate: "2026-07-26",
      cutoffDate: "2026-07-26",
      shortLabel: "Jul 20",
      accessibleLabel: "July 20 to July 26",
      completion: "complete",
      completionLabel: "Complete week",
      state: "available",
      value: 0,
      displayValue: "0",
      coverage: {
        includedCount: 0,
        candidateCount: 0,
        missingCount: 0,
        label: "0 of 0 activities included",
      },
      reasons: [],
      reasonLabels: [],
    },
    {
      id: "2026-07-27",
      startDate: "2026-07-27",
      endDate: "2026-08-02",
      cutoffDate: "2026-08-02",
      shortLabel: "Jul 27",
      accessibleLabel: "July 27 to August 2",
      completion: "complete",
      completionLabel: "Complete week",
      state: "available",
      value: 32.4,
      displayValue: "32.4",
      coverage: {
        includedCount: 4,
        candidateCount: 4,
        missingCount: 0,
        label: "4 of 4 activities included",
      },
      reasons: [],
      reasonLabels: [],
    },
    {
      id: "2026-08-03",
      startDate: "2026-08-03",
      endDate: "2026-08-09",
      cutoffDate: "2026-08-09",
      shortLabel: "Aug 3",
      accessibleLabel: "August 3 to August 9",
      completion: "complete",
      completionLabel: "Complete week",
      state: "partial",
      value: 21.8,
      displayValue: "21.8",
      coverage: {
        includedCount: 3,
        candidateCount: 4,
        missingCount: 1,
        label: "3 of 4 activities included",
      },
      reasons: ["fit_distance_missing"],
      reasonLabels: ["One FIT file did not include distance."],
    },
    {
      id: "2026-08-10",
      startDate: "2026-08-10",
      endDate: "2026-08-16",
      cutoffDate: "2026-08-16",
      shortLabel: "Aug 10",
      accessibleLabel: "August 10 to August 16",
      completion: "to_date",
      completionLabel: "To date",
      state: "unavailable",
      value: null,
      displayValue: null,
      coverage: {
        includedCount: 0,
        candidateCount: 2,
        missingCount: 2,
        label: "0 of 2 activities included",
      },
      reasons: ["fit_distance_unavailable"],
      reasonLabels: ["Distance is unavailable in the attached FIT evidence."],
    },
  ],
} satisfies HitoFactualBarChartSeries;

const UPDATING_DISTANCE_SERIES = {
  id: "distance",
  title: "Distance by week",
  purpose: "Compare supplied weekly FIT distance facts inside one exact advertised period.",
  status: "updating",
  unit: "kilometers",
  unitLabel: "km",
  display: { format: "decimal", maximumFractionDigits: 1 },
  evidenceLabel: "From FIT file",
  formulaVersion: "runner_activity_fit_progress_v1",
  reason: "fit_evidence_updating",
  reasonLabel: "FIT evidence is updating.",
  staleValuesReturned: false,
  points: [],
} satisfies HitoFactualBarChartSeries;

const ERROR_DISTANCE_SERIES = {
  id: "distance",
  title: "Distance by week",
  purpose: "Compare supplied weekly FIT distance facts inside one exact advertised period.",
  status: "error",
  unit: "kilometers",
  unitLabel: "km",
  display: { format: "decimal", maximumFractionDigits: 1 },
  evidenceLabel: "From FIT file",
  reasonLabel: "Distance evidence could not be loaded. Try again.",
  points: [],
} satisfies HitoFactualBarChartSeries;

const SERIES_BY_STATE: Record<ChartState, HitoFactualBarChartSeries> = {
  ready: READY_DISTANCE_SERIES,
  updating: UPDATING_DISTANCE_SERIES,
  error: ERROR_DISTANCE_SERIES,
};

export function FactualBarChartPlayground() {
  const [chartState, setChartState] = useState<ChartState>("ready");

  return (
    <HitoDsPlayground
      id="factual-bar-chart"
      label="Factual Bar Chart"
      status="Shared component"
      statusTone="signal"
      description={{
        purpose:
          "Render one Backend-shaped factual series with exact point readback and native table parity.",
        useWhen:
          "Ordered buckets already contain period, value, unit, completion, coverage, state, and reason truth.",
        avoidWhen:
          "The client would need to aggregate, clip, choose a metric, infer coverage, mix units, or calculate a record winner.",
        accessibility:
          "The plot has one page tab stop, Arrow and Home/End navigation, native Enter/Space pinning, Escape dismissal, identical pointer/focus/tap facts, and a visible native data-table disclosure.",
      }}
      usedIn={
        <span className="hito-technical-sm text-secondary">
          Runner Progress · Product adoption pending
        </span>
      }
      preview={
        <div className="w-full min-w-0" data-hito-ds-factual-bar-chart>
          <HitoFactualBarChart
            key={chartState}
            controls={{
              ariaLabel: "Factual bar chart reference controls",
              content: (
                <HitoDsWorkbenchChoiceControl
                  label="Reference state"
                  value={chartState}
                  options={CHART_STATES}
                  onChange={setChartState}
                />
              ),
            }}
            period={FACTUAL_PERIOD}
            series={SERIES_BY_STATE[chartState]}
            stateAction={
              chartState === "error" ? (
                <HitoButton size="sm" variant="secondary" onClick={() => setChartState("ready")}>
                  Try again
                </HitoButton>
              ) : undefined
            }
          />
        </div>
      }
      controls={
        <div className="hito-row-group border-0">
          <ReferenceListRow
            label="Input boundary"
            title="One supplied series"
            body="The primitive receives ordered buckets and presentation-ready factual labels. Metric choice, period choice, aggregation, coverage, and record selection stay outside the component."
          />
        </div>
      }
    />
  );
}
