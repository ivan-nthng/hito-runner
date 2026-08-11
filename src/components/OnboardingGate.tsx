import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { HitoButton } from "@/components/ui/button";
import { useHitoTabs } from "@/components/ui/hito-tabs";
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
  type StructuredConstructorState,
} from "@/components/onboarding/onboarding-form-model";
import {
  buildOnboardingGeneratedPlanSetupState,
  useGeneratedPlanSetupState,
} from "@/components/onboarding/use-generated-plan-setup-state";
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
type PlanStartMode = "generated" | "manual";

const STRUCTURED_REVIEW_TOAST_ID = "onboarding-structured-review";
const MANUAL_CREATE_TOAST_ID = "manual-empty-plan-create";
const PLAN_START_TABS: { value: PlanStartMode; label: string }[] = [
  { value: "generated", label: "Create a plan" },
  { value: "manual", label: "Build myself" },
];

export function OnboardingGate({ defaults = null }: { defaults?: UserSettingsSummary | null }) {
  const createEmptyManualActivePlanFn = useServerFn(createEmptyManualActivePlan);
  const confirmRunningPlanDraftFn = useServerFn(confirmRunningPlanDraft);
  const structuredFormRef = useRef<HTMLFormElement | null>(null);
  const runningPlanCreateInFlightRef = useRef(false);
  const manualCreateInFlightRef = useRef(false);
  const previewReturnFocusRef = useRef<HTMLElement | null>(null);
  const planGoalFocusRef = useRef<HTMLButtonElement | null>(null);

  const initialSetupState = useMemo(
    () => buildOnboardingGeneratedPlanSetupState(defaults),
    [defaults],
  );
  const planSetup = useGeneratedPlanSetupState(initialSetupState);
  const {
    state: constructorState,
    constructorSetters,
    selectPlanGoal,
    setPlanGoalCustomDistanceKm,
    setPlanGoalCustomDistanceLabel,
    setPlanGoalFinishTime,
    setPlanGoalTargetDate,
    setRunnerComment,
  } = planSetup;
  const {
    age,
    weightKg,
    heightCm,
    fitnessLevel,
    planGoalChoice,
    planGoalCustomDistanceKm,
    planGoalCustomDistanceLabel,
    planGoalFinishTime,
    planGoalTargetDate,
    runnerComment,
  } = constructorState;
  const [manualCreateStatus, setManualCreateStatus] = useState<ManualCreateStatus>("idle");
  const [manualCreateError, setManualCreateError] = useState<string | null>(null);
  const [runningPlanConfirmResult, setRunningPlanConfirmResult] =
    useState<RunningPlanConfirmActionResult | null>(null);
  const [runningPlanCreateStatus, setRunningPlanCreateStatus] = useState<"idle" | "creating">(
    "idle",
  );
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const [planStartMode, setPlanStartMode] = useState<PlanStartMode>("generated");

  const hasRequiredPlanBasics = isPresetPrimarySetupReady(constructorState);
  const runnerBaseline = useOnboardingRunnerBaseline({
    defaults,
    state: constructorState,
  });
  const hasAcceptedRunnerBaseline = hasRequiredPlanBasics && runnerBaseline.isReady;
  const isManualSetupReady = isManualProfileReady(constructorState) && runnerBaseline.isReady;
  const selectedPlanPreview = useSelectedPlanPresetPreviewController({
    state: constructorState,
    hasRequiredPlanBasics: hasAcceptedRunnerBaseline,
    toastId: STRUCTURED_REVIEW_TOAST_ID,
    previewReadyDescription: "Review the saved plan before adding its workouts to Calendar.",
    previewContextKey: runnerBaseline.previewContextKey,
    requiredBasicsMessage:
      "Save your runner baseline and accept the BPM guidance before previewing a generated plan.",
    resetOnInputChange: true,
    onPreviewDispatch: () => setRunnerComment(""),
    onResetExternalState: () => setRunningPlanConfirmResult(null),
  });
  const isPresetBusy = selectedPlanPreview.isBusy || runningPlanCreateStatus !== "idle";
  const isManualCreateBusy = manualCreateStatus !== "idle";
  const isBusy = isPresetBusy || isManualCreateBusy || runnerBaseline.isSaving;
  const planStartTabs = useHitoTabs({
    items: PLAN_START_TABS.map((tab) => ({ value: tab.value, disabled: isBusy })),
    value: planStartMode,
  });
  const pendingPreviewCanReopen =
    selectedPlanPreview.status === "previewing_plan" &&
    !selectedPlanPreview.previewOpen &&
    runningPlanCreateStatus === "idle" &&
    manualCreateStatus === "idle" &&
    !runnerBaseline.isSaving;
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
    (isBusy && !pendingPreviewCanReopen) ||
    !hasAcceptedRunnerBaseline ||
    !selectedGoalId ||
    !selectedPlanGoalPreviewGate.ok ||
    (selectedPlanPreview.previewOpen && selectedPreviewIsReady);
  const footerHint = generatedCreateFooterHint({
    error: selectedPlanPreview.error,
    hasRequiredPlanBasics,
    hasAcceptedRunnerBaseline,
    notice: selectedPlanPreview.notice,
    planGoalChoice,
    previewGate: selectedPlanGoalPreviewGate,
    previewIsOpen: selectedPlanPreview.previewOpen,
    previewIsReady: selectedPreviewIsReady,
    status: selectedPlanPreview.status,
  });

  const changePlanGoalChoice = (value: StructuredConstructorState["planGoalChoice"]) => {
    selectPlanGoal(value);
    selectedPlanPreview.clearSelectedPreview();
  };

  const clearGeneratedPlanSetup = () => {
    selectedPlanPreview.clearSelectedPreview();
    planSetup.reset(buildOnboardingGeneratedPlanSetupState(defaults));
    setAdvancedSettingsOpen(false);
    window.requestAnimationFrame(() => planGoalFocusRef.current?.focus());
  };

  const toggleAdvancedSettings = () => {
    setAdvancedSettingsOpen((current) => !current);
  };

  const handleCreatePlanClick = async (trigger?: HTMLElement) => {
    if (!selectedGoalId) {
      selectedPlanPreview.setError("Choose a training distance before creating a generated plan.");
      return;
    }

    const activeElement = trigger ?? document.activeElement;
    previewReturnFocusRef.current = activeElement instanceof HTMLElement ? activeElement : null;

    if (selectedPlanPreview.status === "previewing_plan") {
      selectedPlanPreview.setPreviewOpen(true);
      return;
    }

    if (selectedPreviewIsReady) {
      selectedPlanPreview.setPreviewOpen(true);
      return;
    }

    if (!(await runnerBaseline.persistHeartRateDraft())) {
      selectedPlanPreview.setError(
        runnerBaseline.error ?? "Check the highlighted BPM ranges before creating this plan.",
      );
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
      "Refresh the saved preview before adding its workouts to Calendar.",
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
      title: "Adding workouts to Calendar",
      description: "Hito is adding this saved plan's workouts to Calendar.",
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
          title: "Calendar not updated",
          description: result.message,
        });
        return;
      }

      hitoToast.success({
        id: STRUCTURED_REVIEW_TOAST_ID,
        title: "Calendar workouts added",
        description: "Opening Calendar now.",
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
        title: "Calendar not updated",
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
    if (!(await runnerBaseline.persistHeartRateDraft())) {
      manualCreateInFlightRef.current = false;
      setManualCreateError(
        runnerBaseline.error ?? "Check the highlighted BPM ranges before starting training.",
      );
      return;
    }

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
        <h1 className="hito-ui-page-title">Choose how to start your plan.</h1>
        <p className="hito-body mt-4 text-muted-foreground">
          Add the basics once, then choose a training distance or open an empty manual calendar.
        </p>
      </div>

      <div className="mt-8 grid gap-8 pb-0 md:pb-32">
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

        {hasAcceptedRunnerBaseline ? (
          <section className="grid min-w-0 gap-6 rounded-3xl bg-surface p-5 dark:bg-background lg:p-6">
            <div
              className="hito-tabs hito-tabs-enclosed mx-auto w-fit max-w-full"
              {...planStartTabs.tabListProps}
              aria-label="Plan creation method"
            >
              {PLAN_START_TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  {...planStartTabs.getTabProps(tab.value)}
                  disabled={isBusy}
                  onClick={() => setPlanStartMode(tab.value)}
                  data-active={planStartMode === tab.value}
                  className="hito-tab"
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="min-w-0" {...planStartTabs.getPanelProps(planStartMode)}>
              {planStartMode === "generated" ? (
                <div className="grid gap-8">
                  <PlanPresetPanel
                    confirmResult={runningPlanConfirmResult}
                    previewResult={selectedPlanPreview.previewResult}
                    createStatus={runningPlanCreateStatus}
                    error={selectedPlanPreview.error}
                    status={selectedPlanPreview.status}
                    hasRequiredPlanBasics={hasAcceptedRunnerBaseline}
                    requiredBasicsCopy="Save your runner baseline and accept the BPM guidance before Hito prepares a reviewed plan."
                    previewOpen={selectedPlanPreview.previewOpen}
                    onCancelPreview={selectedPlanPreview.cancelPreview}
                    onPreviewOpenChange={selectedPlanPreview.setPreviewOpen}
                    planGoalChoice={planGoalChoice}
                    planGoalCustomDistanceKm={planGoalCustomDistanceKm}
                    planGoalCustomDistanceLabel={planGoalCustomDistanceLabel}
                    planGoalFinishTime={planGoalFinishTime}
                    planGoalTargetDate={planGoalTargetDate}
                    runnerComment={runnerComment}
                    onPlanGoalChoiceChange={changePlanGoalChoice}
                    onPlanGoalCustomDistanceKmChange={setPlanGoalCustomDistanceKm}
                    onPlanGoalCustomDistanceLabelChange={setPlanGoalCustomDistanceLabel}
                    onPlanGoalFinishTimeChange={setPlanGoalFinishTime}
                    onPlanGoalTargetDateChange={setPlanGoalTargetDate}
                    onRunnerCommentChange={setRunnerComment}
                    onRefreshPreview={() => {
                      void selectedPlanPreview.refreshPreview();
                    }}
                    onCreatePlan={() => {
                      void confirmSelectedRunningPlan();
                    }}
                    previewReturnFocusRef={previewReturnFocusRef}
                    planGoalFocusRef={planGoalFocusRef}
                  />

                  <div className="flex justify-center">
                    <HitoButton
                      type="button"
                      size="md"
                      variant="ghost"
                      aria-expanded={advancedSettingsOpen}
                      aria-controls="advanced-generated-plan-setup"
                      disabled={isBusy}
                      onClick={toggleAdvancedSettings}
                    >
                      <span>Advanced settings</span>
                      <Icon name={advancedSettingsOpen ? "chevron-up" : "chevron-down"} size="xs" />
                    </HitoButton>
                  </div>

                  {advancedSettingsOpen ? (
                    <div id="advanced-generated-plan-setup">
                      <StructuredPlanConstructor
                        formRef={structuredFormRef}
                        state={constructorState}
                        setState={constructorSetters}
                        isBusy={isBusy}
                        isConstructorReady={hasRequiredPlanBasics}
                        onSubmit={() => handleCreatePlanClick()}
                        quickSetupSections={{
                          includeBaseline: false,
                          includeRunningLevel: false,
                          includeTrainingSetup: true,
                          includeScheduleRhythm: true,
                          firstSectionNumber: 4,
                          firstSectionHasDivider: false,
                        }}
                      />
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="pt-6">
                  <p className="hito-body text-center text-foreground/85">
                    Create workouts independently, or use a workout from a coach or friend.
                  </p>
                </div>
              )}
            </div>
          </section>
        ) : null}
      </div>

      {hasAcceptedRunnerBaseline ? (
        <div className="hito-onboarding-submit-footer">
          <div className="hito-onboarding-submit-footer-inner">
            {planStartMode === "generated" ? (
              <>
                <div className="min-w-0">
                  <p
                    className={
                      footerHint.tone === "error" ? "hito-field-error" : "hito-field-helper"
                    }
                    role={
                      selectedPreviewIsReady && !selectedPlanPreview.previewOpen
                        ? "status"
                        : undefined
                    }
                  >
                    {footerHint.message}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                  {selectedPreviewIsReady && !selectedPlanPreview.previewOpen ? (
                    <HitoButton
                      type="button"
                      size="lg"
                      variant="secondary"
                      disabled={isBusy}
                      onClick={clearGeneratedPlanSetup}
                    >
                      Clear plan
                    </HitoButton>
                  ) : null}
                  <HitoButton
                    type="button"
                    size="lg"
                    variant="primary"
                    disabled={generatedCreateDisabled}
                    loading={isBusy && !pendingPreviewCanReopen}
                    onClick={(event) => handleCreatePlanClick(event.currentTarget)}
                  >
                    {selectedPreviewIsReady && !selectedPlanPreview.previewOpen
                      ? "Review plan"
                      : "Create plan"}
                  </HitoButton>
                </div>
              </>
            ) : (
              <>
                <div className="min-w-0">
                  <p className={manualCreateError ? "hito-field-error" : "hito-field-helper"}>
                    {manualCreateError ?? "Your saved runner baseline will be used for this plan."}
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
                  {manualCreateStatus === "creating" ? "Opening manual calendar..." : "Create plan"}
                </HitoButton>
              </>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function generatedCreateFooterHint({
  error,
  hasAcceptedRunnerBaseline,
  hasRequiredPlanBasics,
  notice,
  planGoalChoice,
  previewGate,
  previewIsOpen,
  previewIsReady,
  status,
}: {
  error: string | null;
  hasAcceptedRunnerBaseline: boolean;
  hasRequiredPlanBasics: boolean;
  notice: string | null;
  planGoalChoice: StructuredConstructorState["planGoalChoice"];
  previewGate: ReturnType<typeof resolveSelectedPlanGoalPreviewGate>;
  previewIsOpen: boolean;
  previewIsReady: boolean;
  status: ReturnType<typeof useSelectedPlanPresetPreviewController>["status"];
}): { message: string; tone: "error" | "neutral" } {
  if (error) {
    return { message: error, tone: "error" };
  }

  if (notice) {
    return { message: notice, tone: "neutral" };
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
      message: "Building a reviewed preview. Successful previews are saved in Plans.",
      tone: "neutral",
    };
  }

  if (previewIsOpen && previewIsReady) {
    return {
      message: "Review the saved plan, then add its workouts to Calendar.",
      tone: "neutral",
    };
  }

  if (previewIsReady) {
    return {
      message: "Saved plan ready for review. Calendar workouts have not been added.",
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
    message: "A successful reviewed preview is saved in Plans before Calendar workouts are added.",
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
