import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequestAuthContext } from "@/lib/backend/auth";
import {
  buildEffectivePersonalHeartRateProfile,
  buildHeartRateZonesSummary,
  normalizePersonalHeartRateProfileForStorage,
  personalHeartRateProfileInputSchema,
  type EffectivePersonalHeartRateProfile,
  type HeartRateZonesSummary,
} from "@/lib/heart-rate-zones";
import {
  getPersistedUserIdForAuthContext,
  requirePersistedUserIdForCurrentRequest,
} from "@/lib/request-persisted-user";
import {
  normalizeRunnerTrainingPreferencesForSave,
  parseStoredRunnerTrainingPreferences,
  runnerTrainingPreferencesSaveInputSchema,
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
  trainingPreferences: RunnerTrainingPreferences | null;
  heartRateZones: HeartRateZonesSummary;
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

const userSettingsInputSchema = z.object({
  firstName: z.string().trim().max(80).nullable(),
  lastName: z.string().trim().max(80).nullable(),
  displayName: z.string().trim().max(120).nullable(),
  age: z.number().int().min(0).max(120).nullable(),
  weightKg: z.number().min(0).max(500).nullable(),
  heightCm: z.number().min(0).max(300).nullable(),
  heartRateProfile: personalHeartRateProfileInputSchema.nullable().optional(),
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
    trainingPreferences: parseStoredRunnerTrainingPreferences(profile.training_preferences),
    heartRateZones: buildHeartRateZonesSummary(profile.age, profile.heart_rate_profile),
  };
}

export async function updateUserSettingsForUserId(
  userId: string,
  data: UserSettingsInput,
  email: string | null = null,
): Promise<UserSettingsSummary> {
  const supabase = createAdminSupabaseClient();
  const currentProfile = await getSettingsProfileRow(userId);

  if (!currentProfile) {
    throw new Error("Finish setup before editing user settings.");
  }

  const trainingPreferences = normalizeTrainingPreferencesForStorage(data.trainingPreferences);
  const heartRateProfile = normalizeHeartRateProfileForStorage(data.heartRateProfile);
  const updatePayload: {
    first_name: string | null;
    last_name: string | null;
    display_name: string | null;
    age: number | null;
    weight_kg: number | null;
    height_cm: number | null;
    heart_rate_profile?: Json | null;
    training_preferences?: Json | null;
  } = {
    first_name: data.firstName || null,
    last_name: data.lastName || null,
    display_name: data.displayName || null,
    age: data.age,
    weight_kg: data.weightKg,
    height_cm: data.heightCm,
  };

  if (trainingPreferences !== undefined) {
    updatePayload.training_preferences = trainingPreferences;
  }
  if (heartRateProfile !== undefined) {
    updatePayload.heart_rate_profile = heartRateProfile;
  }

  const updatedProfile = await supabase
    .from("runner_profiles")
    .update(updatePayload)
    .eq("user_id", userId)
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
    trainingPreferences: parseStoredRunnerTrainingPreferences(
      updatedProfile.data.training_preferences,
    ),
    heartRateZones: buildHeartRateZonesSummary(
      updatedProfile.data.age,
      updatedProfile.data.heart_rate_profile,
    ),
  };
}

export async function getEffectivePersonalHeartRateProfileForUserId(
  userId: string | null,
  fallbackAge: number,
): Promise<EffectivePersonalHeartRateProfile | null> {
  const profile = userId ? await getSettingsProfileRow(userId) : null;

  return buildEffectivePersonalHeartRateProfile({
    age: profile?.age ?? fallbackAge,
    storedProfile: profile?.heart_rate_profile,
  });
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
): Json | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }

  return normalizePersonalHeartRateProfileForStorage(value) as unknown as Json;
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
