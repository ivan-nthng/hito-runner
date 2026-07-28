import {
  HeartRateProfileSection,
  type HeartRateProfileDraftState,
} from "@/components/settings/HeartRateProfileSection";
import type { UserSettingsSummary } from "@/lib/user-settings-actions";

export function OnboardingRunnerHeartRateProfile({
  canPrepare,
  onClearError,
  error,
  isSaving,
  onDraftStateChange,
  onPrepare,
  recommendedAge,
  summary,
}: {
  canPrepare: boolean;
  error: string | null;
  isSaving: boolean;
  onClearError: () => void;
  onDraftStateChange: (state: HeartRateProfileDraftState) => void;
  onPrepare: () => Promise<boolean>;
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
          recommendedAge={recommendedAge}
          summary={summary}
        />
      ) : (
        <div className="hito-state-surface" data-tone="signal">
          <p className="hito-list-row-title">Review your BPM guidance before plan creation</p>
          <p className="hito-list-row-copy">
            Save these baseline facts to load estimated starting ranges. This saves only your runner
            profile and does not create a plan.
          </p>
          <div className="hito-state-actions">
            <button
              type="button"
              className="hito-button hito-button-secondary hito-button-md"
              disabled={!canPrepare || isSaving}
              onClick={() => void onPrepare()}
            >
              {isSaving ? "Saving baseline..." : "Show BPM guidance"}
            </button>
          </div>
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
