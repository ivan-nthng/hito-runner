import type { ManualWorkoutBlockInput } from "@/lib/manual-workout-authoring/schema";

type ManualWorkoutTargetInput = NonNullable<ManualWorkoutBlockInput["target"]>;

type ManualWorkoutTargetMode = "none" | "pace_exact" | "pace_range" | "hr_cap" | "hr_range" | "rpe";

const USER_ENTERED_TARGET_SOURCE = "user_entered" as const;

const TARGET_MODE_OPTIONS: Array<{ label: string; value: ManualWorkoutTargetMode }> = [
  { label: "No target", value: "none" },
  { label: "Pace", value: "pace_exact" },
  { label: "Pace range", value: "pace_range" },
  { label: "HR cap", value: "hr_cap" },
  { label: "HR range", value: "hr_range" },
  { label: "RPE", value: "rpe" },
];

export function ManualWorkoutTargetFields({
  block,
  disabled,
  onChange,
  roleLabel,
}: {
  block: ManualWorkoutBlockInput;
  disabled: boolean;
  onChange: (block: ManualWorkoutBlockInput) => void;
  roleLabel: string;
}) {
  const mode = targetModeForBlock(block);

  return (
    <div className="grid gap-3">
      <div className="grid gap-2">
        <span className="hito-form-label">Target</span>
        <TargetModeToggle
          disabled={disabled}
          label={roleLabel}
          onChange={(nextMode) => onChange(blockForTargetMode(block, nextMode))}
          value={mode}
        />
      </div>

      {mode === "pace_exact" ? (
        <TargetTextField
          disabled={disabled}
          helper="Use min/km, for example 5:10/km."
          label="Your pace target"
          onChange={(value) =>
            onChange({
              ...block,
              target: {
                targetSource: USER_ENTERED_TARGET_SOURCE,
                paceTargetSource: USER_ENTERED_TARGET_SOURCE,
                pace: value,
              },
            })
          }
          placeholder="5:10/km"
          value={block.target?.pace ?? ""}
        />
      ) : null}

      {mode === "pace_range" ? (
        <TargetTextField
          disabled={disabled}
          helper="Use a min/km range, for example 5:10-5:25/km."
          label="Your pace target"
          onChange={(value) =>
            onChange({
              ...block,
              target: {
                targetSource: USER_ENTERED_TARGET_SOURCE,
                paceTargetSource: USER_ENTERED_TARGET_SOURCE,
                paceMinPerKmRange: value,
              },
            })
          }
          placeholder="5:10-5:25/km"
          value={block.target?.paceMinPerKmRange ?? ""}
        />
      ) : null}

      {mode === "hr_cap" ? (
        <TargetTextField
          disabled={disabled}
          helper="Use an integer bpm cap, for example 155."
          inputMode="numeric"
          label="Your heart-rate target"
          onChange={(value) =>
            onChange({
              ...block,
              target: {
                targetSource: USER_ENTERED_TARGET_SOURCE,
                hrTargetSource: USER_ENTERED_TARGET_SOURCE,
                hrBpmCap: value,
              },
            })
          }
          placeholder="155"
          value={block.target?.hrBpmCap == null ? "" : String(block.target.hrBpmCap)}
        />
      ) : null}

      {mode === "hr_range" ? (
        <TargetTextField
          disabled={disabled}
          helper="Use an integer bpm range, for example 145-155 bpm."
          label="Your heart-rate target"
          onChange={(value) =>
            onChange({
              ...block,
              target: {
                targetSource: USER_ENTERED_TARGET_SOURCE,
                hrTargetSource: USER_ENTERED_TARGET_SOURCE,
                hrBpmRange: value,
              },
            })
          }
          placeholder="145-155 bpm"
          value={block.target?.hrBpmRange ?? ""}
        />
      ) : null}

      {mode === "rpe" ? (
        <div className="grid gap-3">
          <TargetTextField
            disabled={disabled}
            helper="Use the 0-10 perceived-effort scale."
            inputMode="decimal"
            label="Effort (RPE 0-10)"
            onChange={(value) =>
              onChange({
                ...block,
                target: {
                  ...rpeTargetBase(block.target),
                  rpe: value,
                },
              })
            }
            placeholder="6"
            value={block.target?.rpe == null ? "" : String(block.target.rpe)}
          />
          <TargetTextField
            disabled={disabled}
            helper="Optional runner-facing label for this effort."
            label="Effort label"
            onChange={(value) =>
              onChange({
                ...block,
                target: {
                  ...rpeTargetBase(block.target),
                  label: value || undefined,
                },
              })
            }
            placeholder="Controlled effort"
            value={block.target?.label ?? ""}
          />
          <TargetTextField
            disabled={disabled}
            helper="Optional runner-facing cue for this effort."
            label="Effort cue"
            onChange={(value) =>
              onChange({
                ...block,
                target: {
                  ...rpeTargetBase(block.target),
                  cue: value || undefined,
                },
              })
            }
            placeholder="Controlled but working"
            value={block.target?.cue ?? ""}
          />
        </div>
      ) : null}
    </div>
  );
}

function TargetModeToggle({
  disabled,
  label,
  onChange,
  value,
}: {
  disabled: boolean;
  label: string;
  onChange: (value: ManualWorkoutTargetMode) => void;
  value: ManualWorkoutTargetMode;
}) {
  return (
    <div
      className="hito-choice-toggle-group flex flex-wrap"
      role="radiogroup"
      aria-label={`${label} target`}
    >
      {TARGET_MODE_OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            className="hito-choice-toggle hito-choice-toggle-sm"
            aria-checked={selected}
            aria-disabled={disabled || undefined}
            data-selected={selected}
            disabled={disabled}
            role="radio"
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function TargetTextField({
  disabled,
  helper,
  inputMode,
  label,
  onChange,
  placeholder,
  value,
}: {
  disabled: boolean;
  helper: string;
  inputMode?: "decimal" | "numeric";
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="hito-form-label">{label}</span>
      <input
        className="hito-field hito-field-secondary hito-field-sm"
        disabled={disabled}
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
      <span className="hito-field-helper">{helper}</span>
    </label>
  );
}

function targetModeForBlock(block: ManualWorkoutBlockInput): ManualWorkoutTargetMode {
  const target = block.target;

  if (!target) return "none";
  if (target.pace !== undefined) return "pace_exact";
  if (target.paceMinPerKmRange !== undefined) return "pace_range";
  if (target.hrBpmCap !== undefined) return "hr_cap";
  if (target.hrBpmRange !== undefined) return "hr_range";
  if (target.rpe !== undefined || target.intensity !== undefined) return "rpe";

  return "none";
}

function blockForTargetMode(
  block: ManualWorkoutBlockInput,
  mode: ManualWorkoutTargetMode,
): ManualWorkoutBlockInput {
  if (mode === "none") {
    return {
      ...block,
      target: undefined,
    };
  }

  if (mode === "pace_exact") {
    return {
      ...block,
      target: {
        targetSource: USER_ENTERED_TARGET_SOURCE,
        paceTargetSource: USER_ENTERED_TARGET_SOURCE,
        pace: "",
      },
    };
  }

  if (mode === "pace_range") {
    return {
      ...block,
      target: {
        targetSource: USER_ENTERED_TARGET_SOURCE,
        paceTargetSource: USER_ENTERED_TARGET_SOURCE,
        paceMinPerKmRange: "",
      },
    };
  }

  if (mode === "hr_cap") {
    return {
      ...block,
      target: {
        targetSource: USER_ENTERED_TARGET_SOURCE,
        hrTargetSource: USER_ENTERED_TARGET_SOURCE,
        hrBpmCap: "",
      },
    };
  }

  if (mode === "hr_range") {
    return {
      ...block,
      target: {
        targetSource: USER_ENTERED_TARGET_SOURCE,
        hrTargetSource: USER_ENTERED_TARGET_SOURCE,
        hrBpmRange: "",
      },
    };
  }

  return {
    ...block,
    target: rpeTargetBase(block.target),
  };
}

function rpeTargetBase(target: ManualWorkoutTargetInput | undefined): ManualWorkoutTargetInput {
  return {
    targetSource: USER_ENTERED_TARGET_SOURCE,
    rpe: target?.rpe ?? "",
    ...(target?.label ? { label: target.label } : {}),
    ...(target?.cue ? { cue: target.cue } : {}),
  };
}
