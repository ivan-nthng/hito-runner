import {
  HeartRateProfileSection,
  type HeartRateProfileDraftState,
} from "@/components/settings/HeartRateProfileSection";
import type { HeartRateZonesSummary } from "@/lib/heart-rate-zones";
import type { UserSettingsSummary } from "@/lib/user-settings-actions";

export function OnboardingRunnerHeartRateProfile({
  onClearError,
  error,
  isSaving,
  onDraftStateChange,
  onRecommendedApplied,
  recommendedAge,
  summary,
}: {
  error: string | null;
  isSaving: boolean;
  onClearError: () => void;
  onDraftStateChange: (state: HeartRateProfileDraftState) => void;
  onRecommendedApplied: (summary: HeartRateZonesSummary) => void;
  recommendedAge: number | null;
  summary: UserSettingsSummary["heartRateZones"] | null;
}) {
  return (
    <div className="grid gap-4">
      {summary ? (
        <HeartRateProfileSection
          appearance="embedded"
          isSaving={isSaving}
          onClearError={onClearError}
          onDraftStateChange={onDraftStateChange}
          onRecommendedApplied={onRecommendedApplied}
          recommendedAge={recommendedAge}
          summary={summary}
        />
      ) : (
        <div className="hito-state-surface" data-tone="signal">
          <p className="hito-list-row-title">Complete your runner baseline</p>
          <p className="hito-list-row-copy">
            Estimated BPM guidance appears automatically when the required profile facts are valid.
            The estimate itself is age-based.
          </p>
        </div>
      )}

      {error ? (
        <div className="hito-state-surface p-3" data-tone="destructive" role="alert">
          <p className="hito-body-small">{error}</p>
        </div>
      ) : null}
    </div>
  );
}
