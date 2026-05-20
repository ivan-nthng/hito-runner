import type {
  WorkoutAiInsightSummary,
  WorkoutComparisonSummary,
} from "@/lib/workout-result-import/types";
import { hasPrimaryMatchedVerdict } from "@/components/workout-completion/WorkoutComparisonReadback";

export function WorkoutAiInsightReadback({
  insight,
  comparison,
}: {
  insight: WorkoutAiInsightSummary;
  comparison?: WorkoutComparisonSummary | null;
}) {
  const matchedPrimaryVerdict = hasPrimaryMatchedVerdict(comparison);
  const recommendationLabel = humanizeAiRecommendationLevelWithContext(
    insight.recommendationLevel,
    {
      matchedPrimaryVerdict,
    },
  );
  const recommendationTone = toneForAiRecommendation(insight, {
    matchedPrimaryVerdict,
  });
  const analysisLabel = matchedPrimaryVerdict ? "Why it still helps" : "What stood out";
  const differenceLabel = matchedPrimaryVerdict
    ? "Small difference note"
    : "Why this is less certain";
  const recommendationSectionLabel = matchedPrimaryVerdict ? "Next workout" : "Suggested next step";
  const supportCopy = matchedPrimaryVerdict
    ? "Use this as extra context on top of the factual comparison above."
    : "Use this as a careful read of the facts above when some checks are mixed or incomplete.";
  const recommendationSupport = matchedPrimaryVerdict
    ? "This stays secondary to the factual plan-vs-run section above."
    : "This stays conservative and does not change your saved plan by itself.";
  const cautionSummary =
    insight.cautionFlags.length > 0 && !matchedPrimaryVerdict
      ? summarizeAiCautionFlags(insight.cautionFlags)
      : null;

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <span className="hito-status-pill" data-tone={recommendationTone}>
          {recommendationLabel}
        </span>
        <span className="hito-caption">{formatAiInsightLoggedAt(insight.createdAt)}</span>
      </div>

      <p className="hito-caption">{supportCopy}</p>

      <div className="rounded-xl bg-background/18 px-4 py-4">
        <p className="hito-label">{recommendationSectionLabel}</p>
        <p className="hito-body mt-2">{insight.nextWorkoutRecommendation}</p>
        <p className="hito-caption mt-3">{recommendationSupport}</p>
      </div>

      <AiInsightSection label={analysisLabel} body={insight.analysisSummary} />

      {matchedPrimaryVerdict ? (
        <AiInsightSection label={differenceLabel} body={insight.differenceExplanation} />
      ) : (
        <details className="border-t border-hairline pt-4">
          <summary className="hito-label cursor-pointer list-none">{differenceLabel}</summary>
          <div className="mt-3 space-y-3">
            <p className="hito-body-small">{insight.differenceExplanation}</p>
            {cautionSummary ? (
              <div className="rounded-lg bg-background/18 px-3 py-2">
                <p className="hito-label">Use with care</p>
                <p className="hito-body-small mt-2">{cautionSummary}</p>
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
      <p className="hito-list-row-title">{label}</p>
      <p className="hito-body-small mt-1">{body}</p>
    </div>
  );
}

function humanizeAiRecommendationLevelWithContext(
  level: WorkoutAiInsightSummary["recommendationLevel"],
  options: {
    matchedPrimaryVerdict: boolean;
  },
) {
  switch (level) {
    case "keep":
      return "Keep course";
    case "soft_adjust":
      return options.matchedPrimaryVerdict ? "Minor note" : "Small caution";
    default:
      return options.matchedPrimaryVerdict ? "Review note" : "Review carefully";
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

function describeAiCautionFlag(flag: string) {
  switch (flag) {
    case "evidence_unclear":
      return "the uploaded evidence is still limited";
    case "date_mismatch":
      return "the run date may not line up cleanly with the planned day";
    case "duration_shorter_than_planned":
      return "the run came in shorter than planned";
    case "duration_longer_than_planned":
      return "the run ran longer than planned";
    case "distance_mismatch":
      return "distance did not line up cleanly";
    case "structured_steps_not_comparable":
      return "structured steps could not be compared cleanly";
    case "body_discomfort_context":
      return "workout body notes add discomfort context";
    case "manual_review_worthwhile":
      return "a manual check is still worthwhile";
    default:
      return flag.replace(/_/g, " ");
  }
}

function summarizeAiCautionFlags(flags: string[]) {
  if (flags.length === 0) {
    return null;
  }

  const uniqueClauses = Array.from(new Set(flags.map((flag) => describeAiCautionFlag(flag))));

  if (uniqueClauses.length === 1) {
    return `This note stays cautious because ${uniqueClauses[0]}.`;
  }

  return `This note stays cautious because ${uniqueClauses.join(", ")}.`;
}

function formatAiInsightLoggedAt(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
