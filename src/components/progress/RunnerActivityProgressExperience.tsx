import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { useHitoProductMessage, useHitoUiLocale } from "@/components/ui/hito-ui-locale-provider";
import { useHitoTabs } from "@/components/ui/hito-tabs";
import type { HitoProductApiFailure } from "@/lib/product-api-error-contract";
import type {
  RunnerActivityHistoryProductItem,
  RunnerActivityHistoryProductPage,
  RunnerActivityMutationProductReadback,
  RunnerActivityProgressProductModel,
} from "@/lib/runner-activity/product-contract";
import type { ResolvedUiLocale } from "@/lib/ui-locale";
import { getHitoProductApiFailureMessage } from "@/lib/ui-locale-messages";
import {
  ActivityActionConfirmation,
  ActivityDetailOverlay,
  ActivityHistoryPanel,
} from "./ActivityHistoryPanel";
import { FactualProgressPanel } from "./FactualProgressPanel";
import { SavedPlanLibraryPanel } from "./SavedPlanLibraryPanel";
import type {
  ActivityAction,
  HistoryState,
  PendingActivityAction,
  ProgressSequenceSelection,
  ProgressState,
} from "./runner-activity-progress-types";

export type RunnerProgressTab = "history" | "progress" | "plans";

const PROGRESS_TABS = [
  { value: "history" },
  { value: "progress" },
  { value: "plans" },
] satisfies Array<{
  value: RunnerProgressTab;
}>;

export function RunnerActivityProgressExperience({
  activeTab,
  onTabChange,
  onSequenceSelectionChange,
  sequenceSelection,
}: {
  activeTab: RunnerProgressTab;
  onTabChange: (tab: RunnerProgressTab) => void;
  onSequenceSelectionChange: (selection: ProgressSequenceSelection) => void;
  sequenceSelection: ProgressSequenceSelection;
}) {
  const locale = useHitoUiLocale();
  const message = useHitoProductMessage();
  const tabs = useHitoTabs({ items: PROGRESS_TABS, value: activeTab });
  const [history, setHistory] = useState<HistoryState>({
    status: "idle",
    data: null,
    error: null,
    loadingMore: false,
  });
  const [progress, setProgress] = useState<ProgressState>({
    status: "idle",
    data: null,
    error: null,
  });
  const [selectedActivity, setSelectedActivity] = useState<RunnerActivityHistoryProductItem | null>(
    null,
  );
  const [pendingAction, setPendingAction] = useState<PendingActivityAction | null>(null);
  const [mutationPending, setMutationPending] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const detailReturnFocusRef = useRef<HTMLElement | null>(null);
  const confirmationReturnFocusRef = useRef<HTMLElement | null>(null);
  const progressFocusIntentRef = useRef<"custom" | "quick" | "retry" | null>(null);

  const loadHistory = useCallback(
    async (cursor?: string | null) => {
      const append = Boolean(cursor);
      setHistory((current) =>
        append && current.data
          ? { status: "ready", data: current.data, error: null, loadingMore: true }
          : { status: "loading", data: current.data, error: null, loadingMore: false },
      );

      try {
        const url = new URL("/api/runner-activities", window.location.origin);
        if (cursor) url.searchParams.set("cursor", cursor);
        const nextPage = await requestJson<{ ok: true; history: RunnerActivityHistoryProductPage }>(
          url,
          undefined,
          message("This view is temporarily unavailable."),
          locale,
        );
        setHistory((current) => ({
          status: "ready",
          data:
            append && current.data
              ? {
                  items: mergeActivities(current.data.items, nextPage.history.items),
                  nextCursor: nextPage.history.nextCursor,
                }
              : nextPage.history,
          error: null,
          loadingMore: false,
        }));
      } catch (error) {
        setHistory((current) => ({
          status: "error",
          data: current.data,
          error: readableError(
            error,
            message("We could not load activity history. Try again shortly."),
          ),
          loadingMore: false,
        }));
      }
    },
    [locale, message],
  );

  const loadProgress = useCallback(
    async (signal?: AbortSignal) => {
      setProgress({ status: "loading", data: null, error: null });
      try {
        const url = new URL("/api/runner-activity-progress", window.location.origin);
        url.searchParams.set("period", sequenceSelection.period);
        if (sequenceSelection.period === "custom") {
          if (sequenceSelection.startDate) {
            url.searchParams.set("startDate", sequenceSelection.startDate);
          }
          if (sequenceSelection.endDate) {
            url.searchParams.set("endDate", sequenceSelection.endDate);
          }
        }
        const result = await requestJson<{
          ok: true;
          progress: RunnerActivityProgressProductModel;
        }>(url, { signal }, message("This view is temporarily unavailable."), locale);
        setProgress({ status: "ready", data: result.progress, error: null });
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        setProgress({
          status: "error",
          data: null,
          error: readableError(
            error,
            message("We could not load running progress. Try again shortly."),
          ),
        });
      }
    },
    [
      locale,
      message,
      sequenceSelection.endDate,
      sequenceSelection.period,
      sequenceSelection.startDate,
    ],
  );

  useEffect(() => {
    if (activeTab === "history" && history.status === "idle") void loadHistory();
  }, [activeTab, history.status, loadHistory]);

  useEffect(() => {
    if (activeTab !== "progress") return;

    const controller = new AbortController();
    void loadProgress(controller.signal);
    return () => controller.abort();
  }, [activeTab, loadProgress]);

  useEffect(() => {
    const focusIntent = progressFocusIntentRef.current;
    if (activeTab !== "progress" || !focusIntent) return;
    if (progress.status !== "ready" && progress.status !== "error") return;

    const frame = window.requestAnimationFrame(() => {
      const target =
        progress.status === "error"
          ? document.getElementById("progress-retry-action")
          : focusIntent === "custom"
            ? document.getElementById("activity-sequence-custom-apply")
            : focusIntent === "quick"
              ? document.querySelector<HTMLElement>(
                  `[data-progress-sequence-period="${sequenceSelection.period}"]`,
                )
              : document.getElementById("factual-activity-sequence-title");
      target?.focus();
      progressFocusIntentRef.current = null;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeTab, progress.status, sequenceSelection.period]);

  const openActivity = (activity: RunnerActivityHistoryProductItem, trigger: HTMLElement) => {
    detailReturnFocusRef.current = trigger;
    setSelectedActivity(activity);
    setMutationError(null);
  };

  const requestAction = (
    action: ActivityAction,
    activity: RunnerActivityHistoryProductItem,
    trigger?: HTMLElement,
  ) => {
    if (trigger) confirmationReturnFocusRef.current = trigger;
    setMutationError(null);
    setPendingAction({ action, activity });
  };

  const runMutation = async () => {
    if (!pendingAction || mutationPending) return;

    const completedAction = pendingAction;
    setMutationPending(true);
    setMutationError(null);
    setNotice(null);
    try {
      const endpoint =
        completedAction.action === "remove-source"
          ? `/api/runner-activities/${completedAction.activity.id}/source`
          : `/api/runner-activities/${completedAction.activity.id}`;
      const result = await requestJson<{
        ok: true;
        readback: RunnerActivityMutationProductReadback;
      }>(
        new URL(endpoint, window.location.origin),
        { method: "DELETE" },
        message("This view is temporarily unavailable."),
        locale,
      );

      setPendingAction(null);
      setSelectedActivity(null);
      if (result.readback.status === "current") {
        setHistory({
          status: "ready",
          data: result.readback.history,
          error: null,
          loadingMore: false,
        });
        setProgress({ status: "ready", data: result.readback.progress, error: null });
        setNotice(
          completedAction.action === "remove-source"
            ? message("Original file removed. The activity and its progress facts remain.")
            : message("Activity deleted. Progress facts now reflect the backend readback."),
        );
      } else {
        setHistory((current) => ({ ...current, status: "loading", error: null }));
        setProgress({ status: "updating", data: null, error: null });
        setNotice(message("Activity history is updating after this change."));
        await loadHistory();
      }
      window.requestAnimationFrame(() => {
        document.getElementById("activity-history-title")?.focus();
      });
    } catch (error) {
      setMutationError(
        readableError(
          error,
          completedAction.action === "remove-source"
            ? message("We could not remove the original file. Try again shortly.")
            : message("We could not delete this activity. Try again shortly."),
        ),
      );
    } finally {
      setMutationPending(false);
    }
  };

  return (
    <div className="hito-route-gutter hito-route-stack max-w-5xl py-hito-6 sm:py-10">
      <div className="pb-3">
        <div
          className="hito-tabs hito-tabs-simple w-full"
          {...tabs.tabListProps}
          aria-label={message("Running history, progress, and saved plans")}
        >
          <button
            type="button"
            {...tabs.getTabProps("history")}
            onClick={() => onTabChange("history")}
            data-active={activeTab === "history"}
            className="hito-tab flex-1 sm:flex-none"
          >
            {message("Activity history")}
          </button>
          <button
            type="button"
            {...tabs.getTabProps("progress")}
            onClick={() => onTabChange("progress")}
            data-active={activeTab === "progress"}
            className="hito-tab flex-1 sm:flex-none"
          >
            {message("Progress")}
          </button>
          <button
            type="button"
            {...tabs.getTabProps("plans")}
            onClick={() => onTabChange("plans")}
            data-active={activeTab === "plans"}
            className="hito-tab flex-1 sm:flex-none"
          >
            {message("Plans")}
          </button>
        </div>
      </div>

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

      <div {...tabs.getPanelProps(activeTab)}>
        {activeTab === "history" ? (
          <ActivityHistoryPanel
            state={history}
            onRetry={() => void loadHistory()}
            onLoadMore={() => void loadHistory(history.data?.nextCursor)}
            onOpenActivity={openActivity}
            onRequestAction={requestAction}
          />
        ) : activeTab === "progress" ? (
          <FactualProgressPanel
            state={progress}
            sequenceSelection={sequenceSelection}
            onRetry={() => {
              progressFocusIntentRef.current = "retry";
              void loadProgress();
            }}
            onSequenceSelectionChange={(selection) => {
              if (selection.metric === sequenceSelection.metric) {
                progressFocusIntentRef.current = selection.period === "custom" ? "custom" : "quick";
              }
              onSequenceSelectionChange(selection);
            }}
          />
        ) : (
          <SavedPlanLibraryPanel />
        )}
      </div>

      <ActivityDetailOverlay
        activity={selectedActivity}
        returnFocusRef={detailReturnFocusRef}
        onOpenChange={(open) => {
          if (!open) setSelectedActivity(null);
        }}
        onRequestAction={requestAction}
      />
      <ActivityActionConfirmation
        pendingAction={pendingAction}
        pending={mutationPending}
        error={mutationError}
        returnFocusRef={confirmationReturnFocusRef}
        onOpenChange={(open) => {
          if (!open && !mutationPending) {
            setPendingAction(null);
            setMutationError(null);
          }
        }}
        onConfirm={() => void runMutation()}
      />
    </div>
  );
}

async function requestJson<T extends { ok: true }>(
  url: URL,
  init: RequestInit | undefined,
  unavailableMessage: string,
  locale: ResolvedUiLocale,
): Promise<T> {
  const response = await fetch(url, {
    credentials: "same-origin",
    headers: { Accept: "application/json", ...init?.headers },
    ...init,
  });
  const body = (await response.json().catch(() => null)) as T | HitoProductApiFailure | null;

  if (!response.ok || !body || !body.ok) {
    throw new Error(
      body && !body.ok ? getHitoProductApiFailureMessage(locale, body) : unavailableMessage,
    );
  }

  return body;
}

function mergeActivities(
  current: RunnerActivityHistoryProductItem[],
  next: RunnerActivityHistoryProductItem[],
) {
  const seen = new Set(current.map((activity) => activity.id));
  return [...current, ...next.filter((activity) => !seen.has(activity.id))];
}

function readableError(error: unknown, fallback: string) {
  return error instanceof Error && error.message.trim() ? error.message : fallback;
}
