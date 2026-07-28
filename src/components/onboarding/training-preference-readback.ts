export function weeklyRunningCeilingReadback(value: number | null | undefined) {
  return value == null ? "Flexible" : `Up to ${value} run${value === 1 ? "" : "s"}/week`;
}

export function fixedRestDaysReadback(value: readonly string[] | null | undefined) {
  return value?.length ? value.join(", ") : "Flexible";
}
