import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  applySavedPlanRecordForUser,
  getSavedPlanRecordForUser,
  listSavedPlanLibraryForUser,
  logicallyRemoveSavedPlanRecordForUser,
  readSavedPlanPayload,
} from "@/lib/active-plan-persistence";
import type { PersistedPlannedWorkoutRow } from "@/lib/runner-calendar-persistence";
import { isRealIsoDate } from "@/lib/first-plan-authoring-utils";
import { buildImportedPlanSeed } from "@/lib/imported-plan";
import { buildPersistedWorkoutInsertRows } from "@/lib/persisted-plan-replacement";
import {
  buildActivePlanExportPayload,
  buildPlanExportDocument,
  type PlanExportDocument,
} from "@/lib/plan-export";
import { requirePersistedUserIdForCurrentRequest } from "@/lib/request-persisted-user";
import { WEEKDAY_NAMES } from "@/lib/weekday-rest-invariants";

const savedPlanLibraryQuerySchema = z
  .object({
    search: z.string().trim().max(120).optional().nullable(),
    recordState: z.enum(["available", "removed", "all"]).optional(),
    sourceKind: z.string().trim().max(120).optional().nullable(),
    sort: z.enum(["created_at", "title"]).optional(),
    direction: z.enum(["asc", "desc"]).optional(),
  })
  .strict();

const savedPlanSelectionSchema = z.object({ savedPlanId: z.string().uuid() }).strict();
const savedPlanStartDateSchema = z
  .string()
  .trim()
  .refine(isRealIsoDate, "The requested Start date must be a real YYYY-MM-DD date.");
const savedPlanFixedRestDaysSchema = z
  .array(z.enum(WEEKDAY_NAMES))
  .max(6, "Leave at least one weekday available for running.")
  .refine(
    (weekdays) => new Set(weekdays).size === weekdays.length,
    "One-time fixed rest days must not contain duplicates.",
  );

export const savedPlanStartInputSchema = z
  .object({
    savedPlanId: z.string().uuid(),
    intent: z.enum(["apply_if_future_empty", "replace_future_workouts", "keep_future_workouts"]),
    requestedStartDate: savedPlanStartDateSchema.optional().nullable(),
    fixedRestDays: savedPlanFixedRestDaysSchema.optional(),
    preferredLongRunDay: z.enum(WEEKDAY_NAMES).optional().nullable(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.preferredLongRunDay && value.fixedRestDays?.includes(value.preferredLongRunDay)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["preferredLongRunDay"],
        message: "Preferred long-run day cannot be one of the fixed rest days.",
      });
    }
  });

export const listSavedPlanLibrary = createServerFn({ method: "GET" })
  .validator((value: unknown) => savedPlanLibraryQuerySchema.parse(value))
  .handler(async ({ data }) => ({
    ok: true as const,
    records: await listSavedPlanLibraryForUser(
      await requirePersistedUserIdForCurrentRequest(),
      data,
    ),
  }));

export const removeSavedPlanRecord = createServerFn({ method: "POST" })
  .validator((value: unknown) => savedPlanSelectionSchema.parse(value))
  .handler(async ({ data }) => ({
    ok: true as const,
    record: await logicallyRemoveSavedPlanRecordForUser(
      await requirePersistedUserIdForCurrentRequest(),
      data.savedPlanId,
    ),
  }));

export const startSavedPlanRecord = createServerFn({ method: "POST" })
  .validator((value: unknown) => savedPlanStartInputSchema.parse(value))
  .handler(async ({ data }) =>
    applySavedPlanRecordForUser(
      await requirePersistedUserIdForCurrentRequest(),
      data.savedPlanId,
      data.intent,
      {
        ...(data.requestedStartDate === undefined
          ? {}
          : { requestedStartDate: data.requestedStartDate }),
        ...(data.fixedRestDays === undefined ? {} : { fixedRestDays: data.fixedRestDays }),
        ...(data.preferredLongRunDay === undefined
          ? {}
          : { preferredLongRunDay: data.preferredLongRunDay }),
      },
    ),
  );

export interface ExportActivePlanResult extends PlanExportDocument {
  ok: true;
}

export async function exportSavedPlanForUser(
  userId: string,
  savedPlanId: string,
  format: "json" | "markdown",
): Promise<ExportActivePlanResult> {
  const planCycle = await getSavedPlanRecordForUser(userId, savedPlanId);
  if (!planCycle) {
    throw new Error("The selected saved plan was not found.");
  }

  const seed = buildImportedPlanSeed(readSavedPlanPayload(planCycle));
  const workouts = buildPersistedWorkoutInsertRows(planCycle.id, userId, seed.workouts).map(
    (workout, index) =>
      ({
        ...workout,
        id: `${planCycle.id.slice(0, 24)}${index.toString(16).padStart(8, "0")}`,
        created_at: planCycle.created_at,
      }) as PersistedPlannedWorkoutRow,
  );
  const payload = buildActivePlanExportPayload({ planCycle, workouts });
  const document = buildPlanExportDocument(payload, format);

  return {
    ok: true,
    ...document,
  };
}
