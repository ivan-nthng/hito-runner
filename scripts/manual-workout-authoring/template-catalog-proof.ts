import assert from "node:assert/strict";
import {
  VISIBLE_MANUAL_WORKOUT_STARTER_TEMPLATE_KEYS,
  listManualWorkoutTemplateCatalogForUser,
  restoreAllManualWorkoutBuiltInTemplatesForUser,
  updateManualWorkoutBuiltInVisibilityForUser,
  type ManualWorkoutSavedTemplateRepository,
  type ManualWorkoutTemplateVisibilityRepository,
} from "../../src/lib/manual-workout-authoring";
import type { ManualWorkoutTemplateKey } from "../../src/lib/manual-workout-authoring/schema";

export async function validateManualWorkoutTemplateCatalogContract() {
  const userId = "00000000-0000-4000-8000-000000000321";
  const otherUserId = "00000000-0000-4000-8000-000000000322";
  const hiddenByUser = new Map<string, ManualWorkoutTemplateKey[]>();
  const visibilityRepository: ManualWorkoutTemplateVisibilityRepository = {
    async getHiddenBuiltInTemplateKeys(ownerId) {
      return hiddenByUser.get(ownerId) ?? [];
    },
    async setHiddenBuiltInTemplateKeys(ownerId, templateKeys) {
      hiddenByUser.set(ownerId, [...templateKeys]);
    },
  };
  const savedTemplateRepository = buildEmptySavedTemplateRepository();
  const dependencies = { visibilityRepository, repository: savedTemplateRepository };

  const initial = await listManualWorkoutTemplateCatalogForUser(userId, dependencies);
  assert.equal(initial.ok, true, JSON.stringify(initial));
  if (!initial.ok) return;
  assert.deepEqual(
    initial.visibleBuiltInTemplates.map((template) => template.templateKey),
    [...VISIBLE_MANUAL_WORKOUT_STARTER_TEMPLATE_KEYS],
  );
  assert.deepEqual(initial.hiddenBuiltInTemplates, []);

  const hidden = await updateManualWorkoutBuiltInVisibilityForUser(
    userId,
    { templateKey: "controlled_tempo_session" },
    "hide",
    dependencies,
  );
  assert.equal(hidden.ok, true, JSON.stringify(hidden));
  const hiddenCatalog = await listManualWorkoutTemplateCatalogForUser(userId, dependencies);
  assert.equal(hiddenCatalog.ok, true, JSON.stringify(hiddenCatalog));
  if (hiddenCatalog.ok) {
    assert.equal(
      hiddenCatalog.visibleBuiltInTemplates.some(
        (template) => template.templateKey === "controlled_tempo_session",
      ),
      false,
    );
    assert.deepEqual(
      hiddenCatalog.hiddenBuiltInTemplates.map((template) => template.templateKey),
      ["controlled_tempo_session"],
    );
  }

  const otherCatalog = await listManualWorkoutTemplateCatalogForUser(otherUserId, dependencies);
  assert.equal(otherCatalog.ok, true, JSON.stringify(otherCatalog));
  if (otherCatalog.ok) {
    assert.equal(
      otherCatalog.visibleBuiltInTemplates.length,
      VISIBLE_MANUAL_WORKOUT_STARTER_TEMPLATE_KEYS.length,
      "built-in visibility must remain per-user",
    );
  }

  for (const templateKey of VISIBLE_MANUAL_WORKOUT_STARTER_TEMPLATE_KEYS) {
    await updateManualWorkoutBuiltInVisibilityForUser(
      userId,
      { templateKey },
      "hide",
      dependencies,
    );
  }
  const allHidden = await listManualWorkoutTemplateCatalogForUser(userId, dependencies);
  assert.equal(allHidden.ok, true, JSON.stringify(allHidden));
  if (allHidden.ok) {
    assert.equal(allHidden.visibleBuiltInTemplates.length, 0);
    assert.equal(
      allHidden.hiddenBuiltInTemplates.length,
      VISIBLE_MANUAL_WORKOUT_STARTER_TEMPLATE_KEYS.length,
    );
  }

  const restored = await restoreAllManualWorkoutBuiltInTemplatesForUser(userId, dependencies);
  assert.equal(restored.ok, true, JSON.stringify(restored));
  if (restored.ok) {
    assert.deepEqual(restored.hiddenBuiltInTemplateKeys, []);
  }

  const unsupported = await updateManualWorkoutBuiltInVisibilityForUser(
    userId,
    { templateKey: "distance_intervals" },
    "hide",
    dependencies,
  );
  assert.equal(unsupported.ok, false);
  if (!unsupported.ok) {
    assert.equal(unsupported.reason, "invalid_input");
  }
}

function buildEmptySavedTemplateRepository(): ManualWorkoutSavedTemplateRepository {
  return {
    async insertTemplate() {
      throw new Error("not used");
    },
    async listTemplatesForUser() {
      return [];
    },
    async getTemplateForUser() {
      return null;
    },
    async deleteTemplateForUser() {
      return false;
    },
  };
}
