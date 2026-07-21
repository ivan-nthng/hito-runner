import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { hitoToast } from "@/components/ui/hito-toast";
import { Icon } from "@/components/ui/icon";
import { PlanPresetPanel } from "@/components/onboarding/PlanPresetPanel";
import { QuickSetupPlanSetupSections } from "@/components/onboarding/QuickSetupPlanSetupSections";
import { StructuredPlanConstructor } from "@/components/onboarding/StructuredPlanConstructor";
import { OnboardingRunnerHeartRateProfile } from "@/components/onboarding/OnboardingRunnerBaseline";
import { useOnboardingRunnerBaseline } from "@/components/onboarding/use-onboarding-runner-baseline";
import {
  isPresetPrimarySetupReady,
  normalizePresetPrimaryFitnessLevel,
  resolveTerrainFocus,
  type GoalDistance,
  type GoalStyle,
  type StrengthPreference,
  type StructuredConstructorState,
  type TerrainFocus,
  type WeekdayName,
} from "@/components/onboarding/onboarding-form-model";
import type { RunnerFitnessLevel } from "@/lib/runner-training-preferences";
import type { UserSettingsSummary } from "@/lib/user-settings-actions";
import type { RunningPlanConfirmActionResult } from "@/lib/running-plan-engine-actions";
import { confirmRunningPlanDraft } from "@/lib/running-plan-engine-actions";
import { createEmptyManualActivePlan } from "@/lib/manual-workout-authoring";
import type { ManualEmptyPlanSetupInput } from "@/lib/manual-workout-authoring/schema";
import {
  buildRunningPlanConfirmInput,
  resolveSelectedPlanGoalPreviewGate,
} from "@/components/onboarding/selected-running-plan-flow-utils";
import { useSelectedPlanPresetPreviewController } from "@/components/onboarding/use-selected-plan-preset-preview-controller";

type ManualCreateStatus = "idle" | "creating";

const STRUCTURED_REVIEW_TOAST_ID = "onboarding-structured-review";
const MANUAL_CREATE_TOAST_ID = "manual-empty-plan-create";

export function OnboardingGate({ defaults = null }: { defaults?: UserSettingsSummary | null }) {
  const createEmptyManualActivePlanFn = useServerFn(createEmptyManualActivePlan);
  const confirmRunningPlanDraftFn = useServerFn(confirmRunningPlanDraft);
  const structuredFormRef = useRef<HTMLFormElement | null>(null);
  const runningPlanCreateInFlightRef = useRef(false);
  const manualCreateInFlightRef = useRef(false);

  const [age, setAge] = useState(() => (defaults?.age != null ? String(defaults.age) : ""));
  const [weightKg, setWeightKg] = useState(() =>
    defaults?.weightKg != null ? String(defaults.weightKg) : "",
  );
  const [heightCm, setHeightCm] = useState(() =>
    defaults?.heightCm != null ? String(defaults.heightCm) : "",
  );
  const [fitnessLevel, setFitnessLevel] = useState<RunnerFitnessLevel>(
    () => defaults?.fitnessLevel ?? "running_regularly",
  );
  const [recent5kTime, setRecent5kTime] = useState("");
  const [recent5kPace, setRecent5kPace] = useState("");
  const [fixedRestDays, setFixedRestDays] = useState<WeekdayName[]>(
    () => defaults?.trainingPreferences?.blocked_days ?? [],
  );
  const [restDaysAnswered, setRestDaysAnswered] = useState(true);
  const [maxRunningDaysPerWeek, setMaxRunningDaysPerWeek] = useState(() =>
    defaults?.trainingPreferences?.max_running_days_per_week != null
      ? String(defaults.trainingPreferences.max_running_days_per_week)
      : "",
  );
  const [preferredLongRunDay, setPreferredLongRunDay] = useState<WeekdayName | "">(
    () => defaults?.trainingPreferences?.preferred_long_run_day ?? "",
  );
  const [goalDistance, setGoalDistance] = useState<GoalDistance>("build_consistency");
  const [goalStyle, setGoalStyle] = useState<GoalStyle>("balanced");
  const [targetTime, setTargetTime] = useState("");
  const [startDate, setStartDate] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [planGoalChoice, setPlanGoalChoice] =
    useState<StructuredConstructorState["planGoalChoice"]>("");
  const [planGoalCustomDistanceKm, setPlanGoalCustomDistanceKm] = useState("");
  const [planGoalCustomDistanceLabel, setPlanGoalCustomDistanceLabel] = useState("");
  const [planGoalFinishTime, setPlanGoalFinishTime] = useState("");
  const [planGoalTargetDate, setPlanGoalTargetDate] = useState("");
  const [terrainFocus, setTerrainFocus] = useState<TerrainFocus>("standard");
  const watchAccess: StructuredConstructorState["watchAccess"] = "watch_or_app";
  const [guidancePreference, setGuidancePreference] =
    useState<StructuredConstructorState["guidancePreference"]>("effort");
  const [strengthPreference, setStrengthPreference] = useState<StrengthPreference>("none");
  const [comment, setComment] = useState("");
  const [manualCreateStatus, setManualCreateStatus] = useState<ManualCreateStatus>("idle");
  const [manualCreateError, setManualCreateError] = useState<string | null>(null);
  const [runningPlanConfirmResult, setRunningPlanConfirmResult] =
    useState<RunningPlanConfirmActionResult | null>(null);
  const [runningPlanCreateStatus, setRunningPlanCreateStatus] = useState<"idle" | "creating">(
    "idle",
  );
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);

  const constructorState: StructuredConstructorState = useMemo(
    () => ({
      age,
      weightKg,
      heightCm,
      fitnessLevel,
      recent5kTime,
      recent5kPace,
      fixedRestDays,
      restDaysAnswered,
      maxRunningDaysPerWeek,
      preferredLongRunDay,
      goalDistance,
      goalStyle,
      targetTime,
      startDate,
      targetDate,
      planGoalChoice,
      planGoalCustomDistanceKm,
      planGoalCustomDistanceLabel,
      planGoalFinishTime,
      planGoalTargetDate,
      terrainFocus,
      watchAccess,
      guidancePreference,
      strengthPreference,
      comment,
    }),
    [
      age,
      comment,
      fitnessLevel,
      fixedRestDays,
      goalDistance,
      goalStyle,
      guidancePreference,
      heightCm,
      maxRunningDaysPerWeek,
      planGoalCustomDistanceKm,
      planGoalCustomDistanceLabel,
      planGoalFinishTime,
      planGoalChoice,
      planGoalTargetDate,
      preferredLongRunDay,
      recent5kPace,
      recent5kTime,
      restDaysAnswered,
      startDate,
      strengthPreference,
      targetDate,
      targetTime,
      terrainFocus,
      watchAccess,
      weightKg,
    ],
  );
  const effectiveConstructorState: StructuredConstructorState = useMemo(
    () => ({
      ...constructorState,
      terrainFocus: resolveTerrainFocus(goalDistance, terrainFocus),
    }),
    [constructorState, goalDistance, terrainFocus],
  );
  const hasRequiredPlanBasics = isPresetPrimarySetupReady(constructorState);
  const runnerBaseline = useOnboardingRunnerBaseline({
    defaults,
    state: constructorState,
  });
  const hasAcceptedRunnerBaseline = hasRequiredPlanBasics && runnerBaseline.isReady;
  const isManualSetupReady = isManualProfileReady(constructorState) && runnerBaseline.isReady;
  const selectedPlanPreview = useSelectedPlanPresetPreviewController({
    state: effectiveConstructorState,
    hasRequiredPlanBasics: hasAcceptedRunnerBaseline,
    toastId: STRUCTURED_REVIEW_TOAST_ID,
    previewReadyDescription: "Review the backend-shaped calendar before creating the plan.",
    previewContextKey: runnerBaseline.previewContextKey,
    requiredBasicsMessage:
      "Save your runner baseline and accept the BPM guidance before previewing a generated plan.",
    autoRefreshOpenPreview: true,
    resetOnInputChange: true,
    onResetExternalState: () => setRunningPlanConfirmResult(null),
  });
  const isPresetBusy = selectedPlanPreview.isBusy || runningPlanCreateStatus !== "idle";
  const isManualCreateBusy = manualCreateStatus !== "idle";
  const isBusy = isPresetBusy || isManualCreateBusy || runnerBaseline.isSaving;
  const selectedGoalId = planGoalChoice || null;
  const selectedPlanGoalPreviewGate = resolveSelectedPlanGoalPreviewGate(
    {
      planGoalChoice,
      planGoalCustomDistanceKm,
      planGoalCustomDistanceLabel,
      planGoalFinishTime,
      planGoalTargetDate,
    },
    selectedGoalId,
  );
  const selectedPreviewMatchesGoal = selectedPlanPreview.selectedGoalId === selectedGoalId;
  const selectedPreviewIsReady =
    selectedPreviewMatchesGoal && selectedPlanPreview.previewResult?.ok === true;
  const generatedCreateDisabled =
    isBusy ||
    !hasAcceptedRunnerBaseline ||
    !selectedGoalId ||
    !selectedPlanGoalPreviewGate.ok ||
    (selectedPlanPreview.previewOpen && selectedPreviewIsReady);
  const footerButtonDisabled = advancedSettingsOpen
    ? generatedCreateDisabled
    : isBusy || !isManualSetupReady;
  const footerHint = advancedSettingsOpen
    ? generatedCreateFooterHint({
        error: selectedPlanPreview.error,
        hasRequiredPlanBasics,
        hasAcceptedRunnerBaseline,
        planGoalChoice,
        previewGate: selectedPlanGoalPreviewGate,
        previewIsOpen: selectedPlanPreview.previewOpen,
        previewIsReady: selectedPreviewIsReady,
        status: selectedPlanPreview.status,
      })
    : manualCreateFooterHint({
        error: manualCreateError,
        hasAcceptedRunnerBaseline,
        isManualSetupReady,
        status: manualCreateStatus,
      });

  const changePlanGoalChoice = (value: StructuredConstructorState["planGoalChoice"]) => {
    setPlanGoalChoice(value);

    if (value !== "custom") {
      setPlanGoalCustomDistanceKm("");
      setPlanGoalCustomDistanceLabel("");
    }

    selectedPlanPreview.clearSelectedPreview();
  };

  const toggleAdvancedSettings = () => {
    const nextOpen = !advancedSettingsOpen;

    if (!nextOpen) {
      selectedPlanPreview.setPreviewOpen(false);
      hitoToast.dismiss(STRUCTURED_REVIEW_TOAST_ID);
    }

    setAdvancedSettingsOpen(nextOpen);
  };

  const handleCreatePlanClick = () => {
    if (!advancedSettingsOpen) {
      void createManualPlan();
      return;
    }

    if (!selectedGoalId) {
      return;
    }

    if (selectedPreviewIsReady) {
      selectedPlanPreview.setPreviewOpen(true);
      return;
    }

    selectedPlanPreview.selectPlanPreview(selectedGoalId);
  };

  const openSavedHome = () => {
    window.location.assign("/");
  };

  useEffect(() => {
    setManualCreateError(null);
  }, [age, fitnessLevel, heightCm, weightKg]);

  const confirmSelectedRunningPlan = async () => {
    if (runningPlanCreateInFlightRef.current) {
      return;
    }

    const draft = selectedPlanPreview.previewResult?.ok
      ? selectedPlanPreview.previewResult.draft
      : null;
    const confirmInput = buildRunningPlanConfirmInput(
      draft,
      selectedPlanPreview.previewInput,
      "Refresh the selected preview before creating this plan.",
    );

    if (!confirmInput.ok) {
      setRunningPlanConfirmResult({
        ok: false,
        status: "blocked",
        persisted: false,
        reason: "invalid_review",
        message: confirmInput.message,
        ...(confirmInput.sourceKind ? { sourceKind: confirmInput.sourceKind } : {}),
      });
      return;
    }

    runningPlanCreateInFlightRef.current = true;
    setRunningPlanCreateStatus("creating");
    setRunningPlanConfirmResult(null);
    selectedPlanPreview.setError(null);
    hitoToast.working({
      id: STRUCTURED_REVIEW_TOAST_ID,
      title: "Creating plan",
      description: "Hito is confirming the reviewed selected plan server-side.",
    });

    try {
      const result = await confirmRunningPlanDraftFn({
        data: confirmInput.input,
      });

      setRunningPlanConfirmResult(result);

      if (!result.ok) {
        runningPlanCreateInFlightRef.current = false;
        setRunningPlanCreateStatus("idle");
        hitoToast.error({
          id: STRUCTURED_REVIEW_TOAST_ID,
          title: "Plan not created",
          description: result.message,
        });
        return;
      }

      hitoToast.success({
        id: STRUCTURED_REVIEW_TOAST_ID,
        title: "Plan created",
        description: "Opening your saved plan now.",
        duration: 2600,
      });
      openSavedHome();
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Could not create this plan.";
      runningPlanCreateInFlightRef.current = false;
      setRunningPlanCreateStatus("idle");
      setRunningPlanConfirmResult({
        ok: false,
        status: "blocked",
        persisted: false,
        reason: "persistence_failed",
        message,
        sourceKind: confirmInput.input.sourceKind,
      });
      hitoToast.error({
        id: STRUCTURED_REVIEW_TOAST_ID,
        title: "Plan not created",
        description: message,
      });
    }
  };

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
    setManualCreateStatus("creating");
    setManualCreateError(null);
    hitoToast.working({
      id: MANUAL_CREATE_TOAST_ID,
      title: "Creating manual plan",
      description: "Hito is opening a saved empty calendar for manual building.",
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
          title: "Plan not created",
          description: result.message,
        });
        return;
      }

      hitoToast.success({
        id: MANUAL_CREATE_TOAST_ID,
        title: "Manual plan created",
        description: "Opening your manual calendar now.",
        duration: 2600,
      });
      openSavedHome();
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "The manual plan could not be created.";
      manualCreateInFlightRef.current = false;
      setManualCreateStatus("idle");
      setManualCreateError(message);
      hitoToast.error({
        id: MANUAL_CREATE_TOAST_ID,
        title: "Plan not created",
        description: message,
      });
    }
  };

  return (
    <section className="hito-onboarding-surface">
      <div className="max-w-3xl">
        <p className="hito-micro-label" data-tone="signal">
          Create a plan
        </p>
        <h1 className="hito-page-title mt-3">Choose how to start your plan.</h1>
        <p className="hito-body mt-4 text-muted-foreground">
          Add the basics once, then open an empty calendar or expand generated-plan settings.
        </p>
      </div>

      <div className="mt-8 grid gap-8 pb-0 md:pb-32">
        <QuickSetupPlanSetupSections
          state={constructorState}
          setState={{
            setAge,
            setWeightKg,
            setHeightCm,
            setFitnessLevel,
            setRecent5kTime,
            setRecent5kPace,
            setFixedRestDays,
            setRestDaysAnswered,
            setMaxRunningDaysPerWeek,
            setPreferredLongRunDay,
            setStartDate,
          }}
          includeTrainingSetup={false}
          includeScheduleRhythm={false}
          heartRateProfile={
            <OnboardingRunnerHeartRateProfile
              canPrepare={runnerBaseline.canPrepare}
              onClearError={runnerBaseline.clearError}
              error={runnerBaseline.error}
              isSaving={runnerBaseline.isSaving}
              onPrepare={runnerBaseline.prepare}
              onSave={runnerBaseline.saveHeartRateProfile}
              summary={runnerBaseline.summary}
            />
          }
        />

        <div className="flex justify-center">
          <button
            type="button"
            className="hito-button hito-button-ghost hito-button-md"
            aria-expanded={advancedSettingsOpen}
            aria-controls="advanced-generated-plan-setup"
            disabled={isBusy}
            onClick={toggleAdvancedSettings}
          >
            <span>Advanced settings</span>
            <Icon name={advancedSettingsOpen ? "chevron-up" : "chevron-down"} size="xs" />
          </button>
        </div>

        {advancedSettingsOpen ? (
          <div id="advanced-generated-plan-setup">
            <StructuredPlanConstructor
              mode="quick"
              formRef={structuredFormRef}
              state={constructorState}
              setState={{
                setAge,
                setWeightKg,
                setHeightCm,
                setFitnessLevel,
                setRecent5kTime,
                setRecent5kPace,
                setFixedRestDays,
                setRestDaysAnswered,
                setMaxRunningDaysPerWeek,
                setPreferredLongRunDay,
                setGoalDistance,
                setGoalStyle,
                setTargetTime,
                setStartDate,
                setTargetDate,
                setTerrainFocus,
                setGuidancePreference,
                setStrengthPreference,
                setComment,
              }}
              constructorStatus="idle"
              constructorError={null}
              isBusy={isBusy}
              isConstructorReady={hasRequiredPlanBasics}
              onSubmit={() => {
                selectedPlanPreview.setError("Choose a goal before building a generated preview.");
              }}
              quickSetupSections={{
                includeBaseline: false,
                includeRunningLevel: false,
                includeTrainingSetup: true,
                includeScheduleRhythm: true,
                firstSectionNumber: 4,
                firstSectionHasDivider: false,
              }}
              planPresetPanel={
                <PlanPresetPanel
                  confirmResult={runningPlanConfirmResult}
                  previewResult={selectedPlanPreview.previewResult}
                  createStatus={runningPlanCreateStatus}
                  error={selectedPlanPreview.error}
                  status={selectedPlanPreview.status}
                  hasRequiredPlanBasics={hasAcceptedRunnerBaseline}
                  requiredBasicsCopy="Save your runner baseline and accept the BPM guidance before Hito prepares a reviewed plan."
                  previewOpen={selectedPlanPreview.previewOpen}
                  onPreviewOpenChange={selectedPlanPreview.setPreviewOpen}
                  planGoalChoice={planGoalChoice}
                  planGoalCustomDistanceKm={planGoalCustomDistanceKm}
                  planGoalCustomDistanceLabel={planGoalCustomDistanceLabel}
                  planGoalFinishTime={planGoalFinishTime}
                  planGoalTargetDate={planGoalTargetDate}
                  onPlanGoalChoiceChange={changePlanGoalChoice}
                  onPlanGoalCustomDistanceKmChange={setPlanGoalCustomDistanceKm}
                  onPlanGoalCustomDistanceLabelChange={setPlanGoalCustomDistanceLabel}
                  onPlanGoalFinishTimeChange={setPlanGoalFinishTime}
                  onPlanGoalTargetDateChange={setPlanGoalTargetDate}
                  onRefreshPreview={() => {
                    void selectedPlanPreview.refreshPreview();
                  }}
                  onCreatePlan={() => {
                    void confirmSelectedRunningPlan();
                  }}
                />
              }
            />
          </div>
        ) : null}
      </div>

      <div className="hito-onboarding-submit-footer">
        <div className="hito-onboarding-submit-footer-inner">
          <div className="min-w-0">
            <p className={footerHint.tone === "error" ? "hito-field-error" : "hito-field-helper"}>
              {footerHint.message}
            </p>
          </div>
          <button
            type="button"
            className="hito-button hito-button-primary hito-button-lg shrink-0"
            disabled={footerButtonDisabled}
            aria-busy={isBusy || undefined}
            onClick={handleCreatePlanClick}
          >
            Create plan
          </button>
        </div>
      </div>
    </section>
  );
}

function manualCreateFooterHint({
  error,
  hasAcceptedRunnerBaseline,
  isManualSetupReady,
  status,
}: {
  error: string | null;
  hasAcceptedRunnerBaseline: boolean;
  isManualSetupReady: boolean;
  status: ManualCreateStatus;
}): { message: string; tone: "error" | "neutral" } {
  if (error) {
    return { message: error, tone: "error" };
  }

  if (!isManualSetupReady) {
    return {
      message: hasAcceptedRunnerBaseline
        ? "Add age, height, and weight to create a plan."
        : "Save your runner baseline and accept the BPM guidance before creating a plan.",
      tone: "neutral",
    };
  }

  if (status === "creating") {
    return {
      message: "Creating an empty manual plan now.",
      tone: "neutral",
    };
  }

  return {
    message: "Creates an empty manual plan. No fake workouts will be added.",
    tone: "neutral",
  };
}

function generatedCreateFooterHint({
  error,
  hasAcceptedRunnerBaseline,
  hasRequiredPlanBasics,
  planGoalChoice,
  previewGate,
  previewIsOpen,
  previewIsReady,
  status,
}: {
  error: string | null;
  hasAcceptedRunnerBaseline: boolean;
  hasRequiredPlanBasics: boolean;
  planGoalChoice: StructuredConstructorState["planGoalChoice"];
  previewGate: ReturnType<typeof resolveSelectedPlanGoalPreviewGate>;
  previewIsOpen: boolean;
  previewIsReady: boolean;
  status: ReturnType<typeof useSelectedPlanPresetPreviewController>["status"];
}): { message: string; tone: "error" | "neutral" } {
  if (error) {
    return { message: error, tone: "error" };
  }

  if (!hasRequiredPlanBasics) {
    return {
      message: "Add age, height, and weight before creating a plan.",
      tone: "neutral",
    };
  }

  if (!hasAcceptedRunnerBaseline) {
    return {
      message: "Save your runner baseline and accept the BPM guidance before creating a plan.",
      tone: "neutral",
    };
  }

  if (status === "previewing_plan") {
    return {
      message: "Building a reviewed preview before anything is saved.",
      tone: "neutral",
    };
  }

  if (previewIsOpen && previewIsReady) {
    return {
      message: "Review the preview, then confirm in the dialog.",
      tone: "neutral",
    };
  }

  if (previewIsReady) {
    return {
      message: "Review the generated preview, then confirm it.",
      tone: "neutral",
    };
  }

  if (!planGoalChoice) {
    return {
      message: "Choose a goal to build a reviewed preview.",
      tone: "neutral",
    };
  }

  if (!previewGate.ok) {
    return { message: previewGate.error, tone: "neutral" };
  }

  return {
    message: "Builds a reviewed generated-plan preview before anything is saved.",
    tone: "neutral",
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
    return { ok: false, error: "Add age, height, and weight to create a manual plan." };
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
