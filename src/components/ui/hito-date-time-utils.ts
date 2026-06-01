const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isHitoIsoDate(value: string) {
  if (!ISO_DATE_RE.test(value)) {
    return false;
  }

  const [yearPart, monthPart, dayPart] = value.split("-");
  const year = Number(yearPart);
  const month = Number(monthPart);
  const day = Number(dayPart);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

export function hitoDateFromIso(value: string) {
  if (!isHitoIsoDate(value)) {
    return null;
  }

  return new Date(`${value}T00:00:00`);
}

export function hitoIsoFromDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function todayHitoIsoDate() {
  return hitoIsoFromDate(new Date());
}

export function formatHitoDurationInput(rawValue: string) {
  const digits = rawValue.replace(/\D/g, "").slice(0, 6);

  if (!digits) {
    return "";
  }

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    const minutes = digits.slice(0, -2);
    const seconds = digits.slice(-2);

    return `${Number(minutes)}:${seconds}`;
  }

  const hours = digits.slice(0, -4);
  const minutes = digits.slice(-4, -2);
  const seconds = digits.slice(-2);

  return `${Number(hours)}:${minutes}:${seconds}`;
}

export function isHitoDurationInput(value: string) {
  const parts = value.trim().split(":");

  if (parts.length !== 2 && parts.length !== 3) {
    return false;
  }

  const numbers = parts.map((part) => Number(part));

  if (numbers.some((part) => !Number.isInteger(part) || part < 0)) {
    return false;
  }

  if (parts.length === 2) {
    const [minutes, seconds] = numbers;

    return minutes != null && seconds != null && minutes > 0 && seconds < 60;
  }

  const [hours, minutes, seconds] = numbers;

  return (
    hours != null && minutes != null && seconds != null && hours > 0 && minutes < 60 && seconds < 60
  );
}
