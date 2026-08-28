import type { ReactNode, RefObject } from "react";
import { HitoDateField, HitoMaskedTimeField } from "@/components/ui/hito-date-time-input";
import { HitoChoiceToggle } from "@/components/ui/hito-choice-toggle";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { PlanGoalChoice } from "@/components/onboarding/onboarding-form-model";
import { SelectedRunningPlanPreviewDialog } from "@/components/onboarding/SelectedTenKPlanPreviewDialog";
import {
  derivePlanGoalPaceReadback,
  planGoalChoiceLabel,
  type PlanGoalIntentDraftState,
  parsePlanGoalCustomDistanceKm,
  runningPlanAdmissionFieldErrors,
  type RunningPlanAdmissionFailure,
} from "@/components/onboarding/selected-running-plan-flow-utils";
import type {
  RunningPlanConfirmActionResult,
  RunningPlanPreviewActionResult,
} from "@/lib/running-plan-engine-actions";
import { cn } from "@/lib/utils";
import { useHitoRadioGroup, type HitoRadioOptionProps } from "@/components/ui/hito-radio-group";
import { useHitoProductMessage, useHitoUiLocale } from "@/components/ui/hito-ui-locale-provider";
import { getHitoKnownProductMessage } from "@/lib/ui-locale-messages";

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
  confirmResult: RunningPlanConfirmActionResult | null;
  previewResult: RunningPlanPreviewActionResult | null;
  createStatus: RunningPlanCreateStatus;
  error: string | null;
  requestResult: RunningPlanAdmissionFailure | null;
  status: "idle" | "previewing_plan";
  hasRequiredPlanBasics: boolean;
  requiredBasicsCopy?: string;
  previewOpen: boolean;
  onPreviewOpenChange: (open: boolean) => void;
  onCancelPreview: () => void;
  onRefreshPreview: () => void;
  onCreatePlan: () => void;
  previewDialogDescription?: string;
  previewDialogPrimaryActionLabel?: string;
  previewDialogPrimaryActionPendingLabel?: string;
  previewDialogExtraNotice?: ReactNode;
  previewReturnFocusRef?: RefObject<HTMLElement | null>;
  planGoalFocusRef?: RefObject<HTMLButtonElement | null>;
  planGoalChoice: PlanGoalChoice;
  planGoalCustomDistanceKm: string;
  planGoalCustomDistanceLabel: string;
  planGoalFinishTime: string;
  planGoalTargetDate: string;
  runnerComment: string;
  onPlanGoalChoiceChange: (value: PlanGoalChoice) => void;
  onPlanGoalCustomDistanceKmChange: (value: string) => void;
  onPlanGoalCustomDistanceLabelChange: (value: string) => void;
  onPlanGoalFinishTimeChange: (value: string) => void;
  onPlanGoalTargetDateChange: (value: string) => void;
  onRunnerCommentChange: (value: string) => void;
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
  confirmResult,
  createStatus,
  error,
  requestResult,
  hasRequiredPlanBasics,
  requiredBasicsCopy = "Age, height, and weight are required before Hito can prepare a reviewed plan.",
  onCancelPreview,
  onCreatePlan,
  onPreviewOpenChange,
  onRefreshPreview,
  previewOpen,
  previewResult,
  previewDialogDescription,
  previewDialogExtraNotice,
  previewDialogPrimaryActionLabel,
  previewDialogPrimaryActionPendingLabel,
  previewReturnFocusRef,
  planGoalFocusRef,
  planGoalChoice,
  planGoalCustomDistanceKm,
  planGoalCustomDistanceLabel,
  planGoalFinishTime,
  planGoalTargetDate,
  runnerComment,
  onPlanGoalChoiceChange,
  onPlanGoalCustomDistanceKmChange,
  onPlanGoalCustomDistanceLabelChange,
  onPlanGoalFinishTimeChange,
  onPlanGoalTargetDateChange,
  onRunnerCommentChange,
  status,
}: PlanPresetPanelProps) {
  const locale = useHitoUiLocale();
  const message = useHitoProductMessage();
  const fieldErrors = runningPlanAdmissionFieldErrors(requestResult);
  const previewGoalLabel = planGoalChoice
    ? planGoalChoice === "custom" && planGoalCustomDistanceLabel.trim()
      ? planGoalCustomDistanceLabel.trim()
      : getHitoKnownProductMessage(locale, planGoalChoiceLabel(planGoalChoice))
    : message("Generated");

  return (
    <section className="hito-plan-preset-stage pt-8">
      <div className="flex flex-wrap items-start justify-center gap-4 text-center">
        <div className="max-w-2xl">
          <h2 className="hito-ui-title-xs text-foreground">{message("Choose your goal.")}</h2>
          <p className="hito-body-xs text-secondary mt-2">
            {message(
              "Pick one goal. A successful reviewed preview is saved in Plans before its workouts are added to Calendar.",
            )}
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
          fieldErrors={fieldErrors}
          focusRef={planGoalFocusRef}
          onGoalChoiceChange={onPlanGoalChoiceChange}
          onCustomDistanceKmChange={onPlanGoalCustomDistanceKmChange}
          onCustomDistanceLabelChange={onPlanGoalCustomDistanceLabelChange}
          onFinishTimeChange={onPlanGoalFinishTimeChange}
          onTargetDateChange={onPlanGoalTargetDateChange}
        />

        <label className="grid min-w-0 gap-2">
          <span className="hito-label-md text-foreground">
            {message("Plan context (optional)")}
          </span>
          <Textarea
            id="plan-context"
            className="min-h-24 resize-y"
            name="runnerComment"
            onChange={(event) => onRunnerCommentChange(event.target.value)}
            placeholder={message("For example, I ran an even 8K yesterday and recovered well.")}
            rows={3}
            value={runnerComment}
            aria-invalid={Boolean(fieldErrors.runnerComment) || undefined}
            aria-describedby={fieldErrors.runnerComment ? "plan-context-error" : undefined}
          />
          {fieldErrors.runnerComment ? (
            <span id="plan-context-error" className="hito-body-md font-medium text-negative">
              {getHitoKnownProductMessage(locale, fieldErrors.runnerComment)}
            </span>
          ) : null}
        </label>

        {!hasRequiredPlanBasics ? (
          <div className="hito-surface-wash">
            <p className="hito-body-md text-foreground">
              {message("Add a few basics before previewing")}
            </p>
            <p className="hito-body-sm mt-1 text-secondary">{requiredBasicsCopy}</p>
          </div>
        ) : null}

        {requestResult ? (
          <div
            id="plan-preparation-request-result"
            className="hito-surface-wash"
            data-tone="negative"
            role="alert"
            tabIndex={-1}
          >
            <p className="hito-body-md font-medium text-negative">
              {getHitoKnownProductMessage(locale, requestResult.title)}
            </p>
            <ul className="hito-body-sm mt-2 grid gap-1 text-negative">
              {requestResult.issues.map((issue, index) => (
                <li key={`${issue.field ?? "request"}-${index}`}>
                  {getHitoKnownProductMessage(locale, issue.correction)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {error ? (
          <p className="hito-body-md font-medium text-negative">
            {getHitoKnownProductMessage(locale, error)}
          </p>
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
        goalLabel={previewGoalLabel}
        onCancel={onCancelPreview}
        onRefresh={onRefreshPreview}
        onCreate={onCreatePlan}
        description={previewDialogDescription}
        primaryActionLabel={previewDialogPrimaryActionLabel}
        primaryActionPendingLabel={previewDialogPrimaryActionPendingLabel}
        extraNotice={previewDialogExtraNotice}
        returnFocusRef={previewReturnFocusRef}
      />
    </section>
  );
}

function PlanGoalIntentControls({
  customDistanceKm,
  customDistanceLabel,
  focusRef,
  finishTime,
  goalChoice,
  onCustomDistanceKmChange,
  onCustomDistanceLabelChange,
  onFinishTimeChange,
  onGoalChoiceChange,
  onTargetDateChange,
  targetDate,
  fieldErrors,
}: {
  goalChoice: PlanGoalChoice;
  customDistanceKm: string;
  customDistanceLabel: string;
  focusRef?: RefObject<HTMLButtonElement | null>;
  finishTime: string;
  targetDate: string;
  fieldErrors: ReturnType<typeof runningPlanAdmissionFieldErrors>;
  onGoalChoiceChange: (value: PlanGoalChoice) => void;
  onCustomDistanceKmChange: (value: string) => void;
  onCustomDistanceLabelChange: (value: string) => void;
  onFinishTimeChange: (value: string) => void;
  onTargetDateChange: (value: string) => void;
}) {
  const locale = useHitoUiLocale();
  const message = useHitoProductMessage();
  const draftState: PlanGoalIntentDraftState = {
    planGoalChoice: goalChoice,
    planGoalCustomDistanceKm: customDistanceKm,
    planGoalCustomDistanceLabel: customDistanceLabel,
    planGoalFinishTime: finishTime,
    planGoalTargetDate: targetDate,
  };
  const customDistanceIsValid = parsePlanGoalCustomDistanceKm(customDistanceKm) != null;
  const derivedPace = derivePlanGoalPaceReadback(draftState);
  const showsPresetRefinements =
    goalChoice === "10k" || goalChoice === "half_marathon" || goalChoice === "marathon";
  const showsCustomRefinements = goalChoice === "custom" && customDistanceIsValid;
  const customDistanceError =
    goalChoice === "custom" && fieldErrors.customDistance
      ? getHitoKnownProductMessage(locale, fieldErrors.customDistance)
      : undefined;
  const finishTimeError = fieldErrors.finishTime
    ? getHitoKnownProductMessage(locale, fieldErrors.finishTime)
    : undefined;
  const targetDateError = fieldErrors.targetDate
    ? getHitoKnownProductMessage(locale, fieldErrors.targetDate)
    : undefined;
  const goalError = fieldErrors.goal
    ? getHitoKnownProductMessage(locale, fieldErrors.goal)
    : undefined;
  const goalGroup = useHitoRadioGroup({
    items: PLAN_GOAL_CHOICES.map((choice) => ({ value: choice.value })),
    value: goalChoice || null,
  });

  return (
    <div className="grid gap-4">
      <div
        className="grid gap-3 sm:grid-cols-2"
        {...goalGroup.groupProps}
        aria-label={message("Training goal")}
        aria-invalid={Boolean(goalError) || undefined}
        aria-describedby={goalError ? "plan-goal-error" : undefined}
      >
        {PLAN_GOAL_CHOICES.map((choice) => (
          <PlanGoalCard
            key={choice.value}
            active={goalChoice === choice.value}
            buttonRef={choice.value === "10k" ? focusRef : undefined}
            compactDistance={choice.value === "custom"}
            radioProps={goalGroup.getRadioProps(choice.value)}
            distance={getHitoKnownProductMessage(locale, choice.distance)}
            label={getHitoKnownProductMessage(locale, choice.label)}
            copy={getHitoKnownProductMessage(locale, choice.copy)}
            onClick={() => onGoalChoiceChange(choice.value)}
          />
        ))}
      </div>
      {goalError ? (
        <p id="plan-goal-error" className="hito-body-md font-medium text-negative">
          {goalError}
        </p>
      ) : null}

      {goalChoice === "custom" ? (
        <div className="hito-form-two-column-grid">
          <label className="grid gap-2">
            <span className="hito-label-md text-foreground">{message("Custom distance")}</span>
            <Input
              id="plan-goal-custom-distance"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={customDistanceKm}
              onChange={(event) => onCustomDistanceKmChange(event.target.value)}
              placeholder="12.5"
              feedback={customDistanceError ? "error" : "neutral"}
              aria-invalid={Boolean(customDistanceError) || undefined}
              aria-describedby={customDistanceError ? "plan-goal-custom-distance-error" : undefined}
              size="md"
              variant="primary"
            />
            {customDistanceError ? (
              <span
                id="plan-goal-custom-distance-error"
                className="hito-body-md font-medium text-negative"
              >
                {customDistanceError}
              </span>
            ) : (
              <span className="hito-body-xs text-secondary">
                {message("Kilometers. For example: 12.5.")}
              </span>
            )}
          </label>
          <label className="grid gap-2">
            <span className="hito-label-md text-foreground">{message("Goal name")}</span>
            <Input
              type="text"
              autoComplete="off"
              value={customDistanceLabel}
              onChange={(event) => onCustomDistanceLabelChange(event.target.value)}
              placeholder="City 12.5K"
              size="md"
              variant="primary"
            />
            <span className="hito-body-xs text-secondary">
              {message("Optional. For example: City 12.5K.")}
            </span>
          </label>
        </div>
      ) : null}

      {showsPresetRefinements || showsCustomRefinements ? (
        <div className="grid gap-3">
          <div className="hito-form-two-column-grid">
            <HitoDateField
              id="plan-goal-target-date"
              label={message("Race day")}
              value={targetDate}
              onChange={onTargetDateChange}
              helper={message("Required. Choose the race day for this generated plan.")}
              error={targetDateError}
              required
            />
            <HitoMaskedTimeField
              id="plan-goal-finish-time"
              label={message("Finish time")}
              value={finishTime}
              onChange={onFinishTimeChange}
              placeholder={finishTimePlaceholder(goalChoice)}
              helper={message("Optional. Add this only if you have a result goal.")}
              error={finishTimeError}
            />
          </div>
          {derivedPace ? (
            <div className="hito-surface-wash" data-tone="signal">
              <p className="hito-body-md text-foreground">
                {message("That means about {pace} on race day.", { pace: derivedPace })}
              </p>
              <p className="hito-body-sm mt-1 text-secondary">
                {message("This is goal readback, not your workout pace target.")}
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
  buttonRef,
  compactDistance,
  copy,
  distance,
  label,
  onClick,
  radioProps,
}: {
  active: boolean;
  buttonRef?: RefObject<HTMLButtonElement | null>;
  compactDistance: boolean;
  copy: string;
  distance: string;
  label: string;
  onClick: () => void;
  radioProps: HitoRadioOptionProps;
}) {
  const t = useHitoProductMessage();

  return (
    <HitoChoiceToggle
      ref={buttonRef}
      type="button"
      {...radioProps}
      presentation="card"
      selected={active}
      onClick={onClick}
      className="min-h-32 w-full flex-col justify-between text-left"
    >
      <span className="flex w-full min-w-0 flex-wrap items-start justify-between gap-3">
        <span
          className={cn(
            "min-w-0 max-w-full break-words font-sans font-semibold leading-none",
            compactDistance ? "text-2xl" : "text-3xl",
          )}
        >
          {distance}
        </span>
        {active ? (
          <span className="hito-status-pill ml-auto shrink-0" data-tone="muted">
            {t("Selected")}
          </span>
        ) : (
          <span className="hito-status-pill ml-auto shrink-0" data-tone="muted">
            {t("Preview")}
          </span>
        )}
      </span>
      <span className="grid min-w-0 gap-1">
        <span className="font-semibold leading-tight">{label}</span>
        <span className="text-xs font-medium leading-snug opacity-80">{copy}</span>
      </span>
    </HitoChoiceToggle>
  );
}
