import type { Dispatch, FormEvent, ReactNode, RefObject, SetStateAction } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import {
  BENCHMARK_OPTIONS,
  GOAL_DISTANCE_OPTIONS,
  GOAL_STYLE_OPTIONS,
  STRENGTH_OPTIONS,
  TERRAIN_OPTIONS,
  WEEKDAY_OPTIONS,
  deriveRunningDaysPerWeek,
  type BenchmarkKind,
  type GoalDistance,
  type GoalStyle,
  type StrengthPreference,
  type StructuredConstructorState,
  type TerrainFocus,
  type WeekdayName,
} from "./onboarding-form-model";

type ConstructorStatus = "idle" | "saving" | "finishing";

interface StructuredPlanConstructorProps {
  formRef: RefObject<HTMLFormElement | null>;
  state: StructuredConstructorState;
  setState: {
    setAge: (value: string) => void;
    setWeightKg: (value: string) => void;
    setHeightCm: (value: string) => void;
    setBenchmarkKind: (value: BenchmarkKind) => void;
    setRecent5kTime: (value: string) => void;
    setRecent5kPace: (value: string) => void;
    setFixedRestDays: Dispatch<SetStateAction<WeekdayName[]>>;
    setGoalDistance: (value: GoalDistance) => void;
    setGoalStyle: (value: GoalStyle) => void;
    setTargetTime: (value: string) => void;
    setTargetDate: (value: string) => void;
    setTerrainFocus: (value: TerrainFocus) => void;
    setStrengthPreference: (value: StrengthPreference) => void;
    setComment: (value: string) => void;
  };
  constructorStatus: ConstructorStatus;
  constructorError: string | null;
  isBusy: boolean;
  isConstructorReady: boolean;
  onSubmit: () => void;
}

export function StructuredPlanConstructor({
  formRef,
  state,
  setState,
  constructorStatus,
  constructorError,
  isBusy,
  isConstructorReady,
  onSubmit,
}: StructuredPlanConstructorProps) {
  const runningDaysPerWeek = deriveRunningDaysPerWeek(state.fixedRestDays);
  const allowedRunningDayCount = WEEKDAY_OPTIONS.length - state.fixedRestDays.length;
  const showsTargetFields = state.goalStyle === "target_time";
  const showsTerrainSelector =
    state.goalDistance === "marathon" || state.goalDistance === "ultra_marathon";
  const impliedMountainTerrain = state.goalDistance === "mountain_running";

  return (
    <form
      ref={formRef}
      className="mt-8 grid gap-8 pb-28"
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!isConstructorReady || isBusy) {
          return;
        }

        onSubmit();
      }}
    >
      <ConstructorSection
        eyebrow="01"
        title="Profile basics"
        body="Required for first-plan generation. These are the only profile fields saved from this constructor."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Age">
            <input
              type="number"
              inputMode="numeric"
              min={13}
              max={100}
              step={1}
              required
              value={state.age}
              onChange={(event) => setState.setAge(event.target.value)}
              placeholder="34"
              className="hito-field hito-field-primary hito-field-md"
            />
          </Field>
          <Field label="Weight">
            <input
              type="number"
              inputMode="decimal"
              min={30}
              max={250}
              step={0.5}
              required
              value={state.weightKg}
              onChange={(event) => setState.setWeightKg(event.target.value)}
              placeholder="72.0"
              className="hito-field hito-field-primary hito-field-md"
            />
          </Field>
          <Field label="Height">
            <input
              type="number"
              inputMode="numeric"
              min={120}
              max={230}
              step={1}
              required
              value={state.heightCm}
              onChange={(event) => setState.setHeightCm(event.target.value)}
              placeholder="178"
              className="hito-field hito-field-primary hito-field-md"
            />
          </Field>
        </div>
      </ConstructorSection>

      <ConstructorSection
        eyebrow="02"
        title="Current fitness benchmark"
        body="Use one recent 5K signal if you know it. If not, Hito starts from availability and goal style."
      >
        <div className="grid gap-2">
          {BENCHMARK_OPTIONS.map((option) => (
            <OptionRow
              key={option.value}
              active={state.benchmarkKind === option.value}
              label={option.label}
              copy={option.copy}
              onClick={() => setState.setBenchmarkKind(option.value)}
            />
          ))}
        </div>

        {state.benchmarkKind === "recent_5k_time" && (
          <Field label="Recent 5K time" helper="Use a format like 25:00 or 1:02:30.">
            <input
              value={state.recent5kTime}
              onChange={(event) => setState.setRecent5kTime(event.target.value)}
              placeholder="25:00"
              className="hito-field hito-field-primary hito-field-md"
            />
          </Field>
        )}

        {state.benchmarkKind === "recent_5k_pace" && (
          <Field label="Recent 5K pace" helper="Use a format like 5:30/km.">
            <input
              value={state.recent5kPace}
              onChange={(event) => setState.setRecent5kPace(event.target.value)}
              placeholder="5:30/km"
              className="hito-field hito-field-primary hito-field-md"
            />
          </Field>
        )}
      </ConstructorSection>

      <ConstructorSection
        eyebrow="03"
        title="Availability"
        body="Mark fixed rest days only. Hito will fit a conservative first schedule around the available weekdays."
      >
        <Field
          label="Fixed rest days"
          helper={
            allowedRunningDayCount > 0
              ? `Hito will use up to ${runningDaysPerWeek} running days outside fixed rest days.`
              : "Leave at least one day available for running."
          }
        >
          <div className="grid grid-cols-7 gap-1.5 rounded-[1.25rem] bg-muted/20 p-1.5">
            {WEEKDAY_OPTIONS.map((weekday) => {
              const active = state.fixedRestDays.includes(weekday.value);
              return (
                <button
                  key={weekday.value}
                  type="button"
                  onClick={() => {
                    setState.setFixedRestDays((current) =>
                      active
                        ? current.filter((item) => item !== weekday.value)
                        : [...current, weekday.value],
                    );
                  }}
                  className={cn(
                    "hito-button hito-button-xs min-w-0 px-0",
                    active ? "hito-button-primary" : "hito-button-ghost",
                  )}
                  aria-pressed={active}
                  aria-label={`${weekday.value}${active ? " fixed rest day" : ""}`}
                >
                  {weekday.label}
                </button>
              );
            })}
          </div>
        </Field>
      </ConstructorSection>

      <ConstructorSection
        eyebrow="04"
        title="Goal"
        body="Pick the destination and tone. Target time only becomes required when you choose target-time style."
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

        {showsTargetFields ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Target time" helper="Required. Use 25:00 or 1:45:00.">
              <input
                value={state.targetTime}
                onChange={(event) => setState.setTargetTime(event.target.value)}
                placeholder="1:45:00"
                required
                className={cn(
                  "hito-field hito-field-primary hito-field-md",
                  !state.targetTime.trim() && "hito-field-feedback-error",
                )}
              />
            </Field>
            <Field label="Target date" helper="Optional. If used, choose at least 7 days out.">
              <input
                type="date"
                value={state.targetDate}
                onChange={(event) => setState.setTargetDate(event.target.value)}
                className="hito-field hito-field-primary hito-field-md"
              />
            </Field>
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
        title="Strength / mobility support"
        body="The running plan remains primary. This only allows simple support notes, not a detailed gym program."
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
        body="Supporting context only. Hito will not treat this as a free-text plan prompt."
      >
        <label className="grid gap-2">
          <span className="hito-form-label">Comment</span>
          <textarea
            rows={5}
            value={state.comment}
            onChange={(event) => setState.setComment(event.target.value)}
            placeholder="Right knee discomfort, avoid intensity, prefer mornings, conservative plan..."
            className="hito-field hito-field-secondary hito-textarea-md resize-y"
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
                Fixed rest days stay authoritative after the plan is created.
              </p>
            ) : null}
          </div>
          <button
            type="submit"
            disabled={isBusy || !isConstructorReady}
            className="hito-button hito-button-primary hito-button-lg shrink-0"
          >
            {constructorStatus === "saving"
              ? "Creating your plan..."
              : constructorStatus === "finishing"
                ? "Opening your plan..."
                : "Create plan"}
          </button>
        </div>
      </div>
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
    <section className="hito-section-divider grid gap-4 pt-6 lg:grid-cols-[220px_minmax(0,1fr)]">
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
