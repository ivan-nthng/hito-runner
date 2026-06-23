import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { PlanPresetUiStatus } from "@/components/onboarding/PlanPresetPanel";
import type { StructuredConstructorState } from "@/components/onboarding/onboarding-form-model";
import {
  buildPlanPresetCardInput,
  buildPlanPresetCardInputKey,
  buildRunningPlanPreviewInput,
} from "@/components/onboarding/selected-running-plan-flow-utils";
import { hitoToast } from "@/components/ui/hito-toast";
import type { PlanPresetCardId } from "@/lib/plan-presets/schema";
import { getPlanPresetCards, type PlanPresetCardsActionResult } from "@/lib/plan-preset-actions";
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
  const getPlanPresetCardsFn = useServerFn(getPlanPresetCards);
  const previewRunningPlanDraftFn = useServerFn(previewRunningPlanDraft);
  const presetAutoLoadKeyRef = useRef<string | null>(null);
  const runningPlanPreviewInputKeyRef = useRef<string | null>(null);
  const [status, setStatus] = useState<PlanPresetUiStatus>("idle");
  const [cardsResult, setCardsResult] = useState<PlanPresetCardsActionResult | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<PlanPresetCardId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewResult, setPreviewResult] = useState<RunningPlanPreviewActionResult | null>(null);
  const [previewInput, setPreviewInput] = useState<RunningPlanPreviewActionInput | null>(null);

  const presetCardInput = useMemo(() => buildPlanPresetCardInput(state), [state]);
  const presetDiscoveryKey = useMemo(
    () => buildPlanPresetCardInputKey(presetCardInput),
    [presetCardInput],
  );
  const resetExternalState = useEffectEvent(() => {
    onResetExternalState?.();
  });

  const resetPreviewState = useCallback(() => {
    setStatus("idle");
    setCardsResult(null);
    setSelectedCardId(null);
    setError(null);
    setPreviewOpen(false);
    setPreviewResult(null);
    setPreviewInput(null);
    presetAutoLoadKeyRef.current = null;
    runningPlanPreviewInputKeyRef.current = null;
  }, []);

  async function loadCards() {
    setError(null);
    setSelectedCardId(null);
    setPreviewResult(null);
    setPreviewInput(null);
    runningPlanPreviewInputKeyRef.current = null;
    resetExternalState();

    try {
      setStatus("loading_cards");
      const result = await getPlanPresetCardsFn({
        data: buildPlanPresetCardInput(state),
      });

      setCardsResult(result);
      setStatus("idle");

      if (!result.ok) {
        setError(result.message);
      }
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Could not load plan presets.";
      setStatus("idle");
      setError(message);
    }
  }

  async function refreshPreview(cardIdOverride?: PlanPresetCardId) {
    const cardId = cardIdOverride ?? selectedCardId;

    if (!cardId) {
      setStatus("idle");
      setPreviewResult(null);
      setPreviewInput(null);
      runningPlanPreviewInputKeyRef.current = null;
      resetExternalState();
      setError("Select a plan preset before previewing it.");
      return;
    }

    const inputResult = buildRunningPlanPreviewInput(state, cardId);

    if (!inputResult.ok) {
      setStatus("idle");
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
        title: `${inputResult.input.distanceFamily} preview ready`,
        description: previewReadyDescription,
      });
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Could not build this preview.";
      setPreviewResult(null);
      setPreviewInput(null);
      setStatus("idle");
      setError(message);
    }
  }

  function selectPlanPreview(cardId: PlanPresetCardId) {
    setSelectedCardId(cardId);
    setPreviewOpen(true);
    setPreviewResult(null);
    setPreviewInput(null);
    runningPlanPreviewInputKeyRef.current = null;
    resetExternalState();
    void refreshPreview(cardId);
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
    if (!autoRefreshOpenPreview || !selectedCardId || !previewOpen || status !== "idle") {
      return;
    }

    const inputResult = buildRunningPlanPreviewInput(state, selectedCardId);
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
    selectedCardId,
    state,
    status,
  ]);

  useEffect(() => {
    if (!resetOnInputChange) {
      return;
    }

    presetAutoLoadKeyRef.current = null;
    runningPlanPreviewInputKeyRef.current = null;
    setPreviewResult(null);
    setPreviewInput(null);
    setError(null);
    resetExternalState();

    if (!selectedCardId && !previewOpen) {
      setCardsResult(null);
    }
  }, [presetDiscoveryKey, previewOpen, resetExternalState, resetOnInputChange, selectedCardId]);

  return {
    cardsResult,
    error,
    isBusy: status !== "idle",
    loadCards,
    previewInput,
    previewOpen,
    previewResult,
    refreshPreview,
    resetPreviewState,
    selectedCardId,
    selectPlanPreview,
    setError,
    setPreviewOpen,
    status,
  };
}
