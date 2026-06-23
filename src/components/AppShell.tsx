import { Link, useLocation } from "@tanstack/react-router";
import { ReactNode, useState } from "react";
import { DEFAULT_AUTH_REDIRECT, getLoginIntentPath } from "@/lib/auth-redirect";
import { UploadJsonDialog } from "@/components/UploadJsonDialog";
import { ActivePlanCreatePlanDialog } from "@/components/plan-management/ActivePlanCreatePlanDialog";
import { PlanManagementDialog } from "@/components/PlanManagementDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HitoLogo } from "@/components/ui/hito-logo";
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
  WEEK_STATUS_META,
  formatDate,
  getShellSnapshot,
  type TrainingSnapshot,
} from "@/lib/training";
import type { ViewerSummary } from "@/lib/training-api";
import { MANUAL_USER_BUILT_PLAN_SOURCE_KIND } from "@/lib/manual-workout-authoring/schema";

const NAV: { to: string; label: string; icon: HitoIconName }[] = [
  { to: "/", label: "Calendar", icon: "calendar" },
  { to: "/progress", label: "Progress", icon: "progress" },
];

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
  const [planManagementOpen, setPlanManagementOpen] = useState(false);
  const [activePlanCreateOpen, setActivePlanCreateOpen] = useState(false);
  const [showShellPlanNote, setShowShellPlanNote] = useState(true);
  const loc = useLocation();
  const nextPath = getLoginIntentPath(
    loc.pathname,
    "searchStr" in loc && typeof loc.searchStr === "string" ? loc.searchStr : undefined,
  );
  const shellSnapshot = getShellSnapshot(snapshot);
  const weekStatus = WEEK_STATUS_META[shellSnapshot.weekStatus];
  const modeLabel =
    shellSnapshot.mode === "authenticated"
      ? "Saved plan"
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
  const canCreatePlanFromActiveManualPlan =
    shellSnapshot.mode === "authenticated" &&
    snapshot?.planMeta?.sourceKind === MANUAL_USER_BUILT_PLAN_SOURCE_KIND;
  const openPlanManagement = () => {
    setActivePlanCreateOpen(false);
    setPlanManagementOpen(true);
  };

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
            const active =
              loc.pathname === navItem.to ||
              (navItem.to !== "/" && loc.pathname.startsWith(navItem.to));
            return (
              <Link
                key={navItem.to}
                to={navItem.to}
                reloadDocument={navItem.to === "/" && useFreshHomeRequest}
                data-active={active ? "true" : undefined}
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
              <div className="hito-list-row items-start">
                <div className="relative min-w-0 flex-1 pr-8">
                  <div className="hito-label flex items-center gap-2">
                    <Icon name="plan-note" size="xs" className="text-signal" />
                    Plan note
                  </div>
                  <p className="hito-list-row-copy">
                    {shellSnapshot.source === "persisted"
                      ? "Your saved plan and workout results show up here. Open plan also lets you export JSON or Markdown."
                      : "You can browse the preview here until you sign in and save a plan."}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowShellPlanNote(false)}
                    className="hito-button hito-button-ghost hito-button-xs absolute right-0 top-0 aspect-square shrink-0 p-0 text-muted-foreground hover:text-foreground"
                    aria-label="Dismiss plan note"
                  >
                    <Icon name="close" size="xs" />
                  </button>
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
                    User settings
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
              {shellSnapshot.mode === "authenticated" ? (
                <>
                  {canCreatePlanFromActiveManualPlan ? (
                    <button
                      type="button"
                      onClick={() => setActivePlanCreateOpen(true)}
                      className="hito-button hito-button-primary hito-button-sm hidden md:inline-flex"
                    >
                      <Icon name="sparkles" size="xs" />
                      Create a plan
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={openPlanManagement}
                    className={`hito-button hito-button-secondary hito-button-sm${
                      canCreatePlanFromActiveManualPlan ? " hidden md:inline-flex" : ""
                    }`}
                  >
                    <Icon name="activity" size="xs" />
                    Open plan
                  </button>
                  {canCreatePlanFromActiveManualPlan ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="hito-button hito-button-secondary hito-button-sm md:hidden"
                        >
                          <Icon name="activity" size="xs" />
                          Plan
                          <Icon name="chevron-down" size="xs" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="hito-shell-menu hito-shell-menu-plan"
                      >
                        <DropdownMenuLabel>Plan actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          className="hito-shell-menu-item"
                          onSelect={(event) => {
                            event.preventDefault();
                            setActivePlanCreateOpen(true);
                          }}
                        >
                          <Icon name="sparkles" size="sm" />
                          Create a plan
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="hito-shell-menu-item"
                          onSelect={(event) => {
                            event.preventDefault();
                            openPlanManagement();
                          }}
                        >
                          <Icon name="activity" size="sm" />
                          Open plan
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="hito-shell-menu-separator" />
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
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </>
              ) : (
                <Link
                  to={shellSnapshot.mode === "preview" ? "/login" : "/"}
                  reloadDocument={shellSnapshot.mode !== "preview"}
                  search={
                    shellSnapshot.mode === "preview" && nextPath !== DEFAULT_AUTH_REDIRECT
                      ? { next: nextPath }
                      : undefined
                  }
                  className="hito-button hito-button-secondary hito-button-sm"
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
                  aria-label="Open user settings"
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
            const active = loc.pathname === navItem.to;
            return (
              <Link
                key={navItem.to}
                to={navItem.to}
                reloadDocument={navItem.to === "/" && useFreshHomeRequest}
                data-active={active ? "true" : undefined}
                className="hito-shell-mobile-row"
              >
                <Icon name={navItem.icon} className="hito-shell-nav-icon" />
                {navItem.label}
              </Link>
            );
          })}
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
        onOpenPlan={openPlanManagement}
        snapshot={snapshot}
      />
      <PlanManagementDialog
        open={planManagementOpen}
        onOpenChange={setPlanManagementOpen}
        snapshot={snapshot}
        viewer={viewer}
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
