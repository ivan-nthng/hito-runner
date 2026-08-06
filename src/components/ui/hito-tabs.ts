import { useId, type KeyboardEvent } from "react";
import {
  getHitoSelectionTabStop,
  moveHitoSelection,
  sanitizeHitoSelectionIdPart,
  type HitoSelectionItem,
} from "@/components/ui/hito-selection-mechanics";

export function useHitoTabs<Value extends string>({
  idPrefix,
  items,
  value,
}: {
  idPrefix?: string;
  items: HitoSelectionItem<Value>[];
  value: Value;
}) {
  const generatedId = useId();
  const baseId = idPrefix ?? `hito-tabs-${sanitizeHitoSelectionIdPart(generatedId)}`;
  const tabStopValue = getHitoSelectionTabStop(items, value);

  const tabId = (itemValue: Value) => `${baseId}-tab-${sanitizeHitoSelectionIdPart(itemValue)}`;
  const panelId = (itemValue: Value) => `${baseId}-panel-${sanitizeHitoSelectionIdPart(itemValue)}`;

  const activate = (itemValue: Value, event: KeyboardEvent<HTMLElement>) => {
    const target = event.currentTarget.ownerDocument.getElementById(tabId(itemValue));
    target?.focus();
    target?.click();
  };

  return {
    tabListProps: { role: "tablist" as const },
    getTabProps(itemValue: Value) {
      const item = items.find((candidate) => candidate.value === itemValue);
      const disabled = item?.disabled ?? false;

      return {
        id: tabId(itemValue),
        role: "tab" as const,
        "aria-controls": panelId(itemValue),
        "aria-selected": value === itemValue,
        "aria-disabled": disabled || undefined,
        tabIndex: !disabled && tabStopValue === itemValue ? 0 : -1,
        onKeyDown(event: KeyboardEvent<HTMLElement>) {
          let nextValue: Value | null = null;

          if (event.key === "ArrowRight") {
            nextValue = moveHitoSelection(items, itemValue, "next");
          }
          if (event.key === "ArrowLeft") {
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
    getPanelProps(itemValue: Value) {
      return {
        id: panelId(itemValue),
        role: "tabpanel" as const,
        "aria-labelledby": tabId(itemValue),
      };
    },
  };
}
