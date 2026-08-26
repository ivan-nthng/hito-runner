import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requirePersistedUserIdForCurrentRequest } from "@/lib/request-persisted-user";

const hydrateInputSchema = z
  .object({
    activityId: z.string().uuid(),
    title: z.string().trim().min(1).max(80).optional().nullable(),
  })
  .strict();

const confirmInputSchema = z
  .object({
    activityId: z.string().uuid(),
    reviewToken: z.string().trim().min(32),
    reviewChecksum: z.string().regex(/^[0-9a-f]{64}$/),
    intent: z.enum(["materialize_on_rest", "associate_existing"]),
  })
  .strict();

export const hydrateUnplannedActivityReview = createServerFn({ method: "POST" })
  .inputValidator((value) => hydrateInputSchema.parse(value))
  .handler(async ({ data }) => {
    const { hydrateUnplannedActivityReviewForUser } =
      await import("@/lib/runner-activity/unplanned-review.server");
    return hydrateUnplannedActivityReviewForUser({
      userId: await requirePersistedUserIdForCurrentRequest(),
      activityId: data.activityId,
      title: data.title,
    });
  });

export const confirmUnplannedActivityReview = createServerFn({ method: "POST" })
  .inputValidator((value) => confirmInputSchema.parse(value))
  .handler(async ({ data }) => {
    const { confirmUnplannedActivityReviewForUser } =
      await import("@/lib/runner-activity/unplanned-review.server");
    return confirmUnplannedActivityReviewForUser({
      userId: await requirePersistedUserIdForCurrentRequest(),
      ...data,
    });
  });
