import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  AdminDataTableColumnHeader,
  AdminDataTableStaticHeader,
  AdminDataTableToolbar,
} from "@/components/admin/AdminOperationalComponents";
import { SelectedRunningPlanPreviewDialog } from "@/components/onboarding/SelectedTenKPlanPreviewDialog";
import { HitoButton } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { HitoMetadataTag } from "@/components/ui/metadata-tag";
import { Skeleton } from "@/components/ui/skeleton";
import {
  listSavedPlanLibrary,
  removeSavedPlanRecord,
  startSavedPlanRecord,
} from "@/lib/active-plan-export-actions";
import type {
  SavedPlanApplyResult,
  SavedPlanLibraryRecordState,
  SavedPlanLibrarySummary,
} from "@/lib/active-plan-persistence";
import {
  confirmRunningPlanDraft,
  listSavedPlanReviews,
  restoreSavedPlanReview,
  runningPlanConfirmInputSchema,
  type RestoreSavedPlanReviewResult,
  type RunningPlanConfirmActionResult,
  type SavedPlanReviewSummary,
} from "@/lib/running-plan-engine-actions";
import { formatDate } from "@/lib/training";

type SavedPlanSortKey = "createdAt" | "title" | "workoutCount";
type SavedPlanSort = { key: SavedPlanSortKey; direction: "asc" | "desc" };
type LibraryStatus = "loading" | "ready" | "error";
type SavedPlanLibraryEntry = SavedPlanLibrarySummary | SavedPlanReviewSummary;
type PendingDialog =
  | { type: "hide"; record: SavedPlanLibrarySummary }
  | { type: "replace"; record: SavedPlanLibrarySummary; futureWorkoutCount: number };
type AppliedReceipt = Extract<SavedPlanApplyResult, { status: "applied" }> & { planTitle: string };
type RestoredSavedPlanReview = Extract<RestoreSavedPlanReviewResult, { ok: true }>;

const DEFAULT_SORT: SavedPlanSort = { key: "createdAt", direction: "desc" };

export function SavedPlanLibraryPanel() {
  const router = useRouter();
  const listSavedPlanLibraryFn = useServerFn(listSavedPlanLibrary);
  const listSavedPlanReviewsFn = useServerFn(listSavedPlanReviews);
  const removeSavedPlanRecordFn = useServerFn(removeSavedPlanRecord);
  const restoreSavedPlanReviewFn = useServerFn(restoreSavedPlanReview);
  const startSavedPlanRecordFn = useServerFn(startSavedPlanRecord);
  const confirmRunningPlanDraftFn = useServerFn(confirmRunningPlanDraft);
  const [status, setStatus] = useState<LibraryStatus>("loading");
  const [records, setRecords] = useState<SavedPlanLibrarySummary[]>([]);
  const [generatedReviews, setGeneratedReviews] = useState<SavedPlanReviewSummary[]>([]);
  const [generatedReviewError, setGeneratedReviewError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [recordState, setRecordState] = useState<SavedPlanLibraryRecordState | "all">("available");
  const [sort, setSort] = useState<SavedPlanSort>(DEFAULT_SORT);
  const [pendingDialog, setPendingDialog] = useState<PendingDialog | null>(null);
  const [busyAction, setBusyAction] = useState<"confirm" | "hide" | "restore" | "start" | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<AppliedReceipt | null>(null);
  const [restoredReview, setRestoredReview] = useState<RestoredSavedPlanReview | null>(null);
  const [reviewConfirmResult, setReviewConfirmResult] =
    useState<RunningPlanConfirmActionResult | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const loadRecords = useCallback(async () => {
    setStatus("loading");
    setError(null);
    setGeneratedReviewError(null);
    try {
      const [libraryResult, generatedReviewResult] = await Promise.allSettled([
        listSavedPlanLibraryFn({
          data: { recordState: "all", sort: "created_at", direction: "desc" },
        }),
        listSavedPlanReviewsFn(),
      ]);

      if (libraryResult.status === "rejected") {
        throw libraryResult.reason;
      }

      setRecords(libraryResult.value.records);
      if (generatedReviewResult.status === "fulfilled") {
        setGeneratedReviews([...generatedReviewResult.value.records]);
      } else {
        setGeneratedReviews([]);
        setGeneratedReviewError(
          readableError(
            generatedReviewResult.reason,
            "Generated plans ready for review could not be loaded.",
          ),
        );
      }
      setStatus("ready");
    } catch (loadError) {
      setStatus("error");
      setError(readableError(loadError, "We could not load saved plans. Try again shortly."));
    }
  }, [listSavedPlanLibraryFn, listSavedPlanReviewsFn]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const visibleRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return [...records, ...generatedReviews]
      .filter((record) =>
        isGeneratedPlanReview(record)
          ? recordState !== "removed"
          : recordState === "all" || record.recordState === recordState,
      )
      .filter(
        (record) => !normalizedQuery || record.title.toLocaleLowerCase().includes(normalizedQuery),
      )
      .sort((left, right) => compareRecords(left, right, sort));
  }, [generatedReviews, query, recordState, records, sort]);

  const activeFilters =
    recordState === "available"
      ? []
      : [
          {
            id: "record-state",
            label: "Visibility",
            value: recordState === "removed" ? "Hidden" : "All records",
            onRemove: () => setRecordState("available"),
          },
        ];

  const refreshAfterMutation = async () => {
    try {
      await Promise.all([loadRecords(), router.invalidate({ sync: true })]);
    } catch (refreshError) {
      setStatus("error");
      setError(
        readableError(
          refreshError,
          "The action succeeded, but the latest Calendar summary could not be refreshed.",
        ),
      );
    }
  };

  const beginAction = (dialog: PendingDialog, trigger: HTMLElement | null) => {
    returnFocusRef.current = trigger;
    setActionError(null);
    setNotice(null);
    setPendingDialog(dialog);
  };

  const startPlan = async (record: SavedPlanLibrarySummary) => {
    if (busyAction) return;
    setBusyAction("start");
    setActionError(null);
    setNotice(null);
    setReceipt(null);
    try {
      const result = await startSavedPlanRecordFn({
        data: { savedPlanId: record.id, intent: "apply_if_future_empty" },
      });
      if (result.status === "replacement_required") {
        setPendingDialog({
          type: "replace",
          record,
          futureWorkoutCount: result.futureWorkoutCount,
        });
        return;
      }
      if (result.status === "not_applied") {
        throw new Error("The saved plan was not started and Calendar was not changed.");
      }
      setReceipt({ ...result, planTitle: record.title });
      setNotice(`${record.title} was started from its saved record.`);
      await refreshAfterMutation();
    } catch (startError) {
      setActionError(readableError(startError, "We could not start this saved plan."));
    } finally {
      setBusyAction(null);
    }
  };

  const replaceFutureAndStart = async () => {
    if (pendingDialog?.type !== "replace" || busyAction) return;
    const record = pendingDialog.record;
    setBusyAction("start");
    setActionError(null);
    setReceipt(null);
    try {
      const result = await startSavedPlanRecordFn({
        data: { savedPlanId: record.id, intent: "replace_future_workouts" },
      });
      if (result.status !== "applied") {
        throw new Error("The saved plan was not started and Calendar was not changed.");
      }
      setPendingDialog(null);
      setReceipt({ ...result, planTitle: record.title });
      setNotice(`${record.title} was started from its saved record.`);
      await refreshAfterMutation();
    } catch (startError) {
      setActionError(readableError(startError, "We could not replace future workouts."));
    } finally {
      setBusyAction(null);
    }
  };

  const hidePlan = async () => {
    if (pendingDialog?.type !== "hide" || busyAction) return;
    const record = pendingDialog.record;
    setBusyAction("hide");
    setActionError(null);
    try {
      await removeSavedPlanRecordFn({ data: { savedPlanId: record.id } });
      setPendingDialog(null);
      setNotice(`${record.title} is hidden from the ordinary library view.`);
      await refreshAfterMutation();
    } catch (hideError) {
      setActionError(readableError(hideError, "We could not hide this saved plan."));
    } finally {
      setBusyAction(null);
    }
  };

  const restoreGeneratedReview = async (
    record: SavedPlanReviewSummary,
    trigger: HTMLElement | null,
  ) => {
    if (busyAction) return;
    returnFocusRef.current = trigger;
    setBusyAction("restore");
    setActionError(null);
    setNotice(null);
    setReceipt(null);
    setRestoredReview(null);
    setReviewConfirmResult(null);
    try {
      const result = await restoreSavedPlanReviewFn({
        data: {
          candidateId: record.candidate.id,
          candidateVersion: record.candidate.version,
        },
      });
      if (!result.ok) {
        throw new Error(result.message);
      }
      setRestoredReview(result);
    } catch (restoreError) {
      setActionError(
        readableError(restoreError, "We could not restore this generated plan review."),
      );
    } finally {
      setBusyAction(null);
    }
  };

  const confirmGeneratedReview = async () => {
    if (restoredReview?.status !== "review_ready" || busyAction) return;
    const confirmInput = runningPlanConfirmInputSchema.parse({
      previewInput: restoredReview.review.previewInput,
      sourceKind: restoredReview.review.sourceKind,
      reviewToken: restoredReview.review.reviewToken,
      reviewChecksum: restoredReview.review.reviewChecksum,
    });

    setBusyAction("confirm");
    setActionError(null);
    setReviewConfirmResult(null);
    try {
      const result = await confirmRunningPlanDraftFn({ data: confirmInput });
      setReviewConfirmResult(result);
      if (!result.ok) {
        return;
      }
      window.location.assign("/");
    } catch (confirmError) {
      setReviewConfirmResult({
        ok: false,
        status: "blocked",
        persisted: false,
        reason: "persistence_failed",
        message: readableError(confirmError, "Calendar was not updated."),
        sourceKind: confirmInput.sourceKind,
      });
    } finally {
      setBusyAction(null);
    }
  };

  if (status === "loading" && records.length === 0) {
    return <SavedPlanLibrarySkeleton />;
  }

  if (status === "error" && records.length === 0) {
    return (
      <div className="hito-state-surface" data-tone="destructive" role="alert">
        <p className="hito-label-md text-destructive">Could not load saved plans</p>
        <p className="hito-body-md text-secondary mt-2">{error}</p>
        <div className="hito-state-actions">
          <HitoButton
            type="button"
            size="md"
            variant="secondary"
            onClick={() => void loadRecords()}
          >
            <Icon name="refresh" size="sm" />
            Try again
          </HitoButton>
        </div>
      </div>
    );
  }

  return (
    <section className="grid min-w-0 gap-6" aria-labelledby="saved-plans-title">
      <header className="grid gap-2">
        <p className="hito-label-md text-foreground">Saved plans</p>
        <h1 id="saved-plans-title" className="hito-ui-title-sm text-foreground">
          Plan library
        </h1>
        <p className="hito-body-md text-secondary max-w-3xl">
          Saved plans are immutable records. Legacy records can start ordinary future Calendar
          workouts, while generated plans reopen the required Review and Confirm step first.
        </p>
      </header>

      {notice ? (
        <div
          className="hito-state-surface py-3"
          data-tone="signal"
          role="status"
          aria-live="polite"
        >
          <p className="hito-body-md text-secondary">{notice}</p>
        </div>
      ) : null}

      {actionError && pendingDialog === null ? (
        <div className="hito-state-surface py-3" data-tone="destructive" role="alert">
          <p className="hito-body-md text-secondary">{actionError}</p>
        </div>
      ) : null}

      {status === "error" && records.length > 0 && error ? (
        <div className="hito-state-surface py-3" data-tone="destructive" role="alert">
          <p className="hito-body-md text-secondary">{error}</p>
        </div>
      ) : null}

      {generatedReviewError ? (
        <div className="hito-state-surface py-3" data-tone="destructive" role="alert">
          <p className="hito-body-md text-secondary">{generatedReviewError}</p>
        </div>
      ) : null}

      {busyAction && pendingDialog === null ? (
        <div
          className="hito-state-surface py-3"
          data-tone="signal"
          role="status"
          aria-live="polite"
        >
          <p className="hito-body-md text-secondary">
            {busyAction === "start"
              ? "Checking the future Calendar…"
              : busyAction === "hide"
                ? "Hiding saved plan…"
                : busyAction === "restore"
                  ? "Restoring generated plan review…"
                  : "Adding reviewed workouts to Calendar…"}
          </p>
        </div>
      ) : null}

      {receipt ? <SavedPlanStartReceipt receipt={receipt} /> : null}

      <div className="grid min-w-0 gap-4">
        <AdminDataTableToolbar
          activeFilters={activeFilters}
          clearAllFilters={() => setRecordState("available")}
          filterAriaSubject="library filters"
          filterButtonAriaLabel="Filter saved plans by visibility"
          filterSections={[
            {
              currentValue: recordState,
              label: "Visibility",
              onSelect: (value) => setRecordState(value as SavedPlanLibraryRecordState | "all"),
              options: [
                { value: "available", label: "Available" },
                { value: "removed", label: "Hidden" },
                { value: "all", label: "All records" },
              ],
            },
          ]}
          onQueryChange={setQuery}
          query={query}
          rowCountLabel={`${visibleRecords.length} ${visibleRecords.length === 1 ? "plan" : "plans"}`}
          searchLabel="Search saved plans by name"
          searchPlaceholder="Search plan names"
        />

        {visibleRecords.length === 0 ? (
          <SavedPlanEmptyState
            hasRecords={records.length > 0 || generatedReviews.length > 0}
            query={query}
          />
        ) : (
          <div className="hito-data-table-scroll" data-saved-plan-table-scroll>
            <table className="hito-data-table hito-data-table-min-md">
              <caption className="sr-only">
                Saved plan library with factual summaries and selected-record actions.
              </caption>
              <thead>
                <tr>
                  <AdminDataTableColumnHeader
                    activeSort={sort}
                    column="title"
                    filterActive={false}
                    label="Plan"
                    menuLabel="Sort saved plans by name"
                    onSort={(key, direction) => setSort({ key, direction })}
                    sortOptions={[{ key: "title", direction: "asc", label: "Name A to Z" }]}
                  />
                  <AdminDataTableColumnHeader
                    activeSort={sort}
                    column="createdAt"
                    filterActive={false}
                    label="Created"
                    menuLabel="Sort saved plans by created date"
                    onSort={(key, direction) => setSort({ key, direction })}
                    sortOptions={[
                      { key: "createdAt", direction: "desc", label: "Newest first" },
                      { key: "createdAt", direction: "asc", label: "Oldest first" },
                    ]}
                  />
                  <AdminDataTableStaticHeader label="Schedule" />
                  <AdminDataTableColumnHeader
                    activeSort={sort}
                    column="workoutCount"
                    filterActive={false}
                    label="Workouts"
                    menuLabel="Sort saved plans by workout count"
                    onSort={(key, direction) => setSort({ key, direction })}
                    sortOptions={[
                      { key: "workoutCount", direction: "desc", label: "Most workouts first" },
                    ]}
                  />
                  <AdminDataTableStaticHeader label="State" />
                  <AdminDataTableStaticHeader label="Actions" />
                </tr>
              </thead>
              <tbody>
                {visibleRecords.map((record) => (
                  <SavedPlanLibraryRow
                    key={savedPlanLibraryEntryKey(record)}
                    record={record}
                    busy={busyAction !== null}
                    onHide={(legacyRecord, trigger) =>
                      beginAction({ type: "hide", record: legacyRecord }, trigger)
                    }
                    onRestore={(generatedRecord, trigger) =>
                      void restoreGeneratedReview(generatedRecord, trigger)
                    }
                    onStart={(legacyRecord, trigger) => {
                      returnFocusRef.current = trigger;
                      void startPlan(legacyRecord);
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SavedPlanActionDialog
        dialog={pendingDialog}
        error={actionError}
        pending={busyAction !== null}
        returnFocusRef={returnFocusRef}
        onOpenChange={(open) => {
          if (!open && busyAction === null) {
            if (pendingDialog?.type === "replace") {
              setNotice("Start was canceled. Calendar was not changed.");
            }
            setPendingDialog(null);
            setActionError(null);
          }
        }}
        onConfirm={() => {
          if (pendingDialog?.type === "hide") void hidePlan();
          if (pendingDialog?.type === "replace") void replaceFutureAndStart();
        }}
      />

      <SelectedRunningPlanPreviewDialog
        open={restoredReview !== null}
        onOpenChange={(open) => {
          if (!open && busyAction !== "confirm") {
            setRestoredReview(null);
            setReviewConfirmResult(null);
            setActionError(null);
          }
        }}
        confirmResult={reviewConfirmResult}
        createStatus={busyAction === "confirm" ? "creating" : "idle"}
        result={restoredReview}
        status="idle"
        error={null}
        goalLabel={restoredReview?.summary.goal.distanceLabel ?? "Generated"}
        onCancel={() => {
          setRestoredReview(null);
          setReviewConfirmResult(null);
        }}
        onRefresh={() => undefined}
        onCreate={() => void confirmGeneratedReview()}
        description="Review the restored saved plan before adding its workouts to Calendar."
        extraNotice={
          restoredReview ? <SavedPlanReviewValidityNotice review={restoredReview} /> : null
        }
        returnFocusRef={returnFocusRef}
      />
    </section>
  );
}

function SavedPlanLibraryRow({
  record,
  busy,
  onHide,
  onRestore,
  onStart,
}: {
  record: SavedPlanLibraryEntry;
  busy: boolean;
  onHide: (record: SavedPlanLibrarySummary, trigger: HTMLElement | null) => void;
  onRestore: (record: SavedPlanReviewSummary, trigger: HTMLElement | null) => void;
  onStart: (record: SavedPlanLibrarySummary, trigger: HTMLElement | null) => void;
}) {
  return isGeneratedPlanReview(record) ? (
    <GeneratedPlanReviewRow record={record} busy={busy} onRestore={onRestore} />
  ) : (
    <LegacySavedPlanRow record={record} busy={busy} onHide={onHide} onStart={onStart} />
  );
}

function LegacySavedPlanRow({
  record,
  busy,
  onHide,
  onStart,
}: {
  record: SavedPlanLibrarySummary;
  busy: boolean;
  onHide: (record: SavedPlanLibrarySummary, trigger: HTMLElement | null) => void;
  onStart: (record: SavedPlanLibrarySummary, trigger: HTMLElement | null) => void;
}) {
  const exportHref = `/api/plan/export?savedPlanId=${encodeURIComponent(record.id)}&format=json`;
  const actionTriggerRef = useRef<HTMLButtonElement | null>(null);
  return (
    <tr
      className="align-top"
      data-saved-plan-id={record.id}
      data-saved-plan-record-state={record.recordState}
    >
      <td className="hito-data-table-cell hito-data-table-cell-start">
        <div className="grid max-w-xs gap-1">
          <p className="hito-body-md text-foreground break-words">{record.title}</p>
          <p className="hito-body-xs text-tertiary line-clamp-2">{record.goalSummary}</p>
        </div>
      </td>
      <td className="hito-data-table-cell whitespace-nowrap">
        {formatDate(record.createdAt.slice(0, 10), {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </td>
      <td className="hito-data-table-cell whitespace-nowrap">
        {formatDate(record.startDate)} – {formatDate(record.endDate)}
      </td>
      <td className="hito-data-table-cell tabular-nums">{record.workoutCount}</td>
      <td className="hito-data-table-cell">
        <HitoMetadataTag tone={record.recordState === "available" ? "success" : "muted"}>
          {record.recordState === "available" ? "Available" : "Hidden"}
        </HitoMetadataTag>
      </td>
      <td className="hito-data-table-cell hito-data-table-cell-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <HitoButton
              ref={actionTriggerRef}
              type="button"
              aria-label={`Open actions for ${record.title}`}
              disabled={busy}
              iconOnly
              size="sm"
              variant="ghost"
            >
              <Icon name="more-horizontal" size="sm" />
            </HitoButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="hito-menu-width-standard">
            <DropdownMenuLabel>{record.title}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href={exportHref} download data-saved-plan-download={record.id}>
                <Icon name="download" size="xs" />
                Download JSON
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onStart(record, actionTriggerRef.current)}>
              <Icon name="calendar-clock" size="xs" />
              Start plan
            </DropdownMenuItem>
            {record.recordState === "available" ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => onHide(record, actionTriggerRef.current)}>
                  <Icon name="visibility-off" size="xs" />
                  Hide from library
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

function GeneratedPlanReviewRow({
  record,
  busy,
  onRestore,
}: {
  record: SavedPlanReviewSummary;
  busy: boolean;
  onRestore: (record: SavedPlanReviewSummary, trigger: HTMLElement | null) => void;
}) {
  const restoreButtonRef = useRef<HTMLButtonElement | null>(null);
  const state = savedPlanReviewState(record);

  return (
    <tr
      className="align-top"
      data-saved-plan-review-id={record.candidate.id}
      data-saved-plan-review-validity={record.validity.state}
    >
      <td className="hito-data-table-cell hito-data-table-cell-start">
        <div className="grid max-w-xs gap-1">
          <p className="hito-body-md text-foreground break-words">{record.title}</p>
          <p className="hito-body-xs text-tertiary line-clamp-2">
            {savedPlanReviewGoalSummary(record)}
          </p>
        </div>
      </td>
      <td className="hito-data-table-cell whitespace-nowrap">
        {formatDate(record.createdAt.slice(0, 10), {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </td>
      <td className="hito-data-table-cell whitespace-nowrap">
        {formatDate(record.schedule.startDate)} – {formatDate(record.schedule.endDate)}
      </td>
      <td className="hito-data-table-cell text-secondary">Review</td>
      <td className="hito-data-table-cell">
        <HitoMetadataTag tone={state.tone} tooltip={state.description}>
          {state.label}
        </HitoMetadataTag>
      </td>
      <td className="hito-data-table-cell hito-data-table-cell-end">
        <HitoButton
          ref={restoreButtonRef}
          type="button"
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => onRestore(record, restoreButtonRef.current)}
        >
          <Icon name="refresh" size="xs" />
          Restore plan
        </HitoButton>
      </td>
    </tr>
  );
}

function SavedPlanReviewValidityNotice({ review }: { review: RestoredSavedPlanReview }) {
  const state = savedPlanReviewState(review.summary);
  return (
    <div
      className="hito-surface-wash"
      data-tone={review.status === "review_ready" ? "success" : "warning"}
      role="status"
    >
      <p className="hito-body-md text-foreground">{state.noticeTitle}</p>
      <p className="hito-body-sm mt-1 text-secondary">{state.description}</p>
    </div>
  );
}

function savedPlanReviewState(record: SavedPlanReviewSummary): {
  label: "Current" | "Expired" | "Stale";
  noticeTitle: string;
  description: string;
  tone: "muted" | "success" | "warning";
} {
  if (record.validity.state === "current") {
    return {
      label: "Current",
      noticeTitle: "Fresh review ready",
      description:
        "Hito rebuilt this review from the saved candidate and current runner facts. Confirming is still required before Calendar changes.",
      tone: "success",
    };
  }

  if (record.validity.state === "expired") {
    return {
      label: "Expired",
      noticeTitle: "Previously confirmed review",
      description:
        "This saved review has already been confirmed. It remains available for reference, but it cannot be confirmed again.",
      tone: "muted",
    };
  }

  const reasonCopy =
    record.validity.reason === "facts_changed"
      ? "Runner facts have changed since this plan was prepared."
      : record.validity.reason === "invalid_lineage"
        ? "The saved candidate lineage is no longer valid for confirmation."
        : "The saved candidate no longer passes the current plan contract.";
  return {
    label: "Stale",
    noticeTitle: "Read-only saved review",
    description: `${reasonCopy} Review remains available, but Confirm is disabled.`,
    tone: "warning",
  };
}

function savedPlanReviewGoalSummary(record: SavedPlanReviewSummary) {
  const details = [record.goal.distanceLabel];
  if (record.goal.targetDate) {
    details.push(`target ${formatDate(record.goal.targetDate)}`);
  }
  if (record.goal.targetFinishTime) {
    details.push(`finish ${record.goal.targetFinishTime}`);
  }
  return details.join(" · ");
}

function SavedPlanActionDialog({
  dialog,
  error,
  pending,
  returnFocusRef,
  onOpenChange,
  onConfirm,
}: {
  dialog: PendingDialog | null;
  error: string | null;
  pending: boolean;
  returnFocusRef: RefObject<HTMLElement | null>;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const isReplacement = dialog?.type === "replace";
  return (
    <Dialog open={dialog !== null} onOpenChange={onOpenChange}>
      <DialogContent
        className="hito-dialog-stable hito-product-dialog hito-dialog-surface-product max-w-lg"
        showCloseButton={!pending}
        onEscapeKeyDown={(event) => {
          if (pending) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (pending) event.preventDefault();
        }}
        onCloseAutoFocus={(event) => {
          const target = returnFocusRef.current;
          if (!target?.isConnected) return;
          event.preventDefault();
          target.focus();
        }}
      >
        <DialogHeader className="hito-product-dialog-header">
          <DialogTitle className="hito-ui-title-md text-foreground">
            {isReplacement ? "Replace future workouts?" : "Hide this saved plan?"}
          </DialogTitle>
          <DialogDescription>{dialog?.record.title ?? "Saved plan"}</DialogDescription>
        </DialogHeader>
        <div className="hito-product-dialog-body">
          <p className="hito-body-md text-secondary">
            {isReplacement
              ? `${dialog.futureWorkoutCount} future ${dialog.futureWorkoutCount === 1 ? "workout" : "workouts"} already exist. Only a positive replacement will start this plan; past and protected history are not replaceable here.`
              : "This hides only the immutable library record from the ordinary view. Calendar workouts and history remain unchanged."}
          </p>
          {error ? (
            <div className="hito-state-surface mt-4 py-3" data-tone="destructive" role="alert">
              <p className="hito-body-md text-secondary">{error}</p>
            </div>
          ) : null}
        </div>
        <DialogFooter className="hito-product-dialog-footer">
          <HitoButton
            type="button"
            size="md"
            variant="secondary"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </HitoButton>
          <HitoButton
            type="button"
            size="md"
            tone={isReplacement ? "error" : "default"}
            variant="primary"
            loading={pending}
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? <Icon name="loader" size="sm" /> : null}
            {isReplacement ? "Replace future workouts" : "Hide plan"}
          </HitoButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SavedPlanStartReceipt({ receipt }: { receipt: AppliedReceipt }) {
  return (
    <section className="hito-state-surface" data-tone="signal" aria-labelledby="plan-start-receipt">
      <p className="hito-label-md text-foreground">Plan started</p>
      <h2 id="plan-start-receipt" className="hito-ui-title-sm text-foreground mt-2">
        {receipt.planTitle}
      </h2>
      <p className="hito-body-md text-secondary mt-2">
        Starts {formatDate(receipt.resolvedStartDate)} with {receipt.workoutCount} non-Rest workouts
        across {receipt.calendarRowCount} Calendar days.
      </p>
      <ul className="mt-3 grid gap-1 text-sm text-text-secondary">
        {receipt.omittedLeadingDayCount > 0 ? (
          <li>
            {receipt.omittedLeadingDayCount} leading source days were omitted by schedule alignment.
          </li>
        ) : null}
        {receipt.replacedFutureWorkoutCount > 0 ? (
          <li>{receipt.replacedFutureWorkoutCount} eligible future workouts were replaced.</li>
        ) : (
          <li>No existing future workouts needed replacement.</li>
        )}
        <li>
          The saved record stayed unchanged; the new Calendar workouts are independently editable.
        </li>
      </ul>
    </section>
  );
}

function SavedPlanEmptyState({ hasRecords, query }: { hasRecords: boolean; query: string }) {
  return (
    <div className="hito-state-surface">
      <p className="hito-label-md text-foreground">
        {hasRecords ? "No matching plans" : "No saved plans"}
      </p>
      <h2 className="hito-ui-title-sm text-foreground mt-2">
        {hasRecords ? "No plans match this library view." : "Your saved plan library is empty."}
      </h2>
      <p className="hito-body-md text-secondary mt-2">
        {query.trim()
          ? "Clear the name search or change the visibility filter."
          : hasRecords
            ? "Change the visibility filter to review other saved records."
            : "Successfully saved running plans will appear here as immutable records."}
      </p>
    </div>
  );
}

function SavedPlanLibrarySkeleton() {
  return (
    <div className="grid gap-4" aria-busy="true" aria-label="Loading saved plans">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-full max-w-sm" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

function compareRecords(
  left: SavedPlanLibraryEntry,
  right: SavedPlanLibraryEntry,
  sort: SavedPlanSort,
) {
  const comparison =
    sort.key === "title"
      ? left.title.localeCompare(right.title) || left.createdAt.localeCompare(right.createdAt)
      : sort.key === "workoutCount"
        ? compareWorkoutCounts(left, right) || left.title.localeCompare(right.title)
        : left.createdAt.localeCompare(right.createdAt) || left.title.localeCompare(right.title);
  return sort.direction === "asc" ? comparison : -comparison;
}

function compareWorkoutCounts(left: SavedPlanLibraryEntry, right: SavedPlanLibraryEntry) {
  if (isGeneratedPlanReview(left) && isGeneratedPlanReview(right)) return 0;
  if (isGeneratedPlanReview(left)) return 1;
  if (isGeneratedPlanReview(right)) return -1;
  return left.workoutCount - right.workoutCount;
}

function isGeneratedPlanReview(record: SavedPlanLibraryEntry): record is SavedPlanReviewSummary {
  return "kind" in record && record.kind === "generated_review";
}

function savedPlanLibraryEntryKey(record: SavedPlanLibraryEntry) {
  return isGeneratedPlanReview(record)
    ? `generated-review:${record.candidate.id}:${record.candidate.version}`
    : `saved-plan:${record.id}`;
}

function readableError(error: unknown, fallback: string) {
  return error instanceof Error && error.message.trim() ? error.message : fallback;
}
