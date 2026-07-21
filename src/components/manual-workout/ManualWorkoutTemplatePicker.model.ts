import type { ManualWorkoutTemplateCatalogResult } from "@/lib/manual-workout-authoring";

export const MANUAL_ADD_MENU_CONTENT_CLASS = "hito-manual-workout-menu-add";
export const MANUAL_ADD_MENU_ITEM_CLASS = "min-h-14 items-start gap-3 px-3 py-2.5 text-left";
export const MANUAL_ADD_MENU_ICON_CLASS = "mt-0.5 shrink-0";

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
