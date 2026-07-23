import { useEffect, useRef, useState, type FocusEvent, type KeyboardEvent } from "react";
import { Icon } from "@/components/ui/icon";

type EditableValueInputMode = "numeric" | "decimal";
type EditableSelectValueFieldOption = {
  label: string;
  value: string;
};

export type EditableValueFieldProps<Key extends string = string> = {
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
  demoState?: "hover" | "active" | "focus";
};

type EditableValueFieldLifecycleOptions<Key extends string> = {
  activeEditableKey: Key | null;
  fieldKey: Key;
  normalizeCommittedDraft: (draftValue: string) => string;
  selectContentsOnFocus?: boolean;
  setActiveEditableKey: (value: Key | null) => void;
  setValue: (value: string) => void;
  value: string;
};

function useEditableValueFieldLifecycle<
  Key extends string,
  Control extends HTMLInputElement | HTMLSelectElement,
>({
  activeEditableKey,
  fieldKey,
  normalizeCommittedDraft,
  selectContentsOnFocus = false,
  setActiveEditableKey,
  setValue,
  value,
}: EditableValueFieldLifecycleOptions<Key>) {
  const controlRef = useRef<Control>(null);
  const isEditing = activeEditableKey === fieldKey;
  const [draftValue, setDraftValue] = useState(value);

  useEffect(() => {
    if (!isEditing) {
      setDraftValue(value);
    }
  }, [isEditing, value]);

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    controlRef.current?.focus();
    if (selectContentsOnFocus && controlRef.current instanceof HTMLInputElement) {
      controlRef.current.select();
    }
  }, [isEditing, selectContentsOnFocus]);

  function openEditing() {
    setDraftValue(value);
    setActiveEditableKey(fieldKey);
  }

  function commitDraft(nextActiveKey: Key | null = null) {
    if (draftValue.trim()) {
      setValue(normalizeCommittedDraft(draftValue));
    } else {
      setDraftValue(value);
    }

    setActiveEditableKey(nextActiveKey);
  }

  function commitValidDraft(canCommit: boolean) {
    if (!canCommit) {
      return;
    }

    setValue(normalizeCommittedDraft(draftValue));
    setActiveEditableKey(null);
  }

  function cancelEditing() {
    setDraftValue(value);
    setActiveEditableKey(null);
  }

  function clearValue(onClear?: () => void) {
    setDraftValue("");
    onClear?.();
    setValue("");
    setActiveEditableKey(null);
  }

  function handleFrameBlur(event: FocusEvent<HTMLDivElement>) {
    const nextTarget = event.relatedTarget;

    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
      return;
    }

    const nextEditableKey =
      nextTarget instanceof HTMLElement
        ? nextTarget.closest<HTMLElement>("[data-editable-value-key]")?.dataset.editableValueKey
        : undefined;

    commitDraft((nextEditableKey as Key | undefined) ?? null);
  }

  function handleControlKeyDown(event: KeyboardEvent<Control>, canCommit: boolean) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitValidDraft(canCommit);
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancelEditing();
    }
  }

  return {
    clearValue,
    commitValidDraft,
    controlRef,
    draftValue,
    handleControlKeyDown,
    handleFrameBlur,
    isEditing,
    openEditing,
    setDraftValue,
  };
}

export function EditableValueField<Key extends string = string>({
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
}: EditableValueFieldProps<Key>) {
  const hasValue = value.trim().length > 0;
  const hasSavedValue = isEditableValueValid(value, { min, max, step });
  const hasInvalidValue = hasValue && !hasSavedValue;
  const lifecycle = useEditableValueFieldLifecycle<Key, HTMLInputElement>({
    activeEditableKey,
    fieldKey,
    normalizeCommittedDraft: (draftValue) =>
      isEditableValueValid(draftValue, { min, max, step })
        ? formatEditableValueDraft(draftValue)
        : draftValue,
    selectContentsOnFocus: true,
    setActiveEditableKey,
    setValue,
    value,
  });
  const { draftValue, isEditing, setDraftValue } = lifecycle;
  const hasDraftValue = draftValue.trim().length > 0;
  const canSave = isEditableValueValid(draftValue, { min, max, step });
  const hasInvalidDraft = hasDraftValue && !canSave;
  const fieldId = `editable-${String(fieldKey)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")}`;
  const errorId = `${fieldId}-error`;

  if (!isEditing) {
    return (
      <div className="hito-editable-value-field-frame" data-hito-component="editable-value-field">
        <button
          type="button"
          aria-label={
            hasInvalidValue
              ? `Edit ${label.toLowerCase()}, invalid value ${value}`
              : hasSavedValue
                ? `Edit ${label.toLowerCase()}`
                : `Add ${label.toLowerCase()}`
          }
          onClick={lifecycle.openEditing}
          className="hito-button hito-button-secondary hito-button-sm hito-editable-value-field"
          data-editable-value-key={fieldKey}
          data-demo-state={demoState}
          data-state={hasSavedValue ? "saved" : hasInvalidValue ? "invalid" : "empty"}
          data-tone={hasInvalidValue ? "error" : undefined}
          aria-invalid={hasInvalidValue || undefined}
        >
          {!hasValue ? (
            <Icon name="plus" size="sm" className="hito-editable-value-field-icon" />
          ) : null}
          <span className="hito-editable-value-field-content">
            {hasValue ? (
              <>
                <span className="hito-micro-label hito-editable-value-field-label">{label}</span>
                <span className="hito-editable-value-field-text">
                  {value}
                  {unit ? ` ${unit}` : ""}
                </span>
              </>
            ) : (
              <span>{label}</span>
            )}
          </span>
          {hasInvalidValue ? (
            <Icon name="warning" size="sm" className="hito-editable-value-field-icon" />
          ) : hasValue ? (
            <Icon
              name="edit"
              size="sm"
              className="hito-editable-value-field-icon hito-editable-value-field-edit-icon"
            />
          ) : null}
        </button>
      </div>
    );
  }

  return (
    <div
      className="hito-editable-value-field-frame"
      data-hito-component="editable-value-field"
      data-state="editing"
      data-invalid={hasInvalidDraft || undefined}
      onBlur={lifecycle.handleFrameBlur}
    >
      <div className="hito-editable-value-field-input-shell">
        <input
          ref={lifecycle.controlRef}
          id={fieldId}
          type="text"
          inputMode={inputMode}
          required
          value={draftValue}
          onChange={(event) =>
            setDraftValue(sanitizeEditableValueDraft(event.target.value, inputMode))
          }
          onKeyDown={(event) => lifecycle.handleControlKeyDown(event, canSave)}
          aria-label={label}
          aria-invalid={hasInvalidDraft || undefined}
          aria-describedby={hasInvalidDraft ? errorId : undefined}
          placeholder={placeholder}
          className={`hito-field hito-field-secondary hito-field-sm hito-field-has-right-icon hito-editable-value-field-input ${
            hasInvalidDraft ? "hito-field-feedback-error" : ""
          }`}
        />
        {hasDraftValue || hasValue ? (
          <button
            type="button"
            className="hito-button hito-button-ghost hito-button-xs hito-button-icon hito-editable-value-field-clear"
            onClick={() => lifecycle.clearValue()}
            aria-label={`Clear ${label.toLowerCase()}`}
          >
            <Icon name="close" size="xs" />
          </button>
        ) : null}
      </div>
      <button
        type="button"
        disabled={!canSave}
        onClick={() => lifecycle.commitValidDraft(canSave)}
        className="hito-button hito-button-primary hito-button-sm hito-button-icon"
        aria-label={`Save ${label.toLowerCase()}`}
      >
        <Icon name="check" size="xs" />
      </button>
      {hasInvalidDraft ? (
        <span id={errorId} className="hito-editable-value-field-error" role="alert">
          {editableValueErrorMessage({ min, max, step, unit })}
        </span>
      ) : null}
    </div>
  );
}

export function EditableSelectValueField<Key extends string = string>({
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
  options: EditableSelectValueFieldOption[];
  setActiveEditableKey: (value: Key | null) => void;
  setValue: (value: string) => void;
  value: string;
}) {
  const hasSavedValue = value.trim().length > 0;
  const lifecycle = useEditableValueFieldLifecycle<Key, HTMLSelectElement>({
    activeEditableKey,
    fieldKey,
    normalizeCommittedDraft: (draftValue) => draftValue,
    setActiveEditableKey,
    setValue,
    value,
  });
  const { draftValue, isEditing, setDraftValue } = lifecycle;
  const displayValue = editableSelectValueLabel(value, options);

  if (!isEditing) {
    return (
      <div className="hito-editable-value-field-frame" data-hito-component="editable-value-field">
        <button
          type="button"
          aria-label={hasSavedValue ? `Edit ${label.toLowerCase()} result` : emptyLabel}
          onClick={lifecycle.openEditing}
          className="hito-button hito-button-secondary hito-button-sm hito-editable-value-field"
          data-editable-value-key={fieldKey}
          data-state={hasSavedValue ? "saved" : "empty"}
        >
          {!hasSavedValue ? (
            <Icon name="plus" size="sm" className="hito-editable-value-field-icon" />
          ) : null}
          <span className="hito-editable-value-field-content">
            {hasSavedValue ? (
              <>
                <span className="hito-micro-label hito-editable-value-field-label">{label}</span>
                <span className="hito-editable-value-field-text">{displayValue}</span>
              </>
            ) : (
              <span>{emptyLabel}</span>
            )}
          </span>
          {hasSavedValue ? (
            <Icon
              name="edit"
              size="sm"
              className="hito-editable-value-field-icon hito-editable-value-field-edit-icon"
            />
          ) : null}
        </button>
      </div>
    );
  }

  const canSave = draftValue.trim().length > 0;
  return (
    <div
      className="hito-editable-value-field-frame"
      data-hito-component="editable-value-field"
      data-state="editing"
      onBlur={lifecycle.handleFrameBlur}
    >
      <div className="hito-editable-value-field-input-shell hito-editable-value-field-select-shell">
        <select
          ref={lifecycle.controlRef}
          id={`editable-${label.toLowerCase().replace(/\s+/g, "-")}`}
          required
          value={draftValue}
          onChange={(event) => setDraftValue(event.target.value)}
          onKeyDown={(event) => lifecycle.handleControlKeyDown(event, canSave)}
          aria-label={label}
          className="hito-field hito-field-secondary hito-field-sm hito-field-has-right-icon hito-editable-value-field-input hito-editable-value-field-select"
        >
          {options.map((option) => (
            <option key={option.value || option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {draftValue.trim().length > 0 || hasSavedValue ? (
          <button
            type="button"
            onClick={() => lifecycle.clearValue(onClear)}
            className="hito-button hito-button-ghost hito-button-xs hito-button-icon hito-editable-value-field-clear"
            aria-label={`Clear ${label.toLowerCase()} result`}
          >
            <Icon name="close" size="xs" />
          </button>
        ) : null}
      </div>
      <button
        type="button"
        disabled={!canSave}
        onClick={() => lifecycle.commitValidDraft(canSave)}
        className="hito-button hito-button-primary hito-button-sm hito-button-icon"
        aria-label={`Save ${label.toLowerCase()} result`}
      >
        <Icon name="check" size="xs" />
      </button>
    </div>
  );
}

function editableSelectValueLabel(value: string, options: EditableSelectValueFieldOption[]) {
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
