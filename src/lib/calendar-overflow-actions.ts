import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { retainImportedPlanCandidateForUser } from "@/lib/active-plan-persistence";
import {
  CalendarPersistenceRejection,
  clearAtomicCalendarFutureWorkouts,
} from "@/lib/active-plan-lifecycle-persistence";
import { importedPlanSchema, validateImportedPlanJson } from "@/lib/imported-plan";
import {
  buildCalendarWorkoutExportPayload,
  buildPlanExportDocument,
  type PlanExportDocument,
} from "@/lib/plan-export";
import { requirePersistedUserIdForCurrentRequest } from "@/lib/request-persisted-user";
import { getRunnerCalendarDateForUserId } from "@/lib/runner-calendar-context";
import { getCalendarWorkoutsWithLogsForUser } from "@/lib/runner-calendar-persistence";
import { digestSha256Hex, stableJsonStringify } from "@/lib/review-token-signing";

const uploadCalendarPlanJsonInputSchema = z.object({ rawJson: z.string().trim().min(1) }).strict();
const deleteCalendarFutureWorkoutsInputSchema = z
  .object({ confirmation: z.literal("delete_future_workouts") })
  .strict();
const startNewCalendarPlanInputSchema = z
  .object({ confirmation: z.literal("start_new_plan") })
  .strict();

type CalendarFutureMutationFailureReason =
  | "unauthenticated"
  | "protected_future_schedule"
  | "persistence_failed";

export class CalendarFutureWorkoutsExportUnavailableError extends Error {
  constructor() {
    super("There are no upcoming Calendar workouts to download.");
    this.name = "CalendarFutureWorkoutsExportUnavailableError";
  }
}

export const uploadCalendarPlanJson = createServerFn({ method: "POST" })
  .validator((value: unknown) => uploadCalendarPlanJsonInputSchema.parse(value))
  .handler(async ({ data }) => {
    let userId: string;
    try {
      userId = await requirePersistedUserIdForCurrentRequest();
    } catch {
      return {
        ok: false as const,
        status: "blocked" as const,
        reason: "unauthenticated" as const,
        message: "Sign in before uploading a plan.",
        calendarMutated: false as const,
      };
    }

    const parsed = validateImportedPlanJson(data.rawJson);
    if (!parsed) {
      return {
        ok: false as const,
        status: "blocked" as const,
        reason: "invalid_json" as const,
        message: "The selected file is not valid JSON.",
        calendarMutated: false as const,
      };
    }

    if (!parsed.success) {
      return {
        ok: false as const,
        status: "blocked" as const,
        reason: "invalid_plan" as const,
        message: "The selected file is not a valid Hito training-plan-v2 plan.",
        calendarMutated: false as const,
      };
    }

    try {
      const canonicalPlan = importedPlanSchema.parse(parsed.data);
      const record = await retainImportedPlanCandidateForUser({
        userId,
        canonicalPlan,
        reviewChecksum: await digestSha256Hex(stableJsonStringify(canonicalPlan)),
      });

      return {
        ok: true as const,
        status: "saved" as const,
        record: {
          id: record.id,
          title: record.title,
          workoutCount: canonicalPlan.planned_workouts.filter(
            (workout) => workout.workout_type !== "rest",
          ).length,
        },
        calendarMutated: false as const,
        callsOpenAi: false as const,
      };
    } catch {
      return {
        ok: false as const,
        status: "blocked" as const,
        reason: "persistence_failed" as const,
        message: "The plan could not be saved to Plans. Your Calendar was not changed.",
        calendarMutated: false as const,
      };
    }
  });

export const deleteCalendarFutureWorkouts = createServerFn({ method: "POST" })
  .validator((value: unknown) => deleteCalendarFutureWorkoutsInputSchema.parse(value))
  .handler(async () => clearCalendarFutureWorkoutsForCurrentRequest(false));

export const startNewCalendarPlan = createServerFn({ method: "POST" })
  .validator((value: unknown) => startNewCalendarPlanInputSchema.parse(value))
  .handler(async () => clearCalendarFutureWorkoutsForCurrentRequest(true));

export async function exportFutureCalendarWorkoutsForUser(
  userId: string,
): Promise<PlanExportDocument> {
  const currentDate = await getRunnerCalendarDateForUserId(userId);
  const calendar = await getCalendarWorkoutsWithLogsForUser(userId);
  const futureWorkouts = calendar.workouts.filter((workout) => workout.workout_date >= currentDate);

  if (futureWorkouts.length === 0) {
    throw new CalendarFutureWorkoutsExportUnavailableError();
  }

  const exportPayload = buildCalendarWorkoutExportPayload({ workouts: futureWorkouts });
  const document = buildPlanExportDocument(exportPayload, "json");

  importedPlanSchema.parse(JSON.parse(document.body));
  return document;
}

async function clearCalendarFutureWorkoutsForCurrentRequest(opensPlanCreation: boolean) {
  let userId: string;
  try {
    userId = await requirePersistedUserIdForCurrentRequest();
  } catch {
    return clearFailure("unauthenticated", "Sign in before changing upcoming Calendar workouts.");
  }

  return clearCalendarFutureWorkoutsForUser(userId, opensPlanCreation);
}

export async function clearCalendarFutureWorkoutsForUser(
  userId: string,
  opensPlanCreation: boolean,
): Promise<
  | {
      ok: true;
      status: "cleared";
      currentDate: string;
      clearedWorkoutCount: number;
      opensPlanCreation: boolean;
      callsOpenAi: false;
    }
  | {
      ok: false;
      status: "blocked";
      reason: CalendarFutureMutationFailureReason;
      message: string;
      opensPlanCreation: false;
    }
> {
  try {
    const currentDate = await getRunnerCalendarDateForUserId(userId);
    const result = await clearAtomicCalendarFutureWorkouts({ userId, currentDate });

    return {
      ok: true,
      status: "cleared",
      currentDate: result.currentDate,
      clearedWorkoutCount: result.clearedWorkoutCount,
      opensPlanCreation,
      callsOpenAi: false,
    };
  } catch (error) {
    if (error instanceof CalendarPersistenceRejection) {
      return clearFailure(
        error.reason === "protected_future_schedule"
          ? "protected_future_schedule"
          : "persistence_failed",
        error.message,
      );
    }

    return clearFailure(
      "persistence_failed",
      "Upcoming Calendar workouts could not be changed. Nothing was removed.",
    );
  }
}

function clearFailure(reason: CalendarFutureMutationFailureReason, message: string) {
  return {
    ok: false as const,
    status: "blocked" as const,
    reason,
    message,
    opensPlanCreation: false as const,
  };
}
