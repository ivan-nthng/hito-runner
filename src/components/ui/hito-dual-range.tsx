import {
  useId,
  useRef,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { cn } from "@/lib/utils";

export function HitoDualRange({
  className,
  disabled = false,
  invalid = false,
  max,
  maxLabel,
  maximumBounds,
  min,
  minLabel,
  minimumBounds,
  onMaxValueChange,
  onMinValueChange,
  step = 1,
  value,
}: {
  className?: string;
  disabled?: boolean;
  invalid?: boolean;
  max: number;
  maxLabel: string;
  maximumBounds?: readonly [number, number];
  min: number;
  minLabel: string;
  minimumBounds?: readonly [number, number];
  onMaxValueChange: (value: number) => void;
  onMinValueChange: (value: number) => void;
  step?: number;
  value: readonly [number, number];
}) {
  const minimumId = useId();
  const maximumId = useId();
  const minimumInputRef = useRef<HTMLInputElement>(null);
  const maximumInputRef = useRef<HTMLInputElement>(null);
  const activeRailPointerRef = useRef<{ handle: "minimum" | "maximum"; pointerId: number } | null>(
    null,
  );
  const span = Math.max(max - min, 1);
  const minimumPercent = ((value[0] - min) / span) * 100;
  const maximumPercent = ((value[1] - min) / span) * 100;
  const style = {
    "--hito-dual-range-start": `${Math.min(Math.max(minimumPercent, 0), 100)}%`,
    "--hito-dual-range-end": `${Math.min(Math.max(maximumPercent, 0), 100)}%`,
  } as CSSProperties;
  const resolvedMinimumBounds = minimumBounds ?? [min, value[1]];
  const resolvedMaximumBounds = maximumBounds ?? [value[0], max];

  const handleRangeKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
    handle: "minimum" | "maximum",
  ) => {
    const currentValue = handle === "minimum" ? value[0] : value[1];
    const bounds = handle === "minimum" ? resolvedMinimumBounds : resolvedMaximumBounds;
    const normalizedStep = step > 0 ? step : 1;
    const keyChange =
      event.key === "ArrowLeft" || event.key === "ArrowDown"
        ? -normalizedStep
        : event.key === "ArrowRight" || event.key === "ArrowUp"
          ? normalizedStep
          : event.key === "PageDown"
            ? -5 * normalizedStep
            : event.key === "PageUp"
              ? 5 * normalizedStep
              : null;
    const nextValue =
      event.key === "Home"
        ? bounds[0]
        : event.key === "End"
          ? bounds[1]
          : keyChange == null
            ? null
            : currentValue + keyChange;

    if (nextValue == null) {
      return;
    }

    event.preventDefault();
    const boundedValue = Math.min(Math.max(nextValue, bounds[0]), bounds[1]);
    if (handle === "minimum") {
      onMinValueChange(boundedValue);
    } else {
      onMaxValueChange(boundedValue);
    }
  };

  const valueAtPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const position = bounds.width > 0 ? (event.clientX - bounds.left) / bounds.width : 0;
    const boundedPosition = Math.min(Math.max(position, 0), 1);
    const normalizedStep = step > 0 ? step : 1;
    const stepCount = Math.round((boundedPosition * span) / normalizedStep);
    return Math.min(Math.max(min + stepCount * normalizedStep, min), max);
  };

  const updateHandleFromRail = (
    handle: "minimum" | "maximum",
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    const nextValue = valueAtPointer(event);
    if (handle === "minimum") {
      onMinValueChange(Math.min(nextValue, value[1]));
      minimumInputRef.current?.focus({ preventScroll: true });
      return;
    }

    onMaxValueChange(Math.max(nextValue, value[0]));
    maximumInputRef.current?.focus({ preventScroll: true });
  };

  const handleRailPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled || !event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) {
      return;
    }

    const nextValue = valueAtPointer(event);
    const handle =
      Math.abs(nextValue - value[0]) <= Math.abs(nextValue - value[1]) ? "minimum" : "maximum";
    activeRailPointerRef.current = { handle, pointerId: event.pointerId };
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    updateHandleFromRail(handle, event);
  };

  const handleRailPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const activePointer = activeRailPointerRef.current;
    if (!activePointer || activePointer.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    updateHandleFromRail(activePointer.handle, event);
  };

  const finishRailPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activeRailPointerRef.current?.pointerId !== event.pointerId) {
      return;
    }

    activeRailPointerRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div
      className={cn("hito-dual-range", className)}
      data-disabled={disabled || undefined}
      data-invalid={invalid || undefined}
      style={style}
    >
      <div
        className="hito-dual-range-rail"
        aria-hidden="true"
        onPointerDown={handleRailPointerDown}
        onPointerMove={handleRailPointerMove}
        onPointerUp={finishRailPointer}
        onPointerCancel={finishRailPointer}
        onLostPointerCapture={() => {
          activeRailPointerRef.current = null;
        }}
      >
        <span className="hito-dual-range-selection" />
      </div>
      <label className="sr-only" htmlFor={minimumId}>
        {minLabel}
      </label>
      <input
        ref={minimumInputRef}
        id={minimumId}
        className="hito-dual-range-input hito-dual-range-input-min"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value[0]}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-valuemin={resolvedMinimumBounds[0]}
        aria-valuemax={resolvedMinimumBounds[1]}
        aria-valuetext={`${value[0]} BPM`}
        onKeyDown={(event) => handleRangeKeyDown(event, "minimum")}
        onChange={(event) => onMinValueChange(Math.min(Number(event.target.value), value[1]))}
      />
      <label className="sr-only" htmlFor={maximumId}>
        {maxLabel}
      </label>
      <input
        ref={maximumInputRef}
        id={maximumId}
        className="hito-dual-range-input hito-dual-range-input-max"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value[1]}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-valuemin={resolvedMaximumBounds[0]}
        aria-valuemax={resolvedMaximumBounds[1]}
        aria-valuetext={`${value[1]} BPM`}
        onKeyDown={(event) => handleRangeKeyDown(event, "maximum")}
        onChange={(event) => onMaxValueChange(Math.max(Number(event.target.value), value[0]))}
      />
    </div>
  );
}
