import { useId, useRef, type KeyboardEvent } from "react";

import { useHitoProductMessage } from "@/components/ui/hito-ui-locale-provider";
import { cn } from "@/lib/utils";

type HitoCompoundRangeFieldProps = {
  className?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  lowerError?: string;
  lowerLabel: string;
  lowerValue: string;
  max: number;
  min: number;
  onLowerValueChange: (value: string) => void;
  onUpperValueChange: (value: string) => void;
  step?: number;
  unit: string;
  upperError?: string;
  upperLabel: string;
  upperValue: string;
};

export function HitoCompoundRangeField({
  className,
  disabled = false,
  error,
  label,
  lowerError,
  lowerLabel,
  lowerValue,
  max,
  min,
  onLowerValueChange,
  onUpperValueChange,
  step = 1,
  unit,
  upperError,
  upperLabel,
  upperValue,
}: HitoCompoundRangeFieldProps) {
  const message = useHitoProductMessage();
  const generatedId = useId();
  const visibleLabel = label?.trim() || undefined;
  const labelId = visibleLabel ? `${generatedId}-label` : undefined;
  const accessibleGroupLabel = message("{lowerLabel} to {upperLabel}, {unit}", {
    lowerLabel,
    upperLabel,
    unit,
  });
  const errorId = error ? `${generatedId}-error` : undefined;
  const focusedValueRef = useRef({ lower: lowerValue, upper: upperValue });

  const handleEndpointKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
    endpoint: "lower" | "upper",
  ) => {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      const currentValue = event.currentTarget.value.trim();
      if (/^\d+$/.test(currentValue)) {
        event.preventDefault();
        const direction = event.key === "ArrowUp" ? 1 : -1;
        const nextValue = Math.min(Math.max(Number(currentValue) + direction * step, min), max);
        if (endpoint === "lower") {
          onLowerValueChange(String(nextValue));
        } else {
          onUpperValueChange(String(nextValue));
        }
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      const initialValue = focusedValueRef.current[endpoint];
      if (endpoint === "lower") {
        onLowerValueChange(initialValue);
      } else {
        onUpperValueChange(initialValue);
      }
      return;
    }

    const endpointError = endpoint === "lower" ? lowerError : upperError;
    if (event.key === "Enter" && !endpointError) {
      event.preventDefault();
      event.currentTarget.blur();
    }
  };

  return (
    <div className={cn("hito-compound-range-field", className)}>
      {visibleLabel ? (
        <span id={labelId} className="hito-label-md">
          {visibleLabel}
        </span>
      ) : null}
      <div
        className="hito-field hito-field-secondary hito-compound-range-control"
        role="group"
        aria-labelledby={labelId}
        aria-label={labelId ? undefined : accessibleGroupLabel}
        data-disabled={disabled || undefined}
        data-invalid={Boolean(error) || undefined}
      >
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={step}
          value={lowerValue}
          disabled={disabled}
          aria-label={lowerLabel}
          aria-invalid={Boolean(lowerError) || undefined}
          aria-describedby={errorId}
          className="hito-field hito-field-secondary hito-field-sm hito-compound-range-input"
          onFocus={() => {
            focusedValueRef.current.lower = lowerValue;
          }}
          onChange={(event) => onLowerValueChange(event.target.value)}
          onKeyDown={(event) => handleEndpointKeyDown(event, "lower")}
        />
        <span
          className="hito-body-xs hito-compound-range-separator text-tertiary"
          aria-hidden="true"
        >
          –
        </span>
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={step}
          value={upperValue}
          disabled={disabled}
          aria-label={upperLabel}
          aria-invalid={Boolean(upperError) || undefined}
          aria-describedby={errorId}
          className="hito-field hito-field-secondary hito-field-sm hito-compound-range-input"
          onFocus={() => {
            focusedValueRef.current.upper = upperValue;
          }}
          onChange={(event) => onUpperValueChange(event.target.value)}
          onKeyDown={(event) => handleEndpointKeyDown(event, "upper")}
        />
        <span className="hito-body-xs hito-compound-range-unit text-tertiary" aria-hidden="true">
          {unit}
        </span>
      </div>
      {error ? (
        <span id={errorId} className="hito-field-error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
