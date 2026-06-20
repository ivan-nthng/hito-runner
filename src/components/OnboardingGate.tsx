import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { EditableValueChip } from "@/components/ui/editable-value-chip";
import { type HitoIconName } from "@/components/ui/icon";
import { hitoToast } from "@/components/ui/hito-toast";
import { PlanPresetPanel, type PlanPresetUiStatus } from "@/components/onboarding/PlanPresetPanel";
import {
  OptionButton,
  OptionGrid,
  StructuredPlanConstructor,
} from "@/components/onboarding/StructuredPlanConstructor";
import {
  buildStructuredInput,
  isRecent5kPaceInAcceptedRange,
  isRecent5kTimeInAcceptedRange,
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
import type { PlanPresetCardId, PlanPresetCardRequestInput } from "@/lib/plan-presets/schema";
import { getPlanPresetCards, type PlanPresetCardsActionResult } from "@/lib/plan-preset-actions";
import type { RunningPlanDistanceFamily, RunningPlanRunnerLevel } from "@/lib/plan-creation-engine";
import type { RunnerFitnessLevel } from "@/lib/runner-training-preferences";
import type { UserSettingsSummary } from "@/lib/user-settings-actions";
import type { StructuredFirstPlanDraftResult } from "@/lib/first-plan-actions";
import type {
  RunningPlanConfirmActionResult,
  RunningPlanPreviewActionInput,
  RunningPlanPreviewActionResult,
} from "@/lib/running-plan-engine-actions";
import {
  createEmptyManualActivePlan,
  confirmRunningPlanDraft,
  confirmStructuredFirstPlanDraft,
  generateStructuredFirstPlanDraft,
  previewRunningPlanDraft,
} from "@/lib/training-api";
import type { ManualEmptyPlanSetupInput } from "@/lib/manual-workout-authoring/schema";

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
  const getPlanPresetCardsFn = useServerFn(getPlanPresetCards);
  const previewRunningPlanDraftFn = useServerFn(previewRunningPlanDraft);
  const confirmRunningPlanDraftFn = useServerFn(confirmRunningPlanDraft);
  const structuredFormRef = useRef<HTMLFormElement | null>(null);
  const presetAutoLoadKeyRef = useRef<string | null>(null);
  const runningPlanPreviewInputKeyRef = useRef<string | null>(null);
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
  const [presetStatus, setPresetStatus] = useState<PlanPresetUiStatus>("idle");
  const [presetCardsResult, setPresetCardsResult] = useState<PlanPresetCardsActionResult | null>(
    null,
  );
  const [presetSelectedCardId, setPresetSelectedCardId] = useState<PlanPresetCardId | null>(null);
  const [runningPlanPreviewOpen, setRunningPlanPreviewOpen] = useState(false);
  const [runningPlanPreviewResult, setRunningPlanPreviewResult] =
    useState<RunningPlanPreviewActionResult | null>(null);
  const [runningPlanPreviewInput, setRunningPlanPreviewInput] =
    useState<RunningPlanPreviewActionInput | null>(null);
  const [runningPlanConfirmResult, setRunningPlanConfirmResult] =
    useState<RunningPlanConfirmActionResult | null>(null);
  const [runningPlanCreateStatus, setRunningPlanCreateStatus] = useState<"idle" | "creating">(
    "idle",
  );
  const [presetError, setPresetError] = useState<string | null>(null);
  const [setupMode, setSetupMode] = useState<SetupMode>("manual");
  const [activeManualEditableKey, setActiveManualEditableKey] =
    useState<ManualProfileEditableKey | null>(null);

  const isPresetBusy = presetStatus !== "idle" || runningPlanCreateStatus !== "idle";
  const isManualCreateBusy = manualCreateStatus !== "idle";
  const isBusy = constructorStatus !== "idle" || isPresetBusy || isManualCreateBusy;
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
  const presetCardInput = buildPlanPresetCardInput(effectiveConstructorState);
  const presetDiscoveryKey = buildPlanPresetCardInputKey(presetCardInput);

  const openSavedHome = () => {
    window.location.assign("/");
  };

  useEffect(() => {
    setManualCreateError(null);
  }, [age, fitnessLevel, heightCm, weightKg]);

  useEffect(() => {
    presetAutoLoadKeyRef.current = null;
    runningPlanPreviewInputKeyRef.current = null;
    setRunningPlanPreviewResult(null);
    setRunningPlanPreviewInput(null);
    setRunningPlanConfirmResult(null);
    setPresetError(null);

    if (!presetSelectedCardId && !runningPlanPreviewOpen) {
      setPresetCardsResult(null);
    }
  }, [presetDiscoveryKey, presetSelectedCardId, runningPlanPreviewOpen]);

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

  const loadPlanPresetCards = async () => {
    setPresetError(null);
    setPresetSelectedCardId(null);
    setRunningPlanPreviewResult(null);
    setRunningPlanPreviewInput(null);
    setRunningPlanConfirmResult(null);
    runningPlanPreviewInputKeyRef.current = null;

    try {
      setPresetStatus("loading_cards");
      const result = await getPlanPresetCardsFn({
        data: buildPlanPresetCardInput(effectiveConstructorState),
      });

      setPresetCardsResult(result);
      setPresetStatus("idle");

      if (!result.ok) {
        setPresetError(result.message);
      }
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Could not load plan presets.";
      setPresetStatus("idle");
      setPresetError(message);
    }
  };

  const autoLoadPlanPresetCards = useEffectEvent(() => {
    void loadPlanPresetCards();
  });

  useEffect(() => {
    if (
      setupMode !== "quick" ||
      !isPresetDiscoveryReady ||
      presetStatus !== "idle" ||
      presetCardsResult
    ) {
      return;
    }

    if (presetAutoLoadKeyRef.current === presetDiscoveryKey) {
      return;
    }

    presetAutoLoadKeyRef.current = presetDiscoveryKey;
    autoLoadPlanPresetCards();
  }, [
    setupMode,
    isPresetDiscoveryReady,
    presetStatus,
    presetCardsResult,
    presetDiscoveryKey,
    autoLoadPlanPresetCards,
  ]);

  const refreshSelectedRunningPlanPreview = async (cardIdOverride?: PlanPresetCardId) => {
    const cardId = cardIdOverride ?? presetSelectedCardId;

    if (!cardId) {
      setPresetStatus("idle");
      setRunningPlanPreviewResult(null);
      setRunningPlanPreviewInput(null);
      setRunningPlanConfirmResult(null);
      setPresetError("Select a plan preset before previewing it.");
      return;
    }

    const inputResult = buildRunningPlanPreviewInput(effectiveConstructorState, cardId);

    if (!inputResult.ok) {
      setPresetStatus("idle");
      setRunningPlanPreviewResult(null);
      setRunningPlanPreviewInput(null);
      setRunningPlanConfirmResult(null);
      setPresetError(inputResult.error);
      return;
    }

    const inputKey = JSON.stringify(inputResult.input);
    setPresetError(null);
    setRunningPlanConfirmResult(null);
    setPresetStatus("previewing_plan");

    try {
      const result = await previewRunningPlanDraftFn({
        data: inputResult.input,
      });

      runningPlanPreviewInputKeyRef.current = inputKey;
      setRunningPlanPreviewResult(result);
      setRunningPlanPreviewInput(result.ok ? inputResult.input : null);
      setPresetStatus("idle");

      if (!result.ok) {
        setPresetError(null);
        return;
      }

      hitoToast.success({
        id: STRUCTURED_REVIEW_TOAST_ID,
        title: `${inputResult.input.distanceFamily} preview ready`,
        description: "Review the backend-shaped calendar before creating the plan.",
      });
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Could not build this preview.";
      setRunningPlanPreviewResult(null);
      setRunningPlanPreviewInput(null);
      setPresetStatus("idle");
      setPresetError(message);
    }
  };

  const refreshRunningPlanPreviewEffect = useEffectEvent(() => {
    void refreshSelectedRunningPlanPreview();
  });

  useEffect(() => {
    if (!presetSelectedCardId || !runningPlanPreviewOpen || presetStatus !== "idle") {
      return;
    }

    const inputResult = buildRunningPlanPreviewInput(
      effectiveConstructorState,
      presetSelectedCardId,
    );
    const inputKey = inputResult.ok ? JSON.stringify(inputResult.input) : inputResult.error;

    if (runningPlanPreviewInputKeyRef.current === inputKey && runningPlanPreviewResult) {
      return;
    }

    refreshRunningPlanPreviewEffect();
  }, [
    effectiveConstructorState,
    presetStatus,
    refreshRunningPlanPreviewEffect,
    presetSelectedCardId,
    runningPlanPreviewOpen,
    runningPlanPreviewResult,
  ]);

  const selectPlanPresetPreview = (cardId: PlanPresetCardId) => {
    setPresetSelectedCardId(cardId);
    setRunningPlanPreviewOpen(true);
    setRunningPlanPreviewResult(null);
    setRunningPlanPreviewInput(null);
    setRunningPlanConfirmResult(null);
    runningPlanPreviewInputKeyRef.current = null;
    void refreshSelectedRunningPlanPreview(cardId);
  };

  const confirmSelectedRunningPlan = async () => {
    if (runningPlanCreateInFlightRef.current) {
      return;
    }

    const draft = runningPlanPreviewResult?.ok ? runningPlanPreviewResult.draft : null;

    if (!draft || !runningPlanPreviewInput || !draft.reviewToken || !draft.reviewChecksum) {
      setRunningPlanConfirmResult({
        ok: false,
        status: "blocked",
        persisted: false,
        reason: "invalid_review",
        message: "Refresh the selected preview before creating this plan.",
        ...(draft?.sourceKind ? { sourceKind: draft.sourceKind } : {}),
        ...(draft?.planFamily ? { planFamily: draft.planFamily } : {}),
      });
      return;
    }

    runningPlanCreateInFlightRef.current = true;
    setRunningPlanCreateStatus("creating");
    setRunningPlanConfirmResult(null);
    setPresetError(null);
    hitoToast.working({
      id: STRUCTURED_REVIEW_TOAST_ID,
      title: "Creating plan",
      description: "Hito is confirming the reviewed selected plan server-side.",
    });

    try {
      const result = await confirmRunningPlanDraftFn({
        data: {
          previewInput: runningPlanPreviewInput,
          planFamily: draft.planFamily,
          sourceKind: draft.sourceKind,
          reviewToken: draft.reviewToken,
          reviewChecksum: draft.reviewChecksum,
        },
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
        sourceKind: draft.sourceKind,
        planFamily: draft.planFamily,
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
    <section
      className="hito-surface hito-onboarding-surface mx-auto max-w-5xl px-6 pt-6 lg:px-10 lg:pt-10"
      data-mode={setupMode}
    >
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
          <section className="grid gap-y-4 gap-x-0 md:grid-cols-[220px_minmax(0,1fr)] md:gap-x-12 lg:gap-x-16">
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
              cardsResult={presetCardsResult}
              confirmResult={runningPlanConfirmResult}
              previewResult={runningPlanPreviewResult}
              createStatus={runningPlanCreateStatus}
              error={presetError}
              status={presetStatus}
              isBusy={isBusy}
              isPresetDiscoveryReady={isPresetDiscoveryReady}
              selectedCardId={presetSelectedCardId}
              previewOpen={runningPlanPreviewOpen}
              onPreviewOpenChange={setRunningPlanPreviewOpen}
              onLoadCards={() => {
                void loadPlanPresetCards();
              }}
              onSelectPlan={(cardId) => {
                selectPlanPresetPreview(cardId);
              }}
              onRefreshPreview={() => {
                void refreshSelectedRunningPlanPreview();
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

function buildPlanPresetCardInput(state: StructuredConstructorState): PlanPresetCardRequestInput {
  const age = optionalPlanPresetNumber(state.age, { min: 13, max: 100, integer: true });
  const weightKg = optionalPlanPresetNumber(state.weightKg, { min: 30, max: 250 });
  const heightCm = optionalPlanPresetNumber(state.heightCm, { min: 120, max: 230, integer: true });
  const runningDaysPerWeek = optionalPlanPresetNumber(state.maxRunningDaysPerWeek, {
    min: 1,
    max: 7,
    integer: true,
  });
  const recent5kTime = state.recent5kTime.trim();
  const targetTime = state.targetTime.trim();
  const targetDate = state.targetDate.trim();
  const startDate = state.startDate.trim();
  const comment = state.comment.trim();

  return {
    profile: {
      age,
      weightKg,
      heightCm,
    },
    benchmark: {
      fitnessLevel: state.fitnessLevel,
      recent5kTime: recent5kTime || null,
    },
    availability: {
      runningDaysPerWeek,
      fixedRestDays: state.restDaysAnswered ? state.fixedRestDays : null,
      preferredLongRunDay: state.preferredLongRunDay || null,
    },
    goal: {
      goalDistance: state.goalDistance,
      goalStyle: state.goalStyle,
      terrainFocus: state.terrainFocus,
      targetTime: targetTime || null,
      targetDate: targetDate || null,
    },
    execution: {
      watchAccess: state.watchAccess,
      guidancePreference: state.guidancePreference,
    },
    strength: {
      preference: state.strengthPreference,
    },
    schedule: {
      startDate: startDate || null,
      targetDate: targetDate || null,
    },
    comment: comment || null,
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

function buildPlanPresetCardInputKey(input: PlanPresetCardRequestInput) {
  return JSON.stringify(input);
}

function buildRunningPlanPreviewInput(
  state: StructuredConstructorState,
  cardId: PlanPresetCardId,
): { ok: true; input: RunningPlanPreviewActionInput } | { ok: false; error: string } {
  const age = requiredNumber(state.age, {
    label: "Age",
    min: 13,
    max: 100,
    integer: true,
  });
  const heightCm = requiredNumber(state.heightCm, {
    label: "Height",
    min: 120,
    max: 230,
    integer: true,
  });
  const weightKg = requiredNumber(state.weightKg, {
    label: "Weight",
    min: 30,
    max: 250,
  });

  if (!age.ok) {
    return { ok: false, error: age.error };
  }
  if (!heightCm.ok) {
    return { ok: false, error: heightCm.error };
  }
  if (!weightKg.ok) {
    return { ok: false, error: weightKg.error };
  }

  const daysPerWeek = optionalPlanPresetNumber(state.maxRunningDaysPerWeek, {
    min: 1,
    max: 7,
    integer: true,
  });
  const benchmark = buildRunningPlanBenchmarkInput(state);

  if (!benchmark.ok) {
    return { ok: false, error: benchmark.error };
  }

  return {
    ok: true,
    input: {
      age: age.value,
      heightCm: heightCm.value,
      weightKg: weightKg.value,
      runnerLevel: mapRunnerLevelToPlanEngine(state.fitnessLevel),
      distanceFamily: distanceFamilyForPresetCard(cardId),
      daysPerWeek,
      fixedRestDays: state.restDaysAnswered ? state.fixedRestDays : null,
      preferredLongRunDay: state.preferredLongRunDay || null,
      startDate: state.startDate.trim() || null,
      benchmark: benchmark.input,
    },
  };
}

function buildRunningPlanBenchmarkInput(state: StructuredConstructorState):
  | {
      ok: true;
      input: NonNullable<RunningPlanPreviewActionInput["benchmark"]>;
    }
  | { ok: false; error: string } {
  const recent5kTime = state.recent5kTime.trim();
  const recent5kPace = state.recent5kPace.trim();
  const hasRecent5kTime = recent5kTime.length > 0;
  const hasRecent5kPace = recent5kPace.length > 0;

  if (hasRecent5kTime && !isRecent5kTimeInAcceptedRange(recent5kTime)) {
    return { ok: false, error: "Use a recent 5K time between 18:00 and 55:00." };
  }

  if (hasRecent5kPace && !isRecent5kPaceInAcceptedRange(recent5kPace)) {
    return { ok: false, error: "Use a recent 5K pace between 2:00/km and 15:00/km." };
  }

  if (hasRecent5kTime) {
    return {
      ok: true,
      input: {
        kind: "recent_5k_time",
        recent5kTime,
      },
    };
  }

  if (hasRecent5kPace) {
    return {
      ok: true,
      input: {
        kind: "recent_5k_pace",
        recent5kPace,
      },
    };
  }

  return {
    ok: true,
    input: {
      kind: "unknown",
    },
  };
}

function distanceFamilyForPresetCard(cardId: PlanPresetCardId): RunningPlanDistanceFamily {
  switch (cardId) {
    case "10k":
      return "10K";
    case "half_marathon":
      return "Half Marathon";
    case "marathon":
      return "Marathon Base";
  }
}

function mapRunnerLevelToPlanEngine(level: RunnerFitnessLevel): RunningPlanRunnerLevel {
  switch (level) {
    case "new_to_running":
      return "beginner_new_runner";
    case "beginner":
      return "sometimes_runs";
    case "running_regularly":
      return "runs_a_lot";
    case "performance_focused":
      return "professional_competitive";
    case "custom":
      return "sometimes_runs";
  }
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

function requiredNumber(
  value: string,
  {
    integer = false,
    label,
    max,
    min,
  }: {
    label: string;
    min: number;
    max: number;
    integer?: boolean;
  },
): { ok: true; value: number } | { ok: false; error: string } {
  const parsed = optionalPlanPresetNumber(value, { min, max, integer });

  if (parsed == null) {
    return { ok: false, error: `${label} must be filled before selecting a plan preview.` };
  }

  return { ok: true, value: parsed };
}

function optionalPlanPresetNumber(
  value: string,
  {
    min,
    max,
    integer = false,
  }: {
    min: number;
    max: number;
    integer?: boolean;
  },
) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);

  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    return null;
  }

  if (integer && !Number.isInteger(parsed)) {
    return null;
  }

  return parsed;
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
