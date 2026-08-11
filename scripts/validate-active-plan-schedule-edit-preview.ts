import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const migration = await readFile(
  new URL(
    "../supabase/migrations/20260810132840_retire_active_plan_calendar_authority.sql",
    import.meta.url,
  ),
  "utf8",
);
const persistence = await readFile(
  new URL("../src/lib/active-plan-persistence.ts", import.meta.url),
  "utf8",
);
const trainingApi = await readFile(new URL("../src/lib/training-api.ts", import.meta.url), "utf8");
const databaseTypes = await readFile(
  new URL("../src/lib/supabase/database.ts", import.meta.url),
  "utf8",
);
const sourceCapabilities = await readFile(
  new URL("../src/lib/active-plan-workout-editing/source-capabilities.ts", import.meta.url),
  "utf8",
);

for (const path of [
  "src/lib/active-plan-lifecycle-actions.ts",
  "src/lib/active-plan-schedule-edit-contract.ts",
  "src/lib/active-plan-schedule-edit-preview.ts",
  "src/lib/active-plan-transition-actions.ts",
  "src/lib/active-plan-replacement-carry-forward.ts",
  "src/lib/plan-replacement-actions.ts",
]) {
  await assert.rejects(access(new URL(path, root)), undefined, `${path} must stay deleted`);
}

assert.match(
  migration,
  /update public\.plan_cycles[\s\S]*status = 'archived'[\s\S]*status = 'active'/,
);
assert.match(migration, /alter column status set default 'archived'/);
assert.match(migration, /drop index if exists public\.plan_cycles_one_active_per_user_idx/);
assert.match(migration, /drop function if exists public\.apply_active_plan_schedule_reflow/);
assert.match(migration, /rename to apply_calendar_workout_mutation/);
assert.match(migration, /rename to apply_calendar_workout_content_edit/);
assert.match(migration, /create function public\.apply_reviewed_future_schedule_persistence/);
assert.doesNotMatch(persistence, /export async function getActivePlan/);
assert.doesNotMatch(persistence, /getExistingPlanContext|replaceActivePlan|carry.forward/i);
assert.doesNotMatch(trainingApi, /clearUpcomingSchedule|previewActivePlan|ScheduleReflow/);
assert.match(databaseTypes, /apply_calendar_workout_mutation/);
assert.match(databaseTypes, /apply_reviewed_future_schedule_persistence/);
assert.doesNotMatch(databaseTypes, /apply_active_plan_workout|apply_active_plan_schedule_reflow/);
assert.match(sourceCapabilities, /provenancePlan/);
assert.doesNotMatch(sourceCapabilities, /provenancePlan\.status|status === "active"/);

console.log("Active-plan Calendar authority retirement contract passed.");
