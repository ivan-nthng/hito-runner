import { useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { EditableSelectValueField, EditableValueField } from "@/components/ui/editable-value-field";
import { HitoEditableDateField } from "@/components/ui/hito-date-time-input";
import { HitoSlider } from "@/components/ui/hito-slider";
import type { RunnerFitnessLevel } from "@/lib/runner-training-preferences";
import {
  PRESET_PRIMARY_FITNESS_LEVEL_OPTIONS,
  normalizePresetPrimaryFitnessLevel,
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
  const runningLevelIndex = Math.max(
    PRESET_PRIMARY_FITNESS_LEVEL_OPTIONS.findIndex(
      (option) => option.value === primaryFitnessLevel,
    ),
    0,
  );
  const runningLevelOption = PRESET_PRIMARY_FITNESS_LEVEL_OPTIONS[runningLevelIndex]!;
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
          body="Add the few facts Hito needs before training setup."
        >
          <div className="grid gap-4">
            <div className="hito-editable-value-field-group">
              <EditableValueField
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
              <EditableValueField
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
              <EditableValueField
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
          <HitoSlider
            label="Running level"
            min={0}
            max={PRESET_PRIMARY_FITNESS_LEVEL_OPTIONS.length - 1}
            step={1}
            value={runningLevelIndex}
            valueLabel={runningLevelOption.label}
            ariaValueText={runningLevelOption.label}
            minLabel=""
            maxLabel=""
            markers={[1, 2]}
            onValueChange={(value) => {
              const option = PRESET_PRIMARY_FITNESS_LEVEL_OPTIONS[value];
              if (option) setState.setFitnessLevel(option.value);
            }}
          />
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
            <div className="hito-editable-value-field-group">
              <EditableSelectValueField
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
              label="Weekly running ceiling"
              helper="Optional. Choose the most days you want to run in a week, or keep it flexible."
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
              maxRunningDaysPerWeek={state.maxRunningDaysPerWeek}
              onMaxRunningDaysPerWeekChange={setState.setMaxRunningDaysPerWeek}
              preferredLongRunDay={state.preferredLongRunDay}
              onPreferredLongRunDayChange={setState.setPreferredLongRunDay}
              preferredLongRunMode="default-sunday"
              showRunningDays={false}
              fixedRestDaysHelper="Optional. Protect days you want to keep free."
              preferredLongRunHelper="Optional. Leave this open if you do not have a preferred day."
            />
            <HitoEditableDateField
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
        <p className="hito-label-sm uppercase tracking-[0.18em] text-tertiary">{eyebrow}</p>
        <h2 className="hito-ui-title-xs text-foreground mt-2">{title}</h2>
        <p className="hito-body-xs text-secondary mt-2">{body}</p>
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
