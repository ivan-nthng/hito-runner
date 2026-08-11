import { useState } from "react";

import { HitoDsPlayground } from "@/components/hito-ds/playground";
import { ProductLinks } from "@/components/hito-ds/reference";
import { HitoChoiceToggle } from "@/components/ui/hito-choice-toggle";
import { HITO_FIELD_SIZES, type HitoFieldSize } from "@/components/ui/hito-control-contract";
import { HitoDualRange } from "@/components/ui/hito-dual-range";
import { useHitoRadioGroup } from "@/components/ui/hito-radio-group";
import { HitoSlider } from "@/components/ui/hito-slider";

type SliderRange = "five" | "ten";

const RANGE_OPTIONS = [
  { value: "five", label: "1–5" },
  { value: "ten", label: "1–10" },
] as const;
const SIZE_LABELS: Record<HitoFieldSize, string> = {
  xs: "XS · 28px",
  sm: "SM · 32px",
  md: "MD · 40px",
  lg: "LG · 44px",
};
const noop = () => {};

export function SliderPlayground() {
  const [range, setRange] = useState<SliderRange>("ten");
  const [size, setSize] = useState<HitoFieldSize>("sm");
  const [value, setValue] = useState(6);
  const [dualValue, setDualValue] = useState<readonly [number, number]>([4, 7]);
  const max = range === "five" ? 5 : 10;
  const previousValue = range === "five" ? 2 : 4;
  const previousDualValue = (range === "five" ? [2, 5] : [3, 8]) as readonly [number, number];
  const markerValues = range === "five" ? [2, 4] : [3, 6, 9];
  const dualMarkerValues = range === "five" ? [2, 3, 4] : [2, 4, 6, 7, 9];
  const rangeGroup = useHitoRadioGroup({
    items: RANGE_OPTIONS.map((option) => ({ value: option.value })),
    value: range,
  });
  const sizeGroup = useHitoRadioGroup({
    items: HITO_FIELD_SIZES.map((option) => ({ value: option })),
    value: size,
  });

  const selectRange = (nextRange: SliderRange) => {
    setRange(nextRange);
    setValue(nextRange === "five" ? 4 : 6);
    setDualValue(nextRange === "five" ? [3, 4] : [4, 7]);
  };

  return (
    <HitoDsPlayground
      id="slider"
      label="Slider"
      status="Shared control"
      statusTone="signal"
      description={{
        purpose:
          "Adjust one bounded numeric value or an ordered pair with shared size, radius, and reversible-baseline behavior.",
        useWhen:
          "Relative adjustment within a known range is faster to understand than free-form numeric entry.",
        avoidWhen:
          "Exact entry is primary, the range is unbounded, or endpoint meaning cannot be labelled clearly.",
        accessibility:
          "Each handle has an accessible label and value; keyboard adjustment, focus, disabled state, ordering, and baseline restore remain operable.",
      }}
      usedIn={
        <ProductLinks
          links={[
            {
              href: "/workout/2026-06-30",
              label: "Workout completion and body notes",
            },
            {
              href: "/settings",
              label: "Heart-rate profile",
            },
          ]}
        />
      }
      demo={
        <div className="mx-auto grid w-full max-w-xl gap-7">
          <HitoSlider
            label={range === "five" ? "Severity" : "Effort"}
            min={1}
            max={max}
            step={1}
            size={size}
            markers={markerValues}
            value={value}
            previousValue={previousValue}
            previousValueLabel={`Restore baseline ${previousValue} out of ${max}`}
            valueLabel={`${value}/${max}`}
            ariaValueText={`${range === "five" ? "Severity" : "Effort"} ${value} out of ${max}`}
            onValueChange={setValue}
          />
          <div className="grid min-w-0 gap-3">
            <div className="flex items-center justify-between gap-3">
              <span className="hito-form-label">Dual-value range</span>
              <span className="hito-caption font-mono-num">
                {dualValue[0]}–{dualValue[1]}
              </span>
            </div>
            <HitoDualRange
              min={1}
              max={max}
              minLabel="lower endpoint"
              maxLabel="upper endpoint"
              size={size}
              markers={dualMarkerValues}
              value={dualValue}
              previousValue={previousDualValue}
              onMinValueChange={(nextValue) =>
                setDualValue(([, currentMax]) => [Math.min(nextValue, currentMax), currentMax])
              }
              onMaxValueChange={(nextValue) =>
                setDualValue(([currentMin]) => [currentMin, Math.max(nextValue, currentMin)])
              }
            />
          </div>
        </div>
      }
      variants={
        <div className="grid min-w-0 gap-7" inert>
          {HITO_FIELD_SIZES.map((specimenSize) => (
            <div key={specimenSize} className="grid min-w-0 gap-3">
              <p className="hito-form-label">{SIZE_LABELS[specimenSize]}</p>
              <HitoSlider
                label="Changed single value"
                min={1}
                max={10}
                step={1}
                size={specimenSize}
                markers={[3, 6, 9]}
                value={6}
                previousValue={4}
                valueLabel="6/10"
                ariaValueText="Effort 6 out of 10"
                onValueChange={noop}
              />
              <HitoDualRange
                min={1}
                max={10}
                minLabel="Specimen lower endpoint"
                maxLabel="Specimen upper endpoint"
                size={specimenSize}
                markers={[2, 4, 6, 7, 9]}
                value={[4, 7]}
                previousValue={[3, 8]}
                onMinValueChange={noop}
                onMaxValueChange={noop}
              />
            </div>
          ))}
          <HitoSlider
            label="Disabled"
            min={1}
            max={5}
            step={1}
            size={size}
            value={3}
            previousValue={2}
            valueLabel="3/5"
            ariaValueText="Severity 3 out of 5"
            onValueChange={noop}
            disabled
          />
          <HitoDualRange
            min={1}
            max={10}
            minLabel="Invalid lower endpoint"
            maxLabel="Invalid upper endpoint"
            size={size}
            value={[4, 7]}
            previousValue={[3, 8]}
            onMinValueChange={noop}
            onMaxValueChange={noop}
            invalid
          />
        </div>
      }
      controls={
        <div className="grid min-w-0 gap-5">
          <div className="grid gap-3">
            <p className="hito-form-label">Size</p>
            <div
              className="hito-choice-toggle-group"
              {...sizeGroup.groupProps}
              aria-label="Slider size"
            >
              {HITO_FIELD_SIZES.map((option) => (
                <HitoChoiceToggle
                  key={option}
                  size="sm"
                  {...sizeGroup.getRadioProps(option)}
                  selected={size === option}
                  onClick={() => setSize(option)}
                >
                  {option.toUpperCase()}
                </HitoChoiceToggle>
              ))}
            </div>
          </div>
          <div className="grid gap-3">
            <p className="hito-form-label">Range</p>
            <div
              className="hito-choice-toggle-group"
              {...rangeGroup.groupProps}
              aria-label="Slider range"
            >
              {RANGE_OPTIONS.map((option) => (
                <HitoChoiceToggle
                  key={option.value}
                  size="sm"
                  {...rangeGroup.getRadioProps(option.value)}
                  selected={range === option.value}
                  onClick={() => selectRange(option.value)}
                >
                  {option.label}
                </HitoChoiceToggle>
              ))}
            </div>
          </div>
          <div className="hito-row-group border-0">
            <div className="hito-list-row">
              <div>
                <p className="hito-list-row-title">Scale markers</p>
                <p className="hito-list-row-copy">
                  Gray points are passive. A coincident solid handle completely occludes its point.
                </p>
              </div>
            </div>
            <div className="hito-list-row">
              <div>
                <p className="hito-list-row-title">Baseline</p>
                <p className="hito-list-row-copy">
                  The gray point is an action: activate it to restore the controlled endpoint.
                </p>
              </div>
            </div>
            <div className="hito-list-row">
              <div>
                <p className="hito-list-row-title">Motion</p>
                <p className="hito-list-row-copy">
                  Controlled visuals ease between exact values and become immediate with reduced
                  motion.
                </p>
              </div>
            </div>
            <div className="hito-list-row">
              <div>
                <p className="hito-list-row-title">Keyboard</p>
                <p className="hito-list-row-copy">
                  Native range keys remain on handles; baseline points are separate buttons.
                </p>
              </div>
            </div>
          </div>
        </div>
      }
    />
  );
}
