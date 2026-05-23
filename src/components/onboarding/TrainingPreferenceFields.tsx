import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  FITNESS_LEVEL_OPTIONS,
  WEEKDAY_OPTIONS,
  isRecent5kTimeInAcceptedRange,
  type WeekdayName,
} from "./onboarding-form-model";
import type { RunnerFitnessLevel } from "@/lib/runner-training-preferences";

type PreferredLongRunMode = "optional-any" | "default-sunday";

interface TrainingPreferenceFieldsProps {
  fixedRestDays: WeekdayName[];
  onFixedRestDaysChange: (value: WeekdayName[]) => void;
  restDaysAnswered: boolean;
  onRestDaysAnsweredChange: (value: boolean) => void;
  maxRunningDaysPerWeek: string;
  onMaxRunningDaysPerWeekChange: (value: string) => void;
  preferredLongRunDay: WeekdayName | "";
  onPreferredLongRunDayChange: (value: WeekdayName | "") => void;
  preferredLongRunMode?: PreferredLongRunMode;
  fitnessLevel?: RunnerFitnessLevel;
  onFitnessLevelChange?: (value: RunnerFitnessLevel) => void;
  recent5kTime?: string;
  onRecent5kTimeChange?: (value: string) => void;
  showFitnessBenchmark?: boolean;
  fixedRestDaysHelper?: string;
  maxRunningDaysHelper?: string;
  preferredLongRunHelper?: string;
}

export function TrainingPreferenceFields({
  fixedRestDays,
  onFixedRestDaysChange,
  restDaysAnswered,
  onRestDaysAnsweredChange,
  maxRunningDaysPerWeek,
  onMaxRunningDaysPerWeekChange,
  preferredLongRunDay,
  onPreferredLongRunDayChange,
  preferredLongRunMode = "optional-any",
  fitnessLevel,
  onFitnessLevelChange,
  recent5kTime = "",
  onRecent5kTimeChange,
  showFitnessBenchmark = false,
  fixedRestDaysHelper,
  maxRunningDaysHelper,
  preferredLongRunHelper,
}: TrainingPreferenceFieldsProps) {
  const allowedRunningDayCount = WEEKDAY_OPTIONS.length - fixedRestDays.length;
  const selectedRunningDays = Number.parseInt(maxRunningDaysPerWeek, 10);
  const hasRunningDaysAnswer =
    maxRunningDaysPerWeek.trim().length > 0 &&
    Number.isInteger(selectedRunningDays) &&
    selectedRunningDays >= 1 &&
    selectedRunningDays <= allowedRunningDayCount;
  const canShowPreferredLongRunDay = restDaysAnswered && hasRunningDaysAnswer;
  const canShowFitnessBenchmark = canShowPreferredLongRunDay && showFitnessBenchmark;
  const canSelectMoreRestDays = fixedRestDays.length < WEEKDAY_OPTIONS.length - 1;

  function commitFixedRestDays(nextRestDays: WeekdayName[]) {
    const nextAllowedRunningDayCount = WEEKDAY_OPTIONS.length - nextRestDays.length;

    onRestDaysAnsweredChange(true);
    onFixedRestDaysChange(nextRestDays);

    if (
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
          fixedRestDaysHelper ?? "Pick fixed rest days or choose no fixed rest days to continue."
        }
      >
        <div className="hito-choice-toggle-group" role="group" aria-label="Fixed rest days">
          <button
            type="button"
            onClick={() => commitFixedRestDays([])}
            className="hito-choice-toggle hito-choice-toggle-sm"
            data-selected={restDaysAnswered && fixedRestDays.length === 0}
            aria-pressed={restDaysAnswered && fixedRestDays.length === 0}
          >
            No fixed rest days
          </button>
          {WEEKDAY_OPTIONS.map((weekday) => {
            const active = fixedRestDays.includes(weekday.value);
            const disabled = !active && !canSelectMoreRestDays;
            return (
              <button
                key={weekday.value}
                type="button"
                disabled={disabled}
                aria-disabled={disabled}
                onClick={() => {
                  const nextRestDays = active
                    ? fixedRestDays.filter((item) => item !== weekday.value)
                    : [...fixedRestDays, weekday.value];
                  commitFixedRestDays(nextRestDays);
                }}
                className="hito-choice-toggle hito-choice-toggle-sm"
                data-selected={active}
                aria-pressed={active}
                aria-label={`${weekday.value}${active ? " fixed rest day" : ""}`}
              >
                {weekday.label}
              </button>
            );
          })}
        </div>
      </TrainingPreferenceField>

      {restDaysAnswered ? (
        <TrainingPreferenceField
          label="Default running days per week"
          helper={
            maxRunningDaysHelper ??
            `Choose 1-${allowedRunningDayCount} running day${
              allowedRunningDayCount === 1 ? "" : "s"
            } per week.`
          }
        >
          <div
            className="hito-choice-toggle-group"
            role="radiogroup"
            aria-label="Default running days per week"
          >
            {Array.from({ length: allowedRunningDayCount }, (_, index) => index + 1).map(
              (count) => {
                const active = selectedRunningDays === count;
                return (
                  <button
                    key={count}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    className="hito-choice-toggle hito-choice-toggle-sm"
                    data-selected={active}
                    onClick={() => onMaxRunningDaysPerWeekChange(String(count))}
                  >
                    {count}
                  </button>
                );
              },
            )}
          </div>
        </TrainingPreferenceField>
      ) : null}

      {canShowPreferredLongRunDay ? (
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
            role="radiogroup"
            aria-label="Preferred long-run day"
          >
            {preferredLongRunMode === "optional-any" ||
            preferredLongRunMode === "default-sunday" ? (
              <button
                type="button"
                role="radio"
                aria-checked={preferredLongRunDay === ""}
                className="hito-choice-toggle hito-choice-toggle-sm"
                data-selected={preferredLongRunDay === ""}
                onClick={() => onPreferredLongRunDayChange("")}
              >
                {preferredLongRunMode === "default-sunday" ? "Use default" : "Any"}
              </button>
            ) : null}
            {WEEKDAY_OPTIONS.map((weekday) => {
              const active = preferredLongRunDay === weekday.value;
              const disabled = fixedRestDays.includes(weekday.value);
              return (
                <button
                  key={weekday.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-disabled={disabled}
                  disabled={disabled}
                  className="hito-choice-toggle hito-choice-toggle-sm"
                  data-selected={active}
                  onClick={() => onPreferredLongRunDayChange(weekday.value)}
                >
                  {weekday.label}
                </button>
              );
            })}
          </div>
        </TrainingPreferenceField>
      ) : null}

      {canShowFitnessBenchmark && fitnessLevel && onFitnessLevelChange && onRecent5kTimeChange ? (
        <TrainingPreferenceField label="Fitness benchmark">
          <div className="grid gap-2" role="radiogroup" aria-label="Fitness benchmark">
            {FITNESS_LEVEL_OPTIONS.map((option) => {
              const active = fitnessLevel === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={cn(
                    "hito-button hito-button-md min-h-14 w-full justify-between whitespace-normal text-left",
                    active ? "hito-button-primary" : "hito-button-secondary",
                  )}
                  data-selected={active}
                  onClick={() => onFitnessLevelChange(option.value)}
                >
                  <span className="min-w-0">
                    <span className="block">{option.label}</span>
                    <span className="mt-1 block hito-field-helper text-current/75">
                      {option.copy}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {fitnessLevel === "custom" ? (
            <label className="mt-2 grid gap-2">
              <span className="hito-form-label">Recent 5K time</span>
              <input
                value={recent5kTime}
                onChange={(event) => onRecent5kTimeChange(event.target.value)}
                placeholder="25:00"
                className="hito-field hito-field-primary hito-field-md"
                aria-invalid={
                  recent5kTime.trim() ? !isRecent5kTimeInAcceptedRange(recent5kTime.trim()) : true
                }
              />
              <span
                className={
                  recent5kTime.trim() && !isRecent5kTimeInAcceptedRange(recent5kTime.trim())
                    ? "hito-field-error"
                    : "hito-field-helper"
                }
              >
                Use a recent 5K time between 18:00 and 55:00.
              </span>
            </label>
          ) : null}
        </TrainingPreferenceField>
      ) : null}
    </>
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
      <span className="hito-form-label">{label}</span>
      {children}
      {helper ? <span className="hito-field-helper">{helper}</span> : null}
    </div>
  );
}
