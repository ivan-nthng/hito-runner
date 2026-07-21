import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { StructuredConstructorState } from "@/components/onboarding/onboarding-form-model";
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
  const input = useMemo(() => buildRunnerBaselineInput(state), [state]);
  const inputKey = input ? JSON.stringify(input) : "invalid";
  const savedInputKey = savedSettings ? runnerBaselineKey(savedSettings) : null;
  const matchesSavedBaseline = input != null && inputKey === savedInputKey;
  const summary = matchesSavedBaseline ? (savedSettings?.heartRateZones ?? null) : null;
  const isReady = Boolean(summary?.accepted);

  useEffect(() => {
    setError(null);
  }, [inputKey]);

  useEffect(() => {
    setSavedSettings(defaults);
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
      return true;
    } catch (saveError) {
      setError(
        runnerFacingHeartRateSaveError(
          saveError,
          heartRateProfile
            ? "Heart-rate guidance could not be saved. Check that every BPM range is complete and separate."
            : "Your runner baseline could not be saved.",
        ),
      );
      return false;
    } finally {
      setStatus("idle");
    }
  };

  return {
    canPrepare: input != null,
    clearError: () => setError(null),
    error,
    isReady,
    isSaving: status === "saving",
    previewContextKey: matchesSavedBaseline
      ? `profile:${savedSettings?.profileRevision ?? "missing"}`
      : `baseline-pending:${inputKey}`,
    prepare: () => persist(),
    saveHeartRateProfile: (profile: PersonalHeartRateProfileInput) => persist(profile),
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
