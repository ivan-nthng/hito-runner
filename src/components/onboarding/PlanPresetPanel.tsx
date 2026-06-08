import { useState, type Dispatch, type SetStateAction } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type {
  PlanPresetCardId,
  PlanPresetCardState,
  PlanPresetCardViewModel,
  PlanPresetPostSelectionRefinement,
  PlanPresetReviewDraftContract,
} from "@/lib/plan-presets/schema";
import type { RunnerFitnessLevel } from "@/lib/runner-training-preferences";
import type {
  PlanPresetCardsActionResult,
  PlanPresetConfirmActionResult,
  PlanPresetReviewDraftActionResult,
} from "@/lib/training-api";
import { cn } from "@/lib/utils";
import { TrainingPreferenceFields } from "./TrainingPreferenceFields";
import type { WeekdayName } from "./onboarding-form-model";

export type PlanPresetUiStatus = "idle" | "loading_cards" | "reviewing_draft" | "creating_plan";

interface PlanPresetPanelProps {
  cardsResult: PlanPresetCardsActionResult | null;
  reviewResult: PlanPresetReviewDraftActionResult | null;
  confirmResult: PlanPresetConfirmActionResult | null;
  error: string | null;
  status: PlanPresetUiStatus;
  isBusy: boolean;
  isPresetDiscoveryReady: boolean;
  selectedCardId: PlanPresetCardId | null;
  reviewedCardId: PlanPresetCardId | null;
  refinementState: PlanPresetRefinementState;
  refinementSetters: PlanPresetRefinementSetters;
  onLoadCards: () => void;
  onSelectCard: (cardId: PlanPresetCardId) => void;
  onReviewCard: (cardId: PlanPresetCardId) => void;
  onConfirmReview: () => void;
  onUseAdvancedCustom: () => void;
}

interface PlanPresetRefinementState {
  fixedRestDays: WeekdayName[];
  restDaysAnswered: boolean;
  maxRunningDaysPerWeek: string;
  preferredLongRunDay: WeekdayName | "";
  fitnessLevel: RunnerFitnessLevel;
  recent5kTime: string;
}

interface PlanPresetRefinementSetters {
  setFixedRestDays: Dispatch<SetStateAction<WeekdayName[]>>;
  setRestDaysAnswered: (value: boolean) => void;
  setMaxRunningDaysPerWeek: (value: string) => void;
  setPreferredLongRunDay: (value: WeekdayName | "") => void;
  setFitnessLevel: (value: RunnerFitnessLevel) => void;
  setRecent5kTime: (value: string) => void;
}

export function PlanPresetPanel({
  cardsResult,
  reviewResult,
  confirmResult,
  error,
  status,
  isBusy,
  isPresetDiscoveryReady,
  selectedCardId,
  reviewedCardId,
  refinementState,
  refinementSetters,
  onLoadCards,
  onSelectCard,
  onReviewCard,
  onConfirmReview,
  onUseAdvancedCustom,
}: PlanPresetPanelProps) {
  const [learnMoreCardId, setLearnMoreCardId] = useState<PlanPresetCardId | null>(null);
  const eligibility = cardsResult?.ok ? cardsResult : null;
  const learnMoreCard = eligibility?.cards.find((card) => card.cardId === learnMoreCardId) ?? null;
  const selectedCard = eligibility?.cards.find((card) => card.cardId === selectedCardId) ?? null;
  const blockedMessage = cardsResult && !cardsResult.ok ? cardsResult.message : null;
  const reviewReady = reviewResult?.ok ? reviewResult : null;
  const reviewDraft = reviewReady?.draft ?? null;
  const reviewError = reviewResult && !reviewResult.ok ? reviewResult.message : null;
  const confirmError = confirmResult && !confirmResult.ok ? confirmResult.message : null;
  const loadingCards = status === "loading_cards";
  const reviewingDraft = status === "reviewing_draft";
  const creatingPlan = status === "creating_plan";
  const canConfirm =
    Boolean(reviewReady?.reviewToken && reviewReady?.reviewChecksum) && Boolean(reviewedCardId);

  return (
    <section className="hito-plan-preset-stage hito-section-divider pt-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="hito-micro-label" data-tone="signal">
            Plan Presets
          </p>
          <h2 className="hito-panel-title mt-2">Choose a starting distance.</h2>
          <p className="hito-helper mt-2">
            Hito asks the backend for eligible preset cards from the five basics above. Nothing is
            saved, and the preset path does not call OpenAI.
          </p>
        </div>
        <button
          type="button"
          className="hito-button hito-button-secondary hito-button-sm shrink-0"
          disabled={isBusy}
          onClick={onLoadCards}
        >
          {loadingCards ? "Loading presets..." : eligibility ? "Refresh cards" : "Load cards"}
        </button>
      </div>

      <div className="mt-5 grid gap-4">
        {!isPresetDiscoveryReady ? (
          <div className="hito-surface-wash">
            <p className="hito-list-row-title">Add profile basics to shape recommendations</p>
            <p className="hito-list-row-copy">
              Cards can load from partial setup, but age, height, and weight make the backend fit
              copy useful. Weekly rhythm can be answered after selecting a preset.
            </p>
          </div>
        ) : null}

        {loadingCards && !eligibility ? (
          <div className="hito-surface-wash" data-tone="signal">
            <p className="hito-list-row-title">Loading Plan Presets</p>
            <p className="hito-list-row-copy">
              Checking backend-owned availability, dates, duration, metric policy, and fit.
            </p>
          </div>
        ) : null}

        {error || blockedMessage || reviewError || confirmError ? (
          <p
            className="hito-field-error"
            data-preset-confirm-reason={
              confirmResult && !confirmResult.ok ? confirmResult.reason : undefined
            }
          >
            {error ?? blockedMessage ?? reviewError ?? confirmError}
          </p>
        ) : null}

        {eligibility ? (
          <div className="hito-plan-preset-grid" aria-label="Plan preset cards">
            {eligibility.cards.map((card) => (
              <PlanPresetCard
                key={card.cardId}
                card={card}
                selected={selectedCardId === card.cardId || reviewedCardId === card.cardId}
                disabled={isBusy || reviewingDraft}
                onLearnMore={() => setLearnMoreCardId(card.cardId)}
                onSelect={() => onSelectCard(card.cardId)}
                onReview={() => onReviewCard(card.cardId)}
                onUseAdvancedCustom={onUseAdvancedCustom}
              />
            ))}
          </div>
        ) : null}

        {selectedCard?.postSelectionRefinement && !reviewDraft ? (
          <PlanPresetRefinementPanel
            card={selectedCard}
            refinement={selectedCard.postSelectionRefinement}
            state={refinementState}
            setters={refinementSetters}
            reviewingDraft={reviewingDraft}
            disabled={isBusy}
            onReview={() => onReviewCard(selectedCard.cardId)}
          />
        ) : null}

        {eligibility?.advancedCustom.recommended ? (
          <div className="hito-surface-wash" data-tone="signal">
            <p className="hito-list-row-title">Custom route recommended</p>
            <p className="hito-list-row-copy">
              {eligibility.advancedCustom.reason?.message ??
                "This setup is better handled by Advanced custom program."}
            </p>
          </div>
        ) : null}

        {reviewDraft ? (
          <PlanPresetReviewScaffold
            draft={reviewDraft}
            canConfirm={canConfirm}
            creatingPlan={creatingPlan}
            confirmResult={confirmResult}
            disabled={isBusy}
            onConfirm={onConfirmReview}
          />
        ) : null}
      </div>

      <PlanPresetLearnMoreDialog
        card={learnMoreCard}
        open={Boolean(learnMoreCard)}
        onOpenChange={(open) => {
          if (!open) {
            setLearnMoreCardId(null);
          }
        }}
      />
    </section>
  );
}

function PlanPresetCard({
  card,
  selected,
  disabled,
  onLearnMore,
  onSelect,
  onReview,
  onUseAdvancedCustom,
}: {
  card: PlanPresetCardViewModel;
  selected: boolean;
  disabled: boolean;
  onLearnMore: () => void;
  onSelect: () => void;
  onReview: () => void;
  onUseAdvancedCustom: () => void;
}) {
  const canReview =
    (card.state === "recommended" || card.state === "available") && card.reviewReady;
  const canRefine =
    card.state !== "custom_fit" &&
    card.state !== "unavailable" &&
    Boolean(card.postSelectionRefinement);
  const disabledReason =
    card.disabledReason?.message ??
    card.customRoutingReason?.message ??
    card.disabledReasonSummary ??
    card.customReasonSummary;
  const distanceIdentity = distanceIdentityLabel(card.cardId);
  const familyLabel = card.familyLabel ?? card.programFamily;
  const keyWorkoutPreview = card.keyWorkoutTypes.slice(0, 3);

  return (
    <Card
      className={cn(
        "hito-plan-preset-card flex min-w-0 flex-col",
        card.state === "unavailable" && "opacity-80",
      )}
      data-preset-card-id={card.cardId}
      data-preset-state={card.state}
      data-selected={selected || undefined}
    >
      <CardHeader className="hito-plan-preset-card-header gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="hito-plan-preset-distance" aria-hidden="true">
              {distanceIdentity}
            </p>
            <h3 className="hito-plan-preset-family mt-2">{familyLabel}</h3>
          </div>
        </div>
        <div className="hito-plan-preset-meta-row">
          <span>{card.durationWeeks} weeks</span>
          <span>{card.daysPerWeek} days/week</span>
        </div>
      </CardHeader>

      <CardContent className="hito-plan-preset-card-content grid flex-1 gap-4">
        <p className="hito-body-small text-muted-foreground">{card.workoutMixSummary}</p>
        <PlanPresetCardStateNote card={card} />
        <div>
          <p className="hito-label">Key workouts</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {keyWorkoutPreview.map((type) => (
              <span key={type} className="hito-status-pill" data-tone="muted">
                {type}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-auto flex flex-wrap gap-2">
          <button
            type="button"
            className="hito-button hito-button-secondary hito-button-sm flex-1"
            onClick={onLearnMore}
          >
            Learn more
          </button>
          {canReview ? (
            <button
              type="button"
              disabled={disabled}
              className={cn(
                "hito-button hito-button-sm flex-1",
                selected ? "hito-button-secondary" : "hito-button-primary",
              )}
              onClick={onReview}
            >
              {selected ? "Selected" : "Review preset"}
            </button>
          ) : canRefine ? (
            <button
              type="button"
              disabled={disabled}
              className={cn(
                "hito-button hito-button-sm flex-1",
                selected ? "hito-button-primary" : "hito-button-secondary",
              )}
              onClick={onSelect}
            >
              {selected ? "Editing preferences" : "Choose preferences"}
            </button>
          ) : card.state === "custom_fit" ? (
            <button
              type="button"
              disabled={disabled}
              className="hito-button hito-button-secondary hito-button-sm flex-1"
              onClick={onUseAdvancedCustom}
            >
              Open Advanced custom
            </button>
          ) : (
            <PlanPresetUnavailableReviewAction reason={disabledReason} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PlanPresetCardStateNote({ card }: { card: PlanPresetCardViewModel }) {
  if (card.state === "recommended" || card.state === "available") {
    if (card.reviewReady) {
      return null;
    }

    return (
      <p className="hito-field-helper">
        {card.postSelectionRefinement?.reason?.message ??
          "Choose a few preferences before Hito builds exact preset rows."}
      </p>
    );
  }

  const message =
    card.postSelectionRefinement?.reason?.message ??
    card.disabledReason?.message ??
    card.customRoutingReason?.message ??
    card.disabledReasonSummary ??
    card.customReasonSummary;

  if (!message) {
    return null;
  }

  return (
    <p className="hito-field-helper" data-preset-card-state={card.state}>
      <span className="font-semibold text-foreground/85">{stateLabel(card.state)}.</span> {message}
    </p>
  );
}

function PlanPresetUnavailableReviewAction({ reason }: { reason: string | null | undefined }) {
  const message = reason ?? "This preset is not available for the current backend review state.";

  return (
    <TooltipProvider delayDuration={180}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="hito-button hito-button-sm hito-button-primary hito-plan-preset-disabled-cta-trigger"
            aria-disabled="true"
            aria-label={`Review preset unavailable. ${message}`}
          >
            Review preset
          </button>
        </TooltipTrigger>
        <TooltipContent className="hito-tooltip max-w-72" sideOffset={8}>
          <span className="hito-tooltip-meta block">{message}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function PlanPresetRefinementPanel({
  card,
  refinement,
  state,
  setters,
  reviewingDraft,
  disabled,
  onReview,
}: {
  card: PlanPresetCardViewModel;
  refinement: PlanPresetPostSelectionRefinement;
  state: PlanPresetRefinementState;
  setters: PlanPresetRefinementSetters;
  reviewingDraft: boolean;
  disabled: boolean;
  onReview: () => void;
}) {
  const fields = new Set([...refinement.requiredFields, ...refinement.optionalFields]);
  const showsBenchmark = fields.has("benchmark.fitnessLevel");

  return (
    <div className="hito-row-group" data-preset-refinement>
      <div className="hito-list-row items-start">
        <div className="min-w-0">
          <p className="hito-list-row-title">
            Finish preferences for {distanceIdentityLabel(card.cardId)}{" "}
            {card.familyLabel ?? card.programFamily}
          </p>
          <p className="hito-list-row-copy">
            {refinement.reason?.message ??
              "Hito needs a few preference answers before this preset can be reviewed."}
          </p>
        </div>
        <span className="hito-status-pill" data-tone="signal">
          Preferences
        </span>
      </div>

      {refinement.defaultSummary.length ? (
        <div className="hito-list-row items-start">
          <div className="grid gap-2">
            <p className="hito-label">Backend defaults available</p>
            <ul className="grid gap-1">
              {refinement.defaultSummary.map((item) => (
                <li key={item} className="hito-body-small text-muted-foreground">
                  {item}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="hito-button hito-button-secondary hito-button-sm w-fit"
              disabled={disabled}
              onClick={() => {
                if (!state.maxRunningDaysPerWeek.trim()) {
                  setters.setMaxRunningDaysPerWeek(String(card.daysPerWeek));
                }

                if (!state.restDaysAnswered) {
                  setters.setRestDaysAnswered(true);
                }

                if (!state.preferredLongRunDay) {
                  setters.setPreferredLongRunDay(card.longRunDay);
                }
              }}
            >
              Use suggested defaults
            </button>
          </div>
        </div>
      ) : null}

      <div className="hito-list-row items-start">
        <div className="grid gap-4">
          <TrainingPreferenceFields
            fixedRestDays={state.fixedRestDays}
            onFixedRestDaysChange={setters.setFixedRestDays}
            restDaysAnswered={state.restDaysAnswered}
            onRestDaysAnsweredChange={setters.setRestDaysAnswered}
            maxRunningDaysPerWeek={state.maxRunningDaysPerWeek}
            onMaxRunningDaysPerWeekChange={setters.setMaxRunningDaysPerWeek}
            preferredLongRunDay={state.preferredLongRunDay}
            onPreferredLongRunDayChange={setters.setPreferredLongRunDay}
            preferredLongRunMode="default-sunday"
            fixedRestDaysHelper="Optional. Leave open if no weekday must always be protected."
            maxRunningDaysHelper="Required before preset review. Hito will verify the selected rhythm server-side."
            preferredLongRunHelper="Choose a long-run day or keep the backend default."
            showFitnessBenchmark={showsBenchmark}
            fitnessLevel={state.fitnessLevel}
            onFitnessLevelChange={(value) => {
              setters.setFitnessLevel(value);
              if (value !== "custom") {
                setters.setRecent5kTime("");
              }
            }}
            recent5kTime={state.recent5kTime}
            onRecent5kTimeChange={setters.setRecent5kTime}
          />
        </div>
      </div>

      <div className="hito-list-row items-center">
        <div className="min-w-0">
          <p className="hito-list-row-title">Review stays server-owned</p>
          <p className="hito-list-row-copy">
            Hito will recompute preset fit and issue a review token only if this setup is resolved.
          </p>
        </div>
        <button
          type="button"
          className="hito-button hito-button-primary hito-button-sm shrink-0"
          disabled={disabled || reviewingDraft}
          onClick={onReview}
        >
          {reviewingDraft ? "Reviewing preset..." : "Review preset"}
        </button>
      </div>
    </div>
  );
}

function PlanPresetLearnMoreDialog({
  card,
  open,
  onOpenChange,
}: {
  card: PlanPresetCardViewModel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!card) {
    return null;
  }

  const reason = card.disabledReasonSummary ?? card.customReasonSummary;
  const familyLabel = card.familyLabel ?? card.programFamily;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="hito-product-dialog max-h-[88vh] max-w-2xl overflow-y-auto"
        overlayClassName="hito-product-dialog-overlay"
      >
        <DialogHeader className="hito-product-dialog-header">
          <DialogTitle className="hito-modal-title">
            {distanceIdentityLabel(card.cardId)} {familyLabel}
          </DialogTitle>
          <DialogDescription className="hito-body max-w-xl">
            Backend-shaped preset details. Nothing is created until a reviewed preset is confirmed.
          </DialogDescription>
        </DialogHeader>

        <div className="hito-row-group">
          {reason ? (
            <div
              className="hito-list-row items-start"
              data-tone={card.customReasonSummary ? "signal" : "destructive"}
            >
              <div>
                <p className="hito-list-row-title">{stateLabel(card.state)}</p>
                <p className="hito-list-row-copy">{reason}</p>
              </div>
            </div>
          ) : null}

          <div className="hito-list-row items-start">
            <div className="grid gap-3 sm:grid-cols-2">
              <PlanPresetFact
                label="Range"
                value={`${card.startDate} to ${card.estimatedEndDate} · ${card.durationWeeks} weeks`}
              />
              <PlanPresetFact label="Weekly rhythm" value={`${card.daysPerWeek} runs/week`} />
              <PlanPresetFact label="Long run" value={card.longRunDay} />
              <PlanPresetFact label="Workout mix" value={card.workoutMixSummary} />
              <PlanPresetFact label="Metric honesty" value={card.metricModeSummary} />
              <PlanPresetFact label="Level fit" value={card.levelFitSummary} />
            </div>
          </div>

          <div className="hito-list-row items-start">
            <div className="grid gap-3">
              <PlanPresetFact label="Why this fits" value={card.whyThisFits} />
              <div>
                <p className="hito-label">Key workouts</p>
                <p className="hito-body-small text-muted-foreground">
                  {card.keyWorkoutTypes.join(", ")}
                </p>
              </div>
              <div>
                <p className="hito-label">Assumptions</p>
                <p className="hito-body-small text-muted-foreground">
                  Preset cards are non-mutating starting shapes. The backend rebuilds and signs the
                  selected preset during review before create is available.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="hito-product-dialog-footer sm:space-x-0">
          <button
            type="button"
            className="hito-button hito-button-secondary hito-button-md"
            onClick={() => onOpenChange(false)}
          >
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PlanPresetReviewScaffold({
  draft,
  canConfirm,
  creatingPlan,
  confirmResult,
  disabled,
  onConfirm,
}: {
  draft: PlanPresetReviewDraftContract;
  canConfirm: boolean;
  creatingPlan: boolean;
  confirmResult: PlanPresetConfirmActionResult | null;
  disabled: boolean;
  onConfirm: () => void;
}) {
  const review = draft.reviewShape;

  return (
    <div className="hito-row-group" data-preset-review="true">
      <div className="hito-list-row items-start">
        <div className="min-w-0">
          <p className="hito-list-row-title">{review.programFamily} review</p>
          <p className="hito-list-row-copy">
            This review is non-mutating. Nothing changes until you confirm this preset.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <span className="hito-status-pill" data-tone="success">
            Ready to create
          </span>
          <button
            type="button"
            className="hito-button hito-button-primary hito-button-sm"
            disabled={!canConfirm || disabled}
            onClick={onConfirm}
          >
            {creatingPlan ? "Creating plan..." : "Create preset plan"}
          </button>
        </div>
      </div>

      {confirmResult?.ok ? (
        <p className="hito-field-success px-4 py-3">
          Preset plan created. Opening your saved plan now.
        </p>
      ) : null}

      <div className="hito-list-row items-start">
        <div className="grid gap-3 sm:grid-cols-2">
          <PlanPresetFact
            label="Range"
            value={`${review.startDate} to ${review.estimatedEndDate} · ${review.durationWeeks} weeks`}
          />
          <PlanPresetFact label="Weekly rhythm" value={review.weeklyRhythmSummary} />
          <PlanPresetFact
            label="Days and rest"
            value={`${review.daysPerWeek} runs/week · ${
              review.restDays.length ? `rest ${review.restDays.join(", ")}` : "flexible rest"
            }`}
          />
          <PlanPresetFact label="Long run" value={review.longRunDay} />
          <PlanPresetFact label="Workout mix" value={review.workoutMixSummary} />
          <PlanPresetFact label="Metric policy" value={review.metricModeSummary} />
        </div>
      </div>

      <div className="hito-list-row items-start">
        <div className="grid gap-3">
          <PlanPresetFact label="Why this fits" value={review.whyThisFits} />
          <PlanPresetFact label="Level fit" value={review.levelFitSummary} />
          <div>
            <p className="hito-label">Key workout types</p>
            <p className="hito-body-small text-muted-foreground">
              {review.keyWorkoutTypes.join(", ")}
            </p>
          </div>
          <div>
            <p className="hito-label">Assumptions</p>
            <ul className="mt-2 grid gap-1">
              {review.safetyAssumptions.map((assumption) => (
                <li key={assumption} className="hito-body-small text-muted-foreground">
                  {assumption}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="hito-list-row items-start">
        <div className="grid gap-3 sm:grid-cols-3">
          <PlanPresetFact label="Rows" value={`${review.rowCounts.calendarRows} calendar rows`} />
          <PlanPresetFact label="Runs" value={`${review.rowCounts.nonRestRows} non-rest rows`} />
          <PlanPresetFact
            label="Source"
            value={`${draft.sourceKind} · persisted ${String(draft.persisted)}`}
          />
        </div>
      </div>
    </div>
  );
}

function PlanPresetFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="hito-label">{label}</p>
      <p className="hito-body-small text-muted-foreground">{value}</p>
    </div>
  );
}

function distanceIdentityLabel(cardId: PlanPresetCardId) {
  switch (cardId) {
    case "10k":
      return "10K";
    case "half_marathon":
      return "21K";
    case "marathon":
      return "42K";
  }
}

function stateLabel(state: PlanPresetCardState) {
  switch (state) {
    case "recommended":
      return "Available";
    case "available":
      return "Available";
    case "needs_more_info":
      return "Needs info";
    case "not_ideal":
      return "Not ideal";
    case "custom_fit":
      return "Custom fit";
    case "unavailable":
      return "Unavailable";
  }
}
