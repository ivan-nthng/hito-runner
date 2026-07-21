import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import {
  personalHeartRateProfileInputSchema,
  type HeartRateZonesSummary,
  type PersonalHeartRateProfileInput,
} from "@/lib/heart-rate-zones";

type HeartRateProfileDraftZone = {
  reference: PersonalHeartRateProfileInput["zones"][number]["reference"];
  label: string;
  description: string;
  minBpm: string;
  maxBpm: string;
};

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
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(() => buildDraft(summary));
  const [validationError, setValidationError] = useState<string | null>(null);
  const isPersonal = summary.source === "personal";
  const isEstimated = summary.source === "estimated";
  const canEdit = summary.zones.length > 0;

  useEffect(() => {
    if (!isEditing) {
      setDraft(buildDraft(summary));
    }
  }, [isEditing, summary]);

  const cancelEditing = () => {
    setDraft(buildDraft(summary));
    setValidationError(null);
    setIsEditing(false);
    onClearError?.();
  };

  const saveProfile = async () => {
    const parsed = personalHeartRateProfileInputSchema.safeParse({
      zones: draft.map((zone) => ({
        reference: zone.reference,
        minBpm: Number(zone.minBpm),
        maxBpm: Number(zone.maxBpm),
      })),
    });

    if (!parsed.success) {
      setValidationError(
        "Enter whole BPM values from 1 to 300, with each minimum at or below its maximum.",
      );
      return;
    }

    if (hasOverlappingRanges(parsed.data)) {
      setValidationError("Keep each BPM range separate so one range ends before the next begins.");
      return;
    }

    setValidationError(null);
    if (await onSave(parsed.data)) {
      setIsEditing(false);
    }
  };

  const acceptCurrentRanges = async () => {
    await onSave({
      zones: summary.zones.map((zone) => ({
        reference: zone.reference,
        minBpm: zone.minBpm,
        maxBpm: zone.maxBpm,
      })),
    });
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

        {canEdit && !isEditing ? (
          <div className="flex flex-wrap items-center gap-2">
            {!summary.accepted ? (
              <button
                type="button"
                className="hito-button hito-button-primary hito-button-sm"
                disabled={isSaving}
                onClick={() => void acceptCurrentRanges()}
              >
                {isSaving ? "Saving..." : "Use estimated ranges"}
              </button>
            ) : null}
            <button
              type="button"
              className="hito-button hito-button-secondary hito-button-sm"
              disabled={isSaving}
              onClick={() => {
                setValidationError(null);
                onClearError?.();
                setIsEditing(true);
              }}
            >
              <Icon name="edit" size="sm" />
              Edit ranges
            </button>
          </div>
        ) : null}
      </div>

      {isEditing ? (
        <div className="mt-4 grid gap-4">
          <div className="hito-row-group">
            {draft.map((zone, index) => (
              <div
                key={zone.reference}
                className="hito-list-row flex-col items-stretch gap-3 sm:flex-row sm:items-end"
              >
                <div className="min-w-0 flex-1">
                  <p className="hito-list-row-title">{zone.label}</p>
                  <p className="hito-list-row-copy">{zone.description}</p>
                </div>
                <div className="grid min-w-0 grid-cols-1 gap-2 sm:w-64 sm:grid-cols-2">
                  <HeartRateField
                    invalid={Boolean(validationError)}
                    label={`${zone.label} minimum`}
                    value={zone.minBpm}
                    onChange={(value) =>
                      setDraft((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, minBpm: value } : item,
                        ),
                      )
                    }
                  />
                  <HeartRateField
                    invalid={Boolean(validationError)}
                    label={`${zone.label} maximum`}
                    value={zone.maxBpm}
                    onChange={(value) =>
                      setDraft((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, maxBpm: value } : item,
                        ),
                      )
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          {validationError ? (
            <div className="hito-state-surface p-3" data-tone="destructive" role="alert">
              <p className="hito-body-small">{validationError}</p>
            </div>
          ) : null}

          <div className="hito-settings-actions">
            <button
              type="button"
              className="hito-button hito-button-primary hito-button-md"
              disabled={isSaving}
              onClick={() => void saveProfile()}
            >
              {isSaving ? "Saving..." : "Save ranges"}
            </button>
            <button
              type="button"
              className="hito-button hito-button-ghost hito-button-md"
              disabled={isSaving}
              onClick={cancelEditing}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : summary.zones.length > 0 ? (
        <div className="hito-row-group mt-4">
          {summary.zones.map((zone) => (
            <div
              key={zone.reference}
              className="hito-list-row min-w-0 items-start max-sm:flex-col max-sm:items-stretch max-sm:gap-2"
            >
              <div className="min-w-0">
                <p className="hito-list-row-title">{zone.label}</p>
                <p className="hito-list-row-copy">{zone.description}</p>
              </div>
              <span className="hito-metric-value whitespace-nowrap max-sm:self-start">
                {zone.rangeBpm}
              </span>
            </div>
          ))}
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

function HeartRateField({
  invalid,
  label,
  onChange,
  value,
}: {
  invalid: boolean;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid min-w-0 gap-1.5">
      <span className="hito-form-label">{label}</span>
      <span className="relative block min-w-0">
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={300}
          step={1}
          value={value}
          aria-invalid={invalid || undefined}
          onChange={(event) => onChange(event.target.value)}
          className="hito-field hito-field-sm w-full pr-11"
        />
        <span
          className="hito-caption pointer-events-none absolute inset-y-0 right-3 flex items-center"
          aria-hidden="true"
        >
          BPM
        </span>
      </span>
    </label>
  );
}

function buildDraft(summary: HeartRateZonesSummary): HeartRateProfileDraftZone[] {
  return summary.zones.map((zone) => ({
    reference: zone.reference,
    label: zone.label,
    description: zone.description,
    minBpm: String(zone.minBpm),
    maxBpm: String(zone.maxBpm),
  }));
}

function hasOverlappingRanges(profile: PersonalHeartRateProfileInput) {
  return profile.zones.some((zone, index) => {
    const previous = profile.zones[index - 1];
    return previous ? zone.minBpm <= previous.maxBpm : false;
  });
}
