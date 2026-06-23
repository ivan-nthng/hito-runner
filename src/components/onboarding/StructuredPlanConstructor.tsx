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
import { Icon, type HitoIconName } from "@/components/ui/icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { RecentFiveKBenchmarkFields, TrainingPreferenceFields } from "./TrainingPreferenceFields";
import {
  GUIDANCE_PREFERENCE_OPTIONS,
  GOAL_DISTANCE_OPTIONS,
  GOAL_STYLE_OPTIONS,
  ONBOARDING_TEXTAREA_CLASS,
  PRESET_PRIMARY_FITNESS_LEVEL_OPTIONS,
  STRENGTH_OPTIONS,
  TERRAIN_OPTIONS,
  formatTerrainFocus,
  normalizePresetPrimaryFitnessLevel,
  type GuidancePreference,
  type GoalDistance,
  type GoalStyle,
  type StrengthPreference,
  type StructuredConstructorState,
  type TerrainFocus,
  type WeekdayName,
} from "./onboarding-form-model";
import type { StructuredFirstPlanDraftResult } from "@/lib/first-plan-actions";
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
  mode?: "quick" | "advanced";
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
  planPresetPanel?: ReactNode | ((actions: { openAdvancedCustom: () => void }) => ReactNode);
  onUseAdvancedSetup?: () => void;
  onUseQuickSetup?: () => void;
}

export function StructuredPlanConstructor({
  formRef,
  mode = "quick",
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
  planPresetPanel,
  onUseAdvancedSetup,
  onUseQuickSetup,
}: StructuredPlanConstructorProps) {
  const isAdvancedMode = mode === "advanced";
  const showsTargetFields = state.goalStyle === "target_time";
  const showsTerrainSelector =
    state.goalDistance === "marathon" || state.goalDistance === "ultra_marathon";
  const impliedMountainTerrain = state.goalDistance === "mountain_running";
  const [activeEditableKey, setActiveEditableKey] = useState<ProfileBasicEditableKey | null>(null);
  const primaryFitnessLevel = normalizePresetPrimaryFitnessLevel(state.fitnessLevel);
  const isDraftReady = draftResult?.ok === true && draftResult.status === "draft_ready";
  const isCorrectionRequired =
    draftResult?.ok === true && draftResult.status === "correction_required";
  const openAdvancedCustom = () => {
    onUseAdvancedSetup?.();
  };

  return (
    <form
      ref={formRef}
      noValidate
      className="mt-6 grid gap-6 pb-28"
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
          title="Basic setup"
          body={
            isAdvancedMode
              ? "Start with the basics, then add the details you need below."
              : "Start with the basics, then choose a guided plan to review."
          }
          divider={false}
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

          <Field
            label="Running level"
            helper="Choose the closest current level. You can refine details after the plan exists."
          >
            <OptionGrid label="Running level">
              {PRESET_PRIMARY_FITNESS_LEVEL_OPTIONS.map((option) => (
                <OptionButton
                  key={option.value}
                  active={primaryFitnessLevel === option.value}
                  icon={fitnessLevelIcon(option.value)}
                  label={option.label}
                  copy={option.copy}
                  onClick={() => {
                    setState.setFitnessLevel(option.value);
                    setState.setRecent5kTime("");
                    setState.setRecent5kPace("");
                  }}
                />
              ))}
            </OptionGrid>
          </Field>

          {!isAdvancedMode ? (
            <Field
              label="Fitness benchmark"
              helper="Optional. A recent 5K lets Hito show backend-backed pace targets in selected-plan previews when supported."
            >
              <RecentFiveKBenchmarkFields
                recent5kTime={state.recent5kTime}
                onRecent5kTimeChange={setState.setRecent5kTime}
                recent5kPace={state.recent5kPace}
                onRecent5kPaceChange={setState.setRecent5kPace}
              />
            </Field>
          ) : null}

          <Field
            label="Available running days per week"
            helper="Optional. Add this now if you want a more tailored starting point."
          >
            <OptionGrid label="Available running days per week">
              {PRESET_RUNNING_DAY_OPTIONS.map((option) => (
                <OptionButton
                  key={option.value}
                  active={state.maxRunningDaysPerWeek === option.value}
                  label={option.label}
                  copy={option.copy}
                  onClick={() => setState.setMaxRunningDaysPerWeek(option.value)}
                />
              ))}
            </OptionGrid>
          </Field>

          <HitoEditableDateChip
            label="Plan Start Date"
            value={state.startDate}
            onChange={setState.setStartDate}
            helper="Optional. Leave this open to use Hito's default start date."
          />
          <input type="hidden" name="schedule.startDate" value={state.startDate} />

          <div className="hito-row-group">
            <div className="hito-list-row items-start">
              <div className="grid gap-4">
                <div>
                  <p className="hito-label">Schedule rhythm</p>
                  <p className="hito-list-row-copy">
                    Optional. Add schedule preferences now, or choose a plan first and refine later.
                  </p>
                </div>
                <TrainingPreferenceFields
                  fixedRestDays={state.fixedRestDays}
                  onFixedRestDaysChange={setState.setFixedRestDays}
                  restDaysAnswered={state.restDaysAnswered}
                  onRestDaysAnsweredChange={setState.setRestDaysAnswered}
                  maxRunningDaysPerWeek={state.maxRunningDaysPerWeek}
                  onMaxRunningDaysPerWeekChange={setState.setMaxRunningDaysPerWeek}
                  preferredLongRunDay={state.preferredLongRunDay}
                  onPreferredLongRunDayChange={setState.setPreferredLongRunDay}
                  preferredLongRunMode="default-sunday"
                  showRunningDays={false}
                  fixedRestDaysHelper="Optional. Protect days you want to keep free."
                  preferredLongRunHelper="Optional. Leave this open if you do not have a preferred day."
                />
              </div>
            </div>
          </div>
        </ConstructorSection>

        {!isAdvancedMode
          ? typeof planPresetPanel === "function"
            ? planPresetPanel({ openAdvancedCustom })
            : planPresetPanel
          : null}

        {isAdvancedMode ? (
          <section className="hito-section-divider grid gap-8 pt-6" data-advanced-custom>
            <div className="hito-surface-wash" data-tone="signal">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="hito-list-row-title">Advanced setup</p>
                  <p className="hito-list-row-copy">
                    Use this path when you want more control over the setup.
                  </p>
                </div>
                {onUseQuickSetup ? (
                  <button
                    type="button"
                    className="hito-button hito-button-secondary hito-button-sm shrink-0"
                    disabled={isBusy}
                    onClick={onUseQuickSetup}
                  >
                    Back to Quick setup
                  </button>
                ) : null}
              </div>
            </div>

            <ConstructorSection
              eyebrow="A1"
              title="Schedule constraints"
              body="Add schedule details when Quick setup is not the right fit."
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
                recent5kPace={state.recent5kPace}
                onRecent5kPaceChange={setState.setRecent5kPace}
              />
            </ConstructorSection>

            <ConstructorSection
              eyebrow="A2"
              title="Workout guidance"
              body="Choose how you want workouts to be described."
            >
              <Field label="Guidance style">
                <OptionGrid label="Guidance style">
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
              eyebrow="A3"
              title="Goal and timing"
              body="Set a specific goal, timeline, or target if you need one."
            >
              <Field label="Goal distance">
                <OptionGrid label="Goal distance">
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
                <OptionGrid label="Goal style">
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

              {showsTargetFields ? (
                <div className="hito-form-two-column-grid">
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
                  Hito will estimate a realistic direction from your benchmark, availability, and
                  goal style. No target time is needed for this mode.
                </p>
              )}

              {showsTerrainSelector && (
                <Field label="Terrain focus">
                  <OptionGrid label="Terrain focus">
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
              eyebrow="A4"
              title="Extras"
              body="Add light strength or mobility support if you want it included."
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
              eyebrow="A5"
              title="Detailed comment"
              body="Add any important context or constraints for review."
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
                      Advanced setup reviews everything before anything is created.
                    </p>
                  ) : null}
                </div>
                <button
                  type="submit"
                  disabled={isBusy || !isConstructorReady}
                  className="hito-button hito-button-secondary hito-button-lg shrink-0"
                >
                  {constructorStatus === "reviewing"
                    ? "Reviewing setup..."
                    : constructorStatus === "finishing"
                      ? "Opening your plan..."
                      : "Review advanced setup"}
                </button>
              </div>
            </div>
          </section>
        ) : null}
        {isDraftReady ? (
          <StructuredDraftReadyReviewModal
            result={draftResult}
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
  divider = true,
}: {
  eyebrow: string;
  title: string;
  body: string;
  children: ReactNode;
  divider?: boolean;
}) {
  return (
    <section className={cn("hito-form-section-grid", divider && "hito-section-divider pt-6")}>
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
  status,
  isBusy,
  onConfirmDraft,
  onCancel,
}: {
  result: StructuredDraftReady;
  status: ConstructorStatus;
  isBusy: boolean;
  onConfirmDraft: () => void;
  onCancel: () => void;
}) {
  const review = result.review;
  const summary = result.draft.summary;
  const longHorizonReviewCopy = getLongHorizonReviewCopy(result);
  const durationLabel = summary.targetDate ? "Plan range" : "Plan length";

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
        className="hito-dialog-stable hito-product-dialog hito-dialog-surface-product hito-dialog-size-workflow hito-dialog-height-workflow"
        overlayClassName="hito-dialog-overlay-stable"
      >
        <DialogHeader className="hito-product-dialog-header">
          <DialogTitle className="hito-modal-title">Review your plan</DialogTitle>
          <DialogDescription className="hito-body max-w-2xl">
            Nothing has been created yet. Review the full plan below, then confirm to create it.
          </DialogDescription>
        </DialogHeader>

        <div className="hito-product-dialog-body-scroll-fill">
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
                <StructuredReviewLine label="Plan" value={review.displayTitle} />
                <StructuredReviewLine
                  label={durationLabel}
                  value={review.planShape.durationLabel}
                />
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
                <StructuredReviewLine
                  label="Quality rhythm"
                  value={review.planShape.qualityRhythm}
                />
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

const PRESET_RUNNING_DAY_OPTIONS: { value: string; label: string; copy: string }[] = [
  { value: "1", label: "1 day", copy: "Availability only" },
  { value: "2", label: "2 days", copy: "Light availability" },
  { value: "3", label: "3 days", copy: "Minimum preset rhythm" },
  { value: "4", label: "4 days", copy: "Balanced rhythm" },
  { value: "5", label: "5 days", copy: "More durable base" },
];

export function OptionGrid({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="hito-onboarding-option-grid" role="radiogroup" aria-label={label}>
      {children}
    </div>
  );
}

export function OptionButton({
  active,
  icon,
  label,
  copy,
  onClick,
}: {
  active: boolean;
  icon?: HitoIconName;
  label: string;
  copy?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "hito-button hito-button-sm hito-onboarding-option-button",
        active ? "hito-button-primary" : "hito-button-secondary",
      )}
    >
      {icon ? (
        <span className="hito-onboarding-option-icon" aria-hidden="true">
          <Icon name={icon} size="sm" />
        </span>
      ) : null}
      <span className="min-w-0">
        <span className="hito-onboarding-option-title block">{label}</span>
        {copy ? <span className="hito-onboarding-option-copy mt-1 block">{copy}</span> : null}
      </span>
    </button>
  );
}

function fitnessLevelIcon(value: RunnerFitnessLevel): HitoIconName {
  switch (value) {
    case "new_to_running":
      return "sparkles";
    case "beginner":
      return "activity";
    case "running_regularly":
      return "check-circle";
    case "performance_focused":
      return "watch";
    case "custom":
      return "edit";
  }
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
        "hito-button hito-button-md hito-onboarding-option-row-button",
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
