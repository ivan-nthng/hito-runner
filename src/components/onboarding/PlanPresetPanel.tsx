import type { ReactNode } from "react";
import { HitoDateField, HitoMaskedTimeField } from "@/components/ui/hito-date-time-input";
import type { PlanGoalChoice } from "@/components/onboarding/onboarding-form-model";
import { SelectedRunningPlanPreviewDialog } from "@/components/onboarding/SelectedTenKPlanPreviewDialog";
import {
  derivePlanGoalPaceReadback,
  type PlanGoalIntentDraftState,
  type PlanGoalSelectionId,
  parsePlanGoalCustomDistanceKm,
  resolveSelectedPlanGoalPreviewGate,
} from "@/components/onboarding/selected-running-plan-flow-utils";
import type { PlanPresetCardsActionResult } from "@/lib/plan-preset-actions";
import type {
  RunningPlanConfirmActionResult,
  RunningPlanPreviewActionResult,
} from "@/lib/running-plan-engine-actions";
import { cn } from "@/lib/utils";

export type PlanPresetUiStatus = "idle" | "loading_cards" | "previewing_plan";
type RunningPlanCreateStatus = "idle" | "creating";

const PLAN_GOAL_CHOICES: {
  value: Exclude<PlanGoalChoice, "">;
  distance: string;
  label: string;
  copy: string;
}[] = [
  {
    value: "10k",
    distance: "10K",
    label: "10K",
    copy: "A compact goal for building rhythm and confidence.",
  },
  {
    value: "half_marathon",
    distance: "21K",
    label: "Half Marathon",
    copy: "A longer build with steady endurance and quality work.",
  },
  {
    value: "marathon",
    distance: "42K",
    label: "Marathon",
    copy: "A full marathon goal with reviewed load and long-run progression.",
  },
  {
    value: "custom",
    distance: "Custom",
    label: "Custom",
    copy: "Set your own distance and use the same generated-plan review path.",
  },
];

interface PlanPresetPanelProps {
  cardsResult: PlanPresetCardsActionResult | null;
  confirmResult: RunningPlanConfirmActionResult | null;
  previewResult: RunningPlanPreviewActionResult | null;
  createStatus: RunningPlanCreateStatus;
  error: string | null;
  status: PlanPresetUiStatus;
  isBusy: boolean;
  isPresetDiscoveryReady: boolean;
  previewOpen: boolean;
  onPreviewOpenChange: (open: boolean) => void;
  onSelectPlan: (goalSelection: PlanGoalSelectionId) => void;
  onRefreshPreview: () => void;
  onCreatePlan: () => void;
  previewDialogDescription?: string;
  previewDialogPrimaryActionLabel?: string;
  previewDialogPrimaryActionPendingLabel?: string;
  previewDialogExtraNotice?: ReactNode;
  showInlinePreviewAction?: boolean;
  planGoalChoice: PlanGoalChoice;
  planGoalCustomDistanceKm: string;
  planGoalCustomDistanceLabel: string;
  planGoalFinishTime: string;
  planGoalTargetDate: string;
  onPlanGoalChoiceChange: (value: PlanGoalChoice) => void;
  onPlanGoalCustomDistanceKmChange: (value: string) => void;
  onPlanGoalCustomDistanceLabelChange: (value: string) => void;
  onPlanGoalFinishTimeChange: (value: string) => void;
  onPlanGoalTargetDateChange: (value: string) => void;
}

function finishTimePlaceholder(goalChoice: PlanGoalChoice) {
  switch (goalChoice) {
    case "10k":
      return "45:00";
    case "half_marathon":
      return "1:45:00";
    case "custom":
      return "1:00:00";
    case "marathon":
    case "":
      return "3:30:00";
  }
}

export function PlanPresetPanel({
  cardsResult,
  confirmResult,
  createStatus,
  error,
  isBusy,
  isPresetDiscoveryReady,
  onCreatePlan,
  onPreviewOpenChange,
  onRefreshPreview,
  onSelectPlan,
  previewOpen,
  previewResult,
  previewDialogDescription,
  previewDialogExtraNotice,
  previewDialogPrimaryActionLabel,
  previewDialogPrimaryActionPendingLabel,
  showInlinePreviewAction = true,
  planGoalChoice,
  planGoalCustomDistanceKm,
  planGoalCustomDistanceLabel,
  planGoalFinishTime,
  planGoalTargetDate,
  onPlanGoalChoiceChange,
  onPlanGoalCustomDistanceKmChange,
  onPlanGoalCustomDistanceLabelChange,
  onPlanGoalFinishTimeChange,
  onPlanGoalTargetDateChange,
  status,
}: PlanPresetPanelProps) {
  const blockedMessage = cardsResult && !cardsResult.ok ? cardsResult.message : null;
  const loadingCards = status === "loading_cards";
  const basicsBlocked = !isPresetDiscoveryReady;
  const draftState: PlanGoalIntentDraftState = {
    planGoalChoice,
    planGoalCustomDistanceKm,
    planGoalCustomDistanceLabel,
    planGoalFinishTime,
    planGoalTargetDate,
  };
  const selectedGoalId = planGoalChoice || null;
  const previewGate = resolveSelectedPlanGoalPreviewGate(draftState, selectedGoalId);
  const previewDisabled = isBusy || basicsBlocked || !selectedGoalId || !previewGate.ok;
  const previewHelper = previewGate.ok ? null : previewGate.error;

  return (
    <section className="hito-plan-preset-stage hito-section-divider pt-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="hito-micro-label" data-tone="signal">
            Generated plan
          </p>
          <h2 className="hito-panel-title mt-2">Choose your goal.</h2>
          <p className="hito-helper mt-2">
            Pick one goal, then review the generated preview before anything is created.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        <PlanGoalIntentControls
          goalChoice={planGoalChoice}
          customDistanceKm={planGoalCustomDistanceKm}
          customDistanceLabel={planGoalCustomDistanceLabel}
          finishTime={planGoalFinishTime}
          targetDate={planGoalTargetDate}
          onGoalChoiceChange={onPlanGoalChoiceChange}
          onCustomDistanceKmChange={onPlanGoalCustomDistanceKmChange}
          onCustomDistanceLabelChange={onPlanGoalCustomDistanceLabelChange}
          onFinishTimeChange={onPlanGoalFinishTimeChange}
          onTargetDateChange={onPlanGoalTargetDateChange}
        />

        {!isPresetDiscoveryReady ? (
          <div className="hito-surface-wash">
            <p className="hito-list-row-title">Add a few basics to see plan options</p>
            <p className="hito-list-row-copy">
              Age, height, and weight help Hito show better starting plans.
            </p>
          </div>
        ) : null}

        {loadingCards ? (
          <div className="hito-surface-wash" data-tone="signal">
            <p className="hito-list-row-title">Checking plan support</p>
            <p className="hito-list-row-copy">
              Hito is checking which guided previews fit your setup.
            </p>
          </div>
        ) : null}

        {error || blockedMessage ? (
          <p className="hito-field-error">{error ?? blockedMessage}</p>
        ) : null}

        {showInlinePreviewAction ? (
          <div className="hito-section-divider flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="hito-list-row-title">Build one generated preview</p>
              <p className="hito-list-row-copy">
                Hito reviews the selected goal before anything is created.
              </p>
              {previewHelper ? <p className="hito-field-helper mt-2">{previewHelper}</p> : null}
            </div>
            <button
              type="button"
              className="hito-button hito-button-primary hito-button-md shrink-0"
              disabled={previewDisabled}
              onClick={() => {
                if (selectedGoalId) {
                  onSelectPlan(selectedGoalId);
                }
              }}
            >
              {previewButtonLabel({
                basicsBlocked,
                goalChoice: planGoalChoice,
                loadingCards,
                previewGate,
                status,
              })}
            </button>
          </div>
        ) : null}
      </div>

      <SelectedRunningPlanPreviewDialog
        open={previewOpen}
        onOpenChange={onPreviewOpenChange}
        confirmResult={confirmResult}
        createStatus={createStatus}
        result={previewResult}
        status={status}
        error={error}
        onRefresh={onRefreshPreview}
        onCreate={onCreatePlan}
        description={previewDialogDescription}
        primaryActionLabel={previewDialogPrimaryActionLabel}
        primaryActionPendingLabel={previewDialogPrimaryActionPendingLabel}
        extraNotice={previewDialogExtraNotice}
      />
    </section>
  );
}

function previewButtonLabel({
  basicsBlocked,
  goalChoice,
  loadingCards,
  previewGate,
  status,
}: {
  basicsBlocked: boolean;
  goalChoice: PlanGoalChoice;
  loadingCards: boolean;
  previewGate: ReturnType<typeof resolveSelectedPlanGoalPreviewGate>;
  status: PlanPresetUiStatus;
}) {
  if (status === "previewing_plan") {
    return "Building preview...";
  }

  if (loadingCards) {
    return "Checking setup...";
  }

  if (basicsBlocked) {
    return "Build preview";
  }

  if (!goalChoice) {
    return "Build preview";
  }

  return "Build preview";
}

function PlanGoalIntentControls({
  customDistanceKm,
  customDistanceLabel,
  finishTime,
  goalChoice,
  onCustomDistanceKmChange,
  onCustomDistanceLabelChange,
  onFinishTimeChange,
  onGoalChoiceChange,
  onTargetDateChange,
  targetDate,
}: {
  goalChoice: PlanGoalChoice;
  customDistanceKm: string;
  customDistanceLabel: string;
  finishTime: string;
  targetDate: string;
  onGoalChoiceChange: (value: PlanGoalChoice) => void;
  onCustomDistanceKmChange: (value: string) => void;
  onCustomDistanceLabelChange: (value: string) => void;
  onFinishTimeChange: (value: string) => void;
  onTargetDateChange: (value: string) => void;
}) {
  const draftState: PlanGoalIntentDraftState = {
    planGoalChoice: goalChoice,
    planGoalCustomDistanceKm: customDistanceKm,
    planGoalCustomDistanceLabel: customDistanceLabel,
    planGoalFinishTime: finishTime,
    planGoalTargetDate: targetDate,
  };
  const localGate = resolveSelectedPlanGoalPreviewGate(draftState, null);
  const localGateField = localGate.ok ? null : localGate.field;
  const localGateError = localGate.ok ? null : localGate.error;
  const customDistanceIsValid = parsePlanGoalCustomDistanceKm(customDistanceKm) != null;
  const derivedPace = derivePlanGoalPaceReadback(draftState);
  const showsPresetRefinements =
    goalChoice === "10k" || goalChoice === "half_marathon" || goalChoice === "marathon";
  const showsCustomRefinements = goalChoice === "custom" && customDistanceIsValid;
  const customDistanceError =
    goalChoice === "custom" && localGateField === "customDistance" ? localGateError : null;
  const finishTimeError = localGateField === "finishTime" ? localGateError : null;
  const targetDateError = localGateField === "targetDate" ? localGateError : null;

  return (
    <div className="grid gap-4">
      <div>
        <p className="hito-list-row-title">What are you training for?</p>
        <p className="hito-list-row-copy">
          Race day and finish time stay optional for every generated goal.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Training goal">
        {PLAN_GOAL_CHOICES.map((choice) => (
          <PlanGoalCard
            key={choice.value}
            active={goalChoice === choice.value}
            distance={choice.distance}
            label={choice.label}
            copy={choice.copy}
            onClick={() => onGoalChoiceChange(choice.value)}
          />
        ))}
      </div>

      {!goalChoice ? <p className="hito-field-helper">Choose what you are training for.</p> : null}

      {goalChoice === "custom" ? (
        <div className="hito-form-two-column-grid">
          <label className="grid gap-2">
            <span className="hito-form-label">Custom distance</span>
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={customDistanceKm}
              onChange={(event) => onCustomDistanceKmChange(event.target.value)}
              placeholder="12.5"
              className={cn(
                "hito-field hito-field-primary hito-field-md",
                customDistanceError && "hito-field-feedback-error",
              )}
            />
            {customDistanceError ? (
              <span className="hito-field-error">{customDistanceError}</span>
            ) : (
              <span className="hito-field-helper">Kilometers. For example: 12.5.</span>
            )}
          </label>
          <label className="grid gap-2">
            <span className="hito-form-label">Goal name</span>
            <input
              type="text"
              autoComplete="off"
              value={customDistanceLabel}
              onChange={(event) => onCustomDistanceLabelChange(event.target.value)}
              placeholder="City 12.5K"
              className="hito-field hito-field-primary hito-field-md"
            />
            <span className="hito-field-helper">Optional. For example: City 12.5K.</span>
          </label>
        </div>
      ) : null}

      {showsPresetRefinements || showsCustomRefinements ? (
        <div className="grid gap-3">
          <div className="hito-form-two-column-grid">
            <HitoDateField
              id="plan-goal-target-date"
              label="Race day"
              value={targetDate}
              onChange={onTargetDateChange}
              helper="Optional. Leave blank if you just want a normal preparation horizon."
              error={targetDateError}
            />
            <HitoMaskedTimeField
              id="plan-goal-finish-time"
              label="Finish time"
              value={finishTime}
              onChange={onFinishTimeChange}
              placeholder={finishTimePlaceholder(goalChoice)}
              helper="Optional. Add this only if you have a result goal."
              error={finishTimeError}
            />
          </div>
          {derivedPace ? (
            <div className="hito-surface-wash" data-tone="signal">
              <p className="hito-list-row-title">That means about {derivedPace} on race day.</p>
              <p className="hito-list-row-copy">
                This is goal readback, not your workout pace target.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function PlanGoalCard({
  active,
  copy,
  distance,
  label,
  onClick,
}: {
  active: boolean;
  copy: string;
  distance: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "hito-button hito-button-md min-h-32 w-full flex-col items-start justify-between whitespace-normal p-4 text-left",
        active ? "hito-button-primary" : "hito-button-secondary",
      )}
    >
      <span className="flex w-full min-w-0 items-start justify-between gap-3">
        <span
          className={cn(
            "font-display font-semibold leading-none",
            distance === "Custom" ? "text-2xl" : "text-3xl",
          )}
        >
          {distance}
        </span>
        {active ? (
          <span className="hito-status-pill shrink-0" data-tone="muted">
            Selected
          </span>
        ) : (
          <span className="hito-status-pill shrink-0" data-tone="muted">
            AI review
          </span>
        )}
      </span>
      <span className="grid min-w-0 gap-1">
        <span className="font-semibold leading-tight">{label}</span>
        <span className="text-xs font-medium leading-snug opacity-80">{copy}</span>
      </span>
    </button>
  );
}
