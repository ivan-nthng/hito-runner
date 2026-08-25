import {
  HeartRateProfileSection,
  type HeartRateProfileDraftState,
} from "@/components/settings/HeartRateProfileSection";
import { useHitoProductMessage, useHitoUiLocale } from "@/components/ui/hito-ui-locale-provider";
import type { HeartRateZonesSummary } from "@/lib/heart-rate-zones";
import { getHitoKnownProductMessage } from "@/lib/ui-locale-messages";
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
  const locale = useHitoUiLocale();
  const t = useHitoProductMessage();

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
          <p className="hito-body-md text-foreground">{t("Complete your runner baseline")}</p>
          <p className="hito-body-sm mt-1 text-secondary">
            {t(
              "Estimated BPM guidance appears automatically when the required profile facts are valid. The estimate itself is age-based.",
            )}
          </p>
        </div>
      )}

      {error ? (
        <div className="hito-state-surface p-3" data-tone="destructive" role="alert">
          <p className="hito-body-sm text-secondary">{getHitoKnownProductMessage(locale, error)}</p>
        </div>
      ) : null}
    </div>
  );
}
