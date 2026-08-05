import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { TrainingPreferenceFields } from "@/components/onboarding/TrainingPreferenceFields";
import { ThemePreferenceSection } from "@/components/settings/ThemePreferenceSection";
import { type WeekdayName } from "@/components/onboarding/onboarding-form-model";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HitoButton } from "@/components/ui/button";
import { EditableValueField } from "@/components/ui/editable-value-field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { useHitoTabs } from "@/components/ui/hito-tabs";
import {
  HeartRateProfileSection,
  type HeartRateProfileDraftState,
} from "@/components/settings/HeartRateProfileSection";
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
  preferredLongRunDay: WeekdayName | "";
  maxRunningDaysPerWeek: string;
  fitnessLevel: RunnerFitnessLevel;
};

type SettingsTab = "personal" | "training" | "appearance";
type ProfileEditableKey = "age" | "heightCm" | "weightKg";

const SETTINGS_TABS = [
  { value: "personal" },
  { value: "training" },
  { value: "appearance" },
] satisfies Array<{ value: SettingsTab }>;

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
  const [heartRateDraftState, setHeartRateDraftState] = useState<HeartRateProfileDraftState | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<SettingsTab>("personal");
  const settingsTabs = useHitoTabs({ items: SETTINGS_TABS, value: activeTab });
  const [activeEditableKey, setActiveEditableKey] = useState<ProfileEditableKey | null>(null);

  useEffect(() => {
    setForm(buildSettingsFormState(settings));
    setHeartRateDraftState(null);
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
    if (heartRateDraftState && !heartRateDraftState.canSubmit) {
      setError("Check the highlighted BPM ranges before saving personal data.");
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
          ...(heartRateDraftState?.profileToPersist
            ? { heartRateProfile: heartRateDraftState.profileToPersist }
            : {}),
        },
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
              <HitoButton asChild size="lg" variant="primary">
                <Link to="/login">Sign in</Link>
              </HitoButton>
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
              <HitoButton asChild size="lg" variant="primary">
                <Link to="/" reloadDocument>
                  Back to home
                </Link>
              </HitoButton>
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
          className="hito-state-surface p-4"
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

        <div
          className="hito-tabs hito-tabs-enclosed"
          {...settingsTabs.tabListProps}
          aria-label="Settings section"
        >
          <button
            type="button"
            {...settingsTabs.getTabProps("personal")}
            className="hito-tab"
            data-active={activeTab === "personal"}
            onClick={() => setActiveTab("personal")}
          >
            Personal data
          </button>
          <button
            type="button"
            {...settingsTabs.getTabProps("training")}
            className="hito-tab"
            data-active={activeTab === "training"}
            onClick={() => setActiveTab("training")}
          >
            Training preferences
          </button>
          <button
            type="button"
            {...settingsTabs.getTabProps("appearance")}
            className="hito-tab"
            data-active={activeTab === "appearance"}
            onClick={() => setActiveTab("appearance")}
          >
            Appearance
          </button>
        </div>

        {activeTab === "personal" ? (
          <section
            className="hito-form-section-grid hito-form-section-grid-avatar"
            {...settingsTabs.getPanelProps("personal")}
          >
            <div className="hito-avatar-stack self-start">
              <Avatar className="hito-avatar-tile hito-profile-avatar">
                {settings.avatarUrl ? (
                  <AvatarImage src={settings.avatarUrl} alt="Profile avatar" />
                ) : null}
                <AvatarFallback className="hito-profile-avatar-fallback">{initials}</AvatarFallback>
              </Avatar>
              <HitoButton
                type="button"
                className="hito-avatar-action"
                size="sm"
                variant="secondary"
                loading={isUploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
              >
                <Icon name={settings.avatarUrl ? "edit" : "camera"} size="sm" />
                {isUploadingAvatar ? "Uploading..." : settings.avatarUrl ? "Edit" : "Upload"}
              </HitoButton>
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
                <div className="hito-editable-value-field-group mt-4">
                  <EditableValueField
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
                  <EditableValueField
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
                  <EditableValueField
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

              <HeartRateProfileSection
                isSaving={isSaving}
                onClearError={() => setError(null)}
                onDraftStateChange={setHeartRateDraftState}
                recommendedAge={parseRecommendedAge(form.age)}
                summary={settings.heartRateZones}
              />

              <div className="hito-settings-actions">
                <HitoButton
                  type="button"
                  disabled={heartRateDraftState?.canSubmit === false}
                  loading={isSaving}
                  size="lg"
                  variant="primary"
                  onClick={() => {
                    void savePersonalData();
                  }}
                >
                  {isSaving ? "Saving..." : "Save personal data"}
                </HitoButton>
                <HitoButton asChild size="lg" variant="ghost">
                  <Link to="/" reloadDocument>
                    Back to calendar
                    <Icon name="chevron-right" size="sm" />
                  </Link>
                </HitoButton>
              </div>
            </div>
          </section>
        ) : activeTab === "training" ? (
          <section className="hito-settings-panel" {...settingsTabs.getPanelProps("training")}>
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
                }))
              }
              allowCustomFitnessLevelSelection={settings?.fitnessLevel === "custom"}
              fitnessBenchmarkHelper="Recent 5K details are added per plan. Settings can preserve an existing custom level or switch to a standard level."
              preferredLongRunMode="default-sunday"
              fixedRestDaysHelper="Optional. Choose only weekdays Hito must keep clear in future plans."
              maxRunningDaysHelper="Optional. This is an upper ceiling for future plans, not a target workout count."
              preferredLongRunHelper="Rest days are unavailable here. Leave unselected to keep Sunday as the default."
            />

            <div className="hito-settings-actions">
              <HitoButton
                type="button"
                loading={isSaving}
                size="lg"
                variant="primary"
                onClick={() => {
                  void saveTrainingPreferences();
                }}
              >
                {isSaving ? "Saving..." : "Save training preferences"}
              </HitoButton>
            </div>
          </section>
        ) : (
          <div {...settingsTabs.getPanelProps("appearance")}>
            <ThemePreferenceSection />
          </div>
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
      <Input
        type="text"
        name={name}
        inputMode={inputMode}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        size="md"
        variant="primary"
      />
    </label>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <label className="grid gap-2">
      <span className="hito-form-label">{label}</span>
      <Input
        type="email"
        name="email"
        value={value}
        readOnly
        aria-readonly="true"
        autoComplete="email"
        size="md"
        variant="primary"
      />
    </label>
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
    preferredLongRunDay: settings?.trainingPreferences?.preferred_long_run_day ?? "",
    maxRunningDaysPerWeek:
      settings?.trainingPreferences?.max_running_days_per_week != null
        ? String(settings.trainingPreferences.max_running_days_per_week)
        : "",
    fitnessLevel: settings?.fitnessLevel ?? "running_regularly",
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
    fitnessLevel: form.fitnessLevel,
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

function parseRecommendedAge(value: string) {
  const trimmed = value.trim();
  const age = Number(trimmed);
  return trimmed && Number.isInteger(age) && age >= 13 && age <= 100 ? age : null;
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
