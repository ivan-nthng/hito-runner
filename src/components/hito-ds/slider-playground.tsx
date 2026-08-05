import { useState } from "react";

import { HitoDsPlayground } from "@/components/hito-ds/playground";
import { HitoChoiceToggle } from "@/components/ui/hito-choice-toggle";
import { ProductLinks } from "@/components/hito-ds/reference";
import { HitoSlider } from "@/components/ui/hito-slider";
import { useHitoRadioGroup } from "@/components/ui/hito-radio-group";

type SliderRange = "five" | "ten";

const RANGE_OPTIONS = [
  { value: "five", label: "1–5" },
  { value: "ten", label: "1–10" },
] as const;

const noop = () => {};

export function SliderPlayground() {
  const [range, setRange] = useState<SliderRange>("ten");
  const [value, setValue] = useState(6);
  const max = range === "five" ? 5 : 10;
  const rangeGroup = useHitoRadioGroup({
    items: RANGE_OPTIONS.map((option) => ({ value: option.value })),
    value: range,
  });

  const selectRange = (nextRange: SliderRange) => {
    setRange(nextRange);
    setValue((current) => Math.min(current, nextRange === "five" ? 5 : 10));
  };

  return (
    <HitoDsPlayground
      id="slider"
      label="Slider"
      status="Shared control"
      statusTone="signal"
      usedIn={
        <ProductLinks
          links={[
            {
              href: "/workout/2026-06-30",
              label: "Workout completion and body notes",
            },
          ]}
        />
      }
      demo={
        <div className="mx-auto w-full max-w-xl">
          <HitoSlider
            label={range === "five" ? "Severity" : "Effort"}
            min={1}
            max={max}
            step={1}
            value={value}
            valueLabel={`${value}/${max}`}
            ariaValueText={`${range === "five" ? "Severity" : "Effort"} ${value} out of ${max}`}
            onValueChange={setValue}
          />
        </div>
      }
      variants={
        <div className="grid min-w-0 gap-7" inert>
          <HitoSlider
            label="Default"
            min={1}
            max={10}
            step={1}
            value={6}
            valueLabel="6/10"
            ariaValueText="Effort 6 out of 10"
            onValueChange={noop}
          />
          <HitoSlider
            label="Disabled"
            min={1}
            max={5}
            step={1}
            value={3}
            valueLabel="3/5"
            ariaValueText="Severity 3 out of 5"
            onValueChange={noop}
            disabled
          />
        </div>
      }
      controls={
        <div className="grid min-w-0 gap-5">
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
                <p className="hito-list-row-title">Use</p>
                <p className="hito-list-row-copy">
                  One bounded value with a truthful min, max, and step.
                </p>
              </div>
            </div>
            <div className="hito-list-row">
              <div>
                <p className="hito-list-row-title">Keyboard</p>
                <p className="hito-list-row-copy">Arrows, Page keys, Home, and End stay native.</p>
              </div>
            </div>
          </div>
        </div>
      }
    />
  );
}
