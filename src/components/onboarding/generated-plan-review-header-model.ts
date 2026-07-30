import { formatDate } from "@/lib/training";

interface GeneratedPlanReviewHeaderInput {
  durationWeeks: number;
  endDate: string;
  finishTime: string | null;
  goalLabel: string;
  raceDate: string | null;
  startDate: string;
}

export interface GeneratedPlanReviewHeaderModel {
  modifierCopy: string | null;
  rangeCopy: string;
  startCopy: string;
  title: string;
}

const REVIEW_DATE_OPTIONS = {
  month: "short",
  day: "numeric",
  year: "numeric",
} satisfies Intl.DateTimeFormatOptions;

export function buildGeneratedPlanReviewHeaderModel(
  input: GeneratedPlanReviewHeaderInput,
): GeneratedPlanReviewHeaderModel {
  const formattedEndDate = formatDate(input.endDate, REVIEW_DATE_OPTIONS);
  const raceMatchesEndDate = input.raceDate === input.endDate;
  const modifiers = [
    input.raceDate && !raceMatchesEndDate
      ? `Race day ${formatDate(input.raceDate, REVIEW_DATE_OPTIONS)}`
      : null,
    input.finishTime ? `Target finish ${input.finishTime}` : null,
  ].filter((value): value is string => Boolean(value));

  return {
    title: `${input.goalLabel} plan`,
    startCopy: `Starts ${formatDate(input.startDate, REVIEW_DATE_OPTIONS)}`,
    rangeCopy: raceMatchesEndDate
      ? `${input.durationWeeks} weeks · Ends on race day, ${formattedEndDate}`
      : `${input.durationWeeks} weeks · Ends ${formattedEndDate}`,
    modifierCopy: modifiers.length > 0 ? modifiers.join(" · ") : null,
  };
}
