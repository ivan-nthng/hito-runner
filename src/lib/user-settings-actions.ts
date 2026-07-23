import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequestAuthContext } from "@/lib/backend/auth";
import {
  buildAcceptedEffectiveRunnerHeartRateProfile,
  buildHeartRateZonesSummary,
  normalizeAcceptedHeartRateProfileForStorage,
  personalHeartRateProfileInputSchema,
  type AcceptedRunnerHeartRateProfile,
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

export type RunnerTrainingPreferences = RunnerTrainingPreferencesStorage;

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
}

export interface RunnerPlanAuthoringProfileSnapshot {
  profileRevision: number;
  age: number;
  weightKg: number;
  heightCm: number;
  fitnessLevel: RunnerFitnessLevel;
  heartRateProfile: AcceptedRunnerHeartRateProfile;
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
});

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
  .inputValidator((value: unknown) => userSettingsInputSchema.parse(value))
  .handler(async ({ data }) => {
    const auth = getRequestAuthContext();
    const userId = await requirePersistedUserIdForCurrentRequest();
    if (!userId) {
      throw new Error("This session cannot update persisted runner settings.");
    }
    const settings = await updateUserSettingsForUserId(userId, data, auth.email);

    return {
      ok: true,
      settings,
    };
  });

export const saveRunnerBaseline = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => runnerBaselineSaveInputSchema.parse(value))
  .handler(async ({ data }) => {
    const auth = getRequestAuthContext();
    const userId = await requirePersistedUserIdForCurrentRequest();
    if (!userId) {
      throw new Error("This session cannot save a persisted runner baseline.");
    }

    const settings = await saveRunnerBaselineForUserId(userId, data, auth.email);

    return { ok: true, settings };
  });

export async function saveRunnerBaselineForUserId(
  userId: string,
  input: RunnerBaselineSaveInput,
  email: string | null = null,
) {
  const data = runnerBaselineSaveInputSchema.parse(input);
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
  };
}

export async function updateUserSettingsForUserId(
  userId: string,
  input: UserSettingsInput,
  email: string | null = null,
): Promise<UserSettingsSummary> {
  const data = userSettingsInputSchema.parse(input);
  const supabase = createAdminSupabaseClient();
  const currentProfile = await getSettingsProfileRow(userId);
  const fitnessLevel = data.fitnessLevel ?? parseFitnessLevel(currentProfile?.fitness_level);
  if (!currentProfile && (!data.age || !data.weightKg || !data.heightCm || !fitnessLevel)) {
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
    throw new Error(updatedProfile.error.message);
  }

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
  };
}

export async function getRunnerPlanAuthoringProfileSnapshotForUserId(
  userId: string,
): Promise<RunnerPlanAuthoringProfileSnapshot | null> {
  const profile = await getSettingsProfileRow(userId);
  const fitnessLevel = parseFitnessLevel(profile?.fitness_level);

  if (
    !profile ||
    profile.age == null ||
    profile.weight_kg == null ||
    profile.height_cm == null ||
    !fitnessLevel
  ) {
    return null;
  }

  const heartRateProfile = buildAcceptedEffectiveRunnerHeartRateProfile({
    age: profile.age,
    storedProfile: profile.heart_rate_profile,
  });
  if (!heartRateProfile) {
    return null;
  }

  return {
    profileRevision: profile.baseline_revision,
    age: profile.age,
    weightKg: profile.weight_kg,
    heightCm: profile.height_cm,
    fitnessLevel,
    heartRateProfile,
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
    throw new Error(profileResult.error.message);
  }

  return profileResult.data;
}
