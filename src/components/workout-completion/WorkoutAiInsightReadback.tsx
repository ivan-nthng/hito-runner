import type {
  WorkoutAiInsightSummary,
  WorkoutComparisonSummary,
} from "@/lib/workout-result-import/types";
import { hasPrimaryMatchedVerdict } from "@/components/workout-completion/WorkoutComparisonReadback";
import { Icon } from "@/components/ui/icon";
import { formatWorkoutFeedbackTimestamp } from "@/components/workout-completion/workout-feedback-time";
import { useHitoProductMessage, useHitoUiLocale } from "@/components/ui/hito-ui-locale-provider";
import { formatHitoProductMessage, getHitoKnownProductMessage } from "@/lib/ui-locale-messages";
import type { ResolvedUiLocale } from "@/lib/ui-locale";

export function WorkoutAiInsightReadback({
  insight,
  comparison,
}: {
  insight: WorkoutAiInsightSummary;
  comparison?: WorkoutComparisonSummary | null;
}) {
  const locale = useHitoUiLocale();
  const t = useHitoProductMessage();
  const matchedPrimaryVerdict = hasPrimaryMatchedVerdict(comparison ?? null);
  const recommendationLabel = humanizeAiRecommendationLevelWithContext(
    insight.recommendationLevel,
    {
      matchedPrimaryVerdict,
      locale,
    },
  );
  const recommendationTone = toneForAiRecommendation(insight, {
    matchedPrimaryVerdict,
  });
  const analysisLabel = matchedPrimaryVerdict ? t("Why it still helps") : t("What stood out");
  const differenceLabel = matchedPrimaryVerdict
    ? t("Small difference note")
    : t("Why this is less certain");
  const recommendationSectionLabel = matchedPrimaryVerdict
    ? t("Next workout")
    : t("Suggested next step");
  const supportCopy = matchedPrimaryVerdict
    ? t("Use this as extra context on top of the factual comparison above.")
    : t("Use this as a careful read of the facts above when some checks are mixed or incomplete.");
  const recommendationSupport = matchedPrimaryVerdict
    ? t("This stays secondary to the factual plan-vs-run section above.")
    : t("This stays conservative and does not change your saved plan by itself.");
  const cautionSummary =
    insight.cautionFlags.length > 0 && !matchedPrimaryVerdict
      ? summarizeAiCautionFlags(insight.cautionFlags, locale)
      : null;

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <span className="hito-status-pill" data-tone={recommendationTone}>
          {recommendationLabel}
        </span>
        <span className="hito-body-xs text-tertiary">
          {formatWorkoutFeedbackTimestamp(insight.createdAt, locale)}
        </span>
      </div>

      <p className="hito-body-xs text-tertiary">{supportCopy}</p>

      <div className="rounded-xl bg-background/18 px-4 py-4">
        <p className="hito-label-md text-foreground">{recommendationSectionLabel}</p>
        <p className="hito-body-md text-secondary mt-2">{insight.nextWorkoutRecommendation}</p>
        <p className="hito-body-xs text-tertiary mt-3">{recommendationSupport}</p>
      </div>

      <AiInsightSection label={analysisLabel} body={insight.analysisSummary} />

      {matchedPrimaryVerdict ? (
        <AiInsightSection label={differenceLabel} body={insight.differenceExplanation} />
      ) : (
        <details className="hito-disclosure">
          <summary className="hito-disclosure-summary">
            <span className="hito-label-md text-foreground">{differenceLabel}</span>
            <Icon name="chevron-down" size="xs" className="hito-disclosure-chevron" />
          </summary>
          <div className="hito-disclosure-body">
            <p className="hito-body-sm text-secondary">{insight.differenceExplanation}</p>
            {cautionSummary ? (
              <div className="rounded-lg bg-background/18 px-3 py-2">
                <p className="hito-label-md text-foreground">{t("Use with care")}</p>
                <p className="hito-body-sm text-secondary mt-2">{cautionSummary}</p>
              </div>
            ) : null}
          </div>
        </details>
      )}
    </div>
  );
}

function AiInsightSection({ label, body }: { label: string; body: string }) {
  return (
    <div className="pt-1">
      <p className="hito-body-md text-foreground">{label}</p>
      <p className="hito-body-sm text-secondary mt-1">{body}</p>
    </div>
  );
}

function humanizeAiRecommendationLevelWithContext(
  level: WorkoutAiInsightSummary["recommendationLevel"],
  options: {
    matchedPrimaryVerdict: boolean;
    locale: ResolvedUiLocale;
  },
) {
  switch (level) {
    case "keep":
      return getHitoKnownProductMessage(options.locale, "Keep course");
    case "soft_adjust":
      return getHitoKnownProductMessage(
        options.locale,
        options.matchedPrimaryVerdict ? "Minor note" : "Small caution",
      );
    default:
      return getHitoKnownProductMessage(
        options.locale,
        options.matchedPrimaryVerdict ? "Review note" : "Review carefully",
      );
  }
}

function toneForAiRecommendation(
  insight: WorkoutAiInsightSummary,
  options: {
    matchedPrimaryVerdict: boolean;
  },
) {
  if (options.matchedPrimaryVerdict) {
    switch (insight.recommendationLevel) {
      case "keep":
        return "success";
      default:
        return "signal";
    }
  }

  switch (insight.recommendationLevel) {
    case "keep":
      return "success";
    case "soft_adjust":
      return "warning";
    default:
      return "signal";
  }
}

function describeAiCautionFlag(flag: string, locale: ResolvedUiLocale) {
  const copy = (value: string) => getHitoKnownProductMessage(locale, value);
  switch (flag) {
    case "evidence_unclear":
      return copy("the uploaded evidence is still limited");
    case "date_mismatch":
      return copy("the run date may not line up cleanly with the planned day");
    case "duration_shorter_than_planned":
      return copy("the run came in shorter than planned");
    case "duration_longer_than_planned":
      return copy("the run ran longer than planned");
    case "distance_mismatch":
      return copy("distance did not line up cleanly");
    case "structured_steps_not_comparable":
      return copy("structured steps could not be compared cleanly");
    case "body_discomfort_context":
      return copy("workout body notes add discomfort context");
    case "manual_review_worthwhile":
      return copy("a manual check is still worthwhile");
    default:
      return flag.replace(/_/g, " ");
  }
}

function summarizeAiCautionFlags(flags: string[], locale: ResolvedUiLocale) {
  if (flags.length === 0) {
    return null;
  }

  const uniqueClauses = Array.from(
    new Set(flags.map((flag) => describeAiCautionFlag(flag, locale))),
  );
  return formatHitoProductMessage(locale, "This note stays cautious because {reasons}.", {
    reasons: uniqueClauses.join(", "),
  });
}
