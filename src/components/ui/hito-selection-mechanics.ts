export type HitoSelectionItem<Value extends string = string> = {
  value: Value;
  disabled?: boolean;
};

export function sanitizeHitoSelectionIdPart(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}

export function getHitoSelectionTabStop<Value extends string>(
  items: readonly HitoSelectionItem<Value>[],
  currentValue?: Value | null,
) {
  const enabledItems = items.filter((item) => !item.disabled);
  return enabledItems.find((item) => item.value === currentValue)?.value ?? enabledItems[0]?.value;
}

export function moveHitoSelection<Value extends string>(
  items: readonly HitoSelectionItem<Value>[],
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
