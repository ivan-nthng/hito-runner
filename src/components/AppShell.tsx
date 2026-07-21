import { Link, useLocation } from "@tanstack/react-router";
import { type MutableRefObject, ReactNode, useEffect, useRef, useState } from "react";
import { DEFAULT_AUTH_REDIRECT, getLoginIntentPath } from "@/lib/auth-redirect";
import { UploadJsonDialog } from "@/components/UploadJsonDialog";
import { ActivePlanCreatePlanDialog } from "@/components/plan-management/ActivePlanCreatePlanDialog";
import {
  PlanManagementDialog,
  type PlanManagementDialogMode,
} from "@/components/PlanManagementDialog";
import {
  type PlanExportStatus,
  scheduleExportStatusReset,
  startPlanExportDownload,
} from "@/components/plan-management/plan-export-download";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HitoLogo } from "@/components/ui/hito-logo";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LocalDevtoolMenuItem } from "@/components/devtools/LocalDevtoolMenuItem";
import { ThemePreferenceMenuItems } from "@/components/settings/theme-preference-controls";
import {
  WEEK_STATUS_META,
  formatDate,
  getShellSnapshot,
  type TrainingSnapshot,
} from "@/lib/training";
import type { ViewerSummary } from "@/lib/training-api";

const NAV: { to: string; label: string; icon: HitoIconName }[] = [
  { to: "/", label: "Calendar", icon: "calendar" },
  { to: "/progress", label: "Progress", icon: "progress" },
];

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
  snapshot,
  viewer,
}: {
  children: ReactNode;
  snapshot?: TrainingSnapshot | null;
  viewer?: ViewerSummary | null;
}) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [planActionDialogMode, setPlanActionDialogMode] = useState<PlanManagementDialogMode | null>(
    null,
  );
  const [activePlanCreateOpen, setActivePlanCreateOpen] = useState(false);
  const [mobilePlanActionsOpen, setMobilePlanActionsOpen] = useState(false);
  const [showShellPlanNote, setShowShellPlanNote] = useState(true);
  const [exportStatus, setExportStatus] = useState<PlanExportStatus>("idle");
  const exportFrameRef = useRef<HTMLIFrameElement | null>(null);
  const exportResetTimerRef = useRef<number | null>(null);
  const headerDialogOpenTimerRef = useRef<number | null>(null);
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
        ? "Create plan"
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
  const showUploadAction = shellSnapshot.mode !== "preview";
  const showSettingsAction = shellSnapshot.mode !== "preview";
  const useFreshHomeRequest = shellSnapshot.mode !== "preview";
  const showPlanHeaderActions = shellSnapshot.mode !== "preview";
  const planAvailable = Boolean(snapshot?.planMeta);
  const deferHeaderDialogOpen = (openDialog: () => void) => {
    clearPlanExportResetTimer(headerDialogOpenTimerRef);

    if (typeof window === "undefined") {
      openDialog();
      return;
    }

    headerDialogOpenTimerRef.current = window.setTimeout(() => {
      headerDialogOpenTimerRef.current = null;
      openDialog();
    }, 0);
  };
  const openPlanActionDialog = (mode: PlanManagementDialogMode) => {
    setActivePlanCreateOpen(false);
    deferHeaderDialogOpen(() => setPlanActionDialogMode(mode));
  };
  const openCreatePlan = () => {
    deferHeaderDialogOpen(() => setActivePlanCreateOpen(true));
  };
  const openImportJson = () => {
    deferHeaderDialogOpen(() => setUploadOpen(true));
  };
  const closeMobilePlanActions = () => {
    setMobilePlanActionsOpen(false);
  };
  const exportJson = () => {
    setExportStatus("exporting-json");

    try {
      startPlanExportDownload("json", exportFrameRef.current?.name);
      scheduleExportStatusReset(exportResetTimerRef, setExportStatus);
    } catch (exportError) {
      setExportStatus("idle");
      hitoToast.error({
        title: "Export not started",
        description:
          exportError instanceof Error
            ? exportError.message
            : "Could not start the active plan download.",
      });
    }
  };

  useEffect(() => {
    return () => {
      clearPlanExportResetTimer(exportResetTimerRef);
      clearPlanExportResetTimer(headerDialogOpenTimerRef);
    };
  }, []);

  return (
    <div className="min-h-screen flex bg-background text-foreground hito-canvas-atmosphere">
      <aside className="hito-shell-sidebar-width hidden shrink-0 self-start flex-col border-r border-hairline bg-sidebar/60 backdrop-blur md:sticky md:top-0 md:flex md:h-screen">
        <div className="px-6 pt-7 pb-10">
          <Link to="/" reloadDocument={useFreshHomeRequest} aria-label="Hito home">
            <HitoLogo className="[--hito-logo-height:1.45rem]" />
          </Link>
          <p className="hito-shell-brand-kicker">{modeLabel}</p>
        </div>

        <nav className="hito-shell-nav px-3">
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

        <div className="mt-auto flex flex-col gap-4 p-4">
          {showShellPlanNote && (
            <div className="hito-row-group">
              <div className="hito-list-row items-start p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="hito-label flex items-center gap-2">
                      <Icon name="plan-note" size="xs" className="text-signal" />
                      Plan note
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowShellPlanNote(false)}
                      className="hito-button hito-button-ghost hito-button-xs aspect-square shrink-0 p-0 text-muted-foreground hover:text-foreground"
                      aria-label="Dismiss plan note"
                    >
                      <Icon name="close" size="xs" />
                    </button>
                  </div>
                  <p className="hito-list-row-copy">
                    {shellSnapshot.source === "persisted"
                      ? "Your saved plan and workout results show up here. Current Plan keeps reviewed plan changes, export, and future-schedule tools together."
                      : "You can browse the preview here until you sign in and save a plan."}
                  </p>
                </div>
              </div>
            </div>
          )}

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
              {showUploadAction && (
                <DropdownMenuItem
                  className="hito-shell-menu-item"
                  onSelect={(event) => {
                    event.preventDefault();
                    setUploadOpen(true);
                  }}
                >
                  <Icon name="import" size="sm" />
                  Import plan
                </DropdownMenuItem>
              )}
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
            <Link
              to="/login"
              search={nextPath === DEFAULT_AUTH_REDIRECT ? undefined : { next: nextPath }}
              className="hito-button hito-button-secondary hito-button-sm"
            >
              Sign in
            </Link>
          )}
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 border-b border-hairline bg-background/70 backdrop-blur-xl">
          <div className="flex items-center gap-6 px-6 lg:px-10 h-14">
            <Link
              to="/"
              reloadDocument={useFreshHomeRequest}
              aria-label="Hito home"
              className="md:hidden"
            >
              <HitoLogo className="[--hito-logo-height:1.15rem]" />
            </Link>
            <div className="hidden md:flex items-baseline gap-3">
              <span className="hito-micro-label">Today</span>
              <span className="hito-technical-mono">
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
              {showPlanHeaderActions ? (
                <div className="hidden md:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="hito-button hito-button-secondary hito-button-sm"
                      >
                        <Icon name="plan-note" size="xs" />
                        Current Plan
                        <Icon name="chevron-down" size="xs" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="hito-shell-menu hito-shell-menu-plan"
                    >
                      <DropdownMenuLabel>Current Plan</DropdownMenuLabel>
                      <DropdownMenuItem className="hito-shell-menu-item" onSelect={openCreatePlan}>
                        <Icon name="sparkles" size="sm" />
                        Create New Plan
                      </DropdownMenuItem>
                      <DropdownMenuItem className="hito-shell-menu-item" onSelect={openImportJson}>
                        <Icon name="import" size="sm" />
                        Import JSON
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="hito-shell-menu-item"
                        disabled={!planAvailable || exportStatus !== "idle"}
                        onSelect={exportJson}
                      >
                        <Icon name="download" size="sm" />
                        {exportStatus === "exporting-json" ? "Preparing JSON..." : "Export JSON"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="hito-shell-menu-separator" />
                      <DropdownMenuItem
                        className="hito-shell-menu-item"
                        disabled={!planAvailable}
                        onSelect={() => {
                          openPlanActionDialog("edit-schedule");
                        }}
                      >
                        <Icon name="calendar-clock" size="sm" />
                        Edit Schedule
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="hito-shell-menu-item"
                        data-tone="destructive"
                        disabled={!planAvailable}
                        onSelect={() => {
                          openPlanActionDialog("clear-upcoming");
                        }}
                      >
                        <Icon name="clear-calendar" size="sm" />
                        Clear Upcoming Schedule
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <Link
                  to={shellSnapshot.mode === "preview" ? "/login" : "/"}
                  reloadDocument={shellSnapshot.mode !== "preview"}
                  search={
                    shellSnapshot.mode === "preview" && nextPath !== DEFAULT_AUTH_REDIRECT
                      ? { next: nextPath }
                      : undefined
                  }
                  className="hito-button hito-button-secondary hito-button-sm hidden md:inline-flex"
                >
                  <Icon name="activity" size="xs" />
                  {shellSnapshot.mode === "preview" ? "Sign in to save" : "Create plan"}
                </Link>
              )}
              <Link
                to="/integrations"
                aria-label="Open Connections"
                className="hito-button hito-button-ghost hito-button-sm aspect-square p-0 md:hidden"
              >
                <Icon name="connections" size="sm" />
              </Link>
              {showSettingsAction && (
                <Link
                  to="/settings"
                  aria-label="Open profile and heart-rate settings"
                  className="hito-button hito-button-ghost hito-button-sm aspect-square p-0 md:hidden"
                >
                  <Icon name="settings" size="sm" />
                </Link>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1">{children}</div>

        <nav className="hito-shell-mobile-nav md:hidden sticky bottom-0 z-30">
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
          <Sheet open={mobilePlanActionsOpen} onOpenChange={setMobilePlanActionsOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="hito-shell-mobile-row"
                data-active={mobilePlanActionsOpen ? "true" : undefined}
                aria-label="Open current plan actions"
              >
                <Icon name="plan-note" className="hito-shell-nav-icon" />
                Current Plan
              </button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="inset-0 flex h-[100dvh] max-h-[100dvh] w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 p-0 sm:max-w-none"
            >
              <SheetHeader className="border-b border-hairline px-5 py-4 pr-14">
                <SheetTitle>Current Plan</SheetTitle>
                <SheetDescription>
                  Create, import, export, or manage the saved plan schedule.
                </SheetDescription>
              </SheetHeader>
              <div className="hito-shell-plan-sheet-body">
                {showPlanHeaderActions ? (
                  <div className="hito-row-group">
                    <MobilePlanActionButton
                      icon="sparkles"
                      label="Create New Plan"
                      onClick={() => {
                        closeMobilePlanActions();
                        openCreatePlan();
                      }}
                    />
                    <MobilePlanActionButton
                      icon="import"
                      label="Import JSON"
                      onClick={() => {
                        closeMobilePlanActions();
                        openImportJson();
                      }}
                    />
                    <MobilePlanActionButton
                      disabled={!planAvailable || exportStatus !== "idle"}
                      icon="download"
                      label={
                        exportStatus === "exporting-json" ? "Preparing JSON..." : "Export JSON"
                      }
                      onClick={() => {
                        closeMobilePlanActions();
                        exportJson();
                      }}
                    />
                    <MobilePlanActionButton
                      disabled={!planAvailable}
                      icon="calendar-clock"
                      label="Edit Schedule"
                      onClick={() => {
                        closeMobilePlanActions();
                        openPlanActionDialog("edit-schedule");
                      }}
                    />
                    <MobilePlanActionButton
                      destructive
                      disabled={!planAvailable}
                      icon="clear-calendar"
                      label="Clear Upcoming Schedule"
                      onClick={() => {
                        closeMobilePlanActions();
                        openPlanActionDialog("clear-upcoming");
                      }}
                    />
                  </div>
                ) : (
                  <div className="hito-row-group">
                    <Link
                      to="/login"
                      search={nextPath === DEFAULT_AUTH_REDIRECT ? undefined : { next: nextPath }}
                      className="hito-list-row"
                      onClick={closeMobilePlanActions}
                    >
                      <Icon name="activity" size="sm" />
                      <span className="hito-list-row-title">Sign in to save</span>
                    </Link>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </nav>
      </main>
      <UploadJsonDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        defaultStartDate={snapshot?.currentDate}
        hasActivePlan={Boolean(snapshot?.planMeta)}
      />
      <ActivePlanCreatePlanDialog
        open={activePlanCreateOpen}
        onOpenChange={setActivePlanCreateOpen}
        onOpenPlan={() => openPlanActionDialog("edit-schedule")}
        snapshot={snapshot}
      />
      <PlanManagementDialog
        mode={planActionDialogMode ?? "edit-schedule"}
        open={planActionDialogMode !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setPlanActionDialogMode(null);
          }
        }}
        snapshot={snapshot}
        viewer={viewer}
      />
      <iframe
        ref={exportFrameRef}
        name="shell-plan-export-download-frame"
        title="Plan export download"
        className="hidden"
        onLoad={() => {
          const bodyText = exportFrameRef.current?.contentDocument?.body?.textContent?.trim();

          if (!bodyText) {
            return;
          }

          setExportStatus("idle");
          hitoToast.error({
            title: "Export not ready",
            description: bodyText,
          });
        }}
      />
    </div>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="hidden lg:flex items-center gap-2">
      <span className="hito-micro-label">{label}</span>
      <span className="hito-status-pill" data-tone={weekStatusTone(value)}>
        {value}
      </span>
    </div>
  );
}

function MobilePlanActionButton({
  destructive = false,
  disabled = false,
  icon,
  label,
  onClick,
}: {
  destructive?: boolean;
  disabled?: boolean;
  icon: HitoIconName;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="hito-list-row w-full text-left"
      data-tone={destructive ? "destructive" : undefined}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon name={icon} size="sm" />
      <span className="hito-list-row-title">{label}</span>
    </button>
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

function clearPlanExportResetTimer(timerRef: MutableRefObject<number | null>) {
  if (timerRef.current != null && typeof window !== "undefined") {
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }
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
  if (snapshot?.planMeta) {
    return getShellPlanContext(snapshot.planMeta);
  }

  if (mode === "authenticated") {
    return "Saved plan";
  }

  if (mode === "onboarding") {
    return snapshot?.profile ? "No active plan" : "Profile setup";
  }

  return "Preview only";
}

function getShellPlanContext(planMeta: NonNullable<TrainingSnapshot["planMeta"]>) {
  if (planMeta.source === "preview") {
    return "Preview plan";
  }

  if (planMeta.sourceKind === "manual_user_built_plan_v1") {
    return "Manual plan";
  }

  const title = planMeta.title.trim();

  if (!title || isTechnicalShellPlanTitle(title)) {
    return "Saved plan";
  }

  return title;
}

function isTechnicalShellPlanTitle(title: string) {
  return title.includes("_") || /^[A-Z0-9\s-]{10,}$/.test(title);
}
