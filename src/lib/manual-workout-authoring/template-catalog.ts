import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getCurrentManualWorkoutAuthoringUserId } from "@/lib/manual-workout-authoring/request-auth";
import {
  listManualWorkoutSavedTemplatesForUser,
  type ManualWorkoutSavedTemplateDependencies,
  type ManualWorkoutSavedTemplateView,
} from "@/lib/manual-workout-authoring/saved-templates";
import {
  VISIBLE_MANUAL_WORKOUT_STARTER_TEMPLATE_KEYS,
  getManualWorkoutTemplate,
  type ManualWorkoutTemplate,
} from "@/lib/manual-workout-authoring/templates";
import type { ManualWorkoutTemplateKey } from "@/lib/manual-workout-authoring/schema";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export const MANUAL_WORKOUT_TEMPLATE_CATALOG_SOURCE_KIND =
  "manual_workout_template_catalog_v1" as const;

const visibleBuiltInTemplateKeySchema = z.enum(VISIBLE_MANUAL_WORKOUT_STARTER_TEMPLATE_KEYS);
const builtInVisibilityInputSchema = z
  .object({ templateKey: visibleBuiltInTemplateKeySchema })
  .strict();

export type ManualWorkoutTemplateVisibilityRepository = {
  getHiddenBuiltInTemplateKeys: (userId: string) => Promise<string[]>;
  setHiddenBuiltInTemplateKeys: (
    userId: string,
    templateKeys: ManualWorkoutTemplateKey[],
  ) => Promise<void>;
};

export type ManualWorkoutTemplateCatalogDependencies = ManualWorkoutSavedTemplateDependencies & {
  visibilityRepository?: ManualWorkoutTemplateVisibilityRepository;
};

export type ManualWorkoutTemplateCatalogResult =
  | {
      ok: true;
      status: "catalog_ready";
      sourceKind: typeof MANUAL_WORKOUT_TEMPLATE_CATALOG_SOURCE_KIND;
      visibleBuiltInTemplates: ManualWorkoutTemplate[];
      hiddenBuiltInTemplates: ManualWorkoutTemplate[];
      personalTemplates: ManualWorkoutSavedTemplateView[];
      safety: {
        currentUserScoped: true;
        backendRegistryOwned: true;
        callsOpenAi: false;
      };
    }
  | ManualWorkoutTemplateCatalogBlockedResult;

export type ManualWorkoutTemplateVisibilityResult =
  | {
      ok: true;
      status: "visibility_updated";
      persisted: true;
      sourceKind: typeof MANUAL_WORKOUT_TEMPLATE_CATALOG_SOURCE_KIND;
      hiddenBuiltInTemplateKeys: ManualWorkoutTemplateKey[];
      safety: {
        currentUserScoped: true;
        globalBuiltInsDeleted: false;
        callsOpenAi: false;
      };
    }
  | ManualWorkoutTemplateCatalogBlockedResult;

type ManualWorkoutTemplateCatalogBlockedResult = {
  ok: false;
  status: "blocked";
  persisted: false;
  reason: "unauthenticated" | "invalid_input" | "profile_not_found" | "persistence_failed";
  message: string;
  sourceKind: typeof MANUAL_WORKOUT_TEMPLATE_CATALOG_SOURCE_KIND;
};

export const listManualWorkoutTemplateCatalog = createServerFn({ method: "GET" }).handler(
  async (): Promise<ManualWorkoutTemplateCatalogResult> => {
    const userId = await getCurrentManualWorkoutAuthoringUserId();
    return userId
      ? listManualWorkoutTemplateCatalogForUser(userId)
      : templateCatalogBlocked("unauthenticated", "Sign in before viewing workout templates.");
  },
);

export const hideManualWorkoutBuiltInTemplate = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => value)
  .handler(async ({ data }): Promise<ManualWorkoutTemplateVisibilityResult> => {
    const userId = await getCurrentManualWorkoutAuthoringUserId();
    return userId
      ? updateManualWorkoutBuiltInVisibilityForUser(userId, data, "hide")
      : templateCatalogBlocked("unauthenticated", "Sign in before hiding workout templates.");
  });

export const restoreManualWorkoutBuiltInTemplate = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => value)
  .handler(async ({ data }): Promise<ManualWorkoutTemplateVisibilityResult> => {
    const userId = await getCurrentManualWorkoutAuthoringUserId();
    return userId
      ? updateManualWorkoutBuiltInVisibilityForUser(userId, data, "restore")
      : templateCatalogBlocked("unauthenticated", "Sign in before restoring workout templates.");
  });

export const restoreAllManualWorkoutBuiltInTemplates = createServerFn({ method: "POST" }).handler(
  async (): Promise<ManualWorkoutTemplateVisibilityResult> => {
    const userId = await getCurrentManualWorkoutAuthoringUserId();
    return userId
      ? restoreAllManualWorkoutBuiltInTemplatesForUser(userId)
      : templateCatalogBlocked("unauthenticated", "Sign in before restoring workout templates.");
  },
);

export async function listManualWorkoutTemplateCatalogForUser(
  userId: string,
  dependencies: ManualWorkoutTemplateCatalogDependencies = {},
): Promise<ManualWorkoutTemplateCatalogResult> {
  const visibilityRepository =
    dependencies.visibilityRepository ?? createSupabaseTemplateVisibilityRepository();

  try {
    const [hiddenKeys, personalResult] = await Promise.all([
      visibilityRepository.getHiddenBuiltInTemplateKeys(userId),
      listManualWorkoutSavedTemplatesForUser(userId, dependencies),
    ]);
    if (!personalResult.ok) {
      return templateCatalogBlocked(
        personalResult.reason === "not_found" ? "profile_not_found" : "persistence_failed",
        personalResult.message,
      );
    }

    const hidden = new Set(normalizeVisibleBuiltInKeys(hiddenKeys));
    return {
      ok: true,
      status: "catalog_ready",
      sourceKind: MANUAL_WORKOUT_TEMPLATE_CATALOG_SOURCE_KIND,
      visibleBuiltInTemplates: VISIBLE_MANUAL_WORKOUT_STARTER_TEMPLATE_KEYS.filter(
        (key) => !hidden.has(key),
      ).map(getManualWorkoutTemplate),
      hiddenBuiltInTemplates: VISIBLE_MANUAL_WORKOUT_STARTER_TEMPLATE_KEYS.filter((key) =>
        hidden.has(key),
      ).map(getManualWorkoutTemplate),
      personalTemplates: personalResult.templates,
      safety: {
        currentUserScoped: true,
        backendRegistryOwned: true,
        callsOpenAi: false,
      },
    };
  } catch {
    return templateCatalogBlocked("persistence_failed", "Workout templates could not be loaded.");
  }
}

export async function updateManualWorkoutBuiltInVisibilityForUser(
  userId: string,
  input: unknown,
  mode: "hide" | "restore",
  dependencies: ManualWorkoutTemplateCatalogDependencies = {},
): Promise<ManualWorkoutTemplateVisibilityResult> {
  const parsed = builtInVisibilityInputSchema.safeParse(input);
  if (!parsed.success) {
    return templateCatalogBlocked("invalid_input", "Choose a supported built-in workout template.");
  }

  const repository =
    dependencies.visibilityRepository ?? createSupabaseTemplateVisibilityRepository();

  try {
    const hidden = new Set(
      normalizeVisibleBuiltInKeys(await repository.getHiddenBuiltInTemplateKeys(userId)),
    );
    if (mode === "hide") hidden.add(parsed.data.templateKey);
    else hidden.delete(parsed.data.templateKey);
    const hiddenKeys = normalizeVisibleBuiltInKeys([...hidden]);
    await repository.setHiddenBuiltInTemplateKeys(userId, hiddenKeys);
    return templateVisibilityUpdated(hiddenKeys);
  } catch {
    return templateCatalogBlocked(
      "persistence_failed",
      "Built-in workout template visibility could not be updated.",
    );
  }
}

export async function restoreAllManualWorkoutBuiltInTemplatesForUser(
  userId: string,
  dependencies: ManualWorkoutTemplateCatalogDependencies = {},
): Promise<ManualWorkoutTemplateVisibilityResult> {
  const repository =
    dependencies.visibilityRepository ?? createSupabaseTemplateVisibilityRepository();

  try {
    await repository.setHiddenBuiltInTemplateKeys(userId, []);
    return templateVisibilityUpdated([]);
  } catch {
    return templateCatalogBlocked(
      "persistence_failed",
      "Built-in workout templates could not be restored.",
    );
  }
}

function createSupabaseTemplateVisibilityRepository(): ManualWorkoutTemplateVisibilityRepository {
  const supabase = createAdminSupabaseClient();
  return {
    async getHiddenBuiltInTemplateKeys(userId) {
      const result = await supabase
        .from("runner_profiles")
        .select("hidden_manual_workout_template_keys")
        .eq("user_id", userId)
        .maybeSingle();
      if (result.error) throw new Error(result.error.message);
      if (!result.data) throw new Error("Runner profile not found.");
      return result.data.hidden_manual_workout_template_keys;
    },
    async setHiddenBuiltInTemplateKeys(userId, templateKeys) {
      const result = await supabase
        .from("runner_profiles")
        .update({ hidden_manual_workout_template_keys: templateKeys })
        .eq("user_id", userId)
        .select("user_id")
        .maybeSingle();
      if (result.error) throw new Error(result.error.message);
      if (!result.data) throw new Error("Runner profile not found.");
    },
  };
}

function normalizeVisibleBuiltInKeys(values: readonly string[]): ManualWorkoutTemplateKey[] {
  const input = new Set(values);
  return VISIBLE_MANUAL_WORKOUT_STARTER_TEMPLATE_KEYS.filter((key) => input.has(key));
}

function templateVisibilityUpdated(
  hiddenBuiltInTemplateKeys: ManualWorkoutTemplateKey[],
): Extract<ManualWorkoutTemplateVisibilityResult, { ok: true }> {
  return {
    ok: true,
    status: "visibility_updated",
    persisted: true,
    sourceKind: MANUAL_WORKOUT_TEMPLATE_CATALOG_SOURCE_KIND,
    hiddenBuiltInTemplateKeys,
    safety: { currentUserScoped: true, globalBuiltInsDeleted: false, callsOpenAi: false },
  };
}

function templateCatalogBlocked(
  reason: ManualWorkoutTemplateCatalogBlockedResult["reason"],
  message: string,
): ManualWorkoutTemplateCatalogBlockedResult {
  return {
    ok: false,
    status: "blocked",
    persisted: false,
    reason,
    message,
    sourceKind: MANUAL_WORKOUT_TEMPLATE_CATALOG_SOURCE_KIND,
  };
}
