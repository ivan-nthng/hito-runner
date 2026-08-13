import type { ReactNode } from "react";
import { HitoChoiceToggle } from "@/components/ui/hito-choice-toggle";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  FITNESS_LEVEL_OPTIONS,
  WEEKDAY_OPTIONS,
  isPositiveRecent5kPace,
  isPositiveRecent5kTime,
  type WeekdayName,
} from "./onboarding-form-model";
import type { RunnerFitnessLevel } from "@/lib/runner-training-preferences";
import { useHitoRadioGroup } from "@/components/ui/hito-radio-group";

type PreferredLongRunMode = "optional-any" | "default-sunday";
type RunningDaysPreferenceMode = "ceiling" | "frequency";

interface TrainingPreferenceFieldsProps {
  fixedRestDays: WeekdayName[];
  onFixedRestDaysChange: (value: WeekdayName[]) => void;
  maxRunningDaysPerWeek: string;
  onMaxRunningDaysPerWeekChange: (value: string) => void;
  preferredLongRunDay: WeekdayName | "";
  onPreferredLongRunDayChange: (value: WeekdayName | "") => void;
  preferredLongRunMode?: PreferredLongRunMode;
  fitnessLevel?: RunnerFitnessLevel;
  onFitnessLevelChange?: (value: RunnerFitnessLevel) => void;
  recent5kTime?: string;
  onRecent5kTimeChange?: (value: string) => void;
  recent5kPace?: string;
  onRecent5kPaceChange?: (value: string) => void;
  showFitnessBenchmark?: boolean;
  allowCustomFitnessLevelSelection?: boolean;
  fitnessBenchmarkHelper?: string;
  fixedRestDaysHelper?: string;
  runningDaysLabel?: string;
  maxRunningDaysHelper?: string;
  preferredLongRunHelper?: string;
  showRunningDays?: boolean;
  runningDaysMode?: RunningDaysPreferenceMode;
}

export function TrainingPreferenceFields({
  fixedRestDays,
  onFixedRestDaysChange,
  maxRunningDaysPerWeek,
  onMaxRunningDaysPerWeekChange,
  preferredLongRunDay,
  onPreferredLongRunDayChange,
  preferredLongRunMode = "optional-any",
  fitnessLevel,
  onFitnessLevelChange,
  recent5kTime = "",
  onRecent5kTimeChange,
  recent5kPace = "",
  onRecent5kPaceChange,
  showFitnessBenchmark = false,
  allowCustomFitnessLevelSelection = true,
  fitnessBenchmarkHelper,
  fixedRestDaysHelper,
  runningDaysLabel,
  maxRunningDaysHelper,
  preferredLongRunHelper,
  showRunningDays = true,
  runningDaysMode = "ceiling",
}: TrainingPreferenceFieldsProps) {
  const allowedRunningDayCount = WEEKDAY_OPTIONS.length - fixedRestDays.length;
  const canShowFitnessBenchmark =
    showFitnessBenchmark && Boolean(fitnessLevel && onFitnessLevelChange);
  const canSelectMoreRestDays = fixedRestDays.length < WEEKDAY_OPTIONS.length - 1;
  const preferredLongRunGroup = useHitoRadioGroup({
    items: [
      { value: "" },
      ...WEEKDAY_OPTIONS.map((weekday) => ({
        value: weekday.value,
        disabled: fixedRestDays.includes(weekday.value),
      })),
    ],
    value: preferredLongRunDay,
  });
  const fitnessBenchmarkGroup = useHitoRadioGroup({
    items: FITNESS_LEVEL_OPTIONS.map((option) => ({
      value: option.value,
      disabled: option.value === "custom" && !allowCustomFitnessLevelSelection,
    })),
    value: fitnessLevel,
  });

  function commitFixedRestDays(nextRestDays: WeekdayName[]) {
    const nextAllowedRunningDayCount = WEEKDAY_OPTIONS.length - nextRestDays.length;

    onFixedRestDaysChange(nextRestDays);

    if (
      runningDaysMode === "frequency" &&
      maxRunningDaysPerWeek.trim() &&
      Number.parseInt(maxRunningDaysPerWeek, 10) > nextAllowedRunningDayCount
    ) {
      onMaxRunningDaysPerWeekChange("");
    }

    if (preferredLongRunDay && nextRestDays.includes(preferredLongRunDay)) {
      onPreferredLongRunDayChange("");
    }
  }

  return (
    <>
      <TrainingPreferenceField
        label="Fixed rest days"
        helper={
          fixedRestDaysHelper ??
          (runningDaysMode === "ceiling"
            ? "Optional. Choose only weekdays that must stay free."
            : "Choose weekdays that must stay free in this schedule.")
        }
      >
        <div className="hito-choice-toggle-group" role="group" aria-label="Fixed rest days">
          <HitoChoiceToggle
            type="button"
            size="sm"
            selected={fixedRestDays.length === 0}
            onClick={() => commitFixedRestDays([])}
          >
            {runningDaysMode === "ceiling" ? "Flexible" : "No fixed rest days"}
          </HitoChoiceToggle>
          {WEEKDAY_OPTIONS.map((weekday) => {
            const active = fixedRestDays.includes(weekday.value);
            const disabled = !active && !canSelectMoreRestDays;
            return (
              <HitoChoiceToggle
                key={weekday.value}
                type="button"
                size="sm"
                selected={active}
                disabled={disabled}
                aria-disabled={disabled}
                onClick={() => {
                  const nextRestDays = active
                    ? fixedRestDays.filter((item) => item !== weekday.value)
                    : [...fixedRestDays, weekday.value];
                  commitFixedRestDays(nextRestDays);
                }}
                aria-label={`${weekday.value}${active ? " fixed rest day" : ""}`}
              >
                {weekday.label}
              </HitoChoiceToggle>
            );
          })}
        </div>
      </TrainingPreferenceField>

      {showRunningDays ? (
        <RunningDaysPreferenceField
          fixedRestDays={fixedRestDays}
          maxRunningDaysPerWeek={maxRunningDaysPerWeek}
          onMaxRunningDaysPerWeekChange={onMaxRunningDaysPerWeekChange}
          label={runningDaysLabel}
          helper={maxRunningDaysHelper}
          mode={runningDaysMode}
        />
      ) : null}

      <TrainingPreferenceField
        label="Preferred long-run day"
        helper={
          preferredLongRunHelper ??
          (preferredLongRunMode === "default-sunday"
            ? "Leave unselected to keep Sunday as the default."
            : "Optional. Leave open if any available day is fine.")
        }
      >
        <div
          className="hito-choice-toggle-group"
          {...preferredLongRunGroup.groupProps}
          aria-label="Preferred long-run day"
        >
          {preferredLongRunMode === "optional-any" || preferredLongRunMode === "default-sunday" ? (
            <HitoChoiceToggle
              type="button"
              {...preferredLongRunGroup.getRadioProps("")}
              size="sm"
              selected={preferredLongRunDay === ""}
              onClick={() => onPreferredLongRunDayChange("")}
            >
              {preferredLongRunMode === "default-sunday" ? "Use default" : "Any"}
            </HitoChoiceToggle>
          ) : null}
          {WEEKDAY_OPTIONS.map((weekday) => {
            const active = preferredLongRunDay === weekday.value;
            const disabled = fixedRestDays.includes(weekday.value);
            return (
              <HitoChoiceToggle
                key={weekday.value}
                type="button"
                {...preferredLongRunGroup.getRadioProps(weekday.value)}
                size="sm"
                selected={active}
                disabled={disabled}
                onClick={() => onPreferredLongRunDayChange(weekday.value)}
              >
                {weekday.label}
              </HitoChoiceToggle>
            );
          })}
        </div>
      </TrainingPreferenceField>

      {canShowFitnessBenchmark && fitnessLevel && onFitnessLevelChange ? (
        <TrainingPreferenceField label="Fitness benchmark" helper={fitnessBenchmarkHelper}>
          <div
            className="grid gap-2"
            {...fitnessBenchmarkGroup.groupProps}
            aria-label="Fitness benchmark"
          >
            {FITNESS_LEVEL_OPTIONS.map((option) => {
              const active = fitnessLevel === option.value;
              return (
                <HitoChoiceToggle
                  key={option.value}
                  type="button"
                  {...fitnessBenchmarkGroup.getRadioProps(option.value)}
                  presentation="card"
                  selected={active}
                  disabled={option.value === "custom" && !allowCustomFitnessLevelSelection}
                  className="min-h-14 w-full justify-between whitespace-normal text-left"
                  onClick={() => onFitnessLevelChange(option.value)}
                >
                  <span className="min-w-0">
                    <span className="block">{option.label}</span>
                    <span className="mt-1 block hito-body-xs text-secondary text-current/75">
                      {option.copy}
                    </span>
                  </span>
                </HitoChoiceToggle>
              );
            })}
          </div>

          {fitnessLevel === "custom" && onRecent5kTimeChange && onRecent5kPaceChange ? (
            <RecentFiveKBenchmarkFields
              className="mt-2"
              required
              recent5kTime={recent5kTime}
              onRecent5kTimeChange={onRecent5kTimeChange}
              recent5kPace={recent5kPace}
              onRecent5kPaceChange={onRecent5kPaceChange}
            />
          ) : null}
        </TrainingPreferenceField>
      ) : null}
    </>
  );
}

export function RunningDaysPreferenceField({
  fixedRestDays,
  helper,
  label,
  maxRunningDaysPerWeek,
  mode = "ceiling",
  onMaxRunningDaysPerWeekChange,
}: {
  fixedRestDays: WeekdayName[];
  helper?: string;
  label?: string;
  maxRunningDaysPerWeek: string;
  mode?: RunningDaysPreferenceMode;
  onMaxRunningDaysPerWeekChange: (value: string) => void;
}) {
  const allowedRunningDayCount =
    mode === "ceiling" ? WEEKDAY_OPTIONS.length : WEEKDAY_OPTIONS.length - fixedRestDays.length;
  const selectedRunningDays = Number.parseInt(maxRunningDaysPerWeek, 10);
  const runningDayOptions = Array.from({ length: allowedRunningDayCount }, (_, index) =>
    String(index + 1),
  );
  const runningDaysGroup = useHitoRadioGroup({
    items: [
      ...(mode === "ceiling" ? [{ value: "" }] : []),
      ...runningDayOptions.map((value) => ({ value })),
    ],
    value: maxRunningDaysPerWeek,
  });
  const resolvedLabel =
    label ?? (mode === "ceiling" ? "Weekly running ceiling" : "Running days per week");

  return (
    <TrainingPreferenceField
      label={resolvedLabel}
      helper={
        helper ??
        (mode === "ceiling"
          ? "Optional. This is a maximum, not a target workout count."
          : `Choose 1-${allowedRunningDayCount} running day${
              allowedRunningDayCount === 1 ? "" : "s"
            } per week.`)
      }
    >
      <div
        className="hito-choice-toggle-group"
        {...runningDaysGroup.groupProps}
        aria-label={resolvedLabel}
      >
        {mode === "ceiling" ? (
          <HitoChoiceToggle
            type="button"
            {...runningDaysGroup.getRadioProps("")}
            size="sm"
            selected={maxRunningDaysPerWeek === ""}
            onClick={() => onMaxRunningDaysPerWeekChange("")}
          >
            Flexible
          </HitoChoiceToggle>
        ) : null}
        {runningDayOptions.map((count) => {
          const active = selectedRunningDays === Number(count);
          return (
            <HitoChoiceToggle
              key={count}
              type="button"
              {...runningDaysGroup.getRadioProps(count)}
              size="sm"
              selected={active}
              aria-label={
                mode === "ceiling"
                  ? `Up to ${count} running day${count === "1" ? "" : "s"} per week`
                  : `${count} running day${count === "1" ? "" : "s"} per week`
              }
              onClick={() => onMaxRunningDaysPerWeekChange(count)}
            >
              {count}
            </HitoChoiceToggle>
          );
        })}
      </div>
    </TrainingPreferenceField>
  );
}

export function RecentFiveKBenchmarkFields({
  className,
  required = false,
  recent5kTime = "",
  onRecent5kTimeChange,
  recent5kPace = "",
  onRecent5kPaceChange,
}: {
  className?: string;
  required?: boolean;
  recent5kTime?: string;
  onRecent5kTimeChange: (value: string) => void;
  recent5kPace?: string;
  onRecent5kPaceChange: (value: string) => void;
}) {
  const trimmedTime = recent5kTime.trim();
  const trimmedPace = recent5kPace.trim();
  const hasTime = trimmedTime.length > 0;
  const hasPace = trimmedPace.length > 0;
  const timeInvalid = hasTime && !isPositiveRecent5kTime(trimmedTime);
  const paceInvalid = hasPace && !isPositiveRecent5kPace(trimmedPace);
  const missingRequiredBenchmark = required && !hasTime && !hasPace;
  const helperTone =
    timeInvalid || paceInvalid || missingRequiredBenchmark
      ? "hito-body-md font-medium text-negative"
      : "hito-body-xs text-secondary";
  const helperText = timeInvalid
    ? "Use a positive recent 5K time such as 25:00."
    : paceInvalid
      ? "Use a positive recent 5K pace such as 5:00/km."
      : missingRequiredBenchmark
        ? "Use a recent 5K time or pace."
        : "Optional. Add either value to help Hito choose useful pace guidance.";

  return (
    <div className={cn("grid gap-2", className)}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="hito-label-md text-foreground">Recent 5K time</span>
          <Input
            value={recent5kTime}
            onChange={(event) => onRecent5kTimeChange(event.target.value)}
            placeholder="25:00"
            size="md"
            variant="primary"
            aria-invalid={timeInvalid || (required && !hasTime && !hasPace)}
          />
        </label>

        <label className="grid gap-2">
          <span className="hito-label-md text-foreground">Recent 5K pace</span>
          <Input
            value={recent5kPace}
            onChange={(event) => onRecent5kPaceChange(event.target.value)}
            placeholder="5:00/km"
            size="md"
            variant="primary"
            aria-invalid={paceInvalid || (required && !hasTime && !hasPace)}
          />
        </label>
      </div>
      <span className={helperTone}>{helperText}</span>
    </div>
  );
}

function TrainingPreferenceField({
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
      <span className="hito-label-md text-foreground">{label}</span>
      {children}
      {helper ? <span className="hito-body-xs text-secondary">{helper}</span> : null}
    </div>
  );
}
