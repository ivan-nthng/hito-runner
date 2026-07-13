import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { TrainingPreferenceFields } from "@/components/onboarding/TrainingPreferenceFields";
import { ThemePreferenceSection } from "@/components/settings/ThemePreferenceSection";
import {
  isRecent5kTimeInAcceptedRange,
  type WeekdayName,
} from "@/components/onboarding/onboarding-form-model";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EditableValueChip } from "@/components/ui/editable-value-chip";
import { Icon } from "@/components/ui/icon";
import { APP_NAME } from "@/lib/app-config";
import { type RunnerFitnessLevel } from "@/lib/runner-training-preferences";
import { saveUserSettings, type UserSettingsSummary } from "@/lib/user-settings-actions";
import { getSettingsRouteData } from "@/lib/training-api";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: `User settings — ${APP_NAME}` },
      {
        name: "description",
        content: "Review profile details, avatar, and future settings.",
      },
    ],
  }),
  loader: () => getSettingsRouteData(),
  component: SettingsPage,
});

type SettingsFormState = {
  firstName: string;
  lastName: string;
  displayName: string;
  age: string;
  weightKg: string;
  heightCm: string;
  blockedDays: WeekdayName[];
  restDaysAnswered: boolean;
  preferredLongRunDay: WeekdayName | "";
  maxRunningDaysPerWeek: string;
  fitnessLevel: RunnerFitnessLevel;
  recent5kTime: string;
};

type SettingsTab = "personal" | "training" | "appearance";
type ProfileEditableKey = "age" | "heightCm" | "weightKg";

function SettingsPage() {
  const { snapshot, viewer, settings } = Route.useLoaderData();
  const saveUserSettingsFn = useServerFn(saveUserSettings);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<SettingsFormState>(() => buildSettingsFormState(settings));
  const [activeTab, setActiveTab] = useState<SettingsTab>("personal");
  const [activeEditableKey, setActiveEditableKey] = useState<ProfileEditableKey | null>(null);

  useEffect(() => {
    setForm(buildSettingsFormState(settings));
  }, [settings]);

  const initials = useMemo(
    () =>
      buildInitials(
        settings?.displayName ||
          [settings?.firstName, settings?.lastName].filter(Boolean).join(" ") ||
          viewer?.name ||
          "Runner",
      ),
    [settings?.displayName, settings?.firstName, settings?.lastName, viewer?.name],
  );

  const savePersonalData = async () => {
    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      await saveUserSettingsFn({
        data: buildPersonalDataPayload(form),
      });
      await router.invalidate();
      setMessage("Personal data saved.");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "User settings could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const saveTrainingPreferences = async () => {
    if (!form.restDaysAnswered) {
      setError("Choose fixed rest days or No fixed rest days.");
      setMessage(null);
      return;
    }

    if (!form.maxRunningDaysPerWeek.trim()) {
      setError("Choose default running days per week.");
      setMessage(null);
      return;
    }

    if (form.fitnessLevel === "custom" && !isRecent5kTimeInAcceptedRange(form.recent5kTime)) {
      setError("Use a recent 5K time between 18:00 and 55:00.");
      setMessage(null);
      return;
    }

    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      await saveUserSettingsFn({
        data: {
          ...buildPersonalDataPayload(form),
          trainingPreferences: {
            blocked_days: form.blockedDays,
            preferred_long_run_day: form.preferredLongRunDay || null,
            max_running_days_per_week: parseIntegerInput(form.maxRunningDaysPerWeek),
          },
        },
      });
      await router.invalidate();
      setMessage("Training preferences saved.");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Training preferences could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (snapshot.mode === "preview") {
    return (
      <AppShell snapshot={snapshot} viewer={viewer}>
        <div className="hito-route-gutter hito-route-stack py-20">
          <section className="hito-state-surface" data-tone="signal">
            <p className="hito-label">Sign in first</p>
            <h1 className="hito-page-title">User settings open after sign-in.</h1>
            <p className="hito-page-copy">
              Save a profile first, then you can manage your avatar, body data, and future heart
              rate settings here.
            </p>
            <div className="hito-state-actions">
              <Link to="/login" className="hito-button hito-button-primary hito-button-lg">
                Sign in
              </Link>
            </div>
          </section>
          <ThemePreferenceSection />
        </div>
      </AppShell>
    );
  }

  if (!settings) {
    return (
      <AppShell snapshot={snapshot} viewer={viewer}>
        <div className="hito-route-gutter hito-route-stack py-20">
          <section className="hito-state-surface" data-tone="signal">
            <p className="hito-label">Finish setup first</p>
            <h1 className="hito-page-title">User settings need a saved runner profile.</h1>
            <p className="hito-page-copy">
              Complete setup on home first, then this page can store your profile details.
            </p>
            <div className="hito-state-actions">
              <Link
                to="/"
                reloadDocument
                className="hito-button hito-button-primary hito-button-lg"
              >
                Back to home
              </Link>
            </div>
          </section>
          <ThemePreferenceSection />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell snapshot={snapshot} viewer={viewer}>
      <div className="hito-route-gutter hito-route-stack max-w-5xl py-10">
        <header className="hito-page-header">
          <p className="hito-label">User settings</p>
          <h1 className="hito-page-title">Profile details that follow your training.</h1>
          <p className="hito-page-copy">
            Keep your personal data and future-plan training defaults in one place. Settings update
            your runner profile, not the active plan already on your calendar.
          </p>
        </header>

        <div
          className="hito-surface-flat p-4"
          data-tone={error ? "destructive" : message ? "success" : undefined}
        >
          <div className="hito-label">
            {isUploadingAvatar ? "Uploading avatar" : isSaving ? "Saving settings" : "Ready"}
          </div>
          <p className="hito-body mt-2">
            {error
              ? error
              : message
                ? message
                : "These settings update your saved runner profile only."}
          </p>
        </div>

        <div className="hito-tabs hito-tabs-enclosed" role="tablist" aria-label="Settings section">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "personal"}
            className="hito-tab"
            data-active={activeTab === "personal"}
            onClick={() => setActiveTab("personal")}
          >
            Personal data
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "training"}
            className="hito-tab"
            data-active={activeTab === "training"}
            onClick={() => setActiveTab("training")}
          >
            Training preferences
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "appearance"}
            className="hito-tab"
            data-active={activeTab === "appearance"}
            onClick={() => setActiveTab("appearance")}
          >
            Appearance
          </button>
        </div>

        {activeTab === "personal" ? (
          <section className="hito-form-section-grid hito-form-section-grid-avatar" role="tabpanel">
            <div className="hito-avatar-stack self-start">
              <Avatar className="hito-avatar-tile hito-profile-avatar">
                {settings.avatarUrl ? (
                  <AvatarImage src={settings.avatarUrl} alt="Profile avatar" />
                ) : null}
                <AvatarFallback className="hito-profile-avatar-fallback">{initials}</AvatarFallback>
              </Avatar>
              <button
                type="button"
                className="hito-avatar-action hito-button hito-button-secondary hito-button-sm"
                disabled={isUploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
              >
                <Icon name={settings.avatarUrl ? "edit" : "camera"} size="sm" />
                {isUploadingAvatar ? "Uploading..." : settings.avatarUrl ? "Edit" : "Upload"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0];

                  if (!file) {
                    return;
                  }

                  setIsUploadingAvatar(true);
                  setError(null);
                  setMessage(null);

                  try {
                    const processedFile = await buildAvatarUploadFile(file);
                    const formData = new FormData();
                    formData.set("file", processedFile);
                    const response = await fetch("/api/profile-avatar/upload", {
                      method: "POST",
                      body: formData,
                    });
                    const payload = (await response.json()) as {
                      ok: boolean;
                      message?: string;
                    };

                    if (!response.ok || !payload.ok) {
                      throw new Error(payload.message ?? "The avatar could not be uploaded.");
                    }

                    await router.invalidate();
                    setMessage("Avatar updated.");
                  } catch (uploadError) {
                    setError(
                      uploadError instanceof Error
                        ? uploadError.message
                        : "The avatar could not be uploaded.",
                    );
                  } finally {
                    event.target.value = "";
                    setIsUploadingAvatar(false);
                  }
                }}
              />
            </div>

            <div className="space-y-8">
              <section className="hito-settings-section">
                <div className="flex items-center gap-2">
                  <Icon name="user" size="sm" className="text-signal" />
                  <h2 className="hito-section-title">Identity</h2>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field
                    label="First name"
                    name="firstName"
                    autoComplete="given-name"
                    value={form.firstName}
                    onChange={(value) => setForm((current) => ({ ...current, firstName: value }))}
                  />
                  <Field
                    label="Last name"
                    name="lastName"
                    autoComplete="family-name"
                    value={form.lastName}
                    onChange={(value) => setForm((current) => ({ ...current, lastName: value }))}
                  />
                  <Field
                    label="Display name"
                    name="displayName"
                    autoComplete="nickname"
                    value={form.displayName}
                    onChange={(value) => setForm((current) => ({ ...current, displayName: value }))}
                  />
                  <ReadOnlyField label="Email" value={settings.email || "No saved email"} />
                </div>
              </section>

              <section className="hito-settings-section">
                <h2 className="hito-section-title">Body data</h2>
                <p className="hito-support-copy mt-2">
                  The same compact profile facts used during plan setup.
                </p>
                <div className="hito-editable-value-chip-group mt-4">
                  <EditableValueChip
                    fieldKey="age"
                    label="Age"
                    value={form.age}
                    setValue={(value) => setForm((current) => ({ ...current, age: value }))}
                    activeEditableKey={activeEditableKey}
                    setActiveEditableKey={setActiveEditableKey}
                    placeholder="34"
                    min={13}
                    max={100}
                    step={1}
                    inputMode="numeric"
                  />
                  <EditableValueChip
                    fieldKey="heightCm"
                    label="Height"
                    value={form.heightCm}
                    setValue={(value) => setForm((current) => ({ ...current, heightCm: value }))}
                    activeEditableKey={activeEditableKey}
                    setActiveEditableKey={setActiveEditableKey}
                    placeholder="178"
                    min={120}
                    max={230}
                    step={1}
                    inputMode="numeric"
                  />
                  <EditableValueChip
                    fieldKey="weightKg"
                    label="Weight"
                    value={form.weightKg}
                    setValue={(value) => setForm((current) => ({ ...current, weightKg: value }))}
                    activeEditableKey={activeEditableKey}
                    setActiveEditableKey={setActiveEditableKey}
                    placeholder="72"
                    min={30}
                    max={250}
                    step={0.5}
                    inputMode="decimal"
                    unit="kg"
                  />
                </div>
              </section>

              <HeartRateZonesPanel summary={settings.heartRateZones} />

              <div className="hito-settings-actions">
                <button
                  type="button"
                  disabled={isSaving}
                  className="hito-button hito-button-primary hito-button-lg"
                  onClick={() => {
                    void savePersonalData();
                  }}
                >
                  {isSaving ? "Saving..." : "Save personal data"}
                </button>
                <Link
                  to="/"
                  reloadDocument
                  className="hito-button hito-button-ghost hito-button-lg"
                >
                  Back to calendar
                  <Icon name="chevron-right" size="sm" />
                </Link>
              </div>
            </div>
          </section>
        ) : activeTab === "training" ? (
          <section className="hito-settings-panel" role="tabpanel">
            <div>
              <div className="flex items-center gap-2">
                <Icon name="calendar" size="sm" className="text-signal" />
                <h2 className="hito-section-title">Training preferences</h2>
              </div>
              <p className="hito-support-copy mt-3 max-w-2xl">
                Defaults for new plans only. They prefill setup but never rewrite an existing active
                schedule.
              </p>
            </div>

            <TrainingPreferenceFields
              fixedRestDays={form.blockedDays}
              onFixedRestDaysChange={(value) =>
                setForm((current) => ({ ...current, blockedDays: value }))
              }
              restDaysAnswered={form.restDaysAnswered}
              onRestDaysAnsweredChange={(value) =>
                setForm((current) => ({ ...current, restDaysAnswered: value }))
              }
              maxRunningDaysPerWeek={form.maxRunningDaysPerWeek}
              onMaxRunningDaysPerWeekChange={(value) =>
                setForm((current) => ({ ...current, maxRunningDaysPerWeek: value }))
              }
              preferredLongRunDay={form.preferredLongRunDay}
              onPreferredLongRunDayChange={(value) =>
                setForm((current) => ({ ...current, preferredLongRunDay: value }))
              }
              showFitnessBenchmark
              fitnessLevel={form.fitnessLevel}
              onFitnessLevelChange={(value) =>
                setForm((current) => ({
                  ...current,
                  fitnessLevel: value,
                  recent5kTime: value === "custom" ? current.recent5kTime : "",
                }))
              }
              recent5kTime={form.recent5kTime}
              onRecent5kTimeChange={(value) =>
                setForm((current) => ({ ...current, recent5kTime: value }))
              }
              preferredLongRunMode="default-sunday"
              fixedRestDaysHelper="Choose the weekdays Hito should keep clear when creating future plans."
              preferredLongRunHelper="Rest days are unavailable here. Leave unselected to keep Sunday as the default."
            />

            <div className="hito-settings-actions">
              <button
                type="button"
                disabled={isSaving}
                className="hito-button hito-button-primary hito-button-lg"
                onClick={() => {
                  void saveTrainingPreferences();
                }}
              >
                {isSaving ? "Saving..." : "Save training preferences"}
              </button>
            </div>
          </section>
        ) : (
          <ThemePreferenceSection panelRole="tabpanel" />
        )}
      </div>
    </AppShell>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  inputMode,
  autoComplete,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  inputMode?: "text" | "numeric" | "decimal";
  autoComplete?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="hito-form-label">{label}</span>
      <input
        type="text"
        name={name}
        inputMode={inputMode}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="hito-field hito-field-md"
      />
    </label>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <label className="grid gap-2">
      <span className="hito-form-label">{label}</span>
      <input
        type="email"
        name="email"
        value={value}
        readOnly
        aria-readonly="true"
        autoComplete="email"
        className="hito-field hito-field-md"
      />
    </label>
  );
}

function HeartRateZonesPanel({ summary }: { summary: UserSettingsSummary["heartRateZones"] }) {
  const isDefaultEstimated = summary.source === "default_estimated";
  const isPersonal = summary.source === "personal";

  return (
    <section className="hito-settings-section">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="hito-section-title">
              {isPersonal ? "Personal/manual zones" : summary.title}
            </h2>
            {isDefaultEstimated ? (
              <span className="hito-status-pill" data-tone="signal">
                Default
              </span>
            ) : null}
            {isPersonal ? (
              <span className="hito-status-pill" data-tone="success">
                Personal
              </span>
            ) : null}
          </div>
          <p className="hito-support-copy mt-3 max-w-2xl">{summary.description}</p>
          {summary.sourceNote ? <p className="hito-caption mt-2">{summary.sourceNote}</p> : null}
        </div>
        <button
          type="button"
          className="hito-button hito-button-secondary hito-button-sm"
          disabled
          aria-disabled="true"
          title="Manual personal zones are not saved in settings yet."
        >
          <Icon name="edit" size="sm" />
          Edit zones
        </button>
      </div>

      {summary.zones.length > 0 ? (
        <div className="hito-row-group mt-4">
          {summary.zones.map((zone) => (
            <div key={zone.label} className="hito-list-row items-start">
              <div className="min-w-0">
                <p className="hito-list-row-title">{zone.label}</p>
                <p className="hito-list-row-copy">{zone.description}</p>
              </div>
              <span className="hito-metric-value whitespace-nowrap">{zone.rangeBpm}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="hito-surface-flat mt-4 p-4">
          <p className="hito-body-small">
            Hito will show broad default estimated ranges here once profile data supports them.
          </p>
        </div>
      )}
    </section>
  );
}

function buildSettingsFormState(settings: UserSettingsSummary | null): SettingsFormState {
  return {
    firstName: settings?.firstName ?? "",
    lastName: settings?.lastName ?? "",
    displayName: settings?.displayName ?? "",
    age: settings?.age != null ? String(settings.age) : "",
    weightKg: settings?.weightKg != null ? String(settings.weightKg) : "",
    heightCm: settings?.heightCm != null ? String(settings.heightCm) : "",
    blockedDays: settings?.trainingPreferences?.blocked_days ?? [],
    restDaysAnswered: Boolean(settings?.trainingPreferences),
    preferredLongRunDay: settings?.trainingPreferences?.preferred_long_run_day ?? "",
    maxRunningDaysPerWeek:
      settings?.trainingPreferences?.max_running_days_per_week != null
        ? String(settings.trainingPreferences.max_running_days_per_week)
        : "",
    fitnessLevel: "running_regularly",
    recent5kTime: "",
  };
}

function buildPersonalDataPayload(form: SettingsFormState) {
  return {
    firstName: normalizeTextInput(form.firstName),
    lastName: normalizeTextInput(form.lastName),
    displayName: normalizeTextInput(form.displayName),
    age: parseIntegerInput(form.age),
    weightKg: parseDecimalInput(form.weightKg),
    heightCm: parseDecimalInput(form.heightCm),
  };
}

function buildInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment.charAt(0).toUpperCase())
    .join("");
}

function normalizeTextInput(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parseIntegerInput(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDecimalInput(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

async function buildAvatarUploadFile(file: File) {
  const image = await loadImageFromFile(file);
  const size = 240;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("This browser could not prepare the avatar image.");
  }

  const cropSize = Math.min(image.naturalWidth, image.naturalHeight);
  const sourceX = (image.naturalWidth - cropSize) / 2;
  const sourceY = (image.naturalHeight - cropSize) / 2;

  context.drawImage(image, sourceX, sourceY, cropSize, cropSize, 0, 0, size, size);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (nextBlob) => {
        if (!nextBlob) {
          reject(new Error("The avatar image could not be processed."));
          return;
        }

        resolve(nextBlob);
      },
      "image/jpeg",
      0.92,
    );
  });

  return new File([blob], "avatar.jpg", {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

async function loadImageFromFile(file: File) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = new Image();
    image.decoding = "async";
    image.src = objectUrl;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
