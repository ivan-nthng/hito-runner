import { useEffect, useRef, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { HitoButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import {
  RUNNER_CALENDAR_TIMEZONE_SAVE_ERROR,
  saveRunnerCalendarTimezone,
  type UserSettingsSummary,
} from "@/lib/user-settings-actions";

type RunnerCalendarTimezoneReadback = Pick<
  UserSettingsSummary,
  "calendarTimezone" | "calendarTimezoneSource"
>;

const attemptedBrowserTimezoneBootstraps = new Set<string>();

export function RunnerCalendarTimezoneBootstrap({
  enabled,
  preference,
  runnerKey,
}: {
  enabled: boolean;
  preference: RunnerCalendarTimezoneReadback | null | undefined;
  runnerKey: string | null | undefined;
}) {
  const saveRunnerCalendarTimezoneFn = useServerFn(saveRunnerCalendarTimezone);
  const router = useRouter();
  const attemptedInThisMount = useRef(false);

  useEffect(() => {
    if (
      !enabled ||
      attemptedInThisMount.current ||
      preference?.calendarTimezoneSource !== "fallback_utc"
    ) {
      return;
    }

    const browserTimezone = resolveBrowserTimezone();
    if (!browserTimezone) {
      attemptedInThisMount.current = true;
      return;
    }

    const attemptKey = `${runnerKey ?? "authenticated-runner"}\u0000${browserTimezone}`;
    if (attemptedBrowserTimezoneBootstraps.has(attemptKey)) {
      attemptedInThisMount.current = true;
      return;
    }

    attemptedInThisMount.current = true;
    attemptedBrowserTimezoneBootstraps.add(attemptKey);

    void saveRunnerCalendarTimezoneFn({
      data: {
        calendarTimezone: browserTimezone,
        source: "browser",
      },
    })
      .then(async () => {
        await router.invalidate({ sync: true });
      })
      .catch(() => undefined);
  }, [
    enabled,
    preference?.calendarTimezoneSource,
    router,
    runnerKey,
    saveRunnerCalendarTimezoneFn,
  ]);

  return null;
}

export function RunnerCalendarTimezoneSection({
  preference,
}: {
  preference: RunnerCalendarTimezoneReadback;
}) {
  const saveRunnerCalendarTimezoneFn = useServerFn(saveRunnerCalendarTimezone);
  const router = useRouter();
  const [draftTimezone, setDraftTimezone] = useState(preference.calendarTimezone);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraftTimezone(preference.calendarTimezone);
  }, [preference.calendarTimezone]);

  const useDeviceTimezone = () => {
    const browserTimezone = resolveBrowserTimezone();
    setMessage(null);

    if (!browserTimezone) {
      setError("This browser could not identify a recognized IANA timezone.");
      return;
    }

    setError(null);
    setDraftTimezone(browserTimezone);
  };

  const saveTimezone = async () => {
    const calendarTimezone = draftTimezone.trim();
    if (!calendarTimezone) {
      setMessage(null);
      setError(RUNNER_CALENDAR_TIMEZONE_SAVE_ERROR);
      return;
    }

    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const result = await saveRunnerCalendarTimezoneFn({
        data: {
          calendarTimezone,
          source: "user",
        },
      });
      setDraftTimezone(result.preference.calendarTimezone);
      await router.invalidate({ sync: true });
      setMessage(`Calendar timezone saved as ${result.preference.calendarTimezone}.`);
    } catch {
      setError(RUNNER_CALENDAR_TIMEZONE_SAVE_ERROR);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="hito-settings-section">
      <div className="flex items-center gap-2">
        <Icon name="calendar-clock" size="sm" className="text-signal" />
        <h2 className="hito-ui-title-sm text-foreground">Calendar timezone</h2>
      </div>
      <p className="hito-body-md text-secondary mt-2 max-w-2xl">
        Hito uses this IANA timezone to decide which date is Today and which workouts are past.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <label className="grid min-w-0 gap-2">
          <span className="hito-label-md text-foreground">IANA timezone</span>
          <Input
            type="text"
            name="calendarTimezone"
            autoComplete="off"
            spellCheck={false}
            value={draftTimezone}
            onChange={(event) => {
              setDraftTimezone(event.target.value);
              setError(null);
              setMessage(null);
            }}
            size="md"
            variant="primary"
            aria-invalid={error ? true : undefined}
            aria-describedby="calendar-timezone-helper calendar-timezone-feedback"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <HitoButton
            type="button"
            disabled={isSaving}
            size="md"
            variant="secondary"
            onClick={useDeviceTimezone}
          >
            Use this device
          </HitoButton>
          <HitoButton
            type="button"
            loading={isSaving}
            size="md"
            variant="primary"
            onClick={() => {
              void saveTimezone();
            }}
          >
            {isSaving ? "Saving..." : "Save timezone"}
          </HitoButton>
        </div>
      </div>

      <p id="calendar-timezone-helper" className="hito-body-xs text-secondary mt-2">
        Saved timezone: <code className="hito-inline-code">{preference.calendarTimezone}</code>.{" "}
        {timezoneSourceDescription(preference.calendarTimezoneSource)}
      </p>
      <div id="calendar-timezone-feedback" aria-live="polite" className="mt-2 min-h-5">
        {error ? (
          <p className="hito-body-md font-medium text-negative" role="alert">
            {error}
          </p>
        ) : message ? (
          <p className="hito-body-md font-medium text-positive">{message}</p>
        ) : null}
      </div>
    </section>
  );
}

function resolveBrowserTimezone() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const timezone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    return typeof timezone === "string" && timezone.trim() ? timezone : null;
  } catch {
    return null;
  }
}

function timezoneSourceDescription(
  source: RunnerCalendarTimezoneReadback["calendarTimezoneSource"],
) {
  if (source === "user") {
    return "Chosen explicitly in Settings.";
  }

  if (source === "browser") {
    return "Initialized from a browser timezone.";
  }

  return "UTC recovery fallback; this device can initialize it automatically.";
}
