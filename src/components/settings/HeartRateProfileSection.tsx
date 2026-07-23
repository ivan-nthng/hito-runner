import { useEffect, useRef, useState } from "react";
import {
  buildHeartRateProfileDraft,
  fieldErrorKey,
  HEART_RATE_GUIDANCE_SCALE,
  heartRateSliderBounds,
  updateHeartRateDraftFromSlider,
  updateHeartRateDraftText,
  validateHeartRateProfileDraft,
  type HeartRateDraftField,
} from "@/components/settings/heart-rate-profile-editor-model";
import { HitoCompoundRangeField } from "@/components/ui/hito-compound-range-field";
import { HitoDualRange } from "@/components/ui/hito-dual-range";
import {
  type HeartRateZonesSummary,
  type PersonalHeartRateProfileInput,
} from "@/lib/heart-rate-zones";

export function HeartRateProfileSection({
  appearance = "settings",
  isSaving,
  onClearError,
  onSave,
  summary,
}: {
  appearance?: "settings" | "embedded";
  isSaving: boolean;
  onClearError?: () => void;
  onSave: (profile: PersonalHeartRateProfileInput) => Promise<boolean>;
  summary: HeartRateZonesSummary;
}) {
  const [draft, setDraft] = useState(() => buildHeartRateProfileDraft(summary));
  const [saveError, setSaveError] = useState<string | null>(null);
  const summaryRef = useRef(summary);
  summaryRef.current = summary;
  const isPersonal = summary.source === "personal";
  const isEstimated = summary.source === "estimated";
  const canEdit = summary.zones.length > 0;
  const summaryKey = `${summary.source}:${summary.accepted}:${summary.zones
    .map((zone) => `${zone.reference}:${zone.minBpm}:${zone.maxBpm}`)
    .join("|")}`;

  useEffect(() => {
    setDraft(buildHeartRateProfileDraft(summaryRef.current));
    setSaveError(null);
  }, [summaryKey]); // The content key avoids discarding drafts on parent-only rerenders.

  const isDirty = draft.some((zone, index) => {
    const original = summary.zones[index];
    return (
      zone.minBpm !== String(original?.minBpm ?? "") ||
      zone.maxBpm !== String(original?.maxBpm ?? "")
    );
  });
  const requiresPersonalValidation = isPersonal || isDirty;
  const validation = validateHeartRateProfileDraft(draft);
  const visibleSummaryError = requiresPersonalValidation ? validation.summary : null;
  const canSaveUnchangedEstimate = isEstimated && !summary.accepted && !isDirty;
  const canSavePersonalDraft = requiresPersonalValidation && validation.profile != null && isDirty;
  const canSave = canSaveUnchangedEstimate || canSavePersonalDraft;

  const cancelEditing = () => {
    setDraft(buildHeartRateProfileDraft(summary));
    setSaveError(null);
    onClearError?.();
  };

  const saveProfile = async () => {
    const profile = canSaveUnchangedEstimate
      ? buildProfileFromSummary(summary)
      : validation.profile;
    if (!profile) {
      setSaveError(
        visibleSummaryError ?? "Check the highlighted ranges before saving your personal guidance.",
      );
      return;
    }

    setSaveError(null);
    if (await onSave(profile)) {
      onClearError?.();
    }
  };

  const updateTextValue = (index: number, field: HeartRateDraftField, value: string) => {
    setSaveError(null);
    onClearError?.();
    setDraft((current) => updateHeartRateDraftText({ draft: current, field, index, value }));
  };

  const updateSliderValue = (index: number, field: HeartRateDraftField, value: number) => {
    setSaveError(null);
    onClearError?.();
    setDraft((current) => updateHeartRateDraftFromSlider({ draft: current, field, index, value }));
  };

  return (
    <section className={appearance === "settings" ? "hito-settings-section min-w-0" : "min-w-0"}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {appearance === "settings" ? (
              <h2 className="hito-section-title">Heart-rate guidance</h2>
            ) : null}
            <span
              className="hito-status-pill"
              data-tone={isPersonal ? "success" : isEstimated ? "signal" : "muted"}
            >
              {isPersonal ? "Personal" : isEstimated ? "Estimated" : "Unavailable"}
            </span>
          </div>
          <p className="hito-support-copy mt-3 max-w-2xl">{summary.description}</p>
          {summary.sourceNote ? <p className="hito-caption mt-2">{summary.sourceNote}</p> : null}
        </div>
      </div>

      {canEdit ? (
        <div className="hito-heart-rate-editor mt-5">
          <div className="hito-heart-rate-scale" aria-hidden="true">
            <div className="hito-heart-rate-scale-values">
              {HEART_RATE_GUIDANCE_SCALE.ticks.map((tick) => (
                <span key={tick} className="hito-caption">
                  {tick}
                </span>
              ))}
            </div>
          </div>

          <div className="hito-heart-rate-lanes">
            {draft.map((zone, index) => {
              const minError = requiresPersonalValidation
                ? validation.fieldErrors[fieldErrorKey(index, "minBpm")]
                : undefined;
              const maxError = requiresPersonalValidation
                ? validation.fieldErrors[fieldErrorKey(index, "maxBpm")]
                : undefined;
              const zoneError = requiresPersonalValidation
                ? validation.zoneErrors[index]
                : undefined;
              const fieldError = minError ?? maxError ?? zoneError;
              const minimumBounds = heartRateSliderBounds(draft, index, "minBpm");
              const maximumBounds = heartRateSliderBounds(draft, index, "maxBpm");

              return (
                <article
                  key={zone.reference}
                  className="hito-heart-rate-lane"
                  data-invalid={Boolean(zoneError || minError || maxError) || undefined}
                  data-zone={zone.reference}
                >
                  <div className="hito-heart-rate-lane-identity">
                    <span className="hito-heart-rate-zone-marker" aria-hidden="true" />
                    <div className="min-w-0">
                      <h3 className="hito-list-row-title">{zone.label}</h3>
                      <p className="hito-list-row-copy">{zone.description}</p>
                    </div>
                  </div>

                  <div className="hito-heart-rate-lane-range">
                    <HitoDualRange
                      min={HEART_RATE_GUIDANCE_SCALE.min}
                      max={HEART_RATE_GUIDANCE_SCALE.max}
                      value={[zone.sliderMinBpm, zone.sliderMaxBpm]}
                      minLabel={`${zone.label} lower bound`}
                      maxLabel={`${zone.label} upper bound`}
                      minimumBounds={minimumBounds}
                      maximumBounds={maximumBounds}
                      invalid={Boolean(zoneError || minError || maxError)}
                      disabled={isSaving}
                      onMinValueChange={(value) => updateSliderValue(index, "minBpm", value)}
                      onMaxValueChange={(value) => updateSliderValue(index, "maxBpm", value)}
                    />
                  </div>

                  <div className="hito-heart-rate-lane-fields">
                    <HitoCompoundRangeField
                      label="Range"
                      lowerLabel={`${zone.label} lower bound`}
                      upperLabel={`${zone.label} upper bound`}
                      lowerValue={zone.minBpm}
                      upperValue={zone.maxBpm}
                      min={HEART_RATE_GUIDANCE_SCALE.min}
                      max={HEART_RATE_GUIDANCE_SCALE.max}
                      unit="BPM"
                      disabled={isSaving}
                      lowerError={minError}
                      upperError={maxError}
                      error={fieldError}
                      onLowerValueChange={(value) => updateTextValue(index, "minBpm", value)}
                      onUpperValueChange={(value) => updateTextValue(index, "maxBpm", value)}
                    />
                  </div>
                </article>
              );
            })}
          </div>

          <div className="hito-heart-rate-editor-footer">
            <div className="min-w-0">
              <p className="hito-body-small">
                {isEstimated
                  ? "Estimated guidance may overlap or leave gaps. Any change becomes personal guidance."
                  : "Personal guidance is used for future plan authoring."}
              </p>
              <p className="hito-caption mt-1">
                Bands stay ordered by purpose. Confirmed workout BPM snapshots stay unchanged.
              </p>
            </div>
            <div className="hito-settings-actions">
              <button
                type="button"
                className="hito-button hito-button-primary hito-button-md"
                disabled={isSaving || !canSave}
                onClick={() => void saveProfile()}
              >
                {isSaving ? "Saving..." : "Save ranges"}
              </button>
              <button
                type="button"
                className="hito-button hito-button-ghost hito-button-md"
                disabled={isSaving || !isDirty}
                onClick={cancelEditing}
              >
                Cancel
              </button>
            </div>
          </div>

          {visibleSummaryError || saveError ? (
            <div className="hito-state-surface p-3" data-tone="destructive" role="alert">
              <p className="hito-body-small">{saveError ?? visibleSummaryError}</p>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="hito-surface-flat mt-4 p-4">
          <p className="hito-body-small">
            Add and save your age first to establish editable starting ranges.
          </p>
        </div>
      )}
    </section>
  );
}

function buildProfileFromSummary(summary: HeartRateZonesSummary): PersonalHeartRateProfileInput {
  return {
    zones: summary.zones.map((zone) => ({
      reference: zone.reference,
      minBpm: zone.minBpm,
      maxBpm: zone.maxBpm,
    })),
  };
}
