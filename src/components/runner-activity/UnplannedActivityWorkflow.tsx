import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type RefObject } from "react";

import { HitoButton } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HitoChoiceToggle } from "@/components/ui/hito-choice-toggle";
import { useHitoProductMessage, useHitoUiLocale } from "@/components/ui/hito-ui-locale-provider";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import type { HitoProductApiFailure } from "@/lib/product-api-error-contract";
import {
  confirmUnplannedActivityReview,
  hydrateUnplannedActivityReview,
} from "@/lib/runner-activity/unplanned-actions";
import type {
  ConfirmUnplannedActivityReviewResult,
  UnplannedActivityNormalizedIntervalV1,
  UnplannedActivityReviewV1,
} from "@/lib/runner-activity/product-contract";
import { formatUiDate, formatUiNumber } from "@/lib/ui-locale";
import { getHitoProductApiFailureMessage } from "@/lib/ui-locale-messages";

export type UnplannedActivityWorkflowEntry =
  | { kind: "calendar"; clickedDate: string }
  | { kind: "history"; activityId: string };

export function UnplannedActivityWorkflow({
  entry,
  fallbackFocusId,
  onConfirmed,
  onOpenChange,
  returnFocusRef,
}: {
  entry: UnplannedActivityWorkflowEntry | null;
  fallbackFocusId: string;
  onConfirmed?: (review: UnplannedActivityReviewV1) => Promise<void> | void;
  onOpenChange: (open: boolean) => void;
  returnFocusRef: RefObject<HTMLElement | null>;
}) {
  const isMobile = useIsMobile();
  const locale = useHitoUiLocale();
  const message = useHitoProductMessage();
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [review, setReview] = useState<UnplannedActivityReviewV1 | null>(null);
  const [title, setTitle] = useState("Run");
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [associationSelected, setAssociationSelected] = useState(false);
  const [uploadOutcomeUnknown, setUploadOutcomeUnknown] = useState(false);
  const [hydrating, setHydrating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmBlocked, setConfirmBlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmedIntent, setConfirmedIntent] = useState<
    "materialize_on_rest" | "associate_existing" | null
  >(null);
  const busy = hydrating || uploading || confirming;

  useEffect(() => {
    let ignore = false;

    setReview(null);
    setTitle("Run");
    setSelectedFileName(null);
    setAssociationSelected(false);
    setUploadOutcomeUnknown(false);
    setConfirmBlocked(false);
    setError(null);
    setNotice(null);
    setConfirmedIntent(null);

    if (!entry || entry.kind !== "history") return;

    setHydrating(true);
    void hydrateUnplannedActivityReview({ data: { activityId: entry.activityId, title: null } })
      .then((nextReview) => {
        if (ignore) return;
        setReview(nextReview);
        setTitle(nextReview.title);
      })
      .catch(() => {
        if (!ignore) {
          setError(
            message(
              "This saved activity could not be opened. Refresh Activity History and try again.",
            ),
          );
        }
      })
      .finally(() => {
        if (!ignore) setHydrating(false);
      });

    return () => {
      ignore = true;
    };
  }, [entry, message]);

  const clickedDate = entry?.kind === "calendar" ? entry.clickedDate : null;
  const confirmedWorkout =
    review?.calendarState.state === "confirmed" ? review.calendarState.workout : null;
  const canConfirmRest = Boolean(
    !confirmBlocked &&
    review?.placement.kind === "past_rest_available" &&
    review.capabilities.canConfirmRest,
  );
  const canConfirmAssociation = Boolean(
    !confirmBlocked &&
    review?.placement.kind === "occupied_association_available" &&
    review.capabilities.canConfirmAssociation &&
    associationSelected,
  );
  const canConfirm = canConfirmRest || canConfirmAssociation;

  const requestClose = (nextOpen: boolean) => {
    if (!nextOpen && busy) return;
    onOpenChange(nextOpen);
  };

  const returnFocus = (event: Event) => {
    const target = returnFocusRef.current?.isConnected
      ? returnFocusRef.current
      : document.getElementById(fallbackFocusId);
    if (!target) return;
    event.preventDefault();
    target.focus();
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadOutcomeUnknown(false);
    setSelectedFileName(file.name);
    setError(null);
    setNotice(message("Uploading and processing activity…"));

    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch("/api/workout-result/upload", {
        method: "POST",
        body: formData,
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      const body = (await response.json().catch(() => null)) as
        | { ok: true; unplannedActivityReview: UnplannedActivityReviewV1 | null }
        | HitoProductApiFailure
        | null;

      if (!response.ok || !body || !body.ok) {
        setError(
          body && !body.ok
            ? getHitoProductApiFailureMessage(locale, body)
            : message("The activity file could not be processed. Try again shortly."),
        );
        return;
      }

      if (!body.unplannedActivityReview) {
        setError(message("The saved activity review is unavailable. Check Activity History."));
        return;
      }

      setReview(body.unplannedActivityReview);
      setTitle(body.unplannedActivityReview.title);
      setAssociationSelected(false);
      setNotice(
        body.unplannedActivityReview.source.ingestDisposition === "reused_exact_source" &&
          body.unplannedActivityReview.calendarState.state === "saved_unassigned"
          ? message("This activity was already uploaded. Continue where you left off.")
          : message("Activity saved. Review the facts before adding it to Calendar."),
      );
    } catch {
      setUploadOutcomeUnknown(true);
      setError(
        message(
          "Connection interrupted. Check whether the activity was saved before uploading again.",
        ),
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const confirmReview = async () => {
    if (!review || !canConfirm || confirming) return;

    setConfirming(true);
    setError(null);
    setNotice(message("Adding activity to Calendar…"));

    try {
      let sealedReview = review;
      const normalizedTitle = title.trim() || null;
      if (normalizedTitle !== review.title) {
        sealedReview = await hydrateUnplannedActivityReview({
          data: { activityId: review.activityId, title: normalizedTitle },
        });
        setReview(sealedReview);
        setTitle(sealedReview.title);
      }

      const intent =
        sealedReview.placement.kind === "past_rest_available"
          ? "materialize_on_rest"
          : "associate_existing";
      const result = await confirmUnplannedActivityReview({
        data: {
          activityId: sealedReview.activityId,
          reviewToken: sealedReview.reviewToken,
          reviewChecksum: sealedReview.reviewChecksum,
          intent,
        },
      });

      if (!result.ok) {
        if (result.reason === "invalid_review") {
          try {
            const freshReview = await hydrateUnplannedActivityReview({
              data: { activityId: review.activityId, title: title.trim() || null },
            });
            setReview(freshReview);
            setTitle(freshReview.title);
            setAssociationSelected(false);
            setConfirmBlocked(false);
            setNotice(null);
            setError(
              message("This review expired. Review the refreshed details before confirming again."),
            );
            return;
          } catch {
            // Fall through to the safe terminal readback below.
          }
        }
        applyFailedConfirmation(result);
        return;
      }

      setReview(result.review);
      setTitle(result.review.title);
      setConfirmedIntent(intent);
      setNotice(
        result.projectionState === "updating"
          ? message("Activity added. Calendar and evidence are updating.")
          : intent === "associate_existing"
            ? message("Activity associated with the existing workout.")
            : message("Activity added to Calendar."),
      );
      await onConfirmed?.(result.review);
    } catch {
      setError(message("The activity could not be added to Calendar. Review the current state."));
    } finally {
      setConfirming(false);
    }
  };

  const applyFailedConfirmation = (
    result: Extract<ConfirmUnplannedActivityReviewResult, { ok: false }>,
  ) => {
    setConfirmBlocked(result.reason !== "persistence_failed");
    if (result.review) {
      setReview(result.review);
      setTitle(result.review.title);
      setAssociationSelected(false);
    }
    setError(confirmFailureMessage(result.reason, message));
    setNotice(null);
  };

  const heading = review?.title ?? message("Add activity");
  const description = clickedDate
    ? message("Activity started from {date}", {
        date: formatUiDate(clickedDate, locale, { dateStyle: "long" }),
      })
    : message("Review the saved activity before adding it to Calendar.");
  const body = (
    <div className="space-y-6" aria-busy={busy || undefined}>
      {notice ? (
        <div
          className="hito-state-surface py-3"
          data-tone="signal"
          role="status"
          aria-live="polite"
        >
          <p className="hito-body-sm text-secondary">{notice}</p>
        </div>
      ) : null}
      {error ? (
        <div className="hito-state-surface py-3" data-tone="destructive" role="alert">
          <p className="hito-body-sm text-secondary">{error}</p>
        </div>
      ) : null}

      {!review && !hydrating && !uploadOutcomeUnknown ? (
        <section className="space-y-4">
          <div>
            <p className="hito-label-md text-foreground">{message("Activity file")}</p>
            <p className="hito-body-sm mt-2 text-secondary">
              {message(
                "Choose one FIT file or a ZIP containing exactly one FIT activity. Maximum file size: 25 MB.",
              )}
            </p>
          </div>
          {selectedFileName ? (
            <p className="hito-technical-sm text-tertiary break-all">{selectedFileName}</p>
          ) : null}
          <input
            ref={fileInputRef}
            type="file"
            accept=".fit,.zip"
            className="sr-only"
            tabIndex={-1}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadFile(file);
            }}
          />
          <HitoButton
            type="button"
            size="md"
            variant="primary"
            disabled={uploading}
            loading={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Icon name={uploading ? "loader" : "upload"} size="sm" />
            {uploading ? message("Uploading…") : message("Choose FIT or ZIP")}
          </HitoButton>
        </section>
      ) : null}

      {uploadOutcomeUnknown ? (
        <div className="hito-state-surface" data-size="md" data-tone="warning">
          <p className="hito-body-sm text-secondary">
            {message(
              "Check Activity History before uploading again so the same activity is not duplicated.",
            )}
          </p>
        </div>
      ) : null}

      {hydrating ? (
        <div className="hito-state-surface" data-size="md" data-tone="neutral" role="status">
          <p className="hito-label-md flex items-center gap-2">
            <Icon name="loader" size="sm" />
            {message("Loading saved activity…")}
          </p>
        </div>
      ) : null}

      {review ? (
        <>
          {review.calendarState.state === "saved_unassigned" ? (
            <span className="hito-status-pill" data-tone="warning">
              {message("Saved · Not on Calendar")}
            </span>
          ) : (
            <span className="hito-status-pill" data-tone="success">
              {message("Saved · On Calendar")}
            </span>
          )}

          {review.capabilities.canEditFallbackTitle ? (
            <label className="grid gap-2" htmlFor="unplanned-activity-title">
              <span className="hito-label-sm text-foreground">{message("Activity title")}</span>
              <Input
                id="unplanned-activity-title"
                value={title}
                maxLength={80}
                disabled={busy || review.calendarState.state === "confirmed"}
                onChange={(event) => setTitle(event.target.value)}
                onBlur={() => {
                  if (!title.trim()) setTitle("Run");
                }}
              />
            </label>
          ) : null}

          <PlacementNotice
            associationSelected={associationSelected}
            clickedDate={clickedDate}
            onAssociationSelected={setAssociationSelected}
            review={review}
          />
          <ActivityFacts review={review} />
          <IntervalDisclosure kind="laps" review={review} />
          <IntervalDisclosure kind="steps" review={review} />
          <SourceDetails review={review} />

          {review.calendarState.state === "saved_unassigned" ? (
            <p className="hito-body-sm text-secondary">
              {message(
                "The activity is saved in Activity History. You can finish adding it to Calendar later.",
              )}
            </p>
          ) : confirmedWorkout ? (
            <div className="hito-state-surface" data-size="md" data-tone="success" role="status">
              <p className="hito-label-md">
                {confirmedIntent === "associate_existing"
                  ? message("Activity associated with {workout} on {date}", {
                      workout: confirmedWorkout.title,
                      date: formatUiDate(confirmedWorkout.workoutDate, locale, {
                        dateStyle: "long",
                      }),
                    })
                  : message("Activity added to {date}", {
                      date: formatUiDate(confirmedWorkout.workoutDate, locale, {
                        dateStyle: "long",
                      }),
                    })}
              </p>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );

  const footer = review ? (
    <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <HitoButton
        type="button"
        size="md"
        variant="secondary"
        disabled={busy}
        onClick={() => requestClose(false)}
      >
        {message("Close")}
      </HitoButton>
      {review.calendarState.state === "confirmed" ? (
        <>
          <HitoButton asChild size="md" variant="secondary">
            <Link
              to="/progress"
              search={{ tab: "history" } as never}
              onClick={() => requestClose(false)}
            >
              {message("View activity history")}
            </Link>
          </HitoButton>
          <HitoButton asChild size="md" variant="primary">
            <Link
              to="/"
              onClick={() => {
                const target = confirmedWorkout
                  ? document.querySelector<HTMLElement>(
                      `[data-calendar-date="${confirmedWorkout.workoutDate}"] a[href]`,
                    )
                  : null;
                if (target) returnFocusRef.current = target;
                requestClose(false);
              }}
            >
              {message("Back to Calendar")}
            </Link>
          </HitoButton>
        </>
      ) : canConfirmRest || review.placement.kind === "past_rest_available" ? (
        <HitoButton
          type="button"
          size="md"
          variant="primary"
          loading={confirming}
          disabled={!canConfirm || busy}
          onClick={() => void confirmReview()}
        >
          {message("Confirm and add to Calendar")}
        </HitoButton>
      ) : review.placement.kind === "occupied_association_available" ? (
        <HitoButton
          type="button"
          size="md"
          variant="primary"
          loading={confirming}
          disabled={!canConfirm || busy}
          onClick={() => void confirmReview()}
        >
          {message("Confirm association")}
        </HitoButton>
      ) : (
        <HitoButton asChild size="md" variant="secondary">
          <Link
            to="/progress"
            search={{ tab: "history" } as never}
            onClick={() => requestClose(false)}
          >
            {message("View activity history")}
          </Link>
        </HitoButton>
      )}
    </div>
  ) : uploadOutcomeUnknown ? (
    <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <HitoButton type="button" size="md" variant="secondary" onClick={() => requestClose(false)}>
        {message("Close")}
      </HitoButton>
      <HitoButton asChild size="md" variant="primary">
        <Link
          to="/progress"
          search={{ tab: "history" } as never}
          onClick={() => requestClose(false)}
        >
          {message("Check upload status")}
        </Link>
      </HitoButton>
    </div>
  ) : (
    <HitoButton
      type="button"
      size="md"
      variant="secondary"
      disabled={busy}
      onClick={() => requestClose(false)}
    >
      {message("Cancel")}
    </HitoButton>
  );

  if (isMobile) {
    return (
      <Sheet open={entry !== null} onOpenChange={requestClose}>
        <SheetContent
          side="bottom"
          className="inset-0 flex h-[100dvh] max-h-[100dvh] w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 p-0 sm:max-w-none"
          onEscapeKeyDown={(event) => {
            if (busy) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (busy) event.preventDefault();
          }}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            headingRef.current?.focus();
          }}
          onCloseAutoFocus={returnFocus}
        >
          <SheetHeader className="border-b border-hairline px-5 py-4 pr-14">
            <p className="hito-label-sm text-tertiary">{message("Activity file")}</p>
            <SheetTitle ref={headingRef} tabIndex={-1}>
              {heading}
            </SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{body}</div>
          <SheetFooter className="border-t border-hairline px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4">
            {footer}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={entry !== null} onOpenChange={requestClose}>
      <DialogContent
        className="hito-dialog-stable hito-product-dialog hito-dialog-surface-product hito-dialog-size-workflow hito-dialog-height-workflow grid grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0"
        showCloseButton={!busy}
        onEscapeKeyDown={(event) => {
          if (busy) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (busy) event.preventDefault();
        }}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          headingRef.current?.focus();
        }}
        onCloseAutoFocus={returnFocus}
      >
        <DialogHeader className="hito-product-dialog-header">
          <p className="hito-label-sm text-tertiary">{message("Activity file")}</p>
          <DialogTitle ref={headingRef} tabIndex={-1}>
            {heading}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 overflow-y-auto px-6 py-5">{body}</div>
        <DialogFooter className="hito-product-dialog-footer sm:space-x-0">{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PlacementNotice({
  associationSelected,
  clickedDate,
  onAssociationSelected,
  review,
}: {
  associationSelected: boolean;
  clickedDate: string | null;
  onAssociationSelected: (selected: boolean) => void;
  review: UnplannedActivityReviewV1;
}) {
  const locale = useHitoUiLocale();
  const message = useHitoProductMessage();
  const targetDate = review.placement.targetDate;
  const formattedTargetDate = targetDate
    ? formatUiDate(targetDate, locale, { dateStyle: "long" })
    : null;
  const clickedDateMismatch = Boolean(clickedDate && targetDate && clickedDate !== targetDate);

  return (
    <section className="space-y-3" aria-labelledby="unplanned-placement-title">
      <h3 id="unplanned-placement-title" className="hito-ui-title-sm text-foreground">
        {message("Calendar placement")}
      </h3>
      {clickedDateMismatch && clickedDate && targetDate ? (
        <div className="hito-state-surface" data-size="sm" data-tone="warning">
          <p className="hito-body-sm text-secondary">
            {message(
              "You started from {clickedDate}. This FIT file records {fitDate}, so Hito will use {fitDate}.",
              {
                clickedDate: formatUiDate(clickedDate, locale, { dateStyle: "long" }),
                fitDate: formattedTargetDate ?? targetDate,
              },
            )}
          </p>
        </div>
      ) : null}

      {review.placement.kind === "past_rest_available" ? (
        <p className="hito-body-md text-secondary">
          {message("This activity will be added to {date}.", {
            date: formattedTargetDate ?? review.placement.targetDate,
          })}
        </p>
      ) : review.placement.kind === "occupied_association_available" ? (
        <div className="space-y-3">
          <div className="hito-state-surface" data-size="sm" data-tone="warning">
            <p className="hito-body-sm text-secondary">
              {message(
                "A workout already exists on {date}. Association keeps its title, structure, and origin unchanged.",
                {
                  date: formattedTargetDate ?? review.placement.targetDate,
                },
              )}
            </p>
          </div>
          <div role="radiogroup" aria-label={message("Calendar association")}>
            <HitoChoiceToggle
              presentation="card"
              role="radio"
              selected={associationSelected}
              className="w-full text-left"
              onClick={() => onAssociationSelected(!associationSelected)}
            >
              <span className="grid min-w-0 gap-1">
                <span className="hito-label-md text-foreground">
                  {message("Associate with {workout}", {
                    workout: review.placement.existingWorkout.title,
                  })}
                </span>
                <span className="hito-body-xs text-secondary">
                  {formattedTargetDate ?? review.placement.targetDate}
                </span>
              </span>
            </HitoChoiceToggle>
          </div>
        </div>
      ) : review.placement.kind === "occupied_ineligible" ? (
        <BlockingPlacementMessage>
          {message(
            "This activity is saved, but it can't be associated with the workout on {date}.",
            {
              date: formattedTargetDate ?? review.placement.targetDate,
            },
          )}
        </BlockingPlacementMessage>
      ) : review.placement.kind === "today_or_future" ? (
        <BlockingPlacementMessage>
          {message(
            "This activity is saved, but a today or future FIT date cannot be added from this historical flow.",
          )}
        </BlockingPlacementMessage>
      ) : review.placement.kind === "date_missing" ? (
        <BlockingPlacementMessage>
          {message("The activity date is not available in this FIT file.")}
        </BlockingPlacementMessage>
      ) : review.placement.kind === "stale" ? (
        <BlockingPlacementMessage>
          {message(
            "Calendar changed after this review opened. Close and resume from Activity History.",
          )}
        </BlockingPlacementMessage>
      ) : null}
    </section>
  );
}

function BlockingPlacementMessage({ children }: { children: string }) {
  return (
    <div className="hito-state-surface" data-size="sm" data-tone="warning" role="status">
      <p className="hito-body-sm text-secondary">{children}</p>
    </div>
  );
}

function ActivityFacts({ review }: { review: UnplannedActivityReviewV1 }) {
  const locale = useHitoUiLocale();
  const message = useHitoProductMessage();
  const unavailable = message("Not available in this FIT file");
  const primaryRows = [
    {
      label: message("Activity date"),
      value:
        review.facts.localDate.state === "available"
          ? formatUiDate(review.facts.localDate.value, locale, { dateStyle: "long" })
          : unavailable,
    },
    { label: message("Sport"), value: message("Run") },
    {
      label: message("Duration"),
      value:
        review.facts.duration.state === "available"
          ? message("{minutes} min · {basis}", {
              minutes: formatUiNumber(review.facts.duration.value.minutes, locale, {
                maximumFractionDigits: 1,
              }),
              basis:
                review.facts.duration.value.basis === "timer"
                  ? message("Timer time")
                  : message("Elapsed time"),
            })
          : unavailable,
    },
    {
      label: message("Distance"),
      value:
        review.facts.distanceKm.state === "available"
          ? message("{distance} km", {
              distance: formatUiNumber(review.facts.distanceKm.value, locale, {
                maximumFractionDigits: 2,
              }),
            })
          : unavailable,
    },
  ];
  const optionalFacts = [
    optionalMetric(review.facts.averageHeartRateBpm, message("Average heart rate"), "bpm", locale),
    optionalMetric(review.facts.maximumHeartRateBpm, message("Maximum heart rate"), "bpm", locale),
    optionalMetric(review.facts.averageCadenceSpm, message("Average cadence"), "spm", locale),
    optionalMetric(review.facts.averagePowerWatts, message("Average power"), "W", locale),
    optionalMetric(review.facts.maximumPowerWatts, message("Maximum power"), "W", locale),
    optionalMetric(review.facts.elevationGainM, message("Ascent"), "m", locale),
    optionalMetric(review.facts.elevationLossM, message("Descent"), "m", locale),
    optionalMetric(review.facts.calories, message("Calories"), "kcal", locale),
  ];
  const availableFacts = optionalFacts.filter((fact) => fact.value !== null);
  const missingFacts = optionalFacts.filter((fact) => fact.value === null);

  return (
    <section className="space-y-4" aria-labelledby="unplanned-facts-title">
      <h3 id="unplanned-facts-title" className="hito-ui-title-sm text-foreground">
        {message("Activity facts")}
      </h3>
      <dl className="hito-row-group">
        {primaryRows.map((row) => (
          <FactRow key={row.label} label={row.label} value={row.value} />
        ))}
        {availableFacts.map((row) => (
          <FactRow key={row.label} label={row.label} value={row.value ?? unavailable} />
        ))}
      </dl>
      {missingFacts.length ? (
        <p className="hito-body-xs text-tertiary">
          {message("Not available in this FIT file: {facts}.", {
            facts: missingFacts.map((fact) => fact.label).join(", "),
          })}
        </p>
      ) : null}
    </section>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="hito-list-row min-w-0">
      <dt className="hito-body-sm text-secondary min-w-0 flex-1">{label}</dt>
      <dd className="hito-technical-sm text-foreground text-right tabular-nums">{value}</dd>
    </div>
  );
}

function optionalMetric(
  fact: { state: "available"; value: number } | { state: "unavailable"; value: null },
  label: string,
  unit: string,
  locale: ReturnType<typeof useHitoUiLocale>,
) {
  return {
    label,
    value:
      fact.state === "available"
        ? `${formatUiNumber(fact.value, locale, { maximumFractionDigits: 1 })} ${unit}`
        : null,
  };
}

function IntervalDisclosure({
  kind,
  review,
}: {
  kind: "laps" | "steps";
  review: UnplannedActivityReviewV1;
}) {
  const message = useHitoProductMessage();
  const collection = review[kind];
  const label = kind === "laps" ? message("Laps") : message("Structured steps");
  const emptyCopy =
    kind === "laps"
      ? message("No laps were recorded in this FIT file.")
      : message("No structured workout steps were recorded in this FIT file.");

  return (
    <details className="hito-disclosure">
      <summary className="hito-disclosure-summary">
        <span>
          {collection.state === "available"
            ? message("{label} · {count}", { label, count: collection.items.length })
            : label}
        </span>
        <Icon name="chevron-down" size="xs" className="hito-disclosure-chevron" />
      </summary>
      <div className="hito-disclosure-body">
        {collection.state === "available" && collection.items.length ? (
          <IntervalTable includeStepIndex={kind === "steps"} items={collection.items} />
        ) : (
          <p className="hito-body-sm text-secondary">{emptyCopy}</p>
        )}
      </div>
    </details>
  );
}

function IntervalTable({
  includeStepIndex,
  items,
}: {
  includeStepIndex: boolean;
  items: UnplannedActivityNormalizedIntervalV1[];
}) {
  const locale = useHitoUiLocale();
  const message = useHitoProductMessage();
  const columns = [
    message("Duration"),
    message("Distance"),
    message("Average heart rate"),
    message("Maximum heart rate"),
    message("Average power"),
    message("Maximum power"),
    message("Average cadence"),
    message("Ascent"),
    message("Descent"),
    message("Calories"),
  ];

  return (
    <div
      className="hito-data-table-scroll"
      role="region"
      tabIndex={0}
      aria-label={message("FIT structure")}
    >
      <table className="hito-data-table hito-data-table-min-lg">
        <thead>
          <tr>
            <th scope="col" className="hito-data-table-cell text-left">
              #
            </th>
            {includeStepIndex ? (
              <th scope="col" className="hito-data-table-cell text-left">
                {message("Step")}
              </th>
            ) : null}
            {columns.map((column) => (
              <th key={column} scope="col" className="hito-data-table-cell text-left">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const values = [
              metricCell(item.durationMin, "min", locale),
              metricCell(item.distanceKm, "km", locale),
              metricCell(item.averageHeartRateBpm, "bpm", locale),
              metricCell(item.maximumHeartRateBpm, "bpm", locale),
              metricCell(item.averagePowerWatts, "W", locale),
              metricCell(item.maximumPowerWatts, "W", locale),
              metricCell(item.averageCadenceSpm, "spm", locale),
              metricCell(item.elevationGainM, "m", locale),
              metricCell(item.elevationLossM, "m", locale),
              metricCell(item.calories, "kcal", locale),
            ];
            return (
              <tr key={`${item.sequence}:${item.workoutStepIndex ?? "none"}`}>
                <th scope="row" className="hito-data-table-cell hito-data-table-cell-start">
                  {formatUiNumber(item.sequence, locale)}
                </th>
                {includeStepIndex ? (
                  <td className="hito-data-table-cell tabular-nums">
                    {item.workoutStepIndex == null
                      ? message("Not available")
                      : formatUiNumber(item.workoutStepIndex, locale)}
                  </td>
                ) : null}
                {values.map((value, index) => (
                  <td
                    key={`${item.sequence}:${columns[index]}`}
                    className="hito-data-table-cell whitespace-nowrap tabular-nums"
                  >
                    {value ?? message("Not available")}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function metricCell(
  value: number | null,
  unit: string,
  locale: ReturnType<typeof useHitoUiLocale>,
) {
  return value == null
    ? null
    : `${formatUiNumber(value, locale, { maximumFractionDigits: 2 })} ${unit}`;
}

function SourceDetails({ review }: { review: UnplannedActivityReviewV1 }) {
  const message = useHitoProductMessage();
  return (
    <details className="hito-disclosure">
      <summary className="hito-disclosure-summary">
        <span>{message("Source details")}</span>
        <Icon name="chevron-down" size="xs" className="hito-disclosure-chevron" />
      </summary>
      <div className="hito-disclosure-body">
        <dl className="hito-row-group">
          <FactRow label={message("Original filename")} value={review.source.originalFileName} />
          {review.source.extractedFitFileName ? (
            <FactRow
              label={message("Extracted FIT filename")}
              value={review.source.extractedFitFileName}
            />
          ) : null}
          <FactRow label={message("Source kind")} value={message("File import")} />
          <FactRow
            label={message("Original file")}
            value={
              review.source.rawFileAvailability === "available"
                ? message("Available")
                : message("Unavailable")
            }
          />
          <FactRow label={message("Activity ID")} value={review.activityId} />
          <FactRow label={message("Revision ID")} value={review.activityRevisionId} />
        </dl>
      </div>
    </details>
  );
}

function confirmFailureMessage(
  reason: Extract<ConfirmUnplannedActivityReviewResult, { ok: false }>["reason"],
  message: ReturnType<typeof useHitoProductMessage>,
) {
  switch (reason) {
    case "not_found":
    case "foreign":
      return message("This saved activity is no longer available for this account.");
    case "invalid_review":
      return message("This review expired. Close and resume it from Activity History.");
    case "stale_review":
      return message("Calendar changed after this review opened. Review the current placement.");
    case "ineligible":
      return message("This activity is saved, but the current Calendar target is not eligible.");
    case "conflict":
      return message("This activity or Calendar date is already associated elsewhere.");
    case "persistence_failed":
      return message("The activity was not added to Calendar. Try confirming again.");
  }
}
