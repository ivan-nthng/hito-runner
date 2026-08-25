import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
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
import { HitoButton } from "@/components/ui/button";
import {
  buildHeartRateZonesSummary,
  type HeartRateZonesSummary,
  type PersonalHeartRateProfileInput,
} from "@/lib/heart-rate-zones";
import { useHitoProductMessage, useHitoUiLocale } from "@/components/ui/hito-ui-locale-provider";
import { getHitoKnownProductMessage } from "@/lib/ui-locale-messages";

export type HeartRateProfileDraftState = {
  canSubmit: boolean;
  isDirty: boolean;
  key: string;
  profileToPersist: PersonalHeartRateProfileInput | null;
};

export function HeartRateProfileSection({
  appearance = "settings",
  isSaving,
  onClearError,
  onDraftStateChange,
  onRecommendedApplied,
  recommendedAge,
  summary,
}: {
  appearance?: "settings" | "embedded";
  isSaving: boolean;
  onClearError?: () => void;
  onDraftStateChange?: (state: HeartRateProfileDraftState) => void;
  onRecommendedApplied?: (summary: HeartRateZonesSummary) => void;
  recommendedAge: number | null;
  summary: HeartRateZonesSummary;
}) {
  const locale = useHitoUiLocale();
  const message = useHitoProductMessage();
  const [draft, setDraft] = useState(() => buildHeartRateProfileDraft(summary));
  const [recommendedApplied, setRecommendedApplied] = useState(false);
  const summaryRef = useRef(summary);
  summaryRef.current = summary;
  const canEdit = summary.zones.length > 0;
  const summaryKey = `${summary.source}:${summary.accepted}:${summary.zones
    .map((zone) => `${zone.reference}:${zone.minBpm}:${zone.maxBpm}`)
    .join("|")}`;

  useEffect(() => {
    setDraft(buildHeartRateProfileDraft(summaryRef.current));
    setRecommendedApplied(false);
  }, [summaryKey]); // The content key avoids discarding drafts on parent-only rerenders.

  const valuesAreDirty = draft.some((zone, index) => {
    const original = summary.zones[index];
    return (
      zone.minBpm !== String(original?.minBpm ?? "") ||
      zone.maxBpm !== String(original?.maxBpm ?? "")
    );
  });
  const isDirty = valuesAreDirty || recommendedApplied;
  const validation = useMemo(() => validateHeartRateProfileDraft(draft), [draft]);
  const recommendedSummary = useMemo(
    () => buildHeartRateZonesSummary(recommendedAge),
    [recommendedAge],
  );
  const unchangedAcceptedProfile = summary.accepted && !isDirty;
  const canSubmit = unchangedAcceptedProfile || validation.profile != null;
  const profileToPersist =
    validation.profile && (!summary.accepted || isDirty) ? validation.profile : null;
  const visibleSummaryError = isDirty || !summary.accepted ? validation.summary : null;
  const matchesRecommended =
    profileToPersist != null &&
    recommendedSummary.zones.length === profileToPersist.zones.length &&
    profileToPersist.zones.every((zone, index) => {
      const recommendedZone = recommendedSummary.zones[index];
      return (
        zone.reference === recommendedZone?.reference &&
        zone.minBpm === recommendedZone.minBpm &&
        zone.maxBpm === recommendedZone.maxBpm
      );
    });
  const effectiveDraftSource = profileToPersist
    ? matchesRecommended
      ? "estimated"
      : "personal"
    : isDirty
      ? "invalid-draft"
      : summary.source;
  const draftStateKey = JSON.stringify({
    source: effectiveDraftSource,
    values: draft.map((zone) => [zone.reference, zone.minBpm, zone.maxBpm]),
  });
  const publishDraftState = useEffectEvent((state: HeartRateProfileDraftState) => {
    onDraftStateChange?.(state);
  });
  const publishedDraftState = useMemo(
    () => ({
      canSubmit,
      isDirty,
      key: draftStateKey,
      profileToPersist,
    }),
    [canSubmit, draftStateKey, isDirty, profileToPersist],
  );

  useEffect(() => {
    publishDraftState(publishedDraftState);
  }, [publishDraftState, publishedDraftState]);

  const applyRecommended = () => {
    if (recommendedSummary.zones.length === 0) {
      return;
    }

    onClearError?.();
    setRecommendedApplied(true);
    setDraft(buildHeartRateProfileDraft(recommendedSummary));
    onRecommendedApplied?.(recommendedSummary);
  };

  const updateTextValue = (index: number, field: HeartRateDraftField, value: string) => {
    onClearError?.();
    setDraft((current) => updateHeartRateDraftText({ draft: current, field, index, value }));
  };

  const updateSliderValue = (index: number, field: HeartRateDraftField, value: number) => {
    onClearError?.();
    setDraft((current) => updateHeartRateDraftFromSlider({ draft: current, field, index, value }));
  };

  return (
    <section className={appearance === "settings" ? "hito-settings-section min-w-0" : "min-w-0"}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          {appearance === "settings" ? (
            <h2 className="hito-ui-title-sm text-foreground">{message("Heart-rate guidance")}</h2>
          ) : null}
          <p
            className={
              appearance === "settings"
                ? "hito-body-md text-secondary mt-2 max-w-2xl"
                : "hito-body-md text-secondary max-w-2xl"
            }
          >
            {message("Adjust the BPM ranges Hito can use for future plan authoring.")}
          </p>
        </div>
        <HitoButton
          type="button"
          className="shrink-0"
          size="sm"
          variant="secondary"
          disabled={isSaving || recommendedAge == null}
          onClick={applyRecommended}
        >
          {message("Recommended")}
        </HitoButton>
      </div>

      {canEdit ? (
        <div className="hito-heart-rate-editor mt-5">
          <div className="hito-heart-rate-scale" aria-hidden="true">
            <div className="hito-heart-rate-scale-values">
              {HEART_RATE_GUIDANCE_SCALE.ticks.map((tick) => (
                <span key={tick} className="hito-body-xs text-tertiary">
                  {tick}
                </span>
              ))}
            </div>
          </div>

          <div className="hito-heart-rate-lanes">
            {draft.map((zone, index) => {
              const minError =
                isDirty || !summary.accepted
                  ? validation.fieldErrors[fieldErrorKey(index, "minBpm")]
                  : undefined;
              const maxError =
                isDirty || !summary.accepted
                  ? validation.fieldErrors[fieldErrorKey(index, "maxBpm")]
                  : undefined;
              const zoneError =
                isDirty || !summary.accepted ? validation.zoneErrors[index] : undefined;
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
                      <h3 className="hito-body-md text-foreground">
                        {getHitoKnownProductMessage(locale, zone.label)}
                      </h3>
                      <p className="hito-body-sm mt-1 text-secondary">
                        {getHitoKnownProductMessage(locale, zone.description)}
                      </p>
                    </div>
                  </div>

                  <div className="hito-heart-rate-lane-range">
                    <HitoDualRange
                      min={HEART_RATE_GUIDANCE_SCALE.min}
                      max={HEART_RATE_GUIDANCE_SCALE.max}
                      value={[zone.sliderMinBpm, zone.sliderMaxBpm]}
                      previousValue={[
                        summary.zones[index]?.minBpm ?? zone.sliderMinBpm,
                        summary.zones[index]?.maxBpm ?? zone.sliderMaxBpm,
                      ]}
                      minLabel={message("{zone} lower bound", {
                        zone: getHitoKnownProductMessage(locale, zone.label),
                      })}
                      maxLabel={message("{zone} upper bound", {
                        zone: getHitoKnownProductMessage(locale, zone.label),
                      })}
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
                      lowerLabel={message("{zone} lower bound", {
                        zone: getHitoKnownProductMessage(locale, zone.label),
                      })}
                      upperLabel={message("{zone} upper bound", {
                        zone: getHitoKnownProductMessage(locale, zone.label),
                      })}
                      lowerValue={zone.minBpm}
                      upperValue={zone.maxBpm}
                      min={HEART_RATE_GUIDANCE_SCALE.min}
                      max={HEART_RATE_GUIDANCE_SCALE.max}
                      unit="BPM"
                      disabled={isSaving}
                      lowerError={
                        minError ? getHitoKnownProductMessage(locale, minError) : minError
                      }
                      upperError={
                        maxError ? getHitoKnownProductMessage(locale, maxError) : maxError
                      }
                      error={
                        fieldError ? getHitoKnownProductMessage(locale, fieldError) : fieldError
                      }
                      onLowerValueChange={(value) => updateTextValue(index, "minBpm", value)}
                      onUpperValueChange={(value) => updateTextValue(index, "maxBpm", value)}
                    />
                  </div>
                </article>
              );
            })}
          </div>

          {visibleSummaryError ? (
            <div className="hito-state-surface p-3" data-tone="destructive" role="alert">
              <p className="hito-body-sm text-secondary">
                {getHitoKnownProductMessage(locale, visibleSummaryError)}
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="hito-surface-flat mt-4 p-4">
          <p className="hito-body-sm text-secondary">
            {message("Add and save your age first to establish editable starting ranges.")}
          </p>
        </div>
      )}
    </section>
  );
}
