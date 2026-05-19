import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type RefObject,
  type SetStateAction,
} from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import {
  BENCHMARK_OPTIONS,
  GOAL_DISTANCE_OPTIONS,
  GOAL_STYLE_OPTIONS,
  ONBOARDING_TEXTAREA_CLASS,
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
type ProfileBasicEditableKey = "age" | "heightCm" | "weightKg";

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
  const [activeEditableKey, setActiveEditableKey] = useState<ProfileBasicEditableKey | null>(null);

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
        title="Current running"
        body="Share a recent 5K signal if you know it."
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
        title="Your week"
        body="Mark the days you want to keep as rest days."
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
                    active ? "hito-button-primary" : "hito-button-secondary",
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

      <div className="hito-onboarding-submit-footer">
        <div className="hito-onboarding-submit-footer-inner">
          <div className="min-w-0">
            {constructorError ? <p className="hito-field-error">{constructorError}</p> : null}
            {constructorStatus === "finishing" ? (
              <p className="hito-field-success">Your plan is ready. Opening it now...</p>
            ) : null}
            {!constructorError && constructorStatus !== "finishing" ? (
              <p className="hito-field-helper max-w-xl">
                Add the required chips to create your plan.
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

function EditableValueChip({
  fieldKey,
  label,
  value,
  setValue,
  activeEditableKey,
  setActiveEditableKey,
  placeholder,
  min,
  max,
  step,
  inputMode,
  unit,
}: {
  fieldKey: ProfileBasicEditableKey;
  label: string;
  value: string;
  setValue: (value: string) => void;
  activeEditableKey: ProfileBasicEditableKey | null;
  setActiveEditableKey: (value: ProfileBasicEditableKey | null) => void;
  placeholder: string;
  min: number;
  max: number;
  step: number;
  inputMode: "numeric" | "decimal";
  unit?: string;
}) {
  const hasSavedValue = isProfileBasicValueValid(value, { min, max, step });
  const rowRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isEditing = activeEditableKey === fieldKey;
  const [draftValue, setDraftValue] = useState(value);
  const canSave = isProfileBasicValueValid(draftValue, { min, max, step });
  const saveValue = formatProfileBasicDraft(draftValue);

  useEffect(() => {
    if (!isEditing) {
      setDraftValue(value);
    }
  }, [isEditing, value]);

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (target instanceof Node && rowRef.current?.contains(target)) {
        return;
      }

      setDraftValue(value);
      setActiveEditableKey(null);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isEditing, setActiveEditableKey, value]);

  if (!isEditing) {
    return (
      <div ref={rowRef} className="hito-editable-value-chip-frame">
        <button
          type="button"
          aria-label={hasSavedValue ? `Edit ${label.toLowerCase()}` : `Add ${label.toLowerCase()}`}
          onClick={() => {
            setDraftValue(value);
            setActiveEditableKey(fieldKey);
          }}
          className="hito-editable-value-chip"
          data-state={hasSavedValue ? "saved" : "empty"}
        >
          {!hasSavedValue ? (
            <Icon name="plus" size="sm" className="hito-editable-value-chip-icon" />
          ) : null}
          <span className="hito-editable-value-chip-content">
            {hasSavedValue ? (
              <>
                <span className="hito-editable-value-chip-label">{label}</span>
                <span className="hito-editable-value-chip-text">
                  {value}
                  {unit ? ` ${unit}` : ""}
                </span>
              </>
            ) : (
              <span>{label}</span>
            )}
          </span>
          {hasSavedValue ? (
            <Icon
              name="edit"
              size="sm"
              className="hito-editable-value-chip-icon hito-editable-value-chip-edit-icon"
            />
          ) : null}
        </button>
      </div>
    );
  }

  return (
    <div ref={rowRef} className="hito-editable-value-chip-frame" data-state="editing">
      <div className="hito-editable-value-chip-input-shell">
        <input
          ref={inputRef}
          id={`profile-${label.toLowerCase()}`}
          type="text"
          inputMode={inputMode}
          required
          value={draftValue}
          onChange={(event) =>
            setDraftValue(sanitizeProfileBasicDraft(event.target.value, inputMode))
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
            }
          }}
          aria-label={label}
          placeholder={placeholder}
          className="hito-editable-value-chip-input"
        />
        {draftValue ? (
          <button
            type="button"
            className="hito-editable-value-chip-clear"
            onClick={() => {
              setDraftValue("");
              window.requestAnimationFrame(() => inputRef.current?.focus());
            }}
            aria-label={`Clear ${label.toLowerCase()}`}
          >
            <Icon name="close" size="xs" />
          </button>
        ) : null}
      </div>
      {canSave ? (
        <button
          type="button"
          onClick={() => {
            setValue(saveValue);
            setActiveEditableKey(null);
          }}
          className="hito-editable-value-chip-action"
          data-action="save"
          aria-label={`Save ${label.toLowerCase()}`}
        >
          <Icon name="check" size="sm" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            setDraftValue(value);
            setActiveEditableKey(null);
          }}
          className="hito-editable-value-chip-action"
          data-action="cancel"
          aria-label={`Cancel ${label.toLowerCase()} edit`}
        >
          <Icon name="close" size="sm" />
        </button>
      )}
    </div>
  );
}

function sanitizeProfileBasicDraft(rawValue: string, inputMode: "numeric" | "decimal") {
  if (inputMode === "numeric") {
    return rawValue.replace(/\D/g, "");
  }

  const normalized = rawValue.replace(",", ".");
  const [integerPart = "", ...decimalParts] = normalized.split(".");
  const integerDigits = integerPart.replace(/\D/g, "");
  const decimalDigits = decimalParts.join("").replace(/\D/g, "");

  if (normalized.includes(".")) {
    return `${integerDigits}.${decimalDigits}`;
  }

  return integerDigits;
}

function formatProfileBasicDraft(rawValue: string) {
  const parsed = Number(rawValue);

  if (!Number.isFinite(parsed)) {
    return rawValue.trim();
  }

  return String(parsed);
}

function isProfileBasicValueValid(
  rawValue: string,
  { min, max, step }: { min: number; max: number; step: number },
) {
  const value = Number(rawValue);

  if (!rawValue.trim() || !Number.isFinite(value) || value < min || value > max) {
    return false;
  }

  const nearestStep = Math.round(value / step) * step;
  return Math.abs(nearestStep - value) < 0.000001;
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
