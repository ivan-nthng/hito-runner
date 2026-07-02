import type { ManualWorkoutSavedTemplateView } from "@/lib/manual-workout-authoring";

export const MANUAL_ADD_MENU_CONTENT_CLASS = "hito-manual-workout-menu-add";
export const MANUAL_ADD_MENU_SUBCONTENT_CLASS = "hito-manual-workout-menu-template";
export const MANUAL_ADD_MENU_ITEM_CLASS = "min-h-14 items-start gap-3 px-3 py-2.5 text-left";
export const MANUAL_TEMPLATE_MENU_ITEM_CLASS = "text-left";
export const MANUAL_ADD_MENU_ICON_CLASS = "mt-0.5 shrink-0";

export type ManualSavedTemplatesState = {
  status: "idle" | "loading" | "ready" | "failed";
  templates: ManualWorkoutSavedTemplateView[];
  message: string | null;
};

export const EMPTY_SAVED_TEMPLATES_STATE: ManualSavedTemplatesState = {
  status: "idle",
  templates: [],
  message: null,
};
