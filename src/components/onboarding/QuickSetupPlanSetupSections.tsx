import { useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { EditableSelectValueChip, EditableValueChip } from "@/components/ui/editable-value-chip";
import { HitoEditableDateChip } from "@/components/ui/hito-date-time-input";
import type { RunnerFitnessLevel } from "@/lib/runner-training-preferences";
import { OptionButton, OptionGrid } from "./onboarding-choice-controls";
import {
  PRESET_PRIMARY_FITNESS_LEVEL_OPTIONS,
  normalizePresetPrimaryFitnessLevel,
  type PresetPrimaryFitnessLevel,
  type StructuredConstructorState,
  type WeekdayName,
} from "./onboarding-form-model";
import { RunningDaysPreferenceField, TrainingPreferenceFields } from "./TrainingPreferenceFields";

type QuickSetupEditableKey = "age" | "heightCm" | "weightKg" | "recent5kTime";

type QuickSetupPlanSetupSectionsProps = {
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
    setStartDate: (value: string) => void;
  };
  includeBaseline?: boolean;
  includeRunningLevel?: boolean;
  includeTrainingSetup?: boolean;
  includeScheduleRhythm?: boolean;
  heartRateProfile?: ReactNode;
  firstSectionNumber?: number;
  firstSectionHasDivider?: boolean;
};

const RUNNING_LEVEL_HELPER: Record<PresetPrimaryFitnessLevel, string> = {
  new_to_running: "Start gently and build the habit first.",
  beginner: "Build a steady base with manageable structure.",
  running_regularly: "Use your current rhythm to build toward a goal.",
  performance_focused: "Add more structured quality when the plan supports it.",
};

const RECENT_5K_TIME_OPTIONS = [
  { value: "", label: "No recent 5K" },
  ...Array.from({ length: 111 }, (_, index) => {
    const minutes = index + 10;

    return {
      value: `${minutes}:00`,
      label: `${minutes} min`,
    };
  }),
];

export function QuickSetupPlanSetupSections({
  state,
  setState,
  includeBaseline = true,
  includeRunningLevel = true,
  includeTrainingSetup = true,
  includeScheduleRhythm = true,
  heartRateProfile,
  firstSectionNumber = 1,
  firstSectionHasDivider = false,
}: QuickSetupPlanSetupSectionsProps) {
  const [activeEditableKey, setActiveEditableKey] = useState<QuickSetupEditableKey | null>(null);
  const primaryFitnessLevel = normalizePresetPrimaryFitnessLevel(state.fitnessLevel);
  let sectionNumber = firstSectionNumber;
  let hasRenderedSection = false;
  const nextSectionMeta = () => {
    const meta = {
      divider: hasRenderedSection ? true : firstSectionHasDivider,
      eyebrow: String(sectionNumber).padStart(2, "0"),
    };
    sectionNumber += 1;
    hasRenderedSection = true;
    return meta;
  };

  return (
    <>
      {includeBaseline ? (
        <QuickSetupSection
          {...nextSectionMeta()}
          title="Runner baseline"
          body="Add the few facts Hito needs before plan setup."
        >
          <div className="grid gap-4">
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
          </div>
        </QuickSetupSection>
      ) : null}

      {includeRunningLevel ? (
        <QuickSetupSection
          {...nextSectionMeta()}
          title="Running level"
          body="Choose the closest current rhythm."
        >
          <div className="grid gap-3">
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
                  label={option.label}
                  onClick={() => {
                    setState.setFitnessLevel(option.value);
                  }}
                />
              ))}
            </OptionGrid>
            <p className="hito-field-helper">{RUNNING_LEVEL_HELPER[primaryFitnessLevel]}</p>
          </div>
        </QuickSetupSection>
      ) : null}

      {heartRateProfile ? (
        <QuickSetupSection
          {...nextSectionMeta()}
          title="Heart-rate guidance"
          body="Review the BPM ranges Hito can use when a workout calls for heart-rate guidance."
        >
          {heartRateProfile}
        </QuickSetupSection>
      ) : null}

      {includeTrainingSetup ? (
        <QuickSetupSection
          {...nextSectionMeta()}
          title="Training setup"
          body="Add optional benchmark and weekly availability."
        >
          <div className="grid gap-4">
            <div className="hito-editable-value-chip-group">
              <EditableSelectValueChip
                fieldKey="recent5kTime"
                label="5K"
                emptyLabel="Add 5K result"
                value={state.recent5kTime}
                setValue={(value) => {
                  setState.setRecent5kTime(value);
                  setState.setRecent5kPace("");
                }}
                options={recentFiveKOptions(state.recent5kTime)}
                activeEditableKey={activeEditableKey}
                setActiveEditableKey={setActiveEditableKey}
                onClear={() => {
                  setState.setRecent5kPace("");
                }}
              />
            </div>
            <RunningDaysPreferenceField
              fixedRestDays={state.fixedRestDays}
              maxRunningDaysPerWeek={state.maxRunningDaysPerWeek}
              onMaxRunningDaysPerWeekChange={setState.setMaxRunningDaysPerWeek}
              label="Available running days per week"
              helper="Optional. This uses the same weekly rhythm controls as saved schedule preferences."
            />
          </div>
        </QuickSetupSection>
      ) : null}

      {includeScheduleRhythm ? (
        <QuickSetupSection
          {...nextSectionMeta()}
          title="Schedule rhythm"
          body="Add simple day preferences when you already know them."
        >
          <div className="grid gap-4">
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
            <HitoEditableDateChip
              label="Plan Start Date"
              value={state.startDate}
              onChange={setState.setStartDate}
              helper="Optional. Leave this open to use Hito's default start date."
            />
            <input type="hidden" name="schedule.startDate" value={state.startDate} />
          </div>
        </QuickSetupSection>
      ) : null}
    </>
  );
}

function QuickSetupSection({
  body,
  children,
  divider = true,
  eyebrow,
  title,
}: {
  body: string;
  children: ReactNode;
  divider?: boolean;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className={`hito-form-section-grid ${divider ? "hito-section-divider pt-8" : ""}`}>
      <div>
        <p className="hito-micro-label">{eyebrow}</p>
        <h2 className="hito-panel-title mt-2">{title}</h2>
        <p className="hito-helper mt-2">{body}</p>
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

function recentFiveKOptions(currentValue: string) {
  if (!currentValue || RECENT_5K_TIME_OPTIONS.some((option) => option.value === currentValue)) {
    return RECENT_5K_TIME_OPTIONS;
  }

  return [
    ...RECENT_5K_TIME_OPTIONS,
    {
      value: currentValue,
      label: currentValue,
    },
  ];
}
