import { useId, type KeyboardEvent } from "react";

export type HitoSelectionItem<Value extends string = string> = {
  value: Value;
  disabled?: boolean;
};

function safeIdPart(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}

function moveSelection<Value extends string>(
  items: HitoSelectionItem<Value>[],
  currentValue: Value,
  direction: "first" | "last" | "next" | "previous",
) {
  const enabledItems = items.filter((item) => !item.disabled);
  if (enabledItems.length === 0) return null;

  if (direction === "first") return enabledItems[0]?.value ?? null;
  if (direction === "last") return enabledItems.at(-1)?.value ?? null;

  const currentIndex = enabledItems.findIndex((item) => item.value === currentValue);
  const startIndex = currentIndex >= 0 ? currentIndex : 0;
  const offset = direction === "next" ? 1 : -1;
  const nextIndex = (startIndex + offset + enabledItems.length) % enabledItems.length;
  return enabledItems[nextIndex]?.value ?? null;
}

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
  const baseId = idPrefix ?? `hito-tabs-${safeIdPart(generatedId)}`;
  const enabledItems = items.filter((item) => !item.disabled);
  const selectedItem = enabledItems.find((item) => item.value === value) ?? enabledItems[0];

  const tabId = (itemValue: Value) => `${baseId}-tab-${safeIdPart(itemValue)}`;
  const panelId = (itemValue: Value) => `${baseId}-panel-${safeIdPart(itemValue)}`;

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
        tabIndex: !disabled && selectedItem?.value === itemValue ? 0 : -1,
        onKeyDown(event: KeyboardEvent<HTMLElement>) {
          let nextValue: Value | null = null;

          if (event.key === "ArrowRight") nextValue = moveSelection(items, itemValue, "next");
          if (event.key === "ArrowLeft") nextValue = moveSelection(items, itemValue, "previous");
          if (event.key === "Home") nextValue = moveSelection(items, itemValue, "first");
          if (event.key === "End") nextValue = moveSelection(items, itemValue, "last");

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
