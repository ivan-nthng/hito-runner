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
  RestoreSavedPlanReviewResult,
  RunningPlanConfirmActionResult,
  RunningPlanPreviewActionResult,
  RunningPlanPreviewProductDraft,
} from "@/lib/running-plan-engine-actions";
import { formatDistanceMeters } from "@/lib/training";
import type { WorkoutDocument } from "@/lib/workout-document";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useHitoProductMessage, useHitoUiLocale } from "@/components/ui/hito-ui-locale-provider";
import { getHitoKnownProductMessage } from "@/lib/ui-locale-messages";

type SelectedRunningPlanPreviewResult =
  | RunningPlanPreviewActionResult
  | Extract<RestoreSavedPlanReviewResult, { ok: true }>;
type SelectedRunningPlanPreviewDraft =
  | RunningPlanPreviewProductDraft
  | Omit<RunningPlanPreviewProductDraft, "reviewToken" | "reviewChecksum">;
type SelectedRunningPlanPreviewUnavailable = Extract<
  RunningPlanPreviewActionResult,
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
  const locale = useHitoUiLocale();
  const message = useHitoProductMessage();
  const fallbackReturnFocusRef = useRef<HTMLElement | null>(null);
  const dialogContentRef = useRef<HTMLDivElement | null>(null);
  const readyFocusTargetRef = useRef<HTMLButtonElement | null>(null);
  const wasLoadingExperienceVisibleRef = useRef(false);
  const loading = status === "previewing_plan";
  const creating = createStatus === "creating";
  const draft = resolveSelectedRunningPlanPreviewDraft(result);
  const unavailable = resolveSelectedRunningPlanPreviewUnavailable(result);
  const readOnly = result?.ok === true && "status" in result && result.status === "read_only";
  const reviewReady = Boolean(
    draft &&
    "reviewToken" in draft &&
    "reviewChecksum" in draft &&
    draft.reviewToken &&
    draft.reviewChecksum,
  );
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

          if (reviewReady || readOnly) {
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
            <DialogTitle>{message("Preparing your {goal} plan", { goal: goalLabel })}</DialogTitle>
            <DialogDescription>
              {message("Plan preview preparation is in progress.")}
            </DialogDescription>
          </div>
        ) : reviewVisible && draft ? (
          <GeneratedPlanReadyReviewHeader draft={draft} />
        ) : (
          <DialogHeader className="hito-product-dialog-header">
            <div className="min-w-0">
              <p
                className="hito-label-sm uppercase tracking-[0.18em] text-accent"
                data-tone="signal"
              >
                {message("Generated plan")}
              </p>
              <DialogTitle className="hito-ui-title-md text-foreground mt-2">
                {message("{goal} plan preview", { goal: goalLabel })}
              </DialogTitle>
              <DialogDescription className="hito-body-md text-secondary max-w-2xl">
                {getHitoKnownProductMessage(locale, description)}
              </DialogDescription>
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
              <p className="hito-body-md text-foreground">{message("Preview unavailable")}</p>
              <p className="hito-body-sm mt-1 text-secondary">{error}</p>
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
                  <p className="hito-body-md text-foreground">{message("Refreshing preview")}</p>
                  <p className="hito-body-sm mt-1 text-secondary">
                    {message(
                      "Your current saved plan stays in Plans while Hito prepares a new reviewed version.",
                    )}
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
              <p className="hito-body-md text-foreground">
                {message("Adding workouts to Calendar")}
              </p>
              <p className="hito-body-sm mt-1 text-secondary">
                {message("Hito is adding this saved plan's workouts to Calendar.")}
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
              {message("Cancel")}
            </HitoButton>
          </DialogFooter>
        ) : reviewVisible && draft && readOnly ? (
          <DialogFooter className="hito-product-dialog-footer sm:space-x-0">
            <HitoButton
              ref={readyFocusTargetRef}
              type="button"
              size="md"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              {message("Close")}
            </HitoButton>
          </DialogFooter>
        ) : reviewVisible && draft ? (
          <DialogFooter className="hito-product-dialog-footer grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:space-x-0">
            <p className="hito-body-xs text-tertiary min-w-0">
              {message("Saved in Plans. Calendar workouts have not been added yet.")}
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
                {getHitoKnownProductMessage(
                  locale,
                  creating ? primaryActionPendingLabel : primaryActionLabel,
                )}
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
                {message("Close")}
              </HitoButton>
            ) : null}
            <HitoButton
              type="button"
              size="md"
              variant="primary"
              onClick={unavailableIsCorrectable ? () => onOpenChange(false) : onRefresh}
            >
              {unavailableIsCorrectable ? message("Review details") : message("Try again")}
            </HitoButton>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function resolveSelectedRunningPlanPreviewDraft(
  result: SelectedRunningPlanPreviewResult | null,
): SelectedRunningPlanPreviewDraft | null {
  if (!result?.ok) {
    return null;
  }

  return "draft" in result ? result.draft : result.review;
}

function resolveSelectedRunningPlanPreviewUnavailable(
  result: SelectedRunningPlanPreviewResult | null,
): SelectedRunningPlanPreviewUnavailable | null {
  if (!result || result.ok || !("unavailable" in result)) {
    return null;
  }

  return result.unavailable;
}

function GeneratedPlanReadyReviewHeader({ draft }: { draft: SelectedRunningPlanPreviewDraft }) {
  const locale = useHitoUiLocale();
  const startDate = draft.schedule.startDate;
  const endDate = draft.schedule.endDate;
  const raceDate = draft.goal.targetDate;
  const finishTime = draft.goal.targetFinishTime;
  const durationWeeks = groupRowsByWeek(draft.calendarRows).length;
  const header = buildGeneratedPlanReviewHeaderModel(
    {
      durationWeeks,
      endDate,
      finishTime,
      goalLabel: reviewedGoalLabel(draft),
      raceDate,
      startDate,
    },
    locale,
  );

  return (
    <DialogHeader className="hito-product-dialog-header border-b-0">
      <div className="min-w-0">
        <DialogTitle className="hito-ui-title-xl mt-2 max-w-[44rem] break-words">
          {header.title}
        </DialogTitle>
        <p className="hito-ui-title-sm text-foreground mt-2 min-w-0 break-words">
          {header.startCopy}
        </p>
      </div>
      <div className="mt-3 grid min-w-0 gap-1">
        <p className="hito-body-sm text-secondary break-words">{header.rangeCopy}</p>
        {header.modifierCopy ? (
          <p className="hito-body-sm text-secondary break-words">{header.modifierCopy}</p>
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
  const locale = useHitoUiLocale();
  const message = useHitoProductMessage();
  const view = createBlockedView(result);

  return (
    <div className="hito-surface-wash" data-tone={view.tone}>
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="hito-body-md text-foreground">
            {getHitoKnownProductMessage(locale, view.title)}
          </p>
          <p className="hito-body-sm mt-1 text-secondary">
            {getHitoKnownProductMessage(locale, view.copy)}
          </p>
        </div>
        {view.openPlan ? (
          <HitoButton asChild className="shrink-0" size="sm" variant="secondary">
            <a href="/">{message("Back to calendar")}</a>
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
  const locale = useHitoUiLocale();
  const message = useHitoProductMessage();
  const view = PREVIEW_UNAVAILABLE_VIEWS[result.previewOutcome];

  return (
    <div className="grid gap-4">
      <div className="hito-surface-wash" data-tone={view.tone}>
        <p className="hito-body-md text-foreground">
          {getHitoKnownProductMessage(locale, view.title)}
        </p>
        <p className="hito-body-sm mt-1 text-secondary">
          {getHitoKnownProductMessage(locale, view.copy)}
        </p>
      </div>
      <div className="hito-row-group">
        <div className="hito-list-row items-start">
          <PreviewFact
            label={message("Next step")}
            value={getHitoKnownProductMessage(locale, view.nextStep)}
          />
          <PreviewFact
            label={message("Saved plan")}
            value={message("Nothing was created or saved.")}
          />
        </div>
      </div>
    </div>
  );
}

function PreviewFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="hito-label-md text-foreground">{label}</p>
      <p className="hito-body-sm mt-1 text-secondary">{value}</p>
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
  const locale = useHitoUiLocale();
  const message = useHitoProductMessage();
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
  const reviewIdentity =
    ("reviewChecksum" in draft ? draft.reviewChecksum : null) ??
    draft.savedPlanReviewCandidate?.sha256 ??
    `${draft.schedule.startDate}:${draft.schedule.endDate}:${draft.calendarRows.length}`;

  useEffect(() => {
    setActiveCalendarRowId(null);
  }, [reviewIdentity]);

  if (missingWorkoutDocumentRow) {
    return (
      <div className="hito-surface-wash" data-tone="destructive">
        <p className="hito-body-md text-foreground">{message("Workout preview unavailable")}</p>
        <p className="hito-body-sm mt-1 text-secondary">
          {message(
            "The reviewed workout document for {date} is unavailable. Refresh this preview before creating the plan.",
            { date: missingWorkoutDocumentRow.date },
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <section className="grid gap-3">
        <div>
          <h3 className="hito-ui-title-sm text-foreground">{message("Plan calendar")}</h3>
          <p className="hito-body-sm text-secondary mt-1">
            {message("Select a day to review the workout summary.")}
          </p>
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
                aria-label={message("Week {week}", { week: weekNumber })}
              >
                <div className="hito-selected-plan-calendar-week-grid">
                  {rows.map((row) => {
                    const document = workoutDocumentsById.get(row.rowId);
                    if (!document) return null;

                    const identity = previewCalendarWorkoutIdentity(document);
                    const localizedIdentity = {
                      ...identity,
                      label: getHitoKnownProductMessage(locale, identity.label),
                      short: identity.short
                        ? getHitoKnownProductMessage(locale, identity.short)
                        : identity.short,
                    };
                    const endpoint = calendarEndpointReadback(row);
                    const day = formatCalendarDayNumber(row.date);
                    const selected = row.rowId === activeCalendarRowId;
                    const detailId = `generated-plan-workout-${row.rowId}`;
                    const ariaLabel = [
                      `${row.date} ${row.weekday}`,
                      localizedIdentity.label,
                      row.title,
                      endpoint,
                      message("Open workout summary"),
                    ]
                      .filter(Boolean)
                      .join(". ");
                    const presentation = buildPreviewCalendarDayPresentation(row, document);
                    const localizedPresentation = {
                      ...presentation,
                      workout: presentation.workout
                        ? {
                            ...presentation.workout,
                            label: getHitoKnownProductMessage(locale, presentation.workout.label),
                            short: presentation.workout.short
                              ? getHitoKnownProductMessage(locale, presentation.workout.short)
                              : presentation.workout.short,
                          }
                        : presentation.workout,
                    };

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
                              {...localizedPresentation}
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
                          aria-label={message("{date} workout summary", {
                            date: `${row.date} ${getHitoKnownProductMessage(locale, row.weekday)}`,
                          })}
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

          <div
            className="hito-selected-plan-calendar-legend"
            aria-label={message("Calendar legend")}
          >
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
  const locale = useHitoUiLocale();
  return (
    <span className="hito-selected-plan-calendar-legend-item">
      <span
        className="hito-selected-plan-calendar-legend-swatch"
        style={{ background: identity.color }}
      />
      {getHitoKnownProductMessage(locale, identity.label)}
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
