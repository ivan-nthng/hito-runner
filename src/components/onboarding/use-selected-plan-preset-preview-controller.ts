import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { StructuredConstructorState } from "@/components/onboarding/onboarding-form-model";
import {
  buildRunningPlanPreviewInput,
  planGoalChoiceLabel,
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
  hasRequiredPlanBasics: boolean;
  toastId: string;
  previewReadyDescription: string;
  autoRefreshOpenPreview?: boolean;
  resetOnInputChange?: boolean;
  onResetExternalState?: () => void;
}

export function useSelectedPlanPresetPreviewController({
  autoRefreshOpenPreview = false,
  hasRequiredPlanBasics,
  onResetExternalState,
  previewReadyDescription,
  resetOnInputChange = false,
  state,
  toastId,
}: SelectedPlanPresetPreviewControllerOptions) {
  const previewRunningPlanDraftFn = useServerFn(previewRunningPlanDraft);
  const runningPlanPreviewInputKeyRef = useRef<string | null>(null);
  const [status, setStatus] = useState<"idle" | "previewing_plan">("idle");
  const [selectedGoalId, setSelectedGoalId] = useState<PlanGoalSelectionId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewResult, setPreviewResult] = useState<RunningPlanPreviewActionResult | null>(null);
  const [previewInput, setPreviewInput] = useState<RunningPlanPreviewActionInput | null>(null);

  const previewInputFingerprint = useMemo(() => {
    if (!state.planGoalChoice) {
      return "no_goal";
    }

    const inputResult = buildRunningPlanPreviewInput(state, state.planGoalChoice);
    return inputResult.ok
      ? JSON.stringify(inputResult.input)
      : `invalid:${state.planGoalChoice}:${inputResult.error}`;
  }, [state]);
  const previousPreviewInputFingerprintRef = useRef(previewInputFingerprint);
  const resetExternalState = useEffectEvent(() => {
    onResetExternalState?.();
  });

  const resetPreviewState = useCallback(() => {
    setStatus("idle");
    setSelectedGoalId(null);
    setError(null);
    setPreviewOpen(false);
    setPreviewResult(null);
    setPreviewInput(null);
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

  const requiredBasicsMessage = "Add Age, Height, and Weight before previewing a generated plan.";

  async function refreshPreview(goalIdOverride?: PlanGoalSelectionId) {
    const goalId = goalIdOverride ?? selectedGoalId;

    if (!hasRequiredPlanBasics) {
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
    } catch {
      setPreviewResult(null);
      setPreviewInput(null);
      setStatus("idle");
      setError(
        "Hito could not start plan authoring right now. Nothing was created or saved. Try again.",
      );
    }
  }

  function selectPlanPreview(goalId: PlanGoalSelectionId) {
    if (!hasRequiredPlanBasics) {
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

  useEffect(() => {
    if (!resetOnInputChange) {
      return;
    }

    if (previousPreviewInputFingerprintRef.current === previewInputFingerprint) {
      return;
    }

    previousPreviewInputFingerprintRef.current = previewInputFingerprint;
    runningPlanPreviewInputKeyRef.current = null;
    setPreviewResult(null);
    setPreviewInput(null);
    setError(null);
    resetExternalState();
  }, [previewInputFingerprint, resetExternalState, resetOnInputChange]);

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

  return {
    clearSelectedPreview,
    error,
    isBusy: status !== "idle",
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
