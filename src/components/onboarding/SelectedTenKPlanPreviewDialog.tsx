import { useMemo, useState, type ReactNode } from "react";
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
import { buildCalendarWorkoutIdentity } from "@/components/calendar/calendar-projection";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { WorkoutDocumentReadback } from "@/components/workout-structure/WorkoutDocumentReadback";
import { workoutDocumentNotesForSteps } from "@/components/workout-structure/workout-document-notes";
import {
  workoutDocumentTimelineItems,
  workoutStructureTimelineSummary,
} from "@/components/workout-structure/workout-structure-timeline-items";
import type {
  RunningPlanConfirmActionResult,
  RunningPlanPreviewActionResult,
} from "@/lib/running-plan-engine-actions";
import { formatDistanceMeters } from "@/lib/training";
import type { WorkoutDocument } from "@/lib/workout-document";

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
type SelectedRunningPlanPreviewStatus = "idle" | "previewing_plan";
type RunningPlanCreateStatus = "idle" | "creating";

function previewGoalLabel(draft: SelectedRunningPlanPreviewDraft | null) {
  return draft?.normalizedInputSummary.planGoalIntent.distance?.label ?? "Selected";
}

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
  description = "Review the AI-authored plan before creating it. Nothing is saved until you confirm.",
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
              {previewGoalLabel(draft)} plan preview
            </DialogTitle>
            <DialogDescription className="hito-body max-w-2xl">{description}</DialogDescription>
          </div>
        </DialogHeader>

        <div className="hito-product-dialog-body-scroll-fill">
          {loading && !draft ? (
            <div className="hito-surface-wash" data-tone="signal">
              <p className="hito-list-row-title">Preparing plan preview</p>
              <p className="hito-list-row-copy">
                Hito is preparing the calendar and workout structure for review.
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
        helper: "Use Current Plan from the calendar to start a reviewed plan change.",
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
  const view = PREVIEW_UNAVAILABLE_VIEWS[result.previewOutcome];

  return (
    <div className="grid gap-4">
      <div className="hito-surface-wash" data-tone={view.tone}>
        <p className="hito-list-row-title">{view.title}</p>
        <p className="hito-list-row-copy">{view.copy}</p>
      </div>
      <div className="hito-row-group">
        <div className="hito-list-row items-start">
          <PreviewFact label="Next step" value={view.nextStep} />
          <PreviewFact label="Saved plan" value="Nothing was created or saved." />
        </div>
      </div>
    </div>
  );
}

const PREVIEW_UNAVAILABLE_VIEWS = {
  invalid_structural_input: {
    title: "Check the plan details",
    copy: "Some required plan details are missing or invalid, so Hito could not start authoring this plan.",
    nextStep: "Review the plan details and try again.",
    tone: "destructive",
  },
  provider_runtime_failure: {
    title: "Plan authoring is unavailable",
    copy: "Hito could not reach the plan authoring service right now. Your goal details do not need to change.",
    nextStep: "Try again in a moment.",
    tone: "signal",
  },
  provider_incomplete_output: {
    title: "The plan draft was incomplete",
    copy: "The authoring service returned only part of the plan, so Hito could not prepare a complete review. Your goal details do not need to change.",
    nextStep: "Try authoring the plan again.",
    tone: "signal",
  },
  malformed_provider_output: {
    title: "The plan draft could not be read",
    copy: "The authoring service returned a plan Hito could not safely interpret, so no review was created. Your goal details do not need to change.",
    nextStep: "Try authoring the plan again.",
    tone: "signal",
  },
  compiler_rejection: {
    title: "The plan draft could not be compiled",
    copy: "Hito could not safely compile the authored draft into a reviewable plan. Your goal details do not need to change.",
    nextStep: "Try authoring a new draft.",
    tone: "signal",
  },
  review_refusal: {
    title: "The plan review could not be verified",
    copy: "Hito could not verify this authored draft for confirmation, so it was not made available for review. Your goal details do not need to change.",
    nextStep: "Refresh and create a new preview.",
    tone: "signal",
  },
} as const satisfies Record<
  SelectedRunningPlanPreviewUnavailable["previewOutcome"],
  {
    title: string;
    copy: string;
    nextStep: string;
    tone: "destructive" | "signal";
  }
>;

function PreviewDraftView({ draft }: { draft: SelectedRunningPlanPreviewDraft }) {
  const rowsByWeek = groupRowsByWeek(draft.calendarRows);
  const workoutDocumentsById = useMemo(
    () =>
      new Map(
        draft.workoutDocuments.map((document) => [document.sourceWorkoutId, document] as const),
      ),
    [draft.workoutDocuments],
  );
  const calendarLegend = useMemo(
    () =>
      uniqueCalendarWorkoutIdentities(
        draft.workoutDocuments.map((document) => previewCalendarWorkoutIdentity(document)),
      ),
    [draft.workoutDocuments],
  );
  const missingWorkoutDocumentRow =
    draft.calendarRows.find((row) => !workoutDocumentsById.has(row.rowId)) ?? null;
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
        row.workoutDayKind !== "final_selected_distance_day",
    ) ??
    nonRestRows.find((row) => row.workoutDayKind !== "final_selected_distance_day") ??
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
  const activeWorkoutDocument =
    (activeCalendarRow ? workoutDocumentsById.get(activeCalendarRow.rowId) : null) ?? null;
  const activeCalendarIdentity = activeWorkoutDocument
    ? previewCalendarWorkoutIdentity(activeWorkoutDocument)
    : null;

  if (missingWorkoutDocumentRow) {
    return (
      <div className="hito-surface-wash" data-tone="destructive">
        <p className="hito-list-row-title">Workout preview unavailable</p>
        <p className="hito-list-row-copy">
          The reviewed workout document for {missingWorkoutDocumentRow.date} is unavailable. Refresh
          this preview before creating the plan.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="hito-row-group">
        <div className="hito-list-row items-start">
          <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <PreviewFact label="Goal" value={previewGoalLabel(draft)} />
            <PreviewFact
              label="Plan length"
              value={`${rowsByWeek.length} weeks · ${nonRestRows.length} workouts`}
            />
            <PreviewFact
              label="Rhythm"
              value={`${draft.normalizedInputSummary.daysPerWeek} runs/week`}
            />
            <PreviewFact label="Workout guidance" value={metricTruthReadback(draft)} />
            <PreviewFact label="Start date" value={draft.normalizedInputSummary.startDate} />
            <PreviewFact
              label="Fixed rest"
              value={
                draft.normalizedInputSummary.fixedRestDays.length
                  ? draft.normalizedInputSummary.fixedRestDays.join(", ")
                  : "Open"
              }
            />
            <PreviewFact
              label="Long run"
              value={draft.normalizedInputSummary.preferredLongRunDay ?? "Default"}
            />
            <PreviewFact
              label="Training weekdays"
              value={draft.normalizedInputSummary.trainingWeekdays.join(", ")}
            />
            <PreviewFact
              label="Plan approach"
              value={loadContextLabel(draft.normalizedInputSummary.loadContext)}
            />
          </div>
        </div>
      </section>

      <PlanGoalIntentReadback intent={draft.normalizedInputSummary.planGoalIntent} />

      <section className="grid gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="hito-label">{rowsByWeek.length}-week calendar preview</p>
            <p className="hito-list-row-copy">
              Review the planned workout rhythm and select any day to inspect its exact structure.
            </p>
          </div>
          <span className="hito-status-pill" data-tone="signal">
            {nonRestRows.length} runs
          </span>
        </div>

        <div className="hito-selected-plan-calendar grid gap-2">
          <div className="hito-selected-plan-calendar-legend" aria-label="Calendar legend">
            {calendarLegend.map((identity) => (
              <PreviewLegendItem key={identity.label} identity={identity} />
            ))}
          </div>

          <TooltipProvider delayDuration={120}>
            <div
              className="hito-selected-plan-calendar-weeks"
              aria-label={`${previewGoalLabel(draft)} preview calendar`}
            >
              {rowsByWeek.map(([weekNumber, rows]) => (
                <div key={weekNumber} className="hito-selected-plan-calendar-week">
                  <p className="hito-label">Week {weekNumber}</p>
                  <div className="hito-selected-plan-calendar-week-grid">
                    {rows.map((row) => {
                      const document = workoutDocumentsById.get(row.rowId);
                      if (!document) return null;

                      const identity = previewCalendarWorkoutIdentity(document);
                      const endpoint = calendarEndpointReadback(row);
                      const day = formatCalendarDayNumber(row.date);
                      const selected = row.rowId === activeCalendarRowId;
                      const ariaLabel = [
                        `${row.date} ${row.weekday}`,
                        identity.label,
                        row.title,
                        endpoint,
                      ]
                        .filter(Boolean)
                        .join(". ");
                      const presentation = buildPreviewCalendarDayPresentation(row, document);

                      return (
                        <Tooltip key={row.rowId}>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="block aspect-square min-w-0 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-signal/30"
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
                              {row.date} · {row.weekday} · {identity.label}
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

          {activeCalendarRow && activeCalendarIdentity ? (
            <PreviewCalendarDetail identity={activeCalendarIdentity} row={activeCalendarRow} />
          ) : null}
        </div>
      </section>

      <section className="grid gap-3">
        <div>
          <p className="hito-label">Workout document</p>
          <p className="hito-list-row-copy">
            Select a calendar day to review the exact structure and target guidance before creating
            this plan.
          </p>
        </div>
        {activeWorkoutDocument?.workoutType === "rest" ? (
          <div className="hito-surface-wash">
            <p className="hito-list-row-title">Rest day</p>
            <p className="hito-list-row-copy">This selected day has no workout target guidance.</p>
          </div>
        ) : activeWorkoutDocument ? (
          <PreviewWorkoutDocument document={activeWorkoutDocument} label="Selected workout day" />
        ) : null}
      </section>
    </div>
  );
}

function PlanGoalIntentReadback({
  intent,
}: {
  intent: SelectedRunningPlanPreviewDraft["normalizedInputSummary"]["planGoalIntent"];
}) {
  const outcomePace = intent.targetOutcomePace;
  const derivedOutcomePace = intent.derivedOutcomePace;
  const showSeparateDerivedOutcomePace =
    Boolean(derivedOutcomePace) &&
    (!outcomePace ||
      outcomePace.source !== "derived_from_finish_time" ||
      outcomePace.label !== derivedOutcomePace?.label);
  const distanceLabel = intent.distance?.label ?? "Plan default";
  const assumption = intent.assumptions.at(0);

  return (
    <section className="hito-row-group">
      <div className="hito-list-row items-start">
        <div className="grid flex-1 gap-3">
          <div className="min-w-0">
            <p className="hito-label">Goal readback</p>
            <p className="hito-list-row-title">{distanceLabel}</p>
            <p className="hito-list-row-copy">
              Race/result context. Any pace shown here is goal readback, not your workout pace
              target.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <PreviewFact label="Distance" value={distanceReadback(intent)} />
            <PreviewFact label="Race day" value={intent.targetDate ?? "Not supplied"} />
            <PreviewFact
              label="Finish time"
              value={intent.targetFinishTime?.label ?? "Not supplied"}
            />
            <PreviewFact
              label={outcomePaceLabel(outcomePace)}
              value={
                outcomePace
                  ? `${outcomePace.label} · ${goalIntentPaceSourceLabel(outcomePace.source)}`
                  : "Not supplied"
              }
            />
            {showSeparateDerivedOutcomePace && derivedOutcomePace ? (
              <PreviewFact
                label="Derived pace"
                value={`${derivedOutcomePace.label} · ${goalIntentPaceSourceLabel(
                  derivedOutcomePace.source,
                )}`}
              />
            ) : null}
          </div>

          {assumption ? <p className="hito-field-helper">{assumption}</p> : null}
        </div>
      </div>
    </section>
  );
}

function distanceReadback(
  intent: SelectedRunningPlanPreviewDraft["normalizedInputSummary"]["planGoalIntent"],
) {
  if (!intent.distance) {
    return "Plan default";
  }

  return `${intent.distance.label} · ${intent.distance.distanceKm} km`;
}

function outcomePaceLabel(
  outcomePace: SelectedRunningPlanPreviewDraft["normalizedInputSummary"]["planGoalIntent"]["targetOutcomePace"],
) {
  if (outcomePace?.source === "derived_from_finish_time") {
    return "Derived race-day pace";
  }

  return "Goal pace";
}

function goalIntentPaceSourceLabel(
  source: "derived_from_finish_time" | "runner_entered_outcome_pace",
) {
  switch (source) {
    case "derived_from_finish_time":
      return "derived from finish time";
    case "runner_entered_outcome_pace":
      return "goal readback";
  }
}

function PreviewWorkoutDocument({ document, label }: { document: WorkoutDocument; label: string }) {
  const items = workoutDocumentTimelineItems(document);

  return (
    <article className="hito-surface-wash min-w-0">
      <WorkoutDocumentReadback
        heading={{
          eyebrow: label,
          title: document.title,
          copy: `${document.workoutDate} · ${document.phase}`,
        }}
        items={items}
        notes={workoutDocumentNotesForSteps(document.steps, document.notes)}
        summary={workoutStructureTimelineSummary(items)}
      />
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
    ? `${benchmarkPaceTruth.label} benchmark pace`
    : hasEditableDefaultHrGuidance
      ? "Estimated heart-rate guidance"
      : "Workout structure only";
}

function loadContextLabel(value: string) {
  return value === "conservative" ? "Conservative" : "Standard";
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

function PreviewLegendItem({ identity }: { identity: HitoCalendarWorkoutIdentity }) {
  return (
    <span className="hito-selected-plan-calendar-legend-item">
      <span
        className="hito-selected-plan-calendar-legend-swatch"
        style={{ background: identity.color }}
      />
      {identity.label}
    </span>
  );
}

function PreviewCalendarDetail({
  identity,
  row,
}: {
  identity: HitoCalendarWorkoutIdentity;
  row: SelectedRunningPlanCalendarRow;
}) {
  const endpoint = calendarEndpointReadback(row);

  return (
    <div className="hito-selected-plan-calendar-detail" aria-live="polite">
      <div className="min-w-0">
        <p className="hito-body-small">
          {row.date} · {row.weekday} · {identity.label}
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

function buildPreviewCalendarDayPresentation(
  row: SelectedRunningPlanCalendarRow,
  document: WorkoutDocument,
): {
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
    workout: previewCalendarWorkoutIdentity(document),
  };
}

function previewCalendarWorkoutIdentity(document: WorkoutDocument): HitoCalendarWorkoutIdentity {
  return buildCalendarWorkoutIdentity(document);
}

function formatCalendarDayNumber(date: string) {
  return date.slice(8).replace(/^0/, "");
}

function uniqueCalendarWorkoutIdentities(
  identities: readonly HitoCalendarWorkoutIdentity[],
): HitoCalendarWorkoutIdentity[] {
  return [...new Map(identities.map((identity) => [identity.label, identity])).values()];
}

function calendarEndpointReadback(row: SelectedRunningPlanCalendarRow) {
  return row.endpointDistanceMeters
    ? `Goal · ${formatDistanceMeters(row.endpointDistanceMeters)}`
    : null;
}
