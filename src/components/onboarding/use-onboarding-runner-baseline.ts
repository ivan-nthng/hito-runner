import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { StructuredConstructorState } from "@/components/onboarding/onboarding-form-model";
import type { HeartRateProfileDraftState } from "@/components/settings/HeartRateProfileSection";
import { buildHeartRateZonesSummary, type HeartRateZonesSummary } from "@/lib/heart-rate-zones";
import { runnerFacingHeartRateSaveError } from "@/components/settings/heart-rate-profile-errors";
import { useHitoProductMessage } from "@/components/ui/hito-ui-locale-provider";
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
  const t = useHitoProductMessage();
  const saveRunnerBaselineFn = useServerFn(saveRunnerBaseline);
  const [summary, setSummary] = useState<HeartRateZonesSummary | null>(() =>
    buildSavedGuidanceSummary(defaults),
  );
  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const [error, setError] = useState<string | null>(null);
  const [heartRateDraftState, setHeartRateDraftState] = useState<HeartRateProfileDraftState | null>(
    null,
  );
  const input = useMemo(() => buildRunnerBaselineInput(state), [state]);
  const inputKey = input ? JSON.stringify(input) : "invalid";
  const isReady = Boolean(input && summary && (summary.accepted || heartRateDraftState?.canSubmit));

  useEffect(() => {
    setSummary(buildSavedGuidanceSummary(defaults));
    setHeartRateDraftState(null);
  }, [defaults]);

  useEffect(() => {
    setError(null);
    if (!input) {
      return;
    }

    setSummary((current) => current ?? buildHeartRateZonesSummary(input.age));
  }, [defaults, input, inputKey]);

  const persist = async (persistenceInput: RunnerBaselineSaveInput) => {
    const heartRateProfile = persistenceInput.heartRateProfile;
    setStatus("saving");
    setError(null);

    try {
      const result = await saveRunnerBaselineFn({
        data: persistenceInput,
      });
      const persistedBaselineKey = runnerBaselineKey(result.settings);
      setSummary(persistedBaselineKey ? result.settings.heartRateZones : null);
      if (heartRateProfile && !result.settings.heartRateZones.accepted) {
        setError(
          t("The saved BPM guidance could not be accepted. Review the ranges and try again."),
        );
        return false;
      }
      return true;
    } catch (saveError) {
      setError(
        runnerFacingHeartRateSaveError(
          saveError,
          heartRateProfile
            ? t("Heart-rate guidance could not be saved. Check the highlighted BPM ranges.")
            : t("Your runner baseline could not be saved."),
        ),
      );
      return false;
    } finally {
      setStatus("idle");
    }
  };

  const persistHeartRateDraft = async (baselineInput: RunnerBaselineSaveInput | null = input) => {
    if (!summary || !heartRateDraftState?.canSubmit) {
      setError(t("Check the highlighted BPM ranges before continuing."));
      return false;
    }

    const persistenceInput = buildRunnerBaselinePersistenceInput(
      baselineInput,
      heartRateDraftState,
    );
    if (!persistenceInput) {
      setError(t("Add a valid age, height, weight, and running level first."));
      return false;
    }

    return persist(persistenceInput);
  };

  const applyRecommendedSummary = (recommendedSummary: HeartRateZonesSummary) => {
    if (!input) {
      return;
    }

    setError(null);
    setHeartRateDraftState(null);
    setSummary(recommendedSummary);
  };

  return {
    applyRecommendedSummary,
    clearError: () => setError(null),
    error,
    heartRateDraftState,
    inputSnapshot: input,
    isReady,
    isSaving: status === "saving",
    onHeartRateDraftStateChange: setHeartRateDraftState,
    persistHeartRateDraft,
    previewContextKey: heartRateDraftState
      ? `baseline:${inputKey}:heart-rate:${heartRateDraftState.key}`
      : `baseline-pending:${inputKey}`,
    recommendedAge: input?.age ?? null,
    summary,
  };
}

export function buildRunnerBaselinePersistenceInput(
  baselineInput: RunnerBaselineSaveInput | null,
  heartRateDraftState: Pick<HeartRateProfileDraftState, "canSubmit" | "profileToPersist"> | null,
): RunnerBaselineSaveInput | null {
  if (!baselineInput || !heartRateDraftState?.canSubmit) {
    return null;
  }

  return {
    ...baselineInput,
    ...(heartRateDraftState.profileToPersist
      ? { heartRateProfile: heartRateDraftState.profileToPersist }
      : {}),
  };
}

function buildSavedGuidanceSummary(settings: UserSettingsSummary | null) {
  const baselineKey = settings ? runnerBaselineKey(settings) : null;

  return baselineKey && settings ? settings.heartRateZones : null;
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
