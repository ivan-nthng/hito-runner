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
import { useHitoProductMessage, useHitoUiLocale } from "@/components/ui/hito-ui-locale-provider";
import { formatUiNumber } from "@/lib/ui-locale";
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
  const locale = useHitoUiLocale();
  const t = useHitoProductMessage();
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
        title: localFileFlow ? t("Calendar JSON not saved") : t("Plan not saved"),
        description: result.message,
      });
      return;
    }

    hitoToast.success({
      id: CALENDAR_OVERFLOW_TOAST_ID,
      title: localFileFlow ? t("Calendar JSON flow ready") : t("Plan saved to Plans"),
      description: localFileFlow
        ? t(
            result.record.workoutCount === 1
              ? "{title} was exported and saved to Plans with {count} workout. Your Calendar was not changed."
              : "{title} was exported and saved to Plans with {count} workouts. Your Calendar was not changed.",
            {
              title: result.record.title,
              count: formatUiNumber(result.record.workoutCount, locale),
            },
          )
        : t("{title} was saved. Your Calendar was not changed.", {
            title: result.record.title,
          }),
    });
  }

  async function uploadPlanJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || busyAction) return;

    setBusyAction("upload");
    hitoToast.working({
      id: CALENDAR_OVERFLOW_TOAST_ID,
      title: t("Saving plan to Plans"),
      description: t("Your Calendar will not be changed."),
    });

    try {
      await retainPlanJson(await file.text());
    } catch {
      hitoToast.error({
        id: CALENDAR_OVERFLOW_TOAST_ID,
        title: t("Plan save not confirmed"),
        description: t(
          "The upload result could not be confirmed. Check Plans before trying again.",
        ),
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
      title: t("Checking Calendar JSON flow"),
      description: t("Exporting the current future Calendar and saving that exact JSON to Plans."),
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
        title: t("Calendar JSON flow not confirmed"),
        description: t(
          "The future Calendar JSON could not be exported or saved. Nothing was changed.",
        ),
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
      title: action === "start" ? t("Opening plan creation") : t("Deleting future workouts"),
      description:
        action === "start"
          ? t("Removing eligible upcoming Calendar workouts first.")
          : t("Removing eligible upcoming Calendar workouts."),
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
          title:
            action === "start" ? t("Plan creation not opened") : t("Future workouts not deleted"),
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
          title: t("Future workouts deleted"),
          description: t(
            result.clearedWorkoutCount === 1
              ? "{count} eligible upcoming workout was deleted."
              : "{count} eligible upcoming workouts were deleted.",
            { count: formatUiNumber(result.clearedWorkoutCount, locale) },
          ),
        });
      } catch {
        hitoToast.error({
          id: CALENDAR_OVERFLOW_TOAST_ID,
          title: t("Calendar needs refresh"),
          description: t(
            result.clearedWorkoutCount === 1
              ? "{count} eligible upcoming workout was deleted, but the latest Calendar could not be refreshed."
              : "{count} eligible upcoming workouts were deleted, but the latest Calendar could not be refreshed.",
            { count: formatUiNumber(result.clearedWorkoutCount, locale) },
          ),
        });
      }
    } catch {
      hitoToast.error({
        id: CALENDAR_OVERFLOW_TOAST_ID,
        title:
          action === "start" ? t("Plan creation not opened") : t("Future workouts not deleted"),
        description:
          action === "start"
            ? t("The request result could not be confirmed. Refresh Calendar before trying again.")
            : t("The delete result could not be confirmed. Refresh Calendar before trying again."),
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
            aria-label={t("Open Calendar actions")}
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
              {t("Download future workouts JSON")}
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={busyAction !== null}
            onSelect={() => fileInputRef.current?.click()}
          >
            <Icon name="upload" size="xs" />
            {t("Upload plan JSON")}
          </DropdownMenuItem>
          {localActivityFileDesignFixtureEnabled ? (
            <DropdownMenuItem
              data-calendar-local-file-flow
              disabled={busyAction !== null}
              onSelect={() => void runLocalFileFlowBridge()}
            >
              <Icon name="check-circle" size="xs" />
              {t("Check Calendar JSON flow")}
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem
            disabled={busyAction !== null}
            onSelect={() => setPendingAction("start")}
          >
            <Icon name="calendar-clock" size="xs" />
            {t("Start a new plan")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            data-tone="destructive"
            disabled={busyAction !== null}
            onSelect={() => setPendingAction("delete")}
          >
            <Icon name="trash" size="xs" />
            {t("Delete future workouts")}
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
              {pendingAction === "start" ? t("Start a new plan?") : t("Delete future workouts?")}
            </DialogTitle>
            <DialogDescription className="hito-body-md text-secondary">
              {pendingAction === "start"
                ? t("Eligible upcoming workouts will be removed before plan creation opens.")
                : t("This removes eligible upcoming Calendar workouts.")}
            </DialogDescription>
          </DialogHeader>
          <div className="hito-product-dialog-body">
            <p className="hito-body-md text-secondary">
              {t("Past workouts, results, and FIT records are not touched.")}
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
              {t("Cancel")}
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
              {pendingAction === "start" ? t("Start a new plan") : t("Delete future workouts")}
            </HitoButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
