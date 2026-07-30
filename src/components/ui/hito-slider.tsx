import { useId, type CSSProperties, type ReactNode } from "react";

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
  step = 1,
  value,
  valueLabel,
}: HitoSliderProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = helper ? `${inputId}-helper` : undefined;
  const progress = Math.min(Math.max((value - min) / Math.max(max - min, Number.EPSILON), 0), 1);
  const style = {
    "--hito-slider-progress": `${progress * 100}%`,
  } as CSSProperties;

  return (
    <div
      className={cn("hito-slider", className)}
      data-disabled={disabled || undefined}
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
        <div className="hito-slider-rail" aria-hidden="true">
          <span className="hito-slider-fill" />
        </div>
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
