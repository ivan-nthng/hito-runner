import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SelectedRunningPlanPreviewDialog } from "@/components/onboarding/SelectedTenKPlanPreviewDialog";
import type {
  PlanPresetCardId,
  PlanPresetCardState,
  PlanPresetCardViewModel,
} from "@/lib/plan-presets/schema";
import type { PlanPresetCardsActionResult } from "@/lib/plan-preset-actions";
import type {
  RunningPlanConfirmActionResult,
  RunningPlanPreviewActionResult,
} from "@/lib/running-plan-engine-actions";
import { cn } from "@/lib/utils";

export type PlanPresetUiStatus = "idle" | "loading_cards" | "previewing_plan";
type RunningPlanCreateStatus = "idle" | "creating";

interface PlanPresetPanelProps {
  cardsResult: PlanPresetCardsActionResult | null;
  confirmResult: RunningPlanConfirmActionResult | null;
  previewResult: RunningPlanPreviewActionResult | null;
  createStatus: RunningPlanCreateStatus;
  error: string | null;
  status: PlanPresetUiStatus;
  isBusy: boolean;
  isPresetDiscoveryReady: boolean;
  selectedCardId: PlanPresetCardId | null;
  previewOpen: boolean;
  onPreviewOpenChange: (open: boolean) => void;
  onLoadCards: () => void;
  onSelectPlan: (cardId: PlanPresetCardId) => void;
  onRefreshPreview: () => void;
  onCreatePlan: () => void;
}

export function PlanPresetPanel({
  cardsResult,
  confirmResult,
  createStatus,
  error,
  isBusy,
  isPresetDiscoveryReady,
  onLoadCards,
  onCreatePlan,
  onPreviewOpenChange,
  onRefreshPreview,
  onSelectPlan,
  previewOpen,
  previewResult,
  selectedCardId,
  status,
}: PlanPresetPanelProps) {
  const eligibility = cardsResult?.ok ? cardsResult : null;
  const blockedMessage = cardsResult && !cardsResult.ok ? cardsResult.message : null;
  const loadingCards = status === "loading_cards";

  return (
    <section className="hito-plan-preset-stage hito-section-divider pt-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="hito-micro-label" data-tone="signal">
            Plan Presets
          </p>
          <h2 className="hito-panel-title mt-2">Choose a guided starting point.</h2>
          <p className="hito-helper mt-2">
            Pick a starting plan and review it before you create anything.
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
            <p className="hito-list-row-title">Add a few basics to see plan options</p>
            <p className="hito-list-row-copy">
              Age, height, and weight help Hito show better starting plans. Weekly rhythm can stay
              open for now.
            </p>
          </div>
        ) : null}

        {loadingCards && !eligibility ? (
          <div className="hito-surface-wash" data-tone="signal">
            <p className="hito-list-row-title">Loading plan options</p>
            <p className="hito-list-row-copy">Checking which starting plans fit your setup.</p>
          </div>
        ) : null}

        {error || blockedMessage ? (
          <p className="hito-field-error">{error ?? blockedMessage}</p>
        ) : null}

        {eligibility ? (
          <div className="hito-plan-preset-grid" aria-label="Plan preset cards">
            {eligibility.cards.map((card) => (
              <PlanPresetCard
                key={card.cardId}
                card={card}
                selected={selectedCardId === card.cardId}
                disabled={isBusy}
                onSelectPlan={() => onSelectPlan(card.cardId)}
              />
            ))}
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
      />
    </section>
  );
}

function PlanPresetCard({
  card,
  disabled,
  onSelectPlan,
  selected,
}: {
  card: PlanPresetCardViewModel;
  disabled: boolean;
  onSelectPlan: () => void;
  selected: boolean;
}) {
  const canSelectPlan = card.state !== "custom_fit" && card.state !== "unavailable" && !disabled;
  const disabledReason = selectDisabledReason(card);
  const distanceIdentity = distanceIdentityLabel(card.cardId);
  const familyLabel = card.familyLabel ?? card.programFamily;
  const keyWorkoutPreview = card.keyWorkoutTypes.slice(0, 3);

  return (
    <Card
      className={cn("hito-plan-preset-card flex min-w-0 flex-col", !canSelectPlan && "opacity-80")}
      data-preset-card-id={card.cardId}
      data-preset-state={card.state}
      data-selected={selected || undefined}
    >
      <CardHeader className="hito-plan-preset-card-header gap-3">
        <div className="min-w-0">
          <p className="hito-plan-preset-distance" aria-hidden="true">
            {distanceIdentity}
          </p>
          <h3 className="hito-plan-preset-family mt-2">{familyLabel}</h3>
        </div>
        <div className="hito-plan-preset-meta-row">
          <span>Preview plan</span>
          <span>{card.daysPerWeek} days/week</span>
        </div>
        <p className="hito-field-helper">{durationReadback()}</p>
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

        <div className="mt-auto grid gap-2">
          {canSelectPlan ? (
            <button
              type="button"
              className={cn(
                "hito-button hito-button-sm w-full",
                selected ? "hito-button-secondary" : "hito-button-primary",
              )}
              onClick={onSelectPlan}
            >
              {selected ? "Preview selected" : "Select Plan"}
            </button>
          ) : (
            <PlanPresetUnavailableSelectAction reason={disabledReason} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PlanPresetCardStateNote({ card }: { card: PlanPresetCardViewModel }) {
  const message =
    card.postSelectionRefinement?.reason?.message ??
    card.disabledReason?.message ??
    card.customRoutingReason?.message ??
    card.disabledReasonSummary ??
    card.customReasonSummary;

  if (card.state === "recommended" || card.state === "available") {
    return (
      <p className="hito-field-helper">Opens a full preview. Create uses the plan you reviewed.</p>
    );
  }

  if (!message) {
    return null;
  }

  return (
    <p className="hito-field-helper" data-preset-card-state={card.state}>
      <span className="font-semibold text-foreground/85">{stateLabel(card.state)}.</span> {message}
    </p>
  );
}

function PlanPresetUnavailableSelectAction({ reason }: { reason: string }) {
  return (
    <TooltipProvider delayDuration={180}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="hito-button hito-button-sm hito-button-primary hito-plan-preset-disabled-cta-trigger"
            aria-disabled="true"
            aria-label={`Select Plan unavailable. ${reason}`}
          >
            Select Plan
          </button>
        </TooltipTrigger>
        <TooltipContent className="hito-tooltip max-w-72" sideOffset={8}>
          <span className="hito-tooltip-meta block">{reason}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function selectDisabledReason(card: PlanPresetCardViewModel) {
  return (
    card.disabledReason?.message ??
    card.customRoutingReason?.message ??
    card.disabledReasonSummary ??
    card.customReasonSummary ??
    "This option is not available for this setup yet."
  );
}

function durationReadback() {
  return "Open the preview to see the full plan and details.";
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
      return "Not available in Quick setup";
    case "unavailable":
      return "Unavailable";
  }
}
