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
import { cn } from "@/lib/utils";
import { TrainingPreferenceFields } from "./TrainingPreferenceFields";
import { QuickSetupPlanSetupSections } from "./QuickSetupPlanSetupSections";
import { OptionButton, OptionGrid } from "./onboarding-choice-controls";
import {
  GUIDANCE_PREFERENCE_OPTIONS,
  GOAL_DISTANCE_OPTIONS,
  GOAL_STYLE_OPTIONS,
  ONBOARDING_TEXTAREA_CLASS,
  PRESET_PRIMARY_FITNESS_LEVEL_OPTIONS,
  STRENGTH_OPTIONS,
  TERRAIN_OPTIONS,
  normalizePresetPrimaryFitnessLevel,
  type GuidancePreference,
  type GoalDistance,
  type GoalStyle,
  type StrengthPreference,
  type StructuredConstructorState,
  type TerrainFocus,
  type WeekdayName,
} from "./onboarding-form-model";
import type { RunnerFitnessLevel } from "@/lib/runner-training-preferences";

type ConstructorStatus = "idle" | "reviewing" | "creating" | "finishing";
type ProfileBasicEditableKey = "age" | "heightCm" | "weightKg";

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
  constructorError: string | null;
  isBusy: boolean;
  isConstructorReady: boolean;
  onSubmit: () => void;
  planPresetPanel?: ReactNode | ((actions: { openAdvancedCustom: () => void }) => ReactNode);
  onUseAdvancedSetup?: () => void;
  onUseQuickSetup?: () => void;
  quickSetupSections?: {
    includeBaseline?: boolean;
    includeRunningLevel?: boolean;
    includeTrainingSetup?: boolean;
    includeScheduleRhythm?: boolean;
    heartRateProfile?: ReactNode;
    firstSectionNumber?: number;
    firstSectionHasDivider?: boolean;
  };
}

export function StructuredPlanConstructor({
  formRef,
  mode = "quick",
  state,
  setState,
  constructorStatus,
  constructorError,
  isBusy,
  isConstructorReady,
  onSubmit,
  planPresetPanel,
  onUseAdvancedSetup,
  onUseQuickSetup,
  quickSetupSections,
}: StructuredPlanConstructorProps) {
  const isAdvancedMode = mode === "advanced";
  const showsTargetFields = state.goalStyle === "target_time";
  const showsTerrainSelector =
    state.goalDistance === "marathon" || state.goalDistance === "ultra_marathon";
  const impliedMountainTerrain = state.goalDistance === "mountain_running";
  const [activeEditableKey, setActiveEditableKey] = useState<ProfileBasicEditableKey | null>(null);
  const primaryFitnessLevel = normalizePresetPrimaryFitnessLevel(state.fitnessLevel);
  const openAdvancedCustom = () => {
    onUseAdvancedSetup?.();
  };

  return (
    <form
      ref={formRef}
      noValidate
      className={cn("mt-6 grid pb-28", isAdvancedMode ? "gap-6" : "gap-8")}
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!isConstructorReady || isBusy) {
          return;
        }

        onSubmit();
      }}
    >
      <>
        {!isAdvancedMode ? (
          <QuickSetupPlanSetupSections state={state} setState={setState} {...quickSetupSections} />
        ) : (
          <ConstructorSection
            eyebrow="01"
            title="Basic setup"
            body="Start with the basics, then add the details you need below."
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
              <OptionGrid
                label="Running level"
                items={PRESET_PRIMARY_FITNESS_LEVEL_OPTIONS}
                value={primaryFitnessLevel}
              >
                {PRESET_PRIMARY_FITNESS_LEVEL_OPTIONS.map((option) => (
                  <OptionButton
                    key={option.value}
                    active={primaryFitnessLevel === option.value}
                    value={option.value}
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

            <Field
              label="Available running days per week"
              helper="Optional. Add this now if you want a more tailored starting point."
            >
              <OptionGrid
                label="Available running days per week"
                items={PRESET_RUNNING_DAY_OPTIONS}
                value={state.maxRunningDaysPerWeek}
              >
                {PRESET_RUNNING_DAY_OPTIONS.map((option) => (
                  <OptionButton
                    key={option.value}
                    active={state.maxRunningDaysPerWeek === option.value}
                    value={option.value}
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
                      Optional. Add schedule preferences now, or choose a plan first and refine
                      later.
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
        )}

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
                    Back to simple setup
                  </button>
                ) : null}
              </div>
            </div>

            <ConstructorSection
              eyebrow="A1"
              title="Schedule constraints"
              body="Add schedule details when the simple setup is not the right fit."
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
                <OptionGrid
                  label="Guidance style"
                  items={GUIDANCE_PREFERENCE_OPTIONS}
                  value={state.guidancePreference}
                >
                  {GUIDANCE_PREFERENCE_OPTIONS.map((option) => (
                    <OptionButton
                      key={option.value}
                      active={state.guidancePreference === option.value}
                      value={option.value}
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
                <OptionGrid
                  label="Goal distance"
                  items={GOAL_DISTANCE_OPTIONS}
                  value={state.goalDistance}
                >
                  {GOAL_DISTANCE_OPTIONS.map((option) => (
                    <OptionButton
                      key={option.value}
                      active={state.goalDistance === option.value}
                      value={option.value}
                      label={option.label}
                      onClick={() => setState.setGoalDistance(option.value)}
                    />
                  ))}
                </OptionGrid>
              </Field>

              <Field label="Goal style">
                <OptionGrid label="Goal style" items={GOAL_STYLE_OPTIONS} value={state.goalStyle}>
                  {GOAL_STYLE_OPTIONS.map((option) => (
                    <OptionButton
                      key={option.value}
                      active={state.goalStyle === option.value}
                      value={option.value}
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
                  <OptionGrid
                    label="Terrain focus"
                    items={TERRAIN_OPTIONS.map((option) => ({ value: option.value! }))}
                    value={state.terrainFocus}
                  >
                    {TERRAIN_OPTIONS.map((option) => (
                      <OptionButton
                        key={option.value}
                        active={state.terrainFocus === option.value}
                        value={option.value!}
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

const PRESET_RUNNING_DAY_OPTIONS: { value: string; label: string; copy: string }[] = [
  { value: "1", label: "1 day", copy: "Availability only" },
  { value: "2", label: "2 days", copy: "Light availability" },
  { value: "3", label: "3 days", copy: "Minimum preset rhythm" },
  { value: "4", label: "4 days", copy: "Balanced rhythm" },
  { value: "5", label: "5 days", copy: "More durable base" },
];

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
