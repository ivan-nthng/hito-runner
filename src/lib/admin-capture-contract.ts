export const adminCaptureTargetRoles = [
  "architect",
  "backend",
  "frontend",
  "designer",
  "copy",
  "qa",
  "product",
  "running_coach",
] as const;

export const adminCaptureItemTypes = ["bug", "change_request", "context_capture"] as const;
export const adminCaptureStatuses = [
  "new",
  "in_review",
  "ready_for_codex",
  "done",
  "archived",
] as const;
export const adminCaptureActiveStatuses = ["new", "in_review", "ready_for_codex"] as const;
export const adminCapturePriorities = ["low", "medium", "high", "urgent"] as const;

export type AdminCaptureTargetRole = (typeof adminCaptureTargetRoles)[number];
export type AdminCaptureItemType = (typeof adminCaptureItemTypes)[number];
export type AdminCaptureStatus = (typeof adminCaptureStatuses)[number];
export type AdminCapturePriority = (typeof adminCapturePriorities)[number];
