import type { ManualWorkoutTemplateCatalogResult } from "@/lib/manual-workout-authoring";

export type ManualTemplateCatalog = Extract<ManualWorkoutTemplateCatalogResult, { ok: true }>;

export type ManualTemplateCatalogState = {
  status: "idle" | "loading" | "ready" | "failed";
  catalog: ManualTemplateCatalog | null;
  message: string | null;
};

export const EMPTY_TEMPLATE_CATALOG_STATE: ManualTemplateCatalogState = {
  status: "idle",
  catalog: null,
  message: null,
};
