import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";

type EditableValueInputMode = "numeric" | "decimal";

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
}: EditableValueChipProps<Key>) {
  const hasSavedValue = isEditableValueValid(value, { min, max, step });
  const rowRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isEditing = activeEditableKey === fieldKey;
  const [draftValue, setDraftValue] = useState(value);
  const canSave = isEditableValueValid(draftValue, { min, max, step });
  const saveValue = formatEditableValueDraft(draftValue);

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
          id={`editable-${label.toLowerCase().replace(/\s+/g, "-")}`}
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
