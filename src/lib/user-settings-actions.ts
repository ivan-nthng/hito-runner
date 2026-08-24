import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequestAuthContext } from "@/lib/backend/auth";
import {
  buildHeartRateZonesSummary,
  normalizeAcceptedHeartRateProfileForStorage,
  personalHeartRateProfileInputSchema,
  type HeartRateZonesSummary,
} from "@/lib/heart-rate-zones";
import {
  getPersistedUserIdForAuthContext,
  requirePersistedUserIdForCurrentRequest,
} from "@/lib/request-persisted-user";
import {
  normalizeRunnerTrainingPreferencesForSave,
  FITNESS_LEVEL_VALUES,
  parseStoredRunnerTrainingPreferences,
  runnerTrainingPreferencesSaveInputSchema,
  type RunnerFitnessLevel,
  type RunnerTrainingPreferencesStorage,
} from "@/lib/runner-training-preferences";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database";
import type { TrainingSnapshot } from "@/lib/training";
import {
  runnerCalendarTimezoneSchema,
  type RunnerCalendarTimezoneSource,
} from "@/lib/runner-calendar-timezone";
import {
  readStoredUiLocalePreference,
  resolveUiLocale,
  uiLocalePreferenceSchema,
  type UiLocalePreference,
  type UiLocaleResolution,
} from "@/lib/ui-locale";

export type RunnerTrainingPreferences = RunnerTrainingPreferencesStorage;

export const HEART_RATE_GUIDANCE_SAVE_ERROR =
  "Heart-rate guidance could not be saved. Use five ordered whole-BPM ranges from 60 to 200.";
export const RUNNER_SETTINGS_SAVE_ERROR =
  "Your runner settings could not be saved. Check the values and try again.";
export const RUNNER_SETTINGS_LOAD_ERROR = "Your runner settings could not be loaded. Try again.";
export const RUNNER_SETTINGS_STALE_ERROR =
  "Your runner settings changed while saving. Reload and try again.";
export const RUNNER_CALENDAR_TIMEZONE_SAVE_ERROR =
  "Your calendar timezone could not be saved. Choose a recognized city timezone.";

export interface UserSettingsSummary {
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
  age: number | null;
  weightKg: number | null;
  heightCm: number | null;
  fitnessLevel: RunnerFitnessLevel | null;
  profileRevision: number;
  trainingPreferences: RunnerTrainingPreferences | null;
  heartRateZones: HeartRateZonesSummary;
  calendarTimezone: string;
  calendarTimezoneSource: RunnerCalendarTimezoneSource;
  uiLocalePreference: UiLocalePreference | null;
  uiLocalePreferenceContractViolation: boolean;
}

export interface RunnerCalendarTimezonePreference {
  calendarTimezone: string;
  calendarTimezoneSource: Exclude<RunnerCalendarTimezoneSource, "fallback_utc">;
}

type SettingsViewerSummary = {
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
} | null;

type SettingsRouteDataDependencies = {
  loadSnapshot: () => Promise<TrainingSnapshot>;
  loadViewer: () => Promise<SettingsViewerSummary>;
};

export const runnerBaselineSaveInputSchema = z
  .object({
    age: z.number().int().min(13).max(100),
    weightKg: z.number().min(30).max(250),
    heightCm: z.number().int().min(120).max(230),
    fitnessLevel: z.enum(FITNESS_LEVEL_VALUES),
    heartRateProfile: personalHeartRateProfileInputSchema.optional(),
  })
  .strict();

export type RunnerBaselineSaveInput = z.output<typeof runnerBaselineSaveInputSchema>;

const userSettingsInputSchema = z.object({
  firstName: z.string().trim().max(80).nullable(),
  lastName: z.string().trim().max(80).nullable(),
  displayName: z.string().trim().max(120).nullable(),
  age: runnerBaselineSaveInputSchema.shape.age.nullable(),
  weightKg: runnerBaselineSaveInputSchema.shape.weightKg.nullable(),
  heightCm: runnerBaselineSaveInputSchema.shape.heightCm.nullable(),
  fitnessLevel: z.enum(FITNESS_LEVEL_VALUES).optional(),
  heartRateProfile: personalHeartRateProfileInputSchema.optional(),
  trainingPreferences: runnerTrainingPreferencesSaveInputSchema.nullable().optional(),
  calendarTimezone: runnerCalendarTimezoneSchema.optional(),
  uiLocalePreference: uiLocalePreferenceSchema.optional(),
});

const runnerCalendarTimezoneSaveInputSchema = z
  .object({
    calendarTimezone: runnerCalendarTimezoneSchema,
    source: z.enum(["browser", "user"]),
  })
  .strict();

type UserSettingsInput = z.output<typeof userSettingsInputSchema>;

export async function loadSettingsRouteData({
  loadSnapshot,
  loadViewer,
}: SettingsRouteDataDependencies) {
  const auth = getRequestAuthContext();
  const persistedUserId = await getPersistedUserIdForAuthContext(auth);

  return {
    snapshot: await loadSnapshot(),
    viewer: await loadViewer(),
    settings: persistedUserId ? await getUserSettingsForUserId(persistedUserId, auth.email) : null,
  };
}

export const saveUserSettings = createServerFn({ method: "POST" })
  .validator(parseUserSettingsInput)
  .handler(async ({ data }) => {
    const auth = getRequestAuthContext();
    const userId = await requirePersistedUserIdForCurrentRequest();
    const settings = await updateUserSettingsForUserId(userId, data, auth.email);

    return {
      ok: true,
      settings,
    };
  });

export const saveRunnerBaseline = createServerFn({ method: "POST" })
  .validator(parseRunnerBaselineInput)
  .handler(async ({ data }) => {
    const auth = getRequestAuthContext();
    const userId = await requirePersistedUserIdForCurrentRequest();

    const settings = await saveRunnerBaselineForUserId(userId, data, auth.email);

    return { ok: true, settings };
  });

export const saveRunnerCalendarTimezone = createServerFn({ method: "POST" })
  .validator((value: unknown) => runnerCalendarTimezoneSaveInputSchema.parse(value))
  .handler(async ({ data }) => {
    const userId = await requirePersistedUserIdForCurrentRequest();
    const preference = await updateRunnerCalendarTimezoneForUserId(userId, data);

    return { ok: true, preference };
  });

export async function saveRunnerBaselineForUserId(
  userId: string,
  input: RunnerBaselineSaveInput,
  email: string | null = null,
) {
  const data = parseRunnerBaselineInput(input);
  const current = await getUserSettingsForUserId(userId, email);

  return updateUserSettingsForUserId(
    userId,
    {
      firstName: current?.firstName ?? null,
      lastName: current?.lastName ?? null,
      displayName: current?.displayName ?? null,
      ...data,
    },
    email,
  );
}

export function buildFirstTimeRunnerBaselineReadback(input: {
  age: number;
  weightKg: number;
  heightCm: number;
  fitnessLevel: RunnerFitnessLevel;
}): Pick<UserSettingsSummary, "age" | "weightKg" | "heightCm" | "fitnessLevel" | "heartRateZones"> {
  return {
    ...input,
    heartRateZones: buildHeartRateZonesSummary(input.age),
  };
}

export async function getUserSettingsForUserId(
  userId: string,
  email: string | null,
): Promise<UserSettingsSummary | null> {
  const profile = await getSettingsProfileRow(userId);

  if (!profile) {
    return null;
  }

  const uiLocalePreference = readStoredUiLocalePreference(profile.ui_locale_preference);

  return {
    firstName: profile.first_name,
    lastName: profile.last_name,
    displayName: profile.display_name,
    email,
    avatarUrl: profile.avatar_url,
    age: profile.age,
    weightKg: profile.weight_kg,
    heightCm: profile.height_cm,
    fitnessLevel: parseFitnessLevel(profile.fitness_level),
    profileRevision: profile.baseline_revision,
    trainingPreferences: parseStoredRunnerTrainingPreferences(profile.training_preferences),
    heartRateZones: buildHeartRateZonesSummary(profile.age, profile.heart_rate_profile),
    calendarTimezone: profile.calendar_timezone,
    calendarTimezoneSource: parseCalendarTimezoneSource(profile.calendar_timezone_source),
    uiLocalePreference: uiLocalePreference.preference,
    uiLocalePreferenceContractViolation: uiLocalePreference.preferenceContractViolation !== null,
  };
}

export async function getUiLocaleResolutionForUserId(
  userId: string | null,
  acceptLanguage: string | null | undefined,
): Promise<UiLocaleResolution> {
  const profile = userId ? await getSettingsProfileRow(userId) : null;

  return resolveUiLocale({
    storedPreference: profile?.ui_locale_preference,
    acceptLanguage,
  });
}

export async function updateUserSettingsForUserId(
  userId: string,
  input: UserSettingsInput,
  email: string | null = null,
): Promise<UserSettingsSummary> {
  const data = parseUserSettingsInput(input);
  const supabase = createAdminSupabaseClient();
  const currentProfile = await getSettingsProfileRow(userId);
  const fitnessLevel = data.fitnessLevel ?? parseFitnessLevel(currentProfile?.fitness_level);
  const hasCompleteRunnerBaseline = Boolean(
    data.age && data.weightKg && data.heightCm && fitnessLevel,
  );
  const canCreatePreferenceOnlyProfile = data.uiLocalePreference !== undefined;
  if (!currentProfile && !hasCompleteRunnerBaseline && !canCreatePreferenceOnlyProfile) {
    throw new Error("Save age, height, weight, and fitness level to create the runner baseline.");
  }

  const trainingPreferences = normalizeTrainingPreferencesForStorage(data.trainingPreferences);
  const heartRateProfile = normalizeHeartRateProfileForStorage(data.heartRateProfile, data.age);
  const storedHeartRateProfile =
    heartRateProfile === undefined
      ? (currentProfile?.heart_rate_profile ?? null)
      : heartRateProfile;
  const baselineChanged =
    !currentProfile ||
    currentProfile.age !== data.age ||
    currentProfile.weight_kg !== data.weightKg ||
    currentProfile.height_cm !== data.heightCm ||
    parseFitnessLevel(currentProfile.fitness_level) !== fitnessLevel ||
    !sameJson(currentProfile.heart_rate_profile, storedHeartRateProfile);
  const profileRevision = currentProfile
    ? currentProfile.baseline_revision + (baselineChanged ? 1 : 0)
    : 1;
  const updatePayload: {
    first_name: string | null;
    last_name: string | null;
    display_name: string | null;
    age: number | null;
    weight_kg: number | null;
    height_cm: number | null;
    fitness_level: RunnerFitnessLevel | null;
    baseline_revision: number;
    heart_rate_profile?: Json | null;
    training_preferences?: Json | null;
    calendar_timezone?: string;
    calendar_timezone_source?: Exclude<RunnerCalendarTimezoneSource, "fallback_utc">;
    ui_locale_preference?: UiLocalePreference;
  } = {
    first_name: data.firstName || null,
    last_name: data.lastName || null,
    display_name: data.displayName || null,
    age: data.age,
    weight_kg: data.weightKg,
    height_cm: data.heightCm,
    fitness_level: fitnessLevel,
    baseline_revision: profileRevision,
  };

  if (trainingPreferences !== undefined) {
    updatePayload.training_preferences = trainingPreferences;
  }
  if (heartRateProfile !== undefined) {
    updatePayload.heart_rate_profile = heartRateProfile;
  }
  if (data.calendarTimezone !== undefined) {
    updatePayload.calendar_timezone = data.calendarTimezone;
    updatePayload.calendar_timezone_source = "user";
  }
  if (data.uiLocalePreference !== undefined) {
    updatePayload.ui_locale_preference = data.uiLocalePreference;
  }

  const updatedProfile = currentProfile
    ? await supabase
        .from("runner_profiles")
        .update(updatePayload)
        .eq("user_id", userId)
        .eq("baseline_revision", currentProfile.baseline_revision)
        .select("*")
        .single()
    : await supabase
        .from("runner_profiles")
        .insert({
          user_id: userId,
          goal_type: null,
          goal_label: null,
          baseline_sessions_per_week: null,
          baseline_long_run_km: null,
          setup_state: "completed",
          ...updatePayload,
        })
        .select("*")
        .single();

  if (updatedProfile.error) {
    throw buildRunnerSettingsPersistenceError(updatedProfile.error, "write");
  }

  const uiLocalePreference = readStoredUiLocalePreference(updatedProfile.data.ui_locale_preference);

  return {
    firstName: updatedProfile.data.first_name,
    lastName: updatedProfile.data.last_name,
    displayName: updatedProfile.data.display_name,
    email,
    avatarUrl: updatedProfile.data.avatar_url,
    age: updatedProfile.data.age,
    weightKg: updatedProfile.data.weight_kg,
    heightCm: updatedProfile.data.height_cm,
    fitnessLevel: parseFitnessLevel(updatedProfile.data.fitness_level),
    profileRevision: updatedProfile.data.baseline_revision,
    trainingPreferences: parseStoredRunnerTrainingPreferences(
      updatedProfile.data.training_preferences,
    ),
    heartRateZones: buildHeartRateZonesSummary(
      updatedProfile.data.age,
      updatedProfile.data.heart_rate_profile,
    ),
    calendarTimezone: updatedProfile.data.calendar_timezone,
    calendarTimezoneSource: parseCalendarTimezoneSource(
      updatedProfile.data.calendar_timezone_source,
    ),
    uiLocalePreference: uiLocalePreference.preference,
    uiLocalePreferenceContractViolation: uiLocalePreference.preferenceContractViolation !== null,
  };
}

export async function updateRunnerCalendarTimezoneForUserId(
  userId: string,
  input: unknown,
): Promise<RunnerCalendarTimezonePreference> {
  const parsed = runnerCalendarTimezoneSaveInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(RUNNER_CALENDAR_TIMEZONE_SAVE_ERROR);
  }

  const supabase = createAdminSupabaseClient();
  let updateQuery = supabase
    .from("runner_profiles")
    .update({
      calendar_timezone: parsed.data.calendarTimezone,
      calendar_timezone_source: parsed.data.source,
    })
    .eq("user_id", userId);

  if (parsed.data.source === "browser") {
    updateQuery = updateQuery.eq("calendar_timezone_source", "fallback_utc");
  }

  const updatedProfile = await updateQuery
    .select("calendar_timezone, calendar_timezone_source")
    .maybeSingle();

  if (updatedProfile.error) {
    throw buildRunnerSettingsPersistenceError(updatedProfile.error, "write");
  }

  let persistedPreference = updatedProfile.data;
  if (!persistedPreference) {
    const currentProfile = await supabase
      .from("runner_profiles")
      .select("calendar_timezone, calendar_timezone_source")
      .eq("user_id", userId)
      .maybeSingle();

    if (currentProfile.error) {
      throw buildRunnerSettingsPersistenceError(currentProfile.error, "read");
    }
    persistedPreference = currentProfile.data;

    if (!persistedPreference) {
      const insertedProfile = await supabase
        .from("runner_profiles")
        .insert({
          user_id: userId,
          calendar_timezone: parsed.data.calendarTimezone,
          calendar_timezone_source: parsed.data.source,
        })
        .select("calendar_timezone, calendar_timezone_source")
        .single();

      if (insertedProfile.error?.code === "23505") {
        return updateRunnerCalendarTimezoneForUserId(userId, parsed.data);
      }
      if (insertedProfile.error) {
        throw buildRunnerSettingsPersistenceError(insertedProfile.error, "write");
      }
      persistedPreference = insertedProfile.data;
    }
  }

  if (!persistedPreference) {
    throw new Error(RUNNER_CALENDAR_TIMEZONE_SAVE_ERROR);
  }

  const source = parseCalendarTimezoneSource(persistedPreference.calendar_timezone_source);
  if (source === "fallback_utc") {
    throw new Error(RUNNER_CALENDAR_TIMEZONE_SAVE_ERROR);
  }

  return {
    calendarTimezone: persistedPreference.calendar_timezone,
    calendarTimezoneSource: source,
  };
}

function normalizeTrainingPreferencesForStorage(
  value: UserSettingsInput["trainingPreferences"],
): Json | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  return normalizeRunnerTrainingPreferencesForSave(value) as unknown as Json;
}

function normalizeHeartRateProfileForStorage(
  value: UserSettingsInput["heartRateProfile"],
  age: number | null,
): Json | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (age == null) {
    throw new Error("Age is required before heart-rate ranges can be accepted.");
  }

  return normalizeAcceptedHeartRateProfileForStorage({ age, value }) as unknown as Json;
}

function parseFitnessLevel(value: unknown): RunnerFitnessLevel | null {
  return FITNESS_LEVEL_VALUES.includes(value as RunnerFitnessLevel)
    ? (value as RunnerFitnessLevel)
    : null;
}

function parseCalendarTimezoneSource(value: unknown): RunnerCalendarTimezoneSource {
  return value === "browser" || value === "user" ? value : "fallback_utc";
}

export function buildRunnerSettingsPersistenceError(
  error: { code?: string | null },
  operation: "read" | "write",
) {
  if (operation === "write" && error.code === "23514") {
    return new Error(RUNNER_SETTINGS_SAVE_ERROR);
  }
  if (operation === "write" && error.code === "PGRST116") {
    return new Error(RUNNER_SETTINGS_STALE_ERROR);
  }

  return new Error(operation === "read" ? RUNNER_SETTINGS_LOAD_ERROR : RUNNER_SETTINGS_SAVE_ERROR);
}

function parseRunnerBaselineInput(value: unknown): RunnerBaselineSaveInput {
  const parsed = runnerBaselineSaveInputSchema.safeParse(value);
  if (parsed.success) {
    return parsed.data;
  }

  throw new Error(
    parsed.error.issues.some((issue) => issue.path[0] === "heartRateProfile")
      ? HEART_RATE_GUIDANCE_SAVE_ERROR
      : "Add a valid age, height, weight, and running level before saving.",
  );
}

function parseUserSettingsInput(value: unknown): UserSettingsInput {
  const parsed = userSettingsInputSchema.safeParse(value);
  if (parsed.success) {
    return parsed.data;
  }

  throw new Error(
    parsed.error.issues.some((issue) => issue.path[0] === "heartRateProfile")
      ? HEART_RATE_GUIDANCE_SAVE_ERROR
      : RUNNER_SETTINGS_SAVE_ERROR,
  );
}

function sameJson(left: Json | null, right: Json | null) {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function getSettingsProfileRow(userId: string) {
  const supabase = createAdminSupabaseClient();
  const profileResult = await supabase
    .from("runner_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileResult.error) {
    throw buildRunnerSettingsPersistenceError(profileResult.error, "read");
  }

  return profileResult.data;
}
