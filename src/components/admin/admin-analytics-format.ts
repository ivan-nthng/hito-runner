export function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatNullableCount(value: number | null) {
  return value === null ? "Unavailable" : formatCount(value);
}

export function formatNullablePercent(value: number | null) {
  if (value === null) {
    return "Unavailable";
  }

  return `${Math.round(value * 100)}%`;
}

export function formatKey(value: string) {
  return value.replaceAll("_", " ");
}

export function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatShortDate(value: string | null) {
  if (!value) {
    return "No logs";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function entitlementTone(tier: string) {
  const normalizedTier = tier.toLowerCase();

  if (normalizedTier === "pro") {
    return "signal";
  }

  if (normalizedTier === "basic") {
    return "success";
  }

  return "neutral";
}
