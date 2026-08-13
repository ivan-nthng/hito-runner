import { useId, type CSSProperties, type ReactNode } from "react";

import type { HitoFieldSize } from "@/components/ui/hito-control-contract";
import { cn } from "@/lib/utils";

export type HitoSliderProps = {
  ariaValueText?: string;
  className?: string;
  disabled?: boolean;
  helper?: ReactNode;
  id?: string;
  label: ReactNode;
  max: number;
  maxLabel?: ReactNode;
  min: number;
  minLabel?: ReactNode;
  markers?: readonly number[];
  onValueChange: (value: number) => void;
  previousValue?: number;
  previousValueLabel?: string;
  size?: HitoFieldSize;
  step?: number;
  value: number;
  valueLabel?: ReactNode;
};

export function HitoSlider({
  ariaValueText,
  className,
  disabled = false,
  helper,
  id,
  label,
  max,
  maxLabel,
  min,
  minLabel,
  markers = [],
  onValueChange,
  previousValue,
  previousValueLabel,
  size = "sm",
  step = 1,
  value,
  valueLabel,
}: HitoSliderProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = helper ? `${inputId}-helper` : undefined;
  const span = Math.max(max - min, Number.EPSILON);
  const valueProgress = (value - min) / span;
  const markerValues = [...new Set(markers)].filter(
    (marker) => Number.isFinite(marker) && marker >= min && marker <= max,
  );
  const hasRestorablePreviousValue =
    previousValue != null &&
    Number.isFinite(previousValue) &&
    previousValue >= min &&
    previousValue <= max &&
    previousValue !== value;
  const previousProgress = hasRestorablePreviousValue ? (previousValue - min) / span : 0;
  const style = {
    "--hito-slider-value": `${Math.min(Math.max(valueProgress, 0), 1) * 100}%`,
    "--hito-slider-previous": `${Math.min(Math.max(previousProgress, 0), 1) * 100}%`,
  } as CSSProperties;

  return (
    <div
      className={cn("hito-slider", `hito-slider-${size}`, className)}
      data-disabled={disabled || undefined}
      data-size={size}
      style={style}
    >
      <div className="hito-slider-header">
        <label className="hito-label-md" htmlFor={inputId}>
          {label}
        </label>
        <output
          className="hito-technical-sm text-foreground/80"
          htmlFor={inputId}
          aria-hidden="true"
        >
          {valueLabel ?? value}
        </output>
      </div>

      <div className="hito-slider-control">
        <div className="hito-slider-rail" aria-hidden="true" />
        <input
          id={inputId}
          className="hito-slider-input"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          aria-describedby={helperId}
          aria-valuetext={ariaValueText}
          onInput={(event) => onValueChange(event.currentTarget.valueAsNumber)}
        />
        <div className="hito-slider-visual-track" aria-hidden="true">
          {markerValues.map((marker) => (
            <span
              key={marker}
              className="hito-slider-marker"
              style={
                {
                  "--hito-slider-marker-position": `${((marker - min) / span) * 100}%`,
                } as CSSProperties
              }
            />
          ))}
          {hasRestorablePreviousValue ? (
            <span className="hito-slider-previous-marker-visual" />
          ) : null}
          <span className="hito-slider-handle" />
        </div>
        {hasRestorablePreviousValue ? (
          <div className="hito-slider-marker-actions">
            <button
              type="button"
              className="hito-slider-previous-marker"
              disabled={disabled}
              aria-label={previousValueLabel ?? `Restore previous value ${previousValue}`}
              onClick={() => onValueChange(previousValue)}
            />
          </div>
        ) : null}
      </div>

      <div className="hito-slider-bounds hito-technical-sm text-tertiary" aria-hidden="true">
        <span>{minLabel ?? min}</span>
        <span>{maxLabel ?? max}</span>
      </div>

      {helper ? (
        <p id={helperId} className="hito-field-helper">
          {helper}
        </p>
      ) : null}
    </div>
  );
}
