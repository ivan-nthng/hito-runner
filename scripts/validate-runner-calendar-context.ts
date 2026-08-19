import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import {
  canonicalizeRunnerCalendarTimezone,
  dateIsoInRunnerTimezone,
} from "../src/lib/runner-calendar-timezone";
import { getRunnerCalendarContextForUserId } from "../src/lib/runner-calendar-context";
import { getRunnerActivityProgressForUser } from "../src/lib/runner-activity/read-model";
import { createAdminSupabaseClient } from "../src/lib/supabase/server";
import { getPersistedSnapshot } from "../src/lib/training-api";
import { updateRunnerCalendarTimezoneForUserId } from "../src/lib/user-settings-actions";

const FIXED_INSTANT = new Date("2026-08-09T23:30:00.000Z");
const REQUIRE_PERSISTENCE = process.argv.includes("--require-persistence");

async function main() {
  proveTimezoneDateContract();
  proveAuthenticatedSourceWiring();

  if (!REQUIRE_PERSISTENCE) {
    console.log("Runner calendar context source validation passed.");
    return;
  }

  await proveLocalPersistenceContract();
  console.log("Runner calendar context source + local persistence validation passed.");
}

function proveTimezoneDateContract() {
  assert.equal(dateIsoInRunnerTimezone("America/Sao_Paulo", FIXED_INSTANT), "2026-08-09");
  assert.equal(dateIsoInRunnerTimezone("Asia/Tokyo", FIXED_INSTANT), "2026-08-10");
  assert.equal(canonicalizeRunnerCalendarTimezone("US/Eastern"), "America/New_York");
  assert.throws(() => canonicalizeRunnerCalendarTimezone("Invalid/Runner_Zone"));

  const firstRepeatedHour = new Date("2026-11-01T05:30:00.000Z");
  const secondRepeatedHour = new Date("2026-11-01T06:30:00.000Z");
  assert.equal(dateIsoInRunnerTimezone("America/New_York", firstRepeatedHour), "2026-11-01");
  assert.equal(dateIsoInRunnerTimezone("America/New_York", secondRepeatedHour), "2026-11-01");
}

function proveAuthenticatedSourceWiring() {
  const noHostClockOwners = [
    "src/lib/training-api.ts",
    "src/lib/active-plan-persistence.ts",
    "src/lib/runner-calendar-persistence.ts",
    "src/lib/running-plan-engine-actions.ts",
    "src/lib/runner-activity/read-model.ts",
    "src/lib/runner-activity/fact-snapshots.ts",
    "src/lib/manual-workout-authoring/actions.ts",
    "src/lib/manual-workout-authoring/active-plan-add.ts",
    "src/lib/manual-workout-authoring/edit-workout.ts",
    "src/lib/manual-workout-authoring/move-workout.ts",
    "src/lib/manual-workout-authoring/delete-clear.ts",
    "src/lib/manual-workout-authoring/copy-paste-reconstruction.ts",
  ];

  for (const file of noHostClockOwners) {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /todayIso\(\)/, `${file} must not derive an authenticated day`);
  }

  const savedPlanSource = readFileSync(
    new URL("../src/lib/active-plan-persistence.ts", import.meta.url),
    "utf8",
  );
  assert.match(
    savedPlanSource,
    /const currentDate = await getRunnerCalendarDateForUserId\(userId\)/,
  );
}

async function proveLocalPersistenceContract() {
  const supabaseUrl = requireLoopbackEnv("NEXT_PUBLIC_SUPABASE_URL");
  const publishableKey = requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  const admin = createAdminSupabaseClient();
  const password = `Timezone-${randomUUID()}-Aa1!`;
  const users = await Promise.all([
    createDisposableUser(admin, `timezone-a-${randomUUID()}@example.test`, password),
    createDisposableUser(admin, `timezone-b-${randomUUID()}@example.test`, password),
    createDisposableUser(admin, `timezone-new-${randomUUID()}@example.test`, password),
  ]);
  const [saoPauloUser, tokyoUser, newRunnerUser] = users;

  try {
    const insertedProfiles = await admin.from("runner_profiles").insert(
      [saoPauloUser, tokyoUser].map((user) => ({
        user_id: user.id,
        goal_type: null,
        goal_label: null,
        baseline_sessions_per_week: null,
        baseline_long_run_km: null,
        age: 36,
        weight_kg: 72,
        height_cm: 178,
        fitness_level: "running_regularly",
        setup_state: "completed" as const,
      })),
    );
    assert.ifError(insertedProfiles.error);

    const fallbackRows = await admin
      .from("runner_profiles")
      .select("user_id, calendar_timezone, calendar_timezone_source")
      .in(
        "user_id",
        users.map((user) => user.id),
      );
    assert.ifError(fallbackRows.error);
    assert.equal(fallbackRows.data?.length, 2);
    for (const row of fallbackRows.data ?? []) {
      assert.equal(row.calendar_timezone, "UTC");
      assert.equal(row.calendar_timezone_source, "fallback_utc");
    }

    await seedSameDateWorkout(admin, saoPauloUser.id);
    await seedSameDateWorkout(admin, tokyoUser.id);

    const browserInitialized = await updateRunnerCalendarTimezoneForUserId(saoPauloUser.id, {
      calendarTimezone: "America/Sao_Paulo",
      source: "browser",
    });
    assert.deepEqual(browserInitialized, {
      calendarTimezone: "America/Sao_Paulo",
      calendarTimezoneSource: "browser",
    });
    await updateRunnerCalendarTimezoneForUserId(tokyoUser.id, {
      calendarTimezone: "Asia/Tokyo",
      source: "user",
    });
    const initializedNewRunner = await updateRunnerCalendarTimezoneForUserId(newRunnerUser.id, {
      calendarTimezone: "America/New_York",
      source: "browser",
    });
    assert.deepEqual(initializedNewRunner, {
      calendarTimezone: "America/New_York",
      calendarTimezoneSource: "browser",
    });
    const initializedNewRunnerSnapshot = await getPersistedSnapshot(newRunnerUser.id, {
      instant: FIXED_INSTANT,
    });
    assert.equal(initializedNewRunnerSnapshot.mode, "onboarding");
    assert.equal(initializedNewRunnerSnapshot.profile?.calendarTimezone, "America/New_York");
    assert.equal(initializedNewRunnerSnapshot.profile?.calendarTimezoneSource, "browser");

    const [saoPauloContext, tokyoContext] = await Promise.all([
      getRunnerCalendarContextForUserId(saoPauloUser.id, FIXED_INSTANT),
      getRunnerCalendarContextForUserId(tokyoUser.id, FIXED_INSTANT),
    ]);
    assert.equal(saoPauloContext.currentDate, "2026-08-09");
    assert.equal(tokyoContext.currentDate, "2026-08-10");

    const [saoPauloSnapshot, tokyoSnapshot] = await Promise.all([
      getPersistedSnapshot(saoPauloUser.id, { instant: FIXED_INSTANT }),
      getPersistedSnapshot(tokyoUser.id, { instant: FIXED_INSTANT }),
    ]);
    assert.equal(saoPauloSnapshot.currentDate, saoPauloContext.currentDate);
    assert.equal(tokyoSnapshot.currentDate, tokyoContext.currentDate);
    assert.equal(saoPauloSnapshot.workouts[0]?.date, "2026-08-09");
    assert.equal(tokyoSnapshot.workouts[0]?.date, "2026-08-09");
    assert.equal(saoPauloSnapshot.workouts[0]?.status, "today");
    assert.equal(tokyoSnapshot.workouts[0]?.status, "skipped");

    const [saoPauloProgress, tokyoProgress] = await Promise.all([
      getRunnerActivityProgressForUser({
        userId: saoPauloUser.id,
        asOfDate: saoPauloContext.currentDate,
      }),
      getRunnerActivityProgressForUser({
        userId: tokyoUser.id,
        asOfDate: tokyoContext.currentDate,
      }),
    ]);
    assert.equal(saoPauloProgress.asOfDate, saoPauloSnapshot.currentDate);
    assert.equal(tokyoProgress.asOfDate, tokyoSnapshot.currentDate);

    await assert.rejects(
      updateRunnerCalendarTimezoneForUserId(saoPauloUser.id, {
        calendarTimezone: "Invalid/Runner_Zone",
        source: "user",
      }),
    );
    const invalidDirectWrite = await admin
      .from("runner_profiles")
      .update({ calendar_timezone: "Invalid/Runner_Zone" })
      .eq("user_id", saoPauloUser.id);
    assert.equal(invalidDirectWrite.error?.code, "23514");

    await updateRunnerCalendarTimezoneForUserId(saoPauloUser.id, {
      calendarTimezone: "Asia/Tokyo",
      source: "user",
    });
    const staleBrowserInitialization = await updateRunnerCalendarTimezoneForUserId(
      saoPauloUser.id,
      {
        calendarTimezone: "America/Sao_Paulo",
        source: "browser",
      },
    );
    assert.deepEqual(staleBrowserInitialization, {
      calendarTimezone: "Asia/Tokyo",
      calendarTimezoneSource: "user",
    });

    const saoPauloClient = createClient(supabaseUrl, publishableKey);
    const tokyoClient = createClient(supabaseUrl, publishableKey);
    assert.ifError(
      (await saoPauloClient.auth.signInWithPassword({ email: saoPauloUser.email, password })).error,
    );
    assert.ifError(
      (await tokyoClient.auth.signInWithPassword({ email: tokyoUser.email, password })).error,
    );
    const ownerRead = await saoPauloClient.from("runner_profiles").select("user_id");
    assert.ifError(ownerRead.error);
    assert.deepEqual(
      ownerRead.data?.map((row) => row.user_id),
      [saoPauloUser.id],
    );
    const crossUserRead = await tokyoClient
      .from("runner_profiles")
      .select("user_id")
      .eq("user_id", saoPauloUser.id);
    assert.ifError(crossUserRead.error);
    assert.deepEqual(crossUserRead.data, []);
    const crossUserWrite = await tokyoClient
      .from("runner_profiles")
      .update({ calendar_timezone: "UTC" })
      .eq("user_id", saoPauloUser.id)
      .select("user_id");
    assert.ifError(crossUserWrite.error);
    assert.deepEqual(crossUserWrite.data, []);

    const preservedDateOnlyRows = await admin
      .from("planned_workouts")
      .select("workout_date")
      .in(
        "user_id",
        users.map((user) => user.id),
      );
    assert.ifError(preservedDateOnlyRows.error);
    assert.deepEqual(preservedDateOnlyRows.data?.map((row) => row.workout_date).sort(), [
      "2026-08-09",
      "2026-08-09",
    ]);
  } finally {
    await Promise.all(users.map((user) => admin.auth.admin.deleteUser(user.id)));
  }
}

async function createDisposableUser(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  email: string,
  password: string,
) {
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  assert.ifError(created.error);
  assert.ok(created.data.user);
  return { id: created.data.user.id, email };
}

async function seedSameDateWorkout(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  userId: string,
) {
  const workout = await admin.from("planned_workouts").insert({
    plan_cycle_id: null,
    origin_kind: "manual",
    user_id: userId,
    workout_date: "2026-08-09",
    weekday: "Sunday",
    week_number: 1,
    phase: "base",
    workout_type: "easy",
    title: "Boundary Easy Run",
    display_order: 0,
  });
  assert.ifError(workout.error);
}

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required for local runner calendar validation.`);
  return value;
}

function requireLoopbackEnv(name: string) {
  const value = requireEnv(name);
  const url = new URL(value);
  assert.ok(["127.0.0.1", "localhost", "::1", "[::1]"].includes(url.hostname));
  return value;
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
