import type {
  InlineChangeTokenControlInput,
  InlineChangeTokenControlOption,
} from "@/components/devtools/local-inline-change-target-utils";

export function classifyLocalUiTokenEvidence({
  confirmedAppliedToken,
  options,
  value,
}: {
  confirmedAppliedToken?: string;
  options: InlineChangeTokenControlOption[];
  value: number;
}): Pick<
  InlineChangeTokenControlInput,
  | "confidence"
  | "currentToken"
  | "evidenceState"
  | "matchingToken"
  | "nearestToken"
  | "nearestValuePx"
> {
  const nearest = getNearestTokenOption(value, options);
  if (!nearest) {
    return {
      confidence: "uncertain",
      currentToken: null,
      evidenceState: "no_mapping",
      matchingToken: null,
      nearestToken: null,
      nearestValuePx: null,
    };
  }

  const cleanMatch = Math.abs(value - nearest.valuePx) <= 0.75;
  const appliedOption = confirmedAppliedToken
    ? (options.find((option) => option.token === confirmedAppliedToken) ?? null)
    : null;
  const appliedTokenConfirmed = Boolean(
    appliedOption && Math.abs(value - appliedOption.valuePx) <= 0.75,
  );

  if (appliedTokenConfirmed) {
    return {
      confidence: "mapped",
      currentToken: confirmedAppliedToken ?? null,
      evidenceState: "applied_token_confirmed",
      matchingToken: null,
      nearestToken: null,
      nearestValuePx: null,
    };
  }

  if (cleanMatch) {
    return {
      confidence: "mapped",
      currentToken: null,
      evidenceState: "value_matches_token",
      matchingToken: nearest.token,
      nearestToken: null,
      nearestValuePx: null,
    };
  }

  return {
    confidence: "uncertain",
    currentToken: null,
    evidenceState: "nearest_token",
    matchingToken: null,
    nearestToken: nearest.token,
    nearestValuePx: nearest.valuePx,
  };
}

function getNearestTokenOption(value: number, options: InlineChangeTokenControlOption[]) {
  const first = options[0];
  if (!first) return null;

  return options.reduce((nearest, candidate) =>
    Math.abs(candidate.valuePx - value) < Math.abs(nearest.valuePx - value) ? candidate : nearest,
  );
}
