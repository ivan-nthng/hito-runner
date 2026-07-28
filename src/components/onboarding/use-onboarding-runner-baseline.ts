import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { StructuredConstructorState } from "@/components/onboarding/onboarding-form-model";
import type { HeartRateProfileDraftState } from "@/components/settings/HeartRateProfileSection";
import type { PersonalHeartRateProfileInput } from "@/lib/heart-rate-zones";
import { runnerFacingHeartRateSaveError } from "@/components/settings/heart-rate-profile-errors";
import {
  saveRunnerBaseline,
  type RunnerBaselineSaveInput,
  type UserSettingsSummary,
} from "@/lib/user-settings-actions";

type RunnerBaselineState = Pick<
  StructuredConstructorState,
  "age" | "weightKg" | "heightCm" | "fitnessLevel"
>;

export function useOnboardingRunnerBaseline({
  defaults,
  state,
}: {
  defaults: UserSettingsSummary | null;
  state: RunnerBaselineState;
}) {
  const saveRunnerBaselineFn = useServerFn(saveRunnerBaseline);
  const [savedSettings, setSavedSettings] = useState(defaults);
  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const [error, setError] = useState<string | null>(null);
  const [heartRateDraftState, setHeartRateDraftState] = useState<HeartRateProfileDraftState | null>(
    null,
  );
  const input = useMemo(() => buildRunnerBaselineInput(state), [state]);
  const inputKey = input ? JSON.stringify(input) : "invalid";
  const savedInputKey = savedSettings ? runnerBaselineKey(savedSettings) : null;
  const matchesSavedBaseline = input != null && inputKey === savedInputKey;
  const summary = matchesSavedBaseline ? (savedSettings?.heartRateZones ?? null) : null;
  const isReady = Boolean(summary && (summary.accepted || heartRateDraftState?.canSubmit));

  useEffect(() => {
    setError(null);
    setHeartRateDraftState(null);
  }, [inputKey]);

  useEffect(() => {
    setSavedSettings(defaults);
    setHeartRateDraftState(null);
  }, [defaults]);

  const persist = async (heartRateProfile?: PersonalHeartRateProfileInput) => {
    if (!input) {
      setError("Add a valid age, height, weight, and running level first.");
      return false;
    }

    setStatus("saving");
    setError(null);

    try {
      const result = await saveRunnerBaselineFn({
        data: {
          ...input,
          ...(heartRateProfile ? { heartRateProfile } : {}),
        },
      });
      setSavedSettings(result.settings);
      if (heartRateProfile && !result.settings.heartRateZones.accepted) {
        setError("The saved BPM guidance could not be accepted. Review the ranges and try again.");
        return false;
      }
      return true;
    } catch (saveError) {
      setError(
        runnerFacingHeartRateSaveError(
          saveError,
          heartRateProfile
            ? "Heart-rate guidance could not be saved. Check the highlighted BPM ranges."
            : "Your runner baseline could not be saved.",
        ),
      );
      return false;
    } finally {
      setStatus("idle");
    }
  };

  const persistHeartRateDraft = async () => {
    if (!summary || !heartRateDraftState?.canSubmit) {
      setError("Check the highlighted BPM ranges before continuing.");
      return false;
    }

    if (!heartRateDraftState.profileToPersist) {
      return summary.accepted;
    }

    return persist(heartRateDraftState.profileToPersist);
  };

  return {
    canPrepare: input != null,
    clearError: () => setError(null),
    error,
    heartRateDraftState,
    isReady,
    isSaving: status === "saving",
    onHeartRateDraftStateChange: setHeartRateDraftState,
    persistHeartRateDraft,
    prepare: () => persist(),
    previewContextKey:
      matchesSavedBaseline && heartRateDraftState
        ? `baseline:${inputKey}:heart-rate:${heartRateDraftState.key}`
        : `baseline-pending:${inputKey}`,
    recommendedAge: input?.age ?? null,
    summary,
  };
}

function buildRunnerBaselineInput(state: RunnerBaselineState): RunnerBaselineSaveInput | null {
  const age = Number(state.age);
  const weightKg = Number(state.weightKg);
  const heightCm = Number(state.heightCm);

  if (
    !Number.isInteger(age) ||
    age < 13 ||
    age > 100 ||
    !Number.isFinite(weightKg) ||
    weightKg < 30 ||
    weightKg > 250 ||
    !Number.isInteger(heightCm) ||
    heightCm < 120 ||
    heightCm > 230
  ) {
    return null;
  }

  return {
    age,
    weightKg,
    heightCm,
    fitnessLevel: state.fitnessLevel,
  };
}

function runnerBaselineKey(settings: UserSettingsSummary) {
  if (
    settings.age == null ||
    settings.weightKg == null ||
    settings.heightCm == null ||
    settings.fitnessLevel == null
  ) {
    return null;
  }

  return JSON.stringify({
    age: settings.age,
    weightKg: settings.weightKg,
    heightCm: settings.heightCm,
    fitnessLevel: settings.fitnessLevel,
  } satisfies RunnerBaselineSaveInput);
}
