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
import {
  WorkoutDocumentReadback,
  type WorkoutDocumentNote,
} from "@/components/workout-structure/WorkoutDocumentReadback";
import { dedupeWorkoutDocumentNotes } from "@/components/workout-structure/workout-document-notes";
import type { WorkoutStructureTimelineItem } from "@/components/workout-structure/WorkoutStructureTimeline";
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
import { workoutTypeColorVar } from "@/lib/workout-color-tokens";

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
  | "steady"
  | "long"
  | "progression"
  | "tempo"
  | "intervals"
  | "hills"
  | "rest"
  | "final";

function previewGoalLabel(
  draft: SelectedRunningPlanPreviewDraft | null,
  unavailable: SelectedRunningPlanPreviewUnavailable | null,
) {
  return (
    draft?.normalizedInputSummary.planGoalIntent.distance?.label ??
    unavailable?.debug.previewActionTrace.planGoalIntentSummary.distanceLabel ??
    "Selected"
  );
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
  description = "AI-authored generated-plan preview. Create confirms this reviewed preview server-side before anything is saved.",
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
              {previewGoalLabel(draft, unavailable)} plan preview
            </DialogTitle>
            <DialogDescription className="hito-body max-w-2xl">{description}</DialogDescription>
          </div>
        </DialogHeader>

        <div className="hito-product-dialog-body-scroll-fill">
          {loading && !draft ? (
            <div className="hito-surface-wash" data-tone="signal">
              <p className="hito-list-row-title">Building preview</p>
              <p className="hito-list-row-copy">
                Hito is building the calendar rows, goal day, and workout structure for review.
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
          {previewGoalLabel(null, result)} preview needs adjustment
        </p>
        <p className="hito-list-row-copy">{previewUnavailableCopy(result.error.message)}</p>
      </div>
      <div className="hito-row-group">
        <div className="hito-list-row items-start">
          <PreviewFact label="Next step" value="Adjust the goal details." />
          <PreviewFact label="Saved plan" value="Nothing has been created." />
        </div>
      </div>
    </div>
  );
}

function previewUnavailableCopy(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("invalid_plan_goal_intent") ||
    normalized.includes("source_kind") ||
    normalized.includes("target finish time") ||
    normalized.includes("target outcome pace") ||
    normalized.includes("target date") ||
    normalized.includes("cannot promise a race date")
  ) {
    return "This setup cannot be previewed yet. Adjust the goal details.";
  }

  return message;
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

  return (
    <div className="grid gap-6">
      <section className="hito-row-group">
        <div className="hito-list-row items-start">
          <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <PreviewFact label="Goal" value={previewGoalLabel(draft, null)} />
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
            <PreviewFact label="Load context" value={draft.normalizedInputSummary.loadContext} />
          </div>
        </div>
      </section>

      <PlanGoalIntentReadback intent={draft.normalizedInputSummary.planGoalIntent} />

      <section className="grid gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="hito-label">{rowsByWeek.length}-week calendar preview</p>
            <p className="hito-list-row-copy">
              See how Hito places rest days, long runs, quality touches, and the final{" "}
              {previewGoalLabel(draft, null)} day before create is available.
            </p>
          </div>
          <span className="hito-status-pill" data-tone="signal">
            {nonRestRows.length} runs
          </span>
        </div>

        <div className="hito-selected-plan-calendar grid gap-2">
          <div className="hito-selected-plan-calendar-legend" aria-label="Calendar legend">
            <PreviewLegendItem tone="easy" label="Easy" />
            <PreviewLegendItem tone="steady" label="Steady" />
            <PreviewLegendItem tone="long" label="Long Run" />
            <PreviewLegendItem tone="progression" label="Progression" />
            <PreviewLegendItem tone="tempo" label="Tempo" />
            <PreviewLegendItem tone="intervals" label="Intervals" />
            <PreviewLegendItem tone="hills" label="Hills" />
            <PreviewLegendItem tone="rest" label="Rest" />
            <PreviewLegendItem tone="final" label="Endpoint" />
          </div>

          <TooltipProvider delayDuration={120}>
            <div
              className="hito-selected-plan-calendar-weeks"
              aria-label={`${previewGoalLabel(draft, null)} preview calendar`}
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

      <section className="grid gap-3">
        <div>
          <p className="hito-label">Workout document</p>
          <p className="hito-list-row-copy">
            Review the selected day structure before creating this plan.
          </p>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {endpointRow ? <PreviewWorkoutDocument label="Goal day" row={endpointRow} /> : null}
          {sampleRow ? <PreviewWorkoutDocument label="Sample workout day" row={sampleRow} /> : null}
        </div>
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
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="hito-label">Goal readback</p>
              <p className="hito-list-row-title">{distanceLabel}</p>
              <p className="hito-list-row-copy">
                Race/result context. Any pace shown here is goal readback, not your workout pace
                target.
              </p>
            </div>
            <span className="hito-status-pill" data-tone={goalIntentTone(intent)}>
              {goalIntentStatusLabel(intent.feasibility.status)}
            </span>
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

function goalIntentStatusLabel(
  status: SelectedRunningPlanPreviewDraft["normalizedInputSummary"]["planGoalIntent"]["feasibility"]["status"],
) {
  switch (status) {
    case "supported":
      return "Supported";
    case "supported_with_assumptions":
      return "Assumptions";
    case "aggressive_or_short_horizon":
      return "Aggressive";
    case "impossible_goal":
      return "Not ready";
    case "unsupported_for_current_builder":
      return "Needs review";
  }
}

function goalIntentTone(
  intent: SelectedRunningPlanPreviewDraft["normalizedInputSummary"]["planGoalIntent"],
): "success" | "warning" | "muted" {
  switch (intent.feasibility.status) {
    case "supported":
      return "success";
    case "supported_with_assumptions":
      return "muted";
    case "aggressive_or_short_horizon":
    case "impossible_goal":
    case "unsupported_for_current_builder":
      return "warning";
  }
}

function PreviewWorkoutDocument({
  label,
  row,
}: {
  label: string;
  row: SelectedRunningPlanCalendarRow;
}) {
  const items = previewWorkoutTimelineItems(row);
  const notes = previewWorkoutDocumentNotes(row);

  return (
    <article className="hito-surface-wash min-w-0">
      <WorkoutDocumentReadback
        heading={{
          eyebrow: label,
          title: row.title,
          copy: `${row.date} · ${workoutKindMeta(row.workoutDayKind).label}`,
        }}
        items={items}
        notes={notes}
        summary={previewWorkoutDocumentSummary(row, items)}
      />
    </article>
  );
}

function previewWorkoutTimelineItems(
  row: SelectedRunningPlanCalendarRow,
): WorkoutStructureTimelineItem[] {
  return row.segments.flatMap((segment) => {
    const prescription = segment.primaryPrescription;

    if (prescription.mode === "repeat") {
      const repeatCount = Math.max(1, Math.round(prescription.repeatCount.max));

      return Array.from({ length: repeatCount }).flatMap((_, roundIndex) =>
        prescription.children.map((child, childIndex) => {
          const role = child.label ?? previewSegmentRoleLabel(child.role);
          const metric = previewRepeatChildMetric(child.prescription);

          return {
            id: `${segment.id}-repeat-${roundIndex}-${childIndex}`,
            kindLabel: role,
            detailLabel: `${roundIndex + 1}/${repeatCount} · ${metric}`,
            barLabel: previewRepeatChildBarLabel(child.prescription),
            metric,
            title: `${role} ${roundIndex + 1}/${repeatCount}`,
            semanticKind: `${child.role} ${child.label ?? ""}`,
            weight: previewRepeatChildWeight(child.prescription),
            readbackEntries: [{ key: "intensity", label: "Cue", value: child.intensityLabel }],
            tooltipReadbackEntries: child.guidance
              ? [{ key: "guidance", label: "Cue", value: child.guidance }]
              : [{ key: "intensity", label: "Cue", value: child.intensityLabel }],
          } satisfies WorkoutStructureTimelineItem;
        }),
      );
    }

    const metric = previewPrescriptionMetric(prescription);
    const role = previewSegmentRoleLabel(segment.segmentRole);

    return [
      {
        id: segment.id,
        kindLabel: role,
        detailLabel: segment.secondaryCue,
        barLabel: previewPrescriptionBarLabel(prescription),
        metric,
        title: role,
        semanticKind: `${segment.segmentRole} ${row.workoutDayKind}`,
        weight: previewPrescriptionWeight(prescription),
        readbackEntries: [
          { key: "intensity", label: "Cue", value: previewPrescriptionCue(prescription) },
        ],
        tooltipReadbackEntries: [{ key: "cue", label: "Cue", value: segment.secondaryCue }],
      },
    ];
  });
}

function previewWorkoutDocumentNotes(row: SelectedRunningPlanCalendarRow): WorkoutDocumentNote[] {
  const notes = row.segments.flatMap((segment) => {
    const prescription = segment.primaryPrescription;
    const ownNote = segment.secondaryCue
      ? [
          {
            key: `${segment.id}-cue`,
            label: previewSegmentRoleLabel(segment.segmentRole),
            value: segment.secondaryCue,
          },
        ]
      : [];

    if (prescription.mode !== "repeat") {
      return ownNote;
    }

    return [
      ...ownNote,
      ...prescription.children
        .filter((child) => child.guidance)
        .map((child, index) => ({
          key: `${segment.id}-child-${index}-cue`,
          label: child.label ?? previewSegmentRoleLabel(child.role),
          value: child.guidance ?? "",
        })),
    ];
  });

  return dedupeWorkoutDocumentNotes(notes).slice(0, 6);
}

function previewWorkoutDocumentSummary(
  row: SelectedRunningPlanCalendarRow,
  items: WorkoutStructureTimelineItem[],
) {
  const parts = [
    row.watchExecutable ? "Executable structure" : null,
    `${items.length} ${items.length === 1 ? "block" : "blocks"}`,
  ].filter(Boolean);

  return parts.join(" · ");
}

function previewPrescriptionMetric(prescription: RunningPlanSegmentPrescription) {
  switch (prescription.mode) {
    case "distance":
    case "distance_with_default_hr_cap":
      return formatMetersRange(prescription.distanceMeters);
    case "recovery_distance":
      return formatMetersRange(prescription.recoveryDistanceMeters);
    case "time":
    case "open_warmup":
    case "open_cooldown":
    case "time_with_default_hr_cap":
      return formatSecondsRange(prescription.durationSeconds);
    case "recovery_time":
      return formatSecondsRange(prescription.recoveryDurationSeconds);
    case "free_run_with_cap":
      return formatNumberRange(prescription.durationSecondsOrDistanceMeters);
    case "repeat":
      return `${formatNumberRange(prescription.repeatCount)} x`;
  }
}

function previewPrescriptionBarLabel(prescription: RunningPlanSegmentPrescription) {
  switch (prescription.mode) {
    case "distance":
    case "distance_with_default_hr_cap":
      return compactMetersRange(prescription.distanceMeters);
    case "recovery_distance":
      return compactMetersRange(prescription.recoveryDistanceMeters);
    case "time":
    case "open_warmup":
    case "open_cooldown":
    case "time_with_default_hr_cap":
      return compactSecondsRange(prescription.durationSeconds);
    case "recovery_time":
      return compactSecondsRange(prescription.recoveryDurationSeconds);
    case "free_run_with_cap":
      return formatNumberRange(prescription.durationSecondsOrDistanceMeters);
    case "repeat":
      return `${formatNumberRange(prescription.repeatCount)}x`;
  }
}

function previewPrescriptionWeight(prescription: RunningPlanSegmentPrescription) {
  switch (prescription.mode) {
    case "distance":
    case "distance_with_default_hr_cap":
      return Math.max(1, prescription.distanceMeters.max / 100);
    case "recovery_distance":
      return Math.max(1, prescription.recoveryDistanceMeters.max / 100);
    case "time":
    case "open_warmup":
    case "open_cooldown":
    case "time_with_default_hr_cap":
      return Math.max(1, prescription.durationSeconds.max / 60);
    case "recovery_time":
      return Math.max(1, prescription.recoveryDurationSeconds.max / 60);
    case "free_run_with_cap":
      return Math.max(1, prescription.durationSecondsOrDistanceMeters.max / 60);
    case "repeat":
      return Math.max(1, prescription.repeatCount.max);
  }
}

function previewRepeatChildMetric(
  prescription: Extract<
    RunningPlanSegmentPrescription,
    { mode: "repeat" }
  >["children"][number]["prescription"],
) {
  return prescription.mode === "distance"
    ? formatMetersRange(prescription.distanceMeters)
    : formatSecondsRange(prescription.durationSeconds);
}

function previewRepeatChildBarLabel(
  prescription: Extract<
    RunningPlanSegmentPrescription,
    { mode: "repeat" }
  >["children"][number]["prescription"],
) {
  return prescription.mode === "distance"
    ? compactMetersRange(prescription.distanceMeters)
    : compactSecondsRange(prescription.durationSeconds);
}

function previewRepeatChildWeight(
  prescription: Extract<
    RunningPlanSegmentPrescription,
    { mode: "repeat" }
  >["children"][number]["prescription"],
) {
  return prescription.mode === "distance"
    ? Math.max(1, prescription.distanceMeters.max / 100)
    : Math.max(1, prescription.durationSeconds.max / 60);
}

function previewPrescriptionCue(prescription: RunningPlanSegmentPrescription) {
  if ("intensityLabel" in prescription) {
    return prescription.intensityLabel;
  }

  return "Ordered repeat";
}

function previewSegmentRoleLabel(role: string) {
  if (role === "warmup" || role === "warm_up") return "Warm-up";
  if (role === "cooldown" || role === "cool_down") return "Cooldown";
  if (role === "main") return "Run";
  if (role === "recovery") return "Recover";

  return role
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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
    long_run: { label: "Long Run", short: "Long Run", glyph: "long" },
    cutback_long_run: {
      label: "Long Run",
      short: "Long Run",
      glyph: "long",
    },
    strides: { label: "Easy", short: "Easy", glyph: "easy" },
    steady_aerobic_run: {
      label: "Steady",
      short: "Steady",
      glyph: "steady",
    },
    progression: {
      label: "Progression",
      short: "Progression",
      glyph: "progression",
    },
    tempo: { label: "Tempo", short: "Tempo", glyph: "tempo" },
    threshold: {
      label: "Tempo",
      short: "Tempo",
      glyph: "tempo",
    },
    intervals: {
      label: "Intervals",
      short: "Intervals",
      glyph: "intervals",
    },
    hills: { label: "Hills", short: "Hills", glyph: "hills" },
    final_selected_distance_day: {
      label: "Long Run",
      short: "Long Run",
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
    short: meta.short,
  };
}

function previewCalendarToneColor(tone: PreviewCalendarTone) {
  const colors: Record<PreviewCalendarTone, string> = {
    easy: workoutTypeColorVar("easy"),
    final: workoutTypeColorVar("long_run"),
    hills: workoutTypeColorVar("hills"),
    intervals: workoutTypeColorVar("intervals"),
    long: workoutTypeColorVar("long_run"),
    progression: workoutTypeColorVar("progression"),
    rest: workoutTypeColorVar("rest"),
    steady: workoutTypeColorVar("steady"),
    tempo: workoutTypeColorVar("tempo"),
  };

  return colors[tone];
}

function formatCalendarDayNumber(date: string) {
  return date.slice(8).replace(/^0/, "");
}

function calendarTone(row: SelectedRunningPlanCalendarRow): PreviewCalendarTone {
  if (row.endpointDistanceMeters || row.workoutDayKind === "final_selected_distance_day") {
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
    return "easy";
  }

  if (row.workoutDayKind === "steady_aerobic_run") {
    return "steady";
  }

  if (row.workoutDayKind === "progression") {
    return "progression";
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

function calendarEndpointReadback(row: SelectedRunningPlanCalendarRow) {
  return row.endpointDistanceMeters ? `${row.endpointDistanceMeters}m goal distance` : null;
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

function compactSecondsRange(range: RunningPlanRange) {
  return `${compactSeconds(range.min)}${
    range.min === range.max ? "" : `-${compactSeconds(range.max)}`
  }`;
}

function compactSeconds(seconds: number) {
  if (seconds % 60 === 0) {
    return `${seconds / 60}m`;
  }

  return `${seconds}s`;
}

function compactMetersRange(range: RunningPlanRange) {
  return `${formatMeters(range.min)}${
    range.min === range.max ? "" : `-${formatMeters(range.max)}`
  }`;
}
