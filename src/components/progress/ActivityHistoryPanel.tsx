import { useRef, type RefObject } from "react";
import { Link } from "@tanstack/react-router";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import type { RunnerActivityHistoryProductItem } from "@/lib/runner-activity/product-contract";
import { cn } from "@/lib/utils";
import type {
  ActivityAction,
  HistoryState,
  PendingActivityAction,
} from "./runner-activity-progress-types";
import {
  activityDateRail,
  activityDisclosureLabel,
  activityDisplayDate,
  activityPrimaryFacts,
  activitySupportingFacts,
  formatStartedTime,
} from "./runner-activity-progress-view-model";

export function ActivityHistoryPanel({
  state,
  onRetry,
  onLoadMore,
  onOpenActivity,
  onRequestAction,
}: {
  state: HistoryState;
  onRetry: () => void;
  onLoadMore: () => void;
  onOpenActivity: (activity: RunnerActivityHistoryProductItem, trigger: HTMLElement) => void;
  onRequestAction: (
    action: ActivityAction,
    activity: RunnerActivityHistoryProductItem,
    trigger?: HTMLElement,
  ) => void;
}) {
  return (
    <section aria-labelledby="activity-history-title">
      <header className="hito-page-header">
        <p className="hito-label">Recorded running</p>
        <h1 id="activity-history-title" className="hito-ui-page-title" tabIndex={-1}>
          Activity history
        </h1>
        <p className="hito-page-copy">Your recorded runs, whether or not they matched a plan.</p>
      </header>

      {state.status === "loading" && !state.data ? <HistorySkeleton /> : null}
      {state.status === "error" && !state.data ? (
        <HistoryError message={state.error} onRetry={onRetry} />
      ) : null}
      {state.data?.items.length === 0 ? <HistoryEmptyState /> : null}
      {state.data && state.data.items.length > 0 ? (
        <>
          {state.status === "error" ? (
            <div className="mb-4" role="alert">
              <HistoryError message={state.error} onRetry={onRetry} compact />
            </div>
          ) : null}
          <ul className="hito-row-group" aria-label="Recorded running activities">
            {state.data.items.map((activity) => (
              <ActivityHistoryRow
                key={activity.id}
                activity={activity}
                onOpenActivity={onOpenActivity}
                onRequestAction={onRequestAction}
              />
            ))}
          </ul>
          {state.data.nextCursor ? (
            <div className="mt-6 flex justify-center">
              <HitoButton
                type="button"
                size="md"
                variant="secondary"
                loading={state.loadingMore}
                disabled={state.loadingMore}
                onClick={onLoadMore}
              >
                {state.loadingMore ? <Icon name="loader" size="sm" /> : null}
                {state.loadingMore ? "Loading…" : "Load more"}
              </HitoButton>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

function ActivityHistoryRow({
  activity,
  onOpenActivity,
  onRequestAction,
}: {
  activity: RunnerActivityHistoryProductItem;
  onOpenActivity: (activity: RunnerActivityHistoryProductItem, trigger: HTMLElement) => void;
  onRequestAction: (
    action: ActivityAction,
    activity: RunnerActivityHistoryProductItem,
    trigger?: HTMLElement,
  ) => void;
}) {
  const primaryButtonRef = useRef<HTMLButtonElement | null>(null);
  const dateRail = activityDateRail(activity);
  const primaryFacts = activityPrimaryFacts(activity);
  const supportingFacts = activitySupportingFacts(activity);
  const localDate = activity.historicalTime.localDate;
  const sourceRemovalNeedsRetry = activity.source.rawState === "removal_pending";

  return (
    <li className="hito-list-row min-w-0 !items-stretch !gap-0 !p-0">
      <button
        ref={primaryButtonRef}
        type="button"
        className="grid min-w-0 flex-1 grid-cols-[3.25rem_minmax(0,1fr)] gap-3 px-4 py-4 text-left outline-none transition-colors hover:bg-foreground/[0.035] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-signal sm:grid-cols-[4rem_minmax(0,1fr)_minmax(11rem,auto)] sm:items-center sm:gap-4"
        aria-label={activityDisclosureLabel(activity)}
        onClick={(event) => onOpenActivity(activity, event.currentTarget)}
      >
        <time dateTime={localDate ?? undefined} className="text-center tabular-nums">
          <span className="block font-sans text-2xl leading-none">{dateRail.day}</span>
          <span className="hito-caption mt-1 block">{dateRail.month}</span>
        </time>
        <span className="min-w-0">
          <span className="hito-list-row-title line-clamp-2 sm:line-clamp-1">
            {activity.identity.label}
          </span>
          <span className="hito-list-row-copy mt-1 block">
            {activity.plannedWorkout ? activity.plannedWorkout.title : "Unplanned run"}
          </span>
          {primaryFacts.length > 0 ? (
            <span className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm tabular-nums sm:hidden">
              {primaryFacts.map((fact) => (
                <span key={fact}>{fact}</span>
              ))}
            </span>
          ) : null}
          {supportingFacts.length > 0 ? (
            <span className="hito-caption mt-2 flex flex-wrap gap-x-3 gap-y-1 sm:hidden">
              {supportingFacts.map((fact) => (
                <span key={fact}>{fact}</span>
              ))}
            </span>
          ) : null}
        </span>
        <span className="hidden min-w-0 text-right sm:block">
          {primaryFacts.length > 0 ? (
            <span className="flex flex-wrap justify-end gap-x-3 gap-y-1 text-sm tabular-nums">
              {primaryFacts.map((fact) => (
                <span key={fact}>{fact}</span>
              ))}
            </span>
          ) : null}
          {supportingFacts.length > 0 ? (
            <span className="hito-caption mt-2 hidden flex-wrap justify-end gap-x-3 gap-y-1 sm:flex">
              {supportingFacts.map((fact) => (
                <span key={fact}>{fact}</span>
              ))}
            </span>
          ) : null}
        </span>
      </button>
      <div className="flex shrink-0 items-start px-2 py-3 sm:items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <HitoButton
              type="button"
              aria-label={`Actions for ${activityDisplayDate(activity)} ${activity.identity.label}`}
              className="h-11 w-11"
              iconOnly
              size="sm"
              variant="ghost"
            >
              <Icon name="more-horizontal" size="sm" />
            </HitoButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={() => {
                if (primaryButtonRef.current) onOpenActivity(activity, primaryButtonRef.current);
              }}
            >
              <Icon name="visibility" size="sm" />
              View details
            </DropdownMenuItem>
            {activity.capabilities.canRemoveOriginalFile ? (
              <DropdownMenuItem
                data-tone="destructive"
                onSelect={() =>
                  onRequestAction("remove-source", activity, primaryButtonRef.current ?? undefined)
                }
              >
                <Icon name="file-text" size="sm" />
                {sourceRemovalNeedsRetry ? "Retry file removal" : "Remove original file"}
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              data-tone="destructive"
              onSelect={() =>
                onRequestAction("delete", activity, primaryButtonRef.current ?? undefined)
              }
            >
              <Icon name="trash" size="sm" />
              Delete activity
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}

export function ActivityDetailOverlay({
  activity,
  returnFocusRef,
  onOpenChange,
  onRequestAction,
}: {
  activity: RunnerActivityHistoryProductItem | null;
  returnFocusRef: RefObject<HTMLElement | null>;
  onOpenChange: (open: boolean) => void;
  onRequestAction: (
    action: ActivityAction,
    activity: RunnerActivityHistoryProductItem,
    trigger?: HTMLElement,
  ) => void;
}) {
  const isMobile = useIsMobile();
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const content = activity ? (
    <ActivityDetailContent activity={activity} onRequestAction={onRequestAction} />
  ) : null;
  const focusHeading = (event: Event) => {
    event.preventDefault();
    headingRef.current?.focus();
  };
  const returnFocus = (event: Event) => {
    const target = returnFocusRef.current;
    if (!target?.isConnected) return;
    event.preventDefault();
    target.focus();
  };

  if (isMobile) {
    return (
      <Sheet open={activity !== null} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="inset-0 flex h-[100dvh] max-h-[100dvh] w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 p-0 sm:max-w-none"
          onOpenAutoFocus={focusHeading}
          onCloseAutoFocus={returnFocus}
        >
          <SheetHeader className="border-b border-hairline px-5 py-4 pr-14">
            <SheetTitle ref={headingRef} tabIndex={-1}>
              {activity?.identity.label ?? "Activity"}
            </SheetTitle>
            <SheetDescription>Recorded activity facts and source controls.</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5">
            {content}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={activity !== null} onOpenChange={onOpenChange}>
      <DialogContent
        className="hito-dialog-stable hito-product-dialog hito-dialog-surface-product grid max-h-[min(44rem,calc(100dvh-2rem))] max-w-2xl grid-rows-[auto_minmax(0,1fr)] overflow-hidden p-0"
        onOpenAutoFocus={focusHeading}
        onCloseAutoFocus={returnFocus}
      >
        <DialogHeader className="hito-product-dialog-header">
          <DialogTitle ref={headingRef} className="hito-ui-modal-title" tabIndex={-1}>
            {activity?.identity.label ?? "Activity"}
          </DialogTitle>
          <DialogDescription>Recorded activity facts and source controls.</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 overflow-y-auto px-6 pb-6">{content}</div>
      </DialogContent>
    </Dialog>
  );
}

function ActivityDetailContent({
  activity,
  onRequestAction,
}: {
  activity: RunnerActivityHistoryProductItem;
  onRequestAction: (
    action: ActivityAction,
    activity: RunnerActivityHistoryProductItem,
    trigger?: HTMLElement,
  ) => void;
}) {
  const primaryFacts = activityPrimaryFacts(activity);
  const supportingFacts = activitySupportingFacts(activity);
  const startedTime = formatStartedTime(activity);
  const sourceRemovalNeedsRetry = activity.source.rawState === "removal_pending";

  return (
    <div className="space-y-7">
      <section>
        <p className="hito-label">Activity</p>
        <h2 className="hito-ui-section-title mt-2">{activityDisplayDate(activity)}</h2>
        {startedTime ? <p className="hito-caption mt-1">Started {startedTime}</p> : null}
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm tabular-nums">
          {[...primaryFacts, ...supportingFacts].map((fact) => (
            <span key={fact}>{fact}</span>
          ))}
        </div>
      </section>

      <section className="border-t border-hairline pt-5">
        <p className="hito-label">Plan relationship</p>
        {activity.plannedWorkout ? (
          <div className="mt-2">
            <Link
              to="/workout/$date"
              params={{ date: activity.plannedWorkout.workoutDate }}
              search={{ tab: "overview" } as never}
              className="hito-list-row-title underline-offset-4 hover:underline"
            >
              {activity.plannedWorkout.title}
            </Link>
            <p className="hito-caption mt-1">
              Open the workout for its exact Plan vs run comparison.
            </p>
          </div>
        ) : (
          <p className="hito-body mt-2">Unplanned run</p>
        )}
      </section>

      <section className="border-t border-hairline pt-5">
        <p className="hito-label">Source</p>
        <p className="hito-list-row-title mt-2">Garmin file</p>
        <p className="hito-body mt-2">
          {activity.source.rawState === "removed"
            ? "Original file removed. Normalized activity facts remain in history and progress, but Hito cannot reprocess the source."
            : activity.source.rawState === "removal_pending"
              ? "The previous removal did not finish. Try removing the original file again."
              : "The original file is retained and can be reprocessed."}
        </p>
        {activity.quality.updating ? (
          <span className="hito-status-pill mt-3" data-tone="signal">
            Updating
          </span>
        ) : null}
      </section>

      <section className="border-t border-hairline pt-5">
        <p className="hito-label">Privacy and deletion</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {activity.capabilities.canRemoveOriginalFile ? (
            <HitoButton
              type="button"
              size="md"
              tone="error"
              variant="secondary"
              onClick={(event) => onRequestAction("remove-source", activity, event.currentTarget)}
            >
              <Icon name="file-text" size="sm" />
              {sourceRemovalNeedsRetry ? "Retry file removal" : "Remove original file"}
            </HitoButton>
          ) : null}
          <HitoButton
            type="button"
            size="md"
            tone="error"
            variant="secondary"
            onClick={(event) => onRequestAction("delete", activity, event.currentTarget)}
          >
            <Icon name="trash" size="sm" />
            Delete activity
          </HitoButton>
        </div>
      </section>
    </div>
  );
}

export function ActivityActionConfirmation({
  pendingAction,
  pending,
  error,
  returnFocusRef,
  onOpenChange,
  onConfirm,
}: {
  pendingAction: PendingActivityAction | null;
  pending: boolean;
  error: string | null;
  returnFocusRef: RefObject<HTMLElement | null>;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const removesSource = pendingAction?.action === "remove-source";
  const retriesSourceRemoval =
    removesSource && pendingAction?.activity.source.rawState === "removal_pending";
  return (
    <Dialog open={pendingAction !== null} onOpenChange={onOpenChange}>
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
          <DialogTitle className="hito-ui-modal-title">
            {retriesSourceRemoval
              ? "Retry original file removal?"
              : removesSource
                ? "Remove original file?"
                : "Delete activity from history?"}
          </DialogTitle>
          <DialogDescription>
            {pendingAction
              ? `${activityDisplayDate(pendingAction.activity)} ${pendingAction.activity.identity.label}`
              : "Activity"}
          </DialogDescription>
        </DialogHeader>
        <div className="hito-product-dialog-body">
          <p className="hito-body">
            {removesSource
              ? retriesSourceRemoval
                ? "The previous removal did not finish. Retrying removes the original file while keeping the normalized activity in history and progress."
                : "The normalized activity stays in history and continues to contribute to progress, but Hito can no longer reprocess the original file."
              : "This removes the recorded activity, its observed evidence, comparisons, and profile contribution. A separate manually reported completion may remain."}
          </p>
          {error ? (
            <div className="hito-state-surface mt-4 py-3" data-tone="destructive" role="alert">
              <p className="hito-body">{error}</p>
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
            tone="error"
            variant="primary"
            loading={pending}
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? <Icon name="loader" size="sm" /> : <Icon name="trash" size="sm" />}
            {pending
              ? removesSource
                ? "Removing…"
                : "Deleting…"
              : removesSource
                ? retriesSourceRemoval
                  ? "Retry removal"
                  : "Remove file"
                : "Delete activity"}
          </HitoButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HistorySkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading activity history">
      <div className="hito-row-group" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="hito-list-row">
            <Skeleton className="h-12 w-12" />
            <div className="flex-1">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="mt-3 h-3 w-56 max-w-full" />
            </div>
            <Skeleton className="h-10 w-24" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading recorded activities.</span>
    </div>
  );
}

function HistoryEmptyState() {
  return (
    <div className="hito-state-surface">
      <p className="hito-label">No recorded activities</p>
      <h2 className="hito-ui-section-title mt-2">Your running history will appear here.</h2>
      <p className="hito-body mt-2">Record a run from its workout when you are ready.</p>
      <div className="hito-state-actions">
        <HitoButton asChild size="md" variant="primary">
          <Link to="/">Open Calendar</Link>
        </HitoButton>
      </div>
    </div>
  );
}

function HistoryError({
  message,
  onRetry,
  compact = false,
}: {
  message: string;
  onRetry: () => void;
  compact?: boolean;
}) {
  return (
    <div
      className={cn("hito-state-surface", compact && "py-3")}
      data-tone="destructive"
      role="alert"
    >
      <p className="hito-label text-destructive">Could not load activity history</p>
      <p className="hito-body mt-2">{message}</p>
      <div className="hito-state-actions">
        <HitoButton type="button" size="md" variant="secondary" onClick={onRetry}>
          <Icon name="refresh" size="sm" />
          Try again
        </HitoButton>
      </div>
    </div>
  );
}
