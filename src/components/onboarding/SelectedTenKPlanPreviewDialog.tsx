import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import {
  HitoCalendarDayCell,
  type HitoCalendarWorkoutIdentity,
} from "@/components/ui/hito-calendar-day";
import { buildCalendarWorkoutIdentity } from "@/components/calendar/calendar-projection";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { WorkoutDocumentReadback } from "@/components/workout-structure/WorkoutDocumentReadback";
import { GeneratedPlanPreviewLoadingState } from "@/components/onboarding/GeneratedPlanPreviewLoadingState";
import { useGeneratedPlanReadyTransition } from "@/components/onboarding/generated-plan-preview-transition";
import {
  fixedRestDaysReadback,
  weeklyRunningCeilingReadback,
} from "@/components/onboarding/training-preference-readback";
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
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

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

function reviewedGoalLabel(draft: SelectedRunningPlanPreviewDraft) {
  return draft.normalizedInputSummary.planGoalIntent.distance?.label ?? "Distance unavailable";
}

interface SelectedRunningPlanPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  confirmResult: RunningPlanConfirmActionResult | null;
  createStatus: RunningPlanCreateStatus;
  result: SelectedRunningPlanPreviewResult | null;
  status: SelectedRunningPlanPreviewStatus;
  error: string | null;
  goalLabel: string;
  onRefresh: () => void;
  onCreate: () => void;
  description?: string;
  primaryActionLabel?: string;
  primaryActionPendingLabel?: string;
  extraNotice?: ReactNode;
  returnFocusRef?: RefObject<HTMLElement | null>;
}

export function SelectedRunningPlanPreviewDialog({
  confirmResult,
  createStatus,
  error,
  goalLabel,
  onCreate,
  onOpenChange,
  onRefresh,
  open,
  description = "Review the plan before creating it. Nothing is saved until you confirm.",
  primaryActionLabel = "Create plan",
  primaryActionPendingLabel = "Creating plan...",
  extraNotice,
  result,
  returnFocusRef,
  status,
}: SelectedRunningPlanPreviewDialogProps) {
  const fallbackReturnFocusRef = useRef<HTMLElement | null>(null);
  const dialogContentRef = useRef<HTMLDivElement | null>(null);
  const readyFocusTargetRef = useRef<HTMLButtonElement | null>(null);
  const wasLoadingExperienceVisibleRef = useRef(false);
  const loading = status === "previewing_plan";
  const creating = createStatus === "creating";
  const draft = result?.ok ? result.draft : null;
  const unavailable = result && !result.ok ? result.unavailable : null;
  const reviewReady = Boolean(draft?.reviewToken && draft?.reviewChecksum);
  const initialLoading = loading && !draft;
  const showLoadingCompletion = useGeneratedPlanReadyTransition({
    hasReviewedDraft: reviewReady,
    initialLoading,
    open,
  });
  const loadingExperienceVisible = initialLoading || showLoadingCompletion;
  const reviewVisible = Boolean(draft) && !showLoadingCompletion;
  const compact = !reviewVisible;
  const refreshing = loading && reviewVisible;
  const failedPreview = Boolean(error || unavailable);
  const unavailableIsCorrectable = unavailable?.previewOutcome === "invalid_structural_input";

  useEffect(() => {
    if (loadingExperienceVisible) {
      wasLoadingExperienceVisibleRef.current = true;
      return;
    }

    if (!reviewVisible || !wasLoadingExperienceVisibleRef.current) {
      return;
    }

    wasLoadingExperienceVisibleRef.current = false;
    const focusFrame = window.requestAnimationFrame(() => {
      const activeElement = document.activeElement;

      if (
        activeElement === document.body ||
        activeElement === dialogContentRef.current ||
        activeElement == null
      ) {
        readyFocusTargetRef.current?.focus();
      }
    });

    return () => window.cancelAnimationFrame(focusFrame);
  }, [loadingExperienceVisible, reviewVisible]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        ref={dialogContentRef}
        className={cn(
          "hito-dialog-stable hito-product-dialog hito-dialog-surface-product",
          compact
            ? "hito-product-dialog-content-fit hito-dialog-size-wide"
            : "hito-dialog-size-review hito-dialog-height-review",
        )}
        overlayClassName="hito-dialog-overlay-stable"
        showCloseButton={!loadingExperienceVisible}
        onOpenAutoFocus={() => {
          const activeElement = document.activeElement;
          fallbackReturnFocusRef.current =
            activeElement instanceof HTMLElement ? activeElement : null;
        }}
        onCloseAutoFocus={(event) => {
          const returnTarget = returnFocusRef?.current ?? fallbackReturnFocusRef.current;

          if (!returnTarget?.isConnected) {
            return;
          }

          event.preventDefault();
          returnTarget.focus();
        }}
      >
        {loadingExperienceVisible ? (
          <div className="sr-only">
            <DialogTitle>{`Preparing your ${goalLabel} plan`}</DialogTitle>
            <DialogDescription>Plan preview preparation is in progress.</DialogDescription>
          </div>
        ) : (
          <DialogHeader className="hito-product-dialog-header">
            <div className="min-w-0">
              <p className="hito-micro-label" data-tone="signal">
                Generated plan
              </p>
              <DialogTitle className="hito-modal-title mt-2">{goalLabel} plan preview</DialogTitle>
              <DialogDescription className="hito-body max-w-2xl">{description}</DialogDescription>
            </div>
          </DialogHeader>
        )}

        <div
          className={compact ? "hito-product-dialog-body" : "hito-product-dialog-body-scroll-fill"}
          aria-busy={loading || creating || undefined}
        >
          {loadingExperienceVisible ? (
            <GeneratedPlanPreviewLoadingState
              complete={showLoadingCompletion}
              goalLabel={goalLabel}
            />
          ) : null}

          {error ? (
            <div className="hito-surface-wash" data-tone="destructive">
              <p className="hito-list-row-title">Preview unavailable</p>
              <p className="hito-list-row-copy">{error}</p>
            </div>
          ) : null}

          {unavailable ? <PreviewUnavailableState result={unavailable} /> : null}
          {refreshing ? (
            <div
              className="hito-surface-wash mb-4"
              data-tone="signal"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-start gap-3">
                <Icon name="loader" size="sm" className="mt-0.5 animate-spin" />
                <div className="min-w-0">
                  <p className="hito-list-row-title">Refreshing preview</p>
                  <p className="hito-list-row-copy">
                    Hito is preparing a new reviewed version. Nothing is being saved.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
          {creating ? (
            <div
              className="hito-surface-wash mb-4"
              data-tone="signal"
              role="status"
              aria-live="polite"
            >
              <p className="hito-list-row-title">Creating your plan</p>
              <p className="hito-list-row-copy">Hito is saving the plan you reviewed.</p>
            </div>
          ) : null}
          {reviewVisible && draft ? <PreviewDraftView draft={draft} /> : null}
          {confirmResult && !confirmResult.ok ? (
            <CreateBlockedNotice result={confirmResult} />
          ) : null}
          {!loadingExperienceVisible ? extraNotice : null}
        </div>

        {loadingExperienceVisible ? (
          <DialogFooter className="hito-product-dialog-footer hito-product-dialog-footer-center sm:space-x-0">
            <button
              type="button"
              className="hito-button hito-button-secondary hito-button-md"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </button>
          </DialogFooter>
        ) : reviewVisible && draft ? (
          <DialogFooter className="hito-product-dialog-footer sm:space-x-0">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <span className="hito-status-pill" data-tone="success">
                Ready to review
              </span>
              <span className="hito-status-pill" data-tone="muted">
                Not saved
              </span>
            </div>
            <button
              ref={readyFocusTargetRef}
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
              aria-busy={creating || undefined}
              onClick={onCreate}
            >
              {creating ? primaryActionPendingLabel : primaryActionLabel}
            </button>
          </DialogFooter>
        ) : failedPreview ? (
          <DialogFooter className="hito-product-dialog-footer sm:space-x-0">
            {!unavailableIsCorrectable ? (
              <button
                type="button"
                className="hito-button hito-button-secondary hito-button-md"
                onClick={() => onOpenChange(false)}
              >
                Close
              </button>
            ) : null}
            <button
              type="button"
              className="hito-button hito-button-primary hito-button-md"
              onClick={unavailableIsCorrectable ? () => onOpenChange(false) : onRefresh}
            >
              {unavailableIsCorrectable ? "Review details" : "Try again"}
            </button>
          </DialogFooter>
        ) : null}
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
  openPlan?: boolean;
  tone: "destructive" | "signal";
} {
  switch (result.reason) {
    case "active_plan_exists":
      return {
        title: "Active plan already exists",
        copy: "Selected plans can create a new plan only when there is no active plan.",
        openPlan: true,
        tone: "signal",
      };
    case "fixture_not_authorized":
      return {
        title: "Preview session unavailable",
        copy: "This local preview session can no longer create the reviewed plan. Nothing was saved.",
        tone: "destructive",
      };
    case "stale_review":
    case "invalid_review":
    case "input_mismatch":
    case "preview_unavailable":
      return {
        title: "Refresh this preview",
        copy: "This reviewed preview is no longer current. Refresh the selected preview, then create again.",
        tone: "signal",
      };
    case "unauthenticated":
      return {
        title: "Sign in before creating",
        copy: "This session cannot create a selected running plan yet.",
        tone: "destructive",
      };
    case "persistence_failed":
      return {
        title: "Plan was not created",
        copy: "The selected running plan could not be saved. The current plan is unchanged.",
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
    copy: "Some required plan details are missing or invalid, so Hito could not prepare a preview.",
    nextStep: "Review the plan details and try again.",
    tone: "destructive",
  },
  provider_runtime_failure: {
    title: "Plan preview is temporarily unavailable",
    copy: "Hito could not prepare the plan right now. Your goal details do not need to change.",
    nextStep: "Try again in a moment.",
    tone: "signal",
  },
  provider_incomplete_output: {
    title: "The plan preview was incomplete",
    copy: "Hito could not prepare a complete plan for review. Your goal details do not need to change.",
    nextStep: "Try preparing the plan again.",
    tone: "signal",
  },
  malformed_provider_output: {
    title: "The plan preview could not be prepared",
    copy: "Hito could not turn this attempt into a complete plan for review. Your goal details do not need to change.",
    nextStep: "Try preparing the plan again.",
    tone: "signal",
  },
  compiler_rejection: {
    title: "The plan preview could not be prepared",
    copy: "Hito could not prepare a complete plan for review. Your goal details do not need to change.",
    nextStep: "Try preparing the plan again.",
    tone: "signal",
  },
  review_refusal: {
    title: "The plan review is unavailable",
    copy: "Hito could not prepare this plan for confirmation. Your goal details do not need to change.",
    nextStep: "Refresh the preview and try again.",
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
  const isMobile = useIsMobile();
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
  const [activeCalendarRowId, setActiveCalendarRowId] = useState<string | null>(null);

  useEffect(() => {
    setActiveCalendarRowId(null);
  }, [draft.reviewChecksum]);

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
            <PreviewFact label="Goal" value={reviewedGoalLabel(draft)} />
            <PreviewFact
              label="Plan length"
              value={`${rowsByWeek.length} weeks · ${nonRestRows.length} workouts`}
            />
            <PreviewFact
              label="Weekly ceiling"
              value={weeklyRunningCeilingReadback(draft.normalizedInputSummary.daysPerWeek)}
            />
            <PreviewFact label="Workout guidance" value={metricTruthReadback(draft)} />
            <PreviewFact label="Start date" value={draft.normalizedInputSummary.startDate} />
            <PreviewFact
              label="Fixed rest"
              value={fixedRestDaysReadback(draft.normalizedInputSummary.fixedRestDays)}
            />
            <PreviewFact
              label={
                draft.normalizedInputSummary.longRunDaySource === "runner_preference"
                  ? "Long-run preference"
                  : "Plan long-run day"
              }
              value={draft.normalizedInputSummary.preferredLongRunDay ?? "Plan-selected"}
            />
            <PreviewFact
              label="Plan weekdays"
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
              Review the planned workout rhythm and exact structure for every day.
            </p>
          </div>
          <span className="hito-status-pill" data-tone="signal">
            {nonRestRows.length} runs
          </span>
        </div>

        <div className="hito-selected-plan-calendar grid gap-2">
          <div
            className="hito-selected-plan-calendar-weeks"
            aria-label={`${reviewedGoalLabel(draft)} preview calendar`}
          >
            {rowsByWeek.map(([weekNumber, rows]) => (
              <div
                key={weekNumber}
                className="hito-selected-plan-calendar-week"
                role="group"
                aria-label={`Week ${weekNumber}`}
              >
                <div className="hito-selected-plan-calendar-week-grid">
                  {rows.map((row) => {
                    const document = workoutDocumentsById.get(row.rowId);
                    if (!document) return null;

                    const identity = previewCalendarWorkoutIdentity(document);
                    const endpoint = calendarEndpointReadback(row);
                    const day = formatCalendarDayNumber(row.date);
                    const selected = row.rowId === activeCalendarRowId;
                    const detailId = `generated-plan-workout-${row.rowId}`;
                    const ariaLabel = [
                      `${row.date} ${row.weekday}`,
                      identity.label,
                      row.title,
                      endpoint,
                      "Open exact workout details",
                    ]
                      .filter(Boolean)
                      .join(". ");
                    const presentation = buildPreviewCalendarDayPresentation(row, document);

                    return (
                      <Popover
                        key={row.rowId}
                        open={selected}
                        onOpenChange={(nextOpen) =>
                          setActiveCalendarRowId((current) =>
                            nextOpen ? row.rowId : current === row.rowId ? null : current,
                          )
                        }
                      >
                        <PopoverAnchor asChild>
                          <button
                            type="button"
                            className="hito-selected-plan-calendar-day"
                            data-calendar-state={row.isRestDay ? "rest" : "workout"}
                            style={
                              {
                                "--hito-selected-plan-calendar-tone": identity.color,
                              } as CSSProperties
                            }
                            aria-controls={detailId}
                            aria-details={selected ? detailId : undefined}
                            aria-expanded={selected}
                            aria-haspopup="dialog"
                            aria-label={ariaLabel}
                            aria-pressed={selected}
                            onClick={() => setActiveCalendarRowId(row.rowId)}
                            onFocus={() => setActiveCalendarRowId(row.rowId)}
                            onMouseEnter={() => {
                              if (!isMobile) {
                                setActiveCalendarRowId(row.rowId);
                              }
                            }}
                          >
                            <HitoCalendarDayCell
                              {...presentation}
                              className="h-full"
                              day={day}
                              dense
                            />
                          </button>
                        </PopoverAnchor>
                        <PopoverContent
                          id={detailId}
                          align="start"
                          sideOffset={8}
                          collisionPadding={12}
                          className="hito-selected-plan-calendar-popover w-[min(30rem,calc(100vw-1.5rem))] max-w-[calc(100vw-1.5rem)] overflow-y-auto p-4"
                          aria-label={`${row.date} ${row.weekday} workout details`}
                          onOpenAutoFocus={(event) => event.preventDefault()}
                        >
                          {document.workoutType === "rest" ? (
                            <div className="min-w-0">
                              <p className="hito-label">
                                {row.date} · {row.weekday} · {identity.label}
                              </p>
                              <p className="hito-list-row-title mt-1">Rest day</p>
                              <p className="hito-list-row-copy mt-1">
                                This day has no workout structure or target guidance.
                              </p>
                            </div>
                          ) : (
                            <PreviewWorkoutDocument
                              document={document}
                              label={`${row.date} · ${row.weekday} · ${identity.label}`}
                            />
                          )}
                        </PopoverContent>
                      </Popover>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="hito-selected-plan-calendar-legend" aria-label="Calendar legend">
            {calendarLegend.map((identity) => (
              <PreviewLegendItem key={identity.label} identity={identity} />
            ))}
          </div>
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
  const distanceLabel = intent.distance?.label ?? "Distance unavailable";
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
    return "Distance unavailable";
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
    <article className="min-w-0">
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
  const identity = previewCalendarWorkoutIdentity(document);

  return {
    result: "none",
    state: row.isRestDay ? "rest" : "workout",
    supportingText: calendarEndpointReadback(row),
    title: row.isRestDay ? undefined : row.title,
    workout: {
      ...identity,
      short: "",
    },
  };
}

function previewCalendarWorkoutIdentity(document: WorkoutDocument): HitoCalendarWorkoutIdentity {
  return buildCalendarWorkoutIdentity({
    workoutType: document.workoutType,
    sourceWorkoutType: document.sourceWorkoutType,
    workoutFamily: document.workoutFamily,
    workoutIdentity: document.workoutIdentity,
    calendarIconKey: document.calendarIconKey,
    metricMode: document.metricMode,
    title: document.title,
    steps: document.steps,
  });
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
