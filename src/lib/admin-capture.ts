import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Json } from "@/lib/supabase/database";

export const adminCaptureItemTypes = ["bug", "change_request", "context_capture"] as const;
export const adminCaptureStatuses = [
  "new",
  "in_review",
  "ready_for_codex",
  "done",
  "archived",
] as const;
export const adminCapturePriorities = ["low", "medium", "high", "urgent"] as const;
export const adminCaptureTargetRoles = [
  "architect",
  "backend",
  "frontend",
  "designer",
  "copy",
  "qa",
  "prompt_engineer",
  "running_coach",
] as const;
export const adminCaptureAssetKinds = [
  "viewport_screenshot",
  "full_page_screenshot",
  "element_crop",
] as const;

export type AdminCaptureItemType = (typeof adminCaptureItemTypes)[number];
export type AdminCaptureStatus = (typeof adminCaptureStatuses)[number];
export type AdminCapturePriority = (typeof adminCapturePriorities)[number];
export type AdminCaptureTargetRole = (typeof adminCaptureTargetRoles)[number];
export type AdminCaptureAssetKind = (typeof adminCaptureAssetKinds)[number];

export type AdminCaptureFailureReason =
  | "authentication_required"
  | "admin_required"
  | "admin_unavailable"
  | "supabase_admin_unavailable"
  | "invalid_payload"
  | "capture_not_found"
  | "capture_load_failed"
  | "capture_create_failed"
  | "capture_update_failed"
  | "repo_derived_read_only"
  | "prompt_not_ready"
  | "prompt_generation_failed";

export interface AdminCaptureAssetView {
  id: string;
  assetKind: AdminCaptureAssetKind;
  storageBucket: string;
  storagePath: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  byteSize: number | null;
  checksum: string | null;
  createdAt: string;
}

export interface AdminCaptureItemView {
  id: string;
  itemType: AdminCaptureItemType;
  status: AdminCaptureStatus;
  priority: AdminCapturePriority | null;
  targetRole: AdminCaptureTargetRole | null;
  title: string;
  note: string;
  pageUrl: string;
  route: string | null;
  createdByUserId: string;
  createdByLabel: string | null;
  viewport: {
    width: number | null;
    height: number | null;
  };
  selectedElement: {
    text: string | null;
    selector: string | null;
    domPath: string | null;
    nearbyHeading: string | null;
    boundingRect: Json | null;
  };
  metadata: Json;
  source: "captured_ui" | "quick_note" | "repo_import";
  promptReady: boolean;
  assetCount: number;
  assets: AdminCaptureAssetView[];
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface AdminCaptureBacklogView {
  generatedAt: string;
  total: number;
  shown: number;
  items: AdminCaptureItemView[];
  statusCounts: Record<AdminCaptureStatus, number>;
}

export interface AdminCaptureCopyPromptView {
  itemId: string;
  targetRole: AdminCaptureTargetRole;
  generatedAt: string;
  prompt: string;
  contextSummary: string;
}

export type AdminCaptureResult<T> =
  | ({ ok: true } & T)
  | {
      ok: false;
      reason: AdminCaptureFailureReason;
      message: string;
      issues?: string[];
    };

export const adminCaptureItemTypeSchema = z.enum(adminCaptureItemTypes);
export const adminCaptureStatusSchema = z.enum(adminCaptureStatuses);
export const adminCapturePrioritySchema = z.enum(adminCapturePriorities);
export const adminCaptureTargetRoleSchema = z.enum(adminCaptureTargetRoles);
export const adminCaptureAssetKindSchema = z.enum(adminCaptureAssetKinds);

const optionalTrimmedString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((value) => (value ? value : null));

export const adminCaptureBoundingRectSchema = z
  .object({
    x: z.number().finite().optional(),
    y: z.number().finite().optional(),
    width: z.number().finite().nonnegative().optional(),
    height: z.number().finite().nonnegative().optional(),
    top: z.number().finite().optional(),
    right: z.number().finite().optional(),
    bottom: z.number().finite().optional(),
    left: z.number().finite().optional(),
  })
  .passthrough()
  .nullable()
  .optional();

export const adminCaptureMetadataSchema = z
  .record(z.unknown())
  .optional()
  .default({})
  .superRefine((value, context) => {
    const serialized = JSON.stringify(value);

    if (serialized.length > 8000) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Capture metadata must stay under 8000 serialized characters.",
      });
    }
  });

export const adminCaptureCreateInputSchema = z
  .object({
    itemType: adminCaptureItemTypeSchema.default("context_capture"),
    priority: adminCapturePrioritySchema.nullable().optional(),
    targetRole: adminCaptureTargetRoleSchema.nullable().optional(),
    title: optionalTrimmedString(160),
    note: z.string().trim().min(1).max(4000),
    pageUrl: z.string().trim().max(2048).nullable().optional(),
    route: optionalTrimmedString(512),
    viewportWidth: z.number().int().min(1).max(10000).nullable().optional(),
    viewportHeight: z.number().int().min(1).max(10000).nullable().optional(),
    elementText: optionalTrimmedString(1000),
    selector: optionalTrimmedString(1000),
    domPath: optionalTrimmedString(1500),
    nearbyHeading: optionalTrimmedString(300),
    boundingRect: adminCaptureBoundingRectSchema,
    metadata: adminCaptureMetadataSchema,
  })
  .strict();

export const adminCaptureListInputSchema = z.preprocess(
  (value) => value ?? {},
  z
    .object({
      status: z.union([adminCaptureStatusSchema, z.literal("all")]).default("new"),
      itemType: adminCaptureItemTypeSchema.nullable().optional(),
      priority: adminCapturePrioritySchema.nullable().optional(),
      targetRole: adminCaptureTargetRoleSchema.nullable().optional(),
      includeArchived: z.boolean().default(false),
      search: z.string().trim().max(120).nullable().optional(),
      limit: z.number().int().min(1).max(200).default(50),
    })
    .strict(),
);

export const adminCaptureItemIdInputSchema = z
  .object({
    id: z.string().uuid(),
  })
  .strict();

export const adminCaptureTriageUpdateInputSchema = z
  .object({
    id: z.string().uuid(),
    itemType: adminCaptureItemTypeSchema.optional(),
    status: adminCaptureStatusSchema.optional(),
    priority: adminCapturePrioritySchema.nullable().optional(),
    targetRole: adminCaptureTargetRoleSchema.nullable().optional(),
    title: optionalTrimmedString(160).optional(),
  })
  .strict();

export const adminCaptureNoteUpdateInputSchema = z
  .object({
    id: z.string().uuid(),
    note: z.string().trim().min(1).max(4000),
  })
  .strict();

export const adminCaptureNoteAppendInputSchema = z
  .object({
    id: z.string().uuid(),
    note: z.string().trim().min(1).max(1200),
  })
  .strict();

export type AdminCaptureCreateInput = z.output<typeof adminCaptureCreateInputSchema>;
export type AdminCaptureListInput = z.output<typeof adminCaptureListInputSchema>;
export type AdminCaptureItemIdInput = z.output<typeof adminCaptureItemIdInputSchema>;
export type AdminCaptureTriageUpdateInput = z.output<typeof adminCaptureTriageUpdateInputSchema>;
export type AdminCaptureNoteUpdateInput = z.output<typeof adminCaptureNoteUpdateInputSchema>;
export type AdminCaptureNoteAppendInput = z.output<typeof adminCaptureNoteAppendInputSchema>;

export const getAdminCaptureAvailability = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminCaptureResult<{ enabled: true }>> => {
    return getAdminCaptureAvailabilityServer();
  },
);

export const listAdminCaptureBacklog = createServerFn({ method: "GET" })
  .inputValidator((value: unknown) => adminCaptureListInputSchema.parse(value))
  .handler(async ({ data }): Promise<AdminCaptureResult<{ view: AdminCaptureBacklogView }>> => {
    return listAdminCaptureBacklogServer(data);
  });

export const getAdminCaptureItem = createServerFn({ method: "GET" })
  .inputValidator((value: unknown) => adminCaptureItemIdInputSchema.parse(value))
  .handler(async ({ data }): Promise<AdminCaptureResult<{ item: AdminCaptureItemView }>> => {
    return getAdminCaptureItemServer(data);
  });

export const createAdminCaptureItem = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => adminCaptureCreateInputSchema.parse(value))
  .handler(async ({ data }): Promise<AdminCaptureResult<{ item: AdminCaptureItemView }>> => {
    return createAdminCaptureItemServer(data);
  });

export const updateAdminCaptureItemTriage = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => adminCaptureTriageUpdateInputSchema.parse(value))
  .handler(async ({ data }): Promise<AdminCaptureResult<{ item: AdminCaptureItemView }>> => {
    return updateAdminCaptureItemTriageServer(data);
  });

export const updateAdminCaptureItemNote = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => adminCaptureNoteUpdateInputSchema.parse(value))
  .handler(async ({ data }): Promise<AdminCaptureResult<{ item: AdminCaptureItemView }>> => {
    return updateAdminCaptureItemNoteServer(data);
  });

export const appendAdminCaptureItemNote = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => adminCaptureNoteAppendInputSchema.parse(value))
  .handler(async ({ data }): Promise<AdminCaptureResult<{ item: AdminCaptureItemView }>> => {
    return appendAdminCaptureItemNoteServer(data);
  });

export const getAdminCaptureCopyPrompt = createServerFn({ method: "GET" })
  .inputValidator((value: unknown) => adminCaptureItemIdInputSchema.parse(value))
  .handler(
    async ({ data }): Promise<AdminCaptureResult<{ prompt: AdminCaptureCopyPromptView }>> => {
      return getAdminCaptureCopyPromptServer(data);
    },
  );

const getAdminCaptureAvailabilityServer = createServerOnlyFn(async () => {
  const { getAdminCaptureAvailabilityForCurrentRequest } =
    await import("@/lib/admin-capture.server");

  return getAdminCaptureAvailabilityForCurrentRequest();
});

const listAdminCaptureBacklogServer = createServerOnlyFn(async (input: AdminCaptureListInput) => {
  const { listAdminCaptureBacklogForCurrentRequest } = await import("@/lib/admin-capture.server");

  return listAdminCaptureBacklogForCurrentRequest(input);
});

const getAdminCaptureItemServer = createServerOnlyFn(async (input: AdminCaptureItemIdInput) => {
  const { getAdminCaptureItemForCurrentRequest } = await import("@/lib/admin-capture.server");

  return getAdminCaptureItemForCurrentRequest(input);
});

const createAdminCaptureItemServer = createServerOnlyFn(async (input: AdminCaptureCreateInput) => {
  const { createAdminCaptureItemForCurrentRequest } = await import("@/lib/admin-capture.server");

  return createAdminCaptureItemForCurrentRequest(input);
});

const updateAdminCaptureItemTriageServer = createServerOnlyFn(
  async (input: AdminCaptureTriageUpdateInput) => {
    const { updateAdminCaptureItemTriageForCurrentRequest } =
      await import("@/lib/admin-capture.server");

    return updateAdminCaptureItemTriageForCurrentRequest(input);
  },
);

const updateAdminCaptureItemNoteServer = createServerOnlyFn(
  async (input: AdminCaptureNoteUpdateInput) => {
    const { updateAdminCaptureItemNoteForCurrentRequest } =
      await import("@/lib/admin-capture.server");

    return updateAdminCaptureItemNoteForCurrentRequest(input);
  },
);

const appendAdminCaptureItemNoteServer = createServerOnlyFn(
  async (input: AdminCaptureNoteAppendInput) => {
    const { appendAdminCaptureItemNoteForCurrentRequest } =
      await import("@/lib/admin-capture.server");

    return appendAdminCaptureItemNoteForCurrentRequest(input);
  },
);

const getAdminCaptureCopyPromptServer = createServerOnlyFn(
  async (input: AdminCaptureItemIdInput) => {
    const { getAdminCaptureCopyPromptForCurrentRequest } =
      await import("@/lib/admin-capture.server");

    return getAdminCaptureCopyPromptForCurrentRequest(input);
  },
);
