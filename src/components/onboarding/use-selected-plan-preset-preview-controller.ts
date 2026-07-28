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
  previewContextKey?: string;
  requiredBasicsMessage?: string;
  resetOnInputChange?: boolean;
  onPreviewDispatch?: () => void;
  onResetExternalState?: () => void;
}

export function useSelectedPlanPresetPreviewController({
  hasRequiredPlanBasics,
  onPreviewDispatch,
  onResetExternalState,
  previewContextKey = "default",
  previewReadyDescription,
  requiredBasicsMessage = "Add Age, Height, and Weight before previewing a generated plan.",
  resetOnInputChange = false,
  state,
  toastId,
}: SelectedPlanPresetPreviewControllerOptions) {
  const previewRunningPlanDraftFn = useServerFn(previewRunningPlanDraft);
  const activePreviewRequestKeyRef = useRef<string | null>(null);
  const postDispatchInputFingerprintRef = useRef<string | null>(null);
  const [status, setStatus] = useState<"idle" | "previewing_plan">("idle");
  const [selectedGoalId, setSelectedGoalId] = useState<PlanGoalSelectionId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpenState] = useState(false);
  const previewOpenRef = useRef(false);
  const [previewResult, setPreviewResult] = useState<RunningPlanPreviewActionResult | null>(null);
  const [previewInput, setPreviewInput] = useState<RunningPlanPreviewActionInput | null>(null);
  const setPreviewOpen = useCallback((nextOpen: boolean) => {
    previewOpenRef.current = nextOpen;
    setPreviewOpenState(nextOpen);
  }, []);

  const previewInputFingerprint = useMemo(() => {
    if (!state.planGoalChoice) {
      return `${previewContextKey}:no_goal`;
    }

    const inputResult = buildRunningPlanPreviewInput(state, state.planGoalChoice);
    return inputResult.ok
      ? `${previewContextKey}:${JSON.stringify(inputResult.input)}`
      : `${previewContextKey}:invalid:${state.planGoalChoice}:${inputResult.error}`;
  }, [previewContextKey, state]);
  const previousPreviewInputFingerprintRef = useRef(previewInputFingerprint);
  const resetExternalState = useEffectEvent(() => {
    onResetExternalState?.();
  });
  const clearTransientPreviewInput = useEffectEvent(() => {
    onPreviewDispatch?.();
  });

  const resetPreviewState = useCallback(() => {
    setStatus("idle");
    setSelectedGoalId(null);
    setError(null);
    setPreviewOpen(false);
    setPreviewResult(null);
    setPreviewInput(null);
    activePreviewRequestKeyRef.current = null;
    postDispatchInputFingerprintRef.current = null;
  }, [setPreviewOpen]);

  const clearSelectedPreview = useCallback(() => {
    setSelectedGoalId(null);
    setError(null);
    setPreviewOpen(false);
    setPreviewResult(null);
    setPreviewInput(null);
    activePreviewRequestKeyRef.current = null;
    postDispatchInputFingerprintRef.current = null;
    resetExternalState();
  }, [resetExternalState, setPreviewOpen]);

  async function refreshPreview(goalIdOverride?: PlanGoalSelectionId) {
    if (activePreviewRequestKeyRef.current) {
      setPreviewOpen(true);
      return;
    }

    const goalId = goalIdOverride ?? selectedGoalId;

    if (!hasRequiredPlanBasics) {
      setStatus("idle");
      setPreviewOpen(false);
      setPreviewResult(null);
      setPreviewInput(null);
      postDispatchInputFingerprintRef.current = null;
      resetExternalState();
      setError(requiredBasicsMessage);
      return;
    }

    if (!goalId) {
      setStatus("idle");
      setPreviewResult(null);
      setPreviewInput(null);
      postDispatchInputFingerprintRef.current = null;
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
      postDispatchInputFingerprintRef.current = null;
      resetExternalState();
      setError(inputResult.error);
      return;
    }

    const inputKey = `${previewContextKey}:${JSON.stringify(inputResult.input)}`;
    activePreviewRequestKeyRef.current = inputKey;
    postDispatchInputFingerprintRef.current = `${previewContextKey}:${JSON.stringify({
      ...inputResult.input,
      runnerComment: undefined,
    })}`;
    setError(null);
    resetExternalState();
    setStatus("previewing_plan");

    try {
      const previewRequest = previewRunningPlanDraftFn({
        data: inputResult.input,
      });
      clearTransientPreviewInput();
      const result = await previewRequest;

      if (activePreviewRequestKeyRef.current !== inputKey) {
        return;
      }

      activePreviewRequestKeyRef.current = null;
      postDispatchInputFingerprintRef.current = null;
      setPreviewResult(result);
      setPreviewInput(result.ok ? result.draft.previewInput : null);
      setStatus("idle");

      if (!result.ok) {
        setError(null);
        return;
      }

      if (!previewOpenRef.current) {
        hitoToast.success({
          id: toastId,
          title: `${planGoalChoiceLabel(goalId)} preview ready`,
          description: previewReadyDescription,
        });
      }
    } catch {
      if (activePreviewRequestKeyRef.current !== inputKey) {
        return;
      }

      activePreviewRequestKeyRef.current = null;
      postDispatchInputFingerprintRef.current = null;
      setPreviewResult(null);
      setPreviewInput(null);
      setStatus("idle");
      setError(
        "Hito could not prepare the plan right now. Nothing was created or saved. Try again.",
      );
    }
  }

  function selectPlanPreview(goalId: PlanGoalSelectionId) {
    if (activePreviewRequestKeyRef.current) {
      setPreviewOpen(true);
      return;
    }

    if (!hasRequiredPlanBasics) {
      setStatus("idle");
      setSelectedGoalId(null);
      setPreviewOpen(false);
      setPreviewResult(null);
      setPreviewInput(null);
      postDispatchInputFingerprintRef.current = null;
      resetExternalState();
      setError(requiredBasicsMessage);
      return;
    }

    setSelectedGoalId(goalId);
    setPreviewResult(null);
    setPreviewInput(null);
    postDispatchInputFingerprintRef.current = null;
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

    if (
      activePreviewRequestKeyRef.current &&
      postDispatchInputFingerprintRef.current === previewInputFingerprint
    ) {
      return;
    }

    activePreviewRequestKeyRef.current = null;
    postDispatchInputFingerprintRef.current = null;
    setStatus("idle");
    setPreviewResult(null);
    setPreviewInput(null);
    setError(null);
    resetExternalState();
  }, [previewInputFingerprint, resetExternalState, resetOnInputChange]);

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
