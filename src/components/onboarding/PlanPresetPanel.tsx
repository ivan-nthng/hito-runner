import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  PlanPresetCardId,
  PlanPresetCardState,
  PlanPresetCardViewModel,
  PlanPresetReviewDraftContract,
} from "@/lib/plan-presets/schema";
import type {
  PlanPresetCardsActionResult,
  PlanPresetConfirmActionResult,
  PlanPresetReviewDraftActionResult,
} from "@/lib/training-api";
import { cn } from "@/lib/utils";

export type PlanPresetUiStatus = "idle" | "loading_cards" | "reviewing_draft" | "creating_plan";

interface PlanPresetPanelProps {
  cardsResult: PlanPresetCardsActionResult | null;
  reviewResult: PlanPresetReviewDraftActionResult | null;
  confirmResult: PlanPresetConfirmActionResult | null;
  error: string | null;
  status: PlanPresetUiStatus;
  isBusy: boolean;
  isConstructorReady: boolean;
  reviewedCardId: PlanPresetCardId | null;
  onLoadCards: () => void;
  onReviewCard: (cardId: PlanPresetCardId) => void;
  onConfirmReview: () => void;
  onUseAdvancedCustom: () => void;
}

export function PlanPresetPanel({
  cardsResult,
  reviewResult,
  confirmResult,
  error,
  status,
  isBusy,
  isConstructorReady,
  reviewedCardId,
  onLoadCards,
  onReviewCard,
  onConfirmReview,
  onUseAdvancedCustom,
}: PlanPresetPanelProps) {
  const eligibility = cardsResult?.ok ? cardsResult : null;
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
    <section className="hito-section-divider grid gap-y-4 gap-x-0 pt-6 md:grid-cols-[220px_minmax(0,1fr)] md:gap-x-12 lg:gap-x-16">
      <div>
        <p className="hito-micro-label">07</p>
        <h2 className="hito-panel-title mt-2">Choose a plan preset</h2>
        <p className="hito-helper mt-2">
          Presets are backend-owned starting shapes. Review one before any future create step.
        </p>
      </div>

      <div className="grid gap-4">
        <div className="hito-row-group">
          <div className="hito-list-row items-start">
            <div className="min-w-0">
              <p className="hito-list-row-title">Preset cards</p>
              <p className="hito-list-row-copy">
                Hito asks the backend for eligible cards from your setup answers. Nothing is saved
                or generated with AI here.
              </p>
            </div>
            <button
              type="button"
              className="hito-button hito-button-primary hito-button-sm shrink-0"
              disabled={!isConstructorReady || isBusy}
              onClick={onLoadCards}
            >
              {loadingCards ? "Loading presets..." : "Show presets"}
            </button>
          </div>

          <div className="hito-list-row items-start">
            <div className="min-w-0">
              <p className="hito-list-row-title">Advanced custom program</p>
              <p className="hito-list-row-copy">
                Use this for target date/time, injury or pain context, unusual constraints, uncommon
                goals, or detailed comments.
              </p>
            </div>
            <button
              type="button"
              className="hito-button hito-button-secondary hito-button-sm shrink-0"
              disabled={!isConstructorReady || isBusy}
              onClick={onUseAdvancedCustom}
            >
              Review custom
            </button>
          </div>
        </div>

        {!isConstructorReady ? (
          <p className="hito-field-helper">
            Complete the profile, week, workout guidance, and goal fields before requesting preset
            cards.
          </p>
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
          <div className="grid gap-3 lg:grid-cols-3" aria-label="Plan preset cards">
            {eligibility.cards.map((card) => (
              <PlanPresetCard
                key={card.cardId}
                card={card}
                recommended={eligibility.recommendedCardId === card.cardId}
                disabled={isBusy || reviewingDraft}
                onReview={() => onReviewCard(card.cardId)}
              />
            ))}
          </div>
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
    </section>
  );
}

function PlanPresetCard({
  card,
  recommended,
  disabled,
  onReview,
}: {
  card: PlanPresetCardViewModel;
  recommended: boolean;
  disabled: boolean;
  onReview: () => void;
}) {
  const canReview = card.state === "recommended" || card.state === "available";
  const summaryReason = card.disabledReasonSummary ?? card.customReasonSummary;

  return (
    <Card
      className={cn(
        "flex min-w-0 flex-col border-hairline bg-surface/70",
        recommended && "border-signal/45 bg-signal/5",
        !canReview && "opacity-80",
      )}
      data-preset-card-id={card.cardId}
      data-preset-state={card.state}
    >
      <CardHeader className="gap-3">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle>{card.label}</CardTitle>
            <CardDescription>
              {card.familyLabel ? `${card.familyLabel} · ` : ""}
              {card.durationWeeks} weeks
            </CardDescription>
          </div>
          <span className="hito-status-pill" data-tone={stateTone(card.state)}>
            {stateLabel(card.state)}
          </span>
        </div>
        <p className="hito-body-small text-muted-foreground">
          Starts {card.startDate} · Ends {card.estimatedEndDate}
        </p>
      </CardHeader>

      <CardContent className="grid flex-1 gap-4">
        <PlanPresetFact
          label="Rhythm"
          value={`${card.daysPerWeek} runs/week · long run ${card.longRunDay}`}
        />
        <PlanPresetFact label="Program" value={card.programFamily} />
        <PlanPresetFact label="Workout mix" value={card.workoutMixSummary} />
        <PlanPresetFact label="Metric honesty" value={card.metricModeSummary} />
        <PlanPresetFact label="Fit" value={card.whyThisFits} />
        <PlanPresetFact label="Level" value={card.levelFitSummary} />

        {summaryReason ? (
          <div
            className="hito-surface-wash"
            data-tone={card.customReasonSummary ? "signal" : "destructive"}
          >
            <p className="hito-list-row-copy">{summaryReason}</p>
          </div>
        ) : null}

        <div>
          <p className="hito-label">Key workouts</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {card.keyWorkoutTypes.map((type) => (
              <span key={type} className="hito-status-pill" data-tone="muted">
                {type}
              </span>
            ))}
          </div>
        </div>

        <button
          type="button"
          disabled={!canReview || disabled}
          className={cn(
            "hito-button hito-button-sm mt-auto w-full",
            canReview ? "hito-button-primary" : "hito-button-secondary",
          )}
          onClick={onReview}
        >
          {canReview ? "Review preset" : "Use custom path"}
        </button>
      </CardContent>
    </Card>
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

function stateLabel(state: PlanPresetCardState) {
  switch (state) {
    case "recommended":
      return "Recommended";
    case "available":
      return "Available";
    case "needs_more_info":
      return "Needs info";
    case "custom_fit":
      return "Custom fit";
    case "unavailable":
      return "Unavailable";
  }
}

function stateTone(state: PlanPresetCardState) {
  switch (state) {
    case "recommended":
      return "success";
    case "available":
      return "signal";
    case "needs_more_info":
      return "warning";
    case "custom_fit":
      return "signal";
    case "unavailable":
      return "muted";
  }
}
