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
  const hasRestorablePreviousValue =
    previousValue != null &&
    Number.isFinite(previousValue) &&
    previousValue >= min &&
    previousValue <= max &&
    previousValue !== value;
  const previousProgress = hasRestorablePreviousValue ? (previousValue - min) / span : 0;
  const style = {
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
        <label className="hito-form-label" htmlFor={inputId}>
          {label}
        </label>
        <output
          className="hito-caption font-mono-num text-foreground/80"
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
        {hasRestorablePreviousValue ? (
          <button
            type="button"
            className="hito-slider-previous-marker"
            disabled={disabled}
            aria-label={previousValueLabel ?? `Restore previous value ${previousValue}`}
            onClick={() => onValueChange(previousValue)}
          />
        ) : null}
      </div>

      <div className="hito-slider-bounds hito-caption font-mono-num" aria-hidden="true">
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
