import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { StructuredConstructorState } from "@/components/onboarding/onboarding-form-model";
import {
  buildRunningPlanPreviewInput,
  mapRunningPlanPreviewResultToAdmissionFailure,
  planGoalChoiceLabel,
  type PlanGoalSelectionId,
  type RunningPlanAdmissionFailure,
  type RunningPlanAdmissionField,
} from "@/components/onboarding/selected-running-plan-flow-utils";
import { hitoToast } from "@/components/ui/hito-toast";
import { useHitoProductMessage, useHitoUiLocale } from "@/components/ui/hito-ui-locale-provider";
import { getHitoKnownProductMessage } from "@/lib/ui-locale-messages";
import {
  previewRunningPlanDraft,
  type RunningPlanPreviewActionInput,
  type RunningPlanPreviewActionResult,
} from "@/lib/running-plan-engine-actions";

interface SelectedPlanPresetPreviewControllerOptions {
  state: StructuredConstructorState;
  toastId: string;
  previewReadyDescription: string;
  previewContextKey?: string;
  resetOnInputChange?: boolean;
  onAdmissionRejected?: (field: RunningPlanAdmissionField | null) => void;
  onPreviewDispatch?: () => void;
  onResetExternalState?: () => void;
}

export function useSelectedPlanPresetPreviewController({
  onAdmissionRejected,
  onPreviewDispatch,
  onResetExternalState,
  previewContextKey = "default",
  previewReadyDescription,
  resetOnInputChange = false,
  state,
  toastId,
}: SelectedPlanPresetPreviewControllerOptions) {
  const locale = useHitoUiLocale();
  const t = useHitoProductMessage();
  const previewRunningPlanDraftFn = useServerFn(previewRunningPlanDraft);
  const activePreviewRequestRef = useRef<{
    abortController: AbortController;
  } | null>(null);
  const postDispatchInputFingerprintRef = useRef<string | null>(null);
  const [status, setStatus] = useState<"idle" | "previewing_plan">("idle");
  const [selectedGoalId, setSelectedGoalId] = useState<PlanGoalSelectionId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [requestResult, setRequestResult] = useState<RunningPlanAdmissionFailure | null>(null);
  const [previewOpen, setPreviewOpenState] = useState(false);
  const previewOpenRef = useRef(false);
  const [previewResult, setPreviewResult] = useState<RunningPlanPreviewActionResult | null>(null);
  const [previewInput, setPreviewInput] = useState<RunningPlanPreviewActionInput | null>(null);
  const setPreviewOpen = useCallback((nextOpen: boolean) => {
    previewOpenRef.current = nextOpen;
    setPreviewOpenState(nextOpen);
  }, []);

  const previewInputFingerprint = useMemo(() => {
    const inputResult = buildRunningPlanPreviewInput(state, state.planGoalChoice);
    return inputResult.ok
      ? `${previewContextKey}:${JSON.stringify(inputResult.input)}`
      : `${previewContextKey}:invalid:${JSON.stringify(inputResult.issues)}`;
  }, [previewContextKey, state]);
  const previousPreviewInputFingerprintRef = useRef(previewInputFingerprint);
  const resetExternalState = useEffectEvent(() => {
    onResetExternalState?.();
  });
  const clearTransientPreviewInput = useEffectEvent(() => {
    onPreviewDispatch?.();
  });
  const focusRejectedAdmission = useEffectEvent((field: RunningPlanAdmissionField | null) => {
    onAdmissionRejected?.(field);
  });

  const applyAdmissionFailure = useCallback(
    (failure: RunningPlanAdmissionFailure) => {
      setStatus("idle");
      setPreviewOpen(false);
      setPreviewResult(null);
      setPreviewInput(null);
      postDispatchInputFingerprintRef.current = null;
      resetExternalState();
      setNotice(null);
      setError(null);
      setRequestResult(failure);
      window.requestAnimationFrame(() => focusRejectedAdmission(failure.firstField));
    },
    [focusRejectedAdmission, resetExternalState, setPreviewOpen],
  );

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
    setRequestResult(null);
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
    setRequestResult(null);
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
    setNotice(t("Plan preparation request cancelled. Nothing was created or saved."));
    setRequestResult(null);
    setPreviewOpen(false);
    setPreviewResult(null);
    setPreviewInput(null);
    resetExternalState();
  }, [abortActivePreviewRequest, resetExternalState, setPreviewOpen, t]);

  async function refreshPreview(goalIdOverride?: PlanGoalSelectionId) {
    if (activePreviewRequestRef.current) {
      setPreviewOpen(true);
      return;
    }

    const goalId = goalIdOverride ?? selectedGoalId;

    const inputResult = buildRunningPlanPreviewInput(state, goalId);

    if (!inputResult.ok) {
      applyAdmissionFailure(inputResult);
      return;
    }

    if (!goalId) {
      throw new Error("Running-plan goal selection was not narrowed after validation.");
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
    setRequestResult(null);
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
      setStatus("idle");

      if (!result.ok) {
        const admissionFailure = mapRunningPlanPreviewResultToAdmissionFailure(result);

        if (admissionFailure) {
          applyAdmissionFailure(admissionFailure);
          return;
        }

        setPreviewResult(result);
        setPreviewInput(null);
        setError(null);
        return;
      }

      setPreviewResult(result);
      setPreviewInput(result.draft.previewInput);

      if (!previewOpenRef.current) {
        hitoToast.success({
          id: toastId,
          title: t("{goal} preview ready", {
            goal: getHitoKnownProductMessage(locale, planGoalChoiceLabel(goalId)),
          }),
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
        t("Hito could not prepare the plan right now. Nothing was created or saved. Try again."),
      );
    }
  }

  function selectPlanPreview(goalId: PlanGoalSelectionId) {
    if (activePreviewRequestRef.current) {
      setPreviewOpen(true);
      return;
    }

    setSelectedGoalId(goalId);
    setPreviewResult(null);
    setPreviewInput(null);
    postDispatchInputFingerprintRef.current = null;
    resetExternalState();
    setNotice(null);
    setRequestResult(null);

    const inputResult = buildRunningPlanPreviewInput(state, goalId);

    if (!inputResult.ok) {
      applyAdmissionFailure(inputResult);
      return;
    }

    setPreviewOpen(true);
    void refreshPreview(goalId);
  }

  function validatePreviewRequest() {
    const result = buildRunningPlanPreviewInput(state, state.planGoalChoice);

    if (!result.ok) {
      applyAdmissionFailure(result);
      return { ok: false } as const;
    }

    if (!state.planGoalChoice) {
      throw new Error("Running-plan goal selection was not narrowed after validation.");
    }

    setRequestResult(null);
    return { ok: true, goalId: state.planGoalChoice } as const;
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
    setRequestResult((current) => {
      if (current?.source !== "client") {
        return null;
      }

      const result = buildRunningPlanPreviewInput(state, state.planGoalChoice);
      return result.ok ? null : result;
    });
    resetExternalState();
  }, [
    abortActivePreviewRequest,
    previewInputFingerprint,
    resetExternalState,
    resetOnInputChange,
    state,
  ]);

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
    requestResult,
    refreshPreview,
    resetPreviewState,
    selectedGoalId,
    selectPlanPreview,
    setError,
    setPreviewOpen,
    status,
    validatePreviewRequest,
  };
}
