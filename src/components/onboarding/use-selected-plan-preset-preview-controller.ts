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
  const activePreviewRequestRef = useRef<{
    abortController: AbortController;
  } | null>(null);
  const postDispatchInputFingerprintRef = useRef<string | null>(null);
  const [status, setStatus] = useState<"idle" | "previewing_plan">("idle");
  const [selectedGoalId, setSelectedGoalId] = useState<PlanGoalSelectionId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
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

  const abortActivePreviewRequest = useCallback(() => {
    const activeRequest = activePreviewRequestRef.current;
    activePreviewRequestRef.current = null;

    if (activeRequest && !activeRequest.abortController.signal.aborted) {
      activeRequest.abortController.abort("generated_plan_preview_cancelled");
    }
  }, []);

  const resetPreviewState = useCallback(() => {
    abortActivePreviewRequest();
    setStatus("idle");
    setSelectedGoalId(null);
    setError(null);
    setNotice(null);
    setPreviewOpen(false);
    setPreviewResult(null);
    setPreviewInput(null);
    postDispatchInputFingerprintRef.current = null;
  }, [abortActivePreviewRequest, setPreviewOpen]);

  const clearSelectedPreview = useCallback(() => {
    abortActivePreviewRequest();
    setStatus("idle");
    setSelectedGoalId(null);
    setError(null);
    setNotice(null);
    setPreviewOpen(false);
    setPreviewResult(null);
    setPreviewInput(null);
    postDispatchInputFingerprintRef.current = null;
    resetExternalState();
  }, [abortActivePreviewRequest, resetExternalState, setPreviewOpen]);

  const cancelPreview = useCallback(() => {
    if (!activePreviewRequestRef.current) {
      return;
    }

    abortActivePreviewRequest();
    postDispatchInputFingerprintRef.current = null;
    setStatus("idle");
    setError(null);
    setNotice("Plan preparation request cancelled. Nothing was created or saved.");
    setPreviewOpen(false);
    setPreviewResult(null);
    setPreviewInput(null);
    resetExternalState();
  }, [abortActivePreviewRequest, resetExternalState, setPreviewOpen]);

  async function refreshPreview(goalIdOverride?: PlanGoalSelectionId) {
    if (activePreviewRequestRef.current) {
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
      setNotice(null);
      setError(requiredBasicsMessage);
      return;
    }

    if (!goalId) {
      setStatus("idle");
      setPreviewResult(null);
      setPreviewInput(null);
      postDispatchInputFingerprintRef.current = null;
      resetExternalState();
      setNotice(null);
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
      setNotice(null);
      setError(inputResult.error);
      return;
    }

    const activeRequest = {
      abortController: new AbortController(),
    };
    activePreviewRequestRef.current = activeRequest;
    postDispatchInputFingerprintRef.current = `${previewContextKey}:${JSON.stringify({
      ...inputResult.input,
      runnerComment: undefined,
    })}`;
    setError(null);
    setNotice(null);
    resetExternalState();
    setStatus("previewing_plan");

    try {
      const previewRequest = previewRunningPlanDraftFn({
        data: inputResult.input,
        signal: activeRequest.abortController.signal,
      });
      clearTransientPreviewInput();
      const result = await previewRequest;

      if (activePreviewRequestRef.current !== activeRequest) {
        return;
      }

      activePreviewRequestRef.current = null;
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
      if (activePreviewRequestRef.current !== activeRequest) {
        return;
      }

      activePreviewRequestRef.current = null;
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
    if (activePreviewRequestRef.current) {
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
      setNotice(null);
      setError(requiredBasicsMessage);
      return;
    }

    setSelectedGoalId(goalId);
    setPreviewResult(null);
    setPreviewInput(null);
    postDispatchInputFingerprintRef.current = null;
    resetExternalState();
    setNotice(null);

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
      activePreviewRequestRef.current &&
      postDispatchInputFingerprintRef.current === previewInputFingerprint
    ) {
      return;
    }

    abortActivePreviewRequest();
    postDispatchInputFingerprintRef.current = null;
    setStatus("idle");
    setPreviewResult(null);
    setPreviewInput(null);
    setError(null);
    setNotice(null);
    resetExternalState();
  }, [abortActivePreviewRequest, previewInputFingerprint, resetExternalState, resetOnInputChange]);

  useEffect(() => abortActivePreviewRequest, [abortActivePreviewRequest]);

  return {
    cancelPreview,
    clearSelectedPreview,
    error,
    isBusy: status !== "idle",
    notice,
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
