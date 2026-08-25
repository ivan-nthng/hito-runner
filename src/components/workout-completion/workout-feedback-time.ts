import { formatUiDate, type ResolvedUiLocale } from "@/lib/ui-locale";

export function formatWorkoutFeedbackTimestamp(value: string, locale: ResolvedUiLocale) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${formatUiDate(date, locale, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })} UTC`;
}
