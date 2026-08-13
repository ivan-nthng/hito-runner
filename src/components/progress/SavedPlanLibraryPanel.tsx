import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  AdminDataTableColumnHeader,
  AdminDataTableStaticHeader,
  AdminDataTableToolbar,
} from "@/components/admin/AdminOperationalComponents";
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
import { formatDate } from "@/lib/training";

type SavedPlanSortKey = "createdAt" | "title" | "workoutCount";
type SavedPlanSort = { key: SavedPlanSortKey; direction: "asc" | "desc" };
type LibraryStatus = "loading" | "ready" | "error";
type PendingDialog =
  | { type: "hide"; record: SavedPlanLibrarySummary }
  | { type: "replace"; record: SavedPlanLibrarySummary; futureWorkoutCount: number };
type AppliedReceipt = Extract<SavedPlanApplyResult, { status: "applied" }> & { planTitle: string };

const DEFAULT_SORT: SavedPlanSort = { key: "createdAt", direction: "desc" };

export function SavedPlanLibraryPanel() {
  const router = useRouter();
  const listSavedPlanLibraryFn = useServerFn(listSavedPlanLibrary);
  const removeSavedPlanRecordFn = useServerFn(removeSavedPlanRecord);
  const startSavedPlanRecordFn = useServerFn(startSavedPlanRecord);
  const [status, setStatus] = useState<LibraryStatus>("loading");
  const [records, setRecords] = useState<SavedPlanLibrarySummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [recordState, setRecordState] = useState<SavedPlanLibraryRecordState | "all">("available");
  const [sort, setSort] = useState<SavedPlanSort>(DEFAULT_SORT);
  const [pendingDialog, setPendingDialog] = useState<PendingDialog | null>(null);
  const [busyAction, setBusyAction] = useState<"hide" | "start" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<AppliedReceipt | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const loadRecords = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const result = await listSavedPlanLibraryFn({
        data: { recordState: "all", sort: "created_at", direction: "desc" },
      });
      setRecords(result.records);
      setStatus("ready");
    } catch (loadError) {
      setStatus("error");
      setError(readableError(loadError, "We could not load saved plans. Try again shortly."));
    }
  }, [listSavedPlanLibraryFn]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const visibleRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return records
      .filter((record) => recordState === "all" || record.recordState === recordState)
      .filter(
        (record) => !normalizedQuery || record.title.toLocaleLowerCase().includes(normalizedQuery),
      )
      .sort((left, right) => compareRecords(left, right, sort));
  }, [query, recordState, records, sort]);

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
          Saved plans are immutable records. Starting one creates ordinary future Calendar workouts
          without giving the record authority over your Calendar or protected history.
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

      {busyAction && pendingDialog === null ? (
        <div
          className="hito-state-surface py-3"
          data-tone="signal"
          role="status"
          aria-live="polite"
        >
          <p className="hito-body-md text-secondary">
            {busyAction === "start" ? "Checking the future Calendar…" : "Hiding saved plan…"}
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
          <SavedPlanEmptyState hasRecords={records.length > 0} query={query} />
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
                  <SavedPlanRow
                    key={record.id}
                    record={record}
                    busy={busyAction !== null}
                    onHide={(trigger) => beginAction({ type: "hide", record }, trigger)}
                    onStart={(trigger) => {
                      returnFocusRef.current = trigger;
                      void startPlan(record);
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
    </section>
  );
}

function SavedPlanRow({
  record,
  busy,
  onHide,
  onStart,
}: {
  record: SavedPlanLibrarySummary;
  busy: boolean;
  onHide: (trigger: HTMLElement | null) => void;
  onStart: (trigger: HTMLElement | null) => void;
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
            <DropdownMenuItem onSelect={() => onStart(actionTriggerRef.current)}>
              <Icon name="calendar-clock" size="xs" />
              Start plan
            </DropdownMenuItem>
            {record.recordState === "available" ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => onHide(actionTriggerRef.current)}>
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
      <ul className="mt-3 grid gap-1 text-sm text-foreground/85">
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
  left: SavedPlanLibrarySummary,
  right: SavedPlanLibrarySummary,
  sort: SavedPlanSort,
) {
  const comparison =
    sort.key === "title"
      ? left.title.localeCompare(right.title) || left.createdAt.localeCompare(right.createdAt)
      : sort.key === "workoutCount"
        ? left.workoutCount - right.workoutCount || left.title.localeCompare(right.title)
        : left.createdAt.localeCompare(right.createdAt) || left.title.localeCompare(right.title);
  return sort.direction === "asc" ? comparison : -comparison;
}

function readableError(error: unknown, fallback: string) {
  return error instanceof Error && error.message.trim() ? error.message : fallback;
}
