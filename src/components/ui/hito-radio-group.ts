import { useId, type KeyboardEvent } from "react";
import {
  getHitoSelectionTabStop,
  moveHitoSelection,
  sanitizeHitoSelectionIdPart,
  type HitoSelectionItem,
} from "@/components/ui/hito-selection-mechanics";

export type HitoRadioOptionProps = {
  id: string;
  role: "radio";
  "aria-checked": boolean;
  "aria-disabled": true | undefined;
  tabIndex: number;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
};

export function useHitoRadioGroup<Value extends string>({
  idPrefix,
  items,
  value,
}: {
  idPrefix?: string;
  items: HitoSelectionItem<Value>[];
  value?: Value | null;
}) {
  const generatedId = useId();
  const baseId = idPrefix ?? `hito-radio-${sanitizeHitoSelectionIdPart(generatedId)}`;
  const tabStopValue = getHitoSelectionTabStop(items, value);
  const optionId = (itemValue: Value) =>
    `${baseId}-option-${sanitizeHitoSelectionIdPart(itemValue)}`;

  const activate = (itemValue: Value, event: KeyboardEvent<HTMLElement>) => {
    const target = event.currentTarget.ownerDocument.getElementById(optionId(itemValue));
    target?.focus();
    target?.click();
  };

  return {
    groupProps: { role: "radiogroup" as const },
    getRadioProps(itemValue: Value): HitoRadioOptionProps {
      const item = items.find((candidate) => candidate.value === itemValue);
      const disabled = item?.disabled ?? false;

      return {
        id: optionId(itemValue),
        role: "radio" as const,
        "aria-checked": value === itemValue,
        "aria-disabled": disabled || undefined,
        tabIndex: !disabled && tabStopValue === itemValue ? 0 : -1,
        onKeyDown(event: KeyboardEvent<HTMLElement>) {
          let nextValue: Value | null = null;

          if (event.key === "ArrowRight" || event.key === "ArrowDown") {
            nextValue = moveHitoSelection(items, itemValue, "next");
          }
          if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
            nextValue = moveHitoSelection(items, itemValue, "previous");
          }
          if (event.key === "Home") nextValue = moveHitoSelection(items, itemValue, "first");
          if (event.key === "End") nextValue = moveHitoSelection(items, itemValue, "last");

          if (nextValue !== null) {
            event.preventDefault();
            activate(nextValue, event);
          }
        },
      };
    },
  };
}
