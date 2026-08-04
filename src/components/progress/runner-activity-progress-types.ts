import type {
  RunnerActivityHistoryItem,
  RunnerActivityHistoryPage,
  RunnerActivityProgressReadModel,
} from "@/lib/runner-activity/read-model-types";

export type AsyncState<T> =
  | { status: "idle" | "loading"; data: T | null; error: null }
  | { status: "ready"; data: T; error: null }
  | { status: "error"; data: T | null; error: string };

export type HistoryState = AsyncState<RunnerActivityHistoryPage> & { loadingMore: boolean };

export type ProgressState =
  | AsyncState<RunnerActivityProgressReadModel>
  | { status: "updating"; data: null; error: null };

export type ActivityAction = "remove-source" | "delete";

export type PendingActivityAction = {
  action: ActivityAction;
  activity: RunnerActivityHistoryItem;
};
