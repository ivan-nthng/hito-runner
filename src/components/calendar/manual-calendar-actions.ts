import { type DragEvent, useEffect, useRef, useState } from "react";
import type { ManualCopiedWorkoutSource } from "@/components/manual-workout/ManualWorkoutSourceActionMenu";
import type { ManualWorkoutMoveRequest } from "@/components/manual-workout/ManualWorkoutMoveControls";
import {
  resolveCalendarMoveTargetDayKind,
  type CalendarMoveUndoAffordance,
  type CalendarOptimisticMoveDisplay,
  type CalendarWorkoutActionContext,
} from "@/components/calendar/calendar-projection";
import type {
  ManualWorkoutDirectMoveResult,
  ManualWorkoutMoveReviewResult,
} from "@/lib/manual-workout-authoring";
import { type TrainingSnapshot, type Workout } from "@/lib/training";

export type ManualCalendarActionState = {
  copiedWorkoutSource: ManualCopiedWorkoutSource | null;
  lastMoveUndo: CalendarMoveUndoAffordance | null;
  movePending: boolean;
  optimisticMove: CalendarOptimisticMoveDisplay | null;
  undoSecondsRemaining: number;
  moveHoverDate: string | null;
  moveWorkoutSource: ManualCopiedWorkoutSource | null;
  onCancelMoveWorkout: () => void;
  onCopyWorkout: (source: ManualCopiedWorkoutSource) => void;
  onMoveDragEnd: () => void;
  onMoveTargetHover: (targetDate: string | null) => void;
  onManualPlanChanged: () => Promise<void>;
  onMoveTargetSelected: (targetDate: string, source?: ManualCopiedWorkoutSource | null) => void;
  onMoveWorkout: (source: ManualCopiedWorkoutSource) => void;
  onUndoLastMove: (undo: CalendarMoveUndoAffordance) => void;
};

type ManualWorkoutDirectMoveSuccess = Extract<ManualWorkoutDirectMoveResult, { ok: true }>;

const MANUAL_MOVE_UNDO_WINDOW_MS = 7000;
const MANUAL_MOVE_UNDO_REFRESH_GRACE_MS = 30000;
const MANUAL_MOVE_UNDO_STORAGE_KEY = "hito.manual-calendar.last-move-undo.v1";

let cachedLastMoveUndo: CalendarMoveUndoAffordance | null = null;

function getCachedLastMoveUndo(activePlanId: string | undefined) {
  if (!cachedLastMoveUndo) {
    cachedLastMoveUndo = readStoredLastMoveUndo();
  }

  if (
    !cachedLastMoveUndo ||
    !activePlanId ||
    cachedLastMoveUndo.activePlanId !== activePlanId ||
    cachedLastMoveUndo.expiresAt <= Date.now()
  ) {
    cachedLastMoveUndo = null;
    return null;
  }

  return cachedLastMoveUndo;
}

function clearLastMoveUndoCache() {
  cachedLastMoveUndo = null;
  if (typeof window === "undefined") return;

  window.sessionStorage.removeItem(MANUAL_MOVE_UNDO_STORAGE_KEY);
}

function refreshLastMoveUndoWindow() {
  const undo = cachedLastMoveUndo ?? readStoredLastMoveUndo();
  if (!undo) return null;

  const now = Date.now();
  const refreshedUndo = {
    ...undo,
    expiresAt: now + MANUAL_MOVE_UNDO_WINDOW_MS,
  };

  storeLastMoveUndo(refreshedUndo);
  return { now, undo: refreshedUndo };
}

function refreshManualMoveUndoCandidate(undo: CalendarMoveUndoAffordance | null) {
  if (!undo) return null;

  const now = Date.now();
  const refreshedUndo = {
    ...undo,
    expiresAt: now + MANUAL_MOVE_UNDO_WINDOW_MS,
  };

  storeLastMoveUndo(refreshedUndo);
  return { now, undo: refreshedUndo };
}

function storeLastMoveUndo(undo: CalendarMoveUndoAffordance) {
  cachedLastMoveUndo = undo;
  if (typeof window === "undefined") return;

  window.sessionStorage.setItem(MANUAL_MOVE_UNDO_STORAGE_KEY, JSON.stringify(undo));
}

function readStoredLastMoveUndo() {
  if (typeof window === "undefined") return null;

  const rawUndo = window.sessionStorage.getItem(MANUAL_MOVE_UNDO_STORAGE_KEY);
  if (!rawUndo) return null;

  try {
    const undo = JSON.parse(rawUndo) as unknown;
    if (isManualMoveUndoAffordance(undo)) return undo;
  } catch {
    // Ignore malformed transient UI state.
  }

  window.sessionStorage.removeItem(MANUAL_MOVE_UNDO_STORAGE_KEY);
  return null;
}

function isManualMoveUndoAffordance(value: unknown): value is CalendarMoveUndoAffordance {
  if (!value || typeof value !== "object") return false;

  const undo = value as Partial<CalendarMoveUndoAffordance>;
  return (
    typeof undo.activePlanId === "string" &&
    typeof undo.displayDate === "string" &&
    typeof undo.expiresAt === "number" &&
    typeof undo.id === "string" &&
    typeof undo.sourceWorkoutDate === "string" &&
    typeof undo.sourceWorkoutId === "string" &&
    typeof undo.targetDate === "string" &&
    typeof undo.title === "string"
  );
}

function buildManualMoveUndoCandidate({
  activePlanId,
  requestId,
  sourceWorkoutDate,
  sourceWorkoutId,
  targetDate,
  title,
}: {
  activePlanId: string;
  requestId: string;
  sourceWorkoutDate: string;
  sourceWorkoutId: string;
  targetDate: string;
  title: string;
}): CalendarMoveUndoAffordance {
  return {
    activePlanId,
    displayDate: sourceWorkoutDate,
    expiresAt: Date.now() + MANUAL_MOVE_UNDO_REFRESH_GRACE_MS,
    id: requestId,
    sourceWorkoutDate: targetDate,
    sourceWorkoutId,
    targetDate: sourceWorkoutDate,
    title,
  };
}

export function useManualCalendarActions(
  snapshot: TrainingSnapshot,
  {
    onCalendarRefresh,
    onResetTransientUi,
  }: { onCalendarRefresh: () => Promise<void>; onResetTransientUi: () => void },
) {
  const [manualCopySource, setManualCopySource] = useState<ManualCopiedWorkoutSource | null>(null);
  const [manualMoveSource, setManualMoveSource] = useState<ManualCopiedWorkoutSource | null>(null);
  const [manualMoveRequest, setManualMoveRequest] = useState<ManualWorkoutMoveRequest | null>(null);
  const [manualMoveHoverDate, setManualMoveHoverDate] = useState<string | null>(null);
  const [manualOptimisticMove, setManualOptimisticMove] =
    useState<CalendarOptimisticMoveDisplay | null>(null);
  const manualMoveUndoCandidateRef = useRef<CalendarMoveUndoAffordance | null>(null);
  const [lastMoveUndo, setLastMoveUndo] = useState<CalendarMoveUndoAffordance | null>(() =>
    getCachedLastMoveUndo(snapshot.planMeta?.id),
  );
  const [lastMoveUndoNow, setLastMoveUndoNow] = useState(() => Date.now());

  const undoSecondsRemaining = lastMoveUndo
    ? Math.max(0, Math.ceil((lastMoveUndo.expiresAt - lastMoveUndoNow) / 1000))
    : 0;

  useEffect(() => {
    if (!manualOptimisticMove) return;
    if (manualMoveRequest?.requestId === manualOptimisticMove.requestId) return;
    if (snapshotReflectsManualMove(snapshot.workouts, manualOptimisticMove)) {
      setManualOptimisticMove(null);
    }
  }, [manualMoveRequest?.requestId, manualOptimisticMove, snapshot.workouts]);

  useEffect(() => {
    if (!lastMoveUndo) return;

    setLastMoveUndoNow(Date.now());
    const timer = window.setInterval(() => setLastMoveUndoNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [lastMoveUndo]);

  useEffect(() => {
    if (!lastMoveUndo || lastMoveUndo.expiresAt > lastMoveUndoNow) return;
    clearLastMoveUndoCache();
    setLastMoveUndo(null);
  }, [lastMoveUndo, lastMoveUndoNow]);

  function resetMoveState() {
    setManualMoveSource(null);
    setManualMoveRequest(null);
    setManualMoveHoverDate(null);
    setManualOptimisticMove(null);
    manualMoveUndoCandidateRef.current = null;
  }

  async function refreshAfterManualPlanChange() {
    onResetTransientUi();
    resetMoveState();
    clearLastMoveUndoCache();
    setLastMoveUndo(null);
    await onCalendarRefresh();
  }

  function refreshAfterManualMoveSuccess() {
    onResetTransientUi();
    setManualMoveSource(null);
    setManualMoveHoverDate(null);
    const undoCandidate = manualMoveUndoCandidateRef.current;
    const refreshedUndo =
      refreshLastMoveUndoWindow() ?? refreshManualMoveUndoCandidate(undoCandidate);
    manualMoveUndoCandidateRef.current = null;

    if (refreshedUndo) {
      setLastMoveUndoNow(refreshedUndo.now);
      setLastMoveUndo(refreshedUndo.undo);
    }

    void onCalendarRefresh()
      .then(() => {
        const refreshedAfterReadback = refreshLastMoveUndoWindow();
        if (!refreshedAfterReadback) return;

        setLastMoveUndoNow(refreshedAfterReadback.now);
        setLastMoveUndo(refreshedAfterReadback.undo);
      })
      .catch(() => undefined);
  }

  function recordDirectManualMoveUndo(result: ManualWorkoutDirectMoveSuccess) {
    if (result.targetDayKind !== "rest_day") return;

    const now = Date.now();

    setLastMoveUndoNow(now);
    const undo = {
      activePlanId: result.activePlanId,
      displayDate: result.sourceWorkoutDate,
      expiresAt: now + MANUAL_MOVE_UNDO_REFRESH_GRACE_MS,
      id: `${result.plannedWorkoutId}:${result.sourceWorkoutDate}:${result.targetDate}:${now}`,
      sourceWorkoutDate: result.targetDate,
      sourceWorkoutId: result.plannedWorkoutId,
      targetDate: result.sourceWorkoutDate,
      title: result.title,
    };

    storeLastMoveUndo(undo);
    manualMoveUndoCandidateRef.current = null;
    setLastMoveUndo(undo);
  }

  function projectManualOptimisticMove({
    requestId,
    sourceWorkoutDate,
    sourceWorkoutId,
    targetDate,
  }: Pick<
    CalendarOptimisticMoveDisplay,
    "requestId" | "sourceWorkoutDate" | "sourceWorkoutId" | "targetDate"
  >) {
    const sourceWorkout = findManualMoveSourceWorkout(
      snapshot.workouts,
      { sourceWorkoutDate, sourceWorkoutId },
      manualOptimisticMove,
    );
    if (!sourceWorkout) return;

    setManualOptimisticMove({
      requestId,
      sourceWorkoutDate,
      sourceWorkoutId,
      targetDate,
      workout: sourceWorkout,
    });
  }

  function requestManualWorkoutMove(
    targetDate: string,
    sourceOverride?: ManualCopiedWorkoutSource | null,
  ) {
    const moveSource = sourceOverride ?? manualMoveSource;
    const canReuseOptimisticMove =
      Boolean(sourceOverride) &&
      Boolean(manualOptimisticMove) &&
      manualOptimisticMove?.sourceWorkoutId === moveSource?.sourceWorkoutId &&
      manualOptimisticMove?.targetDate === moveSource?.sourceWorkoutDate;

    if (!moveSource || manualMoveRequest || (manualOptimisticMove && !canReuseOptimisticMove)) {
      return;
    }

    const sourceWorkout = findManualMoveSourceWorkout(
      snapshot.workouts,
      moveSource,
      manualOptimisticMove,
    );
    if (!sourceWorkout) return;

    const requestId = `${moveSource.sourceWorkoutId}:${targetDate}:${Date.now()}`;
    const targetDayKind = resolveCalendarMoveTargetDayKind(
      snapshot.workouts,
      targetDate,
      moveSource,
    );

    clearLastMoveUndoCache();
    setLastMoveUndo(null);
    manualMoveUndoCandidateRef.current =
      targetDayKind === "rest_day"
        ? buildManualMoveUndoCandidate({
            activePlanId: moveSource.activePlanId,
            requestId,
            sourceWorkoutDate: moveSource.sourceWorkoutDate,
            sourceWorkoutId: moveSource.sourceWorkoutId,
            targetDate,
            title: moveSource.title,
          })
        : null;
    setManualMoveRequest({
      ...moveSource,
      targetDayKind,
      targetDate,
      requestId,
    });
    if (targetDayKind !== "workout_day") {
      projectManualOptimisticMove({
        requestId,
        sourceWorkoutDate: moveSource.sourceWorkoutDate,
        sourceWorkoutId: moveSource.sourceWorkoutId,
        targetDate,
      });
    }
    setManualMoveSource(null);
    setManualMoveHoverDate(null);
  }

  function undoLastManualMove(undo: CalendarMoveUndoAffordance) {
    if (manualMoveRequest) return;

    clearLastMoveUndoCache();
    setLastMoveUndo(null);
    requestManualWorkoutMove(undo.targetDate, {
      activePlanId: undo.activePlanId,
      sourceWorkoutDate: undo.sourceWorkoutDate,
      sourceWorkoutId: undo.sourceWorkoutId,
      title: undo.title,
    });
  }

  const manualCalendarActionState: ManualCalendarActionState = {
    copiedWorkoutSource: manualCopySource,
    lastMoveUndo,
    movePending: Boolean(manualMoveRequest),
    optimisticMove: manualOptimisticMove,
    undoSecondsRemaining,
    moveHoverDate: manualMoveHoverDate,
    moveWorkoutSource: manualMoveSource,
    onCancelMoveWorkout: () => {
      setManualMoveSource(null);
      setManualMoveHoverDate(null);
    },
    onCopyWorkout: (source) => {
      clearLastMoveUndoCache();
      setLastMoveUndo(null);
      setManualCopySource(source);
    },
    onMoveDragEnd: () => setManualMoveHoverDate(null),
    onMoveTargetHover: setManualMoveHoverDate,
    onManualPlanChanged: refreshAfterManualPlanChange,
    onMoveTargetSelected: requestManualWorkoutMove,
    onMoveWorkout: (source) => {
      if (manualMoveRequest || manualOptimisticMove) return;

      clearLastMoveUndoCache();
      setLastMoveUndo(null);
      setManualMoveSource(source);
      setManualMoveHoverDate(null);
    },
    onUndoLastMove: undoLastManualMove,
  };

  return {
    manualCalendarActionState,
    manualMoveControllerProps: {
      onMoved: refreshAfterManualMoveSuccess,
      onRequestHandled: () => {
        setManualMoveRequest(null);
      },
      onOptimisticMoveRejected: () => {
        manualMoveUndoCandidateRef.current = null;
        setManualOptimisticMove(null);
      },
      onDirectMoveSucceeded: recordDirectManualMoveUndo,
      onReplacementConfirming: (review: Extract<ManualWorkoutMoveReviewResult, { ok: true }>) =>
        projectManualOptimisticMove({
          requestId: `replacement:${review.sourceWorkoutId}:${review.targetDate}:${review.review.reviewChecksum}`,
          sourceWorkoutDate: review.sourceWorkoutDate,
          sourceWorkoutId: review.sourceWorkoutId,
          targetDate: review.targetDate,
        }),
      request: manualMoveRequest,
    },
  };
}

function snapshotReflectsManualMove(
  workouts: Workout[],
  optimisticMove: CalendarOptimisticMoveDisplay,
) {
  const sourceStillHasMovedWorkout = workouts.some(
    (workout) =>
      workout.id === optimisticMove.sourceWorkoutId &&
      workout.date === optimisticMove.sourceWorkoutDate,
  );
  const targetHasMovedWorkout = workouts.some(
    (workout) =>
      workout.id === optimisticMove.sourceWorkoutId && workout.date === optimisticMove.targetDate,
  );

  return !sourceStillHasMovedWorkout && targetHasMovedWorkout;
}

function findManualMoveSourceWorkout(
  workouts: Workout[],
  moveSource: Pick<ManualCopiedWorkoutSource, "sourceWorkoutDate" | "sourceWorkoutId">,
  optimisticMove: CalendarOptimisticMoveDisplay | null,
) {
  const persistedWorkout = workouts.find(
    (workout) =>
      workout.id === moveSource.sourceWorkoutId && workout.date === moveSource.sourceWorkoutDate,
  );
  if (persistedWorkout) return persistedWorkout;

  if (
    optimisticMove?.sourceWorkoutId === moveSource.sourceWorkoutId &&
    optimisticMove.targetDate === moveSource.sourceWorkoutDate
  ) {
    return optimisticMove.workout;
  }

  return null;
}

export function manualMoveSourceDragProps(
  context: CalendarWorkoutActionContext | null,
  manualCalendarActionState: ManualCalendarActionState,
) {
  return {
    draggable: Boolean(context?.canDragInitiate),
    onDragEnd: () => manualCalendarActionState.onMoveDragEnd(),
    onDragStart: (event: DragEvent<HTMLElement>) => {
      if (!context?.canDragInitiate) return;
      event.stopPropagation();
      manualCalendarActionState.onMoveWorkout(context);
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("application/x-hito-manual-workout-move", context.sourceWorkoutId);
      event.dataTransfer.setData("text/plain", context.sourceWorkoutId);
      setManualMoveDragImage(event, context);
    },
  };
}

export function manualMoveTargetDragProps(
  canMoveHere: boolean,
  targetDate: string,
  manualCalendarActionState: ManualCalendarActionState,
) {
  return {
    onDragEnter: (event: DragEvent<HTMLElement>) => {
      if (!canMoveHere) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      manualCalendarActionState.onMoveTargetHover(targetDate);
    },
    onDragLeave: (event: DragEvent<HTMLElement>) => {
      if (manualCalendarActionState.moveHoverDate !== targetDate) return;
      const nextTarget = event.relatedTarget;
      if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return;
      manualCalendarActionState.onMoveTargetHover(null);
    },
    onDragOver: (event: DragEvent<HTMLElement>) => {
      if (!canMoveHere) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    },
    onDrop: (event: DragEvent<HTMLElement>) => {
      if (!canMoveHere) return;
      event.preventDefault();
      event.stopPropagation();
      manualCalendarActionState.onMoveTargetHover(null);
      manualCalendarActionState.onMoveTargetSelected(
        targetDate,
        manualCalendarActionState.moveWorkoutSource,
      );
    },
  };
}

function setManualMoveDragImage(
  event: DragEvent<HTMLElement>,
  context: CalendarWorkoutActionContext,
) {
  if (typeof document === "undefined" || typeof window === "undefined") return;

  const dragImage = document.createElement("div");
  dragImage.style.position = "fixed";
  dragImage.style.top = "-1000px";
  dragImage.style.left = "-1000px";
  dragImage.style.zIndex = "2147483647";
  dragImage.style.pointerEvents = "none";
  dragImage.className = "hito-calendar-drag-preview";

  const title = document.createElement("div");
  title.className = "hito-calendar-drag-preview-title";
  title.textContent = context.title;

  const meta = document.createElement("div");
  meta.className = "hito-calendar-drag-preview-meta";
  meta.textContent = "Move workout";

  dragImage.append(title, meta);

  document.body.appendChild(dragImage);
  event.dataTransfer.setDragImage(dragImage, 24, 18);
  window.setTimeout(() => dragImage.remove(), 0);
}
