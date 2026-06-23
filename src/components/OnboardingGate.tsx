import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { EditableValueChip } from "@/components/ui/editable-value-chip";
import { type HitoIconName } from "@/components/ui/icon";
import { hitoToast } from "@/components/ui/hito-toast";
import { PlanPresetPanel } from "@/components/onboarding/PlanPresetPanel";
import {
  OptionButton,
  OptionGrid,
  StructuredPlanConstructor,
} from "@/components/onboarding/StructuredPlanConstructor";
import {
  buildStructuredInput,
  isPresetPrimarySetupReady,
  isStructuredConstructorReady,
  normalizePresetPrimaryFitnessLevel,
  PRESET_PRIMARY_FITNESS_LEVEL_OPTIONS,
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
import type { StructuredFirstPlanDraftResult } from "@/lib/first-plan-actions";
import {
  confirmStructuredFirstPlanDraft,
  generateStructuredFirstPlanDraft,
} from "@/lib/first-plan-actions";
import type { RunningPlanConfirmActionResult } from "@/lib/running-plan-engine-actions";
import { confirmRunningPlanDraft } from "@/lib/running-plan-engine-actions";
import { createEmptyManualActivePlan } from "@/lib/manual-workout-authoring";
import type { ManualEmptyPlanSetupInput } from "@/lib/manual-workout-authoring/schema";
import { buildRunningPlanConfirmInput } from "@/components/onboarding/selected-running-plan-flow-utils";
import { useSelectedPlanPresetPreviewController } from "@/components/onboarding/use-selected-plan-preset-preview-controller";

type ConstructorStatus = "idle" | "reviewing" | "creating" | "finishing";
type ManualCreateStatus = "idle" | "creating";
type SetupMode = "manual" | "quick";
type ManualProfileEditableKey = "age" | "heightCm" | "weightKg";

const STRUCTURED_REVIEW_TOAST_ID = "onboarding-structured-review";
const STRUCTURED_REVIEW_TIMEOUT_MS = 300_000;
const MANUAL_CREATE_TOAST_ID = "manual-empty-plan-create";

export function OnboardingGate({ defaults = null }: { defaults?: UserSettingsSummary | null }) {
  const createEmptyManualActivePlanFn = useServerFn(createEmptyManualActivePlan);
  const generateStructuredFirstPlanDraftFn = useServerFn(generateStructuredFirstPlanDraft);
  const confirmStructuredFirstPlanDraftFn = useServerFn(confirmStructuredFirstPlanDraft);
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
  const [fitnessLevel, setFitnessLevel] = useState<RunnerFitnessLevel>("running_regularly");
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
  const [terrainFocus, setTerrainFocus] = useState<TerrainFocus>("standard");
  const watchAccess: StructuredConstructorState["watchAccess"] = "watch_or_app";
  const [guidancePreference, setGuidancePreference] =
    useState<StructuredConstructorState["guidancePreference"]>("effort");
  const [strengthPreference, setStrengthPreference] = useState<StrengthPreference>("none");
  const [comment, setComment] = useState("");
  const [constructorStatus, setConstructorStatus] = useState<ConstructorStatus>("idle");
  const [manualCreateStatus, setManualCreateStatus] = useState<ManualCreateStatus>("idle");
  const [manualCreateError, setManualCreateError] = useState<string | null>(null);
  const [structuredDraftResult, setStructuredDraftResult] =
    useState<StructuredFirstPlanDraftResult | null>(null);
  const [constructorError, setConstructorError] = useState<string | null>(null);
  const [runningPlanConfirmResult, setRunningPlanConfirmResult] =
    useState<RunningPlanConfirmActionResult | null>(null);
  const [runningPlanCreateStatus, setRunningPlanCreateStatus] = useState<"idle" | "creating">(
    "idle",
  );
  const [setupMode, setSetupMode] = useState<SetupMode>("manual");
  const [activeManualEditableKey, setActiveManualEditableKey] =
    useState<ManualProfileEditableKey | null>(null);

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
  const isConstructorReady = isStructuredConstructorReady(constructorState);
  const isPresetDiscoveryReady = isPresetPrimarySetupReady(constructorState);
  const primaryFitnessLevel = normalizePresetPrimaryFitnessLevel(fitnessLevel);
  const isManualSetupReady = isManualProfileReady(constructorState);
  const selectedPlanPreview = useSelectedPlanPresetPreviewController({
    state: effectiveConstructorState,
    autoLoadEnabled: setupMode === "quick",
    isPresetDiscoveryReady,
    toastId: STRUCTURED_REVIEW_TOAST_ID,
    previewReadyDescription: "Review the backend-shaped calendar before creating the plan.",
    autoRefreshOpenPreview: true,
    resetOnInputChange: true,
    onResetExternalState: () => setRunningPlanConfirmResult(null),
  });
  const isPresetBusy = selectedPlanPreview.isBusy || runningPlanCreateStatus !== "idle";
  const isManualCreateBusy = manualCreateStatus !== "idle";
  const isBusy = constructorStatus !== "idle" || isPresetBusy || isManualCreateBusy;

  const openSavedHome = () => {
    window.location.assign("/");
  };

  useEffect(() => {
    setManualCreateError(null);
  }, [age, fitnessLevel, heightCm, weightKg]);

  const clearStructuredReview = () => {
    setStructuredDraftResult(null);
    setConstructorError(null);
    hitoToast.dismiss(STRUCTURED_REVIEW_TOAST_ID);
  };

  const submitStructuredReview = async () => {
    setConstructorError(null);
    setStructuredDraftResult(null);

    try {
      const inputResult = buildStructuredInput(effectiveConstructorState);

      if (!inputResult.ok) {
        setConstructorError(inputResult.error);
        return;
      }

      setConstructorStatus("reviewing");
      hitoToast.working({
        id: STRUCTURED_REVIEW_TOAST_ID,
        title: "Reviewing plan",
        description: "Hito is preparing your full plan review before anything is created.",
      });

      const result = await withStructuredReviewTimeout(() =>
        generateStructuredFirstPlanDraftFn({
          data: inputResult.input,
        }),
      );

      setStructuredDraftResult(result);
      setConstructorStatus("idle");

      if (!result.ok || result.status === "correction_required") {
        const message = structuredDraftResultMessage(result);
        setConstructorError(message);
        window.requestAnimationFrame(() =>
          structuredFormRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }),
        );
        hitoToast.error({
          id: STRUCTURED_REVIEW_TOAST_ID,
          title: result.ok ? "Setup needs correction" : "Review failed",
          description: message,
        });
        return;
      }

      hitoToast.success({
        id: STRUCTURED_REVIEW_TOAST_ID,
        title: "Plan ready",
        description: "Review your full plan before confirming.",
      });
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Could not review the setup.";
      setConstructorStatus("idle");
      setConstructorError(message);
      hitoToast.error({
        id: STRUCTURED_REVIEW_TOAST_ID,
        title: "Review failed",
        description: message,
      });
    }
  };

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
        ...(confirmInput.planFamily ? { planFamily: confirmInput.planFamily } : {}),
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
        planFamily: confirmInput.input.planFamily,
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

  const confirmStructuredPlan = async () => {
    if (!structuredDraftResult?.ok || structuredDraftResult.status !== "draft_ready") {
      setConstructorError("Generate a ready review before creating the plan.");
      return;
    }

    setConstructorStatus("creating");
    setConstructorError(null);
    hitoToast.working({
      id: STRUCTURED_REVIEW_TOAST_ID,
      title: "Creating plan",
      description: "Hito is creating the active plan from the reviewed plan.",
    });

    try {
      const result = await confirmStructuredFirstPlanDraftFn({
        data: {
          draft: structuredDraftResult.draft,
        },
      });

      if (!result.ok) {
        setConstructorStatus("idle");
        setConstructorError(resultFailureMessage(result));
        hitoToast.error({
          id: STRUCTURED_REVIEW_TOAST_ID,
          title: "Plan not created",
          description: resultFailureMessage(result),
        });
        return;
      }

      setConstructorStatus("finishing");
      hitoToast.success({
        id: STRUCTURED_REVIEW_TOAST_ID,
        title: "Plan created",
        description: "Opening your saved plan now.",
        duration: 2600,
      });
      openSavedHome();
    } catch (submitError) {
      setConstructorStatus("idle");
      const message =
        submitError instanceof Error ? submitError.message : "Could not create the plan.";
      setConstructorError(message);
      hitoToast.error({
        id: STRUCTURED_REVIEW_TOAST_ID,
        title: "Plan not created",
        description: message,
      });
    }
  };

  return (
    <section className="hito-surface hito-onboarding-surface" data-mode={setupMode}>
      <div className="max-w-3xl">
        <p className="hito-micro-label" data-tone="signal">
          Create a plan
        </p>
        <h1 className="hito-page-title mt-3">Choose how to start your plan.</h1>
        <p className="hito-body mt-4 text-muted-foreground">
          Start from an empty manual calendar, or choose a guided plan to review.
        </p>
      </div>

      <div className="mt-7">
        <div className="hito-tabs hito-tabs-simple" role="tablist" aria-label="Setup mode">
          <button
            type="button"
            role="tab"
            aria-selected={setupMode === "manual"}
            className="hito-tab"
            data-active={setupMode === "manual"}
            disabled={isBusy}
            onClick={() => setSetupMode("manual")}
          >
            Manual setup
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={setupMode === "quick"}
            className="hito-tab"
            data-active={setupMode === "quick"}
            disabled={isBusy}
            onClick={() => setSetupMode("quick")}
          >
            Quick setup
          </button>
        </div>
      </div>

      {setupMode === "manual" ? (
        <div className="mt-6 grid gap-6">
          <section className="hito-form-section-grid">
            <div>
              <p className="hito-micro-label">01</p>
              <h2 className="hito-panel-title mt-2">Manual setup</h2>
              <p className="hito-helper mt-2">
                Add the basics, then open your saved empty calendar.
              </p>
            </div>
            <div className="grid gap-4">
              <div className="hito-editable-value-chip-group">
                <EditableValueChip
                  fieldKey="age"
                  label="Age"
                  value={age}
                  setValue={setAge}
                  activeEditableKey={activeManualEditableKey}
                  setActiveEditableKey={setActiveManualEditableKey}
                  placeholder="34"
                  min={13}
                  max={100}
                  step={1}
                  inputMode="numeric"
                />
                <EditableValueChip
                  fieldKey="heightCm"
                  label="Height"
                  value={heightCm}
                  setValue={setHeightCm}
                  activeEditableKey={activeManualEditableKey}
                  setActiveEditableKey={setActiveManualEditableKey}
                  placeholder="178"
                  min={120}
                  max={230}
                  step={1}
                  inputMode="numeric"
                />
                <EditableValueChip
                  fieldKey="weightKg"
                  label="Weight"
                  value={weightKg}
                  setValue={setWeightKg}
                  activeEditableKey={activeManualEditableKey}
                  setActiveEditableKey={setActiveManualEditableKey}
                  placeholder="72"
                  min={30}
                  max={250}
                  step={0.5}
                  inputMode="decimal"
                  unit="kg"
                />
              </div>

              <div className="grid gap-2">
                <span className="hito-form-label">Running level</span>
                <OptionGrid label="Running level">
                  {PRESET_PRIMARY_FITNESS_LEVEL_OPTIONS.map((option) => (
                    <OptionButton
                      key={option.value}
                      active={primaryFitnessLevel === option.value}
                      icon={manualFitnessLevelIcon(option.value)}
                      label={option.label}
                      copy={option.copy}
                      onClick={() => {
                        setFitnessLevel(option.value);
                        setRecent5kTime("");
                        setRecent5kPace("");
                      }}
                    />
                  ))}
                </OptionGrid>
                <span className="hito-field-helper">
                  Hito creates the calendar now. You can add reviewed activities from the saved
                  plan.
                </span>
              </div>

              <div className="hito-section-divider flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  {manualCreateError ? (
                    <p className="hito-field-error">{manualCreateError}</p>
                  ) : (
                    <p className="hito-field-helper">
                      Creates an empty manual plan with no fake workouts or generated rows.
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className="hito-button hito-button-primary hito-button-lg shrink-0"
                  disabled={isBusy || !isManualSetupReady}
                  onClick={() => void createManualPlan()}
                >
                  {manualCreateStatus === "creating" ? "Creating plan..." : "Create your plan"}
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {setupMode === "quick" ? (
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
          constructorStatus={constructorStatus}
          draftResult={structuredDraftResult}
          constructorError={constructorError}
          isBusy={isBusy}
          isConstructorReady={isConstructorReady}
          onSubmit={() => {
            void submitStructuredReview();
          }}
          onConfirmDraft={() => {
            void confirmStructuredPlan();
          }}
          onBackToEdit={() => {
            clearStructuredReview();
          }}
          planPresetPanel={
            <PlanPresetPanel
              cardsResult={selectedPlanPreview.cardsResult}
              confirmResult={runningPlanConfirmResult}
              previewResult={selectedPlanPreview.previewResult}
              createStatus={runningPlanCreateStatus}
              error={selectedPlanPreview.error}
              status={selectedPlanPreview.status}
              isBusy={isBusy}
              isPresetDiscoveryReady={isPresetDiscoveryReady}
              selectedCardId={selectedPlanPreview.selectedCardId}
              previewOpen={selectedPlanPreview.previewOpen}
              onPreviewOpenChange={selectedPlanPreview.setPreviewOpen}
              onLoadCards={() => {
                void selectedPlanPreview.loadCards();
              }}
              onSelectPlan={(cardId) => {
                selectedPlanPreview.selectPlanPreview(cardId);
              }}
              onRefreshPreview={() => {
                void selectedPlanPreview.refreshPreview();
              }}
              onCreatePlan={() => {
                void confirmSelectedRunningPlan();
              }}
            />
          }
        />
      ) : null}
    </section>
  );
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

function manualFitnessLevelIcon(value: RunnerFitnessLevel): HitoIconName {
  switch (value) {
    case "new_to_running":
      return "sparkles";
    case "beginner":
      return "activity";
    case "running_regularly":
      return "check-circle";
    case "performance_focused":
      return "watch";
    case "custom":
      return "edit";
  }
}

function withStructuredReviewTimeout<T>(run: () => Promise<T>) {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(
        new Error(
          "The review is taking longer than expected. No plan was created. Try Review plan again.",
        ),
      );
    }, STRUCTURED_REVIEW_TIMEOUT_MS);

    Promise.resolve()
      .then(run)
      .then(
        (value) => {
          window.clearTimeout(timeoutId);
          resolve(value);
        },
        (error: unknown) => {
          window.clearTimeout(timeoutId);
          reject(error);
        },
      );
  });
}

function resultFailureMessage(result: { status?: string; message?: string }) {
  if (result.message) {
    return result.message;
  }

  if (result.status === "blocked_by_history") {
    return "This plan would conflict with saved history. Adjust the setup and try again.";
  }

  return "Could not apply that plan yet. Check the setup answers and try again.";
}

function structuredDraftResultMessage(result: StructuredFirstPlanDraftResult) {
  if (!result.ok) {
    return result.message;
  }

  if (result.status === "correction_required") {
    return result.correction.message;
  }

  return "Review the plan before creating it.";
}
