import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, type ReactNode } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LocalDevtoolMenuItem } from "@/components/devtools/LocalDevtoolMenuItem";
import { HitoLogo } from "@/components/ui/hito-logo";
import { HitoLanguageMenuItems } from "@/components/ui/hito-language-menu";
import { hitoToast } from "@/components/ui/hito-toast";
import { Icon } from "@/components/ui/icon";
import {
  ADMIN_WORKSPACE_NAV_ITEMS,
  type AdminWorkspaceSectionId,
} from "@/components/admin/admin-workspace-nav-model";
import { ThemePreferenceMenuItems } from "@/components/settings/theme-preference-controls";
import { saveUserSettings, type UserSettingsSummary } from "@/lib/user-settings-actions";
import {
  DEFAULT_RESOLVED_UI_LOCALE,
  resolveRequestUiLocale,
  type ResolvedUiLocale,
  type UiLocalePreference,
} from "@/lib/ui-locale";

export function AdminWorkspaceSidebar({
  activeSection,
  settings,
}: {
  activeSection: AdminWorkspaceSectionId;
  settings: UserSettingsSummary | null;
}) {
  return (
    <aside className="hito-workbench-sidebar">
      <div className="px-5 pb-7 pt-6">
        <Link to="/" className="hito-admin-brand hito-label-md">
          <HitoLogo decorative className="[--hito-logo-height:1.15rem]" />
          <span>Admin</span>
        </Link>
        <p className="hito-body-xs mt-1 text-tertiary">Admin workspace</p>
      </div>

      <AdminWorkspaceNav activeSection={activeSection} variant="sidebar" />

      <div className="mt-auto p-4">
        <AdminWorkspaceAccountMenu activeSection={activeSection} settings={settings} />
      </div>
    </aside>
  );
}

export function AdminWorkspacePageHeader({
  activeSection,
  action,
  description,
  mobileMeta,
  settings,
  title,
}: {
  activeSection: AdminWorkspaceSectionId;
  action?: ReactNode;
  description: string;
  mobileMeta?: ReactNode;
  settings: UserSettingsSummary | null;
  title: string;
}) {
  const activeItem = ADMIN_WORKSPACE_NAV_ITEMS.find((item) => item.id === activeSection);

  return (
    <header className="hito-workbench-topbar">
      <div className="flex flex-col gap-4 px-5 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <div className="min-w-0">
          <div className="hito-admin-mobile-shell lg:hidden">
            <div className="hito-workbench-location">
              <span className="hito-workbench-location-title hito-ui-title-xs">
                Admin workspace
              </span>
              <span className="hito-workbench-location-meta hito-label-md">
                <span>{activeItem?.label ?? title}</span>
                {mobileMeta ? (
                  <>
                    <span aria-hidden="true">/</span>
                    <span>{mobileMeta}</span>
                  </>
                ) : null}
              </span>
            </div>
            <AdminWorkspaceAccountMenu activeSection={activeSection} compact settings={settings} />
          </div>
          <h1 className="hito-ui-title-md mt-3 text-foreground lg:mt-0">{title}</h1>
          <p className="hito-body-md mt-2 max-w-3xl text-muted-foreground">{description}</p>
        </div>
        {action ? (
          <div className="flex flex-wrap items-start gap-2 lg:items-center">{action}</div>
        ) : null}
      </div>
      <AdminWorkspaceNav activeSection={activeSection} variant="mobile" />
    </header>
  );
}

function AdminWorkspaceNav({
  activeSection,
  variant,
}: {
  activeSection: AdminWorkspaceSectionId;
  variant: "sidebar" | "mobile";
}) {
  const isSidebar = variant === "sidebar";

  return (
    <nav
      className={isSidebar ? "hito-shell-nav px-3" : "hito-workbench-section-rail lg:hidden"}
      aria-label="Admin workspace sections"
    >
      <div className={isSidebar ? "grid gap-0.5" : "hito-workbench-quick-links"}>
        {ADMIN_WORKSPACE_NAV_ITEMS.map((item) => {
          const active = activeSection === item.id;

          return (
            <a
              key={item.id}
              href={item.href}
              className={isSidebar ? "hito-shell-nav-row" : "hito-workbench-quick-link"}
              data-active={active ? "true" : undefined}
              aria-current={active ? "page" : undefined}
            >
              {isSidebar ? <Icon name={item.icon} className="hito-shell-nav-icon" /> : null}
              {item.label}
              {isSidebar && active ? <span className="hito-shell-nav-dot" /> : null}
            </a>
          );
        })}
      </div>
    </nav>
  );
}

function AdminWorkspaceAccountMenu({
  activeSection,
  compact = false,
  settings,
}: {
  activeSection: AdminWorkspaceSectionId;
  compact?: boolean;
  settings: UserSettingsSummary | null;
}) {
  const [languageSettings, setLanguageSettings] = useState(settings);
  const [languageSavePending, setLanguageSavePending] = useState(false);
  const [deviceLocale, setDeviceLocale] = useState<ResolvedUiLocale>(DEFAULT_RESOLVED_UI_LOCALE);
  const saveUserSettingsFn = useServerFn(saveUserSettings);
  const logoutNext = activeSection === "work-items" ? "%2Fadmin%2Fcapture" : "%2Fadmin%2Fanalytics";
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="hito-shell-profile-trigger hito-admin-account-trigger group"
          data-variant={compact ? "compact" : undefined}
          aria-label="Open admin account menu"
        >
          <Avatar className="h-9 w-9 border border-hairline/80 bg-background/70">
            <AvatarFallback className="hito-shell-avatar-fallback">A</AvatarFallback>
          </Avatar>
          {!compact ? (
            <div className="min-w-0 flex-1">
              <div className="hito-menu-text truncate">Admin</div>
              <div className="hito-body-xs truncate text-tertiary">Local operations</div>
            </div>
          ) : null}
          <Icon
            name={compact ? "chevron-down" : "chevron-up"}
            size="sm"
            className="text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={compact ? "bottom" : "top"}
        align={compact ? "end" : "start"}
        className="hito-shell-menu hito-shell-menu-account"
      >
        <DropdownMenuLabel className="pb-1">
          <div className="hito-menu-text">Admin</div>
          <div className="hito-body-xs mt-1 truncate text-tertiary">Local operations</div>
          <div className="hito-label-sm mt-2 text-tertiary">Admin workspace</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="hito-shell-menu-separator" />
        <DropdownMenuItem className="hito-shell-menu-item" asChild>
          <Link to="/">
            <Icon name="arrow-left" size="sm" />
            Back to Hito
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="hito-shell-menu-separator" />
        <ThemePreferenceMenuItems
          itemClassName="hito-shell-theme-menu-item"
          labelClassName="hito-shell-theme-menu-label"
        />
        <DropdownMenuSeparator className="hito-shell-menu-separator" />
        <HitoLanguageMenuItems
          onPreferenceChange={(preference) => {
            void saveLanguagePreference(preference);
          }}
          preference={languageSettings?.uiLocalePreference ?? null}
          resolvedLocale={resolvedLocale}
        />
        <DropdownMenuSeparator className="hito-shell-menu-separator" />
        <LocalDevtoolMenuItem
          itemClassName="hito-shell-menu-item"
          separatorClassName="hito-shell-menu-separator"
        />
        <DropdownMenuItem className="hito-shell-menu-item" asChild>
          <a href={`/api/admin/auth/logout?next=${logoutNext}`}>
            <Icon name="logout" size="sm" />
            Sign out
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
