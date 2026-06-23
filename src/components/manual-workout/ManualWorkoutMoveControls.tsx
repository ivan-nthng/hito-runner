import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { hitoToast } from "@/components/ui/hito-toast";
import { moveManualWorkoutWithinActivePlan } from "@/lib/manual-workout-authoring";
import type { ManualWorkoutDirectMoveResult } from "@/lib/manual-workout-authoring";
import {
  MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
} from "@/lib/manual-workout-authoring/schema";

const MANUAL_MOVE_TOAST_ID = "manual-workout-move";
const MOVE_UNAVAILABLE_MESSAGE =
  "Hito could not move this workout yet. Try again from the calendar.";

export type ManualWorkoutMoveRequest = {
  activePlanId: string;
  requestId: string;
  sourceWorkoutDate: string;
  sourceWorkoutId: string;
  targetDate: string;
  title: string;
};

export function ManualWorkoutMoveController({
  onMoved,
  onRequestHandled,
  request,
}: {
  request: ManualWorkoutMoveRequest | null;
  onRequestHandled: () => void;
  onMoved: () => void | Promise<void>;
}) {
  const moveManualWorkoutWithinActivePlanFn = useServerFn(moveManualWorkoutWithinActivePlan);
  const moveInFlightRef = useRef(false);
  const lastRequestIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!request || lastRequestIdRef.current === request.requestId) return;

    if (moveInFlightRef.current) {
      onRequestHandled();
      return;
    }

    lastRequestIdRef.current = request.requestId;
    moveInFlightRef.current = true;

    async function runDirectMove(nextRequest: ManualWorkoutMoveRequest) {
      try {
        const response = await moveManualWorkoutWithinActivePlanFn({
          data: {
            activePlanId: nextRequest.activePlanId,
            sourceWorkoutId: nextRequest.sourceWorkoutId,
            sourceWorkoutDate: nextRequest.sourceWorkoutDate,
            targetDate: nextRequest.targetDate,
          },
        });
        const result = isManualWorkoutDirectMoveResult(response)
          ? response
          : buildMoveUnavailableResult();

        if (!result.ok) {
          hitoToast.error({
            id: MANUAL_MOVE_TOAST_ID,
            title: "Move blocked",
            description: result.message,
          });
          return;
        }

        hitoToast.success({
          id: MANUAL_MOVE_TOAST_ID,
          title: "Workout moved",
          description: "Saved to your calendar.",
        });
        await onMoved();
      } catch {
        const result = buildMoveUnavailableResult();
        hitoToast.error({
          id: MANUAL_MOVE_TOAST_ID,
          title: "Workout not moved",
          description: result.message,
        });
      } finally {
        moveInFlightRef.current = false;
        onRequestHandled();
      }
    }

    void runDirectMove(request);
  }, [moveManualWorkoutWithinActivePlanFn, onMoved, onRequestHandled, request]);

  return null;
}

function buildMoveUnavailableResult(): ManualWorkoutDirectMoveResult {
  return {
    ok: false,
    status: "blocked",
    reason: "persistence_failed",
    message: MOVE_UNAVAILABLE_MESSAGE,
    persisted: false,
    sourceKind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
    workoutSourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  };
}

function isManualWorkoutDirectMoveResult(value: unknown): value is ManualWorkoutDirectMoveResult {
  if (!isRecord(value) || typeof value.ok !== "boolean") return false;
  if (!value.ok) return isMoveBlockedResult(value);

  return (
    value.status === "moved" &&
    value.persisted === true &&
    typeof value.activePlanId === "string" &&
    typeof value.plannedWorkoutId === "string" &&
    typeof value.sourceWorkoutDate === "string" &&
    typeof value.targetDate === "string" &&
    typeof value.targetWeekday === "string" &&
    typeof value.title === "string" &&
    typeof value.templateKey === "string" &&
    value.mutationMode === "direct_manual_edit"
  );
}

function isMoveBlockedResult(
  value: Record<string, unknown>,
): value is Extract<ManualWorkoutDirectMoveResult, { ok: false }> {
  return (
    value.ok === false &&
    value.status === "blocked" &&
    value.persisted === false &&
    typeof value.reason === "string" &&
    typeof value.message === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object");
}
