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

export type AdminCaptureTargetRole = (typeof adminCaptureTargetRoles)[number];
