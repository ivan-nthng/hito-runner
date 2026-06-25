import { useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  HitoCalendarDayCell,
  type HitoCalendarWorkoutIdentity,
} from "@/components/ui/hito-calendar-day";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { WorkoutGlyphKind } from "@/lib/workout-glyph";
import type {
  RunningPlanRange,
  RunningPlanSegmentPrescription,
  RunningPlanWorkoutDayKind,
} from "@/lib/plan-creation-engine";
import type {
  RunningPlanConfirmActionResult,
  RunningPlanPreviewActionResult,
} from "@/lib/running-plan-engine-actions";

type SelectedRunningPlanPreviewResult = RunningPlanPreviewActionResult;
type SelectedRunningPlanPreviewDraft = Extract<
  SelectedRunningPlanPreviewResult,
  { ok: true }
>["draft"];
type SelectedRunningPlanPreviewUnavailable = Extract<
  SelectedRunningPlanPreviewResult,
  { ok: false }
>["unavailable"];
type SelectedRunningPlanCalendarRow = SelectedRunningPlanPreviewDraft["calendarRows"][number];
type SelectedRunningPlanPreviewStatus = "idle" | "loading_cards" | "previewing_plan";
type RunningPlanCreateStatus = "idle" | "creating";
type PreviewCalendarTone =
  | "easy"
  | "long"
  | "strides"
  | "tempo"
  | "intervals"
  | "hills"
  | "rest"
  | "final";

interface SelectedRunningPlanPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  confirmResult: RunningPlanConfirmActionResult | null;
  createStatus: RunningPlanCreateStatus;
  result: SelectedRunningPlanPreviewResult | null;
  status: SelectedRunningPlanPreviewStatus;
  error: string | null;
  onRefresh: () => void;
  onCreate: () => void;
  description?: string;
  primaryActionLabel?: string;
  primaryActionPendingLabel?: string;
  extraNotice?: ReactNode;
}

export function SelectedRunningPlanPreviewDialog({
  confirmResult,
  createStatus,
  error,
  onCreate,
  onOpenChange,
  onRefresh,
  open,
  description = "Backend-built preview from the running plan engine. Create confirms this reviewed preview server-side before anything is saved.",
  primaryActionLabel = "Create plan",
  primaryActionPendingLabel = "Creating plan...",
  extraNotice,
  result,
  status,
}: SelectedRunningPlanPreviewDialogProps) {
  const loading = status === "previewing_plan";
  const creating = createStatus === "creating";
  const draft = result?.ok ? result.draft : null;
  const unavailable = result && !result.ok ? result.unavailable : null;
  const reviewReady = Boolean(draft?.reviewToken && draft?.reviewChecksum);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="hito-dialog-stable hito-product-dialog hito-dialog-surface-product hito-dialog-size-review hito-dialog-height-review"
        overlayClassName="hito-dialog-overlay-stable"
      >
        <DialogHeader className="hito-product-dialog-header">
          <div className="min-w-0">
            <p className="hito-micro-label" data-tone="signal">
              Selected plan
            </p>
            <DialogTitle className="hito-modal-title mt-2">
              {draft?.planFamily ?? unavailable?.planFamily ?? "Selected"} plan preview
            </DialogTitle>
            <DialogDescription className="hito-body max-w-2xl">{description}</DialogDescription>
          </div>
        </DialogHeader>

        <div className="hito-product-dialog-body-scroll-fill">
          {loading && !draft ? (
            <div className="hito-surface-wash" data-tone="signal">
              <p className="hito-list-row-title">Building preview</p>
              <p className="hito-list-row-copy">
                Hito is asking the accepted running-plan builder for calendar rows, endpoint proof,
                and watch-executable segment structure.
              </p>
            </div>
          ) : null}

          {error ? (
            <div className="hito-surface-wash" data-tone="destructive">
              <p className="hito-list-row-title">Preview unavailable</p>
              <p className="hito-list-row-copy">{error}</p>
            </div>
          ) : null}

          {unavailable ? <PreviewUnavailableState result={unavailable} /> : null}
          {draft ? <PreviewDraftView draft={draft} /> : null}
          {confirmResult && !confirmResult.ok ? (
            <CreateBlockedNotice result={confirmResult} />
          ) : null}
          {extraNotice}
        </div>

        <DialogFooter className="hito-product-dialog-footer sm:space-x-0">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            {draft ? (
              <>
                <span className="hito-status-pill" data-tone="success">
                  Reviewed
                </span>
                <span className="hito-status-pill" data-tone="muted">
                  Not saved yet
                </span>
                <span className="hito-status-pill" data-tone="muted">
                  No OpenAI
                </span>
              </>
            ) : null}
          </div>
          <button
            type="button"
            className="hito-button hito-button-secondary hito-button-md"
            disabled={loading || creating}
            onClick={onRefresh}
          >
            {loading ? "Refreshing..." : "Refresh preview"}
          </button>
          <button
            type="button"
            className="hito-button hito-button-primary hito-button-md"
            disabled={!reviewReady || loading || creating}
            onClick={onCreate}
          >
            {creating
              ? primaryActionPendingLabel
              : reviewReady
                ? primaryActionLabel
                : "Review required"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateBlockedNotice({
  result,
}: {
  result: Extract<RunningPlanConfirmActionResult, { ok: false }>;
}) {
  const view = createBlockedView(result);

  return (
    <div className="hito-surface-wash" data-tone={view.tone}>
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="hito-list-row-title">{view.title}</p>
          <p className="hito-list-row-copy">{view.copy}</p>
          {view.helper ? <p className="hito-field-helper mt-2">{view.helper}</p> : null}
        </div>
        {view.openPlan ? (
          <a href="/" className="hito-button hito-button-secondary hito-button-sm shrink-0">
            Back to calendar
          </a>
        ) : null}
      </div>
    </div>
  );
}

function createBlockedView(result: Extract<RunningPlanConfirmActionResult, { ok: false }>): {
  title: string;
  copy: string;
  helper?: string;
  openPlan?: boolean;
  tone: "destructive" | "signal";
} {
  switch (result.reason) {
    case "active_plan_exists":
      return {
        title: "Active plan already exists",
        copy: "Selected plans can create a new plan only when there is no active plan.",
        helper: "Use Add plan from the calendar to start a reviewed plan change.",
        openPlan: true,
        tone: "signal",
      };
    case "stale_review":
    case "invalid_review":
    case "input_mismatch":
    case "preview_unavailable":
      return {
        title: "Refresh this preview",
        copy: "This reviewed preview is no longer current. Refresh the selected preview, then create again.",
        helper: result.message,
        tone: "signal",
      };
    case "unauthenticated":
      return {
        title: "Sign in before creating",
        copy: "This session cannot create a selected running plan yet.",
        helper: result.message,
        tone: "destructive",
      };
    case "unsupported_family":
      return {
        title: "Selected family unavailable",
        copy: "This selected-plan family is not ready to create from this preview.",
        helper: result.message,
        tone: "signal",
      };
    case "persistence_failed":
      return {
        title: "Plan was not created",
        copy: "The selected running plan could not be saved. The current plan is unchanged.",
        helper: result.message,
        tone: "destructive",
      };
  }
}

function PreviewUnavailableState({ result }: { result: SelectedRunningPlanPreviewUnavailable }) {
  return (
    <div className="grid gap-4">
      <div className="hito-surface-wash" data-tone="destructive">
        <p className="hito-list-row-title">
          {result.planFamily} preview cannot be built from this setup
        </p>
        <p className="hito-list-row-copy">{result.error.message}</p>
      </div>
      <div className="hito-row-group">
        <div className="hito-list-row items-start">
          <PreviewFact label="Source kind" value={result.sourceKind} />
          <PreviewFact label="Persistence" value="preview only · no mutation" />
          <PreviewFact label="Reason" value={result.error.code} />
        </div>
      </div>
    </div>
  );
}

function PreviewDraftView({ draft }: { draft: SelectedRunningPlanPreviewDraft }) {
  const rowsByWeek = groupRowsByWeek(draft.calendarRows);
  const nonRestRows = draft.calendarRows.filter((row) => !row.isRestDay);
  const endpointRow =
    draft.calendarRows.find((row) => row.rowId === draft.endpointProof.finalRowId) ??
    nonRestRows.at(-1) ??
    null;
  const sampleRow =
    nonRestRows.find(
      (row) =>
        row.workoutDayKind !== "easy" &&
        row.workoutDayKind !== "recovery" &&
        row.workoutDayKind !== "final_selected_distance_day" &&
        row.workoutDayKind !== "marathon_base_endpoint",
    ) ??
    nonRestRows.find(
      (row) =>
        row.workoutDayKind !== "final_selected_distance_day" &&
        row.workoutDayKind !== "marathon_base_endpoint",
    ) ??
    null;
  const [activeCalendarRowId, setActiveCalendarRowId] = useState<string | null>(
    endpointRow?.rowId ?? sampleRow?.rowId ?? draft.calendarRows[0]?.rowId ?? null,
  );
  const activeCalendarRow =
    draft.calendarRows.find((row) => row.rowId === activeCalendarRowId) ??
    endpointRow ??
    sampleRow ??
    draft.calendarRows[0] ??
    null;

  return (
    <div className="grid gap-6">
      <section className="hito-row-group">
        <div className="hito-list-row items-start">
          <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <PreviewFact label="Plan family" value={draft.planFamily} />
            <PreviewFact
              label="Duration"
              value={`${rowsByWeek.length} weeks · ${draft.calendarRows.length} rows`}
            />
            <PreviewFact
              label="Rhythm"
              value={`${draft.normalizedInputSummary.daysPerWeek} runs/week`}
            />
            <PreviewFact label="Metric truth" value={metricTruthReadback(draft)} />
            <PreviewFact label="Start date" value={draft.normalizedInputSummary.startDate} />
            <PreviewFact
              label="Fixed rest"
              value={
                draft.normalizedInputSummary.fixedRestDays.length
                  ? draft.normalizedInputSummary.fixedRestDays.join(", ")
                  : "backend default/open"
              }
            />
            <PreviewFact
              label="Long run"
              value={`${draft.normalizedInputSummary.preferredLongRunDay ?? "backend fallback"} · ${
                draft.normalizedInputSummary.longRunDaySource
              }`}
            />
            <PreviewFact
              label="Training weekdays"
              value={draft.normalizedInputSummary.trainingWeekdays.join(", ")}
            />
            <PreviewFact label="Load context" value={draft.normalizedInputSummary.loadContext} />
          </div>
        </div>

        <div className="hito-list-row items-start">
          <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <PreviewFact label="Source kind" value={draft.sourceKind} />
            <PreviewFact label="Persistence" value="persisted false · mutates false" />
            <PreviewFact label="AI" value="callsOpenAi false" />
            <PreviewFact label="Validation" value="endpoint and watch-executable gates passed" />
          </div>
        </div>
      </section>

      <section className="grid gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="hito-label">{rowsByWeek.length}-week calendar preview</p>
            <p className="hito-list-row-copy">
              See how Hito places rest days, long runs, quality touches, and the final{" "}
              {finalPreviewLabel(draft)} before create is available.
            </p>
          </div>
          <span className="hito-status-pill" data-tone="signal">
            {nonRestRows.length} watch-executable runs
          </span>
        </div>

        <div className="hito-selected-plan-calendar grid gap-2">
          <div className="hito-selected-plan-calendar-legend" aria-label="Calendar legend">
            <PreviewLegendItem tone="easy" label="Easy" />
            <PreviewLegendItem tone="long" label="Long" />
            <PreviewLegendItem tone="strides" label="Strides" />
            <PreviewLegendItem tone="tempo" label="Tempo" />
            <PreviewLegendItem tone="intervals" label="Intervals" />
            <PreviewLegendItem tone="hills" label="Hills" />
            <PreviewLegendItem tone="rest" label="Rest" />
            <PreviewLegendItem tone="final" label={`Final ${finalPreviewLabel(draft)}`} />
          </div>

          <TooltipProvider delayDuration={120}>
            <div
              className="hito-selected-plan-calendar-weeks"
              aria-label={`${draft.planFamily} preview calendar`}
            >
              {rowsByWeek.map(([weekNumber, rows]) => (
                <div key={weekNumber} className="hito-selected-plan-calendar-week">
                  <p className="hito-label">Week {weekNumber}</p>
                  <div className="hito-selected-plan-calendar-week-grid">
                    {rows.map((row) => {
                      const meta = workoutKindMeta(row.workoutDayKind);
                      const tone = calendarTone(row);
                      const endpoint = calendarEndpointReadback(row);
                      const day = formatCalendarDayNumber(row.date);
                      const selected = row.rowId === activeCalendarRowId;
                      const ariaLabel = [
                        `${row.date} ${row.weekday}`,
                        meta.label,
                        row.title,
                        endpoint,
                      ]
                        .filter(Boolean)
                        .join(". ");
                      const presentation = buildPreviewCalendarDayPresentation(row);

                      return (
                        <Tooltip key={row.rowId}>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="block aspect-square min-w-0 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-signal/30"
                              data-preview-tone={tone}
                              aria-label={ariaLabel}
                              aria-pressed={selected}
                              onClick={() => setActiveCalendarRowId(row.rowId)}
                              onFocus={() => setActiveCalendarRowId(row.rowId)}
                              onMouseEnter={() => setActiveCalendarRowId(row.rowId)}
                            >
                              <HitoCalendarDayCell
                                {...presentation}
                                className="h-full rounded-md border border-hairline p-1"
                                day={day}
                                dense
                                interactive
                                selected={selected}
                              />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-80" sideOffset={8}>
                            <span className="hito-tooltip-meta block">
                              {row.date} · {row.weekday} · {meta.label}
                            </span>
                            <span className="hito-tooltip-title mt-1 block">{row.title}</span>
                            {endpoint ? (
                              <span className="hito-tooltip-meta mt-1 block">{endpoint}</span>
                            ) : null}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </TooltipProvider>

          {activeCalendarRow ? <PreviewCalendarDetail row={activeCalendarRow} /> : null}
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)]">
        <div className="hito-row-group min-w-0">
          <div className="hito-list-row items-start">
            <div className="grid gap-3">
              <p className="hito-label">{endpointProofLabel(draft)}</p>
              <p className="hito-list-row-title">{endpointProofTitle(draft)}</p>
              <p className="hito-list-row-copy">{endpointProofCopy(draft)}</p>
              <EndpointProofPills draft={draft} />
            </div>
          </div>
        </div>

        <div className="hito-row-group min-w-0">
          <div className="hito-list-row items-start">
            <div className="grid gap-3">
              <p className="hito-label">Expected outcome</p>
              <p className="hito-list-row-title">{expectedOutcomeTitle(draft)}</p>
              <p className="hito-list-row-copy">{expectedOutcomeCopy(draft)}</p>
            </div>
          </div>
        </div>
      </section>

      <FamilyReadback draft={draft} rows={draft.calendarRows} />

      <section className="grid gap-3">
        <div>
          <p className="hito-label">Workout structure readback</p>
          <p className="hito-list-row-copy">
            Numeric segment anatomy comes first. Cues stay secondary explanation.
          </p>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {endpointRow ? (
            <SegmentReadbackCard
              benchmarkPaceAvailable={Boolean(draft.normalizedInputSummary.benchmarkPaceTruth)}
              label="Endpoint day"
              row={endpointRow}
            />
          ) : null}
          {sampleRow ? (
            <SegmentReadbackCard
              benchmarkPaceAvailable={Boolean(draft.normalizedInputSummary.benchmarkPaceTruth)}
              label="Sample workout day"
              row={sampleRow}
            />
          ) : null}
        </div>
      </section>
    </div>
  );
}

function EndpointProofPills({ draft }: { draft: SelectedRunningPlanPreviewDraft }) {
  const exactEndpoint = draft.endpointProof.endpointMainDistanceMeters;

  if (draft.planFamily === "Marathon Base") {
    return (
      <div className="flex flex-wrap gap-2">
        <span className="hito-status-pill" data-tone="success">
          marathon_base_endpoint
        </span>
        <span className="hito-status-pill" data-tone="muted">
          base-building preview
        </span>
        <span className="hito-status-pill" data-tone="muted">
          durability focus
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <span className="hito-status-pill" data-tone="success">
        {exactEndpoint}m endpoint
      </span>
      <span className="hito-status-pill" data-tone="muted">
        no fake pace
      </span>
      <span className="hito-status-pill" data-tone="muted">
        no fake personal HR
      </span>
    </div>
  );
}

function FamilyReadback({
  draft,
  rows,
}: {
  draft: SelectedRunningPlanPreviewDraft;
  rows: readonly SelectedRunningPlanCalendarRow[];
}) {
  if (draft.planFamily === "Half Marathon") {
    const thresholdPresent = rows.some((row) => row.workoutDayKind === "threshold");

    return (
      <section className="hito-row-group">
        <div className="hito-list-row items-start">
          <div className="grid gap-3">
            <p className="hito-label">Half Marathon shape</p>
            <p className="hito-list-row-title">
              Exact 21100m endpoint with long-run progression and controlled quality.
            </p>
            <p className="hito-list-row-copy">
              Threshold appears only when the backend builder supplies it for higher-support
              standard-load runners; lower-support previews stay more conservative.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="hito-status-pill" data-tone="success">
                exact 21100m
              </span>
              <span className="hito-status-pill" data-tone={thresholdPresent ? "signal" : "muted"}>
                {thresholdPresent ? "threshold present" : "no threshold"}
              </span>
              <span className="hito-status-pill" data-tone="muted">
                long-run progression
              </span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (draft.planFamily === "Marathon Base") {
    const intervalsPresent = rows.some((row) => row.workoutDayKind === "intervals");

    return (
      <section className="hito-row-group">
        <div className="hito-list-row items-start">
          <div className="grid gap-3">
            <p className="hito-label">Marathon Base shape</p>
            <p className="hito-list-row-title">
              Base-building preview with a controlled final durability checkpoint.
            </p>
            <p className="hito-list-row-copy">
              This is a base-building preview, not a selected-distance marathon race plan. It keeps
              durability, controlled steady work, and recovery rhythm visible.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="hito-status-pill" data-tone="success">
                marathon_base_endpoint
              </span>
              <span className="hito-status-pill" data-tone={intervalsPresent ? "warning" : "muted"}>
                {intervalsPresent ? "intervals present" : "no intervals"}
              </span>
              <span className="hito-status-pill" data-tone="muted">
                base durability
              </span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return null;
}

function finalPreviewLabel(draft: SelectedRunningPlanPreviewDraft) {
  if (draft.planFamily === "Half Marathon") return "Half Marathon";
  if (draft.planFamily === "Marathon Base") return "Base endpoint";

  return "10K";
}

function endpointProofLabel(draft: SelectedRunningPlanPreviewDraft) {
  return draft.planFamily === "Marathon Base" ? "Base endpoint proof" : "Endpoint proof";
}

function endpointProofTitle(draft: SelectedRunningPlanPreviewDraft) {
  if (draft.planFamily === "Marathon Base") {
    return "Final marathon-base day is a controlled durability checkpoint.";
  }

  return `Final selected-distance day ends at exactly ${draft.endpointProof.endpointMainDistanceMeters}m.`;
}

function endpointProofCopy(draft: SelectedRunningPlanPreviewDraft) {
  const baseCopy = `Final row ${draft.endpointProof.finalRowId} on ${
    draft.endpointProof.finalDate
  } is the last non-rest row and carries \`${draft.endpointProof.finalWorkoutDayKind}\`.`;

  if (draft.planFamily === "Marathon Base") {
    return `${baseCopy} The runner-facing preview stays focused on base building.`;
  }

  return baseCopy;
}

function expectedOutcomeTitle(draft: SelectedRunningPlanPreviewDraft) {
  if (draft.planFamily === "Half Marathon") {
    return "Complete a Half Marathon checkpoint day.";
  }

  if (draft.planFamily === "Marathon Base") {
    return "Build marathon-base durability.";
  }

  return "Complete a 10K checkpoint day.";
}

function expectedOutcomeCopy(draft: SelectedRunningPlanPreviewDraft) {
  if (draft.planFamily === "Half Marathon") {
    return "The preview is a watch-executable Half Marathon progression, not a target-time or race-pace promise.";
  }

  if (draft.planFamily === "Marathon Base") {
    return "The preview builds durable marathon-base rhythm without presenting a selected-distance marathon plan.";
  }

  return "The preview is a watch-executable 10K progression, not a target-time or race-pace promise.";
}

function SegmentReadbackCard({
  benchmarkPaceAvailable,
  label,
  row,
}: {
  benchmarkPaceAvailable: boolean;
  label: string;
  row: SelectedRunningPlanCalendarRow;
}) {
  const targetBadge = segmentTargetBadge(row, benchmarkPaceAvailable);

  return (
    <article className="hito-selected-plan-segment-card">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="hito-label hito-label-signal">{label}</p>
          <h3 className="hito-list-row-title mt-1">{row.title}</h3>
          <p className="hito-list-row-copy">
            {row.date} · {row.workoutDayKind}
          </p>
        </div>
        <span className="hito-status-pill" data-tone="success">
          {targetBadge}
        </span>
      </div>

      <ol className="mt-4 grid gap-2">
        {row.segments.map((segment) => (
          <li key={segment.id} className="hito-selected-plan-segment-row">
            <span className="hito-technical-mono text-muted-foreground">
              {segment.order}. {segment.segmentRole}
            </span>
            <span className="hito-body-small text-foreground/90">
              {formatPrescription(segment.primaryPrescription)}
            </span>
            <span className="hito-caption">
              {truthModeReadback(segment.targetTruthMode, benchmarkPaceAvailable)}
            </span>
            <span className="hito-caption">{segment.secondaryCue}</span>
          </li>
        ))}
      </ol>
    </article>
  );
}

function PreviewFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="hito-label">{label}</p>
      <p className="hito-body-small break-words text-muted-foreground">{value}</p>
    </div>
  );
}

function metricTruthReadback(draft: SelectedRunningPlanPreviewDraft) {
  const benchmarkPaceTruth = draft.normalizedInputSummary.benchmarkPaceTruth;
  const hasEditableDefaultHrGuidance = draft.calendarRows.some((row) =>
    row.targetTruthModes.includes("editable_default_hr"),
  );

  return benchmarkPaceTruth
    ? `${benchmarkPaceTruth.label} · personal HR targets blocked`
    : hasEditableDefaultHrGuidance
      ? "No benchmark pace supplied · estimated HR guidance where allowed"
      : "No benchmark pace supplied · structure-only targets";
}

function groupRowsByWeek(rows: readonly SelectedRunningPlanCalendarRow[]) {
  const grouped = new Map<number, SelectedRunningPlanCalendarRow[]>();

  for (const row of rows) {
    const weekRows = grouped.get(row.weekNumber) ?? [];
    weekRows.push(row);
    grouped.set(row.weekNumber, weekRows);
  }

  return [...grouped.entries()].sort(([a], [b]) => a - b);
}

function workoutKindMeta(kind: SelectedRunningPlanCalendarRow["workoutDayKind"]): {
  label: string;
  short: string;
  glyph: WorkoutGlyphKind;
} {
  const meta: Record<
    RunningPlanWorkoutDayKind,
    { label: string; short: string; glyph: WorkoutGlyphKind }
  > = {
    recovery: {
      label: "Recovery",
      short: "Recovery",
      glyph: "recovery",
    },
    easy: { label: "Easy", short: "Easy", glyph: "easy" },
    long_run: { label: "Long run", short: "Long", glyph: "long" },
    cutback_long_run: {
      label: "Cutback long run",
      short: "Cutback",
      glyph: "long",
    },
    strides: { label: "Strides", short: "Strides", glyph: "quality" },
    tempo: { label: "Tempo", short: "Tempo", glyph: "tempo" },
    threshold: {
      label: "Threshold",
      short: "Threshold",
      glyph: "tempo",
    },
    intervals: {
      label: "Intervals",
      short: "Intervals",
      glyph: "intervals",
    },
    hills: { label: "Hills", short: "Hills", glyph: "hills" },
    final_selected_distance_day: {
      label: "Final distance day",
      short: "Final",
      glyph: "race",
    },
    marathon_base_endpoint: {
      label: "Marathon base",
      short: "Base",
      glyph: "long",
    },
  };

  if (kind === "rest") {
    return { label: "Rest", short: "Rest", glyph: "rest" };
  }

  return meta[kind];
}

function PreviewLegendItem({ label, tone }: { label: string; tone: PreviewCalendarTone }) {
  return (
    <span className="hito-selected-plan-calendar-legend-item">
      <span className="hito-selected-plan-calendar-legend-swatch" data-preview-tone={tone} />
      {label}
    </span>
  );
}

function PreviewCalendarDetail({ row }: { row: SelectedRunningPlanCalendarRow }) {
  const meta = workoutKindMeta(row.workoutDayKind);
  const endpoint = calendarEndpointReadback(row);

  return (
    <div className="hito-selected-plan-calendar-detail" aria-live="polite">
      <div className="min-w-0">
        <p className="hito-body-small">
          {row.date} · {row.weekday} · {meta.label}
        </p>
        <p className="hito-list-row-title mt-1">{row.title}</p>
      </div>
      {endpoint ? (
        <span className="hito-status-pill shrink-0" data-tone="success">
          {endpoint}
        </span>
      ) : null}
    </div>
  );
}

function buildPreviewCalendarDayPresentation(row: SelectedRunningPlanCalendarRow): {
  result: "none" | "planned";
  state: "workout" | "rest";
  supportingText?: string | null;
  title?: string;
  workout: HitoCalendarWorkoutIdentity;
} {
  return {
    result: row.isRestDay ? "none" : "planned",
    state: row.isRestDay ? "rest" : "workout",
    supportingText: calendarEndpointReadback(row),
    title: row.isRestDay ? undefined : row.title,
    workout: previewCalendarWorkoutIdentity(row),
  };
}

function previewCalendarWorkoutIdentity(
  row: SelectedRunningPlanCalendarRow,
): HitoCalendarWorkoutIdentity {
  const meta = workoutKindMeta(row.workoutDayKind);
  const tone = calendarTone(row);

  return {
    color: previewCalendarToneColor(tone),
    glyph: meta.glyph,
    label: meta.label,
    short: tone === "final" ? calendarEndpointShortLabel(row) : meta.short,
  };
}

function previewCalendarToneColor(tone: PreviewCalendarTone) {
  const colors: Record<PreviewCalendarTone, string> = {
    easy: "var(--easy)",
    final: "var(--orange-500)",
    hills: "color-mix(in oklch, var(--success) 68%, var(--easy))",
    intervals: "var(--warn)",
    long: "var(--long)",
    rest: "var(--rest)",
    strides: "var(--success)",
    tempo: "var(--quality)",
  };

  return colors[tone];
}

function formatCalendarDayNumber(date: string) {
  return date.slice(8).replace(/^0/, "");
}

function calendarTone(row: SelectedRunningPlanCalendarRow): PreviewCalendarTone {
  if (
    row.endpointDistanceMeters ||
    row.workoutDayKind === "final_selected_distance_day" ||
    row.workoutDayKind === "marathon_base_endpoint"
  ) {
    return "final";
  }

  if (row.isRestDay) {
    return "rest";
  }

  if (row.workoutDayKind === "long_run" || row.workoutDayKind === "cutback_long_run") {
    return "long";
  }

  if (row.workoutDayKind === "easy" || row.workoutDayKind === "recovery") {
    return "easy";
  }

  if (row.workoutDayKind === "strides") {
    return "strides";
  }

  if (row.workoutDayKind === "tempo" || row.workoutDayKind === "threshold") {
    return "tempo";
  }

  if (row.workoutDayKind === "intervals") {
    return "intervals";
  }

  if (row.workoutDayKind === "hills") {
    return "hills";
  }

  return "tempo";
}

function calendarEndpointShortLabel(row: SelectedRunningPlanCalendarRow) {
  if (row.workoutDayKind === "marathon_base_endpoint") {
    return "Base";
  }

  if (row.endpointDistanceMeters === 21100) {
    return "21K";
  }

  if (row.endpointDistanceMeters === 10000) {
    return "10K";
  }

  return "Final";
}

function calendarEndpointReadback(row: SelectedRunningPlanCalendarRow) {
  if (row.workoutDayKind === "marathon_base_endpoint") {
    return "marathon base endpoint";
  }

  return row.endpointDistanceMeters ? `${row.endpointDistanceMeters}m endpoint` : null;
}

function formatPrescription(prescription: RunningPlanSegmentPrescription): string {
  switch (prescription.mode) {
    case "time":
    case "open_warmup":
    case "open_cooldown":
      return `${formatSecondsRange(prescription.durationSeconds)} · ${prescription.intensityLabel}`;
    case "distance":
      return `${formatMetersRange(prescription.distanceMeters)} · ${prescription.intensityLabel}`;
    case "time_with_default_hr_cap":
      return `${formatSecondsRange(prescription.durationSeconds)} · ${
        prescription.intensityLabel
      } · default cap ${prescription.defaultHrZoneLabelOrCap}`;
    case "distance_with_default_hr_cap":
      return `${formatMetersRange(prescription.distanceMeters)} · ${
        prescription.intensityLabel
      } · default cap ${prescription.defaultHrZoneLabelOrCap}`;
    case "repeat":
      return `${formatNumberRange(prescription.repeatCount)} x ${formatRepeatWork(
        prescription.work,
      )} / ${formatRepeatRecovery(prescription.recovery)}`;
    case "recovery_time":
      return `${formatSecondsRange(prescription.recoveryDurationSeconds)} recovery · ${
        prescription.intensityLabel
      }`;
    case "recovery_distance":
      return `${formatMetersRange(prescription.recoveryDistanceMeters)} recovery · ${
        prescription.intensityLabel
      }`;
    case "free_run_with_cap":
      return `${formatNumberRange(prescription.durationSecondsOrDistanceMeters)} · ${
        prescription.intensityLabel
      } · cap ${prescription.explicitCap}`;
  }
}

function formatRepeatWork(
  work: Extract<RunningPlanSegmentPrescription, { mode: "repeat" }>["work"],
) {
  if (work.mode === "time") {
    return `${formatSecondsRange(work.durationSeconds)} ${work.intensityLabel}`;
  }

  return `${formatMetersRange(work.distanceMeters)} ${work.intensityLabel}`;
}

function formatRepeatRecovery(
  recovery: Extract<RunningPlanSegmentPrescription, { mode: "repeat" }>["recovery"],
) {
  if (recovery.mode === "recovery_time") {
    return `${formatSecondsRange(recovery.recoveryDurationSeconds)} recovery`;
  }

  return `${formatMetersRange(recovery.recoveryDistanceMeters)} recovery`;
}

function formatSecondsRange(range: RunningPlanRange) {
  return `${formatSeconds(range.min)}${range.min === range.max ? "" : `-${formatSeconds(range.max)}`}`;
}

function formatSeconds(seconds: number) {
  if (seconds % 60 === 0) {
    return `${seconds / 60} min`;
  }

  return `${seconds}s`;
}

function formatMetersRange(range: RunningPlanRange) {
  return `${formatMeters(range.min)}${range.min === range.max ? "" : `-${formatMeters(range.max)}`}`;
}

function formatMeters(meters: number) {
  return `${meters}m`;
}

function formatNumberRange(range: RunningPlanRange) {
  return `${range.min}${range.min === range.max ? "" : `-${range.max}`}`;
}

function segmentTargetBadge(row: SelectedRunningPlanCalendarRow, benchmarkPaceAvailable: boolean) {
  if (benchmarkPaceAvailable) {
    return "Structure + pace";
  }

  if (row.targetTruthModes.includes("editable_default_hr")) {
    return "Structure + estimated HR";
  }

  return "Structure + effort";
}

function truthModeReadback(
  mode: SelectedRunningPlanCalendarRow["targetTruthModes"][number],
  benchmarkPaceAvailable: boolean,
) {
  if (benchmarkPaceAvailable) {
    return "Trusted recent-5K pace is applied where this segment is eligible; HR targets remain blocked.";
  }

  if (mode === "editable_default_hr") {
    return "Structure plus estimated HR guidance where allowed; advisory, not personal HR truth.";
  }

  return "Follow the shown structure and effort cue; no pace or HR target is supplied.";
}
