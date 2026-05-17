import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Camera, ChevronRight, UserRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { APP_NAME } from "@/lib/app-config";
import {
  getSettingsRouteData,
  saveUserSettings,
  type UserSettingsSummary,
} from "@/lib/training-api";

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
};

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

  if (snapshot.mode === "preview") {
    return (
      <AppShell snapshot={snapshot} viewer={viewer}>
        <div className="px-6 py-20 lg:px-10">
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
        </div>
      </AppShell>
    );
  }

  if (!settings) {
    return (
      <AppShell snapshot={snapshot} viewer={viewer}>
        <div className="px-6 py-20 lg:px-10">
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
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell snapshot={snapshot} viewer={viewer}>
      <div className="hito-route-stack max-w-5xl px-6 py-10 lg:px-10">
        <header className="hito-page-header">
          <p className="hito-label">User settings</p>
          <h1 className="hito-page-title">Profile details that follow your training.</h1>
          <p className="hito-page-copy">
            Keep your identity, avatar, and body data in one place. Heart rate zones will live here
            too once that profile slice lands.
          </p>
        </header>

        <div
          className="hito-surface-flat p-4"
          data-tone={error ? "destructive" : message ? "success" : undefined}
        >
          <div className="hito-label">
            {isUploadingAvatar ? "Uploading avatar" : isSaving ? "Saving settings" : "Ready"}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-foreground/85">
            {error
              ? error
              : message
                ? message
                : "These settings update your saved runner profile only."}
          </p>
        </div>

        <section className="grid gap-8 lg:grid-cols-[240px_1fr]">
          <div className="space-y-4 border-t border-hairline pt-5">
            <div className="flex items-center gap-3">
              <Avatar className="h-24 w-24 rounded-[26px] border border-hairline/80 bg-background/70">
                {settings.avatarUrl ? (
                  <AvatarImage src={settings.avatarUrl} alt="Profile avatar" />
                ) : null}
                <AvatarFallback className="rounded-[26px] bg-gradient-to-br from-signal to-quality text-xl font-medium text-signal-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="hito-label">Avatar</p>
                <p className="hito-support-copy mt-2">
                  Upload one square runner avatar. We keep only the processed `240x240` image.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="hito-button hito-button-secondary hito-button-sm"
              disabled={isUploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-4 w-4" strokeWidth={1.5} />
              {isUploadingAvatar ? "Uploading..." : "Upload avatar"}
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
            <section className="border-t border-hairline pt-5">
              <div className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-signal" strokeWidth={1.5} />
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

            <section className="border-t border-hairline pt-5">
              <h2 className="hito-section-title">Body data</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <Field
                  label="Age"
                  name="age"
                  value={form.age}
                  inputMode="numeric"
                  autoComplete="off"
                  onChange={(value) => setForm((current) => ({ ...current, age: value }))}
                />
                <Field
                  label="Weight (kg)"
                  name="weightKg"
                  value={form.weightKg}
                  inputMode="decimal"
                  autoComplete="off"
                  onChange={(value) => setForm((current) => ({ ...current, weightKg: value }))}
                />
                <Field
                  label="Height (cm)"
                  name="heightCm"
                  value={form.heightCm}
                  inputMode="decimal"
                  autoComplete="off"
                  onChange={(value) => setForm((current) => ({ ...current, heightCm: value }))}
                />
              </div>
            </section>

            <section className="border-t border-hairline pt-5">
              <h2 className="hito-section-title">Heart rate zones</h2>
              <p className="hito-support-copy mt-3">
                This is where your runner-level zones will live. Manual entry and FIT-based
                estimation are planned next.
              </p>
            </section>

            <div className="flex flex-wrap items-center gap-3 border-t border-hairline pt-5">
              <button
                type="button"
                disabled={isSaving}
                className="hito-button hito-button-primary hito-button-lg"
                onClick={async () => {
                  setIsSaving(true);
                  setError(null);
                  setMessage(null);

                  try {
                    await saveUserSettingsFn({
                      data: {
                        firstName: normalizeTextInput(form.firstName),
                        lastName: normalizeTextInput(form.lastName),
                        displayName: normalizeTextInput(form.displayName),
                        age: parseIntegerInput(form.age),
                        weightKg: parseDecimalInput(form.weightKg),
                        heightCm: parseDecimalInput(form.heightCm),
                      },
                    });
                    await router.invalidate();
                    setMessage("User settings saved.");
                  } catch (saveError) {
                    setError(
                      saveError instanceof Error
                        ? saveError.message
                        : "User settings could not be saved.",
                    );
                  } finally {
                    setIsSaving(false);
                  }
                }}
              >
                {isSaving ? "Saving..." : "Save settings"}
              </button>
              <Link to="/" reloadDocument className="hito-button hito-button-ghost hito-button-lg">
                Back to calendar
                <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </section>
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
      <span className="hito-label">{label}</span>
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
      <span className="hito-label">{label}</span>
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

function buildSettingsFormState(settings: UserSettingsSummary | null): SettingsFormState {
  return {
    firstName: settings?.firstName ?? "",
    lastName: settings?.lastName ?? "",
    displayName: settings?.displayName ?? "",
    age: settings?.age != null ? String(settings.age) : "",
    weightKg: settings?.weightKg != null ? String(settings.weightKg) : "",
    heightCm: settings?.heightCm != null ? String(settings.heightCm) : "",
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
