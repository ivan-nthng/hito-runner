import { TrainingPreferenceFields } from "@/components/onboarding/TrainingPreferenceFields";
import type { WeekdayName } from "@/components/onboarding/onboarding-form-model";
import { Icon } from "@/components/ui/icon";
import type { ActivePlanScheduleEditPreview } from "@/lib/active-plan-schedule-edit-preview";
import { formatDate } from "@/lib/training";

export type PlanSchedulePreviewStatus = "idle" | "previewing";
export type PlanScheduleApplyStatus = "idle" | "applying";

type ScheduleReflowPreview = Extract<
  ActivePlanScheduleEditPreview,
  { ok: true; mode: "schedule_reflow" }
>;
type ScheduleRegenerationPreview = Extract<
  ActivePlanScheduleEditPreview,
  { ok: true; mode: "requires_regeneration" }
>;

export interface PlanScheduleEditSummary {
  fixedRestDays: WeekdayName[];
  runningDaysPerWeek: number;
  preferredLongRunDay: WeekdayName | null;
  workoutCount: number;
}

export function PlanScheduleEditPanel({
  available,
  defaultOpen = false,
  fixedRestDays,
  restDaysAnswered,
  maxRunningDaysPerWeek,
  preferredLongRunDay,
  previewStatus,
  applyStatus,
  result,
  error,
  staleMessage,
  decisionMessage,
  summary,
  isBusy,
  onFixedRestDaysChange,
  onRestDaysAnsweredChange,
  onMaxRunningDaysPerWeekChange,
  onPreferredLongRunDayChange,
  onReview,
  onApply,
  onReviewAgain,
}: {
  available: boolean;
  defaultOpen?: boolean;
  fixedRestDays: WeekdayName[];
  restDaysAnswered: boolean;
  maxRunningDaysPerWeek: string;
  preferredLongRunDay: WeekdayName | "";
  previewStatus: PlanSchedulePreviewStatus;
  applyStatus: PlanScheduleApplyStatus;
  result: ActivePlanScheduleEditPreview | null;
  error: string | null;
  staleMessage: string | null;
  decisionMessage: string | null;
  summary: PlanScheduleEditSummary;
  isBusy: boolean;
  onFixedRestDaysChange: (value: WeekdayName[]) => void;
  onRestDaysAnsweredChange: (value: boolean) => void;
  onMaxRunningDaysPerWeekChange: (value: string) => void;
  onPreferredLongRunDayChange: (value: WeekdayName | "") => void;
  onReview: () => void;
  onApply: () => void;
  onReviewAgain: () => void;
}) {
  if (!available) {
    return null;
  }

  const canReview =
    restDaysAnswered && maxRunningDaysPerWeek.trim().length > 0 && previewStatus !== "previewing";
  const reflowResult = result?.ok && result.mode === "schedule_reflow" ? result : null;
  const regenerationResult = result?.ok && result.mode === "requires_regeneration" ? result : null;

  return (
    <details
      className="hito-disclosure hito-plan-schedule-edit"
      open={defaultOpen ? true : undefined}
    >
      <summary className="hito-disclosure-summary">
        <span>Edit schedule</span>
        <Icon name="chevron-down" className="hito-disclosure-chevron" />
      </summary>
      <div className="hito-disclosure-body">
        <div className="grid gap-4">
          <div className="flex items-start gap-3">
            <Icon name="calendar-clock" size="sm" className="mt-0.5 text-signal" />
            <div className="min-w-0">
              <p className="hito-list-row-title">
                Move future workout dates without rewriting them.
              </p>
              <p className="hito-body-small mt-1 max-w-xl">
                Hito previews the saved schedule first. Workout content, targets, rich identities,
                logs, and protected history stay backend-owned.
              </p>
            </div>
          </div>

          <div className="hito-row-group">
            <div className="hito-list-row items-start">
              <div>
                <p className="hito-list-row-title">Current active-plan rhythm</p>
                <p className="hito-list-row-copy">
                  {summary.runningDaysPerWeek} running day
                  {summary.runningDaysPerWeek === 1 ? "" : "s"} per week across{" "}
                  {summary.workoutCount} planned workout
                  {summary.workoutCount === 1 ? "" : "s"}.
                </p>
              </div>
              <span className="hito-status-pill" data-tone="neutral">
                Saved
              </span>
            </div>
            <div className="hito-list-row items-start">
              <div>
                <p className="hito-list-row-title">Selected edit defaults</p>
                <p className="hito-list-row-copy">
                  Fixed rest days: {formatWeekdays(summary.fixedRestDays)}. Long run:{" "}
                  {summary.preferredLongRunDay ?? "backend fallback"}.
                </p>
              </div>
            </div>
          </div>

          <TrainingPreferenceFields
            fixedRestDays={fixedRestDays}
            onFixedRestDaysChange={(value) => {
              onFixedRestDaysChange(value);
              onReviewAgain();
            }}
            restDaysAnswered={restDaysAnswered}
            onRestDaysAnsweredChange={(value) => {
              onRestDaysAnsweredChange(value);
              onReviewAgain();
            }}
            maxRunningDaysPerWeek={maxRunningDaysPerWeek}
            onMaxRunningDaysPerWeekChange={(value) => {
              onMaxRunningDaysPerWeekChange(value);
              onReviewAgain();
            }}
            preferredLongRunDay={preferredLongRunDay}
            onPreferredLongRunDayChange={(value) => {
              onPreferredLongRunDayChange(value);
              onReviewAgain();
            }}
            preferredLongRunMode="optional-any"
            showFitnessBenchmark={false}
            fixedRestDaysHelper="Choose rest days for this active-plan edit only. This does not update profile defaults."
            maxRunningDaysHelper="Keep the same weekly frequency for a date-only reflow. A frequency change needs a reviewed plan change from Add plan."
            preferredLongRunHelper="Optional. Rest days are unavailable; leaving this empty lets the backend choose the safe fallback."
          />

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={isBusy || !canReview}
              onClick={onReview}
              className="hito-button hito-button-secondary hito-button-md"
            >
              <Icon name="calendar-clock" size="sm" />
              {previewStatus === "previewing" ? "Reviewing..." : "Review schedule changes"}
            </button>
            <span className="hito-field-helper">
              Nothing changes until you apply a reviewed schedule preview.
            </span>
          </div>

          {error ? <p className="hito-field-error">{error}</p> : null}
          {decisionMessage ? <p className="hito-field-success">{decisionMessage}</p> : null}

          {reflowResult ? (
            <ScheduleReflowReview
              result={reflowResult}
              applyStatus={applyStatus}
              staleMessage={staleMessage}
              isBusy={isBusy}
              onApply={onApply}
              onReviewAgain={onReview}
            />
          ) : null}

          {regenerationResult ? <RequiresRegenerationReview result={regenerationResult} /> : null}
        </div>
      </div>
    </details>
  );
}

function ScheduleReflowReview({
  result,
  applyStatus,
  staleMessage,
  isBusy,
  onApply,
  onReviewAgain,
}: {
  result: ScheduleReflowPreview;
  applyStatus: PlanScheduleApplyStatus;
  staleMessage: string | null;
  isBusy: boolean;
  onApply: () => void;
  onReviewAgain: () => void;
}) {
  const isApplying = applyStatus === "applying";

  return (
    <div className="hito-row-group">
      <div className="hito-list-row items-start">
        <div>
          <p className="hito-list-row-title">Schedule preview only</p>
          <p className="hito-list-row-copy">{result.review.summary}</p>
        </div>
        <span className="hito-status-pill" data-tone="signal">
          Review
        </span>
      </div>

      <div className="hito-list-row items-start">
        <div>
          <p className="hito-list-row-title">Affected range</p>
          <p className="hito-list-row-copy">
            {formatDateRange(result.changes.affectedDateRange)} from the first mutable workout.
          </p>
        </div>
        <span className="hito-status-pill" data-tone="success">
          Future only
        </span>
      </div>

      <div className="hito-metric-row">
        <ScheduleMetric label="Moved workouts" value={String(result.changes.movedWorkoutCount)} />
        <ScheduleMetric
          label="Preserved/protected"
          value={String(result.changes.preservedWorkoutCount)}
        />
        <ScheduleMetric label="Future movable" value={String(result.movableFutureWorkoutCount)} />
      </div>

      <div className="hito-list-row items-start">
        <div>
          <p className="hito-list-row-title">Requested rhythm</p>
          <p className="hito-list-row-copy">
            Fixed rest days: {formatWeekdays(result.changes.fixedRestDays)}. Effective long run:{" "}
            {result.changes.effectiveLongRunDay ?? "backend fallback"}.
          </p>
        </div>
      </div>

      <div className="hito-list-row items-start">
        <div className="min-w-0">
          <p className="hito-list-row-title">Example date moves</p>
          {result.proposedDateChanges.length > 0 ? (
            <ul className="hito-body-small mt-2 grid gap-1.5">
              {result.proposedDateChanges.slice(0, 5).map((change) => (
                <li key={`${change.workoutId}-${change.fromDate}-${change.toDate}`}>
                  {change.title}: {formatShortDate(change.fromDate)} ({change.fromWeekday}){" -> "}
                  {formatShortDate(change.toDate)} ({change.toWeekday})
                </li>
              ))}
            </ul>
          ) : (
            <p className="hito-list-row-copy">
              No date moves are needed for these schedule preferences.
            </p>
          )}
        </div>
      </div>

      {result.review.bullets.length > 0 ? (
        <div className="hito-list-row items-start">
          <div className="min-w-0">
            <p className="hito-list-row-title">Review notes</p>
            <ul className="hito-body-small mt-2 grid gap-1.5">
              {result.review.bullets.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {result.warnings.length > 0 ? (
        <div className="hito-list-row items-start">
          <div className="min-w-0">
            <p className="hito-list-row-title">Warnings</p>
            <ul className="hito-body-small mt-2 grid gap-1.5">
              {result.warnings.map((warning) => (
                <li key={warning}>- {warning}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      <div className="hito-list-row items-start">
        <div>
          <p className="hito-list-row-title">Nothing has changed yet</p>
          <p className="hito-list-row-copy">
            Hito will recheck this token before applying. If the active plan changed, review again.
          </p>
        </div>
        <span className="hito-status-pill" data-tone={isApplying ? "signal" : "warning"}>
          {isApplying ? "Applying" : "Not applied"}
        </span>
      </div>

      {staleMessage ? (
        <div className="hito-list-row items-start">
          <div>
            <p className="hito-list-row-title">Preview no longer current</p>
            <p className="hito-list-row-copy">{staleMessage}</p>
          </div>
          <button
            type="button"
            className="hito-button hito-button-secondary hito-button-sm"
            disabled={isBusy}
            onClick={onReviewAgain}
          >
            <Icon name="refresh" size="sm" />
            Review again
          </button>
        </div>
      ) : null}

      <div className="hito-list-row items-start">
        <div>
          <p className="hito-list-row-title">Apply reviewed schedule</p>
          <p className="hito-list-row-copy">
            This applies only the reviewed date reflow. It does not regenerate workouts or update
            Settings.
          </p>
        </div>
        <button
          type="button"
          className="hito-button hito-button-primary hito-button-sm"
          disabled={isBusy || Boolean(staleMessage)}
          onClick={onApply}
        >
          {isApplying ? "Applying..." : "Apply schedule changes"}
        </button>
      </div>
    </div>
  );
}

function RequiresRegenerationReview({ result }: { result: ScheduleRegenerationPreview }) {
  return (
    <div className="hito-row-group">
      <div className="hito-list-row items-start">
        <div>
          <p className="hito-list-row-title">Reviewed plan change needed</p>
          <p className="hito-list-row-copy">{result.message}</p>
        </div>
        <span className="hito-status-pill" data-tone="warning">
          Add plan
        </span>
      </div>

      <div className="hito-list-row items-start">
        <div>
          <p className="hito-list-row-title">Requested rhythm</p>
          <p className="hito-list-row-copy">
            Fixed rest days: {formatWeekdays(result.changes.fixedRestDays)}. Effective long run:{" "}
            {result.changes.effectiveLongRunDay ?? "backend fallback"}. Affected range:{" "}
            {formatDateRange(result.changes.affectedDateRange)}.
          </p>
        </div>
      </div>

      <div className="hito-list-row items-start">
        <div className="min-w-0">
          <p className="hito-list-row-title">Suggested Add plan context</p>
          <p className="hito-list-row-copy">{result.suggestedRefreshPrompt}</p>
        </div>
      </div>

      <div className="hito-list-row items-start">
        <div>
          <p className="hito-list-row-title">No schedule applied here</p>
          <p className="hito-list-row-copy">
            Frequency or fit changes cannot be applied from Edit schedule. Start a reviewed plan
            change from Add plan instead.
          </p>
        </div>
      </div>
    </div>
  );
}

function ScheduleMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="hito-metric">
      <p className="hito-metric-label">{label}</p>
      <p className="hito-metric-value">{value}</p>
    </div>
  );
}

function formatWeekdays(days: WeekdayName[]) {
  return days.length > 0 ? days.join(", ") : "none";
}

function formatDateRange(range: { startDate: string; endDate: string } | null) {
  if (!range) {
    return "No mutable range";
  }

  return `${formatShortDate(range.startDate)} -> ${formatShortDate(range.endDate)}`;
}

function formatShortDate(date: string) {
  return formatDate(date, { month: "short", day: "numeric" });
}
