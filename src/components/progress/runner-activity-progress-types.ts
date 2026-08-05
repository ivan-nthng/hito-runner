import type {
  RunnerActivityHistoryProductItem,
  RunnerActivityHistoryProductPage,
  RunnerActivityProgressProductModel,
} from "@/lib/runner-activity/product-contract";

export type AsyncState<T> =
  | { status: "idle" | "loading"; data: T | null; error: null }
  | { status: "ready"; data: T; error: null }
  | { status: "error"; data: T | null; error: string };

export type HistoryState = AsyncState<RunnerActivityHistoryProductPage> & { loadingMore: boolean };

export type ProgressState =
  | AsyncState<RunnerActivityProgressProductModel>
  | { status: "updating"; data: null; error: null };

export type ActivityAction = "remove-source" | "delete";

export type PendingActivityAction = {
  action: ActivityAction;
  activity: RunnerActivityHistoryProductItem;
};
