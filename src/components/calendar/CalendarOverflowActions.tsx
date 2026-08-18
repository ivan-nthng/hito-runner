import { type ChangeEvent, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
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
import { hitoToast } from "@/components/ui/hito-toast";
import {
  deleteCalendarFutureWorkouts,
  startNewCalendarPlan,
  uploadCalendarPlanJson,
} from "@/lib/calendar-overflow-actions";

type CalendarOverflowAction = "delete" | "start";
type CalendarOverflowBusyAction = "upload" | "local-file-flow" | CalendarOverflowAction;

const CALENDAR_OVERFLOW_TOAST_ID = "calendar-overflow-actions";
const FUTURE_CALENDAR_JSON_URL = "/api/plan/export?scope=future-calendar&format=json";

export function CalendarOverflowActions({
  localActivityFileDesignFixtureEnabled = false,
  onCalendarRefresh,
}: {
  localActivityFileDesignFixtureEnabled?: boolean;
  onCalendarRefresh: () => Promise<unknown>;
}) {
  const uploadCalendarPlanJsonFn = useServerFn(uploadCalendarPlanJson);
  const deleteCalendarFutureWorkoutsFn = useServerFn(deleteCalendarFutureWorkouts);
  const startNewCalendarPlanFn = useServerFn(startNewCalendarPlan);
  const [pendingAction, setPendingAction] = useState<CalendarOverflowAction | null>(null);
  const [busyAction, setBusyAction] = useState<CalendarOverflowBusyAction | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);

  async function retainPlanJson(rawJson: string, localFileFlow = false) {
    const result = await uploadCalendarPlanJsonFn({ data: { rawJson } });

    if (!result.ok) {
      hitoToast.error({
        id: CALENDAR_OVERFLOW_TOAST_ID,
        title: localFileFlow ? "Calendar JSON not saved" : "Plan not saved",
        description: result.message,
      });
      return;
    }

    hitoToast.success({
      id: CALENDAR_OVERFLOW_TOAST_ID,
      title: localFileFlow ? "Calendar JSON flow ready" : "Plan saved to Plans",
      description: localFileFlow
        ? `${result.record.title} was exported and saved to Plans with ${result.record.workoutCount} ${result.record.workoutCount === 1 ? "workout" : "workouts"}. Your Calendar was not changed.`
        : `${result.record.title} was saved. Your Calendar was not changed.`,
    });
  }

  async function uploadPlanJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || busyAction) return;

    setBusyAction("upload");
    hitoToast.working({
      id: CALENDAR_OVERFLOW_TOAST_ID,
      title: "Saving plan to Plans",
      description: "Your Calendar will not be changed.",
    });

    try {
      await retainPlanJson(await file.text());
    } catch {
      hitoToast.error({
        id: CALENDAR_OVERFLOW_TOAST_ID,
        title: "Plan save not confirmed",
        description: "The upload result could not be confirmed. Check Plans before trying again.",
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function runLocalFileFlowBridge() {
    if (!localActivityFileDesignFixtureEnabled || busyAction) return;

    setBusyAction("local-file-flow");
    hitoToast.working({
      id: CALENDAR_OVERFLOW_TOAST_ID,
      title: "Checking Calendar JSON flow",
      description: "Exporting the current future Calendar and saving that exact JSON to Plans.",
    });

    try {
      const response = await fetch(FUTURE_CALENDAR_JSON_URL, {
        headers: { accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error("Calendar JSON export failed.");
      }

      await retainPlanJson(await response.text(), true);
    } catch {
      hitoToast.error({
        id: CALENDAR_OVERFLOW_TOAST_ID,
        title: "Calendar JSON flow not confirmed",
        description:
          "The future Calendar JSON could not be exported or saved. Nothing was changed.",
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function confirmAction() {
    const action = pendingAction;

    if (!action || busyAction) return;

    setBusyAction(action);
    hitoToast.working({
      id: CALENDAR_OVERFLOW_TOAST_ID,
      title: action === "start" ? "Opening plan creation" : "Deleting future workouts",
      description:
        action === "start"
          ? "Removing eligible upcoming Calendar workouts first."
          : "Removing eligible upcoming Calendar workouts.",
    });

    try {
      const result =
        action === "start"
          ? await startNewCalendarPlanFn({ data: { confirmation: "start_new_plan" } })
          : await deleteCalendarFutureWorkoutsFn({
              data: { confirmation: "delete_future_workouts" },
            });

      if (!result.ok) {
        hitoToast.error({
          id: CALENDAR_OVERFLOW_TOAST_ID,
          title: action === "start" ? "Plan creation not opened" : "Future workouts not deleted",
          description: result.message,
        });
        return;
      }

      setPendingAction(null);

      if (action === "start") {
        await onCalendarRefresh().catch(() => undefined);
        window.location.assign("/?createPlan=true");
        return;
      }

      try {
        await onCalendarRefresh();
        hitoToast.success({
          id: CALENDAR_OVERFLOW_TOAST_ID,
          title: "Future workouts deleted",
          description: `${result.clearedWorkoutCount} eligible upcoming ${result.clearedWorkoutCount === 1 ? "workout was" : "workouts were"} deleted.`,
        });
      } catch {
        hitoToast.error({
          id: CALENDAR_OVERFLOW_TOAST_ID,
          title: "Calendar needs refresh",
          description: `${result.clearedWorkoutCount} eligible upcoming ${result.clearedWorkoutCount === 1 ? "workout was" : "workouts were"} deleted, but the latest Calendar could not be refreshed.`,
        });
      }
    } catch {
      hitoToast.error({
        id: CALENDAR_OVERFLOW_TOAST_ID,
        title: action === "start" ? "Plan creation not opened" : "Future workouts not deleted",
        description:
          action === "start"
            ? "The request result could not be confirmed. Refresh Calendar before trying again."
            : "The delete result could not be confirmed. Refresh Calendar before trying again.",
      });
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <HitoButton
            ref={menuTriggerRef}
            type="button"
            aria-label="Open Calendar actions"
            disabled={busyAction !== null}
            iconOnly
            size="sm"
            variant="ghost"
          >
            <Icon name="more-horizontal" size="sm" />
          </HitoButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="hito-menu-width-standard">
          <DropdownMenuItem asChild>
            <a href={FUTURE_CALENDAR_JSON_URL} download data-calendar-future-download>
              <Icon name="download" size="xs" />
              Download future workouts JSON
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={busyAction !== null}
            onSelect={() => fileInputRef.current?.click()}
          >
            <Icon name="upload" size="xs" />
            Upload plan JSON
          </DropdownMenuItem>
          {localActivityFileDesignFixtureEnabled ? (
            <DropdownMenuItem
              data-calendar-local-file-flow
              disabled={busyAction !== null}
              onSelect={() => void runLocalFileFlowBridge()}
            >
              <Icon name="check-circle" size="xs" />
              Check Calendar JSON flow
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem
            disabled={busyAction !== null}
            onSelect={() => setPendingAction("start")}
          >
            <Icon name="calendar-clock" size="xs" />
            Start a new plan
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            data-tone="destructive"
            disabled={busyAction !== null}
            onSelect={() => setPendingAction("delete")}
          >
            <Icon name="trash" size="xs" />
            Delete future workouts
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => void uploadPlanJson(event)}
      />

      <Dialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open && busyAction === null) setPendingAction(null);
        }}
      >
        <DialogContent
          className="hito-dialog-stable hito-product-dialog hito-dialog-surface-product max-w-lg"
          showCloseButton={busyAction === null}
          onEscapeKeyDown={(event) => {
            if (busyAction !== null) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (busyAction !== null) event.preventDefault();
          }}
          onCloseAutoFocus={(event) => {
            const target = menuTriggerRef.current;
            if (!target?.isConnected) return;
            event.preventDefault();
            target.focus();
          }}
        >
          <DialogHeader className="hito-product-dialog-header">
            <DialogTitle className="hito-ui-title-md text-foreground">
              {pendingAction === "start" ? "Start a new plan?" : "Delete future workouts?"}
            </DialogTitle>
            <DialogDescription className="hito-body-md text-secondary">
              {pendingAction === "start"
                ? "Eligible upcoming workouts will be removed before plan creation opens."
                : "This removes eligible upcoming Calendar workouts."}
            </DialogDescription>
          </DialogHeader>
          <div className="hito-product-dialog-body">
            <p className="hito-body-md text-secondary">
              Past workouts, results, and FIT records are not touched.
            </p>
          </div>
          <DialogFooter className="hito-product-dialog-footer sm:space-x-0">
            <HitoButton
              type="button"
              size="md"
              variant="secondary"
              disabled={busyAction !== null}
              onClick={() => setPendingAction(null)}
            >
              Cancel
            </HitoButton>
            <HitoButton
              type="button"
              size="md"
              tone={pendingAction === "delete" ? "error" : "default"}
              variant="primary"
              loading={busyAction !== null}
              disabled={busyAction !== null}
              onClick={() => void confirmAction()}
            >
              {pendingAction === "start" ? "Start a new plan" : "Delete future workouts"}
            </HitoButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
