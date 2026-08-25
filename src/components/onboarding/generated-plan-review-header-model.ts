import { formatUiDate, type ResolvedUiLocale } from "@/lib/ui-locale";
import { formatHitoProductMessage } from "@/lib/ui-locale-messages";

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
  locale: ResolvedUiLocale,
): GeneratedPlanReviewHeaderModel {
  const formattedEndDate = formatUiDate(input.endDate, locale, REVIEW_DATE_OPTIONS);
  const raceMatchesEndDate = input.raceDate === input.endDate;
  const modifiers = [
    input.raceDate && !raceMatchesEndDate
      ? formatHitoProductMessage(locale, "Race day {date}", {
          date: formatUiDate(input.raceDate, locale, REVIEW_DATE_OPTIONS),
        })
      : null,
    input.finishTime
      ? formatHitoProductMessage(locale, "Target finish {time}", { time: input.finishTime })
      : null,
  ].filter((value): value is string => Boolean(value));

  return {
    title: formatHitoProductMessage(locale, "{goal} plan", { goal: input.goalLabel }),
    startCopy: formatHitoProductMessage(locale, "Starts {date}", {
      date: formatUiDate(input.startDate, locale, REVIEW_DATE_OPTIONS),
    }),
    rangeCopy: raceMatchesEndDate
      ? formatHitoProductMessage(locale, "{weeks} weeks · Ends on race day, {date}", {
          weeks: input.durationWeeks,
          date: formattedEndDate,
        })
      : formatHitoProductMessage(locale, "{weeks} weeks · Ends {date}", {
          weeks: input.durationWeeks,
          date: formattedEndDate,
        }),
    modifierCopy: modifiers.length > 0 ? modifiers.join(" · ") : null,
  };
}
