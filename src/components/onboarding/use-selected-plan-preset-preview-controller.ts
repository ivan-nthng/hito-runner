import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { PlanPresetUiStatus } from "@/components/onboarding/PlanPresetPanel";
import type { StructuredConstructorState } from "@/components/onboarding/onboarding-form-model";
import {
  buildPlanPresetCardInput,
  buildPlanPresetCardInputKey,
  buildRunningPlanPreviewInput,
  planGoalChoiceLabel,
  type PlanPresetCardsActionResult,
  type PlanGoalSelectionId,
} from "@/components/onboarding/selected-running-plan-flow-utils";
import { hitoToast } from "@/components/ui/hito-toast";
import {
  previewRunningPlanDraft,
  type RunningPlanPreviewActionInput,
  type RunningPlanPreviewActionResult,
} from "@/lib/running-plan-engine-actions";

interface SelectedPlanPresetPreviewControllerOptions {
  state: StructuredConstructorState;
  autoLoadEnabled: boolean;
  isPresetDiscoveryReady: boolean;
  toastId: string;
  previewReadyDescription: string;
  autoRefreshOpenPreview?: boolean;
  resetOnInputChange?: boolean;
  onResetExternalState?: () => void;
}

export function useSelectedPlanPresetPreviewController({
  autoLoadEnabled,
  autoRefreshOpenPreview = false,
  isPresetDiscoveryReady,
  onResetExternalState,
  previewReadyDescription,
  resetOnInputChange = false,
  state,
  toastId,
}: SelectedPlanPresetPreviewControllerOptions) {
  const previewRunningPlanDraftFn = useServerFn(previewRunningPlanDraft);
  const presetAutoLoadKeyRef = useRef<string | null>(null);
  const runningPlanPreviewInputKeyRef = useRef<string | null>(null);
  const [status, setStatus] = useState<PlanPresetUiStatus>("idle");
  const [cardsResult, setCardsResult] = useState<PlanPresetCardsActionResult | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<PlanGoalSelectionId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewResult, setPreviewResult] = useState<RunningPlanPreviewActionResult | null>(null);
  const [previewInput, setPreviewInput] = useState<RunningPlanPreviewActionInput | null>(null);

  const presetCardInput = useMemo(() => buildPlanPresetCardInput(state), [state]);
  const presetDiscoveryKey = useMemo(
    () => buildPlanPresetCardInputKey(presetCardInput),
    [presetCardInput],
  );
  const previousPresetDiscoveryKeyRef = useRef(presetDiscoveryKey);
  const resetExternalState = useEffectEvent(() => {
    onResetExternalState?.();
  });

  const resetPreviewState = useCallback(() => {
    setStatus("idle");
    setCardsResult(null);
    setSelectedGoalId(null);
    setError(null);
    setPreviewOpen(false);
    setPreviewResult(null);
    setPreviewInput(null);
    presetAutoLoadKeyRef.current = null;
    runningPlanPreviewInputKeyRef.current = null;
  }, []);

  const clearSelectedPreview = useCallback(() => {
    setSelectedGoalId(null);
    setError(null);
    setPreviewOpen(false);
    setPreviewResult(null);
    setPreviewInput(null);
    runningPlanPreviewInputKeyRef.current = null;
    resetExternalState();
  }, [resetExternalState]);

  const requiredBasicsMessage =
    "Add Age, Height, and Weight before loading or selecting a guided plan.";

  async function loadCards() {
    setError(null);
    setSelectedGoalId(null);
    setPreviewResult(null);
    setPreviewInput(null);
    runningPlanPreviewInputKeyRef.current = null;
    resetExternalState();

    if (!isPresetDiscoveryReady) {
      setStatus("idle");
      setCardsResult(null);
      setError(requiredBasicsMessage);
      return;
    }

    setStatus("idle");
    setCardsResult(null);
  }

  async function refreshPreview(goalIdOverride?: PlanGoalSelectionId) {
    const goalId = goalIdOverride ?? selectedGoalId;

    if (!isPresetDiscoveryReady) {
      setStatus("idle");
      setPreviewOpen(false);
      setPreviewResult(null);
      setPreviewInput(null);
      runningPlanPreviewInputKeyRef.current = null;
      resetExternalState();
      setError(requiredBasicsMessage);
      return;
    }

    if (!goalId) {
      setStatus("idle");
      setPreviewResult(null);
      setPreviewInput(null);
      runningPlanPreviewInputKeyRef.current = null;
      resetExternalState();
      setError("Choose a goal before previewing it.");
      return;
    }

    const inputResult = buildRunningPlanPreviewInput(state, goalId);

    if (!inputResult.ok) {
      setStatus("idle");
      setPreviewOpen(false);
      setPreviewResult(null);
      setPreviewInput(null);
      runningPlanPreviewInputKeyRef.current = null;
      resetExternalState();
      setError(inputResult.error);
      return;
    }

    const inputKey = JSON.stringify(inputResult.input);
    setError(null);
    resetExternalState();
    setStatus("previewing_plan");

    try {
      const result = await previewRunningPlanDraftFn({
        data: inputResult.input,
      });

      runningPlanPreviewInputKeyRef.current = inputKey;
      setPreviewResult(result);
      setPreviewInput(result.ok ? inputResult.input : null);
      setStatus("idle");

      if (!result.ok) {
        setError(null);
        return;
      }

      hitoToast.success({
        id: toastId,
        title: `${planGoalChoiceLabel(goalId)} preview ready`,
        description: previewReadyDescription,
      });
    } catch (submitError) {
      const message = runnerSafePreviewErrorMessage(
        submitError instanceof Error ? submitError.message : null,
      );
      setPreviewResult(null);
      setPreviewInput(null);
      setStatus("idle");
      setError(message);
    }
  }

  function selectPlanPreview(goalId: PlanGoalSelectionId) {
    if (!isPresetDiscoveryReady) {
      setStatus("idle");
      setSelectedGoalId(null);
      setPreviewOpen(false);
      setPreviewResult(null);
      setPreviewInput(null);
      runningPlanPreviewInputKeyRef.current = null;
      resetExternalState();
      setError(requiredBasicsMessage);
      return;
    }

    setSelectedGoalId(goalId);
    setPreviewResult(null);
    setPreviewInput(null);
    runningPlanPreviewInputKeyRef.current = null;
    resetExternalState();

    const inputResult = buildRunningPlanPreviewInput(state, goalId);

    if (!inputResult.ok) {
      setStatus("idle");
      setPreviewOpen(false);
      setError(inputResult.error);
      return;
    }

    setPreviewOpen(true);
    void refreshPreview(goalId);
  }

  const autoLoadPlanPresetCards = useEffectEvent(() => {
    void loadCards();
  });

  useEffect(() => {
    if (!autoLoadEnabled || !isPresetDiscoveryReady || status !== "idle" || cardsResult) {
      return;
    }

    if (presetAutoLoadKeyRef.current === presetDiscoveryKey) {
      return;
    }

    presetAutoLoadKeyRef.current = presetDiscoveryKey;
    autoLoadPlanPresetCards();
  }, [
    autoLoadEnabled,
    autoLoadPlanPresetCards,
    cardsResult,
    isPresetDiscoveryReady,
    presetDiscoveryKey,
    status,
  ]);

  const refreshRunningPlanPreviewEffect = useEffectEvent(() => {
    void refreshPreview();
  });

  useEffect(() => {
    if (!autoRefreshOpenPreview || !selectedGoalId || !previewOpen || status !== "idle") {
      return;
    }

    const inputResult = buildRunningPlanPreviewInput(state, selectedGoalId);
    const inputKey = inputResult.ok ? JSON.stringify(inputResult.input) : inputResult.error;

    if (runningPlanPreviewInputKeyRef.current === inputKey && previewResult) {
      return;
    }

    refreshRunningPlanPreviewEffect();
  }, [
    autoRefreshOpenPreview,
    previewOpen,
    previewResult,
    refreshRunningPlanPreviewEffect,
    selectedGoalId,
    state,
    status,
  ]);

  useEffect(() => {
    if (!resetOnInputChange) {
      return;
    }

    if (previousPresetDiscoveryKeyRef.current === presetDiscoveryKey) {
      return;
    }

    previousPresetDiscoveryKeyRef.current = presetDiscoveryKey;

    presetAutoLoadKeyRef.current = null;
    runningPlanPreviewInputKeyRef.current = null;
    setPreviewResult(null);
    setPreviewInput(null);
    setError(null);
    resetExternalState();

    if (!selectedGoalId && !previewOpen) {
      setCardsResult(null);
    }
  }, [presetDiscoveryKey, previewOpen, resetExternalState, resetOnInputChange, selectedGoalId]);

  return {
    cardsResult,
    clearSelectedPreview,
    error,
    isBusy: status !== "idle",
    loadCards,
    previewInput,
    previewOpen,
    previewResult,
    refreshPreview,
    resetPreviewState,
    selectedGoalId,
    selectPlanPreview,
    setError,
    setPreviewOpen,
    status,
  };
}

function runnerSafePreviewErrorMessage(message: string | null) {
  if (!message) {
    return "This setup cannot be previewed yet. Adjust the goal details.";
  }

  const normalized = message.toLowerCase();

  if (
    normalized.includes("invalid_plan_goal_intent") ||
    normalized.includes("source_kind") ||
    normalized.includes("target finish time") ||
    normalized.includes("target outcome pace") ||
    normalized.includes("target date")
  ) {
    return "This setup cannot be previewed yet. Adjust the goal details.";
  }

  return message;
}
