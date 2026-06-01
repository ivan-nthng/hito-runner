import {
  useState,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type RefObject,
  type SetStateAction,
} from "react";
import { EditableValueChip } from "@/components/ui/editable-value-chip";
import {
  HitoDateField,
  HitoEditableDateChip,
  HitoMaskedTimeField,
} from "@/components/ui/hito-date-time-input";
import { Icon } from "@/components/ui/icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { TrainingPreferenceFields } from "./TrainingPreferenceFields";
import {
  GUIDANCE_PREFERENCE_OPTIONS,
  GOAL_DISTANCE_OPTIONS,
  GOAL_STYLE_OPTIONS,
  ONBOARDING_TEXTAREA_CLASS,
  STRENGTH_OPTIONS,
  TERRAIN_OPTIONS,
  WATCH_ACCESS_OPTIONS,
  formatTerrainFocus,
  type GuidancePreference,
  type GoalDistance,
  type GoalStyle,
  type StrengthPreference,
  type StructuredConstructorState,
  type TerrainFocus,
  type WatchAccess,
  type WeekdayName,
} from "./onboarding-form-model";
import type { StructuredFirstPlanDraftResult } from "@/lib/training-api";
import type { RunnerFitnessLevel } from "@/lib/runner-training-preferences";

type ConstructorStatus = "idle" | "reviewing" | "creating" | "finishing";
type ProfileBasicEditableKey = "age" | "heightCm" | "weightKg";
type StructuredDraftReady = Extract<
  StructuredFirstPlanDraftResult,
  { ok: true; status: "draft_ready" }
>;
type StructuredCorrectionRequired = Extract<
  StructuredFirstPlanDraftResult,
  { ok: true; status: "correction_required" }
>;

interface StructuredPlanConstructorProps {
  formRef: RefObject<HTMLFormElement | null>;
  state: StructuredConstructorState;
  setState: {
    setAge: (value: string) => void;
    setWeightKg: (value: string) => void;
    setHeightCm: (value: string) => void;
    setFitnessLevel: (value: RunnerFitnessLevel) => void;
    setRecent5kTime: (value: string) => void;
    setRecent5kPace: (value: string) => void;
    setFixedRestDays: Dispatch<SetStateAction<WeekdayName[]>>;
    setRestDaysAnswered: (value: boolean) => void;
    setMaxRunningDaysPerWeek: (value: string) => void;
    setPreferredLongRunDay: (value: WeekdayName | "") => void;
    setGoalDistance: (value: GoalDistance) => void;
    setGoalStyle: (value: GoalStyle) => void;
    setTargetTime: (value: string) => void;
    setStartDate: (value: string) => void;
    setTargetDate: (value: string) => void;
    setTerrainFocus: (value: TerrainFocus) => void;
    setWatchAccess: (value: WatchAccess) => void;
    setGuidancePreference: (value: GuidancePreference) => void;
    setStrengthPreference: (value: StrengthPreference) => void;
    setComment: (value: string) => void;
  };
  constructorStatus: ConstructorStatus;
  draftResult: StructuredFirstPlanDraftResult | null;
  constructorError: string | null;
  isBusy: boolean;
  isConstructorReady: boolean;
  onSubmit: () => void;
  onConfirmDraft: () => void;
  onBackToEdit: () => void;
}

export function StructuredPlanConstructor({
  formRef,
  state,
  setState,
  constructorStatus,
  draftResult,
  constructorError,
  isBusy,
  isConstructorReady,
  onSubmit,
  onConfirmDraft,
  onBackToEdit,
}: StructuredPlanConstructorProps) {
  const showsTargetFields = state.goalStyle === "target_time";
  const showsTerrainSelector =
    state.goalDistance === "marathon" || state.goalDistance === "ultra_marathon";
  const impliedMountainTerrain = state.goalDistance === "mountain_running";
  const [activeEditableKey, setActiveEditableKey] = useState<ProfileBasicEditableKey | null>(null);
  const isDraftReady = draftResult?.ok === true && draftResult.status === "draft_ready";
  const isCorrectionRequired =
    draftResult?.ok === true && draftResult.status === "correction_required";

  return (
    <form
      ref={formRef}
      noValidate
      className="mt-8 grid gap-8 pb-28"
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!isConstructorReady || isBusy || isDraftReady) {
          return;
        }

        onSubmit();
      }}
    >
      <>
        <ConstructorSection
          eyebrow="01"
          title="About you"
          body="Add the basics Hito needs to size the plan."
        >
          <div className="hito-editable-value-chip-group">
            <EditableValueChip
              fieldKey="age"
              label="Age"
              value={state.age}
              setValue={setState.setAge}
              activeEditableKey={activeEditableKey}
              setActiveEditableKey={setActiveEditableKey}
              placeholder="34"
              min={13}
              max={100}
              step={1}
              inputMode="numeric"
            />
            <EditableValueChip
              fieldKey="heightCm"
              label="Height"
              value={state.heightCm}
              setValue={setState.setHeightCm}
              activeEditableKey={activeEditableKey}
              setActiveEditableKey={setActiveEditableKey}
              placeholder="178"
              min={120}
              max={230}
              step={1}
              inputMode="numeric"
            />
            <EditableValueChip
              fieldKey="weightKg"
              label="Weight"
              value={state.weightKg}
              setValue={setState.setWeightKg}
              activeEditableKey={activeEditableKey}
              setActiveEditableKey={setActiveEditableKey}
              placeholder="72"
              min={30}
              max={250}
              step={0.5}
              inputMode="decimal"
              unit="kg"
            />
          </div>
        </ConstructorSection>

        <ConstructorSection
          eyebrow="02"
          title="Your week"
          body="Mark the days you want to keep as rest days."
        >
          <TrainingPreferenceFields
            fixedRestDays={state.fixedRestDays}
            onFixedRestDaysChange={setState.setFixedRestDays}
            restDaysAnswered={state.restDaysAnswered}
            onRestDaysAnsweredChange={setState.setRestDaysAnswered}
            maxRunningDaysPerWeek={state.maxRunningDaysPerWeek}
            onMaxRunningDaysPerWeekChange={setState.setMaxRunningDaysPerWeek}
            preferredLongRunDay={state.preferredLongRunDay}
            onPreferredLongRunDayChange={setState.setPreferredLongRunDay}
            preferredLongRunMode="optional-any"
            showFitnessBenchmark
            fitnessLevel={state.fitnessLevel}
            onFitnessLevelChange={(value) => {
              setState.setFitnessLevel(value);
              if (value !== "custom") {
                setState.setRecent5kTime("");
                setState.setRecent5kPace("");
              }
            }}
            recent5kTime={state.recent5kTime}
            onRecent5kTimeChange={setState.setRecent5kTime}
          />
        </ConstructorSection>

        <ConstructorSection
          eyebrow="03"
          title="How you'll follow workouts"
          body="Choose how Hito should phrase workout guidance."
        >
          <Field label="Target tools">
            <div className="grid gap-2">
              {WATCH_ACCESS_OPTIONS.map((option) => (
                <OptionRow
                  key={option.value}
                  active={state.watchAccess === option.value}
                  label={option.label}
                  copy={option.copy}
                  onClick={() => setState.setWatchAccess(option.value)}
                />
              ))}
            </div>
          </Field>

          <Field label="Guidance style">
            <OptionGrid>
              {GUIDANCE_PREFERENCE_OPTIONS.map((option) => (
                <OptionButton
                  key={option.value}
                  active={state.guidancePreference === option.value}
                  label={option.label}
                  copy={option.copy}
                  onClick={() => setState.setGuidancePreference(option.value)}
                />
              ))}
            </OptionGrid>
          </Field>
        </ConstructorSection>

        <ConstructorSection
          eyebrow="04"
          title="What you're training for"
          body="Pick the distance and how hard you want the plan to lean."
        >
          <Field label="Goal distance">
            <OptionGrid>
              {GOAL_DISTANCE_OPTIONS.map((option) => (
                <OptionButton
                  key={option.value}
                  active={state.goalDistance === option.value}
                  label={option.label}
                  onClick={() => setState.setGoalDistance(option.value)}
                />
              ))}
            </OptionGrid>
          </Field>

          <Field label="Goal style">
            <OptionGrid>
              {GOAL_STYLE_OPTIONS.map((option) => (
                <OptionButton
                  key={option.value}
                  active={state.goalStyle === option.value}
                  label={option.label}
                  onClick={() => setState.setGoalStyle(option.value)}
                />
              ))}
            </OptionGrid>
          </Field>

          <HitoEditableDateChip
            label="Plan Start Date"
            value={state.startDate}
            onChange={setState.setStartDate}
            helper="Optional. Leave unset to let Hito choose the default start date."
          />
          <input type="hidden" name="schedule.startDate" value={state.startDate} />

          {showsTargetFields ? (
            <div className="grid gap-4 md:grid-cols-2">
              <HitoMaskedTimeField
                id="structured-plan-target-time"
                label="Target time"
                value={state.targetTime}
                onChange={setState.setTargetTime}
                helper="Required. Type digits continuously: 35000 becomes 3:50:00."
                error={!state.targetTime.trim() ? "Target time is required." : null}
              />
              <HitoDateField
                id="structured-plan-target-date"
                name="schedule.targetDate"
                label="Target date"
                value={state.targetDate}
                onChange={setState.setTargetDate}
                helper="Optional. Pick from calendar or type YYYY-MM-DD."
              />
            </div>
          ) : (
            <p className="hito-field-helper">
              Hito will estimate a realistic direction from your benchmark, availability, and goal
              style. No target time is needed for this mode.
            </p>
          )}

          {showsTerrainSelector && (
            <Field label="Terrain focus">
              <OptionGrid>
                {TERRAIN_OPTIONS.map((option) => (
                  <OptionButton
                    key={option.value}
                    active={state.terrainFocus === option.value}
                    label={option.label}
                    copy={option.copy}
                    onClick={() => setState.setTerrainFocus(option.value)}
                  />
                ))}
              </OptionGrid>
            </Field>
          )}

          {impliedMountainTerrain && (
            <div className="hito-row-group">
              <div className="hito-list-row">
                <div>
                  <p className="hito-list-row-title">Mountain terrain</p>
                  <p className="hito-list-row-copy">
                    Mountain running uses mountain terrain context automatically.
                  </p>
                </div>
                <span className="hito-status-pill">Implied</span>
              </div>
            </div>
          )}
        </ConstructorSection>

        <ConstructorSection
          eyebrow="05"
          title="Extras"
          body="Add light mobility or strength support if you want it."
        >
          <div className="grid gap-2">
            {STRENGTH_OPTIONS.map((option) => (
              <OptionRow
                key={option.value}
                active={state.strengthPreference === option.value}
                label={option.label}
                copy={option.copy}
                onClick={() => setState.setStrengthPreference(option.value)}
              />
            ))}
          </div>
        </ConstructorSection>

        <ConstructorSection
          eyebrow="06"
          title="Optional comment"
          body="Add anything small Hito should keep in mind."
        >
          <label className="grid gap-2">
            <span className="hito-form-label">Comment</span>
            <textarea
              rows={5}
              value={state.comment}
              onChange={(event) => setState.setComment(event.target.value)}
              placeholder="Right knee discomfort, avoid intensity, prefer mornings, conservative plan..."
              className={ONBOARDING_TEXTAREA_CLASS}
            />
          </label>
        </ConstructorSection>

        {isCorrectionRequired ? <StructuredCorrectionNotice result={draftResult} /> : null}
        {draftResult && !draftResult.ok ? <StructuredReviewError result={draftResult} /> : null}

        <div className="hito-onboarding-submit-footer">
          <div className="hito-onboarding-submit-footer-inner">
            <div className="min-w-0">
              {constructorError ? <p className="hito-field-error">{constructorError}</p> : null}
              {constructorStatus === "finishing" ? (
                <p className="hito-field-success">Your plan is ready. Opening it now...</p>
              ) : null}
              {!constructorError && constructorStatus !== "finishing" ? (
                <p className="hito-field-helper max-w-xl">
                  Review your plan first. Nothing is created until you confirm it.
                </p>
              ) : null}
            </div>
            <button
              type="submit"
              disabled={isBusy || !isConstructorReady}
              className="hito-button hito-button-primary hito-button-lg shrink-0"
            >
              {constructorStatus === "reviewing"
                ? "Reviewing plan..."
                : constructorStatus === "finishing"
                  ? "Opening your plan..."
                  : "Review plan"}
            </button>
          </div>
        </div>
        {isDraftReady ? (
          <StructuredDraftReadyReviewModal
            result={draftResult}
            state={state}
            status={constructorStatus}
            isBusy={isBusy}
            onConfirmDraft={onConfirmDraft}
            onCancel={onBackToEdit}
          />
        ) : null}
      </>
    </form>
  );
}

export function ConstructorSection({
  eyebrow,
  title,
  body,
  children,
}: {
  eyebrow: string;
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <section className="hito-section-divider grid gap-y-4 gap-x-0 pt-6 md:grid-cols-[220px_minmax(0,1fr)] md:gap-x-12 lg:gap-x-16">
      <div>
        <p className="hito-micro-label">{eyebrow}</p>
        <h2 className="hito-panel-title mt-2">{title}</h2>
        <p className="hito-helper mt-2">{body}</p>
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

export function Field({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <span className="hito-form-label">{label}</span>
      {children}
      {helper ? <span className="hito-field-helper">{helper}</span> : null}
    </div>
  );
}

function StructuredDraftReadyReviewModal({
  result,
  state,
  status,
  isBusy,
  onConfirmDraft,
  onCancel,
}: {
  result: StructuredDraftReady;
  state: StructuredConstructorState;
  status: ConstructorStatus;
  isBusy: boolean;
  onConfirmDraft: () => void;
  onCancel: () => void;
}) {
  const review = result.review;
  const summary = result.draft.summary;
  const longHorizonReviewCopy = getLongHorizonReviewCopy(result);
  const durationLabel = summary.targetDate ? "Plan range" : "Plan length";
  const reviewPlanName = getStructuredReviewPlanName(state);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isBusy) {
          onCancel();
        }
      }}
    >
      <DialogContent
        className="hito-product-dialog max-h-[88vh] max-w-3xl overflow-y-auto"
        overlayClassName="hito-product-dialog-overlay"
      >
        <DialogHeader className="hito-product-dialog-header">
          <DialogTitle className="hito-modal-title">Review your plan</DialogTitle>
          <DialogDescription className="hito-body max-w-2xl">
            Nothing has been created yet. Review the full plan below, then confirm to create it.
          </DialogDescription>
        </DialogHeader>

        <div className="hito-row-group">
          <div className="hito-list-row items-start">
            <div className="min-w-0">
              <p className="hito-list-row-title">Plan ready</p>
              <p className="hito-list-row-copy">{longHorizonReviewCopy}</p>
            </div>
            <span className="hito-status-pill" data-tone="success">
              Review
            </span>
          </div>

          <div className="hito-list-row items-start">
            <div className="grid gap-3">
              <p className="hito-form-label">What Hito understood</p>
              <StructuredReviewLine label="Runner" value={review.runnerUnderstanding.profile} />
              <StructuredReviewLine
                label="Benchmark"
                value={review.runnerUnderstanding.benchmark}
              />
              <StructuredReviewLine label="Goal" value={review.runnerUnderstanding.goal} />
              <StructuredReviewLine
                label="Availability"
                value={review.runnerUnderstanding.availability}
              />
              <StructuredReviewLine
                label="Workout guidance"
                value={review.runnerUnderstanding.execution}
              />
            </div>
          </div>

          <div className="hito-list-row items-start">
            <div className="grid gap-3">
              <p className="hito-form-label">Plan setup summary</p>
              <StructuredReviewLine label="Plan" value={reviewPlanName} />
              <StructuredReviewLine label={durationLabel} value={review.planShape.durationLabel} />
              <StructuredReviewLine
                label="Days per week"
                value={`${review.planShape.runningDaysPerWeek}`}
              />
              <StructuredReviewLine
                label="Rest days"
                value={
                  review.planShape.fixedRestDays.length
                    ? review.planShape.fixedRestDays.join(", ")
                    : "No fixed rest days"
                }
              />
              <StructuredReviewLine
                label="Workouts"
                value={`${review.planShape.workoutCount} planned workouts`}
              />
              <StructuredReviewLine
                label="Long run"
                value={review.planShape.longRunDay ?? "No fixed long-run day"}
              />
              <StructuredReviewLine label="Quality rhythm" value={review.planShape.qualityRhythm} />
              <StructuredReviewLine label="Metric policy" value={review.planShape.metricPolicy} />
              <StructuredReviewLine
                label="Terrain"
                value={formatTerrainFocus(review.planShape.terrainFocus)}
              />
              {review.planShape.activityMix.length > 0 ? (
                <div>
                  <p className="hito-label">Workout mix</p>
                  <p className="hito-body-small text-muted-foreground">
                    {review.planShape.activityMix.join(", ")}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="hito-list-row items-start">
            <div>
              <p className="hito-form-label">Assumptions and safety</p>
              <ul className="mt-2 grid gap-1">
                {[...review.assumptions, ...review.safetyNotes].map((note) => (
                  <li key={note} className="hito-body-small text-muted-foreground">
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter className="hito-product-dialog-footer sm:space-x-0">
          <button
            type="button"
            disabled={isBusy}
            onClick={onCancel}
            className="hito-button hito-button-secondary hito-button-md"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={onConfirmDraft}
            className="hito-button hito-button-primary hito-button-md"
          >
            {status === "creating" ? "Creating plan..." : "Yes, create plan"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StructuredCorrectionNotice({ result }: { result: StructuredCorrectionRequired }) {
  return (
    <div className="hito-row-group">
      <div className="hito-list-row items-start">
        <div className="min-w-0">
          <p className="hito-list-row-title">Review needs one correction</p>
          <p className="hito-list-row-copy">{result.correction.message}</p>
          {result.correction.fields.length > 0 ? (
            <p className="hito-field-helper mt-2">Check: {result.correction.fields.join(", ")}</p>
          ) : null}
          <p className="hito-field-helper mt-2">
            No plan was created. Adjust the setup and review again.
          </p>
        </div>
        <span className="hito-status-pill" data-tone="warning">
          Correct
        </span>
      </div>
    </div>
  );
}

function StructuredReviewError({
  result,
}: {
  result: Extract<StructuredFirstPlanDraftResult, { ok: false }>;
}) {
  return (
    <div className="hito-row-group">
      <div className="hito-list-row items-start">
        <div>
          <p className="hito-list-row-title">Review failed</p>
          <p className="hito-list-row-copy">{result.message}</p>
          <p className="hito-field-helper mt-2">No plan was created.</p>
        </div>
        <span className="hito-status-pill" data-tone="error">
          Error
        </span>
      </div>
    </div>
  );
}

function StructuredReviewLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="hito-label">{label}</p>
      <p className="hito-body-small text-muted-foreground">{value}</p>
    </div>
  );
}

function getLongHorizonReviewCopy(result: StructuredDraftReady) {
  const backendExtendedWeeks =
    result.generation.blueprintTrace?.blueprintHorizonStrategy?.backendExtendedWeeks ?? 0;

  if (backendExtendedWeeks > 0 && result.draft.summary.targetDate) {
    return "This is your full plan through your goal date. Hito shapes the opening block with AI, then builds the remaining weeks with safe progression before you confirm.";
  }

  return "Hito reviewed your answers and prepared your full plan. The active plan is created only after the next explicit confirmation.";
}

const REVIEW_GOAL_LABELS: Record<GoalDistance, string> = {
  build_consistency: "Consistency",
  "5k": "5K",
  "10k": "10K",
  half_marathon: "Half Marathon",
  marathon: "Marathon",
  ultra_marathon: "Ultra Marathon",
  mountain_running: "Mountain Running",
};

function getStructuredReviewPlanName(state: StructuredConstructorState) {
  const goalLabel = REVIEW_GOAL_LABELS[state.goalDistance];

  if (state.goalStyle === "target_time") {
    const targetTimeLabel = formatReviewTargetTime(state.targetTime);
    return targetTimeLabel
      ? `${goalLabel} ${targetTimeLabel} Target Plan`
      : `${goalLabel} Target Plan`;
  }

  if (state.goalDistance === "build_consistency") {
    return "Consistency Plan";
  }

  const styleLabel = getReviewGoalStyleLabel(state.goalStyle);
  return `${goalLabel} ${styleLabel} Plan`;
}

function getReviewGoalStyleLabel(goalStyle: Exclude<GoalStyle, "target_time">) {
  if (goalStyle === "relaxed") {
    return "Finish";
  }

  if (goalStyle === "ambitious") {
    return "Ambitious";
  }

  return "Balanced";
}

function formatReviewTargetTime(value: string) {
  const parts = value
    .trim()
    .split(":")
    .map((part) => Number(part));

  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) {
    return value.trim() || null;
  }

  const [hours, minutes, seconds] = parts;
  const hasValidClockParts =
    hours >= 0 && minutes >= 0 && minutes <= 59 && seconds >= 0 && seconds <= 59;

  if (!hasValidClockParts) {
    return value.trim() || null;
  }

  const minuteLabel = String(minutes).padStart(2, "0");

  if (seconds === 0) {
    return `${hours}:${minuteLabel}`;
  }

  return `${hours}:${minuteLabel}:${String(seconds).padStart(2, "0")}`;
}

function OptionGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

function OptionButton({
  active,
  label,
  copy,
  onClick,
}: {
  active: boolean;
  label: string;
  copy?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "hito-button hito-button-sm min-h-16 justify-start whitespace-normal text-left",
        active ? "hito-button-primary" : "hito-button-secondary",
      )}
    >
      <span>
        <span className="block">{label}</span>
        {copy ? (
          <span className="mt-1 block text-xs normal-case tracking-normal">{copy}</span>
        ) : null}
      </span>
    </button>
  );
}

function OptionRow({
  active,
  label,
  copy,
  onClick,
}: {
  active: boolean;
  label: string;
  copy?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "hito-button hito-button-md min-h-14 w-full justify-between whitespace-normal text-left",
        active ? "hito-button-primary" : "hito-button-secondary",
      )}
    >
      <span className="min-w-0">
        <span className="block">{label}</span>
        {copy ? <span className="mt-1 block hito-field-helper text-current/75">{copy}</span> : null}
      </span>
      {active ? <Icon name="check" size="sm" /> : null}
    </button>
  );
}
