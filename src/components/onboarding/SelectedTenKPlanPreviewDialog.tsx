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
import { HitoButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  HitoCalendarDayCell,
  type HitoCalendarWorkoutIdentity,
} from "@/components/ui/hito-calendar-day";
import { buildCalendarWorkoutIdentity } from "@/components/calendar/calendar-projection";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { GeneratedPlanPreviewLoadingState } from "@/components/onboarding/GeneratedPlanPreviewLoadingState";
import { useGeneratedPlanReadyTransition } from "@/components/onboarding/generated-plan-preview-transition";
import { buildGeneratedPlanReviewHeaderModel } from "@/components/onboarding/generated-plan-review-header-model";
import { GeneratedPlanWorkoutSummary } from "@/components/onboarding/GeneratedPlanWorkoutSummary";
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
  return draft.goal.distanceLabel;
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
  onCancel: () => void;
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
  onCancel,
  onCreate,
  onOpenChange,
  onRefresh,
  open,
  description = "Review the saved plan before adding its workouts to Calendar.",
  primaryActionLabel = "Add to Calendar",
  primaryActionPendingLabel = "Adding to Calendar...",
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
  const interactionLocked = initialLoading;

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
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && interactionLocked) {
          return;
        }

        onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        ref={dialogContentRef}
        {...(reviewVisible ? { "aria-describedby": undefined } : {})}
        className={cn(
          "hito-dialog-stable hito-product-dialog hito-dialog-surface-product",
          compact
            ? "hito-product-dialog-content-fit hito-dialog-size-wide"
            : "hito-dialog-size-review hito-dialog-height-review",
        )}
        overlayClassName="hito-dialog-overlay-stable"
        showCloseButton={!loadingExperienceVisible}
        onEscapeKeyDown={(event) => {
          if (interactionLocked) {
            event.preventDefault();
          }
        }}
        onInteractOutside={(event) => {
          if (interactionLocked) {
            event.preventDefault();
          }
        }}
        onOpenAutoFocus={(event) => {
          const activeElement = document.activeElement;
          fallbackReturnFocusRef.current =
            activeElement instanceof HTMLElement ? activeElement : null;

          if (reviewReady) {
            event.preventDefault();
            readyFocusTargetRef.current?.focus();
          }
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
        ) : reviewVisible && draft ? (
          <GeneratedPlanReadyReviewHeader draft={draft} />
        ) : (
          <DialogHeader className="hito-product-dialog-header">
            <div className="min-w-0">
              <p className="hito-micro-label" data-tone="signal">
                Generated plan
              </p>
              <DialogTitle className="hito-ui-modal-title mt-2">
                {goalLabel} plan preview
              </DialogTitle>
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
                    Your current saved plan stays in Plans while Hito prepares a new reviewed
                    version.
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
              <p className="hito-list-row-title">Adding workouts to Calendar</p>
              <p className="hito-list-row-copy">
                Hito is adding this saved plan&apos;s workouts to Calendar.
              </p>
            </div>
          ) : null}
          {reviewVisible && draft ? <PreviewDraftView draft={draft} /> : null}
          {confirmResult && !confirmResult.ok ? (
            <CreateBlockedNotice result={confirmResult} />
          ) : null}
          {!loadingExperienceVisible ? extraNotice : null}
        </div>

        {initialLoading ? (
          <DialogFooter className="hito-product-dialog-footer hito-product-dialog-footer-center sm:space-x-0">
            <HitoButton type="button" size="md" variant="secondary" onClick={onCancel}>
              Cancel
            </HitoButton>
          </DialogFooter>
        ) : reviewVisible && draft ? (
          <DialogFooter className="hito-product-dialog-footer grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:space-x-0">
            <p className="hito-caption min-w-0">
              Saved in Plans. Calendar workouts have not been added yet.
            </p>
            <div className="flex w-full flex-col-reverse gap-3 sm:w-auto sm:flex-row sm:items-center">
              <HitoButton
                ref={readyFocusTargetRef}
                type="button"
                size="md"
                variant="primary"
                disabled={!reviewReady || loading}
                loading={creating}
                onClick={onCreate}
              >
                {creating ? primaryActionPendingLabel : primaryActionLabel}
              </HitoButton>
            </div>
          </DialogFooter>
        ) : failedPreview ? (
          <DialogFooter className="hito-product-dialog-footer sm:space-x-0">
            {!unavailableIsCorrectable ? (
              <HitoButton
                type="button"
                size="md"
                variant="secondary"
                onClick={() => onOpenChange(false)}
              >
                Close
              </HitoButton>
            ) : null}
            <HitoButton
              type="button"
              size="md"
              variant="primary"
              onClick={unavailableIsCorrectable ? () => onOpenChange(false) : onRefresh}
            >
              {unavailableIsCorrectable ? "Review details" : "Try again"}
            </HitoButton>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function GeneratedPlanReadyReviewHeader({ draft }: { draft: SelectedRunningPlanPreviewDraft }) {
  const startDate = draft.schedule.startDate;
  const endDate = draft.schedule.endDate;
  const raceDate = draft.goal.targetDate;
  const finishTime = draft.goal.targetFinishTime;
  const durationWeeks = groupRowsByWeek(draft.calendarRows).length;
  const header = buildGeneratedPlanReviewHeaderModel({
    durationWeeks,
    endDate,
    finishTime,
    goalLabel: reviewedGoalLabel(draft),
    raceDate,
    startDate,
  });

  return (
    <DialogHeader className="hito-product-dialog-header border-b-0">
      <div className="min-w-0">
        <DialogTitle className="hito-ui-page-title mt-2 break-words">{header.title}</DialogTitle>
        <p className="hito-ui-section-title mt-2 min-w-0 break-words">{header.startCopy}</p>
      </div>
      <div className="mt-3 grid min-w-0 gap-1">
        <p className="hito-body-small break-words">{header.rangeCopy}</p>
        {header.modifierCopy ? (
          <p className="hito-body-small break-words">{header.modifierCopy}</p>
        ) : null}
      </div>
    </DialogHeader>
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
          <HitoButton asChild className="shrink-0" size="sm" variant="secondary">
            <a href="/">Back to calendar</a>
          </HitoButton>
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
        copy: "This local preview session can no longer add the saved plan to Calendar. The saved record remains in Plans.",
        tone: "destructive",
      };
    case "stale_review":
    case "invalid_review":
    case "input_mismatch":
    case "preview_unavailable":
      return {
        title: "Refresh this preview",
        copy: "This saved preview is no longer current. Refresh it before adding workouts to Calendar.",
        tone: "signal",
      };
    case "unauthenticated":
      return {
        title: "Sign in before adding to Calendar",
        copy: "This session cannot add the saved plan to Calendar yet. The saved record remains in Plans.",
        tone: "destructive",
      };
    case "persistence_failed":
      return {
        title: "Calendar was not updated",
        copy: "Hito could not add the saved plan to Calendar. The saved record remains in Plans.",
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

function PreviewFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="hito-label">{label}</p>
      <p className="hito-list-row-copy mt-1">{value}</p>
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
    <div className="grid gap-4">
      <section className="grid gap-3">
        <div>
          <h3 className="hito-ui-section-title">Plan calendar</h3>
          <p className="hito-body-small mt-1">Select a day to review the workout summary.</p>
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
                      "Open workout summary",
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
                          aria-label={`${row.date} ${row.weekday} workout summary`}
                          onOpenAutoFocus={(event) => event.preventDefault()}
                        >
                          <GeneratedPlanWorkoutSummary document={document} />
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
