const UTC_MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export function formatWorkoutFeedbackTimestamp(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const hour24 = date.getUTCHours();
  const hour12 = hour24 % 12 || 12;
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const period = hour24 >= 12 ? "PM" : "AM";

  return `${
    UTC_MONTH_LABELS[date.getUTCMonth()]
  } ${date.getUTCDate()}, ${hour12}:${minutes} ${period} UTC`;
}
