import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PlanPresetPanel } from "@/components/onboarding/PlanPresetPanel";
import { StructuredPlanConstructor } from "@/components/onboarding/StructuredPlanConstructor";
import {
  isPresetPrimarySetupReady,
  resolveTerrainFocus,
  type StructuredConstructorState,
  type WeekdayName,
} from "@/components/onboarding/onboarding-form-model";
import { useSelectedPlanPresetPreviewController } from "@/components/onboarding/use-selected-plan-preset-preview-controller";
import { hitoToast } from "@/components/ui/hito-toast";
import { Icon } from "@/components/ui/icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  confirmActivePlanTransition,
  reviewActivePlanTransition,
  type ActivePlanTransitionConfirmResult,
  type ActivePlanTransitionReviewInput,
  type ActivePlanTransitionReviewResult,
} from "@/lib/active-plan-transition-actions";
import { MANUAL_USER_BUILT_PLAN_SOURCE_KIND } from "@/lib/manual-workout-authoring/schema";
import type { TrainingSnapshot } from "@/lib/training";
import {
  ActivePlanTransitionReviewDialog,
  CustomPlanTransitionNotice,
  TransitionBlockedNotice,
  UnsupportedActivePlanNotice,
} from "@/components/plan-management/ActivePlanTransitionReviewDialog";
import {
  buildCandidateInput,
  buildInitialCreatePlanState,
  buildInitialCreatePlanStateKey,
  buildTransitionBlockedResult,
} from "@/components/plan-management/active-plan-create-plan-model";

type CreateMode = "quick" | "custom";
type TransitionStatus = "idle" | "reviewing" | "confirming";

const ACTIVE_PLAN_CREATE_TOAST_ID = "active-plan-create-transition";

export function ActivePlanCreatePlanDialog({
  open,
  onOpenChange,
  onOpenPlan,
  snapshot,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenPlan: () => void;
  snapshot: TrainingSnapshot | null | undefined;
}) {
  const reviewActivePlanTransitionFn = useServerFn(reviewActivePlanTransition);
  const confirmActivePlanTransitionFn = useServerFn(confirmActivePlanTransition);
  const structuredFormRef = useRef<HTMLFormElement | null>(null);
  const transitionInFlightRef = useRef(false);
  const previousOpenRef = useRef(open);
  const initialStateKeyRef = useRef<string | null>(null);

  const initialState = useMemo(() => buildInitialCreatePlanState(snapshot), [snapshot]);
  const initialStateKey = useMemo(
    () => buildInitialCreatePlanStateKey(initialState),
    [initialState],
  );
  const [createMode, setCreateMode] = useState<CreateMode>("quick");
  const [age, setAge] = useState(initialState.age);
  const [weightKg, setWeightKg] = useState(initialState.weightKg);
  const [heightCm, setHeightCm] = useState(initialState.heightCm);
  const [fitnessLevel, setFitnessLevel] = useState<StructuredConstructorState["fitnessLevel"]>(
    initialState.fitnessLevel,
  );
  const [recent5kTime, setRecent5kTime] = useState(initialState.recent5kTime);
  const [recent5kPace, setRecent5kPace] = useState(initialState.recent5kPace);
  const [fixedRestDays, setFixedRestDays] = useState<WeekdayName[]>(initialState.fixedRestDays);
  const [restDaysAnswered, setRestDaysAnswered] = useState(initialState.restDaysAnswered);
  const [maxRunningDaysPerWeek, setMaxRunningDaysPerWeek] = useState(
    initialState.maxRunningDaysPerWeek,
  );
  const [preferredLongRunDay, setPreferredLongRunDay] = useState<WeekdayName | "">(
    initialState.preferredLongRunDay,
  );
  const [goalDistance, setGoalDistance] = useState<StructuredConstructorState["goalDistance"]>(
    initialState.goalDistance,
  );
  const [goalStyle, setGoalStyle] = useState<StructuredConstructorState["goalStyle"]>(
    initialState.goalStyle,
  );
  const [targetTime, setTargetTime] = useState(initialState.targetTime);
  const [startDate, setStartDate] = useState(initialState.startDate);
  const [targetDate, setTargetDate] = useState(initialState.targetDate);
  const [terrainFocus, setTerrainFocus] = useState<StructuredConstructorState["terrainFocus"]>(
    initialState.terrainFocus,
  );
  const [guidancePreference, setGuidancePreference] = useState<
    StructuredConstructorState["guidancePreference"]
  >(initialState.guidancePreference);
  const [strengthPreference, setStrengthPreference] = useState<
    StructuredConstructorState["strengthPreference"]
  >(initialState.strengthPreference);
  const [comment, setComment] = useState(initialState.comment);
  const [transitionStatus, setTransitionStatus] = useState<TransitionStatus>("idle");
  const [transitionReviewInput, setTransitionReviewInput] =
    useState<ActivePlanTransitionReviewInput | null>(null);
  const [transitionReviewResult, setTransitionReviewResult] =
    useState<ActivePlanTransitionReviewResult | null>(null);
  const [transitionConfirmResult, setTransitionConfirmResult] =
    useState<ActivePlanTransitionConfirmResult | null>(null);
  const [transitionReviewOpen, setTransitionReviewOpen] = useState(false);

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
      watchAccess: "watch_or_app",
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
      weightKg,
    ],
  );
  const effectiveConstructorState = useMemo(
    () => ({
      ...constructorState,
      terrainFocus: resolveTerrainFocus(goalDistance, terrainFocus),
    }),
    [constructorState, goalDistance, terrainFocus],
  );
  const isActiveManualPlan = snapshot?.planMeta?.sourceKind === MANUAL_USER_BUILT_PLAN_SOURCE_KIND;
  const isPresetDiscoveryReady = isPresetPrimarySetupReady(constructorState);
  const selectedPlanPreview = useSelectedPlanPresetPreviewController({
    state: effectiveConstructorState,
    autoLoadEnabled: open && createMode === "quick",
    isPresetDiscoveryReady,
    toastId: ACTIVE_PLAN_CREATE_TOAST_ID,
    previewReadyDescription: "Review the candidate plan before reviewing the active-plan change.",
    onResetExternalState: () => {
      setTransitionReviewResult(null);
      setTransitionConfirmResult(null);
    },
  });
  const resetSelectedPlanPreviewState = selectedPlanPreview.resetPreviewState;
  const isBusy = selectedPlanPreview.isBusy || transitionStatus !== "idle";

  useEffect(() => {
    if (!open) {
      previousOpenRef.current = false;
      return;
    }

    const justOpened = !previousOpenRef.current;
    previousOpenRef.current = true;

    if (!justOpened && initialStateKeyRef.current === initialStateKey) {
      return;
    }

    initialStateKeyRef.current = initialStateKey;
    setCreateMode("quick");
    setAge(initialState.age);
    setWeightKg(initialState.weightKg);
    setHeightCm(initialState.heightCm);
    setFitnessLevel(initialState.fitnessLevel);
    setRecent5kTime(initialState.recent5kTime);
    setRecent5kPace(initialState.recent5kPace);
    setFixedRestDays(initialState.fixedRestDays);
    setRestDaysAnswered(initialState.restDaysAnswered);
    setMaxRunningDaysPerWeek(initialState.maxRunningDaysPerWeek);
    setPreferredLongRunDay(initialState.preferredLongRunDay);
    setGoalDistance(initialState.goalDistance);
    setGoalStyle(initialState.goalStyle);
    setTargetTime(initialState.targetTime);
    setStartDate(initialState.startDate);
    setTargetDate(initialState.targetDate);
    setTerrainFocus(initialState.terrainFocus);
    setGuidancePreference(initialState.guidancePreference);
    setStrengthPreference(initialState.strengthPreference);
    setComment(initialState.comment);
    resetSelectedPlanPreviewState();
    setTransitionReviewInput(null);
    setTransitionReviewResult(null);
    setTransitionConfirmResult(null);
    setTransitionReviewOpen(false);
    setTransitionStatus("idle");
    transitionInFlightRef.current = false;
  }, [initialState, initialStateKey, open, resetSelectedPlanPreviewState]);

  async function reviewSelectedPlanTransition() {
    if (transitionInFlightRef.current) {
      return;
    }

    const draft = selectedPlanPreview.previewResult?.ok
      ? selectedPlanPreview.previewResult.draft
      : null;
    const candidate = buildCandidateInput(draft, selectedPlanPreview.previewInput);

    if (!candidate.ok) {
      setTransitionReviewResult(candidate.result);
      return;
    }

    const reviewInput: ActivePlanTransitionReviewInput = {
      activePlanId: snapshot?.planMeta?.id ?? null,
      candidate: candidate.input,
    };

    transitionInFlightRef.current = true;
    setTransitionStatus("reviewing");
    setTransitionReviewInput(reviewInput);
    setTransitionReviewResult(null);
    setTransitionConfirmResult(null);

    hitoToast.working({
      id: ACTIVE_PLAN_CREATE_TOAST_ID,
      title: "Reviewing plan change",
      description:
        "Hito is checking the current manual plan and selected candidate before anything changes.",
    });

    try {
      const result = await reviewActivePlanTransitionFn({
        data: reviewInput,
      });

      setTransitionReviewResult(result);
      transitionInFlightRef.current = false;
      setTransitionStatus("idle");

      if (!result.ok) {
        hitoToast.error({
          id: ACTIVE_PLAN_CREATE_TOAST_ID,
          title: "Plan change blocked",
          description: result.message,
          duration: 7200,
        });
        return;
      }

      selectedPlanPreview.setPreviewOpen(false);
      setTransitionReviewOpen(true);
      hitoToast.success({
        id: ACTIVE_PLAN_CREATE_TOAST_ID,
        title: "Transition review ready",
        description: "Confirm the reviewed plan before Hito changes your active plan.",
      });
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Could not review this active-plan transition.";
      const blocked = buildTransitionBlockedResult(message, candidate.input);
      setTransitionReviewResult(blocked);
      transitionInFlightRef.current = false;
      setTransitionStatus("idle");
      hitoToast.error({
        id: ACTIVE_PLAN_CREATE_TOAST_ID,
        title: "Review failed",
        description: message,
        duration: 7200,
      });
    }
  }

  async function confirmReviewedTransition() {
    const review = transitionReviewResult?.ok ? transitionReviewResult : null;

    if (!review || !transitionReviewInput || transitionInFlightRef.current) {
      return;
    }

    transitionInFlightRef.current = true;
    setTransitionStatus("confirming");
    setTransitionConfirmResult(null);
    hitoToast.working({
      id: ACTIVE_PLAN_CREATE_TOAST_ID,
      title: "Applying reviewed plan",
      description: "Hito is rechecking the active plan and candidate before saving.",
    });

    try {
      const result = await confirmActivePlanTransitionFn({
        data: {
          reviewInput: transitionReviewInput,
          transitionReviewToken: review.transitionReviewToken,
          transitionReviewChecksum: review.transitionReviewChecksum,
        },
      });

      setTransitionConfirmResult(result);

      if (!result.ok) {
        transitionInFlightRef.current = false;
        setTransitionStatus("idle");
        hitoToast.error({
          id: ACTIVE_PLAN_CREATE_TOAST_ID,
          title: "Plan not changed",
          description: result.message,
          duration: 7600,
        });
        return;
      }

      hitoToast.success({
        id: ACTIVE_PLAN_CREATE_TOAST_ID,
        title: "Reviewed plan applied",
        description: "Your previous manual plan was kept as history.",
        duration: 3000,
      });
      window.location.assign("/");
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Could not apply the reviewed plan.";
      const blocked = buildTransitionBlockedResult(message, transitionReviewInput.candidate);
      setTransitionConfirmResult(blocked);
      transitionInFlightRef.current = false;
      setTransitionStatus("idle");
      hitoToast.error({
        id: ACTIVE_PLAN_CREATE_TOAST_ID,
        title: "Plan not changed",
        description: message,
        duration: 7600,
      });
    }
  }

  function keepCurrentPlan() {
    setTransitionReviewOpen(false);
    setTransitionConfirmResult(null);
    hitoToast.success({
      id: ACTIVE_PLAN_CREATE_TOAST_ID,
      title: "Current plan kept",
      description: "Nothing changed.",
      duration: 2400,
    });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          overlayClassName="hito-dialog-overlay-stable"
          className="hito-dialog-stable hito-product-dialog hito-dialog-surface-product hito-dialog-size-review hito-dialog-height-review-large"
        >
          <DialogHeader className="hito-product-dialog-header">
            <div className="min-w-0">
              <p className="hito-micro-label" data-tone="signal">
                Create a plan
              </p>
              <DialogTitle className="hito-modal-title mt-2">
                Review a new plan before changing the current one.
              </DialogTitle>
              <DialogDescription className="hito-body max-w-2xl">
                Choose a generated starting point. Hito will show the active-plan transition before
                anything is saved.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="hito-product-dialog-body-scroll-fill">
            <div className="grid gap-6">
              {!isActiveManualPlan ? <UnsupportedActivePlanNotice onOpenPlan={onOpenPlan} /> : null}

              <div
                className="hito-tabs hito-tabs-simple w-fit max-w-full flex-wrap"
                role="tablist"
                aria-label="Create plan mode"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={createMode === "quick"}
                  className="hito-tab"
                  data-active={createMode === "quick"}
                  disabled={isBusy}
                  onClick={() => setCreateMode("quick")}
                >
                  Quick plan
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={createMode === "custom"}
                  className="hito-tab"
                  data-active={createMode === "custom"}
                  disabled={isBusy}
                  onClick={() => setCreateMode("custom")}
                >
                  Custom plan
                </button>
              </div>

              {createMode === "quick" ? (
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
                  draftResult={null}
                  constructorError={null}
                  isBusy={isBusy || !isActiveManualPlan}
                  isConstructorReady={isPresetDiscoveryReady}
                  onSubmit={() => {
                    selectedPlanPreview.setError(
                      "Choose a plan family before reviewing the plan change.",
                    );
                  }}
                  onConfirmDraft={() => undefined}
                  onBackToEdit={() => undefined}
                  planPresetPanel={
                    <PlanPresetPanel
                      cardsResult={selectedPlanPreview.cardsResult}
                      confirmResult={null}
                      previewResult={selectedPlanPreview.previewResult}
                      createStatus={transitionStatus === "reviewing" ? "creating" : "idle"}
                      error={selectedPlanPreview.error}
                      status={selectedPlanPreview.status}
                      isBusy={isBusy || !isActiveManualPlan}
                      isPresetDiscoveryReady={isPresetDiscoveryReady}
                      selectedCardId={selectedPlanPreview.selectedCardId}
                      previewOpen={selectedPlanPreview.previewOpen}
                      onPreviewOpenChange={(nextOpen) => {
                        selectedPlanPreview.setPreviewOpen(nextOpen);
                        if (!nextOpen) {
                          setTransitionReviewResult(null);
                        }
                      }}
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
                        void reviewSelectedPlanTransition();
                      }}
                      previewDialogDescription="This candidate is still preview-only. Next, Hito reviews what changes in your current manual plan before anything is saved."
                      previewDialogPrimaryActionLabel="Review plan change"
                      previewDialogPrimaryActionPendingLabel="Reviewing change..."
                      previewDialogExtraNotice={
                        transitionReviewResult && !transitionReviewResult.ok ? (
                          <TransitionBlockedNotice result={transitionReviewResult} />
                        ) : null
                      }
                    />
                  }
                />
              ) : (
                <CustomPlanTransitionNotice
                  onUseQuick={() => setCreateMode("quick")}
                  onOpenPlan={onOpenPlan}
                />
              )}
            </div>
          </div>

          <DialogFooter className="hito-product-dialog-footer sm:space-x-0">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="hito-button hito-button-secondary hito-button-md"
              disabled={transitionStatus !== "idle"}
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ActivePlanTransitionReviewDialog
        open={transitionReviewOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && transitionStatus === "idle") {
            setTransitionReviewOpen(false);
          }
        }}
        result={transitionReviewResult}
        confirmResult={transitionConfirmResult}
        status={transitionStatus}
        onConfirm={() => {
          void confirmReviewedTransition();
        }}
        onKeepCurrentPlan={keepCurrentPlan}
      />
    </>
  );
}
