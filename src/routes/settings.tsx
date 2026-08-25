import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { TrainingPreferenceFields } from "@/components/onboarding/TrainingPreferenceFields";
import { ThemePreferenceSection } from "@/components/settings/ThemePreferenceSection";
import { RunnerCalendarTimezoneSection } from "@/components/settings/RunnerCalendarTimezonePreference";
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
import type { HitoProductApiFailure } from "@/lib/product-api-error-contract";
import { type RunnerFitnessLevel } from "@/lib/runner-training-preferences";
import { saveUserSettings, type UserSettingsSummary } from "@/lib/user-settings-actions";
import { getSettingsRouteData } from "@/lib/training-api";
import { useHitoProductMessage, useHitoUiLocale } from "@/components/ui/hito-ui-locale-provider";
import {
  getHitoKnownProductMessage,
  getHitoProductApiFailureMessage,
} from "@/lib/ui-locale-messages";

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
  const routeData = Route.useLoaderData();
  const { snapshot, viewer, settings } = routeData;

  return (
    <AppShell settings={settings} snapshot={snapshot} viewer={viewer}>
      <SettingsPageContent routeData={routeData} />
    </AppShell>
  );
}

function SettingsPageContent({ routeData }: { routeData: ReturnType<typeof Route.useLoaderData> }) {
  const { snapshot, viewer, settings } = routeData;
  const locale = useHitoUiLocale();
  const translate = useHitoProductMessage();
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
      setError(translate("Check the highlighted BPM ranges before saving personal data."));
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
      setMessage(translate("Personal data saved."));
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : translate("User settings could not be saved."),
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
      setMessage(translate("Training preferences saved."));
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : translate("Training preferences could not be saved."),
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (snapshot.mode === "preview") {
    return (
      <div className="hito-route-gutter hito-route-stack py-20">
        <section className="hito-state-surface" data-tone="signal">
          <p className="hito-label-md text-foreground">{translate("Sign in first")}</p>
          <h1 className="hito-ui-title-xl mt-2 max-w-[44rem]">
            {translate("User settings open after sign-in.")}
          </h1>
          <p className="hito-body-md mt-4 max-w-[40rem] text-secondary">
            {translate(
              "Save a profile first, then you can manage your avatar, body data, and future heart rate settings here.",
            )}
          </p>
          <div className="hito-state-actions">
            <HitoButton asChild size="lg" variant="primary">
              <Link to="/login">{translate("Sign in")}</Link>
            </HitoButton>
          </div>
        </section>
        <ThemePreferenceSection />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="hito-route-gutter hito-route-stack py-20">
        <section className="hito-state-surface" data-tone="signal">
          <p className="hito-label-md text-foreground">{translate("Finish setup first")}</p>
          <h1 className="hito-ui-title-xl mt-2 max-w-[44rem]">
            {translate("User settings need a saved runner profile.")}
          </h1>
          <p className="hito-body-md mt-4 max-w-[40rem] text-secondary">
            {translate(
              "Complete setup on home first, then this page can store your profile details.",
            )}
          </p>
          <div className="hito-state-actions">
            <HitoButton asChild size="lg" variant="primary">
              <Link to="/" reloadDocument>
                {translate("Back to home")}
              </Link>
            </HitoButton>
          </div>
        </section>
        <ThemePreferenceSection />
      </div>
    );
  }

  return (
    <div className="hito-route-gutter hito-route-stack max-w-5xl py-hito-6 sm:py-10">
      <header className="hito-page-header">
        <p className="hito-label-md text-foreground">{translate("User settings")}</p>
        <h1 className="hito-ui-title-xl mt-2 max-w-[44rem]">
          {translate("Profile details that follow your training.")}
        </h1>
        <p className="hito-body-md mt-4 max-w-[40rem] text-secondary">
          {translate(
            "Keep your personal data and future-plan training defaults in one place. Settings update your runner profile, not existing Calendar workouts.",
          )}
        </p>
      </header>

      <div
        className="hito-state-surface p-4"
        data-tone={error ? "destructive" : message ? "success" : undefined}
      >
        <div className="hito-label-md text-foreground">
          {isUploadingAvatar
            ? translate("Uploading avatar")
            : isSaving
              ? translate("Saving settings")
              : translate("Ready")}
        </div>
        <p className="hito-body-md text-secondary mt-2">
          {error
            ? getHitoKnownProductMessage(locale, error)
            : message
              ? getHitoKnownProductMessage(locale, message)
              : translate("These settings update your saved runner profile only.")}
        </p>
      </div>

      <div
        className="hito-tabs hito-tabs-enclosed"
        {...settingsTabs.tabListProps}
        aria-label={translate("Settings section")}
      >
        <button
          type="button"
          {...settingsTabs.getTabProps("personal")}
          className="hito-tab"
          data-active={activeTab === "personal"}
          onClick={() => setActiveTab("personal")}
        >
          {translate("Personal data")}
        </button>
        <button
          type="button"
          {...settingsTabs.getTabProps("training")}
          className="hito-tab"
          data-active={activeTab === "training"}
          onClick={() => setActiveTab("training")}
        >
          {translate("Training preferences")}
        </button>
        <button
          type="button"
          {...settingsTabs.getTabProps("appearance")}
          className="hito-tab"
          data-active={activeTab === "appearance"}
          onClick={() => setActiveTab("appearance")}
        >
          {translate("Appearance")}
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
                <AvatarImage src={settings.avatarUrl} alt={translate("Profile avatar")} />
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
              {isUploadingAvatar
                ? translate("Uploading...")
                : settings.avatarUrl
                  ? translate("Edit")
                  : translate("Upload")}
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
                  const processedFile = await buildAvatarUploadFile(file).catch(() => null);
                  if (!processedFile) {
                    setError(
                      translate(
                        "The source image could not be prepared. Choose another JPEG, PNG, or WebP image.",
                      ),
                    );
                    return;
                  }
                  const formData = new FormData();
                  formData.set("file", processedFile);
                  const response = await fetch("/api/profile-avatar/upload", {
                    method: "POST",
                    body: formData,
                  });
                  const payload = (await response.json().catch(() => null)) as
                    | { ok: true; avatarUrl: string }
                    | HitoProductApiFailure
                    | null;

                  if (!response.ok || !payload || !payload.ok) {
                    setError(
                      payload && !payload.ok
                        ? getHitoProductApiFailureMessage(locale, payload)
                        : translate("The avatar could not be uploaded."),
                    );
                    return;
                  }

                  await router.invalidate();
                  setMessage(translate("Avatar updated."));
                } catch {
                  setError(translate("The avatar could not be uploaded."));
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
                <h2 className="hito-ui-title-sm text-foreground">{translate("Identity")}</h2>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field
                  label={translate("First name")}
                  name="firstName"
                  autoComplete="given-name"
                  value={form.firstName}
                  onChange={(value) => setForm((current) => ({ ...current, firstName: value }))}
                />
                <Field
                  label={translate("Last name")}
                  name="lastName"
                  autoComplete="family-name"
                  value={form.lastName}
                  onChange={(value) => setForm((current) => ({ ...current, lastName: value }))}
                />
                <Field
                  label={translate("Display name")}
                  name="displayName"
                  autoComplete="nickname"
                  value={form.displayName}
                  onChange={(value) => setForm((current) => ({ ...current, displayName: value }))}
                />
                <ReadOnlyField
                  label={translate("Email")}
                  value={settings.email || translate("No saved email")}
                />
              </div>
            </section>

            <RunnerCalendarTimezoneSection preference={settings} />

            <section className="hito-settings-section">
              <h2 className="hito-ui-title-sm text-foreground">{translate("Body data")}</h2>
              <p className="hito-body-md text-secondary mt-2">
                {translate("The same compact profile facts used during runner setup.")}
              </p>
              <div className="hito-editable-value-field-group mt-4">
                <EditableValueField
                  fieldKey="age"
                  label={translate("Age")}
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
                  label={translate("Height")}
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
                  label={translate("Weight")}
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
                {isSaving ? translate("Saving...") : translate("Save personal data")}
              </HitoButton>
              <HitoButton asChild size="lg" variant="ghost">
                <Link to="/" reloadDocument>
                  {translate("Back to calendar")}
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
              <h2 className="hito-ui-title-sm text-foreground">
                {translate("Training preferences")}
              </h2>
            </div>
            <p className="hito-body-md text-secondary mt-3 max-w-2xl">
              {translate(
                "Defaults for future plan creation. They prefill setup but never rewrite existing Calendar workouts.",
              )}
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
            fitnessBenchmarkHelper={translate(
              "Recent 5K details are added per plan. Settings can preserve an existing custom level or switch to a standard level.",
            )}
            preferredLongRunMode="default-sunday"
            fixedRestDaysHelper={translate(
              "Optional. Choose only weekdays Hito must keep clear in future plans.",
            )}
            maxRunningDaysHelper={translate(
              "Optional. This is an upper ceiling for future plans, not a target workout count.",
            )}
            preferredLongRunHelper={translate(
              "Rest days are unavailable here. Leave unselected to keep Sunday as the default.",
            )}
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
              {isSaving ? translate("Saving...") : translate("Save training preferences")}
            </HitoButton>
          </div>
        </section>
      ) : (
        <div {...settingsTabs.getPanelProps("appearance")}>
          <ThemePreferenceSection />
        </div>
      )}
    </div>
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
      <span className="hito-label-md text-foreground">{label}</span>
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
      <span className="hito-label-md text-foreground">{label}</span>
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
