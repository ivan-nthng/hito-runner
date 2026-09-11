import { useEffect, useRef, useState, type SetStateAction } from "react";
import { useServerFn } from "@tanstack/react-start";
import { HitoButton } from "@/components/ui/button";
import { hitoToast } from "@/components/ui/hito-toast";
import { useHitoProductMessage } from "@/components/ui/hito-ui-locale-provider";
import { QuickSetupPlanSetupSections } from "@/components/onboarding/QuickSetupPlanSetupSections";
import { OnboardingRunnerHeartRateProfile } from "@/components/onboarding/OnboardingRunnerBaseline";
import { useOnboardingRunnerBaseline } from "@/components/onboarding/use-onboarding-runner-baseline";
import {
  isPresetPrimarySetupReady,
  normalizePresetPrimaryFitnessLevel,
  type StructuredConstructorState,
  type WeekdayName,
} from "@/components/onboarding/onboarding-form-model";
import type { UserSettingsSummary } from "@/lib/user-settings-actions";
import { createEmptyManualActivePlan } from "@/lib/manual-workout-authoring";
import type { ManualEmptyPlanSetupInput } from "@/lib/manual-workout-authoring/schema";

type ManualCreateStatus = "idle" | "creating";

const MANUAL_CREATE_TOAST_ID = "manual-empty-plan-create";

export function OnboardingGate({ defaults = null }: { defaults?: UserSettingsSummary | null }) {
  const translate = useHitoProductMessage();
  const createEmptyManualActivePlanFn = useServerFn(createEmptyManualActivePlan);
  const manualCreateInFlightRef = useRef(false);
  const [constructorState, setConstructorState] = useState<StructuredConstructorState>(() =>
    buildManualOnboardingState(defaults),
  );
  const { age, weightKg, heightCm, fitnessLevel } = constructorState;
  const updateConstructorField = <Key extends keyof StructuredConstructorState>(
    key: Key,
    value: StructuredConstructorState[Key],
  ) => {
    setConstructorState((current) =>
      current[key] === value ? current : { ...current, [key]: value },
    );
  };
  const constructorSetters = {
    setAge: (value: string) => updateConstructorField("age", value),
    setWeightKg: (value: string) => updateConstructorField("weightKg", value),
    setHeightCm: (value: string) => updateConstructorField("heightCm", value),
    setFitnessLevel: (value: StructuredConstructorState["fitnessLevel"]) =>
      updateConstructorField("fitnessLevel", value),
    setRecent5kTime: (value: string) => updateConstructorField("recent5kTime", value),
    setRecent5kPace: (value: string) => updateConstructorField("recent5kPace", value),
    setFixedRestDays: (value: SetStateAction<WeekdayName[]>) => {
      setConstructorState((current) => ({
        ...current,
        fixedRestDays: typeof value === "function" ? value(current.fixedRestDays) : [...value],
      }));
    },
    setMaxRunningDaysPerWeek: (value: string) =>
      updateConstructorField("maxRunningDaysPerWeek", value),
    setPreferredLongRunDay: (value: WeekdayName | "") =>
      updateConstructorField("preferredLongRunDay", value),
    setStartDate: (value: string) => updateConstructorField("startDate", value),
  };
  const [manualCreateStatus, setManualCreateStatus] = useState<ManualCreateStatus>("idle");
  const [manualCreateError, setManualCreateError] = useState<string | null>(null);
  const runnerBaseline = useOnboardingRunnerBaseline({
    defaults,
    state: constructorState,
  });
  const isManualSetupReady = isManualProfileReady(constructorState) && runnerBaseline.isReady;
  const isManualCreateBusy = manualCreateStatus !== "idle";
  const isBusy = isManualCreateBusy || runnerBaseline.isSaving;

  const openSavedHome = () => {
    window.location.assign("/");
  };

  useEffect(() => {
    setManualCreateError(null);
  }, [age, fitnessLevel, heightCm, weightKg]);

  const createManualPlan = async () => {
    if (manualCreateInFlightRef.current) {
      return;
    }

    const inputResult = buildManualEmptyPlanInput(constructorState);

    if (!inputResult.ok) {
      setManualCreateError(inputResult.error);
      return;
    }

    manualCreateInFlightRef.current = true;
    if (!(await runnerBaseline.persistHeartRateDraft(runnerBaseline.inputSnapshot))) {
      manualCreateInFlightRef.current = false;
      setManualCreateError(
        runnerBaseline.error ??
          translate("Check the highlighted BPM ranges before starting training."),
      );
      return;
    }

    setManualCreateStatus("creating");
    setManualCreateError(null);
    hitoToast.working({
      id: MANUAL_CREATE_TOAST_ID,
      title: translate("Opening Calendar"),
      description: translate("Hito is opening an empty Calendar for manual building."),
    });

    try {
      const result = await createEmptyManualActivePlanFn({
        data: inputResult.input,
      });

      if (!result.ok) {
        manualCreateInFlightRef.current = false;
        setManualCreateStatus("idle");
        setManualCreateError(result.message);
        hitoToast.error({
          id: MANUAL_CREATE_TOAST_ID,
          title: translate("Calendar not opened"),
          description: result.message,
        });
        return;
      }

      hitoToast.success({
        id: MANUAL_CREATE_TOAST_ID,
        title: translate("Calendar ready"),
        description: translate("Opening your Calendar now."),
        duration: 2600,
      });
      openSavedHome();
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : translate("The Calendar could not be opened.");
      manualCreateInFlightRef.current = false;
      setManualCreateStatus("idle");
      setManualCreateError(message);
      hitoToast.error({
        id: MANUAL_CREATE_TOAST_ID,
        title: translate("Calendar not opened"),
        description: message,
      });
    }
  };

  return (
    <section className="hito-onboarding-surface">
      <div className="max-w-3xl">
        <h1 className="hito-ui-title-xl mt-2 max-w-[44rem]">
          {translate("Complete your runner baseline")}
        </h1>
        <p className="hito-body-md mt-4 text-muted-foreground">
          {translate("Create workouts independently, or use a workout from a coach or friend.")}
        </p>
      </div>

      <div className="mt-8 grid gap-8">
        <QuickSetupPlanSetupSections
          state={constructorState}
          setState={constructorSetters}
          includeTrainingSetup={false}
          includeScheduleRhythm={false}
          heartRateProfile={
            <OnboardingRunnerHeartRateProfile
              onClearError={runnerBaseline.clearError}
              error={runnerBaseline.error}
              isSaving={runnerBaseline.isSaving}
              onDraftStateChange={runnerBaseline.onHeartRateDraftStateChange}
              onRecommendedApplied={runnerBaseline.applyRecommendedSummary}
              recommendedAge={runnerBaseline.recommendedAge}
              summary={runnerBaseline.summary}
            />
          }
        />
      </div>

      <div className="hito-onboarding-submit-footer">
        <div className="hito-onboarding-submit-footer-inner">
          <div className="min-w-0">
            <p
              className={
                manualCreateError
                  ? "hito-body-md font-medium text-negative"
                  : "hito-body-xs text-secondary"
              }
            >
              {manualCreateError ??
                translate(
                  "Your saved runner baseline is ready. Your Calendar will open without adding workouts.",
                )}
            </p>
          </div>
          <HitoButton
            type="button"
            size="lg"
            variant="primary"
            disabled={isBusy || !isManualSetupReady}
            loading={manualCreateStatus === "creating"}
            onClick={() => {
              void createManualPlan();
            }}
          >
            {manualCreateStatus === "creating"
              ? translate("Opening manual calendar...")
              : translate("Open Calendar")}
          </HitoButton>
        </div>
      </div>
    </section>
  );
}

function buildManualOnboardingState(
  defaults: UserSettingsSummary | null | undefined,
): StructuredConstructorState {
  return {
    age: defaults?.age != null ? String(defaults.age) : "",
    weightKg: defaults?.weightKg != null ? String(defaults.weightKg) : "",
    heightCm: defaults?.heightCm != null ? String(defaults.heightCm) : "",
    fitnessLevel: defaults?.fitnessLevel ?? "running_regularly",
    recent5kTime: "",
    recent5kPace: "",
    fixedRestDays: defaults?.trainingPreferences?.blocked_days ?? [],
    maxRunningDaysPerWeek:
      defaults?.trainingPreferences?.max_running_days_per_week != null
        ? String(defaults.trainingPreferences.max_running_days_per_week)
        : "",
    preferredLongRunDay: defaults?.trainingPreferences?.preferred_long_run_day ?? "",
    startDate: "",
  };
}

function isManualProfileReady(state: StructuredConstructorState) {
  return isPresetPrimarySetupReady(state);
}

function buildManualEmptyPlanInput(
  state: StructuredConstructorState,
): { ok: true; input: ManualEmptyPlanSetupInput } | { ok: false; error: string } {
  const age = requiredManualNumber(state.age, "Age", {
    min: 13,
    max: 100,
    integer: true,
  });
  const weightKg = requiredManualNumber(state.weightKg, "Weight", {
    min: 30,
    max: 250,
    increment: 0.5,
  });
  const heightCm = requiredManualNumber(state.heightCm, "Height", {
    min: 120,
    max: 230,
    integer: true,
  });
  const invalid = [age, weightKg, heightCm].find((value) => !value.ok);

  if (invalid?.ok === false) {
    return invalid;
  }

  if (!age.ok || !weightKg.ok || !heightCm.ok) {
    return { ok: false, error: "Add age, height, and weight before opening Calendar." };
  }

  return {
    ok: true,
    input: {
      age: age.value,
      heightCm: heightCm.value,
      weightKg: weightKg.value,
      runningLevel: normalizePresetPrimaryFitnessLevel(state.fitnessLevel),
    },
  };
}

function requiredManualNumber(
  value: string,
  label: string,
  options: { min: number; max: number; integer?: boolean; increment?: number },
): { ok: true; value: number } | { ok: false; error: string } {
  const trimmed = value.trim();

  if (!trimmed) {
    return { ok: false, error: `${label} is required.` };
  }

  const parsed = Number(trimmed);

  if (!Number.isFinite(parsed)) {
    return { ok: false, error: `${label} should be a number.` };
  }

  if (options.integer && !Number.isInteger(parsed)) {
    return { ok: false, error: `${label} must be a whole number.` };
  }

  if (parsed < options.min || parsed > options.max) {
    return { ok: false, error: `${label} must be between ${options.min} and ${options.max}.` };
  }

  if (options.increment && !Number.isInteger(parsed / options.increment)) {
    return { ok: false, error: `${label} must use ${options.increment} increments.` };
  }

  return { ok: true, value: parsed };
}
