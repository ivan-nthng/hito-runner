import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { createAdminSupabaseClient } from "../src/lib/supabase/server";
import { getPersistedUserIdForAuthContext } from "../src/lib/request-persisted-user";
import {
  getUiLocaleResolutionForUserId,
  getUserSettingsForUserId,
  updateUserSettingsForUserId,
} from "../src/lib/user-settings-actions";
import {
  INVALID_STORED_UI_LOCALE_PREFERENCE,
  resolveRequestUiLocale,
  resolveUiLocale,
} from "../src/lib/ui-locale";

const REQUIRE_PERSISTENCE = process.argv.includes("--require-persistence");

async function main() {
  proveResolverContract();
  proveSourceOwnership();

  if (!REQUIRE_PERSISTENCE) {
    console.log("UI locale profile source validation passed.");
    return;
  }

  await proveLocalPersistenceContract();
  console.log("UI locale profile source + local persistence validation passed.");
}

function proveResolverContract() {
  const requestCases = [
    ["pt", "pt-BR"],
    ["pt-BR", "pt-BR"],
    ["pt-PT", "pt-BR"],
    ["PT-br", "pt-BR"],
    ["en", "en"],
    ["es", "en"],
    ["fr;q=1, pt;q=0.9", "en"],
    ["en;q=0.8, pt-PT;q=0.9", "pt-BR"],
    ["en, pt", "en"],
    ["*;q=1, pt;q=0.9", "en"],
    ["pt;q=0, en;q=0.5", "en"],
    ["pt;q=0", "en"],
    ["pt_BR", "en"],
    ["pt;q=1.5", "en"],
    ["pt;q=invalid", "en"],
    [", pt", "en"],
    ["*", "en"],
    ["", "en"],
    [null, "en"],
    [undefined, "en"],
  ] as const;

  for (const [acceptLanguage, expected] of requestCases) {
    assert.equal(resolveRequestUiLocale(acceptLanguage), expected, String(acceptLanguage));
  }

  assert.deepEqual(resolveUiLocale({ storedPreference: "en", acceptLanguage: "pt" }), {
    preference: "en",
    preferenceContractViolation: null,
    resolvedLocale: "en",
  });
  assert.deepEqual(resolveUiLocale({ storedPreference: "pt-BR", acceptLanguage: "en" }), {
    preference: "pt-BR",
    preferenceContractViolation: null,
    resolvedLocale: "pt-BR",
  });
  assert.deepEqual(resolveUiLocale({ storedPreference: "system", acceptLanguage: "pt-PT" }), {
    preference: "system",
    preferenceContractViolation: null,
    resolvedLocale: "pt-BR",
  });
  assert.deepEqual(resolveUiLocale({ storedPreference: null, acceptLanguage: "en" }), {
    preference: "system",
    preferenceContractViolation: null,
    resolvedLocale: "en",
  });
  assert.deepEqual(resolveUiLocale({ storedPreference: "pt", acceptLanguage: "pt-BR" }), {
    preference: null,
    preferenceContractViolation: INVALID_STORED_UI_LOCALE_PREFERENCE,
    resolvedLocale: "pt-BR",
  });
}

function proveSourceOwnership() {
  const migration = readSource(
    "supabase/migrations/20260813124903_runner_ui_locale_preference.sql",
  );
  assert.match(migration, /add column ui_locale_preference text not null default 'system'/);
  assert.match(migration, /check \(ui_locale_preference in \('system', 'en', 'pt-BR'\)\)/);

  const databaseTypes = readSource("src/lib/supabase/database.ts");
  assert.equal(databaseTypes.match(/ui_locale_preference/g)?.length, 3);

  const settingsSource = readSource("src/lib/user-settings-actions.ts");
  assert.match(settingsSource, /uiLocalePreference: uiLocalePreferenceSchema\.optional\(\)/);
  assert.match(settingsSource, /ui_locale_preference = data\.uiLocalePreference/);
  assert.match(settingsSource, /getUiLocaleResolutionForUserId/);

  const rejectedOwners = ["src/lib/runner-training-preferences.ts", "src/lib/theme-preference.ts"];
  for (const path of rejectedOwners) {
    assert.doesNotMatch(readSource(path), /ui_locale|UiLocale/);
  }
}

async function proveLocalPersistenceContract() {
  const supabaseUrl = requireLoopbackEnv("NEXT_PUBLIC_SUPABASE_URL");
  const publishableKey = requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  const admin = createAdminSupabaseClient();
  const password = `Locale-${randomUUID()}-Aa1!`;
  const owner = await createDisposableUser(
    admin,
    `locale-owner-${randomUUID()}@example.test`,
    password,
  );
  const other = await createDisposableUser(
    admin,
    `locale-other-${randomUUID()}@example.test`,
    password,
  );
  const adminPrincipal = await createDisposableUser(
    admin,
    `locale-admin-${randomUUID()}@example.test`,
    password,
    { hito_role: "admin" },
  );

  try {
    const insertedProfiles = await admin
      .from("runner_profiles")
      .insert([
        buildProfile(owner.id, "Locale", "Runner"),
        buildProfile(other.id, "Other", "Runner"),
      ]);
    assert.ifError(insertedProfiles.error);

    const initial = await getUserSettingsForUserId(owner.id, owner.email);
    assert.ok(initial);
    assert.equal(initial.uiLocalePreference, "system");
    assert.equal(initial.uiLocalePreferenceContractViolation, false);
    assert.equal(initial.calendarTimezone, "America/Sao_Paulo");
    assert.deepEqual(initial.trainingPreferences, {
      blocked_days: ["Monday"],
      preferred_long_run_day: "Sunday",
      max_running_days_per_week: 4,
    });

    const systemPortuguese = await getUiLocaleResolutionForUserId(owner.id, "pt-PT, en;q=0.8");
    assert.deepEqual(systemPortuguese, {
      preference: "system",
      preferenceContractViolation: null,
      resolvedLocale: "pt-BR",
    });
    await assertPersistedPreference(admin, owner.id, "system");

    const savedPortuguese = await updateUserSettingsForUserId(
      owner.id,
      {
        firstName: initial.firstName,
        lastName: initial.lastName,
        displayName: initial.displayName,
        age: initial.age,
        weightKg: initial.weightKg,
        heightCm: initial.heightCm,
        fitnessLevel: initial.fitnessLevel ?? undefined,
        trainingPreferences: initial.trainingPreferences,
        uiLocalePreference: "pt-BR",
      },
      owner.email,
    );
    assert.equal(savedPortuguese.uiLocalePreference, "pt-BR");
    assert.equal(savedPortuguese.profileRevision, initial.profileRevision);
    assert.equal(savedPortuguese.calendarTimezone, initial.calendarTimezone);
    assert.deepEqual(savedPortuguese.trainingPreferences, initial.trainingPreferences);

    const explicitPortuguese = await getUiLocaleResolutionForUserId(owner.id, "en-US");
    assert.equal(explicitPortuguese.preference, "pt-BR");
    assert.equal(explicitPortuguese.resolvedLocale, "pt-BR");

    const savedEnglish = await updateUserSettingsForUserId(
      owner.id,
      {
        firstName: savedPortuguese.firstName,
        lastName: savedPortuguese.lastName,
        displayName: savedPortuguese.displayName,
        age: savedPortuguese.age,
        weightKg: savedPortuguese.weightKg,
        heightCm: savedPortuguese.heightCm,
        fitnessLevel: savedPortuguese.fitnessLevel ?? undefined,
        trainingPreferences: savedPortuguese.trainingPreferences,
        uiLocalePreference: "en",
      },
      owner.email,
    );
    assert.equal(savedEnglish.uiLocalePreference, "en");
    assert.equal(savedEnglish.profileRevision, initial.profileRevision);
    assert.deepEqual(savedEnglish.trainingPreferences, initial.trainingPreferences);

    await assert.rejects(
      updateUserSettingsForUserId(
        owner.id,
        {
          firstName: savedEnglish.firstName,
          lastName: savedEnglish.lastName,
          displayName: savedEnglish.displayName,
          age: savedEnglish.age,
          weightKg: savedEnglish.weightKg,
          heightCm: savedEnglish.heightCm,
          fitnessLevel: savedEnglish.fitnessLevel ?? undefined,
          uiLocalePreference: "pt" as "en",
        },
        owner.email,
      ),
      /runner settings could not be saved/i,
    );
    const invalidDirectWrite = await admin
      .from("runner_profiles")
      .update({ ui_locale_preference: "pt" })
      .eq("user_id", owner.id);
    assert.equal(invalidDirectWrite.error?.code, "23514");
    await assertPersistedPreference(admin, owner.id, "en");

    const ownerClient = createClient(supabaseUrl, publishableKey);
    const otherClient = createClient(supabaseUrl, publishableKey);
    assert.ifError(
      (await ownerClient.auth.signInWithPassword({ email: owner.email, password })).error,
    );
    assert.ifError(
      (await otherClient.auth.signInWithPassword({ email: other.email, password })).error,
    );
    const ownerRead = await ownerClient
      .from("runner_profiles")
      .select("user_id, ui_locale_preference");
    assert.ifError(ownerRead.error);
    assert.deepEqual(ownerRead.data, [{ user_id: owner.id, ui_locale_preference: "en" }]);

    const crossUserRead = await otherClient
      .from("runner_profiles")
      .select("user_id, ui_locale_preference")
      .eq("user_id", owner.id);
    assert.ifError(crossUserRead.error);
    assert.deepEqual(crossUserRead.data, []);

    const crossUserWrite = await otherClient
      .from("runner_profiles")
      .update({ ui_locale_preference: "pt-BR" })
      .eq("user_id", owner.id)
      .select("user_id");
    assert.ifError(crossUserWrite.error);
    assert.deepEqual(crossUserWrite.data, []);
    await assertPersistedPreference(admin, owner.id, "en");

    const resolvedAdminUserId = await getPersistedUserIdForAuthContext({
      userId: adminPrincipal.id,
      email: adminPrincipal.email,
      appBaseUrl: "http://localhost:3000",
      provider: "admin",
      adminSession: {
        label: "Disposable admin",
        source: "local_fixture",
        runtimeClass: "loopback",
      },
    });
    const rejectedRunnerAsAdmin = await getPersistedUserIdForAuthContext({
      userId: owner.id,
      email: owner.email,
      appBaseUrl: "http://localhost:3000",
      provider: "admin",
      adminSession: {
        label: "Forged runner mapping",
        source: "local_fixture",
        runtimeClass: "loopback",
      },
    });
    assert.equal(resolvedAdminUserId, adminPrincipal.id);
    assert.equal(rejectedRunnerAsAdmin, null);
    assert.equal(await getUserSettingsForUserId(adminPrincipal.id, adminPrincipal.email), null);

    const adminPortuguese = await updateUserSettingsForUserId(
      adminPrincipal.id,
      preferenceOnlySettingsInput("pt-BR"),
      adminPrincipal.email,
    );
    assert.equal(adminPortuguese.uiLocalePreference, "pt-BR");
    assert.equal(adminPortuguese.profileRevision, 1);
    assert.equal(adminPortuguese.age, null);
    assert.equal(adminPortuguese.weightKg, null);
    assert.equal(adminPortuguese.heightCm, null);
    assert.equal(adminPortuguese.fitnessLevel, null);

    const adminReset = await updateUserSettingsForUserId(
      adminPrincipal.id,
      preferenceOnlySettingsInput("system"),
      adminPrincipal.email,
    );
    assert.equal(adminReset.uiLocalePreference, "system");
    assert.equal(adminReset.profileRevision, 1);
    assert.deepEqual(
      {
        age: adminReset.age,
        weightKg: adminReset.weightKg,
        heightCm: adminReset.heightCm,
        fitnessLevel: adminReset.fitnessLevel,
        trainingPreferences: adminReset.trainingPreferences,
      },
      {
        age: null,
        weightKg: null,
        heightCm: null,
        fitnessLevel: null,
        trainingPreferences: null,
      },
    );
    await assertPersistedPreference(admin, adminPrincipal.id, "system");

    const adminClient = createClient(supabaseUrl, publishableKey);
    assert.ifError(
      (
        await adminClient.auth.signInWithPassword({
          email: adminPrincipal.email,
          password,
        })
      ).error,
    );
    const adminOwnRead = await adminClient
      .from("runner_profiles")
      .select("user_id, ui_locale_preference");
    assert.ifError(adminOwnRead.error);
    assert.deepEqual(adminOwnRead.data, [
      { user_id: adminPrincipal.id, ui_locale_preference: "system" },
    ]);
    const runnerCannotReadAdmin = await ownerClient
      .from("runner_profiles")
      .select("user_id")
      .eq("user_id", adminPrincipal.id);
    assert.ifError(runnerCannotReadAdmin.error);
    assert.deepEqual(runnerCannotReadAdmin.data, []);
  } finally {
    const deletedUsers = await Promise.all(
      [owner, other, adminPrincipal].map((user) => admin.auth.admin.deleteUser(user.id)),
    );
    for (const deletedUser of deletedUsers) {
      assert.ifError(deletedUser.error);
    }

    const remainingProfiles = await admin
      .from("runner_profiles")
      .select("user_id")
      .in("user_id", [owner.id, other.id, adminPrincipal.id]);
    assert.ifError(remainingProfiles.error);
    assert.deepEqual(remainingProfiles.data, []);
  }
}

function buildProfile(userId: string, firstName: string, lastName: string) {
  return {
    user_id: userId,
    first_name: firstName,
    last_name: lastName,
    display_name: `${firstName} ${lastName}`,
    age: 36,
    weight_kg: 70,
    height_cm: 175,
    fitness_level: "running_regularly",
    baseline_revision: 4,
    training_preferences: {
      blocked_days: ["Monday"],
      preferred_long_run_day: "Sunday",
      max_running_days_per_week: 4,
    },
    calendar_timezone: "America/Sao_Paulo",
    calendar_timezone_source: "user",
  };
}

async function assertPersistedPreference(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  userId: string,
  expected: string,
) {
  const result = await admin
    .from("runner_profiles")
    .select("ui_locale_preference")
    .eq("user_id", userId)
    .single();
  assert.ifError(result.error);
  assert.equal(result.data.ui_locale_preference, expected);
}

async function createDisposableUser(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  email: string,
  password: string,
  appMetadata?: Record<string, unknown>,
) {
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: appMetadata,
  });
  assert.ifError(created.error);
  assert.ok(created.data.user);
  return { id: created.data.user.id, email };
}

function preferenceOnlySettingsInput(uiLocalePreference: "system" | "en" | "pt-BR") {
  return {
    firstName: null,
    lastName: null,
    displayName: null,
    age: null,
    weightKg: null,
    heightCm: null,
    uiLocalePreference,
  };
}

function readSource(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required for local UI locale validation.`);
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
