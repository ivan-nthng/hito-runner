import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";

type EditableValueInputMode = "numeric" | "decimal";
type EditableSelectValueChipOption = {
  label: string;
  value: string;
};

export type EditableValueChipProps<Key extends string = string> = {
  fieldKey: Key;
  label: string;
  value: string;
  setValue: (value: string) => void;
  activeEditableKey: Key | null;
  setActiveEditableKey: (value: Key | null) => void;
  placeholder: string;
  min: number;
  max: number;
  step: number;
  inputMode: EditableValueInputMode;
  unit?: string;
  demoState?: "hover";
};

export function EditableValueChip<Key extends string = string>({
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
  demoState,
}: EditableValueChipProps<Key>) {
  const hasValue = value.trim().length > 0;
  const hasSavedValue = isEditableValueValid(value, { min, max, step });
  const hasInvalidValue = hasValue && !hasSavedValue;
  const inputRef = useRef<HTMLInputElement>(null);
  const isEditing = activeEditableKey === fieldKey;
  const [draftValue, setDraftValue] = useState(value);
  const hasDraftValue = draftValue.trim().length > 0;
  const canSave = isEditableValueValid(draftValue, { min, max, step });
  const hasInvalidDraft = hasDraftValue && !canSave;
  const saveValue = formatEditableValueDraft(draftValue);
  const fieldId = `editable-${String(fieldKey)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")}`;
  const errorId = `${fieldId}-error`;

  function finishEditing(nextActiveKey: Key | null = null) {
    if (canSave) {
      setValue(saveValue);
    } else if (hasDraftValue) {
      setValue(draftValue);
    } else {
      setDraftValue(value);
    }

    setActiveEditableKey(nextActiveKey);
  }

  function cancelEditing() {
    setDraftValue(value);
    setActiveEditableKey(null);
  }

  function clearValue() {
    setDraftValue("");
    setValue("");
    setActiveEditableKey(null);
  }

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

  if (!isEditing) {
    return (
      <div className="hito-editable-value-chip-frame">
        <button
          type="button"
          aria-label={
            hasInvalidValue
              ? `Edit ${label.toLowerCase()}, invalid value ${value}`
              : hasSavedValue
                ? `Edit ${label.toLowerCase()}`
                : `Add ${label.toLowerCase()}`
          }
          onClick={() => {
            setDraftValue(value);
            setActiveEditableKey(fieldKey);
          }}
          className="hito-editable-value-chip"
          data-editable-value-key={fieldKey}
          data-demo-state={demoState}
          data-state={hasSavedValue ? "saved" : hasInvalidValue ? "invalid" : "empty"}
          aria-invalid={hasInvalidValue || undefined}
        >
          {!hasValue ? (
            <Icon name="plus" size="sm" className="hito-editable-value-chip-icon" />
          ) : null}
          <span className="hito-editable-value-chip-content">
            {hasValue ? (
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
          {hasInvalidValue ? (
            <Icon name="warning" size="sm" className="hito-editable-value-chip-icon" />
          ) : hasValue ? (
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
    <div
      className="hito-editable-value-chip-frame"
      data-state="editing"
      data-invalid={hasInvalidDraft || undefined}
      onBlur={(event) => {
        const nextTarget = event.relatedTarget;

        if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
          return;
        }

        const nextEditableKey =
          nextTarget instanceof HTMLElement
            ? nextTarget.closest<HTMLElement>("[data-editable-value-key]")?.dataset.editableValueKey
            : undefined;

        finishEditing((nextEditableKey as Key | undefined) ?? null);
      }}
    >
      <div className="hito-editable-value-chip-input-shell">
        <input
          ref={inputRef}
          id={fieldId}
          type="text"
          inputMode={inputMode}
          required
          value={draftValue}
          onChange={(event) =>
            setDraftValue(sanitizeEditableValueDraft(event.target.value, inputMode))
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();

              if (canSave) {
                setValue(saveValue);
                setActiveEditableKey(null);
              }
            } else if (event.key === "Escape") {
              event.preventDefault();
              cancelEditing();
            }
          }}
          aria-label={label}
          aria-invalid={hasInvalidDraft || undefined}
          aria-describedby={hasInvalidDraft ? errorId : undefined}
          placeholder={placeholder}
          className="hito-editable-value-chip-input"
        />
        {hasDraftValue || hasValue ? (
          <button
            type="button"
            className="hito-editable-value-chip-clear"
            onClick={clearValue}
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
          onClick={cancelEditing}
          className="hito-editable-value-chip-action"
          data-action="cancel"
          aria-label={`Cancel ${label.toLowerCase()} edit`}
        >
          <Icon name="close" size="sm" />
        </button>
      )}
      {hasInvalidDraft ? (
        <span id={errorId} className="hito-editable-value-chip-error" role="alert">
          {editableValueErrorMessage({ min, max, step, unit })}
        </span>
      ) : null}
    </div>
  );
}

export function EditableSelectValueChip<Key extends string = string>({
  activeEditableKey,
  emptyLabel,
  fieldKey,
  label,
  onClear,
  options,
  setActiveEditableKey,
  setValue,
  value,
}: {
  activeEditableKey: Key | null;
  emptyLabel: string;
  fieldKey: Key;
  label: string;
  onClear?: () => void;
  options: EditableSelectValueChipOption[];
  setActiveEditableKey: (value: Key | null) => void;
  setValue: (value: string) => void;
  value: string;
}) {
  const hasSavedValue = value.trim().length > 0;
  const rowRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  const isEditing = activeEditableKey === fieldKey;
  const [draftValue, setDraftValue] = useState(value);
  const displayValue = editableSelectValueLabel(value, options);

  useEffect(() => {
    if (!isEditing) {
      setDraftValue(value);
    }
  }, [isEditing, value]);

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    selectRef.current?.focus();
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
          aria-label={hasSavedValue ? `Edit ${label.toLowerCase()} result` : emptyLabel}
          onClick={() => {
            setDraftValue(value);
            setActiveEditableKey(fieldKey);
          }}
          className="hito-editable-value-chip"
          data-editable-value-key={fieldKey}
          data-state={hasSavedValue ? "saved" : "empty"}
        >
          {!hasSavedValue ? (
            <Icon name="plus" size="sm" className="hito-editable-value-chip-icon" />
          ) : null}
          <span className="hito-editable-value-chip-content">
            {hasSavedValue ? (
              <>
                <span className="hito-editable-value-chip-label">{label}</span>
                <span className="hito-editable-value-chip-text">{displayValue}</span>
              </>
            ) : (
              <span>{emptyLabel}</span>
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

  const canSave = draftValue.trim().length > 0;
  const canClear = hasSavedValue && !canSave;

  return (
    <div ref={rowRef} className="hito-editable-value-chip-frame" data-state="editing">
      <div className="hito-editable-value-chip-input-shell">
        <select
          ref={selectRef}
          id={`editable-${label.toLowerCase().replace(/\s+/g, "-")}`}
          required
          value={draftValue}
          onChange={(event) => setDraftValue(event.target.value)}
          aria-label={label}
          className="hito-editable-value-chip-input"
        >
          {options.map((option) => (
            <option key={option.value || option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {canSave ? (
        <button
          type="button"
          onClick={() => {
            setValue(draftValue);
            setActiveEditableKey(null);
          }}
          className="hito-editable-value-chip-action"
          data-action="save"
          aria-label={`Save ${label.toLowerCase()} result`}
        >
          <Icon name="check" size="sm" />
        </button>
      ) : canClear ? (
        <button
          type="button"
          onClick={() => {
            onClear?.();
            setValue("");
            setActiveEditableKey(null);
          }}
          className="hito-editable-value-chip-action"
          data-action="cancel"
          aria-label={`Clear ${label.toLowerCase()} result`}
        >
          <Icon name="close" size="sm" />
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
          aria-label={`Cancel ${label.toLowerCase()} result edit`}
        >
          <Icon name="close" size="sm" />
        </button>
      )}
    </div>
  );
}

function editableSelectValueLabel(value: string, options: EditableSelectValueChipOption[]) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function sanitizeEditableValueDraft(rawValue: string, inputMode: EditableValueInputMode) {
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

function formatEditableValueDraft(rawValue: string) {
  const parsed = Number(rawValue);

  if (!Number.isFinite(parsed)) {
    return rawValue.trim();
  }

  return String(parsed);
}

function isEditableValueValid(
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

function editableValueErrorMessage({
  min,
  max,
  step,
  unit,
}: {
  min: number;
  max: number;
  step: number;
  unit?: string;
}) {
  const unitSuffix = unit ? ` ${unit}` : "";

  if (step === 1) {
    return `Use a whole number from ${min} to ${max}${unitSuffix}.`;
  }

  return `Use ${min} to ${max}${unitSuffix} in ${step} increments.`;
}
