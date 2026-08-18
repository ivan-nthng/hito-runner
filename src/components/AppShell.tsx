import { Link, useLocation } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { type ReactNode, useEffect, useState } from "react";
import { DEFAULT_AUTH_REDIRECT, getLoginIntentPath } from "@/lib/auth-redirect";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HitoButton } from "@/components/ui/button";
import { HitoLogo } from "@/components/ui/hito-logo";
import { HitoLanguageMenuItems } from "@/components/ui/hito-language-menu";
import { hitoToast } from "@/components/ui/hito-toast";
import { Icon, type HitoIconName } from "@/components/ui/icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LocalDevtoolMenuItem } from "@/components/devtools/LocalDevtoolMenuItem";
import { ThemePreferenceMenuItems } from "@/components/settings/theme-preference-controls";
import { RunnerCalendarTimezoneBootstrap } from "@/components/settings/RunnerCalendarTimezonePreference";
import { DEFAULT_RUNNER_CALENDAR_TIMEZONE } from "@/lib/runner-calendar-timezone";
import {
  WEEK_STATUS_META,
  formatDate,
  getShellSnapshot,
  type TrainingSnapshot,
} from "@/lib/training";
import type { ViewerSummary } from "@/lib/training-api";
import { saveUserSettings, type UserSettingsSummary } from "@/lib/user-settings-actions";
import {
  DEFAULT_RESOLVED_UI_LOCALE,
  resolveRequestUiLocale,
  type ResolvedUiLocale,
  type UiLocalePreference,
} from "@/lib/ui-locale";

const NAV: { to: string; label: string; icon: HitoIconName }[] = [
  { to: "/", label: "Calendar", icon: "calendar" },
  { to: "/progress", label: "Progress", icon: "progress" },
];

const FALLBACK_RUNNER_CALENDAR_TIMEZONE_PREFERENCE = {
  calendarTimezone: DEFAULT_RUNNER_CALENDAR_TIMEZONE,
  calendarTimezoneSource: "fallback_utc",
} as const;

function getCurrentShellNavPath(pathname: string): string | null {
  if (pathname === "/" || pathname.startsWith("/workout/")) {
    return "/";
  }

  if (pathname === "/progress" || pathname.startsWith("/progress/")) {
    return "/progress";
  }

  return null;
}

export function AppShell({
  children,
  settings,
  snapshot,
  viewer,
}: {
  children: ReactNode;
  settings?: UserSettingsSummary | null;
  snapshot?: TrainingSnapshot | null;
  viewer?: ViewerSummary | null;
}) {
  const [showShellCalendarNote, setShowShellCalendarNote] = useState(true);
  const [languageSettings, setLanguageSettings] = useState(settings);
  const [languageSavePending, setLanguageSavePending] = useState(false);
  const [deviceLocale, setDeviceLocale] = useState<ResolvedUiLocale>(DEFAULT_RESOLVED_UI_LOCALE);
  const saveUserSettingsFn = useServerFn(saveUserSettings);
  const loc = useLocation();
  const currentNavPath = getCurrentShellNavPath(loc.pathname);
  const nextPath = getLoginIntentPath(
    loc.pathname,
    "searchStr" in loc && typeof loc.searchStr === "string" ? loc.searchStr : undefined,
  );
  const shellSnapshot = getShellSnapshot(snapshot);
  const weekStatus = WEEK_STATUS_META[shellSnapshot.weekStatus];
  const modeLabel =
    shellSnapshot.mode === "authenticated"
      ? "Beta"
      : shellSnapshot.mode === "onboarding"
        ? "Setup"
        : "Preview";
  const profileName = viewer?.name
    ? viewer.name
    : shellSnapshot.mode === "authenticated"
      ? "Runner"
      : shellSnapshot.mode === "onboarding"
        ? "Runner setup"
        : "Guest runner";
  const profileDetail = getProfileDetail(snapshot, shellSnapshot.mode);
  const profileInitials = buildInitials(profileName);
  const showSettingsAction = shellSnapshot.mode !== "preview";
  const useFreshHomeRequest = shellSnapshot.mode !== "preview";
  const showLanguageAction = snapshot?.source === "persisted" && settings !== undefined;
  const explicitLanguagePreference =
    languageSettings?.uiLocalePreference === "en" ||
    languageSettings?.uiLocalePreference === "pt-BR"
      ? languageSettings.uiLocalePreference
      : null;
  const resolvedLocale = explicitLanguagePreference ?? deviceLocale;

  useEffect(() => {
    setDeviceLocale(
      resolveRequestUiLocale(
        navigator.languages.length > 0 ? navigator.languages.join(",") : navigator.language,
      ),
    );
  }, []);

  const saveLanguagePreference = async (preference: UiLocalePreference) => {
    if (languageSavePending) {
      return;
    }

    setLanguageSavePending(true);

    try {
      const result = await saveUserSettingsFn({
        data: {
          firstName: languageSettings?.firstName ?? null,
          lastName: languageSettings?.lastName ?? null,
          displayName: languageSettings?.displayName ?? null,
          age: languageSettings?.age ?? null,
          weightKg: languageSettings?.weightKg ?? null,
          heightCm: languageSettings?.heightCm ?? null,
          ...(languageSettings?.fitnessLevel
            ? { fitnessLevel: languageSettings.fitnessLevel }
            : {}),
          uiLocalePreference: preference,
        },
      });
      setLanguageSettings(result.settings);
    } catch (error) {
      hitoToast.error({
        title: "Language preference not saved",
        description: error instanceof Error ? error.message : "Try choosing the language again.",
      });
    } finally {
      setLanguageSavePending(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <RunnerCalendarTimezoneBootstrap
        enabled={snapshot?.source === "persisted"}
        preference={
          snapshot?.source === "persisted"
            ? (snapshot.profile ?? FALLBACK_RUNNER_CALENDAR_TIMEZONE_PREFERENCE)
            : null
        }
        runnerKey={viewer?.email}
      />
      <aside className="hito-shell-sidebar-width hidden h-screen min-h-0 shrink-0 self-start box-border flex-col overflow-hidden border-r border-hairline bg-sidebar supports-[height:100dvh]:h-dvh [@media(min-width:48rem)_and_(min-height:32rem)]:sticky [@media(min-width:48rem)_and_(min-height:32rem)]:top-0 [@media(min-width:48rem)_and_(min-height:32rem)]:flex">
        <div className="shrink-0 pb-10 pr-6 pl-[max(var(--space-6),env(safe-area-inset-left))] pt-[max(1.75rem,env(safe-area-inset-top))]">
          <Link to="/" reloadDocument={useFreshHomeRequest} aria-label="Hito home">
            <HitoLogo className="[--hito-logo-height:1.45rem]" />
          </Link>
          <p className="hito-shell-brand-kicker">{modeLabel}</p>
        </div>

        <nav className="hito-shell-nav shrink-0 px-3">
          {NAV.map((navItem) => {
            const active = currentNavPath === navItem.to;
            return (
              <Link
                key={navItem.to}
                to={navItem.to}
                reloadDocument={navItem.to === "/" && useFreshHomeRequest}
                data-active={active ? "true" : undefined}
                aria-current={active ? "page" : undefined}
                className="hito-shell-nav-row"
              >
                <Icon name={navItem.icon} className="hito-shell-nav-icon" />
                <span>{navItem.label}</span>
                {active && <span className="hito-shell-nav-dot" />}
              </Link>
            );
          })}
        </nav>

        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain p-4">
          {showShellCalendarNote && (
            <div className="hito-row-group">
              <div className="hito-list-row items-start p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="hito-label-md text-foreground flex items-center gap-2">
                      <Icon name="plan-note" size="xs" className="text-signal" />
                      {shellSnapshot.source === "persisted" ? "Beta User" : "Preview note"}
                    </div>
                    <HitoButton
                      type="button"
                      onClick={() => setShowShellCalendarNote(false)}
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                      iconOnly
                      size="xs"
                      variant="ghost"
                      aria-label={
                        shellSnapshot.source === "persisted"
                          ? "Dismiss Beta User note"
                          : "Dismiss preview note"
                      }
                    >
                      <Icon name="close" size="xs" />
                    </HitoButton>
                  </div>
                  <p className="hito-body-sm mt-1 text-secondary">
                    {shellSnapshot.source === "persisted"
                      ? "All features are free for you."
                      : "You can browse the preview here until you sign in and save a plan."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-4 pl-4 pr-[max(var(--space-4),env(safe-area-inset-right))] pb-[max(var(--space-4),env(safe-area-inset-bottom))]">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="hito-shell-profile-trigger group">
                <Avatar className="h-9 w-9 border border-hairline/80 bg-background/70">
                  {viewer?.avatarUrl ? (
                    <AvatarImage src={viewer.avatarUrl} alt={profileName} />
                  ) : null}
                  <AvatarFallback className="hito-shell-avatar-fallback">
                    {profileInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="hito-menu-text truncate">{profileName}</div>
                  <div className="hito-menu-meta truncate">{profileDetail}</div>
                </div>
                <Icon
                  name="chevron-up"
                  size="sm"
                  className="text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="start"
              className="hito-shell-menu hito-shell-menu-profile"
            >
              <DropdownMenuLabel className="hito-shell-profile-menu-label pb-1">
                <div className="hito-menu-text">{profileName}</div>
                <div className="hito-menu-meta mt-1 truncate">{profileDetail}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="hito-shell-menu-separator" />
              {showSettingsAction && (
                <DropdownMenuItem className="hito-shell-menu-item" asChild>
                  <Link to="/settings">
                    <Icon name="settings" size="sm" />
                    Profile &amp; heart rate
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="hito-shell-menu-item" asChild>
                <Link to="/integrations">
                  <Icon name="connections" size="sm" />
                  Connections
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="hito-shell-menu-separator" />
              <ThemePreferenceMenuItems
                itemClassName="hito-shell-theme-menu-item"
                labelClassName="hito-shell-theme-menu-label"
              />
              <DropdownMenuSeparator className="hito-shell-menu-separator" />
              {showLanguageAction ? (
                <>
                  <HitoLanguageMenuItems
                    onPreferenceChange={(preference) => {
                      void saveLanguagePreference(preference);
                    }}
                    preference={languageSettings?.uiLocalePreference ?? null}
                    resolvedLocale={resolvedLocale}
                  />
                  <DropdownMenuSeparator className="hito-shell-menu-separator" />
                </>
              ) : null}
              <LocalDevtoolMenuItem
                itemClassName="hito-shell-menu-item"
                separatorClassName="hito-shell-menu-separator"
              />
              <DropdownMenuItem className="hito-shell-menu-item" asChild>
                <a href="/api/auth/logout?next=%2F">
                  <Icon name="logout" size="sm" />
                  Sign out
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {shellSnapshot.mode === "preview" && loc.pathname !== "/login" && (
            <HitoButton asChild size="sm" variant="secondary">
              <Link
                to="/login"
                search={nextPath === DEFAULT_AUTH_REDIRECT ? undefined : { next: nextPath }}
              >
                Sign in
              </Link>
            </HitoButton>
          )}
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col bg-background dark:bg-surface">
        <header className="hito-workbench-topbar">
          <div className="flex h-14 items-center gap-hito-4 px-hito-4 sm:gap-6 sm:px-6 lg:px-10">
            <Link
              to="/"
              reloadDocument={useFreshHomeRequest}
              aria-label="Hito home"
              className="[@media(min-width:48rem)_and_(min-height:32rem)]:hidden"
            >
              <HitoLogo className="[--hito-logo-height:1.15rem]" />
            </Link>
            <div className="hidden items-baseline gap-3 [@media(min-width:48rem)_and_(min-height:32rem)]:flex">
              <span className="hito-label-sm uppercase tracking-[0.18em] text-tertiary">Today</span>
              <span className="hito-technical-sm text-secondary">
                {formatDate(shellSnapshot.currentDate, {
                  month: "long",
                  day: "numeric",
                  weekday: "long",
                })}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              {shellSnapshot.mode === "authenticated" ? (
                <StatusPill label="Week" value={weekStatus.label} />
              ) : null}
              {shellSnapshot.mode === "preview" ? (
                <HitoButton
                  asChild
                  className="hidden [@media(min-width:48rem)_and_(min-height:32rem)]:inline-flex"
                  size="sm"
                  variant="secondary"
                >
                  <Link
                    to="/login"
                    search={nextPath !== DEFAULT_AUTH_REDIRECT ? { next: nextPath } : undefined}
                  >
                    <Icon name="activity" size="xs" />
                    Sign in to save
                  </Link>
                </HitoButton>
              ) : null}
              <HitoButton
                asChild
                aria-label="Open Connections"
                className="[@media(min-width:48rem)_and_(min-height:32rem)]:hidden"
                iconOnly
                size="sm"
                variant="ghost"
              >
                <Link to="/integrations">
                  <Icon name="connections" size="sm" />
                </Link>
              </HitoButton>
              {showSettingsAction && (
                <HitoButton
                  asChild
                  aria-label="Open profile and heart-rate settings"
                  className="[@media(min-width:48rem)_and_(min-height:32rem)]:hidden"
                  iconOnly
                  size="sm"
                  variant="ghost"
                >
                  <Link to="/settings">
                    <Icon name="settings" size="sm" />
                  </Link>
                </HitoButton>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1">{children}</div>

        <nav className="hito-shell-mobile-nav sticky bottom-0 z-30 [@media(min-width:48rem)_and_(min-height:32rem)]:hidden">
          {NAV.map((navItem) => {
            const active = currentNavPath === navItem.to;
            return (
              <Link
                key={navItem.to}
                to={navItem.to}
                reloadDocument={navItem.to === "/" && useFreshHomeRequest}
                data-active={active ? "true" : undefined}
                aria-current={active ? "page" : undefined}
                className="hito-shell-mobile-row"
              >
                <Icon name={navItem.icon} className="hito-shell-nav-icon" />
                {navItem.label}
              </Link>
            );
          })}
          {shellSnapshot.mode === "preview" ? (
            <Link
              to="/login"
              search={nextPath === DEFAULT_AUTH_REDIRECT ? undefined : { next: nextPath }}
              className="hito-shell-mobile-row"
            >
              <Icon name="activity" className="hito-shell-nav-icon" />
              Sign in to save
            </Link>
          ) : null}
        </nav>
      </main>
    </div>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="hidden lg:flex items-center gap-2">
      <span className="hito-label-sm uppercase tracking-[0.18em] text-tertiary">{label}</span>
      <span className="hito-status-pill" data-tone={weekStatusTone(value)}>
        {value}
      </span>
    </div>
  );
}

function weekStatusTone(value: string) {
  if (/preview/i.test(value)) {
    return "neutral";
  }

  if (/reset|missed|off/i.test(value)) {
    return "warning";
  }

  return "success";
}

function buildInitials(name: string) {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.length) {
    return "HR";
  }

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function getProfileDetail(
  snapshot: TrainingSnapshot | null | undefined,
  mode: ReturnType<typeof getShellSnapshot>["mode"],
) {
  if (mode === "preview" && snapshot?.planMeta?.source === "preview") {
    return "Preview plan";
  }

  if (mode === "authenticated") {
    return "Runner Calendar";
  }

  if (mode === "onboarding") {
    return snapshot?.profile ? "Training setup" : "Profile setup";
  }

  return "Preview only";
}
